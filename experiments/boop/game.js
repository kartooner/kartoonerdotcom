// Boop!: the game loop, rendering of the board, input and turn flow.
// Physics and rules: sim.js. Drawing helpers: blockshader.js, sketch.js, balls.js, labels.js. Colours: theme.js.
import * as THREE from 'three';
import RAPIER from 'rapier';
import { Sim, predict, W, H, DT, LAUNCHER, aimRange, ballFuse, VINE_DEBRIS_STEPS } from './sim.js';
import { makeBlockMesh, tierFor, JELLO, NEUTRAL, TIERS } from './blockshader.js';
import { makeSketch, SHAPE, setSketchInk, forgetSketch, makeFieldMaterial, sketchMats } from './sketch.js';
import { makeAudio } from './audio.js';
import { THEMES, COLORS } from './theme.js';
import { THING_TIPS } from './zones.js';
import { makeLabel as labelMesh, drawLabel } from './labels.js';
import { makeBallView, shapeBall } from './balls.js';
import { makeCrumbs, flakeGeometry } from './crumbs.js';
import { applySeason, seasonGreeting } from './season.js';
import { makeLeafPiles } from './leaves.js';
import './buddy.js';               // the mascot's blinks and glances

// Must match data-build on the page, and the stamp every other file pushes as it loads.
// Right after an update, a cache can briefly hand out a mix of old and new files. Then:
// reload once; if it's still mixed, say so plainly (with a Reload button) rather than run
// a game that half works.
const BUILD = '1.5-4';
let pendingBuild = null, lastUpdateCheck = 0;   // see checkForUpdate
const MODULES = 12;
const stamps = globalThis.boopBuilds || [];
if (document.documentElement.dataset.build !== BUILD || stamps.length !== MODULES || stamps.some((b) => b !== BUILD)) {
    let tried = false;
    try { tried = sessionStorage.getItem('boop-reload') === BUILD; sessionStorage.setItem('boop-reload', BUILD); } catch { /* storage blocked */ }
    if (!tried) location.reload();
    else globalThis.boopUpdating?.();
    throw new Error('Boop: files out of step after an update');
}
globalThis.boopReady = true;   // tells the watchdog in index.html the game started

let theme = THEMES.light;
const makeLabel = (text, color = theme.text, style) => labelMesh(text, color, style);
const bounced = new Set();      // balls that hit something since the last frame
const fadingBalls = [];         // balls whose shot just ended, shrinking away
const fuseGrey = new THREE.Color();
let hudKey = '';
function buildBallView(handle) {
    const v = makeBallView(outlineMat, ballMat.clone());   // own fill colour: it greys on its own timer
    scene.add(v.group);
    ballViews.set(handle, v);
    return v;
}

const MAX_SETTLE_STEPS = 360;        // tumbling blocks get up to 3s to come to rest
const DESCEND_TIME = 0.9;

const $ = (id) => document.getElementById(id);
const hud = {
    depth: $('hud-depth'), shots: $('hud-shots'), volley: $('hud-volley'), par: $('hud-par'), parBox: $('hud-par-box'), parLabel: document.querySelector('#hud-par-box span'), shotsLabel: document.querySelector('.stat-main span'), progress: $('progress-fill'),
};

// ---------- three.js setup ----------

const renderer = new THREE.WebGLRenderer({ antialias: true });
// Resolution steps down if frames run slow (the hand-drawn block shader runs on every pixel).
const PIXEL_RATIOS = [2, 1.5, 1].filter((r) => r <= Math.max(1, window.devicePixelRatio));
let pixelStep = 0;
renderer.setPixelRatio(PIXEL_RATIOS[0]);

$('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
// A holiday season (if it's one) recolours things before anything is built.
const seasonLook = applySeason({ THEMES, TIERS, JELLO, COLORS });
const crumbs = makeCrumbs(scene, seasonLook);
const leafPiles = seasonLook?.leaves ? makeLeafPiles(scene, seasonLook, -H) : null;   // fall leaves / winter snow on a block   // crayon bits when a block pops
const camera = new THREE.OrthographicCamera(0, W, 0, -H, -10, 10);

function fitCamera() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    const pad = 0.25, bottomPx = 44;            // bottom: room for the Games / theme links
    // A phone on its side is short: give the side HUD a narrower column so it fits too.
    const hudW = h < 520 ? 140 : 200, hudGap = h < 520 ? 20 : 28;
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
    root.setProperty('--hud-w', `${hudW}px`);
    // Too narrow for three links under the board: drop the Boop! mark between them.
    document.body.classList.toggle('narrow-board', boardPx < 260);
}
// Re-fit whenever the screen changes. On iPhone, turning the phone fires these events
// before Safari has settled on the new size (and Safari can stay zoomed in after the
// turn), so fit again a few times as it settles and nudge the viewport back to 1x.
let refitTimers = [];
function refit() {
    fitCamera();
    checkSideways();
    refitTimers.forEach(clearTimeout);
    refitTimers = [120, 350, 800].map((ms) => setTimeout(() => { fitCamera(); checkSideways(); }, ms));
}
// A phone turned on its side: too short to play. Pause (so turning back finds Resume) and
// show the "upright" panel. Tablets and desktops play fine in landscape.
const touchOnly = window.matchMedia('(pointer: coarse)');
// The phone's Reduce Motion setting: no screen shake, and the gold block's sheen and star stay still.
const calmMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function phoneSideways() { return touchOnly.matches && window.innerWidth > window.innerHeight && window.innerHeight < 500; }
function checkSideways() {
    const side = phoneSideways();
    const panel = document.getElementById('rotate');
    if (side && panel.hidden && document.body.classList.contains('playing')) showScreen('menu', false);
    panel.hidden = !side;
}
function resetZoom() {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    const content = meta.getAttribute('content');
    meta.setAttribute('content', content + ', minimum-scale=1');   // a change makes Safari re-apply it
    setTimeout(() => meta.setAttribute('content', content), 50);
}
window.addEventListener('resize', refit);
window.addEventListener('orientationchange', () => { resetZoom(); refit(); });
window.visualViewport?.addEventListener('resize', refit);
// iOS ignores user-scalable=no for pinches; stop them here so the board can't be zoomed.
document.addEventListener('gesturestart', (e) => e.preventDefault());
fitCamera();

const mat = (color, opts = {}) => new THREE.MeshBasicMaterial({ color, ...opts });
const unitSquare = new THREE.PlaneGeometry(1, 1);
const unitCircle = new THREE.CircleGeometry(1, 32);
unitSquare.userData.keep = unitCircle.userData.keep = true;   // shared: never freed

// Take something off the board for good: out of the scene, and its GPU geometry, materials and
// textures freed (anything marked keep is shared and stays). Without this, every block, ring,
// prop and ball left a little GPU memory behind, which added up over a long run.
function discard(obj) {
    obj.parent?.remove(obj);
    forgetSketch(obj);
    obj.traverse((o) => {
        if (o.geometry && !o.geometry.userData.keep) o.geometry.dispose();
        const m = o.material;
        if (m && !m.userData.keep) { m.map?.dispose(); m.dispose(); }
    });
}
const lineMat = mat(0);         // marks on the field
const outlineMat = mat(0);      // edges on blocks, props and balls
const ballMat = mat(0);
outlineMat.userData.keep = ballMat.userData.keep = lineMat.userData.keep = true;
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


// Launcher along the top. Drag it to move it anywhere between the walls.
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
// Last shot: three faint dashes from the launcher along the angle you last fired, shown while
// aiming, so "a little left of last time" is easy. Hidden when you're aiming right along it.
const lastShot = new THREE.Group();
const lastShotMat = mat(0xffffff, { transparent: true, opacity: 0.4 });
for (let i = 0; i < 3; i++) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.06), lastShotMat);
    dash.position.x = 0.62 + i * 0.27;
    lastShot.add(dash);
}
lastShot.position.set(LAUNCHER.x, LAUNCHER.y, 0.44);
lastShot.visible = false;
scene.add(lastShot);
let lastShotAngle = null, lastShotX = null;
// Moving the launcher: a sketchy rail along the top with ticks (far left, centre, far right and
// steps between) while it's picked up, and ‹ › arrows beside it. Drawn white on little canvases
// and tinted with the theme's line colour.
function sketchTexture(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.strokeStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round';
    let seed = 7;
    const jit = (a) => { seed = (seed * 16807) % 2147483647; return (seed / 2147483647 - 0.5) * a; };
    // A hand-drawn stroke: two slightly different passes along the same points.
    const stroke = (pts, width) => {
        for (let pass = 0; pass < 2; pass++) {
            g.lineWidth = width * (pass ? 0.7 : 1);
            g.beginPath();
            pts.forEach(([x, y], i) => (i ? g.lineTo : g.moveTo).call(g, x + jit(width * 0.6), y + jit(width * 0.6)));
            g.stroke();
        }
    };
    draw(stroke, jit);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}
const LAUNCH_EDGE_VIEW = 0.62;   // matches LAUNCH_EDGE in sim.js
const railW = W - 2 * LAUNCH_EDGE_VIEW;
const railMat = mat(0xffffff, { transparent: true, opacity: 0.55, depthWrite: false,
    map: sketchTexture(1024, 64, (stroke) => {
        const y = 32, x0 = 12, x1 = 1012;
        const pts = []; for (let i = 0; i <= 16; i++) pts.push([x0 + (x1 - x0) * i / 16, y]);
        stroke(pts, 4);
        for (let i = 0; i <= 8; i++) {
            const x = x0 + (x1 - x0) * i / 8, tall = i % 4 === 0;
            stroke([[x, y - (tall ? 22 : 12)], [x, y + (tall ? 22 : 12)]], tall ? 5 : 3.5);
        }
    }) });
const rail = new THREE.Mesh(new THREE.PlaneGeometry(railW + 0.12, 0.5), railMat);
rail.position.set(W / 2, LAUNCHER.y, 0.42);
rail.visible = false;
scene.add(rail);
const arrowMat = mat(0xffffff, { transparent: true, depthWrite: false,
    map: sketchTexture(128, 128, (stroke) => { stroke([[40, 16], [92, 64], [40, 112]], 16); }) });
const arrowGeo = new THREE.PlaneGeometry(0.46, 0.46);
const arrowR = new THREE.Mesh(arrowGeo, arrowMat), arrowL = new THREE.Mesh(arrowGeo, arrowMat);
arrowL.rotation.z = Math.PI;
for (const a of [arrowL, arrowR]) { a.position.set(0, LAUNCHER.y, 0.46); a.visible = false; scene.add(a); }
// The ‹ › arrows show by themselves until you've moved the launcher once.
const MOVED_KEY = 'boop-launcher-moved';
let launcherMoved = (() => { try { return localStorage.getItem(MOVED_KEY) === '1'; } catch { return true; } })();
function markLauncherMoved() {
    if (launcherMoved) return;
    launcherMoved = true;
    try { localStorage.setItem(MOVED_KEY, '1'); } catch { /* storage blocked */ }
}
let moveMode = false;    // the launcher's picked up: the next drag slides it

// Where the launcher is in the sim (the guide and the shot start there).
const launchAt = () => sim ? sim.launcher() : LAUNCHER;
function moveLauncherView(frameDt) {
    const x = launchAt().x;
    const dx = x - launcher.position.x;
    if (Math.abs(dx) > 0.002) {
        launcher.position.x += dx * (1 - Math.exp(-frameDt * 30));
        animating = true;
    } else launcher.position.x = x;
    lastShot.position.x = launcher.position.x;
    // The rail (and arrows) stay up from pickup until the launcher's set down, drag included.
    const moving = moveMode || !!grabbing || (aiming && !!touchDown?.fromMove);
    const showArrows = phase === 'aim' && !paused() && (moving || (!launcherMoved && runStarted && !buddyTalking));
    if (rail.visible !== moving || arrowL.visible !== showArrows) animating = true;
    rail.visible = moving;
    arrowL.visible = arrowR.visible = showArrows;
    if (showArrows) {
        // Same gap on both sides. An arrow goes away once the launcher can't go any further
        // that way (or the arrow would sit over the wall).
        const L = launcher.position.x, x = launchAt().x, off = 0.7, half = 0.23;
        arrowL.position.x = L - off; arrowR.position.x = L + off;
        arrowL.visible = x > LAUNCH_EDGE_VIEW + 0.02 && L - off - half > 0.02;
        arrowR.visible = x < W - LAUNCH_EDGE_VIEW - 0.02 && L + off + half < W - 0.02;
        arrowMat.opacity = moving ? 0.95 : 0.6;
    }
}


// ---------- view of the sim ----------

let sim;
const blockViews = new Map();   // id → view
const ballViews = new Map();    // body handle → { group, inner, ... }
const pickupViews = new Map();  // id → group
const booms = [];               // bomb bursts on screen: an expanding ring each
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
    for (const c of b.cells) { const d = c[0] ** 2 + c[1] ** 2 + c[1] * 0.01; if (d < bestD - 1e-9) { bestD = d; best = c; } }
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
    let star = null;
    if (b.gold) {
        // A gold block gets a little white star in its top corner that twinkles.
        const [cx, cy] = b.cells.reduce((m, c) => (c[1] > m[1] || (c[1] === m[1] && c[0] > m[0]) ? c : m));
        mesh.material.uniforms.uGold.value = 1;
        star = new THREE.Mesh(starGeo, starMat);
        star.position.set(cx + 0.27, cy + 0.27, 0.25);
        star.renderOrder = 3;
        group.add(star);
    }
    let bomb = null;
    if (b.bomb) {
        // A bomb hanging on a vine: drawn like any bomb, in place of the block.
        mesh.visible = false;
        bomb = makeBombParts(b.id);
        group.add(bomb.group);
    }
    scene.add(group);
    scene.add(group);
    const v = { group, mesh, label, nailWob: {}, hp: -1, punch: 0, jello: b.jello, neutral: b.neutral, bomb, star, big: b.cells.length >= 5, trail: [], cells: b.cells };
    blockViews.set(b.id, v);
    return v;
}

// Nails: what holds a fixed block in place. Heads with an ink outline, like a tack in a
// drawing. Bright ones can be knocked out: they tilt and lift as they wear down, jolt
// when hit, and pop out. Grey ones (single squares) never come out.
// A gold block (pop it for a bonus stage): shaded like metal in the block shader (flecks, bevel, sheen).
const GOLD = { fill: 0xf0ad1f, pattern: -1, text: '#2b2622' };
const starGeo = flakeGeometry(), starMat = new THREE.MeshBasicMaterial({ color: 0xfffbea });
starGeo.userData.keep = starMat.userData.keep = true;
const NAIL = 0xf7f3ea, NAIL_FIXED = 0x8f8982;
const nailAt = new THREE.Vector3();
function updateNails(v, b, frameDt) {
    const u = v.mesh.material.uniforms;
    const nails = b.nails ?? [];
    u.uNails.value = nails.length;
    const live = new Set();
    nails.forEach((n, i) => {
        live.add(n.id);
        if (!v.nailSeen?.has(n.id)) (v.nailSeen ??= new Map()).set(n.id, [n.x, n.y]);
        u.uNailFill.value[i].setHex(n.hp < 0 ? NAIL_FIXED : NAIL);
        // Nearly out: a crack across the head on its second-to-last hit, two on its last.
        u.uNailCrack.value[i] = n.hp === 1 && n.hp0 >= 2 ? 2 : n.hp === 2 && n.hp0 >= 4 ? 1 : 0;
        const worn = n.hp < 0 ? 0 : 1 - n.hp / n.hp0;
        const wobT = (v.nailWob[n.id] = (v.nailWob[n.id] ?? 9) + frameDt);
        const jolt = wobT < 0.5 ? Math.exp(-wobT * 14) * Math.sin(wobT * 60) * 0.06 : 0;
        const side = n.id === 0 ? -1 : 1;
        // In the mesh's own space (the group's scale is the hit squash, applied on top).
        u.uNail.value[i].set(n.x * b.scale + side * worn * 0.03, n.y * b.scale + worn * 0.04 + jolt, worn, side * worn * 0.5);
    });
    for (const [id, [x, y]] of v.nailSeen ?? []) {
        if (live.has(id)) continue;
        // Popped: a little spray of steel and ink from where it was.
        v.group.updateMatrixWorld();
        v.group.localToWorld(nailAt.set(x * b.scale, y * b.scale, 0));
        crumbs.spray([[nailAt.x, nailAt.y]], [0xb7b0a6, theme.edge, NAIL]);
        v.nailSeen.delete(id);
        delete v.nailWob[id];      // its wobble timer would otherwise stay frozen and keep the board redrawing
    }
}

function updateBlockView(v, b, frameDt) {
    if (v.star) {   // twinkles whenever the board is drawn (still with Reduce Motion: 2.0 is between sheen sweeps)
        const t = calmMotion.matches ? 2 : performance.now() / 1000;
        v.mesh.material.uniforms.uTime.value = t % 1000; v.star.scale.setScalar(calmMotion.matches ? 1 : 1 + 0.25 * Math.sin(t * 5)); v.star.rotation.z = t * 0.6;
    }
    if (v.bomb) animateBomb(v.bomb, b.lit, frameDt, v.group);
    const u = v.mesh.material.uniforms;
    let nailMoving = false;
    for (const id in v.nailWob) if (v.nailWob[id] < 0.5) { nailMoving = true; break; }
    if (v.wobbleT < 0.8 || v.punch > 0.01 || v.pokeAmt > 0.01 || v.trail?.some((pt) => pt[2] > 0)
        || nailMoving || (v.hp !== b.hp && !b.neutral)) animating = true;   // grey blocks have no number to change
    updateNails(v, b, frameDt);
    // A new number means redrawing its texture; with several balls hammering one block that's
    // many a second, so it's redrawn at most every 50 ms (the latest number always shows).
    const now = performance.now();
    if (v.hp !== b.hp && !b.neutral && (v.hp === -1 || now - (v.labelAt ?? 0) > 50)) {
        if (v.hp !== -1) v.punch = 1;
        v.labelAt = now;
        v.hp = b.hp;
        const look = b.jello ? JELLO : b.gold ? GOLD : tierFor(b.hp / (sim.s.tierScale || 1));
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

// One link of a vine: a short green crayon stem with a leaf, drawn in the link's own space.
function buildVineLink(parent, seed, len) {
    const g = new THREE.Group();
    const stem = makeSketch({ kind: SHAPE.BOX, size: [0.09, len / 2 + 0.02], round: 0.05, edge: 0.05, wob: 0.4,
        fill: COLORS.vine, seed, margin: 0.1 });
    const leaf = makeSketch({ kind: SHAPE.CAP, size: [0.2, 0.14], edge: 0.05, wob: 0.45,
        fill: COLORS.leaf, seed: seed + 5, margin: 0.1 });
    const side = seed % 2 ? 1 : -1;
    leaf.position.set(0.14 * side, 0.03, 0.02);
    leaf.rotation.z = -side * 1.15;
    leaf.renderOrder = 2;
    g.add(stem, leaf);
    // Christmas: the vine is a garland strung with little lights, one per link, colours in turn.
    if (seasonLook?.lights) {
        const bulb = makeSketch({ kind: SHAPE.CIRCLE, size: [0.085], edge: 0.035, wob: 0.3,
            fill: seasonLook.lights[seed % seasonLook.lights.length], seed: seed + 9, margin: 0.06 });
        bulb.position.set(-0.1 * side, -0.12, 0.03);
        bulb.renderOrder = 2;
        g.add(bulb);
    }
    parent.add(g);
    return g;
}

// A bomb's fuse: one simple curved crayon line out of its cap, a thin ribbon along a curve.
// Bomb colours per theme: in the dark the body is lifted a little so it stands off the field.
const BOMB_LOOK = {
    light: { body: 0x24222b, shade: 0x0b0a0e, cap: 0x5d5668, fuse: 0xa9a59e },
    dark: { body: 0x4a4554, shade: 0x2c2933, cap: 0x7a7386, fuse: 0xc9c4ba },
};
const bombLook = () => BOMB_LOOK[themeName()];
const fuseMat = mat(BOMB_LOOK.light.fuse), shadeMat = mat(BOMB_LOOK.light.shade);
fuseMat.userData.keep = shadeMat.userData.keep = true;
// Points around the bomb's centre at radius r, from angle a0 to a1 (radians).
const arcPoints = (r, a0, a1, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [Math.cos(a) * r, Math.sin(a) * r]; });
// A crayon stroke along points: a thin ribbon, slightly uneven, tapering at both ends.
function strokeGeometry(pts, w, seed, taper = true) {
    const n = pts.length - 1, pos = [];
    for (let i = 0; i <= n; i++) {
        const [x, y] = pts[i], [nx, ny] = pts[Math.min(n, i + 1)], [px, py] = pts[Math.max(0, i - 1)];
        let dx = nx - px, dy = ny - py; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
        const t = i / n, k = (taper ? Math.min(1, Math.sin(Math.PI * t) * 1.6 + 0.15) : 1 - 0.15 * t) * (1 + 0.18 * Math.sin(i * 1.7 + seed));
        pos.push(x - dy * w * k, y + dx * w * k, 0, x + dy * w * k, y - dx * w * k, 0);
    }
    const idx = [];
    for (let i = 0; i < n; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    return geo;
}
const FUSE_END = [0.2, 0.64];
function fuseGeometry(seed) {
    const p0 = [-0.04, 0.3], c = [-0.06, 0.66], p1 = FUSE_END, pts = [];
    for (let i = 0; i <= 16; i++) {
        const t = i / 16, u = 1 - t;
        pts.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]);
    }
    return strokeGeometry(pts, 0.045, seed, false);
}

// A round cartoon bomb (a prop sitting in a gap, or hanging on a vine): charcoal body with an
// ink outline, a white shine, darker shading, a small cap, a curled fuse and an orange spark.
function makeBombParts(id) {
    const look = bombLook();
    // The body is drawn by the block shader (one cell rounded into a circle), so its rough
    // crayon edge and ink outline match the blocks exactly. Plain fill, no pattern.
    const body = makeBlockMesh([[0, 0]], false, (id * 7.31) % 50, 0.5);
    const bu = body.material.uniforms;
    bu.uK.value = 0.74; bu.uNeutral.value = 1;
    bu.uFill.value.setHex(look.body); bu.uInk.value.setHex(theme.edge);
    body.renderOrder = 1;                // over the fuse's base, under the shine and shading
    const shade = new THREE.Mesh(strokeGeometry(arcPoints(0.27, 2.0, 4.2), 0.05, id), shadeMat);
    const shade2 = new THREE.Mesh(strokeGeometry(arcPoints(0.16, 2.5, 4.0), 0.035, id + 2), shadeMat);
    shade.position.z = shade2.position.z = 0.015;
    const shine = makeSketch({ kind: SHAPE.CIRCLE, size: [0.075], edge: 0, wob: 0.4, fill: 0xf7f4ee, seed: id + 1, margin: 0.05 });
    shine.position.set(0.1, 0.12, 0.02);
    shine.scale.set(1.2, 0.95, 1);
    shine.rotation.z = 0.3;
    const cap = makeSketch({ kind: SHAPE.BOX, size: [0.1, 0.055], round: 0.02, edge: 0.035, wob: 0.3, fill: look.cap, seed: id + 2, margin: 0.06 });
    cap.position.set(-0.03, 0.37, 0.012);
    const fuse = new THREE.Mesh(fuseGeometry(id), fuseMat);
    fuse.position.z = 0.005;
    const spark = new THREE.Group();
    const glow = makeSketch({ kind: SHAPE.CIRCLE, size: [0.07], edge: 0, wob: 0.7, fill: 0xf37a2a, seed: id + 3, margin: 0.06 });
    const core = makeSketch({ kind: SHAPE.CIRCLE, size: [0.035], edge: 0, wob: 0.6, fill: 0xc5461c, seed: id + 5, margin: 0.04 });
    core.position.set(-0.015, 0.005, 0.005);
    spark.add(glow, core);
    spark.position.set(FUSE_END[0], FUSE_END[1], 0.03);
    for (const o of [shade, shade2, shine, cap, glow, core]) o.renderOrder = 2;
    body.position.z = 0.01;
    const group = new THREE.Group();
    group.add(fuse, body, shade, shade2, shine, cap, spark);
    return { group, body, cap, spark };
}

// A bomb's life on screen. Lit: the spark flares and spits, the bomb swells and shivers.
// Just tapped: it jolts and the spark flares, then settles. Otherwise a gentle flicker.
const sparkAt = new THREE.Vector3();
function animateBomb(parts, lit, frameDt, holder) {
    const now = performance.now() / 1000;
    if (lit) {
        animating = true;
        parts.spark.scale.setScalar(1.7 + 0.5 * Math.sin(now * 55));
        const k = 1 + 0.07 * Math.sin(now * 40) + 0.08 * (1 - Math.min(lit, 60) / 60);
        parts.group.scale.set(k, k, 1);
        if (Math.random() < 0.25) {
            holder.updateMatrixWorld();
            parts.spark.getWorldPosition(sparkAt);
            crumbs.spray([[sparkAt.x, sparkAt.y]], [0xf4a640, 0xffe08a]);
        }
    } else if (parts.tapT != null && parts.tapT < 0.45) {
        animating = true;
        parts.tapT += frameDt;
        const t = parts.tapT, w = Math.sin(t * 45) * Math.exp(-t * 9) * 0.12;
        parts.group.scale.set(1 + w, 1 - w, 1);
        parts.spark.scale.setScalar(1 + 0.9 * Math.exp(-t * 7));
    } else {
        parts.group.scale.set(1, 1, 1);
        parts.spark.scale.setScalar(1 + 0.15 * Math.sin(now * 22));   // a gentle flicker whenever the board is drawn
    }
}

function buildPropView(pr) {
    const group = new THREE.Group();
    const v = { group };
    if (pr.kind === 'vine') {
        v.links = new Map();       // link body handle → its drawing (links and fallen bits alike)
        v.vine = true;
        scene.add(group);
        propViews.set(pr.id, v);
        return v;
    }
    if (pr.kind === 'bomb') {
        // A round cartoon bomb: charcoal body with an ink outline, a white oval shine up and to
        // the right, darker crayon shading down the left, a small cap, a thick grey fuse that
        // curls right, and an orange spark at its tip. Body colours follow light/dark (bombLook).
        const parts = makeBombParts(pr.id);
        group.add(parts.group);
        group.position.set(pr.x, pr.y, 0.05);
        v.bomb = parts;
        scene.add(group);
        propViews.set(pr.id, v);
        return v;
    }
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

function syncVine(v, pr) {
    const live = new Set();
    const draw = (l, fade) => {
        live.add(l.body);
        let g = v.links.get(l.body);
        if (!g) { g = buildVineLink(v.group, pr.id * 7 + l.lid, pr.len); v.links.set(l.body, g); }
        const body = sim.world.getRigidBody(l.body);
        const p = body.translation();
        // Keep drawing only while a link visibly moves (a vine tied to a nailed block can
        // carry a tiny leftover velocity while the world is paused for aiming).
        const y = p.y + zoneOffset, a = body.rotation();
        if (Math.abs(g.position.x - p.x) + Math.abs(g.position.y - y) + Math.abs(g.rotation.z - a) > 0.002) animating = true;
        g.position.set(p.x, y, 0.04);
        g.rotation.z = a;
        if (fade != null && g.userData.fade !== fade) { animating = true; g.userData.fade = fade; g.traverse((o) => { if (o.material?.uniforms?.uAlpha) o.material.uniforms.uAlpha.value = fade; }); }
    };
    for (const l of pr.links) draw(l);
    for (const d of pr.debris) draw(d, Math.min(1, 3 * (1 - d.t / VINE_DEBRIS_STEPS)));
    for (const [h, g] of v.links) if (!live.has(h)) { discard(g); v.links.delete(h); }
}

function addFloater(text, x, y, size = 0.62) {
    const m = makeLabel(text, theme.text, 'hand');
    m.scale.set(size * m.userData.aspect, size, 1);
    const half = Math.min(W / 2, size * m.userData.aspect * 0.5 + 0.15);   // keep long text inside the field
    x = Math.min(W - half, Math.max(half, x));
    m.position.set(x, y, 0.8);
    m.material.opacity = 1;
    m.material.depthWrite = false;   // never block see-through things (jello) behind it
    m.renderOrder = 5;
    scene.add(m);
    floaters.push({ m, t: 0 });
}


// As a new zone slides in, its resting blocks drop the last bit into place with a
// small bounce, so you can see they're loose before the first shot. Visual only.
const DROP_FROM = 1.6;
function dropIn() {
    if (phase !== 'descend') return 0;
    const u = Math.min(1, Math.max(0, (descendT - 0.35) / (DESCEND_TIME - 0.35)));
    // ease-out bounce
    const n = 7.5625, d = 2.75;
    let e;
    if (u < 1 / d) e = n * u * u;
    else if (u < 2 / d) { const t = u - 1.5 / d; e = n * t * t + 0.75; }
    else if (u < 2.5 / d) { const t = u - 2.25 / d; e = n * t * t + 0.9375; }
    else { const t = u - 2.625 / d; e = n * t * t + 0.984375; }
    return DROP_FROM * (1 - e);
}

function syncView(frameDt) {
    const s = sim.s;
    moveLauncherView(frameDt);
    for (const [id, v] of blockViews) {
        if (!s.blocks[id]) { discard(v.group); blockViews.delete(id); }
    }
    for (const id in s.blocks) {
        const b = s.blocks[id];
        const v = blockViews.get(b.id) ?? buildBlockView(b);
        updateBlockView(v, b, frameDt);
        const body = sim.world.getRigidBody(b.body);
        const p = body.translation();
        v.group.position.set(p.x, p.y + zoneOffset + (b.loose && !b.hung ? dropIn() : 0), b.loose ? 0.05 : 0);
        v.group.rotation.z = body.rotation();
    }

    if (leafPiles) {
        if (s.balls.length) leafPiles.stir(s.balls.map((b) => {
            const rb = sim.world.getRigidBody(b.body), t = rb.translation(), v = rb.linvel();
            return { x: t.x, y: t.y + zoneOffset, vx: v.x, vy: v.y };
        }));
        leafPiles.update(frameDt, blockViews);
        if (leafPiles.active()) animating = true;
    }
    for (const [id, g] of pickupViews) {
        if (!s.pickups[id]) { discard(g); pickupViews.delete(id); }
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
        else discard(v.group);
    }
    for (let i = fadingProps.length - 1; i >= 0; i--) {
        const f = fadingProps[i];
        f.t += frameDt;
        const a = Math.max(0, 1 - f.t / 0.35);
        f.v.group.traverse((o) => { if (o.material?.uniforms?.uAlpha) o.material.uniforms.uAlpha.value = a; });
        if (a <= 0) { discard(f.v.group); fadingProps.splice(i, 1); }
    }
    for (const id in s.props) {
        const pr = s.props[id];
        const v = propViews.get(pr.id) ?? buildPropView(pr);
        if (v.vine) { syncVine(v, pr); continue; }
        if (v.body == null) v.group.position.y = pr.y + zoneOffset;   // a mushroom follows its body (below)
        if (v.bomb) animateBomb(v.bomb, pr.lit, frameDt, v.group);
        // Keep drawing while a windmill or mushroom visibly moves. Judged by how far it moved
        // since the last frame, not its speed: while you aim the world is paused, and a speed
        // frozen mid-spin would otherwise keep the board from ever idling.
        if (v.rotor) {
            const a = sim.world.getRigidBody(pr.rotor).rotation();
            if (Math.abs(v.rotor.rotation.z - a) > 0.002) animating = true;
            v.rotor.rotation.z = a;
        }
        if (v.body != null) {
            const body = sim.world.getRigidBody(v.body);
            const p = body.translation(), a = body.rotation(), y = p.y + zoneOffset;
            if (Math.abs(v.group.position.x - p.x) + Math.abs(v.group.position.y - y) + Math.abs(v.group.rotation.z - a) > 0.002) animating = true;
            v.group.position.set(p.x, y, 0.05);
            v.group.rotation.z = a;
            v.falling = pr.falling > 0;
            if (v.falling) animating = true;
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
        // The fuse: a ball greys as it goes without hitting a block, and brightens again on a hit.
        const fuse = ballFuse(ball), k = fuse * fuse * (3 - 2 * fuse);
        v.fill.material.color.setHex(theme.ball).lerp(fuseGrey.setHex(theme.guideEnd), k);
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
        if (k <= 0) { discard(f.group); fadingBalls.splice(i, 1); }
    }


    for (let i = booms.length - 1; i >= 0; i--) {
        const b = booms[i];
        b.t += frameDt;
        const k = Math.min(1, b.t / 0.4), ease = 1 - (1 - k) ** 3;
        b.ring.scale.setScalar(0.3 + (b.r - 0.3) * ease);
        b.ring.material.uniforms.uAlpha.value = 1 - k;
        if (k >= 1) { discard(b.ring); booms.splice(i, 1); }
    }
    if (floaters.length || fadingBalls.length || fadingProps.length || booms.length) animating = true;
    for (let i = floaters.length - 1; i >= 0; i--) {
        const f = floaters[i];
        f.t += frameDt;
        f.m.position.y += frameDt * 0.9;
        f.m.material.opacity = Math.max(0, 1 - f.t / 0.9);
        if (f.t > 0.9) { discard(f.m); floaters.splice(i, 1); }
    }

    // Only touch the page when a number actually changed (each change costs a layout).
    const used = s.zoneShots ?? 0;
    const done = s.zoneHp0 ? Math.max(0, Math.min(1, 1 - sim.hpLeft() / s.zoneHp0)) : 0;
    const key = `${s.relaxed ? 'R' : ''}${s.depth}|${s.supply}|${s.volley}|${used}|${s.par}|${done.toFixed(3)}|${s.bonus?.shots ?? ''}`;
    if (key !== hudKey) {
        hudKey = key;
        hud.depth.textContent = s.depth;
        hud.shots.textContent = s.relaxed ? '∞' : s.supply;      // Relaxed: shots never run out
        hud.shotsLabel.textContent = s.relaxed ? 'Shots' : 'Shots left';
        hud.parBox.classList.toggle('relaxed', !!s.relaxed);   // and there's no par
        hud.volley.textContent = s.volley > 1 ? `${s.volley} balls per shot` : '';
        // A bonus stage swaps par for its free shots.
        hud.parLabel.textContent = s.bonus ? 'Bonus · free shots' : 'This zone / par';
        hud.par.textContent = s.bonus ? `${s.bonus.shots} left` : `${used}/${s.par ?? '-'}`;
        hud.parBox.classList.toggle('over', !s.bonus && used > (s.par ?? Infinity));
        hud.parBox.classList.toggle('bonus', !!s.bonus);
        hud.progress.style.transform = `scaleX(${done})`;
    }
}

function consumeEvents() {
    for (const e of sim.events) {
        playSound(e);
        if (e.t === 'gain') addFloater(`+${e.n}`, e.x, e.y + 0.3);
        else if (e.t === 'nailpop') stopFor(0.03);
        else if (e.t === 'gold') { addFloater('Bonus stage next!', e.x, e.y + 0.4); crumbs.spray([[e.x, e.y], [e.x - 0.3, e.y], [e.x + 0.3, e.y]], [0xf4c542, 0xffe9a0, theme.edge]); }
        else if (e.t === 'vinesnap') crumbs.spray([[e.x, e.y], [e.x, e.y - 0.1]], [COLORS.vine, COLORS.leaf, theme.edge]);
        else if (e.t === 'nailhit') {
            const v = blockViews.get(e.id);
            if (v) v.nailWob[e.nail] = 0;
        } else if (e.t === 'stretch') {
            // Last few blocks: hits count double. The floater says so, every time.
            addFloater('Hits ×2', W / 2, -2.6);
        } else if (e.t === 'boom') {
            leafPiles?.blast(e.x, e.y, e.r);
            // A bomb: a crayon ring rushes out to its reach, and the board jolts.
            const ring = makeSketch({ kind: SHAPE.RING, size: [1], ring: 0.07, edge: 0, role: 'line', inkFill: true, wob: 0.9, seed: (e.x * 13 + e.y * 7) | 0, margin: 0.12 });
            ring.position.set(e.x, e.y, 0.7);
            ring.renderOrder = 5;
            scene.add(ring);
            booms.push({ ring, r: e.r, t: 0 });
            crumbs.spray([[e.x, e.y], [e.x - 0.3, e.y], [e.x + 0.3, e.y], [e.x, e.y + 0.3]], [0xf4a640, 0x4a4350, theme.edge]);
            if (!calmMotion.matches) shake = Math.min(0.2, shake + 0.14);
            stopFor(0.06);
        } else if (e.t === 'pop' && e.popped) {
            const v = blockViews.get(e.id);
            // A streak: from the third block popped in one turn, a little "×3", "×4"...
            if (phase === 'play' && ++turnPops >= 3) addFloater(`×${turnPops}`, e.x, e.y + 0.45, Math.min(1.15, 0.85 + 0.05 * (turnPops - 3)));
            if (v?.big) stopFor(0.045);            // a big block going is worth a beat
            if (v) {
                const u = v.mesh.material.uniforms;
                crumbs.burst(v.cells, e.x, e.y, v.group.rotation.z, u.uK.value, v.jello ? JELLO.fill : u.uFill.value, theme.edge);
            }
        }
        if (leafPiles && (e.t === 'jolt' || e.t === 'hit' || e.t === 'snap' || e.t === 'pop' || (e.t === 'contact' && e.with === 'block'))) leafPiles.knock(e.id);
        if (e.t === 'contact') {
            bounced.add(e.ball);
            if (e.with === 'block') { const v = blockViews.get(e.id); if (v) v.wobbleT = 0; }
        } else if (e.t === 'bombtap') {
            // First hit on a bomb: a jolt and a flare of the spark, so you know it counted.
            const v = propViews.get(e.id);
            if (v?.bomb) v.bomb.tapT = 0;
            const bv = e.block ? blockViews.get(e.id) : null;
            if (bv?.bomb) bv.bomb.tapT = 0;
        } else if (e.t === 'jolt') {
            const v = blockViews.get(e.id);
            if (v) { v.wobbleT = 0; v.wobbleDir = e.dir; }
        } else if (e.t === 'jelly') {
            const v = blockViews.get(e.id);
            if (v && !(v.wobbleT < 0.12)) { v.wobbleT = 0; v.wobbleDir = e.dir; }   // one wobble per cell crossing, not a flicker
        } else if (e.t === 'smash' && !calmMotion.matches) shake = Math.min(0.16, shake + e.speed * 0.015);

    }
    sim.events.length = 0;
}

// ---------- sound ----------
// What makes a sound (see audio.js). Walls, grey blocks, windmills and buttons stay silent.
const audio = makeAudio();
function playSound(e) {
    if (e.t === 'hit') audio.hit(e.id);
    else if (e.t === 'vinehit') audio.hit('v' + e.id);
    else if (e.t === 'pop' && e.popped) audio.pop();
    else if (e.t === 'nailpop') audio.tink();
    else if (e.t === 'gain' && phase === 'play') audio.ring();
    else if (e.t === 'gold') audio.clear();
    else if (e.t === 'jelly') audio.jelly();
    else if (e.t === 'vinesnap') audio.snap();
    else if (e.t === 'boom') audio.boom();
    else if (e.t === 'bomblit') audio.fizz();
    else if (e.t === 'bombtap') audio.tink();
    else if (e.t === 'contact' && e.with === 'prop' && sim.s.props[e.id]?.kind === 'mushroom') audio.boing();
}

// Sound: a switch in Settings (and the M key). Off until turned on; the choice is remembered.
// A remembered "on" waits for the first tap of the visit to start (browsers need a tap first).
const SOUND_KEY = 'boop-sound';
const soundSwitch = $('sound-switch');
function readSoundPick() { try { return localStorage.getItem(SOUND_KEY); } catch { return null; } }
function setSound(on) {
    audio.set(on);
    audio.setActive(document.body.classList.contains('playing'));
    try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch { /* storage blocked */ }
    showSoundState();
}
function showSoundState() {
    const on = audio.on || readSoundPick() === 'on';
    soundSwitch.setAttribute('aria-checked', String(on));
}
soundSwitch.addEventListener('click', () => setSound(!(audio.on || readSoundPick() === 'on')));
if (readSoundPick() === 'on') {
    const wake = () => { audio.set(true); audio.setActive(document.body.classList.contains('playing')); };
    document.addEventListener('pointerdown', wake, { once: true });
    document.addEventListener('keydown', wake, { once: true });
}
showSoundState();

// Relaxed mode: a switch in Settings. Simpler zones, smaller numbers, shots that never run
// out (see RELAXED_HP in sim.js). It has its own saved run, so handing the game to a child
// and back is one switch each way: turning it on parks the regular run where it is, turning
// it off brings it back. Relaxed runs don't count toward the best depth.
const RELAXED_KEY = 'boop-relaxed';
let relaxed = (() => { try { return localStorage.getItem(RELAXED_KEY) === 'on'; } catch { return false; } })();
const relaxedSwitch = $('relaxed-switch');
function showRelaxedState() { relaxedSwitch.setAttribute('aria-checked', String(relaxed)); }
function setRelaxed(on) {
    if (on === relaxed) return;
    if (runStarted && phase === 'aim') saveRun();   // between turns: keep it exactly (otherwise the last turn's save stands)
    relaxed = on;
    try { localStorage.setItem(RELAXED_KEY, on ? 'on' : 'off'); } catch { /* storage blocked */ }
    restart(loadRun());                              // the other mode's run, or a fresh one
    showRelaxedState();
    $('btn-settings-play').textContent = !runStarted ? 'Play' : fromSave ? 'Continue' : 'Resume';
}
relaxedSwitch.addEventListener('click', () => setRelaxed(!relaxed));
showRelaxedState();

// ---------- aim guide ----------

const tmpMatrix = new THREE.Matrix4();
const dotInk = new THREE.Color(), dotFade = new THREE.Color(), dotHit = new THREE.Color(), dotColor = new THREE.Color();
const dotPos = [];
let guideAngle = null;

// On slower phones a guide can take a while to work out. If the last one was slow,
// skip a frame before the next, so aiming stays responsive. The shot always fires
// the angle the guide on screen was drawn for.
let guideCost = 0;
let lastContacts = [];
let lastGuideAt = -Infinity;
let guideX = null;
function drawGuide(angle) {
    if (angle === guideAngle && launchAt().x === guideX) return;
    // Working out the path is the costliest thing in the game (it plays the shot ahead on a
    // copy of the world). Space the updates by what it costs on this device: on a quick phone
    // that's nearly every frame (smooth), on a slow or low-power one down to ~30 a second.
    // Once the aim stops, the next update catches up exactly.
    const now = performance.now();
    if (now - lastGuideAt < Math.min(33, guideCost * 3)) return;
    lastGuideAt = now;
    const t0 = now;
    guideAngle = angle;
    guideX = launchAt().x;
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
    lastShot.visible = lastShotAngle != null && lastShotX === launchAt().x && Math.abs(angle - lastShotAngle) > 0.02;
    guideCost = guideCost * 0.7 + (performance.now() - t0) * 0.3;
}

// The guide draws faint while the aim is moving and inks in once you hold steady, so you can
// feel when it's settled.
const GUIDE_FAINT = 0.38, GUIDE_FULL = 0.9, STEADY_AFTER = 0.12;
let steadyFor = 0, inkAngle = null, inkX = null;
function inkGuide(dt) {
    const a = aimTarget, x = launchAt().x;
    if (inkAngle === null || Math.abs(a - inkAngle) > 0.0015 || Math.abs(x - inkX) > 0.002 || grabbing) steadyFor = 0;
    else steadyFor += dt;
    inkAngle = a; inkX = x;
    const want = steadyFor > STEADY_AFTER ? GUIDE_FULL : GUIDE_FAINT;
    const op = dots.material.opacity;
    if (Math.abs(op - want) > 0.005) {
        dots.material.opacity = op + (want - op) * (1 - Math.exp(-dt * 14));
        animating = true;
    } else dots.material.opacity = want;
}
function hideGuide() {
    steadyFor = 0; inkAngle = null;
    dots.material.opacity = GUIDE_FAINT;
    guideAngle = null;
    dots.count = 0;
    lastShot.visible = false;
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
let keyAim = false;       // the guide is up with no finger or mouse button down (keyboard, or after a tap)
let keyTurn = 0;          // -1 left, 1 right, 0 still
let keyFine = false;
const KEY_TURN = 0.9, KEY_TURN_FINE = 0.15;   // radians per second
function keyboardAim(dt) {
    if (!keyTurn) return;
    aimTarget = clampAim(aimTarget + keyTurn * (keyFine ? KEY_TURN_FINE : KEY_TURN) * dt);
}
// Steadier aiming: the shown angle eases toward the finger and snaps to small
// steps, so tiny twitches don't make the guide jump around.
const AIM_EASE = 18;           // higher = follows the finger faster
const AIM_STEP = 0.0025;       // about 0.15°
const shownAngle = () => Math.round(aimAngle / AIM_STEP) * AIM_STEP;
// To the right the wall is close: stop at about 40° below flat so the barrel never
// points straight into it. Steeper shots down the right side still work.
// How far the aim turns each way depends on where the launcher is (see aimRange in sim.js).
const clampAim = (a) => { const r = aimRange(launchAt().x); return Math.min(r.max, Math.max(r.min, a)); };

// Aiming on touch: the launcher turns toward wherever your finger is, from the moment it lands,
// and follows it as it moves (further down the board turns it more finely). Lifting fires.
// A quick tap only aims, so a stray touch never costs a shot. Changed your mind? Slide off
// the board and let go there.
const TAP_MS = 150;              // shorter than this, without moving, is a tap: aim only
const TAP_PX = 10;
let touchDown = null;            // { x, y, t } where and when the finger landed
const offBoard = (ev) => {
    const r = renderer.domElement.getBoundingClientRect();
    return ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom;
};

// With a mouse, aim by pointing: the launcher turns toward the cursor and a click fires.
// (Touch and pen keep drag-anywhere.) Right-click or Esc puts the guide away.
let mouseAim = false, mouseDown = false;
let mouseDownAt = null;     // where a mouse press started, and whether it was on the launcher
// Hold to fast-forward: while balls are bouncing, keeping a finger, the mouse button or Space
// down runs the game faster, for a ball stuck looping between a block and the ceiling.
// Nothing else changes: same physics, just more steps per frame. Let go (or the turn ends,
// or the game pauses) and it's back to normal; that same press never turns into an aim.
const FAST = 3;
let fastPointer = null, fastKey = false;
const fastForward = () => (fastPointer !== null || fastKey) && (phase === 'play' || phase === 'settle') && !paused();
const holdToFast = () => phase === 'play' || phase === 'settle';
function fromScreen(x, y) {
    const r = renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector3((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height * 2 - 1), 0).unproject(camera);
    return { x: v.x, y: v.y };
}
// Pointing right next to the launcher, a tiny move swings the aim a long way (and trackpads
// are less exact than a mouse): inside this distance, the aim holds where it was.
const NEAR_LAUNCHER = 1.1;
function angleToward(ev, hold = aimTarget) {
    const p = fromScreen(ev.clientX, ev.clientY);
    const L = launchAt();
    if (Math.hypot(p.x - L.x, p.y - L.y) < NEAR_LAUNCHER) return clampAim(hold);
    let a = Math.atan2(p.y - L.y, p.x - L.x);
    if (a > 0) a = a > Math.PI / 2 ? -Math.PI : 0;     // pointing above the launcher: nearest side
    return clampAim(a);
}
// Moving the launcher. Pressing on it and dragging down still aims (people drag their guide
// out from it). Two ways to move it instead:
//  - tap it: it's picked up (a rail with ticks shows), the next drag anywhere slides it, and
//    letting go puts it down. With a mouse: click it, move, click to put it down.
//  - press on it and slide sideways along the top: it moves right away.
const GRAB_PX = 30;              // at least this far from its centre counts as on the launcher
const LAUNCHER_TAP_MS = 400;
let grabbing = null;             // { id, x0, l0 } while the launcher is being slid
function onLauncher(ev) {
    const L = launchAt();
    const c = window.__boop.toScreen(L.x, L.y), e = window.__boop.toScreen(L.x + 0.55, L.y);
    return Math.hypot(ev.clientX - c.x, ev.clientY - c.y) < Math.max(GRAB_PX, Math.abs(e.x - c.x));
}
function startGrab(ev, from = ev) {
    grabbing = { id: ev.pointerId, x0: fromScreen(from.clientX, from.clientY).x, l0: launchAt().x };
    keyAim = true; aiming = false; mouseAim = false; mouseDown = false;   // keyAim keeps the guide drawn
    canvas.setPointerCapture?.(ev.pointerId);
    canvas.style.cursor = 'grabbing';
    hideNote();
}
function moveGrab(ev) {
    sim.moveLauncher(grabbing.l0 + fromScreen(ev.clientX, ev.clientY).x - grabbing.x0);
    if (Math.abs(launchAt().x - grabbing.l0) > 0.05) markLauncherMoved();
}
function endGrab() {
    grabbing = null;
    moveMode = false;
    canvas.style.cursor = '';
    if (runStarted) saveRun();
}
function pickUpLauncher() {
    moveMode = true;
    keyAim = true; aiming = false; mouseAim = false; mouseDown = false;
    hideNote();
}
// A drag that started on the launcher: sideways along the top moves it, anything else aims.
function launcherDragIsMove(ev, start) {
    const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
    return Math.abs(dy) < Math.abs(dx) * 0.6;
}

function cancelAim() {
    aiming = false; aimCancel = true; mouseAim = false; mouseDown = false; keyAim = false; keyTurn = 0; moveMode = false;
    hideGuide();
}

const canvas = renderer.domElement;
canvas.tabIndex = 0;
canvas.setAttribute('role', 'application');
canvas.setAttribute('aria-label', 'Game board. Point to aim and click, or touch where to aim and let go, to fire. Tap the launcher, then drag, to move it. Left and right arrows aim, Alt with the arrows moves the launcher, Space fires, Escape cancels or pauses. Hold while balls fly to speed up.');
// A trackpad pinch (ctrl + wheel) or a stray scroll over the board shouldn't zoom or move the
// page under the cursor mid-aim.
canvas.addEventListener('wheel', (ev) => { ev.preventDefault(); }, { passive: false });
canvas.addEventListener('contextmenu', (ev) => { ev.preventDefault(); if (phase === 'aim') cancelAim(); });
canvas.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse' && !mouseDown) { mouseAim = false; hideGuide(); } });
canvas.addEventListener('pointerdown', (ev) => {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;   // right-click is handled by contextmenu (cancel)
    // Picked up, with a mouse: this click puts it down where it is.
    if (moveMode && ev.pointerType === 'mouse' && phase === 'aim' && !paused()) { startGrab(ev); return; }
    if (ev.pointerType === 'mouse') {
        if (holdToFast()) { fastPointer = ev.pointerId; canvas.setPointerCapture(ev.pointerId); return; }
        if (phase !== 'aim') return;
        mouseDownAt = { x: ev.clientX, y: ev.clientY, onL: onLauncher(ev), moved: false };
        keyAim = false;
        mouseDown = true;
        mouseAim = true;
        canvas.setPointerCapture(ev.pointerId);   // let go off the board and it still counts (as a cancel)
        aimTarget = aimAngle = angleToward(ev);   // click without moving: fire where you point
        hideNote();
        return;
    }
    canvas.setPointerCapture(ev.pointerId);
    if (holdToFast()) { fastPointer = ev.pointerId; return; }
    if (phase === 'aim') {
        keyAim = false;
        aiming = true;
        aimCancel = false;
        // Picked up: a slide moves it; a touch that doesn't slide is an ordinary aim (decided
        // when the finger moves or lifts, so the guide doesn't jump to the finger meanwhile).
        const fromMove = moveMode;
        moveMode = false;
        touchDown = { x: ev.clientX, y: ev.clientY, t: ev.timeStamp, moved: false, onL: !fromMove && onLauncher(ev), fromMove };
        if (fromMove) keyAim = true;              // keep the guide as it is until we know
        else aimTarget = aimAngle = angleToward(ev);   // aim right at the finger, straight away
        hideNote();                             // read it already; don't let it cover the guide
        return;
    }
});
canvas.addEventListener('pointermove', (ev) => {
    if (grabbing) { if (ev.pointerId === grabbing.id) moveGrab(ev); return; }
    if (ev.pointerType === 'mouse') {
        if (phase !== 'aim' || paused() || buddyTalking) return;
        // Picked up with a click: it follows the pointer until the next click.
        if (moveMode) { sim.moveLauncher(fromScreen(ev.clientX, ev.clientY).x); markLauncherMoved(); return; }
        if (mouseDownAt && !mouseDownAt.moved && Math.hypot(ev.clientX - mouseDownAt.x, ev.clientY - mouseDownAt.y) > TAP_PX) {
            mouseDownAt.moved = true;
            if (mouseDownAt.onL && launcherDragIsMove(ev, mouseDownAt)) { startGrab(ev, { clientX: mouseDownAt.x, clientY: mouseDownAt.y }); moveGrab(ev); return; }
        }
        canvas.style.cursor = onLauncher(ev) ? 'pointer' : '';
        if (!mouseAim) { keyAim = false; aimAngle = angleToward(ev); }
        mouseAim = true;
        aimTarget = angleToward(ev);
        return;
    }
    if (aiming) updateAim(ev);
});
canvas.addEventListener('pointerup', (ev) => {
    if (grabbing) { if (ev.pointerId === grabbing.id) endGrab(); return; }
    if (ev.pointerId === fastPointer) { fastPointer = null; return; }    // a hold, not a shot
    if (ev.pointerType === 'mouse') {
        if (!mouseDown) return;
        mouseDown = false;
        const at = mouseDownAt; mouseDownAt = null;
        if (phase !== 'aim' || !mouseAim) return;
        if (at?.onL && !at.moved) { pickUpLauncher(); return; }    // a click on the launcher picks it up
        // Pointing beside the board is a real aim (a sharp angle into a corner needs it), so a
        // click anywhere on the page fires. Only letting go outside the window entirely counts
        // as changing your mind.
        if (ev.clientX < 0 || ev.clientY < 0 || ev.clientX > window.innerWidth || ev.clientY > window.innerHeight) { cancelAim(); return; }
        const drawn = guideAngle ?? shownAngle();
        hideGuide();
        fire(drawn);
        return;
    }
    if (!aiming) return;
    aiming = false;
    if (touchDown?.onL && !touchDown.moved && ev.timeStamp - touchDown.t < LAUNCHER_TAP_MS && phase === 'aim') { pickUpLauncher(); return; }
    if (touchDown?.fromMove && phase === 'aim') { keyAim = false; aimTarget = aimAngle = angleToward(ev); guideAngle = null; }   // picked up, then a plain touch: aim there
    if (aimCancel || phase !== 'aim') { hideGuide(); return; }
    // A quick tap: the aim and guide stay where you tapped, nothing fires.
    if (touchDown && !touchDown.moved && ev.timeStamp - touchDown.t < TAP_MS) { keyAim = true; return; }   // (keeps the guide drawn)
    const drawn = guideAngle ?? shownAngle();   // the angle the guide on screen was drawn for
    hideGuide();
    fire(drawn);
});

let turnTime = 0;
const LONG_TURN = 10;   // seconds: a turn this long gets Boop's tip about holding to speed up
function fire(angle) {
    worldSettling = false;
    turnTime = 0;
    turnPops = 0;
    autoSpeed = 1;
    mouseAim = false;
    moveMode = false;
    sim.fire(angle);
    lastShotAngle = angle;
    lastShotX = launchAt().x;
    lastShot.rotation.z = angle;
    audio.shot();
    runStarted = true;
    phase = 'play';
    hideNote();
}
canvas.addEventListener('pointercancel', () => { if (grabbing) endGrab(); aiming = false; fastPointer = null; hideGuide(); });
canvas.addEventListener('lostpointercapture', (ev) => { if (ev.pointerId === fastPointer) fastPointer = null; });
window.addEventListener('blur', () => { fastPointer = null; fastKey = false; });

function updateAim(ev) {
    if (!touchDown.moved && Math.hypot(ev.clientX - touchDown.x, ev.clientY - touchDown.y) > TAP_PX) {
        touchDown.moved = true;
        // Picked up and slid: move it.
        if (touchDown.fromMove) { startGrab(ev, { clientX: touchDown.x, clientY: touchDown.y }); moveGrab(ev); return; }
        // Started on the launcher and went sideways along the top: that's a move, not an aim.
        if (touchDown.onL && launcherDragIsMove(ev, touchDown)) { startGrab(ev, { clientX: touchDown.x, clientY: touchDown.y }); moveGrab(ev); return; }
    }
    if (touchDown.fromMove && !touchDown.moved) return;   // picked up: not decided yet
    // Off the board: put the guide away; letting go here doesn't fire. Back on: aiming again.
    if (offBoard(ev)) { if (!aimCancel) { aimCancel = true; hideGuide(); } return; }
    aimCancel = false;
    aimTarget = angleToward(ev);
}

function easeAim(frameDt) {
    aimTarget = clampAim(aimTarget);       // the launcher may have moved since the last aim
    aimAngle += (aimTarget - aimAngle) * (1 - Math.exp(-frameDt * AIM_EASE));
    barrelPivot.rotation.z = shownAngle();
}

// ---------- callouts ----------
// A zone's one-line note points at the thing it's about, instead of covering the top.

const note = $('note'), buddy = $('buddy');
let noteShown = false;
function noteTargetPoint() {
    const t = sim.s.noteTarget;
    if (t?.kind === 'open') return { x: W / 2, y: -3.9, r: 0, buddy: true };   // (placeNote lays Buddy out under his bubble)   // the buddy, centred, below the pause and launcher
    if (!t || t.kind === 'launcher') return { x: launcher.position.x, y: LAUNCHER.y, r: 0.45 };
    if (t.kind === 'block' && sim.s.blocks[t.id]) {
        const p = sim.world.getRigidBody(sim.s.blocks[t.id].body).translation();
        return { x: p.x, y: p.y, r: 0.7 };
    }
    if (t.kind === 'pickup' && sim.s.pickups[t.id]) {
        const pk = sim.s.pickups[t.id];
        return { x: pk.x, y: pk.y, r: 0.35 };
    }
    if (t.kind === 'prop' && sim.s.props[t.id]) {
        const pr = sim.s.props[t.id];
        if (pr.kind === 'vine') {
            // The middle of the vine (or what's left of it).
            const l = pr.links[Math.floor(pr.links.length / 2)];
            if (!l) return null;
            const p = sim.world.getRigidBody(l.body).translation();
            return { x: p.x, y: p.y, r: 0.4 };
        }
        if (pr.kind === 'bomb') return { x: pr.x, y: pr.y, r: 0.55 };
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
    const rPx = t.buddy ? 23 : Math.abs(edge.x - c.x);
    buddy.toggleAttribute('hidden', !t.buddy);   // an SVG has no .hidden property
    const w = note.offsetWidth, h = note.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight, gutter = 16, gap = 12;
    if (t.buddy) {
        // Buddy's tips have a fixed layout: the bubble near the top of the board, centred on
        // it, and Buddy standing right below it (never the other way round).
        const top = Math.max(renderer.domElement.getBoundingClientRect().top + 54, gutter);
        const left = Math.min(vw - gutter - w, Math.max(gutter, c.x - w / 2));
        note.style.left = `${left}px`;
        note.style.top = `${top}px`;
        note.style.setProperty('--arrow-x', `${Math.min(w - 18, Math.max(18, c.x - left))}px`);
        note.classList.remove('below');
        buddy.style.left = `${c.x}px`;
        buddy.style.top = `${top + h + gap + rPx}px`;
        return;
    }
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
// Tips fade away rather than blink off.
const FADE_MS = 300;
let noteTimer = 0, fadeTimer = 0;
// The buddy's tips are onboarding, so they're a short moment you acknowledge: the board
// dims behind him, taps can't reach it, and a "Got it" button (live after a beat, so a tap
// already on its way doesn't skip him) closes it. Tips that point at a thing stay light:
// they close by themselves when you start aiming.
const shade = $('tipshade');
let buddyTalking = false;
const ACK_DELAY_MS = 900;
function showNote(text) {
    clearTimeout(noteTimer); clearTimeout(fadeTimer);
    note.textContent = text;
    note.hidden = false;
    note.classList.remove('fading'); buddy.classList.remove('fading');
    noteShown = true;
    buddyTalking = !!noteTargetPoint()?.buddy;
    note.classList.toggle('ack', buddyTalking);
    if (buddyTalking) {
        const ok = document.createElement('button');
        ok.type = 'button';
        ok.className = 'ack-btn';
        ok.textContent = 'Got it';
        ok.disabled = true;
        ok.addEventListener('click', () => { hideNote(); canvas.focus({ preventScroll: true }); });
        note.appendChild(ok);
        shade.hidden = false;
        shade.classList.remove('fading');
        noteTimer = setTimeout(() => { ok.disabled = false; ok.focus({ preventScroll: true }); }, ACK_DELAY_MS);
    }
    placeNote();
}

// ---------- tips ----------
// Every tip shows once per device, one at a time. Two kinds:
//  - things: the first time a windmill, jelly block, +1 ring... shows up, a callout points
//    at it and stays until you aim;
//  - the buddy's tour: game-wide basics (launching, nails, shots...), said by the block buddy
//    when they first come up; you acknowledge these with "Got it".
// Tips wait in a queue for a quiet moment: the start of a turn with nothing else on screen.
const tipQueue = [];
function showTip(tip) {
    sim.s.noteTarget = tip.target ?? { kind: 'open' };
    showNote(tip.text);
    if (tip.key) {
        writeTips({ ...readTips(), [tip.key]: true });
        sim.s.seen = { ...sim.s.seen, [tip.key]: true };
    }
}
const tipDue = (tip) => !tip.key || !readTips()[tip.key];
const targetLives = (t) => !t || t.kind === 'open' || t.kind === 'launcher'
    || (t.kind === 'block' && sim.s.blocks[t.id]) || (t.kind === 'prop' && sim.s.props[t.id]) || (t.kind === 'pickup' && sim.s.pickups[t.id]);
function nextTip() {
    if (noteShown || phase !== 'aim' || paused()) return;
    while (tipQueue.length) {
        const tip = tipQueue.shift();
        if (!tipDue(tip)) continue;
        if (!targetLives(tip.target)) continue;     // gone already; it'll be introduced next time one shows up
        showTip(tip);
        return;
    }
}
function tourTip(key, text, { now = false, stay = false, first = false } = {}) {
    const tip = { key, text, stay };
    if (!tipDue(tip) || tipQueue.some((t) => t.key === key)) return;
    // Things on the board get introduced first; a tour tip only jumps in when none are waiting.
    // (The very basics, launching and hits, always go first.)
    if (now && !noteShown && (first || !tipQueue.some((t) => t.target && tipDue(t)))) showTip(tip);
    else tipQueue.push(tip);
}
// A new zone: introduce, in order, each kind of thing in it that hasn't been explained yet,
// pointing at the first one. They go ahead of anything else waiting.
function queueZoneTips() {
    const s = sim.s, tips = [];
    if (s.note) tips.push({ key: null, text: s.note, target: s.noteTarget ?? { kind: 'launcher' } });   // an upgrade
    // Relaxed mode skips the tips about new things: they're kept for the regular game.
    if (s.relaxed) { tipQueue.unshift(...tips); return; }
    const blocks = Object.values(s.blocks), props = Object.values(s.props), pickups = Object.values(s.pickups);
    const add = (key, target) => { if (target && tipDue({ key }) && !tipQueue.some((t) => t.key === key)) tips.push({ key, text: THING_TIPS[key], target }); };
    const block = (f) => { const b = blocks.find(f); return b && { kind: 'block', id: b.id }; };
    const prop = (k) => { const p = props.find((x) => x.kind === k); return p && { kind: 'prop', id: p.id }; };
    add('ring', pickups[0] && { kind: 'pickup', id: pickups[0].id });
    add('single', block((b) => b.cells.length === 1 && !b.neutral && !b.jello && !b.loose));
    add('resting', block((b) => b.loose && !b.hung));
    add('jelly', block((b) => b.jello));
    add('grey', block((b) => b.neutral && !b.bomb));
    add('cup', block((b) => b.cup));
    add('windmill', prop('windmill'));
    add('mushroom', prop('mushroom'));
    add('vine', prop('vine'));
    add('bomb', prop('bomb'));
    add('seesaw', block((b) => b.seesaw && !b.loose));
    add('hangbomb', block((b) => b.bomb && b.hung != null));
    add('gold', block((b) => b.gold));
    if (privateTab && s.depth >= 2 && tipDue({ key: 'private' })) {
        tips.unshift({ key: 'private', text: "Nice dig! Heads up: you're in private mode, so I can't save your run if you leave." });
    }
    tipQueue.unshift(...tips);
}
function hideNote() {
    clearTimeout(noteTimer);
    if (!noteShown) return;
    noteShown = false;
    buddyTalking = false;
    note.classList.add('fading'); buddy.classList.add('fading'); shade.classList.add('fading');
    fadeTimer = setTimeout(() => { note.hidden = true; buddy.setAttribute('hidden', ''); shade.hidden = true; }, FADE_MS);
}

// ---------- turn flow ----------

let acc = 0, settleSteps = 0, descendT = 0, shake = 0;
let autoSpeed = 1, hitStop = 0, lastStopAt = -Infinity, turnPops = 0;
const AUTO_AFTER = 4, AUTO_FAST = 1.8;      // seconds into a turn; how much faster the last balls go
function stopFor(sec) {                    // a hit stop, but never twice in quick succession (chains)
    const now = performance.now();
    if (now - lastStopAt < 250) return;
    lastStopAt = now;
    hitStop = Math.max(hitStop, sec);
}
// Ball positions before the latest step, so drawing can glide between steps.
const prevBallPos = new Map();
let stepAlpha = 1;


function readBest() { try { return Number(localStorage.getItem('boop-best-depth')) || 0; } catch { return 0; } }
function writeBest(d) { try { localStorage.setItem('boop-best-depth', String(d)); } catch { /* storage blocked */ } }

function gameOver() {
    const d = sim.s.depth, before = readBest(), best = Math.max(before, d);
    writeBest(best);
    clearSave();
    audio.over();
    phase = 'over';
    $('over-result').textContent = `You reached depth ${d}.`;
    // One line of how the run went: blocks popped, and zones cleared under par if any.
    const popped = sim.s.popped ?? 0, under = sim.s.underPar ?? 0;
    $('over-stats').textContent = !popped ? '' : [`${popped} block${popped === 1 ? '' : 's'} popped`,
        under ? `${under} zone${under === 1 ? '' : 's'} under par` : ''].filter(Boolean).join(' · ');
    const isNew = d > before && before > 0;
    $('over-best').textContent = isNew ? `New best! (was ${before})` : `Best depth: ${best}`;
    $('over-best').classList.toggle('new', isNew);
    // Buddy has a kind word, whatever happened.
    const cheers = [
        "So close! You'll dig even deeper next time.",
        'Nice run! Shake it off and go again.',
        "Those blocks won't know what hit them next time.",
        'Great digging! One more go?',
        "Every run teaches you something. You've got this!",
    ];
    $('over-say').textContent = isNew ? 'New best! I knew you had it in you.' : cheers[Math.floor(Math.random() * cheers.length)];
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

const TIDY_EVERY = 5;           // zones between tidy-ups (see tidyUp)
function startZone() {
    if (runStarted) audio.clear();
    sim.genZone();
    tintField();
    if (sim.s.bonusPaid != null) {                       // just out of a bonus stage: what it paid
        addFloater(sim.s.bonusPaid > 0 ? `Bonus +${sim.s.bonusPaid}` : 'Bonus over', W / 2, -2.2);
        sim.s.bonusPaid = null;
    }
    leafPiles?.seed(sim.s.blocks, sim.s.depth);
    if (sim.s.depth % TIDY_EVERY === 0) tidyUp();
    zoneOffset = -H;
    descendT = 0;
    phase = 'descend';
}

// Every few zones, as the next one slides in: tidy the physics bookkeeping, forget any sketch
// material no longer on screen, and let the renderer drop its cached draw lists.
function tidyUp() {
    sim.tidy();
    const live = new Set();
    scene.traverse((o) => { if (o.material) live.add(o.material); });
    for (let i = sketchMats.length - 1; i >= 0; i--) if (!live.has(sketchMats[i])) sketchMats.splice(i, 1);
    renderer.renderLists.dispose();
}

// The turn is over when the last ball is gone. If shots are left you can aim straight
// away: blocks still tumbling or swinging keep moving while you aim (worldSettling), and
// the guide keeps up with them. Only the very last shot waits for the board to settle,
// since a tumble could still clear the zone before the game-over check.
let worldSettling = false;
function endTurn() {
    if (turnTime > LONG_TURN) tourTip('fast', finePointer
        ? 'Waiting on a long bounce? Hold the mouse button (or Space) while balls fly to speed things up.'
        : 'Waiting on a long bounce? Press and hold anywhere while balls fly to speed things up.');
    if (sim.blockCount() === 0) { startZone(); return; }
    settleSteps = 0;
    if (sim.s.bonus && sim.s.bonus.shots <= 0) { phase = 'settle'; return; }       // last bonus shot: let it finish, then move on
    if (sim.s.supply > 0 || sim.s.bonus) { worldSettling = true; readyToAim(); return; }
    phase = 'settle';
}

function readyToAim() {
    consumeEvents();
    if (sim.blockCount() === 0) { startZone(); return; }   // cleared (the last blocks may have tumbled out)
    if (sim.s.bonus && sim.s.bonus.shots <= 0) { startZone(); return; }   // the bonus stage is over: on to the next zone
    if (!sim.s.bonus && sim.s.supply <= 0) { gameOver(); return; }
    phase = 'aim';
    if (runStarted) saveRun();
    nextTip();
}

// ---------- saving ----------
// The run is saved in this browser at the start of every turn (board settled, nothing
// in flight): the physics world as bytes, the game state as JSON. Closing the page
// mid-shot loses only that shot. Game over or New game clears it.
const SAVE_KEY = 'boop-save-v1', RELAXED_SAVE_KEY = 'boop-save-relaxed-v1';
const saveKey = () => (relaxed ? RELAXED_SAVE_KEY : SAVE_KEY);   // each mode keeps its own run
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
        localStorage.setItem(saveKey(), JSON.stringify({ depth: sim.s.depth, world: toBase64(world), s }));
    } catch { /* storage full or blocked: the game just isn't saved */ }
}
function clearSave() { try { localStorage.removeItem(saveKey()); } catch { /* storage blocked */ } }
function loadRun() {
    try {
        const raw = localStorage.getItem(saveKey());
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
    for (const v of blockViews.values()) discard(v.group);
    for (const g of pickupViews.values()) discard(g);
    for (const v of propViews.values()) discard(v.group);
    for (const f of fadingProps) discard(f.v.group);
    for (const b of booms) discard(b.ring);
    booms.length = 0;
    fadingProps.length = 0;
    for (const v of ballViews.values()) discard(v.group);
    for (const f of fadingBalls) discard(f.group);
    fadingBalls.length = 0;
    blockViews.clear(); pickupViews.clear(); propViews.clear(); ballViews.clear();
    crumbs.clear();
    leafPiles?.clear();
    keyAim = false;
    if (saved) {
        sim = saved;
        tintField();
        leafPiles?.seed(sim.s.blocks, sim.s.depth);
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
    sim.s.relaxed = relaxed;
    lastShotAngle = null;
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
            queueZoneTips();
            if (!sim.s.relaxed) writeTips({ ...readTips(), ...sim.s.seen });
            readyToAim();
        }
        return;
    }
    const settlingWhileAiming = phase === 'aim' && worldSettling;
    if (phase !== 'play' && phase !== 'settle' && !settlingWhileAiming) return;

    const s = sim.s;
    // Last balls: once only one or two are still bouncing a few seconds into the turn, the
    // game eases up to a bit faster by itself (holding still speeds it up more).
    const shots = s.shots;
    const trickle = phase === 'play' && turnTime > AUTO_AFTER && !(shots && shots.left > 0) && s.balls.length <= 2 && (shots?.fired ?? 0) >= 1;
    autoSpeed += ((trickle ? AUTO_FAST : 1) - autoSpeed) * (1 - Math.exp(-frameDt * 2));
    // Hit stop: a big pop, a bomb or a nail coming out holds everything for a blink.
    if (hitStop > 0 && !fastForward()) hitStop = Math.max(0, hitStop - frameDt);
    else acc += frameDt * (fastForward() ? FAST : autoSpeed);   // real time, unless you're holding to speed up
    if (phase === 'play') turnTime += frameDt;
    let n = 0;
    while (acc >= DT && n < 30) {
        acc -= DT; n++;
        prevBallPos.clear();
        for (const b of s.balls) { const t = sim.world.getRigidBody(b.body).translation(); prevBallPos.set(b.body, [t.x, t.y]); }
        sim.step();
        if (phase === 'play' && sim.blockCount() === 0) { zoneCleared(); break; }
        if (phase === 'play' && sim.turnDone()) { endTurn(); break; }
        if (phase === 'settle' && (sim.settled() || ++settleSteps > MAX_SETTLE_STEPS)) { readyToAim(); break; }
        if (phase === 'aim' && worldSettling) {
            if (sim.blockCount() === 0) { worldSettling = false; startZone(); break; }   // the last blocks tumbled out
            guideAngle = null;      // the board moved: the guide needs working out again
            if (sim.settled() || ++settleSteps > MAX_SETTLE_STEPS) { worldSettling = false; break; }
        }
    }
    if (n >= 30) acc = 0;   // tab was in the background; don't try to catch up
    // How far we are toward the next step: draw balls that far between their last two positions.
    // Without this, screens faster than the physics (90/120 Hz) show balls moving in uneven hops.
    stepAlpha = Math.min(1, acc / DT);
    consumeEvents();
}

let last = performance.now();
let slowFrames = 0, timedFrames = 0;
const recentDt = [];
function watchFrameRate(rawDt) {
    // The screen's own pace: the quicker frames of the last second or so (120 or 60 a second,
    // or 30 when an iPhone is in Low Power Mode). A frame is slow only if it misses that pace,
    // so a phone capped at 30 isn't treated as struggling. Over each 60 frames, if a quarter
    // or more were slow, drop to the next resolution step.
    recentDt.push(rawDt); if (recentDt.length > 90) recentDt.shift();
    const pace = recentDt.length < 20 ? 1 / 60 : [...recentDt].sort((a, b) => a - b)[Math.floor(recentDt.length * 0.25)];
    timedFrames += 1;
    if (rawDt > pace * 1.6) slowFrames += 1;
    if (timedFrames < 60) return;
    if (slowFrames >= 15 && pixelStep < PIXEL_RATIOS.length - 1) {
        pixelStep += 1;
        renderer.setPixelRatio(PIXEL_RATIOS[pixelStep]);
        fitCamera();
    }
    slowFrames = 0;
    timedFrames = 0;
}
let lastRender = -Infinity, lastInput = 0, animating = false;

// Frame pacing: a steady rate feels smoother than one that wanders. Aim for 60 a second
// (on a 120 Hz screen that also halves the work); if this device can't hold 60, settle
// at a steady 30 instead of bouncing between them, and try 60 again later when there's
// room. Gameplay speed doesn't change: the physics runs on its own fixed clock.
let targetFps = 60, lastPaced = -Infinity, paceFrames = 0, paceMissed = 0, paceWork = 0, paceWindows = 0;
function pace(now, workMs) {
    const interval = 1000 / targetFps;
    paceFrames += 1;
    if (now - lastPaced > interval * 1.5) paceMissed += 1;       // this frame came late
    paceWork += workMs;
    lastPaced = now;
    if (paceFrames < 60) return;
    const missed = paceMissed / paceFrames, work = paceWork / paceFrames;
    if (targetFps === 60 && missed > 0.25) paceWindows = paceWindows > 0 ? paceWindows + 1 : 1;
    else if (targetFps === 30 && work < 6 && missed < 0.05) paceWindows = paceWindows < 0 ? paceWindows - 1 : -1;
    else paceWindows = 0;
    if (paceWindows >= 2) { targetFps = 30; paceWindows = 0; }          // two rough seconds: settle at 30
    if (paceWindows <= -10) { targetFps = 60; paceWindows = 0; }        // ~20 easy seconds: try 60 again
    paceFrames = paceMissed = paceWork = 0;
}
for (const type of ['pointerdown', 'pointermove', 'keydown', 'wheel']) {
    window.addEventListener(type, () => { lastInput = performance.now(); }, { passive: true, capture: true });
}
function frame(now) {
    // Skip screen refreshes that come sooner than the target rate.
    if (now - last < 1000 / targetFps - 2) { requestAnimationFrame(frame); return; }
    const workStart = performance.now();
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
        if ((aiming || keyAim || mouseAim) && phase === 'aim') {
            easeAim(dt);
            if (keyAim || mouseAim || !aimCancel) { drawGuide(shownAngle()); inkGuide(dt); }
        }
        if (noteShown) placeNote();
        animating = false;          // set by syncView if anything on the board is still moving
        syncView(dt);
        crumbs.update(dt);
    }
    // Short shake when a tumbling block lands hard.
    shake = Math.max(0, shake - frameDt * 0.6);
    camera.position.set((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, 0);
    // Don't redraw a picture that hasn't changed. Behind the start, pause and game-over screens
    // nothing moves (except a zone sliding in): twice a second. While you're deciding on a
    // shot and nothing on the board is moving: ten times a second. Anything moving, or your
    // finger on the board, and it's back to every frame. (Saves battery, mostly.)
    const still = sim && paused() && phase !== 'descend';
    const idle = sim && !still && phase === 'aim' && !aiming && !keyAim && !worldSettling && !animating && shake === 0
        && now - lastInput > 400 && !crumbs.active();   // (while aiming the world only steps when worldSettling)
    const every = still ? 500 : idle ? 100 : 0;
    if (now - lastRender >= every) { renderer.render(scene, camera); lastRender = now; }
    if (!document.hidden && rawDt < 0.5) pace(now, performance.now() - workStart);
    requestAnimationFrame(frame);
}

// ---------- light / dark ----------
// Follows the system setting until the player picks one; the pick is remembered.

const themeButton = $('theme-toggle');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
function readThemePick() { try { return localStorage.getItem('boop-theme'); } catch { return null; } }
function writeThemePick(v) { try { localStorage.setItem('boop-theme', v); } catch { /* storage blocked */ } }

// Digging down: the field darkens a step every 10 depths (11, 21, 31), like layers of earth.
// Subtle, and in both light and dark.
const FIELD_DEEP = { light: 0xe3cfab, dark: 0x0e0b09 };
const fieldColor = new THREE.Color(), deepColor = new THREE.Color();
function tintField() {
    const band = Math.min(3, Math.floor(((sim?.s.depth ?? 1) - 1) / 10));
    fieldColor.setHex(theme.field).lerp(deepColor.setHex(FIELD_DEEP[themeName()]), band * 0.14);
    fieldMat.uniforms.uField.value.copy(fieldColor);
}
function themeName() { return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'; }
function applyTheme(name) {
    theme = THEMES[name];
    document.documentElement.dataset.theme = name;
    renderer.setClearColor(theme.paper);
    tintField();
    fieldMat.uniforms.uHatch.value.setHex(theme.line);
    fieldMat.uniforms.uStrength.value = name === 'dark' ? 0.08 : 0.12;   // light paper needs a touch more to show
    lineMat.color.setHex(theme.line);
    outlineMat.color.setHex(theme.edge);
    setSketchInk(theme.line, theme.edge);
    // Bombs follow the theme too.
    const look = BOMB_LOOK[name];
    fuseMat.color.setHex(look.fuse);
    shadeMat.color.setHex(look.shade);
    for (const v of propViews.values()) {
        if (!v.bomb) continue;
        v.bomb.body.material.uniforms.uFill.value.setHex(look.body);
        v.bomb.body.material.uniforms.uInk.value.setHex(theme.edge);
        v.bomb.cap.material.uniforms.uFill.value.setHex(look.cap);
    }
    ballMat.color.setHex(theme.ball);
    dotInk.setHex(theme.line);
    dotFade.setHex(theme.guideEnd);
    dotHit.setHex(theme.hit);
    lastShotMat.color.setHex(theme.line);
    railMat.color.setHex(theme.line);
    arrowMat.color.setHex(theme.line);
    JELLO.text = theme.jelloText;
    for (const v of blockViews.values()) {
        v.mesh.material.uniforms.uInk.value.setHex(theme.edge);
        if (v.bomb) {
            v.bomb.body.material.uniforms.uFill.value.setHex(look.body);
            v.bomb.body.material.uniforms.uInk.value.setHex(theme.edge);
            v.bomb.cap.material.uniforms.uFill.value.setHex(look.cap);
        } else if (v.neutral) v.mesh.material.uniforms.uFill.value.setHex(NEUTRAL[name]);
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

const menu = $('menu'), howto = $('howto'), over = $('over'), news = $('news'), settings = $('settings');
const TAGLINE = $('menu-tagline').textContent;
// ---------- what's new ----------
// One entry per release that adds something worth telling (hotfixes get none). Returning
// players see the nudge on the start screen, once per entry; the page lists them all.
// To announce a release: add an entry at the top (newest first). Keep `line` short (Boop
// says it), 3-5 items, each a picture (img/...) or an icon from ICON, a title and a sentence.
const ICON = {
    aim: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l12 7-5.5 1.5L9 17z"/><path d="M12.5 12.5l5 5"/></svg>',
    sound: '<svg viewBox="0 0 22 22"><path d="M3 8.5h3.5L11 4.5v13l-4.5-4H3z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14.5 8a4 4 0 0 1 0 6"/><path d="M17 5.5a7.5 7.5 0 0 1 0 11"/></g></svg>',
    fast: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l7 6-7 6z"/><path d="M13 6l7 6-7 6z"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M12 8.5v6M9 11.5h6"/></svg>',
    summary: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 19V11M12 19V5M19 19v-5"/></svg>',
    awake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>',
    finger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13V6a1.5 1.5 0 0 1 3 0v5.5"/><path d="M13 11v-1a1.5 1.5 0 0 1 3 0v1.5"/><path d="M16 11.5a1.5 1.5 0 0 1 3 0v3a6.5 6.5 0 0 1-6.5 6.5h-.5a5.5 5.5 0 0 1-4.6-2.5L5 15.3a1.6 1.6 0 0 1 2.7-1.8L10 16"/><path d="M8 4.6a3.5 3.5 0 0 1 7 0" stroke-width="1.6"/></svg>',
    move: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="6.2"/><circle cx="12" cy="12" r="2.4"/><path d="M18.00 12.00L21.00 12.00M16.24 16.24L18.36 18.36M12.00 18.00L12.00 21.00M7.76 16.24L5.64 18.36M6.00 12.00L3.00 12.00M7.76 7.76L5.64 5.64M12.00 6.00L12.00 3.00M16.24 7.76L18.36 5.64" stroke-width="3.6" stroke-linecap="butt"/></svg>',
    relax: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c-2-2.7-3.5-4-5.5-4a4 4 0 0 0 0 8c2 0 3.5-1.3 5.5-4s3.5-4 5.5-4a4 4 0 0 1 0 8c-2 0-3.5-1.3-5.5-4z"/></svg>',
    shapes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 4h7v7H6.5v6H3z"/><path d="M13 9h8v4h-4v7h-4z"/></svg>',
};
const WHATS_NEW = [
    {
        version: '1.5',
        line: 'New in 1.5: Relaxed mode, for an easygoing game (or a young player).',
        items: [
            { icon: 'relax', title: 'Relaxed mode', text: 'Turn it on in Settings for simpler zones, smaller numbers and shots that never run out. It keeps its own run: switch back and yours is right where you left it.' },
        ],
    },
    {
        version: '1.4',
        line: 'New in 1.4: move the launcher, and touch right where you want to aim.',
        items: [
            { icon: 'move', title: 'Move the launcher', text: 'Tap it, then drag it anywhere along the top for a better angle (or slide it sideways straight away). It stays where you leave it. On a keyboard: Alt (Option) with ← →.' },
            { icon: 'finger', title: 'Touch to aim', text: 'Touch where you want the ball to go and the launcher points right there. Slide to adjust, let go to fire. A quick tap just aims. Slide off the board to cancel.' },
            { icon: 'gear', title: 'Menu and Settings', text: 'The game pauses by itself when you switch apps. Menu, under the board, pauses too. Sound now lives in Settings.' },
        ],
    },
    {
        version: '1.2.3',
        line: 'New in 1.2.3: hold to speed up, a run summary, and a home screen icon.',
        items: [
            { icon: 'fast', title: 'Hold to speed up', text: 'Ball stuck looping between a block and the ceiling? Press and hold anywhere while balls fly (or hold Space) and the turn plays three times as fast. Let go and it slows back down.' },
            { icon: 'summary', title: 'Run summary', text: 'Game over now says how many blocks you popped and how many zones you cleared under par.' },
            { icon: 'home', title: 'Add to Home Screen', text: "Boop has its own icon and opens full screen, with no browser bars. In Safari: Share, then Add to Home Screen. (A run saved in Safari doesn't carry over.)" },
            { icon: 'awake', title: 'Screen stays on', text: "While you play, your phone won't dim or lock in the middle of a long bounce." },
        ],
    },
    {
        version: '1.2',
        line: 'New in 1.2: vines, bombs and sound!',
        items: [
            { img: 'img/meet-vine.webp', title: 'Vines', text: 'Garlands and hanging vines from depth 9. Snap them and whatever they hold drops.' },
            { img: 'img/meet-bomb.webp', title: 'Bombs', text: 'A rare treat from depth 15. Hit one twice to light it, then stand back.' },
            { icon: 'sound', title: 'Sound', text: 'Soft chiptune notes that build into a little tune as your hits chain. Off until you turn it on in Settings, or with M.' },
            { icon: 'aim', title: 'Aiming', text: 'With a mouse or trackpad, point and click. Aim while blocks are still settling. Changed your mind? Slide off the board, right-click or press Esc.' },
            { icon: 'shapes', title: 'Fresher zones', text: 'More interlocking shapes and more blocks resting loose, so no two zones feel the same.' },
        ],
    },
];
const NEWS_KEY = 'boop-news-seen';
const NEWS_BUBBLE_MIN_H = 860;
const GREET_MIN_H = 620;          // a holiday greeting is one short line: it fits on most phones   // screen height (CSS px) with room for Boop's line on the start screen
function readNewsSeen() { try { return localStorage.getItem(NEWS_KEY); } catch { return null; } }
function markNewsSeen() { try { localStorage.setItem(NEWS_KEY, WHATS_NEW[0].version); } catch { /* storage blocked */ } }
// Someone who's played before (a best depth, tips seen, or a saved run) and hasn't seen the
// latest entry gets Boop's line, until they play or open the page.
function showNewsLine() {
    let played = readBest() > 0 || Object.keys(readTips()).length > 0;
    try { played = played || !!localStorage.getItem(SAVE_KEY) || !!localStorage.getItem(RELAXED_SAVE_KEY); } catch { /* storage blocked */ }
    const fresh = played && readNewsSeen() !== WHATS_NEW[0].version && (!runStarted || fromSave);   // not on a mid-run pause
    // The link beside Send feedback says what's new until it's been seen (no extra room needed).
    const link = $('btn-news');
    link.innerHTML = fresh ? `<span class="new-dot" aria-hidden="true"></span>New in ${WHATS_NEW[0].version}` : "What's new";
    link.classList.toggle('fresh', fresh);
    // Where there's room (tablets, desktop), Boop says it too.
    const bubble = fresh && window.innerHeight >= NEWS_BUBBLE_MIN_H;
    // Around a holiday (see season.js), Boop says the greeting instead, on the start screen only.
    const greet = !bubble && !!seasonGreeting && (!runStarted || fromSave) && window.innerHeight >= GREET_MIN_H;
    $('menu-say-text').textContent = bubble ? WHATS_NEW[0].line : greet ? seasonGreeting : '';
    $('btn-news-say').hidden = !bubble;
    $('menu-say').hidden = !bubble && !greet;
}
$('news-list').innerHTML = WHATS_NEW.map((r) => `<h3>Version ${r.version}</h3><ul class="meet">${r.items.map((it) =>
    `<li>${it.img ? `<img src="${it.img}" alt="" width="64" height="64">` : `<span class="icon" aria-hidden="true">${ICON[it.icon]}</span>`}<div><b>${it.title}</b><span class="say-more">${it.text}</span></div></li>`).join('')}</ul>`).join('');
if (!menu.hidden) { showNewsLine(); menuTagline(); }

// Private tabs throw site storage away when they close, so a saved run can't last. Boop says
// so once, after the first zone is cleared: the first progress there is to lose.
// Browsers don't say so outright; Safari and Firefox give it away by refusing their
// private file storage. Chrome's incognito isn't caught (it keeps storage until the
// last incognito window closes, so runs mostly survive there anyway).
async function isPrivateTab() {
    try { await navigator.storage?.getDirectory?.(); return false; }
    catch (e) { return /unknown transient reason|security error/i.test(String(e?.message ?? e)); }
}
let privateTab = false;
isPrivateTab().then((p) => { privateTab = p; });

// The one line under the logo. New players: what the game is. Returning players already
// know that: their best depth. Mid-run: where you are.
function menuTagline() {
    const best = relaxed ? 0 : readBest();          // Relaxed runs don't count toward the best depth
    $('menu-mode').hidden = !relaxed;
    $('menu-tagline').textContent = runStarted ? (fromSave ? `Saved run · Depth ${sim.s.depth}` : `Paused · Depth ${sim.s.depth}`)
        : best > 0 ? `Best depth: ${best}` : relaxed ? 'Bounce balls, dig deeper.' : TAGLINE;   // short, with the Relaxed label under it
    $('menu-tagline').classList.toggle('state', runStarted);
}
// While you play, the screen stays on: a long bounce with no touching shouldn't let the
// phone dim or lock mid-shot. Paused, a screen up, or the tab hidden: the phone decides again.
let wakeLock = null, wantAwake = false;
async function keepAwake(on) {
    wantAwake = on;
    try {
        if (on && !wakeLock && navigator.wakeLock && !document.hidden) {
            const lock = await navigator.wakeLock.request('screen');
            lock.addEventListener('release', () => { if (wakeLock === lock) wakeLock = null; });
            if (wantAwake) wakeLock = lock; else lock.release();     // paused while it was asked for
        } else if (!on && wakeLock) {
            const lock = wakeLock; wakeLock = null;
            await lock.release();
        }
    } catch { /* not allowed (low battery, an older browser): the phone's own timer applies */ }
}
const paused = () => !menu.hidden || !howto.hidden || !over.hidden || !news.hidden || !settings.hidden;
function showScreen(which, moveFocus = true) {
    if (which && pendingBuild) setTimeout(applyUpdate, 0);   // a newer build is waiting: now's a good moment
    if (which) {                          // stop any aim in progress
        aiming = false; keyAim = false; keyTurn = 0;
        hideGuide();
    }
    menu.hidden = which !== 'menu';
    howto.hidden = which !== 'howto';
    over.hidden = which !== 'over';
    news.hidden = which !== 'news';
    settings.hidden = which !== 'settings';
    if (which) { grabbing = null; moveMode = false; }
    document.body.classList.toggle('howto-open', which === 'howto' || which === 'news' || which === 'settings');
    document.body.classList.toggle('playing', !which);
    keepAwake(!which);
    audio.setActive(!which || which === 'over');   // quiet while paused; the game-over notes still play
    if (which === 'menu') {
        // Mid-run, the start screen is the pause screen: Resume, or start over.
        menuTagline();
        $('btn-play').textContent = !runStarted ? 'Play' : fromSave ? 'Continue' : 'Resume';
        $('btn-new').hidden = !runStarted;
        $('btn-menu-close').setAttribute('aria-label', runStarted ? 'Close and resume' : 'Close and play');
        showNewsLine();
        if (moveFocus) $('btn-play').focus();
    } else if (which === 'over') {
        if (moveFocus) $('btn-again').focus();
    } else if (which === 'news') {
        news.scrollTop = 0;
        $('btn-news-play').textContent = !runStarted ? 'Play' : fromSave ? 'Continue' : 'Resume';
        $('btn-news-back').focus();
        markNewsSeen();
    } else if (which === 'settings') {
        settings.scrollTop = 0;
        $('btn-settings-play').textContent = !runStarted ? 'Play' : fromSave ? 'Continue' : 'Resume';
        showSoundState();
        if (moveFocus) $('btn-settings-back').focus();
    } else if (which === 'howto') {
        howto.scrollTop = 0;
        $('btn-howto-play').textContent = !runStarted ? 'Play' : fromSave ? 'Continue' : 'Resume';
        $('btn-howto-back').focus();
    }
}
function play() {
    markNewsSeen();          // a new player's first game, or a returning one who's read the line: done
    showScreen(null);
    // First game ever: the buddy says how to launch, and stays until you start aiming.
    if (phase === 'aim' && !runStarted) {
        // Buddy's whole tour is two tips: this one, and one after your first shot.
        tourTip('intro', finePointer
            ? "Hi, I'm Boop! Point to aim, then click to fire a ball at a block. Tap the launcher, then drag, to move it. Each hit knocks its number down. Pop every block to dig deeper!"
            : "Hi, I'm Boop! Touch where you want to aim, then let go to fire a ball at a block. Tap the launcher, then drag, to move it. Each hit knocks its number down. Pop every block to dig deeper!", { now: true, stay: true, first: true });
        // Next in the tour, ahead of the things on the board: what nails mean.
        const basics = { key: 'basics', text: 'Nailed blocks stay put till you knock their nails out. Shots are limited: clear zones and grab +1 rings for more!' };
        if (!relaxed && tipDue(basics) && !tipQueue.some((t) => t.key === 'basics')) tipQueue.unshift(basics);
    }
    nextTip();
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
$('btn-news').addEventListener('click', () => showScreen('news'));
$('btn-news-say').addEventListener('click', () => showScreen('news'));
$('btn-news-back').addEventListener('click', () => showScreen('menu'));
$('btn-news-close').addEventListener('click', () => showScreen('menu'));
$('btn-news-play').addEventListener('click', play);
$('btn-howto-close').addEventListener('click', () => showScreen('menu'));
$('btn-menu-close').addEventListener('click', play);
// Pause: Menu (under the board), Escape or P, or leaving the app or tab mid-run all bring up
// the start screen.
$('btn-open-menu').addEventListener('click', () => showScreen('menu'));
$('btn-settings').addEventListener('click', () => showScreen('settings'));
$('btn-settings-back').addEventListener('click', () => showScreen('menu'));
$('btn-settings-close').addEventListener('click', () => showScreen('menu'));
$('btn-settings-play').addEventListener('click', play);
$('btn-new').addEventListener('click', () => { restart(); play(); });
$('btn-again').addEventListener('click', () => { restart(); play(); });
$('btn-over-menu').addEventListener('click', () => { restart(); showScreen('menu'); });
const autoPause = () => { if (runStarted && document.body.classList.contains('playing')) showScreen('menu', false); };
document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); else checkForUpdate(); });

// Updates. A Home Screen app (and a long-open tab) keeps the page it already has: reopening
// it doesn't load anything new. So on start and whenever the game comes back to the front,
// ask the server which build is current. If it's newer, save the run and reload, but only
// while a screen is up (start, pause, game over), never in the middle of playing; otherwise
// it waits for the next screen. Tried once per build, so a stale cache can't cause a loop.
async function checkForUpdate() {
    if (Date.now() - lastUpdateCheck < 10000) return;   // at most every 10 s
    lastUpdateCheck = Date.now();
    try {
        const res = await fetch(`./?check=${Date.now()}`, { cache: 'no-store' });
        const m = res.ok && (await res.text()).match(/data-build="([^"]+)"/);
        if (!m || m[1] === BUILD) return;
        try { if (sessionStorage.getItem('boop-update-tried') === m[1]) return; } catch { /* storage blocked */ }
        pendingBuild = m[1];
        applyUpdate();
    } catch { /* offline: keep playing what we have */ }
}
function applyUpdate() {
    if (!pendingBuild || !paused()) return;
    try { sessionStorage.setItem('boop-update-tried', pendingBuild); } catch { /* storage blocked */ }
    if (runStarted) saveRun();
    location.replace(`./?v=${encodeURIComponent(pendingBuild)}`);
}
window.addEventListener('blur', autoPause);

const AIM_KEYS = { ArrowLeft: -1, ArrowRight: 1, a: -1, d: 1, A: -1, D: 1 };
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (!over.hidden) return;             // the run is over: nothing to pause or resume
        if (!paused() && phase === 'aim' && (aiming || keyAim || mouseDown || moveMode)) { cancelAim(); return; }   // first, put an aim (or a picked-up launcher) away
        if (!howto.hidden || !news.hidden || !settings.hidden) showScreen('menu');
        else if (!menu.hidden) play();
        else showScreen('menu');
        return;
    }
    // Alt (Option) + left/right slides the launcher along the top.
    if (e.altKey && !e.metaKey && !e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        if (paused() || buddyTalking || phase !== 'aim' || e.target.closest?.('button, a, input')) return;
        e.preventDefault();
        sim.moveLauncher(launchAt().x + (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 0.05 : 0.25));
        markLauncherMoved();
        if (!keyAim) { keyAim = true; aiming = false; aimTarget = aimAngle; hideNote(); }
        return;
    }
    if (paused() || e.metaKey || e.ctrlKey || e.altKey) return;
    if ((e.key === 'p' || e.key === 'P') && !e.target.closest?.('input')) { showScreen('menu'); return; }   // pause always works
    if ((e.key === 'm' || e.key === 'M') && !e.target.closest?.('input')) { setSound(!audio.on); return; }      // M: sound on/off
    if (buddyTalking) return;    // the buddy is talking: "Got it" first
    // Let buttons and links (pause, theme, Games) handle their own keys.
    if (e.target.closest?.('button, a, input')) return;
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
        if (holdToFast()) { fastKey = true; return; }      // held while balls bounce: speed up
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
    if (e.key === 'Alt' && runStarted && phase === 'aim') saveRun();
    if (e.key === ' ' || e.key === 'Enter') fastKey = false;
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
checkForUpdate();

// For automated checks.
window.__boop = {
    get sim() { return sim; },
    get phase() { return phase; },
    fire: (angle) => fire(angle),
    get ballColors() { return [...ballViews.values()].map((v) => v.fill.material.color.getHexString()); },
    get aim() { return shownAngle(); },
    get feel() { return { autoSpeed, hitStop, turnPops }; },
    get moveMode() { return moveMode; },
    get railOn() { return rail.visible; },
    get fast() { return fastForward(); },
    get guideInk() { return dots.material.opacity; },
    get pixelRatio() { return renderer.getPixelRatio(); },
    get soundOn() { return audio.on; },
    get targetFps() { return targetFps; },
    get guide() { return { angle: guideAngle, contacts: lastContacts, cost: guideCost }; },
    // For checks: why the board isn't idling (each should be false/0 for it to drop to ~10 fps).
    get idleBlockers() { return { aiming, keyAim, worldSettling, animating, shake, crumbs: crumbs.active(), unsettled: !sim.settled() }; },
    // For checks: GPU objects alive and things in the scene, to catch anything left behind.
    get stats() { let n = 0; scene.traverse(() => { n++; }); return { geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, sceneObjects: n, renders: renderer.info.render.frame, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, sketchMats: sketchMats.length }; },
    // Screen position of a point in the field, so tests can aim with real pointer input.
    toScreen(x, y) {
        const v = new THREE.Vector3(x, y, 0).project(camera);
        const r = renderer.domElement.getBoundingClientRect();
        return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
    },
};
checkSideways();   // in case the page opens with the phone already on its side
