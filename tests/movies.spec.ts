import { test, expect, type Locator, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helper: waits for the Letterboxd widget to finish rendering and returns
// the cards locator. Reusable in any test that touches the reviews section.
// ---------------------------------------------------------------------------
async function getMovieCards(page: Page): Promise<Locator> {
  await page.goto('/about/');
  // letterboxd.js fetches /data/letterboxd-cache.json asynchronously
  const cards = page.locator('#reviews-container article.review-card');
  await cards.first().waitFor({ state: 'visible', timeout: 10_000 });
  return cards;
}

// ---------------------------------------------------------------------------
// Movies — Recently watched section
// ---------------------------------------------------------------------------
test.describe('Movies — Recently watched section (/about/)', () => {

  test('renders 4 movie cards', async ({ page }) => {
    const cards = await getMovieCards(page);
    await expect(cards).toHaveCount(4);
  });

  test('each card has a visible poster image', async ({ page }) => {
    const cards = await getMovieCards(page);
    for (const card of await cards.all()) {
      await expect(card.locator('img')).toBeVisible();
    }
  });

  test('poster images load without errors (naturalWidth > 0)', async ({ page }) => {
    const cards = await getMovieCards(page);
    for (const card of await cards.all()) {
      const img = card.locator('img');
      await expect(img).toBeVisible();
      const naturalWidth = await img.evaluate((el) => (el as HTMLImageElement).naturalWidth);
      expect(naturalWidth, 'poster image should have a positive naturalWidth').toBeGreaterThan(0);
    }
  });

  test('each card has a non-empty movie title', async ({ page }) => {
    const cards = await getMovieCards(page);
    for (const card of await cards.all()) {
      const title = card.locator('h3');
      await expect(title).not.toBeEmpty();
    }
  });

  test('each card shows a star rating containing ★ or ½', async ({ page }) => {
    const cards = await getMovieCards(page);
    for (const card of await cards.all()) {
      const stars = card.locator('.review-stars');
      await expect(stars).toBeVisible();
      await expect(stars).toContainText(/[★½]/);
    }
  });

  test('each card links to letterboxd.com', async ({ page }) => {
    const cards = await getMovieCards(page);
    for (const card of await cards.all()) {
      const link = card.locator('a');
      await expect(link).toHaveAttribute('href', /letterboxd\.com/);
    }
  });

  test('section heading is visible', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.getByRole('heading', { name: /movies i've recently watched/i })).toBeVisible();
  });

});
