// GAUNTLET LOOP — bateria de capturas (menu + in-game em todos os mapas, 2 aspectos).
// Uso: node tools/eval/gl-shots.mjs <outDir> [set]   set = menu|game|all
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const OUT = process.argv[2] || '/root/shots/base';
const SET = process.argv[3] || 'all';
const BASE = process.env.BASE || 'http://127.0.0.1:8123';
mkdirSync(OUT, { recursive: true });
const gRoot = execSync('npm root -g').toString().trim();
const _pw = await import(pathToFileURL(`${gRoot}/playwright/index.js`).href);
const chromium = _pw.chromium || _pw.default?.chromium;
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--headless=new', '--mute-audio', '--no-sandbox'],
});
const log = [];
const ASPECTS = { '169': [1600, 900], '32': [1500, 1000] };

async function menuShots() {
  const [W, H] = ASPECTS['169'];
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', e => log.push('[pageerror] ' + e.message));
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${OUT}/menu-00-splash.png` });
  await page.mouse.click(W / 2, H / 2);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/menu-01-main.png` });
  // navega pelas telas via API do DOM (botões)
  const ids = await page.evaluate(() => [...document.querySelectorAll('button,[id]')].map(e => e.id).filter(Boolean));
  writeFileSync(`${OUT}/_dom-ids.txt`, ids.join('\n'));
  // o menu CS roteia por data-act nos .cs-item (btn-* legados estão em .side-actions.hidden)
  for (const [act, name] of [['sp', 'menu-02-setup'], ['ctf', 'menu-07-ctf'], ['config', 'menu-04-settings'], ['ranking', 'menu-06-ranking'], ['sobre', 'menu-05-howto']]) {
    try {
      await page.evaluate(() => { document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden')); document.getElementById('main-menu').classList.remove('hidden'); });
      await page.click(`.cs-item[data-act="${act}"]`, { timeout: 6000 });
      await page.waitForTimeout(1400);
      await page.screenshot({ path: `${OUT}/${name}.png`, timeout: 60000 });
    } catch (e) { log.push(`[menu ${act}] ${e.message.split('\n')[0]}`); }
  }
  // time e personagem (telas do fluxo, forçadas via DOM)
  for (const [id, name] of [['team-select', 'menu-08-team'], ['char-select', 'menu-03-char']]) {
    try {
      await page.evaluate((i) => { document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden')); document.getElementById(i).classList.remove('hidden'); }, id);
      await page.waitForTimeout(1400);
      await page.screenshot({ path: `${OUT}/${name}.png`, timeout: 60000 });
    } catch (e) { log.push(`[${id}] ${e.message.split('\n')[0]}`); }
  }
  await page.close();
}

const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const MAPS = [
  ['awp_map', 'P,mst'],
  ['fy_pool_day', 'P,mst'],
  ['fy_havan', 'B,bozo'],
  ['fy_ferrovelho', 'B,bozo'],
];

async function gameShots() {
  for (const [map, auto] of MAPS.filter(x => !ONLY || ONLY.includes(x[0]))) {
    for (const [aName, [W, H]] of Object.entries(ASPECTS)) {
      const page = await browser.newPage({ viewport: { width: W, height: H } });
      const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      try {
        await page.goto(`${BASE}/?debug=1&map=${map}&auto=${auto}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
        await page.waitForFunction(() => window.__game && window.__game.state === 'live', null, { timeout: 900000 });
        await page.waitForTimeout(6000);
        await page.screenshot({ path: `${OUT}/game-${map}-${aName}-a.png` });
        // olha em volta: 3 yaws
        for (let i = 1; i <= 3; i++) {
          await page.evaluate((k) => { const g = window.__game; if (g && g.player) { g.player.yaw = (g.player.yaw || 0) + k * 1.6; } }, i);
          await page.waitForTimeout(1500);
          await page.screenshot({ path: `${OUT}/game-${map}-${aName}-${'bcd'[i - 1]}.png` });
        }
      } catch (e) { errs.push('[fatal] ' + e.message.split('\n')[0]); }
      if (errs.length) log.push(`[${map} ${aName}] ` + errs.slice(0, 6).join(' | '));
      await page.close();
    }
  }
}

if (SET === 'menu' || SET === 'all') await menuShots();
if (SET === 'game' || SET === 'all') await gameShots();
writeFileSync(`${OUT}/_log.txt`, log.join('\n') || 'sem erros');
console.log(log.join('\n') || 'sem erros');
await browser.close();
