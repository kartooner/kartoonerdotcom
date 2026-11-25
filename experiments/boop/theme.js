// Boop: colours. Light and dark palettes, and the fixed colours of props.
(globalThis.boopBuilds = globalThis.boopBuilds || []).push('1.5-31');   // build stamp: game.js checks every file matches

// Light and dark palettes. "line" is for marks drawn on the field (launcher,
// guide, pickups); "edge" is the outline on blocks, props and balls.
export const THEMES = {
    light: {
        paper: 0xf1e8d2, field: 0xfbf6ea, line: 0x2b2622, edge: 0x2b2622, ball: 0xfffdf7, guideEnd: 0xa59d92,
        hit: 0xd2492a, text: '#2b2622', jelloText: '#2b2622',
    },
    dark: {
        paper: 0x15120f, field: 0x221e1a, line: 0xede4d3, edge: 0x0f0c0a, ball: 0xf6efe2, guideEnd: 0x6f685f,
        hit: 0xff9466, text: '#ede4d3', jelloText: '#f6efe2',
    },
};
export const COLORS = { mushroom: 0xe06b4a, stem: 0xf3e3c3, windmill: 0xf2c14e, vine: 0x4f9a45, leaf: 0x7cc35a };
