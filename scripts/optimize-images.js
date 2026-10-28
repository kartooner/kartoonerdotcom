#!/usr/bin/env node

/**
 * Image Optimizer for kartooner.com
 * Creates a .webp next to every .jpg/.jpeg/.png in assets/images, resized to
 * at most MAX_WIDTH (2x the widest content column). Originals are left alone
 * and stay the fallback for browsers without WebP.
 *
 * Skips images whose .webp is already newer than the original, so it's cheap
 * to run on every build.
 *
 * Usage: node scripts/optimize-images.js [--force]
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGES_DIR = path.join(__dirname, '..', 'assets', 'images');
const MAX_WIDTH = 1600;
// Illustrations (PNG) get a higher quality so paper grain and brush texture survive
const QUALITY = { photo: 78, graphic: 92 };
const force = process.argv.includes('--force');

function findImages(dir) {
    let images = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) images = images.concat(findImages(full));
        else if (/\.(jpe?g|png)$/i.test(entry.name)) images.push(full);
    }
    return images;
}

const kb = bytes => `${Math.round(bytes / 1024)}K`;

async function optimize(file) {
    const output = file.replace(/\.(jpe?g|png)$/i, '.webp');
    if (!force && fs.existsSync(output) && fs.statSync(output).mtimeMs >= fs.statSync(file).mtimeMs) {
        return null;
    }

    const isPng = /\.png$/i.test(file);
    const image = sharp(file);
    const { width } = await image.metadata();

    await image
        .resize({ width: Math.min(width, MAX_WIDTH), withoutEnlargement: true })
        .webp({ quality: isPng ? QUALITY.graphic : QUALITY.photo, smartSubsample: true, effort: 5 })
        .toFile(output);

    return { before: fs.statSync(file).size, after: fs.statSync(output).size };
}

async function run() {
    let converted = 0, saved = 0;
    for (const file of findImages(IMAGES_DIR)) {
        const result = await optimize(file);
        if (!result) continue;
        converted++;
        saved += result.before - result.after;
        console.log(`   ${path.relative(IMAGES_DIR, file)}: ${kb(result.before)} → ${kb(result.after)}`);
    }
    console.log(`🖼️  Optimized ${converted} image${converted === 1 ? '' : 's'}${converted ? ` (saved ${kb(saved)})` : ''}`);
}

run().catch(error => {
    console.error('❌ Image optimization failed:', error.message);
    process.exit(1);
});
