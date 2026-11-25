// Boop: fall leaf piles (a season extra, see season.js). A few blocks start each zone with a
// little pile of leaves on top. Hit, knock or pop the block and they flutter off, drift down
// and gather in a heap on the floor. A ball skimming the heap, or a bomb going off near it,
// kicks some back up; they flutter and settle again. Purely for show: they never touch the
// physics (as bodies they'd slow the aim guide and deflect balls), and they don't stir on
// their own, so a still board can still rest at a low frame rate.
import * as THREE from 'three';
import { seasonGeometry } from './crumbs.js';
(globalThis.boopBuilds = globalThis.boopBuilds || []).push('1.5-11');   // build stamp: game.js checks every file matches

const MAX = 180;                 // leaves on screen at once (piles, falling and on the floor)
const FLOOR_MAX = 90;            // the floor heap keeps the newest this many
// season.pile (optional) changes the heap: { colors, size (scale), density (count) }. Snow uses
// finer, more numerous flakes; the limits grow with the density so the floor bank keeps its size.
const PILE_EVERY = 3;            // one pile every third zone (1, 4, 7...): a treat, not clutter
const TIP = 0.35;                // a block tipped this far (radians) sheds its pile
// Reduce Motion: leaves and snow drop gently, without the swaying and spinning.
const calm = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');

// season: { crumbs: colours, shape }. In winter the "leaves" are snow: a snowy cap on a block
// that puffs off when it's hit and drifts into a little bank on the floor.
export function makeLeafPiles(scene, season, floorY) {
    const colors = season.pile?.colors ?? season.crumbs;
    const SIZE = season.pile?.size ?? 1, DENSITY = season.pile?.density ?? 1;
    const max = Math.round(MAX * DENSITY), floorMax = Math.round(FLOOR_MAX * DENSITY);
    const mesh = new THREE.InstancedMesh(seasonGeometry(season), new THREE.MeshBasicMaterial({ color: 0xffffff }), max);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.renderOrder = 4;
    for (let i = 0; i < max; i++) mesh.setColorAt(i, new THREE.Color(0));
    scene.add(mesh);

    let piles = new Map();     // block id → { leaves: [{ lx, ly, a, size, color, wx, wy }], a0 }
    let falling = [], floor = [];
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), scl = new THREE.Vector3();
    const zAxis = new THREE.Vector3(0, 0, 1);
    const pick = () => new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);

    // A new zone: drop a few piles on the tops of some blocks (in each block's own space).
    function seed(blocks, depth) {
        piles = new Map();
        if ((depth - 1) % PILE_EVERY !== 0) return;
        const all = Object.values(blocks);
        // Where each block's cells are in the field (from where it was placed).
        const cellsOf = (b) => b.cells.map(([x, y]) => [b.anchor[0] + x, b.anchor[1] + y]);
        const taken = all.map((b) => ({ id: b.id, cells: cellsOf(b) }));
        const roomAbove = (b, [x, y]) => {
            const wx = b.anchor[0] + x, wy = b.anchor[1] + y + 1;
            return !taken.some((o) => o.cells.some(([ox, oy]) => Math.abs(ox - wx) < 0.6 && Math.abs(oy - wy) < 0.6));
        };
        const list = all.filter((b) => !b.jello && !b.bomb && !b.seesaw && !b.hung);
        // The block with the widest open top (two cells side by side if it can), so the pile reads.
        let best = null;
        for (const b of list) {
            const tops = b.cells.filter((c) => roomAbove(b, c));
            for (const c of tops) {
                const pair = tops.find(([x, y]) => Math.abs(x - (c[0] + 1)) < 0.01 && Math.abs(y - c[1]) < 0.01);
                const score = (pair ? 2 : 1) + Math.random() * 0.5 + (b.anchor[1] > -9 ? 0.3 : 0);   // a bit higher up reads better
                if (!best || score > best.score) best = { b, x: pair ? c[0] + 0.5 : c[0], y: c[1], w: pair ? 1.7 : 0.9, score };
            }
        }
        if (!best) return;
        // A full heap: three layers, wide at the bottom and rounded on top.
        const leaves = [];
        for (const [count, lift, width] of [[Math.round(best.w * 9 * DENSITY), 0.05, best.w], [Math.round(best.w * 6 * DENSITY), 0.17, best.w * 0.7], [Math.round(best.w * 3 * DENSITY), 0.28, best.w * 0.38]]) {
            for (let k = 0; k < count; k++) {
                const t = (k + 0.5) / count;
                leaves.push({ lx: best.x - width / 2 + t * width + (Math.random() - 0.5) * 0.1, ly: best.y + 0.5 + lift + Math.sin(t * Math.PI) * 0.05 + Math.random() * (SIZE < 1 ? 0.12 : 0.04),   // fine snow fills in between the layers
                    a: (Math.random() - 0.5) * 1.4, size: (1.0 + Math.random() * 0.45) * SIZE, color: pick(), wx: 0, wy: 0 });
            }
        }
        piles.set(best.b.id, { leaves, a0: null });
    }

    // A block was hit or knocked: its pile flutters off.
    function knock(id) {
        const pile = piles.get(id);
        if (!pile) return;
        piles.delete(id);
        for (const l of pile.leaves) {
            if (falling.length + floor.length >= max) break;
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
            if (!calm?.matches) f.vx += Math.sin(f.t * 4 + f.sway) * 5 * dt;
            f.vx *= 1 - dt * 1.2;
            f.x += f.vx * dt; f.y += f.vy * dt; if (!calm?.matches) f.a += f.va * dt;
            f.x = Math.max(0.1, Math.min(8.9, f.x));
            // Land on the heap: a little higher where more leaves have gathered.
            const near = floor.filter((l) => Math.abs(l.x - f.x) < 0.3).length;
            const rest = floorY + 0.07 * SIZE + Math.min(0.6, near * 0.04 / DENSITY);
            if (f.y <= rest) {
                falling.splice(i, 1);
                floor.push({ x: f.x, y: rest, a: (Math.random() - 0.5) * 0.6, size: f.size, color: f.color });
                if (floor.length > floorMax) floor.shift();
            }
        }
        let n = 0;
        const put = (x, y, a, size, color) => {
            if (n >= max) return;
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

    // Kick floor leaves within reach of (x, y) back into the air. (vx, vy): what's pushing them.
    const KICK_REACH = 0.45, KICK_MAX = 4;
    function kick(x, y, reach, vx, vy, power) {
        if (y > floorY + reach + 0.7) return;           // nowhere near the floor
        for (let i = floor.length - 1; i >= 0; i--) {
            const l = floor[i], dx = l.x - x, dy = l.y - y, d = Math.hypot(dx, dy);
            if (d > reach) continue;
            const away = (dx >= 0 ? 1 : -1) * (1 - d / reach);
            floor.splice(i, 1);
            falling.push({ x: l.x, y: l.y + 0.02, vx: vx * 0.2 + away * 1.6 * power + (Math.random() - 0.5) * 0.8,
                vy: Math.min(KICK_MAX, (1.2 + Math.random() * 1.6) * power + Math.max(0, vy) * 0.15), a: l.a,
                va: (Math.random() - 0.5) * 6, size: l.size, color: l.color, sway: Math.random() * 6, t: 0 });
        }
    }
    // balls: [{ x, y, vx, vy }] each frame; a fast ball kicks harder.
    function stir(balls) {
        if (!floor.length) return;
        for (const b of balls) kick(b.x, b.y, KICK_REACH, b.vx, b.vy, Math.min(1.4, 0.5 + Math.hypot(b.vx, b.vy) / 25));
    }
    function blast(x, y, r) { kick(x, y, r * 1.3, 0, 3, 1.6); }

    function clear() { piles = new Map(); falling = []; floor = []; mesh.count = 0; }

    return { seed, knock, update, stir, blast, clear, active: () => falling.length > 0 };
}
