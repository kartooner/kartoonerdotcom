// Boop: physics and game rules. No rendering in here.
// The aim preview clones this whole sim and runs it forward, so the guide line
// uses the exact same code and numbers as the real shot.

export const W = 9;                 // field width in cells
export const H = 16;                // field height in cells (y runs 0 → -H)
export const LAUNCHER = { x: W - 0.62, y: -0.62 };
export const DT = 1 / 120;
export const BALL_R = 0.17;
export const BALL_SPEED = 20;
export const RISE = 0.5;            // how far blocks climb after each turn
export const LOSE_Y = -1.5;         // a block top above this line ends the run
export const START_BALLS = 5;

const GRAVITY = -15;
const SHOT_GAP = 8;                 // steps between balls in a volley
const HIT_COOLDOWN = 10;            // steps before the same ball can hit the same block again
const MIN_HIT_SPEED = 1.5;          // resting balls don't grind blocks down
const STUCK_SPEED = 1.2;
const STUCK_STEPS = 60;
const HEAVY_AFTER = 480;            // after 4s a ball slowly gets heavier so turns end
const BLOCK_DENSITY = 5;
const ZONE_TOP_ROW = 7;
const ZONE_ROWS = 9;

// Springs that hold each block near its spot. Values are per unit of mass,
// so heavy and light blocks wobble at the same rate.
const SPRING_K = 190, SPRING_C = 9.5;
const TWIST_K = 130, TWIST_C = 7;

const G = { BALL: 1, BLOCK: 2, WALL: 4, PICKUP: 8 };
const groups = (member, filter) => ((member & 0xffff) << 16) | (filter & 0xffff);

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
            step: 0, rng: seed | 0, nextId: 1, depth: 0, ballCount: START_BALLS,
            blocks: {}, pickups: {}, owner: {}, balls: [], shots: null, cool: {},
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

    buildWalls() {
        const { R, world, s } = this;
        const body = world.createRigidBody(R.RigidBodyDesc.fixed());
        const wall = (hx, hy, x, y, side) => {
            const c = world.createCollider(
                R.ColliderDesc.cuboid(hx, hy).setTranslation(x, y)
                    .setRestitution(0.9).setFriction(0.2)
                    .setCollisionGroups(groups(G.WALL, G.BALL)), body);
            s.owner[c.handle] = { t: 'wall', side };
        };
        wall(0.5, H / 2 + 2, -0.5, -H / 2, 'left');
        wall(0.5, H / 2 + 2, W + 0.5, -H / 2, 'right');
        wall(W / 2 + 1, 0.5, W / 2, 0.5, 'top');
    }

    // ---------- blocks ----------

    addBlock(cells, hp) {
        const { R, world, s } = this;
        const n = cells.length;
        const cx = cells.reduce((a, [c]) => a + c + 0.5, 0) / n;
        const cy = cells.reduce((a, [, r]) => a - (r + 0.5), 0) / n;
        const body = world.createRigidBody(
            R.RigidBodyDesc.dynamic().setTranslation(cx, cy).setGravityScale(0)
                .setLinearDamping(0.4).setAngularDamping(0.6));
        const id = s.nextId++;
        const b = {
            id, body: body.handle, hp, hp0: hp, scale: 1, cols: [],
            cells: cells.map(([c, r]) => [c + 0.5 - cx, -(r + 0.5) - cy]),
            anchor: [cx, cy],
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
            const c = world.createCollider(
                R.ColliderDesc.cuboid(0.5 * k, 0.5 * k).setTranslation(x * k, y * k)
                    .setDensity(BLOCK_DENSITY).setRestitution(0.9).setFriction(0.5)
                    .setCollisionGroups(groups(G.BLOCK, G.BALL)), body);
            s.owner[c.handle] = { t: 'block', id: b.id };
            return c.handle;
        });
    }

    hitBlock(id) {
        const { world, s } = this;
        const b = s.blocks[id];
        if (!b) return;
        b.hp -= 1;
        const p = world.getRigidBody(b.body).translation();
        if (b.hp <= 0) {
            world.removeRigidBody(world.getRigidBody(b.body));
            for (const h of b.cols) delete s.owner[h];
            delete s.blocks[id];
            this.events.push({ t: 'pop', id, x: p.x, y: p.y });
        } else {
            this.shapeBlock(b);
            this.events.push({ t: 'hit', id, x: p.x, y: p.y });
        }
    }

    applySprings() {
        const { world, s } = this;
        for (const id in s.blocks) {
            const b = s.blocks[id];
            const body = world.getRigidBody(b.body);
            if (body.isSleeping()) continue;
            const p = body.translation(), v = body.linvel();
            const a = body.rotation(), w = body.angvel();
            const m = body.mass(), I = body.principalInertia();
            body.applyImpulse({
                x: m * DT * (-SPRING_K * (p.x - b.anchor[0]) - SPRING_C * v.x),
                y: m * DT * (-SPRING_K * (p.y - b.anchor[1]) - SPRING_C * v.y),
            }, false);
            body.applyTorqueImpulse(I * DT * (-TWIST_K * a - TWIST_C * w), false);
        }
    }

    // Move every block's spot up; the springs drag the blocks along.
    raise(dy) {
        const { world, s } = this;
        for (const id in s.blocks) {
            s.blocks[id].anchor[1] += dy;
            world.getRigidBody(s.blocks[id].body).wakeUp();
        }
        for (const id in s.pickups) {
            const pk = s.pickups[id];
            pk.y += dy;
            world.getRigidBody(pk.body).setTranslation({ x: pk.x, y: pk.y }, false);
        }
    }

    settled() {
        const { world, s } = this;
        for (const id in s.blocks) {
            const body = world.getRigidBody(s.blocks[id].body);
            const v = body.linvel(), p = body.translation(), b = s.blocks[id];
            if (Math.abs(v.x) + Math.abs(v.y) > 0.03 || Math.abs(body.angvel()) > 0.03) return false;
            if (Math.abs(p.y - b.anchor[1]) > 0.02) return false;
        }
        return true;
    }

    // Top edge of the highest block, using its spot (not its wobble).
    highestTop() {
        let top = -Infinity;
        for (const id in this.s.blocks) {
            const b = this.s.blocks[id];
            for (const [, y] of b.cells) top = Math.max(top, b.anchor[1] + (y + 0.5) * b.scale);
        }
        return top;
    }

    blockCount() {
        return Object.keys(this.s.blocks).length;
    }

    // ---------- zones ----------

    genZone() {
        const s = this.s;
        s.depth += 1;
        if (s.depth > 1) s.ballCount += 1;
        const d = s.depth;
        const grid = Array.from({ length: ZONE_ROWS }, () => new Array(W).fill(false));
        const base = 2 + d * 2.2 + s.ballCount * 0.9;
        let filled = 0;
        const target = Math.round(W * ZONE_ROWS * (0.46 + Math.min(0.14, d * 0.015)));

        for (let tries = 0; tries < 600 && filled < target; tries++) {
            let pick = this.rand() * SHAPE_TOTAL, shape = SHAPES[0];
            for (const sh of SHAPES) { if ((pick -= sh.w) <= 0) { shape = sh; break; } }
            const col = Math.floor(this.rand() * W), row = Math.floor(this.rand() * ZONE_ROWS);
            const cells = shape.c.map(([c, r]) => [col + c, row + r]);
            if (!cells.every(([c, r]) => c < W && r < ZONE_ROWS && !grid[r][c])) continue;
            cells.forEach(([c, r]) => { grid[r][c] = true; });
            filled += cells.length;
            let hp = base * (0.35 + this.rand() * 1.15) * Math.sqrt(cells.length);
            if (this.rand() < 0.08) hp *= 2.4;          // the odd tough one
            this.addBlock(cells.map(([c, r]) => [c, r + ZONE_TOP_ROW]), Math.max(1, Math.round(hp)));
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
        s.ballCount += 1;
        this.events.push({ t: 'pickup', id, x: pk.x, y: pk.y });
    }

    // ---------- balls ----------

    fire(angle, count = this.s.ballCount) {
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
                .setCollisionGroups(groups(G.BALL, G.BALL | G.BLOCK | G.WALL | G.PICKUP))
                .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS), body);
        s.owner[c.handle] = { t: 'ball', body: body.handle };
        s.balls.push({ body: body.handle, col: c.handle, still: 0, age: 0 });
    }

    turnDone() {
        return (!this.s.shots || this.s.shots.left === 0) && this.s.balls.length === 0;
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
        world.step(this.queue);
        s.step += 1;

        const contacts = [];
        this.queue.drainCollisionEvents((h1, h2, started) => { if (started) contacts.push([h1, h2]); });
        for (const [h1, h2] of contacts) this.onContact(h1, h2);
        this.updateBalls();

        if (s.step % 240 === 0) {
            for (const k in s.cool) if (s.cool[k] < s.step) delete s.cool[k];
        }
    }

    onContact(h1, h2) {
        const { world, s } = this;
        let a = s.owner[h1], b = s.owner[h2];
        if (!a || !b) return;
        if (b.t === 'ball') [a, b] = [b, a];
        if (a.t !== 'ball') return;
        const body = world.getRigidBody(a.body);
        if (!body) return;
        const p = body.translation();
        if (b.t === 'ball') { this.events.push({ t: 'clack', x: p.x, y: p.y }); return; }
        if (b.t === 'pickup') { this.collectPickup(b.id); return; }
        this.events.push({ t: 'contact', ball: a.body, x: p.x, y: p.y, with: b.t });
        if (b.t === 'block') {
            const v = body.linvel();
            if (Math.hypot(v.x, v.y) < MIN_HIT_SPEED) return;
            const key = a.body + ':' + b.id;
            if ((s.cool[key] ?? -1) > s.step) return;
            s.cool[key] = s.step + HIT_COOLDOWN;
            this.hitBlock(b.id);
        }
    }

    updateBalls() {
        const { world, s } = this;
        for (let i = s.balls.length - 1; i >= 0; i--) {
            const ball = s.balls[i];
            const body = world.getRigidBody(ball.body);
            const p = body.translation();
            if (p.y < -H - 1) {
                world.removeRigidBody(body);
                delete s.owner[ball.col];
                s.balls.splice(i, 1);
                this.events.push({ t: 'out', ball: ball.body });
                continue;
            }
            ball.age += 1;
            if (ball.age > HEAVY_AFTER && ball.age % 30 === 0) {
                body.setGravityScale(1 + (ball.age - HEAVY_AFTER) / 240, false);
            }
            const v = body.linvel();
            ball.still = Math.hypot(v.x, v.y) < STUCK_SPEED ? ball.still + 1 : 0;
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
export function predict(sim, angle, maxContacts = 3, maxSteps = 600) {
    const p = sim.clone();
    p.fire(angle, 1);
    const path = [[LAUNCHER.x, LAUNCHER.y]];
    const contacts = [];
    for (let i = 0; i < maxSteps; i++) {
        p.step();
        const ball = p.s.balls[0];
        if (!ball) break;
        const t = p.world.getRigidBody(ball.body).translation();
        path.push([t.x, t.y]);
        for (const e of p.events) if (e.t === 'contact') contacts.push([e.x, e.y]);
        p.events.length = 0;
        if (contacts.length >= maxContacts) break;
    }
    p.free();
    return { path, contacts };
}
