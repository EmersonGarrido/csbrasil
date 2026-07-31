// Ferro Velho do Zé (fy_ferrovelho) — CTF 4 bandeiras, v2 LABIRINTO. P spawna no PORTÃO (sul),
// B no GALPÃO (norte). O pátio é um labirinto de MUROS DE CARROS EMPILHADOS (wall_of_cars) e
// fileiras de carros prensados (crushed_classic) — scans reais texturizados, corredores ≥5m.
// 4 bandeiras: portão, beco oeste, pátio leste, galpão. Contrato buildWorld + A*.
// Props otimizados de /Users/ruben/glb (tools/optimize-static.mjs).
import * as THREE from 'three';
import { placeProp } from './mapprops.js';

const HALF_X = 32, HALF_Z = 36;
export const FERRO_PROPS = [
  // pilhas/máquinas Mint estilizadas (substituem os photoscans que destoavam + pesavam)
  'muro_carros', 'fileira_carros', 'monte_carros', 'guindaste', 'prensa_carros', 'pilha_pneus',
  // wrecks unitários (scans escuros — leem bem no tema)
  'abandoned_car', 'broken_car', 'broken_car_2', 'carro_danificado', 'destroyed_car', 'junk_car',
  // miúdos
  'dumpster', 'jersey_barrier', 'sandbags', 'concrete_roadblock',
];
const SINGLES = ['abandoned_car', 'broken_car', 'carro_danificado', 'junk_car'];   // destroyed_car/broken_car_2 = scans pretos brilhantes ("blob" do crítico) — fora

// ----- texturas canvas ricas (sem low-poly flat: manchas, rachaduras, óleo, pedras) -----
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
  if (opts.cracks) {   // rachaduras: polilinhas escuras finas
    x.strokeStyle = opts.cracks; x.globalAlpha = 0.35; x.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      let px = rnd() * S, py = rnd() * S; x.beginPath(); x.moveTo(px, py);
      for (let j = 0; j < 5; j++) { px += (rnd() - 0.5) * 46; py += (rnd() - 0.5) * 46; x.lineTo(px, py); }
      x.stroke();
    }
  }
  if (opts.pebbles) {  // pedrinhas/pontos claros
    for (let i = 0; i < (opts.pebbleN || 240); i++) { x.globalAlpha = 0.25 + rnd() * 0.3; x.fillStyle = rnd() > 0.5 ? opts.pebbles : base; x.fillRect(rnd() * S, rnd() * S, 1.6, 1.6); }
  }
  x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, rz); return t;
}
function signTex(bg, fg, title) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 1024, 160); x.fillStyle = fg; x.textAlign = 'center';
  x.font = 'bold 84px "Arial Black",Impact,sans-serif'; x.fillText(title, 512, 110);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// metal enferrujado (portão, sucata, balcão) — manchas de óxido + riscos + resto de tinta
function rustTex(rx, rz, seed = 61) {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  x.fillStyle = '#7a5438'; x.fillRect(0, 0, S, S);
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const [col, n, rMin, rMax, a] of [['#5c3a22', 46, 8, 30, 0.5], ['#96502a', 40, 6, 22, 0.45], ['#b06a34', 26, 4, 14, 0.4], ['#3f2c1c', 18, 5, 18, 0.4], ['#8a9096', 8, 3, 10, 0.3]]) {
    x.fillStyle = col;
    for (let i = 0; i < n; i++) {
      x.globalAlpha = a * (0.5 + rnd() * 0.5);
      const r = rMin + rnd() * (rMax - rMin);
      x.beginPath(); x.ellipse(rnd() * S, rnd() * S, r, r * (0.4 + rnd() * 0.8), rnd() * Math.PI, 0, Math.PI * 2); x.fill();
    }
  }
  x.globalAlpha = 0.3; x.strokeStyle = '#33241a'; x.lineWidth = 1;   // riscos
  for (let i = 0; i < 22; i++) { const px = rnd() * S, py = rnd() * S; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 60, py + (rnd() - 0.5) * 24); x.stroke(); }
  x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, rz); return t;
}
// telhado de zinco corrugado (galpão)
function zincTex(rx, rz) {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  let seed = 71; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 16; i++) {   // ondas do zinco
    const g = x.createLinearGradient(i * 8, 0, i * 8 + 8, 0);
    g.addColorStop(0, '#6a5848'); g.addColorStop(0.5, '#8a7460'); g.addColorStop(1, '#5c4c3e');
    x.fillStyle = g; x.fillRect(i * 8, 0, 8, S);
  }
  for (let i = 0; i < 26; i++) {   // ferrugem escorrida
    x.fillStyle = `rgba(150,80,40,${0.15 + rnd() * 0.3})`;
    const px = rnd() * S; x.fillRect(px, rnd() * S * 0.5, 2 + rnd() * 4, 20 + rnd() * 60);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, rz); return t;
}
// barril (azul desbotado c/ faixa + ferrugem no fundo)
function barrelTex() {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  let seed = 83; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  x.fillStyle = '#3a5a8c'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(${30 + rnd() * 60 | 0},${50 + rnd() * 40 | 0},${100 + rnd() * 40 | 0},${0.2 + rnd() * 0.3})`; x.fillRect(rnd() * S, rnd() * S, 3 + rnd() * 10, 2 + rnd() * 6); }
  x.fillStyle = 'rgba(230,225,210,0.75)'; x.fillRect(0, 26, S, 10);   // faixa
  const g = x.createLinearGradient(0, S * 0.6, 0, S);   // ferrugem subindo do fundo
  g.addColorStop(0, 'rgba(120,60,30,0)'); g.addColorStop(1, 'rgba(120,60,30,0.75)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// mato rasteiro (tufos entre os carros) — textura com alpha pra planos cruzados
function weedTex() {
  const S = 64, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  let seed = 89; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 26; i++) {
    const px = 8 + rnd() * (S - 16), h = 20 + rnd() * 38;
    x.strokeStyle = `rgba(${60 + rnd() * 50 | 0},${110 + rnd() * 60 | 0},${40 + rnd() * 30 | 0},0.95)`;
    x.lineWidth = 1.6 + rnd();
    x.beginPath(); x.moveTo(px, S); x.quadraticCurveTo(px + (rnd() - 0.5) * 14, S - h * 0.6, px + (rnd() - 0.5) * 20, S - h); x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// decal de mancha (óleo/poeira) — alpha radial irregular
function blobTex(r, g, b, aMax, seed = 101) {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 7; i++) {
    const px = S / 2 + (rnd() - 0.5) * 50, py = S / 2 + (rnd() - 0.5) * 50, rr = 18 + rnd() * 34;
    const gr = x.createRadialGradient(px, py, 2, px, py, rr);
    gr.addColorStop(0, `rgba(${r},${g},${b},${aMax})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr; x.beginPath(); x.arc(px, py, rr, 0, 7); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}

export function buildFerroVelho(scene, T) {
  const colliders = [], occluders = [], pickups = [];
  const root = new THREE.Group(); scene.add(root);
  const lam = (o) => new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, ...o });
  const MAT = {
    // terra batida: tiling FINO (crítico R6: "chão borrão de baixa frequência") — cascalho,
    // óxido e tonalidade em escala de ~1.4m por tile (antes ~3.2m = manchão)
    dirt: lam({ map: noiseTex('#6b5a44', [['#584a38', 60, 8, 26, 0.5], ['#7a6a52', 50, 6, 20, 0.4], ['#3a3230', 14, 5, 14, 0.45], ['#8a4a2a', 26, 2, 6, 0.4], ['#4a3f30', 34, 2, 7, 0.4]], 46, 52, { pebbles: '#8a7a62', pebbleN: 620, seed: 11 }) }),
    wall: lam({ map: noiseTex('#7d7468', [['#6a6258', 40, 10, 30, 0.5], ['#8d8478', 30, 8, 22, 0.4], ['#4a443c', 10, 6, 16, 0.4]], 6, 2, { cracks: '#55504a', seed: 23 }) }),
    rust: lam({ map: rustTex(2, 2), metalness: 0.3, roughness: 0.85 }),
    steel: lam({ map: noiseTex('#8a9096', [['#787e84', 30, 6, 20, 0.4], ['#9aa0a8', 20, 4, 14, 0.3], ['#6a5a48', 8, 3, 10, 0.3]], 2, 2, { seed: 137 }), metalness: 0.5, roughness: 0.6 }),
    office: lam({ map: noiseTex('#4a6e4f', [['#3d5c42', 30, 8, 24, 0.5], ['#5a8060', 20, 6, 18, 0.35]], 4, 2, { seed: 31 }) }),
    roof: lam({ map: zincTex(6, 4) }),
    tire: lam({ color: 0x22252a }),
    barrel: lam({ map: barrelTex(), metalness: 0.4, roughness: 0.7 }),
    // óleo BRILHA (crítico R6: "lê como buraco preto fosco") — specular do sol na poça
    oil: new THREE.MeshStandardMaterial({ color: 0x14161a, metalness: 0.75, roughness: 0.16, transparent: true, opacity: 0.82 }),
  };
  function addBox(w, h, d, mat, x, y, z, opts = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z); m.castShadow = opts.cast !== false; m.receiveShadow = true;
    if (opts.ry) m.rotation.y = opts.ry; root.add(m);
    if (opts.collide !== false) { colliders.push({ minX: x - w / 2, maxX: x + w / 2, minY: y, maxY: y + h, minZ: z - d / 2, maxZ: z + d / 2 }); occluders.push(m); }
    return m;
  }
  const addFloor = (w, d, x, z, mat, y = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; root.add(m); };
  const gprop = (id, x, z, h, ry = 0) => { const o = placeProp(id, { x, z, targetH: h, ry }); if (o) root.add(o); return !!o; };
  // Variação de painel (crítico gauntlet: "mesmo módulo repetido"): flip + tint por instância
  let _pv = 0;
  const vary = (o) => {
    const s = ++_pv * 2654435761 % 97 / 97;
    o.traverse((m) => {
      if (!m.isMesh || !m.material) return;
      m.material = m.material.clone();   // clone(true) compartilha material entre instâncias
      if (m.material.color) m.material.color.offsetHSL((s - 0.5) * 0.05, (s - 0.5) * 0.12, (s - 0.5) * 0.09);
      if (m.material.emissive) m.material.emissive.offsetHSL((s - 0.5) * 0.05, (s - 0.5) * 0.12, (s - 0.5) * 0.09);
    });
    return o;
  };
  const gpropV = (id, x, z, h, ry = 0) => { const flip = _pv % 2 ? Math.PI : 0; const o = placeProp(id, { x, z, targetH: h, ry: ry + flip }); if (o) { vary(o); root.add(o); } return !!o; };
  // collider AABB por footprint (props só entram em ry 0 ou π/2, então o AABB é exato)
  const collide = (x, z, hw, hd, h) => colliders.push({ minX: x - hw, maxX: x + hw, minY: 0, maxY: h, minZ: z - hd, maxZ: z + hd });

  // ===== chão de terra + poças de óleo =====
  addFloor(HALF_X * 2, HALF_Z * 2, 0, 0, MAT.dirt);
  for (const [x, z, r] of [[-8, 12, 2.4], [10, -6, 1.8], [-16, -14, 2.0], [6, 24, 1.5], [18, 12, 2.2], [-24, 26, 1.7]]) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(r, 20), MAT.oil);
    p.rotation.x = -Math.PI / 2; p.position.set(x, 0.02, z); root.add(p);
  }
  // trilhas de pneu na terra (crítico gauntlet: "chão sem vida") — pares de faixas escuras
  {
    const trackMat = new THREE.MeshBasicMaterial({ color: 0x2a241c, transparent: true, opacity: 0.35 });
    for (const [cx, cz, len, ry] of [[-4, 14, 30, 0.15], [6, 2, 32, -0.2], [-16, -12, 24, 0.35], [14, 22, 20, 0.1]]) {
      for (const off of [-0.5, 0.5]) {
        const t = new THREE.Mesh(new THREE.PlaneGeometry(0.35, len), trackMat);
        t.rotation.x = -Math.PI / 2; t.rotation.z = ry;
        t.position.set(cx + Math.cos(ry) * off, 0.015, cz + Math.sin(ry) * off);
        root.add(t);
      }
    }
  }

  // ===== perímetro: muro de concreto; PORTÃO (vão) no sul =====
  addBox(2 * HALF_X, 3.2, 1, MAT.wall, 0, 0, -HALF_Z);                 // fundo (norte)
  addBox(HALF_X - 5, 3.2, 1, MAT.wall, -(HALF_X / 2 + 2.5), 0, HALF_Z);  // sul esq (vão do portão x∈[-5,5])
  addBox(HALF_X - 5, 3.2, 1, MAT.wall, (HALF_X / 2 + 2.5), 0, HALF_Z);   // sul dir
  addBox(1, 3.2, 2 * HALF_Z, MAT.wall, -HALF_X, 0, 0);                 // oeste
  addBox(1, 3.2, 2 * HALF_Z, MAT.wall, HALF_X, 0, 0);                  // leste
  // portão de ferro aberto + letreiro virado pra rua
  addBox(0.25, 3.4, 4.6, MAT.rust, -5.2, 0, HALF_Z - 2.2, { ry: 0.9 });
  addBox(0.25, 3.4, 4.6, MAT.rust, 5.2, 0, HALF_Z - 2.2, { ry: -0.9 });
  { const s = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.2), new THREE.MeshBasicMaterial({ map: signTex('#3a3f45', '#f4c020', 'FERRO VELHO DO ZÉ') }));
    s.position.set(0, 4.4, HALF_Z + 0.1); root.add(s);
    addBox(0.3, 5.4, 0.3, MAT.rust, -7.2, 0, HALF_Z - 0.4); addBox(0.3, 5.4, 0.3, MAT.rust, 7.2, 0, HALF_Z - 0.4); }

  // ===== FUNDO DO PÁTIO (crítico gauntlet: "horizonte vazio"): silhueta de pilhas FORA do
  // muro, sem collider — o mundo não acaba atrás da parede =====
  {
    const ring = [
      ['muro_carros', -38, -20, 4.5, Math.PI / 2], ['monte_carros', -40, 2, 4.2, 0.3], ['muro_carros', -38, 24, 4.5, Math.PI / 2],
      ['monte_carros', -22, -42, 4.0, 0.8], ['muro_carros', 2, -41, 4.5, 0], ['monte_carros', 26, -42, 4.6, -0.5],
      ['muro_carros', 39, -14, 4.5, Math.PI / 2], ['monte_carros', 40, 10, 4.2, 1.2], ['muro_carros', 38, 30, 4.5, Math.PI / 2],
      ['monte_carros', -20, 42, 3.8, 2.0], ['muro_carros', 16, 42, 4.2, 0],
    ];
    for (const [id, x, z, h, ry] of ring) gpropV(id, x, z, h, ry);
  }

  // ===== GALPÃO/escritório do Zé (fundo norte — spawn B + bandeira) =====
  const G = { x0: -12, x1: 2, z0: -HALF_Z + 1, z1: -HALF_Z + 9 };   // footprint 14×8
  addBox(G.x1 - G.x0, 3.4, 0.5, MAT.office, (G.x0 + G.x1) / 2, 0, G.z1);          // frente fechada
  addBox(0.5, 3.4, G.z1 - G.z0, MAT.office, G.x0, 0, (G.z0 + G.z1) / 2);          // lateral oeste
  // lateral leste com vão de porta z∈[-31.25,-28.75]
  addBox(0.5, 3.4, 2.5, MAT.office, G.x1, 0, G.z0 + 1.25);
  addBox(0.5, 3.4, 2.5, MAT.office, G.x1, 0, G.z1 - 1.25);
  addBox(G.x1 - G.x0 + 1.5, 0.3, G.z1 - G.z0 + 1.5, MAT.roof, (G.x0 + G.x1) / 2, 3.4, (G.z0 + G.z1) / 2, { collide: false });  // telhado
  addBox(3.2, 1.0, 1.4, MAT.rust, -8, 0, -31.5, { collide: true });   // balcão/mesa dentro
  { const s = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.4), new THREE.MeshBasicMaterial({ map: signTex('#4a6e4f', '#e8e4d8', 'ESCRITÓRIO') }));
    s.position.set((G.x0 + G.x1) / 2, 3.9, G.z1 + 0.3); root.add(s); }
  gprop('dumpster', 6, -31, 1.4) || addBox(1.2, 1.4, 2, MAT.steel, 6, 0, -31); collide(6, -31, 0.7, 1.1, 1.4);

  // ===== LABIRINTO: muros de carros empilhados Mint (N-S altos) + fileiras prensadas (E-W baixas) =====
  // muro_carros h=3.0 → painel ~2.8w×1.3d; em fila forma a parede do labirinto (não dá pra ver por cima)
  const wallAtNS = (x, z) => {   // parede N-S: 5 painéis ao longo de z (14m)
    for (let i = -2; i <= 2; i++) gpropV('muro_carros', x, z + i * 2.8, 3.0, Math.PI / 2) || addBox(1.3, 3.0, 2.8, MAT.rust, x, 0, z + i * 2.8);
    collide(x, z, 0.7, 7.0, 3.0);
  };
  const wallAtEW = (x, z) => {   // parede E-W: 3 painéis ao longo de x (8.4m)
    for (let i = -1; i <= 1; i++) gpropV('muro_carros', x + i * 2.8, z, 3.0) || addBox(2.8, 3.0, 1.3, MAT.rust, x + i * 2.8, 0, z);
    collide(x, z, 4.2, 0.7, 3.0);
  };
  // fileira_carros h=1.2 → ~6.3×1.45 (cover baixo E-W, dá pra atirar por cima)
  const rowAt = (x, z) => { gpropV('fileira_carros', x, z, 1.2) || addBox(6.3, 1.2, 1.45, MAT.rust, x, 0, z); collide(x, z, 3.2, 0.8, 1.2); };
  wallAtNS(-11, -13);   // A — centro-oeste norte
  wallAtNS(11, 1);      // B — centro-leste
  wallAtNS(-11, 15);    // C — centro-oeste sul
  wallAtNS(21, -20);    // D — leste norte
  rowAt(-24, 6);        // E — oeste
  rowAt(10, -26);       // F — norte (leste do galpão)
  rowAt(24, 18);        // G — leste sul
  rowAt(-14, 30);       // H — sul (oeste do portão)
  // REFORÇO DE RESPAWN (G2-R6B): cover extra nos DOIS spawns — fileiras prensadas fecham
  // o "bolso" do portão (P) e a aproximação norte do galpão (B). h≤1.2: o LOS
  // spawn↔spawn (já 0) não muda; o A* contorna — corredores ≥4m preservados.
  // (os jerseys do reforço entram logo abaixo, onde jerseyAt já está definido)
  rowAt(8, 29);         // P: fileira prensada à direita do portão
  rowAt(-2, -19);       // B: fileira prensada na aproximação do galpão
  wallAtEW(-6, 8);      // I — muro E-W no miolo oeste (mata LOS spawn↔spawn)
  wallAtEW(0, -6);      // J — muro E-W no miolo centro (mata LOS spawn↔spawn)
  // montes de carros (cover médio nos cantos largos)
  const heapAt = (x, z, ry = 0) => { gprop('monte_carros', x, z, 2.2, ry) || addBox(2.8, 2.2, 2.8, MAT.rust, x, 0, z, { ry }); collide(x, z, 1.5, 1.5, 2.2); };
  heapAt(-22, -24, 0.4);
  heapAt(24, 32, -0.3);
  // máquinas do ferro velho: guindaste (marco leste) + prensa (canto SW)
  gprop('guindaste', 26, -6, 7) || addBox(5.7, 7, 5.5, MAT.steel, 26, 0, -6); collide(26, -6, 2.9, 2.8, 6.5);
  gprop('prensa_carros', -26, 32, 2.6) || addBox(2.3, 2.6, 1.1, MAT.rust, -26, 0, 32); collide(-26, 32, 1.2, 0.6, 2.6);

  // ===== carros unitários + cover baixo nos corredores =====
  let ci = 0;
  const carAt = (x, z, ry) => {
    const id = SINGLES[ci++ % SINGLES.length];
    if (!gprop(id, x, z, 1.45, ry)) addBox(2, 1.3, 4.2, MAT.rust, x, 0, z, { ry });
    collide(x, z, 1.2, 2.2, 1.3);
  };
  carAt(-24, 22, 0.3); carAt(2, 12, -2.9); carAt(18, -10, 1.7);
  carAt(-2, -18, 0.1); carAt(-26, -2, 2.2); carAt(8, 24, -0.6);
  // jersey barriers + sacos de areia + bloqueio de concreto
  const jerseyAt = (x, z, ry = 0) => { gprop('jersey_barrier', x, z, 1.1, ry) || addBox(0.8, 1.1, 2, MAT.wall, x, 0, z, { ry }); collide(x, z, 0.5, 1.1, 1.1); };
  jerseyAt(-6, 26); jerseyAt(14, 12); jerseyAt(-18, -8); jerseyAt(8, -20);
  jerseyAt(1, 26);            // G2-R6B: bloqueio central à frente do spawn P (portão)
  jerseyAt(-13, -21);         // G2-R6B: bloqueio no flanco oeste do spawn B (galpão)
  const sandAt = (x, z) => { gprop('sandbags', x, z, 0.6) || addBox(1.5, 0.6, 1.7, MAT.wall, x, 0, z); collide(x, z, 0.8, 0.9, 0.6); };
  sandAt(-20, 14); sandAt(12, 28); sandAt(26, -12);
  gprop('concrete_roadblock', 0, 20, 1.1, Math.PI / 2) || addBox(2.7, 1.1, 0.7, MAT.wall, 0, 0, 20); collide(0, 20, 0.5, 1.6, 1.1);

  // ===== pneus empilhados (pilha_pneus Mint) + barris =====
  const tireStack = (x, z) => { gprop('pilha_pneus', x, z, 1.2) || addBox(1.4, 1.1, 1.4, MAT.tire, x, 0, z); collide(x, z, 0.5, 0.5, 1.1); };
  tireStack(-18, 20); tireStack(16, 30); tireStack(-16, -33); tireStack(26, -30); tireStack(-28, 12);
  const barrel = (x, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.0, 10), MAT.barrel); m.position.set(x, 0.5, z); m.castShadow = m.receiveShadow = true; root.add(m); collide(x, z, 0.5, 0.5, 1.0); };
  barrel(-4, 4); barrel(20, 22); barrel(-28, -18); barrel(4, -32); barrel(28, 8);
  // REFORÇO DAS LANES CENTRAIS (G2-R14B, pedido do dono — "mesma coisa no ferro velho"):
  // sucatas escalonadas no corredor-miolo (x≈±6) quebram a lane aberta portão↔galpão.
  // Tudo ≤1.45m de altura (LOS spawn↔spawn, já 0, não muda) e vãos laterais ≥3m pro A*.
  carAt(-6, 24, 0.35);
  carAt(6, -12, -0.3);
  tireStack(3, 22);
  sandAt(-7, 0);

  /* ===== GROUND DETAIL PASS pesado (crítico gauntlet R2: "primeiro plano morto") =====
     ferro velho = óleo, sucata, poeira, mato. TUDO sem collider (LOS/A* intactos). */
  {
    let dseed = 113; const drnd = () => (dseed = (dseed * 16807) % 2147483647) / 2147483647;
    const decal = (tex, w, d, x, z, ry = 0, y = 0.018, opacity = 1, rough = 0.95, metal = 0) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d),
        new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity, roughness: rough, metalness: metal, polygonOffset: true, polygonOffsetFactor: -2 }));
      m.rotation.x = -Math.PI / 2; m.rotation.z = ry; m.position.set(x, y, z); m.receiveShadow = true; root.add(m);
    };
    // poças de óleo irregulares c/ SPECULAR (perto de barris, prensa, guindaste, rotas e spawns)
    const oilA = blobTex(10, 11, 14, 0.62, 101), oilB = blobTex(16, 13, 10, 0.5, 202);
    for (const [x, z, w, tx] of [
      [-3.5, 4.8, 3.2, oilA], [19, 21, 2.6, oilB], [-27, -17, 3.0, oilA], [5, -30.5, 2.4, oilB], [27, 7, 2.8, oilA],
      [-25.4, 30.6, 2.8, oilA], [24, -4.5, 3.4, oilB], [0.5, 29, 3.0, oilB], [-6, 25, 2.2, oilA], [8, 27.5, 2.4, oilA],
      [-9, -2, 2.6, oilB], [12, -12, 2.8, oilA], [-20, 6, 2.4, oilB], [2, -8, 2.2, oilA], [-14, -25, 2.6, oilB], [16, 16, 2.4, oilA],
    ]) decal(tx, w, w * (0.7 + drnd() * 0.5), x, z, drnd() * 6.3, 0.018, 1, 0.22, 0.6);
    // poeira/areia acumulada no rodapé dos muros (vento + abandono)
    const dust = blobTex(196, 176, 138, 0.4, 303);
    for (let z = -30; z <= 30; z += 6) { decal(dust, 5.5, 2.0, -HALF_X + 1.4, z + drnd() * 2, 0, 0.014, 0.8); decal(dust, 5.5, 2.0, HALF_X - 1.4, z - drnd() * 2, 0, 0.014, 0.8); }
    for (let x = -26; x <= 26; x += 6) decal(dust, 5.5, 2.0, x + drnd() * 2, -HALF_Z + 1.4, Math.PI / 2, 0.014, 0.8);
    decal(dust, 7, 2.4, -14, HALF_Z - 1.6, Math.PI / 2, 0.014, 0.8); decal(dust, 7, 2.4, 14, HALF_Z - 1.6, Math.PI / 2, 0.014, 0.8);

    // ---- sucata miúda: chapas, tubos, blocos de motor (corredores e rotas) ----
    const scrapMat = lam({ map: rustTex(1, 1, 167), metalness: 0.45, roughness: 0.7 });
    const scrapSpots = [   // miolo das rotas principais + perto dos spawns (primeiros 5m!)
      [0, 27], [-3, 24], [4, 22], [-8, 30], [7, 31], [-1, 18], [3, 15], [-5, 10], [2, 6], [-2, -2], [5, -10], [-4, -12],
      [-10, 20], [12, 8], [-14, -6], [8, -16], [16, -18], [-18, 16], [20, 2], [-22, -10], [10, 32], [-12, 33], [14, 26], [-16, 27],
      [-20, -28], [18, -26], [24, 12], [-26, 8],
    ];
    for (const [x, z] of scrapSpots) {
      const kind = drnd();
      if (kind < 0.45) {          // chapa retorcida
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.5 + drnd() * 0.4, 0.035, 0.3 + drnd() * 0.25), scrapMat);
        m.position.set(x + drnd() - 0.5, 0.03, z + drnd() - 0.5); m.rotation.y = drnd() * 6.3; m.rotation.z = (drnd() - 0.5) * 0.25;
        m.castShadow = m.receiveShadow = true; root.add(m);
      } else if (kind < 0.75) {   // tubo/escape
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6 + drnd() * 0.5, 8), scrapMat);
        m.rotation.z = Math.PI / 2; m.rotation.y = drnd() * 6.3; m.position.set(x + drnd() - 0.5, 0.06, z + drnd() - 0.5);
        m.castShadow = true; root.add(m);
      } else {                    // bloco de motor
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.32, 0.34), lam({ color: 0x2e2c28, metalness: 0.6, roughness: 0.6 }));
        m.position.set(x + drnd() - 0.5, 0.16, z + drnd() - 0.5); m.rotation.y = drnd() * 6.3; m.castShadow = true; root.add(m);
      }
    }
    // peças grandes: portas/capôs apoiados nas pilhas + parachoques no chão
    const doorMat = lam({ map: rustTex(1.2, 1.2, 211), metalness: 0.4, roughness: 0.75 });
    const leanDoor = (x, z, ry) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.05, 0.05), doorMat);
      m.position.set(x, 0.55, z); m.rotation.y = ry; m.rotation.x = -0.28;   // escorada
      m.castShadow = m.receiveShadow = true; root.add(m);
    };
    leanDoor(-10.2, -8, Math.PI / 2); leanDoor(10.2, 5, -Math.PI / 2); leanDoor(-10.2, 18, Math.PI / 2); leanDoor(0.8, -5.2, 0); leanDoor(-5.2, 8.8, Math.PI);
    const bumper = (x, z, ry) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 0.22), lam({ color: 0x9aa0a6, metalness: 0.7, roughness: 0.45 }));
      m.position.set(x, 0.09, z); m.rotation.y = ry; m.castShadow = true; root.add(m);
    };
    bumper(2, 25, 0.4); bumper(-6, -16, 1.9); bumper(14, 20, 2.8); bumper(-12, -20, 0.9); bumper(6, 34, 1.2);
    // pneus soltos (roda completa: torus deitado, alguns empilhados tortos)
    const looseTire = (x, z, up = false) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.13, 8, 16), MAT.tire);
      if (up) { m.rotation.y = drnd() * 6.3; m.rotation.x = 0.15; m.position.set(x, 0.42, z); }
      else { m.rotation.x = Math.PI / 2; m.position.set(x, 0.13, z); }
      m.castShadow = m.receiveShadow = true; root.add(m);
    };
    looseTire(1.5, 30.5); looseTire(-7, 27); looseTire(9, 20, true); looseTire(-13, 12); looseTire(18, 6, true); looseTire(-9, -22); looseTire(13, -24); looseTire(-21, 2); looseTire(22, -16); looseTire(-3, 33.5);
    // mato nascendo entre os carros e nos rodapés (planos cruzados c/ alpha)
    const weedMat = new THREE.MeshLambertMaterial({ map: weedTex(), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide });
    const weed = (x, z, s = 1) => {
      for (let i = 0; i < 2; i++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7 * s, 0.55 * s), weedMat);
        m.position.set(x, 0.27 * s, z); m.rotation.y = i * Math.PI / 2 + drnd() * 0.5; root.add(m);
      }
    };
    const weedSpots = [
      [-9.5, -13, 1.2], [-12.5, -6, 1], [-9.5, 15, 1.1], [-12.5, 22, 0.9], [12.5, 1, 1.2], [9.5, -4, 1], [12.5, 9, 0.9],
      [20, -18, 1.1], [-22, -22, 1], [-25, 4, 1.2], [-27, 16, 1], [25, 26, 1.1], [27, 2, 0.9], [16, -30, 1],
      [-2, 22, 0.8], [4, 17, 0.9], [-6, 2, 0.8], [3, -13, 0.9], [-16, -30, 1], [8, -30, 1.1], [-30, 28, 1.2], [30, 30, 1],
      [-1, 34, 0.9], [6, 25, 0.8], [-11, 33, 0.9], [0.5, 12, 0.7], [-4, -6.5, 0.8], [6.5, -5.5, 0.9],
    ];
    for (const [x, z, s] of weedSpots) weed(x, z, s);

    // ---- SINALIZAÇÃO DO LABIRINTO (crítico: corredores com identidade) ----
    const dirSign = (txt, x, z, ry) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8), MAT.steel);
      post.position.set(x, 1.25, z); post.castShadow = true; root.add(post);
      const c = document.createElement('canvas'); c.width = 512; c.height = 96; const xc = c.getContext('2d');
      xc.fillStyle = '#2c2f34'; xc.fillRect(0, 0, 512, 96);
      xc.strokeStyle = '#f4c020'; xc.lineWidth = 6; xc.strokeRect(4, 4, 504, 88);
      xc.fillStyle = '#f4c020'; xc.textAlign = 'center'; xc.font = 'bold 52px "Arial Black",Impact,sans-serif';
      xc.fillText(txt, 256, 66);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      for (const face of [0, Math.PI]) {   // duas faces: legível dos dois lados
        const s = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.32), new THREE.MeshBasicMaterial({ map: t }));
        s.position.set(x, 2.2, z); s.rotation.y = ry + face; root.add(s);
      }
    };
    dirSign('GALPÃO →', 7.5, 27, 0);            // saída do spawn P, aponta pro miolo
    dirSign('← BECO OESTE', -7.5, 27, 0);
    dirSign('PÁTIO LESTE →', 13.5, -3, Math.PI / 2);
    dirSign('← BECO OESTE', -13.5, 3, -Math.PI / 2);
    dirSign('↑ GALPÃO', 1, -21, Math.PI);       // aproximação do galpão
    dirSign('PRENSA', -23.5, 29.5, 0.6);
    dirSign('GUINDASTE', 23, -3.5, Math.PI / 2);
    dirSign('PORTÃO →', 1, -33, Math.PI);       // saída do spawn B de volta ao portão
  }

  /* ===== PERÍMETRO + SKYLINE (crítico R6: "muros = lama marrom sem leitura, topo morto") =====
     zinco escorado, grafite em escala, sucata na base, postes/fios/caixa d'água/antena.
     Tudo sem collider. */
  {
    const zmat = lam({ map: zincTex(2.2, 2.2) });
    const leanZinc = (x, z, ry) => {   // folha de zinco escorada no muro
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.5), zmat);
      m.position.set(x, 1.18, z); m.rotation.y = ry; m.rotation.x = -0.11;
      m.castShadow = m.receiveShadow = true; root.add(m);
    };
    leanZinc(-31.35, -24, Math.PI / 2); leanZinc(-31.35, -21.2, Math.PI / 2); leanZinc(10, -35.35, 0);
    leanZinc(13, -35.35, 0); leanZinc(31.35, 22, -Math.PI / 2); leanZinc(-14, 35.35, Math.PI); leanZinc(31.35, -26, -Math.PI / 2);
    // grafite em escala arquitetônica nos muros internos
    if (T.graffiti && T.graffiti.length) {
      const gp = [[-22, -35.44, 0, 0], [10, -35.44, 0, 1], [25, -35.44, 0, 2],
        [-31.44, -4, Math.PI / 2, 1], [-31.44, 20, Math.PI / 2, 2],
        [31.44, -16, -Math.PI / 2, 0], [31.44, 8, -Math.PI / 2, 2],
        [-16, 35.36, Math.PI, 1], [18, 35.36, Math.PI, 0]];   // sul: à FRENTE das chapas de zinco (z-fight)
      for (const [x, z, ry, gi] of gp) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 2.7), lam({ map: T.graffiti[gi % T.graffiti.length] }));
        m.position.set(x, 1.75, z); m.rotation.y = ry; m.receiveShadow = true; root.add(m);
      }
    }
    // sucata/pneus encostados na base dos muros (quebra a linha reta do rodapé)
    const wallJunk = [[-30.6, -12, 0.3], [-30.6, 4, 1.2], [30.6, -22, 2.1], [30.6, 14, 0.6], [-8, -34.6, 1.7], [20, -34.6, 0.2], [-24, 34.6, 2.8], [12, 34.6, 1.1]];
    for (const [x, z, ry] of wallJunk) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.13, 8, 16), MAT.tire);
      t.rotation.x = Math.PI / 2; t.rotation.z = ry; t.position.set(x, 0.13, z); t.castShadow = t.receiveShadow = true; root.add(t);
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.4), lam({ map: rustTex(1, 1, 300 + (x | 0)), metalness: 0.4, roughness: 0.75 }));
      s.position.set(x + 0.5, 0.04, z + 0.4); s.rotation.y = ry; s.castShadow = true; root.add(s);
    }
    // postes + fios (catenária) cruzando o pátio — quebra o topo retilíneo do muro
    const postMat = lam({ color: 0x4a3b2c, roughness: 0.9 });
    const postTops = [];
    for (const [x, z] of [[-29, -33], [29, -33], [-29, 33], [29, 33]]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 6.4, 8), postMat);
      p.position.set(x, 3.2, z); p.castShadow = true; root.add(p);
      postTops.push(new THREE.Vector3(x, 6.3, z));
    }
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x1c1a18 });
    const wire = (a, b, sag = 1.4) => {
      const mid = a.clone().lerp(b, 0.5); mid.y -= sag;
      const cur = new THREE.QuadraticBezierCurve3(a, mid, b);
      root.add(new THREE.Mesh(new THREE.TubeGeometry(cur, 22, 0.022, 4), wireMat));
    };
    wire(postTops[0], postTops[1]); wire(postTops[2], postTops[3]); wire(postTops[0], postTops[2]); wire(postTops[1], postTops[3]);
    wire(postTops[0], postTops[3], 1.8);   // diagonal
    // caixa d'água no telhado do galpão + uma FORA do muro (silhueta de fundo)
    const waterTank = (x, y, z, s = 1) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.8 * s, 0.8 * s, 1.1 * s, 12), MAT.barrel);
      t.position.set(x, y + 0.55 * s, z); t.castShadow = true; root.add(t);
      const lid = new THREE.Mesh(new THREE.ConeGeometry(0.85 * s, 0.35 * s, 12), MAT.roof);
      lid.position.set(x, y + 1.1 * s + 0.17 * s, z); root.add(lid);
    };
    waterTank(-5, 3.7, -31);            // em cima do galpão
    waterTank(-19, 2.6, -41, 1.3);      // fora do muro norte, num suporte
    for (const [lx, lz] of [[-19.7, -41.7], [-18.3, -41.7], [-19.7, -40.3], [-18.3, -40.3]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.7, 6), postMat);
      leg.position.set(lx, 1.35, lz); root.add(leg);
    }
    // antenas no topo do muro
    for (const [x, z] of [[-31.4, -8], [31.4, 16]]) {
      const a = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 6), MAT.steel);
      a.position.set(x, 4.4, z); root.add(a);
      for (const wy of [4.9, 5.3]) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.03), MAT.steel);
        bar.position.set(x, wy, z); root.add(bar);
      }
    }
    // SILHUETAS atrás dos muros em 2 camadas (opcional do crítico: skyline c/ haze) —
    // galpões, caixas d'água e árvores; camada 2 mais longe e mais "lavada" (sem fog no ferro)
    const skyCardTex = (kind, tint, seed) => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 128;
      const x = c.getContext('2d');
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      x.fillStyle = tint;
      if (kind === 'sheds') {   // galpões c/ telhado de água
        for (const [bx, bw, bh] of [[4, 84, 52], [96, 70, 68], [176, 76, 44]]) {
          x.fillRect(bx, 128 - bh, bw, bh);
          x.beginPath(); x.moveTo(bx - 4, 128 - bh); x.lineTo(bx + bw / 2, 128 - bh - 16); x.lineTo(bx + bw + 4, 128 - bh); x.fill();
        }
        x.beginPath(); x.arc(210, 128 - 74, 9, 0, 7); x.fill(); x.fillRect(208.5, 128 - 74, 3, 74);   // caixa d'água
      } else {   // árvores + tanque em torre
        for (const [tx, tr] of [[36, 30], [120, 36], [205, 26]]) {
          x.fillRect(tx - 3, 128 - 36, 6, 36);
          for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(tx + (rnd() - 0.5) * tr, 128 - 40 - rnd() * tr * 0.8, tr * (0.4 + rnd() * 0.4), tr * (0.3 + rnd() * 0.3), 0, 0, 7); x.fill(); }
        }
        x.beginPath(); x.arc(162, 128 - 92, 10, 0, 7); x.fill();
        for (const dx of [-7, 7]) { x.save(); x.translate(162 + dx, 128 - 80); x.rotate(dx > 0 ? 0.12 : -0.12); x.fillRect(-1.5, 0, 3, 80); x.restore(); }
      }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
    };
    const skyCard = (kind, tint, seed, x, z, ry, w, h) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: skyCardTex(kind, tint, seed), transparent: true, alphaTest: 0.05 }));
      m.position.set(x, h / 2 - 0.3, z); m.rotation.y = ry; root.add(m);
    };
    // camada 1 (perto, mais escura) — entre as pilhas do anel externo
    skyCard('sheds', '#6f6252', 13, -14, -47, 0, 26, 9); skyCard('trees', '#5f6a52', 24, 18, -48, 0, 22, 8);
    skyCard('trees', '#5f6a52', 35, -46, 16, Math.PI / 2, 22, 8); skyCard('sheds', '#6f6252', 46, 47, -12, -Math.PI / 2, 26, 9);
    skyCard('sheds', '#6f6252', 57, 10, 47, Math.PI, 24, 8); skyCard('trees', '#5f6a52', 68, -20, 48, Math.PI, 22, 8);
    // camada 2 (longe, lavada de haze)
    skyCard('sheds', '#a3937c', 79, 6, -60, 0, 34, 12); skyCard('trees', '#a89f88', 91, -58, -20, Math.PI / 2, 30, 11);
    skyCard('sheds', '#a3937c', 103, 60, 22, -Math.PI / 2, 32, 12); skyCard('trees', '#a89f88', 115, -8, 60, Math.PI, 30, 11);
    // chapas de zinco grandes no muro SUL do spawn (opcional do crítico: "2 chapas marrom-chapadas")
    for (const px of [-16.5, 16.5]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(11, 3.0), lam({ map: zincTex(4.5, 1.2) }));
      m.position.set(px, 1.55, HALF_Z - 0.56); m.rotation.y = Math.PI; m.receiveShadow = true; root.add(m);
    }
    // céu: disco solar + nuvens (sprites; SEM fog — regressão conhecida ferro+fog+composer)
    const sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.sunSprite, transparent: true, fog: false, depthWrite: false }));
    sunSpr.position.set(-48, 68, 60); sunSpr.scale.setScalar(46); root.add(sunSpr);   // alinhado c/ a direção do sol (-24,48,30)
    if (T.cloud) for (const [cx, cy, cz, cs] of [[-60, 55, -80, 44], [30, 62, -90, 52], [80, 50, 40, 40], [-80, 58, 60, 46]]) {
      const cl = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.cloud, transparent: true, fog: false, depthWrite: false, opacity: 0.85 }));
      cl.position.set(cx, cy, cz); cl.scale.set(cs, cs * 0.42, 1); root.add(cl);
    }
  }

  // ===== luz / céu (tarde empoeirada) =====
  // SEM scene.fog: ferro+fog+EffectComposer quebrava o frame INTEIRO (tela preto-avermelhada
  // no headless e risco igual na GPU real; havan+fog funciona — investigar depois).
  scene.background = T.sky || new THREE.Color(0xc8b49a);
  const hemi = new THREE.HemisphereLight(0xfff0dd, 0x4a4034, 1.1); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe8cc, 1.5); sun.position.set(-24, 48, 30); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -50; sun.shadow.camera.right = 50; sun.shadow.camera.top = 50; sun.shadow.camera.bottom = -50; sun.shadow.camera.far = 160; sun.shadow.bias = -0.0004;
  scene.add(sun);

  // ===== ground height (pátio plano) =====
  const groundHeightAt = () => 0;

  // ===== waypoints + A* =====
  const nodes = [], adj = [], STEP = 3.4;
  const blocked = (x, z, inf) => { for (const c of colliders) { if (x > c.minX - inf && x < c.maxX + inf && z > c.minZ - inf && z < c.maxZ + inf && c.minY < 1.6 && c.maxY > 0.15) return true; } return false; };
  for (let gx = -HALF_X + 2; gx <= HALF_X - 2; gx += STEP)
    for (let gz = -HALF_Z + 2; gz <= HALF_Z - 2; gz += STEP)
      if (!blocked(gx, gz, 0.5)) nodes.push({ x: gx, z: gz });
  const segClear = (a, b) => { for (let i = 1; i < 6; i++) { const t = i / 6, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t; if (blocked(x, z, 0.25)) return false; } return true; };
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

  // spawns: P no PORTÃO (sul, olhando pro pátio -z → yaw 0); B ao lado do GALPÃO (norte,
  // olhando +z → yaw π). Convenção do game.js: forward = (-sin yaw, -cos yaw).
  const spawns = {
    P: [-6, -2, 2, 6].map(x => ({ x, z: HALF_Z - 3, yaw: 0 })),
    B: [-14, -9, -4, 1].map(x => ({ x, z: -25, yaw: Math.PI })),
  };
  // 4 bandeiras: portão (P), beco oeste, pátio leste, galpão (B)
  const ctfPoints = [
    { id: 'P', label: 'PORTÃO', x: 0, z: 31 },
    { id: 'W', label: 'BECO OESTE', x: -24, z: -14 },
    { id: 'E', label: 'PÁTIO LESTE', x: 24, z: 4 },
    { id: 'B', label: 'GALPÃO', x: -16, z: -31 },
  ];

  // arsenal: shotgun/rifles no miolo do labirinto, snipers nos cantos, pistolas no spawn
  const gmat = lam({ color: 0x20242a });
  const place = (kind, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 1.0), gmat); m.position.set(x, 0.1, z); m.castShadow = true; root.add(m); pickups.push({ x, z, kind, weapon: kind, readyAt: 0, mesh: m }); };
  place('shotgun', -12, -2); place('ak', 4, 0); place('m4', 0, 12); place('mp5', -2, -14);
  place('awp', 29, -22); place('m400', -24, 14);
  place('deagle', -4, 31); place('ak', 0, 31); place('shotgun', 4, 28); place('m4', 8, 33);

  return {
    root, colliders, occluders, groundHeightAt, spawns, sun, hemi, pickups, ctfPoints,
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    bounds: { minX: -HALF_X + 0.5, maxX: HALF_X - 0.5, minZ: -HALF_Z + 0.5, maxZ: HALF_Z - 0.5 },
  };
}
