// Braços de 1ª pessoa REAIS (FASE 1): reusa o GLB do próprio personagem como corpo FP.
// O corpo fica pendurado na câmera (filho de vm.root, cabeça escondida via scale no osso
// Head), a pose base é o clipe idle compartilhado CONGELADO (rifle-hold) e a cada frame o
// IK CCD do handik.js trava a mão direita no grip e a esquerda no guarda-mão da arma
// visível. Como kick/reloadDip/sway/bob mexem o vm.root inteiro, o IK re-trava as mãos na
// arma depois desses transforms — o recuo lê como braços+arma chutando juntos.
//
// Personagens com props FUNDIDOS na malha da mão (inspetado via gltf-transform: mesh única
// "char1" — clipboard/celular/megafone não são separáveis) ou anatomia de ave ficam no
// FP_FALLBACK e mantêm as mãos procedurais antigas (fpArm/frontHand do game.js).
import * as THREE from 'three';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import { getCharTemplate, getSharedClips, measurePalmLocal } from './glbchars.js';
import { gripPoints, ONE_HANDED } from './weapons.js';
import { solveCCDIK } from './handik.js';

// Chars cujo GLB tem prop colado na mão (doutora/influencer/senhora/sindicato — malha
// única "char1", props inseparáveis) ou corpo não-humano → mãos procedurais.
// canarinho (ave, sem dedos), gotinha (gota), et (alien), dollynho (garrafa) e proerd
// (patas curtas de leão + rabo invadindo o quadro) deformam sob IK. bozo: a gola-gargantilha
// e as luvas gigantes invadem o quadro em qualquer altura do corpo (medido ?fpy=).
export const FP_FALLBACK = new Set(['doutora', 'sindicato',
  'canarinho', 'gotinha', 'et', 'dollynho', 'proerd', 'bozo']);

// Braços IK no corpo do personagem: DESLIGADO por padrão (as mãos-mitten de ~200 tris
// dos GLBs viram "salsichas" em qualquer render grande — reprovado pelo usuário).
// A solução real é o asset dedicado de braços FP (em produção). Re-ligar: ?ikarms=1
export const FP_REAL_ARMS = new URLSearchParams(location.search).get('ikarms') === '1';

const qp = new URLSearchParams(location.search);
const _n3 = (s, d) => { const p = (s || '').split(',').map(Number); return p.length === 3 && p.every((n) => !isNaN(n)) ? p : d; };
// Tuning ao vivo: ?fpr=x,y,z (offset do pulso R no espaço da arma, cano +Z, estoque -Z),
// ?fpl=x,y,z (idem mão L relativo ao guarda-mão), ?fpy=/?fpz= (corpo sob a câmera).
const R_OFF = _n3(qp.get('fpr'), [0, -0.008, -0.012]);
const L_OFF = _n3(qp.get('fpl'), [0, -0.03, -0.01]);
const BODY_Y = parseFloat(qp.get('fpy')) || -1.52;
const BODY_Z = parseFloat(qp.get('fpz')) || 0.02;
const FROZEN_T = 0.6;          // ponto do clipe idle congelado (pose base do rifle-hold)
const TARGET_HEIGHT = 1.72;    // mesma normalização dos bots (glbchars.js)
// Escala global do corpo FP (proporção na tela: 1.0 deixava as mãos grandes demais,
// tampando a mira — pedido do usuário). Tunável via ?fps=.
const FP_SCALE = parseFloat(qp.get('fps')) || 0.93;

const _t = new THREE.Vector3();
const _eff = new THREE.Vector3();
const _qg = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _qf = new THREE.Quaternion();

// Orienta a mão com rotação fixa no espaço da arma (transplante da pose congelada do
// rifle-hold: anatomicamente correta por construção). A posição vem do IK; a rotação
// NÃO — o CCD torce o antebraço e deixa a palma achatada se depender só dele.
function orientHand(end, qFix) {
  _qf.copy(_qg).multiply(qFix);                          // mundo desejado = arma * fix
  end.parent.getWorldQuaternion(_qp).invert();
  end.quaternion.copy(_qp.multiply(_qf)).normalize();
  end.updateWorldMatrix(false, true);
}

// Posiciona uma mão no alvo: orienta → solve → repete (a palma efetora depende da
// orientação da mão; 2 passadas convergem). Retorna o gripError (mundo, metros).
function poseHand(chain, qFix, tgt) {
  for (let p = 0; p < 2; p++) {
    orientHand(chain.end, qFix);
    solveCCDIK(chain.bones, chain.end, tgt, { iterations: 14, endOffset: chain.endOffset });
  }
  orientHand(chain.end, qFix);
  return _eff.copy(chain.endOffset).applyMatrix4(chain.end.matrixWorld).distanceTo(tgt);
}

// Monta o corpo FP do personagem. Retorna null se não houver template/clipe carregado
// (caller cai pro fallback procedural). Pré-requisito: preloadCharacterAssets([id]).
export function buildFPArms(def) {
  const template = getCharTemplate(def.id);
  const clips = getSharedClips();
  if (!template || !clips || !clips.idle) return null;

  const model = skeletonClone(template);
  // Normaliza como buildCharacterModel: altura real e pés no y=0 do wrapper.
  model.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(model);
  const h = bbox.max.y - bbox.min.y || 1;
  const s = (TARGET_HEIGHT * FP_SCALE) / h;
  model.scale.setScalar(s);
  model.position.y = -bbox.min.y * s;
  model.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; } });

  // Wrapper no espaço do vm.root: corpo de frente pra -Z (mesma direção da câmera),
  // olhos ~na altura da câmera (a cabeça some — só os ombros/braços importam).
  const group = new THREE.Group();
  group.add(model);
  group.rotation.y = Math.PI;
  group.position.set(0, BODY_Y, BODY_Z);

  // Ossos (nomes Meshy exatos; regex de resgate igual ao glbchars.js por segurança).
  const bone = (exact, re) => {
    let b = null;
    model.traverse((o) => { if (o.isBone && !b && o.name === exact) b = o; });
    if (!b) model.traverse((o) => { if (o.isBone && !b && re.test(o.name)) b = o; });
    return b;
  };
  const head = bone('Head', /head/i);
  const rSh = bone('RightShoulder', /right.?shoulder/i), rArm = bone('RightArm', /right.?arm|r_arm/i),
    rFore = bone('RightForeArm', /right.?forearm/i), rHand = bone('RightHand', /right.?hand|rhand/i);
  const lSh = bone('LeftShoulder', /left.?shoulder/i), lArm = bone('LeftArm', /left.?arm|l_arm/i),
    lFore = bone('LeftForeArm', /left.?forearm/i), lHand = bone('LeftHand', /left.?hand|lhand/i);
  if (!rArm || !rFore || !rHand || !lArm || !lFore || !lHand) return null;
  const curlR = bone('Curl_R', /curl_?r/i), curlL = bone('Curl_L', /curl_?l/i);
  // Esconde a cabeça: osso-folha pro FP (head_end/headfront são filhos e colapsam junto).
  if (head) head.scale.setScalar(0.0001);

  // Pose base: idle compartilhado congelado (braços já chegam perto da arma; o IK refina).
  const mixer = new THREE.AnimationMixer(model);
  const idle = mixer.clipAction(clips.idle);
  idle.play();
  mixer.update(FROZEN_T);
  model.updateMatrixWorld(true);

  // Efetor = centro da palma MEDIDO da malha (ver measurePalmLocal).
  const palmR = measurePalmLocal(model, rHand, curlR);
  const palmL = measurePalmLocal(model, lHand, curlL);
  // Orientação fixa da mão no espaço da arma = a da pose congelada do rifle-hold.
  // A pose NÃO segura o rifle paralelo a +Z (segura atravessado no peito): mede o eixo
  // real do rifle congelado (linha palma R → palma L = direção do cano) no espaço do
  // modelo e corrige, senão as mãos transplantadas ficam tortas em cima da arma.
  const _qm = model.getWorldQuaternion(new THREE.Quaternion()).invert();
  const qFixR = _qm.clone().multiply(rHand.getWorldQuaternion(new THREE.Quaternion()));
  const qFixL = _qm.clone().multiply(lHand.getWorldQuaternion(new THREE.Quaternion()));
  const _pR = palmR.clone().applyMatrix4(rHand.matrixWorld);
  const _pL = palmL.clone().applyMatrix4(lHand.matrixWorld);
  const axisModel = _pL.sub(_pR).normalize().applyQuaternion(_qm);
  const qCorr = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), axisModel);
  qFixR.premultiply(qCorr);
  qFixL.premultiply(qCorr);

  const arms = {
    group, model, mixer, head,
    chainR: { bones: [rSh, rArm, rFore].filter(Boolean), end: rHand, endOffset: palmR },
    chainL: { bones: [lSh, lArm, lFore].filter(Boolean), end: lHand, endOffset: palmL },
    curlR, curlL,
    curlBaseR: curlR ? curlR.rotation.x : 0,
    curlBaseL: curlL ? curlL.rotation.x : 0,
    qFixR, qFixL,
    _tgtR: new THREE.Vector3(), _tgtL: new THREE.Vector3(),
    _errR: 0, _errL: null,
    // Métrica objetiva (convenção "medir, não olhar"): distância efetor→alvo IK por mão.
    gripError() { return { r: this._errR, l: this._errL }; },
  };
  return arms;
}

// Trava as mãos na arma visível. Rodar DEPOIS dos transforms do vm.root no update loop.
// weaponGroup = grupo da arma (vm.models[id]); o GLB real dentro dele chama-se 'rw'
// (espaço local: grip na origem, cano +Z — ver weapons.js gripPoints).
export function poseToWeapon(arms, weaponGroup, weaponId) {
  if (!arms || !weaponGroup) return;
  // Repõe a pose congelada (zera drift do CCD entre frames/trocas) e re-esconde a cabeça.
  arms.mixer.setTime(FROZEN_T);
  if (arms.head) arms.head.scale.setScalar(0.0001);

  const rw = weaponGroup.getObjectByName('rw') || weaponGroup;
  rw.updateWorldMatrix(true, false);
  rw.getWorldQuaternion(_qg);
  const gp = gripPoints(weaponId);

  // Mão R no grip (centro da palma no ponto de empunhadura; dedos fecham por cima).
  _t.copy(gp.grip).add(R_OFF_VEC.set(R_OFF[0], R_OFF[1], R_OFF[2]));
  arms._tgtR.copy(rw.localToWorld(_t));
  arms._errR = poseHand(arms.chainR, arms.qFixR, arms._tgtR);

  if (gp.fore) {
    // Mão L no guarda-mão.
    _t.copy(gp.fore).add(L_OFF_VEC.set(L_OFF[0], L_OFF[1], L_OFF[2]));
    arms._tgtL.copy(rw.localToWorld(_t));
    arms._errL = poseHand(arms.chainL, arms.qFixL, arms._tgtL);
  } else {
    // Arma de 1 mão: braço L relaxado junto ao quadril, fora do quadro (espaço vm.root).
    // Orientação natural (sem transplante) — o braço só desce pra fora do quadro.
    const root = arms.group.parent;
    root.updateWorldMatrix(true, false);
    arms._tgtL.copy(root.localToWorld(_t.set(-0.22, -0.55, -0.30)));
    solveCCDIK(arms.chainL.bones, arms.chainL.end, arms._tgtL, { iterations: 8, endOffset: arms.chainL.endOffset });
    arms._errL = _eff.copy(arms.chainL.endOffset).applyMatrix4(arms.chainL.end.matrixWorld).distanceTo(arms._tgtL);
  }

  // Dedos: fecha os dois lados em arma de 2 mãos; em 1 mão a L fica relaxada.
  const two = !ONE_HANDED.has(weaponId) && !!gp.fore;
  if (arms.curlR) arms.curlR.rotation.x = arms.curlBaseR + 0.85;
  if (arms.curlL) arms.curlL.rotation.x = arms.curlBaseL + (two ? 0.8 : 0.25);
}

const R_OFF_VEC = new THREE.Vector3();
const L_OFF_VEC = new THREE.Vector3();
