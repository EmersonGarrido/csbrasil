// Piscinão de Ramos — balneário público BR ao ar livre (fy_pool_day). Baseado no real: uma
// LAGOA grande central anelada por AREIA, com instalações ao redor (quiosques, quadra de
// vôlei + arquibancada) que viram COVER e CORREDORES. Maior e seccionado (não só aberto):
// corredores de proteção nos respawns e nas laterais. Mesmo contrato buildWorld do map.js.
import * as THREE from 'three';
import { placeProp, hasProp } from './mapprops.js';   // props GLB do Mint (quiosque, guarda-sol, torre…)

const HALF_X = 24, HALF_Z = 36;   // interior half-extents (bem maior que o antigo 17×25)
const WALL_H = 3.4;                // muro-perímetro baixo, open-air (céu aberto)

/* ---------- texturas procedurais inline ---------- */
function mkTex(c, rx = 1, rz = 1, clamp = false) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.repeat.set(rx, rz);
  return t;
}
function tileTex(base, line, n, rx, rz) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 128, 128);
  x.strokeStyle = line; x.lineWidth = 3;
  const s = 128 / n;
  for (let i = 0; i <= n; i++) {
    x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s, 128); x.stroke();
    x.beginPath(); x.moveTo(0, i * s); x.lineTo(128, i * s); x.stroke();
  }
  for (let i = 0; i < 120; i++) { x.fillStyle = `rgba(120,140,160,${Math.random() * 0.05})`; x.fillRect(Math.random() * 128, Math.random() * 128, 4, 4); }
  return mkTex(c, rx, rz);
}
function sandTex(rx, rz) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#e6d3a3'; x.fillRect(0, 0, 128, 128);
  let seed = 17; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // manchas grandes: areia molhada/pisada (quebra a lisura vista do chão)
  for (let i = 0; i < 9; i++) {
    x.fillStyle = `rgba(${150 + rnd() * 40 | 0},${115 + rnd() * 30 | 0},${70 + rnd() * 25 | 0},${0.14 + rnd() * 0.16})`;
    x.beginPath(); x.ellipse(rnd() * 128, rnd() * 128, 14 + rnd() * 30, 8 + rnd() * 18, rnd() * 3, 0, 7); x.fill();
  }
  // pegadas apagadas
  for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(120,95,60,${0.1 + rnd() * 0.14})`; x.beginPath(); x.ellipse(rnd() * 128, rnd() * 128, 2.6, 1.4, rnd() * 3, 0, 7); x.fill(); }
  for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${150 + Math.random() * 80 | 0},${120 + Math.random() * 70 | 0},${70 + Math.random() * 50 | 0},.5)`; x.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); }
  // DETRITOS: conchinha, graveto, tampinha, bituca — a areia do Piscinão nunca é limpa.
  // Entram na textura (custo zero em draw call) e matam a lisura no plano rasante.
  for (let i = 0; i < 34; i++) {
    const px = rnd() * 128, py = rnd() * 128, t = rnd();
    if (t < 0.4) { x.fillStyle = 'rgba(238,232,214,0.8)'; x.beginPath(); x.ellipse(px, py, 1.8, 1.1, rnd() * 3, 0, 7); x.fill(); }        // concha
    else if (t < 0.7) { x.strokeStyle = 'rgba(84,64,40,0.7)'; x.lineWidth = 1; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 8, py + (rnd() - 0.5) * 8); x.stroke(); }   // graveto
    else { x.fillStyle = rnd() > 0.5 ? 'rgba(190,50,40,0.75)' : 'rgba(40,70,140,0.7)'; x.fillRect(px, py, 1.6, 1.6); }                   // tampinha/plástico
  }
  return mkTex(c, rx, rz);
}
// concreto com STREAKS VERTICAIS de umidade (crítico R6: blobs ovais liam como "pelagem
// de vaca" na maior superfície do mapa) — contraste baixo, escala fina, junta horizontal
function concreteTex(rx, rz) {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  x.fillStyle = '#b9b3a6'; x.fillRect(0, 0, S, S);
  let seed = 13; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 16; i++) {   // variação tonal SUAVE (sem blob duro)
    x.fillStyle = rnd() > 0.5 ? 'rgba(150,144,132,0.22)' : 'rgba(198,192,180,0.2)';
    x.beginPath(); x.ellipse(rnd() * S, rnd() * S, 5 + rnd() * 12, 4 + rnd() * 9, rnd() * 3, 0, 7); x.fill();
  }
  for (let i = 0; i < 18; i++) {   // umidade escorrida VERTICAL (gravidade)
    const px = rnd() * S, py = rnd() * S * 0.5, len = 22 + rnd() * 62, w = 1.5 + rnd() * 3.5;
    const g = x.createLinearGradient(px, py, px, py + len);
    g.addColorStop(0, `rgba(110,104,92,${0.16 + rnd() * 0.18})`); g.addColorStop(1, 'rgba(110,104,92,0)');
    x.fillStyle = g; x.fillRect(px - w / 2, py, w, len);
  }
  for (let i = 0; i < 480; i++) { x.fillStyle = `rgba(84,80,70,${rnd() * 0.3})`; x.fillRect(rnd() * S, rnd() * S, 1.5, 1.5); }
  // MOFO no concreto: bolor verde-preto onde a água escorre e não pega sol
  for (let i = 0; i < 9; i++) {
    const mx = rnd() * S, my = S * (0.4 + rnd() * 0.55), mr = 6 + rnd() * 18;
    const mg = x.createRadialGradient(mx, my, 1, mx, my, mr);
    mg.addColorStop(0, `rgba(54,66,48,${0.18 + rnd() * 0.2})`); mg.addColorStop(1, 'rgba(54,66,48,0)');
    x.fillStyle = mg; x.beginPath(); x.ellipse(mx, my, mr, mr * 0.7, rnd() * 3, 0, 7); x.fill();
  }
  x.strokeStyle = 'rgba(96,92,82,0.6)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, S / 2); x.lineTo(S, S / 2); x.stroke();
  x.strokeStyle = 'rgba(52,58,46,0.35)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, S / 2 + 2.5); x.lineTo(S, S / 2 + 2.5); x.stroke();   // limo acumulado na junta
  return mkTex(c, rx, rz);
}
// parede PINTADA desgastada (tinta descascando mostra o concreto, sujeira no rodapé) —
// varia a pintura dos trechos do muro-perímetro (crítico R6: "muro bege gigante")
function paintWallTex(base, seed = 7) {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 10; i++) {   // descascado pequeno: concreto aparecendo (SEM elipses grandes —
    x.fillStyle = `rgba(178,172,158,${0.35 + rnd() * 0.3})`;   // liam como "holofotes borrados" no azul)
    x.beginPath(); x.ellipse(rnd() * S, rnd() * S, 2 + rnd() * 5, 1.5 + rnd() * 4, rnd() * 3, 0, 7); x.fill();
  }
  for (let i = 0; i < 22; i++) {   // streaks VERTICAIS de chuva/tinta (gravidade)
    const px = rnd() * S, py = rnd() * S * 0.4, len = 30 + rnd() * 90, w = 1.5 + rnd() * 4;
    const g = x.createLinearGradient(px, py, px, py + len);
    g.addColorStop(0, `rgba(70,64,54,${0.1 + rnd() * 0.14})`); g.addColorStop(1, 'rgba(70,64,54,0)');
    x.fillStyle = g; x.fillRect(px - w / 2, py, w, len);
  }
  for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(70,66,58,${rnd() * 0.22})`; x.fillRect(rnd() * S, rnd() * S, 1.6, 1.6); }
  // MOFO: manchas verde-escuras irregulares na sombra + no rodapé. É o que falta pro
  // reboco carioca não parecer parede de maquete — clima quente e úmido = bolor sempre.
  for (let i = 0; i < 14; i++) {
    const mx = rnd() * S, my = S * (0.35 + rnd() * 0.6), mr = 8 + rnd() * 26;
    const mg = x.createRadialGradient(mx, my, 1, mx, my, mr);
    mg.addColorStop(0, `rgba(58,72,50,${0.2 + rnd() * 0.22})`); mg.addColorStop(1, 'rgba(58,72,50,0)');
    x.fillStyle = mg; x.beginPath(); x.ellipse(mx, my, mr, mr * (0.5 + rnd() * 0.5), rnd() * 3, 0, 7); x.fill();
  }
  // ESCORRIMENTO de ferrugem sob pontos de fixação (grade, cano, ferragem exposta)
  for (let i = 0; i < 5; i++) {
    const px = rnd() * S, py = rnd() * S * 0.5, len = 40 + rnd() * 90;
    const rg = x.createLinearGradient(px, py, px, py + len);
    rg.addColorStop(0, `rgba(126,72,36,${0.3 + rnd() * 0.25})`); rg.addColorStop(1, 'rgba(126,72,36,0)');
    x.fillStyle = rg; x.fillRect(px - 1.5, py, 3 + rnd() * 2, len);
    x.fillStyle = 'rgba(96,60,34,0.5)'; x.beginPath(); x.arc(px, py, 2.5, 0, 7); x.fill();   // o próprio ferro
  }
  // sujeira/umidade subindo do rodapé (capilaridade — mais forte perto da água)
  const g = x.createLinearGradient(0, S * 0.62, 0, S);
  g.addColorStop(0, 'rgba(60,54,44,0)'); g.addColorStop(0.6, 'rgba(58,60,46,0.3)'); g.addColorStop(1, 'rgba(48,52,40,0.62)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  return mkTex(c, 1, 1);
}
// faixa pintada gasta (substitui a faixa plástico plano dos corredores)
function stripeTex(hex, seed = 19) {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  x.fillStyle = hex; x.fillRect(0, 0, S, S);
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 16; i++) { x.fillStyle = `rgba(255,255,255,${0.04 + rnd() * 0.08})`; x.fillRect(rnd() * S, 0, 2 + rnd() * 8, S); }
  for (let i = 0; i < 22; i++) {   // descascado mostrando o concreto
    x.fillStyle = `rgba(185,179,166,${0.4 + rnd() * 0.4})`;
    x.beginPath(); x.ellipse(rnd() * S, rnd() * S, 2 + rnd() * 6, 1.5 + rnd() * 4, rnd() * 3, 0, 7); x.fill();
  }
  const g = x.createLinearGradient(0, 0, 0, S);   // sombra em cima/baixo = volume
  g.addColorStop(0, 'rgba(0,0,0,0.3)'); g.addColorStop(0.25, 'rgba(0,0,0,0)'); g.addColorStop(0.8, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  return mkTex(c, 6, 1);
}
// face de bloco com RODAPÉ DE AZULEJO navy (bicolor: concreto em cima, azulejo embaixo).
// Mesma linguagem do concreteTex novo: streaks verticais, sem "pelagem de vaca".
function bandTex(rx = 1, base = '#b9b3a6') {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const x = c.getContext('2d');
  let seed = 23; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  x.fillStyle = base; x.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 12; i++) { x.fillStyle = rnd() > 0.5 ? 'rgba(150,144,132,0.2)' : 'rgba(198,192,180,0.18)'; x.beginPath(); x.ellipse(rnd() * 256, rnd() * 128, 5 + rnd() * 12, 4 + rnd() * 8, rnd() * 3, 0, 7); x.fill(); }
  for (let i = 0; i < 26; i++) {   // umidade escorrida vertical (contraste reforçado — lia como cor chapada)
    const px = rnd() * 256, py = rnd() * 60, len = 20 + rnd() * 60, w = 1.5 + rnd() * 3;
    const g = x.createLinearGradient(px, py, px, py + len);
    g.addColorStop(0, `rgba(70,64,54,${0.22 + rnd() * 0.2})`); g.addColorStop(1, 'rgba(70,64,54,0)');
    x.fillStyle = g; x.fillRect(px - w / 2, py, w, len);
  }
  for (let i = 0; i < 14; i++) {   // descascado visível também nas cores (concreto claro por baixo)
    x.fillStyle = `rgba(196,190,176,${0.3 + rnd() * 0.3})`;
    x.beginPath(); x.ellipse(rnd() * 256, rnd() * 80, 2 + rnd() * 5, 1.5 + rnd() * 4, rnd() * 3, 0, 7); x.fill();
  }
  for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(84,80,70,${rnd() * 0.3})`; x.fillRect(rnd() * 256, rnd() * 128, 1.6, 1.6); }
  // faixa de base: PEDRA/concreto (lagoa — azulejo navy dominava o enquadramento) c/
  // fileira de azulejo só como ACENTO pequeno no topo
  x.fillStyle = '#9b9484'; x.fillRect(0, 86, 256, 42);
  for (let i = 0; i < 30; i++) {
    x.fillStyle = `rgba(${110 + rnd() * 60 | 0},${104 + rnd() * 55 | 0},${88 + rnd() * 45 | 0},0.45)`;
    x.beginPath(); x.ellipse(rnd() * 256, 86 + rnd() * 42, 6 + rnd() * 16, 4 + rnd() * 8, rnd() * 3, 0, 7); x.fill();
  }
  x.strokeStyle = 'rgba(70,66,58,0.55)'; x.lineWidth = 2;   // juntas de pedra irregulares
  x.beginPath(); x.moveTo(0, 107); x.lineTo(256, 107); x.stroke();
  for (let i = 0; i <= 10; i++) {
    const px = i * 26 + (rnd() - 0.5) * 8;
    x.beginPath(); x.moveTo(px, 86); x.lineTo(px, 107); x.stroke();
    x.beginPath(); x.moveTo(px + 12, 107); x.lineTo(px + 12, 128); x.stroke();
  }
  // ACENTO: 1 fileira de azulejo navy no topo da faixa
  for (let i = 0; i < 18; i++) {
    const jx = (rnd() - 0.5) * 0.16;
    x.fillStyle = `rgb(${36 + jx * 90 | 0},${64 + jx * 90 | 0},${122 + jx * 90 | 0})`;
    x.fillRect(i * 14 + 2, 84, 14, 8);
  }
  x.strokeStyle = '#aeb9cc'; x.lineWidth = 1.2;
  for (let i = 0; i <= 18; i++) { x.beginPath(); x.moveTo(i * 14 + 2, 84); x.lineTo(i * 14 + 2, 92); x.stroke(); }
  x.fillStyle = 'rgba(66,60,46,0.55)'; x.fillRect(0, 82, 256, 3);   // scum no encontro c/ bege
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(rx, 1); return t;
}
// armário de vestiário (locker) — porta c/ respiradouros
function lockerTex(hex = '#2c6e7a', seed = 31) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const x = c.getContext('2d');
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  x.fillStyle = hex; x.fillRect(0, 0, 128, 256);
  x.strokeStyle = 'rgba(0,0,0,0.5)'; x.lineWidth = 3; x.strokeRect(6, 6, 116, 244);
  x.strokeRect(64, 6, 0.1, 244);   // divisória de 2 portas (linha vertical central)
  x.beginPath(); x.moveTo(64, 6); x.lineTo(64, 250); x.stroke();
  for (const dx of [16, 80]) {   // respiradouros por porta
    x.fillStyle = 'rgba(0,0,0,0.4)';
    for (let i = 0; i < 6; i++) x.fillRect(dx, 26 + i * 8, 32, 3);
    x.fillStyle = '#c8c2b2'; x.fillRect(dx + 24, 120, 6, 14);   // maçaneta
  }
  for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(0,0,0,${rnd() * 0.25})`; x.fillRect(rnd() * 128, rnd() * 256, 2, 2); }
  const g = x.createLinearGradient(0, 200, 0, 256);
  g.addColorStop(0, 'rgba(40,36,28,0)'); g.addColorStop(1, 'rgba(40,36,28,0.5)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 256);
  return mkTex(c, 1, 1, true);
}
// DIFUSO da água — a lagoa do Piscinão é água de MAR DA GUANABARA: verde-opaca, turva,
// com sedimento em suspensão. Nada de ciano de piscina e nada de "riscos de espuma"
// desenhados: a agitação agora vem do normal map animado (waterNormalTex), então aqui
// só ficam as MANCHAS grandes de turbidez que quebram a cor chapada.
function rippleTex(rx, rz) {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  x.fillStyle = '#33513f'; x.fillRect(0, 0, S, S);
  let seed = 29; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 34; i++) {   // plumas de sedimento (mais claras, esverdeado-barrento)
    x.fillStyle = `rgba(${96 + rnd() * 34 | 0},${112 + rnd() * 26 | 0},${78 + rnd() * 22 | 0},${0.1 + rnd() * 0.18})`;
    x.beginPath(); x.ellipse(rnd() * S, rnd() * S, 16 + rnd() * 44, 9 + rnd() * 26, rnd() * 3, 0, 7); x.fill();
  }
  for (let i = 0; i < 26; i++) {   // poças escuras (fundo mais profundo / sombra de nuvem)
    x.fillStyle = `rgba(16,38,28,${0.1 + rnd() * 0.18})`;
    x.beginPath(); x.ellipse(rnd() * S, rnd() * S, 12 + rnd() * 36, 7 + rnd() * 20, rnd() * 3, 0, 7); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;   // sem NearestFilter: água turva não pode pixelar
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, rz); return t;
}
// NORMAL MAP procedural de marola (tangent-space). Campo de altura = soma de senos com
// período INTEIRO no canvas → tileia sem costura. Duas cópias com scroll diferente são
// misturadas no shader; é o que dá vida à água sem animar um único vértice.
function waterNormalTex(rep) {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  const h = new Float32Array(S * S);
  const waves = [[3, 1, 1.0, 0.0], [1, 4, 0.72, 1.7], [5, 3, 0.42, 3.1], [2, 7, 0.28, 0.6], [9, 6, 0.16, 2.2]];
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    let v = 0;
    for (const [fx, fz, a, ph] of waves)
      v += a * Math.sin((i / S) * fx * Math.PI * 2 + ph) * Math.cos((j / S) * fz * Math.PI * 2 + ph * 0.7);
    h[j * S + i] = v;
  }
  const img = x.createImageData(S, S);
  const STR = 22;   // marola BAIXA: lagoa fechada por muro de pedra, não mar aberto
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const l = h[j * S + ((i + S - 1) % S)], r = h[j * S + ((i + 1) % S)];
    const u = h[((j + S - 1) % S) * S + i], d = h[((j + 1) % S) * S + i];
    const nx = (l - r) * STR, ny = (u - d) * STR, inv = 1 / Math.hypot(nx, ny, 1);
    const o = (j * S + i) * 4;
    img.data[o] = (nx * inv * 0.5 + 0.5) * 255;
    img.data[o + 1] = (ny * inv * 0.5 + 0.5) * 255;
    img.data[o + 2] = (inv * 0.5 + 0.5) * 255;
    img.data[o + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);   // dado LINEAR: normal map nunca leva sRGB
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep * 1.2);
  return t;
}
// FUNDO da lagoa: areia nas bordas → verde fundo no centro (ilusão de profundidade natural)
function lagoonFloorTex() {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  let seed = 37; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const g = x.createRadialGradient(S / 2, S / 2, S * 0.12, S / 2, S / 2, S * 0.52);
  g.addColorStop(0, '#22462e'); g.addColorStop(0.55, '#3f6e46'); g.addColorStop(0.85, '#8a8458'); g.addColorStop(1, '#c4b184');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 60; i++) {   // manchas orgânicas do fundo
    x.fillStyle = `rgba(${20 + rnd() * 40 | 0},${50 + rnd() * 40 | 0},${30 + rnd() * 20 | 0},${0.1 + rnd() * 0.2})`;
    x.beginPath(); x.ellipse(rnd() * S, rnd() * S, 8 + rnd() * 30, 5 + rnd() * 18, rnd() * 3, 0, 7); x.fill();
  }
  for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(200,190,150,${rnd() * 0.25})`; x.fillRect(rnd() * S, rnd() * S, 1.6, 1.6); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
// areia batida de praia (deck → praia): mais escura/pisada que a areia fofa, com pegadas
function beachSandTex(rx, rz) {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  x.fillStyle = '#d8c295'; x.fillRect(0, 0, S, S);
  let seed = 43; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 12; i++) {   // manchas pisadas/molhadas
    x.fillStyle = `rgba(${140 + rnd() * 40 | 0},${110 + rnd() * 30 | 0},${70 + rnd() * 25 | 0},${0.16 + rnd() * 0.18})`;
    x.beginPath(); x.ellipse(rnd() * S, rnd() * S, 12 + rnd() * 26, 7 + rnd() * 16, rnd() * 3, 0, 7); x.fill();
  }
  for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(110,88,56,${0.12 + rnd() * 0.16})`; x.beginPath(); x.ellipse(rnd() * S, rnd() * S, 2.4, 1.3, rnd() * 3, 0, 7); x.fill(); }   // pegadas
  for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(${140 + rnd() * 80 | 0},${110 + rnd() * 70 | 0},${70 + rnd() * 50 | 0},.5)`; x.fillRect(rnd() * S, rnd() * S, 1.6, 1.6); }
  return mkTex(c, rx, rz);
}
// grama sintética de quadra society (crítico gauntlet: "área verde lisa na lateral") —
// tufo granulado + faixas de corte + linhas brancas da quadra
function turfTex(rx, rz) {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  x.fillStyle = '#3d8a46'; x.fillRect(0, 0, S, S);
  let seed = 41; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // faixas de corte (claro/escuro alternado, como grama real aparada)
  for (let i = 0; i < 4; i++) if (i % 2) { x.fillStyle = 'rgba(20,60,26,0.22)'; x.fillRect(i * S / 4, 0, S / 4, S); }
  for (let i = 0; i < 5200; i++) {   // tufo: pontinhos de 3 tons
    const t = rnd();
    x.fillStyle = t < 0.4 ? '#2f7a3a' : t < 0.75 ? '#4a9a52' : '#5fb364';
    x.globalAlpha = 0.5 + rnd() * 0.5; x.fillRect(rnd() * S, rnd() * S, 1.6, 1.6);
  }
  x.globalAlpha = 1;
  // desgaste (manchas amareladas de uso + veios de grama seca — crítico R6: "verde-chapado")
  for (let i = 0; i < 20; i++) { x.fillStyle = `rgba(150,160,80,${0.08 + rnd() * 0.16})`; x.beginPath(); x.ellipse(rnd() * S, rnd() * S, 8 + rnd() * 26, 5 + rnd() * 16, rnd() * 3, 0, 7); x.fill(); }
  for (let i = 0; i < 40; i++) {   // tufos secos (risquinhos amarelos)
    x.strokeStyle = `rgba(170,164,84,${0.25 + rnd() * 0.35})`; x.lineWidth = 1.2;
    const px = rnd() * S, py = rnd() * S;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 8, py - 3 - rnd() * 6); x.stroke();
  }
  return mkTex(c, rx, rz);
}
// FAIXA DE AZULEJO 15×15 definitiva (crítico R6 close: "sem grade horizontal, sem jitter,
// sem verdete") — textura ÚNICA pra todos os muros: rejunte 2px nas 2 direções, jitter
// ±8% por peça, fileira inferior esverdeada, linha de scum no encontro com o bege.
function azulejoBandTex(rx = 1) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const x = c.getContext('2d');
  let seed = 91; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const TS = 16;   // 16 colunas × 4 fileiras de peças por canvas
  for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) {
    const jx = (rnd() - 0.5) * 0.16;   // jitter de matiz/valor ±8%
    let r = 36 + jx * 90, g = 64 + jx * 90, b = 122 + jx * 90;
    if (j === 3) { r = r * 0.55 + 40; g = g * 0.75 + 34; b = b * 0.6 + 26; }   // verdete na fileira de baixo
    const roll = rnd();
    if (roll < 0.055) {   // PEÇA CAÍDA: sobra a argamassa com o rastro do rejunte (o azulejo
      x.fillStyle = '#9a9284'; x.fillRect(i * TS, j * TS, TS, TS);   // corrido e perfeito era o pior tell de "clube novo")
      for (let k = 0; k < 8; k++) { x.fillStyle = `rgba(120,112,100,${rnd() * 0.5})`; x.fillRect(i * TS + rnd() * TS, j * TS + rnd() * TS, 3, 3); }
      continue;
    }
    if (roll < 0.11) { r = r * 0.6 + 90; g = g * 0.7 + 76; b = b * 0.8 + 40; }   // peça de reposição fora de tom
    x.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
    x.fillRect(i * TS, j * TS, TS, TS);
    const gl = x.createLinearGradient(i * TS, j * TS, i * TS + TS, j * TS + TS);   // esmalte
    gl.addColorStop(0, 'rgba(255,255,255,0.16)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(0,0,0,0.14)');
    x.fillStyle = gl; x.fillRect(i * TS, j * TS, TS, TS);
    if (rnd() < 0.1) { x.fillStyle = 'rgba(18,26,44,0.55)'; x.fillRect(i * TS + rnd() * 10, j * TS + rnd() * 10, 3, 3); }   // trinca
  }
  x.strokeStyle = '#aeb9cc'; x.lineWidth = 2;   // REJUNTE claro nas 2 direções
  for (let i = 0; i <= 16; i++) { x.beginPath(); x.moveTo(i * TS, 0); x.lineTo(i * TS, 64); x.stroke(); }
  for (let j = 0; j <= 4; j++) { x.beginPath(); x.moveTo(0, j * TS); x.lineTo(256, j * TS); x.stroke(); }
  x.fillStyle = 'rgba(66,60,46,0.55)'; x.fillRect(0, 0, 256, 3);   // linha de scum no topo (encontro c/ bege)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(rx, 1); return t;
}
// painel de grama c/ BORDA IRREGULAR de verdade (alpha-noise) — sem retângulo duro na areia
function turfPatchTex() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const x = c.getContext('2d');
  let seed = 47; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const img = x.createImageData(128, 256);
  for (let j = 0; j < 256; j++) for (let i = 0; i < 128; i++) {
    // distância normalizada à borda; alpha cai com ruído nos 14px externos
    const d = Math.min(i, 127 - i, j, 255 - j);
    const n = rnd();
    const a = d > 14 ? 255 : (d / 14) * 255 * (n > 0.35 ? 1 : n / 0.35);
    const o = (j * 128 + i) * 4;
    const t = rnd();
    img.data[o] = 58 + t * 40; img.data[o + 1] = 128 + t * 50; img.data[o + 2] = 56 + t * 26; img.data[o + 3] = a;
  }
  x.putImageData(img, 0, 0);
  for (let i = 0; i < 14; i++) {   // manchas de grama seca
    x.fillStyle = `rgba(150,160,80,${0.1 + rnd() * 0.16})`;
    x.beginPath(); x.ellipse(20 + rnd() * 88, 20 + rnd() * 216, 8 + rnd() * 22, 5 + rnd() * 14, rnd() * 3, 0, 7); x.fill();
  }
  x.strokeStyle = 'rgba(240,240,230,0.85)'; x.lineWidth = 4;   // linhas da quadra
  x.strokeRect(14, 14, 100, 228);
  x.beginPath(); x.moveTo(14, 128); x.lineTo(114, 128); x.stroke();
  x.beginPath(); x.arc(64, 128, 20, 0, 7); x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
// mural pintado no painel azul do muro leste (crítico R6: "placa sem textura")
function muralTex(title, sub, seed = 5) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160;
  const x = c.getContext('2d');
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  x.fillStyle = '#6b97b8'; x.fillRect(0, 0, 512, 160);
  for (let i = 0; i < 12; i++) {   // tinta desgastada
    x.fillStyle = `rgba(255,255,255,${0.03 + rnd() * 0.06})`; x.beginPath(); x.ellipse(rnd() * 512, rnd() * 160, 20 + rnd() * 60, 8 + rnd() * 20, rnd(), 0, 7); x.fill();
  }
  // ondas do fundo do mural
  for (const wy of [108, 124, 140]) {
    x.strokeStyle = 'rgba(230,244,252,0.55)'; x.lineWidth = 5; x.beginPath();
    for (let px = 0; px <= 512; px += 8) x.lineTo(px, wy + Math.sin(px / 26 + wy) * 6);
    x.stroke();
  }
  x.textAlign = 'center';
  let px = 74;   // cabe no plano (crítico R6: texto estourava a borda — "O DE RAMOS…")
  x.font = `bold ${px}px "Arial Black",Impact,sans-serif`;
  while (x.measureText(title).width > 452 && px > 28) { px -= 4; x.font = `bold ${px}px "Arial Black",Impact,sans-serif`; }
  x.lineWidth = Math.max(6, px / 7); x.strokeStyle = 'rgba(20,40,70,0.85)';
  x.strokeText(title, 256, 88); x.fillStyle = '#f4f8fc'; x.fillText(title, 256, 88);
  if (sub) { x.font = 'bold 24px Arial,sans-serif'; x.fillStyle = '#ffe9a0'; x.fillText(sub, 256, 122); }
  for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(60,54,44,${rnd() * 0.2})`; x.fillRect(rnd() * 512, rnd() * 160, 2, 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
// cards de silhueta pro horizonte (crítico R6: "horizonte morto acima do muro") —
// árvores, prédios baixos, caixas d'água e antenas em tom já esfumaçado
function silTex(kind, tint, seed = 5) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const x = c.getContext('2d');
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  x.fillStyle = tint;
  if (kind === 'trees') {
    for (const [tx, tr] of [[40, 30], [110, 38], [190, 28]]) {
      x.fillRect(tx - 3, 128 - 40, 6, 40);   // tronco
      for (let i = 0; i < 7; i++) { x.beginPath(); x.ellipse(tx + (rnd() - 0.5) * tr, 128 - 44 - rnd() * tr * 0.8, tr * (0.4 + rnd() * 0.4), tr * (0.3 + rnd() * 0.3), 0, 0, 7); x.fill(); }
    }
  } else if (kind === 'blocks') {
    for (const [bx, bw, bh] of [[10, 60, 62], [80, 46, 84], [136, 66, 54], [208, 40, 70]]) {
      x.fillRect(bx, 128 - bh, bw, bh);
      x.clearRect(bx + 6, 128 - bh + 8, 5, 6); x.clearRect(bx + 18, 128 - bh + 8, 5, 6); x.clearRect(bx + 6, 128 - bh + 22, 5, 6);
      if (rnd() > 0.4) { x.beginPath(); x.arc(bx + bw * 0.7, 128 - bh - 8, 8, 0, 7); x.fill(); x.fillRect(bx + bw * 0.7 - 1.5, 128 - bh - 8, 3, 10); }   // caixa d'água
    }
    x.fillRect(150, 128 - 104, 2.5, 104);   // antena
    x.fillRect(142, 128 - 100, 18, 2); x.fillRect(145, 128 - 90, 12, 2);
  } else if (kind === 'bridge') {   // PONTE ao fundo (foto de referência da lagoa)
    x.fillRect(0, 128 - 46, 256, 9);   // tabuleiro
    for (const px of [24, 92, 160, 228]) x.fillRect(px - 5, 128 - 46, 10, 46);   // pilares
    x.strokeStyle = tint; x.lineWidth = 5;
    for (const px of [58, 126, 194]) { x.beginPath(); x.arc(px, 128 - 46, 30, Math.PI, 0); x.stroke(); }   // arcos
    for (let i = 0; i < 20; i++) x.fillRect(4 + i * 13, 128 - 56, 2, 10);   // guarda-corpo
  } else {   // mixed: casas baixas + árvore + poste
    x.fillRect(8, 128 - 34, 52, 34); x.beginPath(); x.moveTo(4, 128 - 34); x.lineTo(34, 128 - 52); x.lineTo(64, 128 - 34); x.fill();   // telhado
    x.fillRect(80, 128 - 28, 40, 28); x.beginPath(); x.moveTo(78, 128 - 28); x.lineTo(100, 128 - 42); x.lineTo(122, 128 - 28); x.fill();
    x.fillRect(196, 128 - 66, 3, 66); x.fillRect(186, 128 - 62, 22, 2.5);   // poste c/ cruzeta
    for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(160 + (rnd() - 0.5) * 26, 128 - 40 - rnd() * 22, 14 + rnd() * 10, 10 + rnd() * 8, 0, 0, 7); x.fill(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
// SILHUETA DE FAVELA/SUBÚRBIO — o fundo OBRIGATÓRIO do Piscinão (a Maré encosta na
// lagoa). Substitui os "cards de caixa cinza": lajes empilhadas em alturas irregulares,
// FERRAGEM DE ESPERA saindo do topo (a laje que nunca vira 2º andar), CAIXAS D'ÁGUA
// azul/preta, antenas e FIAÇÃO EMARANHADA cruzando tudo. `haze` puxa a paleta pro
// cinza-quente da atmosfera pra dar profundidade entre a fileira longe e a perto.
function favelaTex(seed = 3, haze = 0) {
  const W = 512, H = 192, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const hz = (r, g, b, a = 1) => `rgba(${(r + (176 - r) * haze) | 0},${(g + (180 - g) * haze) | 0},${(b + (176 - b) * haze) | 0},${a})`;
  // paleta de subúrbio carioca: tijolo aparente, reboco cru, pintura desbotada
  const bodies = [[142, 96, 74], [128, 88, 68], [162, 150, 130], [140, 134, 120],
    [120, 138, 130], [158, 140, 108], [116, 120, 128], [150, 116, 96]];
  const tops = [];   // topos das lajes: onde nascem ferragem, caixa d'água e fiação
  let px = -14;
  while (px < W) {
    const w = 26 + rnd() * 52, h = 40 + rnd() * 112, bc = bodies[(rnd() * bodies.length) | 0];
    const ty = H - h;
    x.fillStyle = hz(bc[0], bc[1], bc[2]); x.fillRect(px, ty, w, h);
    // sombra da empena NÃO passa pelo hz(): hazear preto o clarearia (viraria luz).
    // O que o haze faz de verdade é REDUZIR o contraste — daí o (1 - haze) no alpha.
    x.fillStyle = `rgba(0,0,0,${0.18 * (1 - haze)})`; x.fillRect(px + w - 5, ty, 5, h);
    x.fillStyle = hz(196, 190, 176, 0.85); x.fillRect(px, ty, w, 4);              // laje/viga de topo
    // janelas e portas — vãos escuros pequenos e desalinhados (nada de grade regular)
    for (let j = 0; j < 3 + (rnd() * 4 | 0); j++) {
      const wwx = px + 4 + rnd() * (w - 12), wwy = ty + 8 + rnd() * (h - 20);
      x.fillStyle = hz(38, 36, 34, 0.85); x.fillRect(wwx, wwy, 4 + rnd() * 5, 6 + rnd() * 6);
    }
    // FERRAGEM DE ESPERA: 3-6 vergalhões finos saindo da laje, tortos
    if (rnd() > 0.25) for (let j = 0; j < 3 + (rnd() * 4 | 0); j++) {
      const rx2 = px + 3 + rnd() * (w - 6), rl = 5 + rnd() * 13;
      x.strokeStyle = hz(96, 74, 56, 0.95); x.lineWidth = 1.4;
      x.beginPath(); x.moveTo(rx2, ty); x.lineTo(rx2 + (rnd() - 0.5) * 5, ty - rl); x.stroke();
    }
    // CAIXA D'ÁGUA: azul (polietileno) ou preta (fibrocimento), sobre pezinhos
    if (rnd() > 0.3) {
      const cx2 = px + 5 + rnd() * (w - 16), cw = 9 + rnd() * 7, ch = 7 + rnd() * 5;
      const blue = rnd() > 0.42;
      x.fillStyle = blue ? hz(40, 82, 152) : hz(38, 38, 40);
      x.fillRect(cx2, ty - ch - 2, cw, ch);
      x.fillStyle = blue ? hz(70, 118, 190) : hz(66, 66, 68);
      x.fillRect(cx2, ty - ch - 2, cw, 2.5);                                       // tampa
      x.fillStyle = hz(120, 116, 108); x.fillRect(cx2 + 1, ty - 2, 2, 2); x.fillRect(cx2 + cw - 3, ty - 2, 2, 2);
    }
    // caixa de escada / puxadinho no topo
    if (rnd() > 0.55) { x.fillStyle = hz(bc[0] * 0.9, bc[1] * 0.9, bc[2] * 0.9); x.fillRect(px + w * 0.55, ty - 12, w * 0.35, 12); }
    // antena de TV (espinha de peixe)
    if (rnd() > 0.5) {
      const ax = px + 6 + rnd() * (w - 12), ah = 12 + rnd() * 16;
      x.strokeStyle = hz(70, 68, 64, 0.9); x.lineWidth = 1.1;
      x.beginPath(); x.moveTo(ax, ty); x.lineTo(ax, ty - ah); x.stroke();
      for (let j = 0; j < 4; j++) { const yy = ty - ah + 3 + j * 3.5; x.beginPath(); x.moveTo(ax - 4 + j * 0.6, yy); x.lineTo(ax + 4 - j * 0.6, yy); x.stroke(); }
    }
    // caixa d'água terminou; guarda o topo pra pendurar fio
    tops.push([px + w * 0.5, ty - 4]);
    px += w - 2 - rnd() * 6;   // colado/sobreposto: favela não tem recuo lateral
  }
  // FIAÇÃO EMARANHADA: catenárias entre topos + "gatos" (feixes grossos pendurados)
  x.lineWidth = 1; x.strokeStyle = hz(28, 26, 24, 0.9);
  for (let i = 0; i + 1 < tops.length; i++) {
    for (let k = 0; k < 2 + (rnd() * 3 | 0); k++) {
      const a = tops[i], b = tops[i + 1], sag = 5 + rnd() * 12, off = (rnd() - 0.5) * 14;
      x.beginPath(); x.moveTo(a[0], a[1] + off);
      x.quadraticCurveTo((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + sag + off, b[0], b[1] + off);
      x.stroke();
    }
    if (rnd() > 0.5) {   // o "gato": feixe grosso enrolado no poste
      const a = tops[i];
      x.lineWidth = 3.2; x.beginPath(); x.arc(a[0], a[1] + 8 + rnd() * 10, 3 + rnd() * 3, 0, 7); x.stroke(); x.lineWidth = 1;
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
// pergolado de madeira (teto dos corredores de spawn — antes um plano bege liso)
function pergoTex(rx, rz) {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  let seed = 53; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 4; i++) {   // réguas
    const y0 = i * 32;
    x.fillStyle = ['#8a6a42', '#7d5f3a', '#93744c', '#84663f'][i]; x.fillRect(0, y0, S, 30);
    for (let j = 0; j < 30; j++) {   // veios
      x.strokeStyle = `rgba(60,42,24,${0.12 + rnd() * 0.2})`; x.lineWidth = 1;
      x.beginPath(); x.moveTo(0, y0 + rnd() * 30); x.bezierCurveTo(40, y0 + rnd() * 30, 90, y0 + rnd() * 30, S, y0 + rnd() * 30); x.stroke();
    }
    x.fillStyle = 'rgba(30,20,10,0.55)'; x.fillRect(0, y0 + 30, S, 2);   // sombra entre réguas
  }
  return mkTex(c, rx, rz);
}
// decal circular transparente (ralo, mancha, poça) — canvas com alpha, NÃO repete
function decalTex(draw) {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
  draw(c.getContext('2d'), S);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
// texto pintado no chão (avisos de clube: "PROIBIDO CORRER", profundidade)
function paintTex(txt, col = 'rgba(200,40,40,0.85)', px = 46) {
  return decalTex((x, S) => {
    x.translate(S / 2, S / 2); x.rotate(-0.03); x.textAlign = 'center';
    x.font = `bold ${px}px "Arial Black",Impact,sans-serif`;
    x.globalAlpha = 0.85; x.fillStyle = col;
    const words = txt.split(' ');
    if (words.length > 1) words.forEach((w, i) => x.fillText(w, 0, (i - (words.length - 1) / 2) * px * 1.05 + px * 0.35));
    else x.fillText(txt, 0, px * 0.35);
  });
}
function signTexture(bg, fg, title, sub) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 512, 128);
  x.strokeStyle = fg; x.lineWidth = 8; x.strokeRect(6, 6, 500, 116);
  x.textAlign = 'center'; x.fillStyle = fg;
  x.font = 'bold 44px "Arial Black",Impact,sans-serif'; x.fillText(title, 256, 60);
  if (sub) { x.font = 'bold 20px Arial,sans-serif'; x.fillText(sub, 256, 96); }
  return mkTex(c, 1, 1, true);
}

export function buildPoolDay(scene, T) {
  const colliders = [];
  const occluders = [];
  const pickups = [];
  const root = new THREE.Group();
  scene.add(root);
  // coloca um prop GLB do Mint (visual); retorna true se entrou (senão o mapa usa o procedural).
  const gprop = (id, x, z, h, ry = 0, y = 0) => { const o = placeProp(id, { x, y, z, targetH: h, ry }); if (o) { o.traverse(m => { if (m.isMesh) m.frustumCulled = true; }); root.add(o); return true; } return false; };

  /* ---------------- config: kill-switches + degradação por qualidade ----------------
     buildPoolDay só recebe (scene, T) — a qualidade vem do MESMO localStorage que o
     main.js grava, pra não mudar a assinatura (outros agentes editam game.js junto). */
  const QP = new URLSearchParams(location.search);
  let _q = 'med';
  try { _q = JSON.parse(localStorage.getItem('awpbr_settings') || '{}').quality || 'med'; } catch (e) { /* storage bloqueado */ }
  const LOWQ = _q === 'low';
  const WATER_FX = QP.get('water') !== '0';    // ?water=0 → material simples (fallback do shader)
  const FAVELA = QP.get('favela') !== '0';     // ?favela=0 → sem o fundo de lajes/caixa d'água
  const CROWD = QP.get('crowd') !== '0';       // ?crowd=0 → sem banhistas extras
  const NFAV = LOWQ ? 6 : 14;                  // nº de lajes 3D atrás do muro

  // Standard (não Lambert) pra receber o env map IBL (scene.environment) — padrão visual v2.
  const lam = (opts) => new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0, ...opts });
  function addBox(w, h, d, mat, x, y, z, opts = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z);
    m.castShadow = opts.cast !== false; m.receiveShadow = true;
    if (opts.ry) m.rotation.y = opts.ry;
    if (opts.rx) m.rotation.x = opts.rx;
    if (opts.rz) m.rotation.z = opts.rz;
    root.add(m);
    if (opts.collide !== false) {
      const pad = opts.pad || 0;
      const ex = (opts.ry || opts.rz) ? Math.max(w, d) / 2 : w / 2;
      const ez = (opts.ry || opts.rz) ? Math.max(w, d) / 2 : d / 2;
      colliders.push({ minX: x - ex - pad, maxX: x + ex + pad, minY: y, maxY: y + h, minZ: z - ez - pad, maxZ: z + ez + pad });
      occluders.push(m);
    }
    return m;
  }
  function addPlane(w, h, mat, x, y, z, ry = 0, rx = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.y = ry; m.rotation.x = rx;
    m.receiveShadow = true; root.add(m); return m;
  }

  const TEX = {
    sand: sandTex(14, 20),
    deck: beachSandTex(12, 16),   // faixa de areia batida colada na lagoa (era concreto)
    // (removido TEX.pool: azulejo turquesa de piscina de clube — era código morto e é
    //  exatamente a gramática visual errada; o Piscinão é lagoa de mar, não piscina)
  };
  const MAT = {
    sand: lam({ map: TEX.sand }), deck: lam({ map: TEX.deck }),
    navy: lam({ map: azulejoBandTex(24) }), white: lam({ color: 0xf2f5f7 }), steel: lam({ map: concreteTex(1, 2), color: 0x9aa0a6, metalness: 0.4, roughness: 0.6 }),
    kiosk: lam({ color: 0xcf5b3a }), thatch: lam({ color: 0xb2843f }),
    umbA: lam({ color: 0xe23b3b }), umbB: lam({ color: 0xf4c020 }),
    foam: lam({ color: 0xffd23f }), foam2: lam({ color: 0xff6a8a }), guard: lam({ color: 0xe8703a }),
    concrete: lam({ map: concreteTex(4, 2) }), fence: lam({ map: concreteTex(1, 2), color: 0x9aa0a6 }),
    bleacher: lam({ map: concreteTex(5, 2) }), grass: lam({ map: turfTex(2, 6) }), pergo: lam({ map: pergoTex(9, 2.5) }),
  };

  // faces laterais c/ RODAPÉ DE AZULEJO (crítico R6: "pilares cinza-chapado → bicolor")
  // variantes PINTADAS (verde/azul/branco) pros blocos — nem tudo é o mesmo bege
  const bandedOf = (base, rx = 1) => { const t = bandTex(rx, base); return [lam({ map: t }), lam({ map: t }), MAT.concrete, MAT.concrete, lam({ map: t }), lam({ map: t })]; };
  const bandedSides = bandedOf('#b9b3a6');
  const bandedGreen = bandedOf('#6a8a5c'), bandedBlue = bandedOf('#7ba3c4'), bandedWhite = bandedOf('#d5d0c2');

  /* ---------------- LAGOA central (recessed, bordas em rampa) ---------------- */
  const POOL = { cx: 0, cz: 0, hx: 12, hz: 15, m: 3, depth: 1.4 };
  const OUTX = POOL.hx + POOL.m, OUTZ = POOL.hz + POOL.m;
  const nX = POOL.cx + OUTX, sX = POOL.cx - OUTX, nZ = POOL.cz + OUTZ, sZ = POOL.cz - OUTZ;
  function poolDepth(x, z) {
    const ox = Math.abs(x - POOL.cx), oz = Math.abs(z - POOL.cz);
    if (ox > OUTX || oz > OUTZ) return 0;
    const penX = Math.min(1, Math.max(0, (OUTX - ox) / POOL.m));
    const penZ = Math.min(1, Math.max(0, (OUTZ - oz) / POOL.m));
    return -POOL.depth * Math.min(penX, penZ);
  }
  function slowAt(x, z) { return poolDepth(x, z) < -0.25; }   // vadear na água = mais devagar

  /* ---------------- chão: areia por todo o balneário ---------------- */
  const addFloor = (w, d, x, z, mat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat || MAT.sand); m.rotation.x = -Math.PI / 2; m.position.set(x, 0, z); m.receiveShadow = true; root.add(m); };
  addFloor(HALF_X * 2, HALF_Z - nZ, 0, (nZ + HALF_Z) / 2);
  addFloor(HALF_X * 2, sZ + HALF_Z, 0, (sZ - HALF_Z) / 2);
  addFloor(HALF_X - nX, nZ - sZ, (nX + HALF_X) / 2, POOL.cz);
  addFloor(sX + HALF_X, nZ - sZ, (sX - HALF_X) / 2, POOL.cz);
  // faixa de deck de concreto colada na lagoa (ANEL ao redor — um plano único por cima
  // cobria a água inteira: bug que matava a piscina)
  addFloor(OUTX * 2 + 3.75, 3.75, POOL.cx, nZ + 1.875, MAT.deck);        // norte
  addFloor(OUTX * 2 + 3.75, 3.75, POOL.cx, sZ - 1.875, MAT.deck);        // sul
  addFloor(3.75, OUTZ * 2, nX + 1.875, POOL.cz, MAT.deck);               // leste
  addFloor(3.75, OUTZ * 2, sX - 1.875, POOL.cz, MAT.deck);               // oeste

  /* ---------------- a lagoa (água natural verde-escura, fundo c/ profundidade) ---------------- */
  {
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(POOL.hx * 2, POOL.hz * 2), lam({ map: lagoonFloorTex() }));
    fl.rotation.x = -Math.PI / 2; fl.position.set(POOL.cx, -POOL.depth + 0.02, POOL.cz); fl.receiveShadow = true; root.add(fl);
    const ang = Math.atan2(POOL.depth, POOL.m), L = Math.hypot(POOL.depth, POOL.m);
    // margem MOLHADA: areia/concreto encharcado é mais escuro E mais especular que o seco.
    // roughness baixo aqui é o que faz a linha d'água brilhar de rasante.
    const bank = lam({ map: beachSandTex(8, 1), color: 0x7d6a4e, roughness: 0.32, metalness: 0.04 });
    addBox(POOL.hx * 2, 0.1, L, lam({ map: beachSandTex(6, 1) }), POOL.cx, -POOL.depth / 2, POOL.cz + POOL.hz + POOL.m / 2, { collide: false, rx: -ang, cast: false });
    addBox(POOL.hx * 2, 0.1, L, lam({ map: beachSandTex(6, 1) }), POOL.cx, -POOL.depth / 2, POOL.cz - POOL.hz - POOL.m / 2, { collide: false, rx: ang, cast: false });
    addBox(L, 0.1, POOL.hz * 2, lam({ map: beachSandTex(6, 1) }), POOL.cx + POOL.hx + POOL.m / 2, -POOL.depth / 2, POOL.cz, { collide: false, rz: ang, cast: false });
    addBox(L, 0.1, POOL.hz * 2, lam({ map: beachSandTex(6, 1) }), POOL.cx - POOL.hx - POOL.m / 2, -POOL.depth / 2, POOL.cz, { collide: false, rz: -ang, cast: false });
    // ÁGUA: OPACA de propósito. No Piscinão (água de mar da Guanabara) o fundo some a
    // ~40cm — shader de água clara reprova o gabarito. Por isso transparent:false e o
    // fundo/rampas ficam escondidos (só os 15cm de rampa que sobram do plano leem como
    // areia molhada na linha d'água).
    const waterMat = new THREE.MeshPhongMaterial({
      map: rippleTex(3, 4), color: 0x3d5946,
      specular: 0x86a096, shininess: 70,   // brilho de água TURVA: reflete, mas não é espelho
      normalMap: waterNormalTex(LOWQ ? 3 : 5),
      normalScale: new THREE.Vector2(0.9, 0.9),
    });
    // uTime é compartilhado com o shader; quem avança é o onBeforeRender do próprio mesh
    // (o mapa não recebe hook de tick do game.js, e não dá pra editar game.js aqui).
    const uT = { value: 0 };
    if (WATER_FX) waterMat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uT;
      sh.uniforms.uExt = { value: new THREE.Vector2(OUTX, OUTZ) };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vWuv;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vWuv = uv;');
      // DUAS CAMADAS de scroll em direções/escalas diferentes: sozinha, uma camada lê como
      // "textura deslizando"; cruzadas, leem como interferência de marola.
      const twoLayer = `
        vec2 sA = vNormalMapUv + vec2( uTime * 0.014, uTime * 0.009 );
        vec2 sB = vNormalMapUv * 2.13 + vec2( -uTime * 0.023, uTime * 0.018 );
        vec3 nA = texture2D( normalMap, sA ).xyz * 2.0 - 1.0;
        vec3 nB = texture2D( normalMap, sB ).xyz * 2.0 - 1.0;
        vec3 mapN = normalize( vec3( nA.xy + nB.xy, nA.z * nB.z ) );
        mapN.xy *= normalScale;
        normal = normalize( tbn * mapN );`;
      // quality low: 1 fetch só (metade do custo de textura no maior quad da cena)
      const oneLayer = `
        vec3 mapN = texture2D( normalMap, vNormalMapUv + vec2( uTime * 0.012, uTime * 0.008 ) ).xyz * 2.0 - 1.0;
        mapN.xy *= normalScale;
        normal = normalize( tbn * mapN );`;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vWuv;\nuniform float uTime;\nuniform vec2 uExt;')
        .replace('#include <normal_fragment_maps>', LOWQ ? oneLayer : twoLayer)
        .replace('#include <opaque_fragment>', `
        // distância à margem EM METROS (o plano é retangular, uv normalizado engana)
        vec2 dE = ( vec2( 0.5 ) - abs( vWuv - vec2( 0.5 ) ) ) * 2.0 * uExt;
        float dEdge = min( dE.x, dE.y );
        vec3 Vv = normalize( vViewPosition );
        float fres = pow( 1.0 - clamp( dot( Vv, normal ), 0.0, 1.0 ), 3.0 );
        // REFLEXO BARATO DO CÉU: gradiente de 2 cores indexado pelo próprio fresnel —
        // razante pega o haze quente do horizonte, de cima pega o azul do zênite.
        // Custa 0 texture fetch e 0 render target (cubemap aqui mataria o orçamento).
        vec3 skyCol = mix( vec3( 0.40, 0.57, 0.71 ), vec3( 0.87, 0.86, 0.78 ), fres );
        outgoingLight = mix( outgoingLight, skyCol, fres * 0.55 );
        // margem RASA: areia em suspensão deixa a água barrenta — NUNCA transparente
        float murk = 1.0 - smoothstep( 0.0, 5.0, dEdge );
        outgoingLight = mix( outgoingLight, outgoingLight * vec3( 1.28, 1.14, 0.84 ), murk * 0.75 );
        // ESPUMA na linha d'água, com a borda quebrada pela própria marola (senão vira
        // uma moldura geométrica em volta do retângulo)
        float wob = texture2D( normalMap, vWuv * 7.0 + vec2( uTime * 0.02, -uTime * 0.016 ) ).x - 0.5;
        float foam = 1.0 - smoothstep( 0.15, 1.25, dEdge + wob * 2.2 );
        outgoingLight = mix( outgoingLight, vec3( 0.89, 0.91, 0.86 ), clamp( foam, 0.0, 1.0 ) * 0.8 );
        #include <opaque_fragment>`);
    };
    const water = new THREE.Mesh(new THREE.PlaneGeometry(OUTX * 2 - 0.3, OUTZ * 2 - 0.3), waterMat);
    water.rotation.x = -Math.PI / 2; water.position.set(POOL.cx, -0.12, POOL.cz); root.add(water);
    if (WATER_FX) water.onBeforeRender = () => { uT.value = performance.now() * 0.001; };
    // SUN-STREAK comprido (~60% da lagoa) na direção do sol — era um plano 10×30 de um lado só
    {
      const gl = document.createElement('canvas'); gl.width = 128; gl.height = 128;
      const gx = gl.getContext('2d');
      const gg = gx.createRadialGradient(64, 64, 4, 64, 64, 62);
      // mais discreto que antes: o specular do normal map animado já faz o brilho da marola;
      // este plano só ancora o "caminho do sol" no eixo certo
      gg.addColorStop(0, 'rgba(255,250,228,0.30)'); gg.addColorStop(0.5, 'rgba(220,242,236,0.10)'); gg.addColorStop(1, 'rgba(220,242,236,0)');
      gx.fillStyle = gg; gx.fillRect(0, 0, 128, 128);
      const gt = new THREE.CanvasTexture(gl); gt.colorSpace = THREE.SRGBColorSpace;
      const glint = new THREE.Mesh(new THREE.PlaneGeometry(14, 32),
        new THREE.MeshBasicMaterial({ map: gt, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      glint.rotation.x = -Math.PI / 2; glint.rotation.z = Math.atan2(20, -14);
      glint.position.set(0, -0.09, 0); root.add(glint);
    }
    // margem de areia molhada (borda fina — era a faixa de azulejo navy)
    addBox(OUTX * 2 + 0.7, 0.05, 0.5, bank, POOL.cx, 0, nZ + 0.15, { collide: false });
    addBox(OUTX * 2 + 0.7, 0.05, 0.5, bank, POOL.cx, 0, sZ - 0.15, { collide: false });
    addBox(0.5, 0.05, OUTZ * 2 + 0.7, bank, nX + 0.15, 0, POOL.cz, { collide: false });
    addBox(0.5, 0.05, OUTZ * 2 + 0.7, bank, sX - 0.15, 0, POOL.cz, { collide: false });
    // faixa de areia MOLHADA escura/quente no encontro seco↔água (opcional do crítico:
    // separa por contraste e alarga a leitura da banda de água dos spawns)
    {
      const wetBank = lam({ map: beachSandTex(10, 1), color: 0x8a7454, roughness: 0.55 });
      const wb = (w, d, x, z) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), wetBank);
        m.rotation.x = -Math.PI / 2; m.position.set(x, 0.006, z); m.receiveShadow = true; root.add(m);
      };
      wb(OUTX * 2 + 0.7, 1.0, POOL.cx, nZ + 0.65); wb(OUTX * 2 + 0.7, 1.0, POOL.cx, sZ - 0.65);
      wb(1.0, OUTZ * 2 + 0.7, nX + 0.65, POOL.cz); wb(1.0, OUTZ * 2 + 0.7, sX - 0.65, POOL.cz);
    }
    // boias/pneus na água (decorativo) — leve inclinação pra ler como BÓIA (anel c/ furo)
    // em ângulo rasante; antes planas, liam como "disco bege flutuando" (crítico R6)
    const floaty = (x, z, col, r = 0.95) => {
      const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.3, 8, 18), col);
      t.rotation.x = Math.PI / 2; t.rotation.y = ((x * 13 + z * 7) % 10) / 10 * 0.5 - 0.25;
      t.position.set(x, -0.06, z); root.add(t);
    };
    floaty(-5, 5, MAT.foam); floaty(4, -4, MAT.foam2, 1.15); floaty(6, 7, MAT.foam2, 0.8);
    floaty(-6, -7, MAT.foam); floaty(1, 9, MAT.foam2, 0.85); floaty(-2, -10, MAT.foam);
    // + bóias: são os únicos pontos SATURADOS sobre a água verde-opaca; poucas demais e a
    // lagoa lê como mancha morta no meio do mapa
    floaty(8, -9, MAT.foam, 1.0); floaty(-9, 10, MAT.foam2, 0.9); floaty(10, 3, MAT.foam, 0.75);
    floaty(-10, -2, MAT.foam2, 1.05); floaty(0, -14, MAT.foam, 0.9); floaty(5, 13, MAT.foam2, 0.8);
  }

  /* ---------------- plataforma de salto (marco alto num canto da lagoa) ---------------- */
  addBox(0.3, 1.4, 0.3, MAT.steel, POOL.cx - 0.9, 0, nZ + 1.2);
  addBox(0.3, 1.4, 0.3, MAT.steel, POOL.cx + 0.9, 0, nZ + 1.2);
  addBox(1.6, 0.16, 4.2, MAT.white, POOL.cx, 1.4, nZ - 0.6, { collide: false });

  /* ---------------- TOBOGÃ (crítico R6: marco vertical de 7m NO MIOLO, visível dos dois
     spawns — a money shot spawn→spawn terminava em bloco bege) ---------------- */
  {
    const tx = 2, tz = 20.8, TH = 9.8;   // torre de 10m (crítico R6: "lasca de 30px do spawn sul")
    for (const lx of [-0.9, 0.9]) for (const lz of [-0.9, 0.9])
      addBox(0.16, TH, 0.16, MAT.steel, tx + lx, 0, tz + lz, { collide: false });
    addBox(2.2, 0.18, 2.2, MAT.white, tx, TH, tz, { collide: false });            // plataforma
    for (const px of [-1.0, 1.0]) addBox(0.1, 1.0, 0.1, MAT.steel, tx + px, TH + 0.1, tz - 1.0, { collide: false });
    addBox(3.4, 0.16, 3.4, MAT.umbA, tx, TH + 1.3, tz, { collide: false });       // teto vermelho MAIOR
    for (const sx of [-1.4, 1.4]) for (const sz of [-1.4, 1.4])
      addBox(0.08, 1.3, 0.08, MAT.steel, tx + sx, TH + 1.3, tz + sz, { collide: false });
    for (let i = 0; i < 14; i++)   // escada no lado leste
      addBox(0.8, 0.16, 0.26, MAT.steel, tx + 1.35, 0.55 + i * 0.68, tz + 1.1 - i * 0.19, { collide: false });
    // cano do escorrega: azul c/ bordas amarelas, desce da plataforma até a borda da lagoa
    const chuteMat = lam({ color: 0x2277cc, roughness: 0.35 });
    const railMat = lam({ color: 0xf4c020, roughness: 0.5 });
    const ang = Math.atan2(8.6, 5.6);
    for (let i = 0; i < 7; i++) {
      const t = i / 6, cz = tz - 1.2 - t * 5.6, cy = TH - 0.2 - t * 8.6;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 1.7), chuteMat);
      seg.position.set(tx, cy, cz); seg.rotation.x = -ang; seg.castShadow = true; root.add(seg);
      for (const rx of [-0.58, 0.58]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.32, 1.7), railMat);
        rail.position.set(tx + rx, cy + 0.15, cz); rail.rotation.x = -ang; root.add(rail);
      }
    }
    // collider só da torre (cano alto não interfere); LOS spawn↔spawn já é 0 → só pode melhorar
    colliders.push({ minX: tx - 1.2, maxX: tx + 1.2, minY: 0, maxY: TH, minZ: tz - 1.2, maxZ: tz + 1.2 });
  }

  /* ============ CORREDORES DE COVER NOS RESPAWNS (norte/sul) ============ */
  // Cada spawn (z = ±(HALF_Z-4)) tem um corredor: paredes baixas flanqueando x=±8 deixam a lane
  // central (x -6..6) aberta do spawn até a lagoa, com blocos escalonados pra quebrar a linha de tiro.
  for (const s of [-1, 1]) {
    const ez = s * (HALF_Z - 2);            // fundo (parede do spawn)
    const zc = s * (HALF_Z - 12);           // corredor entre spawn e lagoa
    // paredes laterais do corredor (deixam a lane central aberta) — bicolor c/ rodapé de azulejo
    {
      const BL = bandTex(8);
      const longBand = [lam({ map: BL }), lam({ map: BL }), MAT.concrete, MAT.concrete, lam({ map: BL }), lam({ map: BL })];
      for (const sx of [-1, 1]) {
        addBox(0.6, 2.6, 16, longBand, sx * 8.5, 0, s * (HALF_Z - 11));   // parede longitudinal
      }
    }
    // teto parcial sobre o spawn (cobertura) — sem colisão. PERGOLADO de madeira
    // (antes: plano bege liso — "minecraft" do crítico)
    addBox(18, 0.4, 5, MAT.pergo, 0, 3.0, ez, { collide: false });
    // faixa pintada de clube nas paredes do corredor (identidade visual + quebra a lisura)
    for (const sx of [-1, 1]) {
      addPlane(15.6, 0.5, lam({ map: stripeTex(s < 0 ? '#1b5f9e' : '#2fa060', 19 + s) }), sx * 8.19, 1.45, s * (HALF_Z - 11), sx > 0 ? -Math.PI / 2 : Math.PI / 2);
    }
    // porta do VESTIÁRIO (decal na parede do corredor) + placa — identidade de clube
    {
      const doorTex = decalTex((x, S) => {
        x.fillStyle = '#4a3a2c'; x.fillRect(14, 4, 100, 124);            // batente
        x.fillStyle = '#1d1712'; x.fillRect(22, 12, 84, 116);            // vão escuro
        x.fillStyle = '#2c231b'; x.fillRect(30, 20, 68, 108);            // porta entreaberta
        x.fillStyle = '#c8b890'; x.beginPath(); x.arc(92, 72, 4, 0, 7); x.fill();   // maçaneta
      });
      const door = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.2), new THREE.MeshBasicMaterial({ map: doorTex, transparent: true }));
      door.position.set(s * -8.19, 1.1, s * (HALF_Z - 5)); door.rotation.y = s * Math.PI / 2; root.add(door);
      addPlane(3.4, 0.9, signTexture('#123a5e', '#cfe8ff', 'VESTIÁRIO', 'CHUVEIROS E ARMÁRIOS'), s * -8.19, 2.18, s * (HALF_Z - 5), s * Math.PI / 2);
    }
    // blocos escalonados FORA do eixo x≈0 (crítico R6: abrir a lane pro tobogã compor o fim)
    // + pintura variada + placa + platibanda (mesmo tratamento dos muros)
    const capS = lam({ map: stripeTex('#a85130', 61 + s) });
    const signM = (tex) => lam({ map: tex, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });   // placa legível dos 2 lados, sem z-fight
    for (const [bx2, bz2, bmat, lbl] of [
      [-5.2, zc + s * 1.5, s < 0 ? bandedGreen : bandedWhite, 'SAUNA'],
      [5.2, zc - s * 1.5, s < 0 ? bandedWhite : bandedGreen, 'BAR'],
    ]) {
      addBox(3.0, 2.2, 1.0, bmat, bx2, 0, bz2);
      const fz = bz2 + (s > 0 ? 0.60 : -0.60), fry = s > 0 ? 0 : Math.PI;   // 10cm da face (era 2cm: z-fight)
      addPlane(1.7, 0.5, signM(signTexture('#7a2020', '#f2e8d8', lbl)), bx2, 1.45, fz, fry);
      addPlane(3.0, 0.2, capS, bx2, 2.02, fz, fry);
    }
    addBox(1.0, 1.6, 1.0, bandedBlue, 0, 0, s * (HALF_Z - 18));   // pilar central no fim do corredor
    // REFORÇO DE RESPAWN (G2-R6B): banco de concreto escalonado na lane do corredor —
    // cover baixo (h=1.1: agachado fica invisível) sem mexer em LOS/A* (h < 1.6 e a lane
    // livre ao lado fica ≥5m). Lê como mobília de clube, não como muro.
    addBox(3.2, 1.1, 0.9, bandedWhite, s * 2.2, 0, s * (HALF_Z - 13));
    // quiosque de bebida colado na saída do corredor (cover + tema)
    kioskAt(s < 0 ? -11 : 11, s * (HALF_Z - 8));
  }

  /* ============ JARDINEIRAS-CHICANE → ILHOTAS ORGÂNICAS (crítico: "monólito parte o
     espelho d'água em dois gramados") — collider de cover MANTIDO (mata LOS spawn↔spawn),
     visual vira monte de areia baixo + arbustos + árvore pequena ============ */
  {
    const j1 = addBox(8, 2.2, 1.2, bandedGreen, -3, 0, 8);   // collider invisível
    const j2 = addBox(8, 2.2, 1.2, bandedBlue, 3, 0, -8);
    j1.visible = j2.visible = false;
    const leaf = [lam({ color: 0x2c6e2e, roughness: 0.95 }), lam({ color: 0x3f8f3a, roughness: 0.95 }), lam({ color: 0x58a34a, roughness: 0.95 })];
    leaf.forEach(m => { m.flatShading = true; });
    const sandM = lam({ map: beachSandTex(4, 1) });
    let fseed = 7; const frnd = () => (fseed = (fseed * 16807) % 2147483647) / 2147483647;
    for (const [jx, jz] of [[-3, 8], [3, -8]]) {
      // monte de areia orgânico (~1.2m de perfil): 3 massas achatadas sobrepostas
      for (let i = 0; i < 3; i++) {
        const mound = new THREE.Mesh(new THREE.SphereGeometry(1.9 + frnd() * 0.6, 9, 6), sandM);
        mound.scale.set(1.6, 0.38 + frnd() * 0.1, 0.55);
        mound.position.set(jx - 2.4 + i * 2.4, 0.1, jz + (frnd() - 0.5) * 0.3);
        mound.castShadow = mound.receiveShadow = true; root.add(mound);
      }
      // 3-4 arbustos (icosaedros) até ~2.2m = cover visual do collider
      for (let i = 0; i < 4; i++) {
        const bx2 = jx - 3 + i * 2 + (frnd() - 0.5) * 0.6;
        for (let k = 0; k < 2 + (frnd() > 0.5 ? 1 : 0); k++) {
          const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45 + frnd() * 0.35, 0), leaf[(i + k) % 3]);
          b.position.set(bx2 + (frnd() - 0.5) * 0.5, 0.7 + k * 0.55 + frnd() * 0.3, jz + (frnd() - 0.5) * 0.35);
          b.castShadow = true; root.add(b);
        }
      }
      // árvore pequena de restinga na ponta da ilhota
      const tx2 = jx + 3.1, tz2 = jz;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 1.9, 7), lam({ color: 0x5a4632 }));
      trunk.position.set(tx2, 1.5, tz2); trunk.castShadow = true; root.add(trunk);
      for (let i = 0; i < 2; i++) {
        const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75 - i * 0.15, 0), leaf[i]);
        b.position.set(tx2 + (i ? 0.35 : -0.15), 2.4 + i * 0.6, tz2); b.castShadow = true; root.add(b);
      }
    }
  }

  /* ============ SET DRESSING Mint (festa de piscina BR) ============ */
  // churrasqueiras de tijolo perto dos quiosques
  for (const [x, z, ry] of [[-14, 26, 0.4], [14, -26, Math.PI + 0.4]]) {
    if (!gprop('churrasqueira', x, z, 2.2, ry)) addBox(1.4, 2.2, 1.0, MAT.concrete, x, 0, z, { ry });
    colliders.push({ minX: x - 0.8, maxX: x + 0.8, minY: 0, maxY: 2.2, minZ: z - 0.6, maxZ: z + 0.6 });
  }
  // mesas de plástico c/ guarda-sol no deck (cover baixo espalhado) + 2 clusters na chapa
  // bege a LESTE, entre a prainha e o muro (crítico R6: "trecho pelado residual")
  for (const [x, z, ry] of [[18, 6, 0], [18, -8, 1.1], [-18, 10, 2.2], [-18, -12, 0.6], [17, 16.5, 0.8], [17, -16.5, 2.6]]) {
    if (!gprop('mesa_guardasol', x, z, 2.3, ry)) addBox(1.8, 2.3, 1.8, MAT.white, x, 0, z, { ry });
    colliders.push({ minX: x - 0.9, maxX: x + 0.9, minY: 0, maxY: 1.0, minZ: z - 0.9, maxZ: z + 0.9 });
  }
  // coolers do lado das mesas — 3→6: "isopor por todo lado" é assinatura do Piscinão em
  // dia de calor, e são cover baixo que não estraga LOS (h=0.55)
  for (const [x, z] of [[17, 4], [-17, 8], [19, -10], [-19, -18], [20, 19], [-15.5, 30]]) {
    if (!gprop('cooler', x, z, 0.55)) addBox(0.6, 0.55, 0.4, MAT.white, x, 0, z);
    colliders.push({ minX: x - 0.35, maxX: x + 0.35, minY: 0, maxY: 0.55, minZ: z - 0.25, maxZ: z + 0.25 });
  }
  // mesas perto dos spawns (props de clube na zona morta — crítico: "spawn é areia + caixas")
  for (const [x, z, ry] of [[-13, 26, 0.7], [13, -26, 2.4]]) {
    if (!gprop('mesa_guardasol', x, z, 2.3, ry)) addBox(1.8, 2.3, 1.8, MAT.white, x, 0, z, { ry });
    colliders.push({ minX: x - 0.9, maxX: x + 0.9, minY: 0, maxY: 1.0, minZ: z - 0.9, maxZ: z + 0.9 });
  }
  // toalhas estendidas na areia (decals de primeira-leitura)
  {
    const towelCols = [0xe23b3b, 0x3a6ec2, 0xf4c020, 0x2fa060];
    towelCols.forEach((col, i) => {
      const t = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.0), new THREE.MeshStandardMaterial({ color: col, roughness: 0.95 }));
      t.rotation.x = -Math.PI / 2; t.rotation.z = i * 0.7;
      t.position.set(-16 + i * 9, 0.012, (i % 2 ? -22 : 22));
      t.receiveShadow = true; root.add(t);
    });
  }
  // CAIXAS DE SOM (paredão): 1 → 3. Sem paredão não é balneário carioca em domingo.
  for (const [x, z, ry] of [[-12.5, -(HALF_Z - 10), 0.9], [12.5, HALF_Z - 10, 2.6], [-18.5, 24, 1.4]]) {
    if (!gprop('caixa_som', x, z, 1.6, ry)) addBox(0.8, 1.6, 0.8, MAT.kiosk, x, 0, z, { ry });
    colliders.push({ minX: x - 0.5, maxX: x + 0.5, minY: 0, maxY: 1.6, minZ: z - 0.5, maxZ: z + 0.5 });
  }
  // placa de regras na entrada leste + boias novas na água
  if (!gprop('placa_piscina', 13, HALF_Z - 10, 1.7, Math.PI)) addBox(1.6, 1.7, 0.3, MAT.kiosk, 13, 0, HALF_Z - 10);
  colliders.push({ minX: 12.2, maxX: 13.8, minY: 0, maxY: 1.7, minZ: HALF_Z - 10.3, maxZ: HALF_Z - 9.7 });
  gprop('boia', 3, 2, 0.5, 0.4, -0.1); gprop('boia', -4, -5, 0.5, 2.1, -0.1);   // flutuando, sem collider

  /* ============ GROUND DETAIL PASS (crítico gauntlet R2: "primeiro plano morto") ============
     decals + micro-props SEM collider (não afetam LOS/A*) — quebram a lisura da areia/deck. */
  {
    let dseed = 97; const drnd = () => (dseed = (dseed * 16807) % 2147483647) / 2147483647;
    const decal = (tex, w, d, x, z, ry = 0, y = 0.014, opacity = 1) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d),
        new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 }));
      m.rotation.x = -Math.PI / 2; m.rotation.z = ry; m.position.set(x, y, z); m.receiveShadow = true; root.add(m);
    };
    // areia solta (blob claro — invade bordas da grama e cantos de deck)
    const sandBlob = decalTex((x, S) => {
      let s2 = 71; const r2 = () => (s2 = (s2 * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 8; i++) {
        const px = S / 2 + (r2() - 0.5) * 60, py = S / 2 + (r2() - 0.5) * 60, rr = 16 + r2() * 30;
        const g = x.createRadialGradient(px, py, 2, px, py, rr);
        g.addColorStop(0, 'rgba(230,211,163,0.75)'); g.addColorStop(1, 'rgba(230,211,163,0)');
        x.fillStyle = g; x.beginPath(); x.arc(px, py, rr, 0, 7); x.fill();
      }
    });
    // manchas de deck molhado coladas na borda da lagoa
    const wetTex = decalTex((x, S) => {
      const g = x.createRadialGradient(S / 2, S / 2, 8, S / 2, S / 2, S / 2);
      g.addColorStop(0, 'rgba(90,80,58,0.5)'); g.addColorStop(1, 'rgba(90,80,58,0)');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
    });
    for (const [x, z, w] of [[-4, nZ + 1.6, 4.5], [6, nZ + 1.4, 3.5], [2, sZ - 1.6, 5], [-9, sZ - 1.5, 3.2], [nX + 1.7, -3, 4], [sX - 1.7, 5, 4.2]])
      decal(wetTex, w, 2.2, x, z, drnd() * 3, 0.013);
    // avisos pintados no deck — LAGOA: sem placa de clube; só areia invadindo a água em
    // curvas orgânicas AGRESSIVAS (crítico: "borda orgânica tímida") + espuma irregular
    decal(paintTex('CUIDADO FUNDO', 'rgba(120,60,30,0.85)', 40), 4.0, 2.0, POOL.cx + 3.2, nZ + 1.8, 0);
    for (const [x, z, w, d, ry] of [[-8, nZ + 1.2, 8, 3.6, 0.3], [5, nZ + 0.9, 7, 3.2, 2.1], [9, sZ - 1.1, 8.5, 4, 1.2], [-6, sZ - 0.9, 6.5, 3.4, 2.8],
      [nX + 1.1, 6, 7.5, 3.6, 1.6], [nX + 0.9, -8, 6, 3, 0.6], [sX - 1.1, 3, 8, 3.8, 2.4], [sX - 0.9, -10, 6, 2.8, 1.0]])
      decal(sandBlob, w, d, x, z, ry, 0.015, 0.95);
    // espuma/línea d'água irregular no perímetro (arcos quebrados, alpha SUAVE — de longe
    // liam como "linhas de giz")
    const foamTex = decalTex((x, S) => {
      let f = 13; const r = () => (f = (f * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 14; i++) {
        const a = r() * Math.PI * 2, rr = S * 0.34 + (r() - 0.5) * S * 0.14;
        x.strokeStyle = `rgba(235,248,242,${0.1 + r() * 0.18})`; x.lineWidth = 1 + r() * 1.5;
        x.beginPath(); x.arc(S / 2, S / 2, rr, a, a + 0.4 + r() * 0.9); x.stroke();
      }
    });
    for (const [x, z, w, ry] of [[-9, POOL.cz + POOL.hz - 1.5, 7, 0.3], [3, POOL.cz + POOL.hz - 1, 8, 1.8], [9, POOL.cz - POOL.hz + 1.5, 7.5, 2.6], [-4, POOL.cz - POOL.hz + 1, 6.5, 0.9],
      [POOL.cx + POOL.hx - 1, 4, 6, 1.4], [POOL.cx + POOL.hx - 1.5, -7, 7, 2.9], [POOL.cx - POOL.hx + 1, 8, 6.5, 0.5], [POOL.cx - POOL.hx + 1.5, -4, 7, 2.1]])
      decal(foamTex, w, w * 0.7, x, z, ry, -0.09, 0.3);   // 0.6→0.3: a espuma da MARGEM agora é do shader; aqui sobra só a escuma solta no meio
    // areia acumulada no rodapé do muro-perímetro (vento junta areia nos cantos)
    const driftTex = decalTex((x, S) => {
      const g = x.createLinearGradient(0, 0, 0, S);
      g.addColorStop(0, 'rgba(230,211,163,0)'); g.addColorStop(1, 'rgba(222,198,148,0.85)');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
    });
    for (const sx of [-1, 1]) decal(driftTex, HALF_Z * 2 - 4, 1.6, sx * (HALF_X - 0.9), 0, Math.PI / 2 * sx, 0.012, 0.8);
    for (const sz of [-1, 1]) decal(driftTex, HALF_X * 2 - 4, 1.6, 0, sz * (HALF_Z - 0.9), sz > 0 ? Math.PI : 0, 0.012, 0.8);

    // ---- micro-props: chinelos, garrafas, copos (coloridos, miúdos, zeram a lisura) ----
    const chineloCols = [0x2fa060, 0xe23b3b, 0x3a6ec2, 0xf4c020, 0xff6a8a];
    const chinelo = (x, z, ry) => {
      const col = chineloCols[(drnd() * chineloCols.length) | 0];
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.025, 0.28), lam({ color: col, roughness: 0.7 }));
      m.position.set(x, 0.02, z); m.rotation.y = ry; m.castShadow = true; root.add(m);
    };
    const par = (x, z) => { const r = drnd() * 6.3; chinelo(x, z, r); chinelo(x + 0.16, z + 0.06, r + 0.2); };
    // pares de chinelo: spawns + saída dos corredores (G2-R14B: metade — declutter)
    par(-3, 30); par(-4, -29); par(-15, 21); par(14, -23);
    chinelo(6.5, 17, 1.2); chinelo(-12.5, -18, 5.1);
    const garrafa = (x, z, lying) => {
      const col = drnd() > 0.5 ? 0x2c6e3f : 0x7a4a20;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.24, 8), lam({ color: col, roughness: 0.3 }));
      if (lying) { m.rotation.z = Math.PI / 2; m.rotation.y = drnd() * 6.3; m.position.set(x, 0.04, z); }
      else m.position.set(x, 0.12, z);
      m.castShadow = true; root.add(m);
    };
    const copo = (x, z) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.022, 0.07, 8), lam({ color: drnd() > 0.5 ? 0xf2f2f2 : 0xd83030, roughness: 0.5 }));
      m.position.set(x, 0.035, z); if (drnd() > 0.6) { m.rotation.z = Math.PI / 2; m.position.y = 0.03; } root.add(m);
    };
    // lixo de festa perto das mesas/quiosques (G2-R14B: 10→6 pontos — declutter)
    for (const [x, z] of [[17.2, 5.2], [-17.2, 9.2], [-13.4, 25.2], [13.5, -25.4], [-14.6, 27.2], [10.8, 28.6]]) {
      garrafa(x + drnd() * 0.6, z + drnd() * 0.6, drnd() > 0.4); if (drnd() > 0.35) copo(x - drnd() * 0.8, z + drnd() * 0.8);
    }
    // guardanapos/papéis na areia (NUNCA na água) — G2-R14B: 14→6 (declutter)
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.12), lam({ color: 0xf0ead8, roughness: 0.95, side: THREE.DoubleSide }));
      const sx2 = drnd() > 0.5 ? 1 : -1;
      const px2 = sx2 * (10 + drnd() * 11), pz2 = drnd() * 54 - 27;
      if (Math.abs(px2) < 14 && Math.abs(pz2) < 17) { continue; }   // fora da lagoa
      m.position.set(px2, 0.015, pz2); m.rotation.x = -Math.PI / 2; m.rotation.z = drnd() * 6.3; root.add(m);
    }
    // BANHISTAS em volume baixo (cabeça+ombros icosaedro, linguagem das árvores) —
    // substituem os "decals papelão" dentro d'água
    {
      const skin = [lam({ color: 0xc28a62, roughness: 0.8 }), lam({ color: 0x8a5a3a, roughness: 0.8 }), lam({ color: 0xe0b08a, roughness: 0.8 })];
      const hair = [lam({ color: 0x2a2018 }), lam({ color: 0x4a2e18 }), lam({ color: 0x1a1a1c })];
      skin.concat(hair).forEach(mm => { mm.flatShading = true; });
      const bath = (x, z, si) => {
        const sh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 0), skin[si]);   // ombros
        sh.scale.set(1.5, 0.55, 0.7); sh.position.set(x, -0.08, z); root.add(sh);
        const hd = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), skin[si]);   // cabeça
        hd.position.set(x, 0.16, z); root.add(hd);
        const hc = new THREE.Mesh(new THREE.IcosahedronGeometry(0.135, 0), hair[si]);  // cabelo
        hc.scale.set(1, 0.72, 1); hc.position.set(x, 0.22, z - 0.02); root.add(hc);
      };
      // "MUITA GENTE" é item de gabarito, mas banhista de corpo inteiro na areia vira
      // alvo falso num FPS. Solução: cabeça+ombros DENTRO da lagoa (nunca confundível
      // com bot) — 3 → 18. ?crowd=0 volta ao mínimo.
      const heads = [[6, -6], [-7, 2], [2, 11], [-3, -3], [8, 4], [-9, -9], [4, -12], [-5, 12],
        [10, -2], [0, 6], [-10, 6], [7, 9], [-2, -8], [11, 11], [-11, -2], [3, -1], [-6, 8], [9, -10]];
      (CROWD ? heads : heads.slice(0, 3)).forEach(([hx, hz], i) => bath(hx, hz, i % 3));
      // BANHISTAS SENTADOS na canga, na periferia da areia (fora das lanes): torso baixo,
      // sem pernas de pé — não lê como inimigo agachado a 30m.
      if (CROWD) {
        const shirt = [lam({ color: 0xe8e2d2, roughness: 0.9 }), lam({ color: 0x3a6ec2, roughness: 0.9 }), lam({ color: 0xe23b3b, roughness: 0.9 })];
        shirt.forEach(m => { m.flatShading = true; });
        for (const [sx3, sz3, si] of [[-20.5, 17, 0], [-19.4, 15.6, 1], [20.6, -19, 2], [19.2, -17.6, 0],
          [-21, -26, 1], [21, 27, 2], [-17.5, -30, 0], [17.6, 31, 1]]) {
          const torso = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 0), shirt[si]);
          torso.scale.set(0.9, 1.0, 0.7); torso.position.set(sx3, 0.42, sz3); torso.castShadow = true; root.add(torso);
          const hd = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), skin[si]);
          hd.position.set(sx3, 0.86, sz3); hd.castShadow = true; root.add(hd);
          const hc = new THREE.Mesh(new THREE.IcosahedronGeometry(0.145, 0), hair[si]);
          hc.scale.set(1, 0.7, 1); hc.position.set(sx3, 0.92, sz3 - 0.02); root.add(hc);
        }
      }
    }

    // ---- cadeiras de plástico (monobloco branca — ícone de clube/bar BR) ----
    const chair = (x, z, ry, tipped = false) => {
      const g = new THREE.Group();
      const white = lam({ color: 0xf0f2ee, roughness: 0.55 });
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.42), white); seat.position.y = 0.42; g.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.05), white); back.position.set(0, 0.68, -0.19); back.rotation.x = -0.12; g.add(back);
      for (const lx of [-0.18, 0.18]) for (const lz of [-0.18, 0.18]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.42, 6), white);
        leg.position.set(lx, 0.21, lz); g.add(leg);
      }
      g.position.set(x, 0, z); g.rotation.y = ry;
      if (tipped) { g.rotation.z = Math.PI / 2; g.position.y = 0.24; }
      g.traverse(o => { if (o.isMesh) o.castShadow = true; }); root.add(g);
    };
    // cadeiras: 4→10, sempre em RODINHA na periferia (fora das lanes) — cadeira solta lê
    // como prop esquecido; cadeira em roda lê como família que passou o domingo ali
    chair(17, 7.2, 2.4); chair(19.2, 4.6, -0.8, true); chair(-17, 11.4, 1.1); chair(-12, 27.6, 1.8);
    chair(17.9, 6.4, 0.6); chair(-17.9, 10.6, 3.4); chair(-11.2, 28.3, 4.6);
    chair(-20.5, -21, 1.9); chair(-19.6, -22.2, 4.9); chair(20.2, 22.4, 0.3);

    // ---- chuveirão do deck (poste + prato) c/ poça embaixo ----
    const shower = (x, z) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 8), MAT.steel);
      pole.position.set(x, 1.15, z); pole.castShadow = true; root.add(pole);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 6), MAT.steel);
      arm.rotation.z = Math.PI / 2; arm.position.set(x + 0.22, 2.25, z); root.add(arm);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.1, 0.08, 10), MAT.steel);
      head.position.set(x + 0.44, 2.2, z); root.add(head);
      decal(wetTex, 1.6, 1.6, x + 0.44, z, 0, 0.015);
    };
    shower(16.6, 13.5); shower(-16.6, -13.5);

    // ---- bandeirinhas de festa (clube em dia de domingo) entre pontos altos ----
    const buntCols = [0xe23b3b, 0xf4c020, 0x2fa060, 0x3a6ec2, 0xff6a8a];
    const bunting = (x1, z1, x2, z2, y = 2.9, n = 10) => {
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
      const len = Math.hypot(x2 - x1, z2 - z1);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, len, 4), lineMat);
      rope.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
      rope.rotation.z = Math.PI / 2; rope.rotation.y = -Math.atan2(z2 - z1, x2 - x1); root.add(rope);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, fx = x1 + (x2 - x1) * t, fz = z1 + (z2 - z1) * t, fy = y - 0.28 - Math.sin(t * Math.PI) * 0.14;
        const tri = new THREE.BufferGeometry();
        tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.17, 0, 0, 0.17, 0, 0, 0, -0.36, 0]), 3));   // 3-4× maior (eram "confetes de 2px")
        tri.computeVertexNormals();
        const f = new THREE.Mesh(tri, new THREE.MeshBasicMaterial({ color: buntCols[i % buntCols.length], side: THREE.DoubleSide }));
        f.position.set(fx, fy, fz); f.rotation.y = Math.atan2(z2 - z1, x2 - x1) + Math.PI / 2; root.add(f);
      }
    };
    bunting(-14, 25.2, -18, 20.5); bunting(14, -25.2, 18, -20.5); bunting(-11, 27, -16.5, 26.5, 2.7); bunting(11, -27, 16.5, -26.5, 2.7);

    // ---- LATERAIS vestidas (crítico R6: "corredores laterais nus") — espalha os props que
    // já existiam só no fundo: bóias, cadeiras, placas, lixo. Sem collider. ----
    const boiaPile = (x, z) => {
      for (let i = 0; i < 3; i++) {
        const t = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.16, 8, 16), i % 2 ? MAT.foam : MAT.foam2);
        t.rotation.x = Math.PI / 2; t.position.set(x + (i % 2) * 0.1, 0.16 + i * 0.28, z); t.castShadow = true; root.add(t);
      }
    };
    boiaPile(-14.6, -16.5); boiaPile(14.6, 16.5); boiaPile(-14.6, 13);
    chair(-13.6, 16.4, 2.2); chair(13.8, -15.2, 1.3);   // G2-R14B: 4→2 (declutter)
    for (const [x, z] of [[-14, 1], [14.4, -18.2], [-13.2, 22.6], [13.8, 6.4]]) { garrafa(x, z, drnd() > 0.4); if (drnd() > 0.4) copo(x + 0.5, z - 0.4); }
    par(-14.2, -6); par(14.4, 9); chinelo(-13.4, 12.4, 0.8); chinelo(13.6, -8.6, 2.2);
    // lixeiras de tambor nas laterais
    for (const [x, z] of [[-13.4, -22.4], [13.4, 24.4]]) {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.72, 12), lam({ color: 0x2c5e2e, roughness: 0.7 }));
      drum.position.set(x, 0.36, z); drum.castShadow = drum.receiveShadow = true; root.add(drum);
    }
    // areia invadindo as bordas da grama da quadra (borda irregular, sem retângulo duro)
    for (const [x, z, w, ry] of [[15.4, -8, 3.2, 0.4], [15.4, 6, 2.6, 2.2], [23.4, -4, 3.4, 1.1], [23.4, 9, 2.8, 2.9], [18, -11.8, 3.0, 0.2], [21, 11.8, 3.2, 1.7]])
      decal(sandBlob, w, w * 0.6, x, z, ry, 0.017, 0.9);

    // ---- CAMADA AÉREA (crítico R6: "céu morto do miolo"): bandeirinhas cruzando a
    // piscina E-W e o deck N-S, sem depender de silhueta ----
    bunting(-23.8, -10, 23.8, -10, 3.4, 40);
    bunting(-23.8, 0, 23.8, 0, 3.5, 44);
    bunting(-23.8, 10, 23.8, 10, 3.4, 40);
    bunting(-14, -33.5, 14, 33.5, 3.6, 52);
    bunting(14, -33.5, -14, 33.5, 3.6, 52);

    // ---- chão dos corredores de spawn (crítico R6: "plano bege único") ----
    for (const s of [-1, 1]) {
      for (const dz of [19.5, 22.5, 25.5, 28.5, 31.5]) {   // juntas de dilatação
        const j = new THREE.Mesh(new THREE.PlaneGeometry(15.4, 0.07), new THREE.MeshBasicMaterial({ color: 0x8a7a5e, transparent: true, opacity: 0.5, depthWrite: false }));
        j.rotation.x = -Math.PI / 2; j.position.set(0, 0.013, s * dz); root.add(j);
      }
      decal(sandBlob, 3.4, 2.4, -5.5, s * 21, 1.2, 0.014, 0.8);   // manchas úmidas
      decal(sandBlob, 3.0, 2.2, 5, s * 30, 2.6, 0.014, 0.8);
      garrafa(-7.4, s * 24, true); copo(7.3, s * 27); chinelo(-7.2, s * 29, 1.1); chinelo(7.4, s * 20, 4.2);
    }

    // ---- AO ASSADO (crítico R6: "caixas parecem flutuar") — escurece o encontro base/piso ----
    const aoTex = decalTex((x, S) => {
      const g = x.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S / 2);
      g.addColorStop(0, 'rgba(28,24,16,0)'); g.addColorStop(1, 'rgba(28,24,16,0.42)');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
    });
    for (const [x, z, w, d] of [[-3, 8, 9.4, 2.6], [3, -8, 9.4, 2.6], [0, 20.8, 3.6, 3.6],
      [-5.2, 25.5, 4.2, 2.2], [5.2, 22.5, 4.2, 2.2], [-5.2, -25.5, 4.2, 2.2], [5.2, -22.5, 4.2, 2.2],
      [-11, -28, 4.2, 2.6], [11, 28, 4.2, 2.6]])   // jardineiras, tobogã, blocos, quiosques
      decal(aoTex, w, d, x, z, 0, 0.011, 1);
    const aoWallTex = decalTex((x, S) => {   // gradiente vertical nos 0.45m da base dos muros
      const g = x.createLinearGradient(0, 0, 0, S);
      g.addColorStop(0, 'rgba(28,24,16,0)'); g.addColorStop(1, 'rgba(28,24,16,0.4)');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
    });
    for (const [w2, x, z, ry] of [[HALF_X * 2, 0, 35.955, Math.PI], [HALF_X * 2, 0, -35.955, 0], [HALF_Z * 2, 23.955, 0, -Math.PI / 2], [HALF_Z * 2, -23.955, 0, Math.PI / 2]]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w2, 0.45),
        new THREE.MeshStandardMaterial({ map: aoWallTex, transparent: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 }));
      m.position.set(x, 0.22, z); m.rotation.y = ry; root.add(m);
    }
    // trilhas de pegadas molhadas (saída da lagoa, chuveiros, corredores)
    const footTex = decalTex((x, S) => {
      let f = 11; const r = () => (f = (f * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 8; i++) {
        x.fillStyle = `rgba(90,80,58,${0.22 + r() * 0.2})`;
        x.beginPath(); x.ellipse(S * 0.35 + (i % 2) * S * 0.3, 12 + i * 13, 5, 9, i % 2 ? 0.2 : -0.2, 0, 7); x.fill();
      }
    });
    for (const [x, z, ry] of [[-6, nZ + 1.9, 0.2], [8, sZ - 1.9, 3.3], [nX + 1.8, 6, 1.5], [sX - 1.8, -7, -1.6], [2, 23, 0.4], [-3, -23, 3.5]])
      decal(footTex, 0.9, 1.8, x, z, ry, 0.016);
  }

  /* ============ VESTINDO OS CORREDORES (crítico R6: "cantos e corredores mortos") ============
     2-3 props de FUNÇÃO por corredor: lockers, banco, lixeira, placa + pilha de bóias. */
  for (const s of [-1, 1]) {
    // armários do vestiário (banco de 2 portas, encostado na parede da porta)
    {
      const doors = lam({ map: lockerTex(s < 0 ? '#2c6e7a' : '#7a5a2c', 31 + s) });
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.8, 1.5), [doors, doors, MAT.steel, MAT.steel, MAT.steel, MAT.steel]);
      m.position.set(s * -7.9, 0.9, s * (HALF_Z - 8.5));
      m.castShadow = m.receiveShadow = true; root.add(m);
      colliders.push({ minX: s * -7.9 - 0.2, maxX: s * -7.9 + 0.2, minY: 0, maxY: 1.8, minZ: s * (HALF_Z - 8.5) - 0.8, maxZ: s * (HALF_Z - 8.5) + 0.8 });
    }
    // banco de madeira na parede oposta
    {
      const wood = lam({ map: pergoTex(2, 0.5) });
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 1.9), wood);
      seat.position.set(s * 7.75, 0.44, s * (HALF_Z - 9.5)); seat.castShadow = seat.receiveShadow = true; root.add(seat);
      for (const dz of [-0.7, 0.7]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.4, 0.08), MAT.steel);
        leg.position.set(s * 7.75, 0.2, s * (HALF_Z - 9.5) + dz); root.add(leg);
      }
      colliders.push({ minX: s * 7.75 - 0.25, maxX: s * 7.75 + 0.25, minY: 0, maxY: 0.48, minZ: s * (HALF_Z - 9.5) - 1.0, maxZ: s * (HALF_Z - 9.5) + 1.0 });
    }
    // lixeira de tambor verde na saída do corredor
    {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.72, 12), lam({ color: 0x2c5e2e, roughness: 0.7 }));
      drum.position.set(s < 0 ? -9.4 : 9.4, 0.36, s * (HALF_Z - 11)); drum.castShadow = drum.receiveShadow = true; root.add(drum);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 6, 14), MAT.steel);
      rim.rotation.x = Math.PI / 2; rim.position.set(s < 0 ? -9.4 : 9.4, 0.72, s * (HALF_Z - 11)); root.add(rim);
      colliders.push({ minX: (s < 0 ? -9.4 : 9.4) - 0.32, maxX: (s < 0 ? -9.4 : 9.4) + 0.32, minY: 0, maxY: 0.72, minZ: s * (HALF_Z - 11) - 0.32, maxZ: s * (HALF_Z - 11) + 0.32 });
    }
    // placa de regras do balneário na parede do corredor
    addPlane(3.0, 0.75, signTexture('#7a2020', '#f2e8d8', 'REGRAS DO BALNEÁRIO', 'PROIBIDO CORRER · CHUVEIRO OBRIGATÓRIO'), s * 8.19, 2.1, s * (HALF_Z - 16), s * Math.PI / 2);
    // pilha de bóias FLUTUANDO na borda da água (crítico: "boia pink gigante na areia seca")
    {
      const bx = s * 9.5, bz = s * (OUTZ - 1.6);
      for (let i = 0; i < 3; i++) {
        const t = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.17, 8, 16), i % 2 ? MAT.foam2 : MAT.foam);
        t.rotation.x = Math.PI / 2; t.rotation.y = i * 0.3;
        t.position.set(bx + (i % 2) * 0.5, -0.06 + i * 0.05, bz - (i % 2) * 0.4); t.castShadow = true; root.add(t);
      }
    }
  }

  /* ============ LATERAL ESQUERDA (-x): AREIA LIVRE (G2-R14B: skate park removido —
     "não faz sentido num balneário de lagoa"; a faixa oeste volta a ser areia com
     guarda-sóis, mesma linguagem do resto da praia) ============ */

  /* ============ LATERAL DIREITA (+x): VÔLEI DE PRAIA + ARQUIBANCADA ============ */
  {
    const bx = HALF_X - 4.5;   // 19.5 — fora da margem da lagoa
    // quadra de vôlei = AREIA marcada (lagoa de praia, não society) c/ borda irregular
    {
      const c = document.createElement('canvas'); c.width = 128; c.height = 256;
      const xc = c.getContext('2d');
      let sd = 47; const rr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
      const img = xc.createImageData(128, 256);
      for (let j = 0; j < 256; j++) for (let i = 0; i < 128; i++) {
        const d = Math.min(i, 127 - i, j, 255 - j), n = rr();
        const a = d > 12 ? 255 : (d / 12) * 255 * (n > 0.35 ? 1 : n / 0.35);
        const o = (j * 128 + i) * 4, t = rr();
        img.data[o] = 208 + t * 30; img.data[o + 1] = 184 + t * 26; img.data[o + 2] = 138 + t * 22; img.data[o + 3] = a;
      }
      xc.putImageData(img, 0, 0);
      xc.strokeStyle = 'rgba(245,242,232,0.9)'; xc.lineWidth = 4;   // linhas do vôlei
      xc.strokeRect(12, 12, 104, 232);
      xc.beginPath(); xc.moveTo(12, 128); xc.lineTo(116, 128); xc.stroke();
      const vt = new THREE.CanvasTexture(c); vt.colorSpace = THREE.SRGBColorSpace;
      const q = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 25.4),
        new THREE.MeshStandardMaterial({ map: vt, transparent: true, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1 }));
      q.rotation.x = -Math.PI / 2; q.position.set(bx, 0.012, 0); q.receiveShadow = true; root.add(q);
    }
    // REDE de vôlei no meio da quadra (postes finos, sem collider — cover já vem dos pilares)
    {
      const netC = document.createElement('canvas'); netC.width = 64; netC.height = 32;
      const nx = netC.getContext('2d');
      nx.strokeStyle = 'rgba(240,240,235,0.85)'; nx.lineWidth = 1.5;
      for (let i = 0; i <= 8; i++) { nx.beginPath(); nx.moveTo(i * 8, 0); nx.lineTo(i * 8, 32); nx.stroke(); }
      for (let i = 0; i <= 4; i++) { nx.beginPath(); nx.moveTo(0, i * 8); nx.lineTo(64, i * 8); nx.stroke(); }
      nx.fillStyle = '#e8e4da'; nx.fillRect(0, 0, 64, 4);   // faixa superior
      const nt = new THREE.CanvasTexture(netC); nt.colorSpace = THREE.SRGBColorSpace;
      const net = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 1.05),
        new THREE.MeshBasicMaterial({ map: nt, transparent: true, side: THREE.DoubleSide, alphaTest: 0.1 }));
      net.position.set(bx, 2.35, 0); net.rotation.y = Math.PI / 2; root.add(net);
      for (const pz of [-3.9, 3.9]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.9, 8), MAT.steel);
        post.position.set(bx, 1.45, pz); post.castShadow = true; root.add(post);
      }
    }
    // postes/tela da quadra (cover em fileira)
    for (const rz of [-10, -3, 4, 11]) addBox(0.4, 2.8, 0.4, MAT.fence, bx - 3.75, 0, rz);
    for (const rz of [-10, -3, 4, 11]) addBox(0.4, 2.8, 0.4, MAT.fence, bx + 3.75, 0, rz);
    // arquibancada (degraus = cover + vantagem). GLB Mint por cima; degraus viram collider oculto.
    const steps = [];
    for (let i = 0; i < 4; i++) steps.push(addBox(9, 0.5, 1.4, MAT.bleacher, HALF_X - 3.5, i * 0.5, -14 + i * 1.4));
    if (gprop('arquibancada', HALF_X - 3.5, -12, 2.4, -Math.PI / 2)) steps.forEach(s => s.visible = false);
    addPlane(6, 2.2, signTexture('#153a20', '#d7ffcc', 'VÔLEI', 'DE PRAIA'), HALF_X - 1.8, 2.5, 8, -Math.PI / 2);
  }

  /* ---------------- guarda-sóis espalhados pela areia (decorativo) ---------------- */
  function parasol(x, z, col) {
    if (gprop('guarda_sol', x, z, 3.0)) return;   // GLB Mint
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8), MAT.steel);
    pole.position.set(x, 1.2, z); root.add(pole);
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.85, 12), col);
    top.position.set(x, 2.6, z); root.add(top);
  }
  for (const [x, z, c] of [[-18, 20, MAT.umbA], [18, 22, MAT.umbB], [-20, -20, MAT.umbB], [20, -22, MAT.umbA], [-16, 26, MAT.umbB], [16, 28, MAT.umbA]]) parasol(x, z, c);

  /* ---------------- guarda-sóis procedurais na areia (sem collider, fora da lagoa,
     corredores e quadra). G2-R14B: com o skate park fora, a faixa oeste (x<-14) volta
     a receber guarda-sóis; total 34→26 pra despoluir o cenário ---------------------- */
  {
    let useed = 131; const urnd = () => (useed = (useed * 16807) % 2147483647) / 2147483647;
    const cols = [0xe23b3b, 0xf4c020, 0x2fa060, 0x3a6ec2, 0xff6a8a, 0xff8a3b, 0xf2f2f2];
    const umbMat = cols.map(cc => lam({ color: cc, roughness: 0.8 }));
    const sandy = (x, z) => {
      if (Math.abs(x) < 14 && Math.abs(z) < 20) return false;          // lagoa + faixa
      if (Math.abs(x) < 10 && Math.abs(z) > 15) return false;          // corredores de spawn
      if (x > 14 && Math.abs(z) < 13.5) return false;                  // quadra de vôlei
      return Math.abs(x) < 23 && Math.abs(z) < 33.5;
    };
    let placed = 0, guard = 0;
    while (placed < 26 && guard++ < 500) {
      const x = (urnd() * 2 - 1) * 23, z = (urnd() * 2 - 1) * 33;
      if (!sandy(x, z)) continue;
      // guarda-sol de praia NUNCA está a prumo: inclina pro sol e cada um pro seu lado.
      // Um campo de cones perfeitamente verticais é o tell nº1 de cenário de maquete.
      const tilt = (urnd() - 0.5) * 0.42, spin = urnd() * 6.3;
      const lean = new THREE.Group(); lean.position.set(x, 0, z);
      lean.rotation.y = spin; lean.rotation.z = tilt; root.add(lean);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.3, 6), MAT.steel);
      pole.position.set(0, 1.15, 0); pole.castShadow = true; lean.add(pole);
      const top = new THREE.Mesh(new THREE.ConeGeometry(1.4 + urnd() * 0.35, 0.6 + urnd() * 0.35, 10), umbMat[(urnd() * umbMat.length) | 0]);
      top.position.set(0, 2.45, 0); top.castShadow = true; lean.add(top);
      if (urnd() > 0.45) {   // esteira/canga estendida aos pés
        const t = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), lam({ color: cols[(urnd() * cols.length) | 0], roughness: 0.95 }));
        t.rotation.x = -Math.PI / 2; t.rotation.z = urnd() * 6.3;
        t.position.set(x + 0.9, 0.012, z + 0.4); t.receiveShadow = true; root.add(t);
      }
      placed++;
    }
  }

  /* ---------------- vegetação nas bordas (árvores FORA do muro, visíveis por cima) -------- */
  {
    const leafMat = lam({ color: 0x3f7a3a, roughness: 0.95 }); leafMat.flatShading = true;
    const trunkMat = lam({ color: 0x5a4632, roughness: 0.9 });
    const tree = (x, z, s = 1) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * s, 0.2 * s, 2.6 * s, 7), trunkMat);
      trunk.position.set(x, 1.3 * s, z); trunk.castShadow = true; root.add(trunk);
      for (let i = 0; i < 3; i++) {
        const b = new THREE.Mesh(new THREE.IcosahedronGeometry((1.1 + i * 0.4) * s * 0.75, 0), leafMat);
        b.position.set(x + (i - 1) * 0.9 * s, (2.6 + i * 0.85) * s, z + (i % 2 ? 0.4 : -0.3) * s);
        b.castShadow = true; root.add(b);
      }
    };
    tree(-27.5, -30, 1.5); tree(27.5, -26, 1.3); tree(-27.5, 26, 1.4); tree(27.5, 30, 1.6);
    tree(-27.5, 4, 1.2); tree(27.5, 8, 1.1); tree(-8, -40, 1.4); tree(10, 40, 1.5);
  }

  /* ---------------- torre do salva-vidas (marco alto, base = cover) ---------------- */
  {
    const tx = -(OUTX + 4), tz = -(OUTZ + 4);
    const usedGLB = gprop('lifeguard_tower', tx, tz, 5.2);
    if (!usedGLB) {
      for (const sx of [-0.7, 0.7]) for (const sz of [-0.7, 0.7]) addBox(0.18, 3.2, 0.18, MAT.steel, tx + sx, 0, tz + sz, { collide: false });
      addBox(2.2, 0.2, 2.2, MAT.white, tx, 3.2, tz, { collide: false });
      addBox(2.4, 0.24, 2.4, MAT.guard, tx, 4.5, tz, { collide: false });
    }
    const tbase = addBox(1.7, 1.3, 1.7, MAT.guard, tx, 0, tz);   // collider da base
    if (usedGLB) tbase.visible = false;
  }

  /* ---------------- muro-perímetro baixo (open-air) + placa de entrada ---------------- */
  const wX = HALF_X + 0.5, wZ = HALF_Z + 0.5;
  addBox(HALF_X * 2 + 2, WALL_H, 1, MAT.concrete, 0, 0, -wZ);
  addBox(HALF_X * 2 + 2, WALL_H, 1, MAT.concrete, 0, 0, wZ);
  addBox(1, WALL_H, HALF_Z * 2 + 2, MAT.concrete, -wX, 0, 0);
  addBox(1, WALL_H, HALF_Z * 2 + 2, MAT.concrete, wX, 0, 0);
  addPlane(9, 2.6, signTexture('#1b5e4a', '#eafbe8', 'PRAINHA DE RAMOS', 'LAGOA · BALNEÁRIO POPULAR'), 0, 2.4, HALF_Z - 0.06, 0);
  // RODAPÉ DE AZULEJO em todos os muros + PINTURA VARIADA por trecho (crítico R6:
  // "muro bege gigante, contraste baixo") — verde-queimado / branco sujo / azul desbotado
  {
    const iN = -(wZ - 0.52), iS = wZ - 0.52, iW = -(wX - 0.52), iE = wX - 0.52;   // faces internas
    // LAGOA: rodapé de azulejo SAI dos muros do perímetro (fica só nas estruturas
    // construídas — vestiário/quiosques). Na praia, o muro termina em faixa de areia.
    const sandBase = lam({ map: beachSandTex(24, 1) });
    addPlane(HALF_X * 2, 0.8, sandBase, 0, 0.4, iS, Math.PI);
    addPlane(HALF_X * 2, 0.8, sandBase, 0, 0.4, iN, 0);
    addPlane(HALF_Z * 2, 0.8, sandBase, iE, 0.4, 0, -Math.PI / 2);
    addPlane(HALF_Z * 2, 0.8, sandBase, iW, 0.4, 0, Math.PI / 2);
    // PLATIBANDA (capa de topo terracota) + PILASTRAS nas emendas das seções de pintura
    const capMat = lam({ map: stripeTex('#a85130', 61) });
    addPlane(HALF_X * 2, 0.4, capMat, 0, 3.18, iS, Math.PI);
    addPlane(HALF_X * 2, 0.4, capMat, 0, 3.18, iN, 0);
    addPlane(HALF_Z * 2, 0.4, capMat, iE, 3.18, 0, -Math.PI / 2);
    addPlane(HALF_Z * 2, 0.4, capMat, iW, 3.18, 0, Math.PI / 2);
    const pilMat = lam({ map: concreteTex(1, 2), color: 0xa39d8e });
    for (const px of [-14.4, -4.8, 4.8, 14.4]) {   // pilastras N/S nas emendas
      for (const pz of [iS - 0.13, iN + 0.13]) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, WALL_H, 0.22), pilMat);
        p.position.set(px, WALL_H / 2, pz); p.castShadow = p.receiveShadow = true; root.add(p);
      }
    }
    for (const pz2 of [-14.4, -4.8, 4.8, 14.4, -24, 24]) {   // pilastras E/W
      for (const px2 of [iE - 0.13, iW + 0.13]) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, WALL_H, 0.5), pilMat);
        p.position.set(px2, WALL_H / 2, pz2); p.castShadow = p.receiveShadow = true; root.add(p);
      }
    }
    const paints = { G: '#6a8a5c', W: '#d5d0c2', B: '#7ba3c4' };   // verde / branco / azul
    let pseed = 41;
    const paint = (key, x, z, ry) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 2.0), lam({ map: paintWallTex(paints[key], pseed += 7) }));
      m.position.set(x, 2.28, z); m.rotation.y = ry; m.receiveShadow = true; root.add(m);
    };
    const S5 = [-19.2, -9.6, 0, 9.6, 19.2], E7 = [-28.8, -19.2, -9.6, 0, 9.6, 19.2, 28.8];
    ['G', 'B', 'W', 'G', 'B'].forEach((k, i) => paint(k, S5[i], iS - 0.02, Math.PI));
    ['W', 'G', 'B', 'W', 'G'].forEach((k, i) => paint(k, S5[i], iN + 0.02, 0));
    ['B', 'W', 'G', 'W', 'B', 'G', 'W'].forEach((k, i) => paint(k, iE - 0.02, E7[i], -Math.PI / 2));
    ['G', 'W', 'B', 'W', 'G', 'W', 'B'].forEach((k, i) => paint(k, iW + 0.02, E7[i], Math.PI / 2));
  }
  // grafites/murais em escala arquitetônica por cima da pintura
  if (T.graffiti && T.graffiti.length) {
    const gspot = [[-wX + 0.56, -16, Math.PI / 2, 0], [-wX + 0.56, 6, Math.PI / 2, 1], [-wX + 0.56, 24, Math.PI / 2, 2],
      [wX - 0.56, -22, -Math.PI / 2, 2], [wX - 0.56, -2, -Math.PI / 2, 0], [wX - 0.56, 18, -Math.PI / 2, 1]];
    for (const [x, z, ry, gi] of gspot)
      addPlane(6.4, 2.8, lam({ map: T.graffiti[gi % T.graffiti.length] }), x, 1.55, z, ry);
  }
  // SILHUETAS NO HORIZONTE (crítico R6: "horizonte morto acima do muro") — cards ALTOS
  // (5-8m aparentes sobre o muro) + postes com FIOS cruzando o topo (o truque mais BR).
  {
    const sil = (kind, tint, x, z, ry, w = 15, h = 7, seed = 5, fog = true) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: silTex(kind, tint, seed), transparent: true, alphaTest: 0.05, fog }));
      m.position.set(x, h / 2 - 0.2, z); m.rotation.y = ry; root.add(m);
    };
    const GT = '#5c6656';   // verde-árvore
    // FAVELA em 2 fileiras: a de trás mais esfumaçada (haze .55) e mais alta, a da frente
    // quase saturada. A diferença de tinta é o que dá PROFUNDIDADE — o baseline tinha
    // uma parede de cards no mesmo cinza e lia como caixa.
    const fav = (x, z, ry, w, h, seed, haze) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: favelaTex(seed, haze), transparent: true, alphaTest: 0.05, fog: true }));
      m.position.set(x, h / 2 - 0.4, z); m.rotation.y = ry; root.add(m);
    };
    if (FAVELA) {
      // N e S: morro atrás (fileira longe) + lajes coladas no muro (fileira perto)
      fav(-6, -(wZ + 15), 0, 62, 22, 11, 0.55); fav(14, -(wZ + 17), 0, 50, 26, 12, 0.62);
      fav(-14, -(wZ + 6), 0, 34, 13, 23, 0.16); fav(10, -(wZ + 6.5), 0, 32, 15, 24, 0.2);
      fav(4, wZ + 15, Math.PI, 62, 22, 33, 0.55); fav(-16, wZ + 17, Math.PI, 50, 25, 34, 0.62);
      fav(-14, wZ + 6, Math.PI, 34, 14, 45, 0.18); fav(12, wZ + 6.5, Math.PI, 32, 13, 46, 0.2);
      sil('trees', GT, 20, -(wZ + 8), 0, 18, 11, 22); sil('trees', GT, 20, wZ + 8, Math.PI, 18, 11, 44);
      // E e W
      fav(wX + 6, 14, -Math.PI / 2, 40, 15, 66, 0.24); fav(wX + 14, -16, -Math.PI / 2, 54, 22, 67, 0.58);
      fav(-(wX + 6), 2, Math.PI / 2, 40, 15, 77, 0.24); fav(-(wX + 14), -22, Math.PI / 2, 54, 22, 78, 0.58);
      sil('trees', GT, wX + 7, -14, -Math.PI / 2, 17, 10, 55); sil('trees', GT, -(wX + 7), -20, Math.PI / 2, 17, 10, 88);
    }
    sil('bridge', '#4a4c46', 9, wZ + 11, Math.PI, 40, 18, 99, false);   // PONTE ao fundo (tabuleiro alto, sem fog)
    sil('bridge', '#43453f', -9, wZ + 12, Math.PI, 36, 19, 77, false);  // 2ª ponte: lê dos DOIS spawns
    // postes com fios cruzando o topo do muro N e S
    const postMat = lam({ color: 0x4a3b2c, roughness: 0.9 });
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x22201e });
    const wire = (a, b, sag = 1.2) => {
      const mid = a.clone().lerp(b, 0.5); mid.y -= sag;
      root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 18, 0.02, 4), wireMat));
    };
    for (const sz of [-1, 1]) {
      const tops = [];
      for (const px of [-16, 0, 16]) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 7.6, 7), postMat);
        p.position.set(px, 3.8, sz * (wZ + 4.2)); root.add(p);
        const cross = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.06), postMat);
        cross.position.set(px, 6.9, sz * (wZ + 4.2)); root.add(cross);
        tops.push(new THREE.Vector3(px, 7.4, sz * (wZ + 4.2)));
      }
      wire(tops[0], tops[1]); wire(tops[1], tops[2]); wire(tops[0], tops[2], 2.2);   // 2 vãos + diagonal longa
      // FIAÇÃO EMARANHADA de verdade: 3 fios extras por vão, com barriga e altura
      // diferentes. Um fio só lê como "cabo de tirolesa"; o feixe é que lê como Rio.
      if (!LOWQ) for (let k = 0; k < 3; k++) {
        const o = (k - 1) * 0.35;
        wire(tops[0].clone().setY(7.4 - 0.5 - k * 0.35).setX(-16 + o), tops[1].clone().setY(7.4 - 0.4 - k * 0.3), 1.4 + k * 0.6);
        wire(tops[1].clone().setY(7.4 - 0.4 - k * 0.3), tops[2].clone().setY(7.4 - 0.5 - k * 0.35).setX(16 + o), 1.4 + k * 0.6);
      }
    }
  }
  /* ---- LAJES 3D atrás do muro (o fundo obrigatório do gabarito) ------------------
     Cards dão silhueta mas não dão PARALAXE — de dentro do mapa o horizonte continua
     chapado. Estas caixas ficam fora do jogável (sem collider, sem waypoint) e sobem
     6-12m: laje inacabada + ferragem de espera + caixa d'água azul/preta. Ferragem e
     caixas vão em InstancedMesh: 3 draw calls no total, não ~120. ?favela=0 desliga. */
  if (FAVELA) {
    const lajeMats = ['#9c6a4c', '#b8ac95', '#8f9a96', '#c0a888'].map((hex, i) => {
      const t = paintWallTex(hex, 3 + i * 6); t.repeat.set(2.2, 2.2);   // caixa é grande: sem repeat a textura estica
      return lam({ map: t });
    });
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    let fseed2 = 101; const fr = () => (fseed2 = (fseed2 * 16807) % 2147483647) / 2147483647;
    const rebarPos = [], tankPos = [];
    for (let i = 0; i < NFAV; i++) {
      const side = i % 4;
      const w = 5 + fr() * 7, d = 4 + fr() * 5, h = 6 + fr() * 7;
      // distribui em anel logo atrás do muro; o jitter evita fileira de dentes
      let x, z;
      if (side === 0) { x = -34 + fr() * 68; z = -(wZ + 9 + fr() * 16); }
      else if (side === 1) { x = -34 + fr() * 68; z = wZ + 9 + fr() * 16; }
      else if (side === 2) { x = wX + 8 + fr() * 15; z = -40 + fr() * 80; }
      else { x = -(wX + 8 + fr() * 15); z = -40 + fr() * 80; }
      const m = new THREE.Mesh(boxGeo, lajeMats[(fr() * lajeMats.length) | 0]);
      m.scale.set(w, h, d); m.position.set(x, h / 2, z);
      m.castShadow = false; m.receiveShadow = false;   // fora do jogável: não paga sombra
      root.add(m);
      // ferragem de espera espetada na laje
      for (let k = 0; k < 3 + (fr() * 4 | 0); k++)
        rebarPos.push([x + (fr() - 0.5) * w * 0.9, h, z + (fr() - 0.5) * d * 0.9, 0.5 + fr() * 1.1]);
      // caixa d'água (azul ou preta) sobre a laje
      if (fr() > 0.25) tankPos.push([x + (fr() - 0.5) * w * 0.5, h + 0.62, z + (fr() - 0.5) * d * 0.5, fr() > 0.42]);
    }
    const rebarGeo = new THREE.CylinderGeometry(0.035, 0.035, 1, 4);
    const rebar = new THREE.InstancedMesh(rebarGeo, lam({ color: 0x8a6a4a, roughness: 0.95 }), rebarPos.length);
    const dummy = new THREE.Object3D();
    rebarPos.forEach(([px, py, pz, len], i) => {
      dummy.position.set(px, py + len / 2, pz); dummy.scale.set(1, len, 1);
      dummy.rotation.set((fr() - 0.5) * 0.35, fr() * 6.3, (fr() - 0.5) * 0.35);
      dummy.updateMatrix(); rebar.setMatrixAt(i, dummy.matrix);
    });
    rebar.instanceMatrix.needsUpdate = true; root.add(rebar);
    if (tankPos.length) {   // InstancedMesh com count 0 é caso degenerado no three — evita
      const tankGeo = new THREE.CylinderGeometry(0.62, 0.62, 1.15, 8);
      const tanks = new THREE.InstancedMesh(tankGeo, lam({ color: 0xffffff, roughness: 0.75 }), tankPos.length);
      const cAzul = new THREE.Color(0x2a5798), cPreta = new THREE.Color(0x232326);
      tankPos.forEach(([px, py, pz, blue], i) => {
        dummy.position.set(px, py, pz); dummy.scale.set(1, 1, 1); dummy.rotation.set(0, fr() * 6.3, 0);
        dummy.updateMatrix(); tanks.setMatrixAt(i, dummy.matrix);
        tanks.setColorAt(i, blue ? cAzul : cPreta);   // azul de polietileno / preta de fibrocimento
      });
      tanks.instanceMatrix.needsUpdate = true; if (tanks.instanceColor) tanks.instanceColor.needsUpdate = true;
      root.add(tanks);
    }
  }
  // MURAIS no muro leste. O crítico acertou: o "PRAINHA" era um DECALQUE PLANO. Agora o
  // painel é uma placa FÍSICA — chapa de 6cm, moldura de cantoneira e mãos-francesas —
  // então pega sombra própria e projeta sombra no muro. É o que separa placa de adesivo.
  const placaMural = (tex, x, z, ry, w = 9.2, h = 2.7, y = 1.72) => {
    const dir = new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry));   // normal da placa
    const panel = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), lam({ map: tex }));
    panel.position.set(x, y, z); panel.rotation.y = ry;
    panel.castShadow = panel.receiveShadow = true; root.add(panel);
    const frame = lam({ color: 0x6d6a60, roughness: 0.6, metalness: 0.35 });   // cantoneira galvanizada
    for (const [fw, fh, oy, ox] of [[w + 0.16, 0.12, h / 2, 0], [w + 0.16, 0.12, -h / 2, 0], [0.12, h + 0.16, 0, w / 2], [0.12, h + 0.16, 0, -w / 2]]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, 0.1), frame);
      b.position.set(x + Math.cos(ry) * ox, y + oy, z - Math.sin(ry) * ox);
      b.rotation.y = ry; b.castShadow = true; root.add(b);
    }
    for (const ox of [-w * 0.3, w * 0.3]) {   // mãos-francesas afastando a placa do muro
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.34), frame);
      s.position.set(x + Math.cos(ry) * ox - dir.x * 0.18, y - h / 2 + 0.2, z - Math.sin(ry) * ox - dir.z * 0.18);
      s.rotation.y = ry; root.add(s);
    }
  };
  placaMural(muralTex('PRAINHA', 'DOMINGO É DIA DE LAGOA', 5), wX - 0.62, 9.6, -Math.PI / 2);
  placaMural(muralTex('RAMOS', 'A LAGOA DA GALERA · DESDE 1987', 12), wX - 0.62, -28.8, -Math.PI / 2);
  // MONÓLITOS N/S no fundo de cada spawn (centro da sightline principal — crítico R6):
  // letreiro pintado + janelas falsas + caixa d'água na borda superior
  {
    addPlane(11, 1.6, lam({ map: muralTex('LAGOA', 'PRAINHA DE RAMOS · ÁGUA NATURAL', 21) }), -6, 2.62, -35.94, 0);
    addPlane(11, 1.6, lam({ map: muralTex('RAMOS', 'A MELHOR PRAINHA DO SUBURBIO', 28) }), 8, 2.62, 35.94, Math.PI);
    // janelas falsas (vão escuro c/ ombreira e peitoril) nas duas lajes
    const winC = document.createElement('canvas'); winC.width = 64; winC.height = 80;
    const wx = winC.getContext('2d');
    wx.fillStyle = '#c8c2b2'; wx.fillRect(0, 0, 64, 80);                     // ombreira
    const wg = wx.createLinearGradient(0, 6, 0, 70);
    wg.addColorStop(0, '#2a3140'); wg.addColorStop(1, '#171c26');
    wx.fillStyle = wg; wx.fillRect(6, 6, 52, 64);                            // vão escuro
    wx.fillStyle = 'rgba(200,220,235,0.25)'; wx.fillRect(10, 10, 18, 26);    // reflexo no vidro
    wx.fillStyle = '#c8c2b2'; wx.fillRect(29, 6, 5, 64);                     // mullion
    wx.fillStyle = '#a39d8e'; wx.fillRect(0, 70, 64, 10);                    // peitoril
    const winT = new THREE.CanvasTexture(winC); winT.colorSpace = THREE.SRGBColorSpace;
    const winM = lam({ map: winT });
    for (const wxp of [-20, -13, 6, 13, 20]) {
      const w1 = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.25), winM); w1.position.set(wxp, 2.05, -35.945); root.add(w1);
      const w2 = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.25), winM); w2.position.set(wxp, 2.05, 35.945); w2.rotation.y = Math.PI; root.add(w2);
    }
    // caixas d'água na borda superior das lajes N/S (quebra a linha reta do topo)
    for (const [tx, tz] of [[-13, -36], [11, -36], [-9, 36], [15, 36]]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.0, 10), lam({ map: azulejoBandTex(6), roughness: 0.8 }));
      t.position.set(tx, 3.4 + 0.5, tz); t.castShadow = true; root.add(t);
      const lid = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.3, 10), MAT.concrete);
      lid.position.set(tx, 3.4 + 1.0 + 0.15, tz); root.add(lid);
    }
  }

  /* ---------------- kiosk helper (usado nos corredores) ---------------- */
  function kioskAt(x, z) {
    const counter = addBox(3.2, 1.2, 1.6, MAT.kiosk, x, 0, z);   // collider sempre
    // BANDEIRA DO QUIOSQUE (cerveja/refri) — marco vertical colorido de 4m que dá
    // affordance de "aqui tem quiosque" de longe. Fica fora do if do GLB de propósito.
    {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.2, 6), MAT.steel);
      mast.position.set(x + 1.9, 2.1, z - 0.9); mast.castShadow = true; root.add(mast);
      const fc = document.createElement('canvas'); fc.width = 96; fc.height = 64;
      const fx2 = fc.getContext('2d');
      const bandas = [['#e2231a', '#ffd400'], ['#0b6b3a', '#f2f2f2'], ['#1b5f9e', '#ffd400']];
      const bb = bandas[(Math.abs(x * 7 + z * 3) | 0) % bandas.length];
      fx2.fillStyle = bb[0]; fx2.fillRect(0, 0, 96, 64);
      fx2.fillStyle = bb[1]; fx2.fillRect(0, 26, 96, 12);
      fx2.fillStyle = 'rgba(0,0,0,0.18)'; for (let i = 0; i < 6; i++) fx2.fillRect(i * 16, 0, 4, 64);   // vinco do pano
      const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace;
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9),
        new THREE.MeshBasicMaterial({ map: ft, side: THREE.DoubleSide }));
      flag.position.set(x + 2.6, 3.7, z - 0.9); flag.rotation.y = 0.25; root.add(flag);
    }
    if (gprop('quiosque', x, z, 3.0)) { counter.visible = false; return; }   // GLB Mint por cima
    addBox(3.6, 0.26, 2.1, MAT.thatch, x, 2.4, z, { collide: false });
    for (const sx of [-1.6, 1.6]) for (const sz of [-0.95, 0.95]) addBox(0.14, 2.4, 0.14, MAT.steel, x + sx, 0, z + sz, { collide: false });
  }

  // OPEN-AIR: céu aberto. background/luz definidos abaixo.
  scene.background = T.sky || new THREE.Color(0x9fd4ee);
  // HAZE QUENTE da Guanabara: não é névoa azul-fria de montanha, é ar de 38°C com poeira e
  // sal em suspensão — cor puxada pro creme/bege. Near em 34m (e não 28) de propósito: a
  // lane spawn↔spawn tem 72m e velar demais o alvo é bug de jogabilidade, não fidelidade —
  // a profundidade do fundo já vem do haze PINTADO nas texturas de favela. ?nofog=1 desliga.
  if (QP.get('nofog') !== '1') scene.fog = new THREE.Fog(0xe0d7c2, 34, 175);
  // disco solar + nuvens (sprites) — "dia de sol de bairro", não box bege (crítico R6)
  {
    const sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.sunSprite, transparent: true, fog: false, depthWrite: false }));
    sunSpr.position.set(26, 148, -17); sunSpr.scale.setScalar(60); root.add(sunSpr);   // realinhado c/ o sol a pino (14,76,-9)
    if (T.cloud) for (const [cx, cy, cz, cs] of [[-60, 62, -80, 46], [40, 70, -90, 56], [90, 58, 50, 42], [-85, 66, 70, 50], [10, 74, 95, 44], [-20, 80, -60, 62], [70, 76, -40, 58], [-95, 72, -10, 54], [30, 64, 80, 48]]) {
      const cl = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.cloud, transparent: true, fog: false, depthWrite: false, opacity: 0.9 }));
      cl.position.set(cx, cy, cz); cl.scale.set(cs, cs * 0.42, 1); root.add(cl);
    }
  }
  // SOL ALTO DE VERÃO CARIOCA (meio-dia, não fim de tarde): o ângulo é o que manda na
  // leitura — sombra CURTA e DURA colada no pé do objeto. Antes o sol estava a ~65° da
  // vertical e as sombras compridas liam como "fim de tarde de clube".
  const hemi = new THREE.HemisphereLight(0xeaf6ff, 0xdcc39a, 0.52);   // menos ambiente = sombra mais dura; bounce quente da areia
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2da, 2.6);   // sol a pino, quase branco-quente
  sun.position.set(14, 76, -9); sun.castShadow = true;
  sun.shadow.mapSize.set(LOWQ ? 1024 : 2048, LOWQ ? 1024 : 2048);   // GPU fraca: metade do shadow map
  sun.shadow.camera.left = -42; sun.shadow.camera.right = 42;
  sun.shadow.camera.top = 42; sun.shadow.camera.bottom = -42;
  sun.shadow.camera.far = 170; sun.shadow.bias = -0.0004;
  scene.add(sun);
  // fill FRACO e quente: sombra de meio-dia no Rio não é azul de estúdio, é preenchida
  // pelo bounce da areia clara. Fill forte demais achata a cena (crítico: "luz chapada").
  const fill = new THREE.DirectionalLight(0xffe7c4, 0.22);
  fill.position.set(-18, 40, 18); scene.add(fill);

  /* ---------------- ground height ---------------- */
  function groundHeightAt(x, z) { return poolDepth(x, z); }

  /* ---------------- waypoints (deck/areia — fora da lagoa) ---------------- */
  const nodes = [], adj = [];
  const STEP = 3.4;
  const blocked = (x, z, inflate) => {
    const g = groundHeightAt(x, z);
    for (const c of colliders) {
      if (x > c.minX - inflate && x < c.maxX + inflate && z > c.minZ - inflate && z < c.maxZ + inflate && c.minY < g + 1.6 && c.maxY > g + 0.15) return true;
    }
    return false;
  };
  for (let gx = -HALF_X + 2; gx <= HALF_X - 2; gx += STEP)
    for (let gz = -HALF_Z + 2; gz <= HALF_Z - 2; gz += STEP)
      if (!blocked(gx, gz, 0.5) && groundHeightAt(gx, gz) > -0.35) nodes.push({ x: gx, z: gz });
  const segClear = (a, b) => {
    for (let i = 1; i < 6; i++) {
      const t = i / 6, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
      if (blocked(x, z, 0.25)) return false;
      if (Math.abs(groundHeightAt(x, z) - groundHeightAt(a.x, a.z)) > 0.65) return false;
    }
    return true;
  };
  for (let i = 0; i < nodes.length; i++) {
    adj.push([]);
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const dx = nodes[i].x - nodes[j].x, dz = nodes[i].z - nodes[j].z, d2 = dx * dx + dz * dz;
      if (d2 < STEP * STEP * 2.4 && segClear(nodes[i], nodes[j])) adj[i].push(j);
    }
  }
  function nearestWaypoint(x, z) { let best = 0, bd = 1e9; for (let i = 0; i < nodes.length; i++) { const dx = nodes[i].x - x, dz = nodes[i].z - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = i; } } return best; }
  // A* euclidiano (mesmo do map_brasilia — caminhos retos, sem funil).
  const _D = (a, b) => { const dx = nodes[a].x - nodes[b].x, dz = nodes[a].z - nodes[b].z; return Math.sqrt(dx * dx + dz * dz); };
  function findPath(fromIdx, toIdx) {
    if (fromIdx === toIdx) return [toIdx];
    const n = nodes.length;
    const g = new Float32Array(n).fill(Infinity), f = new Float32Array(n).fill(Infinity);
    const prev = new Int32Array(n).fill(-1), open = new Uint8Array(n);
    g[fromIdx] = 0; f[fromIdx] = _D(fromIdx, toIdx); open[fromIdx] = 1; let openCount = 1;
    while (openCount > 0) {
      let cur = -1, bf = Infinity;
      for (let i = 0; i < n; i++) if (open[i] && f[i] < bf) { bf = f[i]; cur = i; }
      if (cur === -1) break;
      if (cur === toIdx) { const path = [cur]; let c = prev[cur]; while (c !== -1) { path.unshift(c); c = prev[c]; } return path; }
      open[cur] = 0; openCount--;
      for (const m of adj[cur]) { const t = g[cur] + _D(cur, m); if (t < g[m]) { prev[m] = cur; g[m] = t; f[m] = t + _D(m, toIdx); if (!open[m]) { open[m] = 1; openCount++; } } }
    }
    return [fromIdx];
  }

  // spawns nos dois extremos, dentro do corredor de cover (x alinhado com as jardineiras).
  // forward = (-sin yaw, -cos yaw): P (sul, z-) olha +z → yaw π; B (norte) olha -z → yaw 0.
  const mk = s => [-5, -2, 1, 4].map(x => ({ x, z: (HALF_Z - 4) * s, yaw: s < 0 ? Math.PI : 0 }));
  const spawns = { P: mk(-1), B: mk(1) };

  /* ---------------- arsenal no deck (fileiras) ---------------- */
  const GM = { black: lam({ color: 0x1b1d21 }), steel: lam({ color: 0x9aa0a6 }), wood: lam({ color: 0x7a5326 }), tan: lam({ color: 0xb39a63 }), green: lam({ color: 0x16432a }) };
  const gbox = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; };
  const gcyl = (r, len, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); return m; };
  function buildGun(kind, x, z, yaw) {
    const g = new THREE.Group(); const add = (...ms) => ms.forEach(m => g.add(m));
    switch (kind) {
      case 'awp': add(gbox(0.11, 0.1, 1.35, GM.green, 0, 0.09, 0.05), gbox(0.11, 0.16, 0.36, GM.green, 0, 0.1, 0.6), gcyl(0.05, 0.36, GM.black, 0, 0.19, 0.05), gbox(0.08, 0.18, 0.16, GM.black, 0, 0.03, -0.15)); break;
      case 'ak': add(gbox(0.1, 0.1, 1.05, GM.black, 0, 0.09, 0), gbox(0.11, 0.13, 0.34, GM.wood, 0, 0.1, 0.46), gbox(0.11, 0.12, 0.24, GM.wood, 0, 0.1, -0.12), gbox(0.09, 0.24, 0.14, GM.black, 0, -0.02, -0.02)); break;
      case 'm4': add(gbox(0.09, 0.1, 1.0, GM.black, 0, 0.09, 0), gbox(0.1, 0.14, 0.32, GM.black, 0, 0.1, 0.45), gbox(0.08, 0.06, 0.3, GM.black, 0, 0.17, 0.02), gbox(0.08, 0.2, 0.13, GM.black, 0, 0, -0.05)); break;
      case 'mp5': add(gbox(0.09, 0.11, 0.62, GM.black, 0, 0.09, 0), gbox(0.09, 0.1, 0.22, GM.black, 0, 0.09, 0.36), gbox(0.07, 0.22, 0.1, GM.black, 0, 0, -0.02)); break;
      case 'shotgun': add(gbox(0.1, 0.11, 1.0, GM.black, 0, 0.11, 0), gbox(0.1, 0.09, 0.9, GM.wood, 0, 0.02, 0.02), gbox(0.11, 0.15, 0.34, GM.wood, 0, 0.1, 0.5)); break;
      case 'deagle': add(gbox(0.09, 0.13, 0.4, GM.steel, 0, 0.1, 0), gbox(0.09, 0.2, 0.11, GM.tan, 0, 0.02, 0.15)); break;
      default: add(gbox(0.08, 0.12, 0.3, GM.black, 0, 0.09, 0), gbox(0.08, 0.16, 0.1, GM.black, 0, 0.03, 0.11));
    }
    g.position.set(x, 0.02, z); g.rotation.y = yaw; g.traverse(o => { if (o.isMesh) o.castShadow = true; }); root.add(g); return g;
  }
  const RIFLES = ['awp', 'ak', 'm4', 'shotgun', 'mp5'];
  const place = (kind, x, z, yaw) => { const mesh = buildGun(kind, x, z, yaw); pickups.push({ x, z, kind, weapon: kind, readyAt: 0, mesh }); };
  let ri = 0;
  // fileiras nos decks laterais (fora da seção da quadra, perto da lagoa)
  for (const sx of [-1, 1]) { const x = sx * (OUTX + 1.2); for (const z of [-10, -5, 0, 5, 10]) place(RIFLES[ri++ % RIFLES.length], x, z, sx > 0 ? Math.PI / 2 : -Math.PI / 2); }
  // pistolas perto dos spawns
  for (const s of [-1, 1]) { const z = (HALF_Z - 7) * s; ['deagle', 'pistol', 'pistol', 'deagle'].forEach((k, i) => place(k, [-6, -2, 2, 6][i], z, s > 0 ? Math.PI : 0)); }
  place('awp', -3, nZ + 3, 0); place('ak', 3, nZ + 3, 0); place('m4', -3, sZ - 3, Math.PI); place('shotgun', 3, sZ - 3, Math.PI);

  return {
    root, colliders, occluders, groundHeightAt, slowAt, spawns, sun, hemi, pickups,
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    bounds: { minX: -HALF_X + 0.5, maxX: HALF_X - 0.5, minZ: -HALF_Z + 0.5, maxZ: HALF_Z - 0.5 },
  };
}
