// Boop gray-box: rendering, input and turn flow. Physics and rules live in sim.js.
import * as THREE from 'three';
import RAPIER from 'rapier';
import { Sim, predict, W, H, DT, LAUNCHER, BALL_R, BASKET } from './sim.js';

const COLORS = {
    paper: 0xf1e8d2, field: 0xfbf6ea, ink: 0x2b2622, ball: 0xfffdf7,
    jello: 0xa9dccf, jelloEdge: 0xb2ada4, mushroom: 0xe06b4a, stem: 0xf3e3c3, windmill: 0xf2c14e,
    // Fill by number: low → high. Crayon-ish, all readable with ink numbers.
    tiers: [
        [4, 0x9cc77a], [12, 0xf2c14e], [25, 0xf0954b], [50, 0xe06b4a], [Infinity, 0xb85a4a],
    ],
};
const tierColor = (hp) => COLORS.tiers.find(([max]) => hp <= max)[1];

const MAX_SETTLE_STEPS = 180;
const DESCEND_TIME = 0.9;
const FAST_FORWARD = 3;

const $ = (id) => document.getElementById(id);
const hud = {
    depth: $('hud-depth'), balls: $('hud-balls'), volley: $('hud-volley'),
    msg: $('message'), msgTitle: $('message-title'), msgBody: $('message-body'),
};

// ---------- three.js setup ----------

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(COLORS.paper);
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
const outlineMat = mat(COLORS.ink);
const ballMat = mat(COLORS.ball);

const fieldMesh = new THREE.Mesh(unitSquare, mat(COLORS.field));
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
const launcherBody = new THREE.Mesh(unitCircle, outlineMat);
launcherBody.scale.setScalar(0.34);
const barrelPivot = new THREE.Group();
barrelPivot.add(rect(0.62, 0.2, outlineMat, 0.31));
launcher.add(launcherBody, barrelPivot);
launcher.position.set(LAUNCHER.x, LAUNCHER.y, 0.5);
barrelPivot.rotation.z = -2.2;
scene.add(launcher);

// Catch basket: an open U in ink.
const basket = new THREE.Group();
{
    const { half, wall, depth } = BASKET;
    basket.add(
        rect(half * 2, wall * 2, outlineMat, 0, -depth / 2),
        rect(wall * 2, depth, outlineMat, -half + wall, 0),
        rect(wall * 2, depth, outlineMat, half - wall, 0),
    );
}
scene.add(basket);

// Aim guide: dots along the predicted path, and a half circle at each bounce.
// The flat side sits on the surface the ball hits; the dome points back out.
const MAX_DOTS = 260;
const dots = new THREE.InstancedMesh(new THREE.CircleGeometry(0.055, 10), mat(COLORS.ink, { transparent: true, opacity: 0.75 }), MAX_DOTS);
dots.count = 0;
dots.frustumCulled = false;   // instances move every aim; the cached bounds would hide them
scene.add(dots);
const markers = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(halfCircle, outlineMat);
    m.scale.setScalar(0.15);
    m.visible = false;
    scene.add(m);
    return m;
});

// ---------- text labels ----------

function makeLabel(text, color = '#2b2622') {
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
const ballViews = new Map();    // body handle → group
const pickupViews = new Map();  // id → group
const propViews = new Map();    // id → { group, rotor? }
const floaters = [];            // "+1" labels drifting up
let zoneOffset = 0;             // visual slide used when a new zone comes up

// Jello is drawn opaque in pale colours: see-through fills would show the seams between cells.
const jelloOutlineMat = mat(COLORS.jelloEdge);

function buildBlockView(b) {
    const group = new THREE.Group();
    const fillMat = mat(b.jello ? COLORS.jello : tierColor(b.hp));
    const outlines = [], fills = [];
    for (const [x, y] of b.cells) {
        const o = new THREE.Mesh(unitSquare, b.jello ? jelloOutlineMat : outlineMat);
        const f = new THREE.Mesh(unitSquare, fillMat);
        o.position.set(x, y, 0);
        f.position.set(x, y, 0.1);
        outlines.push(o); fills.push(f);
        group.add(o, f);
    }
    // Put the number on the cell closest to the block's centre.
    let best = b.cells[0], bestD = Infinity;
    for (const c of b.cells) { const d = c[0] ** 2 + c[1] ** 2; if (d < bestD) { bestD = d; best = c; } }
    const label = makeLabel(String(b.hp));
    label.userData.cell = best;
    label.position.z = 0.2;
    group.add(label);
    scene.add(group);
    const v = { group, fills, outlines, label, fillMat, hp: -1, punch: 0, cells: b.cells, jello: b.jello };
    blockViews.set(b.id, v);
    return v;
}

function updateBlockView(v, b, frameDt) {
    const k = b.scale;
    if (v.hp !== b.hp) {
        if (v.hp !== -1) v.punch = 1;
        v.hp = b.hp;
        drawLabel(v.label, String(b.hp));
        if (!v.jello) v.fillMat.color.setHex(tierColor(b.hp));
    }
    v.cells.forEach(([x, y], i) => {
        v.outlines[i].position.set(x * k, y * k, 0);
        v.outlines[i].scale.setScalar(k + (v.jello ? 0.05 : 0.09));
        v.fills[i].position.set(x * k, y * k, 0.1);
        v.fills[i].scale.setScalar(k);
    });
    const [lx, ly] = v.label.userData.cell;
    v.label.position.set(lx * k, ly * k, 0.2);
    v.label.scale.setScalar(Math.max(0.62, k * 0.92));
    v.punch = Math.max(0, v.punch - frameDt * (v.jello ? 3 : 8));
    if (v.jello) {
        // Jello wobbles: squash one way, stretch the other, fading out.
        const w = Math.sin(performance.now() / 45) * 0.08 * v.punch;
        v.group.scale.set(1 + w, 1 - w, 1);
    } else {
        v.group.scale.setScalar(1 + 0.07 * v.punch);
    }
}

function buildPickupView(pk) {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.27, 28), outlineMat);
    const label = makeLabel('+1');
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
    const m = makeLabel(text, '#2b2622');
    m.scale.setScalar(0.55);
    m.position.set(x, y, 0.8);
    m.material.opacity = 1;
    scene.add(m);
    floaters.push({ m, t: 0 });
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
        v.group.position.set(p.x, p.y + zoneOffset, b.falling ? 0.3 : 0);
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
        let m = ballViews.get(ball.body);
        if (!m) {
            m = new THREE.Group();
            const o = new THREE.Mesh(unitCircle, outlineMat); o.scale.setScalar(BALL_R);
            const f = new THREE.Mesh(unitCircle, ballMat); f.scale.setScalar(BALL_R - 0.045); f.position.z = 0.01;
            m.add(o, f);
            scene.add(m);
            ballViews.set(ball.body, m);
        }
        const p = sim.world.getRigidBody(ball.body).translation();
        m.position.set(p.x, p.y, 0.4);
    }
    for (const [h, m] of ballViews) if (!live.has(h)) { scene.remove(m); ballViews.delete(h); }

    const bp = sim.world.getRigidBody(s.basket.body).translation();
    basket.position.set(bp.x, bp.y, 0.2);

    for (let i = floaters.length - 1; i >= 0; i--) {
        const f = floaters[i];
        f.t += frameDt;
        f.m.position.y += frameDt * 0.9;
        f.m.material.opacity = Math.max(0, 1 - f.t / 0.9);
        if (f.t > 0.9) { scene.remove(f.m); f.m.material.map.dispose(); floaters.splice(i, 1); }
    }

    hud.depth.textContent = s.depth;
    hud.balls.textContent = s.supply;
    hud.volley.textContent = Math.min(s.volley, Math.max(0, s.supply));
}

function consumeEvents() {
    for (const e of sim.events) {
        if (e.t === 'gain') addFloater(`+${e.n}`, e.x, e.y + 0.3);
    }
    sim.events.length = 0;
}

// ---------- aim guide ----------

const tmpMatrix = new THREE.Matrix4();
let guideAngle = null;

function drawGuide(angle) {
    if (angle === guideAngle) return;
    guideAngle = angle;
    const { path, contacts } = predict(sim, angle);
    let n = 0, carry = 0;
    const gap = 0.26;
    for (let i = 1; i < path.length && n < MAX_DOTS; i++) {
        const [x0, y0] = path[i - 1], [x1, y1] = path[i];
        const seg = Math.hypot(x1 - x0, y1 - y0);
        let t = gap - carry;
        while (t <= seg && n < MAX_DOTS) {
            const f = t / seg;
            tmpMatrix.makeTranslation(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, 0.45);
            dots.setMatrixAt(n++, tmpMatrix);
            t += gap;
        }
        carry = seg - (t - gap);
    }
    dots.count = n;
    dots.instanceMatrix.needsUpdate = true;
    markers.forEach((m, i) => {
        const c = contacts[i];
        m.visible = !!c;
        if (!c) return;
        // Ball centre minus one radius along the normal = the surface point.
        m.position.set(c.x - c.nx * BALL_R, c.y - c.ny * BALL_R, 0.45);
        m.rotation.z = Math.atan2(c.ny, c.nx) - Math.PI / 2;   // dome (+y) faces along the normal
    });
}

function hideGuide() {
    guideAngle = null;
    dots.count = 0;
    markers.forEach((m) => { m.visible = false; });
}

// ---------- input ----------

let phase = 'loading';  // aim | play | settle | descend | over
let aiming = false;
let aimAngle = -2.2;
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
    if (phase === 'aim') { aiming = true; updateAim(ev); return; }
    if (phase === 'play' || phase === 'settle') fastForward = true;
});
canvas.addEventListener('pointermove', (ev) => { if (aiming) updateAim(ev); });
canvas.addEventListener('pointerup', (ev) => {
    fastForward = false;
    if (!aiming) return;
    aiming = false;
    const a = angleFrom(ev);
    hideGuide();
    if (a === null || phase !== 'aim') return;
    aimAngle = a;
    sim.fire(a);
    phase = 'play';
    $('hint').hidden = true;
});
canvas.addEventListener('pointercancel', () => { aiming = false; fastForward = false; hideGuide(); });

function updateAim(ev) {
    const a = angleFrom(ev);
    if (a === null) { hideGuide(); return; }
    aimAngle = a;
    barrelPivot.rotation.z = a;
}

// ---------- turn flow ----------

let acc = 0, settleSteps = 0, descendT = 0;

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
    if (sim.s.supply <= 0) { gameOver(); return; }
    phase = 'aim';
}

function restart() {
    hud.msg.hidden = true;
    if (sim) sim.free();
    for (const v of blockViews.values()) scene.remove(v.group);
    for (const g of pickupViews.values()) scene.remove(g);
    for (const v of propViews.values()) scene.remove(v.group);
    for (const m of ballViews.values()) scene.remove(m);
    blockViews.clear(); pickupViews.clear(); propViews.clear(); ballViews.clear();
    sim = Sim.create(RAPIER, (Math.random() * 2 ** 31) | 0);
    startZone();
}

function tick(frameDt) {
    if (phase === 'descend') {
        descendT += frameDt;
        const t = Math.min(1, descendT / DESCEND_TIME);
        zoneOffset = -H * (1 - t) ** 3;
        if (t >= 1) { zoneOffset = 0; readyToAim(); }
        return;
    }
    if (phase !== 'play' && phase !== 'settle') return;

    acc += frameDt * (fastForward ? FAST_FORWARD : 1);
    let n = 0;
    while (acc >= DT && n < 30) {
        acc -= DT; n++;
        sim.step();
        if (phase === 'play' && sim.turnDone()) { endTurn(); break; }
        if (phase === 'settle' && (sim.settled() || ++settleSteps > MAX_SETTLE_STEPS)) { readyToAim(); break; }
    }
    if (n >= 30) acc = 0;   // tab was in the background; don't try to catch up
    consumeEvents();
}

let last = performance.now();
function frame(now) {
    const frameDt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (sim) {
        tick(frameDt);
        if (aiming && phase === 'aim') drawGuide(aimAngle);
        syncView(frameDt);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
}

await RAPIER.init();
await document.fonts.load('800 64px Manrope').catch(() => {});
restart();
requestAnimationFrame(frame);

// For automated checks.
window.__boop = { get sim() { return sim; }, get phase() { return phase; } };
