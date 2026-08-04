// QUEBRADA (fy_quebrada) — spec literal do dono (HANDOFF A0.10): uma RUA RETA E COMPRIDA com
// rotunda do BAILE numa ponta (2 carros tunados + caixas de som) e CAMPINHO DE TERRA na outra
// (respawn do outro time); ônibus parado com ponto, bar brasileiro com cadeira de plástico na
// calçada, barricadas, casas majoritariamente de BARRACO, comércio (adega, açaí, sorveteria,
// móveis/eletrônicos, lanchonete) e — o item que NÃO é decoração — VIELAS E BECOS.
//
// POR QUE AS VIELAS SÃO REQUISITO E NÃO ENFEITE: a régua CTF2 (tools/eval/map-check.mjs) exige
// ≥ 2 rotas separadas por ≥ 6 m entre CADA spawn e CADA bandeira. Uma rua reta é UMA fita: todo
// bot percorre o mesmo corredor e o mapa vira duelo de sniper. As duas vielas de fundo (x = ∓23)
// ficam a 23 m do eixo da rua — quase 4× a separação mínima — e são o que faz a CTF2 fechar.
//
// PLANTA (eixo longo = z; norte = -z). Faixas em x, simétricas:
//   asfalto  x ∈ [-7, 7]      calçadas x ∈ [∓12,5, ∓7]     blocos x ∈ [∓21, ∓12,5]
//   vielas   x ∈ [∓25, ∓21]   fundo (barracos) x ∈ [∓28, ∓25]
//   PRAÇA DO BAILE z ∈ [-43, -20] · RUA z ∈ [-20, 24] · TRAVESSA z ∈ [24, 28] · CAMPINHO z ∈ [28, 46]
//   vila do baile (spawn P) x ∈ [-25, -12,5], z ∈ [-46, -38]
//
// Contrato buildWorld idêntico ao map_ferrovelho.js / map_havan.js.
import * as THREE from 'three';
import { placeProp } from './mapprops.js';
import { VAO_BANDS, aoBoxGeo, aoMatFactory, ContactSkirt, BASE_FLOATING, onGround } from './vao.js';
import { makeAerialFog } from './bloom.js';
import { detailFor } from './textures.js';

const QP = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const LOWQ = (() => { try { return JSON.parse(localStorage.getItem('awpbr_settings') || '{}').quality === 'low'; } catch (e) { return false; } })();

export const HALF_X = 28, HALF_Z = 47;
// props GLB reaproveitados (o mapa NUNCA depende deles: todo `gprop` tem fallback procedural,
// senão o mapa quebraria em node — onde nenhum GLB carrega — e nas réguas).
export const QUEBRADA_PROPS = ['pilha_pneus', 'tires', 'jersey_barrier', 'stall', 'tent', 'caixa_som',
  'arquibancada', 'churrasqueira', 'mesa_guardasol', 'guarda_sol', 'moto_cg', 'kombi', 'uno_mille',
  'fusca', 'saveiro', 'dumpster', 'arara_roupas', 'drinkstand'];

export function buildQuebrada(scene, T) {
  const colliders = [], occluders = [], pickups = [];
  const solids = [];   // footprints de edificação — o gerador de waypoints não põe nó lá dentro
  const root = new THREE.Group(); scene.add(root);

  // PBR de superfície pelo mesmo caminho do ferro velho: normal+rough derivados do próprio
  // albedo por Sobel (textures.js). Em quality 'low' `detailFor` devolve null e nada muda.
  const lam = (o) => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, ...o });
    const det = m.map && detailFor(m.map);
    if (det) {
      if (det.normalMap && !m.normalMap) { m.normalMap = det.normalMap; m.normalScale.set(0.65, 0.65); }
      if (det.roughnessMap && !m.roughnessMap) m.roughnessMap = det.roughnessMap;
    }
    return m;
  };
  const MAT = {
    asphalt: lam({ map: T.asphalt }),
    concrete: lam({ map: T.concrete }),
    concreteDark: lam({ map: T.concreteDark }),
    dirt: lam({ map: T.dirt }),
    grass: lam({ map: T.grass }),
  };

  const aoMat = aoMatFactory();
  const SKIRT = new ContactSkirt({ low: LOWQ });
  function addBox(w, h, d, mat, x, y, z, opts = {}) {
    const vao = VAO_BANDS && opts.vao !== false && mat && mat.visible !== false;
    const solo = onGround(y, h) && !opts.ry;
    const geo = vao ? aoBoxGeo(w, h, d, { low: LOWQ, base: solo ? undefined : BASE_FLOATING })
      : new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(geo, vao ? aoMat(mat) : mat);
    m.position.set(x, y + h / 2, z); m.castShadow = opts.cast !== false; m.receiveShadow = true;
    if (opts.ry) m.rotation.y = opts.ry;
    if (solo && opts.skirt !== false) SKIRT.add(x, y, z, w, d, opts.ry || 0);
    root.add(m);
    if (opts.collide !== false) {
      colliders.push({ minX: x - w / 2, maxX: x + w / 2, minY: y, maxY: y + h, minZ: z - d / 2, maxZ: z + d / 2 });
      occluders.push(m);
    }
    return m;
  }
  // colisor sem malha (fecha vão entre peças que já têm malha própria); NUNCA vira occluder,
  // então não pode produzir "marca de tiro no ar" (MAP4).
  const col = (x0, x1, y0, y1, z0, z1) => colliders.push({ minX: Math.min(x0, x1), maxX: Math.max(x0, x1), minY: y0, maxY: y1, minZ: Math.min(z0, z1), maxZ: Math.max(z0, z1) });
  const addFloor = (w, d, x, z, mat, y = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; root.add(m); return m; };
  const gprop = (id, x, z, h, ry = 0) => { const o = placeProp(id, { x, z, targetH: h, ry }); if (o) root.add(o); return !!o; };

  /* COLISOR DE PROP GIRADO — BUG-21 (KNOWN-BUGS.md), medido no ônibus da Brasília.
     O motor NÃO tem collider rotacionado em lugar nenhum (nem `_collide`, nem o A* dos bots):
     `col()` só aceita AABB. Uma caixa única alinhada aos eixos para um retângulo girado é o
     retângulo "achatado" — sobra nas quinas e falta nas laterais. No ônibus de 0,55 rad isso
     deu 12,9 m² de bloqueio onde não havia lataria e uma PAREDE INVISÍVEL a 2,33 m dela.
     Correção medida (2,33 m -> 0,68 m): decompor o retângulo numa grade nx×nz no espaço LOCAL
     do objeto e empurrar a AABB exata de cada célula — uma escada de caixas na diagonal. */
  function colRot(cx, cz, w, d, y0, y1, ry, nx = 6, nz = 3) {
    const cs = Math.cos(ry), sn = Math.sin(ry), sx = w / nx, sz = d / nz;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const lx = -w / 2 + sx * (i + 0.5), lz = -d / 2 + sz * (j + 0.5);
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (const dx of [-sx / 2, sx / 2]) for (const dz of [-sz / 2, sz / 2]) {
        const px = lx + dx, pz = lz + dz;
        const wx = cx + px * cs + pz * sn, wz = cz - px * sn + pz * cs;
        x0 = Math.min(x0, wx); x1 = Math.max(x1, wx); z0 = Math.min(z0, wz); z1 = Math.max(z1, wz);
      }
      col(x0, x1, y0, y1, z0, z1);
    }
  }

  /* ===================== CÉU / LUZ ===================== */
  scene.background = T.sky || new THREE.Color(0xb9c6d2);
  if (QP.get('nofog') !== '1') scene.fog = makeAerialFog('fy_quebrada');
  const hemi = new THREE.HemisphereLight(0xdfe6ee, 0x54483c, 0.9); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffd9a8, 1.5); sun.position.set(38, 30, -22); sun.castShadow = true;
  sun.shadow.mapSize.set(LOWQ ? 1024 : 2048, LOWQ ? 1024 : 2048);
  sun.shadow.camera.left = -HALF_X; sun.shadow.camera.right = HALF_X;
  sun.shadow.camera.top = HALF_Z; sun.shadow.camera.bottom = -HALF_Z;
  sun.shadow.camera.far = 160; sun.shadow.bias = -0.0006;
  scene.add(sun); scene.add(sun.target);

  // chão base: terra/laje batida sob tudo (a rua, a praça e o campinho pintam por cima)
  addFloor(HALF_X * 2, HALF_Z * 2, 0, 0, MAT.dirt, -0.01);

  /* ===================== A RUA =====================
     14 m de asfalto (x ∈ [-7,7]) e calçadas de 5,5 m (x ∈ [∓12,5, ∓7]) de z = -20 (boca da
     praça) a z = 24 (travessa do campinho). A calçada é LARGA de propósito: é onde cabem a
     mesa do bar, o ponto de ônibus, a barraca e a barricada sem estrangular o corredor —
     e cada uma dessas peças é uma unidade de cover que a MAP5 conta.
     A calçada sobe 0,02 m e o meio-fio tem 0,14 m: os dois ficam ABAIXO do degrau de 0,30 m
     que o corpo sobe (game.js `_collide` só bloqueia colisor com maxY > 0,30), então nem o
     jogador nem o flood-fill das réguas tropeçam neles. Por isso o meio-fio vai com
     `collide:false`: dar-lhe colisor não mudaria o andar e só engordaria a lista quente. */
  const RUA_Z0 = -20, RUA_Z1 = 24, RUA_D = RUA_Z1 - RUA_Z0, RUA_ZC = (RUA_Z0 + RUA_Z1) / 2;
  addFloor(14, RUA_D, 0, RUA_ZC, MAT.asphalt);
  for (const sx of [-1, 1]) {
    addFloor(5.5, RUA_D, sx * 9.75, RUA_ZC, MAT.concrete, 0.02);
    addBox(0.22, 0.14, RUA_D, MAT.concreteDark, sx * 7.11, 0, RUA_ZC, { collide: false, cast: false });
  }
  // faixa de pedestre nas duas bocas da rua (praça e travessa) — leitura de "rua de verdade"
  const faixaMat = new THREE.MeshStandardMaterial({ color: 0xd8d4c8, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 });
  for (const fz of [-18.5, 22.5]) for (let i = -3; i <= 3; i++) addFloor(0.8, 3.2, i * 1.9, fz, faixaMat, 0.012);

  /* POSTES DE LUZ com braço e fiação aparente — o poste é o prop mais barato que existe
     (2 caixas) e é cover DE PÉ: 0,22 m de largura não esconde ninguém, mas quebra a linha
     de tiro do corredor reto, que é o defeito nº 1 de rua comprida. */
  const posteMat = lam({ color: 0x8f8b84, roughness: 0.7 });
  const POSTES = [];
  for (let pz = -16; pz <= 22; pz += 9.5) POSTES.push([-12.1, pz], [12.1, pz + 4.75]);
  for (const [px, pz] of POSTES) {
    addBox(0.24, 6.4, 0.24, posteMat, px, 0, pz);
    addBox(1.5, 0.14, 0.16, posteMat, px + (px < 0 ? 0.75 : -0.75), 6.2, pz, { collide: false, cast: false });
    addBox(0.5, 0.16, 0.3, lam({ color: 0xcfc9b4, emissive: 0x2a2418 }), px + (px < 0 ? 1.4 : -1.4), 6.05, pz, { collide: false, cast: false });
  }

  // ===== ground height: o mapa é PLANO (nenhum degrau, nenhum mezanino) =====
  const groundHeightAt = () => 0;

  // ===== waypoints + A* (grade 3,4 m, o mesmo passo dos outros mapas) =====
  const nodes = [], adj = [], STEP = 3.4;
  const insideSolid = (x, z, inf) => { for (const s of solids) if (x > s.x0 - inf && x < s.x1 + inf && z > s.z0 - inf && z < s.z1 + inf) return true; return false; };
  const blocked = (x, z, inf) => {
    if (insideSolid(x, z, inf)) return true;
    for (const c of colliders) if (x > c.minX - inf && x < c.maxX + inf && z > c.minZ - inf && z < c.maxZ + inf && c.minY < 1.6 && c.maxY > 0.15) return true;
    return false;
  };
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
    g[fromIdx] = 0; f[fromIdx] = _D(fromIdx, toIdx); open[fromIdx] = 1; let oc = 1;
    while (oc > 0) {
      let cur = -1, bf = Infinity; for (let i = 0; i < n; i++) if (open[i] && f[i] < bf) { bf = f[i]; cur = i; } if (cur === -1) break;
      if (cur === toIdx) { const p = [cur]; let c = prev[cur]; while (c !== -1) { p.unshift(c); c = prev[c]; } return p; }
      open[cur] = 0; oc--;
      for (const m of adj[cur]) { const t = g[cur] + _D(cur, m); if (t < g[m]) { prev[m] = cur; g[m] = t; f[m] = t + _D(m, toIdx); if (!open[m]) { open[m] = 1; oc++; } } }
    }
    return [fromIdx];
  }

  // spawns: P na VILA DO BAILE (norte, olhando pra praça → yaw π/2); B no CAMPINHO (sul,
  // olhando pra rua → yaw π). Convenção do game.js: forward = (-sin yaw, -cos yaw).
  const spawns = {
    P: [-23, -20.5, -18, -15.5].map(x => ({ x, z: -42.5, yaw: Math.PI / 2 })),
    B: [-4.5, -1.5, 1.5, 4.5].map(x => ({ x, z: 41.5, yaw: Math.PI })),
  };

  SKIRT.build(root);
  return {
    root, colliders, occluders, groundHeightAt, spawns, sun, hemi, pickups,
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    bounds: { minX: -HALF_X + 0.5, maxX: HALF_X - 0.5, minZ: -HALF_Z + 0.5, maxZ: HALF_Z - 0.5 },
  };
}
