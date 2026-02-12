#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const RSS_URL = 'https://letterboxd.com/kartooner/rss/';
const CACHE_PATH = path.join(__dirname, '..', 'data', 'letterboxd-cache.json');
const MAX_MOVIES = 4;

async function fetchRss() {
    const response = await fetch(RSS_URL, {
        headers: { 'User-Agent': 'kartoonerdotcom/1.0' }
    });
    if (!response.ok) {
        throw new Error(`RSS fetch failed: HTTP ${response.status}`);
    }
    return await response.text();
}

function parseRss(xml) {
    const items = [];
    // Match each <item>...</item> block
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < MAX_MOVIES) {
        const block = match[1];

        const filmTitle = getTag(block, 'letterboxd:filmTitle') || getTitleName(getTag(block, 'title'));
        const filmYear = getTag(block, 'letterboxd:filmYear');
        const memberRating = getTag(block, 'letterboxd:memberRating');
        const watchedDate = getTag(block, 'letterboxd:watchedDate');
        const link = getTag(block, 'link');
        const description = getTag(block, 'description') || getCdata(block, 'description');

        // Extract poster image from description HTML
        const imgMatch = description && description.match(/<img[^>]+src="([^">]+)"/);
        const imageUrl = imgMatch ? imgMatch[1] : null;

        // Build star rating from memberRating (e.g., "4.0" -> "★★★★", "3.5" -> "★★★½")
        const stars = memberRating ? buildStars(parseFloat(memberRating)) : null;

        if (!imageUrl) continue; // Skip items without poster images

        items.push({
            title: filmTitle || 'Untitled',
            year: filmYear || null,
            link: link || `https://letterboxd.com/kartooner/`,
            imageUrl,
            stars,
            rating: memberRating ? parseFloat(memberRating) : null,
            date: watchedDate || null
        });
    }

    return items;
}

function getTag(block, tagName) {
    // Handle both <tag>value</tag> and CDATA wrapped values
    const regex = new RegExp(`<${tagName}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tagName}>`);
    const match = block.match(regex);
    return match ? match[1].trim() : null;
}

function getCdata(block, tagName) {
    const regex = new RegExp(`<${tagName}>[\\s]*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>[\\s]*</${tagName}>`);
    const match = block.match(regex);
    return match ? match[1].trim() : null;
}

function getTitleName(title) {
    if (!title) return null;
    // Letterboxd titles are like "Film Name, 2023 - ★★★★"
    // Strip the year and star rating portion
    return title.replace(/,\s*\d{4}\s*-\s*.*$/, '').trim();
}

function buildStars(rating) {
    if (isNaN(rating) || rating < 0) return null;
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return '★'.repeat(fullStars) + (hasHalf ? '½' : '');
}

async function main() {
    console.log('Fetching Letterboxd RSS feed...');

    try {
        const xml = await fetchRss();
        const movies = parseRss(xml);

        if (movies.length === 0) {
            console.error('No movies found in RSS feed. Cache not updated.');
            process.exit(1);
        }

        const cache = {
            fetchedAt: new Date().toISOString(),
            movies
        };

        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
        console.log(`Cached ${movies.length} movies to ${path.relative(process.cwd(), CACHE_PATH)}`);
        movies.forEach(m => {
            console.log(`  - ${m.title}${m.year ? ` (${m.year})` : ''}${m.stars ? ` ${m.stars}` : ''}`);
        });
    } catch (error) {
        console.error('Failed to fetch movies:', error.message);
        // Don't overwrite existing cache on failure
        if (fs.existsSync(CACHE_PATH)) {
            console.log('Existing cache preserved.');
        }
        process.exit(1);
    }
}

main();
