// Real weapon GLB models (Mint asset pack) — replaces the procedural box guns.
// Each source model is normalized to ~1 unit on its longest axis, so we scale each
// to a real-world length and rotate so the barrel points +Z (game forward).
import * as THREE from 'three';
import { VERSION } from './version.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const _cache = new Map();
export const WEAPON_IDS = ['awp', 'ak', 'm4', 'mp5', 'shotgun', 'deagle', 'pistol', 'knife',
  'm92', 'akm', 'g3', 'revolver38', 'md97', 'carbine', 'm400', 'mosin', 'rem700',
  'lmg', 'scar', 'tavor', 'famas', 'uzi', 'p90',
  'svd', 'g3sg1', 'sks'];   // snipers semi-auto (reusam o modelo de outra arma via MODEL_ALIAS)

// Snipers semi-auto novas reaproveitam a MALHA de uma arma existente (sem asset novo):
// SVD←SCAR, G3SG1←G3, SKS←carabina. weaponModel/preload usam este alias.
const MODEL_ALIAS = {};   // as 3 snipers novas têm modelo próprio (Mint)

// len = real length along the barrel (m); rot = degrees to point the barrel +Z;
// gripZ = fraction of length from the muzzle where the hand grips (0=muzzle,1=stock).
// vm (opcional) = multiplicador SÓ da viewmodel FP (game.js), default 1. Cada arma já é
// normalizada ao comprimento real (len), então a 1ª pessoa fica proporcional; medido em
// 1080p, as SMGs (uzi/p90/mp5) NÃO estão gigantes. Este knob existe pra afinar UMA arma
// que ainda leia grande/pequena de perto, sem tocar no len (grip/3ª pessoa dependem dele).
// ATENÇÃO: vm≠1 escala o mesh em torno do grip → re-verificar gripError da arma no fparms-capture.
// rot = graus pra apontar o cano +Z. Verificado OBJETIVAMENTE arma a arma via weapontest.html
// (tools/eval/weapon-capture.mjs): mede a seção transversal perto de cada ponta Z — o cano é
// FINO, a coronha GROSSA; se a ponta +Z não é a mais fina, a arma está invertida e leva +180
// no yaw. (Os GLBs vêm de fontes diferentes, sem convenção; a leitura à olho falhava nas
// bullpups/compactas — a medição não.) Confirmadas pelo usuário: tavor, uzi, m400.
const CFG = {
  awp:     { len: 1.15, rot: [0, 90, 0], gripZ: 0.72, vm: 0.78 },   // vm: scope/rifle longo demais de perto (dono: "gigantesca")
  ak:      { len: 0.88, rot: [0, 270, 0], gripZ: 0.62 },  // +180: estava coronha em +Z (invertido)
  m4:      { len: 0.84, rot: [0, 90, 0], gripZ: 0.62 },
  mp5:     { len: 0.66, rot: [0, 90, 0], gripZ: 0.58 },   // medição borderline (7%); cano +Z confirmado à olho
  shotgun: { len: 1.00, rot: [0, 0, 0], gripZ: 0.6 },   // model is natively +Z (barrel forward)
  deagle:  { len: 0.30, rot: [0, 90, 0], gripZ: 0.7 },
  pistol:  { len: 0.26, rot: [0, 90, 0], gripZ: 0.7 },
  knife:   { len: 0.30, rot: [0, 270, 0], gripZ: 0.6 },  // +180: lâmina estava pra trás (medição -Z)
  // arsenal-2 (Brazilian-flavored)
  m92:       { len: 0.76, rot: [0, 270, 0], gripZ: 0.6 },   // +180: Zastava M92 estava invertido
  g3:        { len: 1.10, rot: [0, 270, 0], gripZ: 0.58, vm: 0.85 },  // +180: HK G3 estava invertido
  akm:       { len: 0.88, rot: [0, 90, 0], gripZ: 0.62 },
  revolver38:{ len: 0.24, rot: [0, 270, 0], gripZ: 0.68 },  // +180: medição -Z (invertido)
  md97:      { len: 1.05, rot: [0, 270, 0], gripZ: 0.62, vm: 0.88 },  // +180: estava invertido
  carbine:   { len: 0.98, rot: [0, 0, 0], gripZ: 0.6 },   // natively +Z; [0,90,0] threw the barrel onto X (giant)
  m400:      { len: 0.92, rot: [0, 270, 0], gripZ: 0.62, vm: 0.85 },  // +180: usuário confirmou invertido
  mosin:     { len: 1.20, rot: [0, 270, 0], gripZ: 0.66, vm: 0.75 },  // +180: estava invertido
  rem700:    { len: 1.15, rot: [0, 270, 0], gripZ: 0.66, vm: 0.78 },  // +180: estava invertido
  // arsenal-3 (military)
  lmg:       { len: 1.10, rot: [0, 90, 0], gripZ: 0.58, vm: 0.72 },   // vm: caixão preto gigante na tela
  scar:      { len: 0.90, rot: [0, 90, 0], gripZ: 0.62 },
  tavor:     { len: 0.72, rot: [0, 270, 0], gripZ: 0.5 },   // +180: usuário confirmou invertido
  famas:     { len: 0.76, rot: [0, 90, 0], gripZ: 0.5 },
  uzi:       { len: 0.47, rot: [0, 270, 0], gripZ: 0.58, vm: 0.72 },  // vm: encolhe no FP (estava grande)
  // len 0.60 -> 0.47 (P0): o dono reportou "a uzi do hipster alternativo esta gigante, maior que
  // o corpo dele". O mount NAO estava errado nesse personagem — a sonda de 3a pessoa mediu fator
  // de escala 1,00 nele, o mais exato do elenco. O problema e a PROPORCAO do GLB: a uzi.glb tem
  // 0,42 m de altura para 0,60 m de comprimento (razao altura/comprimento 0,69, contra 0,30 do AK
  // e 0,36 da MP5 — a mais "alta" do arsenal inteiro). Como `len` normaliza pelo COMPRIMENTO, a
  // altura vinha junto e a arma inteira lia gigante ao lado de um personagem magro. 0,47 m e o
  // comprimento real de uma Uzi com a coronha dobrada; com ele a altura cai para ~0,33 m e a
  // silhueta volta a ler como SMG compacta. gripZ/rot conferidos, seguem valendo.
  // p90 rot 270→90 (G3-R1): a medição de seção transversal (tools/eval/vm-mint-audit.mjs)
  // provou que com 270 a ponta +Z era a GROSSA (raio 0.053 vs 0.010) — a arma entrava de ré.
  // O `vmRotY: Math.PI` que morava aqui era um curativo que consertava SÓ a 1ª pessoa e
  // deixava a 3ª pessoa invertida; com o rot certo os dois caminhos usam a mesma verdade.
  p90:       { len: 0.52, rot: [0, 90, 0], gripZ: 0.55 },
  // snipers semi-auto — herdam a malha (MODEL_ALIAS) e o rot/len do modelo reusado
  svd:       { len: 1.15, rot: [0, 270, 0], gripZ: 0.64, vm: 0.8 },   // modelo próprio (Mint); +180 (estava invertida)
  g3sg1:     { len: 1.12, rot: [0, 270, 0], gripZ: 0.58, vm: 0.85 },   // modelo do G3
  sks:       { len: 1.02, rot: [0, 270, 0], gripZ: 0.6, vm: 0.85 },    // modelo próprio (Mint), cano +Z como a SVD
};

const loadGLB = (url) => new Promise((res, rej) => loader.load(url, res, undefined, rej));

export async function preloadWeapons() {
  await Promise.all(WEAPON_IDS.map(async (id) => {
    const src = MODEL_ALIAS[id] || id;    // snipers reusadas carregam a malha da arma-fonte
    if (_cache.has(src)) return;
    try { const g = await loadGLB(`models/weapons/${src}.glb?v=${VERSION}`); _cache.set(src, g.scene); }
    catch (e) { console.warn('weapon load failed', src, e); }
  }));
}

export function hasWeapon(id) { return _cache.has(MODEL_ALIAS[id] || id); }

// Geometry facts for aligning hands/mounts: real length + grip point (fraction from muzzle).
export function weaponCFG(id) { return CFG[id] || CFG.awp; }
// One-handed weapons get no support hand on a handguard.
export const ONE_HANDED = new Set(['pistol', 'deagle', 'revolver38', 'knife']);
// Sidearm slot (tecla 2). Everything else except the knife is a primary (tecla 1).
export const PISTOLS = new Set(['pistol', 'deagle', 'revolver38']);

// Pontos de empunhadura no espaço local do grupo do weaponModel() (grip na origem,
// cano apontando +Z). ÚNICA FONTE usada por: alignHands (game.js, mãos procedurais),
// IK dos braços FP (fparms.js) e IK da mão de apoio em 3ª pessoa (glbchars.js).
// fore = ponto no guarda-mão, à frente do grip (fração do trecho grip→boca); null p/ 1 mão.
// ATENÇÃO à convenção: no grupo da viewmodel (game.js) o GLB entra girado em π (cano -Z),
// então lá o fore vira z' = GRIP_Z - fore.z; nos mounts de 3ª pessoa o cano é +Z direto.
export function gripPoints(id) {
  const cfg = weaponCFG(id);
  return {
    grip: new THREE.Vector3(0, 0, 0),
    fore: ONE_HANDED.has(id) ? null : new THREE.Vector3(0.005, -0.045, 0.82 * cfg.len * (1 - cfg.gripZ) * 0.72),
  };
}

// MEDIÇÕES POR ARMA (G3-R1) — a 1ª pessoa voltou a usar estes 26 GLBs (um por arma) em vez
// dos 8 heróis Tripo, e precisa de 3 números que NENHUMA tabela escrita à mão acerta:
//   box    = caixa da arma no espaço do grupo (grip na origem, cano +Z, metros reais)
//   muzzle = BOCA DO CANO de verdade (centroide dos vértices nos 2% mais avançados em +Z).
//            É a origem do flash e do tracer: com uma constante herdada o clarão nascia a
//            ~250 px da arma ("impacto na parede").
//   sight  = ALÇA DE MIRA (topo do receiver na metade da frente). É o ponto que o ADS leva
//            ao centro da tela — sem ele "miro e não vejo a arma nem a mira".
// Medido UMA vez por arma e cacheado (weaponModel é chamado também por cada pickup do mapa).
const _metrics = new Map();
function measureGun(id, wrap) {
  if (_metrics.has(id)) return _metrics.get(id);
  wrap.updateMatrixWorld(true);
  const pts = [];
  const v = new THREE.Vector3();
  wrap.traverse((o) => {
    const pos = o.isMesh && o.geometry && o.geometry.attributes && o.geometry.attributes.position;
    if (!pos) return;
    const step = Math.max(1, Math.ceil(pos.count / 30000));   // teto de 30k pontos: a medida não melhora acima disso
    for (let i = 0; i < pos.count; i += step) pts.push(v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).clone());
  });
  const box = new THREE.Box3();
  for (const p of pts) box.expandByPoint(p);
  const L = Math.max(1e-4, box.max.z - box.min.z);
  const cut = box.max.z - L * 0.02;
  const mz = new THREE.Vector3(); let n = 0;
  for (const p of pts) if (p.z >= cut) { mz.add(p); n++; }
  if (n) mz.divideScalar(n); else mz.set(0, 0, box.max.z);
  // alça: topo do corpo entre o grip (z=0) e 45% do caminho até a boca
  const z1 = mz.z * 0.45;
  let top = -1e9;
  for (const p of pts) if (p.z >= 0 && p.z <= z1 && p.y > top) top = p.y;
  let sx = 0, c = 0;
  for (const p of pts) if (p.z >= 0 && p.z <= z1 && p.y > top - 0.012) { sx += p.x; c++; }
  const sight = new THREE.Vector3(c ? sx / c : mz.x, top > -1e8 ? top : box.max.y, mz.z * 0.30);
  // norm = escala de normalização do wrap no momento da medida. box/muzzle/sight estão em
  // METROS REAIS (espaço do PAI do wrap); para usá-los com wrap.localToWorld é preciso
  // dividir por norm, senão a escala entra DUAS vezes e o flash nasce longe do cano.
  const m = { box: box.clone(), muzzle: mz.clone(), sight, norm: wrap.scale.x || 1 };
  _metrics.set(id, m);
  return m;
}
export function weaponMetrics(id) { return _metrics.get(id) || null; }

// Returns a THREE.Group holding the weapon, scaled to real size, barrel pointing +Z,
// grip roughly at the group origin (so it sits in a hand placed at origin).
export function weaponModel(id) {
  const tpl = _cache.get(MODEL_ALIAS[id] || id) || _cache.get('awp');
  if (!tpl) return null;
  const cfg = CFG[id] || CFG.awp;
  const model = tpl.clone(true);
  model.rotation.set(cfg.rot[0] * Math.PI / 180, cfg.rot[1] * Math.PI / 180, cfg.rot[2] * Math.PI / 180);

  const wrap = new THREE.Group();
  wrap.add(model);
  wrap.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(wrap);
  const zlen = (box.max.z - box.min.z) || 1;
  const s = Math.min(8, Math.max(0.05, cfg.len / zlen)); // guard against a bad bbox → giant gun
  wrap.scale.setScalar(s);
  // shift so the grip point (gripZ along the barrel) sits at the origin
  wrap.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(wrap);
  const gripWorldZ = b2.max.z - (b2.max.z - b2.min.z) * cfg.gripZ;
  model.position.z -= gripWorldZ / s;
  wrap.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; } });
  wrap.userData.metrics = measureGun(id, wrap);   // boca/alça/caixa medidas (ver measureGun)
  return wrap;
}
