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
  'lmg', 'scar', 'tavor', 'famas', 'uzi', 'p90'];

// len = real length along the barrel (m); rot = degrees to point the barrel +Z;
// gripZ = fraction of length from the muzzle where the hand grips (0=muzzle,1=stock).
// rot = graus pra apontar o cano +Z. Verificado OBJETIVAMENTE arma a arma via weapontest.html
// (tools/eval/weapon-capture.mjs): mede a seção transversal perto de cada ponta Z — o cano é
// FINO, a coronha GROSSA; se a ponta +Z não é a mais fina, a arma está invertida e leva +180
// no yaw. (Os GLBs vêm de fontes diferentes, sem convenção; a leitura à olho falhava nas
// bullpups/compactas — a medição não.) Confirmadas pelo usuário: tavor, uzi, m400.
const CFG = {
  awp:     { len: 1.15, rot: [0, 90, 0], gripZ: 0.72 },
  ak:      { len: 0.88, rot: [0, 270, 0], gripZ: 0.62 },  // +180: estava coronha em +Z (invertido)
  m4:      { len: 0.84, rot: [0, 90, 0], gripZ: 0.62 },
  mp5:     { len: 0.66, rot: [0, 90, 0], gripZ: 0.58 },   // medição borderline (7%); cano +Z confirmado à olho
  shotgun: { len: 1.00, rot: [0, 0, 0], gripZ: 0.6 },   // model is natively +Z (barrel forward)
  deagle:  { len: 0.30, rot: [0, 90, 0], gripZ: 0.7 },
  pistol:  { len: 0.26, rot: [0, 90, 0], gripZ: 0.7 },
  knife:   { len: 0.30, rot: [0, 270, 0], gripZ: 0.6 },  // +180: lâmina estava pra trás (medição -Z)
  // arsenal-2 (Brazilian-flavored)
  m92:       { len: 0.76, rot: [0, 270, 0], gripZ: 0.6 },   // +180: Zastava M92 estava invertido
  g3:        { len: 1.10, rot: [0, 270, 0], gripZ: 0.58 },  // +180: HK G3 estava invertido
  akm:       { len: 0.88, rot: [0, 90, 0], gripZ: 0.62 },
  revolver38:{ len: 0.24, rot: [0, 270, 0], gripZ: 0.68 },  // +180: medição -Z (invertido)
  md97:      { len: 1.05, rot: [0, 270, 0], gripZ: 0.62 },  // +180: estava invertido
  carbine:   { len: 0.98, rot: [0, 0, 0], gripZ: 0.6 },   // natively +Z; [0,90,0] threw the barrel onto X (giant)
  m400:      { len: 0.92, rot: [0, 270, 0], gripZ: 0.62 },  // +180: usuário confirmou invertido
  mosin:     { len: 1.20, rot: [0, 270, 0], gripZ: 0.66 },  // +180: estava invertido
  rem700:    { len: 1.15, rot: [0, 270, 0], gripZ: 0.66 },  // +180: estava invertido
  // arsenal-3 (military)
  lmg:       { len: 1.10, rot: [0, 90, 0], gripZ: 0.58 },
  scar:      { len: 0.90, rot: [0, 90, 0], gripZ: 0.62 },
  tavor:     { len: 0.72, rot: [0, 270, 0], gripZ: 0.5 },   // +180: usuário confirmou invertido
  famas:     { len: 0.76, rot: [0, 90, 0], gripZ: 0.5 },
  uzi:       { len: 0.60, rot: [0, 270, 0], gripZ: 0.58 },  // +180: usuário confirmou invertido
  p90:       { len: 0.52, rot: [0, 270, 0], gripZ: 0.55 },  // +180: medição -Z (invertido)
};

const loadGLB = (url) => new Promise((res, rej) => loader.load(url, res, undefined, rej));

export async function preloadWeapons() {
  await Promise.all(WEAPON_IDS.map(async (id) => {
    if (_cache.has(id)) return;
    try { const g = await loadGLB(`models/weapons/${id}.glb?v=${VERSION}`); _cache.set(id, g.scene); }
    catch (e) { console.warn('weapon load failed', id, e); }
  }));
}

export function hasWeapon(id) { return _cache.has(id); }

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

// Returns a THREE.Group holding the weapon, scaled to real size, barrel pointing +Z,
// grip roughly at the group origin (so it sits in a hand placed at origin).
export function weaponModel(id) {
  const tpl = _cache.get(id) || _cache.get('awp');
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
  return wrap;
}
