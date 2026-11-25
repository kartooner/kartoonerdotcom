// Boop: zone recipes. Which shapes exist, how zones are laid out, and what each
// depth contains. Pure data and small helpers; sim.js builds the zones from these.
(globalThis.boopBuilds = globalThis.boopBuilds || []).push('1.5-36');   // build stamp: game.js checks every file matches

// Cell offsets as [col, row]; row grows downward. Weight = how often it shows up.
export const SHAPES = [
    { w: 6, c: [[0, 0]] },
    { w: 4, c: [[0, 0], [1, 0]] },
    { w: 4, c: [[0, 0], [0, 1]] },
    { w: 3, c: [[0, 0], [1, 0], [0, 1], [1, 1]] },
    { w: 2, c: [[0, 0], [1, 0], [2, 0]] },
    { w: 2, c: [[0, 0], [0, 1], [0, 2]] },
    { w: 2, c: [[0, 0], [0, 1], [1, 1]] },
    { w: 2, c: [[0, 0], [1, 0], [1, 1]] },
    { w: 2, c: [[1, 0], [0, 1], [1, 1]] },
    { w: 2, c: [[0, 0], [1, 0], [0, 1]] },
    { w: 1, c: [[0, 0], [1, 0], [2, 0], [1, 1]] },
    { w: 1, c: [[0, 0], [0, 1], [0, 2], [1, 2]] },
    { w: 1, c: [[0, 0], [1, 0], [1, 1], [2, 1]] },
    // Big ones, so zones mix large and small: easy to hit, with numbers to chip away at.
    { w: 2, c: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]] },              // 3x2
    { w: 2, c: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]] },              // 2x3
    { w: 1, c: [[0, 0], [1, 0], [2, 0], [3, 0]] },                              // long bar
    { w: 1, c: [[0, 0], [0, 1], [0, 2], [0, 3]] },                              // tall bar
    { w: 1, c: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]] },                      // big L
    { w: 1, c: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]] },                      // big T
    { w: 0.6, c: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]] }, // 3x3
];
// Every shape can appear rotated or mirrored, so the same piece rarely looks the same twice.
// "canon" names a shape whatever way it's turned, for the repeat limits below.
function normCells(cells) {
    const mx = Math.min(...cells.map(([x]) => x)), my = Math.min(...cells.map(([, y]) => y));
    return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}
const cellKey = (cells) => cells.map((c) => c.join(',')).join(' ');
function variantsOf(cells) {
    const out = new Map();
    for (const start of [cells, cells.map(([x, y]) => [-x, y])]) {
        let cur = start;
        for (let r = 0; r < 4; r++) {
            const n = normCells(cur);
            out.set(cellKey(n), n);
            cur = cur.map(([x, y]) => [-y, x]);
        }
    }
    return [...out.values()];
}
export const SHAPE_VARIANTS = SHAPES.flatMap((sh) => {
    const vs = variantsOf(sh.c);
    const canon = [...vs.map(cellKey)].sort()[0];
    // rect: a plain rectangle or bar; long: its longest side. Used to keep zones from filling
    // up with straight pieces (see the shape weights in sim.js).
    const xs = sh.c.map(([x]) => x), ys = sh.c.map(([, y]) => y);
    const bw = Math.max(...xs) - Math.min(...xs) + 1, bh = Math.max(...ys) - Math.min(...ys) + 1;
    const rect = bw * bh === sh.c.length, long = Math.max(bw, bh);
    return vs.map((c) => ({ c, w: sh.w / vs.length, canon, size: c.length, rect, long }));
});

// What each zone holds. New things arrive one at a time, then numbers climb.
// jello = chance the zone has any jello at all; when it does, it's 1 block (2 now and then deeper down).
// What each thing says the first time it shows up. The tip points at it (see game.js).
export const THING_TIPS = {
    windmill: 'Windmills spin when hit and swat the next ball.',
    mushroom: 'Mushrooms grow off walls and blocks. Their caps kick balls back harder.',
    vine: 'Vines snap after a few hits. Anything they hold drops.',
    bomb: 'Hit a bomb twice to light it. It bursts and knocks a chunk off everything around it.',
    seesaw: 'A seesaw: one nail in the middle. Hit an end and it tips, and anything on it slides off.',
    hangbomb: 'A bomb on a vine! Hit it twice to light it, or cut the vine and it bursts where it lands.',
    gold: 'A gold block! Pop it before this zone is cleared and a bonus stage comes next.',
    ring: 'Fly a ball through a +1 ring for an extra shot.',
    resting: 'No nails: this block just rests. Knock out what holds it up and it tumbles.',
    jelly: 'Jelly: balls pass right through, slowed down. Each pass takes 1 off.',
    grey: "Grey blocks can't be broken. Bank shots off them, or knock their nails out and they crumble.",
    cup: 'A cup: drop a ball in to grab the +1 and rattle around.',
    single: 'Grey nails never come out. This one stays put until you pop it.',
};

export function zoneSpec(d) {
    const base = {
        cups: d >= 2 ? Math.min(0.8, 0.25 + d * 0.04) : 0,
        neutral: d >= 7 ? Math.min(4, 1 + Math.floor((d - 7) / 3)) : 0,
    };
    if (d === 1) return { ...base, lo: 1, hi: 2.5, fill: 0.4, props: 0, loose: 0, jello: 0, tough: 0 };
    if (d === 2) return { ...base, lo: 1, hi: 4, fill: 0.44, props: 1, loose: 0, jello: 0, tough: 0 };
    if (d === 3) return { ...base, lo: 2, hi: 5, fill: 0.46, props: 1, loose: 0.2, jello: 0, tough: 0 };
    if (d === 4) return { ...base, lo: 2, hi: 6, fill: 0.48, props: 1, loose: 0.2, jello: 0, tough: 0.04 };
    // Past the intro, everything that's been introduced keeps showing up more.
    // Numbers keep climbing, but more slowly past depth 8 so they stay readable, and slower
    // again past 16, where zones should go quicker and the layouts do the work.
    // Slower still past 16, and flat from 45: deeper than that, layouts and bonus stages carry it.
    const dn = Math.min(d, 45);
    const n = dn <= 8 ? dn : dn <= 16 ? 8 + (dn - 8) * 0.6 : 12.8 + (dn - 16) * 0.3;
    return {
        ...base,
        lo: 1 + n * 0.35, hi: 3 + n * 0.9, fill: Math.min(0.58, 0.48 + d * 0.008),
        // Props stay light through the early and middle zones, then crowd in.
        props: d <= 11 ? 2 : d <= 15 ? 3 : 4,
        loose: Math.min(d >= 20 ? 0.5 : 0.42, 0.18 + d * 0.016),     // deeper down, more blocks just resting
        jello: d === 5 ? 1 : Math.min(0.85, 0.35 + d * 0.04),     // jelly is introduced at 5
        tough: Math.min(0.12, 0.04 + d * 0.008),
    };
}

// How a zone's blocks sit together. Picked per zone so layouts vary.
//   packed:  blocks butt up against each other
//   airy:    every block has breathing room, some sit a little off the grid
//   mixed:   some of each
//   stacked: more loose blocks, more tall bars, more leaning (from zone 3)
export const STYLES = {
    packed: { fill: 0.06, gap: 0, jitter: 0, loose: 1, tall: 1, lean: 0.12 },
    airy: { fill: -0.04, gap: 0.6, jitter: 1, loose: 1, tall: 1, lean: 0.12 },
    mixed: { fill: 0, gap: 0.5, jitter: 0.5, loose: 1, tall: 1, lean: 0.14 },
    stacked: { fill: 0.02, gap: 0.3, jitter: 0, loose: 1.9, tall: 3, lean: 0.22 },
};
// Props keep their distance early on so shots have room; deeper, they may bunch up.
export const propGap = (d) => (d <= 15 ? 4.5 : 3);
export const MIN_PICKUP_GAP = 3.5;         // +1 pickups are always this many cells apart or more


// When things first show up. A new thing arrives every few zones all the way down:
// windmills and cups 2, resting blocks 3, mushrooms 4, jelly 5, two balls 6, grey 7,
// vines 9, three balls 11, seesaws 13, bombs 15, four balls 16, hanging bombs 18.
export const MUSHROOM_FROM = 4;
const INTRO_DEPTHS = new Set([2, 3, 4, 5, 6, 7, 9, 11, 13, 15, 16, 18]);

// Recipes: what a zone leans on, so deep zones don't all blur into the same mix.
// from = first depth it can show up (the zone after everything it needs is introduced);
// w = how often. A zone that introduces something stays plain, so the new thing has the
// stage; otherwise a zone picks one the depth allows, never the same as the last one.
export const RECIPES = [
    { name: 'plain', from: 1, w: 3 },
    { name: 'windmills', from: 3, w: 0.5 },   // a windmill garden: three windmills (now and then)
    { name: 'tower', from: 4, w: 1 },         // stacked: more resting blocks to topple
    { name: 'pinball', from: 5, w: 1 },       // three mushrooms, airy layout
    { name: 'jelly', from: 6, w: 0.8 },       // two or three jelly blocks
    { name: 'greymaze', from: 8, w: 0.8 },    // extra grey blocks to bank off
    { name: 'vines', from: 10, w: 0.8 },      // two vines
    { name: 'seesaws', from: 14, w: 0.7 },    // two seesaws
    { name: 'bombs', from: 16, w: 0.6 },      // two bombs
];
// From depth 25 a zone can mix two recipes ("vines+bombs", "tower+seesaws"...), more often the
// deeper you go (about half of zones from 30), so the deep end keeps turning up setups you
// haven't seen. A few pairs don't mix (both decide the props, or the layout).
const COMBO_FROM = 25;
const CLASH = [['windmills', 'pinball'], ['tower', 'pinball'], ['windmills', 'greymaze']];   // (windmills over grey pieces walled a zone off)
const clash = (a, b) => CLASH.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
// Relaxed mode leaves out the recipes built on things it doesn't have.
const NOT_RELAXED = new Set(['greymaze', 'vines', 'seesaws']);
export function pickRecipe(d, last, rand, relaxed = false) {
    if (INTRO_DEPTHS.has(d)) return 'plain';
    const RECIPES_OK = relaxed ? RECIPES.filter((r) => !NOT_RELAXED.has(r.name)) : RECIPES;
    const weighted = (pool) => {
        let pick = rand() * pool.reduce((n, r) => n + r.w, 0);
        for (const r of pool) if ((pick -= r.w) <= 0) return r;
        return pool[pool.length - 1];
    };
    if (d >= COMBO_FROM && rand() < Math.min(0.55, 0.25 + (d - COMBO_FROM) * 0.06)) {
        const pool = RECIPES_OK.filter((r) => r.from <= d && r.name !== 'plain');
        const a = weighted(pool);
        const b = weighted(pool.filter((r) => r !== a && !clash(r.name, a.name)));
        const name = [a.name, b.name].sort().join('+');
        if (name !== last) return name;
    }
    return weighted(RECIPES_OK.filter((r) => r.from <= d && r.name !== last)).name;
}
