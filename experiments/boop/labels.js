// Boop: numbers and short text drawn onto little canvas textures (block numbers, +1, floaters).
import * as THREE from 'three';
(globalThis.boopBuilds = globalThis.boopBuilds || []).push('1.3.2-2');   // build stamp: game.js checks every file matches

const unitSquare = new THREE.PlaneGeometry(1, 1);
unitSquare.userData.keep = true;   // shared by every label

// style 'number' (block numbers): Manrope at 128px. style 'hand' (+1 rings and floaters):
// the Cartridge Rough logo font at 256px, so it stays smooth and matches the drawn look.
export function makeLabel(text, color, style = 'number') {
    const c = document.createElement('canvas');
    c.width = c.height = style === 'hand' ? 256 : 128;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    // depthWrite off: the label's see-through square must never hide what's behind it (a ring, jelly).
    const m = new THREE.Mesh(unitSquare, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.renderOrder = 3;
    m.userData = { c, tex, color, style };
    drawLabel(m, text);
    return m;
}
export function drawLabel(m, text) {
    const { c, tex, color, style } = m.userData;
    const g = c.getContext('2d');
    const n = c.width, k = n / 128;
    g.clearRect(0, 0, n, n);
    const size = (text.length >= 3 ? 52 : text.length === 2 ? 66 : 78) * k;
    g.font = style === 'hand'
        ? `${size * 1.1}px 'Cartridge Rough', Manrope, system-ui, sans-serif`
        : `800 ${size}px Manrope, system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = color;
    g.fillText(text, n / 2, n / 2 + 4 * k);
    tex.needsUpdate = true;
}
