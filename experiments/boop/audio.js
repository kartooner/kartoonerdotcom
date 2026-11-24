// Boop: sound. Soft, rounded chiptune made in the browser (no sound files), kept calm:
// - every note comes from one five-note scale, so overlapping sounds harmonise
// - each hit in a shot plays the next note of a short rising phrase, and popping a block
//   lands the phrase's closing note (in the spirit of Wind Waker's sword combos; our own
//   little phrases). The phrase starts over every shot.
// - only a few sounds at once, hits on the same block a moment apart merge, a soft limiter,
//   low volume, and silence while paused or hidden.
// Off by default. Nothing is created until sound is turned on (browsers need a tap first).
(globalThis.boopBuilds = globalThis.boopBuilds || []).push('1.4.1-1');   // build stamp: game.js checks every file matches

const SCALE = [0, 2, 4, 7, 9];            // major pentatonic, in semitones
const ROOT = 392;                         // G4: warm, not shrill
const MAX_VOICES = 6;
const MERGE = 0.06;                       // seconds: hits on one block closer than this are one sound

// A note from the scale: step 0 is the root, 5 is the root an octave up, and so on.
const note = (step) => ROOT * 2 ** ((SCALE[((step % 5) + 5) % 5] + 12 * Math.floor(step / 5)) / 12);

// Combo phrases: scale steps a shot's hits climb through. Past the end, the last few repeat.
const PHRASES = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [0, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7],
    [0, 1, 2, 4, 3, 5, 6, 8, 7, 9],
    [2, 1, 3, 2, 4, 5, 4, 6, 7, 9],
];

export function makeAudio() {
    let ctx = null, master = null, noiseBuf = null;
    let on = false, active = true, voices = 0;
    let phrase = PHRASES[0], combo = 0;
    const lastHit = new Map();
    let lastJelly = 0, lastBoing = 0;

    function start() {
        if (ctx) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -20; limiter.knee.value = 12; limiter.ratio.value = 8;
        limiter.attack.value = 0.003; limiter.release.value = 0.2;
        master = ctx.createGain();
        master.gain.value = 0.22;
        master.connect(limiter);
        limiter.connect(ctx.destination);
        noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const live = () => on && active && ctx && ctx.state === 'running';

    // One rounded note: a filtered triangle (or sine) with a quick, soft attack and a fade.
    function tone({ f, type = 'triangle', dur = 0.16, vol = 0.35, at = 0, glide = 0, cutoff = 2200 }) {
        if (!live() || voices >= MAX_VOICES) return;
        const t = ctx.currentTime + at;
        const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f, t);
        if (glide) o.frequency.exponentialRampToValueAtTime(f * glide, t + dur);
        lp.type = 'lowpass'; lp.frequency.value = cutoff;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(lp); lp.connect(g); g.connect(master);
        o.start(t); o.stop(t + dur + 0.03);
        voices++;
        o.onended = () => { voices--; o.disconnect(); lp.disconnect(); g.disconnect(); };
    }
    // A short breath of filtered noise: a crayon scratch, a puff, a fwip.
    function puff({ dur = 0.08, vol = 0.05, from = 2600, to = 0, q = 1.2, type = 'bandpass', at = 0 }) {
        if (!live() || voices >= MAX_VOICES) return;
        const t = ctx.currentTime + at;
        const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
        src.buffer = noiseBuf;
        bp.type = type; bp.Q.value = q;
        bp.frequency.setValueAtTime(from, t);
        if (to) bp.frequency.exponentialRampToValueAtTime(to, t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(bp); bp.connect(g); g.connect(master);
        src.start(t); src.stop(t + dur + 0.03);
        voices++;
        src.onended = () => { voices--; src.disconnect(); bp.disconnect(); g.disconnect(); };
    }
    // Where the combo is in its phrase; past the end, the top three notes go round.
    const comboStep = () => phrase[combo < phrase.length ? combo : phrase.length - 3 + ((combo - phrase.length) % 3)];

    return {
        get on() { return on; },
        // Turn sound on or off. Turning it on must happen inside a tap (iPhones require it).
        set(value) {
            on = value;
            if (on) { start(); ctx?.resume(); } else ctx?.suspend();
        },
        // Paused, a screen up, or the tab hidden: go quiet (and let the audio device rest).
        setActive(value) {
            active = value;
            if (!ctx) return;
            if (on && active) ctx.resume(); else ctx.suspend();
        },
        shot() {
            phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
            combo = 0;
            lastHit.clear();
            puff({ dur: 0.07, vol: 0.035, from: 900, to: 2600 });         // a soft fwip
        },
        hit(id) {
            if (!live()) return;
            const now = ctx.currentTime;
            if (now - (lastHit.get(id) ?? -1) < MERGE) return;
            lastHit.set(id, now);
            tone({ f: note(comboStep()), dur: 0.15, vol: 0.32 });
            combo++;
        },
        pop() {
            // The phrase lands: the next root at or above where the combo got to.
            const step = Math.ceil((comboStep() + 1) / 5) * 5;
            tone({ f: note(step), dur: 0.32, vol: 0.38 });
            tone({ f: note(step + 2), dur: 0.26, vol: 0.14, at: 0.02 });
            puff({ dur: 0.06, vol: 0.03, from: 3200 });
        },
        tink() { tone({ f: note(15), type: 'sine', dur: 0.07, vol: 0.12 }); },
        ring() { tone({ f: note(7), type: 'sine', dur: 0.14, vol: 0.2 }); tone({ f: note(9), type: 'sine', dur: 0.2, vol: 0.2, at: 0.07 }); },
        jelly() {
            if (!live() || ctx.currentTime - lastJelly < 0.15) return;
            lastJelly = ctx.currentTime;
            tone({ f: note(-3), type: 'sine', dur: 0.18, vol: 0.18, glide: 0.85 });
        },
        boing() {
            if (!live() || ctx.currentTime - lastBoing < 0.1) return;
            lastBoing = ctx.currentTime;
            tone({ f: note(-1), dur: 0.16, vol: 0.2, glide: 1.6 });
        },
        snap() { tone({ f: note(-2), dur: 0.18, vol: 0.18 }); puff({ dur: 0.05, vol: 0.03, from: 1800 }); },
        fizz() { puff({ dur: 0.45, vol: 0.03, from: 5000, to: 2500, q: 2 }); },     // a fuse catching
        boom() {
            tone({ f: 120, type: 'sine', dur: 0.38, vol: 0.45, glide: 0.4, cutoff: 800 });
            puff({ dur: 0.28, vol: 0.09, from: 900, to: 200, type: 'lowpass', q: 0.7 });
        },
        clear() { [5, 7, 9, 10].forEach((s, i) => tone({ f: note(s), dur: 0.2, vol: 0.26, at: i * 0.08 })); },
        over() { [4, 2, 0].forEach((s, i) => tone({ f: note(s), dur: 0.36, vol: 0.24, at: i * 0.2 })); },
    };
}
