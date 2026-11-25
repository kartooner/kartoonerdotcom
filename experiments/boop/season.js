// Boop: seasons. Around some holidays the game dresses up: block colours, the paper, the
// crumbs a popped block leaves, the vines, and a hat for Boop. The rules never change.
// Which season it is comes from the date on the player's device: a tiny script at the top
// of index.html sets data-season (and data-greeting) before anything is drawn, so the page
// never flashes the wrong colours. ?season=fall (or none) in the address forces one, for testing.
(globalThis.boopBuilds = globalThis.boopBuilds || []).push('1.5-35');   // build stamp: game.js checks every file matches

const root = document.documentElement;
export const season = root.dataset.season || null;
export const seasonGreeting = root.dataset.greeting || null;

// Block colours still climb with the number, light to dark, each with its own pattern.
// texts: the number's colour per tier, where the season's darker fills need a light one.
const SEASONS = {
    // Fall (Nov 1 to the Sunday after Thanksgiving): warm paper, harvest colours, leaves.
    fall: {
        tiers: [0xcfc46e, 0xe8bf5a, 0xa9b56c, 0xf2a650, 0xe2803f, 0xc95b3e, 0xb9727a, 0x7b4a37],
        jello: 0xe7a0a8,                         // cranberry jelly
        colors: { leaf: 0xe28a35, vine: 0x7f8b3a, windmill: 0xe8b04a, mushroom: 0xc9572f },
        light: { paper: 0xf0e1c4, field: 0xfbf1de },
        dark: { paper: 0x1a1410, field: 0x281e17 },
        crumbs: [0xe2803f, 0xc95b3e, 0xe8bf5a, 0x9a5a2e],   // falling leaves
        shape: 'leaf',
    },
    // Christmas (Dec 1 to Jan 1): crisp paper, mint and ice to cranberry and pine, snow,
    // garland vines strung with little lights.
    winter: {
        tiers: [0xcfe5d8, 0xa9d3ea, 0x8cc7a4, 0xf2d27a, 0xeea19a, 0xd65a50, 0x3f8a5c, 0x8e2f38],
        texts: { 6: '#fffaf0', 7: '#fffaf0' },
        jello: 0xbfe0f0,                         // icy jelly
        colors: { leaf: 0x2f8a52, vine: 0x2b5e3b, windmill: 0xf0c65a, mushroom: 0xd2453b },
        light: { paper: 0xeceeea, field: 0xfafbf8 },
        dark: { paper: 0x10141a, field: 0x182029 },
        crumbs: [0xd8e8f3, 0xbcd6ea, 0xa9c8e0, 0xffffff],   // snowflakes (icy blue, so they show on light paper)
        shape: 'flake',
        // The snow cap: fine flakes in white with a little blue, periwinkle and lavender, so it
        // reads as snow catching the light rather than one flat colour.
        pile: { colors: [0xffffff, 0xffffff, 0xeef4fb, 0xdce8f5, 0xb8cdea, 0xa9bde6, 0xc4b8e8], size: 0.5, density: 2.4 },
        lights: [0xe0473c, 0xf2c14e, 0x4f9bd9, 0x58b368],   // garland bulbs
    },
};

export function applySeason({ THEMES, TIERS, JELLO, COLORS }) {
    const look = SEASONS[season];
    if (!look) return null;
    look.tiers.forEach((fill, i) => { if (TIERS[i]) TIERS[i].fill = fill; });
    for (const i in look.texts ?? {}) if (TIERS[i]) TIERS[i].text = look.texts[i];
    JELLO.fill = look.jello;
    Object.assign(COLORS, look.colors);
    Object.assign(THEMES.light, look.light);
    Object.assign(THEMES.dark, look.dark);
    dressBuddies();
    return { crumbs: look.crumbs, leaves: true, shape: look.shape, lights: look.lights ?? null, pile: look.pile ?? null };
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
    // A floppy Santa hat: red, a white fur band, and the tip flopped over to one side with a pompom.
    winter: `<g class="hat" filter="url(#sketchy)" transform="translate(0 -3.5)">
<path d="M7.5 11.5C9 2 16 -4.5 26 -4.5C34 -4.5 41 -1 45 6.5L41.5 9C38.5 4 34 2 31 2.5C36 4 40.5 8 40.5 11.5z" fill="#d2453b" stroke="#2b2622" stroke-width="2.2" stroke-linejoin="round"/>
<rect x="5" y="9.5" width="38" height="6.5" rx="3.2" fill="#fbf8f2" stroke="#2b2622" stroke-width="2.2"/>
<circle cx="44.5" cy="9.5" r="4" fill="#fbf8f2" stroke="#2b2622" stroke-width="2.2"/>
</g>`,
};
function dressBuddies() {
    const hat = HATS[season];
    if (!hat) return;
    for (const face of document.querySelectorAll('.buddy-face .wiggle > g')) {
        if (!face.querySelector('.hat')) face.insertAdjacentHTML('beforeend', hat);
    }
}
