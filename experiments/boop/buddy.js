// Boop!: the block buddy's little life. He always breathes (CSS). Every few seconds,
// at random, he either blinks or opens his eyes and glances around, then settles.
// Each buddy on the page keeps its own timing. Nothing happens with reduced motion.

const still = window.matchMedia('(prefers-reduced-motion: reduce)');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const between = (a, b) => a + Math.random() * (b - a);

async function blink(face) {
    face.style.setProperty('--lid', '0.15');
    await wait(110);
    face.style.setProperty('--lid', '1');
    await wait(120);
}

async function lookAround(face) {
    face.classList.add('awake');
    await wait(between(350, 700));
    // One to three glances: left, right, up, or back to the middle.
    const spots = [[-2.6, 0], [2.6, 0], [-1.8, -1.2], [1.8, -1.2], [0, 0]];
    const glances = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < glances; i++) {
        const [x, y] = spots[Math.floor(Math.random() * spots.length)];
        face.style.setProperty('--look-x', `${x}px`);
        face.style.setProperty('--look-y', `${y}px`);
        await wait(between(450, 1000));
        if (Math.random() < 0.25) await blink(face);
    }
    face.style.setProperty('--look-x', '0px');
    face.style.setProperty('--look-y', '0px');
    await wait(between(250, 500));
    face.classList.remove('awake');
}

async function live(face) {
    await wait(between(800, 3000));            // don't start in step with the other buddy
    for (;;) {
        await wait(between(2500, 7000));
        if (still.matches || document.hidden) continue;
        if (Math.random() < 0.5) {
            await blink(face);
            if (Math.random() < 0.2) { await wait(140); await blink(face); }   // a double blink now and then
        } else {
            await lookAround(face);
        }
    }
}

document.querySelectorAll('.buddy-face').forEach(live);
