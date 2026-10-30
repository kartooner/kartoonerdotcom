#!/usr/bin/env node

/**
 * Link Preview Images for kartooner.com
 * When a journal entry is shared (LinkedIn, Slack, iMessage, ...), the preview
 * card shows a 1200x630 image. For each entry with images, this makes
 * assets/share/<entry-id>.jpg from its first image:
 *   - photos are cropped to fill the card
 *   - transparent PNGs are placed whole on a paper-colored background, since
 *     some apps show transparency as black
 *
 * Skips cards already newer than their source image, so it's cheap to run on
 * every build. The entry pages point at these files (scripts/journal-cms.js).
 *
 * Usage: node scripts/build-share-images.js [--force]
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const JOURNAL_FILE = path.join(ROOT, 'data', 'journal-entries.json');
const SHARE_DIR = path.join(ROOT, 'assets', 'share');
const WIDTH = 1200;
const HEIGHT = 630;
const PADDING = 40;
const BACKGROUND = '#e8e0d0';
const force = process.argv.includes('--force');

async function buildCard(entry) {
    const src = entry.images && entry.images[0];
    if (!src || /^(https?:)?\/\//.test(src)) return false;
    const source = path.join(ROOT, src);
    const output = path.join(SHARE_DIR, `${entry.id}.jpg`);
    if (!fs.existsSync(source)) {
        console.warn(`   ${entry.id}: ${src} not found, no preview image`);
        return false;
    }
    if (!force && fs.existsSync(output) && fs.statSync(output).mtimeMs >= fs.statSync(source).mtimeMs) return false;

    const { hasAlpha } = await sharp(source).metadata();
    const card = hasAlpha
        ? sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: BACKGROUND } })
            .composite([{
                input: await sharp(source)
                    .resize({ width: WIDTH - PADDING * 2, height: HEIGHT - PADDING * 2, fit: 'inside' })
                    .toBuffer()
            }])
        : sharp(source).resize({ width: WIDTH, height: HEIGHT, fit: 'cover' });

    await card.flatten({ background: BACKGROUND }).jpeg({ quality: 82, mozjpeg: true }).toFile(output);
    return true;
}

async function run() {
    if (!fs.existsSync(JOURNAL_FILE)) return;
    fs.mkdirSync(SHARE_DIR, { recursive: true });
    const { entries } = JSON.parse(fs.readFileSync(JOURNAL_FILE, 'utf8'));
    let built = 0;
    for (const entry of entries) {
        if (await buildCard(entry)) {
            built++;
            console.log(`   assets/share/${entry.id}.jpg`);
        }
    }
    console.log(`🔗 Made ${built} link preview image${built === 1 ? '' : 's'}`);
}

run().catch(error => {
    console.error('❌ Link preview images failed:', error.message);
    process.exit(1);
});
