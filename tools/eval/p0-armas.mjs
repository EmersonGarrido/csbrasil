/* P0 — VERIFICACAO TECNICA da volta de armas (G3-R1 / pipeline MINT_VM).
   Por que este script existe: a regua nova (BAR-CONSISTENCIA.md) diz que uma melhoria
   visual que quebra o jogo e REGRESSAO. Entao aqui nao se avalia beleza: mede-se, arma a
   arma e nos DOIS aspectos (16:9 e 3:2), se (a) a arma aparece, (b) cai no quadrante
   inferior direito, (c) o cano fica PARALELO ao eixo de mira (o bug "miro no meio do mapa
   e a arma aponta pra baixo"), (d) no ADS da pra ver arma E mira, (e) a sniper tem luneta,
   (f) nenhuma mao fica solta no ar (erro do IK em metros).

   Estrategia de custo: carregar mapa sob SwiftShader custa ~4 min. Entao UMA sessao de
   browser POR ASPECTO, com o jogo PAUSADO e avancado a mao (window.__step), trocando a
   arma via window.__game. Nada de recarregar por arma.

   Uso: node tools/eval/p0-armas.mjs [outDir] [lista,de,armas]
*/
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const OUT = process.argv[2] || '/root/shots/p0';
const WLIST = (process.argv[3] || 'ak,awp,mp5,uzi,p90,deagle,revolver38,md97,svd,sks,knife').split(',');
const MAP = process.env.MAP || 'fy_ferrovelho';
const BASE = process.env.BASE || 'http://127.0.0.1:8123';
const ASPECTS = { '169': [1600, 900], '32': [1500, 1000] };
mkdirSync(OUT, { recursive: true });

const gRoot = execSync('npm root -g').toString().trim();
const _pw = await import(pathToFileURL(`${gRoot}/playwright/index.js`).href);
const chromium = _pw.chromium || _pw.default?.chromium;
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--headless=new', '--mute-audio', '--no-sandbox'],
});

// Os 3 404 de /audio/ sao conhecidos e nao contam como erro (instrucao da tarefa).
const isNoise = (t) => /\/audio\//.test(t) || (/404 \(Not Found\)/.test(t) && /Failed to load resource/.test(t));

const report = [];
const metrics = [];
const allErrs = [];

for (const [aName, [W, H]] of Object.entries(ASPECTS)) {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const errs = [];
  page.on('pageerror', (e) => errs.push('[pageerror] ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('[console] ' + m.text()); });
  const t0 = Date.now();
  let tLive = null;
  try {
    await page.goto(`${BASE}/?debug=1&map=${MAP}&auto=B,bozo`, { waitUntil: 'domcontentloaded', timeout: 240000 });
    await page.waitForFunction(() => window.__game && window.__game.state === 'live', null, { timeout: 900000 });
    tLive = (Date.now() - t0) / 1000;
    console.log(`[${aName}] live em ${tLive.toFixed(1)}s`);

    // Congela o jogo e instala o avanco manual. Motivo: sob SwiftShader o rAF roda a ~0.3
    // fps — sem controle de frame a captura pega poses no meio da interpolacao.
    await page.evaluate(() => {
      const g = window.__game;
      g.paused = true;
      window.__step = (n = 1, dt = 0.016) => { for (let i = 0; i < n; i++) { g.paused = false; g.update(dt); g.paused = true; } };
      // render puro (mesmo caminho do update: renderer.render esta "patchado" pelo bloom e
      // ja desenha a vmScene por cima). Usado pra tirar a referencia SEM a arma.
      window.__renderOnly = () => g.renderer.render(g.scene, g.camera);
      g.player.pitch = 0;
      g.player.vel.set(0, 0, 0);
      // Sonda geometrica: tudo em VIEW SPACE (a vmCamera fica na origem, identidade).
      window.__probe = (id) => {
        const g = window.__game, cam = g.vmCamera, mdl = g.vm.models[id];
        const anyV = g.vm.grip && (g.vm.grip[id] || g.vm.grip.ak);
        const V3 = anyV ? anyV.constructor : null;
        const r = {
          id, rootVisible: !!g.vm.root.visible, mdlVisible: !!(mdl && mdl.visible),
          meshes: 0, scopeMask: +(g._scopeMask || 0).toFixed(3), aimF: +(g._aimF || 0).toFixed(3),
          adsF: +((g.vm.adsF || 0)).toFixed(3), fov: +g.camera.fov.toFixed(2),
          scoped: !!g.player.scoped, hasScope: !!(g.WEAPONS ? g.WEAPONS[id] : null),
          crosshairDisplay: getComputedStyle(document.getElementById('crosshair')).display,
          scopeOn: document.getElementById('scope-overlay').classList.contains('on'),
          scopeOpacity: document.getElementById('scope-overlay').style.opacity || '',
          scopeDisplay: getComputedStyle(document.getElementById('scope-overlay')).display,
        };
        if (!mdl || !V3) return r;
        // bbox em NDC de TODAS as meshes efetivamente visiveis da arma
        let minx = 9, maxx = -9, miny = 9, maxy = -9, minz = 9, maxz = -9;
        mdl.updateWorldMatrix(true, true);
        mdl.traverse((o) => {
          if (!o.isMesh) return;
          for (let p = o; p; p = p.parent) if (!p.visible) return;
          if (!o.geometry) return;
          if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
          const bb = o.geometry.boundingBox; if (!bb) return;
          r.meshes++;
          for (let i = 0; i < 8; i++) {
            const v = new V3(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z);
            v.applyMatrix4(o.matrixWorld);
            minz = Math.min(minz, v.z); maxz = Math.max(maxz, v.z);
            const q = v.clone().project(cam);
            minx = Math.min(minx, q.x); maxx = Math.max(maxx, q.x);
            miny = Math.min(miny, q.y); maxy = Math.max(maxy, q.y);
          }
        });
        if (r.meshes) {
          r.ndc = [minx, miny, maxx, maxy].map((n) => +n.toFixed(3));
          r.ndcCenter = [+((minx + maxx) / 2).toFixed(3), +((miny + maxy) / 2).toFixed(3)];
          r.viewZ = [+minz.toFixed(3), +maxz.toFixed(3)];   // negativo = na frente da lente
        }
        // direcao do CANO: eixo +Z local do 'rw' em world(=view). O alvo e (0,0,-1).
        const rw = mdl.getObjectByName('rw');
        if (rw) {
          rw.updateWorldMatrix(true, false);
          const e = rw.matrixWorld.elements;
          const n = Math.hypot(e[8], e[9], e[10]) || 1;
          const d = [e[8] / n, e[9] / n, e[10] / n];
          r.barrel = d.map((n2) => +n2.toFixed(4));
          r.barrelDeg = +(Math.acos(Math.max(-1, Math.min(1, -d[2]))) * 180 / Math.PI).toFixed(2);
          // componente vertical isolada: >0 = cano apontando pra BAIXO na tela
          r.barrelDownDeg = +(Math.asin(Math.max(-1, Math.min(1, -d[1]))) * 180 / Math.PI).toFixed(2);
          const met = rw.userData && rw.userData.metrics;
          if (met && V3) {
            const mw = rw.localToWorld(met.muzzle.clone().divideScalar(met.norm || 1));
            r.muzzleView = [+mw.x.toFixed(3), +mw.y.toFixed(3), +mw.z.toFixed(3)];
            const mq = mw.clone().project(cam);
            r.muzzleNdc = [+mq.x.toFixed(3), +mq.y.toFixed(3)];
          }
        } else r.barrel = null;
        // MAOS: erro do IK em metros (efetor -> alvo). >0.05 m = mao visivelmente solta.
        const arms = g.vm.arms;
        if (arms && arms.gripError) {
          const ge = arms.gripError();
          r.gripErrR = ge.r == null ? null : +ge.r.toFixed(4);
          r.gripErrL = ge.l == null ? null : +ge.l.toFixed(4);
          r.armsVisible = !!arms.group.visible;
        } else r.armsVisible = null;
        return r;
      };
    });

    for (const w of WLIST) {
      await page.evaluate((wid) => {
        const g = window.__game;
        if (!g.player.ammo[wid]) g.player.ammo[wid] = { mag: 30, res: 90 };
        g._scope(false, true);
        g._switchWeapon(wid);
        g.player.drawUntil = 0; g.player.reloadUntil = 0;
        window.__step(8, 0.05);   // assenta o draw/spring antes de medir
      }, w);
      const hip = await page.evaluate((wid) => window.__probe(wid), w);
      await page.screenshot({ path: `${OUT}/${w}-${aName}-hip.png`, timeout: 120000 });
      // referencia SEM a arma: o diff em pixels prova onde a arma esta na tela
      await page.evaluate(() => { window.__game.vm.root.visible = false; window.__renderOnly(); });
      await page.screenshot({ path: `${OUT}/_ref/${w}-${aName}-hip.png`, timeout: 120000 });

      // ADS: ADS_T = 0.11 s, entao 0.5 s cobre a rampa inteira com folga
      await page.evaluate(() => { const g = window.__game; g.vm.root.visible = true; g._scope(true); window.__step(14, 0.04); });
      const ads = await page.evaluate((wid) => window.__probe(wid), w);
      await page.screenshot({ path: `${OUT}/${w}-${aName}-ads.png`, timeout: 120000 });
      await page.evaluate(() => { window.__game.vm.root.visible = false; window.__renderOnly(); });
      await page.screenshot({ path: `${OUT}/_ref/${w}-${aName}-ads.png`, timeout: 120000 });
      await page.evaluate(() => { const g = window.__game; g.vm.root.visible = true; g._scope(false, true); window.__step(8, 0.05); });

      report.push({ aspect: aName, w, hip, ads });
      writeFileSync(`${OUT}/_probe.json`, JSON.stringify(report, null, 2));
      console.log(`  [${aName}] ${w} hip ndc=${hip.ndc} barrel=${hip.barrelDeg}deg | ads mask=${ads.scopeMask} ch=${ads.crosshairDisplay} vm=${ads.rootVisible}`);
    }

    const m = await page.evaluate(() => {
      const g = window.__game, i = g.renderer.info;
      return {
        calls: i.render.calls, tris: i.render.triangles, textures: i.memory.textures,
        geometries: i.memory.geometries, programs: i.programs ? i.programs.length : null,
        heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null,
        state: g.state,
      };
    });
    metrics.push({ map: MAP, aspect: aName, tLive, ...m });
  } catch (e) {
    errs.push('[fatal] ' + e.message.split('\n')[0]);
    metrics.push({ map: MAP, aspect: aName, tLive, fatal: e.message.split('\n')[0] });
  }
  const real = errs.filter((t) => !isNoise(t));
  allErrs.push({ aspect: aName, total: errs.length, ruido: errs.length - real.length, reais: real });
  writeFileSync(`${OUT}/_metrics.json`, JSON.stringify(metrics, null, 2));
  writeFileSync(`${OUT}/_errs.json`, JSON.stringify(allErrs, null, 2));
  await page.close();
}
writeFileSync(`${OUT}/_probe.json`, JSON.stringify(report, null, 2));
console.log('METRICS', JSON.stringify(metrics));
console.log('ERRS', JSON.stringify(allErrs));
await browser.close();
