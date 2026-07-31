// AUDITORIA HEADLESS DO VIEWMODEL MINT (sem Chrome, sem render).
// PORQUÊ: a régua nova (BAR-CONSISTENCIA) exige provar o enquadramento arma a arma nos
// DOIS aspectos (16:9 e 3:2 — o dono joga em 3:2). Abrir o browser aqui é proibido (2 CPU
// / SwiftShader), então este script reimplementa EXATAMENTE a cadeia de transformação do
// viewmodel (weapons.js weaponModel + game.js vmFrame) e projeta os vértices reais do GLB
// na tela. Se um número aqui está fora da faixa, a tela está fora da faixa.
//
// Saída: tools/eval/vm_mint_audit.json
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const WDIR = path.join(ROOT, 'public/models/weapons');

/* ---------- parser GLB mínimo (os 26 GLBs da Mint são 1 mesh / 1 node, sem Draco) ---------- */
const COMP = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const NUM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
function readGLB(file) {
  const b = fs.readFileSync(file);
  const jsonLen = b.readUInt32LE(12);
  const json = JSON.parse(b.slice(20, 20 + jsonLen).toString('utf8'));
  let bin = null, off = 20 + jsonLen;
  while (off < b.length) {
    const len = b.readUInt32LE(off), type = b.readUInt32LE(off + 4);
    if (type === 0x004e4942) bin = b.slice(off + 8, off + 8 + len);
    off += 8 + len + ((4 - (len % 4)) % 4) * 0;
    if (len % 4) off += 4 - (len % 4);
  }
  return { json, bin };
}
function accessor(g, idx) {
  const a = g.json.accessors[idx], bv = g.json.bufferViews[a.bufferView];
  const T = COMP[a.componentType], n = NUM[a.type];
  const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const out = new Float32Array(a.count * n);
  const stride = bv.byteStride || n * T.BYTES_PER_ELEMENT;
  for (let i = 0; i < a.count; i++) {
    const view = new T(g.bin.buffer, g.bin.byteOffset + base + i * stride, n);
    for (let k = 0; k < n; k++) out[i * n + k] = view[k];
  }
  return out;
}
// Vértices do GLB já no espaço do nó raiz (aplica TRS/matrix dos nós).
function glbPositions(g) {
  const nodes = g.json.nodes || [];
  const scene = g.json.scenes[g.json.scene || 0];
  const out = [];
  const walk = (ni, M) => {
    const nd = nodes[ni];
    const L = nd.matrix ? mat4FromArray(nd.matrix) : trs(nd.translation, nd.rotation, nd.scale);
    const W = mul(M, L);
    if (nd.mesh !== undefined) {
      for (const prim of g.json.meshes[nd.mesh].primitives) {
        if (prim.attributes.POSITION === undefined) continue;
        const p = accessor(g, prim.attributes.POSITION);
        for (let i = 0; i < p.length; i += 3) out.push(apply(W, p[i], p[i + 1], p[i + 2]));
      }
    }
    for (const c of nd.children || []) walk(c, W);
  };
  for (const r of scene.nodes) walk(r, ident());
  return out;
}
/* ---------- álgebra 4x4 (column-major, igual ao THREE) ---------- */
const ident = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const mat4FromArray = (a) => a.slice();
function mul(a, b) {
  const o = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  }
  return o;
}
const apply = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
function trs(t = [0, 0, 0], q = [0, 0, 0, 1], s = [1, 1, 1]) {
  const [x, y, z, w] = q, x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
  return [(1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0,
    (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0,
    (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0,
    t[0], t[1], t[2], 1];
}
// Euler XYZ em graus -> matriz (mesma ordem do THREE.Object3D.rotation default 'XYZ')
function eulerXYZ(dx, dy, dz) {
  const [a, b, c] = [dx, dy, dz].map((d) => d * Math.PI / 180);
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
  const ae = ca * cc, af = ca * sc, be = sa * cc, bf = sa * sc;
  return [cb * cc, af + be * sb, bf - ae * sb, 0,
    -cb * sc, ae - bf * sb, be + af * sb, 0,
    sb, -sa * cb, ca * cb, 0, 0, 0, 0, 1];
}

/* ---------- CFG LIDO DE public/js/weapons.js (sem espelho: zero risco de drift) ---------- */
function loadCFG() {
  const src = fs.readFileSync(path.join(ROOT, 'public/js/weapons.js'), 'utf8');
  const i = src.indexOf('const CFG = {');
  const j = src.indexOf('\n};', i);
  const body = src.slice(i + 'const CFG = '.length, j + 2).replace(/Math\.PI/g, String(Math.PI));
  // eslint-disable-next-line no-new-func
  return new Function('return ' + body)();
}
const CFG = loadCFG();

/* ---------- réplica de weaponModel(): grip na origem, cano +Z, comprimento real ---------- */
function gunSpace(id) {
  const cfg = CFG[id];
  const g = readGLB(path.join(WDIR, id + '.glb'));
  const raw = glbPositions(g);
  const R = eulerXYZ(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
  let P = raw.map(([x, y, z]) => apply(R, x, y, z));
  const bb = bbox(P);
  const zlen = (bb.max[2] - bb.min[2]) || 1;
  const s = Math.min(8, Math.max(0.05, cfg.len / zlen));
  P = P.map((p) => [p[0] * s, p[1] * s, p[2] * s]);
  const bb2 = bbox(P);
  const gripZ = bb2.max[2] - (bb2.max[2] - bb2.min[2]) * cfg.gripZ;   // shift p/ grip na origem
  P = P.map((p) => [p[0], p[1], p[2] - gripZ]);
  return { P, cfg };
}
function bbox(P) {
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (const p of P) for (let k = 0; k < 3; k++) { if (p[k] < mn[k]) mn[k] = p[k]; if (p[k] > mx[k]) mx[k] = p[k]; }
  return { min: mn, max: mx };
}
// Boca do cano = centroide dos vértices no 2% mais avançado em +Z (é a ponta FINA — ver weapons.js)
function muzzleOf(P, bb) {
  const cut = bb.max[2] - (bb.max[2] - bb.min[2]) * 0.02;
  let s = [0, 0, 0], c = 0;
  for (const p of P) if (p[2] >= cut) { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; c++; }
  return c ? [s[0] / c, s[1] / c, s[2] / c] : [0, 0, bb.max[2]];
}
// Alça de mira = topo do receiver na metade da frente (z entre 0 e 45% do trecho grip->boca):
// é a linha que o ADS tem que colocar no centro da tela.
function sightOf(P, bb, mz) {
  const z0 = 0, z1 = mz[2] * 0.45;
  let top = -1e9, sx = 0, c = 0;
  for (const p of P) if (p[2] >= z0 && p[2] <= z1 && p[1] > top) top = p[1];
  for (const p of P) if (p[2] >= z0 && p[2] <= z1 && p[1] > top - 0.012) { sx += p[0]; c++; }
  return [c ? sx / c : mz[0], top, mz[2] * 0.30];
}

// VERIFICAÇÃO DO `rot` (requisito "o cano aponta pra onde a mira aponta"): o cano é a ponta
// FINA, a coronha a GROSSA. Mede o raio médio da seção transversal nos 6% de cada ponta; se
// a ponta +Z não for a mais fina, a arma entra no viewmodel de ré (foi o bug "arma apontada
// pra baixo"/invertida). Independe de olhar na tela.
function barrelCheck(P, bb) {
  const L = bb.max[2] - bb.min[2];
  const rad = (lo, hi) => {
    let cx = 0, cy = 0, c = 0;
    for (const p of P) if (p[2] >= lo && p[2] <= hi) { cx += p[0]; cy += p[1]; c++; }
    if (!c) return 1e9;
    cx /= c; cy /= c;
    let r = 0;
    for (const p of P) if (p[2] >= lo && p[2] <= hi) r += Math.hypot(p[0] - cx, p[1] - cy);
    return r / c;
  };
  const rFrente = rad(bb.max[2] - L * 0.06, bb.max[2]), rTras = rad(bb.min[2], bb.min[2] + L * 0.06);
  return { rFrente: r3(rFrente), rTras: r3(rTras), canoEmZmais: rFrente < rTras };
}

/* ---------- FRAMING (espelho de game.js _vmFrame) ---------- */
const V0 = 62 * Math.PI / 180;
const H = Math.tan(V0 / 2) * (16 / 9);          // meia-tangente HORIZONTAL (constante em qq aspecto)
function loadFrame() {
  const src = fs.readFileSync(path.join(ROOT, 'public/js/vmattach.js'), 'utf8');
  const i = src.indexOf('export const VM_FRAME = {');
  const j = src.indexOf('\n};', i);
  const body = src.slice(i + 'export const VM_FRAME = '.length, j + 2);
  // eslint-disable-next-line no-new-func
  return new Function('return ' + body)();
}
const F = loadFrame();
const CLS = F.classOf;
function frame(id, bb, S) {
  const c = CLS[id] || 'rifle';
  const t = F.cls[c];
  const back = S * Math.max(0, -bb.min[2]);        // coronha atrás do grip (m)
  const fwd = S * Math.max(0.001, bb.max[2]);      // cano à frente do grip (m)
  const Zg = Math.max(back + t.clear, t.minz, fwd / t.fwdTan) * (F.zMul[id] || 1);
  const gx = Zg * t.tanH;
  const gy = -gx * F.tanBarrel;                    // ângulo do cano na tela = atan(|gy|/gx) (independe do aspecto)
  return { Zg, gx, gy, cls: c, roll: id === 'knife' ? 0 : (t.roll || 0) };
}
// gun-space -> view space (rw leva rotation.y = π: x e z invertem; depois o roll do grupo,
// que gira em torno do eixo da câmera e NÃO desvia o cano).
function toView(p, S, f) {
  let x = -S * p[0], y = S * p[1];
  if (f.roll) { const c = Math.cos(f.roll), s = Math.sin(f.roll); const nx = x * c - y * s; y = x * s + y * c; x = nx; }
  return [f.gx + x, f.gy + y, -f.Zg - S * p[2]];
}

function project(p, aspect) {
  const V = H / aspect;
  const z = -p[2];
  return [0.5 + 0.5 * (p[0] / z) / H, 0.5 - 0.5 * (p[1] / z) / V];
}
// Área OCUPADA na tela (fração 0-1) por cobertura de grade 128×128: o casco convexo
// mentia feio numa arma longa e diagonal (contava o triângulo vazio entre coronha e boca).
function screenArea(pts) {
  const N = 128, grid = new Uint8Array(N * N);
  for (const [x, y] of pts) {
    if (x < 0 || x >= 1 || y < 0 || y >= 1) continue;
    grid[((y * N) | 0) * N + ((x * N) | 0)] = 1;
  }
  // dilata 1 célula: a amostragem é esparsa (4k vértices) e deixaria buracos falsos
  const out = new Uint8Array(grid);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (!grid[j * N + i]) continue;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const a = j + dj, b = i + di; if (a >= 0 && a < N && b >= 0 && b < N) out[a * N + b] = 1;
    }
  }
  let c = 0; for (let i = 0; i < out.length; i++) c += out[i];
  return c / (N * N);
}
function convex(pts) {
  if (pts.length < 3) return pts;
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop();
  return lo.concat(up);
}
function clipRect(poly) {
  const edges = [[1, 0, 0], [-1, 0, 1], [0, 1, 0], [0, -1, 1]];   // x>=0, x<=1, y>=0, y<=1
  let out = poly;
  for (const [a, b, c] of edges) {
    const inp = out; out = [];
    const f = (p) => a * p[0] + b * p[1] + c;
    for (let i = 0; i < inp.length; i++) {
      const P0 = inp[i], P1 = inp[(i + 1) % inp.length], f0 = f(P0), f1 = f(P1);
      if (f0 >= 0) out.push(P0);
      if ((f0 >= 0) !== (f1 >= 0)) { const t = f0 / (f0 - f1); out.push([P0[0] + (P1[0] - P0[0]) * t, P0[1] + (P1[1] - P0[1]) * t]); }
    }
    if (!out.length) return [];
  }
  return out;
}

/* ---------- braços FP (models/fparms/arms.glb): ombro e alcance ----------
   PORQUÊ: a reclamação nº1 do dono é "mãos soltas no ar". Isso acontece quando o grip
   fica além do alcance do braço e o CCD do handik para no limite. Aqui medimos, na pose
   de bind, a posição do ombro direito e o comprimento braço+antebraço no MESMO espaço do
   vm.root (normalização de fparms.js: altura 1.72·0.93, pés em y=0, grupo em y=-1.48,
   z=+0.02, girado π). Se dist(ombro,grip) > alcance, a mão flutua — e o audit reprova. */
function armRig() {
  const g = readGLB(path.join(ROOT, 'public/models/fparms/arms.glb'));
  const nodes = g.json.nodes, world = {}, all = [];
  const walk = (ni, M) => {
    const nd = nodes[ni];
    const W = mul(M, nd.matrix ? mat4FromArray(nd.matrix) : trs(nd.translation, nd.rotation, nd.scale));
    if (nd.name) world[nd.name] = [W[12], W[13], W[14]];
    all.push([W[12], W[13], W[14]]);
    if (nd.mesh !== undefined) for (const prim of g.json.meshes[nd.mesh].primitives) {
      if (prim.attributes.POSITION === undefined) continue;
      const p = accessor(g, prim.attributes.POSITION);
      for (let i = 0; i < p.length; i += 3) all.push(apply(W, p[i], p[i + 1], p[i + 2]));
    }
    for (const c of nd.children || []) walk(c, W);
  };
  for (const r of g.json.scenes[g.json.scene || 0].nodes) walk(r, ident());
  const bb = bbox(all);
  const s = (1.72 * 0.93) / ((bb.max[1] - bb.min[1]) || 1);
  const y0 = -bb.min[1] * s;
  // model -> vm.root: escala s, sobe y0, gira π em Y (x,z invertem), desloca (0,-1.48,0.02)
  const toRoot = (p) => [-p[0] * s, p[1] * s + y0 - 1.48, -p[2] * s + 0.02];
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const sh = toRoot(world.RightShoulder), ar = toRoot(world.RightArm), fo = toRoot(world.RightForeArm), ha = toRoot(world.RightHand);
  return { cotoveloL: toRoot(world.LeftArm), ombro: sh, alcance: d(sh, ar) + d(ar, fo) + d(fo, ha), ombroL: toRoot(world.LeftShoulder), alcanceL: d(toRoot(world.LeftShoulder), toRoot(world.LeftArm)) + d(toRoot(world.LeftArm), toRoot(world.LeftForeArm)) + d(toRoot(world.LeftForeArm), toRoot(world.LeftHand)) };
}
const ARM = armRig();
// Onde o ANTEBRAÇO sai da tela: segmento grip->ombro amostrado (o ombro fica com z>0, atrás
// da lente — o braço necessariamente varre para fora do quadro pela direita/baixo).
function foreArmEdge(grip, aspect) {
  let mx = 0, my = 0;
  for (let t = 0; t <= 1.0001; t += 0.02) {
    const p = [grip[0] + (ARM.ombro[0] - grip[0]) * t, grip[1] + (ARM.ombro[1] - grip[1]) * t, grip[2] + (ARM.ombro[2] - grip[2]) * t];
    if (p[2] > -0.03) break;                 // atrás da lente: já saiu do quadro
    const q = project(p, aspect);
    if (q[0] > mx) mx = q[0];
    if (q[1] > my) my = q[1];
  }
  return [mx, my];
}

/* ---------- execução ---------- */
const ONE_H = new Set(['pistol', 'deagle', 'revolver38', 'knife']);
const ASPECTS = { '16:9': 16 / 9, '3:2': 3 / 2 };
const report = { gerado: new Date().toISOString(), lente: { V0deg: 62, halfTanH: +H.toFixed(4) }, tuning: F, armas: {} };
const ids = Object.keys(CFG).filter((id) => fs.existsSync(path.join(WDIR, id + '.glb')));
for (const id of ids) {
  const { P, cfg } = gunSpace(id);
  const bb = bbox(P);
  const mz = muzzleOf(P, bb), sg = sightOf(P, bb, mz);
  const S = F.vmScale * (cfg.vm ?? 1);
  const f = frame(id, bb, S);
  const vMz = toView(mz, S, f), vSg = toView(sg, S, f);
  const step = Math.max(1, Math.floor(P.length / 4000));
  const sub = []; for (let i = 0; i < P.length; i += step) sub.push(toView(P[i], S, f));
  const gripW = [f.gx, f.gy, -f.Zg];
  // mão de apoio: FORE_T do caminho grip->boca, FORE_DROP abaixo da linha do cano (fparms.js)
  // Réplica do clamp de alcance do poseToWeapon: desliza t pelo eixo até caber no braço L.
  const FORE_DROP = 0.030, reachL = ARM.alcanceL * 0.94;
  let FORE_T = 0.42, foreV = null, dOmbroL = 0;
  for (let i = 0; i < 8; i++) {
    foreV = toView([mz[0] * FORE_T, mz[1] * FORE_T - FORE_DROP, mz[2] * FORE_T], S, f);
    dOmbroL = Math.hypot(foreV[0] - ARM.ombroL[0], foreV[1] - ARM.ombroL[1], foreV[2] - ARM.ombroL[2]);
    if (dOmbroL <= reachL || FORE_T <= 0.14) break;
    FORE_T -= 0.045;
  }
  const dOmbro = Math.hypot(gripW[0] - ARM.ombro[0], gripW[1] - ARM.ombro[1], gripW[2] - ARM.ombro[2]);
  const bc = barrelCheck(P, bb);
  const entry = {
    classe: f.cls,
    cano: bc,
    alcanceBraco: { dist: r3(dOmbro), max: r3(ARM.alcance), folga: r3(ARM.alcance - dOmbro) },
    alcanceApoio: ONE_H.has(id) ? null : { foreT: r2(FORE_T), dist: r3(dOmbroL), max: r3(reachL), folga: r3(reachL - dOmbroL), guardaMao: foreV.map(r3) }, len: cfg.len, gripZ: cfg.gripZ, vm: cfg.vm ?? 1, escalaVM: +S.toFixed(3),
    gunSpace: { bboxMin: bb.min.map(r3), bboxMax: bb.max.map(r3), boca: mz.map(r3), alca: sg.map(r3) },
    viewSpace: { grip: [f.gx, f.gy, -f.Zg].map(r3), boca: vMz.map(r3), alca: vSg.map(r3) },
    coronhaZ: r3(-f.Zg + S * Math.max(0, -bb.min[2])),   // tem que ser < 0 (nunca atrás da lente)
    anguloCanoGraus: r2(Math.atan2(-f.gy, f.gx) * 180 / Math.PI),
    adsDelta: [-vSg[0], -vSg[1], F.adsPullZ].map(r3),    // leva a ALÇA ao centro da tela
    aspectos: {},
  };
  for (const [an, asp] of Object.entries(ASPECTS)) {
    const pts = sub.map((p) => project(p, asp));
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    entry.aspectos[an] = {
      bordaEsq: r3(Math.min(...xs)), bordaDir: r3(Math.max(...xs)),
      topo: r3(Math.min(...ys)), base: r3(Math.max(...ys)),
      areaPct: r2(screenArea(pts) * 100),
      gripTela: project([f.gx, f.gy, -f.Zg], asp).map(r3),
      bracoBordaDir: r3(foreArmEdge([f.gx, f.gy, -f.Zg], asp)[0]),
      bracoBordaBaixo: r3(foreArmEdge([f.gx, f.gy, -f.Zg], asp)[1]),
      bocaTela: project(vMz, asp).map(r3),
      adsAlcaTela: project([vSg[0] + entry.adsDelta[0], vSg[1] + entry.adsDelta[1], vSg[2] + entry.adsDelta[2]], asp).map(r3),
    };
  }
  report.armas[id] = entry;
}
function r3(v) { return Math.round(v * 1000) / 1000; }
function r2(v) { return Math.round(v * 100) / 100; }

/* ---------- veredito ---------- */
const fails = [];
for (const [id, e] of Object.entries(report.armas)) {
  if (!e.cano.canoEmZmais) fails.push(`${id}: rot INVERTIDO — a ponta +Z é a grossa (r ${e.cano.rFrente} vs ${e.cano.rTras}) => cano de ré no viewmodel`);
  if (e.coronhaZ >= -0.01) fails.push(`${id}: coronha atrás da lente (z=${e.coronhaZ})`);
  if (e.anguloCanoGraus < 10.5 || e.anguloCanoGraus > 14.5) fails.push(`${id}: ângulo do cano ${e.anguloCanoGraus}° fora de 11-14`);
  for (const [an, a] of Object.entries(e.aspectos)) {
    if (e.classe !== 'pistol' && e.classe !== 'knife' && (a.bordaEsq < 0.58 || a.bordaEsq > 0.68)) fails.push(`${id} ${an}: borda esq ${a.bordaEsq}`);
    if (a.bracoBordaDir < 0.99) fails.push(`${id} ${an}: antebraço não sai pela borda direita (${a.bracoBordaDir})`);
    const lim = e.classe === 'pistol' || e.classe === 'knife' ? [1.4, 7] : [4.5, 10.5];
    if (a.areaPct < lim[0] || a.areaPct > lim[1]) fails.push(`${id} ${an}: área ${a.areaPct}% (alvo ${lim[0]}-${lim[1]})`);
    const ads = a.adsAlcaTela;
    if (Math.abs(ads[0] - 0.5) > 0.012 || Math.abs(ads[1] - 0.5) > 0.012) fails.push(`${id} ${an}: ADS fora do centro ${ads}`);
  }
}
for (const [id, e] of Object.entries(report.armas)) {
  if (e.alcanceBraco.folga < 0.02) fails.push(`${id}: grip fora do alcance do braço R (folga ${e.alcanceBraco.folga} m) -> MÃO SOLTA NO AR`);
  if (e.alcanceApoio && e.alcanceApoio.folga < -0.005) fails.push(`${id}: guarda-mão fora do alcance do braço L (folga ${e.alcanceApoio.folga} m) -> MÃO SOLTA NO AR`);
}
report.braco = ARM;
report.reprovacoes = fails;
fs.writeFileSync(path.join(ROOT, 'tools/eval/vm_mint_audit.json'), JSON.stringify(report, null, 1));
console.log(`armas: ${ids.length}   reprovações: ${fails.length}`);
for (const f of fails.slice(0, 40)) console.log('  ✗', f);
const t = (id) => { const e = report.armas[id]; if (!e) return; const a = e.aspectos['16:9'], b = e.aspectos['3:2']; console.log(`${id.padEnd(11)} ${e.classe.padEnd(8)} esq=${a.bordaEsq}/${b.bordaEsq} braco=${a.bracoBordaDir} area=${a.areaPct}/${b.areaPct}% cano=${e.anguloCanoGraus}° coronhaZ=${e.coronhaZ} folgaBraco=${e.alcanceBraco.folga}`); };
console.log('');
for (const id of ids) t(id);
