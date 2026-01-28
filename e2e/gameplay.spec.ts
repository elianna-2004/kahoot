import { test, expect } from '@playwright/test';

test.describe('Gameplay', () => {
  test('full round: host starts, player sees question and answers, leaderboard appears', async ({
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
    await playerPage.getByPlaceholder('Nickname').fill('Quizzer');
    await playerPage.getByRole('button', { name: /join/i }).click();
    await playerPage.waitForURL(/\/play\/g-/);
    await expect(playerPage.getByText(/you're in|waiting for the host/i)).toBeVisible({ timeout: 5000 });

    await hostPage.getByRole('button', { name: /start game/i }).click();

    await expect(playerPage.getByText(/question 1 of \d+/i)).toBeVisible({ timeout: 5000 });
    await expect(playerPage.getByText(/what is 2 \+ 2/i)).toBeVisible({ timeout: 5000 });
    await playerPage.getByRole('button').filter({ hasText: '4' }).click();

    await expect(playerPage.getByText(/correct|wrong/i)).toBeVisible({ timeout: 5000 });
    await expect(hostPage.getByRole('button', { name: /show leaderboard/i })).toBeVisible({ timeout: 3000 });
    await hostPage.getByRole('button', { name: /show leaderboard/i }).click();
    await expect(hostPage.getByText(/leaderboard/i)).toBeVisible({ timeout: 3000 });
    await expect(hostPage.getByText('Quizzer')).toBeVisible({ timeout: 3000 });

    await hostPage.getByRole('button', { name: /next question/i }).click();
    await expect(playerPage.getByText(/question 2 of \d+/i)).toBeVisible({ timeout: 5000 });

    await context.close();
  });

  test('host can run to game over and see final leaderboard', async ({ browser }) => {
    const context = await browser.newContext();
    const hostPage = await context.newPage();
    const playerPage = await context.newPage();

    await hostPage.goto('/');
    await hostPage.getByRole('link', { name: /host a game/i }).click();
    await hostPage.waitForURL(/\/host$/);
    await hostPage.getByRole('button', { name: /create game/i }).click();
    await hostPage.waitForURL(/\/host\/g-[^/]+\?code=/);
    const codeMatch = hostPage.url().match(/[?&]code=([A-Z0-9]+)/i);
    const gameCode = (codeMatch![1] || '').toUpperCase();

    await playerPage.goto('/play');
    await playerPage.getByPlaceholder(/e\.g\.|ABC123/i).fill(gameCode);
    await playerPage.getByPlaceholder('Nickname').fill('Finisher');
    await playerPage.getByRole('button', { name: /join/i }).click();
    await playerPage.waitForURL(/\/play\/g-/);

    await hostPage.getByRole('button', { name: /start game/i }).click();
    await expect(playerPage.getByText(/question 1 of/i)).toBeVisible({ timeout: 5000 });

    for (let i = 0; i < 5; i++) {
      const nextBtn = hostPage.getByRole('button', { name: /next question/i });
      await nextBtn.click();
      if (i < 4) {
        await hostPage.waitForTimeout(400);
      }
    }

    await expect(hostPage.getByText(/game over|final leaderboard/i)).toBeVisible({ timeout: 5000 });
    await expect(hostPage.getByText('Finisher')).toBeVisible({ timeout: 3000 });

    await context.close();
  });
});
