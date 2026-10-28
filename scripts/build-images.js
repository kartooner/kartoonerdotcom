#!/usr/bin/env node

/**
 * Image Markup Builder for kartooner.com
 * For every local .jpg/.jpeg/.png <img> in the site's pages:
 *   - adds width/height from the original file, so the browser reserves the
 *     right shape before the image arrives (no layout jump)
 *   - wraps it in <picture> with the .webp from optimize-images.js, keeping
 *     the original as the fallback
 *
 * Images already inside a <picture> are left alone, so it's safe to re-run.
 * Run after optimize-images.js (npm run build does both).
 *
 * Usage: node scripts/build-images.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', 'backups', 'scripts', 'partials', 'playwright-report', 'test-results', '.git']);

// Site pages share the main stylesheet; experiments and tools have their own setups
function findPages(dir) {
    let pages = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!SKIP_DIRS.has(entry.name)) pages = pages.concat(findPages(full));
        } else if (entry.name.endsWith('.html') && fs.readFileSync(full, 'utf8').includes('/css/style.css')) {
            pages.push(full);
        }
    }
    return pages;
}

function resolveSrc(src, page) {
    if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) return null;
    const clean = src.split(/[?#]/)[0];
    return clean.startsWith('/') ? path.join(ROOT, clean) : path.join(path.dirname(page), clean);
}

const sizeCache = new Map();
async function sizeOf(file) {
    if (!sizeCache.has(file)) {
        const { width, height } = await sharp(file).metadata();
        sizeCache.set(file, { width, height });
    }
    return sizeCache.get(file);
}

function insideOpenPicture(html, index) {
    return html.lastIndexOf('<picture', index) > html.lastIndexOf('</picture>', index);
}

async function buildPage(page) {
    const original = fs.readFileSync(page, 'utf8');
    const tags = [...original.matchAll(/<img\b[^>]*>/g)];
    let html = '';
    let last = 0;
    let changed = 0;

    for (const match of tags) {
        let tag = match[0];
        const src = (tag.match(/\ssrc="([^"]+)"/) || [])[1];
        const file = src && /\.(jpe?g|png)$/i.test(src.split(/[?#]/)[0]) ? resolveSrc(src, page) : null;

        html += original.slice(last, match.index);
        last = match.index + tag.length;

        if (!file || !fs.existsSync(file)) {
            html += tag;
            continue;
        }

        const before = tag;

        if (!/\swidth="/.test(tag) && !/\sheight="/.test(tag)) {
            const { width, height } = await sizeOf(file);
            tag = tag.replace(/\s*\/?>$/, ` width="${width}" height="${height}"$&`);
        }

        const webp = src.replace(/\.(jpe?g|png)(?=$|[?#])/i, '.webp');
        if (!insideOpenPicture(original, match.index) && fs.existsSync(file.replace(/\.(jpe?g|png)$/i, '.webp'))) {
            tag = `<picture><source srcset="${webp}" type="image/webp">${tag}</picture>`;
        }

        if (tag !== before) changed++;
        html += tag;
    }
    html += original.slice(last);

    if (changed) fs.writeFileSync(page, html, 'utf8');
    return changed;
}

async function build() {
    let total = 0;
    for (const page of findPages(ROOT)) {
        const changed = await buildPage(page);
        if (changed) {
            total += changed;
            console.log(`   ${path.relative(ROOT, page)} (${changed} image${changed === 1 ? '' : 's'})`);
        }
    }
    console.log(`🖼️  Updated ${total} image tag${total === 1 ? '' : 's'}`);
}

build().catch(error => {
    console.error('❌ Image markup build failed:', error.message);
    process.exit(1);
});
