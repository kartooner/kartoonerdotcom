# Image Optimization

How images are made small and fast on kartooner.com. `npm run build` runs all of it.

## Adding an image

1. Put the JPG or PNG in `assets/images/` (subfolders are fine).
2. Reference the original in HTML, data or a story as usual, e.g. `/assets/images/my-cover.jpg`.
3. Run `npm run build`.

That's it. Keep the originals; they're the fallback.

## What the build does

### 1. `scripts/optimize-images.js` (`npm run optimize-images`)

Creates a `.webp` next to every `.jpg/.jpeg/.png` in `assets/images/`:
- Resized to at most **1600px** wide (2x the widest content column), never upscaled
- Photos (JPG) at quality 78; illustrations (PNG) at quality 92 so paper grain and brush texture survive
- Skips images whose `.webp` is already newer than the original. Use `--force` to redo everything (e.g. after changing the quality settings)

### 2. `scripts/build-images.js`

For every local JPG/PNG `<img>` in the site's pages:
- Adds `width`/`height` from the original, so the browser reserves the right shape and the page doesn't jump
- Wraps it in `<picture>` with the WebP as a `<source>`, keeping the original as the fallback

Images already inside a `<picture>` are left alone, so it's safe to re-run.

Two base rules in `css/style.css` keep this from changing any layout:
- `picture { display: contents; }` so the `<img>` lays out as if it were the direct child
- `:where(img[width][height]) { height: auto; }` so images keep scaling as before (zero specificity, so component styles still win)

### Images rendered by JavaScript

`about/about.js` builds the same `<picture>` markup for local images that come from `data/content.json`.

## Loading priority

- The first image in a journal entry loads eagerly with `fetchpriority="high"` (set in the entry template in `scripts/journal-cms.js`), since it's usually the largest thing on screen
- Everything else is `loading="lazy"`

## Progressive loading (`js/app.min.js`)

`EnhancedProgressiveImageLoader` shows a skeleton shimmer while each image loads, then fades it in. It doesn't fetch anything itself (WebP comes from the `<picture>` markup), so each image downloads once. If a WebP is ever missing, it drops the `<source>` and falls back to the original. Hovering an image served as WebP shows a small "WebP" badge.

## Requirements

[sharp](https://sharp.pixelplumbing.com/) (a dev dependency, installed by `npm install`). No system tools needed.
