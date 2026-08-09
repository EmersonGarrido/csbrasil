/* ============================================================================
   poster-aspect-check.mjs — O ASPECTO DECLARADO DE CADA CARTAZ BATE COM O ARQUIVO?
   ----------------------------------------------------------------------------
   POR QUE EXISTE (defeito relatado pelo dono, issue #79)
     "O aspecto declarado de 6 cartazes está errado (arte esticada na parede)."

   CAUSA RAIZ
   `public/js/textures.js`, lista `POSTER_FILES`, declara a proporção largura/altura
   de cada cartaz À MÃO — `['arquivo.jpg', 0.72]`. Esse número decide o tamanho do
   quad na parede. Se não bate com o arquivo, a arte sai ESTICADA ou ACHATADA, e
   ninguém percebe lendo o código: `0.72` parece tão plausível quanto `1.02`. Cinco
   dos seis errados eram exatamente `0.72` — o valor que alguém repetiu ao colar a
   linha.

   COMO ELE MEDE (e por que não é olho)
   Lê a proporção REAL de cada arquivo em `public/posters/` (dimensões do próprio
   pixel, via sharp), lê a DECLARADA recortando o `POSTER_FILES` de textures.js, e
   reprova quando divergem além do teto.

   O TETO É 6% — e o porquê está medido, não é número mágico:
   o maior desvio LEGÍTIMO da tela hoje é 4,0% (`ashtar-meme.jpg`, JPEG de acervo com
   borda irregular). 2% reprovaria essa borda honesta; 6% dá folga para o recorte de
   acervo sem deixar passar os esticados de 17% a 86% que a issue #79 pegou.

   MUTAÇÃO (regra da casa: régua que não morde não existe)
     node tools/eval/poster-aspect-check.mjs --mutate
   estraga UM aspecto declarado de propósito e exige que o teste FIQUE VERMELHO. Se a
   mutação passar, o arnês sai 1 denunciando a si mesmo.

   Uso: node tools/eval/poster-aspect-check.mjs [--mutate] [--json]
   ============================================================================ */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const POSTERS = path.join(ROOT, 'public', 'posters');
const MUTATE = process.argv.includes('--mutate');
const JSON_OUT = process.argv.includes('--json');

const TOL = 0.06; // ver cabeçalho: 6% cobre a borda de acervo (máx. legítimo 4,0%)

/** Recorta os pares [arquivo, aspecto declarado] do bloco POSTER_FILES de textures.js. */
function lerDeclarados() {
  const src = readFileSync(path.join(ROOT, 'public', 'js', 'textures.js'), 'utf8');
  const ini = src.indexOf('const POSTER_FILES');
  const fim = src.indexOf('];', ini);
  const bloco = src.slice(ini, fim);
  const pares = [...bloco.matchAll(/\[\s*['"]([^'"]+)['"]\s*,\s*([0-9.]+)/g)];
  const mapa = new Map();
  for (const m of pares) if (!mapa.has(m[1])) mapa.set(m[1], parseFloat(m[2]));
  return mapa;
}

async function medir(mapa) {
  const linhas = [];
  for (const [arquivo, decl] of mapa) {
    const fp = path.join(POSTERS, arquivo);
    if (!existsSync(fp)) { linhas.push({ arquivo, decl, erro: 'arquivo ausente' }); continue; }
    const { width, height } = await sharp(fp).metadata();
    const real = width / height;
    const desvio = Math.abs(real - decl) / decl;
    linhas.push({ arquivo, decl, real, width, height, desvio, fora: desvio > TOL });
  }
  return linhas;
}

const mapa = lerDeclarados();

if (MUTATE) {
  // Estraga um número declarado (o primeiro cartaz) e exige que a régua o pegue.
  const [primeiro] = mapa.keys();
  mapa.set(primeiro, mapa.get(primeiro) * 1.5);
  const linhas = await medir(mapa);
  const pego = linhas.find((l) => l.arquivo === primeiro)?.fora === true;
  if (pego) {
    console.log(`✓ mutação PEGA: '${primeiro}' declarado 1.5× foi reprovado — a régua morde.`);
    process.exit(0);
  }
  console.error(`✗ mutação PASSOU: '${primeiro}' declarado 1.5× não foi pego. Régua cega.`);
  process.exit(1);
}

const linhas = await medir(mapa);
const fora = linhas.filter((l) => l.fora || l.erro);

if (JSON_OUT) {
  console.log(JSON.stringify({ tol: TOL, total: linhas.length, fora: fora.length, linhas }, null, 2));
  process.exit(fora.length ? 1 : 0);
}

for (const l of fora) {
  if (l.erro) { console.error(`✗ ${l.arquivo}: ${l.erro}`); continue; }
  console.error(
    `✗ ${l.arquivo}: declarado ${l.decl.toFixed(3)}, real ${l.real.toFixed(3)} ` +
    `(${l.width}×${l.height}, desvio ${(l.desvio * 100).toFixed(0)}%)`,
  );
}

if (fora.length) {
  console.error(`\n${fora.length}/${linhas.length} cartazes com aspecto errado (teto ${TOL * 100}%).`);
  process.exit(1);
}
console.log(`✓ ${linhas.length} cartazes com aspecto declarado dentro de ${TOL * 100}% do arquivo.`);
