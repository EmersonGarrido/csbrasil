// G2-R2 (MENUS/UI): captura thumbnails quadrados REAIS dos mapas pro seletor de mapa.
// Entra numa partida debug por mapa, congela os bots, esconde HUD + viewmodel + racks de
// arma e tira screenshots 900x900 em VÁRIOS yaws (calibração — o melhor vira o asset).
// Saída: /tmp/gauntlet/g2ui-maps/<id>-y<yaw>.png → escolhido → public/img/map-previews/<id>.jpg
// Uso: node tools/eval/g2ui-map-previews.mjs [mapa1,mapa2] [yaw1,yaw2,...]
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const OUT = '/tmp/gauntlet/g2ui-maps';
const BASE = process.env.BASE || 'http://127.0.0.1:8123';
const LIST = (process.argv[2] || 'awp_map,praca_old,fy_pool_day,fy_havan,fy_ferrovelho').split(',');
const YAWS = (process.argv[3] || '-1.2,-0.6,0,0.6,1.2').split(',').map(Number);
const gRoot = execSync('npm root -g').toString().trim();
const _pw = await import(pathToFileURL(`${gRoot}/playwright/index.js`).href);
const chromium = _pw.chromium || _pw.default?.chromium;

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--headless=new', '--mute-audio'],
});
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
let errors = 0;
page.on('console', m => { if (m.type() === 'error') { errors++; console.error('[console-err]', m.text()); } });
page.on('pageerror', e => { errors++; console.error('[pageerror]', e.message); });

for (const mapId of LIST) {
  await page.goto(`${BASE}/?debug=1&auto=P,mst&map=${mapId}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game && window.__game.state === 'live', null, { timeout: 180000 });
  await page.addStyleTag({ content: '#hud{display:none!important}' });
  await page.evaluate(() => {
    const g = window.__game;
    for (const b of g.bots) { b.pos.set(0, -80, 0); b.hp = 1e9; }
    g.player.hp = 1e9;
    g.player.pitch = 0.03;
    if (g.vmScene) g.vmScene.visible = false;
    if (g.drops) for (const d of g.drops) d.mesh.visible = false;   // racks de arma fora do quadro
  });
  await page.waitForTimeout(700);
  for (const yaw of YAWS) {
    await page.evaluate((y) => {
      const g = window.__game;
      g.player.yaw = y; g.player.pitch = 0.03; g.player.vel?.set?.(0, 0, 0);
      if (g.vmScene) g.vmScene.visible = false;
    }, yaw);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${OUT}/${mapId}-y${yaw}.png` });
  }
  console.log('shot', mapId, YAWS.length + ' yaws');
}
console.log(errors ? `FALHOU: ${errors} erro(s) de console` : '0 erros de console');
await browser.close();
process.exit(errors ? 1 : 0);

