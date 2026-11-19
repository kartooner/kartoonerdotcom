// Boop: hand-drawn simple shapes (the board frame, props, +1 rings, the launcher).
// Same idea as the block shader: a shape is a distance field, its edge is wobbled
// with a slow bend and fine grain so it reads as drawn, not machined.
import * as THREE from 'three';

export const SHAPE = { BOX: 0, CIRCLE: 1, RING: 2, CAP: 3 };

const vertex = /* glsl */`
varying vec2 vP;
void main() {
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragment = /* glsl */`
uniform int uKind;
uniform vec2 uSize;        // box: half width/height; circle/ring: radius in x; cap: radii
uniform float uRound;      // box corner radius
uniform float uRing;       // ring thickness
uniform float uEdge;       // outline width
uniform float uWob;        // how much the edge wobbles (1 = like blocks)
uniform float uFilled;     // 1 = fill + outline, 0 = outline only
uniform float uSeed;
uniform vec3 uFill;
uniform vec3 uInk;
varying vec2 vP;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float sdBox(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b + r;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

void main() {
    vec2 p = vP;
    float d;
    if (uKind == 0) d = sdBox(p, uSize, uRound);
    else if (uKind == 1) d = length(p) - uSize.x;
    else if (uKind == 2) d = abs(length(p) - uSize.x) - uRing * 0.5;
    else {
        // cap: the top half of an ellipse, flat side down
        vec2 q = p / uSize;
        d = max((length(q) - 1.0) * min(uSize.x, uSize.y), -p.y);
    }
    vec2 q = p + uSeed;
    d += ((noise(q * 2.6) - 0.5) * 0.06 + (noise(q * 19.0) - 0.5) * 0.03) * uWob;

    float aa = fwidth(d);
    float inside = 1.0 - smoothstep(-aa, aa, d);
    float edgeW = uEdge + (noise(q * 31.0) - 0.5) * 0.02 * uWob;
    float fillMask = 1.0 - smoothstep(-aa, aa, d + edgeW);
    // Outline-only shapes keep just the band along the edge.
    float a = mix(inside - fillMask, inside, uFilled);
    if (a < 0.01) discard;
    vec3 col = mix(uInk, uFill, fillMask * uFilled);
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
}`;

// Every sketch material, so a theme change can recolour the ink in one go.
// role 'line' = marks on the field (launcher, rings, frame); 'edge' = outlines on filled props.
export const sketchMats = [];
const ink = { line: 0x2b2622, edge: 0x2b2622 };   // current theme's colours, for new shapes

export function makeSketch({ kind, size, round = 0, ring = 0.07, edge = 0.06, wob = 1, filled = true,
    fill = 0xffffff, role = 'edge', inkFill = false, seed = Math.random() * 50, margin = 0.2 }) {
    const [sx, sy] = kind === SHAPE.BOX || kind === SHAPE.CAP ? size : [size[0], size[0]];
    const w = (sx + margin) * 2, h = (sy + margin) * 2;
    const geo = new THREE.PlaneGeometry(w, kind === SHAPE.CAP ? sy + margin * 2 : h);
    if (kind === SHAPE.CAP) geo.translate(0, sy / 2, 0);
    const material = new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        uniforms: {
            uKind: { value: kind },
            uSize: { value: new THREE.Vector2(size[0], size[1] ?? size[0]) },
            uRound: { value: round },
            uRing: { value: ring },
            uEdge: { value: edge },
            uWob: { value: wob },
            uFilled: { value: filled ? 1 : 0 },
            uSeed: { value: seed },
            uFill: { value: new THREE.Color(inkFill ? ink[role] : fill) },
            uInk: { value: new THREE.Color(ink[role]) },
        },
    });
    material.userData.role = role;
    material.userData.inkFill = inkFill;     // solid ink shapes (the launcher) recolour fully
    sketchMats.push(material);
    const mesh = new THREE.Mesh(geo, material);
    mesh.renderOrder = 1;
    return mesh;
}

// Call when the theme changes. Filled ink shapes (the launcher) also take the line colour as fill.
export function setSketchInk(line, edge) {
    ink.line = line; ink.edge = edge;
    for (const m of sketchMats) {
        const ink = m.userData.role === 'line' ? line : edge;
        m.uniforms.uInk.value.setHex(ink);
        if (m.userData.inkFill) m.uniforms.uFill.value.setHex(ink);
    }
}

// Drop materials for meshes that were removed (props and rings from an old zone).
export function forgetSketch(object) {
    object.traverse((o) => {
        const i = sketchMats.indexOf(o.material);
        if (i >= 0) sketchMats.splice(i, 1);
    });
}
