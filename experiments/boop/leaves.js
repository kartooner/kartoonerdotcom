// Boop: fall leaf piles (a season extra, see season.js). A few blocks start each zone with a
// little pile of leaves on top. Hit, knock or pop the block and they flutter off, drift down
// and gather in a heap on the floor. Purely for show: they never touch the physics.
import * as THREE from 'three';
(globalThis.boopBuilds = globalThis.boopBuilds || []).push('1.3.0-3');   // build stamp: game.js checks every file matches

const MAX = 180;                 // leaves on screen at once (piles, falling and on the floor)
const FLOOR_MAX = 90;            // the floor heap keeps the newest this many
const PILE_SHARE = 0.35, PILES_MAX = 6;
const TIP = 0.35;                // a block tipped this far (radians) sheds its pile

function leafGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
        -0.2, 0, 0, 0, -0.1, 0, 0.2, 0, 0,
        -0.2, 0, 0, 0.2, 0, 0, 0, 0.1, 0,
    ]), 3));
    return g;
}

export function makeLeafPiles(scene, colors, floorY) {
    const mesh = new THREE.InstancedMesh(leafGeometry(), new THREE.MeshBasicMaterial({ color: 0xffffff }), MAX);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.renderOrder = 4;
    for (let i = 0; i < MAX; i++) mesh.setColorAt(i, new THREE.Color(0));
    scene.add(mesh);

    let piles = new Map();     // block id → { leaves: [{ lx, ly, a, size, color, wx, wy }], a0 }
    let falling = [], floor = [];
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), scl = new THREE.Vector3();
    const zAxis = new THREE.Vector3(0, 0, 1);
    const pick = () => new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);

    // A new zone: drop a few piles on the tops of some blocks (in each block's own space).
    function seed(blocks) {
        piles = new Map();
        const all = Object.values(blocks);
        // Where each block's cells are in the field (from where it was placed).
        const cellsOf = (b) => b.cells.map(([x, y]) => [b.anchor[0] + x, b.anchor[1] + y]);
        const taken = all.map((b) => ({ id: b.id, cells: cellsOf(b) }));
        const roomAbove = (b, [x, y]) => {
            const wx = b.anchor[0] + x, wy = b.anchor[1] + y + 1;
            return !taken.some((o) => o.cells.some(([ox, oy]) => Math.abs(ox - wx) < 0.6 && Math.abs(oy - wy) < 0.6));
        };
        const list = all.filter((b) => !b.jello && !b.bomb && !b.seesaw && !b.hung);
        for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
        const n = Math.min(PILES_MAX, Math.round(list.length * PILE_SHARE));
        for (const b of list.slice(0, n)) {
            // A top cell: one with nothing above it in the block.
            const tops = b.cells.filter((c) => roomAbove(b, c));
            if (!tops.length) continue;
            const [cx, cy] = tops[Math.floor(Math.random() * tops.length)];
            const leaves = [];
            // A little heap, two layers: a wide bottom row and a few on top, higher in the middle.
            for (const [count, lift, width] of [[5 + Math.floor(Math.random() * 2), 0.04, 0.8], [3, 0.13, 0.45]]) {
                for (let k = 0; k < count; k++) {
                    const t = (k + 0.5) / count;
                    leaves.push({ lx: cx - width / 2 + t * width + (Math.random() - 0.5) * 0.08, ly: cy + 0.5 + lift + Math.sin(t * Math.PI) * 0.06 + Math.random() * 0.03,
                        a: (Math.random() - 0.5) * 1.1, size: 0.85 + Math.random() * 0.35, color: pick(), wx: 0, wy: 0 });
                }
            }
            piles.set(b.id, { leaves, a0: null });
        }
    }

    // A block was hit or knocked: its pile flutters off.
    function knock(id) {
        const pile = piles.get(id);
        if (!pile) return;
        piles.delete(id);
        for (const l of pile.leaves) {
            if (falling.length + floor.length >= MAX) break;
            falling.push({ x: l.wx, y: l.wy, vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random() * 2, a: l.a, va: (Math.random() - 0.5) * 5,
                size: l.size, color: l.color, sway: Math.random() * 6, t: 0 });
        }
    }

    // views: block id → its drawing (a group placed where the block is).
    function update(dt, views) {
        for (const [id, pile] of piles) {
            const v = views.get(id);
            if (!v) { knock(id); continue; }
            const g = v.group, c = Math.cos(g.rotation.z), s = Math.sin(g.rotation.z), k = g.scale.x;
            if (pile.a0 == null) pile.a0 = g.rotation.z;
            for (const l of pile.leaves) {
                l.wx = g.position.x + (l.lx * c - l.ly * s) * k;
                l.wy = g.position.y + (l.lx * s + l.ly * c) * k;
            }
            if (Math.abs(g.rotation.z - pile.a0) > TIP) knock(id);    // tipping over: it slides off
        }
        for (let i = falling.length - 1; i >= 0; i--) {
            const f = falling[i];
            f.t += dt;
            f.vy = Math.max(-2, f.vy - 5 * dt);
            f.vx += Math.sin(f.t * 4 + f.sway) * 5 * dt;
            f.vx *= 1 - dt * 1.2;
            f.x += f.vx * dt; f.y += f.vy * dt; f.a += f.va * dt;
            f.x = Math.max(0.1, Math.min(8.9, f.x));
            // Land on the heap: a little higher where more leaves have gathered.
            const near = floor.filter((l) => Math.abs(l.x - f.x) < 0.3).length;
            const rest = floorY + 0.07 + Math.min(0.6, near * 0.04);
            if (f.y <= rest) {
                falling.splice(i, 1);
                floor.push({ x: f.x, y: rest, a: (Math.random() - 0.5) * 0.6, size: f.size, color: f.color });
                if (floor.length > FLOOR_MAX) floor.shift();
            }
        }
        let n = 0;
        const put = (x, y, a, size, color) => {
            if (n >= MAX) return;
            pos.set(x, y, 0.55); q.setFromAxisAngle(zAxis, a); scl.set(size, size, 1);
            m.compose(pos, q, scl);
            mesh.setMatrixAt(n, m); mesh.setColorAt(n, color); n++;
        };
        for (const pile of piles.values()) for (const l of pile.leaves) put(l.wx, l.wy, l.a, l.size, l.color);
        for (const f of falling) put(f.x, f.y, f.a, f.size, f.color);
        for (const l of floor) put(l.x, l.y, l.a, l.size, l.color);
        mesh.count = n;
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    function clear() { piles = new Map(); falling = []; floor = []; mesh.count = 0; }

    return { seed, knock, update, clear, active: () => falling.length > 0 };
}
