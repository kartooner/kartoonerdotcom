// Boop!: the game loop, rendering of the board, input and turn flow.
// Physics and rules: sim.js. Drawing helpers: blockshader.js, sketch.js, balls.js, labels.js. Colours: theme.js.
import * as THREE from 'three';
import RAPIER from 'rapier';
import { Sim, predict, W, H, DT, LAUNCHER, BALL_R } from './sim.js';
import { makeBlockMesh, tierFor, JELLO, NEUTRAL } from './blockshader.js';
import { makeSketch, SHAPE, setSketchInk, forgetSketch, makeFieldMaterial } from './sketch.js';
import { THEMES, COLORS } from './theme.js';
import { makeLabel as labelMesh, drawLabel } from './labels.js';
import { makeBallView, shapeBall } from './balls.js';
import { makeCrumbs } from './crumbs.js';
import './buddy.js';               // the mascot's blinks and glances

// Must match data-build on the page. If they differ, the browser has mixed a cached
// page with newer scripts (or the reverse): reload once to get a matching set.
const BUILD = '1.0.11';
if (document.documentElement.dataset.build !== BUILD) {
    let tried = false;
    try { tried = sessionStorage.getItem('boop-reload') === BUILD; sessionStorage.setItem('boop-reload', BUILD); } catch { /* storage blocked */ }
    if (!tried) { location.reload(); throw new Error('Boop: page and scripts out of step, reloading'); }
}

let theme = THEMES.light;
const makeLabel = (text, color = theme.text, style) => labelMesh(text, color, style);
const bounced = new Set();      // balls that hit something since the last frame
const fadingBalls = [];         // balls whose shot just ended, shrinking away
function buildBallView(handle) {
    const v = makeBallView(outlineMat, ballMat);
    scene.add(v.group);
    ballViews.set(handle, v);
    return v;
}

const MAX_SETTLE_STEPS = 360;        // tumbling blocks get up to 3s to come to rest
const DESCEND_TIME = 0.9;

const $ = (id) => document.getElementById(id);
const hud = {
    depth: $('hud-depth'), shots: $('hud-shots'), volley: $('hud-volley'), par: $('hud-par'), parBox: $('hud-par-box'), progress: $('progress-fill'),
};

// ---------- three.js setup ----------

const renderer = new THREE.WebGLRenderer({ antialias: true });
// Resolution steps down if frames run slow (the hand-drawn block shader runs on every pixel).
const PIXEL_RATIOS = [2, 1.5, 1].filter((r) => r <= Math.max(1, window.devicePixelRatio));
let pixelStep = 0;
renderer.setPixelRatio(PIXEL_RATIOS[0]);

$('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const crumbs = makeCrumbs(scene);   // crayon bits when a block pops
const camera = new THREE.OrthographicCamera(0, W, 0, -H, -10, 10);

function fitCamera() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    const pad = 0.25, bottomPx = 44;            // bottom: room for the Games / theme links
    const hudW = 200, hudGap = 28;
    // Wide screens (a tablet or laptop sideways): the board is limited by height, so put
    // the HUD in a column beside it and give the board the full height.
    const wideScale = (h - 16 - bottomPx) / (H + pad * 2);
    const wideBoard = (W + 0.16) * wideScale;
    const wide = w > h * 1.05 && (w - wideBoard) / 2 >= hudW + hudGap + 16;
    document.body.classList.toggle('wide', wide);
    // Otherwise the field sits just below the HUD, using the HUD's real height.
    const hudEl = document.getElementById('hud');
    const topPx = wide ? 16 : (hudEl ? hudEl.getBoundingClientRect().bottom : 60) + 10;
    const scale = Math.min(w / (W + pad * 2), (h - topPx - bottomPx) / (H + pad * 2));   // px per cell
    const vw = w / scale, vh = h / scale;
    const top = pad + topPx / scale;            // view top, in cells above the field's top edge
    camera.left = W / 2 - vw / 2; camera.right = W / 2 + vw / 2;
    camera.top = top; camera.bottom = top - vh;
    camera.updateProjectionMatrix();
    // The HUD and the links under the field line up with the field's frame, edge to edge.
    const boardPx = (W + 0.16) * scale;
    const boardLeft = (w - boardPx) / 2;
    const root = document.documentElement.style;
    root.setProperty('--board-w', `${boardPx}px`);
    root.setProperty('--board-left', `${boardLeft}px`);
    root.setProperty('--board-top', `${topPx + pad * scale}px`);
    root.setProperty('--hud-left', `${boardLeft - hudW - hudGap}px`);
}
window.addEventListener('resize', fitCamera);
fitCamera();

const mat = (color, opts = {}) => new THREE.MeshBasicMaterial({ color, ...opts });
const unitSquare = new THREE.PlaneGeometry(1, 1);
const unitCircle = new THREE.CircleGeometry(1, 32);
const lineMat = mat(0);         // marks on the field
const outlineMat = mat(0);      // edges on blocks, props and balls
const ballMat = mat(0);
const fieldMat = makeFieldMaterial(H);   // field colour plus faint crayon hatching low down

const fieldMesh = new THREE.Mesh(unitSquare, fieldMat);
fieldMesh.scale.set(W, H, 1);
fieldMesh.position.set(W / 2, -H / 2, -1);
scene.add(fieldMesh);

// A hand-drawn frame around the playfield, so it reads as a board someone sketched.
const boardFrame = makeSketch({ kind: SHAPE.BOX, size: [W / 2 + 0.05, H / 2 + 0.05], round: 0.06, edge: 0.09,
    filled: false, role: 'line', wob: 0.8, margin: 0.25, seed: 7 });
boardFrame.position.set(W / 2, -H / 2, -0.5);
boardFrame.renderOrder = 0;
scene.add(boardFrame);


// Launcher in the top-right corner.
const launcher = new THREE.Group();
const launcherBody = makeSketch({ kind: SHAPE.CIRCLE, size: [0.34], role: 'line', inkFill: true, wob: 0.6, seed: 3 });
const barrelPivot = new THREE.Group();
const barrel = makeSketch({ kind: SHAPE.BOX, size: [0.31, 0.1], round: 0.04, role: 'line', inkFill: true, wob: 0.35, seed: 5, margin: 0.12 });
barrel.position.x = 0.31;
barrelPivot.add(barrel);
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


// ---------- view of the sim ----------

let sim;
const blockViews = new Map();   // id → view
const ballViews = new Map();    // body handle → { group, inner, ... }
const pickupViews = new Map();  // id → group
const propViews = new Map();    // id → { group, rotor?, body? }
const fadingProps = [];
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
    const label = makeLabel(b.neutral ? '' : String(b.hp));
    label.userData.cell = best;
    label.position.z = 0.2;
    label.renderOrder = 2;
    label.visible = !b.neutral;
    group.add(label);
    if (b.neutral) {
        mesh.material.uniforms.uNeutral.value = 1;
        mesh.material.uniforms.uFill.value.setHex(NEUTRAL[themeName()]);
    }
    scene.add(group);
    const v = { group, mesh, label, hp: -1, punch: 0, jello: b.jello, neutral: b.neutral, big: b.cells.length >= 5, trail: [], cells: b.cells };
    blockViews.set(b.id, v);
    return v;
}

function updateBlockView(v, b, frameDt) {
    const u = v.mesh.material.uniforms;
    if (v.hp !== b.hp && !b.neutral) {
        if (v.hp !== -1) v.punch = 1;
        v.hp = b.hp;
        const look = b.jello ? JELLO : tierFor(b.hp / (sim.s.tierScale || 1));
        v.label.userData.color = look.text;
        drawLabel(v.label, String(b.hp));
        if (!b.jello) { u.uFill.value.setHex(look.fill); u.uPattern.value = look.pattern; }
    }
    const k = b.scale;
    u.uK.value = k;
    const [lx, ly] = v.label.userData.cell;
    v.label.position.set(lx * k, ly * k, 0.2);
    v.label.scale.setScalar(Math.max(0.62, k * 0.92) * (v.big ? 1.35 : 1));   // big blocks get bigger numbers
    v.punch = Math.max(0, v.punch - frameDt * (v.jello ? 3 : 8));
    v.wobbleT = (v.wobbleT ?? Infinity) + frameDt;
    if (v.jello) {
        // Jello wobbles hard each time a ball goes in or out, and keeps jiggling the whole
        // time a ball is inside, bulging around it. The ball's direction sets the squash axis.
        const inside = sim.s.balls.find((ball) => ball.jello.includes(b.id));
        v.pokeAmt = Math.max(0, Math.min(1, (v.pokeAmt ?? 0) + (inside ? 8 : -5) * frameDt));
        if (inside) {
            const bp = sim.world.getRigidBody(inside.body).translation();
            const k = b.scale;
            const lx = (bp.x - v.group.position.x) / k, ly = (bp.y - v.group.position.y) / k;
            u.uPoke.value.set(lx, ly, v.pokeAmt);
            // Leave a tunnel behind the ball: a new point every short step.
            const lastPt = v.trail[v.trail.length - 1];
            if (!lastPt || Math.hypot(lastPt[0] - lx, lastPt[1] - ly) > 0.1) {
                v.trail.push([lx, ly, 1]);
                if (v.trail.length > 10) v.trail.shift();
            }
        } else {
            u.uPoke.value.z = v.pokeAmt;
        }
        // The tunnel closes up over about two seconds.
        for (const pt of v.trail) pt[2] = Math.max(0, pt[2] - frameDt * 0.5);
        u.uTrail.value.forEach((vec, i) => { const pt = v.trail[i]; vec.set(pt ? pt[0] : 0, pt ? pt[1] : 0, pt ? pt[2] : 0); });
        const t = v.wobbleT;
        const kick = t < 0.7 ? Math.sin(t * 38) * Math.exp(-t * 6) * 0.13 : 0;
        const hum = Math.sin(performance.now() / 1000 * 34) * 0.07 * v.pokeAmt;
        const w = kick + hum;
        const across = Math.abs(Math.cos(v.wobbleDir ?? 0)) > 0.7 ? 1 : -1;   // sideways hit squashes the other way
        v.group.scale.set(1 + w * across, 1 - w * across, 1);
        u.uWobble.value = w;
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
    const ring = makeSketch({ kind: SHAPE.RING, size: [0.25], ring: 0.045, edge: 0, role: 'line', inkFill: true, wob: 0.35, seed: pk.id * 3.1, margin: 0.12 });
    const label = makeLabel('+1', theme.text, 'hand');
    group.userData.label = label;
    label.scale.setScalar(0.46);
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
        for (const rot of [0, Math.PI / 2]) {
            const arm = makeSketch({ kind: SHAPE.BOX, size: [0.89, 0.13], round: 0.05, edge: 0.05, wob: 0.35,
                fill: COLORS.windmill, seed: pr.id + rot * 4, margin: 0.12 });
            arm.rotation.z = rot;
            arm.position.z = rot ? 0.02 : 0;
            rotor.add(arm);
        }
        const pin = makeSketch({ kind: SHAPE.CIRCLE, size: [0.12], role: 'edge', inkFill: true, wob: 0.3, seed: pr.id + 9, margin: 0.08 });
        pin.position.z = 0.1;
        pin.renderOrder = 2;
        rotor.add(pin);
        group.add(rotor);
        group.position.set(pr.x, pr.y, 0.05);
        v.rotor = rotor;
    } else {
        // Mushroom: a stem and a domed cap, both hand-drawn with an ink edge.
        const stem = makeSketch({ kind: SHAPE.BOX, size: [0.16, pr.capY / 2 + 0.02], round: 0.04, edge: 0.05, wob: 0.35,
            fill: COLORS.stem, seed: pr.id, margin: 0.12 });
        stem.position.set(0, pr.capY / 2, 0);
        const cap = makeSketch({ kind: SHAPE.CAP, size: [pr.r + 0.03, (pr.r + 0.03) * 0.75], edge: 0.055, wob: 0.45,
            fill: COLORS.mushroom, seed: pr.id + 2, margin: 0.12 });
        cap.position.set(0, pr.capY - 0.04, 0.05);
        cap.renderOrder = 2;
        group.add(stem, cap);
        group.position.set(pr.x, pr.y, 0.05);
        v.body = pr.body;
    }
    scene.add(group);
    propViews.set(pr.id, v);
    return v;
}

function addFloater(text, x, y) {
    const m = makeLabel(text, theme.text, 'hand');
    m.scale.setScalar(0.62);
    m.position.set(x, y, 0.8);
    m.material.opacity = 1;
    m.material.depthWrite = false;   // never block see-through things (jello) behind it
    m.renderOrder = 5;
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
        v.group.position.set(p.x, p.y + zoneOffset, b.loose ? 0.05 : 0);
        v.group.rotation.z = body.rotation();
    }

    for (const [id, g] of pickupViews) {
        if (!s.pickups[id]) { scene.remove(g); forgetSketch(g); pickupViews.delete(id); }
    }
    for (const id in s.pickups) {
        const pk = s.pickups[id];
        const g = pickupViews.get(pk.id) ?? buildPickupView(pk);
        g.position.set(pk.x, pk.y + zoneOffset, 0.3);
    }

    for (const [id, v] of propViews) {
        if (s.props[id]) continue;
        propViews.delete(id);
        // A fallen mushroom fades out; anything else (a cleared zone) just goes.
        if (v.falling) fadingProps.push({ v, t: 0 });
        else { scene.remove(v.group); forgetSketch(v.group); }
    }
    for (let i = fadingProps.length - 1; i >= 0; i--) {
        const f = fadingProps[i];
        f.t += frameDt;
        const a = Math.max(0, 1 - f.t / 0.35);
        f.v.group.traverse((o) => { if (o.material?.uniforms?.uAlpha) o.material.uniforms.uAlpha.value = a; });
        if (a <= 0) { scene.remove(f.v.group); forgetSketch(f.v.group); fadingProps.splice(i, 1); }
    }
    for (const id in s.props) {
        const pr = s.props[id];
        const v = propViews.get(pr.id) ?? buildPropView(pr);
        v.group.position.y = pr.y + zoneOffset;
        if (v.rotor) v.rotor.rotation.z = sim.world.getRigidBody(pr.rotor).rotation();
        if (v.body != null) {
            const body = sim.world.getRigidBody(v.body);
            const p = body.translation();
            v.group.position.set(p.x, p.y + zoneOffset, 0.05);
            v.group.rotation.z = body.rotation();
            v.falling = pr.falling > 0;
        }
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
    // A ball whose shot is over shrinks and fades where it is, rather than blinking out.
    for (const [h, v] of ballViews) {
        if (live.has(h)) continue;
        ballViews.delete(h);
        v.group.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; } });
        fadingBalls.push({ group: v.group, t: 0 });
    }
    for (let i = fadingBalls.length - 1; i >= 0; i--) {
        const f = fadingBalls[i];
        f.t += frameDt;
        const k = Math.max(0, 1 - f.t / 0.3);
        f.group.scale.setScalar(k);
        f.group.traverse((o) => { if (o.material) o.material.opacity = k; });
        if (k <= 0) { scene.remove(f.group); fadingBalls.splice(i, 1); }
    }


    for (let i = floaters.length - 1; i >= 0; i--) {
        const f = floaters[i];
        f.t += frameDt;
        f.m.position.y += frameDt * 0.9;
        f.m.material.opacity = Math.max(0, 1 - f.t / 0.9);
        if (f.t > 0.9) { scene.remove(f.m); f.m.material.map.dispose(); floaters.splice(i, 1); }
    }

    hud.depth.textContent = s.depth;
    hud.shots.textContent = s.supply;
    hud.volley.textContent = s.volley > 1 ? `${s.volley} balls per shot` : '';
    const used = s.zoneShots ?? 0;
    hud.par.textContent = `${used}/${s.par ?? '-'}`;
    hud.parBox.classList.toggle('over', used > (s.par ?? Infinity));
    const done = s.zoneHp0 ? 1 - sim.hpLeft() / s.zoneHp0 : 0;
    hud.progress.style.transform = `scaleX(${Math.max(0, Math.min(1, done))})`;
}

function consumeEvents() {
    for (const e of sim.events) {
        if (e.t === 'gain') addFloater(`+${e.n}`, e.x, e.y + 0.3);
        else if (e.t === 'stretch') {
            // Last few blocks: hits count double. Say so once per device; a small mark every time.
            addFloater('Hits ×2', W / 2, -2.6);
            if (!sim.s.seen?.stretch) {
                sim.s.seen = { ...sim.s.seen, stretch: true };
                writeTips({ ...readTips(), stretch: true });
                sim.s.noteTarget = { kind: 'open' };
                showNote('Last few blocks: every hit counts double.');
            }
        } else if (e.t === 'pop' && e.popped) {
            const v = blockViews.get(e.id);
            if (v) {
                const u = v.mesh.material.uniforms;
                crumbs.burst(v.cells, e.x, e.y, v.group.rotation.z, u.uK.value, v.jello ? JELLO.fill : u.uFill.value, theme.edge);
            }
        } else if (e.t === 'contact') {
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
        // Solid ink near the launcher, tapering to grey toward the end.
        const f = Math.min(1, Math.max(0, (i / n - 0.2) / 0.7));
        dots.setColorAt(i, dotColor.copy(dotInk).lerp(dotFade, f * f * (3 - 2 * f)));
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

let phase = 'loading';  // aim | play | settle | cleared | descend | over
let aiming = false;
let aimAngle = -2.2;      // what the barrel and guide show (smoothed)
let aimTarget = -2.2;     // where the finger points
let aimCancel = false;
let runStarted = false;   // a shot has been fired this run (the start screen then offers Resume)
const finePointer = window.matchMedia('(pointer: fine)').matches;

// Keyboard aiming: ← → turn the launcher (hold Shift for fine aim), Space or Enter fires.
let keyAim = false;       // the guide is up because of the keyboard
let keyTurn = 0;          // -1 left, 1 right, 0 still
let keyFine = false;
const KEY_TURN = 0.9, KEY_TURN_FINE = 0.15;   // radians per second
function keyboardAim(dt) {
    if (!keyTurn) return;
    aimTarget = Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, aimTarget + keyTurn * (keyFine ? KEY_TURN_FINE : KEY_TURN) * dt));
}
// Steadier aiming: the shown angle eases toward the finger and snaps to small
// steps, so tiny twitches don't make the guide jump around.
const AIM_EASE = 18;           // higher = follows the finger faster
const AIM_STEP = 0.0025;       // about 0.15°
const shownAngle = () => Math.round(aimAngle / AIM_STEP) * AIM_STEP;
const MIN_ANGLE = -Math.PI + 0.04, MAX_ANGLE = -0.04;

// Aiming, "drag anywhere": touch anywhere on the field and drag in the direction you
// want to shoot. Your finger never has to sit on the guide, and the further you drag,
// the finer the aim. Release fires. A tap without a drag does nothing (nothing is aimed yet).
const AIM_START_PX = 8;          // movement needed before a drag counts as aiming
let dragStart = null;

function angleFromDrag(dx, dy) {
    let a = Math.atan2(-dy, dx);                                // screen y points down
    if (a > 0) a = a > Math.PI / 2 ? MIN_ANGLE : MAX_ANGLE;     // dragging upward: pin to the nearest side
    return Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, a));
}

const canvas = renderer.domElement;
canvas.tabIndex = 0;
canvas.setAttribute('role', 'application');
canvas.setAttribute('aria-label', 'Game board. Left and right arrows aim, Space fires, Escape pauses.');
canvas.addEventListener('pointerdown', (ev) => {
    canvas.setPointerCapture(ev.pointerId);
    if (phase === 'aim') {
        keyAim = false;
        aiming = true;
        aimCancel = true;                       // not aimed until the finger actually moves
        dragStart = { x: ev.clientX, y: ev.clientY };
        hideNote();                             // read it already; don't let it cover the guide
        return;
    }
});
canvas.addEventListener('pointermove', (ev) => { if (aiming) updateAim(ev); });
canvas.addEventListener('pointerup', () => {
    if (!aiming) return;
    aiming = false;
    const drawn = guideAngle ?? shownAngle();   // the angle the guide on screen was drawn for
    hideGuide();
    if (aimCancel || phase !== 'aim') return;
    fire(drawn);
});

function fire(angle) {
    sim.fire(angle);
    runStarted = true;
    phase = 'play';
    hideNote();
}
canvas.addEventListener('pointercancel', () => { aiming = false; hideGuide(); });

function updateAim(ev) {
    const dx = ev.clientX - dragStart.x, dy = ev.clientY - dragStart.y;
    const dist = Math.hypot(dx, dy);
    if (aimCancel) {
        if (dist < AIM_START_PX) return;
        aimCancel = false;
        aimTarget = aimAngle = angleFromDrag(dx, dy);    // first real movement: jump straight to the aim
        return;
    }
    // Once aiming, keep the last direction while the finger is very near its start point,
    // where tiny wobbles would swing the angle wildly.
    if (dist >= AIM_START_PX) aimTarget = angleFromDrag(dx, dy);
}

function easeAim(frameDt) {
    aimAngle += (aimTarget - aimAngle) * (1 - Math.exp(-frameDt * AIM_EASE));
    barrelPivot.rotation.z = shownAngle();
}

// ---------- callouts ----------
// A zone's one-line note points at the thing it's about, instead of covering the top.

const note = $('note'), buddy = $('buddy');
let noteShown = false;
function noteTargetPoint() {
    const t = sim.s.noteTarget;
    if (t?.kind === 'open') return { x: W / 2, y: -3.9, r: 0, buddy: true };   // the buddy, centred, below the pause and launcher
    if (!t || t.kind === 'launcher') return { x: LAUNCHER.x, y: LAUNCHER.y, r: 0.45 };
    if (t.kind === 'block' && sim.s.blocks[t.id]) {
        const p = sim.world.getRigidBody(sim.s.blocks[t.id].body).translation();
        return { x: p.x, y: p.y, r: 0.7 };
    }
    if (t.kind === 'prop' && sim.s.props[t.id]) {
        const pr = sim.s.props[t.id];
        if (pr.kind !== 'mushroom') return { x: pr.x, y: pr.y, r: 0.95 };
        // The cap's middle, out along the way the mushroom points.
        const body = sim.world.getRigidBody(pr.body), p = body.translation(), a = body.rotation();
        return { x: p.x - Math.sin(a) * 0.45, y: p.y + Math.cos(a) * 0.45, r: 0.5 };
    }
    return null;
}
function placeNote() {
    const t = noteTargetPoint();
    if (!t) { hideNote(); return; }
    const c = window.__boop.toScreen(t.x, t.y);
    const edge = window.__boop.toScreen(t.x + t.r, t.y);
    // A tip about the whole board is said by the block buddy, standing under the bubble.
    const rPx = t.buddy ? 30 : Math.abs(edge.x - c.x);
    buddy.toggleAttribute('hidden', !t.buddy);   // an SVG has no .hidden property
    if (t.buddy) { buddy.style.left = `${c.x}px`; buddy.style.top = `${c.y}px`; }
    const w = note.offsetWidth, h = note.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight, gutter = 16, gap = 12;
    const hudBottom = document.body.classList.contains('wide') ? 8   // HUD is beside the board, not above
        : document.getElementById('hud').getBoundingClientRect().bottom + 6;   // keep clear of the HUD
    const below = c.y - rPx - gap - h < hudBottom;   // above when it fits, otherwise below
    const left = Math.min(vw - gutter - w, Math.max(gutter, c.x - w / 2));
    const top = below ? c.y + rPx + gap : c.y - rPx - gap - h;
    note.style.left = `${left}px`;
    note.style.top = `${top}px`;
    note.style.setProperty('--arrow-x', `${Math.min(w - 18, Math.max(18, c.x - left))}px`);
    note.classList.toggle('below', below);
}
// Tips fade away rather than blink off. The buddy's board-wide tips also leave on
// their own after a few seconds; tips pointing at something stay until you aim.
const BUDDY_TIP_MS = 4000, FADE_MS = 300;
let noteTimer = 0, fadeTimer = 0;
function showNote(text) {
    clearTimeout(noteTimer); clearTimeout(fadeTimer);
    note.textContent = text;
    note.hidden = false;
    note.classList.remove('fading'); buddy.classList.remove('fading');
    noteShown = true;
    placeNote();
    if (noteTargetPoint()?.buddy) noteTimer = setTimeout(hideNote, BUDDY_TIP_MS);
}
function hideNote() {
    clearTimeout(noteTimer);
    if (!noteShown) return;
    noteShown = false;
    note.classList.add('fading'); buddy.classList.add('fading');
    fadeTimer = setTimeout(() => { note.hidden = true; buddy.setAttribute('hidden', ''); }, FADE_MS);
}

// ---------- turn flow ----------

let acc = 0, settleSteps = 0, descendT = 0, shake = 0;
// Ball positions before the latest step, so drawing can glide between steps.
const prevBallPos = new Map();
let stepAlpha = 1;


function readBest() { try { return Number(localStorage.getItem('boop-best-depth')) || 0; } catch { return 0; } }
function writeBest(d) { try { localStorage.setItem('boop-best-depth', String(d)); } catch { /* storage blocked */ } }

function gameOver() {
    const d = sim.s.depth, before = readBest(), best = Math.max(before, d);
    writeBest(best);
    clearSave();
    phase = 'over';
    $('over-result').textContent = `You reached depth ${d}.`;
    const isNew = d > before && before > 0;
    $('over-best').textContent = isNew ? `New best! (was ${before})` : `Best depth: ${best}`;
    $('over-best').classList.toggle('new', isNew);
    showScreen('over');
}

// The last block popped: no waiting for the balls to finish. A short beat for the
// crayon bits, then the next zone comes up.
const CLEAR_BEAT = 0.5;
let clearT = 0;
function zoneCleared() {
    sim.endShots();
    clearT = 0;
    phase = 'cleared';
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
    consumeEvents();
    if (sim.blockCount() === 0) { startZone(); return; }   // cleared (the last blocks may have tumbled out)
    if (sim.s.supply <= 0) { gameOver(); return; }
    phase = 'aim';
    if (runStarted) saveRun();
}

// ---------- saving ----------
// The run is saved in this browser at the start of every turn (board settled, nothing
// in flight): the physics world as bytes, the game state as JSON. Closing the page
// mid-shot loses only that shot. Game over or New game clears it.
const SAVE_KEY = 'boop-save-v1';
let fromSave = false;     // this run was picked back up from a save (start screen says Continue)

function toBase64(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
}
function fromBase64(text) {
    const bin = atob(text), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}
function saveRun() {
    try {
        const { world, s } = sim.save();
        localStorage.setItem(SAVE_KEY, JSON.stringify({ depth: sim.s.depth, world: toBase64(world), s }));
    } catch { /* storage full or blocked: the game just isn't saved */ }
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* storage blocked */ } }
function loadRun() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        return Sim.load(RAPIER, fromBase64(data.world), data.s);
    } catch {
        clearSave();      // unreadable (an older version, say): start fresh
        return null;
    }
}

// Tips about new things show once per device, not once per run: what's been explained
// is remembered here and handed to each new run. How to play can reset it.
const TIPS_KEY = 'boop-tips-seen';
function readTips() { try { return JSON.parse(localStorage.getItem(TIPS_KEY)) || {}; } catch { return {}; } }
function writeTips(seen) { try { localStorage.setItem(TIPS_KEY, JSON.stringify(seen)); } catch { /* storage blocked */ } }

function restart(saved = null) {
    if (sim) sim.free();
    for (const v of blockViews.values()) scene.remove(v.group);
    for (const g of pickupViews.values()) scene.remove(g);
    for (const v of propViews.values()) scene.remove(v.group);
    for (const f of fadingProps) scene.remove(f.v.group);
    fadingProps.length = 0;
    for (const v of ballViews.values()) scene.remove(v.group);
    for (const f of fadingBalls) scene.remove(f.group);
    fadingBalls.length = 0;
    blockViews.clear(); pickupViews.clear(); propViews.clear(); ballViews.clear();
    crumbs.clear();
    keyAim = false;
    if (saved) {
        sim = saved;
        runStarted = true;
        fromSave = true;
        zoneOffset = 0;
        phase = 'aim';
        return;
    }
    clearSave();
    runStarted = false;
    fromSave = false;
    sim = Sim.create(RAPIER, (Math.random() * 2 ** 31) | 0);
    sim.s.seen = readTips();
    startZone();
}

function tick(frameDt) {
    if (phase === 'cleared') {
        clearT += frameDt;
        if (clearT >= CLEAR_BEAT) startZone();
        return;
    }
    if (phase === 'descend') {
        descendT += frameDt;
        const t = Math.min(1, descendT / DESCEND_TIME);
        zoneOffset = -H * (1 - t) ** 3;
        if (t >= 1) {
            zoneOffset = 0;
            // First time something new shows up, say what it does in one line.
            if (sim.s.note) showNote(sim.s.note);
            writeTips({ ...readTips(), ...sim.s.seen });
            readyToAim();
        }
        return;
    }
    if (phase !== 'play' && phase !== 'settle') return;

    const s = sim.s;
    acc += frameDt;   // always real time: no fast-forward, so ball speed always looks the same
    let n = 0;
    while (acc >= DT && n < 30) {
        acc -= DT; n++;
        prevBallPos.clear();
        for (const b of s.balls) { const t = sim.world.getRigidBody(b.body).translation(); prevBallPos.set(b.body, [t.x, t.y]); }
        sim.step();
        if (phase === 'play' && sim.blockCount() === 0) { zoneCleared(); break; }
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
    const frameDt = Math.min(0.12, rawDt);   // slow frames catch up instead of playing in slow motion
    last = now;
    if (!document.hidden && rawDt < 0.5) watchFrameRate(rawDt);
    if (sim) {
        // Paused while the start screen or how-to is up: the board stays as it was.
        // (A new zone still slides into place, so the board behind the start screen is ready.)
        const dt = paused() && phase !== 'descend' ? 0 : frameDt;
        tick(dt);
        if (keyAim && phase === 'aim') keyboardAim(dt);
        if ((aiming || keyAim) && phase === 'aim') {
            easeAim(dt);
            if (keyAim || !aimCancel) drawGuide(shownAngle());
        }
        if (noteShown) placeNote();
        syncView(dt);
        crumbs.update(dt);
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

function themeName() { return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'; }
function applyTheme(name) {
    theme = THEMES[name];
    document.documentElement.dataset.theme = name;
    renderer.setClearColor(theme.paper);
    fieldMat.uniforms.uField.value.setHex(theme.field);
    fieldMat.uniforms.uHatch.value.setHex(theme.line);
    fieldMat.uniforms.uStrength.value = name === 'dark' ? 0.08 : 0.12;   // light paper needs a touch more to show
    lineMat.color.setHex(theme.line);
    outlineMat.color.setHex(theme.edge);
    setSketchInk(theme.line, theme.edge);
    ballMat.color.setHex(theme.ball);
    dotInk.setHex(theme.line);
    dotFade.setHex(theme.guideEnd);
    dotHit.setHex(theme.hit);
    JELLO.text = theme.jelloText;
    for (const v of blockViews.values()) {
        v.mesh.material.uniforms.uInk.value.setHex(theme.edge);
        if (v.neutral) v.mesh.material.uniforms.uFill.value.setHex(NEUTRAL[name]);
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

const menu = $('menu'), howto = $('howto'), over = $('over');
const TAGLINE = $('menu-tagline').textContent;
const paused = () => !menu.hidden || !howto.hidden || !over.hidden;
function showScreen(which, moveFocus = true) {
    if (which) {                          // stop any aim in progress
        aiming = false; keyAim = false; keyTurn = 0;
        hideGuide();
    }
    menu.hidden = which !== 'menu';
    howto.hidden = which !== 'howto';
    over.hidden = which !== 'over';
    document.body.classList.toggle('howto-open', which === 'howto');
    document.body.classList.toggle('playing', !which);
    if (which === 'menu') {
        // Mid-run, the start screen is the pause screen: Resume, or start over.
        const best = readBest();
        // Mid-run the tagline gives way to where you are; the small line is only for Best.
        $('menu-tagline').textContent = !runStarted ? TAGLINE
            : fromSave ? `Saved run · Depth ${sim.s.depth}` : `Paused · Depth ${sim.s.depth}`;
        $('menu-tagline').classList.toggle('state', runStarted);
        $('menu-best').hidden = runStarted || best === 0;
        $('menu-best').textContent = `Best depth: ${best}`;
        $('btn-play').textContent = !runStarted ? 'Play' : fromSave ? 'Continue' : 'Resume';
        $('btn-new').hidden = !runStarted;
        $('btn-menu-close').setAttribute('aria-label', runStarted ? 'Close and resume' : 'Close and play');
        if (moveFocus) $('btn-play').focus();
    } else if (which === 'over') {
        if (moveFocus) $('btn-again').focus();
    } else if (which === 'howto') {
        howto.scrollTop = 0;
        $('btn-howto-play').textContent = !runStarted ? 'Play' : fromSave ? 'Continue' : 'Resume';
        $('btn-howto-back').focus();
    }
}
function play() {
    showScreen(null);
    fromSave = false;      // from here on, the start screen is just the pause screen
    canvas.focus({ preventScroll: true });   // so the keyboard goes straight to aiming
}
$('btn-play').addEventListener('click', play);
$('btn-howto-play').addEventListener('click', play);
$('btn-howto').addEventListener('click', () => showScreen('howto'));
$('btn-tips-reset').addEventListener('click', () => {
    writeTips({});
    if (sim) sim.s.seen = {};
    $('tips-reset-done').hidden = false;
});
$('btn-howto-back').addEventListener('click', () => showScreen('menu'));
$('btn-howto-close').addEventListener('click', () => showScreen('menu'));
$('btn-menu-close').addEventListener('click', play);
// Pause: the button, Escape or P, or leaving the tab mid-run all bring up the start screen.
$('btn-pause').addEventListener('click', () => showScreen('menu'));
$('btn-new').addEventListener('click', () => { restart(); play(); });
$('btn-again').addEventListener('click', () => { restart(); play(); });
$('btn-over-menu').addEventListener('click', () => { restart(); showScreen('menu'); });
document.addEventListener('visibilitychange', () => {
    if (document.hidden && runStarted && document.body.classList.contains('playing')) showScreen('menu', false);
});

const AIM_KEYS = { ArrowLeft: -1, ArrowRight: 1, a: -1, d: 1, A: -1, D: 1 };
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (!over.hidden) return;             // the run is over: nothing to pause or resume
        if (!howto.hidden) showScreen('menu');
        else if (!menu.hidden) play();
        else showScreen('menu');
        return;
    }
    if (paused() || e.metaKey || e.ctrlKey || e.altKey) return;
    // Let buttons and links (pause, theme, Games) handle their own keys.
    if (e.target.closest?.('button, a, input')) return;
    if (e.key === 'p' || e.key === 'P') { showScreen('menu'); return; }
    keyFine = e.shiftKey;
    if (e.key in AIM_KEYS) {
        e.preventDefault();
        if (phase !== 'aim') return;
        if (!keyAim) { keyAim = true; aiming = false; aimTarget = aimAngle; hideNote(); }
        keyTurn = AIM_KEYS[e.key];
        return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (e.repeat) return;
        if (phase !== 'aim') return;
        if (!keyAim) { keyAim = true; aiming = false; aimTarget = aimAngle; hideNote(); return; }   // first press shows the guide
        const drawn = guideAngle ?? shownAngle();
        keyAim = false;
        keyTurn = 0;
        hideGuide();
        fire(drawn);
    }
});
document.addEventListener('keyup', (e) => {
    keyFine = e.shiftKey;
    if (e.key in AIM_KEYS && AIM_KEYS[e.key] === keyTurn) keyTurn = 0;
});

await RAPIER.init();
await Promise.all([
    document.fonts.load('800 64px Manrope'),
    document.fonts.load("64px 'Cartridge Rough'"),   // for the +1 labels
]).catch(() => {});
fitCamera();   // the HUD's height is final once its font has loaded
restart(loadRun());
showScreen('menu', false);
requestAnimationFrame(frame);

// For automated checks.
window.__boop = {
    get sim() { return sim; },
    get phase() { return phase; },
    fire: (angle) => fire(angle),
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
