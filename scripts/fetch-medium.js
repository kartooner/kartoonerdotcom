#!/usr/bin/env node

// Caches the latest Medium article so the About page can show it instantly,
// without sending visitors through CORS proxies. js/medium.js reads this first,
// then quietly checks the live feed for anything newer.

const fs = require('fs');
const path = require('path');

const RSS_URL = 'https://medium.com/feed/@kartooner';
const PROFILE_URL = 'https://medium.com/@kartooner';
const CACHE_PATH = path.join(__dirname, '..', 'data', 'medium-cache.json');

async function fetchRss() {
    const response = await fetch(RSS_URL, {
        headers: { 'User-Agent': 'kartoonerdotcom/1.0' }
    });
    if (!response.ok) {
        throw new Error(`RSS fetch failed: HTTP ${response.status}`);
    }
    return await response.text();
}

// Same shape js/medium.js builds from the live feed
function parseLatestArticle(xml) {
    const match = xml.match(/<item>([\s\S]*?)<\/item>/);
    if (!match) return null;
    const block = match[1];

    const content = getTag(block, 'content:encoded') || getTag(block, 'description') || '';

    // Medium opens a post with its subtitle as a heading; use that when it's there,
    // otherwise the first 200 characters of plain text
    const subtitleMatch = content.match(/^\s*<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/);
    const toText = html => decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    const textContent = toText(content);
    const excerpt = subtitleMatch
        ? toText(subtitleMatch[1])
        : textContent.substring(0, 200) + (textContent.length > 200 ? '...' : '');

    const categories = [...block.matchAll(/<category>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/g)].map(m => m[1].trim());
    const pubDate = getTag(block, 'pubDate');

    return {
        title: decodeEntities(getTag(block, 'title') || 'Untitled'),
        link: (getTag(block, 'link') || PROFILE_URL).split('?')[0],
        excerpt,
        categories,
        date: pubDate ? new Date(pubDate).toISOString() : null
    };
}

function getTag(block, tagName) {
    // Handle both <tag>value</tag> and CDATA wrapped values
    const regex = new RegExp(`<${tagName}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tagName}>`);
    const match = block.match(regex);
    return match ? match[1].trim() : null;
}

function decodeEntities(text) {
    return text
        .replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (m, code) => String.fromCharCode(code))
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

async function main() {
    console.log('Fetching Medium RSS feed...');

    try {
        const article = parseLatestArticle(await fetchRss());

        if (!article) {
            console.error('No articles found in RSS feed. Cache not updated.');
            process.exit(1);
        }

        const cache = {
            fetchedAt: new Date().toISOString(),
            article
        };

        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
        console.log(`Cached "${article.title}" to ${path.relative(process.cwd(), CACHE_PATH)}`);
    } catch (error) {
        console.error('Failed to fetch Medium article:', error.message);
        // Don't overwrite existing cache on failure
        if (fs.existsSync(CACHE_PATH)) {
            console.log('Existing cache preserved.');
        }
        process.exit(1);
    }
}

main();
