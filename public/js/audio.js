// Procedural WebAudio SFX + user sample packs (audio/manifest.json).
// Real CS 1.6 samples are NOT bundled (Valve copyright) — drop your own legally-owned
// files in audio/cs/ and register them under "cs" in audio/manifest.json.
export class Sfx {
  constructor() {
    this.ctx = null; this.master = null; this.vol = 0.7;
    this.pack = null;            // parsed manifest
    this.speechEnabled = true;   // falas dos times (memes) — vitória/UT/arma sempre tocam
    this._lastVoice = 0;
    this._radioAudio = null;
  }
  async loadManifest() {
    // Local pack first (audio/manifest.json, gitignored — dev's own CS samples);
    // fall back to the committed CC0 pack (real gun recordings, public domain) so
    // production plays real shots instead of the synth. Never throws.
    for (const url of ['audio/manifest.json?v=3', 'audio/manifest.default.json?v=1']) {
      try {
        const r = await fetch(url, { cache: 'no-cache' });
        if (r.ok) { this.pack = await r.json(); return; }
      } catch { /* try next */ }
    }
    this.pack = null;
  }
  _sample(url, vol = 1) {
    try {
      const a = new Audio(encodeURI(url));
      a.volume = Math.min(1, this.vol * vol);
      a.play().catch(() => {});
      return a;
    } catch { return null; }
  }
  _pick(arr) { return arr && arr.length ? arr[(Math.random() * arr.length) | 0] : null; }

  // team voice line (kill celebration / random), throttled
  voice(team, minGap = 3.5) {
    if (!this.speechEnabled) return;
    const now = performance.now();
    if (now - this._lastVoice < minGap * 1000) return;
    const f = this._pick(this.pack?.voice?.[team]);
    if (f) { this._lastVoice = now; this._sample(f); }
  }
  // player-triggered radio line (CS-style) — always plays, stops previous
  radioVoice(team) {
    if (!this.speechEnabled) return false;
    const f = this._pick(this.pack?.voice?.[team]);
    if (!f) return false;
    if (this._radioAudio) this._radioAudio.pause();
    this._radioAudio = this._sample(f);
    this._lastVoice = performance.now();
    return true;
  }
  roundSound(team) { const f = this._pick(this.pack?.round?.[team]); if (f) { this._sample(f); return true; } return false; }
  csSound(key) { const f = this._cs(key); if (f) { this._sample(f); return true; } return false; }
  general(kind) { const f = this._pick(this.pack?.general?.[kind]); if (f) { this._sample(f); return true; } return false; }
  _cs(key) { const v = this.pack?.cs?.[key]; return v && v.length ? this._pick(v) : null; }

  ensure() {
    if (this.disabled) return;
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.vol;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch { this.disabled = true; }
  }
  setVolume(v) { this.vol = v; if (this.master) this.master.gain.value = v; }

  _env(node, t0, a, peak, d, end = 0.0001) {
    node.gain.setValueAtTime(0.0001, t0);
    node.gain.exponentialRampToValueAtTime(peak, t0 + a);
    node.gain.exponentialRampToValueAtTime(end, t0 + a + d);
  }
  _noise(dur) {
    const n = this.ctx.sampleRate * dur, buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf; return src;
  }
  _osc(type, freq) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = freq; return o; }
  _burst(dur, peak, filterFreq, q = 1, type = 'lowpass') {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, src = this._noise(dur);
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = filterFreq; f.Q.value = q;
    const g = this.ctx.createGain(); this._env(g, t, 0.004, peak, dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(); src.stop(t + dur + 0.05);
  }
  _beep(type, f0, f1, dur, peak, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay, o = this._osc(type, f0);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    const g = this.ctx.createGain(); this._env(g, t, 0.005, peak, dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  // Curva de saturação (tanh) cacheada por drive — dá o "grão"/estouro do tiro.
  _satCurve(drive) {
    this._satCache = this._satCache || {};
    if (this._satCache[drive]) return this._satCache[drive];
    const n = 1024, c = new Float32Array(n), k = Math.tanh(drive);
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(x * drive) / k; }
    return (this._satCache[drive] = c);
  }
  // Perfis por CLASSE (Hz/s). Portado do synth de tiro do Claude-of-Duty (7 camadas).
  static GUN = {
    sniper:  { lvl: 1.0, bodyF: 118, bodyDecay: 0.15, crackF: 1500, crackQ: 1.0, crackDecay: 0.09, drive: 8, midF: 540, midDecay: 0.06, tailF: 5200, tailDecay: 0.52, mech: 0.045, boom: true },
    rifle:   { lvl: 0.82, bodyF: 150, bodyDecay: 0.09, crackF: 2450, crackQ: 0.95, crackDecay: 0.055, drive: 6, midF: 780, midDecay: 0.05, tailF: 5200, tailDecay: 0.3, mech: 0.03 },
    ak:      { lvl: 0.9, bodyF: 126, bodyDecay: 0.11, crackF: 1780, crackQ: 0.9, crackDecay: 0.07, drive: 7.5, midF: 640, midDecay: 0.06, tailF: 4200, tailDecay: 0.42, mech: 0.034 },
    smg:     { lvl: 0.62, bodyF: 172, bodyDecay: 0.06, crackF: 3050, crackQ: 1.05, crackDecay: 0.04, drive: 5, midF: 900, midDecay: 0.035, tailF: 6200, tailDecay: 0.19, mech: 0.021 },
    pistol:  { lvl: 0.72, bodyF: 196, bodyDecay: 0.07, crackF: 2600, crackQ: 1.0, crackDecay: 0.05, drive: 5.5, midF: 820, midDecay: 0.04, tailF: 5000, tailDecay: 0.22, mech: 0.03 },
    shotgun: { lvl: 1.0, bodyF: 92, bodyDecay: 0.17, crackF: 1150, crackQ: 0.7, crackDecay: 0.11, drive: 7, midF: 430, midDecay: 0.07, tailF: 3800, tailDecay: 0.55, mech: 0.05, boom: true },
    lmg:     { lvl: 0.92, bodyF: 122, bodyDecay: 0.12, crackF: 1900, crackQ: 0.9, crackDecay: 0.075, drive: 8, midF: 600, midDecay: 0.06, tailF: 4600, tailDecay: 0.45, mech: 0.035 },
  };
  static GUN_CLASS = {
    awp: 'sniper', mosin: 'sniper', rem700: 'sniper', m400: 'sniper', svd: 'sniper', g3sg1: 'sniper', sks: 'sniper',
    shotgun: 'shotgun', md97: 'shotgun', mp5: 'smg', uzi: 'smg', p90: 'smg', lmg: 'lmg',
    pistol: 'pistol', deagle: 'pistol', revolver38: 'pistol', m92: 'ak', ak: 'ak', akm: 'ak',
  };
  // Tiro SINTETIZADO em camadas (sem sample/copyright): transiente + corpo/soco + crack +
  // mid + cauda + mecânica + boom. Jitter por tiro (2 tiros nunca iguais). vol: trim de distância.
  _gunshot(cls, vol = 1) {
    this.ensure(); if (!this.ctx) return;
    const R = this.ctx, t = R.currentTime, out = this.master;
    const P = Sfx.GUN[cls] || Sfx.GUN.rifle;
    const jit = 1 + (Math.random() - 0.5) * 0.09;
    const V = P.lvl * (0.9 + Math.random() * 0.2) * 0.9 * vol;
    const mk = (node) => { node.connect(out); return node; };
    // shaper compartilhado p/ corpo+crack (saturação)
    const shaper = R.createWaveShaper(); shaper.curve = this._satCurve(P.drive); shaper.oversample = '2x';
    const shg = R.createGain(); shg.gain.value = V; shaper.connect(shg); shg.connect(out);
    const env = (g, a, pk, d) => this._env(g, t, a, pk, d);
    // 1) transiente (click agudo)
    { const s = this._noise(0.008); const hp = R.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2200; const g = R.createGain(); env(g, 0.0005, 0.85 * V, 0.007); s.connect(hp); hp.connect(mk(g)); s.start(t); s.stop(t + 0.02); }
    // 2) corpo/soco (sine grave em queda + tri sub) -> shaper
    { const o = this._osc('sine', P.bodyF * jit); o.frequency.exponentialRampToValueAtTime(P.bodyF * 0.4 * jit, t + P.bodyDecay); const g = R.createGain(); env(g, 0.002, 1.0, P.bodyDecay); o.connect(g); g.connect(shaper); o.start(t); o.stop(t + P.bodyDecay + 0.06);
      const o2 = this._osc('triangle', P.bodyF * 0.5 * jit); const g2 = R.createGain(); env(g2, 0.002, 0.6, P.bodyDecay * 1.15); o2.connect(g2); g2.connect(shaper); o2.start(t); o2.stop(t + P.bodyDecay * 1.15 + 0.06); }
    // 3) crack (ruído band-pass) -> shaper
    { const s = this._noise(P.crackDecay + 0.02); const bp = R.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = P.crackF * jit; bp.Q.value = P.crackQ; const g = R.createGain(); env(g, 0.001, 0.95, P.crackDecay); s.connect(bp); bp.connect(g); g.connect(shaper); s.start(t); s.stop(t + P.crackDecay + 0.05); }
    // 4) mid (cola)
    { const s = this._noise(P.midDecay); const bp = R.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = P.midF; bp.Q.value = 0.8; const g = R.createGain(); env(g, 0.001, 0.4 * V, P.midDecay); s.connect(bp); bp.connect(mk(g)); s.start(t); s.stop(t + P.midDecay + 0.05); }
    // 5) cauda (ruído sob lowpass em queda = "sala")
    { const s = this._noise(P.tailDecay); const lp = R.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(P.tailF, t); lp.frequency.exponentialRampToValueAtTime(700, t + P.tailDecay); const g = R.createGain(); env(g, 0.004, 0.5 * V, P.tailDecay); s.connect(lp); lp.connect(mk(g)); s.start(t); s.stop(t + P.tailDecay + 0.05); }
    // 6) mecânica (ferrolho metálico, atrasado)
    { const md = P.mech; const o = this._osc('square', 2100 * jit); const bp = R.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2500; bp.Q.value = 3; const g = R.createGain(); this._env(g, t + md, 0.001, 0.14 * V, 0.05); o.connect(bp); bp.connect(g); g.connect(out); o.start(t + md); o.stop(t + md + 0.08); }
    // 7) boom grave (só sniper/shotgun) — rolo de distância
    if (P.boom) this._beep('sine', 72, 32, 0.5, 0.5 * V);
  }
  // tiro por arma: pack "weapons" (override local) senão synth por classe.
  shotWeapon(w, vol = 1) {
    const f = this._pick(this.pack?.weapons?.[w]);
    if (f) { this._sample(f, vol); return; }
    if (w === 'knife') return this.knife();
    this._gunshot(Sfx.GUN_CLASS[w] || 'rifle', vol);
  }

  uiClick()   { this.ensure(); this._beep('square', 880, 660, .06, .12); }
  scopeIn()   { const s = this._cs('scope'); if (s) { this._sample(s); return; }
    this.ensure(); this._beep('sine', 500, 900, .09, .15); }
  scopeOut()  { this.ensure(); this._beep('sine', 900, 500, .09, .12); }
  shotAwp() {
    const s = this._cs('awp');
    if (s) { this._sample(s, 0.3); return; }
    this.ensure();
    this._burst(.32, .9, 900);            // crack
    this._burst(.5, .5, 220);             // body boom
    this._beep('sine', 120, 40, .4, .5);  // low thump
  }
  shotPistol(){ const s = this._cs('pistol'); if (s) { this._sample(s); return; }
    this.ensure(); this._burst(.14, .55, 1400); this._beep('sine', 200, 70, .15, .3); }
  knife()     { const s = this._cs('knife'); if (s) { this._sample(s); return; }
    this.ensure(); this._burst(.1, .3, 3000, 2, 'bandpass'); }
  knifeHit()  { const s = this._cs('knifehit'); if (s) { this._sample(s); return; }
    this.ensure(); this._burst(.08, .3, 1200); }
  knifeDeploy(){ const s = this._cs('knifedeploy'); if (s) { this._sample(s, .7); } }
  dryFire()   { this.ensure(); this._beep('square', 1200, 900, .03, .1); }
  bolt()      { this.ensure(); this._beep('square', 300, 180, .05, .14); this._beep('square', 200, 320, .05, .12, .09); }
  reloadStart(){ const s = this._cs('reload'); if (s) { this._sample(s); return; }
    this.ensure(); this._beep('square', 240, 160, .07, .16); this._burst(.08, .2, 2000); }
  reloadEnd() { const s = this._cs('reloadend'); if (s) { this._sample(s); return; }
    this.ensure(); this._beep('square', 180, 420, .09, .2); this._burst(.06, .25, 2600); }
  hitmark()   { this.ensure(); this._beep('sine', 1400, 1100, .05, .22); }
  killConfirm(){ this.ensure(); this._beep('sine', 660, 660, .07, .25); this._beep('sine', 990, 990, .1, .25, .08); }
  hurt()      { this.ensure(); this._beep('sawtooth', 180, 90, .18, .3); this._burst(.1, .2, 500); }
  death()     { this.ensure(); this._beep('sawtooth', 220, 40, .6, .35); }
  jump()      { this.ensure(); this._beep('sine', 220, 330, .08, .1); }
  land()      { this.ensure(); this._burst(.08, .18, 400); }
  step()      { const s = this._cs('footsteps'); if (s) { this._sample(s, 0.5); return; }
    this.ensure(); this._burst(.045, .09, 700 + Math.random() * 300); }
  respawn()   { this.ensure(); this._beep('sine', 440, 880, .18, .18); }
  ricochet()  { this.ensure(); this._beep('sine', 2400, 700, .12, .08); }
  explosion() { this.ensure(); if (!this.ctx) return;   // frag: crack agudo + corpo grave + rumble
    this._burst(.18, .95, 1800, 0.7);            // crack inicial
    this._burst(.6, .8, 300);                     // corpo
    this._beep('sine', 90, 30, .55, .6);          // rumble grave
    this._beep('sawtooth', 160, 45, .35, .3, .02); }

  vuvuzela(dur = 1.2) { // round start — Brazilian stadium energy
    this.ensure();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [233, 234.5, 232].forEach(f => {
      const o = this._osc('sawtooth', f), g = this.ctx.createGain();
      const fl = this.ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 1200;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + .1);
      g.gain.setValueAtTime(0.12, t + dur - .15);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(fl); fl.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + .05);
    });
  }
  roundWin()  { this.ensure(); [523, 659, 784, 1047].forEach((f, i) => this._beep('square', f, f, .16, .2, i * .13)); }
  roundLose() { this.ensure(); [392, 330, 262].forEach((f, i) => this._beep('square', f, f * .9, .22, .2, i * .16)); }
  matchWin()  { this.ensure(); [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this._beep('square', f, f, .18, .22, i * .14)); this.vuvuzela(1.8); }
}
