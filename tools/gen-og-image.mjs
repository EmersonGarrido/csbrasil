#!/usr/bin/env node
// ============================================================================
// gen-og-image.mjs — gera public/og-image.png (og:image do site, 1200×630).
// ----------------------------------------------------------------------------
// POR QUE EXISTE: a og:image era arte de IA da era v1 com texto rasterizado —
// gerador de imagem erra texto, e a versão/estatísticas ficam congeladas. Aqui
// o FUNDO é uma arte real do jogo (o mural hiper-realista da Quebrada, gerado
// no Mint em 06/08) e o TEXTO é desenhado pelo resvg com a DejaVu embutida —
// então a marca sai sempre certa e regerar é um comando.
//
// USO: node tools/gen-og-image.mjs
// Fonte da arte: public/posters/mural-leste-vive.jpg (trocar o fundo = trocar
// FUNDO abaixo). A fonte é lida de src/lib/font-data.ts por REGEX (o literal de
// 996 KB estoura o parser de TS — ver tools/eval/og-check.mjs, mesmo truque).
// ============================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { initWasm, Resvg } from '@resvg/resvg-wasm';

const FUNDO = 'public/posters/mural-leste-vive.jpg';
const SAIDA = 'public/og-image.png';

const require = createRequire(import.meta.url);
let wasmPath = null;
for (const c of ['@resvg/resvg-wasm/index_bg.wasm', '@resvg/resvg-wasm/dist/index_bg.wasm']) {
  try { wasmPath = require.resolve(c); break; } catch { /* próximo */ }
}
if (!wasmPath) { console.error('resvg.wasm não encontrado'); process.exit(1); }
await initWasm(readFileSync(wasmPath));

const src = readFileSync(new URL('../src/lib/font-data.ts', import.meta.url), 'utf8');
const i = src.indexOf('FONT_BOLD_B64');
const b64 = (src.slice(i).match(/'[A-Za-z0-9+/=]*'/g) || []).map((p) => p.slice(1, -1)).join('');
const fonte = Buffer.from(b64, 'base64');
if (fonte.length < 200_000) { console.error('fonte truncada'); process.exit(1); }

const img = readFileSync(FUNDO).toString('base64');
const W = 1200, H = 630;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <image xlink:href="data:image/jpeg;base64,${img}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>
  <rect width="${W}" height="8" fill="#e03232"/><rect y="${H - 8}" width="${W}" height="8" fill="#1faa4d"/>
  <rect width="${W}" height="${H}" fill="url(#fade)"/>
  <defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0.45" stop-color="#0c0e11" stop-opacity="0"/>
    <stop offset="1" stop-color="#0c0e11" stop-opacity="0.88"/>
  </linearGradient></defs>
  <rect x="56" y="434" width="8" height="64" fill="#ffd23f"/>
  <text x="80" y="492" font-size="64" font-weight="bold" fill="#f2ead8" font-family="DejaVu Sans" letter-spacing="2">CORO SOLTO</text>
  <text x="80" y="534" font-size="30" font-weight="bold" fill="#ffd23f" font-family="DejaVu Sans" letter-spacing="10">TRETA SUPREMA</text>
  <text x="80" y="572" font-size="19" fill="#e8e2d0" font-family="DejaVu Sans">FPS grátis de navegador · estilo CS 1.6 · sem instalação</text>
  <text x="80" y="600" font-size="17" fill="#8a8064" font-family="DejaVu Sans">5 facções · 44 personagens · 5 mapas · 26 armas · csbrasil.online</text>
</svg>`;

const png = new Resvg(svg, {
  font: { fontBuffers: [fonte], loadSystemFonts: false, defaultFontFamily: 'DejaVu Sans' },
}).render().asPng();
writeFileSync(SAIDA, png);
// o PNG sai pesado (~1,6 MB) — converter pra JPEG depois:
//   sips -s format jpeg -s formatOptions 85 public/og-image.png --out public/og-image.jpg
//   cp public/og-image.jpg docs/static/img/og-image.jpg   (a doc usa a mesma capa)
console.log(`✓ ${SAIDA} — ${Math.round(png.length / 1024)} KB, fundo ${FUNDO} (converter pra .jpg, ver o rodapé do script)`);
