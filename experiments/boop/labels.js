// Boop: numbers and short text drawn onto little canvas textures (block numbers, +1, floaters).
import * as THREE from 'three';

const unitSquare = new THREE.PlaneGeometry(1, 1);

export function makeLabel(text, color) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    // depthWrite off: the label's see-through square must never hide what's behind it (a ring, jelly).
    const m = new THREE.Mesh(unitSquare, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.renderOrder = 3;
    m.userData = { c, tex, color };
    drawLabel(m, text);
    return m;
}
export function drawLabel(m, text) {
    const { c, tex, color } = m.userData;
    const g = c.getContext('2d');
    g.clearRect(0, 0, 128, 128);
    const size = text.length >= 3 ? 52 : text.length === 2 ? 66 : 78;
    g.font = `800 ${size}px Manrope, system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = color;
    g.fillText(text, 64, 68);
    tex.needsUpdate = true;
}
