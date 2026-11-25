// Boop: how a block is drawn. One quad per block; the shader works out the
// block's whole outline from its cells, so there are no seams between cells.
// It also wobbles the edge so it reads hand-drawn, and lays a pattern on the
// fill so the number tiers can be told apart without colour.
import * as THREE from 'three';
(globalThis.boopBuilds = globalThis.boopBuilds || []).push('1.5-12');   // build stamp: game.js checks every file matches

// Tiers by the number on the block. Each has a colour AND a pattern.
// Number colour is chosen for contrast (all pass 3:1 for large bold text, most pass 4.5:1).
export const TIERS = [
    { max: 2, fill: 0x9fcb7c, pattern: 0, text: '#2b2622' },        // green, dots
    { max: 4, fill: 0x8fc3e3, pattern: 1, text: '#2b2622' },        // sky, diagonal stripes
    { max: 6, fill: 0x6dbcae, pattern: 7, text: '#2b2622' },        // teal, plus signs
    { max: 9, fill: 0xf2c552, pattern: 2, text: '#2b2622' },        // yellow, dashes
    { max: 14, fill: 0xf39e62, pattern: 3, text: '#2b2622' },       // apricot, crosshatch
    { max: 24, fill: 0xe8806a, pattern: 4, text: '#2b2622' },       // coral, rings
    { max: 39, fill: 0xe094a8, pattern: 5, text: '#2b2622' },       // rose, zigzag
    { max: Infinity, fill: 0x9a5e57, pattern: 6, text: '#fffaf0' }, // brown, vertical stripes
];
export const JELLO = { fill: 0x8fd6c4, text: '#2b2622' };
export const NEUTRAL = { light: 0xcdc4b5, dark: 0x6e665c };
export const tierFor = (hp) => TIERS.find((t) => hp <= t.max);

const CORNER = 0.14;        // corner rounding for blocks, in cells
const JELLO_CORNER = 0.32;  // jello is softer
const MARGIN = 0.2;         // room around the shape for the wobble and outline

const vertex = /* glsl */`
varying vec2 vP;
void main() {
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragment = /* glsl */`
uniform vec4 uBox[9];      // one box per cell; the biggest shape is 3x3
uniform vec3 uCell[9];     // cell centre and open sides (bits: 1 left, 2 bottom, 4 right, 8 top), for the gold bevel
uniform int uCount;
uniform float uK;          // current size (blocks shrink as they wear down)
uniform float uR;          // corner radius
uniform float uSeed;
uniform float uJello;
uniform vec3 uFill;
uniform vec3 uInk;
uniform int uPattern;
uniform vec2 uLabel;
uniform vec4 uBounds;      // shape bounds (min x, min y, max x, max y), unscaled
uniform vec3 uPoke;        // jello: a ball inside it (x, y in unscaled cells, strength 0-1)
uniform float uWobble;     // jello: current wobble, to slide the shine around
uniform vec3 uTrail[10];   // jello: recent ball positions (x, y, strength) - a tunnel that heals
uniform float uNeutral;    // 1 for unbreakable blocks: plain fill, no pattern
uniform float uGold;       // 1 for the gold block: metal shading, flecks and a passing sheen
uniform float uTime;       // seconds, for the gold sheen and fleck twinkle (only moves when the board redraws)
// Nails, drawn here rather than as meshes of their own (two fewer draws per block): a tack
// head with an ink rim. x, y in the block's scaled space; z = wear 0-1 (it tips and shows its
// side); w = tilt. uNailFill is white for ones that come out, grey for ones that never do.
uniform vec4 uNail[2];
uniform vec3 uNailFill[2];
uniform float uNailCrack[2];   // 0 none, 1 one crack, 2 two: the nail is nearly out
uniform int uNails;
varying vec2 vP;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
// Soft-edged step, so patterns stay clean at any zoom.
float aastep(float t, float x) {
    float w = fwidth(x) * 0.75;
    return smoothstep(t - w, t + w, x);
}
float band(float lo, float hi, float x) { return aastep(lo, x) - aastep(hi, x); }

float pattern(vec2 p, int id) {
    if (id == 0) { vec2 g = fract(p * 5.0) - 0.5; return 1.0 - aastep(0.13, length(g)); }               // dots
    if (id == 1) { return band(0.6, 0.85, fract((p.x + p.y) * 3.5)); }                                   // diagonal stripes
    if (id == 2) {                                                                                        // dashes
        vec2 g = p * vec2(3.5, 4.5);
        g.x += mod(floor(g.y), 2.0) * 0.5;
        vec2 f = fract(g);
        return band(0.45, 0.7, f.y) * band(0.15, 0.7, f.x);
    }
    if (id == 3) { return max(band(0.78, 0.95, fract((p.x + p.y) * 3.0)), band(0.78, 0.95, fract((p.x - p.y) * 3.0))); } // crosshatch
    if (id == 4) { vec2 g = fract(p * 2.5) - 0.5; return band(0.24, 0.33, length(g)); }                    // rings
    if (id == 5) { float y = p.y * 4.0 + abs(fract(p.x * 2.5) - 0.5) * 1.8; return band(0.65, 0.9, fract(y)); } // zigzag
    if (id == 6) { return band(0.62, 0.86, fract(p.x * 4.0)); }                                           // vertical stripes
    if (id == 7) {                                                                                        // plus signs
        vec2 f = fract(p * 3.0);
        return max(band(0.44, 0.56, f.x) * band(0.25, 0.75, f.y), band(0.44, 0.56, f.y) * band(0.25, 0.75, f.x));
    }
    return 0.0;
}

void main() {
    vec2 p = vP / uK;                       // unscaled cell units: shape and pattern shrink together
    float d = 1e3;
    for (int i = 0; i < 9; i++) {
        if (i >= uCount) break;
        vec4 b = uBox[i];
        d = min(d, sdBox(p - (b.xy + b.zw) * 0.5, (b.zw - b.xy) * 0.5));
    }
    d -= uR;
    // Jello bulges out around a ball passing through it.
    float pokeDist = length(p - uPoke.xy);
    d -= uJello * uPoke.z * 0.11 * exp(-pokeDist * pokeDist / 0.18);
    float dSmooth = d * uK;                 // the shape before the hand-drawn wobble, for lighting
    // Hand-drawn edge: a slow bend plus fine crayon grain.
    vec2 q = p + uSeed;
    float wob = (noise(q * 2.6) - 0.5) * 0.07 + (noise(q * 19.0) - 0.5) * 0.035;
    d = (d + wob) * uK;

    float aa = fwidth(d);
    float inside = 1.0 - smoothstep(-aa, aa, d);
    float edgeW = mix(0.065, 0.045, uJello) + (noise(q * 31.0) - 0.5) * 0.02;
    float fillMask = 1.0 - smoothstep(-aa, aa, d + edgeW);

    vec3 fill = uFill;
    if (uNeutral > 0.5) {
        // Neutral: a plain solid fill, so it reads as different from every numbered block.
    } else if (uJello < 0.5) {
        // Pattern in a slightly darker shade of the fill; cleared around the number.
        float clear = smoothstep(0.15, 0.25, length(p - uLabel));   // small, so one-cell blocks keep their pattern
        fill = mix(fill, fill * 0.8, pattern(p, uPattern) * clear);
    }
    if (uGold > 0.5) {
        // Gold: metal rather than a flat colour. Brighter at the top, deeper at the bottom.
        float h = clamp((p.y - uBounds.y) / (uBounds.w - uBounds.y), 0.0, 1.0);
        fill = mix(uFill * 0.8, mix(uFill, vec3(1.0, 0.9, 0.5), 0.3), h);
        // Flecks: scattered bright specks, each twinkling on its own beat. Kept off the number.
        vec2 fc = floor(p * 5.0), ff = fract(p * 5.0) - 0.5;
        float fr = hash(fc + uSeed);
        vec2 jit = vec2(hash(fc + 3.7), hash(fc + 9.1)) - 0.5;
        float fleck = step(0.5, fr) * (1.0 - aastep(0.06 + fr * 0.05, length(ff - jit * 0.5)));
        fleck += step(0.5, fr) * (1.0 - aastep(0.02, abs((ff - jit * 0.5).x))) * (1.0 - aastep(0.16, abs((ff - jit * 0.5).y))) * step(0.85, fr);   // the biggest get a little cross glint
        fleck += step(0.5, fr) * (1.0 - aastep(0.02, abs((ff - jit * 0.5).y))) * (1.0 - aastep(0.16, abs((ff - jit * 0.5).x))) * step(0.85, fr);
        float tw = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 2.6 + fr * 60.0));
        float clearG = smoothstep(0.2, 0.32, length(p - uLabel));
        fill = mix(fill, vec3(1.0, 0.99, 0.9), min(fleck, 1.0) * tw * clearG);
        // A few darker grains, so it reads as cast metal and not plastic.
        float grain = step(0.8, hash(fc + uSeed + 21.0)) * (1.0 - aastep(0.05, length(ff + jit * 0.5)));
        fill = mix(fill, uFill * 0.62, grain * 0.6 * clearG);
        // Sheen: a soft diagonal band that sweeps across now and then, then rests.
        float sx = p.x + p.y * 0.7;
        float lo = uBounds.x + uBounds.y * 0.7 - 0.6, hi = uBounds.z + uBounds.w * 0.7 + 0.6;
        float ph = fract(uTime / 3.2) / 0.45;                 // sweep takes 45% of the cycle
        float at = mix(lo, hi, ph);
        float sheen = (1.0 - smoothstep(0.08, 0.22, abs(sx - at))) * step(ph, 1.0);
        sheen += (1.0 - smoothstep(0.02, 0.06, abs(sx - at - 0.3))) * step(ph, 1.0) * 0.6;   // thin trailing glint
        fill = mix(fill, vec3(1.0, 0.98, 0.9), sheen * 0.55);
    }
    vec3 col = mix(uInk, fill, fillMask);
    if (uGold > 0.5) {
        // Bevel: a bright inner rim facing the top-left light, a darker one facing away. Measured
        // to each cell's outer sides only (the shape's distance dips at the joins between cells).
        float eD = 1e3; vec2 eN = vec2(0.0);
        for (int i = 0; i < 9; i++) {
            if (i >= uCount) break;
            vec2 cq = p - uCell[i].xy;
            if (max(abs(cq.x), abs(cq.y)) > 0.5) continue;
            float bits = uCell[i].z;
            if (mod(bits, 2.0) > 0.5 && cq.x + 0.5 < eD) { eD = cq.x + 0.5; eN = vec2(-1.0, 0.0); }
            if (mod(floor(bits / 2.0), 2.0) > 0.5 && cq.y + 0.5 < eD) { eD = cq.y + 0.5; eN = vec2(0.0, -1.0); }
            if (mod(floor(bits / 4.0), 2.0) > 0.5 && 0.5 - cq.x < eD) { eD = 0.5 - cq.x; eN = vec2(1.0, 0.0); }
            if (bits >= 7.5 && 0.5 - cq.y < eD) { eD = 0.5 - cq.y; eN = vec2(0.0, 1.0); }
        }
        float rim = smoothstep(0.06, 0.12, eD) * (1.0 - smoothstep(0.14, 0.22, eD)) * fillMask;
        float lit = dot(eN, vec2(-0.7071, 0.7071));
        col = mix(col, vec3(1.0, 0.97, 0.82), rim * max(lit, 0.0) * 0.8);
        col = mix(col, uFill * 0.55, rim * max(-lit, 0.0) * 0.6);
    }
    float alpha = inside * mix(1.0, mix(0.6, 0.4, fillMask), uJello);

    if (uJello > 0.5) {
        // Rudimentary specular: one light from the top left, fixed on screen, so the
        // shine stays put while the jello wobbles. The edge's outward direction comes
        // from how the distance changes across the screen.
        vec2 n = normalize(vec2(dFdx(dSmooth), dFdy(dSmooth)) + 1e-6);
        // The light swings a little with the wobble, so the shine slides as it jiggles.
        float la = 2.14 + uWobble * 4.0;
        float facing = max(dot(n, vec2(cos(la), sin(la))), 0.0);
        float streakBand = smoothstep(-0.3, -0.2, dSmooth) * (1.0 - smoothstep(-0.12, -0.07, dSmooth));
        float spec = streakBand * pow(facing, 3.0) * 0.8;
        // A small tilted oval glint tucked into the top-left corner.
        vec2 g = p - vec2(uBounds.x + 0.24, uBounds.w - 0.22);
        g = mat2(0.7071, -0.7071, 0.7071, 0.7071) * g;
        spec += (1.0 - smoothstep(0.75, 1.0, length(g / vec2(0.1, 0.045)))) * fillMask;
        // Shade on the far side gives the body some roundness.
        float away = max(dot(n, -vec2(cos(la), sin(la))), 0.0);
        // The ball's path leaves a clearer tunnel through the goo that slowly closes up.
        float tunnel = 0.0;
        for (int i = 0; i < 10; i++) {
            vec2 dp = p - uTrail[i].xy;
            tunnel = max(tunnel, uTrail[i].z * exp(-dot(dp, dp) / 0.016));
        }
        tunnel *= fillMask;
        // Clearer in the middle, with a slightly darker wall so it reads on light backgrounds too.
        float wall = clamp(tunnel * (1.0 - tunnel) * 4.0, 0.0, 1.0);
        col = mix(col, vec3(1.0), tunnel * 0.3);
        col = mix(col, uFill * 0.62, wall * 0.55);
        alpha = mix(alpha, 0.85, wall * 0.6);
        alpha *= 1.0 - smoothstep(0.55, 1.0, tunnel) * 0.7;
        // A faint bright ring around the ball inside, like light bending through the goo.
        float ring = exp(-pow(pokeDist - 0.24, 2.0) / 0.003) * uPoke.z * fillMask;
        col = mix(col, vec3(1.0), ring * 0.45);
        alpha = max(alpha, ring * 0.5);
        float shade = streakBand * pow(away, 3.0) * fillMask;
        col = mix(col, col * 0.78, shade * 0.6);
        alpha = max(alpha, shade * 0.55);
        spec *= inside;
        col = mix(col, vec3(1.0), spec);
        alpha = max(alpha, spec * 0.95);
    }
    for (int i = 0; i < 2; i++) {
        if (i >= uNails) break;
        vec4 nl = uNail[i];
        vec2 dp = vP - nl.xy;
        float c = cos(nl.w), sn = sin(nl.w);
        dp = vec2(c * dp.x + sn * dp.y, -sn * dp.x + c * dp.y) / vec2(1.0 + nl.z * 0.25, 1.0 - nl.z * 0.25);
        float a = atan(dp.y, dp.x);
        float r = length(dp) - 0.078 - (noise(vec2(a * 2.0, uSeed + float(i) * 7.0)) - 0.5) * 0.012;
        float naa = fwidth(r);
        float head = 1.0 - smoothstep(-naa, naa, r - 0.032);       // head plus rim
        float face = 1.0 - smoothstep(-naa, naa, r);                // the head inside the rim
        vec3 nc = uNailFill[i];
        float ck = uNailCrack[i];
        if (ck > 0.5) {
            // Jagged ink lines across the head.
            float j = (noise(dp * 60.0 + uSeed) - 0.5) * 0.018;
            float c1 = 1.0 - smoothstep(0.007, 0.015, abs(dp.y - dp.x * 0.55 + j));
            float c2 = ck > 1.5 ? (1.0 - smoothstep(0.007, 0.015, abs(dp.x + dp.y * 0.35 - 0.02 + j))) * step(dp.y, 0.01) : 0.0;
            nc = mix(nc, uInk, max(c1, c2) * 0.9);
        }
        col = mix(col, mix(uInk, nc, face), head);
        alpha = max(alpha, head);
    }
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
}`;

// cells: block-local cell centres (unscaled). Returns a mesh whose material
// uniforms the caller updates as the block wears down.
// corner: optional rounding override (0.5 on a single cell draws a circle, e.g. a bomb).
export function makeBlockMesh(cells, jello, seed, corner) {
    const has = (x, y) => cells.some(([cx, cy]) => Math.abs(cx - x) < 0.01 && Math.abs(cy - y) < 0.01);
    const r = corner ?? (jello ? JELLO_CORNER : CORNER);
    // Each cell box pulls in by the corner radius on open sides and reaches into
    // neighbours on joined sides; rounding then adds the radius back on the outside.
    const boxes = cells.map(([x, y]) => new THREE.Vector4(
        x - (has(x - 1, y) ? 0.52 : 0.5 - r),
        y - (has(x, y - 1) ? 0.52 : 0.5 - r),
        x + (has(x + 1, y) ? 0.52 : 0.5 - r),
        y + (has(x, y + 1) ? 0.52 : 0.5 - r)));
    // Each cell's centre and which sides face out (1 = open): left, bottom, right, top bits in z.
    const open = cells.map(([x, y]) => new THREE.Vector3(x, y,
        (has(x - 1, y) ? 0 : 1) + (has(x, y - 1) ? 0 : 2) + (has(x + 1, y) ? 0 : 4) + (has(x, y + 1) ? 0 : 8)));
    while (open.length < 9) open.push(new THREE.Vector3(1e3, 1e3, 0));
    while (boxes.length < 9) boxes.push(new THREE.Vector4(0, 0, 0, 0));

    const xs = cells.map(([x]) => x), ys = cells.map(([, y]) => y);
    const minX = Math.min(...xs) - 0.5 - MARGIN, maxX = Math.max(...xs) + 0.5 + MARGIN;
    const minY = Math.min(...ys) - 0.5 - MARGIN, maxY = Math.max(...ys) + 0.5 + MARGIN;
    const geo = new THREE.PlaneGeometry(maxX - minX, maxY - minY);
    geo.translate((minX + maxX) / 2, (minY + maxY) / 2, 0);

    const bx = cells.map(([x]) => x), by = cells.map(([, y]) => y);
    const bounds = new THREE.Vector4(Math.min(...bx) - 0.5, Math.min(...by) - 0.5, Math.max(...bx) + 0.5, Math.max(...by) + 0.5);
    const material = new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        uniforms: {
            uBox: { value: boxes },
            uCount: { value: cells.length },
            uCell: { value: open },
            uK: { value: 1 },
            uR: { value: r },
            uSeed: { value: seed },
            uJello: { value: jello ? 1 : 0 },
            uFill: { value: new THREE.Color(jello ? JELLO.fill : TIERS[0].fill) },
            uInk: { value: new THREE.Color(0x2b2622) },
            uPattern: { value: 0 },
            uLabel: { value: new THREE.Vector2() },
            uBounds: { value: bounds },
            uPoke: { value: new THREE.Vector3(0, 0, 0) },
            uWobble: { value: 0 },
            uTrail: { value: Array.from({ length: 10 }, () => new THREE.Vector3(0, 0, 0)) },
            uNeutral: { value: 0 },
            uGold: { value: 0 },
            uTime: { value: 0 },
            uNail: { value: [new THREE.Vector4(), new THREE.Vector4()] },
            uNailFill: { value: [new THREE.Color(), new THREE.Color()] },
            uNailCrack: { value: [0, 0] },
            uNails: { value: 0 },
        },
    });
    return new THREE.Mesh(geo, material);
}
