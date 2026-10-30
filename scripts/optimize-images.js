#!/usr/bin/env node

/**
 * Image Optimizer for kartooner.com
 * Creates a .webp next to every .jpg/.jpeg/.png in assets/images, resized to
 * at most MAX_WIDTH (2x the widest content column), plus smaller copies
 * (name-400w.webp, name-800w.webp, ...) for phones and narrow columns. The
 * pages list them in a srcset (scripts/build-images.js) so each device downloads
 * the smallest one that's still sharp. Originals are left alone and stay the
 * fallback for browsers without WebP.
 *
 * Skips any .webp already newer than its original, so it's cheap to run on
 * every build.
 *
 * Usage: node scripts/optimize-images.js [--force]
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGES_DIR = path.join(__dirname, '..', 'assets', 'images');
const MAX_WIDTH = 1600;
// Smaller copies, made only when narrower than the full-size .webp
const VARIANT_WIDTHS = [400, 800, 1200];
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

const variantPath = (webp, width) => webp.replace(/\.webp$/i, `-${width}w.webp`);
const isFresh = (output, source) => fs.existsSync(output) && fs.statSync(output).mtimeMs >= fs.statSync(source).mtimeMs;

async function optimize(file) {
    const output = file.replace(/\.(jpe?g|png)$/i, '.webp');
    const isPng = /\.png$/i.test(file);
    const { width } = await sharp(file).metadata();
    const fullWidth = Math.min(width, MAX_WIDTH);
    const targets = [{ output, width: fullWidth }].concat(VARIANT_WIDTHS
        .filter(variant => variant < fullWidth)
        .map(variant => ({ output: variantPath(output, variant), width: variant })))
        .filter(target => force || !isFresh(target.output, file));
    if (!targets.length) return null;

    for (const target of targets) {
        await sharp(file)
            .resize({ width: target.width, withoutEnlargement: true })
            .webp({ quality: isPng ? QUALITY.graphic : QUALITY.photo, smartSubsample: true, effort: 5 })
            .toFile(target.output);
    }

    // A smaller copy that isn't smaller in bytes (pixel art, tiny sprites) is no help
    const fullSize = fs.statSync(output).size;
    const kept = targets.filter(target => {
        if (target.output === output || fs.statSync(target.output).size < fullSize) return true;
        fs.unlinkSync(target.output);
        return false;
    });

    const after = kept.reduce((sum, target) => sum + fs.statSync(target.output).size, 0);
    return { after, files: kept.length };
}

async function run() {
    let converted = 0;
    for (const file of findImages(IMAGES_DIR)) {
        const result = await optimize(file);
        if (!result || !result.files) continue;
        converted++;
        console.log(`   ${path.relative(IMAGES_DIR, file)}: ${result.files} .webp file${result.files === 1 ? '' : 's'} (${kb(result.after)})`);
    }
    console.log(`🖼️  Optimized ${converted} image${converted === 1 ? '' : 's'}`);
}

module.exports = { VARIANT_WIDTHS, variantPath };

if (require.main === module) {
    run().catch(error => {
        console.error('❌ Image optimization failed:', error.message);
        process.exit(1);
    });
}
