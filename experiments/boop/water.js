// Water you can spill: a jar pops and the water runs over and round the blocks, slips through
// the cracks between them and pools on the floor. Balls slosh through the pool and throw a bit of
// it around. It's behind ?water=1 while we play with it.
//
// The flow is its own little particle sim (the "double density relaxation" trick from Clavet et
// al. 2005), not Rapier bodies: a couple of hundred drops stay cheap on a phone and stay out of
// saves. Water doesn't push back on balls: every ball in Boop moves at one speed (it's what keeps
// the aiming guide honest), so the water just reacts to them.
//
// Drawing: each drop is a soft dot drawn into a small offscreen picture (how much water is there,
// and how fast it's going), and one quad over the board turns that into a single blob: inked edge,
// a light line along the top, deeper colour further down, a few drifting caustics, and foam
// where it's churned up.
import * as THREE from 'three';
import { W, H, BALL_R } from './sim.js';

globalThis.boopBuilds = [...(globalThis.boopBuilds || []), '1.5-52'];

const R = 0.13;                // how close a drop gets to the walls and floor
const RB = 0.035;              // ...and to blocks: small, so water finds the cracks between them
const SPAN = 0.42;             // how far drops feel each other
const REST = 1.2, STIFF = 1000, NEAR = 2000;   // how tightly they pack, and how hard they push back
const GRAVITY = -26;
const STEPS = 3;               // sub-steps a frame, so fast drops don't tunnel through thin blocks
const MAX_SPEED = 14;
const SLIDE = 7;               // how hard water on top of a block runs off toward the nearer edge
export const MAX_DROPS = 300;

// ---------- the flow ----------

export class WaterSim {
    constructor() {
        this.x = new Float32Array(MAX_DROPS); this.y = new Float32Array(MAX_DROPS);
        this.vx = new Float32Array(MAX_DROPS); this.vy = new Float32Array(MAX_DROPS);
        this.px = new Float32Array(MAX_DROPS); this.py = new Float32Array(MAX_DROPS);
        this.n = 0;
        this.pour = [];
        this.balls = [];
        this.grid = new Map();
    }
    // A jar pops: n drops pour out of a w-wide spot at (x, y) over about half a second.
    spill(x, y, n, w = 0.6) { this.pour.push({ x, y, w, left: n }); }
    emit() {
        for (const p of this.pour) {
            // A few drops a sub-step, and only where there's room: packed tighter than water likes
            // to sit, it would burst outward across the board.
            for (let tries = 0; tries < 4 && p.left > 0 && this.n < MAX_DROPS; tries++) {
                const ex = p.x + (Math.random() - 0.5) * p.w, ey = p.y + (Math.random() - 0.5) * p.w * 0.7;
                let crowded = false;
                for (let j = Math.max(0, this.n - 60); j < this.n && !crowded; j++) crowded = (this.x[j] - ex) ** 2 + (this.y[j] - ey) ** 2 < 0.03;
                if (crowded) continue;
                const i = this.n++;
                p.left--;
                this.x[i] = ex; this.y[i] = ey;
                this.vx[i] = (Math.random() - 0.5) * 1.2; this.vy[i] = -Math.random();
            }
        }
        this.pour = this.pour.filter((p) => p.left > 0 && this.n < MAX_DROPS);
    }
    clear() { this.n = 0; this.pour = []; }
    step(dt, solid) {
        const h = dt / STEPS;
        for (let s = 0; s < STEPS; s++) this.sub(h, solid);
    }
    sub(dt, solid) {
        if (this.pour.length) this.emit();
        const { x, y, vx, vy, px, py, n } = this;
        for (let i = 0; i < n; i++) {
            vy[i] += GRAVITY * dt;
            px[i] = x[i]; py[i] = y[i];
            x[i] += vx[i] * dt; y[i] += vy[i] * dt;
        }
        this.relax(dt);
        this.slosh();
        for (let i = 0; i < n; i++) {
            if (x[i] < R) x[i] = R; else if (x[i] > W - R) x[i] = W - R;
            if (y[i] < -H + R) y[i] = -H + R; else if (y[i] > -R) y[i] = -R;
            const hit = solid(x[i], y[i]);
            if (hit) { x[i] = hit.x; y[i] = hit.y; }
            let nvx = (x[i] - px[i]) / dt, nvy = (y[i] - py[i]) / dt;
            if (hit?.slide) {
                // On top of a block: it runs off toward the nearer edge instead of sitting there
                // (a flat top is never quite flat), but it runs, it doesn't race.
                nvx = (nvx + hit.slide[0] * SLIDE * dt) * 0.985; nvy = (nvy + hit.slide[1] * SLIDE * dt) * 0.985;
            } else if (hit || x[i] === R || x[i] === W - R) {
                nvx *= 0.97; nvy *= 0.97;          // a little drag down the sides of things
            }
            const sp = nvx * nvx + nvy * nvy;
            if (sp > MAX_SPEED * MAX_SPEED) { const k = MAX_SPEED / Math.sqrt(sp); nvx *= k; nvy *= k; }
            vx[i] = nvx; vy[i] = nvy;
        }
    }
    // Balls going through: drops in the way are shoved aside and carried along a bit, so a ball
    // hitting the pool throws up a splash and leaves a wake.
    slosh() {
        const { x, y, vx, vy, n } = this, reach = BALL_R + 0.12;
        for (const b of this.balls) {
            for (let i = 0; i < n; i++) {
                const dx = x[i] - b.x, dy = y[i] - b.y, d2 = dx * dx + dy * dy;
                if (d2 >= reach * reach) continue;
                const d = Math.sqrt(d2) || 1e-4, ux = dx / d, uy = dy / d;
                x[i] = b.x + ux * reach; y[i] = b.y + uy * reach;
                const along = b.vx * ux + b.vy * uy;     // how hard the ball is coming at this drop
                const kick = Math.max(0, along) * 0.45 + 1.5;
                vx[i] = vx[i] * 0.4 + b.vx * 0.3 + ux * kick;
                vy[i] = vy[i] * 0.4 + b.vy * 0.3 + uy * kick + 1.2;
            }
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
        const dt2 = dt * dt, nb = [];
        for (let i = 0; i < n; i++) {
            const cx = Math.floor(x[i] / SPAN), cy = Math.floor(-y[i] / SPAN);
            let rho = 0, near = 0;
            nb.length = 0;
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

// The blocks, for the water: for a drop at (px, py), null if it's clear of them all, or
// { x, y, slide } if it sank into one: push it out to (x, y). `slide` is set on a block's top:
// which way the water runs off it.
export function blockSolid(blocks) {
    return (px, py) => {
        for (const b of blocks) {
            const dx = px - b.x, dy = py - b.y;
            if (dx * dx + dy * dy > b.reach2) continue;
            const c = Math.cos(b.a), s = Math.sin(b.a);
            const lx = (dx * c + dy * s) / b.k, ly = (-dx * s + dy * c) / b.k;    // into the block's own space
            const gx = Math.round(lx - b.ox), gy = Math.round(ly - b.oy);
            const r = RB / b.k;
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
                if (openX && ix < bestD) { bestD = ix; best = [lx + sx * ix, ly, 0]; }
                if (openY && iy < bestD) { bestD = iy; best = [lx, ly + sy * iy, sy]; }
            }
            if (!best) continue;
            const wx = best[0] * b.k, wy = best[1] * b.k;
            const out = { x: b.x + wx * c - wy * s, y: b.y + wx * s + wy * c, slide: null };
            if (best[2] > 0 && c > 0.5) { const d = Math.abs(lx) < 0.05 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(lx); out.slide = [d * c, d * s]; }
            return out;
        }
        return null;
    };
}
// The shape of a sim block, for blockSolid (built once per block, then just moved).
export function blockShape(b) {
    const [ox, oy] = [b.cells[0][0] - Math.round(b.cells[0][0]), b.cells[0][1] - Math.round(b.cells[0][1])];
    const set = new Set(b.cells.map(([cx, cy]) => Math.round(cx - ox) * 64 + Math.round(cy - oy)));
    const reach = Math.max(...b.cells.map(([cx, cy]) => Math.hypot(cx, cy))) + 0.75 + RB;
    return { set, ox, oy, reach2: reach * reach, x: 0, y: 0, a: 0, k: 1 };
}

// ---------- drawing ----------

const PX = 20;                          // offscreen picture: pixels per cell (the dots are soft, so it needn't be sharp)
const DOT = 0.38;                       // a drop's soft dot, radius in cells

const NOISE = `
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }`;

export function makeWater(scene, renderer) {
    const sim = new WaterSim();
    const target = new THREE.WebGLRenderTarget(W * PX, H * PX, { type: THREE.HalfFloatType, depthBuffer: false });
    const cam = new THREE.OrthographicCamera(0, W, 0, -H, -1, 1);
    const speeds = new THREE.InstancedBufferAttribute(new Float32Array(MAX_DROPS), 1);
    const geo = new THREE.PlaneGeometry(DOT * 2, DOT * 2);
    geo.setAttribute('aSpeed', speeds);
    const dots = new THREE.InstancedMesh(
        geo,
        new THREE.ShaderMaterial({
            transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
            uniforms: { uFade: { value: 1 } },
            vertexShader: `attribute float aSpeed; varying vec2 vUv; varying float vSpeed;
                void main(){ vUv = uv * 2.0 - 1.0; vSpeed = aSpeed; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
            // red: how much water; green: how much of it is moving fast (for foam).
            fragmentShader: `uniform float uFade; varying vec2 vUv; varying float vSpeed;
                void main(){ float d = 1.0 - dot(vUv, vUv); if (d <= 0.0) discard; float w = d * d * uFade; gl_FragColor = vec4(w, w * vSpeed, 0.0, 1.0); }`,
        }),
        MAX_DROPS,
    );
    dots.count = 0;
    dots.frustumCulled = false;
    const dotScene = new THREE.Scene();
    dotScene.add(dots);

    const blob = new THREE.Mesh(
        new THREE.PlaneGeometry(W, H),
        new THREE.ShaderMaterial({
            transparent: true, depthTest: false, depthWrite: false,
            uniforms: {
                uMap: { value: target.texture }, uFill: { value: new THREE.Color() }, uDeep: { value: new THREE.Color() },
                uInk: { value: new THREE.Color() }, uFoam: { value: new THREE.Color(0xffffff) },
                uPx: { value: new THREE.Vector2(1 / (W * PX), 1 / (H * PX)) }, uTime: { value: 0 },
            },
            vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
            fragmentShader: `
                uniform sampler2D uMap; uniform vec3 uFill, uDeep, uInk, uFoam; uniform vec2 uPx; uniform float uTime;
                varying vec2 vUv;
                ${NOISE}
                void main(){
                    if (texture2D(uMap, vUv).r < 0.3) discard;     // no water anywhere near: stop here (most of the board)
                    vec2 p = vUv * vec2(${W}.0, ${H}.0);           // board units
                    vec2 wob = (vec2(noise(p * 1.9 + uTime * 0.6), noise(p * 1.9 + 17.0 - uTime * 0.5)) - 0.5) * uPx * 3.0;
                    vec2 uv = vUv + wob;
                    vec4 t = texture2D(uMap, uv);
                    float f = t.r;
                    const float T = 0.55;
                    if (f < T - 0.08) discard;
                    // Depth: how much water is above this spot (a few looks straight up).
                    float depth = 0.0;
                    depth += step(T, texture2D(uMap, uv + vec2(0.0, uPx.y * 6.0)).r);
                    depth += step(T, texture2D(uMap, uv + vec2(0.0, uPx.y * 16.0)).r);
                    depth += step(T, texture2D(uMap, uv + vec2(0.0, uPx.y * 30.0)).r);
                    depth += step(T, texture2D(uMap, uv + vec2(0.0, uPx.y * 48.0)).r);
                    depth *= 0.25;
                    vec3 col = mix(uFill, uDeep, depth * 0.8);
                    // Caustics: two drifting noise fields; where they meet, a faint bright patch. Kept soft,
                    // or it reads as squiggles.
                    float c1 = noise(p * 3.4 + vec2(uTime * 0.3, -uTime * 0.18));
                    float c2 = noise(p * 4.1 - vec2(uTime * 0.22, uTime * 0.27) + 4.0);
                    float caustic = smoothstep(0.88, 1.0, 1.0 - abs(c1 - c2)) * depth;
                    col = mix(col, uFoam, caustic * 0.18);
                    // The surface: a light line along the top where it meets the air, with a slow sheen moving along it.
                    float top = 1.0 - step(T, texture2D(uMap, uv + vec2(0.0, uPx.y * 5.0)).r);
                    float sheen = 0.5 + 0.5 * sin(p.x * 2.2 - uTime * 1.3);
                    col = mix(col, uFoam, top * (0.45 + 0.3 * sheen));
                    // Foam where it's churned up: speckled white where the drops are moving fast.
                    float churn = clamp(t.g / max(f, 0.001), 0.0, 1.0);
                    float foam = smoothstep(0.55, 0.9, churn) * step(0.55, noise(p * 9.0 + uTime * 3.0));
                    col = mix(col, uFoam, foam * 0.6);
                    // Inked edge.
                    float ink = 1.0 - smoothstep(0.0, 0.1, f - T);
                    col = mix(col, uInk, ink * 0.85);
                    gl_FragColor = vec4(col, smoothstep(T - 0.08, T - 0.02, f) * 0.94);
                    #include <colorspace_fragment>
                }`,
        }),
    );
    blob.position.set(W / 2, -H / 2, 0.02);
    blob.renderOrder = 0.5;                 // behind the blocks, so the edge tucks under them
    blob.visible = false;
    blob.frustumCulled = false;
    scene.add(blob);

    const m = new THREE.Matrix4(), clearWas = new THREE.Color();
    let fade = 0, draining = false, drawn = false;
    return {
        sim,
        spill(x, y, n, w) { sim.spill(x, y, n, w); fade = 1; draining = false; },
        // Off it goes: the zone's done. The blob thins out and is gone in about half a second.
        drain() { if (sim.n || sim.pour.length) draining = true; },
        clear() { sim.clear(); draining = false; drawn = false; blob.visible = false; },
        active: () => sim.n > 0 || sim.pour.length > 0,
        moving: () => (sim.n > 0 || sim.pour.length > 0) && (draining || sim.pour.length > 0 || sim.balls.length > 0 || sim.speed() > 0.3),
        setColors(fill, deep, ink) {
            const u = blob.material.uniforms;
            u.uFill.value.setHex(fill); u.uDeep.value.setHex(deep); u.uInk.value.setHex(ink);
        },
        // Where the pool on the floor reaches (for leaves to float on), or null if there isn't one.
        surface() {
            let top = -Infinity, count = 0;
            for (let i = 0; i < sim.n; i++) if (sim.y[i] < -H + 1.6) { top = Math.max(top, sim.y[i]); count++; }
            return count > 12 ? top + R : null;
        },
        // balls: [{ x, y, vx, vy }], the ones on the board right now.
        update(dt, solid, balls = []) {
            if (!sim.n && !sim.pour.length) return;
            sim.balls = balls;
            if (dt > 0) sim.step(Math.min(dt, 1 / 30), solid);
            if (draining) { fade -= dt * 2; if (fade <= 0) { this.clear(); return; } }
            blob.material.uniforms.uTime.value = performance.now() / 1000 % 1000;
            blob.visible = true;
            // All still: the offscreen picture from last time is still right.
            const still = !draining && !sim.pour.length && !balls.length && sim.speed() < 0.05;
            if (still && drawn) return;
            drawn = still;
            for (let i = 0; i < sim.n; i++) {
                m.makeTranslation(sim.x[i], sim.y[i], 0); dots.setMatrixAt(i, m);
                speeds.array[i] = Math.min(1, Math.hypot(sim.vx[i], sim.vy[i]) / 9);
            }
            dots.count = sim.n;
            dots.instanceMatrix.needsUpdate = true;
            speeds.needsUpdate = true;
            dots.material.uniforms.uFade.value = fade;
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

// ---------- the jar ----------

// A glass flask, drawn to sit with the blocks: same thick wobbly ink edge, glass you can just see
// into with a shine like the jelly's, and water inside that sloshes a little. `uSize` is how many
// cells across (1 or 2); the edge stays the same thickness either way.
export function makeJarMaterial() {
    return new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        uniforms: {
            uSize: { value: 1 }, uSeed: { value: 0 }, uTime: { value: 0 },
            uInk: { value: new THREE.Color() }, uGlass: { value: new THREE.Color() }, uWater: { value: new THREE.Color() }, uDeep: { value: new THREE.Color() },
        },
        vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `
            uniform float uSize, uSeed, uTime; uniform vec3 uInk, uGlass, uWater, uDeep;
            varying vec2 vP;
            ${NOISE}
            float sdBox(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
            float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
            void main(){
                vec2 u = vP / uSize;                               // the flask in one-cell units
                float body = length(u - vec2(0.0, -0.08)) - 0.44;
                float neck = sdBox(u - vec2(0.0, 0.31), vec2(0.12, 0.13)) - 0.02;
                float lip = sdBox(u - vec2(0.0, 0.445), vec2(0.2, 0.05)) - 0.02;
                float shape = min(smin(body, neck, 0.1), lip);
                vec2 q = vP + uSeed;
                float wob = (noise(q * 2.6) - 0.5) * 0.06 + (noise(q * 19.0) - 0.5) * 0.03;
                float d = shape * uSize + wob;                     // back in board units, wobbled like a block's edge
                float aa = fwidth(d);
                if (d > aa) discard;
                float edgeW = 0.075 + (noise(q * 31.0) - 0.5) * 0.02;
                float inner = smoothstep(-aa, aa, -(d + edgeW));    // 1 inside the ink
                // Glass, then the water in its belly, its surface tipping a little as it sloshes.
                vec3 col = uGlass;
                float level = -0.06 + u.x * 0.07 * sin(uTime * 1.4 + uSeed) + 0.015 * sin(uTime * 2.3);
                float wet = step(u.y, level) * step(body, -0.02);
                vec3 water = mix(uWater, uDeep, smoothstep(level, -0.5, u.y) * 0.6);
                water = mix(water, uDeep * 0.8, (1.0 - smoothstep(0.0, 0.05, level - u.y)) * 0.7);   // the darker top of the water, seen from just above
                col = mix(col, water, wet);
                // The lip's ridge.
                col = mix(col, uInk, (1.0 - smoothstep(0.0, 0.02, abs(u.y - 0.4))) * step(abs(u.x), 0.2) * 0.8);
                // Glass shine: a streak down the left of the belly and a small glint near the top.
                vec2 n = normalize(u - vec2(0.0, -0.08));
                float facing = max(dot(n, vec2(-0.6, 0.8)), 0.0);
                float streak = smoothstep(-0.13, -0.09, body) * (1.0 - smoothstep(-0.06, -0.03, body)) * pow(facing, 3.0);
                vec2 g = mat2(0.7071, -0.7071, 0.7071, 0.7071) * (u - vec2(-0.2, 0.12));
                float glint = 1.0 - smoothstep(0.7, 1.0, length(g / vec2(0.09, 0.04)));
                col = mix(col, vec3(1.0), clamp(streak * 0.85 + glint * 0.9, 0.0, 1.0));
                col = mix(uInk, col, inner);
                gl_FragColor = vec4(col, 1.0 - smoothstep(-aa, aa, d));
                #include <colorspace_fragment>
            }`,
    });
}
