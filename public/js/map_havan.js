// Havan (fy_havan) — CTF, v2: estacionamento MAIOR (76×116, 40+ vagas, 34 modelos de carro)
// e texturas ricas (asfalto c/ óleo+rachadura, azul Havan c/ sujeira). G2-R3: fachada
// GRECO-ROMANA (frontão c/ logo, colunata, cornija, banners) como skin sobre a estrutura.
// Bolsonaristas spawnam
// DENTRO da loja (gôndolas, caixas, mezanino-sniper, porta com sensor); o outro time spawna
// no ESTACIONAMENTO (carros GLB texturizados + Estátua da Liberdade). 3 bandeiras:
// estacionamento, estátua, gôndolas. Contrato buildWorld + A*. Props de /Users/ruben/glb.
import * as THREE from 'three';
import { placeProp, hasProp } from './mapprops.js';

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
let _carSeed = 1;
export function setHavanCarSeed(s) { _carSeed = (s | 0) || 1; }
export function havanCarSelection(n = 12) {
  const arr = LIGHT_CARS.filter(id => !MINT_BR.includes(id)); let s = _carSeed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const out = [...MINT_BR];
  while (out.length < Math.max(n, MINT_BR.length) && arr.length) out.push(arr.splice((rnd() * arr.length) | 0, 1)[0]);
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

export function buildHavan(scene, T) {
  const colliders = [], occluders = [], pickups = [], doors = [];
  const root = new THREE.Group(); scene.add(root);
  const lam = (o) => new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...o });
  const MAT = {
    lot: lam({ map: noiseTex('#565b62', [['#484d54', 55, 10, 30, 0.5], ['#666c74', 40, 8, 22, 0.4], ['#2e3236', 12, 5, 13, 0.4]], 24, 34, { cracks: '#3c4046', pebbles: '#767c84', seed: 5 }) }),  // asfalto c/ óleo+rachadura
    floor: lam({ map: noiseTex('#c9cfd6', [['#b2b9c0', 40, 8, 22, 0.45], ['#dde2e7', 30, 6, 18, 0.35], ['#8a929a', 14, 4, 12, 0.4]], 16, 16, { cracks: '#9aa2aa', pebbles: '#eef1f4', seed: 9 }) }),  // cerâmica c/ marcas de rodinha
    wall: lam({ map: acmTex(8, 2) }),                                    // painel ACM azul c/ emendas
    trim: lam({ color: 0xf4c020 }),
    shelf: lam({ color: 0xb9bec4 }), goods: lam({ color: 0xe07a3a }), rack: lam({ color: 0x3a3f45 }),
    caixa: lam({ color: 0xdfe4e8 }), glass: lam({ color: 0x9fd0e8, transparent: true, opacity: 0.4 }),
    steel: lam({ color: 0x8a9096 }), mez: lam({ color: 0xc7ccd2 }), curb: lam({ color: 0xd8d2c0 }),
    muro: lam({ color: 0xe6e3da }),                                          // muro do estacionamento: concreto claro (era ACM azul — quebrava a ilusão "templo branco")
  };
  function addBox(w, h, d, mat, x, y, z, opts = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z); m.castShadow = opts.cast !== false; m.receiveShadow = true;
    if (opts.ry) m.rotation.y = opts.ry; root.add(m);
    if (opts.collide !== false) { colliders.push({ minX: x - w / 2, maxX: x + w / 2, minY: y, maxY: y + h, minZ: z - d / 2, maxZ: z + d / 2 }); occluders.push(m); }
    return m;
  }
  const addFloor = (w, d, x, z, mat, y = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; root.add(m); };
  const gprop = (id, x, z, h, ry = 0, y = 0) => { const o = placeProp(id, { x, y, z, targetH: h, ry }); if (o) root.add(o); return !!o; };
  // fallback enquanto o GLB não carrega (ou falha): mini-carro colorido por hash do id —
  // substitui a caixa preta que fazia o estacionamento parecer quebrado no menu/loading.
  const CAR_COLORS = [0xb03a2e, 0x2e6db0, 0xd9a821, 0xdedbd2, 0x3a3f45, 0x4a6e4f, 0x8a4a2a, 0x6a3a8c];
  function fallbackCar(id, x, z, ry) {
    let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 4.2), lam({ color: CAR_COLORS[Math.abs(h) % CAR_COLORS.length], metalness: 0.4, roughness: 0.5 }));
    body.position.y = 0.55; body.castShadow = body.receiveShadow = true; g.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.1), lam({ color: 0x20242a, metalness: 0.2, roughness: 0.3 }));
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
    const plaster = lam({ color: 0xf9f7f1, roughness: 0.85 });   // branco-estuco das fotos (era 0xf1ede2 — lia cinza)
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
      addBox(1.0, 0.35, 1.0, plaster, x, 0, z, { collide: false });                     // base
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.34, 4.15, 12), plaster);
      shaft.position.set(x, 0.35 + 4.15 / 2, z); shaft.castShadow = shaft.receiveShadow = true; root.add(shaft);
      addBox(0.72, 0.22, 0.72, plaster, x, 4.5, z, { collide: false });                 // pescoço
      addBox(1.0, 0.28, 1.0, plaster, x, 4.72, z, { collide: false });                  // ábaco do capitel sob a cornija
    }
    // BANNERS verticais coloridos pendurados entre as colunas (painéis das fotos)
    const bannerDefs = [['#2f3a8c', 'OFERTAS'], ['#c8342e', 'ELETRO'], ['#e9a614', 'MERCADO'], ['#2e7d4f', 'MODA']];
    for (const sx of [-1, 1]) [7.5, 12.5, 17.5, 22.5].forEach((bx, i) => {
      const [bg, label] = bannerDefs[i % bannerDefs.length];
      const c = document.createElement('canvas'); c.width = 256; c.height = 512; const x2 = c.getContext('2d');
      x2.fillStyle = bg; x2.fillRect(0, 0, 256, 512);
      x2.fillStyle = 'rgba(255,255,255,0.18)'; x2.fillRect(0, 0, 256, 36); x2.fillRect(0, 476, 256, 36);
      x2.fillStyle = '#ffffff'; x2.textAlign = 'center';
      x2.save(); x2.translate(128, 256); x2.rotate(-Math.PI / 2);
      x2.font = 'bold 76px "Arial Black",Impact,sans-serif'; x2.fillText(label, 0, 27); x2.restore();
      const t2 = new THREE.CanvasTexture(c); t2.colorSpace = THREE.SRGBColorSpace;
      const b = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.9),
        new THREE.MeshStandardMaterial({ map: t2, roughness: 0.8, side: THREE.DoubleSide }));
      b.position.set(sx * bx, 3.35, SF + 1.9); b.castShadow = true; root.add(b);
    });
    // CORNIJA corrida no topo, avançando da parede até cobrir a colunata
    addBox(2 * HALF_X + 1, 0.55, 2.3, plaster, 0, 5.0, SF + 1.05, { collide: false });
    addBox(2 * HALF_X + 1, 0.2, 1.6, plaster, 0, 5.55, SF + 0.7, { collide: false });   // filete superior
    // FRONTÃO triangular central (tímpano branco) c/ logo HAVAN azul
    {
      const tri = new THREE.Shape(); tri.moveTo(-13, 0); tri.lineTo(13, 0); tri.lineTo(0, 3.8); tri.closePath();
      const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 1.6, bevelEnabled: false }), plaster);
      ped.position.set(0, 5.75, SF + 0.1); ped.castShadow = true; root.add(ped);
      const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const x2 = c.getContext('2d');
      x2.textAlign = 'center'; x2.fillStyle = '#2f3a8c';
      x2.font = 'bold 190px "Arial Black",Impact,sans-serif'; x2.fillText('HAVAN', 512, 195);
      const t2 = new THREE.CanvasTexture(c); t2.colorSpace = THREE.SRGBColorSpace;
      const s = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5), new THREE.MeshBasicMaterial({ map: t2, transparent: true }));
      s.position.set(0, 6.9, SF + 1.76); root.add(s);
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
      v.position.set(x, 2.3, SF + 0.55); root.add(v);
    }
  }
  // teto (alto, sem colisão) — DoubleSide: antes virado só pra cima = céu aparecendo DENTRO da loja
  { const t = new THREE.Mesh(new THREE.PlaneGeometry(2 * SW, SF - SB), new THREE.MeshStandardMaterial({ map: tileTex('#c7ccd2', '#aab1b8', 6, 8, 5), roughness: 0.9, side: THREE.DoubleSide }));
    t.rotation.x = -Math.PI / 2; t.position.set(0, 6.2, (SF + SB) / 2); t.receiveShadow = true; root.add(t); }

  // PORTA COM SENSOR (2 folhas de vidro no vão; game.js abre ao chegar perto — ver world.doors)
  {
    const pl = addBox(4, 4, 0.2, MAT.glass, -2, 0, SF, { cast: false, collide: false });
    const pr = addBox(4, 4, 0.2, MAT.glass, 2, 0, SF, { cast: false, collide: false });
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
  const lightPanel = new THREE.MeshBasicMaterial({ color: 0xfff4d8 });
  for (const z of [-14, -24, -34]) {
    for (const x of [-14, 0, 14]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.6), lightPanel);
      p.rotation.x = Math.PI / 2; p.position.set(x, 6.1, z); root.add(p);
    }
    const pt = new THREE.PointLight(0xfff0dd, 55, 34, 1.6); pt.position.set(0, 5.4, z); root.add(pt);
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
    const secSign = (title) => {
      const c = document.createElement('canvas'); c.width = 512; c.height = 128;
      const x = c.getContext('2d');
      x.fillStyle = '#2f3a8c'; x.fillRect(0, 0, 512, 128);
      x.textAlign = 'center'; x.fillStyle = '#f4c020';
      let px = 56; x.font = `bold ${px}px "Arial Black",Impact,sans-serif`;
      while (x.measureText(title).width > 466 && px > 24) { px -= 4; x.font = `bold ${px}px "Arial Black",Impact,sans-serif`; }
      x.fillText(title, 256, 82);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    };
    for (const [t2, x] of [['ELETRO', -19], ['CAMA MESA BANHO', -6], ['MERCADO', 7], ['MODA', 19]]) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.4), new THREE.MeshBasicMaterial({ map: secSign(t2) }));
      s.position.set(x, 2.55, SB + 0.56); root.add(s);
    }
    if (T.posters && T.posters.length) for (let i = 0; i < 4; i++) {   // pôsteres de oferta
      const p = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.0), lam({ map: T.posters[i % T.posters.length] }));
      p.position.set(-12.5 + i * 8.4, 1.3, SB + 0.56); root.add(p);
    }
  }

  // PISO DA LOJA (crítico: "lê liso sob luz ambiente"): trilhas de rodinha de carrinho nos
  // corredores + AO sob cada fileira de gôndola
  {
    const track = new THREE.MeshBasicMaterial({ color: 0x5a6066, transparent: true, opacity: 0.3 });
    for (const z of [-18, -24, -30]) for (const tx of [-5.4, -0.9, 0.9, 5.4]) {
      const t2 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 5.4), track);
      t2.rotation.x = -Math.PI / 2; t2.position.set(tx, 0.012, z); root.add(t2);
    }
    const ao = new THREE.MeshBasicMaterial({ color: 0x3a3e44, transparent: true, opacity: 0.28 });
    for (let r = 0; r < 4; r++) {
      const t3 = new THREE.Mesh(new THREE.PlaneGeometry(19, 1.9), ao);
      t3.rotation.x = -Math.PI / 2; t3.position.set(0, 0.011, -15 - r * 6); root.add(t3);
    }
  }

  // ===== ESTACIONAMENTO (z ∈ [-6, HALF_Z]) — v2: o dobro de área =====
  const wZ = HALF_Z + 0.5;
  addBox(2 * HALF_X + 2, 3, 1, MAT.muro, 0, 0, wZ);                 // muro do fundo do estacionamento
  addBox(1, 3, HALF_Z - SF, MAT.muro, -(HALF_X + 0.5), 0, (wZ + SF) / 2);
  addBox(1, 3, HALF_Z - SF, MAT.muro, (HALF_X + 0.5), 0, (wZ + SF) / 2);
  // Estátua da Liberdade (centro do estacionamento — bandeira + marco).
  // ry=-π/2: fica DE COSTAS pra loja, de frente pro spawn do estacionamento (+z).
  // (o GLB de fábrica olha +x; ry=+π/2 virava ela pra loja — confirmado pelo print do dono)
  gprop('statue_liberty', 0, 20, 11, -Math.PI / 2) || addBox(3, 11, 3, MAT.trim, 0, 0, 20);
  colliders.push({ minX: -1.5, maxX: 1.5, minY: 0, maxY: 11, minZ: 18.5, maxZ: 21.5 });   // a estátua BLOQUEIA bala/visão (11m no meio do mapa)
  addBox(6, 0.6, 6, MAT.curb, 0, 0, 20, { collide: false });        // base da estátua
  // faixas de vaga + carrinhos de compra soltos
  for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) addBox(0.2, 0.02, 5, MAT.curb, -32 + i * 8, 0.01, 12 + r * 16, { collide: false, cast: false });
  // vagas demarcadas em TODAS as fileiras (crítico: "estacionamento morto")
  for (const zc of [10, 18, 28, 36, 44, 52]) for (const xc of [-32, -25, -18, -11, 11, 18, 25, 32]) {
    addBox(0.15, 0.02, 5, MAT.curb, xc - 2.5, 0.01, zc, { collide: false, cast: false });
  }
  // manchas de óleo no asfalto (variação de primeira-leitura)
  for (const [x, z, r] of [[-14, 26, 1.6], [8, 40, 1.2], [22, 16, 1.8], [-26, 46, 1.4], [4, 8, 1.1]]) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(r, 18), new THREE.MeshBasicMaterial({ color: 0x1a1c20, transparent: true, opacity: 0.5 }));
    p.rotation.x = -Math.PI / 2; p.position.set(x, 0.015, z); root.add(p);
  }
  gprop('shopping_cart', -20, 48, 1.0); gprop('shopping_cart', 24, 12, 1.0, 0.8); gprop('shopping_cart', -30, 30, 1.0, 2.1);
  // CARROS: grade de vagas nos dois lados, contornando a estátua e o caminho central.
  // Usa a SELEÇÃO da partida (12 modelos leves sorteados por seed — ver havanCarSelection).
  let ci = 0;
  const carPool = havanCarSelection();
  const parkSpots = [];
  for (const zc of [10, 18, 28, 36, 44, 52]) for (const xc of [-32, -25, -18, -11, 11, 18, 25, 32]) {
    if (Math.hypot(xc, zc - 20) < 9) continue;   // deixa espaço ao redor da estátua
    parkSpots.push([xc, zc]);
  }
  for (const [x, z] of parkSpots) {
    const id = carPool[ci % carPool.length]; ci++;
    const ry = (z > 28 ? 0 : Math.PI) + (RY_FIX[id] || 0) + (Math.random() - 0.5) * 0.12;   // fileiras retas, quase alinhadas
    if (!gprop(id, x, z, 1.55, ry)) fallbackCar(id, x, z, ry);          // fallback = mini-carro colorido
    colliders.push({ minX: x - 1.2, maxX: x + 1.2, minY: 0, maxY: 1.4, minZ: z - 2.2, maxZ: z + 2.2 });  // collider do carro
  }
  // CARROS NA FAIXA CENTRAL (G2-R14B, pedido do dono): pares escalonados no corredor
  // x∈[-7,7] entre o spawn do estacionamento e a loja — quebram a lane aberta de tiro.
  // Cover baixo (h=1.4 < 1.6: LOS spawn↔spawn segue 0) e escalonado: o miolo x∈[-3.3,3.3]
  // e os flancos ficam livres pro A* (vãos ≥4m).
  for (const [cx, cz] of [[-5, 8], [5, 13], [-5, 26], [5, 31], [-5, 38], [5, 43]]) {
    const id = carPool[ci++ % carPool.length];
    const ry = (cz > 28 ? 0 : Math.PI) + (RY_FIX[id] || 0) + (Math.random() - 0.5) * 0.12;
    if (!gprop(id, cx, cz, 1.55, ry)) fallbackCar(id, cx, cz, ry);
    colliders.push({ minX: cx - 1.2, maxX: cx + 1.2, minY: 0, maxY: 1.4, minZ: cz - 2.2, maxZ: cz + 2.2 });
  }
  // ônibus urbanos no fundo do estacionamento (marco + cover grande)
  for (const bx of [-28, 28]) {
    if (!gprop('onibus_urbano', bx, 50, 2.8, 0.05)) addBox(2.9, 2.8, 7.6, MAT.trim, bx, 0, 50);
    colliders.push({ minX: bx - 1.5, maxX: bx + 1.5, minY: 0, maxY: 2.8, minZ: 46.1, maxZ: 53.9 });
  }
  // postes de luz (cover fino)
  for (const [x, z] of [[-34, 22], [34, 22], [-34, 46], [34, 46], [-14, 54], [14, 54], [-14, 34], [14, 34]]) addBox(0.4, 4, 0.4, MAT.steel, x, 0, z);

  // ===== luz / céu / névoa leve =====
  scene.background = T.sky || new THREE.Color(0x9fb8cc);
  scene.fog = new THREE.Fog(0x9fb8cc, 70, 190);
  const hemi = new THREE.HemisphereLight(0xf0f5ff, 0x555a60, 1.2); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(18, 55, 20); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -60; sun.shadow.camera.right = 60; sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60; sun.shadow.camera.far = 200; sun.shadow.bias = -0.0004;
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
    if (!gprop(id, cx, cz, 1.55, Math.PI + cry)) fallbackCar(id, cx, cz, Math.PI + cry);
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

  return {
    root, colliders, occluders, groundHeightAt, spawns, sun, hemi, pickups, doors, ctfPoints,
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    bounds: { minX: -HALF_X + 0.5, maxX: HALF_X - 0.5, minZ: -HALF_Z + 0.5, maxZ: HALF_Z - 0.5 },
  };
}
