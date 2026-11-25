// Water you can spill: a jar pops and the water runs down round the blocks and pools on the
// floor. It's only for looks for now (balls and blocks don't feel it), and it's behind ?water=1
// while we play with it.
//
// The flow is its own little particle sim (the "double density relaxation" trick from Clavet et
// al. 2005), not Rapier bodies: a hundred-odd drops stay cheap on a phone and stay out of saves.
// Drawing: each drop is a soft dot drawn into a small offscreen picture, and one quad over the
// board turns that into a single blob with an inked, slightly wobbly edge.
import * as THREE from 'three';
import { W, H } from './sim.js';

globalThis.boopBuilds = [...(globalThis.boopBuilds || []), '1.5-49'];

const R = 0.13;                // how close a drop gets to a wall or block
const SPAN = 0.42;             // how far drops feel each other
const REST = 1.2, STIFF = 1000, NEAR = 2000;   // how tightly they pack, and how hard they push back
const GRAVITY = -26;
const STEPS = 3;               // sub-steps a frame, so fast drops don't tunnel through thin blocks
export const MAX_DROPS = 360;

// ---------- the flow ----------

export class WaterSim {
    constructor() {
        this.x = new Float32Array(MAX_DROPS); this.y = new Float32Array(MAX_DROPS);
        this.vx = new Float32Array(MAX_DROPS); this.vy = new Float32Array(MAX_DROPS);
        this.px = new Float32Array(MAX_DROPS); this.py = new Float32Array(MAX_DROPS);
        this.n = 0;
        this.pour = [];
        this.grid = new Map();
    }
    // A jar pops: n drops pour out of (x, y) over about half a second, a few each sub-step.
    // (All at once, packed in a jar-sized clump, they'd push apart hard enough to spray the board.)
    spill(x, y, n) { this.pour.push({ x, y, left: n }); }
    emit() {
        for (const p of this.pour) {
            for (let k = 0; k < 3 && p.left > 0 && this.n < MAX_DROPS; k++, p.left--) {
                const i = this.n++;
                this.x[i] = p.x + (Math.random() - 0.5) * 0.5; this.y[i] = p.y + (Math.random() - 0.5) * 0.3;
                this.vx[i] = (Math.random() - 0.5) * 3; this.vy[i] = Math.random() * 1.5 - 0.5;
            }
        }
        this.pour = this.pour.filter((p) => p.left > 0 && this.n < MAX_DROPS);
    }
    clear() { this.n = 0; this.pour = []; }
    // solid(x, y) → null, or the [x, y] to push a drop out to.
    step(dt, solid) {
        const h = dt / STEPS;
        for (let s = 0; s < STEPS; s++) this.sub(h, solid);
    }
    sub(dt, solid) {
        if (this.pour.length) this.emit();
        const { x, y, vx, vy, px, py, n } = this;
        for (let i = 0; i < n; i++) {
            vy[i] += GRAVITY * dt;
            vx[i] *= 0.999;
            px[i] = x[i]; py[i] = y[i];
            x[i] += vx[i] * dt; y[i] += vy[i] * dt;
        }
        this.relax(dt);
        for (let i = 0; i < n; i++) {
            // Walls and floor (the ceiling too, in case a burst flings drops up there).
            if (x[i] < R) x[i] = R; else if (x[i] > W - R) x[i] = W - R;
            if (y[i] < -H + R) y[i] = -H + R; else if (y[i] > -R) y[i] = -R;
            const out = solid(x[i], y[i]);
            if (out) { x[i] = out[0]; y[i] = out[1]; }
            const nvx = (x[i] - px[i]) / dt, nvy = (y[i] - py[i]) / dt;
            // A little drag where it was pushed (against walls and blocks), so it slides, not skates.
            const pushed = out || x[i] === R || x[i] === W - R || y[i] === -H + R;
            vx[i] = pushed ? nvx * 0.96 : nvx; vy[i] = nvy;
        }
    }
    relax(dt) {
        const { x, y, n, grid } = this;
        grid.clear();
        for (let i = 0; i < n; i++) {
            const key = Math.floor(x[i] / SPAN) * 1024 + Math.floor(-y[i] / SPAN);
            let cell = grid.get(key);
            if (!cell) grid.set(key, (cell = []));
            cell.push(i);
        }
        const dt2 = dt * dt;
        for (let i = 0; i < n; i++) {
            const cx = Math.floor(x[i] / SPAN), cy = Math.floor(-y[i] / SPAN);
            let rho = 0, near = 0;
            const nb = [];
            for (let gx = cx - 1; gx <= cx + 1; gx++) for (let gy = cy - 1; gy <= cy + 1; gy++) {
                const cell = grid.get(gx * 1024 + gy);
                if (!cell) continue;
                for (const j of cell) {
                    if (j === i) continue;
                    const dx = x[j] - x[i], dy = y[j] - y[i], r2 = dx * dx + dy * dy;
                    if (r2 >= SPAN * SPAN || r2 < 1e-12) continue;
                    const r = Math.sqrt(r2), q = 1 - r / SPAN;
                    rho += q * q; near += q * q * q;
                    nb.push(j, dx / r, dy / r, q);
                }
            }
            const P = STIFF * (rho - REST), Pn = NEAR * near;
            let ax = 0, ay = 0;
            for (let k = 0; k < nb.length; k += 4) {
                const j = nb[k], q = nb[k + 3];
                const D = dt2 * (P * q + Pn * q * q) * 0.5;
                const dx = D * nb[k + 1], dy = D * nb[k + 2];
                x[j] += dx; y[j] += dy;
                ax -= dx; ay -= dy;
            }
            x[i] += ax; y[i] += ay;
        }
    }
    // How fast the fastest drop is going (to know when it's all settled).
    speed() {
        let m = 0;
        for (let i = 0; i < this.n; i++) m = Math.max(m, this.vx[i] * this.vx[i] + this.vy[i] * this.vy[i]);
        return Math.sqrt(m);
    }
}

// A block, for the water: its cells in its own space, and where it is now. Drops are pushed
// out of the nearest open side of whatever cell they've sunk into.
export function blockSolid(blocks) {
    return (px, py) => {
        for (const b of blocks) {
            const dx = px - b.x, dy = py - b.y;
            if (dx * dx + dy * dy > b.reach2) continue;
            const c = Math.cos(b.a), s = Math.sin(b.a);
            const lx = (dx * c + dy * s) / b.k, ly = (-dx * s + dy * c) / b.k;    // into the block's own space
            const gx = Math.round(lx - b.ox), gy = Math.round(ly - b.oy);
            if (!b.set.has(gx * 64 + gy)) {
                // Not inside a cell, but maybe within a drop's reach of one: check the neighbours.
                let hit = false;
                for (let ex = -1; ex <= 1 && !hit; ex++) for (let ey = -1; ey <= 1 && !hit; ey++) if (b.set.has((gx + ex) * 64 + gy + ey)) hit = true;
                if (!hit) continue;
            }
            // Distance to each open side of the cells around, and the shortest way out.
            const r = R / b.k;
            let best = null, bestD = Infinity;
            for (let ex = -1; ex <= 1; ex++) for (let ey = -1; ey <= 1; ey++) {
                const cx = gx + ex, cy = gy + ey;
                if (!b.set.has(cx * 64 + cy)) continue;
                const ccx = cx + b.ox, ccy = cy + b.oy;
                const ix = 0.5 + r - Math.abs(lx - ccx), iy = 0.5 + r - Math.abs(ly - ccy);
                if (ix <= 0 || iy <= 0) continue;          // not touching this cell
                // Push along x or y, whichever is shorter, unless a neighbour cell is that way.
                const sx = lx >= ccx ? 1 : -1, sy = ly >= ccy ? 1 : -1;
                const openX = !b.set.has((cx + sx) * 64 + cy), openY = !b.set.has(cx * 64 + cy + sy);
                if (openX && ix < bestD) { bestD = ix; best = [lx + sx * ix, ly]; }
                if (openY && iy < bestD) { bestD = iy; best = [lx, ly + sy * iy]; }
            }
            if (!best) continue;
            const wx = best[0] * b.k, wy = best[1] * b.k;
            return [b.x + wx * c - wy * s, b.y + wx * s + wy * c];
        }
        return null;
    };
}
// The shape of a sim block, for blockSolid (built once per block, then just moved).
export function blockShape(b) {
    const [ox, oy] = [b.cells[0][0] - Math.round(b.cells[0][0]), b.cells[0][1] - Math.round(b.cells[0][1])];
    const set = new Set(b.cells.map(([cx, cy]) => Math.round(cx - ox) * 64 + Math.round(cy - oy)));
    const reach = Math.max(...b.cells.map(([cx, cy]) => Math.hypot(cx, cy))) + 0.75 + R;
    return { set, ox, oy, reach2: reach * reach, x: 0, y: 0, a: 0, k: 1 };
}

// ---------- drawing ----------

const PX = 32;                          // offscreen picture: pixels per cell
const DOT = 0.38;                       // a drop's soft dot, radius in cells

export function makeWater(scene, renderer) {
    const sim = new WaterSim();
    const target = new THREE.WebGLRenderTarget(W * PX, H * PX, { type: THREE.HalfFloatType, depthBuffer: false });
    const cam = new THREE.OrthographicCamera(0, W, 0, -H, -1, 1);
    const dots = new THREE.InstancedMesh(
        new THREE.PlaneGeometry(DOT * 2, DOT * 2),
        new THREE.ShaderMaterial({
            transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
            uniforms: { uFade: { value: 1 } },
            vertexShader: 'varying vec2 vUv; void main(){ vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
            fragmentShader: 'uniform float uFade; varying vec2 vUv; void main(){ float d = 1.0 - dot(vUv, vUv); if (d <= 0.0) discard; gl_FragColor = vec4(vec3(d * d * uFade), 1.0); }',
        }),
        MAX_DROPS,
    );
    dots.count = 0;
    dots.frustumCulled = false;
    const dotScene = new THREE.Scene();
    dotScene.add(dots);

    // The blob: filled where the dots add up past a threshold, inked round the edge, with a
    // lighter line along the top where it meets the air. A little noise wobbles the edge so it
    // looks drawn.
    const blob = new THREE.Mesh(
        new THREE.PlaneGeometry(W, H),
        new THREE.ShaderMaterial({
            transparent: true, depthTest: false, depthWrite: false,
            uniforms: {
                uMap: { value: target.texture }, uFill: { value: new THREE.Color(0x9ccfe4) }, uInk: { value: new THREE.Color(0x2b2622) },
                uFoam: { value: new THREE.Color(0xffffff) }, uPx: { value: new THREE.Vector2(1 / (W * PX), 1 / (H * PX)) }, uTime: { value: 0 },
            },
            vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
            fragmentShader: `
                uniform sampler2D uMap; uniform vec3 uFill, uInk, uFoam; uniform vec2 uPx; uniform float uTime;
                varying vec2 vUv;
                float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
                float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
                    return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
                void main(){
                    vec2 wob = (vec2(noise(vUv * 60.0 + uTime * 0.6), noise(vUv * 60.0 + 17.0 - uTime * 0.5)) - 0.5) * uPx * 3.0;
                    float f = texture2D(uMap, vUv + wob).r;
                    const float T = 0.55;
                    if (f < T - 0.08) discard;
                    float above = texture2D(uMap, vUv + wob + vec2(0.0, uPx.y * 7.0)).r;
                    vec3 col = uFill;
                    col = mix(col, uFoam, smoothstep(T + 0.05, T - 0.1, above) * 0.55);   // the top line
                    float ink = 1.0 - smoothstep(0.0, 0.1, f - T);                       // the edge
                    col = mix(col, uInk, ink * 0.85);
                    gl_FragColor = vec4(col, smoothstep(T - 0.08, T - 0.02, f) * 0.92);
                }`,
        }),
    );
    blob.position.set(W / 2, -H / 2, 0.02);
    blob.renderOrder = 0.5;                 // behind the blocks, so the edge tucks under them
    blob.visible = false;
    blob.frustumCulled = false;
    scene.add(blob);

    const m = new THREE.Matrix4(), clearWas = new THREE.Color();
    let fade = 0, draining = false;
    return {
        sim,
        spill(x, y, n) { sim.spill(x, y, n); fade = 1; draining = false; },
        // Off it goes: the zone's done. The blob thins out and is gone in about half a second.
        drain() { if (sim.n) draining = true; },
        clear() { sim.clear(); draining = false; blob.visible = false; },
        active: () => sim.n > 0 || sim.pour.length > 0,
        moving: () => (sim.n > 0 || sim.pour.length > 0) && (draining || sim.pour.length > 0 || sim.speed() > 0.3),
        setColors(fill, ink) { blob.material.uniforms.uFill.value.setHex(fill); blob.material.uniforms.uInk.value.setHex(ink); },
        // Where the pool on the floor reaches (for leaves to float on), or null if there isn't one.
        surface() {
            let top = -Infinity, count = 0;
            for (let i = 0; i < sim.n; i++) if (sim.y[i] < -H + 1.6) { top = Math.max(top, sim.y[i]); count++; }
            return count > 12 ? top + R : null;
        },
        update(dt, solid) {
            if (!sim.n && !sim.pour.length) return;
            if (dt > 0) sim.step(Math.min(dt, 1 / 30), solid);
            if (draining) { fade -= dt * 2; if (fade <= 0) { this.clear(); return; } }
            for (let i = 0; i < sim.n; i++) { m.makeTranslation(sim.x[i], sim.y[i], 0); dots.setMatrixAt(i, m); }
            dots.count = sim.n;
            dots.instanceMatrix.needsUpdate = true;
            dots.material.uniforms.uFade.value = fade;
            blob.material.uniforms.uTime.value = performance.now() / 1000 % 1000;
            blob.visible = true;
            const was = renderer.getRenderTarget(), alphaWas = renderer.getClearAlpha();
            renderer.getClearColor(clearWas);
            renderer.setRenderTarget(target);
            renderer.setClearColor(0x000000, 0);
            renderer.clear();
            renderer.render(dotScene, cam);
            renderer.setRenderTarget(was);
            renderer.setClearColor(clearWas, alphaWas);
        },
    };
}
