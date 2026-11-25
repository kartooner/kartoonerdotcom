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

globalThis.boopBuilds = [...(globalThis.boopBuilds || []), '1.5-59'];

const R = 0.13;                // how close a drop gets to the walls and floor
const RB = 0.035;              // ...and to blocks: small, so water finds the cracks between them
const SPAN = 0.42;             // how far drops feel each other
const REST = 1.2, STIFF = 1000, NEAR = 2000;   // how tightly they pack, and how hard they push back
const GRAVITY = -26;
const STEP = 1 / 150;          // longest sub-step: the packing goes unstable with longer ones, and fast drops tunnel through thin blocks
const MAX_SPEED = 14;
const SLIDE = 7;               // how hard water on top of a block runs off toward the nearer edge
export const MAX_DROPS = 300;

// ---------- the flow ----------

export class WaterSim {
    constructor() {
        this.x = new Float32Array(MAX_DROPS); this.y = new Float32Array(MAX_DROPS);
        this.vx = new Float32Array(MAX_DROPS); this.vy = new Float32Array(MAX_DROPS);
        this.size = new Float32Array(MAX_DROPS).fill(1);   // how big each drop is drawn (splash droplets are small)
        this.px = new Float32Array(MAX_DROPS); this.py = new Float32Array(MAX_DROPS);
        this.n = 0;
        this.pour = [];
        this.balls = [];
        this.surface = null;        // a still pool's surface height at x, when there is one
        // Neighbour lookup: drops sorted into grid cells each step (flat arrays, nothing allocated).
        this.gw = Math.ceil(W / SPAN) + 2; this.gh = Math.ceil(H / SPAN) + 2;
        this.cellStart = new Int32Array(this.gw * this.gh + 1);
        this.cellOf = new Int32Array(MAX_DROPS);
        this.order = new Int32Array(MAX_DROPS);
        this.nb = new Float32Array(MAX_DROPS * 4);
        this.calm = 0;              // frames in a row it's been still; a still pool skips its physics
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
                this.x[i] = ex; this.y[i] = ey; this.size[i] = 1;
                this.vx[i] = (Math.random() - 0.5) * 1.2; this.vy[i] = -Math.random();
            }
        }
        this.pour = this.pour.filter((p) => p.left > 0 && this.n < MAX_DROPS);
    }
    clear() { this.n = 0; this.pour = []; }
    step(dt, solid) {
        const steps = Math.ceil(dt / STEP), h = dt / steps;
        for (let s = 0; s < steps; s++) this.sub(h, solid);
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
            if (hit && (hit.vx || hit.vy)) { nvx = nvx * 0.4 + hit.vx * 1.1; nvy = nvy * 0.4 + hit.vy * 1.1; }   // a moving block shoves the water along
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
        // Drops that fall back into a still pool become part of it.
        if (this.surface) {
            for (let i = this.n - 1; i >= 0; i--) {
                if (vy[i] > 0 || y[i] > this.surface(x[i]) - 0.08) continue;
                const last = --this.n;
                x[i] = x[last]; y[i] = y[last]; vx[i] = vx[last]; vy[i] = vy[last]; this.size[i] = this.size[last];
            }
        }
    }
    // Balls going through: drops in the way are shoved aside and carried along a bit, so a ball
    // hitting the pool throws up a splash and leaves a wake.
    slosh() {
        const { x, y, vx, vy, n } = this;
        for (const b of this.balls) {
            // A ball bobbing in the water just sits in it; a fast one clears a wider path.
            const reach = BALL_R + (b.vx * b.vx + b.vy * b.vy > 9 ? 0.12 : 0.03);
            for (let i = 0; i < n; i++) {
                const dx = x[i] - b.x, dy = y[i] - b.y, d2 = dx * dx + dy * dy;
                if (d2 >= reach * reach) continue;
                const d = Math.sqrt(d2) || 1e-4, ux = dx / d, uy = dy / d;
                x[i] = b.x + ux * reach; y[i] = b.y + uy * reach;
                const along = b.vx * ux + b.vy * uy;     // how hard the ball is coming at this drop
                const kick = Math.min(6, Math.max(0, along) * 0.3 + 1.2);
                vx[i] = vx[i] * 0.4 + b.vx * 0.3 + ux * kick;
                vy[i] = vy[i] * 0.4 + b.vy * 0.2 + uy * kick + 0.8;
            }
        }
    }
    relax(dt) {
        const { x, y, n, gw, gh, cellStart, cellOf, order, nb } = this;
        // Counting sort into grid cells.
        cellStart.fill(0);
        for (let i = 0; i < n; i++) {
            const gx = Math.min(gw - 1, Math.max(0, Math.floor(x[i] / SPAN) + 1));
            const gy = Math.min(gh - 1, Math.max(0, Math.floor(-y[i] / SPAN) + 1));
            const c = gy * gw + gx;
            cellOf[i] = c; cellStart[c + 1]++;
        }
        for (let c = 0; c < gw * gh; c++) cellStart[c + 1] += cellStart[c];
        const fill = cellStart.slice(0, gw * gh);
        for (let i = 0; i < n; i++) order[fill[cellOf[i]]++] = i;
        const dt2 = dt * dt, S2 = SPAN * SPAN;
        for (let i = 0; i < n; i++) {
            const c = cellOf[i], cx = c % gw, cy = (c - cx) / gw;
            let rho = 0, near = 0, m = 0;
            for (let gy = Math.max(0, cy - 1); gy <= Math.min(gh - 1, cy + 1); gy++) {
                for (let gx = Math.max(0, cx - 1); gx <= Math.min(gw - 1, cx + 1); gx++) {
                    const cc = gy * gw + gx;
                    for (let k = cellStart[cc]; k < cellStart[cc + 1]; k++) {
                        const j = order[k];
                        if (j === i) continue;
                        const dx = x[j] - x[i], dy = y[j] - y[i], r2 = dx * dx + dy * dy;
                        if (r2 >= S2 || r2 < 1e-12) continue;
                        const r = Math.sqrt(r2), q = 1 - r / SPAN;
                        rho += q * q; near += q * q * q;
                        if (m < nb.length) { nb[m] = j; nb[m + 1] = dx / r; nb[m + 2] = dy / r; nb[m + 3] = q; m += 4; }
                    }
                }
            }
            const P = STIFF * (rho - REST), Pn = NEAR * near;
            let ax = 0, ay = 0;
            for (let k = 0; k < m; k += 4) {
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
            const out = { x: b.x + wx * c - wy * s, y: b.y + wx * s + wy * c, slide: null, vx: 0, vy: 0 };
            if (b.w || b.vx || b.vy) {
                // How fast that spot on the block is moving (spin included).
                const ox = out.x - b.x, oy = out.y - b.y, vx = b.vx - b.w * oy, vy = b.vy + b.w * ox;
                if (vx * vx + vy * vy > 0.25) { out.vx = vx; out.vy = vy; }
            }
            if (best[2] > 0 && c > 0.5) { const d = Math.abs(lx) < 0.05 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(lx); out.slide = [d * c, d * s]; }
            return out;
        }
        return null;
    };
}
// A ground line (the golf hill): drops below it are lifted back on top. outline: [[x, y], ...]
// left to right.
export function groundSolid(outline) {
    const x0 = outline[0][0], x1 = outline[outline.length - 1][0], step = (x1 - x0) / (outline.length - 1);
    return (px, py) => {
        if (px <= x0 || px >= x1) return null;
        const f = (px - x0) / step, k = Math.min(outline.length - 2, Math.floor(f)), t = f - k;
        const dy = outline[k + 1][1] - outline[k][1], gy = outline[k][1] + dy * t + RB;
        if (py >= gy) return null;
        // Out along the slope's normal, not straight up: lifting drops straight up a steep side
        // would pump the water up the hill.
        const nx = -dy / step, l = Math.hypot(nx, 1), d = (gy - py) / l;
        return { x: px + (nx / l) * d, y: py + d / l, slide: null };
    };
}
// The shape of a sim block, for blockSolid (built once per block, then just moved).
export function blockShape(b) {
    const [ox, oy] = [b.cells[0][0] - Math.round(b.cells[0][0]), b.cells[0][1] - Math.round(b.cells[0][1])];
    const set = new Set(b.cells.map(([cx, cy]) => Math.round(cx - ox) * 64 + Math.round(cy - oy)));
    const reach = Math.max(...b.cells.map(([cx, cy]) => Math.hypot(cx, cy))) + 0.75 + RB;
    return { set, ox, oy, reach2: reach * reach, x: 0, y: 0, a: 0, k: 1, vx: 0, vy: 0, w: 0 };
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

    // Still water (the golf pool; one day a whole flooded board): a body of water up to `top`,
    // drawn into the same picture as the drops, so it looks the same. It doesn't flow or ripple.
    // A ball diving in throws up a splash of drops, which fall back in.
    const pool = { top: null, splashed: new Map() };
    const poolMat = new THREE.ShaderMaterial({
        transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uFade: dots.material.uniforms.uFade },
        vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform float uFade; void main(){ gl_FragColor = vec4(uFade, 0.0, 0.0, 1.0); }',
    });
    const poolMesh = new THREE.Mesh(new THREE.PlaneGeometry(W, 1), poolMat);
    poolMesh.frustumCulled = false;
    poolMesh.visible = false;
    dotScene.add(poolMesh);
    const surfaceAt = () => pool.top;
    function splash(balls) {
        const now = performance.now();
        for (const b of balls) {
            // Coming in fast from just above: a small splash, once per ball per dive. A few little
            // droplets, kicked up a short way either side.
            if (b.vy > -5 || b.y < pool.top - 0.05 || b.y > pool.top + BALL_R + 0.08 || now - (pool.splashed.get(b.id) ?? -1e9) < 400) continue;
            pool.splashed.set(b.id, now);
            const n = Math.min(6, Math.round(-b.vy / 2));
            for (let k = 0; k < n && sim.n < MAX_DROPS; k++) {
                const i = sim.n++, side = k % 2 ? 1 : -1;
                sim.x[i] = b.x + side * (0.1 + Math.random() * 0.12); sim.y[i] = pool.top + 0.04;
                sim.vx[i] = side * (0.5 + Math.random()) + b.vx * 0.1; sim.vy[i] = 1.5 + Math.random() * 1.5;
                sim.size[i] = 0.4 + Math.random() * 0.15;
            }
        }
        if (pool.splashed.size > 20) pool.splashed.clear();
    }

    const blob = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.ShaderMaterial({
            transparent: true, depthTest: false, depthWrite: false,
            uniforms: {
                uMap: { value: target.texture }, uFill: { value: new THREE.Color() }, uDeep: { value: new THREE.Color() },
                uInk: { value: new THREE.Color() }, uFoam: { value: new THREE.Color(0xffffff) },
                uPx: { value: new THREE.Vector2(1 / (W * PX), 1 / (H * PX)) }, uRect: { value: new THREE.Vector4(0, 0, 1, 1) },
            },
            // uRect: the part of the board the quad covers this frame, in the offscreen picture's terms.
            vertexShader: 'uniform vec4 uRect; varying vec2 vUv; void main(){ vUv = uRect.xy + uv * uRect.zw; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
            // Kept cheap: it only covers where the water is (see update), and does a handful of
            // texture reads. Enough to read as water: an inked edge, a light line along the top
            // with a slow sheen, deeper colour lower down, and foam where it's churned up.
            fragmentShader: `
                uniform sampler2D uMap; uniform vec3 uFill, uDeep, uInk, uFoam; uniform vec2 uPx;
                varying vec2 vUv;
                ${NOISE}
                void main(){
                    vec4 t = texture2D(uMap, vUv);
                    const float T = 0.55;
                    if (t.r < T - 0.2) discard;
                    vec2 p = vUv * vec2(${W}.0, ${H}.0);           // board units
                    float n = noise(p * 2.2);                      // fixed, so still water stays still
                    vec2 uv = vUv + (n - 0.5) * uPx * 3.0;           // the edge wobbles a touch, like it's drawn
                    float f = texture2D(uMap, uv).r;
                    if (f < T - 0.08) discard;
                    float top = 1.0 - step(T, texture2D(uMap, uv + vec2(0.0, uPx.y * 5.0)).r);
                    float deep = step(T, texture2D(uMap, uv + vec2(0.0, uPx.y * 26.0)).r);
                    vec3 col = mix(uFill, uDeep, deep * 0.7);
                    col = mix(col, uFoam, top * (0.5 + 0.25 * sin(p.x * 2.2)));
                    float churn = clamp(t.g / max(t.r, 0.001), 0.0, 1.0);
                    col = mix(col, uFoam, smoothstep(0.55, 0.9, churn) * step(0.55, n) * 0.6);
                    col = mix(col, uInk, (1.0 - smoothstep(0.0, 0.1, f - T)) * 0.85);
                    gl_FragColor = vec4(col, smoothstep(T - 0.08, T - 0.02, f) * 0.84);   // a ball under water still shows through
                    #include <colorspace_fragment>
                }`,
        }),
    );
    blob.renderOrder = 0.5;                 // behind the blocks, so the edge tucks under them
    blob.visible = false;
    blob.frustumCulled = false;
    scene.add(blob);

    const m = new THREE.Matrix4(), clearWas = new THREE.Color();
    let fade = 0, draining = false, drawn = false, offset = 0;
    return {
        sim,
        spill(x, y, n, w) { sim.spill(x, y, n, w); sim.calm = 0; fade = 1; draining = false; },
        // Off it goes: the zone's done. The blob thins out and is gone in about half a second.
        drain() { if (sim.n || sim.pour.length || pool.top != null) draining = true; },
        clear() { sim.clear(); sim.calm = 0; draining = false; drawn = false; offset = 0; blob.visible = false; this.setPool(null); },
        active: () => sim.n > 0 || sim.pour.length > 0 || pool.top != null,
        // Still water up to y (null: none).
        setPool(y) {
            pool.top = y;
            sim.surface = y == null ? null : surfaceAt;
            poolMesh.visible = y != null;
            if (y != null) { poolMesh.scale.y = y + H + 0.5; poolMesh.position.set(W / 2, (y - H - 0.5) / 2, 0); }
            fade = 1; draining = false; drawn = false;
        },
        moving: () => draining || (sim.n > 0 && (sim.pour.length > 0 || sim.balls.length > 0 || sim.calm < 30)),
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
        // Shift the drawing (the golf stage's water rides in with its zone as it slides up).
        setOffset(y) { offset = y; },
        // balls: [{ x, y, vx, vy }], the ones on the board right now. wake: something nearby moved
        // (a block falling), so a still pool should start moving again.
        update(dt, solid, balls = [], wake = false) {
            if (!sim.n && !sim.pour.length && pool.top == null) return;
            sim.balls = balls;
            if (pool.top != null && dt > 0) splash(balls);
            const busy = draining || sim.pour.length > 0 || balls.length > 0 || wake;
            if (dt > 0 && (sim.n || sim.pour.length) && (busy || sim.calm < 30)) {
                sim.step(Math.min(dt, 1 / 30), solid);
                sim.calm = !busy && sim.speed() < 0.15 ? sim.calm + 1 : 0;
            }
            if (draining) { fade -= dt * 2; if (fade <= 0) { this.clear(); return; } }
            blob.visible = true;
            // The quad covers just the water (plus a dot's reach), not the whole board.
            let x0 = W, x1 = 0, y0 = 0, y1 = -H;
            if (pool.top != null) { x0 = 0; x1 = W; y0 = -H; y1 = pool.top + 0.4; }
            for (let i = 0; i < sim.n; i++) { const x = sim.x[i], y = sim.y[i]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
            x0 = Math.max(0, x0 - DOT); x1 = Math.min(W, x1 + DOT); y0 = Math.max(-H, y0 - DOT); y1 = Math.min(0, y1 + DOT);
            if (x1 > x0 && y1 > y0) {
                blob.scale.set(x1 - x0, y1 - y0, 1);
                blob.position.set((x0 + x1) / 2, (y0 + y1) / 2 + offset, 0.02);
                blob.material.uniforms.uRect.value.set(x0 / W, (y0 + H) / H, (x1 - x0) / W, (y1 - y0) / H);
            }
            // All still: the offscreen picture from last time is still right.
            if ((sim.calm >= 30 || !sim.n) && !busy && drawn) return;
            drawn = (sim.calm >= 30 || !sim.n) && !busy;
            for (let i = 0; i < sim.n; i++) {
                const k = sim.size[i];
                m.makeScale(k, k, 1).setPosition(sim.x[i], sim.y[i], 0); dots.setMatrixAt(i, m);
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
