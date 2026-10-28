#!/usr/bin/env node

/**
 * Partials Builder for kartooner.com
 * Bakes /partials (navigation, theme toggle, footer) into each page's HTML so
 * they render with the page instead of arriving later via fetch.
 *
 * Each baked partial is wrapped in <!-- partial:name --> ... <!-- /partial:name -->
 * markers, so re-running this script refreshes them after a partial changes.
 * Pages that still have a placeholder div (or skip this step) keep working:
 * the loader scripts fetch the partial as a fallback.
 *
 * Usage: node scripts/build-partials.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PARTIALS_DIR = path.join(ROOT, 'partials');
const SKIP_DIRS = new Set(['node_modules', 'backups', 'scripts', 'partials', 'playwright-report', 'test-results', '.git']);

const PARTIALS = [
    { name: 'navigation', file: 'navigation.html', placeholder: 'navigation-placeholder' },
    { name: 'theme-toggle', file: 'theme-toggle.html', placeholder: 'theme-toggle-placeholder' },
    { name: 'footer', file: 'footer.html', placeholder: 'footer-placeholder' }
];

// Find every HTML page under the site root
function findPages(dir) {
    let pages = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!SKIP_DIRS.has(entry.name)) pages = pages.concat(findPages(path.join(dir, entry.name)));
        } else if (entry.name.endsWith('.html')) {
            pages.push(path.join(dir, entry.name));
        }
    }
    return pages;
}

// The URL path a page is served at, e.g. about/index.html -> /about/
function urlPathFor(file) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    if (rel === 'index.html') return '/';
    if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
    return '/' + rel;
}

// Same rules as setActiveNavLink() in js/navigation-loader.js
function isActiveNav(navType, urlPath) {
    if (navType === 'home') return urlPath === '/' || urlPath === '/index.html';
    if (navType === 'journal') return ['/journal', '/entry'].some(prefix => urlPath.startsWith(prefix));
    return urlPath.startsWith('/' + navType);
}

// Page-specific tweaks the loaders would otherwise make at runtime
function customize(name, html, urlPath) {
    if (name === 'navigation') {
        return html.replace(/<a href="([^"]*)" data-nav="([^"]+)">/g, (match, href, navType) =>
            isActiveNav(navType, urlPath)
                // An entry sits inside Journal but isn't the Journal page itself
                ? `<a href="${href}" data-nav="${navType}" class="current" aria-current="${urlPath.startsWith('/entry') ? 'true' : 'page'}">`
                : match
        );
    }

    if (name === 'footer') {
        html = html.replace(/<span id="current-year">\d*<\/span>/, `<span id="current-year">${new Date().getFullYear()}</span>`);

        // The webring only appears on the home page
        if (urlPath !== '/') {
            html = html.replace(/\n[ \t]*<div class="webring"[\s\S]*?<\/div>\s*<\/div>\n/, '\n');
        }
    }

    return html;
}

function indent(html, prefix) {
    return html.trim().split('\n').map(line => (line.trim() ? prefix + line : '')).join('\n');
}

function buildPage(file, sources) {
    const original = fs.readFileSync(file, 'utf8');
    const eol = original.includes('\r\n') ? '\r\n' : '\n';
    let html = original.replace(/\r\n/g, '\n');
    const urlPath = urlPathFor(file);
    let baked = 0;

    for (const { name, placeholder } of PARTIALS) {
        const block = (prefix) => [
            `${prefix}<!-- partial:${name} (generated from partials/, edit there and run npm run build) -->`,
            indent(customize(name, sources[name], urlPath), prefix),
            `${prefix}<!-- /partial:${name} -->`
        ].join('\n');

        // Refresh an already-baked partial
        const marked = new RegExp(`^([ \\t]*)<!-- partial:${name}\\b[^>]*-->[\\s\\S]*?<!-- /partial:${name} -->`, 'm');
        // Or replace the placeholder div (and its "loaded dynamically" comment, if any)
        const placeholderDiv = new RegExp(`^(?:[ \\t]*<!--[^\\n]*loaded dynamically[^\\n]*-->\\n)?([ \\t]*)<div id="${placeholder}"></div>`, 'm');

        if (marked.test(html)) {
            html = html.replace(marked, (match, prefix) => block(prefix));
            baked++;
        } else if (placeholderDiv.test(html)) {
            html = html.replace(placeholderDiv, (match, prefix) => block(prefix));
            baked++;
        }
    }

    if (baked) {
        const output = html.replace(/\n/g, eol);
        if (output !== original) fs.writeFileSync(file, output, 'utf8');
    }
    return baked;
}

function build() {
    const sources = {};
    for (const { name, file } of PARTIALS) {
        sources[name] = fs.readFileSync(path.join(PARTIALS_DIR, file), 'utf8').replace(/\r\n/g, '\n');
    }

    let pages = 0;
    for (const file of findPages(ROOT)) {
        const baked = buildPage(file, sources);
        if (baked) {
            pages++;
            console.log(`   ${path.relative(ROOT, file)} (${baked} partial${baked === 1 ? '' : 's'})`);
        }
    }
    console.log(`🧩 Baked partials into ${pages} page${pages === 1 ? '' : 's'}`);
}

build();
