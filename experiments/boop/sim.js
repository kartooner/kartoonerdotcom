// Boop: physics and game rules. No rendering in here.
// The aim preview clones this whole sim and runs it forward, so the guide line
// uses the exact same code and numbers as the real shot.

export const W = 9;                 // field width in cells
export const H = 16;                // field height in cells (y runs 0 → -H)
export const LAUNCHER = { x: W - 0.62, y: -0.62 };
export const DT = 1 / 120;
export const BALL_R = 0.17;
export const BALL_SPEED = 18;      // balls always travel at this speed (jelly aside)
export const START_SUPPLY = 22;
export const START_VOLLEY = 1;      // one ball per shot, so every bounce can be followed
export const ZONE_BONUS = 5;        // balls for clearing a zone
const REFUND_MIN_HP = 8;            // popping a block that started this high gives a ball back

// Balls fly fast and nearly straight: world gravity is light, just a gentle sag.
// Blocks keep a solid, heavy fall through their own gravity scale.
const GRAVITY = -5;
const BLOCK_FALL = 3;               // loose blocks fall as if gravity were -15
const SHOT_GAP = 8;                 // steps between balls in a volley
const HIT_COOLDOWN = 10;            // steps before the same pair can hit again
const MIN_IMPACT = 3;               // a hit only counts if the bounce really changed the ball's speed
// A hit knocks the block a little (it shifts and springs back), so one light ball
// still makes blocks jiggle. Part of the physics, so the guide stays exact.
// Pushed through the centre: off-centre twists were snapping blocks loose.
const KNOCK = 0.04;                 // block speed per unit of impact
const KNOCK_MAX = 0.75;
const BOXED_RADIUS = 0.7;           // a ball that stays this close to one spot...
const BOXED_STEPS = 150;            // ...for this long (1.25s) without scoring is stuck, and gets kicked free
// The launcher earns an extra ball per shot at these zones. A shot still costs 1 ball.
const MULTISHOT_AT = { 6: 2, 11: 3, 16: 4 };
// Par: a target number of shots for each zone, from its total and your balls per shot.
// Clear a zone under par and you get the shots you saved back (up to PAR_BONUS_MAX).
const HP_SCALE = 1.6;               // balls keep full speed, so they hit more: numbers match
const parHpPerShot = (d) => (3.5 + 0.7 * d) * HP_SCALE;   // a good shot does more deeper down (bigger blocks, more traps)
const PAR_BONUS_MAX = 5;
const MIN_SMASH_SPEED = 2.5;        // blocks only hurt each other when they really land
const STUCK_SPEED = 1.2;
const STUCK_STEPS = 60;
// Traps: a ball that keeps scoring hits keeps going. Only a ball that hasn't hit
// anything for a while gets heavier (so turns still end) or gets kicked free.
// Ending a shot cleanly: a ball whose work is done gets "heavy" (gravity bends its path
// down harder and harder at the same speed) and leaves, instead of fading. "Done" means: 2.5s without a scoring hit, or past 5s and
// nothing hit for half a second, or past 9s whatever it's doing. Before 5s a scoring
// hit lifts the weight off again (fast traps keep going); after that it only adds up.
const HEAVY_AFTER = 300;
const WIND_DOWN_AT = 600, WIND_IDLE = 60, TRAP_LIMIT = 1080;
const TURN_CAP = 35 * 120;          // after 35s any balls still out come home
const BLOCK_DENSITY = 1.5;
const ZONE_TOP_ROW = 4;
const ZONE_ROWS = 10;               // rows 4–13; rows 14–15 stay open so balls can leave
const PRESETTLE_STEPS = 720;        // a new zone is run until still before you see it

// Springs that hold pinned blocks near their spot. Per unit of mass, so heavy
// and light blocks wobble at the same rate. Worn-down blocks get weaker springs.
const SPRING_K = 190, SPRING_C = 9.5;
const TWIST_K = 130, TWIST_C = 7;
// A pinned block breaks loose when it's knocked hard (off its spot AND moving fast),
// or when it's pushed very far (a worn block that can't hold its load any more).
// A steady sag under the weight of a resting block doesn't count.
const SNAP_DIST = 0.22, SNAP_SPEED = 1.2, GIVE_WAY_DIST = 0.45;
const SNAP_ANGLE = 0.35, SNAP_SPIN = 1.5, GIVE_WAY_ANGLE = 0.6;

// Jello: balls pass through, slowed hard while inside.
const JELLO_DRAG = 0.94;            // velocity kept per step inside jello
const JELLO_MIN_SPEED = 4;          // but never slower than this, so balls always come out the far side
// Consistent speed: a ball always travels at BALL_SPEED. Bounces and gravity change its
// direction, not how fast it goes. Lost speed (a bounce, a pass through jelly) eases back
// over a few steps instead of snapping, so it reads as smooth, not jerky.
const SPEED_EASE = 0.15;

const G = { BALL: 1, BLOCK: 2, WALL: 4, PICKUP: 8, LOOSE: 16, PROP: 64, JELLO: 128 };
const groups = (member, filter) => ((member & 0xffff) << 16) | (filter & 0xffff);
const BALL_FILTER = G.BALL | G.BLOCK | G.WALL | G.PICKUP | G.LOOSE | G.PROP | G.JELLO;

// Cell offsets as [col, row]; row grows downward. Weight = how often it shows up.
const SHAPES = [
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
const SHAPE_VARIANTS = SHAPES.flatMap((sh) => {
    const vs = variantsOf(sh.c);
    const canon = [...vs.map(cellKey)].sort()[0];
    return vs.map((c) => ({ c, w: sh.w / vs.length, canon, size: c.length }));
});

// What each zone holds. New things arrive one at a time, then numbers climb.
// jello = chance the zone has any jello at all; when it does, it's 1 block (2 now and then deeper down).
export function zoneSpec(d) {
    const base = {
        cups: d >= 2 ? Math.min(0.8, 0.25 + d * 0.04) : 0,
        neutral: d >= 7 ? Math.min(4, 1 + Math.floor((d - 7) / 3)) : 0,
    };
    if (d === 1) return { ...base, lo: 1, hi: 2.5, fill: 0.28, props: 0, loose: 0, jello: 0, tough: 0 };
    if (d === 2) return { ...base, lo: 1, hi: 4, fill: 0.3, props: 1, loose: 0, jello: 0, tough: 0,
        note: 'Windmills spin when hit. Mushrooms kick balls back harder.' };
    if (d === 3) return { ...base, lo: 2, hi: 5, fill: 0.32, props: 1, loose: 0.2, jello: 0, tough: 0,
        note: 'Some blocks only rest on others. Pop what holds them up and they tumble.' };
    if (d === 4) return { ...base, lo: 2, hi: 6, fill: 0.33, props: 2, loose: 0.2, jello: 1, tough: 0.04,
        note: 'Jelly blocks: balls pass right through, slowed down. Each pass takes 1 off.' };
    // Past the intro, everything that's been introduced keeps showing up more.
    return {
        ...base,
        lo: 1 + d * 0.35, hi: 3 + d * 0.9, fill: Math.min(0.42, 0.32 + d * 0.008),
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
const STYLES = {
    packed: { fill: 0.06, gap: 0, jitter: 0, loose: 1, tall: 1, lean: 0.12 },
    airy: { fill: -0.08, gap: 1, jitter: 1, loose: 1, tall: 1, lean: 0.12 },
    mixed: { fill: 0, gap: 0.5, jitter: 0.5, loose: 1, tall: 1, lean: 0.14 },
    stacked: { fill: 0.02, gap: 0.3, jitter: 0, loose: 1.9, tall: 3, lean: 0.22 },
};
const MIN_PICKUP_GAP = 3.5;         // +1 pickups are always this many cells apart or more

// Bigger numbers are bulkier. A block loses some mass as it's worn down, never more than ~18%.
export function blockScale(hp, hp0) {
    const bulk = 0.78 + 0.22 * Math.min(1, Math.log(hp0) / Math.log(60));
    return bulk * (0.82 + 0.18 * Math.max(0, hp) / hp0);
}

export class Sim {
    constructor(R, world, s) {
        this.R = R;
        this.world = world;
        this.s = s;                         // plain data: safe to structuredClone
        this.queue = new R.EventQueue(true);
        this.events = [];                   // read and cleared by the renderer
    }

    static create(R, seed) {
        const world = new R.World({ x: 0, y: GRAVITY });
        world.timestep = DT;
        const s = {
            step: 0, rng: seed | 0, nextId: 1, depth: 0, note: null,
            supply: START_SUPPLY, volley: START_VOLLEY, quiet: false, turnSteps: 0,
            blocks: {}, pickups: {}, props: {}, owner: {}, balls: [], shots: null, cool: {},
        };
        const sim = new Sim(R, world, s);
        sim.buildWalls();
        return sim;
    }

    clone() {
        const world = this.R.World.restoreSnapshot(this.world.takeSnapshot());
        world.timestep = DT;
        return new Sim(this.R, world, structuredClone(this.s));
    }

    free() {
        this.world.free();
        this.queue.free();
    }

    rand() {
        let t = (this.s.rng = (this.s.rng + 0x6D2B79F5) | 0);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    gain(n, x, y) {
        this.s.supply += n;
        this.events.push({ t: 'gain', n, x, y });
    }

    // ---------- fixed parts ----------

    buildWalls() {
        const { R, world, s } = this;
        const body = world.createRigidBody(R.RigidBodyDesc.fixed());
        const wall = (hx, hy, x, y) => {
            const c = world.createCollider(
                R.ColliderDesc.cuboid(hx, hy).setTranslation(x, y)
                    .setRestitution(0.9).setFriction(0.2)
                    .setCollisionGroups(groups(G.WALL, G.BALL | G.LOOSE)), body);
            s.owner[c.handle] = { t: 'wall' };
        };
        wall(0.5, H / 2 + 2, -0.5, -H / 2);
        wall(0.5, H / 2 + 2, W + 0.5, -H / 2);
        wall(W / 2 + 1, 0.5, W / 2, 0.5);
    }

    // ---------- blocks ----------
    // Four kinds: pinned (held on a spring), loose (gravity only, rests on and
    // tumbles off other blocks), jello (balls pass through) and neutral (can't be
    // broken, no number: just something to bounce off).

    addBlock(cells, hp, kind = 'pinned', tilt = 0, dx = 0, dy = 0) {
        const { R, world, s } = this;
        const n = cells.length;
        const cx = cells.reduce((a, [c]) => a + c + 0.5, 0) / n + dx;
        const cy = cells.reduce((a, [, r]) => a - (r + 0.5), 0) / n + dy;
        let desc;
        if (kind === 'jello' || kind === 'neutral') desc = R.RigidBodyDesc.fixed().setTranslation(cx, cy);
        else if (kind === 'loose') desc = R.RigidBodyDesc.dynamic().setTranslation(cx, cy).setRotation(tilt).setGravityScale(BLOCK_FALL)
            .setLinearDamping(0.05).setAngularDamping(0.15);
        else desc = R.RigidBodyDesc.dynamic().setTranslation(cx, cy).setGravityScale(0)
            .setLinearDamping(0.4).setAngularDamping(0.6);
        const body = world.createRigidBody(desc);
        const id = s.nextId++;
        const b = {
            id, body: body.handle, hp, hp0: hp, scale: 1, cols: [],
            jello: kind === 'jello', loose: kind === 'loose', neutral: kind === 'neutral',
            cells: cells.map(([c, r]) => [c + 0.5 - cx + dx, -(r + 0.5) - cy + dy]),
            anchor: [cx, cy], anchorA: 0,
        };
        s.blocks[id] = b;
        this.shapeBlock(b);
        return b;
    }

    // (Re)build a block's colliders at the size its number calls for.
    // Cells scale around the block's centre so they stay joined.
    shapeBlock(b) {
        const { R, world, s } = this;
        const body = world.getRigidBody(b.body);
        for (const h of b.cols) {
            world.removeCollider(world.getCollider(h), false);
            delete s.owner[h];
        }
        const k = b.neutral ? 0.96 : blockScale(b.hp, b.hp0);
        b.scale = k;
        b.cols = b.cells.map(([x, y]) => {
            let d = R.ColliderDesc.cuboid(0.5 * k, 0.5 * k).setTranslation(x * k, y * k);
            if (b.jello) {
                d = d.setSensor(true).setCollisionGroups(groups(G.JELLO, G.BALL))
                    .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS);
            } else if (b.loose) {
                d = d.setDensity(BLOCK_DENSITY).setRestitution(0.2).setFriction(0.8)
                    .setCollisionGroups(groups(G.LOOSE, G.BALL | G.BLOCK | G.LOOSE | G.WALL | G.PROP))
                    .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS);
            } else {
                d = d.setDensity(BLOCK_DENSITY).setRestitution(0.9).setFriction(0.6)
                    .setCollisionGroups(groups(G.BLOCK, G.BALL | G.LOOSE));
            }
            const c = world.createCollider(d, body);
            s.owner[c.handle] = { t: 'block', id: b.id };
            return c.handle;
        });
    }

    // Anything that changes a block's shape can leave loose blocks unsupported.
    wakeLoose() {
        for (const id in this.s.blocks) {
            const b = this.s.blocks[id];
            if (b.loose) this.world.getRigidBody(b.body).wakeUp();
        }
    }

    removeBlock(b, popped) {
        const { world, s } = this;
        const p = world.getRigidBody(b.body).translation();
        world.removeRigidBody(world.getRigidBody(b.body));
        for (const h of b.cols) delete s.owner[h];
        delete s.blocks[b.id];
        if (b.jello) for (const ball of s.balls) ball.jello = ball.jello.filter((j) => j !== b.id);
        this.events.push({ t: 'pop', id: b.id, x: p.x, y: p.y, jello: b.jello });
        if (popped && !s.quiet && !b.neutral && b.hp0 >= REFUND_MIN_HP * (1 + (s.volley - 1) * 0.7)) this.gain(1, p.x, p.y);
        this.wakeLoose();
    }

    damageBlock(id, n = 1) {
        const b = this.s.blocks[id];
        if (!b || b.neutral) return;
        b.hp -= n;
        if (b.hp <= 0) { this.removeBlock(b, true); return; }
        this.shapeBlock(b);
        this.wakeLoose();
        const p = this.world.getRigidBody(b.body).translation();
        this.events.push({ t: 'hit', id, x: p.x, y: p.y });
    }

    // Spring breaks: the block becomes loose for good and falls.
    snap(b) {
        const body = this.world.getRigidBody(b.body);
        b.loose = true;
        body.setGravityScale(BLOCK_FALL, true);
        body.setLinearDamping(0.05);
        body.setAngularDamping(0.15);
        this.shapeBlock(b);
        const p = body.translation();
        this.events.push({ t: 'snap', id: b.id, x: p.x, y: p.y });
    }

    applySprings() {
        const { world, s } = this;
        for (const id in s.blocks) {
            const b = s.blocks[id];
            if (b.jello || b.loose || b.neutral) continue;
            const body = world.getRigidBody(b.body);
            if (body.isSleeping()) continue;
            const p = body.translation(), v = body.linvel();
            const a = body.rotation(), w = body.angvel();
            const m = body.mass(), I = body.principalInertia();
            const weak = 0.3 + 0.7 * b.hp / b.hp0;
            body.applyImpulse({
                x: m * DT * (-SPRING_K * weak * (p.x - b.anchor[0]) - SPRING_C * v.x),
                y: m * DT * (-SPRING_K * weak * (p.y - b.anchor[1]) - SPRING_C * v.y),
            }, false);
            body.applyTorqueImpulse(I * DT * (-TWIST_K * weak * (a - b.anchorA) - TWIST_C * w), false);
        }
    }

    updateBlocks() {
        const { world, s } = this;
        for (const id in s.blocks) {
            const b = s.blocks[id];
            if (b.jello || b.neutral) continue;
            const body = world.getRigidBody(b.body);
            const p = body.translation();
            if (b.loose) {
                if (p.y < -H - 2) this.removeBlock(b, true);
            } else {
                const off = Math.hypot(p.x - b.anchor[0], p.y - b.anchor[1]);
                const v = body.linvel(), speed = Math.hypot(v.x, v.y);
                const turn = Math.abs(body.rotation() - b.anchorA), spin = Math.abs(body.angvel());
                if ((off > SNAP_DIST && speed > SNAP_SPEED) || off > GIVE_WAY_DIST ||
                    (turn > SNAP_ANGLE && spin > SNAP_SPIN) || turn > GIVE_WAY_ANGLE) this.snap(b);
            }
        }
    }

    settled() {
        const { world, s } = this;
        for (const id in s.blocks) {
            const b = s.blocks[id];
            if (b.jello) continue;
            const body = world.getRigidBody(b.body);
            if (body.isSleeping()) continue;
            const v = body.linvel();
            if (Math.abs(v.x) + Math.abs(v.y) > 0.05 || Math.abs(body.angvel()) > 0.05) return false;
        }
        return true;
    }

    // Blocks left to clear. Neutral blocks don't count: they can't be broken.
    blockCount() {
        let n = 0;
        for (const id in this.s.blocks) if (!this.s.blocks[id].neutral) n += 1;
        return n;
    }

    hpLeft() {
        let n = 0;
        for (const id in this.s.blocks) if (!this.s.blocks[id].neutral) n += Math.max(0, this.s.blocks[id].hp);
        return n;
    }

    // ---------- zones ----------

    clearZoneLeftovers() {
        const { world, s } = this;
        for (const id in s.pickups) {
            world.removeRigidBody(world.getRigidBody(s.pickups[id].body));
            delete s.owner[s.pickups[id].col];
        }
        s.pickups = {};
        for (const id in s.props) {
            const pr = s.props[id];
            for (const h of pr.bodies) world.removeRigidBody(world.getRigidBody(h));
            for (const h of pr.cols) delete s.owner[h];
        }
        s.props = {};
        for (const id in s.blocks) if (s.blocks[id].neutral) this.removeBlock(s.blocks[id], false);
    }

    genZone() {
        const s = this.s;
        if (!s.retries) s.pendingPar = s.par ? Math.min(PAR_BONUS_MAX, Math.max(0, s.par - s.zoneShots)) : 0;
        this.clearZoneLeftovers();
        s.depth += 1;
        const spec = zoneSpec(s.depth);
        s.note = spec.note ?? null;
        s.noteTarget = null;
        const upgrade = MULTISHOT_AT[s.depth];
        if (upgrade) {
            s.volley = upgrade;
            s.note = `Upgrade: your launcher now fires ${upgrade} balls per shot. Each shot still costs 1.`;
            s.noteTarget = { kind: 'launcher' };
        }
        // Zone 3 introduces resting blocks, so it always has somewhere for them to rest.
        const names = s.depth < 3 ? ['packed', 'airy', 'mixed'] : s.depth === 3 ? ['stacked', 'packed'] : ['packed', 'airy', 'mixed', 'stacked'];
        const styleName = names[Math.floor(this.rand() * names.length)];
        const style = STYLES[styleName];
        s.style = styleName;

        // grid[r][c] = 0 free, -1 prop, otherwise the index+1 of the planned block.
        const grid = Array.from({ length: ZONE_ROWS }, () => new Array(W).fill(0));
        const free = (c, r) => c >= 0 && c < W && r >= 0 && r < ZONE_ROWS && grid[r][c] === 0;
        // Fairness: never fill a whole row, so there's always a way down.
        const rowOk = (cells) => {
            const rows = new Set(cells.map(([, r]) => r));
            for (const r of rows) {
                const used = grid[r].filter((g) => g !== 0).length + cells.filter(([, rr]) => rr === r).length;
                if (used >= W) return false;
            }
            return true;
        };

        // Props first, so blocks fill in around them.
        for (let i = 0, tries = 0; i < spec.props && tries < 50; tries++) {
            const windmill = this.rand() < 0.5;
            const c = Math.floor(this.rand() * (W - 1)), r = Math.floor(this.rand() * (ZONE_ROWS - 1));
            const cells = windmill ? [[c, r], [c + 1, r], [c, r + 1], [c + 1, r + 1]] : [[c, r]];
            if (!cells.every(([cc, rr]) => free(cc, rr))) continue;
            cells.forEach(([cc, rr]) => { grid[rr][cc] = -1; });
            if (windmill) this.addWindmill(c + 1, -(r + 1 + ZONE_TOP_ROW));
            else this.addMushroom(c + 0.5, -(r + 1 + ZONE_TOP_ROW));
            i++;
        }

        const isTall = (sh) => sh.c.length >= 2 && sh.c.every(([c]) => c === 0);
        const bigMul = Math.min(4, 1.5 + 0.25 * s.depth);   // fewer, bigger blocks, more so deeper down
        const weight = (sh) => sh.w * (isTall(sh) ? style.tall : 1) * (sh.size >= 5 ? bigMul : 1);
        const total = SHAPE_VARIANTS.reduce((n, sh) => n + weight(sh), 0);
        // Variety: a shape shows up at most twice per zone (singles three times), and
        // never right next to another of the same shape.
        const used = {};
        const sameShapeTouching = (cells, canon) => cells.some(([c, r]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => {
            const g = grid[r + dr]?.[c + dc];
            return g > 0 && plan[g - 1].canon === canon && !cells.some(([x, y]) => x === c + dc && y === r + dr);
        }));
        const touchesOther = (cells) => cells.some(([c, r]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => {
            const cc = c + dc, rr = r + dr;
            if (cells.some(([x, y]) => x === cc && y === rr)) return false;
            return cc >= 0 && cc < W && rr >= 0 && rr < ZONE_ROWS && grid[rr][cc] !== 0;
        }));
        const plan = [];
        let filled = 0;
        const target = Math.round(W * ZONE_ROWS * (spec.fill + style.fill));

        let cupPrize = null;
        // Now and then a cup: two walls and a floor with a gap inside. A ball that drops
        // in rattles around, hitting all three. A trap worth aiming for.
        if (this.rand() < spec.cups) {
            for (let tries = 0; tries < 30; tries++) {
                const c = Math.floor(this.rand() * (W - 3)), r = 2 + Math.floor(this.rand() * (ZONE_ROWS - 6));
                const parts = [
                    [[c, r], [c, r + 1], [c, r + 2]],
                    [[c + 3, r], [c + 3, r + 1], [c + 3, r + 2]],
                    [[c, r + 3], [c + 1, r + 3], [c + 2, r + 3], [c + 3, r + 3]],
                ];
                const inside = [[c + 1, r], [c + 2, r], [c + 1, r + 1], [c + 2, r + 1], [c + 1, r + 2], [c + 2, r + 2]];
                if (!parts.flat().concat(inside).every(([cc, rr]) => free(cc, rr))) continue;
                if (!rowOk(parts.flat())) continue;
                for (const cells of parts) {
                    plan.push({ cells, kind: 'pinned', tilt: 0, dx: 0, dy: 0, wantsGap: false, cup: true });
                    cells.forEach(([cc, rr]) => { grid[rr][cc] = plan.length; });
                    filled += cells.length;
                }
                inside.forEach(([cc, rr]) => { grid[rr][cc] = -1; });   // keep the inside clear
                cupPrize = [c + 1.5, r + 2.5];                            // a +1 ring sits in the cup
                break;
            }
        }
        for (let tries = 0; tries < 800 && filled < target; tries++) {
            let pick = this.rand() * total, shape = SHAPE_VARIANTS[0];
            for (const sh of SHAPE_VARIANTS) { if ((pick -= weight(sh)) <= 0) { shape = sh; break; } }
            if ((used[shape.canon] ?? 0) >= (shape.size === 1 ? 3 : 2)) continue;
            const col = Math.floor(this.rand() * W), row = Math.floor(this.rand() * ZONE_ROWS);
            const cells = shape.c.map(([c, r]) => [col + c, row + r]);
            if (!cells.every(([c, r]) => free(c, r)) || !rowOk(cells)) continue;
            if (sameShapeTouching(cells, shape.canon)) continue;
            const wantsGap = this.rand() < style.gap;
            if (wantsGap && touchesOther(cells)) continue;
            used[shape.canon] = (used[shape.canon] ?? 0) + 1;
            plan.push({ cells, kind: 'pinned', tilt: 0, dx: 0, dy: 0, wantsGap, canon: shape.canon });
            cells.forEach(([c, r]) => { grid[r][c] = plan.length; });
            filled += cells.length;
        }

        // Jello shows up here and there: often none, usually one, rarely two. Small shapes only.
        if (this.rand() < spec.jello) {
            const count = 1 + (this.rand() < Math.min(0.6, (s.depth - 6) * 0.06) ? 1 : 0);
            const small = plan.filter((p) => p.cells.length <= 3 && !p.cup);
            for (let i = 0; i < count && small.length; i++) {
                small.splice(Math.floor(this.rand() * small.length), 1)[0].kind = 'jello';
            }
        }

        // Neutral blocks (deeper down): a few small pieces become unbreakable bumpers.
        if (spec.neutral) {
            const pool = plan.filter((p) => p.kind === 'pinned' && !p.cup && p.cells.length <= 4);
            for (let i = 0; i < spec.neutral && pool.length > 2; i++) {
                pool.splice(Math.floor(this.rand() * pool.length), 1)[0].kind = 'neutral';
            }
        }

        // Some pinned blocks become loose ones resting on a pinned block below.
        const solidBelow = (p) => p.cells.some(([c, r]) => {
            const g = r + 1 < ZONE_ROWS ? grid[r + 1][c] : 0;
            return g > 0 && plan[g - 1] !== p && (plan[g - 1].kind === 'pinned' || plan[g - 1].kind === 'neutral');
        });
        const wantLoose = Math.round(plan.length * Math.min(0.4, spec.loose * style.loose));
        for (let i = 0, made = 0; i < plan.length * 3 && made < wantLoose; i++) {
            const p = plan[Math.floor(this.rand() * plan.length)];
            if (p.kind !== 'pinned' || p.cup || !solidBelow(p)) continue;
            p.kind = 'loose';
            made += 1;
            // Blocks next to a neighbour start leaning on it; the settle pass lets them find their rest.
            const top = Math.min(...p.cells.map(([, r]) => r));
            const topCells = p.cells.filter(([, r]) => r === top);
            const side = [-1, 1].find((dc) => topCells.some(([c]) => grid[top]?.[c + dc] > 0 && !p.cells.some(([x, y]) => x === c + dc && y === top)));
            if (side) p.tilt = -side * style.lean * (0.6 + 0.8 * this.rand());
        }

        // Free-standing pinned blocks in airy layouts sit a little off the grid.
        for (const p of plan) {
            if (p.kind === 'loose' || !p.wantsGap || this.rand() >= style.jitter) continue;
            p.dx = (this.rand() - 0.5) * 0.36;
            p.dy = (this.rand() - 0.5) * 0.24;
        }

        for (const p of plan) {
            const t = this.rand();
            // Bigger blocks carry bigger numbers: a 3x2 is about three times a single cell.
            let hp = (spec.lo + (spec.hi - spec.lo) * t * t) * (0.6 + 0.4 * p.cells.length);
            hp *= 1 + (s.volley - 1) * 0.7;          // numbers grow to match multishot
            hp *= HP_SCALE;
            if (p.kind === 'jello') hp *= 0.5;
            else if (this.rand() < spec.tough) hp *= 2.5 + this.rand() * 1.5;   // a bulky one to wear down
            this.addBlock(p.cells.map(([c, r]) => [c, r + ZONE_TOP_ROW]), Math.max(1, Math.round(hp)), p.kind, p.tilt, p.dx, p.dy);
        }

        // Two +1 pickups in open cells that are open above too, so a ball can reach them,
        // and never close together.
        let open = [];
        grid.forEach((row, r) => row.forEach((g, c) => { if (g === 0 && (r === 0 || grid[r - 1][c] === 0)) open.push([c, r]); }));
        let placed = 0;
        if (cupPrize) {
            this.addPickup(cupPrize[0], -(cupPrize[1] + ZONE_TOP_ROW));
            open = open.filter(([cc, rr]) => Math.hypot(cc + 0.5 - cupPrize[0], rr + 0.5 - cupPrize[1]) >= MIN_PICKUP_GAP);
            placed = 1;
        }
        for (let i = placed; i < 2 && open.length; i++) {
            const [c, r] = open[Math.floor(this.rand() * open.length)];
            this.addPickup(c + 0.5, -(r + ZONE_TOP_ROW + 0.5));
            open = open.filter(([cc, rr]) => Math.hypot(cc - c, rr - r) >= MIN_PICKUP_GAP);
        }

        // Let loose blocks settle before the zone is shown. Nothing scores while this runs.
        s.quiet = true;
        for (let i = 0; i < PRESETTLE_STEPS; i++) {
            this.step();
            if (i > 30 && this.settled()) break;
        }
        s.quiet = false;
        this.events.length = 0;

        // Zone 3 is where resting blocks are introduced: make sure at least one survived settling.
        if (s.depth === 3 && !Object.values(s.blocks).some((b) => b.loose) && (s.retries = (s.retries ?? 0) + 1) < 8) {
            for (const id in s.blocks) this.removeBlock(s.blocks[id], false);
            this.events.length = 0;
            s.depth -= 1;
            this.genZone();
            return;
        }
        s.retries = 0;
        if (s.depth > 1) this.gain(ZONE_BONUS, W / 2, -2.5);
        if (s.pendingPar > 0) { this.gain(s.pendingPar, W / 2, -3.3); this.events.push({ t: 'par', n: s.pendingPar }); }
        s.pendingPar = 0;
        s.zoneHp0 = this.hpLeft();
        s.par = Math.max(3, Math.min(30, Math.round(s.zoneHp0 / (parHpPerShot(s.depth) * s.volley))));
        s.zoneShots = 0;

        // Point the zone's note at the first example of the new thing.
        if (s.note && !s.noteTarget) {
            const blocks = Object.values(s.blocks), props = Object.values(s.props);
            const b = s.depth === 4 ? blocks.find((x) => x.jello) : s.depth === 3 ? blocks.find((x) => x.loose)
                : s.depth === 7 ? blocks.find((x) => x.neutral) : null;
            if (b) s.noteTarget = { kind: 'block', id: b.id };
            else if (s.depth === 2 && props.length) s.noteTarget = { kind: 'prop', id: props[0].id };
            else s.noteTarget = { kind: 'open' };
        }
    }

    addPickup(x, y) {
        const { R, world, s } = this;
        const body = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y));
        const c = world.createCollider(
            R.ColliderDesc.ball(0.26).setSensor(true)
                .setCollisionGroups(groups(G.PICKUP, G.BALL))
                .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS), body);
        const id = s.nextId++;
        s.pickups[id] = { id, body: body.handle, col: c.handle, x, y };
        s.owner[c.handle] = { t: 'pickup', id };
    }

    collectPickup(id) {
        const { world, s } = this;
        const pk = s.pickups[id];
        if (!pk) return;
        world.removeRigidBody(world.getRigidBody(pk.body));
        delete s.owner[pk.col];
        delete s.pickups[id];
        this.gain(1, pk.x, pk.y);
    }

    // ---------- props ----------

    // A free-spinning cross on a pin. Balls set it turning; it swats the next ones.
    addWindmill(x, y) {
        const { R, world, s } = this;
        const id = s.nextId++;
        const pin = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y));
        const rotor = world.createRigidBody(
            R.RigidBodyDesc.dynamic().setTranslation(x, y).setGravityScale(0).setAngularDamping(0.35));
        const arm = (hx, hy) => {
            const c = world.createCollider(
                R.ColliderDesc.cuboid(hx, hy).setDensity(2).setRestitution(0.7).setFriction(0.4)
                    .setCollisionGroups(groups(G.PROP, G.BALL | G.LOOSE)), rotor);
            s.owner[c.handle] = { t: 'prop', id };
            return c.handle;
        };
        const cols = [arm(0.85, 0.09), arm(0.09, 0.85)];
        world.createImpulseJoint(R.JointData.revolute({ x: 0, y: 0 }, { x: 0, y: 0 }), pin, rotor, true);
        s.props[id] = { id, kind: 'windmill', x, y, rotor: rotor.handle, bodies: [rotor.handle, pin.handle], cols };
    }

    // A springy mushroom cap that kicks balls back harder than they came in.
    addMushroom(x, yBase) {
        const { R, world, s } = this;
        const id = s.nextId++;
        const body = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, yBase));
        const pts = [];
        const r = 0.46, capY = 0.42;
        for (let i = 0; i <= 10; i++) {
            const a = (Math.PI * i) / 10;
            pts.push(Math.cos(a) * r, capY + Math.sin(a) * r * 0.75);
        }
        const cap = world.createCollider(
            R.ColliderDesc.convexHull(new Float32Array(pts)).setRestitution(1.3)
                .setRestitutionCombineRule(R.CoefficientCombineRule.Max).setFriction(0.2)
                .setCollisionGroups(groups(G.PROP, G.BALL | G.LOOSE)), body);
        const stem = world.createCollider(
            R.ColliderDesc.cuboid(0.14, capY / 2).setTranslation(0, capY / 2).setRestitution(0.5)
                .setCollisionGroups(groups(G.PROP, G.BALL | G.LOOSE)), body);
        s.owner[cap.handle] = { t: 'prop', id };
        s.owner[stem.handle] = { t: 'prop', id };
        s.props[id] = { id, kind: 'mushroom', x, y: yBase, bodies: [body.handle], cols: [cap.handle, stem.handle], r, capY };
    }

    // ---------- balls ----------

    fire(angle, count = this.s.supply > 0 ? this.s.volley : 0) {
        if (count > 0) { this.s.supply -= 1; this.s.zoneShots = (this.s.zoneShots ?? 0) + 1; }   // one shot, however many balls it fires
        this.s.shots = { left: count, angle, timer: 0, fired: 0 };
        this.s.turnSteps = 0;
    }

    // Bonus balls are the extra ones from a multishot upgrade.
    spawnBall(angle, bonus = false) {
        const { R, world, s } = this;
        const body = world.createRigidBody(
            R.RigidBodyDesc.dynamic().setTranslation(LAUNCHER.x, LAUNCHER.y)
                .setLinvel(Math.cos(angle) * BALL_SPEED, Math.sin(angle) * BALL_SPEED)
                .setCcdEnabled(true).setCanSleep(false));
        const c = world.createCollider(
            R.ColliderDesc.ball(BALL_R).setDensity(1)
                .setRestitution(0.9).setRestitutionCombineRule(R.CoefficientCombineRule.Max)
                .setFriction(0.35)
                .setCollisionGroups(groups(G.BALL, BALL_FILTER))
                .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS), body);
        s.owner[c.handle] = { t: 'ball', body: body.handle };
        s.balls.push({
            body: body.handle, col: c.handle, still: 0, age: 0, jello: [], bonus,
            pv: [Math.cos(angle) * BALL_SPEED, Math.sin(angle) * BALL_SPEED],
            home: [LAUNCHER.x, LAUNCHER.y], homeT: 0, idle: 0,
        });
    }

    removeBall(handle) {
        const { world, s } = this;
        const i = s.balls.findIndex((b) => b.body === handle);
        if (i < 0) return;
        world.removeRigidBody(world.getRigidBody(handle));
        delete s.owner[s.balls[i].col];
        s.balls.splice(i, 1);
    }

    // Balls are done. Loose blocks may still be tumbling; the caller waits for settled().
    turnDone() {
        const s = this.s;
        return !(s.shots && s.shots.left > 0) && s.balls.length === 0;
    }

    step() {
        const { world, s } = this;
        const shots = s.shots;
        if (shots && shots.left > 0) {
            if (shots.timer <= 0) {
                this.spawnBall(shots.angle, shots.fired > 0);
                shots.fired = (shots.fired ?? 0) + 1;
                shots.left -= 1;
                shots.timer = SHOT_GAP;
            }
            shots.timer -= 1;
        }
        this.applySprings();
        for (const ball of s.balls) {
            if (!ball.jello.length) continue;
            const body = world.getRigidBody(ball.body);
            const v = body.linvel();
            const sp = Math.hypot(v.x, v.y);
            const k = sp * JELLO_DRAG < JELLO_MIN_SPEED ? Math.min(1, JELLO_MIN_SPEED / (sp || 1)) : JELLO_DRAG;
            body.setLinvel({ x: v.x * k, y: v.y * k }, true);
            body.setAngvel(body.angvel() * JELLO_DRAG, true);
        }
        for (const ball of s.balls) {
            const body = world.getRigidBody(ball.body);
            let v = body.linvel();
            const sp = Math.hypot(v.x, v.y);
            if (!ball.jello.length) {
                if (sp < 0.01) v = { x: 0, y: -BALL_SPEED };
                else {
                    const next = Math.abs(sp - BALL_SPEED) < 0.05 ? BALL_SPEED : sp + (BALL_SPEED - sp) * SPEED_EASE;
                    v = { x: v.x * next / sp, y: v.y * next / sp };
                }
                body.setLinvel(v, true);
            }
            ball.pv = [v.x, v.y];               // velocity going into this step, to measure impacts
        }
        world.step(this.queue);
        s.step += 1;

        const contacts = [];
        this.queue.drainCollisionEvents((h1, h2, started) => { contacts.push([h1, h2, started]); });
        for (const [h1, h2, started] of contacts) this.onContact(h1, h2, started);
        this.updateBalls();
        this.updateBlocks();

        if (s.balls.length && ++s.turnSteps > TURN_CAP) {
            // Safety net: a turn that won't end just ends. The shot was spent; no refund.
            for (const b of [...s.balls]) this.removeBall(b.body);
        }
        if (s.step % 240 === 0) {
            for (const k in s.cool) if (s.cool[k] < s.step) delete s.cool[k];
        }
    }

    cooled(key) {
        const s = this.s;
        if ((s.cool[key] ?? -1) > s.step) return false;
        s.cool[key] = s.step + HIT_COOLDOWN;
        return true;
    }

    onContact(h1, h2, started) {
        const { world, s } = this;
        let a = s.owner[h1], b = s.owner[h2];
        if (!a || !b) return;
        if (b.t === 'ball') [a, b] = [b, a];

        // A loose block landing on (or knocking into) another one.
        if (a.t === 'block' && b.t === 'block') {
            if (!started || s.quiet) return;
            const A = s.blocks[a.id], B = s.blocks[b.id];
            if (!A || !B) return;
            const va = world.getRigidBody(A.body).linvel(), vb = world.getRigidBody(B.body).linvel();
            const speed = Math.hypot(va.x - vb.x, va.y - vb.y);
            if (speed < MIN_SMASH_SPEED || !this.cooled(Math.min(A.id, B.id) + ':' + Math.max(A.id, B.id))) return;
            const [hitter, target] = Math.hypot(va.x, va.y) >= Math.hypot(vb.x, vb.y) ? [A, B] : [B, A];
            const p = world.getRigidBody(target.body).translation();
            this.events.push({ t: 'smash', x: p.x, y: p.y, speed });
            this.damageBlock(target.id, Math.min(10, Math.round(speed * 1.1)));
            this.damageBlock(hitter.id, 1);
            return;
        }
        if (a.t !== 'ball') return;
        const body = world.getRigidBody(a.body);
        if (!body) return;
        const ball = s.balls.find((x) => x.body === a.body);
        const p = body.translation();

        if (b.t === 'block' && s.blocks[b.id]?.jello) {
            if (!ball) return;
            // Jiggles on the way in and the way out.
            const v = body.linvel();
            this.events.push({ t: 'jelly', id: b.id, x: p.x, y: p.y, dir: Math.atan2(v.y, v.x) });
            if (started) {
                if (!ball.jello.includes(b.id)) ball.jello.push(b.id);
                if (this.cooled(a.body + ':' + b.id)) { this.damageBlock(b.id); this.scored(ball); }
            } else {
                ball.jello = ball.jello.filter((j) => j !== b.id);
            }
            return;
        }
        if (!started) return;
        if (b.t === 'ball') { this.events.push({ t: 'clack', x: p.x, y: p.y }); return; }
        if (b.t === 'pickup') { this.collectPickup(b.id); return; }
        this.events.push({ t: 'contact', ball: a.body, x: p.x, y: p.y, with: b.t, id: b.id });
        if (b.t === 'block') {
            // Little hops on top of a block don't count; only a real bounce does.
            const v = body.linvel();
            const impact = ball ? Math.hypot(v.x - ball.pv[0], v.y - ball.pv[1]) : 0;
            if (impact < MIN_IMPACT) return;
            const blk = s.blocks[b.id];
            if (blk && !blk.jello) {
                // Push along the ball's incoming direction.
                const bb = world.getRigidBody(blk.body);
                const sp = Math.hypot(ball.pv[0], ball.pv[1]) || 1;
                const dv = Math.min(KNOCK_MAX, impact * KNOCK) * bb.mass();
                bb.applyImpulse({ x: ball.pv[0] / sp * dv, y: ball.pv[1] / sp * dv }, true);
            }
            if (this.cooled(a.body + ':' + b.id)) { this.damageBlock(b.id); this.scored(ball); }
        }
    }

    // A ball that just scored is "working": it loses any extra weight and keeps going.
    scored(ball) {
        if (!ball) return;
        if (ball.age <= WIND_DOWN_AT && ball.heavy) { this.world.getRigidBody(ball.body).setGravityScale(1, true); ball.heavy = 0; }
        ball.idle = 0;
    }

    updateBalls() {
        const { world, s } = this;
        for (let i = s.balls.length - 1; i >= 0; i--) {
            const ball = s.balls[i];
            const body = world.getRigidBody(ball.body);
            const p = body.translation();
            if (p.y < -H - 1) {
                this.events.push({ t: 'out', ball: ball.body });
                this.removeBall(ball.body);
                continue;
            }
            ball.age += 1;
            ball.idle += 1;
            // A ball still around after 11s (say, sitting heavy at the bottom of a cup) is spent.
            if (ball.age > TRAP_LIMIT + 240) {
                this.events.push({ t: 'out', ball: ball.body });
                this.removeBall(ball.body);
                continue;
            }
            const done = ball.idle > HEAVY_AFTER || (ball.age > WIND_DOWN_AT && (ball.idle > WIND_IDLE || ball.heavy > 0)) || ball.age > TRAP_LIMIT;
            if (done) {
                ball.heavy = (ball.heavy ?? 0) + 1;
                if (ball.heavy % 10 === 0) body.setGravityScale(Math.min(8, 1 + ball.heavy / 25), false);
            }
            const v = body.linvel();
            ball.still = Math.hypot(v.x, v.y) < STUCK_SPEED && !ball.jello.length ? ball.still + 1 : 0;
            if (ball.still > STUCK_STEPS) {
                // A ball resting on a ledge gets a small random kick.
                const ang = Math.PI * (0.15 + 0.7 * this.rand());
                const m = body.mass();
                body.applyImpulse({ x: Math.cos(ang) * m * 5, y: Math.sin(ang) * m * 5 }, true);
                ball.still = 0;
            }
            // A ball bouncing in place (on a block top, in a pocket) gets knocked sideways.
            if (Math.hypot(p.x - ball.home[0], p.y - ball.home[1]) > BOXED_RADIUS) {
                ball.home = [p.x, p.y];
                ball.homeT = 0;
            } else if (++ball.homeT > BOXED_STEPS && ball.idle > 60 && !ball.jello.length) {
                const side = p.x < W / 2 ? 1 : -1;
                body.setLinvel({ x: side * (4 + 3 * this.rand()), y: 3 }, true);
                ball.homeT = 0;
            }
        }
    }
}

// Run one ball forward in a copy of the world and return its path.
// Each contact carries the surface normal, worked out from how the ball's
// direction changed across the bounce.
export function predict(sim, angle, maxContacts = 3, maxSteps = 300) {
    const p = sim.clone();
    p.s.supply = Math.max(1, p.s.supply);
    p.fire(angle, 1);
    const path = [[LAUNCHER.x, LAUNCHER.y]];
    const hits = [];            // path index right after each bounce
    let stopAt = maxSteps;
    for (let i = 0; i < maxSteps && path.length <= stopAt; i++) {
        p.step();
        const ball = p.s.balls[0];
        if (!ball) break;
        const t = p.world.getRigidBody(ball.body).translation();
        path.push([t.x, t.y]);
        for (const e of p.events) {
            if (e.t === 'contact' && hits.length < maxContacts) hits.push(path.length - 1);
        }
        p.events.length = 0;
        // Run two steps past the last bounce so its normal can be measured.
        if (hits.length >= maxContacts && stopAt === maxSteps) stopAt = path.length + 1;
    }
    p.free();
    const contacts = hits.map((i) => {
        const a = path[Math.max(0, i - 2)], b = path[i - 1], c = path[i], d = path[Math.min(path.length - 1, i + 1)];
        let nx = (d[0] - c[0]) - (b[0] - a[0]), ny = (d[1] - c[1]) - (b[1] - a[1]);
        const len = Math.hypot(nx, ny) || 1;
        nx /= len; ny /= len;
        return { x: c[0], y: c[1], nx, ny };
    });
    // Trim the extra steps so the dotted line ends at the last bounce.
    if (hits.length >= maxContacts) path.length = hits[maxContacts - 1] + 1;
    return { path, contacts };
}
