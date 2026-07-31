// Core game: FPS controller, weapons, bots, rounds, HUD.
import * as THREE from 'three';
import { MAPS, resolveMapId } from './maps.js';
import { buildCharacter, poseCharacter, byId, CHARACTERS, buildRifle, charWeapon } from './characters.js';
import { buildCharacterModel } from './glbchars.js';
import { weaponModel, weaponCFG, ONE_HANDED, WEAPON_IDS, PISTOLS, gripPoints } from './weapons.js';
import { buildFPArms, poseToWeapon, FP_OFF, getStaticVm, getStaticVmTex, loadStaticVm } from './fparms.js';
import { VM_GUNSPACE, gunBasis, buildVmAttachment } from './vmattach.js';
import { GPUParticles } from './gpuparticles.js';
import { RecoilAxis } from './springs.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const WEAPONS = {
  awp:    { name: 'AWP "DELIBERADOR"', short: 'AWP', dmg: 400, mag: 5, reserve: 25, rate: 1.7, reload: 3.1, spreadHip: 0.075, spreadScope: 0.0008, recoil: 0.055, scope: true },
  ak:     { name: 'AK-47 "BATE-ESTACA"', short: 'AK', dmg: 33, mag: 30, reserve: 90, rate: 0.1, reload: 2.5, spreadHip: 0.024, recoil: 0.008, auto: true },
  m4:     { name: 'M4A1 "REQUINTE"', short: 'M4', dmg: 31, mag: 30, reserve: 90, rate: 0.09, reload: 2.4, spreadHip: 0.02, recoil: 0.007, auto: true },
  mp5:    { name: 'MP5 "VASSOURA"', short: 'MP5', dmg: 26, mag: 30, reserve: 120, rate: 0.075, reload: 2.2, spreadHip: 0.03, recoil: 0.005, auto: true },
  shotgun:{ name: 'M3 "CONVERSA FIADA"', short: 'M3', dmg: 12, pellets: 8, mag: 7, reserve: 32, rate: 0.9, reload: 3.0, spreadHip: 0.06, recoil: 0.045 },
  deagle: { name: 'DEAGLE "MARTELO"', short: 'DE', dmg: 53, mag: 7, reserve: 35, rate: 0.28, reload: 2.0, spreadHip: 0.012, recoil: 0.03 },
  pistol: { name: 'PT-38 "APITO"', short: 'PT-38', dmg: 34, mag: 12, reserve: 48, rate: 0.24, reload: 1.6, spreadHip: 0.02, recoil: 0.014, scope: false },
  knife:  { name: 'FACA "CONVERSA FIADA"', short: 'FACA', dmg: 55, rate: 0.55, range: 2.4, reload: 0, recoil: 0.02, scope: false },
  // arsenal 2 (BR)
  m92:       { name: 'ZASTAVA M92 "IOGUSLAVO"', short: 'M92', dmg: 32, mag: 30, reserve: 90, rate: 0.1, reload: 2.5, spreadHip: 0.026, recoil: 0.009, auto: true },
  akm:       { name: 'AKM "KALASH DA VÉIA"', short: 'AKM', dmg: 35, mag: 30, reserve: 90, rate: 0.105, reload: 2.5, spreadHip: 0.025, recoil: 0.009, auto: true },
  g3:        { name: 'HK G3 "FRITZ"', short: 'G3', dmg: 37, mag: 20, reserve: 80, rate: 0.11, reload: 2.6, spreadHip: 0.022, recoil: 0.013, auto: true },
  revolver38:{ name: 'REVÓLVER .38 "TROVÃO"', short: '.38', dmg: 46, mag: 6, reserve: 24, rate: 0.36, reload: 2.4, spreadHip: 0.016, recoil: 0.03 },
  md97:      { name: 'MD97 "FUZIL DA PÁTRIA"', short: 'MD97', dmg: 38, mag: 20, reserve: 80, rate: 0.12, reload: 2.6, spreadHip: 0.022, recoil: 0.012, auto: true },
  carbine:   { name: 'CARABINA "PAPO DE PEÃO"', short: 'CARB', dmg: 42, mag: 10, reserve: 40, rate: 0.5, reload: 2.8, spreadHip: 0.02, recoil: 0.02 },
  m400:      { name: 'M400 "MIRA FINA"', short: 'M400', dmg: 40, mag: 20, reserve: 80, rate: 0.11, reload: 2.4, spreadHip: 0.018, spreadScope: 0.004, recoil: 0.011, auto: true, scope: false },   // G2-R6A: era scope:true — a máscara preta de luneta "pulava" na tela ao mirar (dono: "faixa preta"); agora ADS AUG-style (zoom 34, arma visível, crosshair)
  mosin:     { name: 'MOSIN "VOVÓ RUSSA"', short: 'MOSIN', dmg: 120, mag: 5, reserve: 25, rate: 1.5, reload: 3.4, spreadHip: 0.08, spreadScope: 0.001, recoil: 0.05, scope: true },
  rem700:    { name: 'REM 700 "CAÇADOR"', short: 'REM', dmg: 130, mag: 5, reserve: 25, rate: 1.5, reload: 3.2, spreadHip: 0.08, spreadScope: 0.0009, recoil: 0.05, scope: true },
  // snipers SEMI-AUTO (estilo M400: luneta + tiro rápido) — dano/cadência entre a M400 e os ferrolhos.
  // scope:false (G2-R6A): a máscara preta full-screen "pulava" ao mirar com o que o dono via como
  // "rifles" — viram ADS AUG-style (zoom do _zoomFov, sem overlay). Ferrolhos (awp/mosin/rem700) mantêm a luneta.
  svd:       { name: 'SVD "VODKA"', short: 'SVD', dmg: 62, mag: 10, reserve: 40, rate: 0.28, reload: 3.0, spreadHip: 0.05, spreadScope: 0.0015, recoil: 0.03, auto: true, scope: false },
  g3sg1:     { name: 'G3SG1 "FRITZ"', short: 'G3SG1', dmg: 55, mag: 20, reserve: 60, rate: 0.22, reload: 2.8, spreadHip: 0.045, spreadScope: 0.0016, recoil: 0.026, auto: true, scope: false },
  sks:       { name: 'SKS "MILÍCIA"', short: 'SKS', dmg: 48, mag: 10, reserve: 50, rate: 0.18, reload: 2.6, spreadHip: 0.04, spreadScope: 0.002, recoil: 0.02, auto: true, scope: false },
  // arsenal 3 (militar)
  lmg:       { name: 'METRALHA "TRETA PESADA"', short: 'LMG', dmg: 31, mag: 100, reserve: 200, rate: 0.085, reload: 5.0, spreadHip: 0.04, recoil: 0.011, auto: true },
  scar:      { name: 'SCAR "PAGA-PAU"', short: 'SCAR', dmg: 37, mag: 20, reserve: 80, rate: 0.11, reload: 2.5, spreadHip: 0.02, recoil: 0.01, auto: true },
  tavor:     { name: 'TAVOR "CURTINHO"', short: 'TAVOR', dmg: 32, mag: 30, reserve: 90, rate: 0.09, reload: 2.3, spreadHip: 0.024, recoil: 0.008, auto: true },
  famas:     { name: 'FAMAS "BAGUETE"', short: 'FAMAS', dmg: 29, mag: 25, reserve: 90, rate: 0.06, reload: 2.4, spreadHip: 0.028, recoil: 0.006, auto: true },
  uzi:       { name: 'UZI "RÁ-TÁ-TÁ"', short: 'UZI', dmg: 25, mag: 25, reserve: 100, rate: 0.07, reload: 2.1, spreadHip: 0.032, recoil: 0.006, auto: true },
  p90:       { name: 'P90 "CHINELÃO"', short: 'P90', dmg: 23, mag: 50, reserve: 100, rate: 0.065, reload: 2.3, spreadHip: 0.03, recoil: 0.005, auto: true },
};
const ROUND_TIME = 99, ROUNDS_TO_WIN = 3, RESPAWN_DELAY = 2.5, PICKUP_RESPAWN = 8, SPAWN_PROT = 3;
const BOT_SPEED = 3.3, BOT_EYE = 1.5;
const BOT_VIEW = 45;              // alcance de aquisição de alvo (m) — ver comentário no think
const BOT_AIM_PITCH = 15 * Math.PI / 180;   // clamp do pitch da cabeça ao mirar (rad)
const TEAM_LABEL = { P: 'PETISTAS', B: 'BOLSONARISTAS' };
const RADIO = {
  z: { title: 'COMANDOS', items: ['Bora, bora, bora!', 'Cobre eu!', 'Recua, recua!'] },
  x: { title: 'RESPOSTAS', items: ['Recebido!', 'Negativo!', 'Bonito tiro!'] },
  c: { title: 'ZOAÇÃO', items: ['Chora na live!', 'É fake news!', 'Vem pra treta!'] },
};
const MK_TIERS = { 2: 'doublekill', 3: 'triplekill', 4: 'multikill', 5: 'megakill' };
const MK_LABELS = { doublekill: 'DOUBLE KILL', triplekill: 'TRIPLE KILL', multikill: 'MULTI KILL', megakill: 'MEGA KILL', killingspree: 'KILLING SPREE', godlike: 'GODLIKE' };
// Classe do viewmodel ESTÁTICO Tripo por arma — TODAS as armas têm classe (arms_<cls>.glb).
// Snipers entram na classe 'awp' com VARIAÇÃO de acabamento por arma (SNIPER_VM abaixo).
const STATIC_CLASS = {};
for (const w of ['ak', 'akm', 'm4', 'm92', 'g3', 'carbine', 'mp5', 'uzi', 'p90', 'scar', 'tavor', 'famas', 'lmg']) STATIC_CLASS[w] = 'rifle';
for (const w of ['pistol', 'deagle', 'revolver38']) STATIC_CLASS[w] = 'pistol';
for (const w of ['shotgun', 'md97']) STATIC_CLASS[w] = 'shotgun';
for (const w of ['awp', 'mosin', 'rem700', 'm400', 'svd', 'g3sg1', 'sks']) STATIC_CLASS[w] = 'awp';
STATIC_CLASS['knife'] = 'knife';
// Variação visual por sniper sobre o MESMO arms_awp.glb: TEXTURA por variante (gerada
// offline com máscara mãos-vs-arma — mãos/luvas pixel-idênticas) + micro-delta de
// escala/posição. A tentativa anterior de tint no material falhava (material único
// tingia as mãos; crítico R6). chave = id da arma (staticVms).
const SNIPER_VM = {
  awp:    { tex: 'awp_glove', orm: 'awp_orm_wear', att: ['scope_awp'] },
  mosin:  { tex: 'awp_mosin', orm: 'awp_orm_wear', dPos: [0.005, 0.01, -0.02], dScale: 1.04, att: ['mosinbolt', 'mosinbarrel', 'scope_pu'], muzzleExt: 0.25 },  // madeira + ferrolho + PU fina
  rem700: { tex: 'awp_rem700', orm: 'awp_orm_wear', dPos: [0, -0.005, 0], att: ['rem700barrel', 'scope_hunt'] },                                          // oliva escuro + bull barrel
  m400:   { tex: 'awp_m400', orm: 'awp_orm_wear', dPos: [-0.01, 0.005, 0.01], dScale: 0.97 },     // desert tan
  svd:    { tex: 'awp_svd', orm: 'awp_orm_wear', dPos: [0.01, -0.01, -0.03], dScale: 1.05, att: ['svdstock', 'svdguard', 'scope_svd'] },                     // preto fosco + esqueleto + PSO-1
  g3sg1:  { tex: 'awp_g3sg1', orm: 'awp_orm_wear', dPos: [0, 0, -0.01], att: ['g3sg1stock', 'g3sg1guard', 'bipod', 'scope_zf'] },                          // cinza-verde + coronha G3 + handguard largo + bipé (G2-R10) + ZF curta
  sks:    { tex: 'awp_sks', orm: 'awp_orm_wear', dPos: [-0.005, 0.008, -0.015], dScale: 1.02, att: ['sksmag', 'sksbayonet', 'sksclip'] },                  // madeira (corpo inteiro, G2-R10) + pente integral + pente no topo + baioneta
};
// Identidade POR ARMA nas classes rifle/pistol/shotgun (GAUNTLET 2.0 — "os rifles estão
// todos iguais"): textura de acabamento (tools/vm-variant-tex.mjs — máscara mãos-vs-arma
// por texel+3D, mãos preservadas) + ATTACHMENTS procedurais (primitivas alinhadas ao
// eixo do cano — gun-space medido em tools/g2-gunspace.mjs). Mesma regra do SNIPER_VM:
// chave = id da arma em staticVms. Rifles sem entrada (m92/carbine/uzi/tavor/lmg) caem
// na base 'rifle' (acabamento M4). att = lista de attachments (buildVmAttachment).
const RIFLE_VM = {
  ak:    { tex: 'rifle_ak', att: ['akmag'] },                                  // madeira + mag curva 7.62
  akm:   { tex: 'rifle_akm', orm: 'rifle_orm_akm', att: ['akmag_bakelite', 'gastube', 'slantbrake'] },// + gas tube + slant brake (FORMA, não cor)
  m4:    { tex: 'rifle_lift', att: ['holo'] },                                 // base M4 + EOTech
  mp5:   { tex: 'rifle_mp5', att: ['suppressor', 'slimmag'], muzzleExt: 0.42 },// MP5SD supressor GORDO/LONGO + mag fina
  g3:    { tex: 'rifle_g3', orm: 'rifle_orm_g3', att: ['g3stock', 'g3mag'] },                       // coronha fixa larga + mag longa
  scar:  { tex: 'rifle_scar', orm: 'rifle_orm_scar', att: ['aimpoint'] },                             // FDE tan + aimpoint tubular
  famas: { tex: 'rifle_famas', orm: 'rifle_orm_famas', att: ['famashump'] },                           // carry handle arqueado alto
  p90:   { tex: 'rifle_p90', orm: 'rifle_orm_p90', att: ['p90mag', 'p90body', 'p90cover'], dScale: 0.85, dPos: [0.01, 0.01, 0] },  // mag horizontal + corpo + SEM mag embaixo; MENOR (SMG — G2-R10: SEM avançar z, o dPos z+ comia a redução aparente)
  m92:   { tex: 'rifle_m92', orm: 'rifle_orm_m92', att: ['m92barrel', 'lever'], muzzleExt: 0.28 },   // carabina de alavanca: nogal + aço azulado (G2-R8 — era rifle_ak, lia como AK)
  carbine: { tex: 'rifle_carbine', orm: 'rifle_orm_carbine', att: ['longbarrel'], muzzleExt: 0.26 },     // M1: madeira clara + parkerizado (G2-R8 — era rifle_lift, lia como uzi/M4)
  uzi:   { tex: 'rifle_mp5', orm: 'rifle_orm_mp5', att: ['uzibody', 'uzimag', 'uzimagcover'] },   // boxy + mag no grip (G2-R13: framing próprio em VM_FWD.uzi — dScale/dPos absorvidos lá)
  tavor: { tex: 'rifle_tavor', orm: 'rifle_orm_tavor', att: ['tavorbody', 'tavormag', 'tavorshroud'] },// polímero preto + bullpup: cheek rest + mag atrás do grip (G2-R9: tex própria — era rifle_famas)
  lmg:   { tex: 'rifle_lift', orm: 'rifle_orm_lmg', att: ['lmgbox', 'bipod'] },                      // caixa + cinto de cartuchos + bipé
};
const PISTOL_VM = {
  deagle:     { tex: 'pistol_deagle', orm: 'pistol_orm_wear', metal: 0.55, rough: 0.55, env: 2.2 },   // cromada (slide longo já lê na textura; extensão 3D lia como "cartão" no ângulo FP)
  revolver38: { tex: 'pistol_revolver38', att: ['drum2', 'drumside'] },                                     // aço azulado + tambor à frente + cilindro lateral
};
const SHOTGUN_VM = {
  md97: { tex: 'shotgun_md97', att: ['shells', 'tacguard', 'pgrip'] },         // tática: shells + handguard ventilado + pistol grip
};
// FOV da vmCamera com HORIZONTAL constante (GAUNTLET 2.0 — bug 3:2): referência 16:9
// (fov vertical 70). Em telas mais altas (MacBook 3024×1964 ≈ 1.54:1) o FOV horizontal
// encolhia e o VM invadia a tela; aqui o vertical abre p/ compensar — em 16:9 retorna
// exatamente 70 (comportamento de referência inalterado).
function vmFovForAspect(aspect) {
  const REF = 16 / 9, V0 = 70 * Math.PI / 180;
  const halfH = Math.atan(Math.tan(V0 / 2) * REF);
  return 2 * Math.atan(Math.tan(halfH) / aspect) * 180 / Math.PI;
}
// chave do staticVm por arma (variante por id quando existe; senão a classe)
function staticVmKey(w) {
  return (SNIPER_VM[w] || RIFLE_VM[w] || PISTOL_VM[w] || SHOTGUN_VM[w]) ? w : (STATIC_CLASS[w] || null);
}
// ARMAS-HERÓI dedicadas (G2-R7 AK; G2-R7B M4/MP5/AWP — prova Tripo por arma):
// arms_<tpl>.glb já nasce a arma de verdade (sem kit procedural) — NÃO recebe
// textura-variante nem attachments (UV/geometria próprios). Só o material fix
// global. Sem a GLB carregada (ou com ?no<arma>=1, A/B do dono), cai no kit
// clássico da classe. tpl = chave de template E de gun-space/VM_FWD (a AWP-herói
// usa 'awphero' p/ não colidir com a CLASSE awp, que serve as outras 6 snipers).
// Módulo (G2-R14A): o lazy-load (_ensureStaticVm / vmPreloadClasses) precisa dela fora do build.
const DED_VM = { ak: 'ak', m4: 'm4', mp5: 'mp5', awp: 'awphero', p90: 'p90', tavor: 'tavor', famas: 'famas', svd: 'svd' };   // uzi REMOVIDA G2-R12 (kit tem o tell); svd G2-R13
// Classes de viewmodel p/ pré-carregar no boot dado o loadout inicial (G2-R14A lazy-load):
// as 3 do loadout base (rifle/pistol/faca) + a classe da arma do personagem + a herói
// dedicada dela. As demais sobem sob demanda no _switchWeapon (cacheadas depois da 1ª vez).
export function vmPreloadClasses(weaponId) {
  const set = new Set(['rifle', 'pistol', 'knife']);
  const cls = STATIC_CLASS[weaponId];
  if (cls) set.add(cls);
  if (DED_VM[weaponId]) set.add(DED_VM[weaponId]);
  return [...set];
}
// Encolhimento global dos viewmodels (G2-R14A — dono: "armas tomam a maior parte da
// tela, quero ver o jogo"): ~28% menor em tamanho aparente nos VMs estáticos (heróis
// + classes). Muzzles são recomputados do transform final no build — seguem a escala.
const VM_SHRINK = 0.72;
// GUN-SPACE e attachments: public/js/vmattach.js (medidas em tools/g2-gunspace.mjs).

// Dificuldade RANDÔMICA por bot (não há mais seletor): 50% ruins, 20% médios, 20% bons,
// 10% muito bons. Retorna um escalar `skill` (usado em reação/cadência/chance de acerto).
const BOT_SKILLS = [  { p: 0.50, tier: 'ruim', skill: 0.6 },
  { p: 0.20, tier: 'medio', skill: 0.95 },
  { p: 0.20, tier: 'bom', skill: 1.25 },
  { p: 0.10, tier: 'muitobom', skill: 1.7 },
];
function rollBotSkill() {
  let r = Math.random();
  for (const s of BOT_SKILLS) { if (r < s.p) return s.skill; r -= s.p; }
  return BOT_SKILLS[0].skill;
}

export class Game {
  constructor({ renderer, textures, sfx, settings, playerCharId, playerTeam, playerFaction, enemyFaction, nickname, mapId, ctf, testMode = false, onQuit, onMatchEnd }) {
    this._ctfOpt = ctf;
    this.renderer = renderer;
    this.sfx = sfx;
    this.settings = settings;
    this.testMode = testMode;
    this.onQuit = onQuit;
    this.onMatchEnd = onMatchEnd;
    this.state = 'boot';
    this.paused = false;
    this.time = 0;
    this.mk = { count: 0, until: 0, life: 0 };
    this.radioOpen = null;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.08, 400);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);
    this._mapId = resolveMapId(mapId);
    this.world = MAPS[this._mapId].build(this.scene, textures);
    this._buildEnv();   // IBL: env map de gradiente dusk -> materiais PBR (Standard) ganham ambiente/reflexo
    this.flashTex = textures.flash;
    // modo de armas também muda o mapa: pickups fora do modo somem (e suas meshes)
    if (this.world.pickups) {
      const keep = [];
      for (const pk of this.world.pickups) {
        if (this._pickupAllowed(pk.weapon)) {
          const rw = weaponModel(pk.weapon);            // swap the map's box gun for the real GLB
          if (rw && pk.mesh) {
            rw.position.copy(pk.mesh.position); rw.position.y = Math.max(0.16, rw.position.y);
            rw.rotation.set(0, pk.mesh.rotation.y || Math.random() * 6.28, 0.12);
            rw.traverse(o => { if (o.isMesh) o.castShadow = true; });
            this.scene.remove(pk.mesh); this.scene.add(rw); pk.mesh = rw;
          }
          keep.push(pk);
        } else if (pk.mesh) this.scene.remove(pk.mesh);
      }
      this.world.pickups = keep;
    }

    // teams & rosters. playerTeam = LADO físico (P/B) — dirige tudo (spawns/placar/killfeed/CTF/
    // cores/yaw). playerFaction = de qual ROSTER vêm os personagens do jogador ('P'/'B'/'U' Tribos
    // Urbanas). Assim o 3º time entra sem tocar em nenhum sistema P/B: ele joga no lado P vs o
    // inimigo político do lado B. enemyFaction = enemyTeam (o inimigo é sempre político).
    this.playerTeam = playerTeam;
    this.playerFaction = playerFaction || playerTeam;
    this.enemyTeam = playerTeam === 'B' ? 'P' : 'B';
    // facção do INIMIGO (o jogador escolhe o adversário: P/B/U). Default = lado político oposto.
    // Se == playerFaction é um MIRROR (mesmo time dos dois lados) -> o inimigo fica ROXO no HUD.
    this.enemyFaction = enemyFaction || this.enemyTeam;
    this.playerDef = byId(playerCharId);
    this.playerCharId = playerCharId;   // usado por _buildViewModels (paleta/braços FP) e _resetPositions (loadout)
    this.combatants = [];   // scoreboard entries

    // ---- player ----
    // Spawns holding the SAME weapon shown on the character-select screen (charWeapon).
    // primary/secondary remember the last weapon of each slot for the 1/2 keys.
    const startWeapon = charWeapon(playerCharId);
    this.player = {
      isPlayer: true, name: (nickname || '').trim().slice(0, 14) || 'VOCÊ', def: this.playerDef, team: playerTeam,
      pos: new THREE.Vector3(), vel: new THREE.Vector3(),
      yaw: 0, pitch: 0, hp: 100, alive: true, respawnAt: 0, crouchF: 0,
      weapon: startWeapon, scoped: false, reloadUntil: 0, nextShotAt: 0, drawUntil: 0,
      primary: startWeapon, secondary: 'pistol',
      ammo: Object.fromEntries(Object.keys(WEAPONS).filter(w => w !== 'knife').map(w => [w, { mag: WEAPONS[w].mag, res: WEAPONS[w].reserve }])),
      kills: 0, deaths: 0, headshots: 0, grounded: true, stepPhase: 0, revealedAt: -99, protUntil: 0, smokes: 5,
    };
    this.combatants.push(this.player);

    // ---- bots ----
    this.bots = [];
    // Custom match: team size (total per side, player fills one ally slot). Dificuldade
    // é RANDÔMICA por bot (rollBotSkill), não mais um seletor único de partida.
    const teamSize = Math.max(1, Math.min(8, this.settings.bots || 4));
    // Rotação aleatória do pool por partida: sem ela só os 8 primeiros do time viravam
    // bots (personagens no fim da lista, ex.: canarinho/proerd, nunca apareciam).
    const cycle = (pool, n) => {
      const r = pool.length ? (Math.random() * pool.length) | 0 : 0;
      return Array.from({ length: Math.max(0, n) }, (_, i) => pool[(i + r) % pool.length]).filter(Boolean);
    };
    // aliados vêm da FACÇÃO do jogador (P/B/U); inimigos do lado político oposto (enemyTeam).
    const allyDefs = cycle(CHARACTERS.filter(c => c.team === this.playerFaction && c.id !== playerCharId), teamSize - 1);
    const enemyDefs = cycle(CHARACTERS.filter(c => c.team === this.enemyFaction), teamSize);
    const mkBot = (def, team, i) => {
      const wpn = this._botWeapon();
      const c = buildCharacterModel(def, { weaponId: wpn }) || buildCharacter(def);
      c.group.traverse(o => { o.userData.botOwner = null; });
      const bot = {
        isPlayer: false, name: def.name, def, team,
        mesh: c, pos: new THREE.Vector3(), yaw: 0, hp: 100, alive: true,
        respawnAt: 0, protUntil: 0, kills: 0, deaths: 0,
        target: null, reactAt: 0, nextShotAt: 0, skill: rollBotSkill() * (0.9 + Math.random() * 0.2), weapon: wpn,
        path: null, pathIdx: 0, repathAt: 0, roamIdx: 0, phase: 0, think: Math.random() * 0.2,
        deadT: 0, strafeT: Math.random() * 10, revealedAt: -99,
        crouchBias: Math.random() < 0.45, // ~half the bots hold angles crouched (AWPer style)
      };
      c.group.traverse(o => { o.userData.botOwner = bot; });
      this.scene.add(c.group);
      this.bots.push(bot); this.combatants.push(bot);
      return bot;
    };
    allyDefs.forEach((d, i) => mkBot(d, playerTeam, i));
    enemyDefs.forEach((d, i) => mkBot(d, this.enemyTeam, i));

    // ---- view model ----
    this.vm = this._buildViewModels();
    // VM em CENA PRÓPRIA (port do CoD: viewScene/viewCamera separados, render/index.js):
    // a arma ganha rig de luz dedicado (key/fill/rim/bounce) que NÃO depende do sol do
    // mapa — legível no escuro, rim recortando a silhueta, sem estourar no claro. O
    // composer desenha essa cena por cima do mundo (RenderPass clear=false/clearDepth=
    // true, ver bloom.js/stylize.js); sem pós (quality low/?bloom=0) há fallback no tick.
    // vm.root continua recebendo os mesmos transforms em view space (kick/bob/sway/ADS).
    this.vmCamera = new THREE.PerspectiveCamera(vmFovForAspect(this.camera.aspect), this.camera.aspect, 0.01, 5);
    this.vmScene = new THREE.Scene();
    this.vmScene.environment = this.scene.environment;   // mesmo IBL do mapa (metais leem)
    this.vmScene.add(this.vm.root);
    {
      // direções fixas em VIEW SPACE (a vmCamera nunca se move — posiciona uma vez só)
      const dir = (hex, i, x, y, z) => { const l = new THREE.DirectionalLight(hex, i); l.position.set(x, y, z); l.castShadow = false; this.vmScene.add(l, l.target); return l; };
      dir(0xffe8c4, 3.2, -0.45, 0.75, 0.55);    // key: quente, cima-frente-esquerda
      dir(0x9ec4ff, 0.8, 0.6, -0.15, 0.5);      // fill: frio, baixo-frente-direita
      dir(0xa8c8ff, 0.25, 0.55, 0.35, 0.75);    // sky fill: fria, do lado oposto à key
      // NOTA (R6.8): a fill camera-locked foi medida inútil (mediana 7.9→8.0) — quem
      // carrega a AK é o piso emissivo por-classe (emisI 5, mediana 7.9→36.7). Removida
      // porque gessificava os metais claros (shotgun).
      dir(0xffd7a8, 1.6, 0.2, 0.35, -0.9);      // rim: quente, por trás — recorta a silhueta
      dir(0xffb87a, 0.85, -0.2, -0.86, 0.47);   // bounce: chão quente vindo de baixo
      this.vmScene.add(new THREE.HemisphereLight(0x8fb6ff, 0x36302a, 0.9));
      // muzzle flash CoD: point light quente NA CENA DO VM pulsando ~45ms a cada tiro —
      // ilumina o viewmodel por dentro (a vmScene é renderizada à parte, então a luz do
      // mundo não pega na arma). Sempre presente com intensidade 0 (sem recompilar shader).
      this._vmFlashLight = new THREE.PointLight(0xffd9a0, 0, 3, 2);
      this._vmFlashLight.position.set(0.1, -0.06, -0.75);   // boca do cano em view space (pose GAUNTLET 2.0)
      this.vmScene.add(this._vmFlashLight);
      this._vmFlash = { t: 1, life: 0.045, peak: 1.6 };
    }
    this.scene.userData.vmPass = { scene: this.vmScene, camera: this.vmCamera };

    // ---- fx pools ----
    this.tracers = [];
    this.decals = [];
    // bullet-hole decal: shared geometry+material, oriented to the surface normal at hit
    {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const x = c.getContext('2d');
      const g = x.createRadialGradient(32, 32, 2, 32, 32, 30);
      g.addColorStop(0, 'rgba(12,10,9,0.98)'); g.addColorStop(0.4, 'rgba(18,16,14,0.85)');
      g.addColorStop(0.75, 'rgba(24,22,19,0.35)'); g.addColorStop(1, 'rgba(24,22,19,0)');
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      // cracks radiating out
      x.strokeStyle = 'rgba(20,17,14,0.7)'; x.lineWidth = 1.6;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + Math.random() * 0.5;
        x.beginPath(); x.moveTo(32 + Math.cos(a) * 10, 32 + Math.sin(a) * 10);
        x.lineTo(32 + Math.cos(a) * (20 + Math.random() * 9), 32 + Math.sin(a) * (20 + Math.random() * 9)); x.stroke();
      }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      this._holeGeo = new THREE.PlaneGeometry(0.22, 0.22);
      this._holeMat = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    }
    this.drops = [];
    this.puffTex = this._makePuffTexture();
    // GPU-batched particles: ALL muzzle flashes share one Points (additive), ALL impact puffs
    // share another (soft smoke) — 1 draw call each, zero per-shot allocation (ring buffer).
    this.flashFx = new GPUParticles(this.scene, this.camera, { tex: this.flashTex, additive: true });
    this.puffFx = new GPUParticles(this.scene, this.camera, { tex: this.puffTex, additive: false });
    // Muzzle flash (R7.5): 2 SPRITES additivos por tiro — estrela irregular com ruído +
    // núcleo branco-quente — compactos (0.35-0.5m), na boca do VM (baixo-direita), vida
    // ≤3 frames (~50ms). Era um cone de 8 segmentos + icosaedro escalado até 1.4 spawnado
    // no EIXO da câmera: a "pirâmide laranja" que tapava 30-50% da tela (crítico R7.5).
    // Pool reusado (0 alloc/tiro); luzes SEMPRE visíveis com intensidade 0 (nº constante
    // de luzes -> sem recompilar shader/hitch).
    this._mzFlashTex = this._makeFlashTex();
    this._mzCoreTex = this._makeFlashCoreTex();
    this._mzPool = []; this._mzActive = [];
    for (let i = 0; i < 8; i++) {
      const jetMat = new THREE.SpriteMaterial({ map: this._mzFlashTex, color: 0xffc26a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      const coreMat = new THREE.SpriteMaterial({ map: this._mzCoreTex, color: 0xfff6dc, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      const grp = new THREE.Group();
      const jet = new THREE.Sprite(jetMat), core = new THREE.Sprite(coreMat);
      grp.add(jet, core); grp.visible = false; grp.frustumCulled = false; this.scene.add(grp);
      this._mzPool.push({ grp, jet, core, jetMat, coreMat, t: 0, life: 0.05 });
    }
    this._mzLights = []; this._mzLightActive = [];
    for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xffd28a, 0, 9, 2); this.scene.add(l); this._mzLights.push(l); }
    // Flash de 1ª PESSOA (R7.6): pool de sprites FILHOS do vm.root — herdam kick/bob/ADS do
    // frame, então a estrela fica COLADA na boca do cano mesmo durante o coice (era sprite
    // no mundo spawnado de ponto fixo camera-local: 89-226px de distância no kick — crítico).
    // Menor que o do mundo: a boca fica a ~0.35m da lente.
    this._vmMzPool = []; this._vmMzActive = [];
    for (let i = 0; i < 3; i++) {
      const jetMat = new THREE.SpriteMaterial({ map: this._mzFlashTex, color: 0xffc26a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      const coreMat = new THREE.SpriteMaterial({ map: this._mzCoreTex, color: 0xfff6dc, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      const grp = new THREE.Group();
      const jet = new THREE.Sprite(jetMat), core = new THREE.Sprite(coreMat);
      grp.add(jet, core); grp.visible = false; grp.frustumCulled = false;
      this.vm.root.add(grp);
      this._vmMzPool.push({ grp, jet, core, jetMat, coreMat, t: 0, life: 0.05 });
    }
    // tracer mesh pool (shared unit geometry + material; reused, never disposed per shot).
    // Estilo Claude-of-Duty (fx/tracers.js): rastro FINO branco-quente que VIAJA da boca ao
    // alvo e some em ~50-60ms — projétil passando, não "raio laser" amarelo persistente.
    this._tracerGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 1, 5, 1, true);   // fino (era 0.0065 — "lightsaber branca" em cena clara)
    this._tracerMat = new THREE.MeshBasicMaterial({ color: 0xfff3d6, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    this._tracerPool = [];
    // Pose de ADS (iron-sight) POR CLASSE (R7.5): delta aplicado ao vm.root conforme adsF
    // 0→1 — x/y/z deslocam, s = scale-down, rx/ry nivelam a pose baked. LIMITAÇÃO MEDIDA
    // (6 sweeps de captura, r75): o arms_rifle.glb é mesh ÚNICO com o cano baked em
    // diagonal (cant no roll) e o braço de apoio envolve o near-plane da câmera — qualquer
    // centralização forte varre o braço pela lente (por isso o damp 0.12 da R5). A pose
    // final é rotação-dominante: a arma VIRA e SOBE em direção ao centro de forma legível
    // sem invadir a tela. Pistol mantém a curva antiga ×0.35 ("mira pelo slide", aprovada).
    this._adsPose = {
      rifle:  { x: -0.03, y: 0.005, z: -0.04, s: 1, rx: 0, ry: 0 },   // rx/ry zerados (G2-R6A): a pose forward já nasce nivelada — a rotação era p/ corrigir a diagonal baked antiga
      shotgun:{ x: -0.03, y: 0.005, z: -0.04, s: 1, rx: 0, ry: 0 },   // G2-R14A: ADS da shotgun (mesma receita do rifle — mesh baked impede sight picture, VM desliza)
      pistol: { x: -0.06, y: 0.0175, z: -0.035, s: 1, rx: 0, ry: 0 },
      _hip:   { x: -0.02, y: 0.006, z: -0.012, s: 1, rx: 0, ry: 0 },
    };
    // Boca REAL do cano por classe (R7.6): média dos vértices no 4% mais profundo (-z) do
    // mesh estático do VM, medida em probe headless (view space == camera space — vmCamera
    // e câmera principal dividem a orientação). Antes o flash/tracer nasciam de um ponto
    // fixo da câmera a ~250px da arma ("impacto na parede", crítico R7.5).
    this._vmMuzzle = {
      rifle:   new THREE.Vector3(0.245, -0.144, -0.352),
      shotgun: new THREE.Vector3(0.221, -0.214, -0.355),
      pistol:  new THREE.Vector3(0.036, 0.018, -0.29),   // centro da face do cano (bore) — calibrado em captura hip+kick
      awp:     new THREE.Vector3(0.076, -0.191, -0.427),
      knife:   new THREE.Vector3(0.2, -0.12, -0.4),
    };
    // boca por CLASSE recomputada no build (pose nova rifle/shotgun) + por ARMA
    // (attachments que estendem o cano — supressor do MP5). Lookup arma→classe→fallback.
    Object.assign(this._vmMuzzle, this._vmMuzzleCls || {}, this._vmMuzzleExt || {});
    // cápsulas (brass) ejetadas a cada tiro — geo/mat compartilhados, pool reusado
    this._casingGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.034, 6);
    this._casingMat = new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 0.85, roughness: 0.4 });
    this._casings = []; this._casingPool = [];
    // granada de fumaça: projétil (mesh) + nuvem de sprites billboard que bloqueia a visão dos bots
    this._grenades = []; this._smokes = [];
    this._grenGeo = new THREE.SphereGeometry(0.06, 8, 6);
    this._grenMat = new THREE.MeshStandardMaterial({ color: 0x38472c, metalness: 0.2, roughness: 0.8 });
    this._fragMat = new THREE.MeshStandardMaterial({ color: 0x4a2018, metalness: 0.5, roughness: 0.55 });   // HE frag (marrom-metálico)
    this._smokeTex = this._makeSmokeTex();
    // modo Capture the Flag (?ctf=1): 3 pontos (2 spawns + meio); time vence o round segurando
    // os 3 ao mesmo tempo. Rounds SEM FIM (sem _endMatch). Captura = ~3s na zona sem inimigo.
    this.ctf = !!this._ctfOpt || (new URLSearchParams(location.search).get('ctf') === '1');   // menu (Capture the Flag) ou ?ctf=1
    this.ctfPts = [];
    this.ctfCaps = { P: 0, B: 0 };   // total de capturas de bandeira por time (cumulativo na partida)
    this._ctfRingGeo = new THREE.TorusGeometry(1, 0.045, 8, 48);   // anel FINO de contorno (era disco gordo)
    this._ctfZoneGeo = new THREE.CircleGeometry(1, 40);
    this._ctfZoneTex = this._makeCtfZoneTex();
    this._ctfGray = new THREE.Color(0x8a8a86);   // dessaturação da cor de time na zona (-50% sat)
    this.ray = new THREE.Raycaster();

    // ---- round state ----
    this.roundNum = 0;
    this.roundsWon = { P: 0, B: 0 };
    this.roundKills = { P: 0, B: 0 };
    this.timeLeft = ROUND_TIME;
    this.stateUntil = 0;

    this._dom();
    this._input();
    this._applyQuality();
    this.radarCtx = this.el.radar ? this.el.radar.getContext('2d') : null;
    // botões do HUD: configurações + liga/desliga falas (memes)
    this.el.hudSettings.onclick = () => this.onOpenSettings?.();
    this.el.hudSpeech.textContent = this.settings.speech === false ? '🔇' : '🔊';
    this.el.hudSpeech.onclick = () => {
      const on = this.onToggleSpeech?.();
      this.el.hudSpeech.textContent = on ? '🔊' : '🔇';
    };
  }

  /* ================= setup ================= */
  _dom() {
    const $ = id => document.getElementById(id);
    this.el = {
      hud: $('hud'), crosshair: $('crosshair'), hitmarker: $('hitmarker'), dmgNums: $('dmg-numbers'),
      scope: $('scope-overlay'), vignette: $('damage-vignette'), dmgDir: $('dmg-dir'),
      hpFill: $('hp-fill'), hpNum: $('hp-num'), weaponName: $('weapon-name'),
      ammoMag: $('ammo-mag'), ammoRes: $('ammo-reserve'), reloadNote: $('reload-note'), smokeCount: $('smoke-count'),
      roundTime: $('round-time'), roundsRow: $('rounds-row'),
      scoreP: $('score-p'), scoreB: $('score-b'), killfeed: $('killfeed'), ctfHud: $('ctf-hud'),
      banner: $('round-banner'), bannerTitle: $('banner-title'), bannerSub: $('banner-sub'),
      respawn: $('respawn-overlay'), respawnCount: $('respawn-count'),
      prot: $('prot-badge'), protCount: $('prot-count'),
      scoreboard: $('scoreboard'), sbBody: $('sb-body'),
      matchEnd: $('match-end'), matchTitle: $('match-title'), matchSub: $('match-sub'), matchStats: $('match-stats'),
      pause: $('pause-menu'), radar: $('radar'),
      radioMenu: $('radio-menu'), radioLog: $('radio-log'), mkBanner: $('mk-banner'),
      lockHint: $('lock-hint'), hudSpeech: $('hud-speech'), hudSettings: $('hud-settings'),
      pickupHint: $('pickup-hint'),
    };
  }

  // IBL: gera um env map (gradiente de céu dusk) e seta scene.environment, pra os materiais
  // PBR (MeshStandardMaterial) terem luz ambiente/reflexo em vez de ficarem chapados.
  _buildEnv() {
    try {
      const c = document.createElement('canvas'); c.width = 16; c.height = 128;
      const g = c.getContext('2d');
      const grd = g.createLinearGradient(0, 0, 0, 128);
      grd.addColorStop(0.00, '#1a2740');   // topo do céu
      grd.addColorStop(0.48, '#8ea8c6');   // céu claro perto do horizonte
      grd.addColorStop(0.52, '#c3a577');   // faixa quente do pôr do sol
      grd.addColorStop(1.00, '#2a2620');   // chão/reflexo escuro
      g.fillStyle = grd; g.fillRect(0, 0, 16, 128);
      const tex = new THREE.CanvasTexture(c);
      tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.SRGBColorSpace;
      const pmrem = new THREE.PMREMGenerator(this.renderer); pmrem.compileEquirectangularShader();
      this._envRT = pmrem.fromEquirectangular(tex);
      this.scene.environment = this._envRT.texture;
      tex.dispose(); pmrem.dispose();
    } catch (e) { console.warn('env map', e); }
  }

  _buildViewModels() {
    const root = new THREE.Group();
    const dark = c => new THREE.MeshLambertMaterial({ color: c });
    // First-person arms inherit the selected character's skin + sleeve colors.
    const pdef = byId(this.playerCharId);
    const pal = (pdef && pdef.pal) || { skin: 0xd9a066, shirt: 0x3a4a5a };
    // LUVA POR TIME no fallback procedural também (mãos genéricas por time — pedido do dono):
    // P vermelho, B verde, U roxo; blend 55% (igual ao fparms) pra não virar luva plástica.
    const GLOVE = { P: 0xd83232, B: 0x28c858, U: 0x8a3ffc };
    const skinMat = dark(pal.skin);
    if (GLOVE[this.playerFaction]) skinMat.color.lerp(new THREE.Color(GLOVE[this.playerFaction]), 0.85);
    const sleeveMat = dark(pal.shirt);
    const skin = skinMat; // legacy alias
    // A curled gripping hand built from two-segment fingers (proximal + distal phalanx),
    // a slimmer palm and an angled thumb — reads as an actual gripping hand, not a brick.
    const fpArm = (w = 0.08) => {
      const g = new THREE.Group();
      const sc = w / 0.08; // callers pass a smaller w for pistols/knife → scale the whole hand
      const knuckle = new THREE.Group(); g.add(knuckle);
      // palm — flattened capsule laid across the grip (X axis), slimmer (mão menos "blocão")
      const palm = new THREE.Mesh(new THREE.CapsuleGeometry(0.030, 0.052, 4, 8), skinMat);
      palm.rotation.z = Math.PI / 2; palm.scale.set(1, 1, 0.5);
      palm.castShadow = false; knuckle.add(palm);
      // four two-segment fingers wrapping over the grip, spaced along Z (mais longos e finos)
      const proxGeo = new THREE.CapsuleGeometry(0.0072, 0.030, 3, 6);
      const distGeo = new THREE.CapsuleGeometry(0.0064, 0.026, 3, 6);
      for (let i = 0; i < 4; i++) {
        const f = new THREE.Group();
        const prox = new THREE.Mesh(proxGeo, skinMat);
        prox.rotation.set(0.5, 0, Math.PI / 2); prox.position.set(0, 0.012, 0);
        const dist = new THREE.Mesh(distGeo, skinMat);
        dist.rotation.set(1.15, 0, Math.PI / 2); dist.position.set(-0.017, -0.006, 0);
        f.add(prox, dist);
        f.position.set(0.004, 0.024, -0.026 + i * 0.016);
        knuckle.add(f);
      }
      // thumb on the near side, angled up along the grip
      const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.038, 3, 6), skinMat);
      thumb.rotation.set(0.35, 0, 0.55); thumb.position.set(-0.03, 0.004, 0.026);
      thumb.castShadow = false; knuckle.add(thumb);
      knuckle.scale.setScalar(sc);
      // Forearm angled toward the screen's bottom corner, carrying the sleeve colour;
      // a rounded cuff at the wrist. Capsule/cylinder → no hard box edges.
      const fore = new THREE.Group();
      fore.rotation.set(0.78, 0.62, 0);
      const L = 0.38 * sc;
      const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(w * 0.46, L, 4, 10), sleeveMat);
      sleeve.rotation.x = Math.PI / 2; sleeve.position.set(0, 0, L * 0.5 + 0.04);
      sleeve.castShadow = false; fore.add(sleeve);
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.56, w * 0.52, 0.04, 12), skinMat);
      cuff.rotation.x = Math.PI / 2; cuff.position.set(0, 0, 0.05);
      cuff.castShadow = false; fore.add(cuff);
      g.add(fore);
      return g;
    };
    // Support (front) hand: palm + two-segment curled fingers only, no receding sleeve.
    const frontHand = (sc = 1) => {
      const g = new THREE.Group();
      const palm = new THREE.Mesh(new THREE.CapsuleGeometry(0.029, 0.048, 4, 8), skinMat);
      palm.rotation.z = Math.PI / 2; palm.scale.set(1, 1, 0.5); palm.castShadow = false; g.add(palm);
      const proxGeo = new THREE.CapsuleGeometry(0.0068, 0.028, 3, 6);
      const distGeo = new THREE.CapsuleGeometry(0.006, 0.024, 3, 6);
      for (let i = 0; i < 4; i++) {
        const f = new THREE.Group();
        const prox = new THREE.Mesh(proxGeo, skinMat);
        prox.rotation.set(0.55, 0, Math.PI / 2); prox.position.set(0, 0.011, 0);
        const dist = new THREE.Mesh(distGeo, skinMat);
        dist.rotation.set(1.2, 0, Math.PI / 2); dist.position.set(-0.015, -0.006, 0);
        f.add(prox, dist);
        f.position.set(0.004, 0.022, -0.024 + i * 0.015);
        g.add(f);
      }
      g.scale.setScalar(sc);
      return g;
    };
    // AWP (right-handed)
    const awp = new THREE.Group();
    awp.add(new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.09, 0.5), dark(0x2e4a2e)));
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.55, 6), dark(0x1a1a1a));
    barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.01, -0.5); awp.add(barrel);
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.17, 8), dark(0x111111));
    scope.rotation.x = Math.PI / 2; scope.position.set(0, 0.085, -0.05); awp.add(scope);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.2), dark(0x3a2a1e)); stock.position.set(0, -0.05, 0.28); awp.add(stock);
    const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.03), dark(0x888888)); bolt.position.set(0.05, 0.03, 0.05); awp.add(bolt);
    const handR = fpArm(); handR.name = 'handR'; handR.position.set(0, -0.085, 0.02); awp.add(handR);
    const handL = frontHand(0.95); handL.name = 'handL'; handL.position.set(0.005, -0.04, -0.3); awp.add(handL);
    awp.position.set(0.26, -0.23, -0.5); awp.rotation.y = 0.03;
    // rifles genéricos (ak / m4 / mp5 / shotgun / deagle)
    const mkRifle = (bodyC, woodC, len, magH) => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.09, len), bodyC));
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 6), dark(0x1a1a1a));
      b.rotation.x = Math.PI / 2; b.position.set(0, 0.01, -len / 2 - 0.18); g.add(b);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.18), woodC); stock.position.set(0, -0.04, len / 2 - 0.05); g.add(stock);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, magH, 0.07), dark(0x2a2a2a));
      mag.position.set(0, -0.06 - magH / 2, -0.05); g.add(mag);
      const hR = fpArm(); hR.name = 'handR'; hR.position.set(0, -0.085, 0.1); g.add(hR);
      const hL = frontHand(0.95); hL.name = 'handL'; hL.position.set(0.005, -0.04, -len / 3); g.add(hL);
      g.position.set(0.26, -0.23, -0.5); g.rotation.y = 0.03;
      return g;
    };
    const ak = mkRifle(dark(0x2a2a2a), dark(0x6b4f2c), 0.55, 0.16);
    const m4 = mkRifle(dark(0x333333), dark(0x2a2a2a), 0.52, 0.13);
    const mp5 = mkRifle(dark(0x2e2e2e), dark(0x2e2e2e), 0.4, 0.14);
    const shotgun = mkRifle(dark(0x1a1a1a), dark(0x7a5230), 0.5, 0.08);
    const deagle = new THREE.Group();
    deagle.add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.11, 0.26), dark(0x8a8a8a)));
    const dgrip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.07), dark(0xc9a227));
    dgrip.position.set(0, -0.1, 0.09); dgrip.rotation.x = 0.25; deagle.add(dgrip);
    const handD = fpArm(0.075, 0.1, 0.08); handD.name = 'handR'; handD.position.set(0, -0.1, 0.09); deagle.add(handD);
    deagle.position.set(0.24, -0.2, -0.42);
    // pistol
    const pistol = new THREE.Group();
    pistol.add(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.22), dark(0x333333)));
    const pgrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.06), dark(0x3a2a1e));
    pgrip.position.set(0, -0.09, 0.08); pgrip.rotation.x = 0.25; pistol.add(pgrip);
    const handP = fpArm(0.075, 0.1, 0.08); handP.name = 'handR'; handP.position.set(0, -0.1, 0.08); pistol.add(handP);
    pistol.position.set(0.24, -0.2, -0.42);
    // knife
    const knife = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.05, 0.3), dark(0xb8c0c8)); blade.position.z = -0.2; knife.add(blade);
    knife.add(new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.06, 0.12), dark(0x2a1e14)));
    const handK = fpArm(0.07, 0.08, 0.08); handK.name = 'handR'; handK.position.set(0, -0.02, 0.03); knife.add(handK);
    knife.position.set(0.28, -0.22, -0.4); knife.rotation.set(-0.2, 0.4, -0.45);   // roll/yaw: lâmina de aço legível apontando p/ o centro (r5t-knife-d)
    root.add(awp, ak, m4, mp5, shotgun, deagle, pistol, knife);
    const models = { awp, ak, m4, mp5, shotgun, deagle, pistol, knife };
    // Swap the procedural box guns for the real weapon GLBs where available: add the
    // real model (barrel rotated to point into the screen) and hide the box meshes,
    // keeping the first-person hand. Falls back to the box gun if a model is missing.
    // Align the hands to the REAL weapon: the GLB's grip point sits at the model-group
    // origin (weapons.js), pulled GRIP_Z back toward the camera. The trigger hand wraps
    // the grip; the support hand wraps the handguard ~55% of the way from grip to muzzle
    // (two-handed weapons only). Derived from each weapon's CFG (len/gripZ), not guesses.
    const alignHands = (g, id) => {
      const GRIP_Z = id === 'knife' ? 0 : 0.12;
      const gp = gripPoints(id);   // espaço do GLB (cano +Z); aqui o cano é -Z → z' = GRIP_Z - z
      const hR = g.getObjectByName('handR'), hL = g.getObjectByName('handL');
      if (hR) hR.position.set(gp.grip.x, -0.03, GRIP_Z - gp.grip.z);
      if (hL) {
        if (!gp.fore) hL.visible = false;
        else hL.position.set(gp.fore.x, gp.fore.y, GRIP_Z - gp.fore.z);
      }
    };
    // Material fix OBRIGATÓRIO nos GLBs reais do viewmodel (mesmo clamp dos staticVms
    // Tripo): os GLBs de arma vêm com metalness~1/roughness baixa e SEM env ficam
    // "silhueta preta" (a lâmina da faca era o pior caso). Clona o material — o clone()
    // do weaponModel COMPARTILHA material com drops de chão/3ª pessoa, que não queremos
    // tocar. VM-only.
    const fixVmMaterials = (obj) => obj.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      o.material = o.material.clone();
      if ('metalness' in o.material) o.material.metalness = Math.min(o.material.metalness, 0.55);
      if ('roughness' in o.material) o.material.roughness = Math.max(o.material.roughness, 0.45);
      o.material.envMapIntensity = 1.2;
    });
    for (const id in models) {
      const rw = weaponModel(id);
      if (!rw) continue;
      rw.name = 'rw';                    // espaço local: grip na origem, cano +Z (IK mira nele)
      rw.rotation.y = Math.PI + (weaponCFG(id).vmRotY || 0); // barrel +Z -> -Z; vmRotY = flip FP por arma (P90)
      rw.scale.multiplyScalar(0.82 * (weaponCFG(id).vm ?? 1)); // tucked p/ FP; vm = ajuste fino por arma
      rw.position.z += id === 'knife' ? 0.0 : 0.12; // pull the grip back toward the hand
      fixVmMaterials(rw);
      models[id].children.forEach((ch) => { if (ch.isMesh) ch.visible = false; });
      models[id].add(rw);
      alignHands(models[id], id);
    }
    // Build first-person viewmodels for the extended arsenal (weapons without a box
    // group): real GLB + a hand, positioned like the AWP viewmodel.
    for (const id of WEAPON_IDS) {
      if (models[id]) continue;
      const g = new THREE.Group();
      const rw = weaponModel(id);
      if (rw) { rw.name = 'rw'; rw.rotation.y = Math.PI + (weaponCFG(id).vmRotY || 0); rw.scale.multiplyScalar(0.82 * (weaponCFG(id).vm ?? 1)); rw.position.z += id === 'knife' ? 0 : 0.12; fixVmMaterials(rw); g.add(rw); }
      const hR = fpArm(); hR.name = 'handR'; hR.scale.setScalar(0.85); g.add(hR);   // fallback menor (proporção)
      if (!ONE_HANDED.has(id)) { const hL = frontHand(0.95); hL.name = 'handL'; hL.scale.setScalar(0.85); g.add(hL); }
      alignHands(g, id);
      g.position.copy(awp.position); g.rotation.copy(awp.rotation);
      root.add(g); models[id] = g;
    }
    for (const k in models) models[k].visible = k === 'awp';
    // Braços FP DEDICADOS (FASE 2): asset próprio (models/fparms/arms.glb, mãos com
    // dedos de verdade) p/ TODOS os personagens, por padrão. Só cai nas mãos
    // procedurais (fpArm/frontHand acima) se o GLB não carregou — ou via ?fpoff=1.
    let arms = null;
    // MÃOS FP POR PADRÃO (decisão do dono 28/07 — "mãos genéricas por time", com luva por
    // facção; arma-sozinha virou opt-out via ?hands=0). Se o GLB falhar, cai nas mãos
    // procedurais (fpArm/frontHand — que ficam VISÍVEIS nesse caso, ver abaixo).
    const WEAPON_ONLY = new URLSearchParams(location.search).get('hands') === '0';
    if (!FP_OFF && !WEAPON_ONLY) arms = buildFPArms({ id: this.playerCharId, team: this.playerFaction });
    if (arms) {
      root.add(arms.group);
      // Aproxima as armas pra distância de alcance real do braço (as posições antigas,
      // z=-0.5, ficam além do comprimento do braço — o guarda-mão seria inalcançável).
      // Medido: ombro L→guarda-mão do rifle ≈ 0.55 m (braço do asset ≈ 0.60 m) — além
      // disso o IK não alcança e a mão flutua fora da madeira.
      const ARM_MOUNTS = { rifle: [0.16, -0.13, -0.38], pistol: [0.18, -0.11, -0.36], knife: [0.19, -0.1, -0.33] };
      for (const k in models) {
        const g = models[k];
        const hR = g.getObjectByName('handR'), hL = g.getObjectByName('handL');
        if (hR) hR.visible = false;
        if (hL) hL.visible = false;
        const m = ARM_MOUNTS[ONE_HANDED.has(k) ? (k === 'knife' ? 'knife' : 'pistol') : 'rifle'];
        g.position.set(m[0], m[1], m[2]);
        if (k !== 'knife') g.rotation.set(0, 0.03, 0);   // faca mantém a rotação própria
      }
    }
    // SÓ-ARMA: esconde as mãos procedurais (handR/handL) presas a cada modelo de arma.
    if (WEAPON_ONLY) for (const k in models) models[k].traverse((o) => { if (o.name === 'handR' || o.name === 'handL') o.visible = false; });
    this._weaponOnly = WEAPON_ONLY;
    // Viewmodels ESTÁTICOS Tripo (braços+arma baked) por classe: rifle / pistol / shotgun /
    // awp / knife. Nessa classe, arma procedural + braços IK ficam escondidos (_switchWeapon).
    // Classe awp gera UMA entrada por arma (SNIPER_VM — variação de acabamento; chave = id).
    const staticVms = {};
    // Build dos VMs estáticos DE UMA classe (extraído p/ o lazy-load G2-R14A): no boot só
    // as classes pré-carregadas constroem (as demais nem template têm — `stpl` null); na
    // 1ª troca p/ arma de uma classe nova o _ensureStaticVm carrega e chama de novo.
    this._staticVmBuilt = new Set();
    this._buildStaticVmClass = (cls) => {
      if (WEAPON_ONLY || this._staticVmBuilt.has(cls)) return;
      const stpl = getStaticVm(cls);
      if (!stpl) return;
      this._staticVmBuilt.add(cls);
      {
        // variantes: awp = uma por arma (SNIPER_VM); rifle/pistol/shotgun = base + uma por
        // arma com identidade (RIFLE_VM/PISTOL_VM/SHOTGUN_VM, GAUNTLET 2.0); faca = lâmina
        // de aço. Demais armas da classe caem na entrada-base.
        const RIFLE_BASE = { tex: 'rifle_lift', orm: 'rifle_orm_wear', env: 2.4, emis: 'rifle_emissive', emisI: 5.0 };
        const SHOTGUN_BASE = { tex: 'shotgun_glove', orm: 'shotgun_orm_wear', metal: 0.6, rough: 1.3, env: 0.9 };
        const clsVariants = cls === 'awp' ? Object.entries(SNIPER_VM)
          : cls === 'rifle' ? [['rifle', RIFLE_BASE], ...Object.entries(RIFLE_VM).map(([k, v]) => [k, { ...RIFLE_BASE, ...v }])]
          : cls === 'pistol' ? [['pistol', { tex: 'pistol_polymer' }], ...Object.entries(PISTOL_VM)]
          : cls === 'shotgun' ? [['shotgun', SHOTGUN_BASE], ...Object.entries(SHOTGUN_VM).map(([k, v]) => [k, { ...SHOTGUN_BASE, ...v }])]
          : [[cls, cls === 'knife' ? { tex: 'knife_steel', orm: 'knife_orm' } : {}]];
        for (const [key, v] of clsVariants) {
          // Herói dedicada: template próprio (DED_VM, escopo de módulo desde G2-R14A —
          // o lazy-load e o preload do boot consultam a mesma tabela).
          const dedKey = (DED_VM[key] && new URLSearchParams(location.search).get('no' + key) !== '1' && getStaticVm(DED_VM[key])) ? DED_VM[key] : null;
          const ded = dedKey ? getStaticVm(dedKey) : null;
          if (dedKey) (this._staticVmDed || (this._staticVmDed = new Set())).add(key);   // herói já nasceu dedicada (rebuild só se faltar)
          const vv = ded ? {} : v;
          const m = (ded || stpl).clone(true);
          // material do Tripo vem escuro + metalness~1 sem env (era "silhueta preta") —
          // clamp metalness + envMap da cena = metal lê de verdade. Variantes trocam o
          // mapa base (mãos preservadas na textura — ver tools/vm-variant-tex.mjs).
          const vt = vv.tex ? getStaticVmTex(vv.tex) : null;
          const vo = vv.orm ? getStaticVmTex(vv.orm) : null;
          const ve = vv.emis ? getStaticVmTex(vv.emis) : null;
          m.traverse((o) => {
            if (!o.isMesh || !o.material) return;
            o.material = o.material.clone();
            if (vt) o.material.map = vt;
            if (vo) { o.material.metalnessMap = vo; o.material.roughnessMap = vo; }
            if (ve && 'emissive' in o.material) {
              // piso emissivo só na arma (mapa = cinza 0.1 arma / preto mãos): o albedo
              // do receiver é ~0.005 — luz física não resgata (medido: mediana 8/255).
              o.material.emissiveMap = ve;
              o.material.emissive = new THREE.Color(0xffffff);
              o.material.emissiveIntensity = v.emisI ?? 1.0;
            }
            if ('metalness' in o.material) o.material.metalness = vo ? (v.metal ?? 1.0) : Math.min(o.material.metalness, v.metal ?? 0.55);
            if ('roughness' in o.material) o.material.roughness = vo ? (v.rough ?? 1.0) : Math.max(o.material.roughness, v.rough ?? 0.45);
            // albedo do Tripo é fisicamente "correto" (gunmetal ~0.03 linear) — sob sol
            // pleno lia como silhueta preta mesmo com o rig (crítico R6). Lift 1.5× no
            // multiplicador (a textura-variante já carrega a diferença de acabamento).
            if (o.material.color) o.material.color.multiplyScalar(1.5);
            // envMap 1.8 (era 1.2): os metais do VM liam "pintados/chapados" (crítico R6.5)
            // — com o ORM de desgaste eles passam a quebrar o especular de verdade.
            // rifle pede piso maior (albedo ~0.03: mediana do receiver 8/255 → meta ≥35).
            o.material.envMapIntensity = v.env ?? 1.8;
            o.castShadow = false; o.frustumCulled = false;
          });
          // transform POR CLASSE (G2-R6A — regressões do dono: "armas invertidas, perderam
          // o model original, mãos fora de quadro"). A pose GAUNTLET 2.0 deitava as armas
          // em diagonal cruzando a tela (rifle yaw -52° roll 171°, pistol 90° de lado) — na
          // tela 3:2 do dono liam como "viradas/erradas" e a mão saía do quadro. Agora o
          // eixo stock→muzzle do modelo baked é ALINHADO ao -Z da câmera (cano pra frente,
          // arma em pé — gun-space medido no vmattach) + um cant leve de hip por classe.
          // Tunado em capturas 1512×982 @ dsf=2 (a tela dele): modelo Tripo visível, mãos
          // no quadro, identidade (textura+attachments) preservada. Faca = pose CS clássica.
          const VM_FWD = {
            // G2-R14A (dono: "mira num lugar, a arma aponta pro outro"): yaws ~0.22-0.38
            // que "expoŕiam a lateral" faziam o cano apontar VISIVELMENTE fora do crosshair
            // — regressão funcional. Agora yaw ≤0.09 em TODAS (cano colado na linha de mira;
            // a identidade vem do modelo/textura/attachments, não do ângulo). Escala global
            // -28% via VM_SHRINK (dono: "armas tomam a maior parte da tela").
            rifle:   { yaw: 0.08, roll: -0.071, pitch: 0.065, pos: [0.18, -0.08, -0.42], scale: 0.45 },
            pistol:  { yaw: -0.07, roll: -0.06, pitch: 0.01, pos: [0.15, -0.15, -0.30], scale: 0.26 },
            awp:     { yaw: 0.08, roll: -0.053, pitch: 0.012, pos: [0.17, -0.10, -0.43], scale: 0.46 },
            shotgun: { yaw: 0.08, roll: -0.078, pitch: 0.037, pos: [0.19, -0.09, -0.44], scale: 0.42 },
            // AK dedicada (G2-R7): gun-space próprio quase sem cant — deltas distintos da
            // classe rifle. G2-R14A: yaw 0.28→0.09 (alinho do cano ao crosshair).
            ak:      { yaw: 0.09, roll: -0.07, pitch: 0.02, pos: [0.19, -0.12, -0.37], scale: 0.54 },
            m4:      { yaw: 0.09, roll: -0.07, pitch: 0.02, pos: [0.19, -0.12, -0.37], scale: 0.54 },
            // MP5: o cano dela corre ao longo de -X no model space — no euler LOCAL os
            // papéis trocam: "roll" vira elevação do cano (por isso roll -0.24 alto) e
            // "pitch" vira rolagem. G2-R10: -15% de tamanho aparente — lia "tamanho de rifle".
            mp5:     { yaw: 0.09, roll: -0.24, pitch: 0.02, pos: [0.21, -0.13, -0.40], scale: 0.41 },
            // p90: gun-space refeito pelo trilho do cano em X (o slab em Z mentia).
            p90:     { yaw: 0.09, roll: -0.061, pitch: 0.172, pos: [0.20, -0.13, -0.38], scale: 0.44 },
            // UZI-kit (G2-R12+): entrada própria desde a remoção da herói.
            uzi:     { yaw: 0.09, roll: -0.088, pitch: 0.087, pos: [0.18, -0.08, -0.42], scale: 0.45 },
            // m92-kit (G2-R13): rotação própria expõe a ALAVANCA + nogal claro separa da g3.
            m92:     { yaw: 0.08, roll: -0.189, pitch: 0.139, pos: [0.18, -0.08, -0.42], scale: 0.45 },
            // Herói G2-R13 (SVD): coronha esqueleto de madeira + PSO-1.
            svd:     { yaw: 0.09, roll: -0.117, pitch: 0.09, pos: [0.19, -0.12, -0.37], scale: 0.54 },
            // Heróis G2-R11B (TAVOR/FAMAS): bullpups curtas — arma inteira no quadro.
            tavor:   { yaw: 0.09, roll: 0.038, pitch: -0.026, pos: [0.20, -0.13, -0.38], scale: 0.44 },
            famas:   { yaw: 0.08, roll: -0.097, pitch: 0.011, pos: [0.20, -0.13, -0.38], scale: 0.44 },
            awphero: { yaw: 0.09, roll: -0.07, pitch: 0.02, pos: [0.19, -0.12, -0.37], scale: 0.54 },
          };
          if (cls === 'knife') { m.scale.setScalar(0.32 * VM_SHRINK); m.rotation.set(-0.15, 0.55, 0.2); m.position.set(0.15, -0.1, -0.14); }   // G2-R14A: -28% (VM_SHRINK) — tomava a tela; pose CS mantida
          else {
            // framing: herói dedicada (dedKey) → entrada por ARMA (VM_FWD[key], ex: uzi
            // kit G2-R13) → classe. dScale/dPos seguem por cima em todos os casos.
            const f = VM_FWD[dedKey] || VM_FWD[key] || VM_FWD[cls];
            // q alinhamento: gunBasis(cls).quat leva +Z local→eixo do cano; invertido leva o
            // cano a +Z; o yaw π vira pra -Z (frente). Deltas YXZ de estilo por classe.
            const q = gunBasis(dedKey || cls).quat.invert();
            q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
            const qAlign0 = q.clone();   // alinhamento puro (sem deltas) — tuning view-space (g2r8-sweep)
            q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(f.pitch, f.yaw, f.roll, 'YXZ')));
            m.quaternion.copy(q);
            m.userData.qAlign = q.clone();   // tuning ao vivo (tools/eval/g2r7-aksweep.mjs, g2r8-sweep.mjs)
            m.userData.qAlign0 = qAlign0;
            // dScale/dPos por ARMA (awp: SNIPER_VM; rifle G2-R9: SMGs uzi/p90 MENORES no
            // FP — eram "corpo de rifle gigante"). Sem entrada: transform da classe intacto.
            // G2-R14A: VM_SHRINK global (-28% aparente) por cima de tudo.
            const s = f.scale * (v.dScale ?? 1) * VM_SHRINK, d = v.dPos || [0, 0, 0];
            m.scale.setScalar(s); m.position.set(f.pos[0] + d[0], f.pos[1] + d[1], f.pos[2] + d[2]);
          }
          // Boca do cano POR CLASSE recomputada do model space (poses mudaram desde os
          // anchors R7.6 hardcoded — knife mantém o calibrado; as demais recomputam).
          // Com herói dedicado na chave-base (só acontece na awp), a boca da CLASSE é
          // medida num clone do template da classe com o transform da classe — as outras
          // 6 snipers não podem herdar o muzzle da herói.
          if (key === cls && (cls === 'rifle' || cls === 'shotgun' || cls === 'awp' || cls === 'pistol')) {
            let mm = m;
            if (ded) {
              mm = stpl.clone(true);
              const f0 = VM_FWD[cls];
              const q0 = gunBasis(cls).quat.invert();
              q0.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
              q0.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(f0.pitch, f0.yaw, f0.roll, 'YXZ')));
              mm.quaternion.copy(q0); mm.scale.setScalar(f0.scale * VM_SHRINK); mm.position.set(f0.pos[0], f0.pos[1], f0.pos[2]);
            }
            mm.updateWorldMatrix(true, false);
            (this._vmMuzzleCls || (this._vmMuzzleCls = {}))[cls] = mm.localToWorld(new THREE.Vector3(...(VM_GUNSPACE[cls].tip || VM_GUNSPACE[cls].muzzle)));
          }
          // Arma-herói dedicada: boca do cano = `tip` do gun-space próprio (a ponta +Z do
          // mesh pode ser os DEDOS, não o cano — ver vmattach.js) — sobrescreve o
          // fallback de classe no merge do construtor (arma → classe → rifle).
          if (ded) {
            m.updateWorldMatrix(true, false);
            (this._vmMuzzleExt || (this._vmMuzzleExt = {}))[key] = m.localToWorld(new THREE.Vector3(...(VM_GUNSPACE[dedKey].tip || VM_GUNSPACE[dedKey].muzzle)));
          }
          // Attachments procedurais por arma (GAUNTLET 2.0): filhos do clone — herdam o
          // transform da classe e o kick/sway do vm.root. muzzleExt: a boca real anda
          // (supressor) — ponto em model space transformado p/ vm.root space no build
          // (o vm.root está em identidade aqui — view space == vm.root space neste frame).
          if (vv.att && VM_GUNSPACE[cls]) for (const kind of vv.att) m.add(buildVmAttachment(cls, kind));
          if (vv.muzzleExt && VM_GUNSPACE[cls]) {
            const g = VM_GUNSPACE[cls];
            const tip = new THREE.Vector3(g.muzzle[0], g.muzzle[1], g.muzzle[2])
              .addScaledVector(new THREE.Vector3(g.muzzle[0] - g.stock[0], g.muzzle[1] - g.stock[1], g.muzzle[2] - g.stock[2]).normalize(), vv.muzzleExt);
            m.updateWorldMatrix(true, false);
            (this._vmMuzzleExt || (this._vmMuzzleExt = {}))[key] = m.localToWorld(tip);
          }
          // dScale/dPos por arma (G2-R10): a boca também anda — sem isso o flash ficaria na
          // posição da CLASSE (base 0.45), fora do cano da variante reduzida (uzi/p90).
          // Idem pra framing próprio por arma (G2-R13: VM_FWD[key], ex: uzi-kit).
          else if ((v.dScale || v.dPos || (key !== cls && VM_FWD[key])) && VM_GUNSPACE[cls]) {
            m.updateWorldMatrix(true, false);
            (this._vmMuzzleExt || (this._vmMuzzleExt = {}))[key] = m.localToWorld(new THREE.Vector3(...(VM_GUNSPACE[cls].tip || VM_GUNSPACE[cls].muzzle)));
          }
          m.visible = false;
          root.add(m);
          staticVms[key] = m;
        }
      }
    };
    // Boot (lazy-load G2-R14A): constroem só as classes que o preload já trouxe (loadout
    // inicial — ver vmPreloadClasses no main.js). Classe sem template: `stpl` null, o
    // build não marca como feita e o _ensureStaticVm re-tenta depois do load sob demanda.
    for (const cls of ['rifle', 'pistol', 'shotgun', 'awp', 'knife']) this._buildStaticVmClass(cls);
    const vmObj = { root, models, awp, pistol, knife, arms, kick: 0, kickSide: 0, bobPhase: 0, reloadDip: 0, recoil: new RecoilAxis(11, 0.5, 0.28, 0.3), staticVms };
    // ?tvm=1 (prova): viewmodel Tripo mão+arma por personagem em models/fpvm/<char>_<arma>.glb.
    // Vira filho do vm.root → herda sway/kick/reload de graça. Framing afinável por querystring
    // (tvs=escala, tvp=x,y,z, tvr=x,y,z rad). Reversível: sem a flag, nada muda.
    this._tvm = new URLSearchParams(location.search).get('tvm') === '1';
    if (this._tvm) {
      const qp = new URLSearchParams(location.search);
      const n3 = (k, d) => { const v = qp.get(k); if (!v) return d; const a = v.split(',').map(Number); return a.length === 3 ? a : d; };
      const wid = charWeapon(this.playerCharId);
      new GLTFLoader().load(`models/fpvm/${this.playerCharId}_${wid}.glb`, (g) => {
        const o = g.scene;
        const box = new THREE.Box3().setFromObject(o), sz = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
        o.position.sub(ctr);
        const holder = new THREE.Group(); holder.add(o);
        holder.scale.setScalar((0.5 / Math.max(sz.x, sz.y, sz.z)) * (parseFloat(qp.get('tvs')) || 0.55));
        const r = n3('tvr', [-0.3, 3.6, 0]); holder.rotation.set(r[0], r[1], r[2]);   // cano pra frente/baixo-direita (afinado in-game)
        const pp = n3('tvp', [0.18, -0.22, -0.42]); holder.position.set(pp[0], pp[1], pp[2]);
        holder.visible = false; root.add(holder);
        vmObj.tvm = holder; vmObj.tvmWeapon = wid;
      }, undefined, (e) => console.warn('[tvm] load falhou', e));
    }
    return vmObj;
  }

  _makePuffTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(230,210,180,0.9)'); g.addColorStop(1, 'rgba(230,210,180,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  // Estrela de muzzle flash IRREGULAR (R7.5): glow quente + 8-11 raios radiais de
  // comprimento/largura/ângulo aleatórios (seed fixo — textura única, a variação por tiro
  // vem do material.rotation). Substitui a silhueta poligonal de arestas duras do cone.
  _makeFlashTex() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    let seed = 41; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    x.globalCompositeOperation = 'lighter';
    const g = x.createRadialGradient(64, 64, 2, 64, 64, 42);
    g.addColorStop(0, 'rgba(255,240,200,0.95)'); g.addColorStop(0.4, 'rgba(255,180,80,0.45)'); g.addColorStop(1, 'rgba(255,140,40,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const R = 8 + Math.floor(rnd() * 4);
    for (let i = 0; i < R; i++) {
      const ang = (i / R) * Math.PI * 2 + rnd() * 0.7;
      const len = 26 + rnd() * 36, w = 2.5 + rnd() * 5;
      x.save(); x.translate(64, 64); x.rotate(ang);
      const lg = x.createLinearGradient(0, 0, len, 0);
      lg.addColorStop(0, 'rgba(255,230,170,0.9)'); lg.addColorStop(0.6, 'rgba(255,170,70,0.35)'); lg.addColorStop(1, 'rgba(255,150,50,0)');
      x.fillStyle = lg;
      x.beginPath(); x.moveTo(0, -w / 2); x.lineTo(len, 0); x.lineTo(0, w / 2); x.closePath(); x.fill();
      x.restore();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  // Núcleo branco-quente do flash (centro quase branco, borda quente suave).
  _makeFlashCoreTex() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 1, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,255,245,1)'); g.addColorStop(0.35, 'rgba(255,240,200,0.8)'); g.addColorStop(1, 'rgba(255,220,160,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  /* ================= input ================= */
  _input() {
    this.keys = {};
    this._kd = e => {
      if (e.code === 'Tab') { e.preventDefault(); this._showScoreboard(true); }
      // em pointer lock, engole atalhos do navegador (Ctrl+S/D/A/R…) — Ctrl+W o Chrome não deixa prevenir, use C pra agachar
      if ((e.ctrlKey || e.metaKey) && document.pointerLockElement) e.preventDefault();
      this.keys[e.code] = true;
      if (this.radioOpen) {
        const n = { Digit1: 1, Digit2: 2, Digit3: 3 }[e.code];
        if (n) this._radioPick(n);
        this.radioOpen = null; this._radioUi();
        return;
      }
      if (!this._acceptInput()) return;
      if (e.code === 'KeyZ') { this._radioShow('z'); return; }
      if (e.code === 'KeyX') { this._radioShow('x'); return; }
      if (e.code === 'KeyV') { this._radioShow('c'); return; }
      // slot memory: 1 = last primary held, 2 = last sidearm held (not a hardcoded reset)
      if (e.code === 'Digit1') this._switchWeapon(this.player.primary || 'awp');
      if (e.code === 'Digit2') this._switchWeapon(this.player.secondary || 'pistol');
      if (e.code === 'Digit3') this._switchWeapon('knife');
      if (e.code === 'KeyE' && this.nearPickup) {
        const { pk, dropIdx } = this.nearPickup;
        this._grabPickup(pk, this.player, true);
        // consome só drops NÃO-rack (armas largadas/mortes); o rack persiste (armário)
        if (dropIdx >= 0 && !pk.rack) { this.scene.remove(pk.mesh); this.drops.splice(dropIdx, 1); }
        this.nearPickup = null;
      }
      if (e.code === 'KeyM') { if (this.onRequestSwitch) this.onRequestSwitch(); else this._switchTeam(); }
      if (e.code === 'KeyR') this._startReload();
      if (e.code === 'Digit4') this._throwSmoke();   // fumaça no 4 (convenção CS)
      if (e.code === 'Digit5') this._throwFrag();     // granada de fragmentação no 5
      if (e.code === 'KeyG') this._throwSmoke();      // atalho legado de fumaça
      if (e.code === 'Space') e.preventDefault();
    };
    this._ku = e => {
      if (e.code === 'Tab') this._showScoreboard(false);
      this.keys[e.code] = false;
    };
    this._md = e => {
      if (this.radioOpen) { this.radioOpen = null; this._radioUi(); }
      if (!this._acceptInput()) {
        // pointer lock não engatou (ou caiu)? qualquer clique NO CANVAS retoma e tenta de novo.
        // Inclui o caso pausado-por-perda-de-lock (ex.: depois do M): antes, clicar
        // com o jogo pausado não fazia nada e travava até dar refresh.
        // G2-R2: o gate agora exige que o alvo seja o CANVAS — antes qualquer mousedown
        // no document (inclusive nos botões do pause) despausava e re-travava o ponteiro,
        // então o clique no "SAIR PRO MENU" nunca disparava (o dono clicava e nada).
        if (!this.testMode && (this.state === 'live' || this.state === 'countdown') && !document.pointerLockElement
            && e.target === this.renderer.domElement) {
          if (this.paused) this.setPaused(false);
          this._requestLock();
        }
        return;
      }
      if (e.button === 0) { this.mouseDown0 = true; this._tryShoot(); }
      if (e.button === 2) {
        // Sniper (arma com luneta): botão direito ALTERNA e TRAVA a mira — não precisa segurar
        // (pedido de jogador). Demais armas: ADS enquanto segura (iron-sight).
        const w = this.player.weapon;
        if (WEAPONS[w] && WEAPONS[w].scope) this._scope(!this.player.scoped);
        else this._scope(true);
      }
    };
    this._mu = e => {
      if (e.button === 0) this.mouseDown0 = false;
      if (e.button === 2) {
        const w = this.player.weapon;
        if (!(WEAPONS[w] && WEAPONS[w].scope)) this._scope(false);   // só solta o ADS das não-sniper
      }
    };
    this._mm = e => {
      if (!this._acceptInput()) return;
      const s = this.settings.sens * 0.0021 * (this.player.scoped ? 0.45 : 1);
      this.player.yaw -= e.movementX * s;
      this.player.pitch -= e.movementY * s;
      this.player.pitch = Math.max(-1.45, Math.min(1.45, this.player.pitch));
      // viewmodel sway: the gun lags the mouse slightly (ev.io feel)
      this._swayX = Math.max(-1, Math.min(1, (this._swayX || 0) + e.movementX * 0.002));
      this._swayY = Math.max(-1, Math.min(1, (this._swayY || 0) + e.movementY * 0.002));
    };
    this._cc = e => e.preventDefault();
    this._blur = () => { this.keys = {}; };   // alt-tab com tecla pressionada não deixa tecla presa
    this._plc = () => {
      if (!document.pointerLockElement && !this.testMode && (this.state === 'live' || this.state === 'countdown') && !this.paused)
        this.setPaused(true);
    };
    document.addEventListener('keydown', this._kd);
    document.addEventListener('keyup', this._ku);
    document.addEventListener('mousedown', this._md);
    document.addEventListener('mouseup', this._mu);
    document.addEventListener('mousemove', this._mm);
    document.addEventListener('contextmenu', this._cc);
    document.addEventListener('pointerlockchange', this._plc);
    window.addEventListener('blur', this._blur);
  }

  _requestLock() {
    try { this.renderer.domElement.requestPointerLock()?.catch?.(() => {}); } catch {}
  }
  _acceptInput() {
    if (this.paused || this.state !== 'live' && this.state !== 'countdown') return false;
    return this.testMode || !!document.pointerLockElement;
  }

  /* ================= radio (CS-style voice commands) ================= */
  _radioShow(cat) {
    if (!this.player.alive || this.state !== 'live') return;
    this.radioOpen = cat;
    this._radioUi();
    this.sfx.uiClick();
  }
  _radioUi() {
    const m = this.el.radioMenu;
    if (!this.radioOpen) { m.classList.add('hidden'); return; }
    const c = RADIO[this.radioOpen];
    m.innerHTML = `<div class="radio-title">${c.title}</div>` +
      c.items.map((it, i) => `<div class="radio-item">${i + 1}. ${it}</div>`).join('');
    m.classList.remove('hidden');
  }
  _radioPick(n) {
    const cat = RADIO[this.radioOpen];
    const item = cat.items[n - 1];
    if (!item) return;
    this.sfx.radioVoice(this._voiceKey(this.playerTeam));
    const log = document.createElement('div');
    log.className = 'radio-line';
    log.textContent = `${this.player.name} (RÁDIO): ${item}`;
    this.el.radioLog.appendChild(log);
    setTimeout(() => log.remove(), 4200);
    while (this.el.radioLog.children.length > 3) this.el.radioLog.firstChild.remove();
  }

  /* ================= flow ================= */
  start() {
    this.el.hud.classList.remove('hidden');
    this._startRound();
  }
  _startRound() {
    this.roundNum++;
    this.roundKills = { P: 0, B: 0 };
    this.timeLeft = ROUND_TIME;
    this.mk.life = 0; this.mk.count = 0;
    this._resetPositions();
    if (this.ctf) this._initCTF();
    this.state = 'countdown';
    this.stateUntil = this.time + 3;
    this._showScoreboard(false);
    this._banner(`ROUND ${this.roundNum}`, this.roundNum === 1 ? 'Que comece a treta!' : 'De volta pra treta!');
    if (!this.sfx.csSound('roundstart')) this.sfx.vuvuzela(1.4);
  }
  _resetPositions() {
    const place = (ent, team, slot) => {
      const s = this.world.spawns[team][slot % 4];
      ent.pos.set(s.x + (Math.random() - .5), 0, s.z + (Math.random() - .5));
      ent.hp = 100; ent.alive = true; ent.respawnAt = 0; ent.protUntil = 0;
      return s;
    };
    place(this.player, this.playerTeam, 0);
    this.player.yaw = this.playerTeam === 'P' ? Math.PI : 0;
    this.player.pitch = 0; this.player.vel.set(0, 0, 0); this.player.crouchF = 0;
    this.player.ammo.awp = { mag: WEAPONS.awp.mag, res: WEAPONS.awp.reserve };
    this.player.ammo.pistol = { mag: WEAPONS.pistol.mag, res: WEAPONS.pistol.reserve };
    this.player.smokes = 5; this.player.frags = 1; this._updateSmokeHud();   // 5 fumaças + 1 frag por round
    // modo de armas: aplica o loadout inicial. No modo 'all', o player entra com a arma do
    // personagem dele (a mesma da tela de seleção) em vez da AWP padrão.
    const mode = this._wpnMode();
    const cw = charWeapon(this.playerCharId);
    if (mode === 'pistols') {
      this.player.weapon = 'pistol';
      this.player.ammo.awp = { mag: 0, res: 0 };
    } else if (mode === 'knife') {
      this.player.weapon = 'knife';
      this.player.ammo.awp = { mag: 0, res: 0 };
      this.player.ammo.pistol = { mag: 0, res: 0 };
    } else if (mode === 'awp') {
      this.player.weapon = 'awp';
      this.player.ammo.pistol = { mag: 0, res: 0 };
    } else {
      this.player.weapon = cw;
    }
    // reset slot memory to the loadout (1 = primary, 2 = sidearm)
    this.player.primary = PISTOLS.has(this.player.weapon) ? 'pistol' : (this.player.weapon === 'knife' ? cw : this.player.weapon);
    this.player.secondary = 'pistol';
    this.player.scoped = false; this.player.reloadUntil = 0;
    for (const d of this.drops) this.scene.remove(d.mesh);
    this.drops = [];
    // FULL arsenal available AT each respawn — no map-wide scatter. Organized in rows by
    // category (snipers → rifles → bullpups/SMG → sidearms) like a spawn weapon rack.
    const rackRows = [
      ['awp', 'mosin', 'rem700', 'm400', 'svd', 'g3sg1', 'sks'],  // snipers (+ semi-auto)
      ['ak', 'akm', 'm4', 'md97', 'g3', 'scar', 'carbine', 'm92'], // rifles
      ['tavor', 'famas', 'p90', 'mp5', 'uzi', 'shotgun', 'lmg'],   // bullpups / SMG / shotgun / LMG
      ['deagle', 'revolver38', 'pistol'],                        // sidearms
    ].map(row => row.filter(w => this._pickupAllowed(w)));
    for (const team of ['P', 'B']) {
      const spawns = this.world.spawns[team] || [];
      const sz = spawns.length ? spawns[0].z : 0;
      const inward = sz > 0 ? -1 : 1;                          // toward map center, in front of spawn
      rackRows.forEach((row, r) => {
        const n = row.length;
        row.forEach((w, c) => {
          // Armário COMPACTO (±8m) na frente do spawn: antes espalhava ±18m e as armas das
          // pontas (m400/lmg/etc.) caíam a ~27m, fora do campo de visão — "não achei a M400".
          // Agora todas ficam a ≤~17m e dentro do FOV de quem nasce (spawns em x∈[-9..9]).
          const HW = 8;
          const gx = n > 1 ? -HW + (c * 2 * HW) / (n - 1) : 0;
          this._dropWeapon(gx, sz + inward * (2.2 + r * 1.7), w, true);
        });
      });
    }
    for (const k in this.vm.models) this.vm.models[k].visible = k === this.player.weapon;
    // viewmodel estático Tripo por classe (mesma regra do _switchWeapon, agora num método
    // só — cobre também o lazy-load: classe não carregada cai no procedural e carrega).
    this._applyVmVisibility();
    this.el.weaponName.textContent = WEAPONS[this.player.weapon].name;
    const slots = { P: 1, B: 0 };
    for (const b of this.bots) {
      place(b, b.team, slots[b.team]++);
      b.yaw = b.team === 'P' ? 0 : Math.PI;   // mesh forward is +Z
      b.target = null; b.path = null; b.repathAt = 0;
      b.mesh.group.rotation.set(0, b.yaw, 0);
      b.mesh.group.position.copy(b.pos);
      b.mesh.group.visible = true;
      if (b.mesh.isGLB) b.mesh.ctrl.revive();
    }
  }

  _endRound() {
    const p = this.roundKills.P, b = this.roundKills.B;
    let winner = null;
    if (p > b) winner = 'P'; else if (b > p) winner = 'B';
    if (winner) this.roundsWon[winner]++;
    this.state = 'roundEnd';
    this.stateUntil = this.time + 4;
    this.player.scoped = false; this.el.scope.classList.remove('on');
    this.radioOpen = null; this._radioUi();
    this._showScoreboard(true);   // CS-style: scoreboard pops at round end
    this._ensureDolly();          // dollynho comemora dançando no placar
    if (!winner) {
      this._banner('EMPATE NA TRETA', `${p} × ${b} — ninguém convenceu ninguém`);
      this.sfx.roundLose();
    } else {
      const mine = winner === this.playerTeam;
      this._banner(`${this._teamName(winner)} LEVARAM O ROUND`, `${p} × ${b} ` + (mine ? '— o povo (você) agradece' : '— a oposição (você) pede revanche'));
      if (!this.sfx.roundSound(this._voiceKey(winner))) mine ? this.sfx.roundWin() : this.sfx.roundLose();
    }
    if (this.roundsWon.P >= ROUNDS_TO_WIN || this.roundsWon.B >= ROUNDS_TO_WIN)
      this.stateUntil = this.time + 4.5; // then match end
  }

  _endMatch() {
    this.state = 'matchEnd';
    const winner = this.roundsWon.P > this.roundsWon.B ? 'P' : 'B';
    const mine = winner === this.playerTeam;
    // Tela de fim estilo CoD/Valorant: VITÓRIA/DERROTA gigante, time vencedor no sub.
    this.el.matchEnd.classList.toggle('win', mine);
    this.el.matchEnd.classList.toggle('lose', !mine);
    this.el.matchTitle.textContent = mine ? 'VITÓRIA' : 'DERROTA';
    this.el.matchSub.textContent = mine
      ? `${this._teamName(winner)} venceram a treta — a praça é sua. O pastel da vitória está pago.`
      : `${this._teamName(winner)} levaram a melhor — já pediram CPI da partida.`;
    this.el.matchStats.innerHTML =
      `<div><b>${this.roundsWon.P} × ${this.roundsWon.B}</b>rounds</div>` +
      `<div><b>${this.player.kills}</b>kills de ${this.player.name}</div>` +
      `<div><b>${this.player.deaths}</b>suas mortes</div>`;
    this.el.matchEnd.classList.remove('hidden');
    if (document.pointerLockElement) document.exitPointerLock();
    try { window.va?.('event', { name: 'match_end', data: { winner, roundsP: this.roundsWon.P, roundsB: this.roundsWon.B } }); } catch {}
    try {
      this.onMatchEnd?.({
        won: mine, team: this.playerTeam, character: this.playerDef.id,
        kills: this.player.kills, deaths: this.player.deaths,
        headshots: this.player.headshots || 0, bestStreak: this.mk.best || 0,
        roundsP: this.roundsWon.P, roundsB: this.roundsWon.B,
        seconds: Math.round(this.time),
      });
    } catch {}
    mine ? this.sfx.matchWin() : this.sfx.roundLose();
  }
  /* -------- dollynho dançando na tela de round vencido (pedido do usuário) -------- */
  // Canvas próprio dentro do placar de fim de round; toca o clipe de dança embutido
  // (models/dollynho_dance.glb, Mixamo) num renderer separado e transparente.
  _ensureDolly() {
    if (this._dolly) return this._dolly;
    const canvas = document.createElement('canvas');
    canvas.id = 'dollynho-dance';
    this.el.scoreboard.appendChild(canvas);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(240, 190, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 1.1));
    const dir = new THREE.DirectionalLight(0xffffff, 1.4); dir.position.set(2, 4, 3); scene.add(dir);
    const camera = new THREE.PerspectiveCamera(38, 240 / 190, 0.1, 50);
    camera.position.set(0, 1.35, 5.2); camera.lookAt(0, 0.95, 0);
    const dolly = this._dolly = { canvas, renderer, scene, camera, mixer: null, mesh: null, sphere: new THREE.Sphere(), cx: 0, cy: 0.9, cz: 0, dist: 5.2 };
    new GLTFLoader().load('models/dollynho_dance.glb', g => {
      const box = new THREE.Box3().setFromObject(g.scene);
      const s = 1.85 / (box.max.y - box.min.y);
      g.scene.scale.setScalar(s);
      g.scene.position.set(-(box.min.x + box.max.x) / 2 * s, -box.min.y * s, -(box.min.z + box.max.z) / 2 * s);
      scene.add(g.scene);
      // guarda a malha skinned p/ enquadrar pela bounding sphere animada a cada frame
      g.scene.traverse(o => { if (!dolly.mesh && o.isSkinnedMesh) dolly.mesh = o; });
      dolly.mixer = new THREE.AnimationMixer(g.scene);
      dolly.mixer.clipAction(g.animations[0]).play();   // mixamo.com (7s) em loop
    }, undefined, () => {});
    return dolly;
  }
  _tickDolly(dt) {
    if (!this._dolly) return;
    const on = this.state === 'roundEnd' && !this.el.scoreboard.classList.contains('hidden');
    this._dolly.canvas.style.display = on ? '' : 'none';
    if (!on) return;
    const d = this._dolly;
    if (d.mixer) d.mixer.update(dt);
    // enquadra pela bounding sphere da malha SKINNED (r160 já considera a pose animada):
    // acompanha centro+raio suavizados — o Dollynho fica sempre INTEIRO no quadro
    if (d.mesh) {
      d.mesh.computeBoundingSphere();
      d.sphere.copy(d.mesh.boundingSphere).applyMatrix4(d.mesh.matrixWorld);
      const k = Math.min(1, dt * 5);
      d.cx += (d.sphere.center.x - d.cx) * k;
      d.cy += (d.sphere.center.y - d.cy) * k;
      d.cz += (d.sphere.center.z - d.cz) * k;
      d.dist += (d.sphere.radius * 3.0 - d.dist) * k;
      d.camera.position.set(d.cx, d.cy + d.dist * 0.18, d.cz + d.dist);
      d.camera.lookAt(d.cx, d.cy, d.cz);
    }
    d.renderer.render(d.scene, d.camera);
  }

  setPaused(v) {
    if (this.state !== 'live' && this.state !== 'countdown') v = false;
    this.paused = v;
    if (v) this.keys = {};
    this.el.pause.classList.toggle('hidden', !v);
    if (v && document.pointerLockElement) document.exitPointerLock();
  }
  resume() {
    this.setPaused(false);
    if (!this.testMode) this._requestLock();
  }
  applySettings() {
    this.sfx.setVolume(this.settings.vol);
    this.sfx.speechEnabled = this.settings.speech !== false;
    if (this.el?.hudSpeech) this.el.hudSpeech.textContent = this.settings.speech === false ? '🔇' : '🔊';
    this._applyQuality();
  }
  _applyQuality() {
    const q = this.settings.quality;
    this.renderer.setPixelRatio(q === 'high' ? Math.min(devicePixelRatio, 2) : q === 'med' ? 1 : 0.75);
    const shadows = q !== 'low';
    this.renderer.shadowMap.enabled = shadows;
    this.world.sun.castShadow = shadows;
    this.scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
  }
  onResize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    if (this.vmCamera) { this.vmCamera.aspect = this.camera.aspect; this.vmCamera.fov = vmFovForAspect(this.camera.aspect); this.vmCamera.updateProjectionMatrix(); }
  }

  /* ================= team switch (M) ================= */
  _switchTeam(charId) {
    if (!this.player.alive || (this.state !== 'live' && this.state !== 'countdown')) return;
    const p = this.player;
    if (charId) { this.playerDef = byId(charId); p.def = this.playerDef; }   // personagem do novo lado
    const oldTeam = this.playerTeam;
    const newTeam = oldTeam === 'P' ? 'B' : 'P';
    this.playerTeam = newTeam; this.enemyTeam = oldTeam;
    p.team = newTeam;
    // rebalanceia 4×4: um bot do time novo deserta pro time velho
    const candidates = this.bots.filter(b => b.team === newTeam);
    const swapBot = candidates[(Math.random() * candidates.length) | 0];
    if (swapBot) {
      swapBot.team = oldTeam;
      const defs = CHARACTERS.filter(c => c.team === oldTeam && c.id !== p.def.id);
      const newDef = defs[(Math.random() * defs.length) | 0];
      swapBot.def = newDef; swapBot.name = newDef.name;
      this.scene.remove(swapBot.mesh.group);
      // GLB clones share geometry with the cached template — never dispose it here.
      if (!swapBot.mesh.isGLB) swapBot.mesh.group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      swapBot.mesh = buildCharacterModel(newDef) || buildCharacter(newDef);
      swapBot.mesh.group.traverse(o => { o.userData.botOwner = swapBot; });
      this.scene.add(swapBot.mesh.group);
      swapBot.target = null; swapBot.path = null; swapBot.hp = 100; swapBot.alive = true;
      const s = this.world.spawns[oldTeam][(Math.random() * 4) | 0];
      swapBot.pos.set(s.x, 0, s.z);
      swapBot.yaw = oldTeam === 'P' ? 0 : Math.PI;
      swapBot.mesh.group.rotation.set(0, swapBot.yaw, 0);
      swapBot.mesh.group.position.copy(swapBot.pos);
      swapBot.mesh.group.visible = true;
    }
    // respawn do jogador no lado novo
    const s = this.world.spawns[newTeam][(Math.random() * 4) | 0];
    p.pos.set(s.x, 0, s.z); p.vel.set(0, 0, 0);
    p.yaw = newTeam === 'P' ? Math.PI : 0; p.pitch = 0; p.hp = 100;
    this._scope(false, true);
    this._banner(`VOCÊ AGORA É ${this._teamName(newTeam)}`, 'trocou de lado na treta — sem penalty, só julgamento');
    this.sfx.uiClick();
  }

  /* ================= weapons ================= */
  // Visibilidade arma procedural × viewmodel estático Tripo (uma regra só, usada pelo
  // _switchWeapon e pelo _resetPositions): variante por id quando existe (staticVmKey);
  // senão a classe. Se o template da classe ainda não carregou (lazy-load G2-R14A),
  // mostra o procedural + braços IK e dispara o load em background (_ensureStaticVm).
  _applyVmVisibility() {
    const w = this.player.weapon;
    let sc = staticVmKey(w);
    // G2-R13: a herói dedicada da arma pode faltar mesmo com a VARIANTE de classe já
    // construída (classe subiu no boot sem o template herói — ex.: trocar pra m4/svd sem
    // preload). Sem esse gatilho o _ensureStaticVm nunca rodava e a arma ficava na variante.
    const dedMissing = DED_VM[w] && !(this._staticVmDed && this._staticVmDed.has(w));
    if (sc && (!this.vm.staticVms[sc] || dedMissing)) { this._ensureStaticVm(w); if (!this.vm.staticVms[sc]) sc = null; }
    for (const [k, m] of Object.entries(this.vm.staticVms)) m.visible = k === sc;
    if (this.vm.arms) this.vm.arms.group.visible = !sc;
    for (const k in this.vm.models) this.vm.models[k].visible = sc ? false : k === w;
  }
  // Lazy-load do viewmodel estático da classe da arma (G2-R14A): carrega arms_<cls>.glb
  // (+ o template herói dedicado, se a arma tiver) sob demanda, constrói as variantes da
  // classe e re-aplica a visibilidade se o jogador segura uma arma dessa classe.
  _ensureStaticVm(w) {
    const cls = STATIC_CLASS[w];
    if (!cls || this._weaponOnly) return;
    const pend = this._vmLoading || (this._vmLoading = {});
    const dedTpl = DED_VM[w];
    // pendência por CLASSE+HERÓI (era só classe: trocar m4→mp5 rápido deixava a herói da
    // mp5 sem carregar pra sempre — a 1ª pendência abafava as seguintes).
    const key = dedTpl ? `${cls}+${dedTpl}` : cls;
    if (pend[key]) return;
    pend[key] = true;
    const infl = this._vmInflight || (this._vmInflight = {});
    infl[cls] = (infl[cls] || 0) + 1;
    const loads = [];
    if (!this._staticVmBuilt.has(cls)) loads.push(loadStaticVm(cls));
    if (dedTpl) loads.push(loadStaticVm(dedTpl));
    if (!loads.length) { infl[cls]--; return; }
    Promise.all(loads).then(() => {
      infl[cls]--;
      if (this._disposed) return;
      if (!this._staticVmBuilt.has(cls)) this._buildStaticVmClass(cls);
      // Classe JÁ construída (ex.: rifle do loadout inicial) mas a herói dedicada
      // desta arma chegou agora: rebuild da classe p/ a chave nascer com a GLB herói.
      // Só rebuilda quando TODAS as heróis em voo da classe chegaram — troca rápida
      // m4→mp5→p90 dispara N ensures e faria N rebuilds idênticos (pico de heap).
      else if (dedTpl && !(this._staticVmDed && this._staticVmDed.has(w)) && !infl[cls]) this._rebuildStaticVmClass(cls);
      // bocas de cano recomputadas no build (classe + heróis) entram no lookup
      Object.assign(this._vmMuzzle, this._vmMuzzleCls || {}, this._vmMuzzleExt || {});
      if (STATIC_CLASS[this.player.weapon] === cls) this._applyVmVisibility();
    }).catch((e) => console.warn('[vm] lazy-load da classe falhou', cls, e));
  }
  // Rebuild de uma classe já construída (herói dedicada carregou DEPOIS do build — ver
  // _ensureStaticVm): remove os clones antigos do vm.root, libera os materiais clonados
  // (a GEOMETRIA é compartilhada com o template — nunca dispor) e constrói de novo.
  _rebuildStaticVmClass(cls) {
    for (const [k, m] of Object.entries(this.vm.staticVms)) {
      if (k !== cls && STATIC_CLASS[k] !== cls) continue;
      this.vm.root.remove(m);
      m.traverse((o) => {
        if (!o.isMesh || !o.material) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const mm of mats) mm.dispose && mm.dispose();
      });
      delete this.vm.staticVms[k];
    }
    this._staticVmBuilt.delete(cls);
    this._buildStaticVmClass(cls);
  }
  _switchWeapon(w) {
    const p = this.player;
    if (p.weapon === w || !p.alive || !WEAPONS[w]) return;
    if (w !== 'knife' && !p.ammo[w]) p.ammo[w] = { mag: WEAPONS[w].mag, res: WEAPONS[w].reserve };
    p.weapon = w; p.reloadUntil = 0; p.drawUntil = this.time + 0.28;
    // remember the slot so 1/2 recall the LAST weapon of that kind (primary vs sidearm)
    if (w !== 'knife') { if (PISTOLS.has(w)) p.secondary = w; else p.primary = w; }
    this.vm.reloadDip = 0;   // evita arma travada inclinada ao trocar no meio da recarga
    this.bloom = 0;
    this._scope(false, true);
    this._applyVmVisibility();
    this.el.weaponName.textContent = WEAPONS[w].name;
    this.el.reloadNote.classList.add('hidden');
    if (w === 'knife') this.sfx.knifeDeploy(); else this.sfx.uiClick();
  }
  _scope(on, silent = false) {
    const p = this.player, w = p.weapon;
    // any weapon (except knife) can aim-zoom; only real scopes show the circle.
    // G2-R14A: a shotgun era bloqueada aqui ("shotgun não mira" — dono) — agora faz o
    // mesmo ADS AUG-style do rifle (zoom leve + VM desliza pra fora + crosshair fina).
    if (on && (w === 'knife' || !p.alive || this._reloading())) on = false;
    if (p.scoped === on) return;
    p.scoped = on;
    const showMask = on && !!(WEAPONS[w] && WEAPONS[w].scope);
    this.el.scope.classList.toggle('on', showMask);
    // entra com opacity 0 NO MESMO FRAME do display:block — sem isso o compositor pinta a
    // máscara preta da luneta ainda no FOV 70 (o "frame quase preto" da transição de ADS);
    // quem sobe a opacidade é o _updatePlayer, no ritmo do zoom do FOV.
    if (showMask) this.el.scope.style.opacity = '0';
    if (!silent) on ? this.sfx.scopeIn() : this.sfx.scopeOut();
  }
  // Target FOV while aiming: strong for scoped snipers, light ADS for the rest.
  _zoomFov(w) {
    // Zoom de ADS mais forte que antes (base é FOV 70): pedido "parece longe, dá pra ver no
    // ferrolho". Snipers com luneta = zoom pesado; marksman forte; rifles/SMG/pistola iron-sight.
    const Z = { awp: 22, mosin: 20, rem700: 22, m400: 34, m400scope: 34, svd: 30, g3sg1: 30, sks: 32, md97: 40, carbine: 38, shotgun: 44,
      ak: 42, m92: 42, akm: 42, g3: 42, m4: 42, scar: 42, tavor: 42, famas: 42,
      mp5: 46, uzi: 46, p90: 46, lmg: 44, deagle: 47, pistol: 48, revolver38: 48 };
    return Z[w] || 46;
  }
  _reloading() { return this.time < this.player.reloadUntil; }
  _startReload() {
    const p = this.player, w = p.weapon;
    if (w === 'knife' || !p.alive || this._reloading()) return;
    const a = p.ammo[w];
    if (a.mag >= WEAPONS[w].mag || a.res <= 0) return;
    this._scope(false, true);
    p.reloadUntil = this.time + WEAPONS[w].reload;
    this.el.reloadNote.classList.remove('hidden');
    this.sfx.reloadStart();
  }
  _tryShoot() {
    const p = this.player, w = WEAPONS[p.weapon];
    if (!p.alive || this.state !== 'live') return;
    if (this.time < p.nextShotAt || this._reloading() || this.time < p.drawUntil) return;
    if (p.weapon === 'knife') {
      p.nextShotAt = this.time + w.rate;
      this.vm.recoil.kick(1); this.sfx.knife();
      this._meleeHit();
      return;
    }
    const a = p.ammo[p.weapon];
    if (a.mag <= 0) { this.sfx.dryFire(); this._startReload(); return; }
    a.mag--;
    p.nextShotAt = this.time + w.rate;
    p.revealedAt = this.time;
    if (p.weapon === 'awp') setTimeout(() => this.sfx.bolt(), 420);
    this.sfx.shotWeapon(p.weapon, 0);   // 1ª pessoa = distância 0 no mix do synth
    // spread & direction — crouching tightens it up; autos dão bloom
    const crouchMul = 1 - 0.5 * p.crouchF;
    this.bloom = Math.min(1.6, (this.bloom || 0) + (w.auto ? 0.22 : 0));
    const spreadBase = (p.weapon === 'awp' ? (p.scoped ? w.spreadScope : w.spreadHip) : w.spreadHip) * crouchMul;
    const from = this.camera.getWorldPosition(new THREE.Vector3());
    const pellets = w.pellets || 1;
    for (let i = 0; i < pellets; i++) {
      const sp = spreadBase * (1 + this.bloom) * (pellets > 1 ? 1 : 1);
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      dir.x += (Math.random() - .5) * sp; dir.y += (Math.random() - .5) * sp; dir.z += (Math.random() - .5) * sp;
      dir.normalize();
      this._fireHitscan(this.player, from, dir, w.dmg, true, w.short);
    }
    // recoil + muzzle flash — accumulates and RECOVERS toward zero (ev.io/CS pattern,
    // not a permanent pitch climb)
    p.recoilP = (p.recoilP || 0) + w.recoil * (1 - 0.25 * p.crouchF);
    // pico do kick escalado por recoil da arma (SMG ~0.6, rifle ~0.6-0.65, pistola/dmr ~0.9,
    // sniper/shotgun ~1.2-1.3) + direção lateral aleatória do coice.
    // Classe pistola ×0.5 (R7.6): o kick cheio jogava a deagle pra borda superior da tela —
    // coice de pistola gira no punho, não levanta o cano até o teto.
    const kickMul = STATIC_CLASS[p.weapon] === 'pistol' ? 0.5 : 1;
    this.vm.recoil.kick(Math.min(1.5, 0.55 + (w.recoil || 0.01) * 13) * (1 - 0.25 * p.crouchF) * kickMul);
    this.vm.kickSide = Math.random() * 2 - 1;
    const _cls = STATIC_CLASS[p.weapon] || 'rifle';
    this._flash(this._muzzleWorld(_cls), this.camera.getWorldDirection(new THREE.Vector3()), _cls);
    this._ejectCasing();
    // bolt-action snipers drop the scope after each shot (CS-style); autos stay aimed
    if (p.scoped && (p.weapon === 'awp' || p.weapon === 'mosin' || p.weapon === 'rem700')) this._scope(false, true);
  }
  _meleeHit() {
    const from = this.camera.getWorldPosition(new THREE.Vector3());
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    let best = null, bd = WEAPONS.knife.range;
    for (const b of this.bots) {
      if (!b.alive || b.team === this.playerTeam) continue;
      const to = b.pos.clone().setY(b.pos.y + 1.2).sub(from);
      const d = to.length();
      if (d < bd && to.normalize().dot(dir) > 0.6) { best = b; bd = d; }
    }
    if (best) { this.sfx.knifeHit(); this._damage(best, WEAPONS.knife.dmg, this.player, 'FACA'); }
  }
  _fireHitscan(shooter, from, dir, dmg, byPlayer = false, weap = 'AWP') {
    this.ray.set(from, dir); this.ray.far = 200;
    const enemyGroups = this.bots.filter(b => b.alive && (byPlayer ? b.team !== this.playerTeam : true)).map(b => b.mesh.group);
    const hitsChar = enemyGroups.length ? this.ray.intersectObjects(enemyGroups, true) : [];
    const hitsWorld = this.ray.intersectObjects(this.world.occluders, false);
    const hC = hitsChar[0], hW = hitsWorld[0];
    let end;
    if (hC && (!hW || hC.distance < hW.distance)) {
      let o = hC.object, bot = null, head = false;
      while (o) {
        if (o.userData.botOwner && !bot) bot = o.userData.botOwner;
        if (bot && o === bot.mesh.parts.head) head = true;
        o = o.parent;
      }
      end = hC.point;
      if (bot) {
        if (bot.team === shooter.team) { /* friendly fire off */ }
        else this._damage(bot, head && dmg < 100 ? 100 : dmg, shooter, weap, head, end); // headshot: dano mínimo 100
      }
    } else if (hW) {
      end = hW.point;
      this._puff(hW.point, hW.face ? hW.face.normal : null);
      if (Math.random() < 0.3) this.sfx.ricochet();
    } else {
      end = from.clone().add(dir.clone().multiplyScalar(120));
    }
    if (byPlayer) {
      const muzzle = this._muzzleWorld(STATIC_CLASS[this.player.weapon] || 'rifle');
      this._tracer(muzzle, end);
    }
    return end;
  }
  _damage(ent, dmg, attacker, weap = 'AWP', head = false, point = null) {
    if (!ent.alive || this.state !== 'live') return;
    if (this.time < (ent.protUntil || 0)) return;   // spawn protection: zero dano (e sem hitmarker) enquanto protegido
    ent.hp -= dmg;
    if (ent.isPlayer) {
      this.el.vignette.style.opacity = 0.9;
      setTimeout(() => this.el.vignette.style.opacity = 0, 130);
      // flash vermelho na barra de HP ao tomar dano: entrada instantânea (sem transição
      // de cor na ida, senão o vermelho "entra" devagar), volta suave ao limpar
      const hf = this.el.hpFill;
      hf.style.transition = 'width .15s';
      hf.style.background = '#ff3b3b';
      clearTimeout(this._hpT);
      this._hpT = setTimeout(() => {
        hf.style.transition = 'width .15s,background .4s ease-out';
        hf.style.background = '';
      }, 400);
      // directional indicator: wedge pointing at the attacker relative to the view
      if (attacker && attacker.pos && this.el.dmgDir) {
        const rel = Math.atan2(attacker.pos.x - ent.pos.x, attacker.pos.z - ent.pos.z) - ent.yaw;
        const el = this.el.dmgDir;
        el.style.transform = `rotate(${rel.toFixed(3)}rad)`;
        el.style.opacity = 0.95;
        clearTimeout(this._dmgDirT);
        this._dmgDirT = setTimeout(() => { el.style.opacity = 0; }, 700);
      }
      this.sfx.hurt();
    } else if (attacker === this.player) {
      this._hitmarker(ent.hp <= 0, head);   // som suprimido SÓ em kill; visual vermelho em kill OU headshot
      this._dmgNumber(point || ent.pos, dmg, head, ent.hp <= 0);
    }
    if (!ent.isPlayer && attacker && attacker.team !== ent.team && !ent.target && attacker.alive)
      ent.target = attacker;   // bot caça quem o atingiu
    if (ent.hp <= 0) this._kill(ent, attacker, weap, head);
  }
  _kill(ent, attacker, weap = 'AWP', head = false) {
    ent.alive = false; ent.hp = 0; ent.deaths++;
    ent.respawnAt = this.time + RESPAWN_DELAY;
    // Sem drop de arma onde morreu: o arsenal completo já está no respawn, então drops
    // pelo mapa viravam lixo espalhado (pedido do usuário: nada de arma jogada no chão).
    // this._dropWeapon(ent.pos.x, ent.pos.z, ent.weapon === 'knife' ? 'awp' : ent.weapon);
    if (attacker) {
      attacker.kills++; this.roundKills[attacker.team]++;
      this.sfx.voice(this._voiceKey(attacker.team));   // killer's side celebrates (meme audio)
      if (attacker.isPlayer) {
        this.sfx.killConfirm();
        if (head) { this.sfx.general('headshot'); attacker.headshots++; }
        const mk = this.mk;
        if (this.time < mk.until) mk.count++; else mk.count = 1;
        mk.until = this.time + 4.5; mk.life++;
        mk.best = Math.max(mk.best || 0, mk.count);
        const kind = mk.count >= 6 ? 'godlike' : (MK_TIERS[mk.count] || (mk.life === 5 ? 'killingspree' : null));
        if (kind) { this._mkBanner(MK_LABELS[kind]); this.sfx.general(kind); }
      }
    }
    if (ent.isPlayer) {
      this._scope(false, true);
      this.mk.life = 0;
      this.el.respawn.classList.remove('hidden');
      this.sfx.death();
    } else {
      ent.target = null; ent.deadT = 0;
      // sting de morte de BOT escala com a distância (sumia o "eco": toda morte no mapa
      // tocava o thud completo no ouvido do player, em cima do tiro que matou) +
      // pan pela direção relativa + delay de propagação (dist/343)
      const d = ent.pos ? ent.pos.distanceTo(this.camera.position) : 0;
      const rel = ent.pos ? Math.atan2(ent.pos.x - this.player.pos.x, ent.pos.z - this.player.pos.z) - this.player.yaw : 0;
      const pan = Math.max(-0.85, Math.min(0.85, Math.sin(rel) * 0.8));
      this.sfx.death(Math.max(0, 1 - d / 34), pan, Math.min(0.25, d / 343));
    }
    this._feed(attacker, ent, weap, head);
  }
  _mkBanner(text) {
    const b = this.el.mkBanner;
    b.textContent = text;
    b.classList.remove('show');
    void b.offsetWidth;   // reinicia a animação CSS (letter-spacing settle)
    b.classList.add('show');
    clearTimeout(this._mkT);
    this._mkT = setTimeout(() => b.classList.remove('show'), 1900);
  }
  _hitmarker(isKill, isHead) {
    const h = this.el.hitmarker;
    h.classList.toggle('kill', isKill || isHead);   // vermelho em kill OU headshot (estilo CoD)
    h.classList.remove('show');
    void h.offsetWidth;   // reinicia o pop da animação
    h.classList.add('show');
    clearTimeout(this._hmT);
    this._hmT = setTimeout(() => h.classList.remove('show'), 140);
    // em kill NÃO toca o bip de hit: o killConfirm já soa em seguida (antes = bip+bip-bip
    // empilhados no mesmo evento — o "som disparado 2x" reportado como eco).
    // Headshot NÃO-letal toca normal (bug da rodada 4: ficava mudo).
    if (!isKill) this.sfx.hitmark();
  }
  // Número de dano flutuante estilo CoD: projeta o ponto do hit 3D na tela,
  // sobe e esmaece (~0.6s, CSS). Headshot = âmbar, kill = vermelho.
  _dmgNumber(pos, dmg, head, kill) {
    const wrap = this.el.dmgNums;
    if (!wrap || !pos) return;
    const w = new THREE.Vector3(pos.x, (pos.y || 0) + 1.15, pos.z);
    const dist = this.camera.position.distanceTo(w);
    const v = w.project(this.camera);
    if (v.z > 1) return;   // atrás da câmera
    const d = document.createElement('div');
    d.className = 'dmg-num' + (kill ? ' kill' : head ? ' head' : '');
    d.textContent = Math.round(dmg);
    // tamanho escala com a distância (perto = maior), nunca abaixo de 24px efetivos
    // (crítico R7.5: 18px sumia em cena clara) — contorno escuro já está no CSS.
    let px = 23 * (7 / Math.max(2.5, dist));
    if (kill) px *= 1.3; else if (head) px *= 1.15;
    d.style.fontSize = Math.max(24, Math.min(36, px)).toFixed(0) + 'px';
    d.style.left = ((v.x * 0.5 + 0.5) * innerWidth + (Math.random() * 32 - 16)).toFixed(0) + 'px';
    d.style.top = ((-v.y * 0.5 + 0.5) * innerHeight + (Math.random() * 8 - 4)).toFixed(0) + 'px';
    wrap.appendChild(d);
    setTimeout(() => d.remove(), 900);
  }
  _feed(attacker, victim, weap, head = false) {
    const row = document.createElement('div');
    const meAtk = attacker && attacker.isPlayer, meVic = victim.isPlayer;
    row.className = 'kf-row' + (meAtk ? ' me-atk' : '') + (meVic ? ' me-vic' : '');
    // chip escuro com tint do time (~18% alpha) e texto na cor do time (estilo CoD/Valorant)
    const cn = e => {
      const c = this._teamColor(e.team);
      return `<span class="kf-n" style="background:${c}2e;color:${c}">${e.isPlayer ? 'VOCÊ' : e.name}</span>`;
    };
    row.innerHTML = attacker && attacker !== victim
      ? `${cn(attacker)}${head ? this._skullIcon() : ''}${this._wpnIcon(weap)}${cn(victim)}`
      : `${cn(victim)}<span class="kf-w">tropeçou na treta</span>`;
    this.el.killfeed.prepend(row);
    setTimeout(() => row.remove(), 4600);
    while (this.el.killfeed.children.length > 6) this.el.killfeed.lastChild.remove();
  }
  // Caveira SVG de headshot no killfeed (mesmo pipeline do _wpnIcon — nada de emoji no HUD).
  _skullIcon() {
    const d = 'M7 .8C4 .8 1.8 3 1.8 5.9c0 1.6.8 3 2 3.8v2.5h1.5v-1.6h1.1v1.6h1.2v-1.6h1.1v1.6h1.5V9.7c1.2-.8 2-2.2 2-3.8C13.2 3 11 .8 7 .8z'
      + 'M4.9 7.5c-.8 0-1.5-.6-1.5-1.4S4.1 4.7 4.9 4.7s1.5.6 1.5 1.4-.6 1.4-1.5 1.4z'
      + 'M9.1 7.5c-.8 0-1.5-.6-1.5-1.4S8.3 4.7 9.1 4.7s1.5.6 1.5 1.4-.7 1.4-1.5 1.4z';
    return `<svg class="kf-ic kf-skull" viewBox="0 0 14 13" width="18" height="17"><path d="${d}" fill="currentColor" fill-rule="evenodd"/></svg>`;
  }
  // Ícone 2D da arma no killfeed (estilo CoD — o dono pediu silhuetas RECONHECÍVEIS
  // por arma, não só por classe). Recebe o `short` (AWP/AK/DE/M3/FACA…). ~14 desenhos
  // distintos + fallback refinado por classe pro resto do arsenal. Mira pra direita.
  _wpnIcon(short) {
    const s = (short || '').toUpperCase();
    const F = 'fill="currentColor"';
    const I = {
      // AWP: coronha + corpo + scope alto + cano longo + mag
      awp: `<path ${F} d="M0 6l6-1v3.2L2 10.2H0z"/><rect ${F} x="6" y="4" width="8.5" height="3"/><rect ${F} x="14.5" y="4.6" width="9" height="1.3"/><rect ${F} x="8" y="1.7" width="6" height="1.9"/><rect ${F} x="9.6" y="3.6" width="1" height="0.8"/><rect ${F} x="9.4" y="7" width="2.2" height="3.2"/><rect ${F} x="6.4" y="7" width="1.5" height="2.8"/>`,
      // AK/AKM/M92: mag CURVA inconfundível + tubo de gás
      ak: `<path ${F} d="M0 5.6l6-0.6v3.4l-4.6 1.2-1.4-1z"/><rect ${F} x="6" y="4" width="9" height="2.8"/><rect ${F} x="15" y="4.4" width="8" height="1.2"/><rect ${F} x="15" y="3.3" width="5" height="0.9"/><path ${F} d="M9.2 6.8h3.2c0 2.2-0.9 3.6-2.8 4.4l-1.4-1.5c1.1-0.6 1.6-1.5 1.6-2.9z"/><rect ${F} x="6.6" y="6.8" width="1.5" height="2.8"/>`,
      // M4: carry handle + mag reta levemente inclinada + coronha reta
      m4: `<rect ${F} x="1" y="4.6" width="4.5" height="3.4"/><rect ${F} x="5.5" y="4.2" width="7" height="2.6"/><rect ${F} x="12.5" y="4.2" width="3.5" height="2.2"/><rect ${F} x="16" y="4.6" width="7" height="1.1"/><rect ${F} x="6.5" y="2.6" width="5" height="1.2"/><rect ${F} x="19.6" y="3.2" width="0.9" height="1.4"/><path ${F} d="M8.6 6.8h2.2l0.6 4-2 0.4z"/><rect ${F} x="6" y="6.8" width="1.4" height="3"/>`,
      // MP5: compacta, mag curva fina, coronha esquelética, focinho curto
      mp5: `<rect ${F} x="0.5" y="5" width="4.5" height="1.6"/><rect ${F} x="5" y="4" width="8.5" height="3"/><rect ${F} x="13.5" y="4.8" width="6.5" height="1.1"/><rect ${F} x="18.6" y="4.2" width="1.8" height="2"/><path ${F} d="M8.6 7h2.4c0 2-0.7 3.2-2.2 4l-1.2-1.3c0.9-0.5 1.3-1.3 1.3-2.7z"/><rect ${F} x="5.4" y="7" width="1.5" height="3"/>`,
      // P90: caixote bullpup arredondado com trilho em cima
      p90: `<path ${F} d="M3 5h13a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H3z"/><rect ${F} x="18" y="6" width="3" height="1.4"/><rect ${F} x="7" y="3.4" width="8" height="1.4"/><rect ${F} x="1.4" y="6" width="2" height="4"/><rect ${F} x="6" y="9" width="1.6" height="2.6"/>`,
      // UZI: corpo pequeno, mag LONGA saindo do grip
      uzi: `<rect ${F} x="2.5" y="5" width="3.5" height="1.1"/><rect ${F} x="6" y="4" width="9" height="3"/><rect ${F} x="15" y="4.8" width="5.5" height="1.2"/><rect ${F} x="9.6" y="7" width="2" height="5.6"/><rect ${F} x="12.8" y="7" width="1.4" height="2.2"/>`,
      // DEAGLE: pistola parruda, slide grosso
      deagle: `<rect ${F} x="7" y="3.4" width="12" height="2.8"/><rect ${F} x="19" y="4" width="2" height="1.6"/><rect ${F} x="7" y="6.2" width="8" height="1.4"/><path ${F} d="M8 7.6h3.6l-0.6 5.2H7.6z"/><rect ${F} x="6.4" y="3.8" width="1" height="1.2"/>`,
      // pistola comum (PT-38): slide fino
      pistol: `<rect ${F} x="8" y="4" width="10.5" height="2"/><rect ${F} x="18.5" y="4.4" width="1.6" height="1.2"/><rect ${F} x="8" y="6" width="7.5" height="1.2"/><path ${F} d="M8.6 7.2h3l-0.7 4.6H8.1z"/>`,
      // revólver .38: tambor redondo
      revolver: `<rect ${F} x="11" y="4.2" width="8.5" height="1.8"/><circle ${F} cx="9.6" cy="5.7" r="2.3"/><rect ${F} x="6" y="4.4" width="3" height="2.2"/><rect ${F} x="5.2" y="4" width="1.2" height="1"/><path ${F} d="M6.4 6.8h2.8l-1.4 4.6H5.4z"/>`,
      // faca: lâmina clip-point + guarda + cabo
      knife: `<path ${F} d="M5 5.2l14-1 2.5 0.8-2.5 1.4-14 0.2z"/><rect ${F} x="4.2" y="3.8" width="1" height="3.6"/><rect ${F} x="0.6" y="4.6" width="3.6" height="1.8"/>`,
      // escopeta M3: cano grosso + tubo + pump
      shotgun: `<path ${F} d="M0 5.4l3.5-0.4v3.4l-2.9 1.6z"/><rect ${F} x="3.5" y="4.4" width="5" height="3"/><rect ${F} x="8.5" y="4" width="14" height="1.8"/><rect ${F} x="8.5" y="6.1" width="11.5" height="1.1"/><rect ${F} x="12" y="5.6" width="4.5" height="2.2"/>`,
      // mosin/rem700: ferrolho — cano fino longo + bolt + coronha de madeira
      bolt: `<path ${F} d="M0 5.4l4-0.4v3l-3 2z"/><rect ${F} x="4" y="4.2" width="7" height="2.6"/><rect ${F} x="11" y="4.4" width="12" height="1.2"/><circle ${F} cx="10.6" cy="3.2" r="1"/><rect ${F} x="9.8" y="3.4" width="2" height="0.8"/><rect ${F} x="5" y="6.8" width="1.6" height="2.6"/>`,
      // DMR (SVD/G3SG1/SKS): longa + scope + mag fina
      dmr: `<path ${F} d="M0 5l6-0.4v3.8l-5.2 1z"/><rect ${F} x="6" y="4.2" width="7.5" height="2.6"/><rect ${F} x="13.5" y="4.4" width="9.5" height="1.1"/><rect ${F} x="7" y="2.2" width="5.5" height="1.6"/><rect ${F} x="9" y="6.8" width="1.8" height="3.4"/><rect ${F} x="6.4" y="6.8" width="1.4" height="2.6"/>`,
      // LMG: corpo + caixa de munição embaixo
      lmg: `<rect ${F} x="1" y="4.8" width="4" height="3"/><rect ${F} x="5" y="4" width="9" height="3.2"/><rect ${F} x="14" y="4.6" width="9" height="1.4"/><rect ${F} x="7.5" y="7.2" width="4" height="4.4"/>`,
      // bullpup (TAVOR/FAMAS): mag ATRÁS do grip
      bullpup: `<rect ${F} x="2" y="4.8" width="3" height="3.2"/><rect ${F} x="5" y="4.2" width="11" height="3"/><rect ${F} x="16" y="4.8" width="7" height="1.1"/><rect ${F} x="10.5" y="7.2" width="2.2" height="3.6"/><rect ${F} x="7" y="7.2" width="1.5" height="2.8"/>`,
      // granada de mão (FRAG)
      frag: `<circle ${F} cx="11" cy="8.4" r="4.4"/><rect ${F} x="9.6" y="2" width="2.8" height="2.2"/><path ${F} d="M12.4 2.4c2.4-1 4.2 0.2 4.2 2.4h-1.6c0-1.2-1-1.8-2.6-1.2z"/>`,
      // fallback por classe
      sniper: `<path ${F} d="M0 5.4l4.5-0.4v3l-3.4 2z"/><rect ${F} x="4.5" y="4.2" width="8" height="2.6"/><rect ${F} x="12.5" y="4.5" width="10.5" height="1.2"/><rect ${F} x="6.5" y="2" width="5.5" height="1.7"/><rect ${F} x="7.4" y="6.8" width="1.8" height="3"/><rect ${F} x="5" y="6.8" width="1.4" height="2.6"/>`,
      rifle: `<path ${F} d="M0 5.6l5.5-0.6v3.4l-4.2 1.2-1.3-1z"/><rect ${F} x="5.5" y="4.2" width="9" height="2.6"/><rect ${F} x="14.5" y="4.5" width="8.5" height="1.2"/><rect ${F} x="8.4" y="6.8" width="2" height="3.6"/><rect ${F} x="6" y="6.8" width="1.5" height="2.8"/>`,
    };
    // ordem importa: os mais específicos primeiro
    const key = s === 'AWP' ? 'awp'
      : /^(AK|AKM|M92)$/.test(s) ? 'ak'
      : s === 'M4' ? 'm4'
      : s === 'MP5' ? 'mp5'
      : s === 'P90' ? 'p90'
      : s === 'UZI' ? 'uzi'
      : s === 'DE' ? 'deagle'
      : s === 'PT-38' ? 'pistol'
      : s === '.38' ? 'revolver'
      : /FACA|KNIFE/.test(s) ? 'knife'
      : /M3|SHOT/.test(s) ? 'shotgun'
      : /MOSIN|REM/.test(s) ? 'bolt'
      : /SVD|G3SG1|SKS/.test(s) ? 'dmr'
      : s === 'LMG' ? 'lmg'
      : /TAVOR|FAMAS/.test(s) ? 'bullpup'
      : /FRAG|NADE|GRANADA/.test(s) ? 'frag'
      : /M400|SNIPER/.test(s) ? 'sniper'
      : /DE|PT|\.38|PIST/.test(s) ? 'pistol'
      : 'rifle';
    return `<svg class="kf-ic" viewBox="0 0 24 14" width="34" height="20">${I[key]}</svg>`;
  }

  /* ================= fx ================= */
  _tracer(a, b) {
    const len = a.distanceTo(b);
    if (len < 0.5) return;
    // pooled mesh: shared unit cylinder, own material cloned once (never disposed per shot).
    // O rastro é um SEGMENTO CURTO (≤2m) que viaja de a→b em ~50ms com a opacidade CAINDO
    // ao longo do trajeto (era fade só no fim — lia como "lightsaber" em cena clara).
    const t = this._tracerPool.pop() || { m: new THREE.Mesh(this._tracerGeo, this._tracerMat.clone()), ttl: 0 };
    const m = t.m;
    t.a = (t.a || new THREE.Vector3()).copy(a);
    t.dir = (t.dir || new THREE.Vector3()).copy(b).sub(a).normalize();
    t.dist = len;
    t.v = len / 0.05;                       // cruza o caminho inteiro em ~50ms
    t.seg = Math.min(len, 2.0);             // comprimento do rastro (curto = bala, não viga)
    t.t = 0;
    t.ttl = 0.05 + 0.012;                   // viagem + fade final — sem persistência
    m.material.opacity = 0.9;
    m.position.copy(a);
    m.scale.set(1, 0.01, 1);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), t.dir);
    this.scene.add(m);
    this.tracers.push(t);
  }
  _puff(pos, normal) {
    // impact smoke: one GPU particle (batched, no allocation)
    const p = pos.clone();
    if (normal) p.add(normal.clone().multiplyScalar(0.12));
    this.puffFx.spawn(p, { life: 0.4, size: 0.4, grow: 2.2 });
    // persistent bullet hole on the surface (capped ring buffer)
    if (normal) {
      const m = new THREE.Mesh(this._holeGeo, this._holeMat);
      m.position.copy(pos).add(normal.clone().multiplyScalar(0.012));
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().normalize());
      m.rotateZ(Math.random() * Math.PI * 2);
      m.scale.setScalar(0.7 + Math.random() * 0.6);
      this.scene.add(m);
      this.decals.push(m);
      if (this.decals.length > 48) { const old = this.decals.shift(); this.scene.remove(old); }
    }
  }
  _flash(pos, dir, fpCls) {
    // muzzle flash: estrela irregular + núcleo branco-quente (sprites), point light pulsante,
    // faíscas com velocidade e fumacinha. dir opcional (default = frente da câmera).
    // fpCls (classe do VM) = tiro do PRÓPRIO jogador: a estrela nasce na vmScene como FILHA
    // do vm.root na offset local da boca — segue o kick/bob colada no cano (R7.6).
    let d = dir;
    if (!d || d.lengthSq() < 1e-6) { d = new THREE.Vector3(); this.camera.getWorldDirection(d); }
    else d = d.clone().normalize();
    if (fpCls) {
      const m = this._vmMzPool.pop();
      if (m) {
        const off = this._vmMuzzle[this.player?.weapon] || this._vmMuzzle[fpCls] || this._vmMuzzle.rifle;   // arma (supressor) → classe → fallback
        m.grp.position.copy(off);
        const s = 0.85 + Math.random() * 0.45;
        m.jetS = 0.22 * s; m.coreS = 0.08 * s;              // boca a ~0.35m da lente: menor que o do mundo
        m.jet.scale.setScalar(m.jetS); m.core.scale.setScalar(m.coreS);
        m.jetMat.rotation = Math.random() * Math.PI * 2;
        m.jetMat.opacity = 1; m.coreMat.opacity = 1; m.grp.visible = true; m.t = 0;
        this._vmMzActive.push(m);
      }
    } else {
      const m = this._mzPool.pop();
      if (m) {
        m.grp.position.copy(pos).addScaledVector(d, 0.05);   // leve viés à frente da boca
        const s = 0.85 + Math.random() * 0.5;                // variação por tiro (0.36–0.57m no sprite)
        m.jetS = 0.42 * s; m.coreS = 0.15 * s;
        m.jet.scale.setScalar(m.jetS); m.core.scale.setScalar(m.coreS);
        m.jetMat.rotation = Math.random() * Math.PI * 2;     // estrela nunca repete o ângulo
        m.jetMat.opacity = 1; m.coreMat.opacity = 1; m.grp.visible = true; m.t = 0;
        this._mzActive.push(m);
      }
    }
    const l = this._mzLights.pop();
    if (l) { l.position.copy(pos).addScaledVector(d, 0.12); l.intensity = 18; this._mzLightActive.push({ l, t: 0, life: 0.05 }); }
    // flash na CENA DO VM: pulso breve sincronizado (ilumina a arma em 1ª pessoa)
    if (this._vmFlash) { this._vmFlash.t = 0; if (this._vmFlashLight) this._vmFlashLight.intensity = this._vmFlash.peak; }
    // faíscas 3D (partículas com velocidade, encolhendo) + fumacinha. No tiro do PRÓPRIO
    // jogador a boca fica a ~0.35m da lente — velocidade/tamanho reduzidos pra não virar um
    // blob flutuante deslocado do cano (crítico R7.6).
    const sparkMul = fpCls ? 0.35 : 1;
    for (let i = 0; i < 5; i++) {
      const v = d.clone().multiplyScalar((6 + Math.random() * 7) * sparkMul).add(new THREE.Vector3((Math.random() - 0.5) * 4.5 * sparkMul, (Math.random() - 0.5) * 4.5 * sparkMul, (Math.random() - 0.5) * 4.5 * sparkMul));
      this.flashFx.spawn(pos, { vel: v, life: 0.06 + Math.random() * 0.05, size: fpCls ? 0.07 : 0.11, grow: -0.4 });
    }
    this.puffFx.spawn(pos.clone().addScaledVector(d, 0.18), { vel: d.clone().multiplyScalar(1.2), life: 0.3, size: fpCls ? 0.16 : 0.28, grow: 0.9 });
  }
  // Boca do cano em WORLD SPACE no instante do tiro: offset local da classe transformada
  // pelo matrixWorld ATUAL do vm.root (com o kick acumulado) e depois pela câmera — usado
  // pelo tracer e pela luz/faísca do mundo no tiro do jogador (R7.6).
  _muzzleWorld(cls) {
    const off = this._vmMuzzle[this.player?.weapon] || this._vmMuzzle[cls] || this._vmMuzzle.rifle;
    this.vm.root.updateWorldMatrix(true, false);
    const v = off.clone();
    this.vm.root.localToWorld(v);          // vmScene == espaço da câmera (vmCamera na origem)
    return this.camera.localToWorld(v);
  }
  // Porta com SENSOR (Havan): desliza as 2 folhas ao chegar perto (player ou bot). Painéis são
  // só visuais (não colidem), então quando você alcança a porta já está aberta.
  _updateDoors(dt) {
    const doors = this.world.doors; if (!doors) return;
    for (const d of doors) {
      let near = Math.hypot(this.player.pos.x - d.x, this.player.pos.z - d.z) < 5.5;
      if (!near) for (const b of this.bots) { if (b.alive && Math.hypot(b.pos.x - d.x, b.pos.z - d.z) < 5.5) { near = true; break; } }
      d.open += ((near ? 1 : 0) - d.open) * Math.min(1, dt * 7);
      d.panelL.position.x = d.closedL + (d.openL - d.closedL) * d.open;
      d.panelR.position.x = d.closedR + (d.openR - d.closedR) * d.open;
    }
  }
  _updateFx(dt) {
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.t += dt; t.ttl -= dt;
      // segmento viajante: cabeça avança a t.v, cauda segue t.seg atrás; fade nos últimos 50ms
      const head = Math.min(t.dist, t.v * t.t);
      const tail = Math.max(0, head - t.seg);
      const vis = Math.max(0.01, head - tail);
      t.m.scale.y = vis;
      t.m.position.copy(t.a).addScaledVector(t.dir, tail + vis * 0.5);
      t.m.material.opacity = 0.9 * Math.max(0, 1 - t.t / t.ttl);   // fade ao longo do trajeto
      if (t.ttl <= 0) { this.scene.remove(t.m); this._tracerPool.push(t); this.tracers.splice(i, 1); }
    }
    // cápsulas: gravidade + quica no chão + gira; encolhe e some no fim.
    const groundY = this.camera.position.y - 1.55;
    for (let i = this._casings.length - 1; i >= 0; i--) {
      const c = this._casings[i];
      c.ttl -= dt; c.v.y -= 9.8 * dt;
      c.m.position.addScaledVector(c.v, dt);
      if (c.m.position.y < groundY) { c.m.position.y = groundY; c.v.y = Math.abs(c.v.y) * 0.35; c.v.x *= 0.6; c.v.z *= 0.6; c.av.multiplyScalar(0.5); }
      c.m.rotation.x += c.av.x * dt; c.m.rotation.y += c.av.y * dt; c.m.rotation.z += c.av.z * dt;
      if (c.ttl < 0.3) c.m.scale.setScalar(Math.max(0.02, c.ttl / 0.3));
      if (c.ttl <= 0) { this.scene.remove(c.m); c.m.scale.setScalar(1); this._casingPool.push(c); this._casings.splice(i, 1); }
    }
    this.flashFx.update(dt);
    this.puffFx.update(dt);
    // muzzle flash: sprites esmaecem rápido (≤3 frames), núcleo some antes; luzes decaem à 0
    for (let i = this._mzActive.length - 1; i >= 0; i--) {
      const m = this._mzActive[i]; m.t += dt; const k = m.t / m.life;
      if (k >= 1) { m.grp.visible = false; this._mzActive.splice(i, 1); this._mzPool.push(m); continue; }
      const op = 1 - k; m.jetMat.opacity = op; m.coreMat.opacity = op * op;
      m.jet.scale.setScalar(m.jetS * (1 + k * 0.5)); m.core.scale.setScalar(m.coreS * (1 + k * 0.2));
    }
    // flash de 1ª pessoa (filho do vm.root): mesmo fade — a posição acompanha o kick sozinha
    for (let i = this._vmMzActive.length - 1; i >= 0; i--) {
      const m = this._vmMzActive[i]; m.t += dt; const k = m.t / m.life;
      if (k >= 1) { m.grp.visible = false; this._vmMzActive.splice(i, 1); this._vmMzPool.push(m); continue; }
      const op = 1 - k; m.jetMat.opacity = op; m.coreMat.opacity = op * op;
      m.jet.scale.setScalar(m.jetS * (1 + k * 0.5)); m.core.scale.setScalar(m.coreS * (1 + k * 0.2));
    }
    for (let i = this._mzLightActive.length - 1; i >= 0; i--) {
      const e = this._mzLightActive[i]; e.t += dt; const k = e.t / e.life;
      if (k >= 1) { e.l.intensity = 0; this._mzLightActive.splice(i, 1); this._mzLights.push(e.l); continue; }
      e.l.intensity = 18 * (1 - k) * (1 - k);
    }
    // pulso do flash na vmScene: decaimento quadrático, ~45ms (sincronizado com o jato 3D)
    if (this._vmFlash && this._vmFlashLight) {
      const f = this._vmFlash;
      if (f.t < f.life) {
        f.t += dt; const k = Math.min(1, f.t / f.life);
        this._vmFlashLight.intensity = f.peak * (1 - k) * (1 - k);
      } else if (this._vmFlashLight.intensity !== 0) this._vmFlashLight.intensity = 0;
    }
  }

  _ejectCasing() {
    if (this.player.weapon === 'knife') return;
    const c = this._casingPool.pop() || { m: new THREE.Mesh(this._casingGeo, this._casingMat), v: new THREE.Vector3(), av: new THREE.Vector3(), ttl: 0 };
    c.m.position.copy(this.camera.localToWorld(new THREE.Vector3(0.28, -0.14, -0.7)));
    const q = this.camera.quaternion;
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    const back = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    c.v.copy(right).multiplyScalar(2.2 + Math.random() * 0.9).addScaledVector(up, 1.7 + Math.random() * 0.6).addScaledVector(back, 0.5 + Math.random() * 0.4);
    c.av.set((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 24, (Math.random() - 0.5) * 24);
    c.m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    c.m.scale.setScalar(1); c.ttl = 1.6;
    this.scene.add(c.m); this._casings.push(c);
  }

  // Pano da bandeira CTF: base clara (a cor do time multiplica), faixas de ondulação,
  // gradiente e borda gasta/desfiada na ponta — nunca um retângulo de cor plana.
  _makeCtfFlagTex() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 160;
    const x = c.getContext('2d');
    let seed = 163; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    x.fillStyle = '#e8e6e2'; x.fillRect(0, 0, 256, 160);
    for (let i = 0; i < 7; i++) {   // ondulação: faixas verticais claro/escuro
      const g = x.createLinearGradient(i * 36, 0, i * 36 + 36, 0);
      g.addColorStop(0, 'rgba(120,118,112,0.28)'); g.addColorStop(0.45, 'rgba(255,255,255,0.22)'); g.addColorStop(1, 'rgba(120,118,112,0.28)');
      x.fillStyle = g; x.fillRect(i * 36, 0, 36, 160);
    }
    const gb = x.createLinearGradient(0, 0, 0, 160);   // peso embaixo
    gb.addColorStop(0, 'rgba(255,255,255,0.12)'); gb.addColorStop(1, 'rgba(90,86,80,0.3)');
    x.fillStyle = gb; x.fillRect(0, 0, 256, 160);
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(96,90,80,${0.08 + rnd() * 0.15})`; x.fillRect(rnd() * 256, rnd() * 160, 2 + rnd() * 5, 1.5 + rnd() * 3); }   // sujeira
    // borda gasta: desfiado na ponta (fly end) e vincos no mastro
    for (let i = 0; i < 26; i++) { x.clearRect(250 + rnd() * 6, rnd() * 160, 2 + rnd() * 6, 1 + rnd() * 4); }
    x.strokeStyle = 'rgba(90,86,80,0.5)'; x.lineWidth = 3; x.beginPath(); x.moveTo(4, 0); x.lineTo(4, 160); x.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  // Zona de captura CTF: disco de terra compactada escura c/ borda irregular + anel pintado
  // GASTO (amarelo sinalização desbotado). Substitui o círculo verde-chapado saturado que
  // dominava o primeiro plano (crítico gauntlet R6). Só visual — raio/lógica intactos.
  _makeCtfZoneTex() {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d');
    let seed = 149; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const cx = S / 2, cy = S / 2;
    // terra compactada: blobs escuros sobrepostos (borda irregular, nunca um círculo perfeito)
    for (let i = 0; i < 30; i++) {
      const a = rnd() * Math.PI * 2, r = rnd() * 62;
      const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r, rr = 40 + rnd() * 42;
      const g = x.createRadialGradient(px, py, 2, px, py, rr);
      g.addColorStop(0, 'rgba(66,54,38,0.5)'); g.addColorStop(1, 'rgba(66,54,38,0)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, rr, 0, 7); x.fill();
    }
    // grãos da terra pisada
    for (let i = 0; i < 700; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 108;
      x.fillStyle = rnd() > 0.5 ? `rgba(40,32,22,${0.1 + rnd() * 0.25})` : `rgba(110,94,66,${0.1 + rnd() * 0.2})`;
      x.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.7, 1.7);
    }
    // anel pintado gasto: arcos tracejados amarelo-sinalização desbotado, com falhas
    x.lineWidth = 7; x.lineCap = 'butt';
    for (let i = 0; i < 14; i++) {
      if (rnd() < 0.2) continue;   // falhas (tinta sumiu)
      const a0 = (i / 14) * Math.PI * 2 + rnd() * 0.12, a1 = a0 + (Math.PI * 2 / 14) * (0.55 + rnd() * 0.3);
      x.strokeStyle = `rgba(226,204,140,${0.35 + rnd() * 0.35})`;
      x.beginPath(); x.arc(cx, cy, 112, a0, a1); x.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
  }

  _makeSmokeTex() {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.5, 'rgba(220,222,226,0.6)'); g.addColorStop(1, 'rgba(210,212,216,0)');
    x.fillStyle = g; x.beginPath(); x.arc(64, 64, 64, 0, 6.29); x.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  _updateSmokeHud() {
    if (this.el && this.el.smokeCount) this.el.smokeCount.textContent = '💨 ' + (this.player.smokes | 0) + '   🧨 ' + (this.player.frags | 0);
  }

  // Spawner genérico: projétil físico com pavio; ao estourar vira fumaça OU explosão de frag.
  // Usado pelo jogador (câmera) e pelos bots (olho + direção do alvo).
  _spawnGrenade(origin, dir, kind, owner) {
    const mesh = new THREE.Mesh(this._grenGeo, kind === 'frag' ? this._fragMat : this._grenMat);
    mesh.position.copy(origin).addScaledVector(dir, 0.5);
    this.scene.add(mesh);
    this._grenades.push({
      mesh, kind, owner,
      v: dir.clone().multiplyScalar(kind === 'frag' ? 17 : 15).add(new THREE.Vector3(0, 3.2, 0)),
      fuse: kind === 'frag' ? 1.5 : 2.2,
    });
  }

  _throwSmoke() {
    const p = this.player;
    if (!p.alive || (p.smokes | 0) <= 0 || this.time < (p._nextNade || 0)) return;
    p.smokes--; p._nextNade = this.time + 0.6; this._updateSmokeHud();
    const dir = new THREE.Vector3(); this.camera.getWorldDirection(dir);
    this._spawnGrenade(this.camera.position, dir, 'smoke', p);
  }

  _throwFrag() {
    const p = this.player;
    if (!p.alive || (p.frags | 0) <= 0 || this.time < (p._nextNade || 0)) return;
    p.frags--; p._nextNade = this.time + 0.6; this._updateSmokeHud();
    const dir = new THREE.Vector3(); this.camera.getWorldDirection(dir);
    this._spawnGrenade(this.camera.position, dir, 'frag', p);
  }

  // Explosão de frag: dano em área SÓ nos inimigos do dono (sem fogo amigo, arcade), com
  // falloff radial, estilhaços visuais e clarão. Tremor de tela se o jogador estiver perto.
  _explodeFrag(pos, owner) {
    const R = 6.5;
    this._flash(pos.clone());
    for (let i = 0; i < 7; i++) this._puff(pos.clone().add(new THREE.Vector3((Math.random() - .5) * 1.4, Math.random() * 1.3, (Math.random() - .5) * 1.4)), null);
    if (this.sfx.explosion) this.sfx.explosion();
    const team = owner ? owner.team : this.playerTeam;
    for (const c of this.combatants) {
      if (!c.alive || c.team === team) continue;
      const d = Math.hypot(c.pos.x - pos.x, c.pos.z - pos.z);
      const dy = Math.abs((c.pos.y || 0) - pos.y);
      if (d > R || dy > 4) continue;
      const dmg = Math.round(95 * (1 - d / R));
      if (dmg > 0) this._damage(c, dmg, owner || this.player, 'FRAG');
    }
    const pd = Math.hypot(this.player.pos.x - pos.x, this.player.pos.z - pos.z);
    if (pd < R * 1.6 && this.el.vignette) {
      this.el.vignette.style.transition = 'opacity 0.1s'; this.el.vignette.style.opacity = String(Math.min(0.85, (R * 1.6 - pd) / (R * 1.6)));
      setTimeout(() => { if (this.el.vignette) this.el.vignette.style.opacity = '0'; }, 130);
    }
  }

  _popSmoke(pos) {
    const R = 2.6;
    const group = new THREE.Group();
    group.position.set(pos.x, Math.max(0.5, pos.y), pos.z);
    const sprites = [];
    for (let i = 0; i < 18; i++) {
      const mat = new THREE.SpriteMaterial({ map: this._smokeTex, color: 0xcfd2d6, transparent: true, opacity: 0, depthWrite: false });
      const sp = new THREE.Sprite(mat);
      const a = Math.random() * 6.28, r = Math.random() * R, h = (Math.random() - 0.2) * R;
      sp.position.set(Math.cos(a) * r, h, Math.sin(a) * r);
      sp.scale.setScalar(3 + Math.random() * 2.2);
      sp.userData = { baseOp: 0.7 + Math.random() * 0.3 };
      group.add(sp); sprites.push(sp);
    }
    this.scene.add(group);
    this._smokes.push({ center: group.position.clone(), radius: R + 1.4, born: this.time, dur: 13, group, sprites, _opaque: false });
  }

  _updateGrenades(dt) {
    for (let i = this._grenades.length - 1; i >= 0; i--) {
      const g = this._grenades[i];
      g.fuse -= dt; g.v.y -= 12 * dt;
      g.mesh.position.addScaledVector(g.v, dt);
      if (g.mesh.position.y < 0.1) { g.mesh.position.y = 0.1; g.v.y = Math.abs(g.v.y) * 0.4; g.v.x *= 0.6; g.v.z *= 0.6; }
      if (g.fuse <= 0) {
        if (g.kind === 'frag') this._explodeFrag(g.mesh.position.clone(), g.owner);
        else this._popSmoke(g.mesh.position.clone());
        this.scene.remove(g.mesh); this._grenades.splice(i, 1);
      }
    }
    for (let i = this._smokes.length - 1; i >= 0; i--) {
      const s = this._smokes[i], age = this.time - s.born;
      if (age >= s.dur) { this.scene.remove(s.group); this._smokes.splice(i, 1); continue; }
      const grow = Math.min(1, age / 0.8);
      let op = grow;
      if (age > s.dur - 2.5) op = Math.max(0, (s.dur - age) / 2.5);
      s.group.scale.setScalar(0.5 + 0.5 * grow);
      for (const sp of s.sprites) sp.material.opacity = op * sp.userData.baseOp;
      s._opaque = op > 0.45;
    }
  }

  // ---------------- Capture the Flag (?ctf=1) ----------------
  // Cor do time no CTF (anel/bandeira/HUD). AZUL pro lado do JOGADOR quando a facção é Tribos
  // Urbanas; senão P vermelho / B verde. `dark` = tom mais escuro (pano da bandeira).
  _teamColor(side, dark = false) {
    if (this._mirror(side)) return dark ? '#6a2fb5' : '#a05cff';   // MIRROR (mesma facção) -> inimigo roxo
    const f = this._factionOf(side);
    if (f === 'U') return dark ? '#2f7fe0' : '#4aa3ff';            // Tribos azul
    if (f === 'P') return dark ? '#e03232' : '#ff5555';            // Petista vermelho
    if (f === 'B') return dark ? '#1faa4d' : '#55dd66';            // Bolsonarista verde
    return dark ? '#aaaaaa' : '#999999';
  }
  // Pack de vozes/round por FACÇÃO: o lado do jogador usa 'U' (Tribos) quando a facção é Tribos
  // Urbanas; senão o lado (P/B). O inimigo é sempre político. Corrige "Tribos usa voz de Petista".
  // Facção que ocupa um LADO físico (P/B): lado do jogador = playerFaction, o outro = enemyFaction.
  _factionOf(side) { return side === this.playerTeam ? this.playerFaction : this.enemyFaction; }
  _voiceKey(side) { return this._factionOf(side); }   // pack de vozes/round por facção (P/B/U)
  _teamName(side) { const f = this._factionOf(side); return f === 'U' ? 'TRIBOS URBANAS' : (TEAM_LABEL[f] || f); }
  _teamTag(side) { const f = this._factionOf(side); return f === 'U' ? 'TRB' : f === 'P' ? 'PET' : 'BOL'; }
  _mirror(side) { return side === this.enemyTeam && this.enemyFaction === this.playerFaction; }   // inimigo = mesma facção
  // Separação (boids): empurra o bot pra longe de colegas do mesmo time num raio curto, pra eles
  // NÃO andarem colados em fila indiana sobre o mesmo path. Peso ~inverso à distância.
  _botSeparation(b, dt) {
    let px = 0, pz = 0;
    for (const o of this.bots) {
      if (o === b || !o.alive || o.team !== b.team) continue;
      const dx = b.pos.x - o.pos.x, dz = b.pos.z - o.pos.z, d2 = dx * dx + dz * dz;
      if (d2 < 2.56 && d2 > 1e-4) { const d = Math.sqrt(d2), w = (1.6 - d) / 1.6; px += (dx / d) * w; pz += (dz / d) * w; }
    }
    if (px || pz) { b.pos.x += px * BOT_SPEED * 0.7 * dt; b.pos.z += pz * BOT_SPEED * 0.7 * dt; this._collide(b.pos, 0.38); }
  }
  _initCTF() {
    for (const p of this.ctfPts) for (const m of [p.ring, p.zone, p.pole, p.flag]) if (m) this.scene.remove(m);
    const sP = this.world.spawns.P[0], sB = this.world.spawns.B[0];
    const mk = (id, label, x, z) => {
      // disco de terra compactada (visual novo — anel fino de time por cima)
      const zone = new THREE.Mesh(this._ctfZoneGeo, new THREE.MeshStandardMaterial({
        map: this._ctfZoneTex, transparent: true, roughness: 0.95, metalness: 0,
        depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
      }));
      zone.position.set(x, 0.06, z); zone.rotation.x = -Math.PI / 2; zone.scale.setScalar(4.5);
      zone.receiveShadow = true;
      const ring = new THREE.Mesh(this._ctfRingGeo, new THREE.MeshBasicMaterial({ color: 0xb8b4a8, transparent: true, opacity: 0.6, depthWrite: false }));
      ring.position.set(x, 0.12, z); ring.rotation.x = Math.PI / 2; ring.scale.setScalar(4.5);
      // mastro + bandeira que colore com o dono (vermelha P / verde B), como pedido.
      // Pano TEXTURIZADO (crítico R6: "retângulo verde-chapado gigante"): ondulação,
      // gradiente e borda gasta — a cor do time multiplica o pano dessaturado.
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.2, 8), new THREE.MeshStandardMaterial({ color: 0xbfc3c9, metalness: 0.6, roughness: 0.5 }));
      pole.position.set(x, 2.1, z);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.05, 6, 3), new THREE.MeshBasicMaterial({ map: this._ctfFlagTex || (this._ctfFlagTex = this._makeCtfFlagTex()), color: 0xaaaaaa, side: THREE.DoubleSide }));
      // ondulação estática do pano (vértices em seno — sem custo de animação)
      {
        const pos = flag.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const fx = pos.getX(i);
          pos.setZ(i, Math.sin((fx / 1.7 + 0.5) * Math.PI * 2.2) * 0.07 * (fx / 1.7 + 0.5));
        }
        pos.needsUpdate = true; flag.geometry.computeVertexNormals();
      }
      flag.position.set(x + 0.9, 3.55, z);
      this.scene.add(zone); this.scene.add(ring); this.scene.add(pole); this.scene.add(flag);
      return { id, label, x, z, r: 4.5, owner: null, prog: 0, ring, zone, pole, flag };
    };
    // Bandeiras por-mapa: o mapa pode fornecer world.ctfPoints (Havan = 4 bandeiras, ferro velho
    // = 4, etc.). Senão, layout padrão do Brasília (2 spawns + ônibus no meio).
    if (this.world.ctfPoints && this.world.ctfPoints.length) {
      this.ctfPts = this.world.ctfPoints.map(p => mk(p.id, p.label, p.x, p.z));
    } else {
      this.ctfPts = [
        mk('P', 'CONGRESSO', sP.x * 0.82, sP.z * 0.82),
        mk('MID', 'ÔNIBUS', 2.5, 2.5),
        mk('B', 'CATEDRAL', sB.x * 0.82, sB.z * 0.82),
      ];
    }
    this._updateCtfHud();
  }

  _updateCTF(dt) {
    const CAP = 3;   // segundos pra capturar
    for (const pt of this.ctfPts) {
      let np = 0, nb = 0;
      for (const c of this.combatants) {
        if (!c.alive) continue;
        const dx = c.pos.x - pt.x, dz = c.pos.z - pt.z;
        if (dx * dx + dz * dz <= pt.r * pt.r) { if (c.team === 'P') np++; else nb++; }
      }
      const solo = np > 0 && nb === 0 ? 'P' : (nb > 0 && np === 0 ? 'B' : null);
      pt.capTeam = solo;   // time que está capturando agora (pra cor da barra no HUD)
      if (solo && solo !== pt.owner) {
        pt.prog += dt / CAP;
        if (pt.prog >= 1) {
          pt.owner = solo; pt.prog = 0;
          this.sfx.captureSound && this.sfx.captureSound();   // som de captura de bandeira (pasta audio/capture)
          // credita a captura: +1 pro time e +1 pra cada combatente do time DENTRO do anel
          this.ctfCaps[solo] = (this.ctfCaps[solo] || 0) + 1;
          for (const c of this.combatants) {
            if (!c.alive || c.team !== solo) continue;
            const dx = c.pos.x - pt.x, dz = c.pos.z - pt.z;
            if (dx * dx + dz * dz <= pt.r * pt.r) c.captures = (c.captures || 0) + 1;
          }
          this._updateCtfHud();
        }
      } else if (!solo) {
        pt.prog = Math.max(0, pt.prog - dt / CAP);
      }
      // cor de time DESSATURADA no anel fino (-50% sat: identidade sem o verde-chapado)
      if (pt.owner) pt.ring.material.color.set(this._teamColor(pt.owner)).lerp(this._ctfGray, 0.45);
      else pt.ring.material.color.set(0xb8b4a8);
      pt.ring.material.opacity = 0.5 + 0.45 * (pt.prog || (pt.owner ? 1 : 0));
      if (pt.flag) pt.flag.material.color.set(this._teamColor(pt.owner, true)).lerp(this._ctfGray, pt.owner ? 0.25 : 0);   // pano dessaturado
    }
    this._updateCtfHud();   // atualiza a barra de progresso de captura a cada frame
    const owners = this.ctfPts.map(p => p.owner);
    if (owners.length && owners.every(o => o === 'P')) this._ctfWin('P');   // vale p/ 3 ou 4 bandeiras (por-mapa)
    else if (owners.length && owners.every(o => o === 'B')) this._ctfWin('B');
  }

  _ctfWin(team) {
    this.roundsWon[team] = (this.roundsWon[team] || 0) + 1;
    this.state = 'roundEnd'; this.stateUntil = this.time + 4;
    this.player.scoped = false; this.el.scope.classList.remove('on');
    this.radioOpen = null; this._radioUi();
    this._showScoreboard(true); this._ensureDolly();
    const mine = team === this.playerTeam;
    this._banner(`${this._teamName(team)} DOMINARAM OS 3 PODERES`, mine ? '— capturou tudo! 🏆' : '— corre pra retomar!');
    if (!this.sfx.roundSound(this._voiceKey(team))) mine ? this.sfx.roundWin() : this.sfx.roundLose();
  }

  // Simula a caminhada reta do bot (física _collide real) até um waypoint: responde se
  // o nó é FISICAMENTE alcançável da posição atual. O grafo do mapa tem arestas que
  // passam no segClear (inflate 0.25) mas não cabem o bot (r 0.38) — ex.: quina do muro
  // das ilhotas do piscinão (nó (-8.4,34) atrás do muro). G2-R6A.
  _walkReach(b, n) {
    if (!n) return false;
    const dx = n.x - b.pos.x, dz = n.z - b.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.8) return true;
    const sim = { x: b.pos.x, y: b.pos.y, z: b.pos.z };
    const steps = Math.min(24, Math.ceil(d / 0.3));
    for (let i = 0; i < steps; i++) { sim.x += (dx / d) * 0.3; sim.z += (dz / d) * 0.3; this._collide(sim, 0.38); }
    return Math.hypot(n.x - sim.x, n.z - sim.z) < 1.2;
  }
  // A* local idêntico ao do mapa, mas pulando nós banidos (b._banNodes — hops que o bot
  // não conseguiu transitar fisicamente). Mantido aqui (game.js) pra não tocar nos mapas.
  _findPathLocal(W, from, to, banned) {
    if (!banned || !banned.size) return W.findPath(from, to);
    const adj = W.waypoints.adj, nodes = W.waypoints.nodes;
    if (from === to) return [to];
    const n = nodes.length;
    const D = (a, c) => Math.hypot(nodes[a].x - nodes[c].x, nodes[a].z - nodes[c].z);
    const g = new Float32Array(n).fill(Infinity), f = new Float32Array(n).fill(Infinity);
    const prev = new Int32Array(n).fill(-1), open = new Uint8Array(n);
    g[from] = 0; f[from] = D(from, to); open[from] = 1; let openCount = 1;
    while (openCount > 0) {
      let cur = -1, bf = Infinity;
      for (let i = 0; i < n; i++) if (open[i] && f[i] < bf) { bf = f[i]; cur = i; }
      if (cur === -1) break;
      if (cur === to) { const path = [cur]; let c = prev[cur]; while (c !== -1) { path.unshift(c); c = prev[c]; } return path; }
      open[cur] = 0; openCount--;
      for (const m of adj[cur]) { if (banned.has(m)) continue; const t = g[cur] + D(cur, m); if (t < g[m]) { prev[m] = cur; g[m] = t; f[m] = t + D(m, to); if (!open[m]) { open[m] = 1; openCount++; } } }
    }
    return [from];
  }
  // IA de CTF do bot: sem alvo de combate, escolhe um ponto NÃO do seu time, navega até ele
  // via waypoints e o segura (ficar no anel já acumula progresso em _updateCTF). O esquadrão
  // se espalha pelos pontos via roamSeed (índice no time) — senão todos empilham no mesmo.
  _botCtf(b, dt) {
    const W = this.world, pts = this.ctfPts;
    if (!pts || !pts.length) { b._ctfMoving = 0; return; }
    const cur = pts[b.ctfPt];
    // G2-R6A: o re-sort a cada 3-5s flipava o alvo entre 2 pontos equidistantes no meio do
    // caminho (bot A→B→A "andando pro lado e pro outro"). Agora só re-alveja quando o ponto
    // virou do time (ou nunca teve alvo) — ponto válido é seguido até o fim.
    const need = b.ctfPt === undefined || !cur || cur.owner === b.team;
    if (need) {
      if (b.roamSeed === undefined) b.roamSeed = this.bots.indexOf(b);
      const cap = pts.map((p, i) => ({ i, d: Math.hypot(p.x - b.pos.x, p.z - b.pos.z) }))
        .filter(o => pts[o.i].owner !== b.team)
        .sort((a, c) => a.d - c.d);
      if (cap.length) {
        // 60% vai no mais perto; resto se espalha pelo roamSeed pra cobrir vários pontos
        b.ctfPt = (Math.random() < 0.6 ? cap[0] : cap[b.roamSeed % cap.length]).i;
      } else b.ctfPt = 1;   // tudo nosso (raro no meio do round): segura o meio
      b.ctfRepick = this.time + 8 + Math.random() * 4;
      b.path = null;
    } else if (this.time > (b.ctfRepick || 0)) b.ctfRepick = this.time + 8;   // alvo válido: segue nele (anti-flip)
    const pt = pts[b.ctfPt];
    const distPt = Math.hypot(pt.x - b.pos.x, pt.z - b.pos.z);
    if (distPt < pt.r * 0.7) {   // dentro do anel: segura e varre o entorno
      b._ctfMoving = 0;
      b.yaw += dt * 0.6 * (b.roamSeed % 2 ? 1 : -1);
      return;
    }
    if (!b.path || this.time > b.repathAt) {
      b.repathAt = this.time + 1.5;
      b.path = W.findPath(W.nearestWaypoint(b.pos.x, b.pos.z), W.nearestWaypoint(pt.x, pt.z));
      b.pathIdx = 1;
    }
    const atEnd = !b.path || b.pathIdx >= b.path.length;
    let tx = pt.x, tz = pt.z;
    if (!atEnd) { const n = W.waypoints.nodes[b.path[Math.min(b.pathIdx, b.path.length - 1)]]; tx = n.x; tz = n.z; }
    const dx = tx - b.pos.x, dz = tz - b.pos.z, d = Math.hypot(dx, dz);
    if (!atEnd && d < 0.7) { b.pathIdx++; b._ctfMoving = 1; return; }
    const wantYaw = Math.atan2(dx, dz);
    let dy = wantYaw - b.yaw;
    while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    b.yaw += dy * Math.min(1, dt * 8);
    const bSlow = this.world.slowAt && this.world.slowAt(b.pos.x, b.pos.z) ? 0.5 : 1;
    const px = b.pos.x, pz = b.pos.z;
    b.pos.x += Math.sin(b.yaw) * BOT_SPEED * bSlow * dt;
    b.pos.z += Math.cos(b.yaw) * BOT_SPEED * bSlow * dt;
    this._collide(b.pos, 0.38);
    b._ctfMoving = 1;
    const moved = Math.hypot(b.pos.x - px, b.pos.z - pz);
    if (moved < BOT_SPEED * bSlow * dt * 0.35) {
      b._stuckT = (b._stuckT || 0) + dt;
      if (b._stuckT > 0.5) { b.yaw += (Math.random() < 0.5 ? 1 : -1) * (0.8 + Math.random()); b.repathAt = 0; b.path = null; b._stuckT = 0; }
    } else b._stuckT = 0;
  }

  _updateCtfHud() {
    if (!this.el.ctfHud) return;
    this.el.ctfHud.classList.remove('hidden');
    this.el.ctfHud.innerHTML = this.ctfPts.map(p => {
      const col = p.owner ? this._teamColor(p.owner) : '#bbb';
      const prog = Math.max(0, Math.min(1, p.prog || 0));
      // barra de captura na COR DO TIME que captura (Tribos=azul, P=vermelho, B=verde); sem
      // ninguém capturando mas já dominado, usa a cor do dono; senão transparente.
      const barCol = p.capTeam ? this._teamColor(p.capTeam) : (prog > 0 && p.owner ? this._teamColor(p.owner) : 'transparent');
      const bar = `<span style="display:inline-block;width:52px;height:4px;margin-left:5px;background:rgba(255,255,255,.14);border-radius:2px;vertical-align:middle;overflow:hidden"><span style="display:block;height:100%;width:${(prog * 100) | 0}%;background:${barCol};transition:width .1s"></span></span>`;
      return `<span style="color:${col}">● ${p.label}</span>${bar}`;
    }).join('<span style="opacity:.4"> · </span>')
      + `<span style="opacity:.5"> — </span><span style="color:${this._teamColor('P')}">🚩 ${this.ctfCaps.P || 0}</span>`
      + `<span style="opacity:.4"> · </span><span style="color:${this._teamColor('B')}">🚩 ${this.ctfCaps.B || 0}</span>`;
  }

  /* ================= player physics ================= */
  _collide(pos, r) {
    for (const c of this.world.colliders) {
      const nx = Math.max(c.minX, Math.min(pos.x, c.maxX));
      const nz = Math.max(c.minZ, Math.min(pos.z, c.maxZ));
      const dx = pos.x - nx, dz = pos.z - nz;
      const d2 = dx * dx + dz * dz;
      if (d2 < r * r && pos.y + 1.5 > c.minY && pos.y + 0.3 < c.maxY) {
        if (d2 < 1e-8) { pos.x += r; continue; }
        const d = Math.sqrt(d2), push = (r - d) / d;
        pos.x += dx * push; pos.z += dz * push;
      }
    }
    const B = this.world.bounds;
    pos.x = Math.max(B.minX + r, Math.min(B.maxX - r, pos.x));
    pos.z = Math.max(B.minZ + r, Math.min(B.maxZ - r, pos.z));
  }
  _updatePlayer(dt) {
    const p = this.player;
    if (!p.alive) {
      const left = p.respawnAt - this.time;
      this.el.respawnCount.textContent = Math.max(0, left).toFixed(1);
      if (left <= 0) this._respawnPlayer();
      this.camera.position.y = Math.max(0.5, this.camera.position.y - dt * 2);
      this.camera.rotation.z = Math.min(0.5, (this.camera.rotation.z || 0) + dt * 0.8);
      return;
    }
    // crouch (CTRL ou C) — slower, steadier aim
    const wantCrouch = (this.keys.ControlLeft || this.keys.ControlRight || this.keys.KeyC) && p.grounded;
    p.crouchF = Math.max(0, Math.min(1, p.crouchF + (wantCrouch ? dt * 7 : -dt * 7)));
    const sprint = (this.keys.ShiftLeft || this.keys.ShiftRight) && p.crouchF < 0.3;
    const slowMul = this.world.slowAt && this.world.slowAt(p.pos.x, p.pos.z) ? 0.45 : 1;  // água/lago
    const maxSp = (sprint && slowMul === 1 ? 6.6 : 4.7) * (p.scoped ? 0.5 : 1) * (1 - 0.5 * p.crouchF) * slowMul;
    let ix = (this.keys.KeyD ? 1 : 0) - (this.keys.KeyA ? 1 : 0);
    let iz = (this.keys.KeyS ? 1 : 0) - (this.keys.KeyW ? 1 : 0);
    const il = Math.hypot(ix, iz) || 1; ix /= il; iz /= il;
    const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
    // camera: forward = (-sin, -cos), right = (cos, -sin)  →  wish = right*ix + forward*(-iz)
    const wx = ix * cos + iz * sin, wz = -ix * sin + iz * cos;
    // CoD tuning (port tuning.js): chão 92 m/s² (velocidade cheia em ~50ms = "tight");
    // ar = 25% de autoridade e NÃO ganha velocidade além da que saiu do chão (cap).
    const accel = p.grounded ? 92 : 23;
    const spBefore = Math.hypot(p.vel.x, p.vel.z);
    p.vel.x += wx * accel * dt; p.vel.z += wz * accel * dt;
    if (!p.grounded) {
      const spAir = Math.hypot(p.vel.x, p.vel.z);
      const cap = Math.max(spBefore, 4.7);
      if (spAir > cap) { p.vel.x *= cap / spAir; p.vel.z *= cap / spAir; }
    }
    if (p.grounded) {
      // friction applied ALWAYS (smooth controlled stop), stronger with no input
      const f = Math.max(0, 1 - (ix || iz ? 7 : 11) * dt);
      p.vel.x *= f; p.vel.z *= f;
    }
    const sp = Math.hypot(p.vel.x, p.vel.z);
    if (sp > maxSp) { p.vel.x *= maxSp / sp; p.vel.z *= maxSp / sp; }
    // jump: coyote time (90ms) + jump buffer (130ms) — tuning CoD/MW: pular logo depois de
    // sair da borda ou logo antes de tocar o chão ainda funciona (feel moderno, zero risco)
    p.coyoteUntil = p.grounded ? this.time + 0.09 : (p.coyoteUntil || 0);
    if (this.keys.Space && !this._spaceHeld) p.jumpBufferedUntil = this.time + 0.13;
    this._spaceHeld = !!this.keys.Space;
    if ((p.jumpBufferedUntil || 0) > this.time && this.time < (p.coyoteUntil || 0) && this._acceptInput()) {
      p.vel.y = 5.0; p.grounded = false; p.jumpBufferedUntil = 0; p.coyoteUntil = 0; this.sfx.jump();   // apex ~0.61m (CoD)
    }
    p.vel.y -= 20.6 * dt;   // gravidade exagerada do CoD — arco de pulo "snappy", não flutuante
    // integrate with step-limit so platform fronts block
    const oldG = this.world.groundHeightAt(p.pos.x, p.pos.z);
    const tryAxis = (dx, dz) => {
      const nx = p.pos.x + dx, nz = p.pos.z + dz;
      const g = this.world.groundHeightAt(nx, nz);
      if (g - oldG > 0.55 && p.pos.y < g - 0.2) return; // wall-like step
      p.pos.x = nx; p.pos.z = nz;
    };
    tryAxis(p.vel.x * dt, 0); tryAxis(0, p.vel.z * dt);
    this._collide(p.pos, 0.38);
    p.pos.y += p.vel.y * dt;
    const g2 = this.world.groundHeightAt(p.pos.x, p.pos.z);
    if (p.pos.y <= g2) {
      if (!p.grounded && p.vel.y < -4) { this.sfx.land(); p.landDip = Math.min(1, -p.vel.y / 14); } // landing dip, sized by impact
      p.pos.y = g2; p.vel.y = 0; p.grounded = true;
    } else if (p.pos.y > g2 + 0.05) p.grounded = false;
    // auto-fire (ak/m4/mp5) enquanto o botão está segurado
    if (WEAPONS[p.weapon].auto && this.mouseDown0 && p.alive) this._tryShoot();
    this.bloom = Math.max(0, (this.bloom || 0) - dt * 1.8);
    // camera: crouch drop + landing dip (decays) + recoil recovery (decays) + speed bob
    p.landDip = (p.landDip || 0) + (0 - (p.landDip || 0)) * Math.min(1, dt * 7);
    // Camera punch (R7.6): a recuperação antiga (0.55/s + 3.5×recoilP) zerava o punch em
    // 1 frame (0.008 - 0.0092 < 0 — medido recoilP=0 em rajada inteira). Nova curva:
    // base 0.06/s + 2.0×recoilP → punch visível ~5-8 frames (~120ms), recupera SEMPRE
    // (termo proporcional limita o acúmulo da rajada — sobe um pouco e volta, não escala).
    p.recoilP = Math.max(0, (p.recoilP || 0) - dt * (0.06 + (p.recoilP || 0) * 2.0));
    const eye = 1.62 - 0.52 * p.crouchF - p.landDip * 0.09;
    this.camera.position.set(p.pos.x, p.pos.y + eye, p.pos.z);
    this.camera.rotation.set(p.pitch + p.recoilP, p.yaw, 0);
    // footsteps + view bob
    const moving = sp > 0.6 && p.grounded;
    if (moving) {
      p.stepPhase += dt * sp * 1.6;
      const prev = Math.sin(p.stepPhase - dt * sp * 1.6), now = Math.sin(p.stepPhase);
      if (prev >= 0 && now < 0) this.sfx.step(this.world.slowAt && this.world.slowAt(p.pos.x, p.pos.z) ? 'water' : 'concrete');
    }
    // Aim: real scopes (AWP / Mosin / Rem700) hide the gun and show the scope overlay.
    // Every other weapon does light iron-sight ADS — the gun stays on screen and the
    // crosshair stays visible so you can see exactly where you're aiming.
    const realScope = p.scoped && !!WEAPONS[p.weapon].scope;
    const tFov = p.scoped ? this._zoomFov(p.weapon) : (sprint && moving ? 76 : 70);
    if (Math.abs(this.camera.fov - tFov) > 0.05) {
      this.camera.fov += (tFov - this.camera.fov) * Math.min(1, dt * 16);
      this.camera.updateProjectionMatrix();
    }
    // scope overlay entra JUNTO com o zoom (era display:block instantâneo ainda no FOV 70 =
    // 1 frame de transição quase todo preto). Opacity = progresso do FOV (smoothstep), assim
    // a máscara preta da luneta só aparece quando o zoom já fechou.
    if (realScope) {
      const zf = Math.min(1, Math.max(0, (70 - this.camera.fov) / (70 - this._zoomFov(p.weapon))));
      this.el.scope.style.opacity = (zf * zf * (3 - 2 * zf)).toFixed(3);
    } else if (this.el.scope.style.opacity) this.el.scope.style.opacity = '';
    this.el.crosshair.style.display = realScope ? 'none' : 'block';
    // crosshair de precisão no ADS rifle (VM já deslizou pra fora — ver _adsSlide):
    // braços finos de 1px e gap mínimo fixo (AUG do CS); fora disso, gap dinâmico normal.
    const precAds = (this._adsSlide || 0) > 0.5;
    this.el.crosshair.classList.toggle('prec', precAds);
    // dynamic crosshair gap (movement/spray opens it, crouch + ADS tighten it)
    const gap = precAds ? 3 : Math.max(3, Math.min(26, 5 + sp * 1.15 + this.vm.kick * 20 - p.crouchF * 2.5 - (p.scoped ? 4 : 0)));
    this.el.crosshair.style.setProperty('--ch', gap.toFixed(1) + 'px');
    this.vm.root.visible = !realScope;
    // reload completion
    if (this._reloading()) {
      this.vm.reloadDip = Math.min(1, this.vm.reloadDip + dt * 3);   // sobe mais suave (menos truncado)
    } else {
      this.vm.reloadDip = Math.max(0, this.vm.reloadDip - dt * 4); // volta mais suave; safety: nunca trava inclinado
      if (p.reloadUntil > 0) {
        p.reloadUntil = 0;
        for (const k of Object.keys(p.ammo)) {
          const am = p.ammo[k], wm = WEAPONS[k].mag;
          if (am.mag < wm && am.res > 0) { const need = wm - am.mag, take = Math.min(need, am.res); am.mag += take; am.res -= take; }
        }
        this.el.reloadNote.classList.add('hidden');
        this.sfx.reloadEnd();
        this.vm.reloadDip = 0;
      }
    }
    // view model animation — recoil via RecoilAxis (spring snappy + residual, port CoD:
    // sobe instantâneo, volta quase tudo, settle lento; era decaimento linear dt*11)
    this.vm.kick = this.vm.recoil.step(dt);
    this._swayX = (this._swayX || 0) * Math.max(0, 1 - dt * 7); this._swayY = (this._swayY || 0) * Math.max(0, 1 - dt * 7);
    const bobAmp = Math.min(1, sp / 6.6);
    // bob figure-eight (Lissajous 1:2 travado na cadência dos passos, port CoD)
    const bobY = moving ? Math.sin(p.stepPhase * 2) * 0.010 * bobAmp : 0;
    const bobX = moving ? Math.sin(p.stepPhase) * 0.008 * bobAmp : 0;
    // iron-sight ADS: ease the gun toward screen center so you sight down it
    const adsWant = p.scoped && !realScope ? 1 : 0;
    this.vm.adsF = (this.vm.adsF || 0) + (adsWant - (this.vm.adsF || 0)) * Math.min(1, dt * 12);
    // Pose por classe (tabela _adsPose, R7.5) — centraliza de verdade com pull-back e
    // scale-down, em vez do damp 0.12 que deixava a arma no canto ("ADS = só zoom").
    const pose = this._adsPose[STATIC_CLASS[p.weapon]] || this._adsPose._hip;
    const a = this.vm.adsF;
    // ADS rifle (R7.6): sight picture é impossível com o arms_rifle.glb (mesh único, cano
    // baked em diagonal) — em adsF>0.8 o VM DESLIZA pra fora da tela (baixo-direita) e o
    // crosshair vira a variante fina de precisão (AUG do CS, sem overlay). Opção (a) do
    // crítico: lê como intenção, não como bug. Pistola mantém o iron-sight (aprovado).
    // G2-R14A: shotgun entra na mesma regra (arms_shotgun.glb é da mesma família Tripo).
    const _adsCls = STATIC_CLASS[p.weapon];
    const sl01 = Math.min(1, Math.max(0, (a - 0.8) / 0.2));
    const sl = (adsWant && (_adsCls === 'rifle' || _adsCls === 'shotgun')) ? sl01 * sl01 * (3 - 2 * sl01) : 0;
    this._adsSlide = sl;
    // draw animation: arma sobe de baixo ao trocar (drawUntil já existia p/ travar o tiro)
    const drawF = Math.max(0, (p.drawUntil - this.time) / 0.28);
    // Kick mais PUNCHY (dono: "animação de tiro ruim"): recuo pra trás + salto pra cima + subida
    // do cano + um jolt lateral (roll/yaw) aleatório por tiro, escalado por arma (ver _tryShoot).
    const k = this.vm.kick, ks = this.vm.kickSide || 0;
    this.vm.root.position.set(pose.x * a + sl * 0.3 + this._swayX * 0.02 + bobX, bobY - this.vm.reloadDip * 0.18 - p.crouchF * 0.02 + pose.y * a - sl * 0.38 + this._swayY * 0.015 - drawF * 0.22 + k * 0.045, k * 0.15 + pose.z * a);
    this.vm.root.rotation.x = k * 0.22 + this.vm.reloadDip * 0.6 - drawF * 0.55 + pose.rx * a;   // subida do cano + nível de ADS
    this.vm.root.rotation.y = ks * k * 0.05 + pose.ry * a;                                       // yaw do coice + nível de ADS
    this.vm.root.rotation.z = this._swayY * 0.03 + ks * k * 0.06;                                // roll do coice
    this.vm.root.scale.setScalar(1 - (1 - pose.s) * a);                                          // scale-down do VM em ADS
    // Braços reais: IK trava as mãos na arma visível DEPOIS de todos os transforms do
    // vm.root (kick/dip/ADS/sway/bob/draw) — as mãos acompanham a arma em qualquer estado.
    if (this.vm.arms && this.vm.root.visible) {
      const wg = this.vm.models[p.weapon];
      if (wg) poseToWeapon(this.vm.arms, wg, p.weapon);
    }
    // ?tvm=1: quando o viewmodel Tripo existe p/ a arma equipada, mostra ele e esconde o
    // braço+arma procedural (a GLB já traz mão+arma). Override por frame (robusto ao equip).
    if (this._tvm && this.vm.tvm) {
      const on = this.vm.root.visible && p.weapon === this.vm.tvmWeapon;
      this.vm.tvm.visible = on;
      if (on) {
        if (this.vm.arms && this.vm.arms.group) this.vm.arms.group.visible = false;
        const wg = this.vm.models[p.weapon]; if (wg) wg.visible = false;
      }
    }
  }
  // fy_pool_day ground weapons: anyone who runs over one grabs it (CS-1.6 style).
  // The gun vanishes and respawns after PICKUP_RESPAWN. No-op on maps without
  // pickups (e.g. awp_map). Called once per frame from update().
  _updatePickups() {
    const list = this.world.pickups || [];
    // jogador: captura manual com E (bots pegam andando mesmo)
    let near = null, nearDrop = -1, nearDist = 1.9 * 1.9;
    const consider = (pk, isDrop, idx) => {
      if (this.time < pk.readyAt) return;
      const dx = pk.x - this.player.pos.x, dz = pk.z - this.player.pos.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < nearDist) { nearDist = d2; near = pk; nearDrop = isDrop ? idx : -1; }
    };
    list.forEach((pk, i) => consider(pk, false, i));
    this.drops.forEach((pk, i) => consider(pk, true, i));
    this.nearPickup = near && this.player.alive && this._pickupAllowed(near.weapon) ? { pk: near, dropIdx: nearDrop } : null;
    if (this.el.pickupHint) {
      if (this.nearPickup && this.state === 'live') {
        this.el.pickupHint.textContent = `[E] PEGAR ${WEAPONS[this.nearPickup.pk.weapon].short}`;
        this.el.pickupHint.classList.remove('hidden');
      } else this.el.pickupHint.classList.add('hidden');
    }
    for (const pk of list) {
      // respawn a taken weapon
      if (pk.mesh && !pk.mesh.visible && this.time >= pk.readyAt) pk.mesh.visible = true;
      if (this.time < pk.readyAt) continue;        // still taken
      // bot grab (andando por cima)
      for (const b of this.bots) {
        if (!b.alive) continue;
        const dx = pk.x - b.pos.x, dz = pk.z - b.pos.z;
        if (dx * dx + dz * dz <= 1.7 * 1.7) { this._grabPickup(pk, b, false); break; }
      }
    }
    // drops: bots pegam andando (jogador só com E, acima). Spawn-rack drops are for the
    // PLAYER — bots leave them alone (otherwise they hoover the spawn line on round 1).
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const pk = this.drops[i];
      if (pk.rack) continue;
      for (const b of this.bots) {
        if (!b.alive) continue;
        const dx = pk.x - b.pos.x, dz = pk.z - b.pos.z;
        if (dx * dx + dz * dz <= 1.7 * 1.7) { this._grabPickup(pk, b, false); this.scene.remove(pk.mesh); this.drops.splice(i, 1); break; }
      }
    }
  }
  // Modo de armas EFETIVO. A Praça Clássica (praca_old) é sempre AWP-only (decisão do v2 alpha),
  // independente do que o menu escolheu — força 'awp' aqui sem mexer nas settings salvas.
  _wpnMode() {
    if (this._mapId === 'praca_old') return 'awp';
    return this.settings.wpnMode || 'all';
  }
  _botWeapon() {
    // Give bots varied weapons that match the weapon mode, so ground drops aren't all AWP.
    const mode = this._wpnMode();
    if (mode === 'awp') return 'awp';
    if (mode === 'knife') return 'knife';
    if (mode === 'pistols') return Math.random() < 0.5 ? 'pistol' : 'deagle';
    const pool = ['awp', 'ak', 'm4', 'mp5', 'shotgun', 'deagle', 'm92', 'akm', 'md97',
      'carbine', 'm400', 'mosin', 'rem700', 'lmg', 'scar', 'g3', 'tavor', 'famas', 'uzi', 'p90', 'revolver38'];
    return pool[(Math.random() * pool.length) | 0];
  }
  _pickupAllowed(w) {
    const mode = this._wpnMode();
    if (mode === 'pistols') return w === 'pistol' || w === 'deagle';
    if (mode === 'knife') return false;
    if (mode === 'awp') return w === 'awp';
    return true; // all
  }
  _grabPickup(pk, who, isPlayer) {
    const w = pk.weapon;                           // qualquer arma de WEAPONS
    if (!WEAPONS[w]) return false;
    if (isPlayer) {
      if (!who.ammo[w]) who.ammo[w] = { mag: 0, res: 0 };
      who.ammo[w].mag = WEAPONS[w].mag;
      who.ammo[w].res = WEAPONS[w].reserve;
      if (who.weapon !== w) {
        const oldW = who.weapon;                   // arma que estava na mão
        this._switchWeapon(w); this.sfx.reloadEnd();
        // dropa a arma antiga no chão (estilo CS) — MAS não no rack: o rack é armário, você
        // só troca de arma lá sem largar a anterior (senão o spawn vira um monte de armas).
        if (oldW && oldW !== w && oldW !== 'knife' && pk.mesh && !pk.rack) this._dropWeapon(pk.mesh.position.x, pk.mesh.position.z, oldW, false);
      } else this.sfx.uiClick();                   // mesma arma = só munição
    } else {
      who.weapon = w === 'knife' ? 'awp' : w;      // bot grabs it
    }
    // Rack (armário do spawn) é PERSISTENTE: fica visível e nunca some (bug: antes o rack
    // esvaziava porque a arma pega era removida de vez). Só pickups não-rack somem+respawnam.
    if (pk.mesh && !pk.rack) pk.mesh.visible = false;
    if (!pk.rack) pk.readyAt = this.time + PICKUP_RESPAWN;
    return true;
  }
  // CS: morto larga a arma no chão
  _dropWeapon(x, z, weapon, rack = false) {
    const mesh = weaponModel(weapon) || buildRifle();  // real GLB on the ground
    // lay it FLAT on its side (roll 90° about the barrel) so it rests on the ground
    // instead of standing on its belly. Rack drops (spawn weapon rows) get an aligned
    // yaw so they read as a tidy line; death drops/scatter get a random yaw.
    mesh.position.set(x, 0.09, z);
    mesh.rotation.set(0, rack ? (Math.random() - 0.5) * 0.18 : Math.random() * Math.PI * 2, Math.PI / 2);
    mesh.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.scene.add(mesh);
    this.drops.push({ x, z, weapon, readyAt: 0, mesh, rack });
  }
  _respawnPlayer() {
    const p = this.player;
    const s = this.world.spawns[p.team][(Math.random() * 4) | 0];
    p.pos.set(s.x, 0, s.z); p.vel.set(0, 0, 0);
    p.hp = 100; p.alive = true; p.crouchF = 0;
    p.protUntil = this.time + SPAWN_PROT;
    p.yaw = p.team === 'P' ? Math.PI : 0; p.pitch = 0;
    // top off the CURRENT loadout's mags (primary could be any weapon now, not just AWP)
    if (p.primary && p.ammo[p.primary]) p.ammo[p.primary] = { mag: WEAPONS[p.primary].mag, res: WEAPONS[p.primary].reserve };
    if (p.secondary && p.ammo[p.secondary]) p.ammo[p.secondary] = { mag: WEAPONS[p.secondary].mag, res: WEAPONS[p.secondary].reserve };
    this.camera.rotation.z = 0;
    this.el.respawn.classList.add('hidden');
    this.sfx.respawn();
  }

  /* ================= bots ================= */
  _losClear(from, to) {
    const dir = to.clone().sub(from), dist = dir.length();
    if (dist < 0.5) return true;
    this.ray.set(from, dir.normalize()); this.ray.far = dist - 0.3;
    if (this.ray.intersectObjects(this.world.occluders, false).length > 0) return false;
    // fumaça bloqueia a visão dos bots: se o segmento cruza uma nuvem opaca, sem linha de visão.
    for (const s of this._smokes) {
      if (!s._opaque) continue;
      const ab = to.clone().sub(from);
      const t = Math.max(0, Math.min(1, s.center.clone().sub(from).dot(ab) / (ab.lengthSq() || 1)));
      if (from.clone().addScaledVector(ab, t).distanceToSquared(s.center) <= s.radius * s.radius) return false;
    }
    return true;
  }
  _botEye(b) { return new THREE.Vector3(b.pos.x, b.pos.y + BOT_EYE, b.pos.z); }
  _enemyOf(bot) { return this.combatants.filter(c => c.team !== bot.team && c.alive); }
  _updateBot(b, dt) {
    const g = b.mesh.group;
    if (!b.alive) {
      b.deadT += dt;
      if (b.mesh.isGLB) {
        b.mesh.ctrl.die();
        b.mesh.ctrl.update(dt, 0, false);
        if (b.deadT > 1.0) g.visible = false; // fall fast, then vanish (no lingering ragdoll)
      } else {
        g.rotation.x = Math.max(-Math.PI / 2, g.rotation.x - dt * 5);
        g.position.y = b.pos.y + Math.max(-0.6, 0 - b.deadT * 0.3);
      }
      if (this.time >= b.respawnAt && (this.state === 'live')) {
        const s = this.world.spawns[b.team][(Math.random() * 4) | 0];
        b.pos.set(s.x, 0, s.z); b.hp = 100; b.alive = true;
        b.protUntil = this.time + SPAWN_PROT;
        b.target = null; b.path = null; b.yaw = b.team === 'P' ? 0 : Math.PI;
        b.laneX = undefined; b.roamUntil = 0;   // re-sorteia a coluna A CADA VIDA -> rotas variam (não "sempre a mesma")
        b._banNodes = null; b._unreach = null; b._escapeUntil = 0; b._jukeAt = 0;   // limpa estado de rota/juke da vida anterior (G2-R6A)
        b._lp = { x: s.x, z: s.z };   // evita spike de velocidade (teleporte) no 1º frame
        g.rotation.set(0, b.yaw, 0); g.position.copy(b.pos); g.visible = true;
        if (b.mesh.isGLB) b.mesh.ctrl.revive();
      }
      return;
    }
    if (this.state !== 'live') {
      if (b.mesh.isGLB) b.mesh.ctrl.update(dt, 0, false);
      else poseCharacter(b.mesh.parts, 0, 0, this.time);
      return;
    }

    // spawn protection: pisca o modelo enquanto invulnerável
    if (this.time < b.protUntil) g.visible = Math.floor(this.time * 12) % 2 === 0;
    else if (!g.visible) g.visible = true;

    // --- think: target acquisition
    b.think -= dt;
    if (b.think <= 0) {
      b.think = 0.16;
      let best = null, bd = 1e9;
      for (const e of this._enemyOf(b)) {
        const d = b.pos.distanceTo(e.pos);
        // BOT_VIEW < map length: with 70m+ sight on the open esplanade both teams
        // acquired from spawn and the round became a stand-still snipe loop (100 dmg
        // bot-vs-bot = first hit kills) — nobody roamed. 45m forces bots to close
        // in through mid-map, so the varied roam routes actually play out.
        if (d < bd && d < BOT_VIEW) {
          const eye = this._botEye(b);
          const teye = e.isPlayer ? this.camera.position.clone() : this._botEye(e);
          if (this._losClear(eye, teye)) { best = e; bd = d; }
        }
      }
      if (best) {
        b._losLost = false; b._lostAt = 0;
        if (b.target !== best) { b.target = best; b.reactAt = this.time + (0.3 + Math.random() * 0.5) / (b.skill * 1.5); }
      } else if (b.target) {
        // G2-R6A: não derruba o alvo no 1º frame sem LOS — colunas (Havan) e ilhotas
        // (piscinão) quebram a visão por frações de segundo e o bot flapava
        // combate↔roam ("andando pro lado e pro outro", fwdFlips 62-80/min medido).
        // Grace de 1.2s mantendo o alvo (movimento contínuo); o TIRO é bloqueado
        // enquanto stale (sem wallhack — ver o gate _losLost no bloco de fogo).
        if (!b._lostAt) b._lostAt = this.time;
        b._losLost = true;
        if (this.time - b._lostAt > 1.2) { b.target = null; b._losLost = false; b._lostAt = 0; }
      }
    }

    // Lane/coluna do bot (sempre definida): usada tanto no roam quanto pela direção de
    // flanco no combate, pra o time ocupar os DOIS lados do mapa (não só a esquerda).
    if (b.laneX === undefined) {
      // Coluna ALEATÓRIA na largura jogável (x∈[-10.5,10.5]; Palácio/STF em ±22 ocupam de ±11.5
      // pra fora). Era determinística por ordinal (bot #0 SEMPRE a mesma coluna -> "sempre as
      // mesmas rotas, petista esquerda / bolsonarista direita"). Agora re-sorteada a cada vida
      // (ver respawn) -> cada partida/vida usa meio + os dois flancos de forma imprevisível.
      b.laneX = -10.5 + 21 * Math.random();
      b.roamSeed = (Math.random() * 3) | 0;   // varia a profundidade-alvo (deepZ) também
    }
    let moving = 0;
    if (b.target) {
      // --- combat
      const e = b.target;
      const dx = e.pos.x - b.pos.x, dz = e.pos.z - b.pos.z;
      const wantYaw = Math.atan2(dx, dz);
      let dy = wantYaw - b.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
      b.yaw += dy * Math.min(1, dt * 7);
      b.strafeT += dt;
      // Hold a comfortable range: advance if far, back off if close, plus a small
      // lateral juke. Moving mostly ALONG the facing (forward/back) makes the forward
      // walk clip read as walking, instead of the old pure sideways strafe that looked
      // like the bot was sliding/moonwalking across the map.
      const dist = Math.hypot(dx, dz);
      // #27: às vezes o bot PLANTA e mira (parado), em vez de sempre jogar de lado. A média/
      // longa distância (e mais ainda quem agacha) segura a posição por 1-3s — dá pra "ver o
      // bot parado mirando", como pedido, e não vira só um walk-strafe infinito.
      if (this.time > (b._holdDecide || 0)) {
        b._holdDecide = this.time + 1.2 + Math.random() * 1.5;
        b.holdUntil = (dist > 16 && Math.random() < (b.crouchBias ? 0.6 : 0.4)) ? this.time + 1.0 + Math.random() * 1.8 : 0;
      }
      const holding = this.time < (b.holdUntil || 0);
      // G2-R6A (dono: "bots ficam andando pro lado e pro outro"): o pêndulo senoidal
      // contínuo (approach ±0.55 @9s + strafe ±0.18 @5.7s) lia como metrônomo robótico —
      // avança/recua ±4.5m sem motivo. Agora são DECISÕES esparsas estilo jiggle-peek:
      // a cada 1.1-2.4s o bot escolhe segurar (45%), avançar/recuar ou um juke lateral
      // curto, e mantém a decisão — lê como intenção, não como zigzag.
      if (this.time > (b._jukeAt || 0)) {
        b._jukeAt = this.time + 1.1 + Math.random() * 1.3;
        const r = Math.random();
        b._adv = r < 0.45 ? 0 : (r < 0.75 ? 0.5 : -0.5);
        b._lat = Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? -0.4 : 0.4);
      }
      const approach = holding ? 0 : (dist > 20 ? 0 : dist < 8 ? -1 : (b._adv || 0));
      const strafe = holding ? 0 : (b._lat || 0);
      const fdx = Math.sin(b.yaw), fdz = Math.cos(b.yaw);   // forward (mesh facing)
      const rdx = Math.cos(b.yaw), rdz = -Math.sin(b.yaw);  // right
      const spd = BOT_SPEED * 0.55;
      b.pos.x += (fdx * approach + rdx * strafe) * spd * dt;
      b.pos.z += (fdz * approach + rdz * strafe) * spd * dt;
      // FLANCO/AVANÇO: sem isto, com o beeline no inimigo mais próximo TODOS convergiam pro
      // centro. Quando o alvo está LONGE (>20m) o bot avança pela SUA coluna (laneX) rumo à
      // profundidade do inimigo — cada bot empurra seu flanco/meio e os combates se espalham
      // pela largura. De perto, só um puxão suave pra coluna (deadzone 2m) que não atrapalha a mira.
      const off = b.laneX - b.pos.x;
      if (dist > 20) {
        const lz = Math.sign(dz) || 1, ln = Math.hypot(off, lz) || 1;
        b.pos.x += (off / ln) * BOT_SPEED * 0.85 * dt;
        b.pos.z += (lz / ln) * BOT_SPEED * 0.85 * dt;
        moving = 1;
      } else if (Math.abs(off) > 2) {
        b.pos.x += Math.sign(off) * BOT_SPEED * 0.5 * dt;
      }
      this._collide(b.pos, 0.38);
      moving = Math.max(moving, Math.min(1, Math.abs(approach) + Math.abs(strafe) + (Math.abs(off) > 2 ? 0.4 : 0)));
      // #23: bots jogam fumaça de vez em quando (cobrir avanço / quebrar linha de tiro).
      if (b.smokes === undefined) b.smokes = 2;
      if (b.smokes > 0 && this.time > (b._nextNade || 0) && dist > 16 && dist < 55 && Math.random() < dt * 0.12) {
        b.smokes--; b._nextNade = this.time + 10;
        const from = this._botEye(b);
        const tgt = e.isPlayer ? this.camera.position : this._botEye(e);
        const ndir = tgt.clone().sub(from); ndir.y += ndir.length() * 0.18;
        this._spawnGrenade(from, ndir.normalize(), 'smoke', b);
      }
      // fire (bloqueado enquanto o alvo está stale/sem LOS — ver aquisição: sem wallhack)
      if (this.time > b.reactAt && this.time > b.nextShotAt && Math.abs(dy) < 0.3 && !b._losLost) {
        b.nextShotAt = this.time + (2.1 + Math.random() * 1.4) / (b.skill * 1.5);
        b.revealedAt = this.time;
        const dist = Math.hypot(dx, dz);
        const eSpeed = e.isPlayer ? Math.hypot(e.vel.x, e.vel.z) : BOT_SPEED;
        const crouchBonus = dist > 25 ? 1.18 : 1;   // bot parado em posição = mais preciso
        let chance = (0.72 * b.skill - dist * 0.006 - eSpeed * 0.035) * 1.5 * crouchBonus;
        chance = Math.max(0.07, Math.min(0.92, chance));
        const hit = Math.random() < chance;
        const from = this._botEye(b);
        const teye = (e.isPlayer ? this.camera.position.clone() : this._botEye(e));
        const aim = teye.clone();
        if (!hit) {
          aim.x += (Math.random() - .5) * 2.2; aim.y += (Math.random() - .5) * 1.6; aim.z += (Math.random() - .5) * 2.2;
        }
        const dir = aim.sub(from).normalize();
        // tracer & world impact
        this.ray.set(from, dir); this.ray.far = 200;
        const hitsW = this.ray.intersectObjects(this.world.occluders, false)[0];
        let end = hitsW ? hitsW.point : from.clone().add(dir.clone().multiplyScalar(120));
        if (hit) {
          end = teye;
          const dmg = e.isPlayer ? 63 : 100;   // 1.5x dano
          this._damage(e, dmg, b, (WEAPONS[b.weapon] && WEAPONS[b.weapon].short) || 'AWP');   // arma real do bot no killfeed
        } else if (hitsW && Math.random() < 0.5) this._puff(hitsW.point, hitsW.face ? hitsW.face.normal : null);
        // whizz: quase-acerto no JOGADOR = projétil passando do ouvido (mix por distância)
        if (!hit && e.isPlayer) {
          const toEar = this.camera.position.clone().sub(from);
          const along = toEar.dot(dir);
          if (along > 0) { const perpSq = toEar.lengthSq() - along * along; if (perpSq > 0 && perpSq < 9) this.sfx.whizz(Math.sqrt(perpSq)); }
        }
        this._tracer(from.clone().add(dir.clone().multiplyScalar(0.7)), end);
        this._flash(from.clone().add(dir.clone().multiplyScalar(0.85)), dir);
        // som da arma REAL do bot com MIX POR DISTÂNCIA no synth (perto=crack, longe=boom)
        // + PAN ESTÉREO pela direção relativa à câmera (mesma conta do damage indicator)
        // + delay de propagação (dist/343, estilo CoD) — só em bots; player segue central.
        const _sd = Math.hypot(b.pos.x - this.player.pos.x, b.pos.z - this.player.pos.z);
        const _rel = Math.atan2(b.pos.x - this.player.pos.x, b.pos.z - this.player.pos.z) - this.player.yaw;
        const _pan = Math.max(-0.85, Math.min(0.85, Math.sin(_rel) * 0.8));
        this.sfx.shotWeapon(b.weapon, _sd, 1, _pan, Math.min(0.25, _sd / 343));
        if (b.mesh.isGLB) b.mesh.ctrl.shoot();
      }
    } else if (this.ctf) {
      // --- CTF: procurar e segurar um ponto capturável (o combate acima ainda tem prioridade)
      this._botCtf(b, dt);
      moving = b._ctfMoving || 0;
    } else {
      // --- roam toward enemy half
      if (!b.path || this.time > b.repathAt) {
        b.repathAt = this.time + 2.5;
        const W = this.world;
        // G2-R6A: o `from` = nearestWaypoint podia estar ATRÁS de uma parede (nó (-8.4,34)
        // do piscinão fica do outro lado do muro das ilhotas) — o bot nunca alcançava
        // path[0] e ficava serrilhando a quina do muro ("andando pro lado e pro outro",
        // latFlips 68-94/min medido). Agora escolhe o nó mais próximo FISICAMENTE
        // ALCANÇÁVEL: simula a caminhada reta com _collide (a mesma física do bot).
        let from = W.nearestWaypoint(b.pos.x, b.pos.z);
        let pocket = false;
        if (!this._walkReach(b, W.waypoints.nodes[from])) {
          let found = -1;
          const cands = W.waypoints.nodes
            .map((n, i) => ({ i, d: (n.x - b.pos.x) ** 2 + (n.z - b.pos.z) ** 2 }))
            .sort((a, c) => a.d - c.d);
          for (let k = 0; k < Math.min(6, cands.length); k++) if (this._walkReach(b, W.waypoints.nodes[cands[k].i])) { found = cands[k].i; break; }
          if (found >= 0) from = found;
          else {
            // BOLSO sem nó alcançável: caminhada de escape ~1s numa direção livre (sai da
            // quina seguindo a parede) e tenta de novo no próximo repick de rota.
            b._escapeUntil = this.time + 1.0;
            b._escapeYaw = Math.random() * Math.PI * 2;
            b.path = null; b.repathAt = this.time + 1.0;
            pocket = true;
          }
        }
        if (!pocket && (this.time > (b.roamUntil || 0) || b.roamIdx === undefined)) {
          // Enemy direction derived from the spawn LAYOUT (not hardcoded — the spawn
          // swap P<->B would otherwise silently flip the roam side and keep bots home).
          const sP = this.world.spawns.P[0], sB = this.world.spawns.B[0];
          const enemyDir = sB && sP ? Math.sign(sB.z - sP.z) || 1 : 1;
          const sign = b.team === 'P' ? enemyDir : -enemyDir;
          // Lane DETERMINÍSTICA por ordinal no time: o ônibus central + a cobertura à
          // esquerda funilavam TODOS pra esquerda (medido: L61/C35/R3) mesmo com alvo à
          // direita. Agora cada bot recebe uma coluna x fixa e espalhada por toda a largura,
          // e o alvo é o nó da metade inimiga mais perto de (laneX, z-profundo) — força a
          // ocupar esquerda/centro/direita e evita o "andam em bando".
          if (b.laneX === undefined) {
            const mates = this.bots.filter(o => o.team === b.team);
            const ord = mates.indexOf(b), n = Math.max(1, mates.length);
            b.laneX = -18 + 36 * (n === 1 ? 0.5 : ord / (n - 1)) + (Math.random() * 4 - 2);
            b.roamSeed = this.bots.indexOf(b);
          }
          // z-alvo: fundo da metade inimiga, alternando profundidade por bot E POR DESTINO
          // (anti-milling G2-R6A: chegando ao fundo, o mesmo nó era re-alvejado pra sempre
          // com o jitter ±4 flipando entre 2 vizinhos — "andando pro lado e pro outro").
          b._roamN = (b._roamN || 0) + 1;
          const deepZ = sign * (22 + ((b.roamSeed + b._roamN) % 3) * 16);
          if (b._unreach && b._unreach.size > 12) b._unreach.clear();   // não esgota o mapa
          let best = -1, bd = 1e9, bestAny = -1, bdAny = 1e9;
          const nodes = W.waypoints.nodes;
          for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            if (n.z * sign <= 4 * sign) continue;            // só metade inimiga
            if (b._unreach && b._unreach.has(i)) continue;   // inalcançável conhecido (grafo desconexo)
            const d = Math.abs(n.x - b.laneX) * 2.2 + Math.abs(n.z - deepZ) + Math.random() * 4;
            if (d < bdAny) { bdAny = d; bestAny = i; }
            // não re-alveja nó colado ao bot (≤7m): senão ele "chega" na hora e o jitter
            // flipa o alvo entre vizinhos — o milling A→B→A medido no piscinão.
            if (Math.hypot(n.x - b.pos.x, n.z - b.pos.z) < 7) continue;
            if (d < bd) { bd = d; best = i; }
          }
          b.roamIdx = best >= 0 ? best : bestAny >= 0 ? bestAny : from; b.roamUntil = this.time + 12;
        }
        if (!pocket) {
          b.path = this._findPathLocal(W, from, b.roamIdx, b._banNodes); b.pathIdx = 1;
          // Alvo INALCANÇÁVEL (findPath devolve [from] — ilhas do grafo desconexo, ex.: as
          // ilhotas do piscinão): antes o bot "seguia" o próprio nó mais próximo e ficava
          // orbitando/oscilando no lugar. Marca e re-alveja outro nó no próximo repick.
          if (b.path.length <= 1 && from !== b.roamIdx) {
            (b._unreach || (b._unreach = new Set())).add(b.roamIdx);
            b.roamUntil = 0;
          }
        }
      }
      if (this.time < (b._escapeUntil || 0)) {
        // Caminhada de escape de BOLSO (nenhum waypoint alcançável — ver repath acima):
        // anda ~1s na direção livre sorteada, deslizando pela parede (_collide) até uma
        // posição com rota. Sem isso o bot serrilhava a quina do muro pra sempre.
        let edy = b._escapeYaw - b.yaw;
        while (edy > Math.PI) edy -= Math.PI * 2; while (edy < -Math.PI) edy += Math.PI * 2;
        b.yaw += edy * Math.min(1, dt * 6);
        b.pos.x += Math.sin(b.yaw) * BOT_SPEED * 0.8 * dt;
        b.pos.z += Math.cos(b.yaw) * BOT_SPEED * 0.8 * dt;
        this._collide(b.pos, 0.38);
        moving = 1;
      } else if (b.path) {
      // Avança o índice ao CHEGAR no nó atual (raio 1.5 — 0.7 era pequeno demais: com o
      // repath de 2.5s que reseta pathIdx=1, a ~1.65 m/s o bot não alcançava path[1] (~4.4m)
      // dentro da janela, então pathIdx NUNCA passava de 1 e ele serrilhava o 1º nó perto do
      // spawn). O while permite pular vários nós já ultrapassados. E MIRA ~2 nós à frente
      // (look-ahead) pra cortar a serrilha do grid e cruzar RETO — dobra a velocidade líquida
      // rumo ao inimigo (medido: net 1.65 -> ~3.3 m/s), fazendo os dois times chegarem ao meio.
      const _wp = this.world.waypoints.nodes;
      let _guard = 0;
      while (b.pathIdx < b.path.length - 1 && _guard++ < 8) {
        const c = _wp[b.path[b.pathIdx]];
        if (c && Math.hypot(c.x - b.pos.x, c.z - b.pos.z) < 1.5) b.pathIdx++; else break;
      }
      if (b.pathIdx >= b.path.length - 1) {
        const last = _wp[b.path[b.path.length - 1]];
        if (last && Math.hypot(last.x - b.pos.x, last.z - b.pos.z) < 1.2) b.roamUntil = 0;
      }
      // MIRA no nó atual do path (não +2): com o A* reto, seguir o path fielmente contorna os
      // obstáculos. O look-ahead +2 cortava a quina PRA DENTRO do obstáculo -> o bot batia e
      // oscilava fwd/back sem desviar. Agora ele acompanha a curva do path ao redor da geometria.
      const node = b.path ? _wp[b.path[Math.min(b.pathIdx, b.path.length - 1)]] : null;
      if (node && !this._walkReach(b, node)) {
        // Hop fisicamente intransitável (aresta que passou no segClear do mapa mas não
        // cabe o bot r=0.38 — ex.: quina do muro das ilhotas): bane o nó e rerroteia.
        (b._banNodes || (b._banNodes = new Set())).add(b.path[Math.min(b.pathIdx, b.path.length - 1)]);
        if (b._banNodes.size > 24) b._banNodes.clear();
        b.repathAt = 0; b.path = null;
      } else if (node) {
        const dx = node.x - b.pos.x, dz = node.z - b.pos.z;
        {
          const wantYaw = Math.atan2(dx, dz);
          let dy = wantYaw - b.yaw;
          while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
          b.yaw += dy * Math.min(1, dt * 12);
          const bSlow = this.world.slowAt && this.world.slowAt(b.pos.x, b.pos.z) ? 0.5 : 1;  // bots também vadear
          const px = b.pos.x, pz = b.pos.z;
          b.pos.x += Math.sin(b.yaw) * BOT_SPEED * bSlow * dt;
          b.pos.z += Math.cos(b.yaw) * BOT_SPEED * bSlow * dt;
          this._collide(b.pos, 0.38);
          moving = 1;
          // stuck detection: barely moved (blocked by geometry) -> sidestep + pick a new
          // target so bots don't grind against a box or all funnel to the same spot.
          const moved = Math.hypot(b.pos.x - px, b.pos.z - pz);
          if (moved < BOT_SPEED * bSlow * dt * 0.35) {
            b._stuckT = (b._stuckT || 0) + dt;
            if (b._stuckT > 0.5) {
              // NÃO re-escolhe o alvo (isso causava milling perto do spawn). Mantém o objetivo
              // longe e só REROTA + passo lateral p/ destravar. G2-R6A: o passo era ±0.5 em
              // X-MUNDO ALEATÓRIO a cada 0.5s — jitter esquerda-direita contínuo (latFlips
              // 68-85/min no piscinão). Agora: lateral relativo ao bot, lado FIXO no episódio
              // (só flipa após 3 destravos sem sair) — contorna o obstáculo em vez de serrilhar.
              b.repathAt = 0; b.path = null; b._stuckT = 0;
              if (!b._stuckSide) { b._stuckSide = Math.random() < 0.5 ? -1 : 1; b._stuckFlips = 0; }
              if ((b._stuckFlips = (b._stuckFlips || 0) + 1) > 3) { b._stuckSide = -b._stuckSide; b._stuckFlips = 0; }
              b.pos.x += Math.cos(b.yaw) * b._stuckSide * 0.5;
              b.pos.z += -Math.sin(b.yaw) * b._stuckSide * 0.5;
              this._collide(b.pos, 0.38);
            }
          } else { b._stuckT = 0; b._stuckSide = 0; }
        }
      }
      }
    }
    this._botSeparation(b, dt);   // empurra pra longe de colegas próximos -> não andam em fila colados
    b.pos.y = this.world.groundHeightAt(b.pos.x, b.pos.z);
    g.position.copy(b.pos);
    g.rotation.set(0, b.yaw, 0);
    if (b.mesh.isGLB) {
      b.mesh.ctrl.setCrouch(!!b.target && b.crouchBias);
      // "olhar pra baixo": os clipes de rifle-hold assam ~13° de inclinação da cabeça
      // pra baixo. Passa o pitch vertical olho→olho do alvo (clamp ±15°) pro controller
      // fechar o loop no osso da cabeça; sem alvo, 0 = olhar na horizontal pra onde anda.
      {
        const e = b.target;
        let aim = 0;
        if (e) {
          const teyeY = e.isPlayer ? this.camera.position.y : e.pos.y + BOT_EYE;
          const hd = Math.hypot(e.pos.x - b.pos.x, e.pos.z - b.pos.z) || 1;
          aim = Math.max(-BOT_AIM_PITCH, Math.min(BOT_AIM_PITCH, Math.atan2(teyeY - (b.pos.y + BOT_EYE), hd)));
        }
        b.mesh.ctrl.aimPitch = aim;
      }
      // (removido) "hop" cosmético ao vagar: tocava o CLIP de pulo sem pulo físico real
      // (b.pos.y não muda), então o bot deslizava no chão com as pernas encolhidas — parte do
      // bug "andam deslizando sem mexer as pernas". Sem valor suficiente pra manter o artefato.
      // true ground speed (accounts for collisions / wading / being stuck) drives the
      // leg-cycle rate so the feet plant instead of sliding. The FORWARD-signed component
      // tells the controller when the bot is retreating, so it plays the walk clip in
      // reverse (backpedal) instead of moonwalking forward while moving backward.
      if (b._lp) {
        const dtSafe = Math.max(dt, 1e-3);
        const mx = b.pos.x - b._lp.x, mz = b.pos.z - b._lp.z;
        const spd = Math.hypot(mx, mz) / dtSafe;
        const fwd = (mx * Math.sin(b.yaw) + mz * Math.cos(b.yaw)) / dtSafe;
        b._lp = { x: b.pos.x, z: b.pos.z };
        // Pernas dirigidas pela VELOCIDADE REAL (spd), NÃO pela flag `moving`. Bug do deslize:
        // vários branches (CTF, empurrão de colisão, nudge de destravamento, avanço por lane)
        // moviam o bot sem setar `moving`, então `spd<0.35?0:moving` dava 0 e o char ficava em
        // idle/shoot (pernas estáticas) deslizando. Atrelar ao spd faz as pernas ciclarem SEMPRE
        // que o corpo transladar (>0.35 m/s), inclusive atirando em movimento (walkfire).
        const mv = spd < 0.35 ? 0 : 1;
        b.mesh.ctrl.update(dt, mv, !!b.target, spd, fwd < -0.25);
      } else {
        b._lp = { x: b.pos.x, z: b.pos.z };
        b.mesh.ctrl.update(dt, moving, !!b.target, 0, false);
      }
    } else {
      b.phase += dt * (moving ? 9 : 0);
      poseCharacter(b.mesh.parts, b.phase, moving, this.time);
    }
  }

  /* ================= radar (CS-style) ================= */
  _updateRadar() {
    const x = this.radarCtx;
    if (!x) return;
    const S = 150, H = S / 2, sc = 1.42, R = H - 3;
    x.clearRect(0, 0, S, S);
    // fundo: disco escuro radial (referência CS2/Valorant) — opaco o bastante pra
    // a geometria ciano ler bem mesmo com céu claro atrás
    const bg = x.createRadialGradient(H, H, 8, H, H, R);
    bg.addColorStop(0, 'rgba(4,8,10,0.78)');
    bg.addColorStop(1, 'rgba(0,0,0,0.62)');
    x.fillStyle = bg;
    x.beginPath(); x.arc(H, H, R, 0, 7); x.fill();
    x.save();
    x.beginPath(); x.arc(H, H, R, 0, 7); x.clip();
    // geometria do mapa: linha fina ciano apagado (norte fixo: mundo X→tela X, Z→tela Y)
    x.strokeStyle = 'rgba(120,220,220,0.5)'; x.lineWidth = 1;
    x.strokeRect(H - 26 * sc, H - 46 * sc, 52 * sc, 92 * sc);
    x.strokeStyle = 'rgba(120,220,220,0.22)';
    x.beginPath(); x.moveTo(H - 26 * sc, H); x.lineTo(H + 26 * sc, H); x.stroke();
    // grade de referência bem sutil
    x.strokeStyle = 'rgba(120,220,220,0.12)';
    x.beginPath();
    x.moveTo(H, H - R); x.lineTo(H, H + R);
    x.moveTo(H - R, H); x.lineTo(H + R, H);
    x.stroke();
    // cone de visão do jogador (FOV real da câmera, com falloff radial)
    const px = H + this.player.pos.x * sc, pz = H + this.player.pos.z * sc;
    const fov = (this.camera.fov || 75) * Math.PI / 180;
    x.save();
    x.translate(px, pz); x.rotate(-this.player.yaw);
    const grad = x.createRadialGradient(0, 0, 3, 0, 0, 62);
    grad.addColorStop(0, 'rgba(140,230,230,0.30)');
    grad.addColorStop(1, 'rgba(140,230,230,0)');
    x.fillStyle = grad;
    x.beginPath(); x.moveTo(0, 0);
    x.arc(0, 0, 62, -Math.PI / 2 - fov / 2, -Math.PI / 2 + fov / 2);
    x.closePath(); x.fill();
    // player arrow (rotates with view)
    x.fillStyle = '#fff';
    x.beginPath(); x.moveTo(0, -5); x.lineTo(4, 4); x.lineTo(-4, 4); x.closePath(); x.fill();
    x.restore();
    // blips saturados com leve glow
    x.shadowBlur = 5;
    for (const c of this.combatants) {
      if (!c.alive || c.isPlayer) continue;
      const ally = c.team === this.playerTeam;
      if (!ally && this.time - c.revealedAt > 1.6) continue;
      const col = ally ? this._teamColor(c.team) : '#ffd23f';
      x.fillStyle = col; x.shadowColor = col;
      x.fillRect(H + c.pos.x * sc - 2, H + c.pos.z * sc - 2, 4, 4);
    }
    x.shadowBlur = 0;
    x.restore();
    // anel de borda duplo + ticks cardinais (norte fixo)
    x.strokeStyle = 'rgba(120,220,220,0.45)'; x.lineWidth = 1.5;
    x.beginPath(); x.arc(H, H, R + 1, 0, 7); x.stroke();
    x.strokeStyle = 'rgba(120,220,220,0.14)'; x.lineWidth = 1;
    x.beginPath(); x.arc(H, H, R - 5, 0, 7); x.stroke();
    x.font = "700 9px Rajdhani, sans-serif"; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = 'rgba(190,240,240,0.95)';
    x.fillText('N', H, 9);
    x.fillStyle = 'rgba(120,220,220,0.55)';
    x.fillText('E', S - 9, H); x.fillText('S', H, S - 9); x.fillText('W', 9, H);
  }

  /* ================= HUD ================= */
  _banner(title, sub) {
    const b = this.el.banner;
    this.el.bannerTitle.textContent = title;
    this.el.bannerSub.textContent = sub;
    b.classList.remove('hidden', 'show');
    void b.offsetWidth;   // reinicia a animação de entrada (slide/scale + letter-spacing settle)
    b.classList.add('show');
    clearTimeout(this._bannerT);
    this._bannerT = setTimeout(() => b.classList.remove('show'), 2600);
    clearTimeout(this._bannerT2);
    this._bannerT2 = setTimeout(() => b.classList.add('hidden'), 3000);   // espera o fade-out
  }
  _showScoreboard(v) {
    if (v) {
      // cabeçalho com placar do round em destaque (chips por time)
      document.querySelector('#scoreboard h3').innerHTML =
        `<span class="sb-label">PLACAR · ROUND ${this.roundNum}</span>` +
        `<span class="sb-score"><b class="tp">${this._teamTag('P')} ${this.roundsWon.P}</b>` +
        `<i>×</i><b class="tb">${this.roundsWon.B} ${this._teamTag('B')}</b></span>`;
      const capH = document.getElementById('sb-cap-h');
      if (capH) capH.classList.toggle('hidden', !this.ctf);
      // no CTF ordena por capturas (depois kills); senão por kills
      const rank = this.ctf ? (a, b) => (b.captures || 0) - (a.captures || 0) || b.kills - a.kills : (a, b) => b.kills - a.kills;
      const rows = [...this.combatants].sort(rank).map(c =>
        `<tr class="${c.team === 'P' ? 'tp' : 'tb'}${c.isPlayer ? ' me' : ''}">
          <td>${c.name}${c.isPlayer ? ' ★' : ''}</td><td>${c.def.name}</td>
          <td>${c.kills}</td><td>${c.deaths}</td>${this.ctf ? `<td>${c.captures || 0}</td>` : ''}</tr>`).join('');
      this.el.sbBody.innerHTML = rows;
    }
    this.el.scoreboard.classList.toggle('hidden', !v);
  }
  _updateHud() {
    const p = this.player;
    this.el.hpNum.textContent = Math.max(0, Math.ceil(p.hp));
    this.el.hpFill.style.width = Math.max(0, p.hp) + '%';
    this.el.hpFill.classList.toggle('low', p.hp <= 35);
    this.el.hpNum.classList.toggle('low', p.hp <= 35);
    if (p.weapon === 'knife') {
      this.el.ammoMag.textContent = '—'; this.el.ammoRes.textContent = '';
    } else {
      const a = p.ammo[p.weapon];
      this.el.ammoMag.textContent = a.mag;
      this.el.ammoRes.textContent = a.res;
      this.el.ammoMag.classList.toggle('empty', a.mag === 0);
    }
    if (this.ctf) {
      this.el.roundTime.textContent = '∞';   // CTF: round sem tempo
    } else {
      const total = Math.max(0, Math.ceil(this.timeLeft));
      this.el.roundTime.textContent = `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
    }
    // linha secundária única sob o timer: rodada + placar de rounds por time
    this.el.roundsRow.textContent =
      `RODADA ${this.roundNum} · ${this._teamTag('P')} ${this.roundsWon.P} × ${this.roundsWon.B} ${this._teamTag('B')}`;
    this.el.scoreP.innerHTML = `${this._teamTag('P')} <b>${this.roundKills.P}</b>`;
    this.el.scoreB.innerHTML = `${this._teamTag('B')} <b>${this.roundKills.B}</b>`;
    this.el.scoreP.style.color = this._teamColor('P');   // lado do jogador Tribos fica AZUL
    this.el.scoreB.style.color = this._teamColor('B');
    // badge de spawn protection (issue #24)
    const protLeft = p.protUntil - this.time;
    this.el.prot.classList.toggle('hidden', !(p.alive && protLeft > 0));
    if (protLeft > 0) this.el.protCount.textContent = Math.ceil(protLeft);
  }

  /* ================= main update ================= */
  update(dt) {
    if (this.paused) return;
    this.time += dt;
    if (this.state === 'countdown' && this.time >= this.stateUntil) {
      this.state = 'live';
      this._banner('VALENDO!', 'A treta está liberada');
    } else if (this.state === 'live') {
      if (this.ctf) this._updateCTF(dt);
      else { this.timeLeft -= dt; if (this.timeLeft <= 0) this._endRound(); }
    } else if (this.state === 'roundEnd' && this.time >= this.stateUntil) {
      if (!this.ctf && (this.roundsWon.P >= ROUNDS_TO_WIN || this.roundsWon.B >= ROUNDS_TO_WIN)) this._endMatch();
      else this._startRound();   // CTF: sempre recomeça (endless)
    }
    this._updatePlayer(dt);
    for (const b of this.bots) this._updateBot(b, dt);
    this._updatePickups();
    this._updateFx(dt);
    this._updateDoors(dt);
    this._updateGrenades(dt);
    this._updateHud();
    this._updateRadar();
    // hint de pointer lock: visível só quando o jogo está ativo mas sem lock
    if (this.el.lockHint)
      this.el.lockHint.classList.toggle('hidden',
        this.testMode || this.paused || !!document.pointerLockElement ||
        (this.state !== 'live' && this.state !== 'countdown'));
    this.renderer.render(this.scene, this.camera);
    // VM overlay SEM pós (quality low / ?bloom=0): o composer não existe, então desenha
    // a vmScene por cima do mundo aqui (com pós, o RenderPass do bloom.js já faz isso).
    if (!this.renderer.__postPatched && this.vmScene) {
      const r = this.renderer;
      r.autoClear = false; r.clearDepth();
      r.render(this.vmScene, this.vmCamera);
      r.autoClear = true;
    }
    this._tickDolly(dt);
  }

  /* ================= teardown ================= */
  dispose() {
    this._disposed = true;   // lazy-load de VM em voo (_ensureStaticVm) aborta no then
    if (this._envRT) { this._envRT.dispose(); this._envRT = null; this.scene.environment = null; }   // libera o env map (IBL)
    document.removeEventListener('keydown', this._kd);
    document.removeEventListener('keyup', this._ku);
    document.removeEventListener('mousedown', this._md);
    document.removeEventListener('mouseup', this._mu);
    document.removeEventListener('mousemove', this._mm);
    document.removeEventListener('contextmenu', this._cc);
    document.removeEventListener('pointerlockchange', this._plc);
    window.removeEventListener('blur', this._blur);
    this.el.hud.classList.add('hidden');
    this.el.pause.classList.add('hidden');
    this.el.matchEnd.classList.add('hidden');
    this.el.killfeed.innerHTML = '';
    this.el.radioLog.innerHTML = '';
    this.el.radioMenu.classList.add('hidden');
    this.el.mkBanner.classList.remove('show');
    this.el.scope.classList.remove('on');
    this.el.respawn.classList.add('hidden');
    this.el.reloadNote.classList.add('hidden');
    this.el.banner.classList.add('hidden');
    this.el.lockHint.classList.add('hidden');
    this.el.scoreboard.classList.add('hidden');
    this.el.vignette.style.opacity = 0;
    if (this._dolly) { this._dolly.renderer.dispose(); this._dolly.canvas.remove(); this._dolly = null; }
    this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    this.scene.clear();
  }
}
