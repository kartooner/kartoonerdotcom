// Boop: how a ball is drawn. Squash and stretch are visual only.
import * as THREE from 'three';
import { BALL_R, BALL_SPEED } from './sim.js';
(globalThis.boopBuilds = globalThis.boopBuilds || []).push('1.5-48');   // build stamp: game.js checks every file matches

const unitCircle = new THREE.CircleGeometry(1, 32);
unitCircle.userData.keep = true;   // shared by every ball

// Balls squash and stretch on screen only. The physics ball stays a circle,
// so bounces stay predictable and the aim guide stays exact.
const STRETCH_MAX = 0.75;       // extra length at full launch speed (a torpedo)
const STRETCH_FROM = 3;         // below this speed a ball stays round
const SQUASH_TIME = 0.22;

export function makeBallView(outlineMat, ballMat) {
    const group = new THREE.Group();          // squash, turned to the bounce normal
    const inner = new THREE.Group();          // stretch, turned to the direction of travel
    const o = new THREE.Mesh(unitCircle, outlineMat); o.scale.setScalar(BALL_R);
    const f = new THREE.Mesh(unitCircle, ballMat); f.scale.setScalar(BALL_R - 0.045); f.position.z = 0.01;
    inner.add(o, f);
    group.add(inner);
    return { group, inner, fill: f, prev: { x: 0, y: 0 }, squashT: Infinity, normal: 0 };
}

export function shapeBall(v, vel, frameDt) {
    v.squashT += frameDt;
    // Squash: flatten hard against the surface, then wobble back to round.
    let squash = 0;
    if (v.squashT < SQUASH_TIME) {
        const t = v.squashT;
        squash = Math.exp(-t * 18) * Math.cos(t * 45) * 0.42;
    }
    // Stretch along travel, eased off while squashed. Longer also gets a little thinner.
    const speed = Math.hypot(vel.x, vel.y);
    const k = Math.min(1, Math.max(0, (speed - STRETCH_FROM) / (BALL_SPEED - STRETCH_FROM)));
    const stretch = 1 + STRETCH_MAX * k * k * (1 - Math.min(1, Math.abs(squash) * 2.4));
    const travel = Math.atan2(vel.y, vel.x);

    v.group.rotation.z = v.normal;
    v.group.scale.set(1 - squash, 1 / (1 - squash), 1);
    v.inner.rotation.z = travel - v.normal;
    v.inner.scale.set(stretch, 1 / Math.sqrt(stretch), 1);
}
