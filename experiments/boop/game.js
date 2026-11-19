// Boop gray-box: rendering, input and turn flow. Physics and rules live in sim.js.
import * as THREE from 'three';
import RAPIER from 'rapier';
import { Sim, predict, W, H, DT, LAUNCHER, BALL_R } from './sim.js';
import { makeBlockMesh, tierFor, JELLO } from './blockshader.js';

// Light and dark palettes. "line" is for marks drawn on the field (launcher,
// guide, pickups); "edge" is the outline on blocks, props and balls.
const THEMES = {
    light: {
        paper: 0xf1e8d2, field: 0xfbf6ea, line: 0x2b2622, edge: 0x2b2622, ball: 0xfffdf7,
        hit: 0xd2492a, text: '#2b2622', jelloText: '#2b2622',
    },
    dark: {
        paper: 0x15120f, field: 0x221e1a, line: 0xede4d3, edge: 0x0f0c0a, ball: 0xf6efe2,
        hit: 0xff9466, text: '#ede4d3', jelloText: '#f6efe2',
    },
};
const COLORS = { mushroom: 0xe06b4a, stem: 0xf3e3c3, windmill: 0xf2c14e };
let theme = THEMES.light;

const MAX_SETTLE_STEPS = 360;        // tumbling blocks get up to 3s to come to rest
const AUTO_FAST = 2;                 // speed-up for a ball that's been bouncing a while
const AUTO_FAST_AFTER = 960;         // 8s in, so there's time to watch it first
const DESCEND_TIME = 0.9;
const FAST_FORWARD = 3;

const $ = (id) => document.getElementById(id);
const hud = {
    depth: $('hud-depth'), balls: $('hud-balls'), volley: $('hud-volley'), volleyBox: $('hud-volley-box'),
    msg: $('message'), msgTitle: $('message-title'), msgBody: $('message-body'),
};

// ---------- three.js setup ----------

const renderer = new THREE.WebGLRenderer({ antialias: true });
// Resolution steps down if frames run slow (the hand-drawn block shader runs on every pixel).
const PIXEL_RATIOS = [2, 1.5, 1].filter((r) => r <= Math.max(1, window.devicePixelRatio));
let pixelStep = 0;
renderer.setPixelRatio(PIXEL_RATIOS[0]);

$('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(0, W, 0, -H, -10, 10);

function fitCamera() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    const pad = 0.3, top = 1.3;                 // room for the HUD above the field
    const fw = W + pad * 2, fh = H + top + pad;
    const aspect = w / h;
    let vw, vh;
    if (aspect > fw / fh) { vh = fh; vw = fh * aspect; } else { vw = fw; vh = fw / aspect; }
    const cx = W / 2, cy = (top - H - pad) / 2;
    camera.left = cx - vw / 2; camera.right = cx + vw / 2;
    camera.top = cy + vh / 2; camera.bottom = cy - vh / 2;
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', fitCamera);
fitCamera();

const mat = (color, opts = {}) => new THREE.MeshBasicMaterial({ color, ...opts });
const unitSquare = new THREE.PlaneGeometry(1, 1);
const unitCircle = new THREE.CircleGeometry(1, 32);
const halfCircle = new THREE.CircleGeometry(1, 24, 0, Math.PI);
const lineMat = mat(0);         // marks on the field
const outlineMat = mat(0);      // edges on blocks, props and balls
const ballMat = mat(0);
const fieldMat = mat(0);

const fieldMesh = new THREE.Mesh(unitSquare, fieldMat);
fieldMesh.scale.set(W, H, 1);
fieldMesh.position.set(W / 2, -H / 2, -1);
scene.add(fieldMesh);

function rect(w, h, material, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(unitSquare, material);
    m.scale.set(w, h, 1);
    m.position.set(x, y, z);
    return m;
}

// Launcher in the top-right corner.
const launcher = new THREE.Group();
const launcherBody = new THREE.Mesh(unitCircle, lineMat);
launcherBody.scale.setScalar(0.34);
const barrelPivot = new THREE.Group();
barrelPivot.add(rect(0.62, 0.2, lineMat, 0.31));
launcher.add(launcherBody, barrelPivot);
launcher.position.set(LAUNCHER.x, LAUNCHER.y, 0.5);
barrelPivot.rotation.z = -2.2;
scene.add(launcher);


// Aim guide: dots along the predicted path. Where the game expects the ball to
// hit something, that dot is bigger and in the accent colour.
const MAX_DOTS = 260;
const dots = new THREE.InstancedMesh(new THREE.CircleGeometry(0.055, 10), mat(0xffffff, { transparent: true, opacity: 0.85 }), MAX_DOTS);
dots.count = 0;
dots.frustumCulled = false;   // instances move every aim; the cached bounds would hide them
for (let i = 0; i < MAX_DOTS; i++) dots.setColorAt(i, new THREE.Color(0));   // colour buffer must exist before first draw
scene.add(dots);

// ---------- text labels ----------

function makeLabel(text, color = theme.text) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(unitSquare, new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    m.userData = { c, tex, color };
    drawLabel(m, text);
    return m;
}
function drawLabel(m, text) {
    const { c, tex, color } = m.userData;
    const g = c.getContext('2d');
    g.clearRect(0, 0, 128, 128);
    const size = text.length >= 3 ? 52 : text.length === 2 ? 66 : 78;
    g.font = `800 ${size}px Manrope, system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = color;
    g.fillText(text, 64, 68);
    tex.needsUpdate = true;
}

// ---------- view of the sim ----------

let sim;
const blockViews = new Map();   // id → view
const ballViews = new Map();    // body handle → { group, inner, ... }
const pickupViews = new Map();  // id → group
const propViews = new Map();    // id → { group, rotor? }
const floaters = [];            // "+1" labels drifting up
let zoneOffset = 0;             // visual slide used when a new zone comes up


function buildBlockView(b) {
    const group = new THREE.Group();
    const mesh = makeBlockMesh(b.cells, b.jello, (b.id * 7.31) % 50);
    mesh.material.uniforms.uInk.value.setHex(theme.edge);
    mesh.renderOrder = 1;
    group.add(mesh);
    // Put the number on the cell closest to the block's centre.
    let best = b.cells[0], bestD = Infinity;
    for (const c of b.cells) { const d = c[0] ** 2 + c[1] ** 2; if (d < bestD) { bestD = d; best = c; } }
    mesh.material.uniforms.uLabel.value.set(best[0], best[1]);
    const label = makeLabel(String(b.hp));
    label.userData.cell = best;
    label.position.z = 0.2;
    label.renderOrder = 2;
    group.add(label);
    scene.add(group);
    const v = { group, mesh, label, hp: -1, punch: 0, jello: b.jello };
    blockViews.set(b.id, v);
    return v;
}

function updateBlockView(v, b, frameDt) {
    const u = v.mesh.material.uniforms;
    if (v.hp !== b.hp) {
        if (v.hp !== -1) v.punch = 1;
        v.hp = b.hp;
        const look = b.jello ? JELLO : tierFor(b.hp);
        v.label.userData.color = look.text;
        drawLabel(v.label, String(b.hp));
        if (!b.jello) { u.uFill.value.setHex(look.fill); u.uPattern.value = look.pattern; }
    }
    const k = b.scale;
    u.uK.value = k;
    const [lx, ly] = v.label.userData.cell;
    v.label.position.set(lx * k, ly * k, 0.2);
    v.label.scale.setScalar(Math.max(0.62, k * 0.92));
    v.punch = Math.max(0, v.punch - frameDt * (v.jello ? 3 : 8));
    v.wobbleT = (v.wobbleT ?? Infinity) + frameDt;
    if (v.jello) {
        // Jello wobbles hard each time a ball goes in or out: a springy squash that
        // rings for about half a second. The ball's direction decides which way it squashes.
        const t = v.wobbleT;
        const w = t < 0.7 ? Math.sin(t * 38) * Math.exp(-t * 6) * 0.13 : 0;
        const across = Math.abs(Math.cos(v.wobbleDir ?? 0)) > 0.7 ? 1 : -1;   // sideways hit squashes the other way
        v.group.scale.set(1 + w * across, 1 - w * across, 1);
    } else {
        // Every bounce off a block gives it a quick squash-and-recover wobble on screen,
        // on top of the small physical knock; a hit that takes a point off also pops a little.
        const w = v.wobbleT < 0.35 ? Math.sin(v.wobbleT * 55) * Math.exp(-v.wobbleT * 11) * 0.06 : 0;
        const k = 1 + 0.06 * v.punch;
        v.group.scale.set(k * (1 + w), k * (1 - w), 1);
    }
}

function buildPickupView(pk) {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.27, 28), lineMat);
    const label = makeLabel('+1');
    group.userData.label = label;
    label.scale.setScalar(0.42);
    label.position.z = 0.1;
    group.add(ring, label);
    scene.add(group);
    pickupViews.set(pk.id, group);
    return group;
}

function buildPropView(pr) {
    const group = new THREE.Group();
    const v = { group };
    if (pr.kind === 'windmill') {
        const rotor = new THREE.Group();
        const fill = mat(COLORS.windmill);
        for (const rot of [0, Math.PI / 2]) {
            const arm = new THREE.Group();
            arm.add(rect(1.7 + 0.08, 0.18 + 0.08, outlineMat), rect(1.7, 0.18, fill, 0, 0, 0.05));
            arm.rotation.z = rot;
            rotor.add(arm);
        }
        const pin = new THREE.Mesh(unitCircle, outlineMat);
        pin.scale.setScalar(0.12);
        pin.position.z = 0.1;
        rotor.add(pin);
        group.add(rotor);
        group.position.set(pr.x, pr.y, 0.05);
        v.rotor = rotor;
    } else {
        // Mushroom: stem plus a domed cap, each with an ink edge.
        const stemFill = mat(COLORS.stem), capFill = mat(COLORS.mushroom);
        group.add(rect(0.28 + 0.08, pr.capY + 0.04, outlineMat, 0, pr.capY / 2), rect(0.28, pr.capY, stemFill, 0, pr.capY / 2, 0.05));
        const capOut = new THREE.Mesh(halfCircle, outlineMat);
        capOut.scale.set(pr.r + 0.045, (pr.r + 0.045) * 0.75, 1);
        capOut.position.set(0, pr.capY - 0.03, 0.06);
        const cap = new THREE.Mesh(halfCircle, capFill);
        cap.scale.set(pr.r, pr.r * 0.75, 1);
        cap.position.set(0, pr.capY, 0.07);
        group.add(capOut, cap);
        group.position.set(pr.x, pr.y, 0.05);
    }
    scene.add(group);
    propViews.set(pr.id, v);
    return v;
}

function addFloater(text, x, y) {
    const m = makeLabel(text, theme.text);
    m.scale.setScalar(0.55);
    m.position.set(x, y, 0.8);
    m.material.opacity = 1;
    scene.add(m);
    floaters.push({ m, t: 0 });
}

// Balls squash and stretch on screen only. The physics ball stays a circle,
// so bounces stay predictable and the aim guide stays exact.
const STRETCH_MAX = 0.75;       // extra length at full launch speed (a torpedo)
const STRETCH_FROM = 3;         // below this speed a ball stays round
const SQUASH_TIME = 0.22;
const bounced = new Set();      // balls that hit something since the last frame

function buildBallView(handle) {
    const group = new THREE.Group();          // squash, turned to the bounce normal
    const inner = new THREE.Group();          // stretch, turned to the direction of travel
    const o = new THREE.Mesh(unitCircle, outlineMat); o.scale.setScalar(BALL_R);
    const f = new THREE.Mesh(unitCircle, ballMat); f.scale.setScalar(BALL_R - 0.045); f.position.z = 0.01;
    inner.add(o, f);
    group.add(inner);
    scene.add(group);
    const v = { group, inner, prev: { x: 0, y: 0 }, squashT: Infinity, normal: 0 };
    ballViews.set(handle, v);
    return v;
}

function shapeBall(v, vel, frameDt) {
    v.squashT += frameDt;
    // Squash: flatten hard against the surface, then wobble back to round.
    let squash = 0;
    if (v.squashT < SQUASH_TIME) {
        const t = v.squashT;
        squash = Math.exp(-t * 18) * Math.cos(t * 45) * 0.42;
    }
    // Stretch along travel, eased off while squashed. Longer also gets a little thinner.
    const speed = Math.hypot(vel.x, vel.y);
    const k = Math.min(1, Math.max(0, (speed - STRETCH_FROM) / (20 - STRETCH_FROM)));
    const stretch = 1 + STRETCH_MAX * k * k * (1 - Math.min(1, Math.abs(squash) * 2.4));
    const travel = Math.atan2(vel.y, vel.x);

    v.group.rotation.z = v.normal;
    v.group.scale.set(1 - squash, 1 / (1 - squash), 1);
    v.inner.rotation.z = travel - v.normal;
    v.inner.scale.set(stretch, 1 / Math.sqrt(stretch), 1);
}

function syncView(frameDt) {
    const s = sim.s;
    for (const [id, v] of blockViews) {
        if (!s.blocks[id]) { scene.remove(v.group); blockViews.delete(id); }
    }
    for (const id in s.blocks) {
        const b = s.blocks[id];
        const v = blockViews.get(b.id) ?? buildBlockView(b);
        updateBlockView(v, b, frameDt);
        const body = sim.world.getRigidBody(b.body);
        const p = body.translation();
        v.group.position.set(p.x, p.y + zoneOffset, b.loose ? 0.05 : 0);
        v.group.rotation.z = body.rotation();
    }

    for (const [id, g] of pickupViews) {
        if (!s.pickups[id]) { scene.remove(g); pickupViews.delete(id); }
    }
    for (const id in s.pickups) {
        const pk = s.pickups[id];
        const g = pickupViews.get(pk.id) ?? buildPickupView(pk);
        g.position.set(pk.x, pk.y + zoneOffset, 0.3);
    }

    for (const [id, v] of propViews) {
        if (!s.props[id]) { scene.remove(v.group); propViews.delete(id); }
    }
    for (const id in s.props) {
        const pr = s.props[id];
        const v = propViews.get(pr.id) ?? buildPropView(pr);
        v.group.position.y = pr.y + zoneOffset;
        if (v.rotor) v.rotor.rotation.z = sim.world.getRigidBody(pr.rotor).rotation();
    }

    const live = new Set();
    for (const ball of s.balls) {
        live.add(ball.body);
        const v = ballViews.get(ball.body) ?? buildBallView(ball.body);
        const body = sim.world.getRigidBody(ball.body);
        const p = body.translation(), vel = body.linvel();
        if (bounced.has(ball.body)) {
            // The push of the bounce is the change in velocity; squash along it.
            const dx = vel.x - v.prev.x, dy = vel.y - v.prev.y;
            if (Math.hypot(dx, dy) > 1) { v.squashT = 0; v.normal = Math.atan2(dy, dx); }
        }
        v.prev.x = vel.x; v.prev.y = vel.y;
        const prev = (phase === 'play' || phase === 'settle') ? prevBallPos.get(ball.body) : null;
        if (prev) v.group.position.set(prev[0] + (p.x - prev[0]) * stepAlpha, prev[1] + (p.y - prev[1]) * stepAlpha, 0.4);
        else v.group.position.set(p.x, p.y, 0.4);
        shapeBall(v, vel, frameDt);
    }
    bounced.clear();
    for (const [h, v] of ballViews) if (!live.has(h)) { scene.remove(v.group); ballViews.delete(h); }


    for (let i = floaters.length - 1; i >= 0; i--) {
        const f = floaters[i];
        f.t += frameDt;
        f.m.position.y += frameDt * 0.9;
        f.m.material.opacity = Math.max(0, 1 - f.t / 0.9);
        if (f.t > 0.9) { scene.remove(f.m); f.m.material.map.dispose(); floaters.splice(i, 1); }
    }

    hud.depth.textContent = s.depth;
    hud.balls.textContent = s.supply;
    hud.volleyBox.hidden = s.volley <= 1;
    hud.volley.textContent = s.volley;
}

function consumeEvents() {
    for (const e of sim.events) {
        if (e.t === 'gain') addFloater(`+${e.n}`, e.x, e.y + 0.3);
        else if (e.t === 'contact') {
            bounced.add(e.ball);
            if (e.with === 'block') { const v = blockViews.get(e.id); if (v) v.wobbleT = 0; }
        } else if (e.t === 'jelly') {
            const v = blockViews.get(e.id);
            if (v && !(v.wobbleT < 0.12)) { v.wobbleT = 0; v.wobbleDir = e.dir; }   // one wobble per cell crossing, not a flicker
        } else if (e.t === 'smash') shake = Math.min(0.16, shake + e.speed * 0.015);
    }
    sim.events.length = 0;
}

// ---------- aim guide ----------

const tmpMatrix = new THREE.Matrix4();
const dotInk = new THREE.Color(), dotFade = new THREE.Color(), dotHit = new THREE.Color(), dotColor = new THREE.Color();
const dotPos = [];
let guideAngle = null;

// On slower phones a guide can take a while to work out. If the last one was slow,
// skip a frame before the next, so aiming stays responsive. The shot always fires
// the angle the guide on screen was drawn for.
let guideCost = 0, guideSkip = 0;
let lastContacts = [];
function drawGuide(angle) {
    if (angle === guideAngle) return;
    if (guideSkip > 0) { guideSkip -= 1; return; }
    const t0 = performance.now();
    guideAngle = angle;
    const result = predict(sim, angle);
    // Stop the guide at the bottom of the field, where the ball leaves.
    const cut = result.path.findIndex(([, y]) => y < -H);
    const path = cut > 0 ? result.path.slice(0, cut) : result.path;
    const contacts = result.contacts.filter((c) => c.y >= -H);
    lastContacts = contacts;
    let n = 0, carry = 0;
    const gap = 0.26;
    for (let i = 1; i < path.length && n < MAX_DOTS; i++) {
        const [x0, y0] = path[i - 1], [x1, y1] = path[i];
        const seg = Math.hypot(x1 - x0, y1 - y0);
        let t = gap - carry;
        while (t <= seg && n < MAX_DOTS) {
            const f = t / seg;
            const x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f;
            dotPos[n] = [x, y];
            tmpMatrix.makeTranslation(x, y, 0.45);
            dots.setMatrixAt(n++, tmpMatrix);
            t += gap;
        }
        carry = seg - (t - gap);
    }
    dots.count = n;
    // The last third of the line fades out instead of stopping dead.
    for (let i = 0; i < n; i++) {
        const f = Math.max(0, (i / n - 0.66) / 0.34);
        dots.setColorAt(i, dotColor.copy(dotInk).lerp(dotFade, f * 0.85));
    }
    // Hit points: the dot nearest each contact moves onto it, grows and changes colour.
    for (const c of contacts) {
        let best = -1, bestD = Infinity;
        for (let i = 0; i < n; i++) {
            const d = Math.hypot(dotPos[i][0] - c.x, dotPos[i][1] - c.y);
            if (d < bestD) { bestD = d; best = i; }
        }
        if (best < 0) continue;
        tmpMatrix.makeScale(1.9, 1.9, 1).setPosition(c.x, c.y, 0.46);
        dots.setMatrixAt(best, tmpMatrix);
        dots.setColorAt(best, dotHit);
    }
    dots.instanceMatrix.needsUpdate = true;
    if (dots.instanceColor) dots.instanceColor.needsUpdate = true;
    guideCost = guideCost * 0.7 + (performance.now() - t0) * 0.3;
    guideSkip = guideCost > 9 ? 1 : 0;
}

function hideGuide() {
    guideAngle = null;
    dots.count = 0;
}

// ---------- input ----------

let phase = 'loading';  // aim | play | settle | descend | over
let aiming = false;
let aimAngle = -2.2;      // what the barrel and guide show (smoothed)
let aimTarget = -2.2;     // where the finger points
let aimCancel = false;
// Steadier aiming: the shown angle eases toward the finger and snaps to small
// steps, so tiny twitches don't make the guide jump around.
const AIM_EASE = 18;           // higher = follows the finger faster
const AIM_STEP = 0.0025;       // about 0.15°
const shownAngle = () => Math.round(aimAngle / AIM_STEP) * AIM_STEP;
let fastForward = false;
const MIN_ANGLE = -Math.PI + 0.04, MAX_ANGLE = -0.04;
const CANCEL_RADIUS = 0.55;

function toWorld(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector3(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1, 0);
    v.unproject(camera);
    return v;
}

// Returns an angle, or null when the pointer is on the launcher (cancel).
function angleFrom(ev) {
    const p = toWorld(ev);
    const dx = p.x - LAUNCHER.x, dy = p.y - LAUNCHER.y;
    if (Math.hypot(dx, dy) < CANCEL_RADIUS) return null;
    let a = Math.atan2(dy, dx);
    if (a > 0) a = a > Math.PI / 2 ? MIN_ANGLE : MAX_ANGLE;   // pointing up: pin to the nearest side
    return Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, a));
}

const canvas = renderer.domElement;
canvas.addEventListener('pointerdown', (ev) => {
    canvas.setPointerCapture(ev.pointerId);
    if (phase === 'over') { restart(); return; }
    if (phase === 'aim') {
        aiming = true;
        hideNote();                             // read it already; don't let it cover the guide
        updateAim(ev);
        if (!aimCancel) aimAngle = aimTarget;   // first touch jumps straight there
        return;
    }
    if (phase === 'play' || phase === 'settle') fastForward = true;
});
canvas.addEventListener('pointermove', (ev) => { if (aiming) updateAim(ev); });
canvas.addEventListener('pointerup', (ev) => {
    fastForward = false;
    if (!aiming) return;
    aiming = false;
    const drawn = guideAngle ?? shownAngle();   // the angle the guide on screen was drawn for
    hideGuide();
    if (angleFrom(ev) === null || phase !== 'aim') return;
    sim.fire(drawn);
    phase = 'play';
    $('hint').hidden = true;
    hideNote();
});
canvas.addEventListener('pointercancel', () => { aiming = false; fastForward = false; hideGuide(); });

function updateAim(ev) {
    const a = angleFrom(ev);
    aimCancel = a === null;
    if (aimCancel) { hideGuide(); return; }
    aimTarget = a;
}

function easeAim(frameDt) {
    aimAngle += (aimTarget - aimAngle) * (1 - Math.exp(-frameDt * AIM_EASE));
    barrelPivot.rotation.z = shownAngle();
}

// ---------- callouts ----------
// A zone's one-line note points at the thing it's about, instead of covering the top.

const note = $('note');
let noteShown = false;
function noteTargetPoint() {
    const t = sim.s.noteTarget;
    if (t?.kind === 'open') return { x: 2.6, y: -1.2, r: 0 };   // the empty top-left, clear of the launcher
    if (!t || t.kind === 'launcher') return { x: LAUNCHER.x, y: LAUNCHER.y, r: 0.45 };
    if (t.kind === 'block' && sim.s.blocks[t.id]) {
        const p = sim.world.getRigidBody(sim.s.blocks[t.id].body).translation();
        return { x: p.x, y: p.y, r: 0.7 };
    }
    if (t.kind === 'prop' && sim.s.props[t.id]) {
        const pr = sim.s.props[t.id];
        return pr.kind === 'mushroom' ? { x: pr.x, y: pr.y + 0.45, r: 0.5 } : { x: pr.x, y: pr.y, r: 0.95 };
    }
    return null;
}
function placeNote() {
    const t = noteTargetPoint();
    if (!t) { hideNote(); return; }
    const c = window.__boop.toScreen(t.x, t.y);
    const edge = window.__boop.toScreen(t.x + t.r, t.y);
    const rPx = Math.abs(edge.x - c.x);
    const w = note.offsetWidth, h = note.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight, gutter = 16, gap = 12;
    const hudBottom = 72;                       // keep clear of the HUD
    const below = c.y - rPx - gap - h < hudBottom;   // above when it fits, otherwise below
    const left = Math.min(vw - gutter - w, Math.max(gutter, c.x - w / 2));
    const top = below ? c.y + rPx + gap : c.y - rPx - gap - h;
    note.style.left = `${left}px`;
    note.style.top = `${top}px`;
    note.style.setProperty('--arrow-x', `${Math.min(w - 18, Math.max(18, c.x - left))}px`);
    note.classList.toggle('below', below);
}
function showNote(text) {
    note.textContent = text;
    note.hidden = false;
    noteShown = true;
    placeNote();
}
function hideNote() {
    note.hidden = true;
    noteShown = false;
}

// ---------- turn flow ----------

let acc = 0, settleSteps = 0, descendT = 0, shake = 0;
// Ball positions before the latest step, so drawing can glide between steps.
const prevBallPos = new Map();
let stepAlpha = 1;

function showMessage(title, body) {
    hud.msgTitle.textContent = title;
    hud.msgBody.textContent = body;
    hud.msg.hidden = false;
}

function readBest() { try { return Number(localStorage.getItem('boop-best-depth')) || 0; } catch { return 0; } }
function writeBest(d) { try { localStorage.setItem('boop-best-depth', String(d)); } catch { /* storage blocked */ } }

function gameOver() {
    const d = sim.s.depth, best = Math.max(readBest(), d);
    writeBest(best);
    phase = 'over';
    showMessage(`Out of balls at depth ${d}`, `Best: ${best}. Tap to play again.`);
}

function startZone() {
    sim.genZone();
    zoneOffset = -H;
    descendT = 0;
    phase = 'descend';
}

function endTurn() {
    if (sim.blockCount() === 0) { startZone(); return; }
    settleSteps = 0;
    phase = 'settle';
}

function readyToAim() {
    sim.crumbleLeftovers();
    consumeEvents();
    if (sim.blockCount() === 0) { startZone(); return; }   // cleared, or the last scraps crumbled
    if (sim.s.supply <= 0) { gameOver(); return; }
    phase = 'aim';
}

function restart() {
    hud.msg.hidden = true;
    if (sim) sim.free();
    for (const v of blockViews.values()) scene.remove(v.group);
    for (const g of pickupViews.values()) scene.remove(g);
    for (const v of propViews.values()) scene.remove(v.group);
    for (const v of ballViews.values()) scene.remove(v.group);
    blockViews.clear(); pickupViews.clear(); propViews.clear(); ballViews.clear();
    sim = Sim.create(RAPIER, (Math.random() * 2 ** 31) | 0);
    startZone();
}

function tick(frameDt) {
    if (phase === 'descend') {
        descendT += frameDt;
        const t = Math.min(1, descendT / DESCEND_TIME);
        zoneOffset = -H * (1 - t) ** 3;
        if (t >= 1) {
            zoneOffset = 0;
            // First time something new shows up, say what it does in one line.
            if (sim.s.note) showNote(sim.s.note);
            readyToAim();
        }
        return;
    }
    if (phase !== 'play' && phase !== 'settle') return;

    const s = sim.s;
    const fewLeft = phase === 'play' && !(s.shots && s.shots.left > 0) && s.turnSteps > AUTO_FAST_AFTER;
    acc += frameDt * (fastForward ? FAST_FORWARD : fewLeft ? AUTO_FAST : 1);
    let n = 0;
    while (acc >= DT && n < 30) {
        acc -= DT; n++;
        prevBallPos.clear();
        for (const b of s.balls) { const t = sim.world.getRigidBody(b.body).translation(); prevBallPos.set(b.body, [t.x, t.y]); }
        sim.step();
        if (phase === 'play' && sim.turnDone()) { endTurn(); break; }
        if (phase === 'settle' && (sim.settled() || ++settleSteps > MAX_SETTLE_STEPS)) { readyToAim(); break; }
    }
    if (n >= 30) acc = 0;   // tab was in the background; don't try to catch up
    // How far we are toward the next step: draw balls that far between their last two positions.
    // Without this, screens faster than the physics (90/120 Hz) show balls moving in uneven hops.
    stepAlpha = Math.min(1, acc / DT);
    consumeEvents();
}

let last = performance.now();
let slowFrames = 0, timedFrames = 0;
function watchFrameRate(rawDt) {
    // Over each 60 frames, if half or more missed ~45fps, drop to the next resolution step.
    timedFrames += 1;
    if (rawDt > 1 / 45) slowFrames += 1;
    if (timedFrames < 60) return;
    if (slowFrames >= 30 && pixelStep < PIXEL_RATIOS.length - 1) {
        pixelStep += 1;
        renderer.setPixelRatio(PIXEL_RATIOS[pixelStep]);
        fitCamera();
    }
    slowFrames = 0;
    timedFrames = 0;
}
function frame(now) {
    const rawDt = (now - last) / 1000;
    const frameDt = Math.min(0.05, rawDt);
    last = now;
    if (!document.hidden && rawDt < 0.5) watchFrameRate(rawDt);
    if (sim) {
        tick(frameDt);
        if (aiming && phase === 'aim') {
            easeAim(frameDt);
            if (!aimCancel) drawGuide(shownAngle());
        }
        if (noteShown) placeNote();
        syncView(frameDt);
    }
    // Short shake when a tumbling block lands hard.
    shake = Math.max(0, shake - frameDt * 0.6);
    camera.position.set((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
}

// ---------- light / dark ----------
// Follows the system setting until the player picks one; the pick is remembered.

const themeButton = $('theme-toggle');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
function readThemePick() { try { return localStorage.getItem('boop-theme'); } catch { return null; } }
function writeThemePick(v) { try { localStorage.setItem('boop-theme', v); } catch { /* storage blocked */ } }

function applyTheme(name) {
    theme = THEMES[name];
    document.documentElement.dataset.theme = name;
    renderer.setClearColor(theme.paper);
    fieldMat.color.setHex(theme.field);
    lineMat.color.setHex(theme.line);
    outlineMat.color.setHex(theme.edge);
    ballMat.color.setHex(theme.ball);
    dotInk.setHex(theme.line);
    dotFade.setHex(theme.field);
    dotHit.setHex(theme.hit);
    JELLO.text = theme.jelloText;
    for (const v of blockViews.values()) {
        v.mesh.material.uniforms.uInk.value.setHex(theme.edge);
        if (v.jello) { v.label.userData.color = theme.jelloText; drawLabel(v.label, String(v.hp)); }
    }
    for (const g of pickupViews.values()) { g.userData.label.userData.color = theme.text; drawLabel(g.userData.label, '+1'); }
    const next = name === 'dark' ? 'light' : 'dark';
    themeButton.textContent = next === 'dark' ? 'Dark mode' : 'Light mode';
    themeButton.setAttribute('aria-label', `Switch to ${next} mode`);
    guideAngle = null;   // redraw the guide in the new colours
}
const currentTheme = () => readThemePick() ?? (systemDark.matches ? 'dark' : 'light');
systemDark.addEventListener('change', () => { if (!readThemePick()) applyTheme(currentTheme()); });
themeButton.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    writeThemePick(next);
    applyTheme(next);
});
applyTheme(currentTheme());

// ---------- start screen ----------
// The first zone builds behind the start screen; Play just lifts the screen.

const menu = $('menu'), howto = $('howto');
function showScreen(which, moveFocus = true) {
    menu.hidden = which !== 'menu';
    howto.hidden = which !== 'howto';
    document.body.classList.toggle('howto-open', which === 'howto');
    if (which === 'menu') {
        const best = readBest();
        $('menu-best').hidden = best === 0;
        $('menu-best').textContent = `Best depth: ${best}`;
        if (moveFocus) $('btn-play').focus();
    } else if (which === 'howto') {
        howto.scrollTop = 0;
        $('btn-howto-back').focus();
    }
}
function play() { showScreen(null); }
$('btn-play').addEventListener('click', play);
$('btn-howto-play').addEventListener('click', play);
$('btn-howto').addEventListener('click', () => showScreen('howto'));
$('btn-howto-back').addEventListener('click', () => showScreen('menu'));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !howto.hidden) showScreen('menu'); });

await RAPIER.init();
await document.fonts.load('800 64px Manrope').catch(() => {});
restart();
showScreen('menu', false);
requestAnimationFrame(frame);

// For automated checks.
window.__boop = {
    get sim() { return sim; },
    get phase() { return phase; },
    get aim() { return shownAngle(); },
    get pixelRatio() { return renderer.getPixelRatio(); },
    get guide() { return { angle: guideAngle, contacts: lastContacts, cost: guideCost }; },
    // Screen position of a point in the field, so tests can aim with real pointer input.
    toScreen(x, y) {
        const v = new THREE.Vector3(x, y, 0).project(camera);
        const r = renderer.domElement.getBoundingClientRect();
        return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
    },
};
