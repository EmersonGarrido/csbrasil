// Real rigged GLB characters (Mint-generated) with shared animation clips.
//
// Meshy delivers a rigged base mesh per character plus one GLB per animation clip.
// All characters share the same humanoid rig, so the 5 clips (idle/walk/run/shoot/
// death) are loaded ONCE and re-bound by bone name onto every character's skeleton.
// Base meshes are ~270KB (texture downscaled to 512/webp); clips ~30-70KB each.
//
// Only bots use these models (the player is first-person). Characters without a GLB
// fall back to the procedural box meshes in characters.js.
import * as THREE from 'three';
import { VERSION } from './version.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import { buildRifle } from './characters.js';
import { weaponModel, preloadWeapons, ONE_HANDED, gripPoints } from './weapons.js';
import { solveCCDIK } from './handik.js';

// Character ids that have a real model under public/models/characters/<id>.glb.
export const GLB_CHARS = new Set([
  'esquerdomacho', 'sindicato', 'mst', 'doutora', 'mistico',
  'caminhoneiro', 'sertanejo', 'coach',
  'gotinha', 'farialimer',
  'bombado', 'hipster', 'dollynho', 'et', 'ancap',
  'bozo', 'canarinho', 'proerd',
]);

// Mascotes de braços-toco: a mão de apoio via IK vira uma mão gigante flutuando
// (caso do Dollynho na tela de seleção). Neles, a mão L segue a pose do clipe.
const IK_L_SKIP = new Set(['dollynho', 'gotinha', 'et', 'canarinho']);

const STATES = ['idle', 'walk', 'run', 'shoot', 'death', 'crouch', 'crouchwalk', 'jump'];
// Clipes OPCIONAIS: 1 mão (pistolas) + andando atirando. Se o arquivo não existir,
// o load falha em silêncio e cai no comportamento padrão (idle/walk/shoot de 2 mãos).
const OPT_STATES = ['idle1h', 'walk1h', 'walkfire'];
const qp = new URLSearchParams(location.search);
const ANIM_DIR = qp.get('animdir') || 'models/anims/mixamo';   // pack Mixamo rifle (retarget próprio, tools/retarget-mixamo.mjs) — padrão desde 22/07; override via ?animdir=
const TARGET_HEIGHT = parseFloat(qp.get('charh')) || 1.72;      // meters (match box silhouette)
// Per-clip natural ground speed (m/s) that plants the feet at timeScale 1, MEASURED from
// each clip's real foot stride (tools: iktest HARNESS.measureStride / tools/eval/mixamo-measure.mjs).
const WALK_REF   = parseFloat(qp.get('wref')) || 0.84;
const RUN_REF    = parseFloat(qp.get('rref')) || 2.08;
const CROUCH_REF = parseFloat(qp.get('cref')) || 0.75;
const FACING_OFFSET = (parseFloat(qp.get('charface')) || 0) * Math.PI / 180; // yaw fix if model faces -Z
// FASE 3: clamp de segurança da correção de pitch da cabeça (malha fechada, ~28°).
// (O antigo HEAD_UP fixo foi removido: ele acumulava rotação quando o mixer não
// escrevia o osso — a correção agora é sempre em malha fechada, ver update().)
const AIM_CORR_CLAMP = 0.5;

// Rifle mounted in the right hand (bone-local meters via a scale-compensated mount).
// Tunable live with ?gunpos=x,y,z ?gunrot=xdeg,ydeg,zdeg ?guns=scale.
const _num3 = (s, d) => { const p = (s || '').split(',').map(Number); return p.length === 3 && p.every((n) => !isNaN(n)) ? p : d; };
const GUN_POS = _num3(qp.get('gunpos'), [0.02, 0.02, 0.10]);
const GUN_ROT = _num3(qp.get('gunrot'), [90, 0, 0]).map((d) => d * Math.PI / 180);
const GUN_SCALE = parseFloat(qp.get('guns')) || 1.0;

const loader = new GLTFLoader();
const loadGLB = (url) => new Promise((res, rej) => loader.load(url, res, undefined, rej));

let _clips = null;                 // { idle: AnimationClip, ... } shared fallback
const _clipsByChar = {};           // id -> per-character retargeted clip set (fallback to _clips)
const _base = new Map();           // id -> THREE.Object3D template scene

export function hasModel(id) { return _base.has(id); }
// Acesso ao template já carregado (fparms.js clona daqui p/ os braços de 1ª pessoa)
// e aos clipes compartilhados (pose base congelada). Pré-requisito: preloadCharacterAssets.
export function getCharTemplate(id) { return _base.get(id); }
export function getSharedClips() { return _clips; }

// Mede o centro REAL da palma no espaço local do osso Hand: média (em BIND pose) dos
// verts da malha com peso dominante (>0.5) no osso Hand ou no seu filho Curl (os dedos
// são skinned nos ossos Curl). Rígido por construção (independe da pose) e adaptado a
// cada personagem — sem isso o IK crava o PULSO no grip e a palma visível flutua
// centímetros fora da arma. Compartilhado por fparms.js (1ª pessoa) e pelo IK de 3ª
// pessoa (mão de apoio dos bots). Fallback: fração do antebraço ao longo de +Y.
export function measurePalmLocal(model, hand, curl) {
  const fallback = new THREE.Vector3(0, hand.position.length() * 0.25, 0);
  let sk = null;
  model.traverse((o) => { if (o.isSkinnedMesh && !sk) sk = o; });
  if (!sk) return fallback;
  const bones = sk.skeleton.bones;
  const hi = bones.indexOf(hand);
  if (hi < 0) return fallback;
  const ci = curl ? bones.indexOf(curl) : -1;
  const pos = sk.geometry.attributes.position, si = sk.geometry.attributes.skinIndex, sw = sk.geometry.attributes.skinWeight;
  const at = (a, i, k) => (k === 0 ? a.getX(i) : k === 1 ? a.getY(i) : k === 2 ? a.getZ(i) : a.getW(i));
  const c = new THREE.Vector3(), v = new THREE.Vector3();
  let n = 0;
  for (let i = 0; i < pos.count; i++) {
    let w = 0;
    for (let k = 0; k < 4; k++) { const bi = at(si, i, k); if (bi === hi || bi === ci) w += at(sw, i, k); }
    if (w > 0.5) { c.add(v.fromBufferAttribute(pos, i)); n++; }
  }
  if (!n) return fallback;
  c.divideScalar(n);
  // bind: posição do vértice no espaço local do osso = inv(handBindWorld) × meshBindWorld × c
  // (boneInverses[hi] já É inv(handBindWorld) por definição do esqueleto)
  const toLocal = new THREE.Matrix4().copy(sk.skeleton.boneInverses[hi]).multiply(sk.bindMatrix);
  return c.applyMatrix4(toLocal);
}

// Preload shared clips + base meshes for the given character ids. Safe to call once
// before a match; already-loaded assets are skipped. Failures are swallowed per-asset
// so a missing model just falls back to the box mesh.
export async function preloadCharacterAssets(ids) {
  if (!_clips) {
    _clips = {};
    await Promise.all([
      preloadWeapons(), // real weapon GLBs (mounts fall back to box if missing)
      ...STATES.map(async (s) => {
        try {
          const g = await loadGLB(`${ANIM_DIR}/${s}.glb?v=${VERSION}`);
          if (g.animations[0]) { g.animations[0].name = s; _clips[s] = g.animations[0]; }
        } catch (e) { console.warn('anim load failed', s, e); }
      }),
      // Opcionais (idle/walk de 1 mão p/ pistolas): ausência NÃO é erro — sem warn.
      ...OPT_STATES.map(async (s) => {
        try {
          const g = await loadGLB(`${ANIM_DIR}/${s}.glb?v=${VERSION}`);
          if (g.animations[0]) { g.animations[0].name = s; _clips[s] = g.animations[0]; }
        } catch (e) { /* fallback: idle/walk de 2 mãos */ }
      }),
    ]);
  }
  const wanted = [...new Set(ids)].filter((id) => GLB_CHARS.has(id) && !_base.has(id));
  await Promise.all(wanted.map(async (id) => {
    try {
      const g = await loadGLB(`models/characters/${id}.glb?v=${VERSION}`);
      _base.set(id, g.scene);
    } catch (e) { console.warn('model load failed', id, e); }
    // Clipes retargetados POR PERSONAGEM (models/anims/<id>/): cada rig do Meshy tem
    // proporção de esqueleto diferente, então o pack único (assado contra 1 referência)
    // deformava quem divergia (doutora agachada, dollynho dobrado). Aqui cada char usa
    // seus próprios clipes; qualquer estado ausente cai no pack compartilhado (_clips).
    const set = { ..._clips };
    await Promise.all([...STATES, ...OPT_STATES].map(async (s) => {
      try {
        const g = await loadGLB(`models/anims/${id}/${s}.glb?v=${VERSION}`);
        if (g.animations[0]) { g.animations[0].name = s; set[s] = g.animations[0]; }
      } catch (e) { /* fallback: clipe compartilhado */ }
    }));
    _clipsByChar[id] = set;
  }));
}

const _v = new THREE.Vector3();
const _gq = new THREE.Quaternion(), _wq = new THREE.Quaternion(), _pq = new THREE.Quaternion(), _headUpQ = new THREE.Quaternion();
const _right = new THREE.Vector3();
const _ikTgt = new THREE.Vector3();

// Build a bot mesh from a loaded GLB. Returns an object shaped like buildCharacter()'s
// result ({ group, parts }) plus animation control (isGLB, mixer, ctrl). Returns null
// if the character has no model loaded.
export function buildCharacterModel(def, opts = {}) {
  const template = _base.get(def.id);
  if (!template || !_clips) return null;
  const withWeapon = opts.weapon !== false; // menu showcase passes weapon:false

  const model = skeletonClone(template);

  // Normalize: scale to target height, drop feet to y=0, apply facing fix.
  // Update world matrices first so the bounding box reflects the real transforms.
  model.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(model);
  const h = bbox.max.y - bbox.min.y || 1;
  const s = TARGET_HEIGHT / h;
  if (qp.get('chartune')) console.log(`[glbchars] ${def.id} rawH=${h.toFixed(3)} min.y=${bbox.min.y.toFixed(3)} scale=${s.toFixed(3)}`);
  model.scale.setScalar(s);
  model.position.y = -bbox.min.y * s;
  model.rotation.y = FACING_OFFSET;
  model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });

  const group = new THREE.Group();
  group.add(model);

  // Head hitbox: an invisible (unrendered) but raycastable box tracked to the head bone
  // each frame, so headshots stay accurate through the animation.
  let headBone = null;
  model.traverse((o) => { if (o.isBone && !headBone && /head/i.test(o.name)) headBone = o; });
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.30, 0.26),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  group.add(head);

  // Rifle in the right hand: a scale-compensated mount parented to the hand bone so
  // GUN_POS/GUN_ROT are expressed in world meters regardless of the bone's scale.
  let handBone = null, lhandBone = null, rforeBone = null, gunObj = null;
  model.traverse((o) => { if (o.isBone && !handBone && /right.?hand|hand.?r\b|rhand|r_hand/i.test(o.name)) handBone = o; });
  model.traverse((o) => { if (o.isBone && !lhandBone && /left.?hand|hand.?l\b|lhand|l_hand/i.test(o.name)) lhandBone = o; });
  model.traverse((o) => { if (o.isBone && !rforeBone && /right.?forearm|r_forearm/i.test(o.name)) rforeBone = o; });
  if (!handBone) model.traverse((o) => { if (o.isBone && !handBone && /hand/i.test(o.name)) handBone = o; });
  if (handBone && withWeapon) {
    const gun = weaponModel(opts.weaponId || 'awp') || buildRifle();
    gunObj = gun;
    // Measure the weapon's authored (real-world) size in its own space, before parenting.
    gun.updateMatrixWorld(true);
    const asz = new THREE.Vector3(); new THREE.Box3().setFromObject(gun).getSize(asz);
    const authored = Math.max(asz.x, asz.y, asz.z) || 1;
    const mount = new THREE.Group();
    handBone.add(mount); mount.add(gun);
    // Orientation is computed AFTER the controller is created (below), aiming the barrel
    // from the right hand to the left hand in the settled hold pose — rig-independent.
    // Meshy rigs have wildly different hand-bone world scales (~70x apart), so a fixed
    // or clamped compensation makes weapons either microscopic or giant. Instead, measure
    // the mounted world size and rescale so the weapon always renders at its real length.
    // This is self-correcting: it can never balloon or shrink to a speck.
    group.updateMatrixWorld(true);
    const wsz = new THREE.Vector3(); new THREE.Box3().setFromObject(gun).getSize(wsz);
    const worldLen = Math.max(wsz.x, wsz.y, wsz.z) || authored;
    mount.scale.setScalar(GUN_SCALE * authored / worldLen); // -> mount space ~= world meters
    gun.position.set(GUN_POS[0], GUN_POS[1], GUN_POS[2]);
    gun.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; o.userData.noHit = true; } });
  }

  const mixer = new THREE.AnimationMixer(model);
  const actions = {};
  const clips = _clipsByChar[def.id] || _clips;   // clipes retargetados por personagem
  for (const name of [...STATES, ...OPT_STATES]) if (clips[name]) actions[name] = mixer.clipAction(clips[name]);

  const ctrl = new CharController(mixer, actions, group, headBone, head);
  // Arma de 1 mão (pistol/deagle/revolver38/knife): usa idle1h/walk1h quando carregados.
  ctrl.oneHanded = !!(opts.weaponId && ONE_HANDED.has(opts.weaponId));

  if (handBone && withWeapon) {
    // Aim the mount from the walk cycle's natural hold: average the forearm->hand line
    // across the loop (the walk holds the gun with both hands on it). Pose-independent,
    // works for rifle and pistol rigs. (The shoot pose is pistol-flavored and unreliable.)
    ctrl._to('walk');
    const dirAvg = new THREE.Vector3();
    const gripP = handBone.getWorldPosition(new THREE.Vector3());
    if (rforeBone) {
      const elbowP = rforeBone.getWorldPosition(new THREE.Vector3());
      for (let i = 0; i < 8; i++) {
        ctrl.update(1 / 24, 0, false, 0);
        model.updateMatrixWorld(true);
        const hp = handBone.getWorldPosition(new THREE.Vector3());
        const ep = rforeBone.getWorldPosition(new THREE.Vector3());
        const d = hp.sub(ep);
        if (d.lengthSq() > 1e-6) dirAvg.add(d.normalize());
      }
    }
    let dir = dirAvg.lengthSq() > 1e-6 ? dirAvg.normalize() : null;
    if (!dir) dir = new THREE.Vector3(0, 0, 1).applyQuaternion(group.getWorldQuaternion(new THREE.Quaternion()));
    // Matrix4.lookAt orients -Z at the target; we want the gun's +Z (barrel) along dir.
    const lookM = new THREE.Matrix4().lookAt(new THREE.Vector3(), dir.clone().negate(), new THREE.Vector3(0, 1, 0));
    const desired = new THREE.Quaternion().setFromRotationMatrix(lookM);
    const parentQ = handBone.getWorldQuaternion(new THREE.Quaternion());
    const mount = handBone.children.find(c => c.isGroup);
    mount.quaternion.copy(parentQ.invert().multiply(desired));
    // Grip curl: close the fingers onto the grip (the auto-skinned curl bones).
    // Two-handed weapons curl both hands; one-handed only the grip (right) hand.
    const twoHanded = !ONE_HANDED.has(opts.weaponId || 'awp');
    let curlR = null, curlL = null;
    model.traverse(o => { if (o.isBone) { if (o.name === 'Curl_R') curlR = o; if (o.name === 'Curl_L') curlL = o; } });
    if (curlR) { curlR.rotation.x += 0.5; }
    if (twoHanded && curlL) { curlL.rotation.x += 0.5; }
    // IK da mão de apoio (FASE 2): em armas de 2 mãos, o CharController trava a palma L
    // no guarda-mão depois de cada mixer.update — vale pra idle/walk dos bots E pro
    // preview da tela de seleção (mesmo ctrl.update). Posicional apenas: os clipes já
    // orientam a mão perto do certo (rifle-hold); o IK resolve o contato por arma.
    if (twoHanded && lhandBone) {
      let lArm = null, lFore = null;
      model.traverse(o => { if (o.isBone) { if (o.name === 'LeftArm') lArm = o; if (o.name === 'LeftForeArm') lFore = o; } });
      const gp = gripPoints(opts.weaponId || 'awp');
      if (lArm && lFore && gp.fore && gunObj && !IK_L_SKIP.has(def.id)) ctrl.ikL = { chain: [lArm, lFore], end: lhandBone, endOffset: measurePalmLocal(model, lhandBone, curlL), gun: gunObj, fore: gp.fore.clone() };
    }
  }
  return { group, parts: { head }, isGLB: true, mixer, ctrl };
}

const FADE = 0.16;

class CharController {
  constructor(mixer, actions, group, headBone, head) {
    this.mixer = mixer; this.actions = actions;
    this.group = group; this.headBone = headBone; this.head = head;
    this.cur = null; this.dead = false; this.shooting = false; this.crouch = false; this.jumping = false;
    this.oneHanded = false; // arma de 1 mão: idle/walk trocam p/ idle1h/walk1h (setado em buildCharacterModel)
    this._loco = 'idle'; // current locomotion state (hysteresis memory for walk/run choice)
    mixer.addEventListener('finished', (e) => {
      if (e.action === actions.shoot) this.shooting = false;
      if (e.action === actions.jump) this.jumping = false;
    });
    this._to('idle');
  }

  _to(name, once = false) {
    const a = this.actions[name];
    if (!a || this.cur === a) return;
    a.reset();
    a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
    a.clampWhenFinished = once;
    a.enabled = true; a.fadeIn(FADE); a.play();
    if (this.cur) this.cur.fadeOut(FADE);
    this.cur = a;
  }

  setCrouch(v) { this.crouch = !!v; }

  jump() {
    if (this.dead || this.crouch || this.jumping || !this.actions.jump) return;
    this.jumping = true;
    const a = this.actions.jump;
    a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = false;
    a.enabled = true; a.fadeIn(0.08).play();
    if (this.cur && this.cur !== a) this.cur.fadeOut(0.08);
    this.cur = a;
  }

  shoot() {
    if (this.dead || this.crouch || !this.actions.shoot) return; // crouch pose already aims
    this.shooting = true;
    this._shootUntil = this.mixer.time + this.actions.shoot.getClip().duration;
    this.actions.shoot.reset();
    this.actions.shoot.setLoop(THREE.LoopOnce, 1);
    this.actions.shoot.clampWhenFinished = true;
    this.actions.shoot.enabled = true; this.actions.shoot.fadeIn(0.06).play();
    if (this.cur && this.cur !== this.actions.shoot) this.cur.fadeOut(0.06);
    this.cur = this.actions.shoot;
  }

  die() {
    if (this.dead) return;
    this.dead = true; this.shooting = false;
    this._to('death', true);
    if (this.actions.death) this.actions.death.timeScale = 1.8; // snappy fall, not slow-mo
  }

  // Stop ALL actions first — the death clip runs with clampWhenFinished, so it holds
  // its last (fallen) frame at full weight forever. Without stopAllAction the revived
  // character does everything on top of the fallen pose (the "walking while falling
  // backward" bug). Then start idle clean.
  revive() {
    this.dead = false; this.shooting = false;
    this.mixer.stopAllAction();
    this.cur = null;
    this._to('idle');
  }

  // moving: 0..1, hasTarget: bool, speed: real ground speed (m/s), back: true when the
  // body is moving BACKWARD relative to its facing (combat retreat). Advances the mixer,
  // picks the locomotion state, and scales the leg-cycle rate to the actual ground speed
  // so the feet plant instead of ice-skating (root-motion-free clips have no built-in
  // stride, so we drive the cycle rate from how fast the body is really moving).
  update(dt, moving, hasTarget, speed = 0, back = false) {
    if (!this.dead) {
      if (this.crouch) {
        this._to(moving > 0.05 ? 'crouchwalk' : 'crouch');
      } else if (this.shooting && moving > 0.05 && this.actions.walkfire) {
        // Atirar EM MOVIMENTO: o clipe combinado (walk+fire) mantém as pernas andando —
        // antes as pernas congelavam ~1s a cada disparo (usuário reprovou).
        this._to('walkfire');
        if (this.mixer.time >= (this._shootUntil || 0)) this.shooting = false;
      } else if (!this.shooting && !this.jumping) {
        if (moving <= 0.05) { this._to(this.oneHanded && this.actions.idle1h ? 'idle1h' : 'idle'); this._loco = 'idle'; }
        else if (back) {
          // Backpedal: walk clip REVERSED (negative timeScale below) so the feet step
          // backward — a forward clip while retreating is the classic moonwalk.
          this._to(this.oneHanded && this.actions.walk1h ? 'walk1h' : 'walk'); this._loco = 'walk';
        } else {
          // Pick the clip by SPEED with hysteresis (not by hasTarget): fast movement with
          // the slow walk clip needs a frantic ~2.4x cycle; slow movement with the run
          // clip looks like gliding. run > 1.45 m/s, walk < 1.15, keep current in between.
          if (this._loco !== 'run' && speed > 1.45) this._loco = 'run';
          else if (this._loco !== 'walk' && speed < 1.15) this._loco = 'walk';
          else if (this._loco !== 'walk' && this._loco !== 'run') this._loco = hasTarget && speed < 1.7 ? 'walk' : 'run';
          this._to(this._loco === 'walk' && this.oneHanded && this.actions.walk1h ? 'walk1h' : this._loco);
        }
      }
      // Per-clip cycle rate = ground speed / that clip's measured natural speed, so the
      // feet plant instead of ice-skating. clamp keeps it from looking frantic/frozen.
      const rate = (ref) => Math.max(0.45, Math.min(3.0, speed / ref));
      if (this.actions.run) this.actions.run.timeScale = rate(RUN_REF);
      if (this.actions.walk) this.actions.walk.timeScale = back ? -rate(WALK_REF) : rate(WALK_REF);
      if (this.actions.walk1h) this.actions.walk1h.timeScale = back ? -rate(WALK_REF) : rate(WALK_REF);
      if (this.actions.crouchwalk) this.actions.crouchwalk.timeScale = rate(CROUCH_REF);
    }
    this.mixer.update(dt);
    // Pitch da cabeça em MALHA FECHADA (substitui o HEAD_UP fixo, que ACUMULAVA rotação
    // quando o mixer parava de escrever o osso — ex.: idle.glb com duração zero, que
    // dobrava a cabeça do personagem na tela de seleção). Mede o pitch real do olhar
    // (eixo +Z local da cabeça em mundo) e gira o osso pela DIFERENÇA pro aimPitch.
    // Só roda quando aimPitch é DEFINIDO (bots) — preview da seleção e braços FP ficam
    // com a pose natural do clipe (aplicar em todos deixava as cabeças esquisitas).
    if (this.headBone && this.aimPitch !== undefined && !this.dead) {
      const target = this.aimPitch;
      this.group.getWorldQuaternion(_gq);
      _right.set(1, 0, 0).applyQuaternion(_gq);
      this.headBone.getWorldQuaternion(_wq);
      _v.set(0, 0, 1).applyQuaternion(_wq);
      const curPitch = Math.asin(Math.max(-1, Math.min(1, _v.y)));
      let corr = target - curPitch;
      corr = Math.max(-AIM_CORR_CLAMP, Math.min(AIM_CORR_CLAMP, corr));
      this._aimCorr = (this._aimCorr || 0) + (corr - (this._aimCorr || 0)) * Math.min(1, dt * 6);
      if (Math.abs(this._aimCorr) > 1e-4) {
        _headUpQ.setFromAxisAngle(_right, -this._aimCorr);
        this.headBone.parent.getWorldQuaternion(_pq);
        this.headBone.quaternion.copy(_pq.invert().multiply(_headUpQ).multiply(_wq));
        this.headBone.updateWorldMatrix(false, true);
      }
    }
    if (this.headBone) {
      this.group.updateMatrixWorld(true);
      this.head.position.copy(this.group.worldToLocal(this.headBone.getWorldPosition(_v)));
    }
    // IK da mão de apoio (FASE 2): palma L no guarda-mão da arma montada (só 2 mãos).
    // Roda depois do mixer/pose — corrige o contato por arma sem tocar na orientação.
    if (this.ikL && !this.dead) {
      const ik = this.ikL;
      ik.gun.updateWorldMatrix(true, false);
      _ikTgt.copy(ik.fore);
      ik.gun.localToWorld(_ikTgt);
      solveCCDIK(ik.chain, ik.end, _ikTgt, { iterations: 8, endOffset: ik.endOffset });
    }
  }
}
