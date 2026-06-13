import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

async function createFirstBoard(page: Page, name: string) {
  await page.getByLabel('Board name').fill(name);
  await page.getByRole('button', { name: 'Create Board' }).click();
  await expect(page.locator('button[aria-haspopup="menu"]')).toContainText(name);
}

async function createBoardViaDropdown(page: Page, name: string) {
  await page.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('button', { name: '+ New Board' }).click();
  await page.getByLabel('New board name').fill(name);
  await page.keyboard.press('Enter');
  await expect(page.locator('button[aria-haspopup="menu"]')).toContainText(name);
}

test('rename a board via dropdown', async ({ page }) => {
  await createFirstBoard(page, 'Board One');

  await page.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Rename Board One' }).click();

  // Scope to input element — getByLabel also matches the rename icon button's aria-label
  const renameInput = page.locator('input[aria-label="Rename board"]');
  await renameInput.fill('Renamed Board');
  await renameInput.press('Enter');

  await expect(page.locator('button[aria-haspopup="menu"]')).toContainText('Renamed Board');
});

test('switch between boards via dropdown', async ({ page }) => {
  await createFirstBoard(page, 'Board One');
  await createBoardViaDropdown(page, 'Board Two');

  await page.locator('button[aria-haspopup="menu"]').click();
  await page.locator('[role="menuitem"][data-boardnav]', { hasText: 'Board One' }).click();

  await expect(page.locator('button[aria-haspopup="menu"]')).toContainText('Board One');
});

test('delete a board via dropdown', async ({ page }) => {
  await createFirstBoard(page, 'Board One');
  await createBoardViaDropdown(page, 'Board Two');

  // Switch to Board One so Board Two is inactive
  await page.locator('button[aria-haspopup="menu"]').click();
  await page.locator('[role="menuitem"][data-boardnav]', { hasText: 'Board One' }).click();

  // Open dropdown and delete Board Two
  await page.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Delete Board Two' }).click();

  // Dropdown closes after delete. Re-open and verify Board Two is gone.
  await page.locator('button[aria-haspopup="menu"]').click();
  await expect(page.getByRole('menuitem', { name: 'Board Two' })).not.toBeVisible();
});
