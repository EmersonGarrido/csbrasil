/* boot-check.mjs — O JOGO ABRE? É a régua mais barata e a mais cara de não ter.
   ═══════════════════════════════════════════════════════════════════════════════════
   O DEFEITO QUE COMPROU ESTA RÉGUA (07/08, achado EM PRODUÇÃO)

   `public/js/main.js` chamava `_pingPresenca()` no escopo do módulo na linha 483, e a
   função lê `testMode` na primeira linha — `const` declarado só na 498. `const` não é
   hoisted como `var`: a chamada lança

     ReferenceError: Cannot access 'testMode' before initialization

   **no escopo do módulo**, o que mata a avaliação inteira de `main.js` ali. Tudo depois
   da linha 483 nunca acontece — inclusive o `onclick` do `#btn-jogar` (linha ~779).
   Medido no navegador contra `www.csbrasil.online`: o botão JOGAR existia e era INERTE.
   O site respondia 200, o build passava, o `check:fast` inteiro passava, o `npm run
   syntax` passava (é erro de RUNTIME, não de sintaxe) — e ninguém conseguia jogar.

   ── POR QUE NENHUM PORTÃO EXISTENTE PEGOU ───────────────────────────────────────
   Todos mediam OUTRA coisa, e cada um com boa razão:
     · `syntax`      — parseia o módulo; TDZ não é erro de parse.
     · `eval:site`   — status HTTP e JSON-LD das 13 rotas; a `/` respondia 200 com o HTML
                       inteiro, porque o HTML não depende do JS ter avaliado.
     · `harness.mjs` — sobe a classe `Game` em node, importando `game.js` DIRETO. Ele
                       nunca passa por `main.js`, que é justamente a casca que liga o menu.
     · as capturas   — usam `/?debug=1&auto=1` ou importam módulos soltos.
   Faltava a pergunta mais boba de todas, e é sempre a mais boba que fica sem régua:
   **o main.js terminou de avaliar?**

   O QUE ELA MEDE (na rota REAL `/`, no navegador, com o Astro no ar)
     B1 · zero `pageerror` durante o boot.
     B2 · o `main.js` terminou de avaliar — prova pelo EFEITO, não pela ausência de erro:
          `#btn-jogar` tem `onclick`, que é atribuído lá embaixo no arquivo.

   A MUTAÇÃO QUE A DEIXA VERMELHA (executada)
     --mutante=tdz   injeta, no topo do main.js servido, uma leitura de `testMode` antes
                     da declaração — reproduz exatamente o defeito de 07/08. A mutação é
                     em MEMÓRIA (interceptação de rota), o arquivo em disco não é tocado.

   USO
     node tools/eval/boot-check.mjs                 # sobe o astro dev sozinho
     node tools/eval/boot-check.mjs --mutante=tdz   # prova que a régua morde
     BASE=https://www.csbrasil.online node tools/eval/boot-check.mjs   # alvo externo
   ═══════════════════════════════════════════════════════════════════════════════════ */
import { spawn, spawnSync, execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const val = (k, d) => { const v = (args.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1]; return v === undefined ? d : v; };
const MUTANTE = val('mutante', '');
const PORTA = Number(val('porta', 4321));
const EXTERNO = !!process.env.BASE;
const BASE = process.env.BASE || `http://localhost:${PORTA}`;

let subiuAqui = false;
async function noAr() {
  const fim = Date.now() + 90_000;
  while (Date.now() < fim) {
    try { const r = await fetch(BASE + '/robots.txt'); if (r.status) return true; } catch { /* ainda não */ }
    await new Promise((r) => setTimeout(r, 700));
  }
  return false;
}
async function sobeServidor() {
  if (EXTERNO) return true;
  try { if ((await fetch(BASE + '/robots.txt')).status) return true; } catch { /* não estava no ar */ }
  // mesmo padrão do site-smoke.mjs: o `astro dev` daemoniza, quem derruba é o `stop`.
  spawn('npx', ['astro', 'dev', '--port', String(PORTA)], { stdio: 'ignore', detached: false }).on('error', () => {});
  subiuAqui = true;
  return noAr();
}
function derrubaServidor() { if (subiuAqui) spawnSync('npx', ['astro', 'dev', 'stop'], { stdio: 'ignore' }); }

let browser;
try {
  if (!(await sobeServidor())) {
    console.error(`✗ BOOT0  o site não subiu em ${BASE} (90 s de espera)`);
    process.exit(1);
  }
  const gRoot = execSync('npm root -g').toString().trim();
  const _pw = await import(pathToFileURL(`${gRoot}/playwright/index.js`).href);
  const chromium = _pw.chromium || _pw.default?.chromium;
  browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--headless=new', '--mute-audio'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  /* A MUTAÇÃO. Reproduz o TDZ sem escrever no disco: intercepta o main.js e prega no topo
     uma leitura da mesma `const` que a função lia. `?v=` no caminho é por isso que o
     padrão é de sufixo. */
  if (MUTANTE === 'tdz') {
    await page.route('**/js/main.js*', async (rota) => {
      const r = await rota.fetch();
      const corpo = await r.text();
      await rota.fulfill({ status: 200, contentType: 'application/javascript', body: `void testMode;\n${corpo}` });
    });
  }

  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(3500);

  console.log(`RÉGUA DE BOOT${MUTANTE ? `  [MUTAÇÃO: ${MUTANTE}]` : ''}   alvo ${BASE}\n`);

  const b1 = erros.length === 0;
  console.log('B1 · zero pageerror durante o boot');
  if (b1) console.log('   nenhum');
  else for (const e of erros) console.log(`   ${e}`);
  console.log(`   ${b1 ? 'PASSA' : 'FALHA'}\n`);

  /* B2 mede o EFEITO e não a ausência de erro: `pageerror` engolido por um `catch` de
     terceiro deixaria B1 verde com o jogo morto do mesmo jeito. O `onclick` do JOGAR é
     atribuído perto do FIM do main.js — se ele está lá, o módulo avaliou inteiro. */
  const alvo = await page.evaluate(() => {
    const b = document.getElementById('btn-jogar');
    return { existe: !!b, ligado: !!(b && b.onclick) };
  });
  const b2 = alvo.existe && alvo.ligado;
  console.log('B2 · o main.js terminou de avaliar (o JOGAR está ligado)');
  console.log(`   #btn-jogar existe ${alvo.existe}   onclick ligado ${alvo.ligado}`);
  console.log(`   ${b2 ? 'PASSA' : 'FALHA'}\n`);

  const passou = b1 && b2;
  console.log(passou
    ? '✓ BOOT1  o jogo abre: sem erro de página e com o menu ligado'
    : '✗ BOOT1  O JOGO NÃO ABRE — main.js não terminou de avaliar; o botão JOGAR fica inerte');
  await browser.close(); browser = null;
  derrubaServidor();
  process.exit(passou ? 0 : 1);
} catch (e) {
  console.error('✗ BOOT0  a régua não conseguiu medir:', e.message);
  if (browser) await browser.close().catch(() => {});
  derrubaServidor();
  process.exit(1);
}
