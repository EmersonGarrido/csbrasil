// ============================================================================
// FAVELA DA TRETA — o MAIOR mapa (96×120 m) e o único VERTICAL de verdade.
//
// Um morro em 3 terraços que sobem do asfalto até a laje: RUA (nível 0, entrada da quebrada,
// kombi da facção, boteco) → ESCADARIA → MIOLO (nível 1, labirinto denso de casas coladas e
// BECOS que serpenteiam) → ESCADARIA → LAJE DO BAILE (nível 2, caixa de som, vista da cidade).
// Cheio de esconderijo: cada beco tem canto, cada casa faz sombra, a laje é o ponto alto de quem
// domina. TIME E nasce na RUA (embaixo), TIME B na LAJE (em cima) — quem sobe o morro tem que
// ganhar a escadaria. A treta é o de sempre: boca, baile e a milícia cobrando o gatonet.
//
// Verticalidade = `groundHeightAt(x,z)` monotônico (terraços + rampas), o mesmo mecanismo do
// morro das Obras e da Loja H. O corpo sobe rampa contínua sem degrau (game.js STEP_H só barra
// salto brusco). Waypoints com checagem de altura (limiar 0,9 m) pros bots subirem as escadas.
// Mesmo contrato build(scene,T). Procedural (casas/becos/escadas) + props (kombi/fusca/som/pneus).
// ============================================================================
import * as THREE from 'three';
import { placeProp } from './mapprops.js';
import { decalIds } from './map_decals.js';
import { grafitar } from './graffiti_pass.js';

export const FAVELA_PROPS = ['fav_house', 'fav_brasileira', 'fav_modular', 'kombi', 'fusca', 'moto_cg', 'pilha_pneus', 'caixa_som_baile', 'caixa_som', 'churrasqueira', 'carro_danificado', 'jersey_barrier', 'monte_carros'];

export const HALF_X = 48, HALF_Z = 60;
const L0 = 0, L1 = 4, L2 = 8;   // alturas dos 3 terraços

// morro: sobe do sul (rua, y0) pro norte (laje, y8), com duas rampas-escadaria de 20 m (slope 0.2)
export function groundHeightAt(x, z) {
  if (z <= -20) return L0;
  if (z < 0)    return L0 + (L1 - L0) * (z + 20) / 20;
  if (z <= 26)  return L1;
  if (z < 46)   return L1 + (L2 - L1) * (z - 26) / 20;
  return L2;
}

function signTex(bg, fg, title, sub, W = 512, H = 160) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, W, H);
  x.strokeStyle = fg; x.lineWidth = W * 0.02; x.strokeRect(W * 0.015, H * 0.05, W * 0.97, H * 0.9);
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = fg;
  const pad = W * 0.09;
  const fit = (t, base, fam) => { let fs = base; x.font = `bold ${fs}px ${fam}`; while (x.measureText(t).width > W - pad && fs > 8) { fs -= 2; x.font = `bold ${fs}px ${fam}`; } };
  fit(title, H * 0.44, '"Arial Black",Impact,sans-serif'); x.fillText(title, W / 2, sub ? H * 0.4 : H * 0.52);
  if (sub) { fit(sub, H * 0.2, 'Arial,sans-serif'); x.fillText(sub, W / 2, H * 0.74); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildFavela(scene, T) {
  const colliders = [], occluders = [], pickups = [];
  const root = new THREE.Group();
  scene.add(root);

  // RNG determinístico (mulberry32) — mapa estável entre partidas e réguas
  let _s = 0x1a2b3c4d;
  const rnd = () => { _s |= 0; _s = _s + 0x6D2B79F5 | 0; let t = Math.imul(_s ^ _s >>> 15, 1 | _s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  const lam = (o) => new THREE.MeshLambertMaterial(o);
  const MAT = {
    asfalto: lam({ color: 0x33373b }), terra: lam({ color: 0x6b5a44 }), concreto: lam({ color: 0x9a938a }),
    laje: lam({ color: 0xb4aea3 }), escada: lam({ color: 0xa8a196 }), muro: lam({ color: 0x8f8478 }),
    porta: lam({ color: 0x394049 }), tijolo: lam({ color: 0xa85a3c }), rocha: lam({ color: 0x5c564e }),
    aco: lam({ color: 0x9aa0a6 }), quadra: lam({ color: 0x2f6f4a }),
  };
  // TEXTURA DE BARRACO (fallback quando os GLB não carregam — régua headless): reboco parcial +
  // tijolo aparente + janela + porta, no lugar de caixa de cor chapada.
  function barracoTex(base, brick) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 160; const x = c.getContext('2d');
    x.fillStyle = base; x.fillRect(0, 0, 128, 160);
    if (brick) { x.fillStyle = '#9c5636'; x.fillRect(0, 96, 128, 64); x.strokeStyle = 'rgba(0,0,0,.22)'; x.lineWidth = 1; for (let y = 98; y < 160; y += 8) { x.beginPath(); x.moveTo(0, y); x.lineTo(128, y); x.stroke(); for (let xx = (Math.round(y / 8) % 2 ? 0 : 10); xx < 128; xx += 20) { x.beginPath(); x.moveTo(xx, y); x.lineTo(xx, y + 8); x.stroke(); } } }
    x.fillStyle = '#20252c'; x.fillRect(42, 42, 44, 40); x.strokeStyle = '#d8d0c2'; x.lineWidth = 3; x.strokeRect(42, 42, 44, 40); x.beginPath(); x.moveTo(64, 42); x.lineTo(64, 82); x.moveTo(42, 62); x.lineTo(86, 62); x.stroke();
    x.fillStyle = '#33291f'; x.fillRect(52, 112, 26, 48); x.strokeStyle = '#20180f'; x.strokeRect(52, 112, 26, 48);
    x.fillStyle = 'rgba(50,40,30,.14)'; for (let i = 0; i < 10; i++) { const gx = (i * 37 % 120), gw = 3 + (i * 13 % 7); x.fillRect(gx, 30 + (i * 29 % 100), gw, 20 + (i * 17 % 40)); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const BARRACO_MATS = [['#c9bfae', 0], ['#7fa8c2', 0], ['#d3b25a', 0], ['#8fae72', 0], ['#c98a6a', 1], ['#b8b0a2', 1], ['#cf8f98', 0], ['#9c5636', 1], ['#a89a86', 0], ['#c7c0b2', 1]].map(([col, br]) => lam({ map: barracoTex(col, br) }));
  const HOUSE_IDS = ['fav_house', 'fav_brasileira', 'fav_modular'];
  const gy = (x, z) => groundHeightAt(x, z);

  function addBox(w, h, d, mat, x, y, z, opts = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z); m.castShadow = opts.cast !== false; m.receiveShadow = true;
    if (opts.ry) m.rotation.y = opts.ry;
    root.add(m);
    if (opts.collide !== false) {
      let hx = w / 2, hz = d / 2;
      if (opts.ry) { const cs = Math.abs(Math.cos(opts.ry)), sn = Math.abs(Math.sin(opts.ry)); hx = w / 2 * cs + d / 2 * sn; hz = w / 2 * sn + d / 2 * cs; }
      colliders.push({ minX: x - hx, maxX: x + hx, minY: y, maxY: y + h, minZ: z - hz, maxZ: z + hz }); occluders.push(m);
    }
    return m;
  }
  const col = (x, z, hx, hz, h) => { const g = gy(x, z); colliders.push({ minX: x - hx, maxX: x + hx, minY: g, maxY: g + h, minZ: z - hz, maxZ: z + hz }); };
  function prop(id, x, z, targetH, ry, hx, hz, h) { const o = placeProp(id, { x, z, y: gy(x, z), targetH, ry }); if (o) { root.add(o); occluders.push(o); } if (hx) col(x, z, hx, hz, h); return o; }
  const signMesh = (w, h, tx, x, y, z, ry) => {
    const g = new THREE.Group(); const geo = new THREE.PlaneGeometry(w, h);
    const f = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tx })); f.position.z = 0.02;
    const b = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tx })); b.position.z = -0.02; b.rotation.y = Math.PI;
    g.add(f, b); g.position.set(x, y, z); g.rotation.y = ry; root.add(g); return g;
  };

  /* ---------------- chão do morro (malha deslocada) + céu ---------------- */
  scene.background = new THREE.Color(0x9fb8cf); scene.fog = new THREE.Fog(0x9fb8cf, 90, 200);
  const gGeo = new THREE.PlaneGeometry(HALF_X * 2, HALF_Z * 2, 64, 80).rotateX(-Math.PI / 2);
  const gp = gGeo.attributes.position;
  for (let i = 0; i < gp.count; i++) gp.setY(i, groundHeightAt(gp.getX(i), gp.getZ(i)) - 0.02);
  gGeo.computeVertexNormals();
  const ground = new THREE.Mesh(gGeo, MAT.terra); ground.receiveShadow = true; root.add(ground);
  // asfalto da rua (nível 0) + laje de concreto (nível 2), sobrepostos finos
  addBox(HALF_X * 2 - 2, 0.06, 38, MAT.asfalto, 0, L0, -41, { collide: false, cast: false });   // só o nível 0 (z<=-22)
  addBox(HALF_X * 2 - 2, 0.06, 14, MAT.laje, 0, L2, 53, { collide: false, cast: false });        // só o nível 2 plano (z46..60), NÃO a rampa

  /* ---------------- helpers de estrutura ---------------- */
  // CASA: barraco GLB de verdade (fav_house = sobrado c/ escada e laje · fav_brasileira · fav_modular).
  // Colisor sempre presente + box texturizado de barraco como fallback (some quando o GLB carrega).
  let hi = 0;
  const LOTES = [];   // {x,z,g,h} pra ancorar mural do grafite na casa certa
  function casa(cx, cz, ry, ti, h, side = 4.6) {
    const g = gy(cx, cz);
    const box = addBox(side, h, side, BARRACO_MATS[hi++ % BARRACO_MATS.length], cx, g, cz, { ry });   // colisor + fallback
    const glb = placeProp(HOUSE_IDS[ti % HOUSE_IDS.length], { x: cx, z: cz, y: g, targetH: h, ry });
    if (glb) { root.add(glb); occluders.push(glb); box.visible = false; }   // GLB cobre; box vira só colisor
    LOTES.push({ x: cx, z: cz, g, h });
  }
  // QUARTEIRÃO: favela densa e orgânica — casas coladas, becos estreitos (~3 m), casas viradas pra
  // todo lado, alturas variadas por tipo (sobrado alto x barraco térreo). A treliça de becos garante
  // navegação; o jitter + rotação tira a cara de grade.
  function quarteirao(xa, xb, za, zb, vazio = 0.12) {
    for (let cz = za; cz <= zb - 5; cz += 8.0)
      for (let cx = xa; cx <= xb - 5; cx += 8.0) {
        if (rnd() < vazio) continue;                       // lote vazio = pracinha/beco largo (esconderijo)
        const ti = rnd() < 0.4 ? 0 : (rnd() < 0.5 ? 1 : 2);
        const h = ti === 0 ? 5.6 + rnd() * 1.6 : 3.0 + rnd() * 1.4;   // fav_house é sobrado; resto térreo
        casa(cx + 2.6 + (rnd() - 0.5) * 1.2, cz + 2.6 + (rnd() - 0.5) * 1.2, (rnd() * 4 | 0) * Math.PI / 2, ti, h, 4.4 + rnd() * 0.8);
      }
  }
  // escadaria: degraus visuais atravessando a faixa de rampa (colisão real é o groundHeightAt)
  function escadaria(z0, z1, y0, y1) {
    const n = Math.round((z1 - z0) / 0.9);
    for (let s = 0; s < n; s++) { const zz = z0 + (z1 - z0) * (s + 0.5) / n; addBox(HALF_X * 2 - 4, 0.16, (z1 - z0) / n * 0.62, MAT.escada, 0, gy(0, zz), zz, { collide: false, cast: false }); }
    for (const sx of [-1, 1]) for (let s = 0; s <= 4; s++) { const zz = z0 + (z1 - z0) * s / 4; addBox(0.5, 1.0, 0.5, MAT.muro, sx * (HALF_X - 3), gy(0, zz), zz); }   // corrimão/postes (colidem: viram cobertura)
  }
  // QUADRA ESPORTIVA (landmark central, ponto 4 da referência): piso + linhas + 2 traves + alambrado baixo
  function quadraEsportiva(cx, cz, w, d) {
    const g = gy(cx, cz);
    const c = document.createElement('canvas'); c.width = 256; c.height = 200; const x = c.getContext('2d');
    x.fillStyle = '#2f6f4a'; x.fillRect(0, 0, 256, 200); x.strokeStyle = '#e8e8e8'; x.lineWidth = 4;
    x.strokeRect(10, 10, 236, 180); x.beginPath(); x.moveTo(128, 10); x.lineTo(128, 190); x.stroke(); x.beginPath(); x.arc(128, 100, 30, 0, 7); x.stroke();
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: tx })); piso.rotation.x = -Math.PI / 2; piso.position.set(cx, g + 0.03, cz); piso.receiveShadow = true; root.add(piso);
    for (const sz of [-1, 1]) { addBox(3.2, 2.0, 0.1, MAT.aco, cx, g, cz + sz * (d / 2 - 0.6), { collide: false }); for (const sx of [-1, 1]) addBox(0.12, 2.0, 0.12, MAT.aco, cx + sx * 1.6, g, cz + sz * (d / 2 - 0.6)); }   // traves
    for (const sx of [-1, 1]) addBox(0.15, 1.4, d, MAT.muro, cx + sx * w / 2, g, cz);   // alambrado lateral (cobertura)
  }
  // CAIXA D'ÁGUA (landmark alto, ponto 8): torre de 4 pernas + tanque cilíndrico — ponto de referência
  function caixaDagua(cx, cz) {
    const g = gy(cx, cz);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) addBox(0.3, 3.2, 0.3, MAT.aco, cx + sx * 1.1, g, cz + sz * 1.1);
    addBox(2.8, 0.3, 2.8, MAT.aco, cx, g + 3.2, cz, { collide: false });
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2.2, 18), lam({ color: 0x2f6fb0 })); tank.position.set(cx, g + 4.6, cz); tank.castShadow = true; root.add(tank); occluders.push(tank);
    addBox(3.2, 0.4, 3.2, lam({ color: 0x2a5f9f }), cx, g + 5.7, cz, { collide: false });   // tampa
    col(cx, cz, 1.4, 1.4, 3.2);
  }

  /* ---------------- perímetro (muros de arrimo / morro) ---------------- */
  const wX = HALF_X - 0.5, wZ = HALF_Z - 0.5;
  for (const sx of [-1, 1]) for (let z = -wZ; z < wZ; z += 8) addBox(1.0, 9, 8, MAT.rocha, sx * wX, gy(sx * wX, z), z, {});
  for (let x = -wX; x < wX; x += 8) { addBox(8, 9, 1.0, MAT.rocha, x, gy(x, -wZ), -wZ, {}); addBox(8, 9, 1.0, MAT.rocha, x, gy(x, wZ), wZ, {}); }

  /* ---------------- NÍVEL 0 — RUA PRINCIPAL / ASFALTO (entrada, Time E) ---------------- */
  prop('kombi', -10, -50, 2.2, 0.2, 2.1, 1.0, 1.9);
  prop('fusca', 12, -52, 1.6, -0.3, 1.9, 0.9, 1.4);
  prop('moto_cg', 6, -46, 1.2, 1.4, 0.5, 1.0, 1.0);
  prop('carro_danificado', 30, -52, 1.7, 0.1, 2.0, 0.9, 1.4);
  casa(-30, -50, 0, 1, 3.2, 5);   // MERCADINHO (comércio da esquina)
  signMesh(4.2, 1.0, signTex('#c0392b', '#fff', 'MERCADINHO DA TRETA', '', 560, 120), -30, L0 + 3.4, -47.3, 0);
  casa(30, -49, 0, 2, 3.0, 5);    // LAVANDERIA
  signMesh(3.6, 0.9, signTex('#2f6fb0', '#fff', 'LAVA-RÁPIDO', '', 512, 130), 30, L0 + 3.2, -46.4, 0);
  prop('pilha_pneus', 40, -44, 1.2, 0, 1.0, 1.0, 1.1);
  quarteirao(-44, 44, -46, -22);                    // casas do nível 0

  /* ---------------- ESCADARIA SUL (rampa z -20..0) ---------------- */
  escadaria(-20, 0, L0, L1);
  signMesh(5, 1.2, signTex('#111', '#f1c40f', 'SOBE O MORRO', 'SE FOR HOMEM', 560, 150), 0, L0 + 3, -10, 0);

  /* ---------------- NÍVEL 1 — MIOLO DA FAVELA (labirinto de becos + QUADRA) ---------------- */
  quarteirao(-44, -11, 2, 24);                      // quarteirão oeste
  quarteirao(11, 44, 2, 24);                        // quarteirão leste
  quarteirao(-10, 10, 2, 7, 0.4);                   // fileira sul (na frente da quadra)
  quadraEsportiva(0, 15, 18, 13);                   // QUADRA ESPORTIVA (landmark central = zona da bandeira MID)
  caixaDagua(-38, 18);                              // CAIXA D'ÁGUA (landmark alto no miolo)
  prop('churrasqueira', -6, 5, 1.3, 0, 0.9, 0.6, 1.1);
  prop('jersey_barrier', 20, 22, 1.1, Math.PI / 2, 1.0, 0.4, 1.0);
  // varais de roupa atravessando os becos (corda + roupas coloridas penduradas)
  const ROUPA = [0xd94f4f, 0x4f7fd9, 0xf1c40f, 0x2ecc71, 0xecf0f1, 0xe67e22].map((c) => lam({ color: c }));
  for (const [vx, vz] of [[-20, 6], [22, 18], [-28, 12], [6, 21], [-34, 8]]) { const g = gy(vx, vz) + 2.9; addBox(4.2, 0.03, 0.03, MAT.porta, vx, g, vz, { collide: false, cast: false }); for (let k = 0; k < 5; k++) addBox(0.42, 0.55, 0.03, ROUPA[k % 6], vx - 1.6 + k * 0.8, g - 0.55, vz, { collide: false, cast: false }); }

  /* ---------------- ESCADARIA NORTE (rampa z 26..46) ---------------- */
  escadaria(26, 46, L1, L2);

  /* ---------------- NÍVEL 2 — LAJE DO BAILE (topo, Time B) ---------------- */
  prop('caixa_som_baile', -10, 50, 2.6, 0.3, 1.4, 1.0, 2.4);
  prop('caixa_som_baile', 10, 50, 2.6, -0.3, 1.4, 1.0, 2.4);
  prop('caixa_som', 0, 49, 1.6, 0, 0.8, 0.8, 1.5);
  casa(-34, 52, 0, 0, 5.6, 5);    // casa de força / DJ (sobrado) — cobertura na laje
  casa(34, 52, 0, 0, 5.6, 5);
  caixaDagua(-36, 56); caixaDagua(36, 56);   // caixas d'água nas pontas da laje (cobertura + landmark do topo)
  signMesh(7, 1.6, signTex('#8e2fc0', '#fff', 'BAILE DA TRETA', 'PROIBIDÃO', 640, 150), 0, L2 + 3.2, wZ - 0.6, Math.PI);
  // mureta da laje (parapeito) na borda sul do terraço, com vãos pra subir
  for (let x = -wX + 4; x < wX - 4; x += 10) if (Math.abs(x) > 8) addBox(6, 1.0, 0.5, MAT.muro, x, L2, 46.5, {});

  /* ---------------- placas de treta espalhadas ---------------- */
  const avisos = [['BECO SEM SAÍDA', ''], ['SILÊNCIO', 'É SAÚDE'], ['CACHORRO BRAVO', ''], ['PROIBIDO', 'DELATOR'], ['GATONET', 'R$ 30']];
  avisos.forEach(([t, s], i) => { const zz = [-30, -10, 12, 30, 50][i], xx = (i % 2 ? 1 : -1) * (18 + i * 3); signMesh(2.6, 0.9, signTex('#e0b81a', '#1a1a1a', t, s, 480, 160), xx, gy(xx, zz) + 2.6, zz, (i % 2) ? -1.2 : 1.2); });

  /* ---------------- ARMAS NO CHÃO ---------------- */
  const GM = { black: lam({ color: 0x1b1d21 }), steel: lam({ color: 0x9aa0a6 }), wood: lam({ color: 0x7a5326 }), tan: lam({ color: 0xb39a63 }), green: lam({ color: 0x16432a }) };
  const gbox = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; };
  const gcyl = (r, len, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); return m; };
  function buildGun(kind, x, z, yaw) {
    const g = new THREE.Group(); const add = (...ms) => ms.forEach((m) => g.add(m));
    switch (kind) {
      case 'awp': add(gbox(0.11, 0.1, 1.35, GM.green, 0, 0.09, 0.05), gbox(0.11, 0.16, 0.36, GM.green, 0, 0.1, 0.6), gcyl(0.05, 0.36, GM.black, 0, 0.19, 0.05)); break;
      case 'ak': add(gbox(0.1, 0.1, 1.05, GM.black, 0, 0.09, 0), gbox(0.11, 0.13, 0.34, GM.wood, 0, 0.1, 0.46), gbox(0.09, 0.24, 0.14, GM.black, 0, -0.02, -0.02)); break;
      case 'm4': add(gbox(0.09, 0.1, 1.0, GM.black, 0, 0.09, 0), gbox(0.1, 0.14, 0.32, GM.black, 0, 0.1, 0.45), gbox(0.08, 0.2, 0.13, GM.black, 0, 0, -0.05)); break;
      case 'mp5': add(gbox(0.09, 0.11, 0.62, GM.black, 0, 0.09, 0), gbox(0.09, 0.1, 0.22, GM.black, 0, 0.09, 0.36), gbox(0.07, 0.22, 0.1, GM.black, 0, 0, -0.02)); break;
      case 'shotgun': add(gbox(0.1, 0.11, 1.0, GM.black, 0, 0.11, 0), gbox(0.1, 0.09, 0.9, GM.wood, 0, 0.02, 0.02), gbox(0.11, 0.15, 0.34, GM.wood, 0, 0.1, 0.5)); break;
      case 'deagle': add(gbox(0.09, 0.13, 0.4, GM.steel, 0, 0.1, 0), gbox(0.09, 0.2, 0.11, GM.tan, 0, 0.02, 0.15)); break;
      default: add(gbox(0.08, 0.12, 0.3, GM.black, 0, 0.09, 0), gbox(0.08, 0.16, 0.1, GM.black, 0, 0.03, 0.11));
    }
    g.position.set(x, gy(x, z) + 0.02, z); g.rotation.y = yaw; g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); root.add(g); return g;
  }
  const place = (kind, x, z, yaw = 0) => { const mesh = buildGun(kind, x, z, yaw); pickups.push({ x, z, kind, weapon: kind, readyAt: 0, mesh }); };
  const ARSENAL = ['awp', 'ak', 'm4', 'shotgun', 'mp5', 'deagle', 'pistol'];
  ARSENAL.forEach((k, i) => place(k, -18 + i * 6, -54, 0));    // rua (Time E)
  ARSENAL.forEach((k, i) => place(k, -18 + i * 6, 57, Math.PI)); // laje (Time B)
  place('ak', -2, 13, 0); place('m4', 3, 13, 0); place('awp', 0, 34, 0);   // disputadas no miolo e na escadaria norte

  /* ---------------- luz (sol de fim de tarde na quebrada) ---------------- */
  const hemi = new THREE.HemisphereLight(0xcfe0f0, 0x6b5a44, 0.9); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe8c8, 1.15);
  sun.position.set(-40, 60, -30); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -HALF_X; sun.shadow.camera.right = HALF_X; sun.shadow.camera.top = HALF_Z; sun.shadow.camera.bottom = -HALF_Z;
  sun.shadow.camera.far = 200; sun.shadow.bias = -0.0004; scene.add(sun);

  const slowAt = () => false;

  /* ---------------- waypoints (com altura, pros bots subirem o morro) ---------------- */
  const nodes = [], adj = [], STEP = 3.4;
  const blocked = (x, z, inf) => { const g = groundHeightAt(x, z); for (const c of colliders) if (x > c.minX - inf && x < c.maxX + inf && z > c.minZ - inf && z < c.maxZ + inf && c.minY < g + 1.6 && c.maxY > g + 0.2) return true; return false; };
  for (let gx = -HALF_X + 2; gx <= HALF_X - 2; gx += STEP) for (let gz = -HALF_Z + 2; gz <= HALF_Z - 2; gz += STEP) if (!blocked(gx, gz, 0.5)) nodes.push({ x: gx, z: gz });
  const segClear = (a, b) => { const ga = groundHeightAt(a.x, a.z), gb = groundHeightAt(b.x, b.z); if (Math.abs(ga - gb) > 0.9) return false; for (let i = 1; i < 6; i++) { const t = i / 6, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t; if (blocked(x, z, 0.25)) return false; } return true; };
  for (let i = 0; i < nodes.length; i++) { adj.push([]); for (let j = 0; j < nodes.length; j++) { if (i === j) continue; const dx = nodes[i].x - nodes[j].x, dz = nodes[i].z - nodes[j].z; if (dx * dx + dz * dz < STEP * STEP * 2.4 && segClear(nodes[i], nodes[j])) adj[i].push(j); } }
  function nearestWaypoint(x, z) { let best = 0, bd = 1e9; for (let i = 0; i < nodes.length; i++) { const dx = nodes[i].x - x, dz = nodes[i].z - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = i; } } return best; }
  function findPath(a, b) {
    if (a === b) return [b];
    const prev = new Int16Array(nodes.length).fill(-1); const q = [a]; prev[a] = a;
    while (q.length) { const n = q.shift(); for (const m of adj[n]) if (prev[m] === -1) { prev[m] = n; if (m === b) { const p = [m]; let c = n; while (c !== a) { p.unshift(c); c = prev[c]; } p.unshift(a); return p; } q.push(m); } }
    return [a];
  }

  /* ---------------- pixação nos muros ---------------- */
  const D_TAG = decalIds(T, ['tag-fina.png', 'tag-flop.png', 'tag-selvagem.png', 'or-graf-treta.png', 'or-graf-coro.png']);
  grafitar({
    id: 'favela_treta', root, T, waypoints: nodes, seed: 5151, passo: 2.4, alcance: 7, cobre: 0.05, minLarg: 0.4,
    bandas: [
      { y0: 0.6, y1: 3.0, larg: 2.4, alturas: [1.6, 1.1, 0.7], chance: 42, pool: D_TAG },
      { y0: 1.0, y1: 2.8, larg: 1.8, alturas: [1.3, 0.9], chance: 18, fonte: 'poster', pool: (T.posterFiles || []).map((_, i) => i) },
    ],
  });

  /* ---------------- spawns + CTF ---------------- */
  const spawns = {
    E: [-18, -8, 2, 12].map((x) => ({ x, z: -56, yaw: 0 })),
    B: [-14, -5, 5, 14].map((x) => ({ x, z: 57, yaw: Math.PI })),
  };
  return {
    root, colliders, occluders, decalSolids: [root], groundHeightAt, slowAt, spawns, sun, hemi, pickups,
    ctfPoints: [
      { id: 'E', label: 'ENTRADA', x: -6, z: -50 },
      { id: 'MID', label: 'QUADRA', x: 0, z: 15 },
      { id: 'B', label: 'LAJE DO BAILE', x: -4, z: 52 },
    ],
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    bounds: { minX: -HALF_X + 1, maxX: HALF_X - 1, minZ: -HALF_Z + 1, maxZ: HALF_Z - 1 },
  };
}
