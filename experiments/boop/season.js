// Boop: seasons. Around some holidays the game dresses up: block colours, the paper, the
// crumbs a popped block leaves, the vines, and a scarf for Boop. The rules never change.
// Which season it is comes from the date on the player's device: a tiny script at the top
// of index.html sets data-season (and data-greeting) before anything is drawn, so the page
// never flashes the wrong colours. ?season=fall (or none) in the address forces one, for testing.
(globalThis.boopBuilds = globalThis.boopBuilds || []).push('1.3.0-2');   // build stamp: game.js checks every file matches

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

// A striped knit scarf, wrapped under his chin with one end hanging down.
const SCARF = `<g class="scarf" filter="url(#sketchy)">
<path d="M5.5 34.5h37v5.5q-18.5 2.5-37 0z" fill="#e2803f" stroke="#2b2622" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M14 35v5.4M23 35v5.8M32 35v5.6" stroke="#c95b3e" stroke-width="2.4"/>
<path d="M32.5 38.5l2.2 8.5 5.2-1.3-1.6-8.2z" fill="#e2803f" stroke="#2b2622" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M34.3 45.6l-.6 2.2M36.6 45l-.4 2.3M38.8 44.5l-.2 2.3" stroke="#2b2622" stroke-width="1.4" stroke-linecap="round"/>
</g>`;
function dressBuddies() {
    for (const face of document.querySelectorAll('.buddy-face .wiggle > g')) {
        if (!face.querySelector('.scarf')) face.insertAdjacentHTML('beforeend', SCARF);
    }
}
