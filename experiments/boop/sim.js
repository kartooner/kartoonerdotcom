// Boop: physics and game rules. No rendering in here.
// The aim preview clones this whole sim and runs it forward, so the guide line
// uses the exact same code and numbers as the real shot.

import { SHAPES, SHAPE_VARIANTS, zoneSpec, STYLES, MIN_PICKUP_GAP, propGap } from './zones.js';
export { zoneSpec };

export const W = 9;                 // field width in cells
export const H = 16;                // field height in cells (y runs 0 → -H)
export const LAUNCHER = { x: W - 0.62, y: -0.62 };
export const DT = 1 / 120;
export const BALL_R = 0.17;
export const BALL_SPEED = 18;      // balls always travel at this speed (jelly aside)
export const START_SUPPLY = 22;
export const START_VOLLEY = 1;      // one ball per shot, so every bounce can be followed
// Shots for clearing a zone: generous early so the middle zones come quickly, leaner deeper.
export const zoneBonus = (d) => (d <= 10 ? 5 : d <= 15 ? 3 : 2);
const REFUND_MIN_HP = 13;           // popping a block that started this high gives a ball back

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
// Balls keep full speed and the field is closed, so a shot does a lot: numbers match.
// Eased in over the first zones so zone 1 stays friendly.
// How much block numbers are scaled up with depth. It climbs gently through the early
// zones so they go quickly, reaching full size around depth 11.
const hpScale = (d) => Math.min(5.5, 1.6 + 0.4 * (d - 1));
// Par: about how much a good shot takes off at this depth (measured with bots; a shot
// does more deeper down, with bigger blocks and more traps). Independent of hpScale,
// so lighter early zones also get a lower par.
const parHpPerShot = (d) => (3.5 + 0.7 * d) * Math.min(5.5, 2 + 0.95 * (d - 1));
const PAR_BONUS_MAX = 5;
const MIN_SMASH_SPEED = 2.5;        // blocks only hurt each other when they really land
const STUCK_SPEED = 1.2;
const STUCK_STEPS = 60;
// When a ball's shot ends: the field is closed on all sides, so a ball keeps going as
// long as it keeps hitting blocks (jelly counts). Walls, the floor, props and grey
// blocks don't count: a ball that's only been bouncing off those for RETIRE_IDLE
// is in a loop and fades out.
const RETIRE_IDLE = 480;            // 4s without hitting a block
// A ball that's been going a while hits harder, so a long trap chews through blocks
// instead of dragging on: +1 damage per 6s alive, up to 4 per hit.
const POWER_EVERY = 720;
// How much bigger numbers get with each multishot upgrade. Less than the extra balls
// add, so an upgrade feels like a step up instead of just keeping pace.
const multishotGrowth = (volley) => 1 + (volley - 1) * 0.35;
// Last stretch: once a zone is down to its last few breakable blocks, every hit
// counts double, so the end of a zone doesn't drag.
const STRETCH_BLOCKS = 3;
const ballPower = (ball) => Math.min(4, 1 + Math.floor((ball?.age ?? 0) / POWER_EVERY));
// After 6s alive, the time a ball may go without a hit shrinks, to 1.5s by about 14s:
// a busy trap keeps going; one that only now and then finds a block winds down.
// Keeps the wait between shots short.
const idleLimit = (ball) => ball.age < 720 ? RETIRE_IDLE : Math.max(180, RETIRE_IDLE - (ball.age - 720) * 0.3);
// How far a ball is through its fade timer, 0 (just hit a block) to 1 (about to fade).
// The renderer greys the ball by this, so the timer can be seen.
export const ballFuse = (ball) => Math.min(1, ball.idle / idleLimit(ball));
// However busy, a ball winds down after 40s: past that, hits stop resetting its fuse, so it greys
// and fades in a second or two. Keeps a ball rattling in a pocket from dragging a turn out.
const BALL_LIFE = 40 * 120;
const GRACE_RANGE = 5;              // ...unless it's heading at a block within this many cells
const GRACE_MAX = 180;              // grace lasts at most 1.5s before the ball fades anyway
const TURN_CAP = 120 * 120;         // safety net only; every hit wears a block down, so turns end long before this
const BLOCK_DENSITY = 1.5;
// Pinned (nailed) blocks are heavier, so a ball nudges them less: a firm bump that
// springs back. Resting blocks keep the lighter density and move freely.
const PINNED_DENSITY = 3;
// Nails. Every block fixed in place (pinned, jelly, grey) has two, near its top corners.
// A ball hitting close to a nail wears it down; a nail lasts about a third of the
// block's starting number in hits (at least 2; NAIL_SHARE). With one nail left the block swings
// down and hangs from it; with none it falls and becomes a resting block. Only single
// squares' nails never come out (hp -1).
const NAIL_INSET = 0.17;
const NAIL_REACH = 0.34;             // how close (cells, from the ball's edge) a hit must land
const NAIL_SHARE = 0.35;
const NAIL_GREY_HP = 6;               // grey blocks have no number: their nails take this many hits
const HANG_K = 420, HANG_C = 7;      // the one-nail hinge: stiff enough to hold the block's weight
const PINNED_KNOCK = 0.5;            // pinned blocks get half the knock of a resting one
const ZONE_TOP_ROW = 4;
const ZONE_ROWS = 10;               // rows 4–13; rows 14–15 stay open so balls can leave
const PRESETTLE_STEPS = 720;        // a new zone is run until still before you see it

// Springs that hold pinned blocks near their spot. Per unit of mass, so heavy
// and light blocks wobble at the same rate. Worn-down blocks get weaker springs.
const SPRING_K = 190, SPRING_C = 9.5;
const TWIST_K = 130, TWIST_C = 7;
// Mushroom stems: a springy hinge (stiffness, damping), light enough to wobble when hit.
const MUSH_K = 360, MUSH_C = 6, MUSH_DENSITY = 1.2;
const MUSH_FALL_MAX = 300;          // a fallen mushroom fades out after at most 2.5s
// Vines (from depth 9): short chains hanging under a block. Each link takes a few hits;
// a broken link drops everything below it (which fades once it lands). Sometimes a vine
// holds a small block at its end, like a chandelier: cut it and the block falls.
// Bombs (from depth 15): a round cartoon bomb sitting in a gap between blocks. A ball hitting
// it lights the fuse; a moment later it bursts, taking a chunk off every block within reach
// (and snapping vines, and lighting other bombs). A big payoff, and a reason to aim at it first.
const BOMB_FROM = 15;
const BOMB_CHANCE = 0.33;           // after depth 15, the share of zones with a bomb
const BOMB_R = 0.36;                // its radius, in cells
const BOMB_FUSE = 60;               // steps from lit to burst (0.5s)
const BOMB_CHAIN = 18;              // a bomb lit by another's burst goes off this many steps later
const BOMB_REACH = 1.9;             // cells from the bomb's centre to a neighbour's nearest cell centre
const BOMB_JOLT = 0.6;              // a nailed block's jolt: a bump that springs back
const BOMB_SHARE = 0.5;             // a neighbour loses this share of its starting number...
const BOMB_KNOCK = 4.5;               // ...and anything loose gets shoved away this hard
const VINE_FROM = 9;
const VINE_LINKS = 3, VINE_LINK_LEN = 0.6, VINE_LINK_HP = 3;
const VINE_SLACK = 1.12;            // a strung vine is this much longer than its gap, so it sags
const VINE_STRUNG_LEN = 0.8;        // strung vines use longer links: fewer bodies for the same span
const VINE_STILL = 0.25, VINE_CALM_STEPS = 30;   // nearly still for 0.25s: let a vine sleep
const VINE_PIN_SLOP = 0.005;        // a vine's pin ignores its block's tiny jiggles (invisible), so it can rest
const VINE_CHECK_EVERY = 4;         // how often (in steps) an awake vine checks whether it can rest
const VINE_WAKE = 1.2;
const VINE_WIND = 0.01, VINE_WIND_REACH = 0.9, VINE_WIND_MAX = 1;   // a passing ball's breeze: share of its speed per step, and reach              // ...unless a ball is within this many cells of it
const VINE_LAMP_SIZE = 0.7;         // a chandelier's block is drawn this size, so it swings free
const VINE_LAMP_FALL = 0.25;        // a hung block's weight, as a share of a falling one's
export const VINE_DEBRIS_STEPS = 150;      // fallen bits of vine fade after 1.25s

// Jello: balls pass through, slowed hard while inside.
const JELLO_DRAG = 0.94;            // velocity kept per step inside jello
const JELLO_MIN_SPEED = 4;          // but never slower than this, so balls always come out the far side
// Consistent speed: a ball always travels at BALL_SPEED. Bounces and gravity change its
// direction, not how fast it goes. Lost speed (a bounce, a pass through jelly) eases back
// over a few steps instead of snapping, so it reads as smooth, not jerky.
const SPEED_EASE = 0.15;

const G = { BALL: 1, BLOCK: 2, WALL: 4, PICKUP: 8, LOOSE: 16, PROP: 64, JELLO: 128, JELLY_BODY: 256 };
const groups = (member, filter) => ((member & 0xffff) << 16) | (filter & 0xffff);
// Balls pass through each other: in a multishot each ball flies its own path.
const BALL_FILTER = G.BLOCK | G.WALL | G.PICKUP | G.LOOSE | G.PROP | G.JELLO;

// Bigger numbers are bulkier. A block loses some mass as it's worn down, never more than ~18%.
export function blockScale(hp, hp0) {
    // Bigger numbers look a bit bulkier, and a block shrinks a little as it wears down,
    // but never below about 85%: the last blocks of a zone shouldn't turn into slivers.
    const bulk = 0.9 + 0.1 * Math.min(1, Math.log(hp0) / Math.log(60));
    return bulk * (0.94 + 0.06 * Math.max(0, hp) / hp0);
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

    // Saving a run: the physics world as bytes plus the plain game state as JSON text.
    // Only taken between turns, when nothing is in flight.
    save() {
        return { world: this.world.takeSnapshot(), s: JSON.stringify(this.s) };
    }

    static load(R, world, s) {
        const w = R.World.restoreSnapshot(world);
        if (!w) throw new Error('bad save');
        w.timestep = DT;
        return new Sim(R, w, JSON.parse(s));
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
                    .setCollisionGroups(groups(G.WALL, G.BALL | G.LOOSE | G.JELLY_BODY)), body);
            s.owner[c.handle] = { t: 'wall' };
        };
        wall(0.5, H / 2 + 2, -0.5, -H / 2);
        wall(0.5, H / 2 + 2, W + 0.5, -H / 2);
        wall(W / 2 + 1, 0.5, W / 2, 0.5);
        wall(W / 2 + 1, 0.5, W / 2, -H - 0.5);   // floor: balls bounce off the bottom too
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
        if (kind !== 'loose') {
            // Kitty-corner: one nail at a top corner, the other at the opposite bottom corner,
            // so knocking out either one leaves the block hinged on the other.
            const ys = b.cells.map(([, y]) => y), top = Math.max(...ys), bot = Math.min(...ys);
            const topX = b.cells.filter(([, y]) => y === top).map(([x]) => x);
            const botX = b.cells.filter(([, y]) => y === bot).map(([x]) => x);
            const i = NAIL_INSET, flip = id % 2 === 1;
            const a = flip ? [Math.max(...topX) + 0.5 - i, top + 0.5 - i] : [Math.min(...topX) - 0.5 + i, top + 0.5 - i];
            const c = flip ? [Math.min(...botX) - 0.5 + i, bot - 0.5 + i] : [Math.max(...botX) + 0.5 - i, bot - 0.5 + i];
            // Single squares' nails never come out (a lone square on the floor is no fun to chase).
            const nhp = n === 1 ? -1 : kind === 'neutral' ? NAIL_GREY_HP : Math.max(2, Math.round(hp * NAIL_SHARE));
            b.nails = [{ id: 0, x: a[0], y: a[1], hp: nhp, hp0: nhp }, { id: 1, x: c[0], y: c[1], hp: nhp, hp0: nhp }];
        } else b.nails = [];
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
        const k = b.neutral ? 0.96 : Math.min(b.mini ?? 1, blockScale(b.hp, b.hp0));   // a chandelier's block is a small one
        b.scale = k;
        const extra = [];
        b.cols = b.cells.map(([x, y]) => {
            let d = R.ColliderDesc.cuboid(0.5 * k, 0.5 * k).setTranslation(x * k, y * k);
            if (b.jello) {
                d = d.setSensor(true).setCollisionGroups(groups(G.JELLO, G.BALL))
                    .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS);
                if (b.hanging || b.loose) {
                    // Balls still pass through, but it lands on things and they land on it.
                    const solid = world.createCollider(R.ColliderDesc.cuboid(0.5 * k, 0.5 * k).setTranslation(x * k, y * k)
                        .setDensity(BLOCK_DENSITY).setRestitution(0.35).setFriction(0.6)
                        .setCollisionGroups(groups(G.JELLY_BODY, G.BLOCK | G.LOOSE | G.WALL | G.JELLY_BODY)), body);
                    s.owner[solid.handle] = { t: 'block', id: b.id };
                    extra.push(solid.handle);
                }
            } else if (b.loose || b.hanging) {   // hanging from one nail: it swings into things like a loose block
                d = d.setDensity(BLOCK_DENSITY).setRestitution(0.2).setFriction(0.8)
                    .setCollisionGroups(groups(G.LOOSE, G.BALL | G.BLOCK | G.LOOSE | G.WALL | G.PROP | G.JELLY_BODY))
                    .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS);
            } else {
                d = d.setDensity(PINNED_DENSITY).setRestitution(0.9).setFriction(0.6)
                    .setCollisionGroups(groups(G.BLOCK, G.BALL | G.LOOSE | G.JELLY_BODY));
            }
            const c = world.createCollider(d, body);
            s.owner[c.handle] = { t: 'block', id: b.id };
            return c.handle;
        });
        b.cols.push(...extra);
    }

    // Where a nail is now (world), and where it was driven in (its anchor).
    nailPoint(b, n) {
        const body = this.world.getRigidBody(b.body);
        const p = body.translation(), a = body.rotation(), k = b.scale;
        return [p.x + (n.x * Math.cos(a) - n.y * Math.sin(a)) * k, p.y + (n.x * Math.sin(a) + n.y * Math.cos(a)) * k];
    }
    nailAnchor(b, n) {
        const a = b.anchorA, k = b.scale;
        return [b.anchor[0] + (n.x * Math.cos(a) - n.y * Math.sin(a)) * k, b.anchor[1] + (n.x * Math.sin(a) + n.y * Math.cos(a)) * k];
    }

    // A ball (at p) hit block b: if it landed close to a nail that can come out, wear it down.
    hitNail(b, p, n) {
        if (!b.nails?.length || this.s.quiet) return;
        let best = null, bestD = Infinity;
        for (const nail of b.nails) {
            if (nail.hp < 0) continue;
            const [x, y] = this.nailPoint(b, nail);
            const d = Math.hypot(p.x - x, p.y - y);
            if (d < bestD) { bestD = d; best = nail; }
        }
        if (!best || bestD > BALL_R + NAIL_REACH) return;
        best.hp -= n;
        const [x, y] = this.nailPoint(b, best);
        if (best.hp > 0) { this.events.push({ t: 'nailhit', id: b.id, nail: best.id, x, y }); return; }
        b.nails = b.nails.filter((q) => q !== best);
        this.events.push({ t: 'nailpop', id: b.id, nail: best.id, x, y });
        if (b.nails.length === 1) this.hang(b);
        else if (b.nails.length === 0) this.unpin(b);
    }

    // One nail left: the block swings down and hangs from it.
    hang(b) {
        const { R, world } = this;
        const body = world.getRigidBody(b.body);
        b.hanging = true;
        if (body.bodyType() !== R.RigidBodyType.Dynamic) body.setBodyType(R.RigidBodyType.Dynamic, true);   // jelly and grey
        body.setGravityScale(BLOCK_FALL, true);
        body.setLinearDamping(0.2);
        body.setAngularDamping(0.35);
        this.shapeBlock(b);
        body.wakeUp();
    }

    // No nails left: it falls and from now on rests like any loose block.
    unpin(b) {
        const { R, world } = this;
        const body = world.getRigidBody(b.body);
        b.hanging = false;
        if (b.jello || b.neutral) {
            if (body.bodyType() !== R.RigidBodyType.Dynamic) body.setBodyType(R.RigidBodyType.Dynamic, true);
            b.loose = true;
            body.setGravityScale(BLOCK_FALL, true);
            body.setLinearDamping(0.05);
            body.setAngularDamping(0.15);
            this.shapeBlock(b);
            body.wakeUp();
            const p = body.translation();
            this.events.push({ t: 'snap', id: b.id, x: p.x, y: p.y });
        } else this.snap(b);
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
        this.events.push({ t: 'pop', id: b.id, x: p.x, y: p.y, jello: b.jello, popped });
        if (popped && !s.quiet && !s.stretch && this.blockCount() > 0 && this.blockCount() <= STRETCH_BLOCKS) {
            s.stretch = true;
            this.events.push({ t: 'stretch' });
        }
        if (popped && !s.quiet && !b.neutral && b.hp0 >= REFUND_MIN_HP * multishotGrowth(s.volley) * hpScale(s.depth)) this.gain(1, p.x, p.y);
        this.wakeLoose();
    }

    // A bomb in the cell centred at (x, y): fixed in place, round, and balls bounce off it.
    addBomb(x, y) {
        const { R, world, s } = this;
        const id = s.nextId++;
        const body = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y));
        const col = world.createCollider(R.ColliderDesc.ball(BOMB_R).setRestitution(0.7).setFriction(0.2)
            .setCollisionGroups(groups(G.PROP, G.BALL | G.LOOSE)), body);
        s.owner[col.handle] = { t: 'bomb', id };
        s.props[id] = { id, kind: 'bomb', x, y, body: body.handle, bodies: [body.handle], cols: [col.handle], lit: 0 };
        return s.props[id];
    }

    // Light a bomb's fuse (if it isn't already), to burst `steps` from now.
    lightBomb(pr, steps = BOMB_FUSE) {
        if (pr.lit || this.s.quiet) return;
        pr.lit = steps;
        this.events.push({ t: 'bomblit', id: pr.id, x: pr.x, y: pr.y });
    }

    updateBombs() {
        for (const id in this.s.props) {
            const pr = this.s.props[id];
            if (pr.kind !== 'bomb' || !pr.lit) continue;
            if (--pr.lit > 0) continue;
            this.removeProp(pr);
            this.boom(pr.x, pr.y);
        }
    }

    boom(x, y) {
        const { world, s } = this;
        this.events.push({ t: 'boom', x, y, r: BOMB_REACH });
        for (const id of Object.keys(s.blocks)) {
            const b = s.blocks[id];
            if (!b) continue;
            const body = world.getRigidBody(b.body), t = body.translation(), a = body.rotation(), c = Math.cos(a), sn = Math.sin(a);
            let near = Infinity;
            for (const [cx, cy] of b.cells) {
                const wx = t.x + (cx * c - cy * sn) * b.scale, wy = t.y + (cx * sn + cy * c) * b.scale;
                near = Math.min(near, Math.hypot(wx - x, wy - y));
            }
            if (near > BOMB_REACH) continue;
            // Unpinned blocks (resting, or hanging from one nail) get thrown; nailed ones just jolt
            // like any hit, and their nails stay put.
            const d = Math.hypot(t.x - x, t.y - y) || 1, m = body.mass();
            if (body.isDynamic() && (b.loose || b.hanging)) {
                body.applyImpulse({ x: (t.x - x) / d * BOMB_KNOCK * m, y: ((t.y - y) / d + 0.5) * BOMB_KNOCK * m }, true);
            } else if (body.isDynamic()) {
                body.applyImpulse({ x: (t.x - x) / d * BOMB_JOLT * m, y: (t.y - y) / d * BOMB_JOLT * m }, true);
            }
            this.events.push({ t: 'jolt', id: b.id, dir: Math.atan2(t.y - y, t.x - x) });
            if (!b.neutral) this.damageBlock(b.id, Math.max(2, Math.round(b.hp0 * BOMB_SHARE)));
        }
        for (const id in s.props) {
            const pr = s.props[id];
            // Vines in reach snap; other bombs in reach light, with a short fuse.
            if (pr.kind === 'bomb' && Math.hypot(pr.x - x, pr.y - y) <= BOMB_REACH + BOMB_R) this.lightBomb(pr, BOMB_CHAIN);
            if (pr.kind !== 'vine') continue;
            for (const l of [...pr.links]) {
                const t = world.getRigidBody(l.body)?.translation();
                if (t && Math.hypot(t.x - x, t.y - y) <= BOMB_REACH) this.hitVine(pr.id, l.lid, 99);
            }
        }
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
            if (b.loose) continue;
            if (b.hanging) { this.hangSpring(b); continue; }
            if (b.jello || b.neutral) continue;
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

    // The hinge: pull the last nail's point back to where it was driven in.
    hangSpring(b) {
        const body = this.world.getRigidBody(b.body);
        const nail = b.nails[0];
        const [px, py] = this.nailPoint(b, nail), [ax, ay] = this.nailAnchor(b, nail);
        const c = body.translation(), v = body.linvel(), w = body.angvel();
        const vx = v.x - w * (py - c.y), vy = v.y + w * (px - c.x);   // velocity of the nail point
        const m = body.mass();
        body.applyImpulseAtPoint({
            x: m * DT * (HANG_K * (ax - px) - HANG_C * vx),
            y: m * DT * (HANG_K * (ay - py) - HANG_C * vy),
        }, { x: px, y: py }, true);
    }

    updateBlocks() {
        const { world, s } = this;
        for (const id in s.blocks) {
            const b = s.blocks[id];
            if ((b.jello || b.neutral) && !b.loose) continue;
            const body = world.getRigidBody(b.body);
            const p = body.translation();
            if (b.loose) {
                if (p.y < -H - 2) this.removeBlock(b, true);
            }
            // Pinned blocks no longer snap loose from a hard knock: only their nails let go.
        }
    }

    settled() {
        const { world, s } = this;
        // A mushroom that lost its block finishes falling, and fallen bits of vine finish fading,
        // before the board counts as settled.
        for (const id in s.props) if (s.props[id].falling || s.props[id].debris?.length || s.props[id].lit) return false;
        for (const id in s.blocks) {
            const b = s.blocks[id];
            if ((b.jello || b.neutral) && !b.loose && !b.hanging) continue;
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
        s.stretch = false;
        const spec = zoneSpec(s.depth);
        // The game introduces each new thing itself (see game.js). The sim only announces
        // launcher upgrades, which are news about the run.
        s.note = null;
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
        const TOP_ROW = ZONE_TOP_ROW, ROWS = ZONE_ROWS;
        const grid = Array.from({ length: ROWS }, () => new Array(W).fill(0));
        const free = (c, r) => c >= 0 && c < W && r >= 0 && r < ROWS && grid[r][c] === 0;
        // Fairness: never fill a whole row, so there's always a way down.
        const rowOk = (cells) => {
            const rows = new Set(cells.map(([, r]) => r));
            for (const r of rows) {
                const used = grid[r].filter((g) => g !== 0).length + cells.filter(([, rr]) => rr === r).length;
                if (used >= W) return false;
            }
            return true;
        };

        // Props first, so blocks fill in around them. Windmills take open space; mushrooms
        // grow off a wall or a block, so they're placed once the blocks are planned.
        // At most two mushrooms a zone.
        let mushrooms = 0, windmills = 0;
        for (let i = 0; i < spec.props; i++) {
            if (mushrooms < 2 && this.rand() < (spec.props === 1 ? 0.5 : 0.4)) mushrooms += 1;
            else windmills += 1;
        }
        // Vines: shown on their own first (depth 9), then one a zone while you learn them,
        // then one or two once they're familiar. Never more than two kinds of prop in a zone.
        let vines = s.depth < VINE_FROM ? 0 : s.depth === VINE_FROM ? 1 : s.depth <= VINE_FROM + 3 ? 1 : (this.rand() < 0.5 ? 2 : 1);
        if (s.depth === VINE_FROM) { windmills = 0; mushrooms = 0; }
        else if (vines && windmills && mushrooms) { if (this.rand() < 0.5) { windmills += mushrooms; mushrooms = 0; } else { mushrooms = Math.min(2, mushrooms + windmills); windmills = 0; } }
        // Bombs are a treat, not a fixture: one introduces them at depth 15, then about one zone
        // in three has one (deeper down, now and then two). A bomb is a prop, so a zone with one
        // keeps just one other kind (at most two kinds of props a zone).
        const bombs = s.depth < BOMB_FROM ? 0 : s.depth === BOMB_FROM ? 1
            : this.rand() >= BOMB_CHANCE ? 0 : s.depth >= BOMB_FROM + 7 && this.rand() < 0.2 ? 2 : 1;
        if (bombs) {
            const kinds = [vines && 'vine', windmills && 'windmill', mushrooms && 'mushroom'].filter(Boolean);
            const keep = kinds[Math.floor(this.rand() * kinds.length)];
            if (keep !== 'vine') vines = 0;
            if (keep !== 'windmill') windmills = 0;
            if (keep !== 'mushroom') mushrooms = 0;
        }
        const chandelierChance = s.depth === VINE_FROM ? 0 : s.depth <= VINE_FROM + 3 ? 0.5 : 0.4;
        // Prop centres in grid units, to keep props apart.
        const propAt = [];
        const roomy = (x, y) => propAt.every(([px, py]) => Math.hypot(px - x, py - y) >= propGap(s.depth));

        const isTall = (sh) => sh.c.length >= 2 && sh.c.every(([c]) => c === 0);
        const bigMul = Math.min(5, 2.6 + 0.3 * s.depth);    // chunky shapes dominate, more so deeper down
        // Variety: straight pieces (bars, rectangles) are easy to read but get samey, so past the
        // first zones the interlocking shapes (L, T, S and their big versions) come up more,
        // long bars are rare early, and big rectangles get a smaller share of the chunky boost.
        const deep = s.depth >= 7;
        const straight = (sh) => (!sh.rect ? (deep ? 2.5 : s.depth >= 3 ? 1.9 : 1.2)
            : sh.long >= 4 ? (s.depth <= 4 ? 0 : 0.5)
            : sh.long === 3 && sh.size === 3 ? (s.depth <= 3 ? 0.4 : deep ? 0.55 : 0.7)
            : sh.size === 2 ? (deep ? 0.75 : 1) : 1);
        const weight = (sh) => sh.w * (isTall(sh) ? style.tall : 1) * straight(sh)
            * (sh.size >= 5 ? (sh.rect ? 1 + (bigMul - 1) * 0.55 : bigMul) : 1);
        const total = SHAPE_VARIANTS.reduce((n, sh) => n + weight(sh), 0);
        const CHUNKY = SHAPE_VARIANTS.filter((sh) => sh.size >= 4);
        const chunkyTotal = CHUNKY.reduce((n, sh) => n + weight(sh), 0);
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
            return cc >= 0 && cc < W && rr >= 0 && rr < ROWS && grid[rr][cc] !== 0;
        }));
        const plan = [];
        let filled = 0;
        const target = Math.round(W * ROWS * (spec.fill + style.fill));

        let cupPrize = null;
        // Now and then a cup: two walls and a floor with a gap inside. A ball that drops
        // in rattles around, hitting all three. A trap worth aiming for.
        if (this.rand() < spec.cups) {
            for (let tries = 0; tries < 30; tries++) {
                const c = Math.floor(this.rand() * (W - 3)), r = 2 + Math.floor(this.rand() * (ROWS - 6));
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
        // Vines are planned with their blocks, before the rest fill in, so there's always room.
        // They stay in the middle and lower part of the zone, out of the way of the first shots.
        // Two kinds: strung across a short gap (between blocks, or a block and a wall), or
        // hanging under a block, sometimes holding a small block like a chandelier.
        const vineSpots = [];
        const hostAt = (cells) => {
            plan.push({ cells, kind: 'pinned', tilt: 0, dx: 0, dy: 0, wantsGap: false, vine: true });
            cells.forEach(([cc, rr]) => { grid[rr][cc] = plan.length; });
            filled += cells.length;
            return plan[plan.length - 1];
        };
        // Never two hanging vines: two vines are always one of each kind, for variety.
        const vineKinds = vines === 2 ? (this.rand() < 0.5 ? ['strung', 'hang'] : ['hang', 'strung'])
            : vines === 1 ? [s.depth === VINE_FROM || this.rand() < 0.5 ? 'strung' : 'hang'] : [];
        for (let i = 0, tries = 0; i < vineKinds.length && tries < 80; tries++) {
            if (tries === 40 && i < vineKinds.length) { i++; if (i >= vineKinds.length) break; }   // that one didn't fit: move on
            if (vineKinds[i] === 'strung') {
                // Strung: a gap of 2–4 cells in rows 3–8, with a cell below it for the sag.
                const g = 2 + Math.floor(this.rand() * 3), c0 = Math.floor(this.rand() * (W - g + 1));
                const r = 3 + Math.floor(this.rand() * (ROWS - 4));
                // The block at each end: a short bar or a little L, turned away from the gap.
                const host = (x, away) => {
                    const opts = [[[x, r], [x, r - 1]], [[x, r], [x + away, r]], [[x, r], [x, r - 1], [x + away, r - 1]],
                        [[x, r], [x + away, r], [x + away, r - 1]], [[x, r], [x, r + 1], [x + away, r + 1]]];
                    return opts[Math.floor(this.rand() * opts.length)];
                };
                const left = c0 === 0 ? null : host(c0 - 1, -1), right = c0 + g === W ? null : host(c0 + g, 1);
                const gap = [];
                for (let c = c0; c < c0 + g; c++) gap.push([c, r], [c, r + 1]);
                const hosts = [...(left ?? []), ...(right ?? [])];
                if (![...hosts, ...gap].every(([cc, rr]) => free(cc, rr)) || !rowOk(hosts) || !roomy(c0 + g / 2, r + 0.5)) continue;
                const a = left ? { p: hostAt(left), cell: [c0 - 1, r] } : { wall: 0 };
                const b = right ? { p: hostAt(right), cell: [c0 + g, r] } : { wall: W };
                gap.forEach(([cc, rr]) => { grid[rr][cc] = -1; });
                propAt.push([c0 + g / 2, r + 0.5]);
                vineSpots.push({ strung: true, a, b, r });
            } else {
                // Hanging: the block sits in rows 3–6 (3–5 with a chandelier, which needs more room).
                const c = Math.floor(this.rand() * W);
                const chand = this.rand() < chandelierChance;
                const r = 3 + Math.floor(this.rand() * (chand ? ROWS - 7 : ROWS - 6));
                const shapes = [[[c, r], [c + 1, r]], [[c, r], [c + 1, r], [c, r - 1], [c + 1, r - 1]], [[c - 1, r], [c, r], [c + 1, r]],
                    [[c, r], [c + 1, r], [c + 1, r - 1]], [[c - 1, r], [c, r], [c - 1, r - 1]], [[c - 1, r], [c, r], [c + 1, r], [c, r - 1]],
                    [[c, r], [c, r - 1], [c + 1, r - 1]]];
                const cells = shapes[Math.floor(this.rand() * shapes.length)];
                // Room below: two cells for the vine and, for a chandelier, one for its little
                // block plus a clear one under it, so it lands with a thump.
                const hang = [[c, r + 1], [c, r + 2]], lamp = chand ? [[c, r + 3]] : [];
                const drop = chand ? [[c, r + 4]] : [];
                if (![...cells, ...hang, ...lamp, ...drop].every(([cc, rr]) => free(cc, rr)) || !rowOk(cells) || !roomy(c + 0.5, r + 2)) continue;
                const p = hostAt(cells);
                [...hang, ...lamp, ...drop].forEach(([cc, rr]) => { grid[rr][cc] = -1; });
                propAt.push([c + 0.5, r + 2]);
                vineSpots.push({ p, c, r, lamp });
            }
            i++;
        }
        for (let i = 0, tries = 0; i < windmills && tries < 80; tries++) {
            const c = Math.floor(this.rand() * (W - 1)), r = Math.floor(this.rand() * (ROWS - 1));
            const cells = [[c, r], [c + 1, r], [c, r + 1], [c + 1, r + 1]];
            if (!cells.every(([cc, rr]) => free(cc, rr)) || !roomy(c + 1, r + 1)) continue;
            propAt.push([c + 1, r + 1]);
            cells.forEach(([cc, rr]) => { grid[rr][cc] = -1; });
            this.addWindmill(c + 1, -(r + 1 + TOP_ROW));
            i++;
        }
        for (let tries = 0; tries < 2500 && filled < target; tries++) {
            // Chunky first: until about half the target is filled, only 4+ cell shapes are placed,
            // so big pieces get room before small ones scatter. Then anything fills the gaps.
            const chunky = filled < target * 0.55 && tries < 1500;
            const pool = chunky ? CHUNKY : SHAPE_VARIANTS;
            const poolTotal = chunky ? chunkyTotal : total;
            let pick = this.rand() * poolTotal, shape = pool[0];
            for (const sh of pool) { if ((pick -= weight(sh)) <= 0) { shape = sh; break; } }
            if ((used[shape.canon] ?? 0) >= (shape.size === 1 ? 3 : 2)) continue;
            const col = Math.floor(this.rand() * W), row = Math.floor(this.rand() * ROWS);
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
            const small = plan.filter((p) => p.cells.length <= 3 && !p.cup && !p.vine);
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
            const g = r + 1 < ROWS ? grid[r + 1][c] : 0;
            return g > 0 && plan[g - 1] !== p && (plan[g - 1].kind === 'pinned' || plan[g - 1].kind === 'neutral');
        });
        const wantLoose = Math.round(plan.length * Math.min(0.4, spec.loose * style.loose));
        for (let i = 0, made = 0; i < plan.length * 3 && made < wantLoose; i++) {
            const p = plan[Math.floor(this.rand() * plan.length)];
            // One-square blocks never rest loose: on the floor they'd be too hard to hit.
            if (p.kind !== 'pinned' || p.cup || p.vine || p.cells.length === 1 || !solidBelow(p)) continue;
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

        // Where the mushrooms grow: about half off a side wall, the rest off the side or top
        // of a fixed block (never a resting or jelly one), always into an empty cell.
        const mushSpots = [];
        const SIDES = [[-1, 0, Math.PI / 2], [1, 0, -Math.PI / 2], [0, -1, 0]];
        for (let i = 0; i < mushrooms; i++) {
            let spot = null;
            if (this.rand() < 0.5) {
                const hosts = plan.filter((p) => (p.kind === 'pinned' || p.kind === 'neutral') && !p.cup);
                for (let tries = 0; tries < 30 && hosts.length && !spot; tries++) {
                    const p = hosts[Math.floor(this.rand() * hosts.length)];
                    const [c, r] = p.cells[Math.floor(this.rand() * p.cells.length)];
                    const [dc, dr, dir] = SIDES[Math.floor(this.rand() * 3)];
                    if (!free(c + dc, r + dr) || !roomy(c + dc + 0.5, r + dr + 0.5)) continue;
                    spot = { p, c, r, dc, dr, dir, cell: [c + dc, r + dr] };
                }
            }
            for (let tries = 0; tries < 40 && !spot; tries++) {
                const right = this.rand() < 0.5, c = right ? W - 1 : 0;
                const r = Math.floor(this.rand() * ROWS);
                if (!free(c, r) || !roomy(c + 0.5, r + 0.5)) continue;
                spot = { p: null, c, r, dir: right ? Math.PI / 2 : -Math.PI / 2, right, cell: [c, r] };
            }
            if (!spot) continue;
            grid[spot.cell[1]][spot.cell[0]] = -1;
            propAt.push([spot.cell[0] + 0.5, spot.cell[1] + 0.5]);
            mushSpots.push(spot);
        }

        // Where bombs sit: an empty cell snug among blocks, so the burst has plenty to hit.
        const bombSpots = [];
        if (bombs) {
            const around = (c, r) => {
                const ids = new Set();
                for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
                    const g = grid[r + dr]?.[c + dc];
                    if (g > 0 && plan[g - 1].kind !== 'neutral') ids.add(g);
                }
                return ids.size;
            };
            const spots = [];
            for (let r = 1; r < ROWS - 1; r++) for (let c = 0; c < W; c++) if (free(c, r)) spots.push({ c, r, n: around(c, r) });
            spots.sort((a, b) => b.n - a.n || this.rand() - 0.5);
            for (let i = 0; i < bombs; i++) {
                // The first goes where it'll do the most (one of the best few spots); a second anywhere snug.
                // Snug and clear of other props if possible; failing that, snug; failing that, beside a block.
                // Room above for the fuse is preferred, so it doesn't poke into a block.
                const open = spots.filter((o) => free(o.c, o.r));
                let pool = open.filter((o) => o.n >= 2 && roomy(o.c + 0.5, o.r + 0.5) && free(o.c, o.r - 1));
                if (!pool.length) pool = open.filter((o) => o.n >= 2 && roomy(o.c + 0.5, o.r + 0.5));
                if (!pool.length) pool = open.filter((o) => o.n >= 2);
                if (!pool.length) pool = open.filter((o) => o.n >= 1);
                if (!pool.length) break;
                const pick = i === 0 ? pool[Math.floor(this.rand() * Math.min(3, pool.length))] : pool[Math.floor(this.rand() * pool.length)];
                grid[pick.r][pick.c] = -1;
                propAt.push([pick.c + 0.5, pick.r + 0.5]);
                bombSpots.push(pick);
            }
        }

        // Numbers. First the zone's total: what each block would get on its own, summed.
        // Then that total is shared out by size, so bigger blocks always hold the bigger
        // numbers and a lone square never ends up a slog to chip down.
        const grow = multishotGrowth(s.volley) * hpScale(s.depth);   // deeper zones and multishot
        let zoneHp = 0, weights = 0;
        for (const p of plan) {
            const t = this.rand();
            p.hp = (spec.lo + (spec.hi - spec.lo) * t * t) * (0.6 + 0.4 * p.cells.length) * grow;
            if (p.kind === 'jello') { p.hp *= 0.5; continue; }    // jelly keeps its own, smaller number
            zoneHp += p.hp;
            // Size counts for more than size alone (n^1.4), with a little variety (±20%).
            // Only big blocks can be the extra-tough one.
            p.w = p.cells.length ** 1.4 * (0.8 + 0.4 * this.rand());
            if (p.cells.length >= 4 && this.rand() < spec.tough) p.w *= 1.4 + this.rand() * 0.4;
            if (p.kind === 'loose') p.w *= 0.5;    // resting blocks can tumble somewhere awkward
            weights += p.w;
        }
        // No runaway block: none holds more than twice the next biggest. What's trimmed
        // goes to the others, so the zone's total stays the same.
        const solid = plan.filter((p) => p.kind !== 'jello').sort((a, b) => b.w - a.w);
        if (solid.length >= 2 && solid[0].w > solid[1].w * 2) {
            const extra = solid[0].w - solid[1].w * 2;
            solid[0].w -= extra;
            const rest = weights - extra - solid[0].w;
            for (const p of solid.slice(1)) p.w += extra * p.w / rest;
        }
        for (const p of plan) {
            const hp = p.kind === 'jello' ? p.hp : zoneHp * p.w / weights;
            p.block = this.addBlock(p.cells.map(([c, r]) => [c, r + TOP_ROW]), Math.max(1, Math.round(hp)), p.kind, p.tilt, p.dx, p.dy);
            if (p.cup) p.block.cup = true;
        }
        for (const b of bombSpots) this.addBomb(b.c + 0.5, -(b.r + TOP_ROW + 0.5));
        for (const v of vineSpots) {
            if (v.strung) {
                // Tied to the side of a block (face -1 left, +1 right), or to a wall.
                const end = (e, face) => {
                    if (e.wall != null) return { x: e.wall, y: -(v.r + TOP_ROW + 0.5) };
                    const b = e.p.block, i = e.p.cells.findIndex(([c, r]) => c === e.cell[0] && r === e.cell[1]);
                    return { block: b, lx: b.cells[i][0] + face * 0.5, ly: b.cells[i][1] };
                };
                this.addVine(end(v.a, 1), end(v.b, -1));
                continue;
            }
            const b = v.p.block, i = v.p.cells.findIndex(([c, r]) => c === v.c && r === v.r);
            let lamp = null;
            if (v.lamp.length) {
                // A little one-square block with no nails, numbered like the zone's small blocks.
                const small = plan.filter((p) => p.block && p.cells.length <= 2 && !p.block.neutral).map((p) => p.block.hp0 / p.cells.length).sort((a, b) => a - b);
                const hp = Math.max(2, Math.round(small.length ? small[Math.floor(small.length / 2)] : 3 * hpScale(s.depth)));
                lamp = this.addBlock(v.lamp.map(([c, r]) => [c, r + TOP_ROW]), hp, 'loose');
                lamp.mini = VINE_LAMP_SIZE;
                this.shapeBlock(lamp);
            }
            this.addVine({ block: b, lx: b.cells[i][0], ly: b.cells[i][1] - 0.5 }, null, lamp);
        }
        for (const m of mushSpots) {
            if (!m.p) { this.addMushroom(null, m.right ? W : 0, -(m.r + TOP_ROW + 0.5), m.dir); continue; }
            // The cell's centre in the block's own space, nudged out to the face it grows from.
            const b = m.p.block, i = m.p.cells.findIndex(([c, r]) => c === m.c && r === m.r);
            this.addMushroom(b, b.cells[i][0] + m.dc * 0.5, b.cells[i][1] - m.dr * 0.5, m.dir);
        }

        // Two +1 pickups in open cells that are open above too, so a ball can reach them,
        // and never close together.
        let open = [];
        grid.forEach((row, r) => row.forEach((g, c) => { if (g === 0 && (r === 0 || grid[r - 1][c] === 0)) open.push([c, r]); }));
        let placed = 0;
        if (cupPrize) {
            this.addPickup(cupPrize[0], -(cupPrize[1] + TOP_ROW));
            open = open.filter(([cc, rr]) => Math.hypot(cc + 0.5 - cupPrize[0], rr + 0.5 - cupPrize[1]) >= MIN_PICKUP_GAP);
            placed = 1;
        }
        for (let i = placed; i < 2 && open.length; i++) {
            const [c, r] = open[Math.floor(this.rand() * open.length)];
            this.addPickup(c + 0.5, -(r + TOP_ROW + 0.5));
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
        // Vines start the zone at rest.
        for (const id in s.props) {
            const pr = s.props[id];
            if (pr.kind !== 'vine') continue;
            pr.calm = VINE_CALM_STEPS;        // so the first check (which also notes where it lies) puts it to sleep
            pr.tick = VINE_CHECK_EVERY - 1;
            this.restVine(pr, () => []);
        }
        // Mushrooms start the zone still, not mid-wobble from the settling.
        for (const id in s.props) {
            const pr = s.props[id];
            if (pr.kind !== 'mushroom' || pr.falling) continue;
            const body = this.world.getRigidBody(pr.body);
            const hostA = pr.host == null ? 0 : this.world.getRigidBody(s.blocks[pr.host].body).rotation();
            body.setRotation(hostA + pr.rel, true);
            body.setAngvel(0, true);
            body.setLinvel({ x: 0, y: 0 }, true);
        }

        // Zone 3 is where resting blocks are introduced: make sure at least one survived settling.
        if (s.depth === 3 && !Object.values(s.blocks).some((b) => b.loose) && (s.retries = (s.retries ?? 0) + 1) < 8) {
            for (const id in s.blocks) this.removeBlock(s.blocks[id], false);
            this.events.length = 0;
            s.depth -= 1;
            this.genZone();
            return;
        }
        s.retries = 0;
        if (s.depth > 1) this.gain(zoneBonus(s.depth), W / 2, -2.5);
        if (s.pendingPar > 0) { this.gain(s.pendingPar, W / 2, -3.3); this.events.push({ t: 'par', n: s.pendingPar }); }
        s.pendingPar = 0;
        s.zoneHp0 = this.hpLeft();
        // How much this zone's numbers are scaled up; block colours divide it back out,
        // so every zone keeps the full range of colours and patterns.
        s.tierScale = hpScale(s.depth) * multishotGrowth(s.volley);
        s.par = Math.max(3, Math.min(30, Math.round(s.zoneHp0 / (parHpPerShot(s.depth) * s.volley))));
        s.zoneShots = 0;

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
    // A vine: a chain of small link bodies joined end to end. It hangs from one end (under a
    // block) or is strung between two (blocks or walls) with a little slack. Each end is
    // { block, lx, ly } in the block's unscaled cell space, or { x, y } on a wall.
    // Only balls touch the links; a snapped link splits the chain, and whatever is no longer
    // held by an end falls (and fades). A hanging vine can hold a block like a chandelier.
    addVine(endA, endB, lamp) {
        const { R, world, s } = this;
        const id = s.nextId++;
        // Each end is a small pin with nothing to hit: fixed on a wall, and on a block one that
        // follows the block around (see updateVines). The vine never pulls on the block itself,
        // so a nailed block and its vine can both come to rest.
        const ends = [endA, endB].filter(Boolean).map((e, side) => {
            const end = e.block ? { side, host: e.block.id, lx: e.lx, ly: e.ly, alive: true } : { side, host: null, alive: true };
            const at = e.block ? this.vineEndPoint(end) : { x: e.x, y: e.y };
            const desc = e.block ? R.RigidBodyDesc.kinematicPositionBased() : R.RigidBodyDesc.fixed();
            end.pin = world.createRigidBody(desc.setTranslation(at.x, at.y)).handle;
            return end;
        });
        const endBody = (e) => world.getRigidBody(e.pin);
        const endLocal = () => ({ x: 0, y: 0 });
        const endWorld = (e) => endBody(e).translation();
        const A = endWorld(ends[0]);
        // Where the joints go: straight down for a hanging vine; for a strung one, along a
        // shallow curve whose length takes up the slack, so it starts out sagging.
        let n, len, pts;
        if (ends[1]) {
            const B = endWorld(ends[1]), dist = Math.hypot(B.x - A.x, B.y - A.y);
            const length = dist * VINE_SLACK;
            n = Math.max(3, Math.round(length / VINE_STRUNG_LEN));
            const sag = Math.sqrt(3 * dist * (length - dist) / 8);
            const curve = [];
            for (let i = 0; i <= 64; i++) {
                const t = i / 64;
                curve.push({ x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t - sag * 4 * t * (1 - t) });
            }
            const acc = [0];
            for (let i = 1; i < curve.length; i++) acc.push(acc[i - 1] + Math.hypot(curve[i].x - curve[i - 1].x, curve[i].y - curve[i - 1].y));
            len = acc[acc.length - 1] / n;
            pts = [];
            for (let k = 0, j = 0; k <= n; k++) {
                const want = len * k;
                while (j < acc.length - 2 && acc[j + 1] < want) j++;
                const u = Math.min(1, (want - acc[j]) / (acc[j + 1] - acc[j] || 1));
                pts.push({ x: curve[j].x + (curve[j + 1].x - curve[j].x) * u, y: curve[j].y + (curve[j + 1].y - curve[j].y) * u });
            }
        } else {
            n = VINE_LINKS; len = VINE_LINK_LEN;
            pts = Array.from({ length: n + 1 }, (_, k) => ({ x: A.x, y: A.y - len * k }));
        }
        const pr = { id, kind: 'vine', ends, n, len, links: [], debris: [], bodies: ends.map((e) => e.pin), cols: [], lamp: lamp?.id ?? null };
        // A link's near end is its local (0, +len/2); it points along local -y.
        let prev = endBody(ends[0]), prevAnchor = endLocal(ends[0]);
        for (let i = 0; i < n; i++) {
            const p0 = pts[i], p1 = pts[i + 1];
            const body = world.createRigidBody(R.RigidBodyDesc.dynamic()
                .setTranslation((p0.x + p1.x) / 2, (p0.y + p1.y) / 2).setRotation(Math.atan2(p1.x - p0.x, p0.y - p1.y))
                .setLinearDamping(0.6).setAngularDamping(1.2));
            const col = world.createCollider(R.ColliderDesc.cuboid(0.09, len / 2).setDensity(0.4)
                .setRestitution(0.5).setFriction(0.3).setCollisionGroups(groups(G.PROP, G.BALL)), body);
            const joint = world.createImpulseJoint(R.JointData.revolute(prevAnchor, { x: 0, y: len / 2 }), prev, body, true);
            joint.setContactsEnabled(false);
            s.owner[col.handle] = { t: 'vine', id, lid: i };
            pr.links.push({ lid: i, body: body.handle, col: col.handle, hp: VINE_LINK_HP });
            pr.bodies.push(body.handle); pr.cols.push(col.handle);
            prev = body; prevAnchor = { x: 0, y: -len / 2 };
        }
        if (ends[1]) {
            world.createImpulseJoint(R.JointData.revolute(prevAnchor, endLocal(ends[1])), prev, endBody(ends[1]), true).setContactsEnabled(false);
        }
        if (lamp) {
            lamp.hung = id;
            const lampBody = world.getRigidBody(lamp.body);
            lampBody.setGravityScale(VINE_LAMP_FALL, true);   // light while it hangs, so its block doesn't sag
            const top = Math.max(...lamp.cells.map(([, y]) => y)) + 0.5;
            lampBody.setTranslation({ x: A.x, y: A.y - len * n - top * lamp.scale }, true);
            world.createImpulseJoint(R.JointData.revolute(prevAnchor, { x: 0, y: top * lamp.scale }), prev, lampBody, true);
        }
        s.props[id] = pr;
        return pr;
    }

    // A ball hit link `lid` of vine `id`.
    hitVine(id, lid, n) {
        const pr = this.s.props[id];
        if (!pr) return;
        const i = pr.links.findIndex((l) => l.lid === lid);
        if (i < 0) return;
        const link = pr.links[i];
        link.hp -= n;
        for (const l of pr.links) this.world.getRigidBody(l.body).wakeUp();   // it may have been put to rest
        const p = this.world.getRigidBody(link.body).translation();
        if (link.hp > 0) { this.events.push({ t: 'vinehit', id, lid, x: p.x, y: p.y }); return; }
        this.events.push({ t: 'vinesnap', id, lid, x: p.x, y: p.y });
        this.world.removeRigidBody(this.world.getRigidBody(link.body));
        delete this.s.owner[link.col];
        pr.bodies = pr.bodies.filter((h) => h !== link.body);
        pr.cols = pr.cols.filter((h) => h !== link.col);
        pr.links.splice(i, 1);
        this.dropLooseLinks(pr);
        this.wakeLoose();
    }

    // Links still joined to a living end stay; the rest fall, and a hung block with them.
    dropLooseLinks(pr) {
        const { world, s } = this;
        const have = new Set(pr.links.map((l) => l.lid)), held = new Set();
        const [a, b] = pr.ends;
        if (a.alive) for (let i = 0; have.has(i); i++) held.add(i);
        if (b?.alive) for (let i = pr.n - 1; have.has(i); i--) held.add(i);
        for (const l of pr.links.filter((x) => !held.has(x.lid))) {
            // Fallen bits land on blocks but balls ignore them.
            world.getCollider(l.col).setCollisionGroups(groups(G.LOOSE, G.BLOCK | G.WALL));
            world.getRigidBody(l.body).wakeUp();
            delete s.owner[l.col];
            pr.debris.push({ ...l, t: 0 });
        }
        pr.links = pr.links.filter((x) => held.has(x.lid));
        if (pr.lamp != null && !held.has(pr.n - 1)) {
            if (s.blocks[pr.lamp]) {
                s.blocks[pr.lamp].hung = null;
                const lamp = world.getRigidBody(s.blocks[pr.lamp].body);
                lamp.setGravityScale(BLOCK_FALL, true);
                lamp.wakeUp();
            }
            pr.lamp = null;
        }
    }

    updateVines() {
        const { world, s } = this;
        let balls = null;    // ball positions and velocities, read once per step and only if a vine needs them
        const ballsAt = () => (balls ??= s.balls.map((b) => {
            const body = world.getRigidBody(b.body);
            if (!body) return null;
            const t = body.translation(), v = body.linvel();
            return { x: t.x, y: t.y, vx: v.x, vy: v.y };
        }).filter(Boolean));
        for (const id in s.props) {
            const pr = s.props[id];
            if (pr.kind !== 'vine') continue;
            for (const e of pr.ends) {
                if (e.host == null || !e.alive) continue;
                if (!s.blocks[e.host]) {
                    // Its block popped: the pin goes, and whatever it held falls.
                    e.alive = false;
                    world.removeRigidBody(world.getRigidBody(e.pin));
                    pr.bodies = pr.bodies.filter((h) => h !== e.pin);
                    this.dropLooseLinks(pr);
                    continue;
                }
                // Follow the block (it may swing, fall, or shrink as it wears down). Only when it
                // has visibly moved, so a still vine can stay at rest; when it has, the vine wakes.
                if (world.getRigidBody(s.blocks[e.host].body).isSleeping() && s.blocks[e.host].scale === e.k) continue;
                e.k = s.blocks[e.host].scale;
                const pin = world.getRigidBody(e.pin), at = this.vineEndPoint(e), t = pin.translation();
                if (Math.abs(at.x - t.x) + Math.abs(at.y - t.y) > VINE_PIN_SLOP) {
                    pin.setNextKinematicTranslation(at);
                    this.wakeVine(pr);
                }
            }
            this.restVine(pr, ballsAt);
            for (let i = pr.debris.length - 1; i >= 0; i--) {
                const d = pr.debris[i];
                if (++d.t < VINE_DEBRIS_STEPS) continue;
                world.removeRigidBody(world.getRigidBody(d.body));
                pr.bodies = pr.bodies.filter((h) => h !== d.body);
                pr.cols = pr.cols.filter((h) => h !== d.col);
                pr.debris.splice(i, 1);
            }
        }
    }

    wakeVine(pr) {
        if (!pr.links.length || !this.world.getRigidBody(pr.links[0].body).isSleeping()) return;
        for (const l of pr.links) this.world.getRigidBody(l.body).wakeUp();
        pr.calm = 0;
    }

    // Where a vine end tied to a block is now: its spot on the block, turned and scaled with it.
    vineEndPoint(e) {
        const b = this.s.blocks[e.host], body = this.world.getRigidBody(b.body);
        const t = body.translation(), a = body.rotation(), k = b.scale, c = Math.cos(a), sn = Math.sin(a);
        return { x: t.x + (e.lx * c - e.ly * sn) * k, y: t.y + (e.lx * sn + e.ly * c) * k };
    }

    // Vines stay dormant unless something happens to them: a ball comes close (it stirs up a
    // little wind as it passes), a ball hits one, or the block it hangs from moves. Once a
    // vine has been nearly still for a moment with nothing close, it goes back to sleep.
    restVine(pr, ballsAt) {
        const { world, s } = this;
        if (!pr.links.length) return;
        const box = pr.box;
        const near = box && s.balls.length ? ballsAt().filter((t) => t.x > box[0] && t.x < box[1] && t.y > box[2] && t.y < box[3]) : [];
        // A vine's links share one island, so one link tells whether it's asleep.
        if (world.getRigidBody(pr.links[0].body).isSleeping()) {
            if (!near.length) return;
            this.wakeVine(pr);
        }
        if (near.length) this.stirVine(pr, near);
        // Awake: every few steps, note where it is and see whether it has settled down.
        if ((pr.tick = ((pr.tick ?? 0) + 1) % VINE_CHECK_EVERY) !== 0) return;
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, calm = true;
        for (const l of pr.links) {
            const b = world.getRigidBody(l.body), t = b.translation(), v = b.linvel();
            if (Math.abs(v.x) + Math.abs(v.y) + Math.abs(b.angvel()) >= VINE_STILL) calm = false;
            if (t.x < x0) x0 = t.x; if (t.x > x1) x1 = t.x; if (t.y < y0) y0 = t.y; if (t.y > y1) y1 = t.y;
        }
        pr.box = [x0 - VINE_WAKE, x1 + VINE_WAKE, y0 - VINE_WAKE, y1 + VINE_WAKE];
        if (!calm || near.length) { pr.calm = 0; return; }
        if ((pr.calm = (pr.calm ?? 0) + VINE_CHECK_EVERY) < VINE_CALM_STEPS) return;
        for (const l of pr.links) world.getRigidBody(l.body).sleep();
        if (pr.lamp != null && s.blocks[pr.lamp]) world.getRigidBody(s.blocks[pr.lamp].body).sleep();   // its chandelier rests too
        pr.calm = 0;
    }

    // A ball rushing past pushes the nearest links a little the way it's going: a gentle
    // sway, strongest right next to the ball.
    stirVine(pr, balls) {
        for (const l of pr.links) {
            const b = this.world.getRigidBody(l.body), t = b.translation();
            let ix = 0, iy = 0;
            for (const ball of balls) {
                const d = Math.hypot(ball.x - t.x, ball.y - t.y);
                if (d >= VINE_WIND_REACH) continue;
                const f = VINE_WIND * (1 - d / VINE_WIND_REACH);
                ix += ball.vx * f; iy += ball.vy * f;
            }
            if (!ix && !iy) continue;
            const v = b.linvel();
            if (Math.abs(v.x) + Math.abs(v.y) > VINE_WIND_MAX) continue;    // a breeze, never a whip
            const m = b.mass();
            b.applyImpulse({ x: ix * m, y: iy * m }, true);
        }
    }

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

    // A mushroom grows off a wall or a block. Its cap kicks balls back harder than they
    // came in, and the stem is a springy hinge, so a hit makes it wobble. It hangs on to
    // its block as the block jiggles or shrinks; if the block pops, it falls.
    // host: a block, or null for a wall. (lx, ly): where it grows from, in the host's
    // unscaled cell space (or the world, for a wall). dir: the way it points (radians,
    // 0 = up, -PI/2 = right, PI/2 = left).
    addMushroom(host, lx, ly, dir) {
        const { R, world, s } = this;
        const id = s.nextId++;
        const k = host ? host.scale : 1;
        let hostBody, x = lx, y = ly;
        if (host) {
            hostBody = world.getRigidBody(host.body);
            const p = hostBody.translation(), a = hostBody.rotation();
            x = p.x + (lx * Math.cos(a) - ly * Math.sin(a)) * k;
            y = p.y + (lx * Math.sin(a) + ly * Math.cos(a)) * k;
        } else {
            hostBody = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y));
        }
        const body = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(x, y).setRotation(dir)
            .setGravityScale(0).setLinearDamping(0.3).setAngularDamping(0.3).setCanSleep(false));
        const pts = [];
        const r = 0.46, capY = 0.4;
        for (let i = 0; i <= 10; i++) {
            const a = (Math.PI * i) / 10;
            pts.push(Math.cos(a) * r, capY + Math.sin(a) * r * 0.75);
        }
        // Only balls touch a growing mushroom: a resting block leaning on one would bend it flat.
        const hit = groups(G.PROP, G.BALL);
        const cap = world.createCollider(
            R.ColliderDesc.convexHull(new Float32Array(pts)).setDensity(MUSH_DENSITY).setRestitution(1.3)
                .setRestitutionCombineRule(R.CoefficientCombineRule.Max).setFriction(0.2)
                .setCollisionGroups(hit), body);
        const stem = world.createCollider(
            R.ColliderDesc.cuboid(0.14, capY / 2).setTranslation(0, capY / 2).setDensity(MUSH_DENSITY).setRestitution(0.5)
                .setCollisionGroups(hit), body);
        s.owner[cap.handle] = { t: 'prop', id };
        s.owner[stem.handle] = { t: 'prop', id };
        const rel = dir - hostBody.rotation();
        const joint = world.createImpulseJoint(R.JointData.revolute(
            { x: host ? lx * k : 0, y: host ? ly * k : 0 }, { x: 0, y: 0 }), hostBody, body, true);
        joint.setContactsEnabled(false);
        joint.configureMotorPosition(rel, MUSH_K, MUSH_C);
        const bodies = host ? [body.handle] : [body.handle, hostBody.handle];
        s.props[id] = { id, kind: 'mushroom', x, y, bodies, cols: [cap.handle, stem.handle], r, capY,
            body: body.handle, joint: joint.handle, host: host?.id ?? null, lx, ly, k, rel, falling: 0 };
    }

    // Mushrooms keep hold of their block as it shrinks, and fall when it pops.
    updateMushrooms() {
        const { world, s } = this;
        for (const id in s.props) {
            const pr = s.props[id];
            if (pr.kind !== 'mushroom') continue;
            const body = world.getRigidBody(pr.body);
            if (pr.falling) {
                pr.falling += 1;
                const v = body.linvel();
                if (body.translation().y < -H - 2 || pr.falling > MUSH_FALL_MAX ||
                    (pr.falling > 60 && Math.abs(v.x) + Math.abs(v.y) < 0.1)) this.removeProp(pr);
                continue;
            }
            if (pr.host == null) continue;
            const host = s.blocks[pr.host];
            if (!host) {
                // The block popped (its joint went with it): the mushroom drops.
                pr.falling = 1;
                body.setGravityScale(BLOCK_FALL, true);
                body.setAngularDamping(0.15);
                for (const h of pr.cols) world.getCollider(h).setCollisionGroups(groups(G.LOOSE, G.BALL | G.BLOCK | G.LOOSE | G.WALL | G.PROP));
                this.events.push({ t: 'mushfall', id: pr.id });
                continue;
            }
            if (host.scale !== pr.k) {
                pr.k = host.scale;
                world.getImpulseJoint(pr.joint).setAnchor1({ x: pr.lx * pr.k, y: pr.ly * pr.k });
            }
        }
    }

    removeProp(pr) {
        const { world, s } = this;
        for (const h of pr.bodies) world.removeRigidBody(world.getRigidBody(h));
        for (const h of pr.cols) delete s.owner[h];
        delete s.props[pr.id];
    }

    // A tidy-up every few zones, so nothing left over from earlier play can pile up over a long
    // run: lookup entries for colliders that are gone, old hit timers, and vines with nothing left.
    tidy() {
        const { world, s } = this;
        for (const h in s.owner) if (!world.getCollider(Number(h))) delete s.owner[h];
        s.cool = {};
        for (const id in s.props) {
            const pr = s.props[id];
            if (pr.kind === 'vine' && !pr.links.length && !pr.debris.length) this.removeProp(pr);
        }
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

    // The zone is cleared mid-shot: balls still flying (and any not yet fired) are done.
    endShots() {
        if (this.s.shots) this.s.shots.left = 0;
        for (const b of [...this.s.balls]) this.removeBall(b.body);
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
        this.updateMushrooms();
        this.updateBombs();
        this.updateVines();

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
                if (this.cooled(a.body + ':' + b.id)) {
                    const n = s.stretch ? 2 : 1, blk = s.blocks[b.id];
                    this.damageBlock(b.id, n);
                    if (s.blocks[b.id]) this.hitNail(blk, p, n);
                    this.scored(ball);
                }
            } else {
                ball.jello = ball.jello.filter((j) => j !== b.id);
            }
            return;
        }
        if (!started) return;
        if (b.t === 'ball') { this.events.push({ t: 'clack', x: p.x, y: p.y }); return; }
        if (b.t === 'pickup') { this.collectPickup(b.id); return; }
        if (b.t === 'bomb') {
            this.events.push({ t: 'contact', ball: a.body, x: p.x, y: p.y, with: 'bomb', id: b.id });
            const pr = s.props[b.id];
            if (pr && ball) this.lightBomb(pr);
            return;
        }
        if (b.t === 'vine') {
            this.events.push({ t: 'contact', ball: a.body, x: p.x, y: p.y, with: 'vine', id: b.id });
            if (ball && this.cooled(a.body + ':v' + b.id + ':' + b.lid)) { this.hitVine(b.id, b.lid, ballPower(ball) * (s.stretch ? 2 : 1)); this.scored(ball); }
            return;
        }
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
                const dv = Math.min(KNOCK_MAX, impact * KNOCK) * bb.mass() * (blk.loose || blk.hanging ? 1 : PINNED_KNOCK);
                bb.applyImpulse({ x: ball.pv[0] / sp * dv, y: ball.pv[1] / sp * dv }, true);
            }
            // Grey blocks can't be damaged, so bouncing off them doesn't keep a ball alive either.
            if (blk?.neutral && this.cooled(a.body + ':' + b.id)) this.hitNail(blk, p, 1);
            else if (blk && !blk.neutral && this.cooled(a.body + ':' + b.id)) {
                const n = ballPower(ball) * (s.stretch ? 2 : 1);
                this.damageBlock(b.id, n);
                if (s.blocks[b.id]) this.hitNail(blk, p, n);
                this.scored(ball);
            }
        }
    }

    // A ball that just scored is "working": it loses any extra weight and keeps going.
    // Is a ball at p moving along v aimed at a block (not a grey one) within GRACE_RANGE cells?
    headingAtBlock(p, v) {
        const sp = Math.hypot(v.x, v.y);
        if (sp < 0.01) return false;
        const dx = v.x / sp, dy = v.y / sp;
        for (const id in this.s.blocks) {
            const b = this.s.blocks[id];
            if (b.neutral) continue;
            const c = this.world.getRigidBody(b.body).translation();
            for (const [x, y] of b.cells) {
                // Each cell as a circle: is it in front of the ball, within range, close to the line?
                const cx = c.x + x * b.scale - p.x, cy = c.y + y * b.scale - p.y;
                const along = cx * dx + cy * dy;
                if (along <= 0 || along > GRACE_RANGE) continue;
                const off = Math.abs(cx * dy - cy * dx);
                if (off < 0.5 * b.scale + 0.2) return true;
            }
        }
        return false;
    }

    scored(ball) {
        if (!ball || ball.age >= BALL_LIFE) return;   // past its life, hits no longer keep it going
        ball.grace = 0;
        ball.idle = 0;
    }

    updateBalls() {
        const { world, s } = this;
        for (let i = s.balls.length - 1; i >= 0; i--) {
            const ball = s.balls[i];
            const body = world.getRigidBody(ball.body);
            const p = body.translation();
            if (p.y < -H - 1) {                  // shouldn't happen with the floor, but just in case
                this.events.push({ t: 'out', ball: ball.body, x: p.x, y: p.y });
                this.removeBall(ball.body);
                continue;
            }
            ball.age += 1;
            ball.idle += 1;
            // Grace: a ball about to time out that's heading straight at a block nearby gets
            // a little longer to get there (never more than GRACE_MAX in a row).
            if (ball.idle > idleLimit(ball) && (ball.grace ?? 0) < GRACE_MAX && this.headingAtBlock(p, body.linvel())) {
                ball.grace = (ball.grace ?? 0) + 1;
                continue;
            }
            if (ball.idle > idleLimit(ball)) {
                this.events.push({ t: 'out', ball: ball.body, x: p.x, y: p.y, faded: true });
                this.removeBall(ball.body);
                continue;
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
