import { test, expect } from '@playwright/test';

// RÉGUA VISUAL DE ASSETS — o caminho REAL (sem ?nav=1): o preload 3D do elenco
// precisa TERMINAR e os thumbs/preview serem GLBs renderizados, não caixas.
// É separada do web-smoke.spec.js (navegação rápida) porque o elenco no
// SwiftShader varia com a GPU do runner — o fluxo funcional não pode medir isso.
//
// Quando flaky por lentidão do runner: NÃO é defecto de navegação (a navegação
// tem régua própria e rápida) — é o preload/asset que variou. Por isso esse
// arquivo tem retry 1 (GPU compartilhada) e timeout generoso; o web-smoke (fluxo
// funcional) roda SEM retry — aí o vermelho é sempre defecto.

test.describe.configure({ retries: 1 });

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  testInfo.setTimeout(testInfo.timeout + 10_000);
  await page.screenshot({
    path: `test-results/${testInfo.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`,
    fullPage: true,
  });
});

test('preload 3D real do elenco termina e renderiza GLB na vitrine', async ({ page }, testInfo) => {
  test.slow();   // o preload real leva minutos no SwiftShader — generoso de propósito
  const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
  const t0 = Date.now();

  await page.goto(`${base}/?debug=1`);

  await expect(page.locator('#splash-enter')).toBeVisible({ timeout: 25_000 });
  await page.keyboard.press('Enter');
  await expect(page.locator('#boot-splash')).toHaveCount(0);

  await page.locator('.cs-item[data-act="sp"]').click();
  await page.locator('#btn-profile').click();
  await page.locator('#nick-input').fill('AssetBot');
  await page.locator('#profile-ok').click();
  await page.locator('#btn-jogar').click();
  await expect(page.locator('#team-select')).toBeVisible({ timeout: 30_000 });

  await page.locator('#btn-team-e').click();
  // caminho REAL: o overlay de preload some e o #char-select abre quando TODOS os
  // GLBs do roster entraram. Era aqui que o smoke antigo travava (3,6 min).
  await expect(page.locator('#char-select')).toBeVisible({ timeout: 360_000 });

  const ficha = await page.evaluate(() => ({
    rows: document.querySelectorAll('#char-list .char-row').length,
    // GLB de verdade entra no preview grande e marca data-glb no canvas (main.js
    // pvSetChar); o fallback procedural (showBox) nunca marca. É o EFEITO observável:
    // prova que o preload terminou e o modelo real renderizou, não a caixa.
    preview_glb: document.getElementById('char-preview')?.dataset.glb === '1',
    info_name: document.getElementById('char-info-name')?.textContent || '',
  }));
  await testInfo.attach('asset-check.json', {
    body: JSON.stringify({ ...ficha, total_ms: Date.now() - t0 }, null, 2),
    contentType: 'application/json',
  });
  console.log('ASSETS', JSON.stringify(ficha));

  expect(ficha.rows).toBeGreaterThan(0);
  expect(ficha.preview_glb).toBe(true);
  expect(ficha.info_name.length).toBeGreaterThan(0);

  // partida também abre com o caminho real (já com elenco/modelos batidos em cache)
  await page.locator('#char-confirm').click();
  await expect(page.locator('#team-select')).toHaveAttribute('data-step', 'enemy');
  await page.locator('#btn-team-b').click();
  await expect(page.locator('#hud')).toBeVisible({ timeout: 180_000 });
});