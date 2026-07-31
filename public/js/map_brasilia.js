// "Praça dos Três Poderes" — Brasília arena built from Mint-generated building
// models (Congresso, Catedral, Ministério, Palácio) composed with a hand-authored
// competitive layout. Gameplay scaffolding (ground, esplanade, spawns, waypoints,
// cover, colliders) is procedural; the landmarks are real GLB models placed and
// collidered from their actual bounds. Same contract as buildWorld().
import * as THREE from 'three';
import { placeProp } from './mapprops.js';

export function buildBrasilia(scene, T) {
  const colliders = [];   // {minX,minY,minZ,maxX,maxY,maxZ}
  const occluders = [];   // meshes for LOS / bullet raycasts
  const root = new THREE.Group();
  scene.add(root);

  // PBR: era MeshLambertMaterial (chapado). Standard reage ao env map (IBL) e à luz com
  // roughness/metalness — mesmo com map/color, ganha ambiente e sombreamento real.
  const lam = (opts) => new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0.0, ...opts });
  function addBox(w, h, d, mat, x, y, z, opts = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z);
    m.castShadow = opts.cast !== false; m.receiveShadow = true;
    if (opts.ry) m.rotation.y = opts.ry;
    root.add(m);
    if (opts.collide !== false) {
      const pad = opts.pad || 0;
      const ex = opts.ry ? Math.max(w, d) / 2 : w / 2, ez = opts.ry ? Math.max(w, d) / 2 : d / 2;
      colliders.push({ minX: x - ex - pad, maxX: x + ex + pad, minY: y, maxY: y + h, minZ: z - ez - pad, maxZ: z + ez + pad });
      occluders.push(m);
    }
    return m;
  }
  function addPlane(w, h, mat, x, y, z, ry = 0, rx = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.y = ry; m.rotation.x = rx;
    m.receiveShadow = true; root.add(m); return m;
  }
  const col = (minX, maxX, minY, maxY, minZ, maxZ) => colliders.push({ minX, maxX, minY, maxY, minZ, maxZ });
  // Os landmarks têm pegada DERIVADA do GLB (muda com targetH), então nenhum prop pode ter
  // posição fixa "na fé": tudo que é decoração passa por aqui e some se cair dentro de um
  // volume já ocupado. Sem isso um poste nasce dentro do STF quando o modelo muda.
  const freeSpot = (x, z, r = 0.6) => !colliders.some(c =>
    x > c.minX - r && x < c.maxX + r && z > c.minZ - r && z < c.maxZ + r && c.maxY > 0.3);

  /* ---------------- config: kill-switches + degradação por qualidade ---------------- */
  // buildBrasilia só recebe (scene, T), então a qualidade vem do MESMO localStorage que o
  // main.js grava — assim o mapa degrada sozinho sem mudar a assinatura da função (outro
  // agente está editando game.js ao mesmo tempo, não dá pra passar parâmetro novo).
  const QP = new URLSearchParams(location.search);
  let _q = 'med';
  try { _q = JSON.parse(localStorage.getItem('awpbr_settings') || '{}').quality || 'med'; } catch (e) { /* storage bloqueado */ }
  const LOWQ = _q === 'low';
  const DETAIL = QP.get('props') === '0' ? 0 : (LOWQ ? 1 : 2);   // 0=nada, 1=essencial, 2=cheio
  const BIG = QP.get('bigscale') !== '0';   // ?bigscale=0 volta à escala antiga dos landmarks
  const SKY2 = QP.get('sky') !== '0';       // ?sky=0 volta ao céu/luz antigos

  /* ---------------- texturas locais do cerrado (NÃO mexer em textures.js) ------------- */
  // textures.js é do agente GRÁFICOS-CORE; tudo que é específico de Brasília nasce aqui.
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const ctex = (c, rx = 1, ry = 1) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = LOWQ ? 1 : 8;
    return t;
  };
  // BAR §4.1: na seca (mai–set) o gramado do Eixo é PALHA DOURADA com manchas verdes, não
  // verde-esmeralda. E o solo laterítico vermelho aparece onde a grama falhou — é o único
  // vermelho natural da cena.
  function cerradoTex() {
    const c = cvs(512, 512), x = c.getContext('2d');
    x.fillStyle = '#b0a069'; x.fillRect(0, 0, 512, 512);
    const blob = (cols, n, rmin, rmax, a) => {
      for (let i = 0; i < n; i++) {
        const px = Math.random() * 512, py = Math.random() * 512, r = rmin + Math.random() * (rmax - rmin);
        const g = x.createRadialGradient(px, py, 1, px, py, r);
        g.addColorStop(0, cols[(Math.random() * cols.length) | 0]); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.globalAlpha = a; x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
      }
      x.globalAlpha = 1;
    };
    blob(['#8f9455', '#7d8a4a'], 90, 14, 60, 0.55);   // manchas verdes que sobraram
    blob(['#c9b87a', '#d6c68c'], 70, 18, 70, 0.5);    // palha clara queimada de sol
    blob(['#7d6a3f'], 40, 10, 34, 0.45);              // capim seco escuro
    blob(['#9c4a2a', '#8a3f22'], 26, 8, 26, 0.4);     // SOLO LATERÍTICO exposto
    // fiapos de capim, alta frequência (evita o "chapado" a 2 m do chão)
    for (let i = 0; i < 2600; i++) {
      x.strokeStyle = ['rgba(255,240,190,.16)', 'rgba(70,66,40,.18)'][i & 1];
      x.lineWidth = 1; const px = Math.random() * 512, py = Math.random() * 512;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.random() * 5 - 2.5, py + 3 + Math.random() * 4); x.stroke();
    }
    return c;
  }
  // Calçada portuguesa (pedra preta e branca) — o piso que diz "praça brasileira".
  // CALIBRAÇÃO r2 (critério C4): a versão anterior usava preto #2a2a2c sobre branco #e8e4d8
  // com pedra de 3–5 px. Isso é ruído de altíssima frequência E altíssimo contraste; contra
  // esse chão a silhueta do inimigo simplesmente não lê, e o serrilhado aparece já a 10 m.
  // Agora: pedra ~2× maior (o desenho da onda fica legível) e amplitude de L* cortada a ~1/3
  // (escuro #6f6c66 contra claro #c4bfb3, não preto contra branco). Continua sendo pedra
  // portuguesa — só parou de competir com o jogador. Além disso ela sai da lane central e
  // vai só para as calçadas laterais (ver o piso, mais abaixo).
  function portuguesaTex() {
    const S = LOWQ ? 128 : 256;
    const c = cvs(S, S), x = c.getContext('2d');
    const k = S / 256;
    x.fillStyle = '#a9a49a'; x.fillRect(0, 0, S, S);   // argamassa/rejunte, tom médio
    for (let i = 0; i < 1500 * k * k; i++) {
      const px = Math.random() * S, py = Math.random() * S;
      // desenho de ONDA (o padrão clássico do calçadão): faixas senoidais largas
      const band = ((px / S) * 2.5 + Math.sin((py / S) * 6.0) * 0.55) % 1;
      const dark = band < 0.42;
      const j = Math.random() * 18 | 0;
      x.fillStyle = dark ? `rgb(${105 + j},${102 + j},${96 + j})` : `rgb(${190 + j},${185 + j},${175 + j})`;
      const w = (6 + Math.random() * 3) * k;
      x.beginPath(); x.ellipse(px, py, w * 0.5, w * 0.45, Math.random() * 3, 0, 7); x.fill();
    }
    // desgaste: manchas largas e de baixa frequência (quebram o tile sem virar ruído)
    for (let i = 0; i < 26; i++) {
      const px = Math.random() * S, py = Math.random() * S, r = (18 + Math.random() * 46) * k;
      const g = x.createRadialGradient(px, py, 1, px, py, r);
      g.addColorStop(0, i % 3 ? 'rgba(150,145,132,.30)' : 'rgba(96,92,84,.26)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
    }
    return c;
  }
  // Asfalto claro estourado de sol (BAR: "cinza-claro esbranquiçado, faixas desgastadas").
  function asfaltoTex() {
    const c = cvs(256, 256), x = c.getContext('2d');
    x.fillStyle = '#6e6c68'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5000; i++) {
      x.fillStyle = `rgba(${170 + Math.random() * 60 | 0},${168 + Math.random() * 55 | 0},${160 + Math.random() * 50 | 0},${Math.random() * 0.22})`;
      x.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    return c;
  }

  /* ---------------- r2: texturas que matam o "bloco branco chapado" (B6) ---------------- */
  // O concreto de Niemeyer NÃO é liso: é concreto aparente moldado em TÁBUA de madeira, e a
  // marca da forma (faixas horizontais de ~30 cm com veio de madeira e uma linha escura na
  // emenda) fica pra sempre na superfície. Somado a isso: junta de dilatação vertical,
  // escorrimento de chuva descendo de cada junta horizontal e bolha/mancha de cura.
  // Esta textura é NEUTRA de propósito (quase branca) — quem decide se é concreto branco
  // tratado ou concreto cru cinza é o `color` do material.
  function concretoFormaTex() {
    const S = LOWQ ? 256 : 512;
    const c = cvs(S, S), x = c.getContext('2d'), k = S / 512;
    x.fillStyle = '#efece4'; x.fillRect(0, 0, S, S);
    const BW = 64 * k;                              // largura da tábua da forma (~36 cm no mundo)
    for (let b = 0; b * BW < S; b++) {
      const y0 = b * BW;
      // cada tábua tem tom levemente diferente (madeira usada em ordem aleatória na obra)
      x.fillStyle = `rgba(${b % 2 ? 205 : 220},${b % 2 ? 202 : 218},${b % 2 ? 193 : 208},${0.16 + Math.random() * 0.14})`;
      x.fillRect(0, y0, S, BW);
      // veio da madeira impresso no concreto (horizontal, baixa amplitude)
      for (let i = 0; i < 26 * k; i++) {
        x.strokeStyle = `rgba(${140 + Math.random() * 60 | 0},${138 + Math.random() * 58 | 0},${130 + Math.random() * 55 | 0},${0.05 + Math.random() * 0.10})`;
        x.lineWidth = 1; const yy = y0 + Math.random() * BW;
        x.beginPath(); x.moveTo(0, yy); x.bezierCurveTo(S * 0.3, yy + 2, S * 0.7, yy - 2, S, yy); x.stroke();
      }
      // emenda entre tábuas: linha escura fina + rebarba clara logo abaixo
      x.fillStyle = 'rgba(108,110,102,.34)'; x.fillRect(0, y0, S, Math.max(1, 1.6 * k));
      x.fillStyle = 'rgba(255,255,255,.16)'; x.fillRect(0, y0 + 2 * k, S, Math.max(1, 1 * k));
      // ESCORRIMENTO: a água da chuva empoça na emenda e desce levando fuligem. É o sinal de
      // idade nº 1 de fachada de concreto no Brasil (D2 estava em FAIL).
      for (let i = 0; i < 9; i++) {
        const px = Math.random() * S, w = (2 + Math.random() * 9) * k, h = (18 + Math.random() * 120) * k;
        const g = x.createLinearGradient(0, y0, 0, y0 + h);
        g.addColorStop(0, 'rgba(112,120,110,.32)'); g.addColorStop(0.35, 'rgba(120,126,116,.16)'); g.addColorStop(1, 'rgba(120,126,116,0)');
        x.fillStyle = g; x.fillRect(px, y0, w, h);
      }
    }
    // furos dos tirantes da forma (a cada 2 tábuas) — detalhe que só aparece de perto (B5)
    for (let gy = BW; gy < S; gy += BW * 2) for (let gx = 40 * k; gx < S; gx += 96 * k) {
      x.fillStyle = 'rgba(120,120,112,.42)'; x.beginPath(); x.arc(gx, gy + BW * 0.5, 2.4 * k, 0, 7); x.fill();
      const g = x.createLinearGradient(0, gy + BW * 0.5, 0, gy + BW * 0.5 + 26 * k);
      g.addColorStop(0, 'rgba(118,124,112,.26)'); g.addColorStop(1, 'rgba(118,124,112,0)');
      x.fillStyle = g; x.fillRect(gx - 2.4 * k, gy + BW * 0.5, 4.8 * k, 26 * k);
    }
    // junta de DILATAÇÃO vertical (a cada ~2,9 m de mundo) + manchas largas de cura
    x.fillStyle = 'rgba(96,98,92,.40)'; x.fillRect(S * 0.5 - 1.5 * k, 0, 3 * k, S);
    x.fillStyle = 'rgba(255,255,255,.10)'; x.fillRect(S * 0.5 + 1.5 * k, 0, 2 * k, S);
    for (let i = 0; i < 30; i++) {
      const px = Math.random() * S, py = Math.random() * S, r = (30 + Math.random() * 90) * k;
      const g = x.createRadialGradient(px, py, 1, px, py, r);
      g.addColorStop(0, i % 2 ? 'rgba(196,196,186,.22)' : 'rgba(255,255,252,.20)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
    }
    return c;
  }
  // Mármore branco polido (colunata do Planalto/STF): veio cinza suave. Precisa de textura
  // porque roughness 0.25 sem mapa produz UM hotspot especular chapado — exatamente o que a
  // métrica pegou no pior frame do jogo.
  function marmoreTex() {
    const S = LOWQ ? 128 : 256;
    const c = cvs(S, S), x = c.getContext('2d'), k = S / 256;
    x.fillStyle = '#f6f4ee'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 22; i++) {   // veios
      x.strokeStyle = `rgba(${170 + Math.random() * 40 | 0},${168 + Math.random() * 40 | 0},${162 + Math.random() * 40 | 0},${0.08 + Math.random() * 0.14})`;
      x.lineWidth = (0.7 + Math.random() * 2.4) * k;
      const y0 = Math.random() * S;
      x.beginPath(); x.moveTo(-4, y0);
      x.bezierCurveTo(S * 0.3, y0 + (Math.random() - 0.5) * 60 * k, S * 0.7, y0 + (Math.random() - 0.5) * 60 * k, S + 4, y0 + (Math.random() - 0.5) * 40 * k);
      x.stroke();
    }
    for (let i = 0; i < 14; i++) {   // manchas amplas (variação de L* sem alta frequência)
      const px = Math.random() * S, py = Math.random() * S, r = (24 + Math.random() * 70) * k;
      const g = x.createRadialGradient(px, py, 1, px, py, r);
      g.addColorStop(0, 'rgba(214,212,204,.24)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
    }
    return c;
  }
  // Piso de concreto da lane (substitui a pedra portuguesa na linha de tiro, critério C4/C3).
  // ESCURO de propósito: o chão tem que ficar >= 6 pontos de L* abaixo das paredes brancas,
  // senão o inimigo vira silhueta preta sobre fundo claro. Placas de 4 m com junta serrada,
  // remendo, mancha de óleo e desgaste — variação BAIXA frequência, que é o que C4 permite.
  function pisoConcTex() {
    const S = LOWQ ? 256 : 512;
    const c = cvs(S, S), x = c.getContext('2d'), k = S / 512;
    x.fillStyle = '#7d7a72'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 3200 * k * k; i++) {   // agregado fino (micro-detalhe p/ B5)
      const v = 90 + Math.random() * 90 | 0;
      x.fillStyle = `rgba(${v},${v - 2},${v - 8},${Math.random() * 0.16})`;
      x.fillRect(Math.random() * S, Math.random() * S, 2 * k, 2 * k);
    }
    for (let i = 0; i < 34; i++) {   // manchas de cura / remendo (quebram o tile, B2)
      const px = Math.random() * S, py = Math.random() * S, r = (26 + Math.random() * 96) * k;
      const g = x.createRadialGradient(px, py, 1, px, py, r);
      g.addColorStop(0, i % 3 ? 'rgba(150,146,136,.22)' : 'rgba(70,68,62,.24)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
    }
    // junta serrada nas bordas do tile (o tile mede 4 m no mundo = placa de concreto real)
    x.fillStyle = 'rgba(58,56,52,.55)'; x.fillRect(0, 0, S, 3 * k); x.fillRect(0, 0, 3 * k, S);
    x.fillStyle = 'rgba(255,255,255,.10)'; x.fillRect(0, 3 * k, S, 2 * k); x.fillRect(3 * k, 0, 2 * k, S);
    // trinca fina saindo da junta + sujeira acumulada nela
    for (let i = 0; i < 5; i++) {
      x.strokeStyle = 'rgba(52,50,46,.42)'; x.lineWidth = 1.2 * k;
      let px = Math.random() * S, py = 3 * k;
      x.beginPath(); x.moveTo(px, py);
      for (let s = 0; s < 6; s++) { px += (Math.random() - 0.5) * 26 * k; py += (14 + Math.random() * 26) * k; x.lineTo(px, py); }
      x.stroke();
    }
    return c;
  }
  // Alpha de folhagem/flor de ipê para billboard cruzado — massa irregular de flor amarela.
  function florIpeTex() {
    const S = LOWQ ? 128 : 256;
    const c = cvs(S, S), x = c.getContext('2d');
    const tones = ['#f4cf2e', '#e8b81a', '#f7dc63', '#c9930d', '#ffe98a'];
    for (let i = 0; i < 340; i++) {
      // cachos concentrados no centro, esgarçando na borda -> silhueta recortada, não hexágono
      const a = Math.random() * Math.PI * 2, rr = Math.pow(Math.random(), 0.62) * S * 0.47;
      const px = S / 2 + Math.cos(a) * rr, py = S / 2 + Math.sin(a) * rr * 0.92;
      x.fillStyle = tones[(Math.random() * tones.length) | 0];
      x.globalAlpha = 0.75 + Math.random() * 0.25;
      const r = (S / 256) * (5 + Math.random() * 11) * (1 - rr / (S * 0.62));
      x.beginPath(); x.arc(px, py, Math.max(1.5, r), 0, 7); x.fill();
    }
    x.globalAlpha = 1;
    for (let i = 0; i < 26; i++) {   // galhinho escuro aparecendo entre as flores
      x.strokeStyle = 'rgba(74,58,40,.75)'; x.lineWidth = 1 + Math.random() * 2;
      const a = Math.random() * Math.PI * 2;
      x.beginPath(); x.moveTo(S / 2, S * 0.62);
      x.lineTo(S / 2 + Math.cos(a) * S * 0.36, S * 0.62 + Math.sin(a) * S * 0.3); x.stroke();
    }
    return c;
  }
  // Tufo de mato — vai nas rachaduras e no pé do meio-fio (D2: "mato em rachadura").
  function matoTex() {
    const S = 64;
    const c = cvs(S, S), x = c.getContext('2d');
    for (let i = 0; i < 40; i++) {
      const bx2 = 8 + Math.random() * 48, h = 22 + Math.random() * 38;
      x.strokeStyle = ['#5d6b34', '#77843f', '#8d8a4a', '#4a5a2c'][(Math.random() * 4) | 0];
      x.lineWidth = 1 + Math.random() * 1.6;
      x.beginPath(); x.moveTo(bx2, S);
      x.quadraticCurveTo(bx2 + (Math.random() - 0.5) * 14, S - h * 0.6, bx2 + (Math.random() - 0.5) * 26, S - h);
      x.stroke();
    }
    return c;
  }

  // Tinta de sinalização DESGASTADA: faixa de pedestre e seta apagam onde o pneu passa.
  // Tinta branca 100% opaca e inteira é o "recém-construído" que o D2 reprova.
  function faixaTex() {
    const c = cvs(64, 128), x = c.getContext('2d');
    x.fillStyle = '#e6e3d8'; x.fillRect(0, 0, 64, 128);
    x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 70; i++) {   // buracos de desgaste, maiores no meio (trilha do pneu)
      const px = Math.random() * 64, py = Math.random() * 128;
      const r = (1 + Math.random() * 7) * (1 - Math.abs(py - 64) / 90);
      x.globalAlpha = 0.35 + Math.random() * 0.6;
      x.beginPath(); x.arc(px, py, Math.max(0.6, r), 0, 7); x.fill();
    }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    return c;
  }
  // Mancha de óleo / escorrimento no piso — decal solto que quebra a leitura do tile (B2/B4).
  function manchaTex() {
    const c = cvs(128, 128), x = c.getContext('2d');
    for (let i = 0; i < 16; i++) {
      const px = 24 + Math.random() * 80, py = 24 + Math.random() * 80, r = 12 + Math.random() * 34;
      const g = x.createRadialGradient(px, py, 1, px, py, r);
      g.addColorStop(0, `rgba(${30 + Math.random() * 40 | 0},${28 + Math.random() * 36 | 0},${24 + Math.random() * 30 | 0},${0.30 + Math.random() * 0.35})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
    }
    return c;
  }
  // Placa de sinalização OFICIAL brasileira (D4: "sinalização oficial em Brasília"): placa
  // indicativa verde do DNIT, letra branca em caixa alta, seta. Nada de fonte decorativa.
  function placaTex(txt) {
    const c = cvs(512, 128), x = c.getContext('2d');
    x.fillStyle = '#1d6b3f'; x.fillRect(0, 0, 512, 128);
    x.strokeStyle = '#f2f2ee'; x.lineWidth = 5; x.strokeRect(9, 9, 494, 110);
    x.fillStyle = '#f2f2ee'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = 'bold 44px sans-serif'; x.fillText(txt, 246, 62);
    x.beginPath(); x.moveTo(430, 62); x.lineTo(470, 62); x.lineTo(458, 48);   // seta
    x.moveTo(470, 62); x.lineTo(458, 76); x.lineWidth = 6; x.strokeStyle = '#f2f2ee'; x.stroke();
    // sujeira de chuva escorrendo da moldura (a placa está lá desde os anos 60)
    for (let i = 0; i < 26; i++) {
      const px = Math.random() * 512, h = 10 + Math.random() * 60;
      const g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(20,26,20,.28)'); g.addColorStop(1, 'rgba(20,26,20,0)');
      x.fillStyle = g; x.fillRect(px, 0, 2 + Math.random() * 5, h);
    }
    return c;
  }

  /* ---------------- TRIPLANAR: o conserto de raiz do B6 ---------------- */
  // Os landmarks são GLB do Mint com UV desconhecido (e às vezes degenerado), e as caixas
  // procedurais são BoxGeometry, onde uma face de 13 × 11 m recebe UM tile esticado. Nos dois
  // casos o resultado é o mesmo: parede branca lisa. Projetar a textura pelo MUNDO (triplanar)
  // resolve os dois de uma vez e ainda garante texel density constante (B3) em qualquer
  // superfície, inclusive nas inclinadas do Panteão. `?tri=0` volta ao mapeamento por UV.
  const TRI = QP.get('tri') !== '0';
  function triplanar(mat, tex, scale) {
    mat.map = tex;   // fallback por UV se o patch de shader for desligado
    if (!TRI) return mat;
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTriScale = { value: scale };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vTriP;\nvarying vec3 vTriN;')
        .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
  vec4 triWP = vec4( transformed, 1.0 );
  vec3 triON = objectNormal;
  #ifdef USE_INSTANCING
    triWP = instanceMatrix * triWP;
    triON = mat3( instanceMatrix ) * triON;
  #endif
  triWP = modelMatrix * triWP;
  vTriP = triWP.xyz;
  vTriN = normalize( mat3( modelMatrix ) * triON );`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uTriScale;\nvarying vec3 vTriP;\nvarying vec3 vTriN;\nfloat gTriL;')
        .replace('#include <map_fragment>', `
  vec3 triW = pow( abs( vTriN ), vec3( 4.0 ) );
  triW /= max( 1e-4, triW.x + triW.y + triW.z );
  vec4 triC = texture2D( map, vTriP.zy * uTriScale ) * triW.x
            + texture2D( map, vTriP.xz * uTriScale ) * triW.y
            + texture2D( map, vTriP.xy * uTriScale ) * triW.z;
  gTriL = triC.g;
  diffuseColor *= triC;`)
        // O hotspot especular chapado morre aqui: a rugosidade passa a variar com a sujeira.
        // Escorrimento (pixel escuro) = superfície selada/mais lisa; concreto limpo = mais fosco.
        .replace('#include <roughnessmap_fragment>',
          'float roughnessFactor = clamp( roughness * ( 0.62 + 0.62 * gTriL ), 0.04, 1.0 );');
    };
    mat.customProgramCacheKey = () => 'briTri' + scale.toFixed(4);
    return mat;
  }

  /* ---------------- os QUATRO brancos de Brasília (BAR §4.1) ---------------- */
  // "Branco não é um branco só": mármore polido, concreto branco tratado, concreto aparente
  // cru e granito preto nas bases. Usar um material só é o erro que apaga a informação.
  // Texturas compartilhadas: uma instância só, reaproveitada por todos os materiais de
  // concreto (o triplanar é que decide a escala, então não precisa de clone por objeto).
  const TX_FORMA = ctex(concretoFormaTex()), TX_MARM = ctex(marmoreTex());
  const MAT = {
    // r2: mármore GANHOU MAPA. Sem mapa, roughness 0.25 = um único hotspot especular
    // chapado — foi literalmente o que a métrica B6 marcou no pior frame do jogo.
    marmore: triplanar(lam({ color: 0xe9e7de, roughness: 0.30, metalness: 0.02 }), TX_MARM, 0.55),
    // Concreto branco TRATADO: fosco, com marca de forma e escorrimento nas juntas.
    concBranco: triplanar(lam({ color: 0xdedcd2, roughness: 0.88 }), TX_FORMA, 0.34),
    // Concreto aparente CRU (Panteão): mesma marca de forma, mas cinza e mais rugoso —
    // o contraste com o branco polido é o assunto do edifício.
    concCru: triplanar(lam({ color: 0x93938c, roughness: 0.96 }), TX_FORMA, 0.42),
    // granito preto tem veio também; sem mapa ele vira outro plano chapado (escuro, mas chapado)
    granitoPreto: triplanar(lam({ color: 0x33353a, roughness: 0.42, metalness: 0.05 }), TX_MARM, 0.9),
    corten: lam({ color: 0x7a4a32, roughness: 0.7, metalness: 0.5 }),             // mastro
    vidroFume: lam({ color: 0x2b3237, roughness: 0.14, metalness: 0.55 }),        // fachadas dos ministérios
    aco: lam({ color: 0x9aa0a6, roughness: 0.5, metalness: 0.6 }),
    pintBranca: lam({ color: 0xdedbd2, roughness: 0.7 }),
    asfalto: lam({ map: ctex(asfaltoTex(), 8, 40), roughness: 0.95 }),
    agua: lam({ color: 0x2f6ea0, roughness: 0.06, metalness: 0.35, transparent: true, opacity: 0.88 }),
    bronze: lam({ color: 0x5d6b4e, roughness: 0.55, metalness: 0.45 }),           // pátina verde-escura
  };
  const invis = new THREE.MeshBasicMaterial({ visible: false });
  // Materiais r2: piso da lane, mato de rachadura e as três massas de flor do ipê.
  const TX_PISO = ctex(pisoConcTex(), 1, 1);
  MAT.pisoConc = lam({ map: tiledLocal(TX_PISO, 3, 60), color: 0xc6c3ba, roughness: 0.94 });
  MAT.pisoCalcada = lam({ map: ctex(portuguesaTex(), 1.4, 84), color: 0xb6b2a8, roughness: 0.9 });
  // Guia/meio-fio e props pequenos: triplanar de escala fina (tile ~85 cm) — assim uma peça
  // de 1,5 m recebe textura na densidade certa em vez de 60 tiles espremidos.
  MAT.guia = triplanar(lam({ color: 0xc9c6bb, roughness: 0.92 }), TX_FORMA, 1.18);
  MAT.mato = lam({ map: ctex(matoTex(), 1, 1), transparent: false, alphaTest: 0.42, side: THREE.DoubleSide, roughness: 1 });
  MAT.florIpe = [0xf0c81e, 0xd9a712, 0xfadb5c].map(c => lam({ color: c, roughness: 0.86, emissive: 0x1e1600 }));
  MAT.folhaIpe = lam({ map: ctex(florIpeTex(), 1, 1), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.88, emissive: 0x1a1200 });
  MAT.tintaGasta = lam({ map: ctex(faixaTex(), 1, 1), transparent: true, roughness: 0.85, depthWrite: false });
  MAT.mancha = lam({ map: ctex(manchaTex(), 1, 1), transparent: true, opacity: 0.9, roughness: 0.9, depthWrite: false });
  function tiledLocal(tex, rx, ry) { const t = tex.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.needsUpdate = true; return t; }
  // Reveste um GLB do Mint com um dos nossos materiais. Os GLB de arquitetura vêm com UM
  // material só (branco, roughness 1 do default do glTF) para o prédio inteiro — é a origem
  // direta do "bloco branco liso". Com triplanar o UV do GLB deixa de importar.
  function dressGLB(o, mat) { if (o) o.traverse(m => { if (m.isMesh) m.material = mat; }); return o; }

  // InstancedMesh helper: um draw call por família de prop repetido (postes, cones, grades…).
  const _m4 = new THREE.Matrix4(), _qt = new THREE.Quaternion(), _eu = new THREE.Euler(), _v3 = new THREE.Vector3(1, 1, 1);
  function addInst(geo, mat, list, { occlude = false, shadow = true } = {}) {
    if (!list.length) return null;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((t, i) => {
      _eu.set(t.rx || 0, t.ry || 0, t.rz || 0); _qt.setFromEuler(_eu);
      _v3.set(t.sx || 1, t.sy || 1, t.sz || 1);
      _m4.compose(new THREE.Vector3(t.x, t.y, t.z), _qt, _v3);
      im.setMatrixAt(i, _m4);
    });
    im.instanceMatrix.needsUpdate = true;
    im.castShadow = shadow && !LOWQ; im.receiveShadow = true;
    root.add(im);
    if (occlude) occluders.push(im);   // InstancedMesh é Mesh: entra no raycast de bala
    return im;
  }
  // Caixa invisível de colisão de BALA/LOS. Os landmarks são GLB (Group) e o raycast do
  // jogo é NÃO-recursivo (game.js intersectObjects(..., false)) — sem isso a bala atravessa
  // o Congresso inteiro. Mesmo truque já usado no ônibus.
  function occBox(w, h, d, x, y, z, ry = 0) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), invis);
    b.position.set(x, y + h / 2, z); b.rotation.y = ry; root.add(b); occluders.push(b);
    return b;
  }

  // Place a Mint building GLB, normalized to targetH metres, and derive a footprint
  // collider from its real placed bounds. Returns the object (or null if not loaded).
  function putBuilding(id, { x, z, targetH, ry = 0, solid = true, y = 0, occ = true, dress = null }) {
    const o = placeProp(id, { x, z, targetH, ry, y });
    if (!o) return null;
    if (dress) dressGLB(o, dress);
    root.add(o); occluders.push(o);
    o.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(o);
    if (solid) col(bb.min.x, bb.max.x, y, Math.max(1, bb.max.y), bb.min.z, bb.max.z);
    // O GLB é um Group e o raycast de bala/LOS do game.js é NÃO-recursivo — sem uma caixa
    // MESH invisível a bala atravessa o prédio inteiro (mesmo bug já corrigido no ônibus).
    // Sem isso não existe "cobertura" nenhuma nos ângulos longos da Esplanada.
    if (occ) occBox(bb.max.x - bb.min.x, Math.max(0.4, bb.max.y - bb.min.y),
      bb.max.z - bb.min.z, (bb.min.x + bb.max.x) / 2, bb.min.y, (bb.min.z + bb.max.z) / 2);
    return o;
  }

  /* ---------------- ground + esplanade ---------------- */
  // Tile the textures (clone + RepeatWrapping) so big surfaces show real detail
  // instead of one blurry stretched image.
  const tiled = (tex, rx, ry) => {
    const t = tex.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.needsUpdate = true; return t;
  };
  // Medimos ANTES de desenhar o chão: a pegada real do bloco de ministério define onde
  // ficam as pistas do Eixo (elas passam POR FORA dos ministérios, como no real).
  const MIN_H = BIG ? 22 : 7;          // 8-10 pavimentos ≈ 22 m (era 7 m = casinha)
  const PILOTI = BIG ? 4.8 : 0;        // os blocos reais são VAZADOS por baixo (pilotis)
  const LANE_HX = 24;                  // face interna dos ministérios = parede da lane
  let MW = 26, MD = 14;                // fallback se o GLB não carregou
  {
    const probe = placeProp('ministerio', { x: 0, z: 0, targetH: MIN_H, ry: Math.PI / 2 });
    if (probe) {
      probe.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(probe);
      MW = Math.max(6, bb.max.x - bb.min.x); MD = Math.max(6, bb.max.z - bb.min.z);
    }
  }
  const MIN_CX = LANE_HX + MW / 2;                 // centro do bloco (face interna em ±24)
  const ROAD_IN = LANE_HX + MW + 5, ROAD_W = 21;   // 6 faixas por sentido, por fora dos blocos

  // Chão: gramado do cerrado NA SECA (palha dourada), não verde-esmeralda (BAR §4.1 / gap B1).
  // Plano maior (420×460) porque a escala nova joga os landmarks pra 130 m.
  const cerrado = ctex(cerradoTex(), 54, 60);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 460), lam({ map: cerrado, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
  // PISO DA LANE (r2 — regressão C4). A rodada 1 colocou pedra portuguesa nos 12 m centrais,
  // ou seja, EXATAMENTE na linha de tiro principal: padrão de altíssima frequência e alto
  // contraste bem atrás do bot no crosshair. A pedra é certa pro lugar, errada pra banda de
  // 0–2 m. Agora a lane é CONCRETO ESCURO com placa de 4 m e junta serrada (variação de
  // baixa frequência, que é o que C4 permite) e a portuguesa migra pras calçadas laterais.
  // O concreto também é o que garante C3: chão bem abaixo do L* das paredes brancas.
  addPlane(12.4, 240, MAT.pisoConc, 0, 0.03, 0, 0, -Math.PI / 2);
  // Calçadas de PEDRA PORTUGUESA nas laterais (fora dos meio-fios, |x| entre 6,2 e 10,4).
  // Continua sendo a praça brasileira — só saiu de dentro do duelo.
  for (const sx of [-1, 1])
    addPlane(4.2, 240, MAT.pisoCalcada, sx * 8.3, 0.028, 0, 0, -Math.PI / 2);
  // Faixa de concreto sob os pilotis (a "calçada" dos ministérios) + meio-fio.
  for (const sx of [-1, 1]) {
    addPlane(MW + 10, 240, lam({ map: tiled(T.concreteDark, 4, 80), roughness: 0.9 }),
      sx * (LANE_HX + MW / 2 - 1), 0.02, 0, 0, -Math.PI / 2);
    // Eixo Monumental: 250 m de largura no total — as pistas asfaltadas por fora dos blocos.
    addPlane(ROAD_W, 300, MAT.asfalto, sx * (ROAD_IN + ROAD_W / 2), 0.04, 0, 0, -Math.PI / 2);
  }
  // Faixas brancas tracejadas das pistas (InstancedMesh: 1 draw call pro Eixo inteiro).
  if (DETAIL > 0) {
    const dashes = [];
    for (const sx of [-1, 1]) for (let li = 1; li < 6; li++) {
      const lx = sx * (ROAD_IN + (ROAD_W / 6) * li);
      for (let z = -140; z <= 140; z += 9) dashes.push({ x: lx, y: 0.06, z, rx: -Math.PI / 2 });
    }
    // tinta DESGASTADA (r2/D2): a faixa da pista não é branca inteira, ela apaga na trilha do pneu
    addInst(new THREE.PlaneGeometry(0.18, 4.5), MAT.tintaGasta, dashes, { shadow: false });
  }

  /* ---------------- LANDMARKS (Mint building models) ---------------- */
  // Congresso Nacional at the NORTH end (towers + Senate dome + Chamber bowl).
  // ry = π: towers BEHIND the tray, Senate dome (convex) left, Chamber bowl right —
  // the postcard view from the esplanade (verified in mapeval).
  // ESCALA (gap B2): as torres reais têm ~100 m. A 22 m o Congresso lia como pavilhão de
  // feira e a "monumentalidade esmagadora" — que é O assunto de Brasília — sumia. 55 m a
  // 130 m de distância devolve o cartão-postal sem invadir o campo de jogo.
  const CONG_H = BIG ? 55 : 22, CONG_Z = BIG ? 152 : 78;
  putBuilding('congresso', { x: 0, z: CONG_Z, targetH: CONG_H, ry: Math.PI, dress: MAT.concBranco });
  // Catedral (crown) at the SOUTH end + stained glass BETWEEN the ribs (the Mint model
  // has no glass). The glass profile is fitted 0.3–0.5m INSIDE the measured rib envelope
  // (ribs run r≈10.3 @ base → r≈3.4 @ rim y≈9.5, see tools: measure-catedral) so the
  // white ribs stay visible outside the glass, like the real Niemeyer crown.
  // Catedral: 40 m no real. 30 m recuada a -108 (era 13 m a -76, "minúscula no fundo").
  const CAT_H = BIG ? 30 : 13, CAT_Z = BIG ? -108 : -76, CAT_S = CAT_H / 13;
  putBuilding('catedral', { x: 0, z: CAT_Z, targetH: CAT_H, ry: 0, occ: false, dress: MAT.concBranco });   // cone: AABB bloquearia bala nos cantos
  {
    // O perfil do vitral foi medido pra targetH 13; escala junto com a coroa (CAT_S).
    const profile = [[9.6, 0.3], [9.35, 1], [8.35, 2], [7.3, 3], [6.3, 4], [4.6, 5],
      [4.1, 6], [3.5, 7], [3.35, 8], [3.2, 9.2]]
      .map(([r, y]) => new THREE.Vector2(r * CAT_S, y * CAT_S));
    const glassGeo = new THREE.LatheGeometry(profile, 28);
    const glassMat = new THREE.MeshLambertMaterial({
      color: 0x2e6f9e, emissive: 0x0a2440, transparent: true, opacity: 0.55,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 0, CAT_Z); root.add(glass);
  }
  // Palácio do Planalto (east) + STF (west) framing the Praça, facing inward. Like the
  // REAL Planalto, the pilotis stand IN a shallow reflecting pool — the water grounds
  // the cantilevered roof so it no longer reads as floating. Plinth slab + water on top.
  // Layout da Esplanada calculado a partir da pegada REAL do bloco (o GLB muda de proporção
  // quando a altura sobe pra 22 m): espaçamento e nº de blocos derivam de MD, não hard-coded.
  const MSP = Math.max(MD + 6, 26);
  const MN = Math.max(2, Math.min(4, Math.floor(96 / MSP) + 1));
  const MZ = []; for (let i = 0; i < MN; i++) MZ.push(-30 + (i - (MN - 1) / 2) * MSP);
  // O Z do Planalto/STF é DERIVADO da última fileira de ministérios (a pegada do GLB muda
  // com a altura) — hard-coded, os volumes se atravessavam quando o bloco ficava mais fundo.
  const PAL_Z = BIG ? Math.max(50, MZ[MN - 1] + MD / 2 + 16) : 30;
  // PAL_H=10 (não 14): o GLB do palácio tem planta QUADRADA 3,55:1 — a 14 m ele viraria um
  // bloco de 50 × 50 m que engolia os spawns do norte. 10 m mantém a leitura e o campo livre.
  const PAL_X = BIG ? 29 : 22, PAL_H = BIG ? 10 : 6;
  let PAL_ZMAX = PAL_Z + 10;   // borda norte real da Praça, medida (usada pelos marcos)

  for (const px of [PAL_X, -PAL_X]) {
    const ry = px > 0 ? -Math.PI / 2 : Math.PI / 2;
    const PL = BIG ? 1.2 : 0.35;   // plataforma elevada (o STF real fica sobre plataforma)
    const probe = placeProp('palacio', { x: px, z: PAL_Z, targetH: PAL_H, ry });
    if (probe) {
      probe.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(probe);
      const pw = (bb.max.x - bb.min.x) + 2.4, pd = (bb.max.z - bb.min.z) + 2.4;
      const pcx = (bb.min.x + bb.max.x) / 2, pcz = (bb.min.z + bb.max.z) / 2;
      PAL_ZMAX = Math.max(PAL_ZMAX, bb.max.z + 1.2);
      // base em GRANITO PRETO (BAR: granito preto em bases e soleiras) + soleira de mármore
      addBox(pw, PL, pd, MAT.granitoPreto, pcx, 0, pcz, { collide: false });
      addBox(pw - 0.6, 0.12, pd - 0.6, MAT.marmore, pcx, PL, pcz, { collide: false });
      // espelho d'água raso sobre a plataforma (a assinatura do Planalto real)
      addPlane(pw - 1.6, pd - 1.6, MAT.agua, pcx, PL + 0.14, pcz, 0, -Math.PI / 2);
      const b = placeProp('palacio', { x: px, z: PAL_Z, targetH: PAL_H, ry, y: PL + 0.16 });
      if (b) {
        // ORIGEM DO PIOR FRAME DO JOGO: este GLB é UMA malha com UM material branco liso, e
        // a 10 m de altura por ~35 m de lado ele vira uma parede de 45% do frame com desvio
        // de L* zero (B6 = 67,3). Reveste com concreto de marca de forma (triplanar) e, logo
        // abaixo, quebra o plano com brise vertical, faixa de vidro e embasamento de granito.
        dressGLB(b, MAT.concBranco);
        root.add(b); occluders.push(b);
        b.updateMatrixWorld(true);
        const bb2 = new THREE.Box3().setFromObject(b);
        col(bb2.min.x, bb2.max.x, 0, Math.max(1, bb2.max.y), bb2.min.z, bb2.max.z);
        occBox(bb2.max.x - bb2.min.x, bb2.max.y - PL, bb2.max.z - bb2.min.z,
          (bb2.min.x + bb2.max.x) / 2, PL, (bb2.min.z + bb2.max.z) / 2);
        // COLUNATA CURVA DE MÁRMORE BRANCO POLIDO (roughness .25) — é o elemento que
        // Niemeyer descreve e o que diferencia Planalto/STF de "caixa de vidro genérica".
        if (BIG && DETAIL > 0) {
          const sgn = px > 0 ? -1 : 1;                     // colunata na face virada pra lane
          const cfx = (px > 0 ? bb2.min.x : bb2.max.x) + sgn * 0.9;
          const nc = LOWQ ? 5 : 9, cz0 = bb2.min.z + 1.5, cstep = (bb2.max.z - bb2.min.z - 3) / (nc - 1);
          const cols = [];
          for (let i = 0; i < nc; i++) cols.push({ x: cfx, y: PL + 0.16, z: cz0 + i * cstep });
          addInst(new THREE.CylinderGeometry(0.28, 0.85, PAL_H * 0.82, 8, 1, false), MAT.marmore,
            cols.map(c => ({ ...c, y: c.y + PAL_H * 0.41 })), { occlude: true });
        }
        // QUEBRA DE PLANO (r2). Nenhuma textura salva uma parede de 35 × 10 m sem relevo:
        // o que faz uma fachada modernista brasileira ler é a sombra própria do brise e da
        // laje de coroamento. Aqui entram os QUATRO materiais que o BAR pede na mesma
        // fachada — granito preto no embasamento, vidro fumê na faixa, mármore no brise e
        // na cornija, concreto de forma no fundo — em vez de "um branco só".
        if (BIG && DETAIL > 0) {
          const y0 = bb2.min.y, y1 = bb2.max.y, HH = Math.max(2, y1 - y0);
          const x0 = bb2.min.x, x1 = bb2.max.x, z0 = bb2.min.z, z1 = bb2.max.z;
          const W = x1 - x0, D = z1 - z0;
          // embasamento de granito preto: a "linha de terra" do edifício. Também é o
          // gradiente de contato que faltava na junção parede–chão (critério A1).
          addBox(W + 0.5, 0.95, D + 0.5, MAT.granitoPreto, (x0 + x1) / 2, y0 - 0.02, (z0 + z1) / 2, { collide: false, cast: false });
          // laje de coroamento em mármore, com balanço de 1,3 m (cobre a colunata, como no
          // Planalto real) -> sombra dura e horizontal no topo da
          // fachada ao meio-dia (é essa faixa escura que mata o "chapado" no frame).
          addBox(W + 2.6, 0.60, D + 2.6, MAT.marmore, (x0 + x1) / 2, y1 - 0.38, (z0 + z1) / 2, { collide: false });
          // faixa de VIDRO FUMÊ na altura do peitoril: caixa escura entre lajes brancas.
          const gy = y0 + HH * 0.52, gh = HH * 0.34;
          for (const [fw, fx, fz, fry] of [[D - 1.2, x0 - 0.06, (z0 + z1) / 2, -Math.PI / 2],
            [D - 1.2, x1 + 0.06, (z0 + z1) / 2, Math.PI / 2],
            [W - 1.2, (x0 + x1) / 2, z0 - 0.06, Math.PI], [W - 1.2, (x0 + x1) / 2, z1 + 0.06, 0]])
            addPlane(fw, gh, MAT.vidroFume, fx, gy, fz, fry);
          // brise vertical de mármore nas quatro faces (o "quebra-sol" de Niemeyer).
          const finsX = [], finsZ = [], step = LOWQ ? 4.2 : 2.6;
          const finH = Math.max(1.2, HH - 1.7), finY = y0 + 0.95 + finH / 2;   // o brise NASCE em cima do embasamento
          for (let t = step * 0.5; t < D - 0.4; t += step) {
            finsX.push({ x: x0 - 0.28, y: finY, z: z0 + t });
            finsX.push({ x: x1 + 0.28, y: finY, z: z0 + t });
          }
          for (let t = step * 0.5; t < W - 0.4; t += step) {
            finsZ.push({ x: x0 + t, y: finY, z: z0 - 0.28 });
            finsZ.push({ x: x0 + t, y: finY, z: z1 + 0.28 });
          }
          addInst(new THREE.BoxGeometry(0.62, finH, 0.30), MAT.marmore, finsX, { occlude: false });
          addInst(new THREE.BoxGeometry(0.30, finH, 0.62), MAT.marmore, finsZ, { occlude: false });
        }
        // (o poster do Dollynho saiu do Palácio do Planalto — agora vai só nas fachadas
        //  dos ministérios, abaixo; o Planalto fica limpo, como na Brasília real)
      }
    }
  }
  // Ministérios lining the esplanade (reuse the one slab, long axis along Z = lane walls).
  // Agora com 22 m e SOBRE PILOTIS: o bloco real é vazado por baixo, e isso vira a rota de
  // flanco que faltava (o mapa era um corredor reto). Colisão só nos pilares.
  const ministries = [];
  const pilCols = [];
  for (const sx of [-1, 1]) for (const mz of MZ) {
    const b = putBuilding('ministerio', { x: sx * MIN_CX, z: mz, targetH: MIN_H, ry: Math.PI / 2, y: PILOTI, solid: !BIG, occ: false, dress: MAT.concBranco });
    ministries.push(b);
    if (!b) continue;
    b.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(b);
    const w = bb.max.x - bb.min.x, d = bb.max.z - bb.min.z;
    const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
    occBox(w, bb.max.y - PILOTI, d, cx, PILOTI, cz);   // bala/LOS só a partir do piloti
    if (!BIG) continue;
    // laje inferior (fecha o vão por baixo e dá sombra dura de meio-dia no piso)
    addBox(w, 0.9, d, MAT.concBranco, cx, PILOTI - 0.9, cz, { collide: false });
    // vidro fumê na fachada: o gerador de contraste da Esplanada (caixa escura entre lajes)
    for (const fs of [-1, 1]) addPlane(d - 1.6, MIN_H - 2.4, MAT.vidroFume,
      cx + fs * (w / 2 + 0.05), PILOTI + MIN_H / 2, cz, fs > 0 ? Math.PI / 2 : -Math.PI / 2);
    // pilares: grade 3 (X) × N (Z). Viram COVER dentro da passagem de flanco.
    const nz = Math.max(3, Math.round(d / 7));
    for (let i = 0; i < 3; i++) for (let j = 0; j < nz; j++) {
      const px2 = cx + (i - 1) * (w / 2 - 1.4), pz2 = cz + (j - (nz - 1) / 2) * ((d - 3) / (nz - 1));
      pilCols.push({ x: px2, y: PILOTI / 2, z: pz2 });
      col(px2 - 0.55, px2 + 0.55, 0, PILOTI, pz2 - 0.55, pz2 + 0.55);
    }
  }
  if (pilCols.length) addInst(new THREE.CylinderGeometry(0.5, 0.55, PILOTI, 8), MAT.concBranco, pilCols, { occlude: true });

  /* ---------------- statues ---------------- */
  { // A Justiça — Mint GLB v2 (blindfolded, sword across the lap, Brazil flag draped as a
    // sash — matches the real reference). The flag is baked into the mesh now; we only add
    // the small "PERDEU, MANÉ" graffiti on the chest (Mint can't render reliable text).
    // Fica EM FRENTE AO STF (lado oeste da Praça), como a real — antes estava solta no meio
    // da lane, sem relação com nenhum edifício.
    const sx = BIG ? -9 : -11, sz = BIG ? 26 : 22;   // out in the open facing the lane (+X)
    const o = placeProp('justica', { x: sx, z: sz, targetH: 3.6, ry: Math.PI / 2 });
    if (o) {
      root.add(o); occluders.push(o); col(sx - 1, sx + 1, 0, 3.6, sz - 1, sz + 1);
      // small "PERDEU MANÉ" graffiti decal on the chest (statue front faces +X, chest
      // surface measured by raycast at x≈-11.1), clear of the sash
      addPlane(0.6, 0.4, lam({ map: T.perdeuMane, transparent: true, side: THREE.DoubleSide }),
        sx - 0.04, 2.35, sz + 0.05, Math.PI / 2);
    }
  }
  { // Os Guerreiros — procedural bronze monument (Mint mesher failed on it twice)
    // BAR: Bruno Giorgi 1959, duas figuras de ~8 m, pátina VERDE-ESCURA (não marrom-mostarda
    // como estava) sobre base baixa de GRANITO. É a silhueta que identifica a praça de longe,
    // então cresce de 5,6 m -> 8,4 m junto com o resto da escala.
    const bx = BIG ? 8 : 6, bz = BIG ? 24 : 40, S = BIG ? 1.5 : 1;
    const bronze = MAT.bronze;
    const g = new THREE.Group(); g.position.set(bx, 0, bz); root.add(g); occluders.push(g);
    const ped = new THREE.Mesh(new THREE.BoxGeometry(2.6 * S, 0.5, 1.7 * S), MAT.granitoPreto);
    ped.position.y = 0.25; ped.receiveShadow = true; g.add(ped);
    for (const dx of [-0.55 * S, 0.55 * S]) {
      const sgn = dx > 0 ? 1 : -1;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13 * S, 0.5 * S, 4.7 * S, 6), bronze);
      body.position.set(dx, 2.85 * S, 0); body.castShadow = true; g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3 * S, 8, 6), bronze);
      head.position.set(dx, 5.25 * S, 0); head.castShadow = true; g.add(head);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * S, 0.1 * S, 2.2 * S, 5), bronze);
      arm.position.set(dx + sgn * 0.5 * S, 4.7 * S, 0); arm.rotation.z = -sgn * 0.9; g.add(arm);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * S, 0.035 * S, 3.6 * S, 4), bronze);
      pole.position.set(dx + sgn * 1.05 * S, 5.6 * S, 0); pole.rotation.z = -sgn * 0.18; pole.castShadow = true; g.add(pole);
    }
    col(bx - 1.5 * S, bx + 1.5 * S, 0, 5.6 * S, bz - 1 * S, bz + 1 * S);
    occBox(2.8 * S, 5.8 * S, 1.9 * S, bx, 0, bz);
  }

  /* ---------------- praça furniture ---------------- */
  // MASTRO ESPECIAL DA PRAÇA DOS TRÊS PODERES — Sérgio Bernardes (gap B3).
  // Era um cano liso de 8 lados com 32 m. O real tem 100 m, é uma TRELIÇA de 24 barras de
  // aço corten em torno de um mastro central de 80 cm, com 15 diafragmas — e por isso lê
  // SEMITRANSPARENTE de longe. É a segunda silhueta mais reconhecível da praça.
  {
    const MZ2 = BIG ? Math.min(118, Math.max(96, PAL_ZMAX + 34)) : 44;
    const MX = 0, H = BIG ? 84 : 32, R = BIG ? 1.6 : 0.6;
    const NB = LOWQ ? 12 : 24, NR = LOWQ ? 7 : 15;
    const bars = [];
    for (let i = 0; i < NB; i++) {
      const a = (i / NB) * Math.PI * 2;
      bars.push({ x: MX + Math.cos(a) * R, y: H / 2, z: MZ2 + Math.sin(a) * R });
    }
    addInst(new THREE.CylinderGeometry(0.05, 0.20, H, 5), MAT.corten, bars, { occlude: false });
    const core = new THREE.Mesh(new THREE.CylinderGeometry(BIG ? 0.34 : 0.18, BIG ? 0.42 : 0.22, H, 10), MAT.corten);
    core.position.set(MX, H / 2, MZ2); core.castShadow = !LOWQ; root.add(core);
    const rings = [];
    for (let i = 1; i <= NR; i++) rings.push({ x: MX, y: (H / (NR + 1)) * i, z: MZ2, rx: Math.PI / 2 });
    addInst(new THREE.TorusGeometry(R, 0.08, 4, 14), MAT.corten, rings, { shadow: false });
    // topo de 14 m + bandeira 20 × 14,30 m (286 m²). Sem hook de update por frame no mapa,
    // então a ondulação é ASSADA na geometria (custo zero, mesma leitura de pano ao vento).
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, BIG ? 14 : 4, 6), MAT.corten);
    tip.position.set(MX, H + (BIG ? 7 : 2), MZ2); root.add(tip);
    const FW = BIG ? 20 : 6, FH = BIG ? 14.3 : 4;
    const fg = new THREE.PlaneGeometry(FW, FH, 14, 6);
    { const p = fg.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const vx = p.getX(i), vy = p.getY(i), t = (vx + FW / 2) / FW;   // preso na tralha (x=-FW/2)
        p.setZ(i, Math.sin(t * 7.5 + vy * 0.35) * 0.85 * t * t);
      }
      fg.computeVertexNormals(); }
    const flag = new THREE.Mesh(fg, lam({ map: T.flagBR, side: THREE.DoubleSide, roughness: 0.85 }));
    flag.position.set(MX + FW / 2 + 0.3, BIG ? 78 : 29, MZ2); flag.castShadow = !LOWQ; root.add(flag);
    col(MX - R - 0.3, MX + R + 0.3, 0, H, MZ2 - R - 0.3, MZ2 + R + 0.3);
  }
  // Jardim com espelho d'água em frente ao Congresso (garden + reflecting pool)
  const GARDEN_Z = BIG ? Math.max(76, PAL_ZMAX + 20) : 50;
  {
    addPlane(30, 9, MAT.agua, 0, 0.06, GARDEN_Z, 0, -Math.PI / 2);
    for (const rz of [GARDEN_Z - 4.8, GARDEN_Z + 4.8]) addBox(31, 0.35, 0.7, MAT.marmore, 0, 0, rz, { collide: false });
    for (const rx of [-15.2, 15.2]) addBox(0.7, 0.35, 10, MAT.marmore, rx, 0, GARDEN_Z, { collide: false });
    for (const gx of [-22, 22]) addPlane(10, 12, lam({ map: ctex(cerradoTex(), 3, 4) }), gx, 0.04, GARDEN_Z, 0, -Math.PI / 2);
  }

  /* ---------------- marcos secundários da Praça (gap B5) ---------------- */
  // Panteão, Pombal e Museu da Cidade são elementos OBRIGATÓRIOS no BAR §4.1 e não existiam.
  // Além de fidelidade, cada um vira um marco visual distinto por área da praça (regra de
  // clareza competitiva: o jogador tem que saber onde está sem olhar o radar).
  if (BIG && DETAIL > 0) {
    // Panteão da Pátria Tancredo Neves — CONCRETO APARENTE CRU (cinza), forma de pomba.
    // O contraste deliberado com o branco polido do resto é o ponto do edifício.
    {
      const px = 22, pz = PAL_ZMAX + 8;
      const g = new THREE.Group(); g.position.set(px, 0, pz); root.add(g);
      const base = new THREE.Mesh(new THREE.BoxGeometry(15, 1.0, 12), MAT.concCru); base.position.y = 0.5; g.add(base);
      for (const s of [-1, 1]) {   // as duas "asas" inclinadas que fazem a pomba
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.9, 13, 11), MAT.concCru);
        wing.position.set(s * 3.4, 6.5, 0); wing.rotation.z = s * 0.30; g.add(wing);
        // r2: a asa era uma chapa de 13 × 11 m de cor lisa — o outro candidato ao "muro
        // branco" que a métrica B6 pegou. Além da textura de forma (triplanar), ganha
        // FRISOS horizontais a cada 3,2 m: cada friso projeta uma sombra fina ao meio-dia,
        // e é essa sombra que faz uma superfície grande ler como concreto, não placeholder.
        for (let fy = -4.4; fy < 5.6; fy += 3.2) {
          const fr = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.18, 11.2), MAT.concCru);
          fr.position.set(0, fy, 0); wing.add(fr);   // filho da asa: acompanha a inclinação
        }
      }
      const beak = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.8, 3), MAT.concCru);
      beak.position.set(0, 11.5, 0); beak.rotation.z = 0.12; g.add(beak);
      // embasamento de granito preto: separa o volume do chão e dá o gradiente de contato (A1)
      const emb = new THREE.Mesh(new THREE.BoxGeometry(15.6, 0.42, 12.6), MAT.granitoPreto);
      emb.position.y = 0.21; g.add(emb);
      g.traverse(o => { if (o.isMesh) { o.castShadow = !LOWQ; o.receiveShadow = true; } });
      col(px - 7, px + 7, 0, 12, pz - 6, pz + 6);
      occBox(14, 12, 12, px, 0, pz);
    }
    // Pombal (Niemeyer) — bloco vazado de concreto branco, escala pequena, ISOLADO no vazio.
    {
      const px = -14, pz = PAL_ZMAX + 6;
      const g = new THREE.Group(); g.position.set(px, 0, pz); root.add(g);
      for (const [ox, oy] of [[0, 5.6], [0, 0]])   // laje de cima e de baixo
        { const s = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.4, 4.4), MAT.concBranco); s.position.set(ox, oy + 0.2, 0); g.add(s); }
      for (const [ox, oz] of [[-2, 0], [2, 0]])    // duas paredes → o vazado
        { const w = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.6, 4.4), MAT.concBranco); w.position.set(ox, 2.9, oz); g.add(w); }
      g.traverse(o => { if (o.isMesh) { o.castShadow = !LOWQ; o.receiveShadow = true; } });
      col(px - 2.4, px + 2.4, 0, 6, pz - 2.4, pz + 2.4);
      occBox(4.6, 6, 4.6, px, 0, pz);
    }
    // Museu da Cidade — laje de concreto branco apoiada num ÚNICO pilar.
    {
      const px = -24, pz = PAL_ZMAX + 8;
      addBox(1.4, 3.2, 1.4, MAT.concBranco, px, 0, pz);
      addBox(11, 0.9, 6, MAT.concBranco, px, 3.2, pz, { collide: false, cast: true });
      addBox(11.4, 0.2, 6.4, MAT.granitoPreto, px, 0, pz, { collide: false });   // soleira/piso
      occBox(11, 1.1, 6, px, 3.1, pz);
    }
  }

  /* ---------------- protest posters / banners on the ministry FACADES ---------------- */
  {
    const imgs = T.posterImgs || [], aspects = T.posterAspects || [];
    const laneOrder = [1, 4, 0, 3, 2, 5];   // priority posters land on the mid buildings first
    const putPoster = (b, idx) => {
      if (!b || !imgs.length) return;
      const bb = new THREE.Box3().setFromObject(b);
      const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
      const lane = cx > 0 ? -1 : 1;
      const fx = (lane > 0 ? bb.max.x : bb.min.x) + lane * 0.3;   // 0.3 (era 0.06): não briga em z com o vidro fumê
      const ti = idx % imgs.length;
      const H = 5.6, A = aspects[ti] || 0.7;             // big posters on the lane facades
      // Com os pilotis o térreo ficou vazado; os cartazes sobem pra primeira laje cheia.
      const fy = BIG ? PILOTI + H / 2 + 0.8 : Math.min(bb.max.y - H / 2 - 0.4, 3.5);
      addPlane(H * A, H, lam({ map: imgs[ti], side: THREE.DoubleSide }), fx, fy, cz, lane > 0 ? Math.PI / 2 : -Math.PI / 2);
    };
    ministries.forEach((b, i) => putPoster(b, laneOrder[i] ?? i));
  }

  /* ---------------- gameplay cover: props do 8 de janeiro ---------------- */
  // Tire-pile barricades (Mint) as the main lane cover — the protest look.
  for (const [tx, tz, ry] of [[-6, -14, 0.3], [7, 12, -0.4], [-8, 26, 0.8], [9, -26, 0.2],
    [10, 3, 0], [-10, -3, 1.1], [4, 34, 0.5], [-4, -34, -0.3]])
    putBuilding('tires', { x: tx, z: tz, targetH: 1.6, ry });
  // Barraquinhas de camelô (vendor stalls)
  putBuilding('stall', { x: -13, z: -8, targetH: 2.7, ry: Math.PI / 2 });
  putBuilding('stall', { x: 13, z: 8, targetH: 2.7, ry: -Math.PI / 2 });
  // +2 barraquinhas no lado bolsonarista, mais pro meio da praça (pedido do usuário)
  putBuilding('stall', { x: -10, z: -23, targetH: 2.7, ry: Math.PI / 2 });
  putBuilding('stall', { x: 9, z: -21, targetH: 2.7, ry: -Math.PI / 2 });
  // Mini-acampamento de barracas (protest camp) junto aos ministérios oeste
  // (+2 barracas avançadas em direção ao centro: cobertura extra saindo do spawn B)
  for (const [tx, tz, ry] of [[-15, -30, 0.2], [-17, -35, 1.1], [-13, -36, -0.5], [16, 20, 0.6],
    [-6, -27, 0.9], [7, -25, -0.4]])
    putBuilding('tent', { x: tx, z: tz, targetH: 1.7, ry });
  // Acampamento (barracas em 2 fileiras) emoldurando a ponta da CATEDRAL (lado bolsonarista),
  // simétrico ao jardim+espelho da ponta do Congresso — backdrop temático atrás do spawn B.
  for (const [tx, tz, ry] of [[-12, -66, 0.15], [-4, -67, -0.2], [4, -66, 0.25], [12, -67, -0.15],
    [-8, -70.5, 0.5], [8, -70.5, -0.5]])
    putBuilding('tent', { x: tx, z: tz, targetH: 1.7, ry });
  // a few Correios/SEDEX parcels still around for variety (Brazilian postal boxes)
  const crateMats = [lam({ map: T.crate }), lam({ map: T.crate2 || T.crate })];
  for (const [i, [cx, cz, lv]] of [[11, 2, 0], [-11, 0, 0], [11, 3.6, 1], [-5, 18, 0]].entries())
    addBox(1.6, 1.6, 1.6, crateMats[i % 2], cx, lv * 1.6, cz, { ry: (cx * 7 % 10) / 22, pad: -0.05 });

  /* ---------------- ônibus quebrado do DF (Mint GLB — cover grande, CENTRAL) ---------------- */
  // "Amarelinho" gerado no Mint, atravessado no meio da Esplanada (quebrado, encostado).
  putBuilding('bus', { x: 2.5, z: -4, targetH: 3.1, ry: 0.55, occ: false });   // já tem caixa-occluder própria (medida) logo abaixo
  // ônibus: caixa-occluder invisível — o GLB é Group e o raycast de bala é NÃO-recursivo,
  // então a bala atravessava. Dimensões CASADAS ao mesh real (medido: 9.26 × 3.1 × 4.48):
  // a box antiga (9 × 3.2 × 3) era 1.5m estreita (tiros passavam na lateral) e 0.1m alta
  // demais (teto invisível ACIMA do real → "tiros num layer acima").
  {
    const bx = new THREE.Mesh(new THREE.BoxGeometry(9.3, 3.1, 4.5), new THREE.MeshBasicMaterial({ visible: false }));
    bx.position.set(2.5, 3.1 / 2, -4); bx.rotation.y = 0.55; root.add(bx); occluders.push(bx);
    col(2.5 - 4.5, 2.5 + 4.5, 0, 3.1, -4 - 2.6, -4 + 2.6);
  }

  /* ---------------- urna eletrônica (Sketchfab — monumento no MEIO do mapa) ---------------- */
  // Urna no centro da praça (pedido do usuário): cover baixo entre o ônibus e as barracas.
  putBuilding('urna', { x: 0, z: 0, targetH: 1.2, ry: -0.4 });

  /* ---------------- Towner do hotdog (Sketchfab — carrinho de hotdog) ---------------- */
  // Asia Towner/Daihatsu Hijet virou o carrinho de hotdog da praça, no lado bolsonarista.
  putBuilding('towner', { x: 12, z: -15, targetH: 2.0, ry: -0.9 });

  /* ---------------- barraquinha de bebida (Mint GLB — mini-bar c/ guarda-sol) -------------- */
  // Drink stand com cadeiras de plástico e guarda-sol grande, junto às barraquinhas.
  putBuilding('drinkstand', { x: -14, z: -17, targetH: 3.2, ry: 0.5 });

  /* ---------------- barricada improvisada (bloco + chapa + tábuas) ---------------- */
  { // protest barricade near the west tents: concrete block, corrugated sheet, planks.
    const bx = -8, bz = 20, bry = -0.3;
    const g = new THREE.Group(); g.position.set(bx, 0, bz); g.rotation.y = bry; root.add(g); occluders.push(g);
    const conc = lam({ color: 0xb8bab2 }), rust = lam({ color: 0x8a5a3a }), wood = lam({ color: 0x9a7b4f });
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.7, 0.8), conc); base.position.y = 0.35; g.add(base);
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 0.08), rust);
    sheet.position.set(0.2, 1.15, 0.1); sheet.rotation.x = -0.12; g.add(sheet);
    for (const [py, pr] of [[0.95, 0.18], [1.25, -0.14]]) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.16, 0.06), wood);
      plank.position.set(0, py, 0.28); plank.rotation.z = pr; g.add(plank);
    }
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const c = Math.abs(Math.cos(bry)), s = Math.abs(Math.sin(bry));
    const ex = 1.7 * c + 0.45 * s, ez = 1.7 * s + 0.45 * c;
    col(bx - ex, bx + ex, 0, 1.6, bz - ez, bz + ez);
  }

  // concrete planters with greenery. A grama do topo ERA {collide:false} (só visual): o muro
  // parecia ~1.4m de cobertura mas só bloqueava 0.9m (a base), então agachado (olho ~1m) a
  // cabeça ficava exposta e tomava tiro "atrás do muro". Agora o topo também bloqueia
  // bala/visão → a cobertura visível = a cobertura real (agachado protege).
  const jardTex = lam({ map: ctex(cerradoTex(), 2, 1) });
  for (const [px, pz] of [[-9, 8], [9, -8], [0, -20], [0, 16], [-16, 30], [16, 26], [-14, -46], [14, -50]]) {
    if (!freeSpot(px, pz, 2.2)) continue;
    addBox(3.4, 0.9, 1.3, MAT.concBranco, px, 0, pz);
    addBox(3, 0.5, 0.9, jardTex, px, 0.9, pz);
  }

  /* ---------------- DENSIDADE: mobiliário urbano + vegetação (task 3) ---------------- */
  // Tudo aqui é InstancedMesh: o frame ganha detalhe secundário sem estourar draw call
  // (≈14 draw calls no total pra ~500 objetos). ?props=0 desliga; quality low corta pela metade.
  if (DETAIL > 0) {
    const every = DETAIL === 1 ? 2 : 1;   // low: metade dos props
    const Zs = [];
    for (let z = -64; z <= 64; z += 8 * every) Zs.push(z);

    // MEIO-FIO / GUIA (r2). Era UM box de 240 m: uma aresta perfeitamente reta de ponta a
    // ponta, que é justo o que o critério B7 reprova. Agora são guias de 1,5 m (a peça real
    // de concreto pré-moldado) com desnível e giro milimétricos, junta visível entre elas e
    // pintura branca desbotada — a linha continua guiando o olho, mas parou de ser um traço
    // de CAD. Duas fileiras: guia interna (lane) e externa (fim da calçada portuguesa).
    const guias = [], guiaTopo = [];
    for (const sx of [-1, 1]) for (const gx of [6.2, 10.4]) {
      for (let z = -118; z <= 118; z += 1.52) {
        const jt = ((z * 7.3) % 1 + 1) % 1;                    // ruído determinístico por peça
        guias.push({ x: sx * gx, y: 0.085 + jt * 0.012, z, ry: (jt - 0.5) * 0.012 });
        if (jt > 0.62) guiaTopo.push({ x: sx * gx, y: 0.175, z, rx: -Math.PI / 2 });   // trecho repintado
      }
    }
    addInst(new THREE.BoxGeometry(0.34, 0.19, 1.46), MAT.guia, guias, { shadow: false });
    addInst(new THREE.PlaneGeometry(0.3, 1.4), MAT.pintBranca, guiaTopo, { shadow: false });

    // MATO NA RACHADURA (D2 estava em FAIL: "tudo recém-construído"). Tufo de capim
    // brotando na junta entre a guia e o piso — o sinal de abandono mais barato e mais
    // brasileiro que existe. Billboard cruzado com alphaTest; não projeta sombra.
    if (!LOWQ) {
      const tufos = [];
      for (const sx of [-1, 1]) for (const gx of [6.05, 10.55]) {
        for (let z = -112; z <= 112; z += 3.1) {
          if (((z * 3.7 + gx) % 1 + 1) % 1 > 0.42) continue;   // esparso, não um canteiro
          const a = ((z * 11.1) % 1) * 3;
          tufos.push({ x: sx * gx, y: 0.17, z, ry: a });
          tufos.push({ x: sx * gx, y: 0.17, z, ry: a + 1.57 });
        }
      }
      addInst(new THREE.PlaneGeometry(0.44, 0.34), MAT.mato, tufos, { shadow: false });
    }

    // Postes de iluminação: mastro galvanizado 9 m + braço + luminária. Marcam a lane e dão
    // ritmo vertical ao vazio (o vazio é o assunto, mas vazio SEM ritmo lê como cena inacabada).
    const masts = [], arms = [], heads = [];
    for (const sx of [-1, 1]) for (const z of Zs.filter((_, i) => i % 2 === 0)) {
      const x = sx * 22;
      if (!freeSpot(x, z, 1)) continue;
      masts.push({ x, y: 4.5, z });
      arms.push({ x: x - sx * 0.9, y: 8.9, z, rz: Math.PI / 2 });
      heads.push({ x: x - sx * 1.8, y: 8.7, z });
      col(x - 0.25, x + 0.25, 0, 9, z - 0.25, z + 0.25);
    }
    addInst(new THREE.CylinderGeometry(0.13, 0.22, 9, 6), MAT.aco, masts, { occlude: false });
    addInst(new THREE.CylinderGeometry(0.1, 0.1, 2, 5), MAT.aco, arms, { shadow: false });
    addInst(new THREE.BoxGeometry(0.9, 0.18, 0.4), MAT.pintBranca, heads, { shadow: false });

    // Grades metálicas de contenção da PM (BAR: "detalhes que confirmam isso é Brasília, hoje").
    // Bloqueiam bala/visão agachado: viram cobertura leve nos ângulos longos da Esplanada.
    const gPost = [], gRail = [];
    const gradeAt = (x, z, ry) => {
      if (!freeSpot(x, z, 1.6)) return;
      for (const d of [-1.1, 1.1]) gPost.push({ x: x + Math.cos(ry) * d, y: 0.55, z: z - Math.sin(ry) * d });
      for (const h of [0.45, 1.0]) gRail.push({ x, y: h, z, ry, rz: Math.PI / 2 });
      col(x - 1.2, x + 1.2, 0, 1.1, z - 0.25, z + 0.25);
    };
    for (const [gx, gz, gr] of [[-13, 34, 0], [-10.6, 34, 0], [13, 34, 0], [10.6, 34, 0],
      [-13, -30, 0], [13, -30, 0], [4, 20, 0], [-4, 20, 0], [8, -44, 0], [-8, -44, 0]])
      if (DETAIL === 2 || gx > 0) gradeAt(gx, gz, gr);
    addInst(new THREE.BoxGeometry(0.08, 1.1, 0.08), MAT.aco, gPost, { occlude: false });
    addInst(new THREE.CylinderGeometry(0.045, 0.045, 2.2, 5), MAT.aco, gRail, { occlude: false, shadow: false });

    // Lixeiras + cones + jardineiras cilíndricas (props de escala humana perto do chão).
    const bins = [], cones = [], vasos = [];
    for (const [bx2, bz2] of [[7.2, 22], [-7.2, 6], [7.2, -18], [-7.2, -38], [7.2, 46], [-7.2, -56]])
      if ((DETAIL === 2 || bz2 > 0) && freeSpot(bx2, bz2, 0.8)) { bins.push({ x: bx2, y: 0.5, z: bz2 }); col(bx2 - 0.4, bx2 + 0.4, 0, 1, bz2 - 0.4, bz2 + 0.4); }
    addInst(new THREE.CylinderGeometry(0.38, 0.30, 1.0, 8), lam({ color: 0x3f4a3f, roughness: 0.7 }), bins, { occlude: false });
    for (const [cx2, cz2] of [[3, -8], [4.2, -9], [-3, 12], [-4.2, 13], [1, 30], [10, -34], [-10, 42], [2.4, -52]])
      if ((DETAIL === 2 || cx2 > 0) && freeSpot(cx2, cz2, 0.6)) cones.push({ x: cx2, y: 0.35, z: cz2 });
    addInst(new THREE.ConeGeometry(0.28, 0.7, 7), lam({ color: 0xd8501e, roughness: 0.8 }), cones, { shadow: false });
    for (const [vx, vz] of [[9.5, 40], [-9.5, 40], [9.5, -12], [-9.5, -12], [9.5, 56], [-9.5, 56]])
      if (freeSpot(vx, vz, 1.1)) { vasos.push({ x: vx, y: 0.35, z: vz }); col(vx - 0.7, vx + 0.7, 0, 0.7, vz - 0.7, vz + 0.7); }
    addInst(new THREE.CylinderGeometry(0.72, 0.6, 0.7, 10), MAT.concCru, vasos, { occlude: false });

    // Faixa de pedestre atravessando o eixo (tinta branca desgastada).
    const zebra = [];
    for (const fz of [18, -26]) for (let i = -6; i <= 6; i++) zebra.push({ x: i * 0.95, y: 0.05, z: fz, rx: -Math.PI / 2 });
    addInst(new THREE.PlaneGeometry(0.5, 4), MAT.tintaGasta, zebra, { shadow: false });

    // PALMEIRA-IMPERIAL em fileira: tronco cinza liso e alto, copa pequena no topo.
    // A fileira é o que dá a leitura de "eixo" — e serve de referência de distância.
    const troncos = [], frondes = [];
    // tronco de 14 m com cor chapada também entrava no B6; triplanar em escala fina resolve
    const palmMat = triplanar(lam({ color: 0xa39d91, roughness: 0.88 }), TX_FORMA, 1.6);
    const leafMat = lam({ color: 0x3f5a2c, roughness: 0.9, side: THREE.DoubleSide });
    for (const sx of [-1, 1]) for (let i = 0; i < (DETAIL === 2 ? 7 : 4); i++) {
      const x = sx * 18, z = -52 + i * (DETAIL === 2 ? 18 : 32);
      if (!freeSpot(x, z, 1.2)) continue;
      troncos.push({ x, y: 7, z }); col(x - 0.4, x + 0.4, 0, 14, z - 0.4, z + 0.4);
      for (let f = 0; f < 6; f++) {
        const a = (f / 6) * Math.PI * 2;
        frondes.push({ x: x + Math.cos(a) * 1.5, y: 14.1, z: z + Math.sin(a) * 1.5, ry: -a, rz: 0.55 });
      }
    }
    addInst(new THREE.CylinderGeometry(0.34, 0.5, 14, 7), palmMat, troncos, { occlude: false });
    addInst(new THREE.PlaneGeometry(3.4, 0.9), leafMat, frondes, { shadow: false });

    // IPÊ-AMARELO florido (ago–set): galhos NUS cobertos de flor amarela intensa. O BAR diz
    // que é "o único ponto de cor saturada legítimo da cena" — logo, o melhor marcador de
    // affordance disponível. Vão nos chokepoints, de propósito.
    // r2 — REFEITO. Antes eram 4 icosaedros de face única com UMA cor chapada: um sólido
    // convexo facetado, o pior asset do mapa, e logo o ponto de cor que mais chama atenção.
    // Agora: fuste + 5 GALHOS em leque (o ipê florido tem galho NU aparecendo), 9 massas
    // irregulares de flor em 3 TONS diferentes (silhueta recortada, variação de valor) e
    // 3 billboards cruzados com textura de cacho e alphaTest — é o alpha que dá a borda
    // esgarçada que nenhum poliedro convexo consegue dar.
    const ipeTr = [], ipeGalho = [], ipeCopa = [[], [], []], ipeFolha = [];
    const ipeMat = lam({ color: 0x6b5a44, roughness: 0.95 });
    // ruído determinístico: cada árvore precisa ser DIFERENTE, mas igual em todo carregamento
    const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
    for (const [ti, [tx, tz]] of [[-11, -14], [12, 14], [-5, 46], [9, -40]].entries()) {
      if (!freeSpot(tx, tz, 2.6)) continue;
      const S0 = ti * 17.3 + 3.1;
      ipeTr.push({ x: tx, y: 2.35, z: tz, rz: (hash(S0) - 0.5) * 0.07 });
      col(tx - 0.4, tx + 0.4, 0, 5, tz - 0.4, tz + 0.4);
      for (let g = 0; g < 5; g++) {
        const a = (g / 5) * Math.PI * 2 + hash(S0 + g) * 0.8, len = 2.1 + hash(S0 + g + 40) * 1.2;
        ipeGalho.push({ x: tx + Math.cos(a) * len * 0.34, y: 4.55 + hash(S0 + g + 9) * 0.55,
          z: tz + Math.sin(a) * len * 0.34, ry: -a, rz: 0.8 + hash(S0 + g + 5) * 0.4, sy: len / 2.4 });
      }
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2 + hash(S0 + k + 20) * 1.3, r = 0.7 + hash(S0 + k + 30) * 1.9;
        const s = 0.72 + hash(S0 + k + 40) * 0.95;
        ipeCopa[k % 3].push({ x: tx + Math.cos(a) * r, y: 5.25 + hash(S0 + k + 50) * 1.5, z: tz + Math.sin(a) * r,
          sx: s * (0.85 + hash(S0 + k + 60) * 0.5), sy: s * (0.52 + hash(S0 + k + 70) * 0.3),
          sz: s * (0.85 + hash(S0 + k + 80) * 0.5), rx: hash(S0 + k + 90) * 3, ry: hash(S0 + k + 95) * 3 });
      }
      if (!LOWQ) for (let b = 0; b < 3; b++) ipeFolha.push({ x: tx, y: 5.85, z: tz, ry: b * 1.047 + hash(S0 + b) * 0.3 });
    }
    addInst(new THREE.CylinderGeometry(0.2, 0.42, 4.7, 8), ipeMat, ipeTr, { occlude: false });
    addInst(new THREE.CylinderGeometry(0.05, 0.14, 2.4, 5), ipeMat, ipeGalho, { shadow: false });
    ipeCopa.forEach((list, i) => addInst(new THREE.IcosahedronGeometry(1.15, 1), MAT.florIpe[i], list));
    addInst(new THREE.PlaneGeometry(5.4, 3.6), MAT.folhaIpe, ipeFolha, { shadow: false });

    /* ------- SINAIS DE IDADE + densidade secundária (critério D2, que estava em FAIL) ------- */
    // Brasília tem 65 anos e o mapa parecia entregue ontem. Tudo aqui é decal ou InstancedMesh:
    // não muda colisão, não muda rota de bot, e some com ?props=0.
    {
      // remendo de asfalto e mancha de óleo nas pistas do Eixo + escorrimento no piso da lane
      const decals = [];
      for (let i = 0; i < (LOWQ ? 26 : 64); i++) {
        const h = hash(i * 3.77), h2 = hash(i * 9.13 + 5), h3 = hash(i * 4.51 + 11);
        const onRoad = h3 > 0.45;
        const x = onRoad ? (h2 > 0.5 ? 1 : -1) * (ROAD_IN + h * ROAD_W) : (h - 0.5) * 20;
        const s = onRoad ? 1.6 + h2 * 3.4 : 1.0 + h2 * 2.6;
        decals.push({ x, y: onRoad ? 0.055 : 0.045, z: (h2 - 0.5) * 210, rx: -Math.PI / 2, ry: h3 * 3.1, sx: s, sy: s * (0.6 + h * 0.8) });
      }
      addInst(new THREE.PlaneGeometry(1, 1), MAT.mancha, decals, { shadow: false });

      // BANCO de concreto do mobiliário urbano dos anos 60 (bloco maciço sobre dois apoios).
      // Cobertura baixa de verdade nas laterais, longe do miolo do duelo.
      const bancoT = [], bancoP = [];
      for (const [bx2, bz2] of [[8.6, 34], [-8.6, 34], [8.6, -12], [-8.6, -12], [8.6, 58], [-8.6, -58]]) {
        if (!freeSpot(bx2, bz2, 1.4)) continue;
        bancoT.push({ x: bx2, y: 0.46, z: bz2 });
        for (const d of [-0.75, 0.75]) bancoP.push({ x: bx2, y: 0.21, z: bz2 + d });
        col(bx2 - 0.32, bx2 + 0.32, 0, 0.55, bz2 - 1.1, bz2 + 1.1);
      }
      addInst(new THREE.BoxGeometry(0.58, 0.16, 2.3), MAT.guia, bancoT, { occlude: false });
      addInst(new THREE.BoxGeometry(0.44, 0.42, 0.36), MAT.concCru, bancoP, { shadow: false });

      // PLACA INDICATIVA OFICIAL (critério D4). Poste galvanizado + chapa verde do DNIT.
      const placas = [['ESPLANADA', -12.6, 30, 1], ['PRAÇA DOS TRÊS PODERES', 12.6, -30, -1]];
      const placaPost = [];
      for (const [txt, sx2, sz2, sg] of placas) {
        if (!freeSpot(sx2, sz2, 1)) continue;
        placaPost.push({ x: sx2, y: 1.5, z: sz2 });
        const pm = lam({ map: ctex(placaTex(txt), 1, 1), side: THREE.DoubleSide, roughness: 0.75 });
        addPlane(2.6, 0.65, pm, sx2, 2.55, sz2, sg > 0 ? Math.PI / 2 : -Math.PI / 2);
        col(sx2 - 0.12, sx2 + 0.12, 0, 3, sz2 - 0.12, sz2 + 0.12);
      }
      addInst(new THREE.CylinderGeometry(0.06, 0.08, 3, 6), MAT.aco, placaPost, { occlude: false });
    }
  }

  /* ---------------- lighting & sky ---------------- */
  // Céu do Planalto Central (BAR §4.1): azul PROFUNDO no zênite (1.172 m de altitude, ar
  // seco), clareando muito rápido perto do horizonte, e a poeira da seca deixando a faixa
  // baixa lavada e amarelada. ?sky=0 volta ao céu antigo.
  if (SKY2) {
    const c = cvs(16, 256), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0.00, '#123a72');   // zênite azul profundo/escuro
    g.addColorStop(0.38, '#4d84bd');
    g.addColorStop(0.66, '#9fbdd2');   // clareia rápido
    g.addColorStop(0.86, '#d9cfae');   // poeira em suspensão — horizonte lavado amarelado
    g.addColorStop(1.00, '#c6b791');
    x.fillStyle = g; x.fillRect(0, 0, 16, 256);
    const sk = new THREE.CanvasTexture(c);
    sk.colorSpace = THREE.SRGBColorSpace;
    sk.wrapS = sk.wrapT = THREE.ClampToEdgeWrapping;
    scene.background = sk;
  } else scene.background = T.sky;
  // FOG: no Planalto Central o ar é seco e rarefeito — os primeiros ~100 m NÃO têm haze
  // nenhum (era near=100/far=260, que lavava a lane inteira). O que existe é a poeira da
  // seca deixando o HORIZONTE amarelado. Daí near alto + far longe + cor de poeira, não azul.
  // ?nofog=1 desliga (escape hatch padrão do projeto).
  if (QP.get('nofog') !== '1') scene.fog = new THREE.Fog(SKY2 ? 0xd6ccae : 0xbfd8ee, SKY2 ? 130 : 100, SKY2 ? 360 : 260);
  const sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.sunSprite, transparent: true, fog: false, depthWrite: false }));
  sunSpr.position.set(170, 118, -75); sunSpr.scale.setScalar(58); root.add(sunSpr);
  // Céu de seca: pouquíssima nuvem, e alta/rala. Nuvem gorda de verão mata a leitura.
  const cloudSet = SKY2 ? [[-120, 130, -190, 90], [90, 142, -210, 104]]
    : [[-90, 80, -130, 60], [50, 88, -160, 74], [130, 72, 70, 64], [-120, 82, 100, 68]];
  for (const [cx, cy, cz, cs] of cloudSet) {
    const cl = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.cloud, transparent: true, fog: false, depthWrite: false, opacity: SKY2 ? 0.5 : 0.9 }));
    cl.position.set(cx, cy, cz); cl.scale.set(cs, cs * (SKY2 ? 0.24 : 0.42), 1); root.add(cl);
  }
  // LUZ DURA DO PLANALTO: ambiente baixo (ar seco espalha pouco → sombra FUNDA), sol forte
  // e quente-neutro, e sobretudo penumbra ESTREITA (radius 3 -> 1). O sol fica a ~33° de
  // elevação: sombra longa (≈1,6× a altura) atravessando a lane, que é o que dá volume ao
  // vazio da praça. O env map (IBL, do agente de gráficos) preenche o resto do ambiente.
  const hemi = new THREE.HemisphereLight(0xbdd8f5, SKY2 ? 0xa08a5c : 0x8a7f63, SKY2 ? 0.30 : 0.42);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(SKY2 ? 0xfff4e2 : 0xfff1d8, SKY2 ? 3.1 : 2.5);
  if (SKY2) sun.position.set(90, 62, -40); else sun.position.set(38, 58, -14);
  sun.castShadow = true;
  const SM = LOWQ ? 1024 : 2048;
  sun.shadow.mapSize.set(SM, SM);
  // A escala nova (mastro 100 m, Congresso 55 m) exige um frustum de sombra maior, senão
  // o mastro e os ministérios sombreiam fora do mapa e aparecem "recortados".
  const SE = BIG ? 110 : 80;
  sun.shadow.camera.left = -SE; sun.shadow.camera.right = SE;
  sun.shadow.camera.top = SE; sun.shadow.camera.bottom = -SE;
  sun.shadow.camera.far = BIG ? 420 : 220; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.035;
  sun.shadow.radius = SKY2 ? 1 : 3;   // sol duro do cerrado = penumbra estreita
  scene.add(sun);
  // Rebote: no cerrado seco o rebote dominante vem do CHÃO (palha/laterita), não do céu.
  const fill = new THREE.DirectionalLight(SKY2 ? 0xc9b98f : 0xaecbe8, SKY2 ? 0.20 : 0.35);
  fill.position.set(-32, 22, 28); scene.add(fill);

  /* ---------------- ground height (flat) ---------------- */
  function groundHeightAt() { return 0; }

  /* ---------------- waypoints graph ---------------- */
  const nodes = [], adj = [];
  const STEP = 4.4;
  const blocked = (x, z, inflate) => {
    for (const c of colliders) {
      if (x > c.minX - inflate && x < c.maxX + inflate && z > c.minZ - inflate && z < c.maxZ + inflate &&
          c.minY < 1.6 && c.maxY > 0.15) return true;
    }
    return false;
  };
  // Folga = raio do bot (0.38) + margem. Antes o grafo usava 0.5/0.25 (< raio do bot), então
  // os caminhos passavam por frestas estreitas demais entre os props e o bot ENCALHAVA perto
  // do spawn (nunca cruzava). Agora nós e arestas respeitam a largura do bot -> rotas pelas
  // faixas abertas de verdade.
  const BOTR = 0.55;
  // A grade agora cobre TAMBÉM a passagem sob os pilotis dos ministérios: o mapa era um
  // corredor reto único (crítica: "não há rota flanqueadora"). Com os blocos vazados por
  // baixo existe uma rota lateral coberta dos dois lados, e o A* passa a usá-la.
  const FLANK_X = BIG ? Math.min(44, LANE_HX + MW - 1.5) : 22;
  for (let gx = -FLANK_X; gx <= FLANK_X; gx += STEP)
    for (let gz = -60; gz <= 60; gz += STEP)   // grade de waypoints estendida p/ o mapa longo
      if (!blocked(gx, gz, BOTR + 0.15)) nodes.push({ x: gx, z: gz });
  const segClear = (a, b) => {
    const dist = Math.hypot(b.x - a.x, b.z - a.z), steps = Math.max(5, Math.ceil(dist / 0.9));
    for (let i = 1; i < steps; i++) {
      const t = i / steps, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
      if (blocked(x, z, BOTR)) return false;   // corredor com largura do bot
    }
    return true;
  };
  // Arestas simétricas testadas UMA vez (j > i): com a grade maior + os colliders dos pilares
  // o build do grafo dobrou de custo, e isso corta metade dos segClear sem mudar o resultado.
  for (let i = 0; i < nodes.length; i++) adj.push([]);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x, dz = nodes[i].z - nodes[j].z;
      if (dx * dx + dz * dz < STEP * STEP * 2.2 && segClear(nodes[i], nodes[j])) { adj[i].push(j); adj[j].push(i); }
    }
  }
  function nearestWaypoint(x, z) {
    let best = 0, bd = 1e9;
    for (let i = 0; i < nodes.length; i++) {
      const dx = nodes[i].x - x, dz = nodes[i].z - z, d = dx * dx + dz * dz;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
  // A* com custo EUCLIDIANO. Antes era BFS por nº de saltos: com arestas diagonais, o
  // "menor nº de saltos" preferia passos diagonais e escolhia um caminho ERRANTE — uma viagem
  // reta pela direita (x=9, z 59->-29) voltava zigue-zagueando até x=-13 e voltava, funilando
  // TODOS os bots pelo centro-esquerda (a dor "petista esquerda / bolsonarista direita"). A*
  // por distância devolve o caminho geometricamente mais curto -> desce reto pela coluna.
  const D = (a, b) => { const dx = nodes[a].x - nodes[b].x, dz = nodes[a].z - nodes[b].z; return Math.sqrt(dx * dx + dz * dz); };
  function findPath(fromIdx, toIdx) {
    if (fromIdx === toIdx) return [toIdx];
    const n = nodes.length;
    const g = new Float32Array(n).fill(Infinity);
    const f = new Float32Array(n).fill(Infinity);
    const prev = new Int32Array(n).fill(-1);
    const open = new Uint8Array(n);
    g[fromIdx] = 0; f[fromIdx] = D(fromIdx, toIdx); open[fromIdx] = 1;
    let openCount = 1;
    while (openCount > 0) {
      let cur = -1, bf = Infinity;                       // grafo pequeno (~centenas): scan linear
      for (let i = 0; i < n; i++) if (open[i] && f[i] < bf) { bf = f[i]; cur = i; }
      if (cur === -1) break;
      if (cur === toIdx) {
        const path = [cur]; let c = prev[cur];
        while (c !== -1) { path.unshift(c); c = prev[c]; }
        return path;
      }
      open[cur] = 0; openCount--;
      for (const m of adj[cur]) {
        const t = g[cur] + D(cur, m);
        if (t < g[m]) { prev[m] = cur; g[m] = t; f[m] = t + D(m, toIdx); if (!open[m]) { open[m] = 1; openCount++; } }
      }
    }
    return [fromIdx];
  }

  /* ---------------- spawns ---------------- */
  const mk = s => [-9, -3, 3, 9].map(x => ({ x, z: 62 * s, yaw: s < 0 ? Math.PI : 0 }));   // spawns recuados (43->62) p/ longe da 1ª área
  // Bolsonaristas start at the Cathedral (south) end, Petistas at the Congresso (north)
  // end — swapped per request.
  const spawns = { B: mk(-1), P: mk(1) };

  return {
    root, colliders, occluders, groundHeightAt, spawns, sun, hemi,
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    // bounds abertos até a face externa dos ministérios: sem isso o jogador é empurrado
    // pra fora da rota de flanco sob os pilotis que acabamos de abrir.
    bounds: { minX: -(FLANK_X + 1.5), maxX: FLANK_X + 1.5, minZ: -76, maxZ: 76 },
  };
}
