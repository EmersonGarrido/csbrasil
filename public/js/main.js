// Boot, menus, settings, logo, main loop.
import * as THREE from 'three';
import { initTextures } from './textures.js';
import { CHARACTERS, buildCharacter, charWeapon } from './characters.js';
import { preloadCharacterAssets, buildCharacterModel, hasModel, GLB_CHARS } from './glbchars.js';
import { preloadFPArms, preloadStaticVm } from './fparms.js';
import { preloadMapProps } from './mapprops.js';
import { MAPS, MAP_IDS, DEFAULT_MAP, resolveMapId } from './maps.js';
import { setHavanCarSeed } from './map_havan.js';
import { Sfx } from './audio.js';
import { Game, vmPreloadClasses } from './game.js';
import { VERSION } from './version.js';
import { enableLightBloom } from './bloom.js';
import { enableStylize } from './stylize.js';

/* ---------------- settings & nickname ---------------- */
const SETTINGS_KEY = 'awpbr_settings';
const settings = Object.assign({ sens: 1, vol: 0.7, quality: 'med', speech: true, map: DEFAULT_MAP, wpnMode: 'all', bots: 4, difficulty: 'normal' },
  JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'));
const saveSettings = () => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
const NICK_KEY = 'awpbr_nick';
const SOCIAL_KEY = 'awpbr_social';

/* ---------------- renderer ---------------- */
// Import extra (top-level, legal em ESM) em vez de mexer no bloco de imports lá de cima:
// o tom do caminho SEM pós mora no bloom.js, que é o dono da tabela de exposição/piso por mapa.
import { applyNoPostTone } from './bloom.js';
const container = document.getElementById('game-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// Tonemap. Com o composer ligado three já força NoToneMapping nos materiais (só aplica
// tonemap quando o alvo é null) e quem faz a curva é o AgX do bloom.js — deixamos
// NoToneMapping EXPLÍCITO nesse caso pra não haver a menor chance de tonemap duplo.
// Estes dois valores são só o ESTADO INICIAL: quem manda no caminho sem pós é o
// applyNoPostTone() logo abaixo. Ver o bloco de comentário dele no bloom.js.
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
container.appendChild(renderer.domElement);
// bloom leve (FASE 4) — ligado por padrão, pulado na qualidade 'low' ou com ?bloom=0
// (escape hatch p/ GPUs/extensões que derrubam a aba — suspeita do "jogo fechar sozinho")
{
  const _qp = new URLSearchParams(location.search);
  const _bloomOn = settings.quality !== 'low' && _qp.get('bloom') !== '0';
  // pipeline estilizado (cel+contorno) atrás de ?style=1 — prova de conceito reversível.
  if (_qp.get('style') === '1') enableStylize(renderer, { bloom: _bloomOn, quality: settings.quality });
  else if (_bloomOn) {
    enableLightBloom(renderer, { quality: settings.quality });
    if (_qp.get('post') !== 'output') renderer.toneMapping = THREE.NoToneMapping;   // AgX manda
  } else {
    // 'low' / ?bloom=0: MESMA exposição por mapa e MESMO piso de ambiente do composite,
    // aplicados dentro do material (zero passe fullscreen). Sem isso 'low' era outro jogo:
    // ~1 stop mais escuro e com curva de tom diferente (ACES crusha a sombra que o piso do
    // AgX segura). Kill-switch: ?lowtone=0 volta pro ACES puro.
    applyNoPostTone(renderer);
  }
}

const textures = initTextures();
const sfx = new Sfx(); sfx.vol = settings.vol;
sfx.speechEnabled = settings.speech !== false;
sfx.reverbOn = new URLSearchParams(location.search).get('reverb') === '1';   // reverb leve opt-in (default off)
// sidechain da música do menu: cliques/SFX abaixam a trilha por ~150-250ms e ela volta suave
sfx.onDuck = (amt, hold) => {
  const m = menuMusic;
  if (!m || m.paused || m.muted || musicFade) return;
  m.volume = MENU_MUSIC_VOL * amt;
  setTimeout(() => { if (menuMusic && !musicFade && !menuMusic.paused) menuMusic.volume = MENU_MUSIC_VOL; }, hold * 1000 + 220);
};
const sfxReady = sfx.loadManifest();

/* ---------------- selected map ---------------- */
const urlMap = new URLSearchParams(location.search).get('map');
let currentMap = resolveMapId(urlMap || settings.map);
settings.map = currentMap;

/* ---------------- menu backdrop (orbiting map) ---------------- */
// Mint building/statue GLBs used by the Brasília map (loaded once, cloned per placement).
const MAP_PROPS = ['congresso', 'catedral', 'ministerio', 'palacio', 'justica', 'tires', 'stall', 'tent', 'bus', 'drinkstand', 'urna', 'towner',
  'quiosque', 'skate_ramp', 'lifeguard_tower', 'guarda_sol', 'arquibancada',
  'churrasqueira', 'mesa_guardasol', 'cooler', 'boia', 'placa_piscina', 'caixa_som'];   // props do Piscinão de Ramos (Mint); carros/estátua do Havan carregam por-mapa   // Havan (estátua + carros + carrinho)
let menuScene = new THREE.Scene();
MAPS[currentMap].build(menuScene, textures);
const menuCam = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400);
/* ---------------- loading real (barra via LoadingManager compartilhado) ---------------- */
// GLTFLoader sem manager cai no THREE.DefaultLoadingManager — TODOS os GLBs (personagens,
// props de mapa, braços FP, viewmodel) passam por ele. Cada fase faz snapshot do acumulado
// (l0) e mede (loaded-l0)/(total-l0) → barra de progresso REAL, não spinner fake.
const _lstat = { loaded: 0, total: 0, phase: null };
THREE.DefaultLoadingManager.onProgress = (url, l, t) => {
  _lstat.loaded = l; _lstat.total = t;
  const ph = _lstat.phase;
  if (ph) ph.set(Math.min(0.99, (l - ph.l0) / Math.max(1, t - ph.l0)));
};
function _mkPhase(fillEl, pctEl) {
  const ph = { l0: _lstat.loaded, set(p) { fillEl.style.width = (p * 100).toFixed(0) + '%'; pctEl.textContent = Math.round(p * 100) + '%'; } };
  _lstat.phase = ph; ph.set(0); return ph;
}
// fase de boot: props do cenário 3D do menu (carrega por baixo da splash)
const _bootPhase = _mkPhase(document.getElementById('boot-bar-fill'), document.getElementById('boot-pct'));
let _splashReady = false;
function _splashSetReady() {
  if (_splashReady) return; _splashReady = true;
  _bootPhase.set(1);
  if (_lstat.phase === _bootPhase) _lstat.phase = null;
  // G2-R10: o failsafe de 20s dispara DEPOIS da splash sair do DOM (debug/?auto= e
  // fluxos rápidos) — sem guarda, crashava "textContent null" (banner vermelho).
  const bs = document.getElementById('boot-status'), se = document.getElementById('splash-enter');
  if (bs) bs.textContent = 'ARENA PRONTA';
  if (se) se.classList.remove('hidden');
}
setTimeout(_splashSetReady, 20000);   // failsafe: nunca prende o jogador na splash
// overlay de loading de partida/personagens (cobre a cena montando — sem "minecraft")
const _lo = {
  box: document.getElementById('load-overlay'), fill: document.getElementById('load-bar-fill'),
  pct: document.getElementById('load-pct'), label: document.getElementById('load-label'), status: document.getElementById('load-status'),
};
function showLoading(label, status = 'CARREGANDO MODELOS 3D…') {
  _lo.label.textContent = label; _lo.status.textContent = status;
  _lo.box.classList.remove('hidden');
  _mkPhase(_lo.fill, _lo.pct);
}
function hideLoading() { _lstat.phase = null; _lo.box.classList.add('hidden'); }
function rebuildMenuBackdrop() {
  menuScene = new THREE.Scene();
  MAPS[currentMap].build(menuScene, textures);
}
// The first backdrop is built before props load; rebuild once they're ready so the
// menu shows the real Brasília landmarks too. Só então a splash libera a entrada.
preloadMapProps(MAP_PROPS).then(() => { rebuildMenuBackdrop(); _splashSetReady(); }).catch(() => _splashSetReady());

/* ---------------- screens ---------------- */
const screens = ['mobile-warning', 'main-menu', 'team-select', 'char-select', 'settings-panel', 'howto-panel', 'ranking-panel', 'pause-menu', 'match-end'];
function show(id) {
  for (const s of screens) document.getElementById(s).classList.toggle('hidden', s !== id);
  if (!id) for (const s of screens) document.getElementById(s).classList.add('hidden');
  // ao navegar pra qualquer tela, fecha o painel de setup do menu CS (não fica aberto after)
  if (id !== 'main-menu') { const ms = document.getElementById('menu-setup'); if (ms) ms.classList.remove('open'); }
  else { applyHomeWall(); if (musicArmed) startMenuMusic(); }   // volta pra home: wallpaper + música de menu
}
const $ = id => document.getElementById(id);

// Wallpapers rotativos (wall-1..8): 1 por tela no fluxo home→setup→lado→personagem, sem
// repetir; o offset rotaciona a cada acesso (localStorage) pra variar entre visitas.
const WALLS = ['/img/wall-1.png', '/img/wall-2.png', '/img/wall-3.png', '/img/wall-4.png',
  '/img/wall-5.png', '/img/wall-6.png', '/img/wall-7.png', '/img/wall-8.png'];
let _wallK = 0;
try { _wallK = (parseInt(localStorage.getItem('cs_wallK') || '-1', 10) + 1) % WALLS.length; localStorage.setItem('cs_wallK', String(_wallK)); } catch {}
const wallUrl = (i) => `url('${WALLS[(_wallK + i) % WALLS.length]}')`;
const HOME_WALL = wallUrl(0), SETUP_WALL = wallUrl(1), TEAM_WALL = wallUrl(2), CHAR_WALL = wallUrl(3);
function applyHomeWall() { const w = document.querySelector('#main-menu .cs-wallpaper'); if (w) w.style.backgroundImage = HOME_WALL; }
function applySetupWall() { const w = document.querySelector('#main-menu .cs-wallpaper'); if (w) w.style.backgroundImage = SETUP_WALL; }
applyHomeWall();
{ const t = $('team-select'); if (t) t.style.setProperty('--wall', TEAM_WALL); }
{ const c = $('char-select'); if (c) c.style.setProperty('--wall', CHAR_WALL); }

// Música de menu (loop, volume baixo). Toca só nas telas de menu; some quando a partida
// começa e volta ao voltar pro menu. Chrome bloqueia autoplay COM som até o 1º gesto do
// usuário — contorno: a faixa toca MUDA desde o load (permitido) e desmuta com fade no 1º
// gesto, então já está rolando quando o som entra. Se o arquivo não existir, falha em silêncio.
// ATENÇÃO: use uma faixa CC0/licenciada — NÃO usar música protegida (ex.: YouTube/MPB) no
// build público (risco de copyright, igual aos sons da Valve a trocar).
const MENU_MUSIC_VOL = 0.3;
// Trilhas do menu (public/audio/menu-music/m01..m15 — trims de ~105s normalizados via ffmpeg,
// ver HANDOFF). Uma aleatória POR VISITA ao menu; troca a cada partida/retorno.
const MENU_TRACKS = Array.from({ length: 15 }, (_, i) => `/audio/menu-music/m${String(i + 1).padStart(2, '0')}.mp3`);
let menuMusic = null, musicArmed = false, musicFade = null;
function _ensureMusic() {
  if (menuMusic) return menuMusic;
  menuMusic = new Audio(MENU_TRACKS[(Math.random() * MENU_TRACKS.length) | 0]);
  menuMusic.loop = true; menuMusic.volume = MENU_MUSIC_VOL;
  window.__mm = menuMusic;   // hook de debug/teste (estado da música do menu)
  return menuMusic;
}
function startMenuMusic() {
  const m = _ensureMusic();
  if (musicFade) { clearInterval(musicFade); musicFade = null; }
  if (!musicArmed) {
    // tenta autoplay COM SOM (Chrome libera se o site tem Media Engagement Index alto pro
    // usuário — é por isso que o YouTube consegue). Se rejeitar (NotAllowedError), cai no
    // fluxo atual: mudo no load + desmute com fade no 1º gesto. Sem promise não tratada.
    m.muted = false; m.volume = MENU_MUSIC_VOL;
    const p = m.play();
    if (p && p.then) p.then(() => { musicArmed = true; }, () => {
      if (m.paused) { m.muted = true; m.play().catch(() => {}); }   // fallback gracioso
    });
    // o play() do boot nem sempre "gruda" (rede/dev server lento, readyState 0) —
    // re-tenta quando houver dados, enquanto a intenção for tocar no menu
    if (!m._cpHook) { m._cpHook = 1; m.addEventListener('canplay', () => { if (!menuMusic || menuMusic.paused) m.play().catch(() => {}); }); }
    return;
  }
  m.muted = false; m.volume = MENU_MUSIC_VOL;
  m.play().catch(() => {});   // silencioso se arquivo ausente
}
function stopMenuMusic() {   // fade rápido pra não cortar seco ao entrar na partida
  if (!menuMusic) return;
  if (musicFade) clearInterval(musicFade);
  musicFade = setInterval(() => {
    menuMusic.volume = Math.max(0, menuMusic.volume - 0.05);
    if (menuMusic.volume <= 0.001) { clearInterval(musicFade); musicFade = null; menuMusic.pause(); }
  }, 40);
}
// no 1º gesto (clique/tecla): desmuta com fade-in — a faixa JÁ está rolando (autoplay mudo),
// então o som "entra" instantâneo, como se fosse autoplay de verdade
const _armMusic = () => {
  if (musicArmed) return; musicArmed = true;
  const m = _ensureMusic();
  m.muted = false;
  let v = 0.02; m.volume = v;
  musicFade = setInterval(() => { v += 0.04; m.volume = Math.min(MENU_MUSIC_VOL, v); if (v >= MENU_MUSIC_VOL) { clearInterval(musicFade); musicFade = null; } }, 40);
};
// SPLASH DE BOOT ("pressione para entrar"): o gesto que sai da splash é GARANTIDO, então
// destrava o áudio COM SOM na hora — sem fallback mudo e sem fade atrapalhado. Registrado
// em capture ANTES do _armMusic, que vira no-op (musicArmed já true).
function dismissSplash() {
  const sp = document.getElementById('boot-splash');
  if (!sp || !_splashReady || sp.classList.contains('gone')) return;
  sp.classList.add('gone');
  setTimeout(() => sp.remove(), 480);
  musicArmed = true;
  if (musicFade) { clearInterval(musicFade); musicFade = null; }
  const m = _ensureMusic();
  m.muted = false; m.volume = MENU_MUSIC_VOL; m.play().catch(() => {});
}
window.addEventListener('pointerdown', dismissSplash, true);
window.addEventListener('keydown', dismissSplash, true);
window.addEventListener('pointerdown', _armMusic);
window.addEventListener('keydown', _armMusic);
startMenuMusic();   // boot: começa MUDA imediatamente (loop rolando antes do 1º clique)
const isMobile = matchMedia('(pointer: coarse)').matches || innerWidth < 820;
let settingsReturn = 'main-menu';

/* ---------------- 3D character preview ---------------- */
let pv = null;
function ensurePreview() {
  if (pv) return pv;
  const canvas = $('char-preview');
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  // 400² de backing store exibido a 380 CSS px: o preview era 340 e ficava pequeno demais
  // pra ser "a" peça da tela de personagem. O downscale ainda dá borda limpa.
  r.setSize(400, 400, false);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffe6c0, 0x5a4a38, 1.1));
  const key = new THREE.DirectionalLight(0xffe0b3, 1.8); key.position.set(2, 4, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, 0.55); rim.position.set(-3, 2, -2); scene.add(rim);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 26), new THREE.MeshLambertMaterial({ color: 0x2e331f }));
  disc.position.y = -0.03; disc.receiveShadow = true; scene.add(disc);
  const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
  cam.position.set(0, 1.3, 3.2); cam.lookAt(0, 0.92, 0);
  pv = { r, scene, cam, model: null };
  return pv;
}
// Each character shows off a weapon that fits their vibe (not everyone with an AK).
// CHAR_WEAPON/charWeapon live in characters.js, shared with game.js (initial loadout).
let pvToken = 0;
function pvSetChar(def) {
  const p = ensurePreview();
  // Swap to the real rigged GLB (idle) once loaded, if this is still the selection.
  const my = ++pvToken;
  const showBox = () => {   // procedural fallback (only when there's no GLB at all)
    if (p.model) p.scene.remove(p.model);
    p.mixer = null; p.ctrl = null;
    p.model = buildCharacter(def).group;
    p.model.rotation.y = 0.4;
    p.scene.add(p.model);
  };
  if (GLB_CHARS.has(def.id)) {
    // Keep the PREVIOUS model visible while the real GLB streams in — never flash the
    // blocky placeholder for a character that has a real model (the pop-in bug).
    preloadCharacterAssets([def.id]).then(() => {
      if (my !== pvToken) return;
      const m = hasModel(def.id) ? buildCharacterModel(def, { weaponId: charWeapon(def.id) }) : null;
      if (!m) { showBox(); return; }
      if (p.model) p.scene.remove(p.model);
      m.group.rotation.y = 0.4;
      p.model = m.group; p.mixer = m.mixer; p.ctrl = m.ctrl;
      p.scene.add(m.group);
    }).catch(() => { if (my === pvToken) showBox(); });
  } else {
    showBox();
  }
}
function pvThumb(def) {
  // Box-only thumbnail (tiny icon) — never triggers a GLB load.
  const p = ensurePreview();
  if (p.model) { p.scene.remove(p.model); p.model = null; }
  p.mixer = null; p.ctrl = null;
  const box = buildCharacter(def).group; box.rotation.y = 0.55;
  p.scene.add(box);
  p.r.render(p.scene, p.cam);
  const c = document.createElement('canvas'); c.width = c.height = 96;
  c.getContext('2d').drawImage(p.r.domElement, 0, 0, 96, 96);
  p.scene.remove(box);
  return c.toDataURL();
}

/* ---------------- game lifecycle ---------------- */
let game = null, currentTeam = 'P', currentFaction = 'P', currentChar = CHARACTERS[0].id, selChar = null;
let pickingEnemy = false, currentEnemyFaction = null;   // 2º passo do team-select: escolher o adversário
let submitted = true;   // stats da partida atual já enviados?
let registeredNick = ''; // nick usado no registro da sessão (token está atrelado a ele)
let heartbeatOff = false;
const params = new URLSearchParams(location.search);
const testMode = params.get('debug') === '1';

async function startGame(team, charId, enemyFaction) {
  if (isMobile && !testMode) { show('mobile-warning'); return; }
  // facção = time do personagem ('P'/'B'/'U'). O jogador ESCOLHE o adversário (enemyFaction);
  // default = oposto político. Mesma facção dos dois lados = mirror (inimigo roxo no HUD).
  const faction = (CHARACTERS.find(c => c.id === charId) || {}).team || team || 'P';
  const side = faction === 'B' ? 'B' : 'P';
  const enemyFac = enemyFaction || currentEnemyFaction || (side === 'B' ? 'P' : 'B');
  currentFaction = faction; currentTeam = side; currentChar = charId; currentEnemyFaction = enemyFac;
  stopMenuMusic();   // música é só do menu — some (fade) quando a partida começa
  if (game) game.dispose();
  show(null);
  const _sp = document.getElementById('boot-splash'); if (_sp) _sp.remove();   // fluxo ?auto= pula a splash
  // LOADING REAL da partida: overlay opaco cobre TUDO enquanto os GLBs entram e o mundo
  // é construído — nada de cena parcial/"minecraft" aparecendo aos poucos
  showLoading('CARREGANDO — ' + MAPS[currentMap].name.toUpperCase());
  await sfxReady;   // make sure voice/CS samples are registered before round 1 sounds
  // Preload real GLB character models + shared animation clips (bots). Falls back to
  // procedural box meshes for any archetype that isn't modeled yet. Map props (statues)
  // load in parallel and are optional — the map renders fine if they're missing.
  // sorteia os carros da Havan desta partida ANTES do preload (seleção = props do mapa)
  setHavanCarSeed((Math.random() * 1e9) | 0);
  try {
    await Promise.all([
      preloadCharacterAssets([...GLB_CHARS]),
      preloadMapProps([...MAP_PROPS, ...((MAPS[currentMap] && MAPS[currentMap].props) || [])]),   // + props do mapa (Havan: carros/estátua)
      preloadFPArms(),   // braços FP dedicados (falha → fallback procedural, sem bloquear)
      // viewmodel estático Tripo: LAZY (G2-R14A — crash Aw Snap! no CTF da Havan por OOM:
      // o preload antigo baixava os 13 arms_*.glb ~270MB de uma vez). Boot = só o loadout
      // inicial (classe da arma do personagem + rifle/pistol/faca + herói dedicada, se houver);
      // as demais classes carregam sob demanda na 1ª troca (_ensureStaticVm, com cache).
      preloadStaticVm(vmPreloadClasses(charWeapon(charId))),
    ]);
  } catch (e) { console.error('preload da partida falhou parcialmente', e); }
  if (_lstat.phase) _lstat.phase.set(1);
  game = new Game({
    renderer, textures, sfx, settings,
    playerCharId: charId, playerTeam: side, playerFaction: faction, enemyFaction: enemyFac, mapId: currentMap,
    nickname: $('nick-input').value, testMode,
    ctf: matchMode === 'ctf',   // o modo agora é 100% escolha do jogador (ctfMode só define o PADRÃO ao trocar de mapa)
    onMatchEnd: recordMatchStats,
  });
  window.__game = game;
  submitted = false;
  retryPending();
  armSwitchHook();
  game.onOpenSettings = () => { game.setPaused(true); settingsReturn = 'pause-menu'; show('settings-panel'); };
  game.onToggleSpeech = () => {
    settings.speech = !settings.speech;
    sfx.speechEnabled = settings.speech;
    saveSettings();
    $('set-speech').checked = settings.speech;
    return settings.speech;
  };
  game.start();
  // esconde o loading só depois do 1º frame REAL da partida renderizado
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  hideLoading();
  // registra nick no ranking global (silencioso se a API não estiver no ar)
  const nick = $('nick-input').value.trim();
  registeredNick = nick; heartbeatOff = false;
  if (nick && !testMode) {
    api('/api/register', {
      nick, token: getToken(),
      socials: socials.filter(s => s.handle),
    });
  }
  try { window.va?.('event', { name: 'game_start', data: { team, character: charId, map: currentMap } }); } catch {}
  if (!testMode) { try { renderer.domElement.requestPointerLock()?.catch?.(() => {}); } catch {} }
}
function quitToMenu() {
  switchMode = false;   // never carry an in-match team-switch into the menu
  // dispose protegido: se a limpeza da partida falhar, o menu volta MESMO assim
  // (antes, uma exceção aqui deixava o botão "SAIR PRO MENU" morto e o jogo zumbi)
  try { if (game) game.dispose(); } catch (e) { console.error('dispose falhou ao sair pro menu', e); }
  game = null; window.__game = null;
  if (document.pointerLockElement) document.exitPointerLock();
  show('main-menu');
}

/* ---------------- heartbeat (presença/mapa) ---------------- */
setInterval(async () => {
  if (!game || !registeredNick || testMode || heartbeatOff) return;
  const res = await api('/api/heartbeat', { nick: registeredNick, token: getToken() });
  if (res && res.error) heartbeatOff = true;   // token inválido etc. — para de martelar
}, 30_000);

/* ---------------- avatar upload (sem login — validado por nick+token) ---------------- */
$('avatar-btn').onclick = () => $('avatar-file').click();
$('avatar-file').onchange = async e => {
  const f = e.target.files[0];
  const nick = registeredNick || (nickEl.value || '').trim();
  if (!f || !nick) return;
  $('avatar-note').textContent = 'enviando…';
  try {
    const bmp = await createImageBitmap(f);
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    const s = Math.min(bmp.width, bmp.height);
    x.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, 128, 128);
    const dataUrl = c.toDataURL('image/png');
    const res = await api('/api/avatar', { nick, token: getToken(), image: dataUrl });
    $('avatar-note').textContent = res && res.ok ? 'foto atualizada! ✓' : 'falhou: ' + (res?.error || 'sem conexão');
  } catch { $('avatar-note').textContent = 'falhou — tente outra imagem'; }
  e.target.value = '';
};

/* ---------------- menu CS 1.6 (Coro Solto) ---------------- */
/* Som de UI: um menu AAA tem TRÊS sons (mover, confirmar, voltar) e o "mover" é o que dá
   a sensação tátil. Só existia uiClick(); hover/back são compostos aqui com as primitivas
   do Sfx (audio.js pertence a outro agente — nada é adicionado lá). Falha em silêncio. */
const ui = {
  click() { try { sfx.uiClick(); } catch {} },
  hover() { try { sfx.ensure(); sfx._beep('square', 1240, 1240, .02, .04, 0, true); } catch {} },
  back()  { try { sfx.ensure(); sfx.duck(0.5, 0.1); sfx._beep('square', 560, 400, .06, .10, 0, true); } catch {} },
};
let matchMode = 'rounds';   // 'rounds' | 'ctf' — lido em startGame (ctf)
if (MAPS[currentMap].ctfMode) matchMode = 'ctf';   // Loja H / Ferro Velho ABREM em CTF (geometria feita em volta das bandeiras), mas dá pra trocar
const menuSetup = $('menu-setup');
const csItems = [...document.querySelectorAll('.cs-item')];
// Kill-switch de UI: ?ui=legacy volta o scrim do menu e o HUD ao visual da rodada 1
// (vinheta de coluna inteira, HUD sem plaquinha nem scrim de canto). Serve de degradação
// segura se o tratamento novo regredir em algum wallpaper/mapa.
if (params.get('ui') === 'legacy') document.documentElement.dataset.ui = 'legacy';
// aria-current = "o painel aberto veio DAQUI". Antes nenhum item tinha estado de seleção.
function markCurrent(act) {
  for (const it of csItems) {
    const on = !!act && it.dataset.act === act;
    if (on) it.setAttribute('aria-current', 'true'); else it.removeAttribute('aria-current');
  }
}
const SETUP_STEPS = { rounds: 'PASSO 1 DE 3 · PARTIDA', ctf: 'PASSO 1 DE 3 · PARTIDA' };
const openSetup = (mode, title, act) => {
  if (mode) matchMode = mode;
  $('setup-title').textContent = title;
  const st = $('setup-step'); if (st) st.textContent = SETUP_STEPS[matchMode] || 'PASSO 1 DE 3 · PARTIDA';
  markCurrent(act);
  menuSetup.classList.add('open');
  setMapMode();
  applySetupWall();   // "escolher mapa/config" usa o wallpaper da posição 2 do fluxo
};
csItems.forEach((it) => {
  it.onmouseenter = () => ui.hover();
  it.onclick = () => {
    ui.click();
    switch (it.dataset.act) {
      case 'sp':    openSetup('rounds', 'SINGLE PLAYER', 'sp'); break;
      case 'ctf':   openSetup('ctf', 'CAPTURE THE FLAG', 'ctf'); break;
      case 'mapa':  openSetup(null, 'ESCOLHER MAPA', 'mapa'); break;
      case 'config': markCurrent('config'); show('settings-panel'); break;
      case 'ranking': markCurrent('ranking'); showRanking(); break;
      case 'sobre': markCurrent('sobre'); show('howto-panel'); break;
    }
  };
});
// Navegação por teclado no menu (↑↓ / Home / End). Num FPS de PC não navegar no teclado
// é falha de acessibilidade E de sensação — CS2/Valorant fazem tudo sem mouse.
$('cs-menu').addEventListener('keydown', (e) => {
  const i = csItems.indexOf(document.activeElement);
  let n = -1;
  if (e.key === 'ArrowDown') n = (i < 0 ? 0 : (i + 1) % csItems.length);
  else if (e.key === 'ArrowUp') n = (i < 0 ? csItems.length - 1 : (i - 1 + csItems.length) % csItems.length);
  else if (e.key === 'Home') n = 0;
  else if (e.key === 'End') n = csItems.length - 1;
  if (n < 0) return;
  e.preventDefault(); csItems[n].focus(); ui.hover();
});
// Fechar o setup tinha UMA saída só: o botão VOLTAR. Enquanto ele estava aberto a coluna
// da esquerda ficava inerte (ver style.css, bloco `:has(.cs-setup.open)`), então quem
// clicasse em SINGLE PLAYER ficava preso ali. Agora são três saídas — botão, ESC e clique
// fora — e a nav continua clicável. `back` = tocar o som só quando foi gesto do jogador.
function closeSetup(back) {
  if (!menuSetup.classList.contains('open')) return false;
  if (back) ui.back();
  menuSetup.classList.remove('open');
  markCurrent(null);
  applyHomeWall();
  return true;
}
$('setup-back').onclick = () => { closeSetup(true); };
// ESC no menu = voltar um passo. Num jogo de PC, ESC é o botão de voltar universal;
// não ter isso no menu é inconsistente com o próprio jogo (ESC pausa a partida).
// no window (não no #main-menu): depois de um clique no wallpaper o foco volta pro <body>
// e um listener preso ao container nunca receberia a tecla.
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if ($('main-menu').classList.contains('hidden')) return;
  if (closeSetup(true)) { e.preventDefault(); csItems[0]?.focus(); }
});
// Clique no wallpaper (fora do painel e fora da nav) também fecha — comportamento de
// qualquer painel docado; sem isso o jogador tenta e não acontece nada.
$('main-menu').addEventListener('pointerdown', (e) => {
  if (e.target.closest('.cs-setup') || e.target.closest('.cs-left')) return;
  closeSetup(true);
});

/* ---------------- menu wiring ---------------- */
// JOGAR sem nick era um SHAKE depois do clique; agora é ESTADO (aria-disabled), atualizado
// a cada tecla — o jogador vê que falta algo ANTES de tentar.
function syncPlayState() {
  const b = $('btn-jogar'); if (!b) return;
  b.setAttribute('aria-disabled', (nickEl.value || '').trim() ? 'false' : 'true');
}
$('btn-jogar').onclick = () => {
  if (!(nickEl.value || '').trim()) {
    nickEl.classList.add('invalid');
    nickEl.placeholder = 'DIGITE UM NICK PRIMEIRO!';
    nickEl.focus();
    setTimeout(() => nickEl.classList.remove('invalid'), 1500);
    return;   // sem nick, sem treta
  }
  sfx.uiClick();
  const firstEmpty = socials.find(s => !s.handle);
  if (firstEmpty) {
    document.querySelector('.social-item input')?.classList.add('invalid');
    setTimeout(() => document.querySelector('.social-item input')?.classList.remove('invalid'), 1200);
  }
  show('team-select');
  ensureTeamPreviews();   // thumbnails 3D dos times (async, cacheia no card)
};
$('btn-ranking').onclick = () => { sfx.uiClick(); showRanking(); };
$('ranking-back').onclick = () => { ui.back(); markCurrent(null); show('main-menu'); };
// carrossel de mapas: setas ‹ › trocam o mapa E o fundo 3D do menu + thumbnail real do mapa
const mapNameEl = $('map-name');
const mapThumb = $('map-thumb');
if (mapThumb) {
  mapThumb.onload = () => { mapThumb.style.opacity = '1'; };
  mapThumb.onerror = () => { mapThumb.style.opacity = '0'; };   // sem captura ainda → some limpo
}
function setMapThumb() {
  if (!mapThumb) return;
  mapThumb.style.opacity = '0';
  mapThumb.src = `/img/map-previews/${currentMap}.jpg?v=${VERSION}`;
}
// Badge de modo + pontinhos de posição: o carrossel não dizia onde o jogador estava
// (quantos mapas existem, qual é este) nem que Havan/Ferro Velho SÃO CTF por natureza.
function setMapMode() {
  const m = $('map-mode');
  if (m) {
    m.textContent = matchMode === 'ctf' ? 'CAPTURE THE FLAG' : 'ROUNDS';
    m.dataset.mode = matchMode;
  }
  const d = $('map-dots');
  if (d) d.innerHTML = MAP_IDS.map((_, i) => `<i class="${i === mapIdx ? 'on' : ''}"></i>`).join('');
}
// O badge de modo virou BOTÃO: pedido do dono ("os mapas todos podem ser rounds ou CTF,
// mas tem uns que forçam ser CTF"). Antes ele era um <span> informativo e Loja H/Ferro Velho
// eram prisão de CTF. Agora o mapa só define o PADRÃO e o jogador alterna aqui.
{
  const mm = $('map-mode');
  if (mm) mm.addEventListener('click', () => {
    matchMode = matchMode === 'ctf' ? 'rounds' : 'ctf';
    ui.click();
    setMapMode();
    const st = $('setup-step'); if (st) st.textContent = SETUP_STEPS[matchMode] || 'PASSO 1 DE 3 · PARTIDA';
  });
}
let mapIdx = Math.max(0, MAP_IDS.indexOf(currentMap));
function stepMap(dir) {
  ui.click();
  mapIdx = (mapIdx + dir + MAP_IDS.length) % MAP_IDS.length;
  currentMap = resolveMapId(MAP_IDS[mapIdx]);
  settings.map = currentMap; saveSettings();
  mapNameEl.textContent = MAPS[currentMap].name;
  setMapThumb();
  // troca de mapa aplica o PADRÃO do mapa (Loja H/Ferro Velho abrem em CTF, o resto em rounds);
  // o jogador continua livre pra alternar depois no badge de modo
  matchMode = MAPS[currentMap].ctfMode ? 'ctf' : 'rounds';
  setMapMode();
  rebuildMenuBackdrop();
}
mapNameEl.textContent = MAPS[currentMap].name;
setMapThumb();
setMapMode();
$('map-prev').onclick = () => stepMap(-1);
$('map-next').onclick = () => stepMap(1);
[$('map-prev'), $('map-next')].forEach(b => b && (b.onmouseenter = () => ui.hover()));
const wpnSel = { value: settings.wpnMode || 'all' };
// dropdown custom de modo de armas (com ícones SVG originais)
const WPN_ICONS = {
  all: `<svg width="22" height="14" viewBox="0 0 22 14" fill="none"><path d="M1 9l8-6 1 1-8 6-1-1zm20-2L13 1l-1 1 8 6 1-1z" fill="currentColor"/><rect x="9" y="6" width="4" height="7" fill="currentColor"/></svg>`,
  pistols: `<svg width="20" height="14" viewBox="0 0 20 14" fill="none"><path d="M1 2h12v4H9v6H5V6H1V2z" fill="currentColor"/><rect x="9" y="1" width="4" height="3" fill="currentColor"/></svg>`,
  knife: `<svg width="20" height="14" viewBox="0 0 20 14" fill="none"><path d="M1 12L14 1l4 1-3 11-8 2-6-3z" fill="currentColor"/><rect x="1" y="10" width="5" height="3" fill="currentColor"/></svg>`,
  awp: `<svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x="0" y="4" width="26" height="3" fill="currentColor"/><rect x="7" y="0" width="8" height="4" fill="currentColor"/><rect x="2" y="7" width="6" height="4" fill="currentColor"/></svg>`,
};
const WPN_MODES = [
  { id: 'all', label: 'TODAS' },
  { id: 'pistols', label: 'SÓ PISTOLAS' },
  { id: 'knife', label: 'SÓ FACA' },
  { id: 'awp', label: 'SÓ AWP' },
];
const wpnDdBtn = $('wpn-dd-btn'), wpnDdList = $('wpn-dd-list'), wpnDdLabel = $('wpn-dd-label');
function wpnLabel(id) {
  const m = WPN_MODES.find(m => m.id === id);
  wpnDdLabel.innerHTML = `<span class="dd-cur">${WPN_ICONS[id]}<span>${m ? m.label : id}</span></span>`;
}
wpnDdList.innerHTML = WPN_MODES.map(m =>
  `<button class="dd-item" data-id="${m.id}" type="button">${WPN_ICONS[m.id]}<span>${m.label}</span></button>`).join('');
wpnLabel(wpnSel.value);
wpnDdBtn.onclick = e => { e.stopPropagation(); wpnDdList.classList.toggle('hidden'); wpnDdBtn.classList.toggle('open'); };
document.addEventListener('click', () => { wpnDdList.classList.add('hidden'); wpnDdBtn.classList.remove('open'); });
wpnDdList.querySelectorAll('.dd-item').forEach(b => b.onclick = () => {
  settings.wpnMode = b.dataset.id; saveSettings();
  wpnLabel(settings.wpnMode); sfx.uiClick();
});
// bots-per-side + difficulty selectors (custom match)
const botsSel = $('bots-select');
if (botsSel) {
  [2, 3, 4, 5, 6, 7, 8].forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = `${n} vs ${n}`; botsSel.appendChild(o); });
  botsSel.value = settings.bots || 4;
  botsSel.onchange = () => { settings.bots = +botsSel.value; saveSettings(); sfx.uiClick(); };
}
const diffSel = $('diff-select');
if (diffSel) {
  [['easy', 'FÁCIL'], ['normal', 'NORMAL'], ['hard', 'DIFÍCIL'], ['insane', 'INSANO']].forEach(([v, l]) => { const o = document.createElement('option'); o.value = v; o.textContent = l; diffSel.appendChild(o); });
  diffSel.value = settings.difficulty || 'normal';
  diffSel.onchange = () => { settings.difficulty = diffSel.value; saveSettings(); sfx.uiClick(); };
}
$('btn-howto').onclick = () => { sfx.uiClick(); show('howto-panel'); };
$('howto-back').onclick = () => { ui.back(); markCurrent(null); show('main-menu'); };
$('btn-settings').onclick = () => { sfx.uiClick(); settingsReturn = 'main-menu'; show('settings-panel'); };
$('settings-back').onclick = () => {
  ui.back(); saveSettings();
  if (game) game.applySettings();
  if (settingsReturn === 'main-menu') markCurrent(null);
  show(settingsReturn);
};
$('mobile-ok').onclick = () => { sfx.uiClick(); show('main-menu'); };
$('team-back').onclick = () => { ui.back(); pickingEnemy = false; setEnemyPickMode(false); const t = document.querySelector('#team-select .screen-title'); if (t) t.textContent = 'ESCOLHA SEU LADO DA TRETA'; show('main-menu'); };
$('char-back').onclick = () => { ui.back(); show('team-select'); };
$('btn-team-p').onclick = () => { sfx.uiClick(); pickTeam('P'); };
$('btn-team-b').onclick = () => { sfx.uiClick(); pickTeam('B'); };
$('btn-team-u') && ($('btn-team-u').onclick = () => { sfx.uiClick(); pickTeam('U'); });
$('btn-resume').onclick = () => { sfx.uiClick(); game?.resume(); };
$('btn-pause-settings').onclick = () => { sfx.uiClick(); settingsReturn = 'pause-menu'; show('settings-panel'); };
$('btn-quit').onclick = () => {
  sfx.uiClick();
  const pl = partialPayload();
  if (pl) { submitted = true; submitGlobal(pl); }
  quitToMenu();
};
$('btn-again').onclick = () => { sfx.uiClick(); startGame(currentTeam, currentChar); };
$('btn-menu').onclick = () => { sfx.uiClick(); quitToMenu(); };
// M in-game: escolhe o personagem do novo time antes de trocar
let switchMode = false;
function armSwitchHook() {
  game.onRequestSwitch = () => {
    if (document.pointerLockElement) document.exitPointerLock();
    switchMode = true;
    pickTeam(game.enemyTeam);
  };
}
$('char-confirm').onclick = () => {
  sfx.uiClick();
  if (!selChar) return;
  // Only take the in-match "switch team" path when there's a live game to switch;
  // a stale switchMode flag (e.g. backed out of M) must NOT hit game._switchTeam on a
  // disposed game — that used to throw and leave the next match unable to load.
  if (switchMode && game) {
    switchMode = false;
    currentChar = selChar.id;
    show(null);
    try { game._switchTeam(selChar.id); } catch (e) { console.error('switch team failed', e); }
    game.resume();   // unpause + re-request pointer lock (fixes "M opens but game won't resume")
  } else {
    switchMode = false;
    // 2º passo: escolher o ADVERSÁRIO (reusa o team-select com título trocado).
    // O card da SUA facção é escondido — adversário só entre os outros 2 (sem mirror).
    currentChar = selChar.id;
    pickingEnemy = true;
    setEnemyPickMode(true, currentFaction);
    const t = document.querySelector('#team-select .screen-title'); if (t) t.textContent = 'ESCOLHA O ADVERSÁRIO';
    show('team-select');
    ensureTeamPreviews();   // no-op se já rodou (previews ficam cacheados nos cards)
  }
};

// Esconde/mostra o card da sua facção na tela de adversário (btn-team-p/b/u).
function setEnemyPickMode(on, myFaction) {
  for (const f of ['p', 'b', 'u']) {
    const b = $('btn-team-' + f);
    if (b) b.classList.toggle('hidden', !!(on && f.toUpperCase() === myFaction));
  }
}

const nickEl = $('nick-input');
nickEl.value = localStorage.getItem(NICK_KEY) || '';
nickEl.oninput = () => localStorage.setItem(NICK_KEY, nickEl.value);
const SOCIAL_NET_KEY = 'awpbr_social_net'; // legado (migração pro multi-redes)
function sanitizeHandle(v) { return v.replace(/^@+/, '').replace(/[^a-zA-Z0-9._-]/g, ''); }
function extractFromUrl(v) {
  const m = v.match(/(?:x\.com|twitter\.com|github\.com|instagram\.com|tiktok\.com\/@|youtube\.com\/@|linkedin\.com\/in)\/?@?([A-Za-z0-9._-]+)/i);
  return m ? m[1] : null;
}

/* ---------------- multi-redes sociais (até 3, sem login) ---------------- */
const SOCIALS_KEY = 'awpbr_socials';
const NETS = [['x', 'X / Twitter'], ['github', 'GitHub'], ['instagram', 'Instagram'],
  ['linkedin', 'LinkedIn'], ['tiktok', 'TikTok'], ['youtube', 'YouTube'], ['site', 'Site próprio']];
let socials = [];
try { socials = JSON.parse(localStorage.getItem(SOCIALS_KEY) || '[]'); } catch {}
// migração do campo único antigo
if (!socials.length) {
  const oldNet = localStorage.getItem(SOCIAL_NET_KEY), oldHandle = localStorage.getItem(SOCIAL_KEY);
  if (oldNet && oldHandle) socials = [{ net: oldNet, handle: oldHandle }];
}
function saveSocials() {
  localStorage.setItem(SOCIALS_KEY, JSON.stringify(socials));
  updateAvatarVisibility();
}
function updateAvatarVisibility() {
  const hasAuto = socials.some(s => ['x', 'github'].includes(s.net) && s.handle);
  $('avatar-row').classList.toggle('hidden', hasAuto || !(nickEl.value || '').trim());
}
function renderSocials() {
  const list = $('social-list');
  list.innerHTML = '';
  socials.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'pc-row social-item';
    row.innerHTML =
      `<select>${NETS.map(([v, l]) => `<option value="${v}"${v === s.net ? ' selected' : ''}>${l}</option>`).join('')}</select>` +
      `<input maxlength="40" placeholder="usuário" value="${String(s.handle).replace(/"/g, '&quot;')}">` +
      `<button class="social-del" title="remover" type="button">✕</button>`;
    const sel = row.querySelector('select'), inp = row.querySelector('input'), del = row.querySelector('.social-del');
    sel.onchange = () => { s.net = sel.value; saveSocials(); };
    inp.oninput = () => {
      let v = extractFromUrl(inp.value) || inp.value;
      v = sanitizeHandle(v);
      if (v !== inp.value) inp.value = v;
      s.handle = v; saveSocials();
    };
    del.onclick = () => { socials.splice(i, 1); saveSocials(); renderSocials(); };
    list.appendChild(row);
  });
  $('social-add').classList.toggle('hidden', socials.length >= 3);
}
$('social-add').onclick = () => { socials.push({ net: 'x', handle: '' }); saveSocials(); renderSocials(); };
nickEl.addEventListener('input', updateAvatarVisibility);
nickEl.addEventListener('input', syncPlayState);
syncPlayState();   // estado inicial do botão JOGAR (nick vem do localStorage)
renderSocials();

/* ---------------- global ranking API (via /api/* do site) ---------------- */
const TOKEN_KEY = 'awpbr_token';
function getToken() {
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t) { t = crypto.randomUUID(); localStorage.setItem(TOKEN_KEY, t); }
  return t;
}
async function api(path, body) {
  try {
    const r = await fetch(path, body
      ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
      : undefined);
    const j = await r.json().catch(() => ({}));
    return r.ok ? j : { error: j.error || `http_${r.status}` };
  } catch { return null; }
}
function submitNote(msg) {
  console.warn('[ranking]', msg);
  const el = document.getElementById('match-stats');
  if (el && !document.getElementById('match-end').classList.contains('hidden')) {
    const d = document.createElement('div');
    d.style.cssText = 'color:#ff8080;font-size:12px;width:100%';
    d.textContent = '⚠ stats não enviados: ' + msg;
    el.appendChild(d);
  }
}

// stats parciais quando o jogador abandona a partida (sair pro menu / fechar aba)
function partialPayload() {
  if (!game || submitted || testMode) return null;
  if (!['live', 'roundEnd', 'countdown'].includes(game.state)) return null;
  const g = game, p = g.player;
  const rounds = g.roundsWon.P + g.roundsWon.B;
  if (!p.kills && !p.deaths && !rounds && g.time < 30) return null;
  const nick = registeredNick || (nickEl.value || '').trim();
  if (!nick) return null;
  return {
    nick, token: getToken(), won: false, kills: p.kills, deaths: p.deaths,
    headshots: p.headshots || 0, bestStreak: g.mk.best || 0, rounds, team: g.playerTeam,
    seconds: Math.round(g.time), character: currentChar,
  };
}
addEventListener('beforeunload', () => {
  const pl = partialPayload();
  if (pl) navigator.sendBeacon('/api/submit-match', new Blob([JSON.stringify(pl)], { type: 'application/json' }));
});

/* ---------------- fila de reenvio (rate limit do servidor) ---------------- */
const PENDING_KEY = 'awpbr_pending_submit';
async function submitGlobal(pl) {
  const res = await api('/api/submit-match', pl);
  if (res?.error && /aguarde/i.test(res.error)) {
    localStorage.setItem(PENDING_KEY, JSON.stringify(pl));
    setTimeout(retryPending, 95_000);   // reenvia sozinho quando a janela abrir
  }
  return res;
}
async function retryPending() {
  const raw = localStorage.getItem(PENDING_KEY);
  if (!raw) return;
  const res = await api('/api/submit-match', JSON.parse(raw));
  if (res && !res.error) localStorage.removeItem(PENDING_KEY);
  else if (res?.error && /aguarde/i.test(res.error)) setTimeout(retryPending, 95_000);
}

/* ---------------- local stats (espelhados pro ranking global) ---------------- */
const STATS_KEY = 'awpbr_stats';
function loadStats() {
  return Object.assign({ matches: 0, wins: 0, kills: 0, deaths: 0, headshots: 0, bestStreak: 0 },
    JSON.parse(localStorage.getItem(STATS_KEY) || '{}'));
}
async function recordMatchStats(s) {
  submitted = true;
  const st = loadStats();
  st.matches++; if (s.won) st.wins++;
  st.kills += s.kills; st.deaths += s.deaths; st.headshots += s.headshots;
  st.playSeconds = (st.playSeconds || 0) + (s.seconds || 0);
  st.rounds = (st.rounds || 0) + s.roundsP + s.roundsB;
  st.bestStreak = Math.max(st.bestStreak, s.bestStreak);
  localStorage.setItem(STATS_KEY, JSON.stringify(st));
  // espelha pro ranking global (avisa na tela se falhar)
  const nick = registeredNick || (nickEl.value || '').trim();
  if (nick && !testMode) {
    const res = await submitGlobal({
      nick, token: getToken(), won: s.won, kills: s.kills, deaths: s.deaths,
      headshots: s.headshots, bestStreak: s.bestStreak,
      rounds: s.roundsP + s.roundsB, team: s.team, seconds: s.seconds || 0,
      character: s.character,
    });
    if (!res) submitNote('ranking global indisponível');
    else if (res.error) submitNote(res.error);
  }
}
function showRanking() {
  const st = loadStats();
  const kd = st.deaths ? (st.kills / st.deaths).toFixed(2) : st.kills.toFixed(2);
  const fmt = (s) => { const m = Math.round(s / 60); return m < 60 ? `${m}min` : m < 1440 ? `${Math.floor(m / 60)}h ${m % 60}min` : `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`; };
  const secs = st.playSeconds || 0;
  const tempo = secs > 0 ? fmt(secs)
    : (st.rounds || 0) > 0 ? `~${fmt(st.rounds * 99)}`
    : st.matches > 0 ? `~${fmt(st.matches * 297)}` : '0min';
  const nick = (nickEl.value || 'VOCÊ').trim();
  const social = socials.find(s => s.handle);
  $('rank-local').innerHTML =
    `<div style="grid-column:1/-1;text-align:center;color:var(--cs);font-size:18px">${nick}` +
    (social ? ` · <span style="color:#8a8064;font-size:12px">${social.net}/${social.handle.replace(/</g, '&lt;')}</span>` : '') + `</div>` +
    `<div><b>${st.matches}</b>partidas</div><div><b>${st.wins > 0 ? st.wins : "—"}</b>vitórias</div><div><b>${kd}</b>K/D</div><div><b>${tempo}</b>arena</div>` +
    `<div><b>${st.kills}</b>kills</div><div><b>${st.deaths}</b>mortes</div><div><b>${st.headshots}</b>headshots</div><div><b>${st.rounds || 0}</b>rounds</div>`;
  show('ranking-panel');
  renderGlobal(nick);
}
async function renderGlobal(nick) {
  const box = $('rank-global');
  box.innerHTML = '<h3>RANKING GLOBAL</h3><div class="rg-off">carregando…</div>';
  const data = await api('/api/leaderboard');
  if (!data || !data.players) {
    box.innerHTML = '<h3>RANKING GLOBAL</h3><div class="rg-off">indisponível no momento</div>';
    return;
  }
  const rows = data.players.slice(0, 10).map((p, i) =>
    `<tr class="${p.nick === nick ? 'me' : ''}"><td>${i + 1}</td><td>${p.nick}</td><td>${p.kd}</td><td>${p.kills}</td><td>${p.wins > 0 ? p.wins : "—"}</td></tr>`).join('');
  box.innerHTML = '<h3>RANKING GLOBAL (top 10)</h3>' +
    (rows
      ? `<table><tr><th>#</th><th>JOGADOR</th><th>K/D</th><th>KILLS</th><th>VIT.</th></tr>${rows}</table>`
      : '<div class="rg-off">ainda vazio — seja o primeiro!</div>') +
    `<div class="rg-links"><a href="/ranking" target="_blank" style="color:var(--cs)">RANKING COMPLETO ↗</a>` +
    (nick ? `<a href="/u/${encodeURIComponent(nick)}" target="_blank" style="color:var(--cs)">MEU PERFIL ↗</a>` : '') +
    `<a href="/mapa" target="_blank" style="color:var(--cs)">MAPA AO VIVO ↗</a></div>`;
}

// GLB idle thumbnail (no weapon), rendered off the shared preview renderer.
function glbThumb(def) {
  const p = ensurePreview();
  if (!hasModel(def.id)) return null;
  const m = buildCharacterModel(def, { weapon: false });
  if (!m) return null;
  m.group.rotation.y = 0.5;
  for (let i = 0; i < 42; i++) m.mixer.update(1 / 60); // settle into the idle pose
  const prevVis = p.model ? p.model.visible : false;
  if (p.model) p.model.visible = false;
  p.scene.add(m.group);
  p.r.render(p.scene, p.cam);
  const c = document.createElement('canvas'); c.width = c.height = 96;
  c.getContext('2d').drawImage(p.r.domElement, 0, 0, 96, 96);
  p.scene.remove(m.group);
  if (p.model) p.model.visible = prevVis;
  return c.toDataURL();
}
/* ---------------- previews 3D dos times nos cards (pedido do dono: "uma imagem
   preview dos models, tipo um time") — renderiza 4 GLBs reais de cada facção no
   renderer de preview (dataURL) e cacheia no card. Roda 1x por visita ao menu. */
let teamPreviewsDone = false;
function ensureTeamPreviews() {
  if (teamPreviewsDone) return;
  teamPreviewsDone = true;
  for (const [btn, fac] of [['btn-team-p', 'P'], ['btn-team-b', 'B'], ['btn-team-u', 'U']]) {
    const box = document.querySelector(`#${btn} .team-chars`);
    if (!box) continue;
    const chars = CHARACTERS.filter(c => c.team === fac && GLB_CHARS.has(c.id)).slice(0, 4);
    if (!chars.length) continue;
    box.innerHTML = chars.map(() => '<span class="tc-slot"></span>').join('');
    const slots = [...box.children];
    preloadCharacterAssets(chars.map(c => c.id)).then(() => {
      chars.forEach((c, i) => {
        const url = glbThumb(c);
        if (url && slots[i]) slots[i].innerHTML = `<img src="${url}" alt="${c.name}" title="${c.name}">`;
      });
    }).catch(() => {});
  }
}
function pickTeam(faction) {
  // 2º passo: se está escolhendo o ADVERSÁRIO, grava e começa a partida.
  // (o card da sua facção fica escondido nessa tela — adversário é sempre um dos outros 2)
  if (pickingEnemy) {
    pickingEnemy = false; currentEnemyFaction = faction;
    setEnemyPickMode(false);
    const t = document.querySelector('#team-select .screen-title'); if (t) t.textContent = 'ESCOLHA SEU LADO DA TRETA';
    startGame(currentTeam, currentChar, faction);
    return;
  }
  // faction = FACÇÃO escolhida (P/B/U). O LADO físico é P (petista/tribos) ou B (bolsonarista).
  currentFaction = faction;
  currentTeam = faction === 'B' ? 'B' : 'P';
  // estado de seleção persistente nos cards: ao voltar do personagem, a tela diz qual é o SEU lado
  for (const f of ['p', 'b', 'u']) {
    const b = $('btn-team-' + f);
    if (b) b.setAttribute('aria-pressed', String(f.toUpperCase() === faction));
  }
  const chars = CHARACTERS.filter(c => c.team === faction);   // roster da facção escolhida
  // LOADING REAL da seleção de personagem: os GLBs do roster entram ANTES da tela abrir —
  // nada de thumbnails de caixa montando aos poucos (o "minecraft" que o dono viu)
  showLoading('CARREGANDO PERSONAGENS…');
  preloadCharacterAssets(chars.map(c => c.id)).catch(() => {}).then(() => {
    hideLoading();
    const list = $('char-list');
    list.innerHTML = '';
    let firstRow = null;
    chars.forEach((c, i) => {
      const row = document.createElement('button');
      row.className = 'char-row';
      // GLB direto (acabou de pré-carregar) — caixa procedural só se o modelo não existe
      const thumb0 = (hasModel(c.id) ? glbThumb(c) : null) || pvThumb(c);
      row.type = 'button'; row.setAttribute('role', 'option'); row.setAttribute('aria-selected', 'false');
      row.innerHTML = `<img src="${thumb0}" alt="${c.name}"><span>${c.name}</span>`;
      row.onmouseenter = () => ui.hover();
      // teclado: ↑↓ percorrem o roster e já trocam o preview (era só mouse)
      row.onkeydown = (e) => {
        const rows = [...list.children];
        const k = rows.indexOf(row);
        let n = -1;
        if (e.key === 'ArrowDown') n = (k + 1) % rows.length;
        else if (e.key === 'ArrowUp') n = (k - 1 + rows.length) % rows.length;
        if (n < 0) return;
        e.preventDefault(); rows[n].focus(); rows[n].click();
      };
      row.onclick = () => { ui.click(); selectChar(c, row); };
      list.appendChild(row);
      if (i === 0) firstRow = row;
    });
    // seleciona DEPOIS de gerar todos os thumbs — senão o preview fica com o último
    if (firstRow) selectChar(chars[0], firstRow);
    show('char-select');
  });
}
function selectChar(c, row) {
  selChar = c;
  // aria-selected além da classe: estado de seleção legível por teclado/leitor de tela
  document.querySelectorAll('.char-row').forEach(r => { r.classList.remove('sel'); r.setAttribute('aria-selected', 'false'); });
  row.classList.add('sel'); row.setAttribute('aria-selected', 'true');
  pvSetChar(c);
  $('char-info-name').textContent = c.name;
  $('char-info-blurb').textContent = c.blurb;
}

/* ---------------- settings wiring ---------------- */
const sensEl = $('set-sens'), volEl = $('set-vol'), qualEl = $('set-quality');
sensEl.value = settings.sens; volEl.value = settings.vol; qualEl.value = settings.quality;
const updLabels = () => {
  $('set-sens-val').textContent = Number(settings.sens).toFixed(1);
  $('set-vol-val').textContent = Math.round(settings.vol * 100) + '%';
};
sensEl.oninput = () => { settings.sens = +sensEl.value; updLabels(); saveSettings(); };
volEl.oninput = () => { settings.vol = +volEl.value; sfx.setVolume(settings.vol); updLabels(); saveSettings(); };
qualEl.onchange = () => { settings.quality = qualEl.value; saveSettings(); if (game) game.applySettings(); };
// Cor da mira: a mira sai do sistema de cor do HUD (ciano = sistema, âmbar = objetivo,
// vermelho = crítico) e passa a ser escolha do jogador — puro CSS var, sem custo por frame.
// PADRÃO = CIANO, não branco. O branco foi medido em 1,28:1 contra a parede clara do
// awp_map (janela de 44×42 px em volta da mira) — invisível. O ciano é o único matiz que
// nenhum dos 4 cenários ocupa. Mantido em UM lugar só (XHAIR_DEF) pra não divergir do CSS.
const XHAIR_DEF = '#4fe8e0';
const xhairEl = $('set-xhair');
function applyXhair() {
  document.documentElement.style.setProperty('--xhair', settings.xhair || XHAIR_DEF);
}
if (xhairEl) {
  xhairEl.value = settings.xhair || XHAIR_DEF;
  if (!xhairEl.value) xhairEl.value = XHAIR_DEF;   // valor salvo fora da lista (ex.: o ciano antigo #39d6e0) → volta pro padrão
  xhairEl.onchange = () => { settings.xhair = xhairEl.value; applyXhair(); saveSettings(); ui.click(); };
}
applyXhair();
const speechEl = $('set-speech');
speechEl.checked = settings.speech !== false;
speechEl.onchange = () => {
  settings.speech = speechEl.checked;
  sfx.speechEnabled = settings.speech;
  saveSettings();
  if (game?.el?.hudSpeech) game.el.hudSpeech.textContent = settings.speech ? '🔊' : '🔇';
};
updLabels();

/* ---------------- logo ---------------- */
(function drawLogo() {
  // O splash mostrava um wordmark TERMINAL/SCI-FI (soundwave ciano + aberração cromática)
  // e 3 segundos depois o menu mostrava a key art com o logo REAL do jogo: letreiramento
  // de brush, vermelho/amarelo/branco, graffiti brasileiro. Duas marcas em 3 segundos — o
  // primeiro frame do jogo mentia sobre o produto. Este desenho passa a falar a MESMA
  // língua da key art: wordmark empilhado, tinta de pincel, borda comida, respingo, faixa
  // amarelo/preto de sinaleiro. Sem ciano, sem moldura de HUD.
  const c = $('logo-canvas') || $('splash-logo'); if (!c) return;   // splash de boot (o menu usa o logo do wallpaper)
  const x = c.getContext('2d');
  const W = 900, H = 360;
  const CAL = '#f4f1e8', AMAR = '#ffc93f', SINAL = '#e2402c', TINTA = '#0b0f13';
  x.clearRect(0, 0, W, H);
  // ruído determinístico (mulberry-ish): o mesmo logo em todo boot, sem flicker entre sessões
  let seed = 20260731;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

  // camada offscreen: a erosão do pincel usa destination-out e não pode comer o fundo
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  const o = off.getContext('2d');
  o.textAlign = 'center'; o.lineJoin = 'round'; o.textBaseline = 'alphabetic';

  // três linhas empilhadas, levemente rotacionadas — pintura de caminhão/lambe-lambe
  const LINES = [
    { t: 'CORO',  y: 104, col: CAL,   sx: 1.00, rot: -0.020 },
    { t: 'SOLTO', y: 196, col: AMAR,  sx: 1.06, rot: 0.014 },
    { t: 'TRETA', y: 288, col: SINAL, sx: 1.02, rot: -0.010 },
  ];
  for (const L of LINES) {
    o.save();
    o.translate(W / 2, L.y); o.rotate(L.rot); o.scale(L.sx, 1);
    o.font = '900 96px "Arial Black",Impact,"Haettenschweiler",sans-serif';
    o.lineWidth = 16; o.strokeStyle = TINTA; o.strokeText(L.t, 0, 0);   // contorno de tinta grossa
    o.lineWidth = 5;  o.strokeStyle = 'rgba(0,0,0,.55)'; o.strokeText(L.t, 3, 4);
    o.fillStyle = L.col; o.fillText(L.t, 0, 0);
    o.restore();
  }
  // borda comida: mordidas irregulares no miolo das letras (pincel seco em tapume)
  o.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 320; i++) {
    const bx = 90 + rnd() * (W - 180), by = 40 + rnd() * 262;
    o.beginPath(); o.ellipse(bx, by, 1 + rnd() * 5, 1 + rnd() * 3, rnd() * 3, 0, 7); o.fill();
  }
  o.globalCompositeOperation = 'source-over';
  // respingo de spray ao redor (só onde já não há letra: fica atrás no composite final)
  for (let i = 0; i < 90; i++) {
    const bx = 60 + rnd() * (W - 120), by = 30 + rnd() * 300;
    o.fillStyle = [CAL, AMAR, SINAL][(rnd() * 3) | 0];
    o.globalAlpha = 0.18 + rnd() * 0.5;
    o.beginPath(); o.arc(bx, by, 0.7 + rnd() * 2.2, 0, 7); o.fill();
  }
  o.globalAlpha = 1;

  // Fundo: brilho quente de tinta atrás do bloco.
  // BUG CONSERTADO (R2): era um createLinearGradient HORIZONTAL pintado num
  // fillRect(-400,-142,800,284) girado -0,02 rad. Um gradiente 1D só esmaece no eixo em
  // que ele existe — no eixo vertical o alpha era constante até a borda do retângulo, e o
  // retângulo tinha aresta dura. Resultado visível em menu-00-splash.png: um painel
  // retangular INCLINADO atrás do wordmark, com topo e base marcados.
  // Agora é um gradiente RADIAL: o alpha cai em todas as direções e chega a 0 (raio 400 →
  // 168px no eixo Y depois do scale) ANTES da borda do fillRect (176px), então não existe
  // nenhuma aresta pra ver. A rotação saiu junto: sem aresta, ela não tinha o que inclinar.
  x.save();
  x.translate(W / 2, 180); x.scale(1, 0.42);   // scale = elipse deitada (canvas só faz radial circular)
  const hz = x.createRadialGradient(0, 0, 30, 0, 0, 400);
  hz.addColorStop(0, 'rgba(255,201,63,.17)');
  hz.addColorStop(.55, 'rgba(255,201,63,.075)');
  hz.addColorStop(1, 'rgba(255,201,63,0)');
  x.fillStyle = hz; x.fillRect(-420, -420, 840, 840);
  x.restore();
  x.drawImage(off, 0, 0);

  // subtítulo: "SUPREMA" entre réguas, como carimbo de placa
  x.textAlign = 'center';
  x.font = '900 26px "Arial Black",Impact,sans-serif';
  x.fillStyle = CAL; x.globalAlpha = .92;
  x.fillText('S U P R E M A', W / 2, 336);
  x.globalAlpha = 1;
  x.strokeStyle = 'rgba(255,201,63,.75)'; x.lineWidth = 3;
  x.beginPath(); x.moveTo(W / 2 - 250, 329); x.lineTo(W / 2 - 120, 329);
  x.moveTo(W / 2 + 120, 329); x.lineTo(W / 2 + 250, 329); x.stroke();
})();

/* ---------------- loop ---------------- */
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  menuCam.aspect = innerWidth / innerHeight; menuCam.updateProjectionMatrix();
  if (game) game.onResize();
});
const clock = new THREE.Clock();
let menuAngle = 0;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta());
  const csOpen = !$('char-select').classList.contains('hidden');
  // While the char-select is open mid-match (pressing M to switch teams), the game
  // auto-pauses — so we must NOT keep rendering it here, and we MUST still spin the
  // preview. Rendering the preview only lived in the menu branch before, which is
  // why M froze the selector.
  if (game && !csOpen) {
    game.update(dt);
  } else if (!game) {
    menuAngle += dt * 0.07;
    menuCam.position.set(Math.sin(menuAngle) * 34, 17 + Math.sin(menuAngle * 0.6) * 4, Math.cos(menuAngle) * 34);
    menuCam.lookAt(0, 1, 0);
    renderer.render(menuScene, menuCam);
  }
  if (csOpen && pv && pv.model) {
    pv.model.rotation.y += dt * 0.9;
    // ctrl.update (idle + IK da mão de apoio) quando há GLB; mixer cru só no fallback box
    if (pv.ctrl) pv.ctrl.update(dt, 0, false, 0); else if (pv.mixer) pv.mixer.update(dt);
    pv.r.render(pv.scene, pv.cam);
  }
}
loop();

/* ---------------- boot ---------------- */
document.querySelector('.footnote').textContent =
  `v${VERSION} · Sátira política fictícia. Nenhum político real foi consultado (ou poupado).`;
{ const sv = document.getElementById('splash-ver'); if (sv) sv.textContent = `v${VERSION}`; }
show(isMobile && !testMode ? 'mobile-warning' : 'main-menu');
if (testMode && params.get('auto')) {
  const [team, char] = params.get('auto').split(',');
  startGame(team || 'P', char || CHARACTERS[0].id);
}
