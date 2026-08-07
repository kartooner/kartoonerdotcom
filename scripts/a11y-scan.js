const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');

const BASE = 'http://localhost:8000';
const PAGES = [
    '/',
    '/about/',
    '/journal/',
    '/voice-acting/',
    '/contact/',
    '/recommended-books/',
    '/archive/',
    '/coded/',
    '/experiments/',
    '/thanks/',
    '/entry/delivery-is-a-trap.html',
    '/entry/everyone-creates.html',
    '/entry/growing-up-in-the-80s.html',
    '/entry/here-we-go-again.html',
    '/entry/the-pole-on-the-corner.html',
    '/entry/the-serendipity-of-noticing.html',
];

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const allResults = {};

    for (const path of PAGES) {
        const page = await context.newPage();
        try {
            await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 20000 });
            await page.waitForTimeout(2500);
            const results = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
                .analyze();
            allResults[path] = {
                violations: results.violations.map(v => ({
                    id: v.id,
                    impact: v.impact,
                    description: v.description,
                    help: v.help,
                    helpUrl: v.helpUrl,
                    nodes: v.nodes.map(n => ({
                        html: n.html,
                        target: n.target,
                        failureSummary: n.failureSummary,
                    })),
                })),
            };
            console.log(`${path}: ${results.violations.length} violations`);
        } catch (err) {
            console.log(`${path}: ERROR - ${err.message}`);
            allResults[path] = { error: err.message };
        }
        await page.close();
    }

    fs.writeFileSync('a11y-report.json', JSON.stringify(allResults, null, 2));
    await browser.close();
})();
