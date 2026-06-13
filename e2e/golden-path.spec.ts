import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('create a board, add a card, card appears on canvas', async ({ page }) => {
  // Arrive at NoBoardsState
  await expect(
    page.getByRole('heading', { name: /create your first board/i })
  ).toBeVisible();

  // Create board
  await page.getByLabel('Board name').fill('My Board');
  await page.getByRole('button', { name: 'Create Board' }).click();

  // Board name appears in header selector
  await expect(page.locator('button[aria-haspopup="menu"]')).toContainText('My Board');

  // Open Add Card modal
  await page.getByRole('button', { name: 'Add card', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  // Fill YouTube URL and submit
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('YouTube URL').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await dialog.getByRole('button', { name: 'Add Card' }).click();

  // Modal closes and card iframe appears
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByTitle(/youtube/i)).toBeVisible();
});
