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

  /* ===================== BARRACO — a unidade construtiva do mapa =====================
     O dono pediu "as casas seriam de barraco a maioria". Barraco é caixa e plano: laje
     inacabada, 2º pavimento MENOR e deslocado (a silhueta em escada que faz uma favela ler
     como favela), caixa d'água em cima.
     DUAS DECISÕES DE COLISÃO, cada uma com o número que a justifica:
     (a) o módulo é SÓLIDO (uma caixa, um colisor) e não uma casca de 4 paredes. Nenhum
         interior é acessível neste mapa, então casca só multiplicaria colisor — e a lista de
         colisores é caminho quente (`_collide` varre TODOS a cada passo do jogador, do bot e
         de cada célula do flood-fill das réguas: ~85 mil células por mapa).
     (b) o módulo tem no MÁXIMO ~6 m de frente, então a pegada fica ≤ 8,5 × 6 = 51 m², abaixo
         do teto de 60 m² com que a MAP5 distingue "peça de cobertura" de "estrutura". Um
         quarteirão inteiro numa caixa só sairia da conta de densidade e o quadrante
         apareceria DESERTO tendo prédio em cima — régua mentindo por causa da geometria.
     A laje e o 2º pavimento ficam com colisor (minY ≥ 2,7 m, acima do 1,5 m que o `_collide`
     testa: não bloqueiam o andar) porque colisor é o que a BALA usa — laje sem colisor é
     telhado que o tiro atravessa. */
  const CORES_BARRACO = [0xb9ab96, 0x9d7f63, 0xa8b4ad, 0xc4b58c, 0x8e8378, 0xb08a76, 0x9aa7b0, 0xc9c0ae];
  const MAT_BARRACO = CORES_BARRACO.map((c) => lam({ map: T.concrete, color: c, roughness: 0.97 }));
  const MAT_LAJE = lam({ map: T.concreteDark, color: 0xa39c90, roughness: 0.95 });
  const MAT_CXDAGUA = lam({ color: 0x2f5fa0, roughness: 0.5 });
  // hash de avalanche (mesma razão do ferro velho: `i % n` com passo divisível cai sempre no
  // mesmo balde e o quarteirão inteiro sai da MESMA cor/altura — o "chapado" do BAR §4.4)
  const mix32 = (n) => { let v = (n * 2654435761) >>> 0; v ^= v >>> 15; v = Math.imul(v, 2246822519) >>> 0; v ^= v >>> 13; v = Math.imul(v, 3266489917) >>> 0; return (v ^ (v >>> 16)) >>> 0; };
  let _bi = 0;
  function barraco(x0, x1, z0, z1, o = {}) {
    const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const k = mix32(++_bi + (o.seed || 0));
    const h = o.h || (2.7 + (k % 5) * 0.42);
    solids.push({ x0, x1, z0, z1 });
    addBox(w, h, d, o.mat || MAT_BARRACO[k % MAT_BARRACO.length], cx, 0, cz);
    addBox(w + 0.44, 0.18, d + 0.44, MAT_LAJE, cx, h, cz);                       // laje com beiral
    if (o.up !== false && (k >> 3) % 3 !== 0) {                                   // 2º pavimento parcial
      const uh = 2.3 + ((k >> 5) % 4) * 0.3, uw = w * 0.68, ud = d * 0.74;
      const ox = ((k >> 7) % 3 - 1) * (w - uw) * 0.4, oz = ((k >> 9) % 3 - 1) * (d - ud) * 0.4;
      addBox(uw, uh, ud, MAT_BARRACO[(k >> 11) % MAT_BARRACO.length], cx + ox, h + 0.18, cz + oz);
      addBox(uw + 0.36, 0.16, ud + 0.36, MAT_LAJE, cx + ox, h + 0.18 + uh, cz + oz);
      if ((k >> 13) % 2) addBox(1.0, 1.0, 1.0, MAT_CXDAGUA, cx + ox + uw * 0.28, h + 0.34 + uh, cz + oz, { collide: false });
    } else if ((k >> 4) % 2) addBox(1.0, 1.0, 1.0, MAT_CXDAGUA, cx + w * 0.25, h + 0.18, cz, { collide: false });
    return { cx, cz, h, w, d };
  }
  /* QUARTEIRÃO: fatia um lote comprido em módulos de ~5,6 m. É o que impede o "mesmo módulo
     repetido" e o que mantém cada pegada abaixo do teto de 60 m² da MAP5. */
  function quarteirao(x0, x1, z0, z1, seed = 0) {
    const dx = x1 - x0, dz = z1 - z0;
    if (dz >= dx) { const n = Math.max(1, Math.round(dz / 5.6)); for (let i = 0; i < n; i++) barraco(x0, x1, z0 + dz * i / n, z0 + dz * (i + 1) / n, { seed: seed + i * 17 }); }
    else { const n = Math.max(1, Math.round(dx / 5.6)); for (let i = 0; i < n; i++) barraco(x0 + dx * i / n, x0 + dx * (i + 1) / n, z0, z1, { seed: seed + i * 23 }); }
  }

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

  /* ===================== QUARTEIRÕES, VIELAS E BECOS =====================
     Os vãos que NÃO recebem barraco são a malha de circulação, e ela é o coração da CTF2:
       VIELA OESTE  x ∈ [-25,-21], z ∈ [-38, 28]  (nasce na vila do baile, morre na travessa)
       VIELA LESTE  x ∈ [ 21, 25], z ∈ [-40, 28]  (nasce na passagem leste da praça)
       BECOS oeste  z ∈ [-12,-9] · [1,4] · [15,18]   (atravessam o bloco x ∈ [-21,-12,5])
       BECOS leste  z ∈ [-5,-2] · [9,12] · [19,22]   (atravessam o bloco x ∈ [12,5, 21])
     Os becos dos dois lados são DESENCONTRADOS de propósito (nenhum par no mesmo z): beco
     alinhado com beco vira uma travessa reta que atravessa a rua inteira — outra linha de
     tiro de ponta a ponta, exatamente o que este mapa não pode ter. Desencontrados, quem sai
     de um beco cai na calçada oposta sem ninguém já mirando o vão.
     Separação medida: eixo da rua x = 0 contra eixo da viela x = ∓23 → 23 m, quase 4× o
     mínimo de 6 m da CTF2. */
  quarteirao(-28, -25, -46.5, 28, 101);          // fundo oeste (fecha o mapa atrás da viela)
  quarteirao(25, 28, -46.5, 28, 211);            // fundo leste
  quarteirao(-12.5, 21, -46.5, -43, 251);        // perímetro norte da praça
  quarteirao(-25, -12.5, -46.5, -45, 271);       // fundo da vila do baile (atrás do spawn P)
  quarteirao(21, 25, -46.5, -40, 281);           // tampa norte da viela leste
  // bloco OESTE — 4 lotes, 3 becos
  quarteirao(-21, -12.5, -38, -12, 301);
  quarteirao(-21, -12.5, -9, 1, 311);
  quarteirao(-21, -12.5, 4, 15, 321);
  quarteirao(-21, -12.5, 18, 24, 331);
  // bloco LESTE — 5 lotes, 3 becos + a passagem da praça pra viela leste (z ∈ [-40,-36])
  quarteirao(12.5, 21, -43, -40, 401);
  quarteirao(12.5, 21, -36, -5, 411);
  quarteirao(12.5, 21, -2, 9, 421);
  quarteirao(12.5, 21, 12, 19, 431);
  quarteirao(12.5, 21, 22, 24, 441);
  // fundos do campinho
  quarteirao(-28, -22, 28, 46.5, 501);
  quarteirao(22, 28, 28, 46.5, 551);
  /* MURO DA VILA — anteparo solto de 6 m no meio do pátio do spawn P, NÃO uma parede que o
     fecha. A diferença é a MAP2B: emparedar o respawn zera a exposição e reprova do outro
     lado (folga ≥ 1,20 m e ≥ 40 m² de chão CONTÍGUO num raio de 5 m — foi assim que a fresta
     do depósito da Havan passou verde e ficou péssima). Solto, ele corta a visada direta da
     praça pros slots e ainda deixa contornar pelos dois lados. */
  addBox(6, 2.4, 0.35, lam({ map: T.concrete, color: 0x9c9488 }), -16, 0, -40);

  /* ===================== A ROTUNDA DO BAILE =====================
     "uma rotunda no final onde teria 2 carros tunados e caixas de som". A praça é o largo
     x ∈ [-12,5, 12,5] × z ∈ [-43,-20] com a ilha da rotunda no meio. O meio-fio da ilha tem
     0,16 m — abaixo do degrau de 0,30 m do `_collide` — então a ilha é PISÁVEL e o baile
     acontece em cima dela; quem dá cobertura ali são os carros e o paredão, que são
     colisores de verdade. */
  addFloor(25, 23, 0, -31.5, MAT.asphalt);
  {
    const ilha = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.9, 0.16, 24), MAT.concreteDark);
    ilha.position.set(0, 0.08, -31.5); ilha.receiveShadow = true; root.add(ilha);
  }

  /* CARRO TUNADO e CAIXA DE SOM são PROCEDURAIS (caixa e plano, como o resto do mapa).
     ANOTADO NO RELATÓRIO: os dois são candidatos naturais a GLB depois — nenhum dos 99 props
     de public/models/props é um carro rebaixado de som nem uma torre de caixas.
     COLISÃO — BUG-21: o carro fica em ÂNGULO com o eixo (é o que faz a roda ler como "parou
     de qualquer jeito no meio da rotunda"), e o motor não tem collider rotacionado. Cada
     peça girada vai com `collide:false` + `colRot`, e a malha é empurrada À MÃO pra
     `occluders` — senão a bala atravessa o carro (occluder é o que a bala testa, não o
     colisor). */
  const occ = (m) => { occluders.push(m); return m; };
  const MAT_PNEU = lam({ color: 0x1c1e22, roughness: 0.9 });
  const MAT_VIDRO = lam({ color: 0x1b2430, roughness: 0.22, metalness: 0.4 });
  function carroTunado(cx, cz, ry, cor) {
    const pint = lam({ color: cor, roughness: 0.28, metalness: 0.55, envMapIntensity: 1.6 });
    occ(addBox(4.4, 0.62, 1.82, pint, cx, 0.28, cz, { ry, collide: false }));        // lataria rebaixada
    occ(addBox(2.3, 0.58, 1.66, MAT_VIDRO, cx, 0.90, cz, { ry, collide: false }));   // cabine/vidros
    occ(addBox(2.1, 0.10, 1.70, pint, cx, 1.48, cz, { ry, collide: false }));        // teto
    occ(addBox(1.1, 0.34, 1.30, pint, cx - Math.sin(ry) * 1.9, 0.90, cz - Math.cos(ry) * 1.9, { ry, collide: false })); // aerofólio/mala
    for (const [lx, lz] of [[1.5, 0.85], [1.5, -0.85], [-1.5, 0.85], [-1.5, -0.85]]) {
      const wx = cx + lx * Math.cos(ry) + lz * Math.sin(ry), wz = cz - lx * Math.sin(ry) + lz * Math.cos(ry);
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.24, 12), MAT_PNEU);
      r.rotation.set(Math.PI / 2, 0, ry); r.position.set(wx, 0.30, wz); r.castShadow = true; root.add(r);
    }
    colRot(cx, cz, 4.4, 1.82, 0, 1.55, ry, 6, 3);   // grade 6×3 no espaço local (BUG-21)
  }
  /* PAREDÃO: torre de caixas empilhadas. GLB `caixa_som` quando carrega, caixa preta com
     cone quando não (e em node NUNCA carrega, então o fallback é o que as réguas medem). */
  const MAT_CAIXA = lam({ color: 0x17171a, roughness: 0.72 });
  const MAT_CONE = lam({ color: 0x6b6257, roughness: 0.85 });
  function paredao(cx, cz, ry, n = 3) {
    for (let i = 0; i < n; i++) {
      const y = i * 1.05;
      if (!gprop('caixa_som', cx, cz, 1.05, ry)) {
        addBox(1.0, 1.0, 0.72, MAT_CAIXA, cx, y, cz, { ry, collide: false });
        occ(addBox(0.62, 0.62, 0.06, MAT_CONE, cx + Math.sin(ry) * 0.38, y + 0.19, cz + Math.cos(ry) * 0.38, { ry, collide: false, cast: false }));
      }
    }
    colRot(cx, cz, 1.0, 0.72, 0, n * 1.05, ry, 2, 2);
  }
  carroTunado(-4.5, -33.5, 0.82, 0xd8232a);     // rebaixado vermelho, atravessado na ilha
  carroTunado(-1.2, -27.6, -0.55, 0x1f66c4);    // azul-elétrico
  paredao(2.4, -35.2, 0.35, 3);
  paredao(-6.8, -28.6, -0.9, 2);
  paredao(4.6, -35.9, 0.35, 2);

  /* ===================== O CAMPINHO DE TERRA (respawn do time B) =====================
     "do outro lado no final da rua seria um campinho de terra de futebol onde seria o
     respawn do outro time". Terra batida x ∈ [-22,22] × z ∈ [28,46], travessa de 4 m ligando
     rua + as duas vielas ao campo.
     O MURO DE 2,2 m NA BOCA DO CAMPO (z = 28) É O QUE SALVA O RESPAWN. Sem ele o campinho é
     um descampado de 18 m no fim de uma rua reta de 44 m: qualquer ponto da rua tem visada
     limpa até quem nasce, que é exatamente o "respawn visível de fora" que a MAP2 mede. O
     muro é maciço em x ∈ [-9,9] — bem em cima do eixo da rua — e abre em DOIS portões
     (x ∈ [-15,-9] e [9,15]). Dois portões, não um: além de cortar a visada do eixo, eles
     dão as duas entradas separadas por 24 m que a CTF2 cobra na bandeira do campinho. */
  addFloor(44, 18, 0, 37, MAT.dirt);
  addFloor(50, 4, 0, 26, MAT.concreteDark, 0.015);              // travessa (asfalto gasto)
  {   // linhas de cal (só pintura — nada de colisor)
    const cal = new THREE.MeshStandardMaterial({ color: 0xd9d3c4, roughness: 0.95, transparent: true, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -2 });
    for (const lz of [29.5, 44.5]) addFloor(30, 0.22, 0, lz, cal, 0.02);
    for (const lx of [-15, 15]) addFloor(0.22, 15, lx, 37, cal, 0.02);
    const circ = new THREE.Mesh(new THREE.RingGeometry(4.3, 4.55, 32), cal);
    circ.rotation.x = -Math.PI / 2; circ.position.set(0, 0.02, 37); root.add(circ);
  }
  const MAT_MURO = lam({ map: T.concrete, color: 0x9a9184, roughness: 0.97 });
  for (const [mx0, mx1] of [[-22, -15], [-9, 9], [15, 22]])
    addBox(mx1 - mx0, 2.2, 0.34, MAT_MURO, (mx0 + mx1) / 2, 0, 28);
  // TRAVES — dois postes e um travessão por gol. O poste é fino (0,14 m) e não esconde
  // ninguém, mas é peça de cobertura pra MAP5 e referência de leitura do campo.
  const MAT_TRAVE = lam({ color: 0xe6e2d6, roughness: 0.8 });
  for (const gz of [29.9, 44.1]) {
    for (const gx of [-2.6, 2.6]) addBox(0.16, 2.2, 0.16, MAT_TRAVE, gx, 0, gz);
    addBox(5.36, 0.16, 0.16, MAT_TRAVE, 0, 2.2, gz, { collide: false });
  }
  /* ALAMBRADO PARCIAL nas laterais: mourões a cada 4 m com painel de tela. A tela é
     `collide:false` de propósito — o campo tem que continuar ligado às margens (é de lá que
     sai a 2ª rota pra bandeira do campinho); quem conta como cover são os mourões. */
  const MAT_TELA = new THREE.MeshStandardMaterial({ color: 0x6e7a6a, roughness: 0.9, transparent: true, opacity: 0.32, side: THREE.DoubleSide });
  for (const sx of [-16.4, 16.4]) for (let mz = 30; mz <= 46; mz += 4) {
    addBox(0.16, 2.6, 0.16, posteMat, sx, 0, mz);
    if (mz < 46) { const t = addBox(0.05, 2.4, 4, MAT_TELA, sx, 0, mz + 2, { collide: false, cast: false }); t.receiveShadow = false; }
  }
  // arquibancada da margem oeste (GLB do Mint quando carrega; degraus de concreto quando não)
  if (!gprop('arquibancada', -19.4, 36, 2.4, Math.PI / 2))
    for (let i = 0; i < 3; i++) addBox(3.2 - i * 0.9, 0.5 + i * 0.5, 9, MAT.concreteDark, -20.6 + i * 1.05, 0, 36);
  // pilhas de pneu marcando o encostado do campo + um par de barracas na margem leste
  for (const [tx, tz] of [[-13, 32.5], [13, 41], [-8, 45], [18.6, 33]])
    if (!gprop('pilha_pneus', tx, tz, 1.1)) addBox(1.4, 1.1, 1.4, MAT_PNEU, tx, 0, tz);
  for (const [sx2, sz2] of [[19, 39.5], [-19.4, 43.5]])
    if (!gprop('stall', sx2, sz2, 2.3)) addBox(2.4, 2.3, 2.0, MAT_BARRACO[3], sx2, 0, sz2);
  for (const [px2, pz2] of [[-16.9, 31], [16.9, 43]]) {   // refletor de campo de várzea
    addBox(0.26, 7.2, 0.26, posteMat, px2, 0, pz2);
    addBox(1.2, 0.5, 0.22, lam({ color: 0xcfc9b4 }), px2 + (px2 < 0 ? 0.6 : -0.6), 6.8, pz2, { collide: false, cast: false });
  }

  /* ===================== COMÉRCIO =====================
     A lista é literal do dono: açaí, sorveteria, móveis/eletrônicos, ADEGA ("principalmente")
     e lanchonete. O que identifica comércio de quebrada não é a loja: é a PLACA PINTADA À MÃO
     e o TOLDO. Letreiramento vernacular brasileiro tem baseline irregular, letra que aperta no
     fim da linha e espacejamento desigual — fonte digital limpa e centralizada lê como praça
     de alimentação de shopping. Por isso cada letra é desenhada com jitter próprio. */
  function placaTex(txt, bg, fg) {
    const W = 512, H = 128, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    let seed = 1337 + txt.length * 97; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { x.globalAlpha = 0.05 + rnd() * 0.1; x.fillStyle = rnd() > 0.5 ? '#ffffff' : '#000000'; x.fillRect(rnd() * W, rnd() * H, 30 + rnd() * 160, 3 + rnd() * 8); }
    x.globalAlpha = 1;
    const size = 74; x.font = `900 ${size}px "Arial Black",Impact,sans-serif`;
    const wch = [...txt].map((ch) => x.measureText(ch).width * 0.8);
    const total = wch.reduce((a, b) => a + b, 0), sx = Math.min(1, (W - 40) / total);
    let px = 20 + (W - 40 - total * sx) / 2;
    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i];
      if (ch !== ' ') {
        x.save(); x.translate(px, H * 0.74 + (rnd() - 0.5) * size * 0.13); x.rotate((rnd() - 0.5) * 0.08);
        x.transform(sx * 0.8, 0, -0.13, 0.92 + rnd() * 0.18, 0, 0);
        x.lineWidth = size * 0.1; x.strokeStyle = '#120c08'; x.strokeText(ch, 0, 0);
        x.fillStyle = fg; x.fillText(ch, 0, 0); x.restore();
      }
      px += wch[i] * sx;
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  /* FACHADA DE COMÉRCIO: banda de placa + toldo + porta/vitrine. Tudo `collide:false` — o
     barraco atrás já tem o colisor, e duplicar aqui só engordaria a lista quente. O toldo
     fica a 2,5 m: acima do 1,5 m que o `_collide` testa, então nem se fosse colisor
     estorvaria alguém. */
  const TOLDO = [0xb8322c, 0x1f7a4c, 0xd7a021, 0x2c5aa8, 0xa2481f];
  function comercio(side, z0, z1, txt, bgHex, bgCss, fgCss) {
    const fx = side * 12.5, d = z1 - z0, cz = (z0 + z1) / 2, out = side * 0.06;
    const placa = new THREE.MeshStandardMaterial({ map: placaTex(txt, bgCss, fgCss), roughness: 0.85 });
    addBox(0.12, 0.95, d * 0.94, placa, fx + out, 2.62, cz, { collide: false, cast: false });
    addBox(1.5, 0.1, d * 0.9, lam({ color: bgHex, roughness: 0.8 }), fx - side * 0.75, 2.5, cz, { collide: false });
    addBox(0.1, 2.1, d * 0.42, lam({ color: 0x2b2926, roughness: 0.6, metalness: 0.3 }), fx + out, 0, cz, { collide: false, cast: false });   // porta de aço
    addBox(0.1, 1.3, d * 0.34, MAT_VIDRO, fx + out, 0.85, cz + d * 0.3, { collide: false, cast: false });                                     // vitrine
  }
  comercio(-1, -25, -19.5, 'ADEGA DO ZÉ', 0xb8322c, '#b8322c', '#f4ecd6');
  comercio(-1, -7.5, -3, 'AÇAÍ DA JU', 0x5b2a8a, '#5b2a8a', '#e8d94a');
  comercio(-1, 5.5, 10, 'SORVETERIA', 0x1f7a4c, '#1f7a4c', '#f6f2e2');
  comercio(-1, 10.8, 14.5, 'MÓVEIS E ELETRO', 0xd7a021, '#d7a021', '#241a10');
  comercio(1, -30, -25, 'ELETRÔNICOS ZL', 0x2c5aa8, '#2c5aa8', '#f2f0e6');
  comercio(1, -1.5, 2.5, 'LANCHONETE', 0xa2481f, '#a2481f', '#f4ecd6');
  comercio(1, 3.5, 8.5, 'BAR DO CANTO', 0x1f7a4c, '#1f7a4c', '#f6f2e2');

  /* ===================== BAR DE ESQUINA COM MESA NA CALÇADA =====================
     "um bar bem brasileiro com cadeiras de plástico na calçada". Mesa e cadeira de monobloco
     branco são cover BAIXO: 0,75 m de tampo e 0,85 m de encosto. Vale a pena serem colisores
     (o `_collide` bloqueia tudo com maxY > 0,30) porque cover baixo é o que falta numa
     calçada — quem se agacha atrás de uma mesa some, e o corredor deixa de ser corrida limpa.
     A FAIXA z ∈ [4,5 , 7,5] FICA VAZIA DE PROPÓSITO: é onde mora a bandeira do bar, e anel de
     captura com mesa dentro vira anel que ninguém pisa. */
  const MAT_PLAST = lam({ color: 0xe9e6dc, roughness: 0.55 });
  function mesaBar(mx, mz) {
    addBox(0.86, 0.72, 0.86, MAT_PLAST, mx, 0, mz, { cast: true });
    for (const [dx, dz] of [[0.78, 0], [-0.78, 0], [0, 0.78], [0, -0.78]]) {
      addBox(0.44, 0.44, 0.44, MAT_PLAST, mx + dx, 0, mz + dz);                        // assento
      addBox(0.44, 0.46, 0.08, MAT_PLAST, mx + dx, 0.44, mz + dz + (dz > 0 ? 0.18 : -0.18), { collide: false, cast: false });
    }
  }
  mesaBar(9.6, 2.2); mesaBar(9.6, 9.0); mesaBar(11.2, 10.6);
  // engradado de cerveja empilhado e churrasqueira na porta do bar (leitura + cover)
  const MAT_ENGRADADO = lam({ color: 0xc4302b, roughness: 0.8 });
  for (let i = 0; i < 4; i++) addBox(0.5, 0.3, 0.36, MAT_ENGRADADO, 12.0, i * 0.3, 4.0, { collide: i === 0 });
  if (!gprop('churrasqueira', 11.9, 7.6, 1.1)) addBox(1.2, 1.1, 0.8, MAT.concreteDark, 11.9, 0, 7.6);
  // guarda-sol de cerveja: só silhueta, sem colisor (fica a 2,1 m)
  for (const [ux, uz] of [[9.6, 2.2], [9.6, 9.0]]) {
    addBox(0.09, 2.1, 0.09, posteMat, ux, 0.72, uz, { collide: false, cast: false });
    addBox(2.9, 0.12, 2.9, lam({ color: 0xd8262a, roughness: 0.8 }), ux, 2.74, uz, { collide: false });
  }

  /* ===================== ÔNIBUS PARADO + PONTO =====================
     "teria um ônibus parado com ponto de ônibus".
     O ÔNIBUS É DE SÃO PAULO: BRANCO COM FAIXA VERMELHA (padrão SPTrans). NÃO é o Amarelinho
     amarelo do DF que mora no map_brasilia.js — este mapa é quebrada paulistana, e o GLB
     `bus` de lá é o carro do Distrito Federal. Aqui a carroceria é feita de FAIXAS
     horizontais de caixa (branco / vermelho / branco / vidro / branco): sai a leitura certa
     sem depender de GLB nenhum, e como não há textura de lateral não há o problema de a
     mesma arte aparecer esticada na traseira.
     COLISÃO — a decisão que evita o BUG-21 na origem: o ônibus fica PARALELO À GUIA, ou seja,
     ALINHADO AOS EIXOS. Prop girado exige `colRot` (grade no espaço local) porque o motor não
     tem collider rotacionado — no ônibus da Brasília, a 0,55 rad, a caixa única deixou 2,33 m
     de parede invisível. Alinhado, UMA AABB é exata: erro zero, um colisor só. Ônibus
     estacionado de banda pra guia não existe no mundo real e custaria 18 colisores aqui.
     Por isso as faixas vão com `collide:false` + occluder à mão, e a colisão é um `col` só. */
  {
    const BX = -5.6, BZ = -6, BW = 2.55, BL = 12.4;
    const branco = lam({ color: 0xf2f0ec, roughness: 0.45, metalness: 0.15 });
    const vermelho = lam({ color: 0xc4161c, roughness: 0.42, metalness: 0.15 });
    const vidro = lam({ color: 0x20303c, roughness: 0.18, metalness: 0.5 });
    const preto = lam({ color: 0x1a1c1f, roughness: 0.8 });
    //           w    h     d       mat        y-base
    const faixas = [
      [BW, 0.55, BL - 0.5, preto, 0.30],       // saia inferior / chassi
      [BW, 0.62, BL, branco, 0.85],
      [BW, 0.34, BL, vermelho, 1.47],          // A faixa vermelha do SPTrans
      [BW, 0.22, BL, branco, 1.81],
      [BW, 0.78, BL - 0.3, vidro, 2.03],       // janelas
      [BW, 0.28, BL - 0.2, branco, 2.81],      // friso do teto
    ];
    for (const [w, h, d, m, y] of faixas) occ(addBox(w, h, d, m, BX, y, BZ, { collide: false }));
    occ(addBox(BW - 0.1, 0.16, BW - 0.1, branco, BX, 3.09, BZ - BL / 2 + 1.4, { collide: false, cast: false }));
    for (const wz of [BL / 2 - 2.0, -BL / 2 + 2.6, -BL / 2 + 4.0]) for (const sx of [-1, 1]) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.3, 14), MAT_PNEU);
      r.rotation.set(Math.PI / 2, 0, Math.PI / 2); r.position.set(BX + sx * (BW / 2 - 0.12), 0.46, BZ + wz);
      r.castShadow = true; root.add(r);
    }
    col(BX - BW / 2, BX + BW / 2, 0, 3.1, BZ - BL / 2, BZ + BL / 2);   // AABB EXATA (alinhado)
  }
  /* PONTO DE ÔNIBUS — abrigo de calçada. O teto fica a 2,4 m (acima do 1,5 m que o `_collide`
     testa: não estorva ninguém) e o banco a 0,45 m entra como cover baixo. A bandeira do
     ponto mora em (-10,-6), 1,0 m livre do banco: o anel de captura tem que ser PISÁVEL. */
  {
    const teto = lam({ color: 0x2f6f8a, roughness: 0.6, metalness: 0.25 });
    addBox(0.16, 2.05, 8.0, MAT_VIDRO, -11.85, 0, -6, { collide: false });          // costas de vidro
    for (const pz of [-9.7, -2.3]) for (const px of [-11.85, -8.7]) addBox(0.14, 2.4, 0.14, posteMat, px, 0, pz);
    addBox(3.5, 0.14, 8.4, teto, -10.3, 2.4, -6, { collide: false });
    addBox(0.55, 0.12, 6.2, lam({ color: 0x6b5a44, roughness: 0.9 }), -11.35, 0.45, -6);   // banco de madeira
    addBox(0.5, 2.6, 0.5, lam({ map: placaTex('8022', '#1c4f8a', '#f4ecd6'), roughness: 0.8 }), -8.2, 0, -1.4);   // totem da linha
  }

  /* ===================== BARRICADAS =====================
     "barricadas na rua". Elas não são enfeite nem só tema: uma rua reta de 44 m com 14 m de
     largura é uma linha de tiro contínua, e o que quebra linha de tiro sem fechar passagem é
     obstáculo ALTERNADO — barricada encostada num lado, a próxima no outro, formando chicane.
     Assim o corredor continua andável de ponta a ponta (a CTF2 precisa dele) mas ninguém
     enxerga da praça até o campinho de uma vez só.
     As peças ficam ALINHADAS AOS EIXOS pela mesma razão do ônibus: AABB alinhada é exata e a
     girada precisaria de `colRot` (o motor não tem collider rotacionado — BUG-21). Quando o
     ângulo importa pra leitura, é a MALHA que gira e o `colRot` acompanha. */
  const MAT_MADEIRA = lam({ color: 0x8a6a44, roughness: 0.95 });
  const MAT_TAMBOR = lam({ color: 0xb4542a, roughness: 0.85, metalness: 0.3 });
  function barricada(cx, cz, larg, ry) {
    if (ry) {
      occ(addBox(larg, 1.05, 0.7, MAT_MADEIRA, cx, 0, cz, { ry, collide: false }));
      colRot(cx, cz, larg, 0.7, 0, 1.05, ry, 4, 2);
    } else addBox(larg, 1.05, 0.7, MAT_MADEIRA, cx, 0, cz);
    for (let i = 0; i < 3; i++) {
      const tx = cx - larg / 2 + 0.5 + i * (larg - 1) / 2;
      if (!gprop('tires', tx, cz + 1.0, 0.72)) addBox(1.1, 0.72, 1.1, MAT_PNEU, tx, 0, cz + 1.0);
    }
    addBox(0.62, 0.92, 0.62, MAT_TAMBOR, cx + larg / 2 + 0.6, 0, cz);
  }
  barricada(-4.2, -14.0, 5.0, 0.22);     // encosta no lado oeste
  barricada(4.6, -2.5, 4.6, -0.18);      // devolve pro leste
  barricada(-3.6, 9.0, 4.4, 0.15);
  barricada(4.0, 18.5, 5.2, -0.24);
  /* CACAMBA, ENTULHO E VARAL nas vielas e becos. As vielas são corredores de 4 m: sem nada
     dentro elas viram tubos, e o quadrante inteiro aparece DESERTO na MAP5 (o teto é
     espaçamento médio ≤ 7,0 m entre peças de cobertura, = duas arestas do grafo de 3,4 m). */
  const MAT_CACAMBA = lam({ color: 0x5e6a52, roughness: 0.85, metalness: 0.25 });
  for (const [cx, cz] of [[-23, -30], [-23, -6], [-23, 12], [23, -26], [23, 2], [23, 20]])
    if (!gprop('dumpster', cx, cz, 1.35)) addBox(1.9, 1.35, 2.6, MAT_CACAMBA, cx, 0, cz);
  for (const [cx, cz] of [[-22.4, -18], [-23.6, 3], [-22.6, 22], [22.4, -12], [23.6, 10], [22.5, -34]])
    addBox(1.0, 1.0, 1.0, MAT_BARRACO[5], cx, 0, cz);   // pilha de tijolo/sacaria
  for (const [bx, bz] of [[-16.6, -10.5], [-16.6, 2.5], [-16.6, 16.5], [16.6, -3.5], [16.6, 10.5], [16.6, 20.5]])
    addBox(1.15, 1.15, 1.15, MAT_BARRACO[1], bx, 0, bz);   // entulho no miolo de cada beco
  // varais entre os barracos — só silhueta, a 2,6 m e sem colisor
  const MAT_ROUPA = new THREE.MeshStandardMaterial({ color: 0xd7cfc0, roughness: 0.95, side: THREE.DoubleSide });
  for (const [vx, vz] of [[-23, -22], [-23, 8], [23, -18], [23, 14], [-16.6, 6], [16.6, 15]])
    for (let i = 0; i < 4; i++) addBox(0.5, 0.62, 0.03, MAT_ROUPA, vx - 0.9 + i * 0.6, 2.0, vz, { collide: false, cast: false });
  // camelô e caçamba na praça (o largo é grande: sem peça no meio ele vira arena de sniper)
  for (const [sx2, sz2, ry2] of [[-9.4, -24.5, 0.3], [9.6, -25.5, -0.4], [-9.8, -39, 0.5], [9.4, -38.5, -0.5]])
    if (!gprop('tent', sx2, sz2, 2.4, ry2)) { occ(addBox(3.0, 2.4, 2.4, MAT_BARRACO[2], sx2, 0, sz2, { ry: ry2, collide: false })); colRot(sx2, sz2, 3.0, 2.4, 0, 2.4, ry2, 3, 2); }
  if (!gprop('kombi', -7.5, -21.5, 2.0, 0.1)) addBox(2.0, 2.0, 4.6, MAT_BARRACO[6], -7.5, 0, -21.5);

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
  /* ADENSAMENTO — sem ele o mapa NÃO FUNCIONA, e o motivo é aritmético: a grade nasce em
     x = -HALF_X + 2 com passo 3,4 m, então as colunas caem em x = -26, -22,6, -19,2, -15,8,
     -12,4 … NENHUMA delas cai dentro da viela oeste (x ∈ [-25,-21], centro -23) com folga de
     0,5 m para as duas paredes. Uma viela sem nó é uma viela que o A* não conhece: os bots
     nunca a usam, a CTF2 volta a achar 1 rota só e as duas alternativas ao corredor central
     — o ponto inteiro do desenho deste mapa — desaparecem do jogo sem aparecer em nada.
     Por isso cada corredor estreito ganha uma FILEIRA declarada, com inflação menor (0,35 m:
     ainda maior que o raio do corpo, 0,38 m é o corpo, então nó em fileira é nó em chão que
     cabe gente). Mesma técnica do map_havan.js (rampa e depósito). */
  const linha = (x0, z0, x1, z1, passo = 2.4, inf = 0.35) => {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / passo));
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n; if (!blocked(x, z, inf)) nodes.push({ x, z }); }
  };
  linha(-23, -36.5, -23, 27);                   // viela oeste inteira
  linha(23, -38.5, 23, 27);                     // viela leste inteira
  for (const bz of [-10.5, 2.5, 16.5]) linha(-20.6, bz, -12.8, bz);   // becos oeste
  for (const bz of [-3.5, 10.5, 20.5]) linha(12.8, bz, 20.6, bz);     // becos leste
  linha(13, -38, 24, -38);                      // passagem praça -> viela leste
  linha(-24.5, 26, 24.5, 26, 2.6);              // travessa do campinho
  for (const gx of [-12, 12]) linha(gx, 26.5, gx, 31, 2.0);           // os dois portões do muro
  for (let vz = -44.4; vz <= -38.6; vz += 2.4) linha(-24, vz, -13.4, vz);   // pátio da vila (spawn P)

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

  /* ===================== AS 4 BANDEIRAS =====================
     Lista literal do dono: "1 no campinho do respawn, outra no bar de esquina, outra mais pra
     frente perto do ponto de ônibus, e a final na praça onde é o baile".
     ONDE ELAS **NÃO** PODEM FICAR, e por quê (CTF1, tools/eval/invariants.mjs):
     (a) COLINEARES. O raio de captura é 4,5 m; se a altura do triângulo de qualquer trio for
         menor que isso, o caminho mais curto entre as duas pontas passa DENTRO do anel do
         meio — é o mecanismo do "os bots ficam todos na bandeira do meio". Num mapa que é uma
         RUA RETA isso é o risco natural: quatro bandeiras no eixo da rua têm altura ZERO.
         Por isso elas alternam de lado — campinho a OESTE do eixo (x -6), bar a LESTE (+9,5),
         ponto a OESTE (-10), baile a LESTE (+5). Menor altura de triângulo medida: 10,4 m,
         mais do que o dobro do raio de captura.
     (b) A MENOS DE 2 RAIOS (9 m) DO SPAWN MAIS PRÓXIMO — capturável de dentro do respawn.
         A do campinho é a crítica: fica a 11,6 m do slot B mais próximo, com o gol entre elas. */
  const ctfPoints = [
    { id: 'R', label: 'BAILE', x: 5, z: -30.5 },
    { id: 'P', label: 'PONTO DE ÔNIBUS', x: -10, z: -6 },
    { id: 'B', label: 'BAR DA ESQUINA', x: 9.5, z: 6 },
    { id: 'C', label: 'CAMPINHO', x: -6, z: 30 },
  ];

  /* ARSENAL NO CHÃO — mesma colocação do ferro velho (caixa deitada a 0,10 m: a base da malha
     fica 0,04 m do chão, dentro do teto de 0,05 m da pickup-check). Rifles no miolo da rua e
     nos becos, snipers nas duas vielas (que são as linhas longas do mapa), curtas nas bocas. */
  const gmat = lam({ color: 0x20242a });
  const place = (kind, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 1.0), gmat); m.position.set(x, 0.1, z); m.castShadow = true; root.add(m); pickups.push({ x, z, kind, weapon: kind, readyAt: 0, mesh: m }); };
  place('ak', 0.5, -13);         place('m4', 2.5, 12);
  place('shotgun', -16.6, 2.5);  place('mp5', 16.6, -3.5);
  place('awp', -23, 16);         place('m400', 23, -14);
  place('deagle', -8, -25);      place('shotgun', 8, -35);
  place('ak', 10.5, 34);         place('m4', -10.5, 40);
  place('mp5', -20, 26);         place('deagle', 20, 26);

  SKIRT.build(root);
  return {
    root, colliders, occluders, groundHeightAt, spawns, sun, hemi, pickups, ctfPoints,
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    bounds: { minX: -HALF_X + 0.5, maxX: HALF_X - 0.5, minZ: -HALF_Z + 0.5, maxZ: HALF_Z - 0.5 },
  };
}
