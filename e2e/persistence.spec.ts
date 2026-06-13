import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('board name and card survive a page reload', async ({ page }) => {
  // Create board
  await page.getByLabel('Board name').fill('Persist Board');
  await page.getByRole('button', { name: 'Create Board' }).click();
  await expect(page.locator('button[aria-haspopup="menu"]')).toContainText('Persist Board');

  // Add card
  await page.getByRole('button', { name: 'Add card', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('YouTube URL').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await dialog.getByRole('button', { name: 'Add Card' }).click();
  await expect(page.getByTitle(/youtube/i)).toBeVisible();

  // Reload
  await page.reload();

  // Board and card should still be present
  await expect(page.locator('button[aria-haspopup="menu"]')).toContainText('Persist Board');
  await expect(page.getByTitle(/youtube/i)).toBeVisible();
});
