import { test, expect } from '@playwright/test';

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  testInfo.setTimeout(testInfo.timeout + 10_000);
  await page.screenshot({
    path: `test-results/${testInfo.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`,
    fullPage: true,
  });
});

test('menu, ranking, setup, teams, character and initial hud boot', async ({ page }) => {
  const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
  await page.goto(`${base}/?debug=1`);

  await expect(page.locator('#splash-enter')).toBeVisible({ timeout: 25_000 });
  await page.keyboard.press('Enter');
  await expect(page.locator('#boot-splash')).toHaveCount(0);

  await expect(page.locator('#main-menu')).toBeVisible();

  await page.locator('.cs-item[data-act="ranking"]').click();
  await expect(page.locator('#ranking-panel')).toBeVisible();
  await page.locator('#ranking-back').click();
  await expect(page.locator('#main-menu')).toBeVisible();

  await page.locator('.cs-item[data-act="sp"]').click();
  await expect(page.locator('#menu-setup')).toHaveClass(/open/);
  await page.locator('#btn-profile').click();
  await page.locator('#nick-input').fill('SmokeBot');
  await page.locator('#profile-ok').click();
  await page.locator('#btn-jogar').click();
  await expect(page.locator('#team-select')).toBeVisible();

  await page.locator('#btn-team-e').click();
  await expect(page.locator('#char-select')).toBeVisible();
  const characters = page.locator('#char-list .char-row');
  await expect(characters.first()).toBeVisible();

  await page.locator('#char-confirm').click();
  await expect(page.locator('#team-select')).toHaveAttribute('data-step', 'enemy');
  await page.locator('#btn-team-b').click();

  await expect(page.locator('#hud')).toBeVisible({ timeout: 60_000 });
});
