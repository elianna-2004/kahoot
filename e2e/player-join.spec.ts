import { test, expect } from '@playwright/test';

test.describe('Player join', () => {
  test('host creates game and sees lobby with PIN; player joins with PIN and sees "You\'re in!"', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const hostPage = await context.newPage();
    const playerPage = await context.newPage();

    await hostPage.goto('/');
    await hostPage.getByRole('link', { name: /host a game/i }).click();
    await hostPage.waitForURL(/\/host$/);
    await hostPage.getByRole('button', { name: /create game/i }).click();
    await hostPage.waitForURL(/\/host\/g-[^/]+\?code=/);
    const hostUrl = hostPage.url();
    const codeMatch = hostUrl.match(/[?&]code=([A-Z0-9]+)/i);
    expect(codeMatch).toBeTruthy();
    const gameCode = codeMatch![1].toUpperCase();

    await playerPage.goto('/play');
    await playerPage.getByPlaceholder(/e\.g\.|ABC123/i).fill(gameCode);
    await playerPage.getByPlaceholder('Nickname').fill('TestPlayer');
    await playerPage.getByRole('button', { name: /join/i }).click();
    await playerPage.waitForURL(/\/play\/g-/);

    await expect(playerPage.getByText(/you're in|waiting for the host/i)).toBeVisible({ timeout: 5000 });
    await expect(hostPage.getByText(gameCode)).toBeVisible();
    await expect(hostPage.getByText('TestPlayer')).toBeVisible({ timeout: 5000 });

    await context.close();
  });

  test('join with wrong code shows error', async ({ page }) => {
    await page.goto('/play');
    await page.getByPlaceholder(/e\.g\.|ABC123/i).fill('WRONG1');
    await page.getByPlaceholder('Nickname').fill('Nobody');
    await page.getByRole('button', { name: /join/i }).click();
    await expect(page.getByText(/not found|game not found/i)).toBeVisible({ timeout: 5000 });
    await expect(page).not.toHaveURL(/\/play\/g-/);
  });
});
