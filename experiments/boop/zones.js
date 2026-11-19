// Boop: zone recipes. Which shapes exist, how zones are laid out, and what each
// depth contains. Pure data and small helpers; sim.js builds the zones from these.

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
    return vs.map((c) => ({ c, w: sh.w / vs.length, canon, size: c.length }));
});

// What each zone holds. New things arrive one at a time, then numbers climb.
// jello = chance the zone has any jello at all; when it does, it's 1 block (2 now and then deeper down).
export const PROP_NOTES = {
    windmill: 'Windmills spin when hit and swat the next ball.',
    mushroom: 'Mushrooms grow off walls and blocks. Their caps kick balls back harder.',
};

export function zoneSpec(d) {
    const base = {
        cups: d >= 2 ? Math.min(0.8, 0.25 + d * 0.04) : 0,
        neutral: d >= 7 ? Math.min(4, 1 + Math.floor((d - 7) / 3)) : 0,
    };
    if (d === 1) return { ...base, lo: 1, hi: 2.5, fill: 0.4, props: 0, loose: 0, jello: 0, tough: 0 };
    if (d === 2) return { ...base, lo: 1, hi: 4, fill: 0.44, props: 1, loose: 0, jello: 0, tough: 0 };
    if (d === 3) return { ...base, lo: 2, hi: 5, fill: 0.46, props: 1, loose: 0.2, jello: 0, tough: 0,
        note: 'Some blocks only rest on others. Pop what holds them up and they tumble.' };
    if (d === 4) return { ...base, lo: 2, hi: 6, fill: 0.48, props: 2, loose: 0.2, jello: 1, tough: 0.04,
        note: 'Jelly blocks: balls pass right through, slowed down. Each pass takes 1 off.' };
    // Past the intro, everything that's been introduced keeps showing up more.
    return {
        ...base,
        lo: 1 + d * 0.35, hi: 3 + d * 0.9, fill: Math.min(0.58, 0.48 + d * 0.008),
        props: Math.min(4, 1 + Math.floor((d - 1) / 3)),
        loose: Math.min(0.36, 0.16 + d * 0.015),
        jello: Math.min(0.85, 0.35 + d * 0.04),
        tough: Math.min(0.12, 0.04 + d * 0.008),
        note: d === 7 ? 'Grey blocks can\'t be broken. Use them to bounce shots where you want.' : undefined,
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
export const MIN_PICKUP_GAP = 3.5;         // +1 pickups are always this many cells apart or more

