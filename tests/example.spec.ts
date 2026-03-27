import { test, expect } from '@playwright/test';

// --- Homepage ---
test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Erik Sagen/);
  });

  test('shows name heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText("I'm Erik Sagen");
  });

  test('shows job title in work experience', async ({ page }) => {
    await expect(page.getByText('Lead Product UX Designer at Paychex')).toBeVisible();
  });

  test('skip link is present', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeAttached();
  });
});

// --- About page ---
test.describe('About page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about/');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/About - Erik Sagen/);
  });

  test('shows About me heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('About me');
  });

  test('shows career timeline section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'The journey so far' })).toBeVisible();
  });

  test('avatar image loads', async ({ page }) => {
    const avatar = page.getByAltText('Erik Sagen headshot');
    await expect(avatar).toBeVisible();
  });
});

// --- Contact page ---
test.describe('Contact page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact/');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Contact - Erik Sagen/);
  });

  test('contact form fields are present', async ({ page }) => {
    await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /send/i })).toBeVisible();
  });
});

// --- Navigation ---
test.describe('Navigation', () => {
  test('navigates from home to about', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /about/i }).first().click();
    await expect(page).toHaveURL(/\/about/);
  });

  test('navigates from home to contact', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /contact/i }).first().click();
    await expect(page).toHaveURL(/\/contact/);
  });
});

// --- 404 page ---
test('shows 404 page for unknown routes', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist');
  expect(response?.status()).toBe(404);
});
