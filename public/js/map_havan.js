// Havan (fy_havan) — CTF, v2: estacionamento MAIOR (76×116, 40+ vagas, 34 modelos de carro)
// e texturas ricas (asfalto c/ óleo+rachadura, azul Havan c/ sujeira). G2-R3: fachada
// GRECO-ROMANA (frontão c/ logo, colunata, cornija, banners) como skin sobre a estrutura.
// Bolsonaristas spawnam
// DENTRO da loja (gôndolas, caixas, mezanino-sniper, porta com sensor); o outro time spawna
// no ESTACIONAMENTO (carros GLB texturizados + Estátua da Liberdade). 3 bandeiras:
// estacionamento, estátua, gôndolas. Contrato buildWorld + A*. Props de /Users/ruben/glb.
import * as THREE from 'three';
import { placeProp, PropBatch, StaticBatch, PROP_BATCH } from './mapprops.js';
import { VAO_BANDS, aoBoxGeo, aoMatFactory, ContactSkirt, BASE_FLOATING, onGround } from './vao.js';
import { makeAerialFog } from './bloom.js';   // névoa exponencial + cor por direção do olhar

const HALF_X = 38, HALF_Z = 58;
// Carros do estacionamento (ids otimizados em public/models/props). Forte cara BR.
export const HAVAN_PROPS = [
  'statue_liberty', 'shopping_cart',
  '1968_volkswagen_beetle', '1969_dodge_charger_rt', '1976_volkswagen_golf_gti_mk1',
  '1986_ford_escort_xr3', '1989_ford_fiesta_xr2i_mk3', '1999_volkswagen_gol_2000_gti_g2',
  '2006_chevrolet_cobalt_lt', '2006_hyundai_sonata', 'car_a', 'dirty_lada_lowpoly_from_scan',
  'jeep_cherokee', 'peugeot_3008', 'reliant_k_car', 'small_price_car', 'fiat_toro',
  '2021_nissan_kicks', 'fiat_uno', 'peugeot_405',
  // v2: +16 modelos (sedãs, hatches, esportivos, picapes)
  '1965_ford_mustang_coupe_289', '1981_dmc_delorean', '1999_mercedes_benz_s600',
  '2002_volkswagen_golf_r32_mk4', '2014_mini_cooper_s_f56', '2015_nissan_versa_sedan_1.6',
  '2017_kia_picanto_gt-line', '2019_ford_fiesta_st', '2020_bmw_m8_coupe',
  '2020_nissan_sentra_sylphy', '2021_volkswagen_polo_plus', '2022_chevrolet_tracker_rs_335t',
  '2023_nissan_altima__teana', '2023_toyota_rav4_hybrid', 'old_vw_bug', 'uno_mille',
  // v3: carros BR Mint estilizados (kombi/opala/chevette/brasília/saveiro/fusca/CG/ônibus)
  'kombi', 'opala', 'chevette', 'brasilia_vw', 'saveiro', 'fusca', 'moto_cg', 'onibus_urbano',
  // v3: mobília da loja Mint (gôndolas cheias, caixas, eletro, roupas)
  'gondola_mercado', 'gondola_eletro', 'arara_roupas', 'caixa_cobranca', 'painel_tvs', 'manequim',
];
const CARS = HAVAN_PROPS.filter(id => !['statue_liberty', 'shopping_cart', 'onibus_urbano',
  'gondola_mercado', 'gondola_eletro', 'arara_roupas', 'caixa_cobranca', 'painel_tvs', 'manequim'].includes(id));
// modelos Mint BR com o comprimento no eixo X — giram 90° pra alinhar na vaga
const RY_FIX = { brasilia_vw: Math.PI / 2, saveiro: Math.PI / 2, moto_cg: Math.PI / 2 };

// Seleção de carros POR PARTIDA (peso: 12 modelos leves ≈ 8MB em vez de 81MB).
// A seed é setada no startGame (main.js) ANTES do preload — menu e jogo veem a mesma seleção.
// HEAVY = >1.5MB mesmo após otimização — ficam fora da rotação (e são os sedãs internacionais;
// os leves são justamente os de cara mais BR: fusca, uno, gol, cobalt, towner...).
const HEAVY = new Set(['1965_ford_mustang_coupe_289', '1981_dmc_delorean', '2015_nissan_versa_sedan_1.6',
  '2017_kia_picanto_gt-line', '2019_ford_fiesta_st', '2021_volkswagen_polo_plus', '2022_chevrolet_tracker_rs_335t',
  '2023_nissan_altima__teana', '2023_toyota_rav4_hybrid', 'old_vw_bug', 'uno_mille', '2020_bmw_m8_coupe']);
const LIGHT_CARS = CARS.filter(id => !HEAVY.has(id));
// carros BR Mint SEMPRE entram na partida (a "cara brasileira"); o resto sorteia dos leves
const MINT_BR = ['kombi', 'opala', 'chevette', 'brasilia_vw', 'saveiro', 'fusca', 'moto_cg'];
/* ===== CUSTO DE GPU POR MODELO (rodada 3) =====
   O filtro HEAVY acima e de BYTES (tempo de download). O que estourou a regua foi outra
   coisa: TRIANGULO e NUMERO DE MATERIAIS. Medido nos .glb (tools/eval/glbinfo):
   um `2006_hyundai_sonata` tem 13,7 k tris em 12 materiais; um `jeep_cherokee` tem
   1,4 k tris em 1 material — e no patio, a 20 m, os dois lem como "um carro na vaga".
   Com 59 vagas ocupadas, trocar a rotacao pelos modelos baratos derrubou os carros de
   ~510 k para ~200 k triangulos SEM tirar um carro do estacionamento e mantendo os
   mesmos 12 modelos distintos por partida.
   [triangulos, materiais] — materiais viram draw calls depois do instancing. */
const CAR_COST = {
  jeep_cherokee: [1376, 1], dirty_lada_lowpoly_from_scan: [1716, 1], reliant_k_car: [2034, 1],
  kombi: [2797, 1], fusca: [2854, 1], chevette: [2872, 1], opala: [2891, 1], brasilia_vw: [2894, 1],
  saveiro: [2904, 1], moto_cg: [3369, 1],
  '2006_chevrolet_cobalt_lt': [7009, 15], small_price_car: [7353, 17],
  '1969_dodge_charger_rt': [9672, 29], '1999_volkswagen_gol_2000_gti_g2': [10627, 13],
  '1968_volkswagen_beetle': [10732, 13], '1976_volkswagen_golf_gti_mk1': [11256, 24],
  '2002_volkswagen_golf_r32_mk4': [11342, 12], '1989_ford_fiesta_xr2i_mk3': [12957, 19],
  '2006_hyundai_sonata': [13686, 12], fiat_toro: [14661, 18], '1986_ford_escort_xr3': [15121, 15],
  peugeot_3008: [16461, 25], '2021_nissan_kicks': [16943, 12], peugeot_405: [20177, 17],
  fiat_uno: [22553, 26], car_a: [27142, 2],
};
// 1 material ≈ 1 draw call no passe principal + 1 na sombra; 8 k tris ≈ o mesmo peso.
const carCost = (id) => { const c = CAR_COST[id]; return c ? c[1] * 8 + c[0] / 1000 : 200; };
const carTris = (id) => (CAR_COST[id] ? CAR_COST[id][0] : 20000);
const EXTRA_TRI_BUDGET = 26000;   // teto de triangulos para os 5 modelos sorteados
let _carSeed = 1;
export function setHavanCarSeed(s) { _carSeed = (s | 0) || 1; }
export function havanCarSelection(n = 12) {
  // candidatos ordenados por CUSTO (nao mais sorteio uniforme na lista inteira): o sorteio
  // antigo podia trazer 5 sedas de 20 k tris e 25 materiais cada e dobrar o custo do mapa.
  const arr = LIGHT_CARS.filter(id => !MINT_BR.includes(id)).sort((a, b) => carCost(a) - carCost(b));
  const pool = arr.slice(0, 8);             // janela dos 8 mais baratos: ainda ha variedade
  let s = _carSeed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const out = [...MINT_BR];
  let tri = 0;
  const want = Math.max(n, MINT_BR.length);
  while (out.length < want && pool.length) {
    const i = (rnd() * pool.length) | 0, id = pool[i];
    pool.splice(i, 1);
    if (tri + carTris(id) > EXTRA_TRI_BUDGET) continue;   // estourou o teto: pula esse modelo
    tri += carTris(id); out.push(id);
  }
  // se o teto barrou demais, completa com os mais baratos que sobraram (sem estourar de novo)
  for (const id of arr) { if (out.length >= want) break; if (!out.includes(id) && tri + carTris(id) <= EXTRA_TRI_BUDGET * 1.35) { tri += carTris(id); out.push(id); } }
  return out;
}
// props p/ preload da partida atual (maps.js consome via getter)
const STORE_PROPS = ['gondola_mercado', 'gondola_eletro', 'arara_roupas', 'caixa_cobranca', 'painel_tvs', 'manequim', 'onibus_urbano'];
export function havanPropsForMatch() { return ['statue_liberty', 'shopping_cart', ...STORE_PROPS, ...havanCarSelection()]; }

function tileTex(base, line, n, rx, rz) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 128, 128); x.strokeStyle = line; x.lineWidth = 3;
  const s = 128 / n; for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s, 128); x.stroke(); x.beginPath(); x.moveTo(0, i * s); x.lineTo(128, i * s); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, rz); return t;
}
// textura rica: manchas + rachaduras + pontos (asfalto/concreto pintado, sem cara de low-poly)
function noiseTex(base, blotches, rx, rz, opts = {}) {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  let seed = opts.seed || 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const [color, n, rMin, rMax, alpha] of blotches) {
    x.fillStyle = color;
    for (let i = 0; i < n; i++) {
      x.globalAlpha = alpha * (0.5 + rnd() * 0.5);
      const r = rMin + rnd() * (rMax - rMin);
      x.beginPath(); x.ellipse(rnd() * S, rnd() * S, r, r * (0.4 + rnd() * 0.8), rnd() * Math.PI, 0, Math.PI * 2); x.fill();
    }
  }
  if (opts.cracks) {
    x.strokeStyle = opts.cracks; x.globalAlpha = 0.35; x.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      let px = rnd() * S, py = rnd() * S; x.beginPath(); x.moveTo(px, py);
      for (let j = 0; j < 5; j++) { px += (rnd() - 0.5) * 46; py += (rnd() - 0.5) * 46; x.lineTo(px, py); }
      x.stroke();
    }
  }
  if (opts.pebbles) {
    for (let i = 0; i < 240; i++) { x.globalAlpha = 0.25 + rnd() * 0.3; x.fillStyle = rnd() > 0.5 ? opts.pebbles : base; x.fillRect(rnd() * S, rnd() * S, 1.6, 1.6); }
  }
  x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, rz); return t;
}
// painel ACM azul da fachada Havan: chapas com emendas verticais + variação + sujeira embaixo
function acmTex(rx, rz) {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  x.fillStyle = '#2f3a8c'; x.fillRect(0, 0, S, S);
  let seed = 41; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 60; i++) { x.fillStyle = rnd() > 0.5 ? 'rgba(42,51,110,0.5)' : 'rgba(58,70,160,0.35)'; x.fillRect(rnd() * S, rnd() * S, 8 + rnd() * 20, 8 + rnd() * 20); }
  x.strokeStyle = 'rgba(20,26,60,0.8)'; x.lineWidth = 2;
  for (let i = 0; i <= 2; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, S); x.stroke(); }
  x.strokeStyle = 'rgba(20,26,60,0.5)'; x.beginPath(); x.moveTo(0, S / 2); x.lineTo(S, S / 2); x.stroke();
  const gr = x.createLinearGradient(0, S * 0.8, 0, S); gr.addColorStop(0, 'rgba(10,14,30,0)'); gr.addColorStop(1, 'rgba(10,14,30,0.45)');
  x.fillStyle = gr; x.fillRect(0, S * 0.8, S, S * 0.2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, rz); return t;
}

// ===== v4 (crítica de fidelidade): kill-switch + gate de qualidade =====
// ?deco=0 desliga TODA a camada decorativa nova (letreiro, Casa Branca, postes de luz
// completos, marcação de vagas, quebra-molas). Nada aqui cria collider novo nem mexe em
// A*/LOS, então desligar só empobrece o visual — o jogo continua idêntico.
const QP = new URLSearchParams(location.search);
let _q = 'med';
try { _q = JSON.parse(localStorage.getItem('awpbr_settings') || '{}').quality || 'med'; } catch (e) { /* storage bloqueado */ }
const DECO = QP.get('deco') !== '0';
const DECO_HI = DECO && _q !== 'low';   // extras caros (Casa Branca, dentículos, carrinhos extras)

// ASFALTO (crítico: "textura manchada estranha"): o noiseTex antigo desenhava elipses
// chapadas de contorno duro = bolhas cinza de 1m repetindo pelo pátio. Aqui a variação
// tonal é feita com gradiente RADIAL (sem borda), e o que dá a leitura de asfalto é o
// AGREGADO fino (brita) em alta densidade + remendos de recape + trincas capilares.
function asfaltoTex(rx, rz) {
  const S = _q === 'low' ? 256 : 512, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  let seed = 13; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  x.fillStyle = '#4c5057'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 26; i++) {                     // manchas LARGAS e suaves (sem contorno)
    const px = rnd() * S, py = rnd() * S, r = S * (0.08 + rnd() * 0.17);
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, rnd() > 0.5 ? 'rgba(38,41,46,0.26)' : 'rgba(108,114,122,0.18)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
  }
  for (let i = 0; i < 14; i++) {                     // remendos de recape (retângulo mais escuro)
    x.globalAlpha = 0.10 + rnd() * 0.10; x.fillStyle = rnd() > 0.5 ? '#33373d' : '#5d636b';
    x.fillRect(rnd() * S, rnd() * S, S * (0.06 + rnd() * 0.22), S * (0.05 + rnd() * 0.18));
  }
  x.globalAlpha = 1;
  const grains = S === 256 ? 3000 : 11000;           // brita: é ela que faz "asfalto" de perto
  for (let i = 0; i < grains; i++) {
    const v = rnd();
    x.fillStyle = v > 0.66 ? 'rgba(128,134,142,0.5)' : v > 0.33 ? 'rgba(30,32,36,0.45)' : 'rgba(86,92,100,0.35)';
    x.fillRect(rnd() * S, rnd() * S, 1, rnd() > 0.85 ? 2 : 1);
  }
  x.strokeStyle = 'rgba(28,30,34,0.5)'; x.lineWidth = 1;   // trincas capilares
  for (let i = 0; i < 10; i++) {
    let px = rnd() * S, py = rnd() * S; x.beginPath(); x.moveTo(px, py);
    for (let j = 0; j < 6; j++) { px += (rnd() - 0.5) * S * 0.18; py += (rnd() - 0.5) * S * 0.18; x.lineTo(px, py); }
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, rz); return t;
}
// REBOCO da fachada: o "branco" liso lia como cinza chapado. Mottle sutil + escorrimento
// vertical de chuva (é o que dá idade a fachada pintada no Brasil).
function reboco(rx, rz) {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  let seed = 23; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  x.fillStyle = '#f7f4ec'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 90; i++) {
    x.globalAlpha = 0.05 + rnd() * 0.08; x.fillStyle = rnd() > 0.5 ? '#dcd8cc' : '#ffffff';
    const r = 6 + rnd() * 30; x.beginPath(); x.ellipse(rnd() * S, rnd() * S, r, r * 0.7, 0, 0, Math.PI * 2); x.fill();
  }
  for (let i = 0; i < 16; i++) {                    // escorrimento de chuva descendo
    x.globalAlpha = 0.05 + rnd() * 0.07; x.fillStyle = '#b9b8ac';
    const px = rnd() * S; x.fillRect(px, rnd() * S * 0.4, 1 + rnd() * 3, S * (0.3 + rnd() * 0.6));
  }
  x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, rz); return t;
}
// CANELURAS da coluna: 20 estrias verticais. O CylinderGeometry mapeia u 0..1 na volta,
// então uma faixa por estria já dá a leitura clássica sem custo de geometria.
function caneluraTex() {
  const W = 256, H = 64, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = '#f7f4ec'; x.fillRect(0, 0, W, H);
  const n = 20, s = W / n;
  for (let i = 0; i < n; i++) {
    const g = x.createLinearGradient(i * s, 0, (i + 1) * s, 0);
    g.addColorStop(0, 'rgba(150,146,134,0.55)'); g.addColorStop(0.35, 'rgba(255,255,255,0.15)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(150,146,134,0.55)');
    x.fillStyle = g; x.fillRect(i * s, 0, s, H);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
/* ===== MURO DO ESTACIONAMENTO — reescrito (B1 / B5 / B6) =====
   MEDIÇÃO DA R1: 77,8% dos blocos 16×16 do frame com desvio-padrão de L* < 2. O muro
   ganhou blocos e faixa azul na rodada 1, mas continuava chapado. Três causas, todas de
   calibração e não de conteúdo:
     (a) ESCALA. `repeat.set(19, 1)` sobre uma parede de 78 × 3 m dava um tile de
         4,1 × 3,0 m; o "bloco" desenhado tinha ~1,0 m de largura, quando o bloco de
         concreto real tem 39 × 19 cm. Sem a frequência certa, junta nenhuma aparece.
     (b) AMPLITUDE. A variação por bloco estava em alpha 0,05–0,14 sobre um fundo quase
         branco — depois do ACES vira ruído abaixo do quantum de 8 bits.
     (c) AUSÊNCIA DE MICRO-DETALHE. Sem agregado, sem relevo, sem dano: nada acontece
         entre 1 cm e 40 cm, que é exatamente a banda que o B5 mede.
   AGORA: tile de 2,0 × 1,0 m em 512×256 = **256 px/m** nos dois eixos (alvo de playspace
   do BAR §1.8), 5 × 5 blocos de 40 × 20 cm com junta rebaixada e lábio claro (o mesmo
   canvas serve de bumpMap), tom por bloco com amplitude de verdade, agregado fino,
   eflorescência, escorrimento a partir das juntas e lascas de batida de carrinho.
   A FAIXA AZUL saiu daqui: com repeat.y = 3 ela apareceria três vezes na altura do muro
   — virou geometria (ver o bloco do estacionamento). O encardido da base também saiu,
   pelo mesmo motivo, e virou AO de vértice na geometria do muro. */
function muroTex(seed0) {
  const W = 512, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  let seed = seed0 || 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  x.fillStyle = '#b4b0a2'; x.fillRect(0, 0, W, H);                     // argamassa no fundo da junta
  const COLS = 5, ROWS = 5, bw = W / COLS, bh = H / ROWS, j = 3;
  for (let r = 0; r < ROWS; r++) {
    const off = (r % 2) * bw * 0.5;                                     // meia-junta alternada
    for (let i = -1; i <= COLS; i++) {
      const bx = i * bw + off, by = r * bh;
      // tom por bloco: bloco pintado nunca sai igual ao vizinho — é daqui que vem o
      // desvio-padrão de L* ≥ 6 que o B1 cobra
      const v = 0.84 + rnd() * 0.30, warm = rnd() * 14;
      x.fillStyle = `rgb(${Math.min(255, 226 * v) | 0},${Math.min(255, 221 * v - warm * 0.25) | 0},${Math.min(255, 205 * v - warm) | 0})`;
      x.fillRect(bx + j, by + j, bw - j * 2, bh - j * 2);
      // lábio claro em cima + sombra embaixo/direita = relevo de junta rebaixada.
      // Como o mesmo canvas entra como bumpMap, isso vira relevo de verdade no shader.
      x.fillStyle = 'rgba(255,255,252,0.34)'; x.fillRect(bx + j, by + j, bw - j * 2, 2);
      x.fillStyle = 'rgba(88,84,74,0.36)'; x.fillRect(bx + j, by + bh - j - 2.5, bw - j * 2, 2.5);
      x.fillStyle = 'rgba(88,84,74,0.24)'; x.fillRect(bx + bw - j - 2, by + j, 2, bh - j * 2);
      if (rnd() > 0.88) {                                               // lasca de batida (carrinho/caçamba)
        x.fillStyle = 'rgba(146,140,126,0.92)';
        const cw = 6 + rnd() * 14, ch = 4 + rnd() * 8;
        x.fillRect(bx + (rnd() > 0.5 ? bw - j - cw : j), by + bh - j - ch, cw, ch);
      }
    }
  }
  // AGREGADO fino do bloco de concreto: é o que existe na escala de centímetros (B5)
  for (let i = 0; i < 8000; i++) {
    const v = rnd();
    x.fillStyle = v > 0.62 ? 'rgba(255,253,246,0.30)' : v > 0.31 ? 'rgba(116,112,100,0.26)' : 'rgba(174,168,154,0.22)';
    x.fillRect(rnd() * W, rnd() * H, 1, rnd() > 0.87 ? 2 : 1);
  }
  // EFLORESCÊNCIA (salitre branco) e mancha de umidade: manchas grandes sem contorno
  for (let i = 0; i < 24; i++) {
    const px = rnd() * W, py = rnd() * H, r = 20 + rnd() * 62;
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, rnd() > 0.45 ? 'rgba(255,254,250,0.28)' : 'rgba(118,120,100,0.26)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 6.3); x.fill();
  }
  // ESCORRIMENTO DE CHUVA: sempre nasce numa junta horizontal e sempre desce
  for (let i = 0; i < 28; i++) {
    const px = rnd() * W, py = ((rnd() * ROWS) | 0) * bh;
    const g = x.createLinearGradient(0, py, 0, py + 26 + rnd() * 120);
    g.addColorStop(0, `rgba(102,100,86,${0.14 + rnd() * 0.2})`); g.addColorStop(1, 'rgba(102,100,86,0)');
    x.fillStyle = g; x.fillRect(px, py, 1 + rnd() * 4, 26 + rnd() * 120);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
// TINTA DE DEMARCAÇÃO gasta: faixa branca com falhas (o alpha come pedaços da linha).
// Usada como plano fino no asfalto em vez de caixinhas cinza chapadas.
function tintaTex(color) {
  const W = 32, H = 128, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  let seed = 97; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  x.fillStyle = color; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 130; i++) {                   // desgaste: pneu comeu a tinta
    x.globalAlpha = 0.25 + rnd() * 0.6;
    x.beginPath(); x.ellipse(rnd() * W, rnd() * H, 1 + rnd() * 5, 1 + rnd() * 7, rnd() * 3, 0, Math.PI * 2); x.fill();
  }
  x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
// LETREIRO HAVAN: caixa azul com letras AMARELAS (a identidade nº1 da loja, e o que
// faltava — o logo antigo era azul sobre branco e sumia na fachada branca).
function letreiroTex(txt, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = '#1f2a70'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#2f3a8c'; x.fillRect(4, 4, w - 8, h - 8);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  let px = h * 0.78; x.font = `bold ${px}px "Arial Black",Impact,sans-serif`;
  while (x.measureText(txt).width > w * 0.88 && px > 12) { px -= 4; x.font = `bold ${px}px "Arial Black",Impact,sans-serif`; }
  x.lineWidth = Math.max(2, px * 0.06); x.strokeStyle = '#ffffff'; x.strokeText(txt, w / 2, h * 0.54);
  x.fillStyle = '#f4c020'; x.fillText(txt, w / 2, h * 0.54);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildHavan(scene, T) {
  const colliders = [], occluders = [], pickups = [], doors = [];
  const root = new THREE.Group(); scene.add(root);
  const lam = (o) => new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...o });
  /* ===== TEXTURAS CANVAS COMPARTILHADAS (custo de carga — item 7 da revisão) =====
     A r1 saiu de 12 para 26 texturas canvas e o mapa estourou o teto de 300 s do harness
     (268 s → 343 s). Rasterizar canvas debaixo de SwiftShader é caro, e boa parte delas
     era literalmente a MESMA imagem gerada de novo (muro lateral, pilarete, letreiro das
     alas, 7 manchas de óleo idênticas, 8 banners que são 4).
     REGRA daqui pra frente: UM canvas por imagem. Variação de escala/posição vem de
     `clone()`, que compartilha o `source` — logo é UMA textura na GPU também, e nenhuma
     rasterização a mais. Nada disso muda o que aparece na tela. */
  const MURO_TEX = muroTex(3);
  const REBOCO_TEX = reboco(3, 3);
  const reTile = (t, rx, rz) => { const c = t.clone(); c.repeat.set(rx, rz); return c; };
  // repeat calculado pra dar 2,0 × 1,0 m por tile nas duas paredes (= 256 px/m)
  const muroMap = reTile(MURO_TEX, (2 * HALF_X + 2) / 2, 3);      // fundo: 78 m → 39 tiles
  const muroSMap = reTile(MURO_TEX, (HALF_Z - -6) / 2, 3);        // laterais: 64 m → 32 tiles
  const MAT = {
    lot: lam({ map: asfaltoTex(13, 11) }),   // v4: asfalto com brita+recape (as "bolhas" sumiram)
    // piso da loja: porcelanato POLIDO — roughness baixa dá o brilho de espelho sob a
    // fluorescente, que é metade da leitura "estou dentro de uma loja" (contra o sol fosco)
    floor: lam({ map: noiseTex('#c9cfd6', [['#b2b9c0', 40, 8, 22, 0.45], ['#dde2e7', 30, 6, 18, 0.35], ['#8a929a', 14, 4, 12, 0.4]], 16, 16, { cracks: '#9aa2aa', pebbles: '#eef1f4', seed: 9 }), roughness: 0.22, metalness: 0.10, envMapIntensity: 1.6 }),
    wall: lam({ map: acmTex(8, 2) }),                                    // painel ACM azul c/ emendas
    trim: lam({ color: 0xf4c020 }),
    shelf: lam({ color: 0xb9bec4 }), goods: lam({ color: 0xe07a3a }), rack: lam({ color: 0x3a3f45 }),
    caixa: lam({ color: 0xdfe4e8 }),
    /* VIDRO DE VITRINE — R9. `lam` tem roughness 0.9 por padrão, então as seis vitrines da
       fachada e as duas folhas da porta eram VIDRO FOSCO: nenhum reflexo de sol, nenhum
       pixel acima de L* 97 na frente inteira da loja. 0.10/0.55 devolve a lâmina de sol que
       corre pelo painel quando a câmera passa, e o envMap 2.4 devolve o céu refletido que é
       o que faz vidro LER como vidro (senão é um plano azul translúcido). */
    glass: lam({ color: 0x9fd0e8, roughness: 0.20, metalness: 0.45, envMapIntensity: 2.4, transparent: true, opacity: 0.4 }),
    // aço da estrutura/prateleira: era metalness 0 (o default do `lam`) — literalmente plástico cinza
    steel: lam({ color: 0x8a9096, roughness: 0.32, metalness: 0.85, envMapIntensity: 1.8 }),
    mez: lam({ color: 0xc7ccd2 }), curb: lam({ color: 0xd8d2c0 }),
    // muro do estacionamento: bloco de concreto pintado na escala real (40 × 20 cm).
    // O MESMO canvas entra como bumpMap: a junta rebaixada vira relevo no shader sem
    // custo de textura nova, que é o que dá micro-detalhe a < 2 m da câmera (B5).
    // vertexColors: o encardido/AO da base vem da geometria (ver bakeMuroAO).
    muro: lam({ map: muroMap, bumpMap: muroMap, bumpScale: 0.45, roughness: 0.93, vertexColors: true }),
    muroS: lam({ map: muroSMap, bumpMap: muroSMap, bumpScale: 0.45, roughness: 0.93, vertexColors: true }),
    paintW: new THREE.MeshBasicMaterial({ map: tintaTex('#e8e6dd'), transparent: true, depthWrite: false }),
    paintY: new THREE.MeshBasicMaterial({ map: tintaTex('#e0b028'), transparent: true, depthWrite: false }),
  };
  /* AO DE VÉRTICE (critério A1) — ver vao.js. A r2 já tinha isso SÓ nos 3 muros do
     perímetro (bakeMuroAO); agora vale para toda caixa procedural do mapa. */
  const LOWQ = _q === 'low';
  const aoMat = aoMatFactory();
  const SKIRT = new ContactSkirt({ low: LOWQ });
  /* ================= ORÇAMENTO DE DRAW CALL (rodada 3) =================
     MEDIDO na r2: 4.347 draw calls e 3,65 M triângulos contra um teto de régua de
     300-800 calls / 500 k tris. O mapa não tem conteúdo demais — ele tem MALHA demais
     pra mesma imagem. Três frentes, todas sem tirar um pixel da tela:

       1. DECO_BATCH — toda caixa/cilindro DECORATIVO (collide:false: colunata, cornija,
          pilaretes, vitrines, letreiros, Casa Branca, luminárias, degraus) vira UMA malha
          mesclada por material. Eram ~400 meshes; viram ~15. Nada disso é occluder nem
          collider, então A-estrela, LOS e hitscan continuam idênticos — e o raycast fica mais
          barato, porque a lista de occluders não muda mas o grafo de cena encolhe.
       2. PROPS — os GLB repetidos (59 carros de 12 modelos, 35 gôndolas, 10 carrinhos)
          viram InstancedMesh agrupado por material. Um carro de 60 primitivas custava 60
          draw calls por cópia; agora custa ~1-15 pro modelo inteiro, com a cor de lataria
          indo por instanceColor (a repintura BR continua carro a carro).
       3. PAINT_BATCH — as ~78 faixas de tinta do asfalto viram 4 malhas (uma por material).

     `?batch=0` desliga tudo e volta ao caminho antigo, mesh por mesh — é o A/B que prova
     que o frame não mudou. Em quality 'low' o mapa ainda corta props (ver DECO_HI/LOWQ). */
  const BATCH = PROP_BATCH;
  const DECO_BATCH = new StaticBatch({ name: 'havan-deco' });
  const PAINT_BATCH = new StaticBatch({ name: 'havan-tinta' });
  // carros: bucket 0 (uma instância por modelo+material cobrindo o pátio inteiro). Com os
  // modelos baratos da nova seleção o pátio todo dá ~200 k tris — não compensa fatiar em
  // blocos pra ganhar culling e pagar 3× em draw call.
  const PROPS = new PropBatch({
    tag: 'havan',
    // lataria: mesma regra do paintBR (nome de material de carroceria e SEM textura assada)
    paintTest: (m) => !!m && !Array.isArray(m) && BODY_RE.test(m.name || '') && !SKIP_RE.test(m.name || '') && !m.map && CARPAINT,
    /* LATARIA / CROMADO / VIDRO DOS GLB — R9. Antes só se SOMAVA 0,16 de roughness à
       pintura, o que empurrava o verniz pra 0,55-0,75: um pátio com 59 carros ao sol de
       meio-dia sem UM reflexo estourado. Agora a pintura vai pra 0,30 (pico do GGX ~40, o
       suficiente pra clipar num capô curvo) e o cromado/vidro — que o SKIP_RE já preserva
       da repintura — recebe o tratamento de metal polido que o glTF não trouxe. */
    matTweak: (m, paint) => {
      if (!m) return;
      // ganho de IBL modesto no geral (1,25): envMapIntensity mexe TAMBÉM na irradiância
      // difusa, então um blanket alto aqui viraria "ambiente a mais" em 35 gôndolas e 59
      // carros. O ganho grande fica só onde há reflexão especular pra sustentar.
      m.envMapIntensity = 1.25;
      if (paint) { m.roughness = 0.30; m.metalness = Math.max(m.metalness ?? 0, 0.45); return; }
      const n = m.name || '';
      if (/chrome|crom|metal|steel|aco|aço|rim|roda|escapa|exhaust|carrinho|cart/i.test(n)) {
        m.roughness = 0.24; m.metalness = 0.90; m.envMapIntensity = 2.0;
      } else if (/glass|vidro|window|janela|farol|lente|lens/i.test(n)) {
        m.roughness = 0.18; m.metalness = 0.45; m.envMapIntensity = 2.4;
      }
    },
    // peças com menos de 6% dos triângulos do modelo (emblema, retrovisor, friso) não mudam
    // a silhueta projetada e custavam metade do passe de sombra
    shadowMin: 0.06,
  });
  /* Manda um mesh AVULSO (cilindro, extrude, plano) pro merge estático em vez da cena.
     Retorna o mesh mesmo assim, pra quem quiser continuar mexendo nele antes do build. */
  function deco(m, batch) {
    const b = batch || DECO_BATCH;
    if (!BATCH || Array.isArray(m.material)) { root.add(m); return m; }
    m.updateMatrix();
    if (!b.add(m.geometry, m.matrix, m.material, { cast: m.castShadow, receive: m.receiveShadow, order: m.renderOrder })) root.add(m);
    return m;
  }
  function addBox(w, h, d, mat, x, y, z, opts = {}) {
    const vao = VAO_BANDS && opts.vao !== false && mat && mat.visible !== false;
    // `solo` é geométrico, não depende do gate de faixas — assim `?vao=skirt` (A/B do
    // agente de captura) ainda emite a saia. SKIRT.add já checa o próprio kill-switch.
    const solo = onGround(y, h) && !opts.rx && !opts.rz;
    const geo = vao ? aoBoxGeo(w, h, d, { low: LOWQ, base: solo ? undefined : BASE_FLOATING })
      : new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(geo, vao ? aoMat(mat) : mat);
    m.position.set(x, y + h / 2, z); m.castShadow = opts.cast !== false; m.receiveShadow = true;
    if (opts.ry) m.rotation.y = opts.ry;
    if (solo && opts.skirt !== false) SKIRT.add(x, y, z, w, d, opts.ry || 0);
    const collide = opts.collide !== false;
    // só entra no merge quem NÃO é occluder (o raycast de LOS/hitscan precisa de meshes
    // separados pra ter early-out por bounding sphere) e quem não vai ser animado depois
    if (collide || opts.batch === false || Array.isArray(m.material)) {
      root.add(m);
      if (collide) { colliders.push({ minX: x - w / 2, maxX: x + w / 2, minY: y, maxY: y + h, minZ: z - d / 2, maxZ: z + d / 2 }); occluders.push(m); }
      return m;
    }
    return deco(m, DECO_BATCH);
  }
  const addFloor = (w, d, x, z, mat, y = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; root.add(m); };
  /* PROPS DA LOJA — lote separado, SEM sombra de sol.
     PORQUE: desde a r2 a laje do teto tem castShadow (foi o que criou a identidade de
     interior: dentro da loja só existe a fluorescente fria). Ou seja, TODO o piso da loja
     já está na sombra do teto — e as ~40 gôndolas/araras/caixas/manequins continuavam
     sendo desenhadas no shadow map do sol pra projetar sombra sobre sombra. São ~124 k
     triângulos e ~10 draw calls por frame que não produzem UM pixel. Com `?teto=0` (o sol
     volta a entrar) elas voltam a projetar, senão o interior ficaria sem sombra nenhuma. */
  const TETO = QP.get('teto') !== '0';
  const PROPS_LOJA = new PropBatch({ tag: 'havan', shadowMin: 0.06, cast: !TETO });
  // gprop agora só REGISTRA no PropBatch (a malha nasce no build lá embaixo). O retorno
  // continua sendo "o GLB existe?", que é o que os ~40 fallbacks do mapa consultam.
  // z < -6 = dentro da loja (SF): vai pro lote sem sombra.
  const gprop = (id, x, z, h, ry = 0, y = 0) => {
    if (BATCH) return (z < -6 ? PROPS_LOJA : PROPS).add(id, { x, y, z, targetH: h, ry });
    const o = placeProp(id, { x, y, z, targetH: h, ry }); if (o) root.add(o); return !!o;
  };
  // fallback enquanto o GLB não carrega (ou falha): mini-carro colorido por hash do id —
  // substitui a caixa preta que fazia o estacionamento parecer quebrado no menu/loading.
  // Paleta REAL da frota brasileira (~67% neutros: branco 21,9 / preto 19,0 / prata 16,3 /
  // cinza 10,8; vermelho 15,4 é a única cor forte relevante). O fallback antigo era um
  // arco-íris (roxo, laranja, verde) que dava cara de pista de kart.
  const BR_PAINT = [[0xe9e9e6, 22], [0x16181b, 19], [0xb9bcc0, 16], [0x74797e, 11],
    [0x9d2320, 15], [0x1f3a6b, 6], [0x6b5340, 5], [0x2f5a3a, 3], [0xd8c33a, 3]];
  const PAINT_BAG = []; for (const [c, w] of BR_PAINT) for (let i = 0; i < w; i++) PAINT_BAG.push(c);
  const CAR_COLORS = PAINT_BAG;
  // REPINTURA DOS GLB: placeProp faz tpl.clone(true), que COMPARTILHA material — por isso
  // clonamos o material antes de mexer. Só materiais cujo NOME é lataria/carpaint e que
  // NÃO têm textura baked entram (nos carros Mint a pintura está assada no mapa: multiplicar
  // a cor só sujaria a textura). ?carpaint=0 desliga.
  const CARPAINT = QP.get('carpaint') !== '0';
  const BODY_RE = /lataria|carpaint|car_paint|carroc|pintura|^paint$|_paint|^body/i;
  const SKIP_RE = /trim|chrome|plastic|glass|vidro|rubber|pneu|tire/i;
  const WORN = new THREE.Color(0xb9b4a8);
  let _paintI = (_carSeed * 7) % PAINT_BAG.length;
  function paintBR(o) {
    if (!CARPAINT) return;
    _paintI = (_paintI + 37) % PAINT_BAG.length;     // 37 e 100 são coprimos: espalha as cores
    const hex = PAINT_BAG[_paintI], worn = ((_paintI * 13) % 10) < 4;   // ~40% com verniz queimado
    o.traverse((m) => {
      if (!m.isMesh || !m.material || Array.isArray(m.material)) return;
      const n = m.material.name || '';
      if (!BODY_RE.test(n) || SKIP_RE.test(n) || m.material.map) return;
      const mat = m.material.clone(); mat.color.setHex(hex);
      // verniz descascado: sem máscara por peça, o honesto é queimar o brilho e "cretar"
      // a cor — é exatamente como um capô descascado de sol lê à distância de jogo.
      // mesma calibração do matTweak do PropBatch (ver lá o porquê do 0,34)
      mat.envMapIntensity = 1.25;
      if (worn) { mat.roughness = 0.62; mat.metalness = Math.max(0, (mat.metalness ?? 0.3) - 0.25); mat.color.lerp(WORN, 0.18); }
      else { mat.roughness = 0.30; mat.metalness = Math.max(mat.metalness ?? 0, 0.45); }
      m.material = mat;
    });
  }
  // sorteia a cor de UM carro (mesma sequência de antes: 37 e 100 são coprimos)
  const nextPaint = () => { _paintI = (_paintI + 37) % PAINT_BAG.length; return PAINT_BAG[_paintI]; };
  // coloca 1 carro (GLB repintado) ou cai no mini-carro de fallback.
  // Com BATCH a cor da lataria vai por instanceColor (ver PropBatch.paintTest): 59 carros
  // continuam com 59 pinturas diferentes, mas custam ~1 draw call por material do MODELO.
  const placeCar = (id, x, z, ry) => {
    if (BATCH) { const col = CARPAINT ? nextPaint() : null; if (PROPS.add(id, { x, y: 0, z, targetH: 1.55, ry, color: col })) return; fallbackCar(id, x, z, ry); return; }
    const o = placeProp(id, { x, y: 0, z, targetH: 1.55, ry });
    if (!o) { fallbackCar(id, x, z, ry); return; }
    paintBR(o); root.add(o);
  };
  function fallbackCar(id, x, z, ry) {
    let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 4.2), lam({ color: CAR_COLORS[Math.abs(h) % CAR_COLORS.length], metalness: 0.55, roughness: 0.32, envMapIntensity: 1.8 }));
    body.position.y = 0.55; body.castShadow = body.receiveShadow = true; g.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.1), lam({ color: 0x20242a, metalness: 0.45, roughness: 0.18, envMapIntensity: 2.2 }));   // vidro do carro
    cabin.position.set(0, 1.05, -0.2); cabin.castShadow = true; g.add(cabin);
    g.position.set(x, 0, z); g.rotation.y = ry; root.add(g);
  }

  // ===== chão: estacionamento (z>-6) + loja (z<-6) =====
  addFloor(HALF_X * 2, HALF_Z + 6, 0, (HALF_Z - 6) / 2 + 3, MAT.lot);      // estacionamento
  addFloor(HALF_X * 2, HALF_Z - 6, 0, -(HALF_Z - 6) / 2 - 3, MAT.floor);   // piso da loja

  // ===== LOJA (prédio fechado no fundo, z ∈ [-42,-6]) =====
  const SF = -6, SB = -42, SW = 28;   // frente / fundo / meia-largura
  // paredes (frente com VÃO da porta em x∈[-4,4])
  addBox(SW - 4, 5, 1, MAT.wall, -(SW / 2 + 2), 0, SF);   // frente esquerda
  addBox(SW - 4, 5, 1, MAT.wall, (SW / 2 + 2), 0, SF);    // frente direita
  addBox(2 * SW, 5, 1, MAT.wall, 0, 0, SB);               // fundo
  addBox(1, 5, SF - SB, MAT.wall, -SW, 0, (SF + SB) / 2); // lateral esq
  addBox(1, 5, SF - SB, MAT.wall, SW, 0, (SF + SB) / 2);  // lateral dir
  // ===== FACHADA GRECO-ROMANA (G2-R3: "a loja da havan é estilo greco romano") =====
  // Skin arquitetônica SOBRE a estrutura de gameplay: tudo collide:false e nenhum
  // collider novo — paredes/vão da porta/A*/LOS intactos. Templo branco: reboco sobre
  // o ACM azul, cornija corrida avançada sobre a colunata, frontão triangular c/ logo
  // HAVAN azul, 10 colunas (base + fuste + capitel simples) e banners coloridos.
  {
    // reboco branco TEXTURIZADO (era cor chapada = "paredão liso"): mottle + escorrimento
    const plaster = lam({ map: REBOCO_TEX, roughness: 0.85 });   // canvas de reboco ÚNICO no mapa
    const plasterCol = lam({ map: caneluraTex(), roughness: 0.8 });   // fuste canelado
    const FZ = SF + 0.5;   // face frontal da parede da fachada (z=-5.5)
    // reboco branco por cima do ACM azul (frente da loja + fechos laterais de corredor)
    // — fica ATRÁS das vitrines (z=-5.45), que continuam visíveis entre as colunas
    for (const [cx, w] of [[-16, SW - 4], [16, SW - 4], [-33, HALF_X - SW + 1], [33, HALF_X - SW + 1]])
      addBox(w, 5, 0.03, plaster, cx, 0, FZ + 0.015, { collide: false });
    // pilastras rasas nas seções laterais (ritmo de templo, como nas fotos)
    for (const sx of [-1, 1]) for (const px of [28.5, 33, 37.5])
      addBox(0.6, 5, 0.24, plaster, sx * px, 0, FZ + 0.1, { collide: false });
    // COLUNATA da entrada: 10 colunas a 1.4m da parede (vão da porta x∈[-4,4] livre)
    for (const sx of [-1, 1]) for (const ax of [5, 10, 15, 20, 25]) {
      const x = sx * ax, z = SF + 1.9;
      addBox(1.1, 0.18, 1.1, plaster, x, 0, z, { collide: false });                     // plinto
      addBox(0.92, 0.20, 0.92, plaster, x, 0.18, z, { collide: false });                // base (toro)
      // fuste CANELADO (16 lados p/ a estria ler no perfil; a textura faz o resto de graça)
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.34, 4.12, 16), plasterCol);
      shaft.position.set(x, 0.38 + 4.12 / 2, z); shaft.castShadow = shaft.receiveShadow = true; deco(shaft);
      const ech = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.30, 0.22, 16), plaster);  // équino do capitel
      ech.position.set(x, 4.61, z); ech.castShadow = true; deco(ech);
      addBox(1.0, 0.26, 1.0, plaster, x, 4.72, z, { collide: false });                  // ábaco do capitel sob a cornija
    }
    /* BANNERS verticais entre as colunas. Eram 8 canvas de 256×512 pra 4 imagens (o laço
       de sx repetia os mesmos 4 rótulos). Agora é UM atlas 1024×512 com as 4 tiras lado a
       lado; cada banner é um clone com repeat 0,25 e offset — mesmo `source`, uma textura
       na GPU, 1 rasterização em vez de 8. */
    const bannerDefs = [['#2f3a8c', 'OFERTAS'], ['#c8342e', 'ELETRO'], ['#e9a614', 'MERCADO'], ['#2e7d4f', 'MODA']];
    const bannerAtlas = (() => {
      const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x2 = c.getContext('2d');
      bannerDefs.forEach(([bg, label], i) => {
        const ox = i * 256;
        x2.fillStyle = bg; x2.fillRect(ox, 0, 256, 512);
        x2.fillStyle = 'rgba(255,255,255,0.18)'; x2.fillRect(ox, 0, 256, 36); x2.fillRect(ox, 476, 256, 36);
        x2.fillStyle = '#ffffff'; x2.textAlign = 'center';
        x2.save(); x2.translate(ox + 128, 256); x2.rotate(-Math.PI / 2);
        x2.font = 'bold 76px "Arial Black",Impact,sans-serif'; x2.fillText(label, 0, 27); x2.restore();
      });
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    /* Os 8 banners eram 8 clones de textura + 8 materiais + 8 draw calls. Como todos
       saem do MESMO atlas, dá pra assar o recorte no UV da própria geometria — aí os 8
       compartilham UM material e o merge estático junta tudo num draw call só. Mesma
       imagem na tela, 1/8 do custo. */
    const bannerMat = new THREE.MeshStandardMaterial({ map: bannerAtlas, roughness: 0.8, side: THREE.DoubleSide });
    const subUV = (geo, ox, sx2) => { const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setX(k, ox + uv.getX(k) * sx2); uv.needsUpdate = true; return geo; };
    for (const sx of [-1, 1]) [7.5, 12.5, 17.5, 22.5].forEach((bx, i) => {
      const b = new THREE.Mesh(subUV(new THREE.PlaneGeometry(1.9, 2.9), i * 0.25, 0.25), bannerMat);
      b.position.set(sx * bx, 3.35, SF + 1.9); b.castShadow = true; deco(b);
    });
    // CORNIJA corrida no topo, avançando da parede até cobrir a colunata
    addBox(2 * HALF_X + 1, 0.55, 2.3, plaster, 0, 5.0, SF + 1.05, { collide: false });
    addBox(2 * HALF_X + 1, 0.2, 1.6, plaster, 0, 5.55, SF + 0.7, { collide: false });   // filete superior
    // DENTÍCULOS sob a cornija: 1 InstancedMesh p/ ~150 blocos (1 draw call) — é o detalhe
    // que faz a cornija ler como cornija e não como laje. Só em quality >= med.
    if (DECO_HI) {
      const n = 150, dm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.26, 0.26, 0.3), plaster, n);
      const mtx = new THREE.Matrix4();
      for (let i = 0; i < n; i++) {
        mtx.setPosition(-HALF_X + 0.5 + i * ((2 * HALF_X - 1) / (n - 1)), 4.86, SF + 2.05);
        dm.setMatrixAt(i, mtx);
      }
      dm.castShadow = true; dm.frustumCulled = false;   // bounding sphere do InstancedMesh some com a fachada inteira
      root.add(dm);
    }
    // FRONTÃO triangular central (tímpano branco) + LETREIRO AMARELO (a identidade Havan:
    // caixa azul, letras amarelas gigantes — o logo antigo era azul-sobre-branco e sumia)
    {
      const tri = new THREE.Shape(); tri.moveTo(-13, 0); tri.lineTo(13, 0); tri.lineTo(0, 3.8); tri.closePath();
      const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 1.6, bevelEnabled: false }), plaster);
      ped.position.set(0, 5.75, SF + 0.1); ped.castShadow = true; deco(ped);
      const map = letreiroTex('HAVAN', 1024, 256);
      // emissive: o letreiro é luminoso (é de acrílico retroiluminado na loja real) —
      // em quality low cai pra Basic, que não paga o custo de emissive no shader
      const mat = _q === 'low' ? new THREE.MeshBasicMaterial({ map })
        : new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.6 });
      const s = new THREE.Mesh(new THREE.BoxGeometry(12, 3.0, 0.35), mat);
      s.position.set(0, 6.85, SF + 1.85); s.castShadow = true; deco(s);
      // letreiros menores nas alas laterais: um canvas só, o mesmo material nos dois lados
      // (eram duas rasterizações idênticas do mesmo texto)
      if (DECO) {
        const alaMat = new THREE.MeshBasicMaterial({ map: letreiroTex('HAVAN', 512, 128) });
        for (const sx of [-1, 1]) {
          const m2 = new THREE.Mesh(new THREE.BoxGeometry(7.5, 1.5, 0.25), alaMat);
          m2.position.set(sx * 33, 4.0, SF + 0.72); deco(m2);
        }
      }
    }
  }
  // VITRINES da fachada (crítico gauntlet: "parede única lisa"): painéis de vidro c/ moldura
  // branca dos 2 lados da porta, como na Havan real — sem collider (a parede está atrás)
  {
    const frame = lam({ color: 0xe8ecef });
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
      const x = sx * (7.5 + i * 6.5);
      addBox(0.15, 3.4, 0.15, frame, x - 3.1, 0.6, SF + 0.55, { collide: false });
      addBox(6.2, 0.15, 0.15, frame, x, 4.0, SF + 0.55, { collide: false });
      addBox(6.2, 0.15, 0.15, frame, x, 0.62, SF + 0.55, { collide: false });
      const v = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 3.3), MAT.glass);
      v.position.set(x, 2.3, SF + 0.55); deco(v);
    }
  }
  // teto (alto, sem colisão) — DoubleSide: antes virado só pra cima = céu aparecendo DENTRO da loja
  { const t = new THREE.Mesh(new THREE.PlaneGeometry(2 * SW, SF - SB), new THREE.MeshStandardMaterial({ map: tileTex('#c7ccd2', '#aab1b8', 6, 8, 5), roughness: 0.9, side: THREE.DoubleSide }));
    t.rotation.x = -Math.PI / 2; t.position.set(0, 6.2, (SF + SB) / 2); t.receiveShadow = true;
    /* IDENTIDADE DE INTERIOR (item 9): o teto não estava marcado como castShadow, então o
       SOL atravessava a laje e iluminava o chão da loja igual ao estacionamento — com a
       mesma luz nos dois lados não existe "entrei na loja", e as fluorescentes frias que a
       r1 instalou não tinham contra o que contrastar. Com o teto tapando o sol, o interior
       passa a ser iluminado SÓ pela fluorescente fria, o porcelanato polido reflete essas
       calhas e o vão da porta vira um retângulo quente — que é exatamente a leitura que se
       quer. Custa 1 quad a mais no shadow map. ?teto=0 volta ao comportamento anterior. */
    if (QP.get('teto') !== '0') t.castShadow = true;
    root.add(t); }

  // PORTA COM SENSOR (2 folhas de vidro no vão; game.js abre ao chegar perto — ver world.doors)
  {
    // batch:false — estas duas folhas SÃO animadas (game.js desliza panelL/panelR): mesclar
    // congelaria a porta fechada
    const pl = addBox(4, 4, 0.2, MAT.glass, -2, 0, SF, { cast: false, collide: false, batch: false });
    const pr = addBox(4, 4, 0.2, MAT.glass, 2, 0, SF, { cast: false, collide: false, batch: false });
    doors.push({ panelL: pl, panelR: pr, x: 0, z: SF, closedL: -2, closedR: 2, openL: -6, openR: 6, open: 0 });
  }

  // CAIXAS DE COBRANÇA (esteira+visor Mint, fileira logo dentro da porta, z=-10)
  for (let i = 0; i < 5; i++) {
    const x = -12 + i * 6;
    if (!gprop('caixa_cobranca', x, -10, 1.1)) addBox(2.4, 1.1, 1.2, MAT.caixa, x, 0, -10);
    colliders.push({ minX: x - 0.95, maxX: x + 0.95, minY: 0, maxY: 1.1, minZ: -10.8, maxZ: -9.2 });
  }
  // manequins de entrada (flanqueando o corredor da porta)
  for (const x of [-6, 6]) { gprop('manequim', x, -8, 1.8); colliders.push({ minX: x - 0.3, maxX: x + 0.3, minY: 0, maxY: 1.8, minZ: -8.3, maxZ: -7.7 }); }
  // GÔNDOLAS CHEIAS Mint (mercado + eletro) = cover; 4 fileiras, 2 grupos c/ vão central p/ bots
  for (let r = 0; r < 4; r++) {
    const z = -15 - r * 6;
    const id = r === 2 ? 'gondola_eletro' : 'gondola_mercado';
    for (const gx of [-7.4, -5.26, -3.12, 3.12, 5.26, 7.4]) {   // 3+3, vão central x∈[-2,2]
      if (!gprop(id, gx, z, 1.8, Math.PI / 2)) addBox(2.1, 1.8, 1.0, MAT.shelf, gx, 0, z);
      colliders.push({ minX: gx - 1.05, maxX: gx + 1.05, minY: 0, maxY: 1.8, minZ: z - 0.55, maxZ: z + 0.55 });
    }
  }
  // ilha central na 2ª fileira (tampa a linha de visão spawn↔spawn pela porta; bots contornam pelas pontas)
  if (!gprop('gondola_mercado', 0, -21, 1.8, Math.PI / 2)) addBox(2.1, 1.8, 1.0, MAT.shelf, 0, 0, -21);
  colliders.push({ minX: -1.05, maxX: 1.05, minY: 0, maxY: 1.8, minZ: -21.55, maxZ: -20.45 });
  // REFORÇO DE RESPAWN B (G2-R6B): gôndola tapando o vão central da fileira z=-27 + peças
  // escalonadas nos flancos (±12) — o spawn da loja vira um bolso de gôndolas. A* contorna
  // pelos lados (corredores ≥4m); LOS spawn↔spawn segue 0 (só adiciona cover alto).
  if (!gprop('gondola_eletro', 0, -27, 1.8, Math.PI / 2)) addBox(2.1, 1.8, 1.0, MAT.shelf, 0, 0, -27);
  colliders.push({ minX: -1.05, maxX: 1.05, minY: 0, maxY: 1.8, minZ: -27.55, maxZ: -26.45 });
  for (const sx of [-1, 1]) {
    if (!gprop('gondola_mercado', sx * 12, -28.5, 1.8, Math.PI / 2)) addBox(2.1, 1.8, 1.0, MAT.shelf, sx * 12, 0, -28.5);
    colliders.push({ minX: sx * 12 - 1.05, maxX: sx * 12 + 1.05, minY: 0, maxY: 1.8, minZ: -29.05, maxZ: -27.95 });
  }
  // ARARAS de roupa Mint nas laterais
  for (const sx of [-1, 1]) for (const z of [-18, -24, -30]) {
    if (!gprop('arara_roupas', sx * 24, z, 1.7)) addBox(2.4, 1.7, 1.6, MAT.rack, sx * 24, 0, z);
    colliders.push({ minX: sx * 24 - 1.2, maxX: sx * 24 + 1.2, minY: 0, maxY: 1.7, minZ: z - 0.8, maxZ: z + 0.8 });
  }
  // painéis de TV nas paredes laterais (alto, sem collider) — encostados na parede (x=±27.7;
  // antes a 0.8m da parede = "flutuando" visto do spawn B)
  for (const sx of [-1, 1]) for (const z of [-16, -28]) gprop('painel_tvs', sx * 27.7, z, 1.8, sx > 0 ? -Math.PI / 2 : Math.PI / 2, 1.3);

  // LUZ INTERNA DA LOJA (o teto apagava tudo — reclamação do dono): fileiras de painéis
  // de luz emissivos + point lights suaves. Sem collider.
  // v4: a luz de dentro agora é FLUORESCENTE FRIA (era 0xfff0dd, quente igual ao sol —
  // sem contraste, o interior lia como "parte de fora com teto"). Fria dentro + sol quente
  // fora = a troca de temperatura na porta é o que vende "entrei na loja".
  const lightPanel = new THREE.MeshBasicMaterial({ color: 0xeaf2ff });
  const tubeMat = new THREE.MeshBasicMaterial({ color: 0xf4f8ff });
  const bodyMat = lam({ color: 0xb9c0c8, roughness: 0.34, metalness: 0.65, envMapIntensity: 1.6 });   // calha de alumínio
  for (const z of [-14, -24, -34]) {
    for (const x of [-14, 0, 14]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.6), lightPanel);
      p.rotation.x = Math.PI / 2; p.position.set(x, 6.1, z); p.castShadow = false; deco(p);
    }
    // calhas de tubo corridas atravessando a loja (o "teto de galpão de varejo")
    if (DECO_HI) for (const tz of [z - 2.4, z + 2.4]) {
      const cal = new THREE.Mesh(new THREE.BoxGeometry(2 * SW - 6, 0.16, 0.34), bodyMat);
      cal.position.set(0, 6.05, tz); cal.castShadow = false; deco(cal);
      const tb = new THREE.Mesh(new THREE.BoxGeometry(2 * SW - 6.4, 0.06, 0.2), tubeMat);
      tb.position.set(0, 5.95, tz); tb.castShadow = false; deco(tb);
    }
    // +12%: com o teto agora tapando o sol (ver acima), a fluorescente passou a ser a
    // ÚNICA fonte de dentro — o interior tem que continuar legível pro C1 (silhueta do
    // inimigo contra a gôndola), não virar caverna.
    const pt = new THREE.PointLight(0xcfe0ff, 54, 34, 1.6); pt.position.set(0, 5.4, z); root.add(pt);
  }

  // FECHA OS CORREDORES LATERAIS (x 28..38 ao longo da loja = "corredores sem sentido"):
  // parede na linha da fachada (z=-6) dos dois lados — vira fundo de loja inacessível.
  for (const sx of [-1, 1]) addBox(HALF_X - SW + 1, 5, 1, MAT.wall, sx * (SW + (HALF_X - SW) / 2), 0, SF);

  // ESCADA + MEZANINO (2º andar = lobby sniper) no fundo. Altura via groundHeightAt.
  const MZ = { x0: -14, x1: 14, z0: SB + 0.6, z1: SB + 7, h: 3.4 };          // footprint do mezanino
  const RAMP = { x0: 8, x1: 14, z0: MZ.z1, z1: MZ.z1 + 6 };                    // rampa/escada (canto dir)
  addFloor(MZ.x1 - MZ.x0, MZ.z1 - MZ.z0, (MZ.x0 + MZ.x1) / 2, (MZ.z0 + MZ.z1) / 2, MAT.mez, MZ.h + 0.02);  // piso do mezanino
  // BUG FIX (crítico: "gôndola e rifle flutuando na parede do fundo"): o piso do mezanino é
  // um plano single-sided — some visto de baixo (do spawn B) e os props do mezanino flutuam.
  // FASCIA na borda frontal + colunas de suporte = a estrutura lê como mezanino de verdade.
  {
    const mezUnder = new THREE.MeshBasicMaterial({ color: 0xb0b6be });   // unlit: a face de baixo do contrapiso lia como faixa PRETA
    addBox(MZ.x1 - MZ.x0, 0.45, 0.25, mezUnder, (MZ.x0 + MZ.x1) / 2, MZ.h - 0.45, MZ.z1, { collide: false });   // viga de borda
    addBox(MZ.x1 - MZ.x0, 0.12, MZ.z1 - MZ.z0, mezUnder, (MZ.x0 + MZ.x1) / 2, MZ.h - 0.12, (MZ.z0 + MZ.z1) / 2, { collide: false });   // contrapiso
    for (const cx of [-9, 9]) {   // colunas até o chão da loja (collider fino)
      addBox(0.28, MZ.h - 0.12, 0.28, MAT.steel, cx, 0, MZ.z1 - 0.2, { collide: false });
      colliders.push({ minX: cx - 0.16, maxX: cx + 0.16, minY: 0, maxY: MZ.h, minZ: MZ.z1 - 0.36, maxZ: MZ.z1 - 0.04 });
    }
  }
  // guarda-corpo do mezanino (frente + laterais) — cover baixo lá em cima
  addBox(MZ.x1 - MZ.x0, 1.0, 0.2, MAT.steel, (MZ.x0 + MZ.x1) / 2, MZ.h, MZ.z1, { collide: false });
  // degraus visuais da escada
  for (let i = 0; i < 6; i++) addBox(RAMP.x1 - RAMP.x0, 0.1, 1.0, MAT.mez, (RAMP.x0 + RAMP.x1) / 2, (i / 6) * MZ.h, RAMP.z1 - 0.5 - i * 1.0, { collide: false });
  // MEZANINO MOBILIADO (eletro/móveis = cover no perch de sniper)
  for (const gx of [-8, -2]) {
    if (!gprop('gondola_eletro', gx, MZ.z0 + 2.5, 1.8, Math.PI / 2, MZ.h)) addBox(2.1, 1.8, 1.0, MAT.shelf, gx, MZ.h, MZ.z0 + 2.5);
    colliders.push({ minX: gx - 1.05, maxX: gx + 1.05, minY: MZ.h, maxY: MZ.h + 1.8, minZ: MZ.z0 + 1.95, maxZ: MZ.z0 + 3.05 });
  }
  gprop('painel_tvs', 8, MZ.z0 + 1.2, 1.8, 0, MZ.h + 0.2);   // painel de TVs encostado no fundo
  gprop('manequim', 12, MZ.z0 + 2.5, 1.8, 2.4, MZ.h);

  // PAREDE DO FUNDO DA LOJA (crítico: "azul monolítico"): faixa amarela Havan + letreiros
  // de seção + pôsteres de oferta — a fantasia da loja, sem redesenhar o mapa
  {
    addBox(2 * SW - 2, 0.5, 0.1, MAT.trim, 0, 3.85, SB + 0.56, { collide: false });   // faixa amarela
    // LETREIROS DE SEÇÃO: eram 4 canvas de 512×128. Viraram UM atlas 512×512 com as 4
    // faixas empilhadas; cada placa é um clone com repeat (1, 0,25) e offset em V.
    // (V do UV cresce pra cima e a linha 0 do canvas é o topo, daí o 0.75 - i*0.25.)
    const SECOES = [['ELETRO', -19], ['CAMA MESA BANHO', -6], ['MERCADO', 7], ['MODA', 19]];
    const secAtlas = (() => {
      const c = document.createElement('canvas'); c.width = 512; c.height = 512;
      const x = c.getContext('2d');
      x.fillStyle = '#2f3a8c'; x.fillRect(0, 0, 512, 512);
      x.textAlign = 'center'; x.fillStyle = '#f4c020';
      SECOES.forEach(([title], i) => {
        let px = 56; x.font = `bold ${px}px "Arial Black",Impact,sans-serif`;
        while (x.measureText(title).width > 466 && px > 24) { px -= 4; x.font = `bold ${px}px "Arial Black",Impact,sans-serif`; }
        x.fillText(title, 256, i * 128 + 82);
      });
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    // igual aos banners: o recorte do atlas vai pro UV da geometria em vez de virar 4
    // clones de textura + 4 materiais. Um material, um draw call pras 4 placas.
    const secMat = new THREE.MeshBasicMaterial({ map: secAtlas });
    SECOES.forEach(([t2, x], i) => {
      const g = new THREE.PlaneGeometry(10, 1.4), uv = g.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setY(k, (0.75 - i * 0.25) + uv.getY(k) * 0.25);
      uv.needsUpdate = true;
      const s = new THREE.Mesh(g, secMat);
      s.position.set(x, 2.55, SB + 0.56); s.castShadow = false; deco(s);
    });
    if (T.posters && T.posters.length) {   // pôsteres de oferta (1 material por textura distinta)
      const pmat = new Map();
      for (let i = 0; i < 4; i++) {
        const tex = T.posters[i % T.posters.length];
        if (!pmat.has(tex)) pmat.set(tex, lam({ map: tex }));
        const p = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.0), pmat.get(tex));
        p.position.set(-12.5 + i * 8.4, 1.3, SB + 0.56); p.castShadow = false; deco(p);
      }
    }
  }

  // PISO DA LOJA (crítico: "lê liso sob luz ambiente"): trilhas de rodinha de carrinho nos
  // corredores + AO sob cada fileira de gôndola
  {
    const track = new THREE.MeshBasicMaterial({ color: 0x5a6066, transparent: true, opacity: 0.3 });
    for (const z of [-18, -24, -30]) for (const tx of [-5.4, -0.9, 0.9, 5.4]) {
      const t2 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 5.4), track);
      t2.rotation.x = -Math.PI / 2; t2.position.set(tx, 0.012, z); t2.castShadow = false; deco(t2);
    }
    const ao = new THREE.MeshBasicMaterial({ color: 0x3a3e44, transparent: true, opacity: 0.28 });
    for (let r = 0; r < 4; r++) {
      const t3 = new THREE.Mesh(new THREE.PlaneGeometry(19, 1.9), ao);
      t3.rotation.x = -Math.PI / 2; t3.position.set(0, 0.011, -15 - r * 6); t3.castShadow = false; deco(t3);
    }
  }

  // ===== ESTACIONAMENTO (z ∈ [-6, HALF_Z]) — v2: o dobro de área =====
  const wZ = HALF_Z + 0.5;
  /* AO DE VÉRTICE NO MURO (BAR §3.1c e critério A1: "queda monotônica de ΔL* ≥ 8 nos
     ~15 cm antes da junção parede–chão"). O muro é a superfície que o jogador mais encosta
     o corpo no mapa e era justamente onde não havia contato nenhum — a parede simplesmente
     encostava no asfalto sem escurecer. Escurecer os vértices de baixo custa ZERO textura e
     ZERO draw call, e ainda devolve o encardido de rodapé que tive que tirar da textura
     (ele repetiria três vezes com repeat.y = 3). */
  const bakeMuroAO = (geo, h) => {
    const pos = geo.attributes.position, n = pos.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const y = pos.getY(i) + h / 2;                                  // 0 = base do muro
      const k = Math.pow(Math.min(1, y / (h * 0.34)), 0.6);           // só os 34% de baixo
      // amplitude calibrada pelo A1: entre 0 e 15 cm dá ΔL* ≈ 9 num concreto claro
      const v = 0.42 + 0.58 * k;
      col[i * 3] = v; col[i * 3 + 1] = v * 0.99; col[i * 3 + 2] = v * 0.95;   // sombra levemente quente
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  };
  // mesmo mesh, mesmo collider e mesmo occluder do addBox — só a geometria é subdividida
  // em 8 faixas de altura pra o gradiente de AO ter onde interpolar
  const muroBox = (w, h, d, mat, mx, mz) => {
    const geo = new THREE.BoxGeometry(w, h, d, 1, 8, 1); bakeMuroAO(geo, h);
    const m = new THREE.Mesh(geo, mat); m.position.set(mx, h / 2, mz);
    m.castShadow = m.receiveShadow = true; root.add(m);
    // o bakeMuroAO já resolve o LADO DA PAREDE; a saia resolve o lado do ASFALTO — sem os
    // dois o perfil do A1 continua tendo metade da junção chapada
    SKIRT.add(mx, 0, mz, w, d, 0);
    colliders.push({ minX: mx - w / 2, maxX: mx + w / 2, minY: 0, maxY: h, minZ: mz - d / 2, maxZ: mz + d / 2 });
    occluders.push(m); return m;
  };
  muroBox(2 * HALF_X + 2, 3, 1, MAT.muro, 0, wZ);                   // muro do fundo do estacionamento
  muroBox(1, 3, HALF_Z - SF, MAT.muroS, -(HALF_X + 0.5), (wZ + SF) / 2);
  muroBox(1, 3, HALF_Z - SF, MAT.muroS, (HALF_X + 0.5), (wZ + SF) / 2);
  /* FAIXA AZUL HAVAN + FILETE DOURADO: a r1 acertou em pôr a marca no muro e isso fica.
     Só saiu da TEXTURA (onde repetiria 3× na altura) e virou geometria — 6 caixas rasas,
     sem collider, sem cast de sombra, sem textura nenhuma. Sobressai 3 cm da parede, que
     é como faixa pintada sobre rufo lê de verdade. */
  {
    const azul = lam({ color: 0x2f3a8c, roughness: 0.68 });
    const BY = 2.56, BH = 0.44;   // BY = base da faixa; topo bate exatamente no rufo (y=3)
    addBox(2 * HALF_X + 2.16, BH, 1.06, azul, 0, BY, wZ, { collide: false, cast: false });
    addBox(2 * HALF_X + 2.18, 0.08, 1.08, MAT.trim, 0, BY - 0.08, wZ, { collide: false, cast: false });
    for (const sx of [-1, 1]) {
      addBox(1.06, BH, HALF_Z - SF, azul, sx * (HALF_X + 0.5), BY, (wZ + SF) / 2, { collide: false, cast: false });
      addBox(1.08, 0.08, HALF_Z - SF, MAT.trim, sx * (HALF_X + 0.5), BY - 0.08, (wZ + SF) / 2, { collide: false, cast: false });
    }
  }
  // RITMO NO MURO (crítico: "paredão liso" — 64m de parede sem nenhuma quebra de massa):
  // pilaretes salientes a cada 8m + rufo de coroamento. Tudo collide:false: a caixa de
  // colisão do muro continua exatamente a mesma, só a silhueta melhora.
  if (DECO) {
    // rufo de coroamento: era `color` chapado numa faixa de 78 m. Ganha o reboco (clone da
    // MESMA imagem, nenhum canvas novo) pra não virar mais uma barra lisa no topo do frame.
    const cap = lam({ map: reTile(REBOCO_TEX, 26, 1), color: 0xd2cdbd, roughness: 0.85 });
    /* PILARETE — este é o "coluna cinza solta no meio do estacionamento" do relatório:
       `reboco(1,2)` numa face de 0,9 m dá uma mancha branca praticamente uniforme, e como
       o reboco (#f7f4ec) é bem MAIS CLARO que o bloco do muro, ele lia como uma peça de
       outro material largada ali — geometria órfã.
       Correção: é a MESMA alvenaria do muro (clone da textura, repeat calculado pra o
       bloco sair em 40 × 20 cm também numa face de 0,9 m), com um capitel que avança e um
       plinto na base. Vira pilastra do muro, que é o que ela sempre quis ser. */
    const pil = lam({ map: reTile(MURO_TEX, 0.45, 3.1), bumpMap: reTile(MURO_TEX, 0.45, 3.1), bumpScale: 0.4, roughness: 0.93 });
    addBox(2 * HALF_X + 2.4, 0.22, 1.4, cap, 0, 3, wZ, { collide: false });
    for (const sx of [-1, 1]) addBox(1.4, 0.22, HALF_Z - SF, cap, sx * (HALF_X + 0.5), 3, (wZ + SF) / 2, { collide: false });
    // passo maior em quality low: metade dos pilaretes, mesma leitura, metade dos draw calls
    const PSTEP = DECO_HI ? 8 : 16;
    // capitel EM CIMA + plinto EMBAIXO: sem a base, a pilastra "flutua" (critério A2 —
    // todo objeto apoiado precisa de escurecimento encostado no chão) e volta a ler como
    // peça solta. O plinto é o mesmo concreto do rufo, 20 cm mais largo que o fuste.
    for (let pz = SF + 4; pz < wZ; pz += PSTEP) for (const sx of [-1, 1]) {
      addBox(0.5, 3.1, 0.9, pil, sx * (HALF_X - 0.1), 0, pz, { collide: false });
      addBox(0.75, 0.18, 1.15, cap, sx * (HALF_X - 0.1), 3.1, pz, { collide: false });
      addBox(0.66, 0.3, 1.06, cap, sx * (HALF_X - 0.1), 0, pz, { collide: false, cast: false });
    }
    for (let px = -HALF_X + 4; px <= HALF_X - 4; px += PSTEP) {
      addBox(0.9, 3.1, 0.5, pil, px, 0, wZ - 0.4, { collide: false });
      addBox(1.15, 0.18, 0.75, cap, px, 3.1, wZ - 0.4, { collide: false });
      addBox(1.06, 0.3, 0.66, cap, px, 0, wZ - 0.4, { collide: false, cast: false });
    }
  }
  // Estátua da Liberdade (centro do estacionamento — bandeira + marco).
  // ry=-π/2: fica DE COSTAS pra loja, de frente pro spawn do estacionamento (+z).
  // (o GLB de fábrica olha +x; ry=+π/2 virava ela pra loja — confirmado pelo print do dono)
  // Estátua da Liberdade: era 11m (a réplica real da Havan passa de 30m e é O landmark).
  // 15m dá a silhueta de marco sem estourar o sombreamento nem o campo de jogo; o collider
  // acompanha a altura (ela continua tampando bala/visão no miolo do mapa).
  const STAT_H = 15;
  gprop('statue_liberty', 0, 20, STAT_H, -Math.PI / 2) || addBox(3, STAT_H, 3, MAT.trim, 0, 0, 20);
  colliders.push({ minX: -1.5, maxX: 1.5, minY: 0, maxY: STAT_H, minZ: 18.5, maxZ: 21.5 });
  // pedestal baixo (0.6m): a bandeira MID fica em cima dele, então NÃO pode crescer —
  // o volume vem dos degraus concêntricos, não da altura.
  addBox(7, 0.35, 7, MAT.curb, 0, 0, 20, { collide: false });
  addBox(5.4, 0.6, 5.4, MAT.curb, 0, 0, 20, { collide: false });

  // ===== DEMARCAÇÃO DO ASFALTO (tinta gasta, não caixinha cinza chapada) =====
  // planos finos com alpha furado pelo desgaste. Zero collider, cast:false.
  // ~78 planos de tinta eram ~78 draw calls por 4 imagens. Como nenhum deles se move nem
  // colide, todos vão pro PAINT_BATCH: 4 malhas mescladas (uma por material), mesma tinta
  // na mesma vaga. O renderOrder 1 entra na chave do grupo, então a ordem de blend não muda.
  const paint = (w, d, x, z, mat, ry = 0, y = 0.02) => {
    const g = new THREE.PlaneGeometry(w, d);
    const m = new THREE.Mesh(g, mat); m.rotation.x = -Math.PI / 2; if (ry) m.rotation.z = ry;
    m.position.set(x, y, z); m.renderOrder = 1; m.castShadow = false; m.receiveShadow = false;
    return deco(m, PAINT_BATCH);
  };
  // a mesma tinta em orientações/comprimentos diferentes precisa de repeat próprio, senão
  // o desgaste vira borrão esticado numa linha de 28m. Clone só a textura (mesma imagem).
  const cloneMat = (m, rx, rz) => { const t = m.map.clone(); t.needsUpdate = true; t.repeat.set(rx, rz); return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }); };
  MAT.paintW.map.repeat.set(1, 3);
  const paintWH = cloneMat(MAT.paintW, 16, 1), paintYL = cloneMat(MAT.paintY, 1, 30), paintYH = cloneMat(MAT.paintY, 22, 1);
  const ROWS = [10, 18, 28, 36, 44, 52];
  // linhas de vaga contíguas (7m): compartilham a linha entre vagas vizinhas — Set evita
  // dois planos coplanares no mesmo x (z-fighting).
  const lineX = new Set();
  for (const g of [[-32, -25, -18, -11], [11, 18, 25, 32]]) {
    for (const xc of g) lineX.add(xc - 3.5);
    lineX.add(g[g.length - 1] + 3.5);
  }
  for (const zc of ROWS) {
    for (const lx of lineX) paint(0.14, 5.2, lx, zc, MAT.paintW);
    if (DECO_HI) for (const sx of [-1, 1]) paint(28, 0.14, sx * 21.5, zc + 2.6, paintWH);   // cabeceira da fileira
  }
  // guias amarelas: meio-fio pintado à frente da colunata e nos muros laterais
  paint(2 * SW, 0.3, 0, SF + 3.5, paintYH);
  for (const sx of [-1, 1]) paint(0.3, HALF_Z - SF - 4, sx * (HALF_X - 1.4), (wZ + SF) / 2, paintYL);
  // setas de fluxo no corredor central (dão direção de leitura ao pátio)
  if (DECO_HI) for (const az of [16, 32, 48]) {
    paint(0.42, 2.6, 0, az, MAT.paintW);                                  // haste
    for (const sx of [-1, 1]) paint(0.4, 1.5, sx * 0.42, az + 1.55, MAT.paintW, sx * 0.62);   // ponta da seta
  }
  // QUEBRA-MOLAS zebrado (0.1m: passa por cima, não vira collider nem quebra o A*)
  if (DECO) {
    const zebra = (() => {
      const c = document.createElement('canvas'); c.width = 128; c.height = 16; const x = c.getContext('2d');
      x.fillStyle = '#e8c22a'; x.fillRect(0, 0, 128, 16);
      x.fillStyle = '#26282c'; for (let i = 0; i < 4; i++) x.fillRect(i * 32, 0, 16, 16);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 1); return t;
    })();
    const zm = lam({ map: zebra, roughness: 0.85 });
    for (const bz of [23, 41]) addBox(19, 0.1, 0.75, zm, 0, 0, bz, { collide: false, cast: false });
  }
  // manchas de óleo: gradiente radial (a borda dura do CircleGeometry lia como "adesivo").
  // As 7 manchas eram 7 canvas com EXATAMENTE o mesmo gradiente — agora um material só;
  // a variação já vinha do tamanho e da rotação do plano, não da imagem.
  {
    const S = 64, c = document.createElement('canvas'); c.width = c.height = S; const cx = c.getContext('2d');
    const g = cx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(14,15,18,0.85)'); g.addColorStop(0.55, 'rgba(20,22,26,0.45)'); g.addColorStop(1, 'rgba(20,22,26,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, S, S);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const oilMat = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false });
    for (const [x, z, r, sd] of [[-14, 26, 1.9, 1], [8, 40, 1.3, 2], [22, 16, 2.1, 3], [-26, 46, 1.5, 4], [4, 8, 1.2, 5], [-19, 12, 1.6, 6], [30, 38, 1.4, 7]]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2 * (0.7 + (sd % 3) * 0.15)), oilMat);
      p.rotation.x = -Math.PI / 2; p.rotation.z = sd; p.position.set(x, 0.016, z); p.renderOrder = 1;
      p.castShadow = false; p.receiveShadow = false; deco(p, PAINT_BATCH);
    }
  }
  // CARRINHOS DE COMPRAS espalhados + baia de devolução (a assinatura de estacionamento
  // de loja: carrinho abandonado atravessado na vaga)
  const carts = [[-20, 48, 0], [24, 12, 0.8], [-30, 30, 2.1], [15.5, 24, 1.4], [-8.5, 34, 0.3], [27, 47, 2.6]];
  if (DECO_HI) carts.push([-15.5, 15, 1.9], [33, 29, 0.5], [-3.5, 47, 2.2], [20, 55, 1.1]);
  for (const [cx, cz, cry] of carts) gprop('shopping_cart', cx, cz, 1.0, cry);
  if (DECO) for (const [bx, bz] of [[-8.5, 30], [8.5, 42]]) {   // baia: dois trilhos + placa
    for (const sx of [-1, 1]) addBox(0.12, 1.1, 5, MAT.steel, bx + sx * 1.3, 0, bz, { collide: false });
    addBox(2.8, 0.12, 0.12, MAT.steel, bx, 1.1, bz - 2.4, { collide: false });
  }
  // CARROS: grade de vagas nos dois lados, contornando a estátua e o caminho central.
  // Usa a SELEÇÃO da partida (12 modelos leves sorteados por seed — ver havanCarSelection).
  let ci = 0;
  const carPool = havanCarSelection();
  const parkSpots = [];
  let _spot = 0;
  for (const zc of [10, 18, 28, 36, 44, 52]) for (const xc of [-32, -25, -18, -11, 11, 18, 25, 32]) {
    if (Math.hypot(xc, zc - 20) < 9) continue;   // deixa espaço ao redor da estátua
    // GATE DE QUALIDADE (item 5 da auditoria de custo): em 'low' o pátio fica com METADE
    // dos carros, em xadrez — continua lendo como estacionamento cheio, com metade da
    // geometria. As vagas vazias mostram a tinta de demarcação, que é conteúdo que já existe.
    if (LOWQ && (_spot++ % 2)) continue;
    parkSpots.push([xc, zc]);
  }
  for (const [x, z] of parkSpots) {
    const id = carPool[ci % carPool.length]; ci++;
    const ry = (z > 28 ? 0 : Math.PI) + (RY_FIX[id] || 0) + (Math.random() - 0.5) * 0.12;   // fileiras retas, quase alinhadas
    placeCar(id, x, z, ry);
    colliders.push({ minX: x - 1.2, maxX: x + 1.2, minY: 0, maxY: 1.4, minZ: z - 2.2, maxZ: z + 2.2 });  // collider do carro
  }
  // CARROS NA FAIXA CENTRAL (G2-R14B, pedido do dono): pares escalonados no corredor
  // x∈[-7,7] entre o spawn do estacionamento e a loja — quebram a lane aberta de tiro.
  // Cover baixo (h=1.4 < 1.6: LOS spawn↔spawn segue 0) e escalonado: o miolo x∈[-3.3,3.3]
  // e os flancos ficam livres pro A* (vãos ≥4m).
  for (const [cx, cz] of [[-5, 8], [5, 13], [-5, 26], [5, 31], [-5, 38], [5, 43]]) {
    const id = carPool[ci++ % carPool.length];
    const ry = (cz > 28 ? 0 : Math.PI) + (RY_FIX[id] || 0) + (Math.random() - 0.5) * 0.12;
    placeCar(id, cx, cz, ry);
    colliders.push({ minX: cx - 1.2, maxX: cx + 1.2, minY: 0, maxY: 1.4, minZ: cz - 2.2, maxZ: cz + 2.2 });
  }
  // ônibus urbanos no fundo do estacionamento (marco + cover grande)
  for (const bx of [-28, 28]) {
    if (!gprop('onibus_urbano', bx, 50, 2.8, 0.05)) addBox(2.9, 2.8, 7.6, MAT.trim, bx, 0, 50);
    colliders.push({ minX: bx - 1.5, maxX: bx + 1.5, minY: 0, maxY: 2.8, minZ: 46.1, maxZ: 53.9 });
  }
  // POSTES DE LUZ — antes eram addBox(0.4,4,0.4) cinza puro: a tal "coluna solta flutuando
  // no meio do estacionamento" da crítica era isto (um paralelepípedo sem luminária, sem
  // base, sem braço, do nada). O tronco de colisão continua o MESMO (0.4×4, collider +
  // occluder idênticos); tudo que foi somado é collide:false.
  const poleMat = lam({ color: 0x53595f, roughness: 0.30, metalness: 0.80, envMapIntensity: 1.7 });   // poste galvanizado: cilindro = risco de sol vertical
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xdfe7f2 });
  for (const [x, z] of [[-34, 22], [34, 22], [-34, 46], [34, 46], [-14, 54], [14, 54], [-14, 34], [14, 34]]) {
    addBox(0.4, 4, 0.4, poleMat, x, 0, z);                                  // tronco (collider/LOS inalterados)
    if (!DECO) continue;
    addBox(0.9, 0.35, 0.9, MAT.curb, x, 0, z, { collide: false });          // sapata de concreto
    const up = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.17, 2.6, 8), poleMat);
    up.position.set(x, 5.3, z); up.castShadow = true; deco(up);             // continuação afinando
    const dir = x < 0 ? 1 : -1;                                             // braço aponta pro pátio
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.5, 6), poleMat);
    arm.rotation.z = dir * Math.PI / 2.6; arm.position.set(x + dir * 0.62, 6.5, z); arm.castShadow = true; deco(arm);
    addBox(0.9, 0.2, 0.42, poleMat, x + dir * 1.25, 6.55, z, { collide: false });   // luminária
    const bulb = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.36), lampMat);
    bulb.rotation.x = Math.PI / 2; bulb.position.set(x + dir * 1.25, 6.54, z); bulb.castShadow = false; deco(bulb);
  }

  // ===== RÉPLICA DA CASA BRANCA (gabarito: toda Havan tem uma ao lado da Estátua) =====
  // CENÁRIO PURO: fica FORA do muro (x≈-58), collide:false e sem collider algum — não entra
  // no A*, não bloqueia bala, não muda o campo de jogo. Só existe como marco no horizonte.
  if (DECO_HI) {
    const CW = { x: -72, z: 18 };   // bem fora do muro (x=-38.5): o pátio dela não pode invadir o asfalto
    const wh = lam({ color: 0xf2efe6, roughness: 0.8 });
    const whRoof = lam({ color: 0xd8d4c6, roughness: 0.85 });
    addFloor(46, 40, CW.x, CW.z, MAT.curb, 0.02);                              // terreno/pátio
    addBox(24, 7.5, 11, wh, CW.x, 0, CW.z, { collide: false });                // corpo central
    for (const sx of [-1, 1]) addBox(9, 5.5, 8, wh, CW.x + sx * 16, 0, CW.z, { collide: false });   // alas
    addBox(25, 0.6, 12, whRoof, CW.x, 7.5, CW.z, { collide: false });          // platibanda
    for (const sx of [-1, 1]) addBox(9.5, 0.5, 8.5, whRoof, CW.x + sx * 16, 5.5, CW.z, { collide: false });
    // pórtico: 6 colunas + frontão, virado pro estacionamento (+x)
    const px0 = CW.x + 12.4;
    for (let i = 0; i < 6; i++) {
      const cz = CW.z - 4.5 + i * 1.8;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 7.2, 10), wh);
      col.position.set(px0, 3.6, cz); col.castShadow = true; deco(col);
    }
    addBox(2.2, 0.7, 12, whRoof, px0, 7.2, CW.z, { collide: false });
    const tri = new THREE.Shape(); tri.moveTo(-6, 0); tri.lineTo(6, 0); tri.lineTo(0, 2.2); tri.closePath();
    const fr = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 1.6, bevelEnabled: false }), wh);
    fr.rotation.y = Math.PI / 2; fr.position.set(px0 + 1.1, 7.9, CW.z); fr.castShadow = true; deco(fr);
    // rotunda + cúpula rasa no miolo (a leitura de "Casa Branca" vem daqui de longe)
    const rot = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 2.4, 20), wh);
    rot.position.set(CW.x, 9.2, CW.z); rot.castShadow = true; deco(rot);
    // hemisfério inteiro achatado: a calota parcial anterior lia como uma "foice" flutuando
    const dome = new THREE.Mesh(new THREE.SphereGeometry(4.2, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), whRoof);
    dome.scale.y = 0.72; dome.position.set(CW.x, 10.4, CW.z); dome.castShadow = true; deco(dome);
    const lant = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.8, 10), wh);   // lanternim
    lant.position.set(CW.x, 13.6, CW.z); lant.castShadow = true; deco(lant);
  }

  // ===== luz / céu / névoa leve =====
  // CONTRASTE SOL x INTERIOR: o sol era 0xffffff e a fluorescente 0xfff0dd (quente) — as
  // duas iguais, sem troca de temperatura na porta. Agora sol QUENTE de meio-dia brasileiro
  // + rebote do asfalto quente vindo de baixo, contra a fluorescente FRIA lá dentro.
  scene.background = T.sky || new THREE.Color(0x9fb8cc);
  /* NÉVOA R9: linear 85→210 era o mesmo que NÃO TER névoa — o estacionamento inteiro cabe
     dentro dos primeiros 85 m, então nenhum pixel do mapa jogável recebia um grama de haze
     e o muro do fundo lia com o MESMO microcontraste do meio-fio a 3 m. Agora FogExp2
     ρ = 0,0088: 6,7 % a 30 m, 24 % a 60 m, 54 % a 100 m e 92 % a 180 m. A cor-base saiu de
     0xb9c8d2 (chute) pro azul MEDIDO do céu logo acima da silhueta do muro, que é o que
     apaga a aresta; o calor volta pelo termo de contraluz. ?nofog=1 / ?fog2=0. */
  if (QP.get('nofog') !== '1') scene.fog = makeAerialFog('fy_havan');
  /* RAZÃO SOL/HEMI (item 8 da revisão; alvo: ΔL* sol↔sombra ≥ 26 no asfalto).
     Estava sol 1,65 / hemi 1,15 — razão 1,43. Com o sol quase a pino (elevação ~65°, ou
     seja N·L ≈ 0,90 no chão), o asfalto iluminado ficava só ~3,1× a sombra, que depois do
     ACES vira ΔL* na casa dos 20: sombra "lavada", o mapa inteiro num degrau de valor só.
     Agora 2,02 / 0,82 → razão 2,46 e ~4,9× de contraste no chão, que cai perto de ΔL* 30.
     O hemi NÃO vai a zero de propósito: o A3 proíbe sombra chapada em preto, e a sombra
     precisa continuar azulada (A6) — ela ainda recebe hemi + o IBL do PMREM do game.js.
     Meio-dia de cidade média brasileira é exatamente isto: sombra curta, dura e legível. */
  const hemi = new THREE.HemisphereLight(0xcfe0f5, 0x6d6455, 0.82); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d2, 2.02); sun.position.set(18, 55, 20); sun.castShadow = true;
  sun.shadow.mapSize.set(_q === 'low' ? 1024 : 2048, _q === 'low' ? 1024 : 2048); sun.shadow.camera.left = -60; sun.shadow.camera.right = 60; sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60; sun.shadow.camera.far = 200; sun.shadow.bias = -0.0004;
  scene.add(sun);

  // ===== ground height (mezanino elevado + rampa) =====
  function groundHeightAt(x, z) {
    if (x > MZ.x0 && x < MZ.x1 && z > MZ.z0 && z < MZ.z1) return MZ.h;
    if (x > RAMP.x0 && x < RAMP.x1 && z > RAMP.z0 && z < RAMP.z1) return MZ.h * Math.max(0, Math.min(1, (RAMP.z1 - z) / (RAMP.z1 - RAMP.z0)));
    return 0;
  }

  // ===== waypoints + A* =====
  const nodes = [], adj = [], STEP = 3.4;
  const blocked = (x, z, inf) => { const g = groundHeightAt(x, z); for (const c of colliders) { if (x > c.minX - inf && x < c.maxX + inf && z > c.minZ - inf && z < c.maxZ + inf && c.minY < g + 1.6 && c.maxY > g + 0.15) return true; } return false; };
  for (let gx = -HALF_X + 2; gx <= HALF_X - 2; gx += STEP)
    for (let gz = -HALF_Z + 2; gz <= HALF_Z - 2; gz += STEP)
      if (!blocked(gx, gz, 0.5)) nodes.push({ x: gx, z: gz });
  const segClear = (a, b) => { for (let i = 1; i < 6; i++) { const t = i / 6, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t; if (blocked(x, z, 0.25)) return false; if (Math.abs(groundHeightAt(x, z) - groundHeightAt(a.x, a.z)) > 0.7) return false; } return true; };
  for (let i = 0; i < nodes.length; i++) { adj.push([]); for (let j = 0; j < nodes.length; j++) { if (i === j) continue; const dx = nodes[i].x - nodes[j].x, dz = nodes[i].z - nodes[j].z; if (dx * dx + dz * dz < STEP * STEP * 2.4 && segClear(nodes[i], nodes[j])) adj[i].push(j); } }
  function nearestWaypoint(x, z) { let b = 0, bd = 1e9; for (let i = 0; i < nodes.length; i++) { const dx = nodes[i].x - x, dz = nodes[i].z - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; b = i; } } return b; }
  const _D = (a, b) => { const dx = nodes[a].x - nodes[b].x, dz = nodes[a].z - nodes[b].z; return Math.sqrt(dx * dx + dz * dz); };
  function findPath(fromIdx, toIdx) {
    if (fromIdx === toIdx) return [toIdx];
    const n = nodes.length, g = new Float32Array(n).fill(Infinity), f = new Float32Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), open = new Uint8Array(n);
    g[fromIdx] = 0; f[fromIdx] = _D(fromIdx, toIdx); open[fromIdx] = 1; let oc = 1;   // sem o open[fromIdx] o A* falha SEMPRE (bots andavam em linha reta!)
    while (oc > 0) { let cur = -1, bf = Infinity; for (let i = 0; i < n; i++) if (open[i] && f[i] < bf) { bf = f[i]; cur = i; } if (cur === -1) break;
      if (cur === toIdx) { const p = [cur]; let c = prev[cur]; while (c !== -1) { p.unshift(c); c = prev[c]; } return p; }
      open[cur] = 0; oc--; for (const m of adj[cur]) { const t = g[cur] + _D(cur, m); if (t < g[m]) { prev[m] = cur; g[m] = t; f[m] = t + _D(m, toIdx); if (!open[m]) { open[m] = 1; oc++; } } } }
    return [fromIdx];
  }

  // spawns: Bolsonaristas (B) DENTRO da loja ATRÁS da última gôndola (cover da fileira);
  // o outro time (P) no estacionamento, flanqueado por carros (cover dos veículos).
  const spawns = {
    B: [-10, -5, 0, 5].map(x => ({ x, z: -31, yaw: 0 })),        // entre gôndolas 3 e 4 (fileira z=-27 cobre da porta)
    P: [-8, -3, 3, 8].map(x => ({ x, z: HALF_Z - 3, yaw: Math.PI })), // fundo do estacionamento
  };
  // carros de proteção do spawn P (flanqueiam a bandeira ESTACIONAMENTO, fora do anel).
  // G2-R6B: linha alargada (±13) + carro de frente (0, 44.5) — o respawn do estacionamento
  // nasce atrás de uma BARREIRA de veículos (cover físico imediato; A* contorna, h=1.4
  // não interfere no LOS spawn↔spawn que já é 0).
  for (const [cx, cz, cry] of [[-6, 50.5, 0.1], [6, 50.5, -0.1], [-13, 50.5, 0.06], [13, 50.5, -0.06], [0, 44.5, 0.04]]) {
    const id = carPool[ci++ % carPool.length];
    placeCar(id, cx, cz, Math.PI + cry);
    colliders.push({ minX: cx - 1.2, maxX: cx + 1.2, minY: 0, maxY: 1.4, minZ: cz - 2.2, maxZ: cz + 2.2 });
  }
  // 3 bandeiras: estacionamento, estátua, gôndolas (corredor central da loja)
  const ctfPoints = [
    { id: 'P', label: 'ESTACIONAMENTO', x: 0, z: HALF_Z - 8 },
    { id: 'MID', label: 'ESTÁTUA', x: 0, z: 20 },
    { id: 'B', label: 'GÔNDOLAS', x: 0, z: -24 },
  ];

  // arsenal: rifles nas gôndolas/loja, snipers no mezanino, pistolas nos spawns
  const gmat = lam({ color: 0x20242a });
  const place = (kind, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 1.0), gmat); m.position.set(x, groundHeightAt(x, z) + 0.1, z); m.castShadow = true; root.add(m); pickups.push({ x, z, kind, weapon: kind, readyAt: 0, mesh: m }); };
  ['ak', 'm4', 'mp5', 'shotgun'].forEach((k, i) => place(k, -9 + i * 6, -13));
  place('awp', 0, MZ.z0 + 2); place('m400', -10, MZ.z0 + 2);   // snipers no mezanino
  ['deagle', 'ak', 'm4', 'shotgun', 'mp5', 'awp'].forEach((k, i) => place(k, -25 + i * 10, 44));   // estacionamento

  // saia de contato: todas as bases registradas viram UMA malha mesclada = 1 draw call
  SKIRT.build(root);
  /* MERGE + INSTANCING (têm que rodar DEPOIS de todo mundo registrar).
     Ordem importa só pro PAINT_BATCH: ele carrega renderOrder 1 e materiais transparentes,
     e sai da mesma forma que os planos individuais saíam. */
  DECO_BATCH.build(root);
  PAINT_BATCH.build(root);
  PROPS.build(root);
  PROPS_LOJA.build(root);

  return {
    root, colliders, occluders, groundHeightAt, spawns, sun, hemi, pickups, doors, ctfPoints,
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    bounds: { minX: -HALF_X + 0.5, maxX: HALF_X - 0.5, minZ: -HALF_Z + 0.5, maxZ: HALF_Z - 0.5 },
  };
}
