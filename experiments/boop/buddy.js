// Boop!: the block buddy's little life. He always breathes (CSS). Every few seconds,
// at random, he opens his eyes and either blinks or glances around, then settles.
// Tap him and he wiggles.
// Each buddy on the page keeps its own timing. With reduced motion he doesn't breathe
// or wiggle, but still blinks and glances: small, and nothing on screen moves around.
(globalThis.boopBuilds = globalThis.boopBuilds || []).push('1.5-39');   // build stamp: game.js checks every file matches

const still = window.matchMedia('(prefers-reduced-motion: reduce)');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const between = (a, b) => a + Math.random() * (b - a);

async function blink(face) {
    face.style.setProperty('--lid', '0.15');
    await wait(110);
    face.style.setProperty('--lid', '1');
    await wait(120);
}

// His eyes are closed and content most of the time. Blinks only happen with them open.
async function open(face) {
    face.classList.add('awake');
    await wait(between(300, 600));
}
async function close(face) {
    face.style.setProperty('--look-x', '0px');
    face.style.setProperty('--look-y', '0px');
    await wait(between(250, 500));
    face.classList.remove('awake');
}

async function lookAround(face) {
    // One to three glances: left, right, up, or back to the middle; now and then a blink.
    const spots = [[-2.6, 0], [2.6, 0], [-1.8, -1.2], [1.8, -1.2], [0, 0]];
    const glances = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < glances; i++) {
        const [x, y] = spots[Math.floor(Math.random() * spots.length)];
        face.style.setProperty('--look-x', `${x}px`);
        face.style.setProperty('--look-y', `${y}px`);
        await wait(between(450, 1000));
        if (Math.random() < 0.3) await blink(face);
    }
}

async function blinkAWhile(face) {
    await wait(between(300, 700));
    await blink(face);
    if (Math.random() < 0.3) { await wait(160); await blink(face); }   // a double blink now and then
    await wait(between(400, 900));
}

// Tap him and he wiggles, eyes open, then settles.
let busy = new WeakSet();
async function wiggle(face) {
    if (still.matches) return;
    face.classList.remove('wiggling');
    void face.getBoundingClientRect();          // restart the animation if tapped again
    face.classList.add('wiggling');
    if (busy.has(face)) return;
    busy.add(face);
    face.classList.add('awake');
    await wait(700);
    face.classList.remove('wiggling');
    await blink(face);
    await wait(500);
    if (!face.dataset.acting) face.classList.remove('awake');
    busy.delete(face);
}

async function live(face) {
    await wait(between(800, 3000));            // don't start in step with the other buddy
    for (;;) {
        await wait(between(2500, 7000));
        if (document.hidden || busy.has(face)) continue;
        face.dataset.acting = '1';
        await open(face);
        if (Math.random() < 0.45) await blinkAWhile(face);
        else await lookAround(face);
        await close(face);
        delete face.dataset.acting;
    }
}

document.querySelectorAll('.buddy-face').forEach((face) => {
    live(face);
    face.addEventListener('pointerdown', (e) => { e.stopPropagation(); wiggle(face); });
});
