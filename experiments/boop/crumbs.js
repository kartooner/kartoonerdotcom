// Boop: crayon bits. When a block pops it breaks into a little burst of crayon
// shavings in its own colour, with a few flecks of ink from its outline.
// Purely for show: the bits don't touch the physics.
import * as THREE from 'three';
(globalThis.boopBuilds = globalThis.boopBuilds || []).push('1.2.2-10');   // build stamp: game.js checks every file matches

const MAX = 240;
const GRAVITY = -16;           // cells per second², a touch heavier than the balls feel
const LIFE = 0.75;             // seconds

// A short, slightly uneven crayon stroke: a skewed four-sided shard.
function shardGeometry() {
    const g = new THREE.BufferGeometry();
    const v = new Float32Array([
        -0.16, -0.06, 0, 0.18, -0.09, 0, 0.15, 0.07, 0,
        -0.16, -0.06, 0, 0.15, 0.07, 0, -0.18, 0.055, 0,
    ]);
    g.setAttribute('position', new THREE.BufferAttribute(v, 3));
    return g;
}

export function makeCrumbs(scene) {
    const mesh = new THREE.InstancedMesh(shardGeometry(), new THREE.MeshBasicMaterial({ color: 0xffffff }), MAX);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.renderOrder = 4;
    for (let i = 0; i < MAX; i++) mesh.setColorAt(i, new THREE.Color(0));
    scene.add(mesh);

    const bits = [];
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), scl = new THREE.Vector3();
    const zAxis = new THREE.Vector3(0, 0, 1);

    // cells: the block's cell centres in its own space; x, y, angle: where it was.
    function burst(cells, x, y, angle, scale, fill, ink) {
        const c = Math.cos(angle), s = Math.sin(angle);
        const perCell = Math.max(3, Math.round(18 / cells.length));
        for (const [cx, cy] of cells) {
            const wx = x + (cx * c - cy * s) * scale, wy = y + (cx * s + cy * c) * scale;
            for (let i = 0; i < perCell + 1; i++) {
                if (bits.length >= MAX) bits.shift();
                const dir = Math.random() * Math.PI * 2, speed = 2 + Math.random() * 4;
                bits.push({
                    x: wx + (Math.random() - 0.5) * 0.6 * scale, y: wy + (Math.random() - 0.5) * 0.6 * scale,
                    vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed + 2.5,
                    a: Math.random() * Math.PI, va: (Math.random() - 0.5) * 18,
                    size: 0.8 + Math.random() * 0.7,
                    color: new THREE.Color(i === 0 && Math.random() < 0.6 ? ink : fill),   // the odd fleck of outline ink
                    t: Math.random() * 0.1,
                });
            }
        }
    }

    // A few bits flying from given world points (nails popping out of a block).
    function spray(points, colors) {
        for (const [x, y] of points) {
            for (let i = 0; i < 3; i++) {
                if (bits.length >= MAX) bits.shift();
                const dir = Math.PI * (0.15 + 0.7 * Math.random()), speed = 3 + Math.random() * 3;
                bits.push({
                    x, y, vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed,
                    a: Math.random() * Math.PI, va: (Math.random() - 0.5) * 24,
                    size: 0.45 + Math.random() * 0.3,
                    color: new THREE.Color(colors[i % colors.length]), t: 0,
                });
            }
        }
    }

    function update(dt, yOffset = 0) {
        for (let i = bits.length - 1; i >= 0; i--) {
            const b = bits[i];
            b.t += dt;
            if (b.t >= LIFE) { bits.splice(i, 1); continue; }
            b.vy += GRAVITY * dt;
            b.vx *= 1 - dt * 1.5;
            b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
        }
        bits.forEach((b, i) => {
            const k = b.size * (1 - (b.t / LIFE) ** 2);    // shrink away rather than fade
            pos.set(b.x, b.y + yOffset, 0.6);
            q.setFromAxisAngle(zAxis, b.a);
            scl.set(k, k, 1);
            m.compose(pos, q, scl);
            mesh.setMatrixAt(i, m);
            mesh.setColorAt(i, b.color);
        });
        mesh.count = bits.length;
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    function clear() { bits.length = 0; mesh.count = 0; }

    return { burst, spray, update, clear, active: () => bits.length > 0 };
}
