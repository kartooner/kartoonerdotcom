// Boop: seasons. Around some holidays the game dresses up: block colours, the paper, the
// crumbs a popped block leaves, the vines, and a hat for Boop. The rules never change.
// Which season it is comes from the date on the player's device: a tiny script at the top
// of index.html sets data-season (and data-greeting) before anything is drawn, so the page
// never flashes the wrong colours. ?season=fall (or none) in the address forces one, for testing.
(globalThis.boopBuilds = globalThis.boopBuilds || []).push('1.3.1-2');   // build stamp: game.js checks every file matches

const root = document.documentElement;
export const season = root.dataset.season || null;
export const seasonGreeting = root.dataset.greeting || null;

// Fall (Nov 1 to the Sunday after Thanksgiving): warm paper, harvest colours.
// Block colours still climb with the number, light to dark, each with its own pattern.
const FALL = {
    tiers: [0xcfc46e, 0xe8bf5a, 0xa9b56c, 0xf2a650, 0xe2803f, 0xc95b3e, 0xb9727a, 0x7b4a37],
    jello: 0xe7a0a8,                         // cranberry jelly
    colors: { leaf: 0xe28a35, vine: 0x7f8b3a, windmill: 0xe8b04a, mushroom: 0xc9572f },
    light: { paper: 0xf0e1c4, field: 0xfbf1de },
    dark: { paper: 0x1a1410, field: 0x281e17 },
    crumbs: [0xe2803f, 0xc95b3e, 0xe8bf5a, 0x9a5a2e],   // falling leaves
};

export function applySeason({ THEMES, TIERS, JELLO, COLORS }) {
    if (season !== 'fall') return null;
    FALL.tiers.forEach((fill, i) => { if (TIERS[i]) TIERS[i].fill = fill; });
    JELLO.fill = FALL.jello;
    Object.assign(COLORS, FALL.colors);
    Object.assign(THEMES.light, FALL.light);
    Object.assign(THEMES.dark, FALL.dark);
    dressBuddies();
    return { crumbs: FALL.crumbs, leaves: true };
}

// A little knit hat for fall: a rust band, a pumpkin-coloured top and a mustard pompom.
// (Christmas gets a Santa hat.) It sits square on his head, the band as wide as he is.
const HATS = {
    fall: `<g class="hat" filter="url(#sketchy)" transform="translate(0 -3.5)">
<path d="M7.5 11.5C7.5 -1.5 40.5 -1.5 40.5 11.5z" fill="#e2803f" stroke="#2b2622" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M17 2.5q1.2 4 1 8.5M24 0.8v10.4M31 2.5q-1.2 4-1 8.5" fill="none" stroke="#c95b3e" stroke-width="1.6" stroke-linecap="round"/>
<rect x="5" y="9.5" width="38" height="6.5" rx="2.2" fill="#c95b3e" stroke="#2b2622" stroke-width="2.2"/>
<path d="M10 10.5v4.5M15.5 10.5v4.5M21 10.5v4.5M26.5 10.5v4.5M32 10.5v4.5M37.5 10.5v4.5" stroke="#9a4a2e" stroke-width="1.2" stroke-linecap="round"/>
<circle cx="24" cy="-2.5" r="4.2" fill="#e8bf5a" stroke="#2b2622" stroke-width="2.2"/>
</g>`,
};
function dressBuddies() {
    const hat = HATS[season];
    if (!hat) return;
    for (const face of document.querySelectorAll('.buddy-face .wiggle > g')) {
        if (!face.querySelector('.hat')) face.insertAdjacentHTML('beforeend', hat);
    }
}
