/**
 * Captures screenshots of experiments for the /experiments index page.
 * Run with: node scripts/screenshot-games.js
 */
const { chromium } = require('@playwright/test');
const path = require('path');

const games = [
    {
        url: 'http://localhost:8000/experiments/paper-plane',
        output: path.join(__dirname, '../assets/images/experiment-paper-plane.jpg'),
        name: 'paper-plane',
        waitFor: 3000,
    },
    {
        url: 'http://localhost:8000/experiments/slime-game',
        output: path.join(__dirname, '../assets/images/experiment-slime-game.jpg'),
        name: 'slime-game',
        waitFor: 4000,
    },
];

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
    });

    for (const game of games) {
        console.log(`Capturing ${game.name}...`);
        const page = await context.newPage();
        try {
            await page.goto(game.url, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForTimeout(game.waitFor);
            await page.screenshot({
                path: game.output,
                type: 'jpeg',
                quality: 90,
            });
            console.log(`  Saved to ${game.output}`);
        } catch (err) {
            console.error(`  Error capturing ${game.name}:`, err.message);
        } finally {
            await page.close();
        }
    }

    await browser.close();
    console.log('Done.');
})();
