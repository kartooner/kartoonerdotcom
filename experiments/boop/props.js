// How the props look: bombs, windmills, mushrooms, vines, and the bonus stages' pieces.
// buildPropView has one branch per kind, so a new prop (for a new biome, say) is one more
// branch here plus its physics in sim.js.
import * as THREE from 'three';
import { W, H } from './sim.js';
import { makeBlockMesh, makeHillMesh, makeNetMesh, NEUTRAL } from './blockshader.js';
import { makeSketch, SHAPE } from './sketch.js';
import { COLORS } from './theme.js';
(globalThis.boopBuilds = globalThis.boopBuilds || []).push('1.5-58');   // build stamp: game.js checks every file matches

const mat = (color, opts = {}) => new THREE.MeshBasicMaterial({ color, ...opts });

// ctx: what the props need from the game, read live: theme (the current palette), themeName(),
// makeLabel, outlineMat, crumbs, leafPiles and seasonLook.
export function makeProps(ctx) {
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
        if (ctx.seasonLook?.lights) {
            const bulb = makeSketch({ kind: SHAPE.CIRCLE, size: [0.085], edge: 0.035, wob: 0.3,
                fill: ctx.seasonLook.lights[seed % ctx.seasonLook.lights.length], seed: seed + 9, margin: 0.06 });
            bulb.position.set(-0.1 * side, -0.12, 0.03);
            bulb.renderOrder = 2;
            g.add(bulb);
        }
        parent.add(g);
        return g;
    }

    // Bomb colours per theme: in the dark the body is lifted a little so it stands off the field.
    const BOMB_LOOK = {
        light: { body: 0x24222b, shade: 0x0b0a0e, cap: 0x5d5668, fuse: 0xa9a59e },
        dark: { body: 0x4a4554, shade: 0x2c2933, cap: 0x7a7386, fuse: 0xc9c4ba },
    };
    const GOLF_WATER = { light: 0x9ccfe4, dark: 0x2e5a70 };     // the golf stage's water
    // A notched flag (a swallowtail), filled orange with an ink outline, its top-left corner at (x, y).
    function notchedFlag(x, y) {
        const w = 0.56, h = 0.34, notch = 0.16;
        const shape = new THREE.Shape();
        shape.moveTo(0, 0); shape.lineTo(w, -0.02); shape.lineTo(w - notch, -h / 2); shape.lineTo(w, -h + 0.02); shape.lineTo(0, -h); shape.closePath();
        const g = new THREE.Group();
        const fill = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: COLORS.mushroom, transparent: true, depthWrite: false }));
        const edge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(shape.getPoints()), ctx.outlineMat);
        fill.renderOrder = 2; edge.renderOrder = 3;
        g.add(fill, edge);
        g.position.set(x, y, 0.06);
        return g;
    }
    const GOLF_ISLAND = { light: 0x6fae6a, dark: 0x67a663 };    // the hill (its zigzag is drawn a shade darker); bright in the dark too, like the blocks
    const GOLF_HOLE_C = { light: 0x2b2622, dark: 0x120f0d };     // ...and its hole
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
    // A bomb's fuse: one curved crayon line out of its cap.
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
        const look = BOMB_LOOK[ctx.themeName()];
        // The body is drawn by the block shader (one cell rounded into a circle), so its rough
        // crayon edge and ink outline match the blocks exactly. Plain fill, no pattern.
        const body = makeBlockMesh([[0, 0]], false, (id * 7.31) % 50, 0.5);
        const bu = body.material.uniforms;
        bu.uK.value = 0.74; bu.uNeutral.value = 1;
        bu.uFill.value.setHex(look.body); bu.uInk.value.setHex(ctx.theme.edge);
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

    // A bomb's life on screen (returns true while it's moving, so the board keeps drawing). Lit: the spark flares and spits, the bomb swells and shivers.
    // Just tapped: it jolts and the spark flares, then settles. Otherwise a gentle flicker.
    const sparkAt = new THREE.Vector3();
    function animateBomb(parts, lit, frameDt, holder) {
        let moving = false;
        const now = performance.now() / 1000;
        if (lit) {
            moving = true;
            parts.spark.scale.setScalar(1.7 + 0.5 * Math.sin(now * 55));
            const k = 1 + 0.07 * Math.sin(now * 40) + 0.08 * (1 - Math.min(lit, 60) / 60);
            parts.group.scale.set(k, k, 1);
            if (Math.random() < 0.25) {
                holder.updateMatrixWorld();
                parts.spark.getWorldPosition(sparkAt);
                ctx.crumbs.spray([[sparkAt.x, sparkAt.y]], [0xf4a640, 0xffe08a]);
            }
        } else if (parts.tapT != null && parts.tapT < 0.45) {
            moving = true;
            parts.tapT += frameDt;
            const t = parts.tapT, w = Math.sin(t * 45) * Math.exp(-t * 9) * 0.12;
            parts.group.scale.set(1 + w, 1 - w, 1);
            parts.spark.scale.setScalar(1 + 0.9 * Math.exp(-t * 7));
        } else {
            parts.group.scale.set(1, 1, 1);
            parts.spark.scale.setScalar(1 + 0.15 * Math.sin(now * 22));   // a gentle flicker whenever the board is drawn
        }
        return moving;
    }

    function buildPropView(pr) {
        const group = new THREE.Group();
        const v = { group };
        if (pr.kind === 'vine') {
            v.links = new Map();       // link body handle → its drawing (links and fallen bits alike)
            v.vine = true;
            return v;
        }
        if (pr.kind === 'golf') {
            // Mini golf: grey slabs for the ground and ledges, and a flag over the hole.
            v.greys = [];
            pr.rects.forEach(([x, y, hx, hy], i) => {
                const slab = makeSketch({ kind: SHAPE.BOX, size: [hx, hy], round: 0.06, edge: 0.05, wob: 0.35, fill: NEUTRAL[ctx.themeName()], seed: i * 3.7 + pr.id, margin: 0.1 });
                slab.position.set(x, y, 0);
                group.add(slab);
                v.greys.push(slab);
            });
            if (pr.water) {
                // The water the green stands in: a blue band along the floor, under everything else.
                v.water = makeSketch({ kind: SHAPE.BOX, size: [W / 2 - 0.06, pr.water / 2 - 0.04], round: 0.02, edge: 0.04, wob: 0.6, fill: GOLF_WATER[ctx.themeName()], seed: pr.id + 9, margin: 0.1 });
                v.water.position.set(W / 2, -H + pr.water / 2 + 0.02, 0.45);    // over a floating ball, so its lower half is under water
                v.water.material.uniforms.uAlpha.value = 0.72;
                group.add(v.water);
                ctx.leafPiles?.setWater(-H + pr.water - 0.03, [...pr.waterline, pr.hole[1], pr.hole[0], 0, 0]);     // leaves float on it, round the hill
            }
            if (pr.outline) {
                // The hill, drawn like a block: zigzag green, a crayon edge, the hole cut into its top.
                // Kept inside the board: it stops at the walls and the floor.
                const [hx, hy] = pr.hole;
                const hill = makeHillMesh(pr.outline, [hx, hy - 0.07, pr.holeW / 2 + 0.12, 0.16], {
                    x0: Math.max(0.06, pr.outline[0][0]), x1: Math.min(W - 0.06, pr.outline[pr.outline.length - 1][0]), bottom: -H + 0.06, top: hy + 0.25,
                    fill: GOLF_ISLAND[ctx.themeName()], ink: ctx.theme.edge, holeColor: GOLF_HOLE_C[ctx.themeName()], seed: pr.id * 1.3,
                });
                v.hill = hill;
                group.add(hill);
            }
            const [hx, hy] = pr.hole;
            // The flag stands in the hole: its pole starts at the back of the hole, and the flag is notched.
            const pole = makeSketch({ kind: SHAPE.BOX, size: [0.045, 0.78], round: 0.02, role: 'line', inkFill: true, wob: 0.4, seed: pr.id + 1, margin: 0.06 });
            pole.position.set(hx, hy + 0.71, 0.035);                  // standing in the hole: its foot just inside the rim
            group.add(pole, notchedFlag(hx + 0.02, hy + 1.42));
            return v;
        }
        if (pr.kind === 'hoop') {
            // Hoops: a crayon basket. An oval orange rim, seen a little from above, and a net hanging
            // from it, a funnel of crossed strokes. (The rim's ends are what the ball bounces off.)
            const half = pr.half;
            const net = makeNetMesh(half - 0.02, half * 0.55, 0.5, ctx.theme.line, pr.id * 0.7);     // the line colour: light on the dark board
            net.position.set(0, 0.1, 0.04);
            const rim = makeSketch({ kind: SHAPE.RING, size: [half], ring: 0.07, edge: 0.03, wob: 0.6, fill: COLORS.mushroom, seed: pr.id + 4, margin: 0.1 });
            rim.scale.set(1, 0.28, 1);
            rim.position.set(0, 0.1, 0.06);
            v.net = net;
            group.add(net, rim);
            const label = ctx.makeLabel('+2', ctx.theme.text, 'hand');
            label.userData.text = '+2';
            label.scale.setScalar(0.8);
            label.position.set(0, -0.72, 0.1);
            v.labels = [label];
            group.add(label);
            group.position.set(pr.x, pr.y, 0.05);
            v.body = pr.body;
            return v;
        }
        if (pr.kind === 'pachinko') {
            // The pachinko board: small ink nails, thin posts between the pockets, and what each pays.
            pr.pegs.forEach(([x, y], i) => {
                const peg = makeSketch({ kind: SHAPE.CIRCLE, size: [0.1], role: 'line', inkFill: true, wob: 0.3, seed: i * 1.7, margin: 0.06 });
                peg.position.set(x, y, 0);
                group.add(peg);
            });
            for (let i = 1; i < W; i++) {
                const post = makeSketch({ kind: SHAPE.BOX, size: [0.05, pr.postH], round: 0.03, role: 'line', inkFill: true, wob: 0.3, seed: i * 2.3, margin: 0.06 });
                post.position.set(i, -H + pr.postH, 0);
                group.add(post);
            }
            v.labels = [];
            pr.pockets.forEach((n, i) => {
                if (!n) return;
                const label = ctx.makeLabel(`+${n}`, ctx.theme.text, 'hand');
                label.userData.text = `+${n}`;
                label.scale.setScalar(1);
                label.position.set(i + 0.5, -H + 0.42, 0.1);
                group.add(label);
                v.labels.push(label);
            });
            return v;
        }
        if (pr.kind === 'bomb') {
            // A round cartoon bomb (see makeBombParts).
            const parts = makeBombParts(pr.id);
            group.add(parts.group);
            group.position.set(pr.x, pr.y, 0.05);
            v.bomb = parts;
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
        return v;
    }


    // Light or dark: recolour the shared bomb parts and everything on a prop that follows the theme.
    function setTheme(name) {
        fuseMat.color.setHex(BOMB_LOOK[name].fuse);
        shadeMat.color.setHex(BOMB_LOOK[name].shade);
    }
    function tintBomb(bomb, name) {
        const look = BOMB_LOOK[name];
        bomb.body.material.uniforms.uFill.value.setHex(look.body);
        bomb.body.material.uniforms.uInk.value.setHex(ctx.theme.edge);
        bomb.cap.material.uniforms.uFill.value.setHex(look.cap);
    }
    function retint(v, name) {
        if (v.bomb) tintBomb(v.bomb, name);
        for (const g of v.greys ?? []) g.material.uniforms.uFill.value.setHex(NEUTRAL[name]);
        v.water?.material.uniforms.uFill.value.setHex(GOLF_WATER[name]);
        v.net?.material.uniforms.uInk?.value.setHex(ctx.theme.line);
        if (v.hill) {
            const u = v.hill.material.uniforms;
            u.uFill.value.setHex(GOLF_ISLAND[name]); u.uInk.value.setHex(ctx.theme.edge); u.uHole.value.setHex(GOLF_HOLE_C[name]);
        }
        for (const l of v.labels ?? []) { l.userData.color = ctx.theme.text; ctx.drawLabel(l, l.userData.text); }
    }

    return { buildPropView, buildVineLink, makeBombParts, animateBomb, setTheme, tintBomb, retint, GOLF_WATER };
}
