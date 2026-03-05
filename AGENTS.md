# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

**Local dev server** (always use port 8000, never 3000):
```bash
node server.js
```

**Build the journal** (syncs stories → JSON → HTML pages + feeds):
```bash
npm run build
```

**Watch mode** (auto-rebuild on story file changes):
```bash
npm run watch
```

**Journal CMS utilities:**
```bash
npm run add     # Interactive story creation wizard
npm run list    # List all journal entries
npm run sync    # Quick sync without full build
```

**AI Advisor bundle** (only needed when editing `/aiadvisor/js/`):
```bash
npm run bundle:aiadvisor
```

**Fetch external data:**
```bash
npm run fetch-movies   # Refresh Letterboxd movie cache
```

There are no automated tests in this codebase.

## Architecture

This is a **static HTML site** with no server-side framework. All pages are pre-built `.html` files served by `server.js`.

### Journal / Blog CMS

The blog is a custom flat-file CMS built entirely in Node.js:

- **Source**: Stories are `.txt` files in `/stories/` named `YYYY-MM-DD-slug.txt` with YAML-like metadata headers (Title, Subtitle, Date, Tags, Excerpt, Images)
- **Processing pipeline** (`npm run build`):
  1. `scripts/blog.js` orchestrates the build
  2. Calls `scripts/journal-cms.js sync` → parses all story `.txt` files → writes `data/journal-entries.json`
  3. Generates individual entry pages in `/entry/slug.html`
  4. Regenerates `/journal/index.html`, `/archive/index.html`
  5. Regenerates RSS (`journal-feed.xml`) and Atom (`journal-atom.xml`) feeds via `js/generate-rss.js`
- **Never edit** `data/journal-entries.json`, `/entry/*.html`, or `/journal/index.html` directly—they are generated artifacts

### Shared Partials (Navigation & Footer)

Navigation and footer are **not** inline in each page. They live as HTML fragments:
- `partials/navigation.html` — nav markup
- `partials/footer.html` — footer markup

These are fetched at runtime by `js/navigation-loader.js` and `js/footer-loader.js` and injected into a `<div id="navigation-placeholder">` / `<div id="footer-placeholder">` element present on every page.

**When adding a nav item**, update **both** `partials/navigation.html` and the clean-URL map in `server.js`. The `serve` npm script has a hardcoded URL map too but `server.js` is the authoritative dev server.

### CSS & Theming

- `css/style.css` — main stylesheet, uses CSS custom properties for theming
- `css/seasonal-themes.css` — seasonal visual variations loaded by `js/seasonal-loader.js`
- Key CSS variables: `--bg-color`, `--text-color`, `--heading-color`, `--accent-color`, `--skills-color`, `--font-secondary`

### JavaScript

All JS in `/js/` is vanilla. Files are loaded individually per page as needed:
- `js/navigation-loader.js` / `js/footer-loader.js` — partial injection
- `js/theme-toggle-loader.js` — dark/light mode
- `js/seasonal-loader.js` — seasonal theme switcher
- `js/journal-latest.js` — pulls recent entries for the homepage from `data/journal-entries.json`
- `js/medium.js` / `js/letterboxd.js` / `js/github-activity.js` — external content widgets
- `js/tag-filter.js` — client-side journal tag filtering
- `js/app.min.js` — pre-minified bundle (do not edit directly)

### AI Advisor (`/aiadvisor/`)

A self-contained React app bundled with Webpack. Entry point is `aiadvisor/js/bundle-entry.js`; output goes to `aiadvisor/dist/bundle.js`. Run `npm run bundle:aiadvisor` after editing its JS source.

### Experiments (`/experiments/`)

Standalone Three.js browser experiments, each in its own subdirectory (`paper-plane`, `slime-game`, `wonderz`, `jump-start`, `timesync-demo`, `taskflow`). They are independent and do not share code with the main site.

### Local Server (`server.js`)

Handles:
- Clean URLs (`/journal` → `/journal/index.html`, etc.)
- A `/api/share` POST/GET endpoint used by the `/coded` code playground to save/load code snippets (stored in `coded/shares.json`)
- Gzip compression for HTML/CSS/JS/JSON/XML
- Auto-shutdown after 10 minutes

### UI Conventions

- Use sentence casing for UI labels (e.g., "Voice acting" not "Voice Acting")
