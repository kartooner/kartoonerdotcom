// Boop: physics and game rules. No rendering in here.
// The aim preview clones this whole sim and runs it forward, so the guide line
// uses the exact same code and numbers as the real shot.

export const W = 9;                 // field width in cells
export const H = 16;                // field height in cells (y runs 0 → -H)
export const LAUNCHER = { x: W - 0.62, y: -0.62 };
export const DT = 1 / 120;
export const BALL_R = 0.17;
export const BALL_SPEED = 20;
export const START_SUPPLY = 40;
export const START_VOLLEY = 5;
export const BASKET = { y: -H + 0.45, half: 0.8, wall: 0.07, depth: 0.42 };

const GRAVITY = -15;
const SHOT_GAP = 8;                 // steps between balls in a volley
const HIT_COOLDOWN = 10;            // steps before the same pair can hit again
const MIN_HIT_SPEED = 1.5;          // resting balls don't grind blocks down
const STUCK_SPEED = 1.2;
const STUCK_STEPS = 60;
const HEAVY_AFTER = 480;            // after 4s a ball slowly gets heavier so turns end
const BLOCK_DENSITY = 1.5;
const ZONE_TOP_ROW = 4;
const ZONE_ROWS = 10;               // rows 4–13; rows 14–15 are the basket lane
const BASKET_PERIOD = 600;          // steps for one trip across and back

// Springs that hold each block near its spot. Per unit of mass, so heavy and
// light blocks wobble at the same rate. Worn-down blocks get weaker springs.
const SPRING_K = 190, SPRING_C = 9.5;
const TWIST_K = 130, TWIST_C = 7;
const SNAP_DIST = 0.22;             // pushed this far off its spot, a block breaks loose
const SNAP_ANGLE = 0.35;
const LAND_STEPS = 60;              // a loose block still for this long settles where it is
const MAX_FALL_STEPS = 720;         // or after 6s loose, wherever it is (wedged, rocking)

// Jello: balls pass through, slowed hard while inside.
const JELLO_DRAG = 0.955;           // velocity kept per step inside jello
const JELLO_CHANCE = 0.1;

const G = { BALL: 1, BLOCK: 2, WALL: 4, PICKUP: 8, FALLING: 16, BASKET: 32, PROP: 64, JELLO: 128 };
const groups = (member, filter) => ((member & 0xffff) << 16) | (filter & 0xffff);
const BALL_FILTER = G.BALL | G.BLOCK | G.WALL | G.PICKUP | G.FALLING | G.BASKET | G.PROP | G.JELLO;

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
];
const SHAPE_TOTAL = SHAPES.reduce((n, s) => n + s.w, 0);

// Bigger numbers are bulkier. A block loses some mass as it's worn down, never more than ~18%.
export function blockScale(hp, hp0) {
    const bulk = 0.78 + 0.22 * Math.min(1, Math.log(hp0) / Math.log(60));
    return bulk * (0.82 + 0.18 * Math.max(0, hp) / hp0);
}

export function basketX(step) {
    const span = W / 2 - BASKET.half - 0.15;
    return W / 2 + span * Math.sin((step / BASKET_PERIOD) * Math.PI * 2);
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
            step: 0, rng: seed | 0, nextId: 1, depth: 0,
            supply: START_SUPPLY, volley: START_VOLLEY,
            blocks: {}, pickups: {}, props: {}, owner: {}, balls: [], shots: null, cool: {},
            basket: null,
        };
        const sim = new Sim(R, world, s);
        sim.buildWalls();
        sim.buildBasket();
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
                    .setCollisionGroups(groups(G.WALL, G.BALL | G.FALLING)), body);
            s.owner[c.handle] = { t: 'wall' };
        };
        wall(0.5, H / 2 + 2, -0.5, -H / 2);
        wall(0.5, H / 2 + 2, W + 0.5, -H / 2);
        wall(W / 2 + 1, 0.5, W / 2, 0.5);
    }

    // A U-shaped basket sliding along the bottom. Balls that drop in come back.
    buildBasket() {
        const { R, world, s } = this;
        const { y, half, wall, depth } = BASKET;
        const body = world.createRigidBody(
            R.RigidBodyDesc.kinematicPositionBased().setTranslation(basketX(0), y));
        const solid = (hx, hy, x, yy) => {
            const c = world.createCollider(
                R.ColliderDesc.cuboid(hx, hy).setTranslation(x, yy)
                    .setRestitution(0.4).setFriction(0.6)
                    .setCollisionGroups(groups(G.BASKET, G.BALL)), body);
            s.owner[c.handle] = { t: 'basket' };
        };
        solid(half, wall, 0, -depth / 2);
        solid(wall, depth / 2, -half + wall, 0);
        solid(wall, depth / 2, half - wall, 0);
        const inside = world.createCollider(
            R.ColliderDesc.cuboid(half - wall * 2 - 0.02, depth / 2 - wall).setTranslation(0, wall / 2)
                .setSensor(true).setCollisionGroups(groups(G.BASKET, G.BALL))
                .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS), body);
        s.owner[inside.handle] = { t: 'catch' };
        s.basket = { body: body.handle };
    }

    // ---------- blocks ----------

    addBlock(cells, hp, jello = false) {
        const { R, world, s } = this;
        const n = cells.length;
        const cx = cells.reduce((a, [c]) => a + c + 0.5, 0) / n;
        const cy = cells.reduce((a, [, r]) => a - (r + 0.5), 0) / n;
        const desc = jello
            ? R.RigidBodyDesc.fixed().setTranslation(cx, cy)
            : R.RigidBodyDesc.dynamic().setTranslation(cx, cy).setGravityScale(0)
                .setLinearDamping(0.4).setAngularDamping(0.6);
        const body = world.createRigidBody(desc);
        const id = s.nextId++;
        const b = {
            id, body: body.handle, hp, hp0: hp, scale: 1, cols: [], jello, falling: false, rest: 0,
            cells: cells.map(([c, r]) => [c + 0.5 - cx, -(r + 0.5) - cy]),
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
        const k = blockScale(b.hp, b.hp0);
        b.scale = k;
        b.cols = b.cells.map(([x, y]) => {
            let d = R.ColliderDesc.cuboid(0.5 * k, 0.5 * k).setTranslation(x * k, y * k);
            if (b.jello) {
                d = d.setSensor(true).setCollisionGroups(groups(G.JELLO, G.BALL))
                    .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS);
            } else if (b.falling) {
                d = d.setDensity(BLOCK_DENSITY).setRestitution(0.3).setFriction(0.6)
                    .setCollisionGroups(groups(G.FALLING, G.BALL | G.BLOCK | G.FALLING | G.WALL | G.PROP))
                    .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS);
            } else {
                d = d.setDensity(BLOCK_DENSITY).setRestitution(0.9).setFriction(0.5)
                    .setCollisionGroups(groups(G.BLOCK, G.BALL | G.FALLING));
            }
            const c = world.createCollider(d, body);
            s.owner[c.handle] = { t: 'block', id: b.id };
            return c.handle;
        });
    }

    removeBlock(b, popped) {
        const { world, s } = this;
        const p = world.getRigidBody(b.body).translation();
        world.removeRigidBody(world.getRigidBody(b.body));
        for (const h of b.cols) delete s.owner[h];
        delete s.blocks[b.id];
        if (b.jello) for (const ball of s.balls) ball.jello = ball.jello.filter((j) => j !== b.id);
        this.events.push({ t: 'pop', id: b.id, x: p.x, y: p.y, jello: b.jello });
        if (popped) this.gain(b.hp0 >= 20 ? 2 : 1, p.x, p.y);
    }

    damageBlock(id, n = 1) {
        const b = this.s.blocks[id];
        if (!b) return;
        b.hp -= n;
        if (b.hp <= 0) { this.removeBlock(b, true); return; }
        this.shapeBlock(b);
        const p = this.world.getRigidBody(b.body).translation();
        this.events.push({ t: 'hit', id, x: p.x, y: p.y });
    }

    // Spring breaks: the block drops, tumbles and smashes what it lands on.
    snap(b) {
        const body = this.world.getRigidBody(b.body);
        b.falling = true;
        b.rest = 0;
        b.fallAge = 0;
        body.setGravityScale(1, true);
        body.setLinearDamping(0.05);
        body.setAngularDamping(0.1);
        this.shapeBlock(b);
        const p = body.translation();
        this.events.push({ t: 'snap', id: b.id, x: p.x, y: p.y });
    }

    // A loose block that has stopped moving settles where it is.
    land(b) {
        const body = this.world.getRigidBody(b.body);
        const p = body.translation();
        b.falling = false;
        b.anchor = [p.x, p.y];
        b.anchorA = body.rotation();
        body.setGravityScale(0, true);
        body.setLinearDamping(0.4);
        body.setAngularDamping(0.6);
        this.shapeBlock(b);
    }

    applySprings() {
        const { world, s } = this;
        for (const id in s.blocks) {
            const b = s.blocks[id];
            if (b.jello || b.falling) continue;
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
            if (b.jello) continue;
            const body = world.getRigidBody(b.body);
            const p = body.translation();
            if (b.falling) {
                if (p.y < -H - 2) { this.removeBlock(b, true); continue; }
                const v = body.linvel();
                b.rest = Math.hypot(v.x, v.y) < 0.3 && Math.abs(body.angvel()) < 0.3 ? b.rest + 1 : 0;
                b.fallAge += 1;
                if (b.rest > LAND_STEPS || b.fallAge > MAX_FALL_STEPS) this.land(b);
            } else {
                const off = Math.hypot(p.x - b.anchor[0], p.y - b.anchor[1]);
                if (off > SNAP_DIST || Math.abs(body.rotation() - b.anchorA) > SNAP_ANGLE) this.snap(b);
            }
        }
    }

    settled() {
        const { world, s } = this;
        for (const id in s.blocks) {
            const b = s.blocks[id];
            if (b.jello) continue;
            const body = world.getRigidBody(b.body);
            const v = body.linvel();
            if (Math.abs(v.x) + Math.abs(v.y) > 0.03 || Math.abs(body.angvel()) > 0.03) return false;
        }
        return true;
    }

    blockCount() {
        return Object.keys(this.s.blocks).length;
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
    }

    genZone() {
        const s = this.s;
        this.clearZoneLeftovers();
        s.depth += 1;
        if (s.depth > 1) s.volley += 1;
        const d = s.depth;
        const grid = Array.from({ length: ZONE_ROWS }, () => new Array(W).fill(false));
        const free = (c, r) => c >= 0 && c < W && r >= 0 && r < ZONE_ROWS && !grid[r][c];

        // Props first, so blocks fill in around them.
        const nProps = d === 1 ? 1 : 1 + Math.floor(this.rand() * 2);
        for (let i = 0, tries = 0; i < nProps && tries < 50; tries++) {
            const windmill = this.rand() < 0.5;
            const c = Math.floor(this.rand() * (W - 1)), r = Math.floor(this.rand() * (ZONE_ROWS - 1));
            const cells = windmill ? [[c, r], [c + 1, r], [c, r + 1], [c + 1, r + 1]] : [[c, r]];
            if (!cells.every(([cc, rr]) => free(cc, rr))) continue;
            cells.forEach(([cc, rr]) => { grid[rr][cc] = true; });
            if (windmill) this.addWindmill(c + 1, -(r + 1 + ZONE_TOP_ROW));
            else this.addMushroom(c + 0.5, -(r + 1 + ZONE_TOP_ROW));
            i++;
        }

        const base = 1 + d * 1.6 + s.volley * 0.5;
        let filled = 0;
        const target = Math.round(W * ZONE_ROWS * (0.4 + Math.min(0.14, d * 0.015)));
        for (let tries = 0; tries < 600 && filled < target; tries++) {
            let pick = this.rand() * SHAPE_TOTAL, shape = SHAPES[0];
            for (const sh of SHAPES) { if ((pick -= sh.w) <= 0) { shape = sh; break; } }
            const col = Math.floor(this.rand() * W), row = Math.floor(this.rand() * ZONE_ROWS);
            const cells = shape.c.map(([c, r]) => [col + c, row + r]);
            if (!cells.every(([c, r]) => free(c, r))) continue;
            cells.forEach(([c, r]) => { grid[r][c] = true; });
            filled += cells.length;
            const jello = this.rand() < JELLO_CHANCE;
            let hp = base * (0.35 + this.rand() * 1.15) * Math.sqrt(cells.length);
            if (jello) hp *= 0.35;
            else if (this.rand() < 0.08) hp *= 2.4;      // the odd tough one
            this.addBlock(cells.map(([c, r]) => [c, r + ZONE_TOP_ROW]), Math.max(1, Math.round(hp)), jello);
        }

        // Two +1 ball pickups in open cells.
        const open = [];
        grid.forEach((row, r) => row.forEach((f, c) => { if (!f) open.push([c, r]); }));
        for (let i = 0; i < 2 && open.length; i++) {
            const [c, r] = open.splice(Math.floor(this.rand() * open.length), 1)[0];
            this.addPickup(c + 0.5, -(r + ZONE_TOP_ROW + 0.5));
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
                    .setCollisionGroups(groups(G.PROP, G.BALL | G.FALLING)), rotor);
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
                .setCollisionGroups(groups(G.PROP, G.BALL | G.FALLING)), body);
        const stem = world.createCollider(
            R.ColliderDesc.cuboid(0.14, capY / 2).setTranslation(0, capY / 2).setRestitution(0.5)
                .setCollisionGroups(groups(G.PROP, G.BALL | G.FALLING)), body);
        s.owner[cap.handle] = { t: 'prop', id };
        s.owner[stem.handle] = { t: 'prop', id };
        s.props[id] = { id, kind: 'mushroom', x, y: yBase, bodies: [body.handle], cols: [cap.handle, stem.handle], r, capY };
    }

    // ---------- balls ----------

    fire(angle, count = Math.min(this.s.supply, this.s.volley)) {
        this.s.shots = { left: count, angle, timer: 0 };
    }

    spawnBall(angle) {
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
        s.balls.push({ body: body.handle, col: c.handle, still: 0, age: 0, jello: [] });
        s.supply -= 1;
    }

    removeBall(handle) {
        const { world, s } = this;
        const i = s.balls.findIndex((b) => b.body === handle);
        if (i < 0) return;
        world.removeRigidBody(world.getRigidBody(handle));
        delete s.owner[s.balls[i].col];
        s.balls.splice(i, 1);
    }

    turnDone() {
        const s = this.s;
        if (s.shots && s.shots.left > 0) return false;
        if (s.balls.length) return false;
        for (const id in s.blocks) if (s.blocks[id].falling) return false;
        return true;
    }

    step() {
        const { world, s } = this;
        const shots = s.shots;
        if (shots && shots.left > 0) {
            if (shots.timer <= 0) {
                this.spawnBall(shots.angle);
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
            body.setLinvel({ x: v.x * JELLO_DRAG, y: v.y * JELLO_DRAG }, true);
            body.setAngvel(body.angvel() * JELLO_DRAG, true);
        }
        world.getRigidBody(s.basket.body).setNextKinematicTranslation({ x: basketX(s.step + 1), y: BASKET.y });
        world.step(this.queue);
        s.step += 1;

        const contacts = [];
        this.queue.drainCollisionEvents((h1, h2, started) => { contacts.push([h1, h2, started]); });
        for (const [h1, h2, started] of contacts) this.onContact(h1, h2, started);
        this.updateBalls();
        this.updateBlocks();

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

        // A loose block landing on another one.
        if (a.t === 'block' && b.t === 'block') {
            if (!started) return;
            const A = s.blocks[a.id], B = s.blocks[b.id];
            if (!A || !B) return;
            const [fall, other] = A.falling ? [A, B] : [B, A];
            if (!fall.falling) return;
            const va = world.getRigidBody(fall.body).linvel(), vb = world.getRigidBody(other.body).linvel();
            const speed = Math.hypot(va.x - vb.x, va.y - vb.y);
            if (speed < 2 || !this.cooled(fall.id + ':' + other.id)) return;
            this.damageBlock(other.id, Math.min(12, Math.round(speed * 1.2)));
            this.damageBlock(fall.id, 1);
            return;
        }
        if (a.t !== 'ball') return;
        const body = world.getRigidBody(a.body);
        if (!body) return;
        const ball = s.balls.find((x) => x.body === a.body);
        const p = body.translation();

        if (b.t === 'block' && s.blocks[b.id]?.jello) {
            if (!ball) return;
            if (started) {
                if (!ball.jello.includes(b.id)) ball.jello.push(b.id);
                if (this.cooled(a.body + ':' + b.id)) this.damageBlock(b.id);
            } else {
                ball.jello = ball.jello.filter((j) => j !== b.id);
            }
            return;
        }
        if (!started) return;
        if (b.t === 'ball') { this.events.push({ t: 'clack', x: p.x, y: p.y }); return; }
        if (b.t === 'pickup') { this.collectPickup(b.id); return; }
        if (b.t === 'catch') {
            this.removeBall(a.body);
            this.gain(1, p.x, p.y);
            this.events.push({ t: 'catch', x: p.x, y: p.y });
            return;
        }
        this.events.push({ t: 'contact', ball: a.body, x: p.x, y: p.y, with: b.t });
        if (b.t === 'block') {
            const v = body.linvel();
            if (Math.hypot(v.x, v.y) < MIN_HIT_SPEED) return;
            if (this.cooled(a.body + ':' + b.id)) this.damageBlock(b.id);
        }
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
            if (ball.age > HEAVY_AFTER && ball.age % 30 === 0) {
                body.setGravityScale(1 + (ball.age - HEAVY_AFTER) / 240, false);
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
        }
    }
}

// Run one ball forward in a copy of the world and return its path.
// Each contact carries the surface normal, worked out from how the ball's
// direction changed across the bounce.
export function predict(sim, angle, maxContacts = 3, maxSteps = 600) {
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
