/* faccao-paleta-check.mjs — TODA TABELA DE COR DE FACÇÃO COBRE TODA FACÇÃO DO ELENCO.
   ═══════════════════════════════════════════════════════════════════════════════════
   O DEFEITO QUE COMPROU ESTA RÉGUA (07/08)

   O dono, jogando: *"o time é quando captura bandeira não pinta de vermelho e nem põe o
   brasão."* — e era literal. `bandeiraTextura('E')` devolvia `null` na primeira linha:

     brasoes.js:126   if (!cor || !BRASAO[fac]) return null;

   `BRASAO` tinha sido renomeado no rename Time E (06/08) — `P` virou `E`, e o arquivo
   `img/brasoes/e.png` existe. `COR_TIME`, três linhas acima, NÃO foi. Com `COR_TIME['E']`
   indefinido a função saía por `!cor`, o `_flagTexFor` caía no pano procedural, e a
   bandeira do time do jogador ficava sem cor E sem brasão — os dois sintomas de uma
   causa só, que é exatamente como o dono descreveu.

   E não era um lugar: o mesmo rename passou batido em mais DOIS espelhos, com sintoma
   diferente cada um, e nenhum deles dá erro no console —

     characters.js  TEAM_RIM       sem `E` -> contorno BRANCO nos 8 do elenco E (o `|| 0xffffff`)
     characters.js  faixa do peito sem `E` -> cai no último ramo do ternário e sai AZUL

   ── POR QUE A RÉGUA QUE JÁ EXISTIA NÃO PEGOU ────────────────────────────────────
   Pegava: o C3 do `tools/eval/brasao-check.mjs` compara `COR_TIME` com `_teamColor()` e
   teria acusado `E módulo — jogo — DIVERGE`. Só que ele precisa de Playwright, Chrome e
   um servidor de pé, então ele não está no `check:fast` e ninguém o roda por reflexo.
   Régua cara demais para o gatilho errado é régua que não roda. Esta aqui é node puro,
   lê texto de arquivo, roda em milissegundos e cabe no portão rápido.

   E o C3 tinha uma cegueira própria, consertada junto: o regex que extrai a paleta do
   `game.js` era `/f === '([PBUCF])'/` — sem o `E`. Depois do rename ele deixou de casar
   a facção do jogador, e o que sobrou foi comparar vazio com vazio.

   O QUE ELA MEDE
     F1 · toda facção declarada no elenco (`team: 'X'` de characters.js) tem entrada em
          CADA espelho de paleta declarado abaixo.
     F2 · o hex de `COR_TIME` bate com o de `_teamColor()` do game.js, facção a facção.

   A MUTAÇÃO QUE A DEIXA VERMELHA (as duas foram executadas)
     --mutar=sem-e        remove `E` de COR_TIME  -> F1 acusa o espelho, F2 acusa o hex
     --mutar=cor-errada   pinta E com a cor de U  -> F2 acusa a divergência

   USO
     node tools/eval/faccao-paleta-check.mjs
     node tools/eval/faccao-paleta-check.mjs --mutar=sem-e
   ═══════════════════════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';

const args = process.argv.slice(2);
const val = (k, d) => { const v = (args.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1]; return v === undefined ? d : v; };
const MUTAR = val('mutar', '');

const ler = (p) => fs.readFileSync(p, 'utf8');

/* ── A FONTE: quais facções o jogo REALMENTE tem ──────────────────────────────────
   Não é lista escrita aqui — é o elenco. Facção nova entra sozinha nesta régua no
   commit que declara o primeiro personagem dela, que é o momento em que os espelhos
   precisam saber dela. */
const elenco = [...ler('public/js/characters.js').matchAll(/team\s*:\s*'([A-Z])'/g)].map((m) => m[1]);
const FACCOES = [...new Set(elenco)].sort();

/* ── OS ESPELHOS: toda tabela que indexa por letra de facção ──────────────────────
   Lista humana de propósito (é decisão saber o que é espelho de paleta e o que é um
   dicionário qualquer), mas o CONTEÚDO de cada um é lido do fonte. */
const objeto = (arquivo, nome) => {
  const src = ler(arquivo);
  const m = new RegExp(`${nome}\\s*=\\s*\\{([^}]*)\\}`).exec(src);
  if (!m) return null;
  const out = {};
  for (const p of m[1].matchAll(/([A-Z])\s*:\s*(0x[0-9a-fA-F]{6}|'#[0-9a-fA-F]{6}')/g))
    out[p[1]] = p[2].replace(/'/g, '').replace(/^0x/, '#').toLowerCase();
  return out;
};

/* A faixa do peito é TERNÁRIO, não objeto: as letras que ela conhece são as que
   aparecem como `def.team === 'X'`. O ramo final é o `else`, e cair nele em silêncio
   é justamente o defeito (facção sem ramo sai azul sem ninguém reclamar). */
const ternario = (arquivo, ancora) => {
  const src = ler(arquivo);
  const i = src.indexOf(ancora);
  if (i < 0) return null;
  const bloco = src.slice(i, i + 400);
  const out = {};
  for (const p of bloco.matchAll(/def\.team === '([A-Z])'\s*\?\s*(0x[0-9a-fA-F]{6})/g))
    out[p[1]] = p[2].replace(/^0x/, '#').toLowerCase();
  return out;
};

const ESPELHOS = [
  { rotulo: 'COR_TIME (brasoes.js)', tabela: objeto('public/js/brasoes.js', 'COR_TIME'), hexBate: true },
  { rotulo: 'TEAM_RIM (characters.js)', tabela: objeto('public/js/characters.js', 'TEAM_RIM'), hexBate: false },
  /* `padrao` é o ramo ELSE do ternário, e ele é DECLARAÇÃO, não descoberta: a faixa azul
     do fim da linha é a de Tribos Urbanas. Sem isto a régua acusaria o U como faltando —
     vermelho que não corresponde a defeito, que é como se ensina a ignorar vermelho. */
  { rotulo: 'faixa do peito (characters.js)', tabela: ternario('public/js/characters.js', 'const band = def.team'), hexBate: false, padrao: 'U' },
];

/* ── A paleta do jogo. `_teamColor` é método de instância (depende de `_mirror` e
   `_factionOf`, que são estado de partida), então não há import possível: lê-se o
   texto. O `[A-Z]` no lugar da lista fechada é a correção da cegueira que o C3 do
   `brasao-check.mjs` tinha — lista de letras dentro do regex envelhece no rename. */
function paletaDoJogo() {
  const src = ler('public/js/game.js');
  const i = src.indexOf('_teamColor(side');
  const bloco = src.slice(i, i + 900);
  const out = {};
  for (const m of bloco.matchAll(/f === '([A-Z])'\)\s*return\s*dark\s*\?\s*'(#[0-9a-f]{6})'\s*:\s*'(#[0-9a-f]{6})'/g))
    out[m[1]] = m[3].toLowerCase();
  /* A primeira facção do bloco é a do `if` inicial, que não tem `f === ` na frente em
     todas as escritas; se o elenco tem letra que o bloco não devolveu, isso aparece
     como divergência em F2 — que é o comportamento certo, e não um furo silencioso. */
  return out;
}

const jogo = paletaDoJogo();

for (const e of ESPELHOS) {
  if (!e.tabela) continue;
  if (MUTAR === 'sem-e' && e.rotulo.startsWith('COR_TIME')) delete e.tabela.E;
  if (MUTAR === 'cor-errada' && e.rotulo.startsWith('COR_TIME')) e.tabela.E = '#4aa3ff';
}

console.log(`RÉGUA DA PALETA DE FACÇÃO${MUTAR ? `  [MUTAÇÃO: ${MUTAR}]` : ''}`);
console.log(`elenco declara ${FACCOES.length} facções: ${FACCOES.join(', ')}\n`);

let f1 = true;
console.log('F1 · toda facção do elenco tem entrada em cada espelho de paleta');
for (const e of ESPELHOS) {
  if (!e.tabela) { console.log(`   ${e.rotulo}  NÃO ENCONTRADO no fonte — a régua não sabe medir isto`); f1 = false; continue; }
  const faltam = FACCOES.filter((f) => !e.tabela[f] && f !== e.padrao);
  if (faltam.length) f1 = false;
  console.log(`   ${e.rotulo.padEnd(32)} ${faltam.length ? `FALTA ${faltam.join(', ')}` : 'ok'}`);
}
console.log(`   ${f1 ? 'PASSA' : 'FALHA'}\n`);

let f2 = true;
console.log('F2 · COR_TIME (brasoes.js) bate com _teamColor (game.js)');
const cor = ESPELHOS[0].tabela || {};
for (const f of FACCOES) {
  const meu = cor[f] || '', dele = jogo[f] || '';
  const ok = !!dele && meu === dele;
  if (!ok) f2 = false;
  console.log(`   ${f}  módulo ${meu || '—'}   jogo ${dele || '—'}   ${ok ? 'ok' : 'DIVERGE'}`);
}
console.log(`   ${f2 ? 'PASSA' : 'FALHA'}\n`);

const passou = f1 && f2;
console.log(passou ? '✓ FAC1  paleta de facção coerente nos espelhos' : '✗ FAC1  espelho de paleta desatualizado — bandeira/contorno/faixa saem errados SEM erro no console');
process.exit(passou ? 0 : 1);
