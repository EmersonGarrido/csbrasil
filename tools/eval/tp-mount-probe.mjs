// Sonda de MONTAGEM DE ARMA EM 3ª PESSOA — mede, não chuta.
//
// PORQUÊ: o mount da arma na mão dos bots (glbchars.js) é derivado da geometria do rig
// (linha antebraço->mão + escala do osso). Cada rig do Meshy tem proporção, escala e pose
// de bind diferentes, então "arma pra trás" (coach), "arma gigante" (hipster) e "não segura
// arma" (dollynho) são defeitos NUMÉRICOS. Este script abre os GLB direto (parser próprio:
// sem Chrome, sem Playwright, regra do projeto), faz skinning de verdade e imprime por
// personagem os números que decidem o mount.
//
// ARMADILHA DE ESPAÇO (a que já custou caro neste projeto): nestes GLB a malha é autorada
// em ~1,7 unidades e os OSSOS em ~170 (centímetros), com o nó Armature em escala 0,01 e as
// inverseBindMatrices carregando o fator 100 que liga os dois espaços. Ou seja: medir a
// malha com bbox × matrixWorld dá 0,017 m e medir o osso dá 1,5 m — 100× de diferença no
// MESMO modelo. Quem mede errado ou infla a arma ou some com ela. Aqui a malha é sempre
// avaliada com skinning (Σ w·(ossoMundo·IBM)·bindMatrix·p), que é o que a GPU desenha.
//
// uso: node tools/eval/tp-mount-probe.mjs [tempo_do_clipe_em_s]
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('../../', import.meta.url).pathname);
const PUB = path.join(ROOT, 'public');
const T = parseFloat(process.argv[2] || '0.4');
const TARGET_H = 1.72;                    // = TARGET_HEIGHT do glbchars.js

// ---------- GLB ----------
function readGLB(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('não é GLB: ' + file);
  let off = 12, json = null, bin = null;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(data));
    else if (type === 0x004e4942) bin = data;
    off += 8 + len + ((4 - (len % 4)) % 4);
  }
  return { json, bin };
}
const COMP = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const NUM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
function accessor(g, i) {
  const a = g.json.accessors[i], sz = COMP[a.componentType], n = NUM[a.type];
  const out = new Float32Array(a.count * n);
  if (a.bufferView === undefined) return out;
  const bv = g.json.bufferViews[a.bufferView];
  const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const stride = bv.byteStride || sz * n;
  const rd = { 5126: (p) => g.bin.readFloatLE(p), 5123: (p) => g.bin.readUInt16LE(p), 5125: (p) => g.bin.readUInt32LE(p), 5121: (p) => g.bin.readUInt8(p), 5122: (p) => g.bin.readInt16LE(p), 5120: (p) => g.bin.readInt8(p) }[a.componentType];
  for (let e = 0; e < a.count; e++) for (let c = 0; c < n; c++) out[e * n + c] = rd(base + e * stride + c * sz);
  return out;
}

// ---------- mat4 (column-major, igual ao three) ----------
const mIdent = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function compose(t, q, s) {
  const [x, y, z, w] = q, x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2, [sx, sy, sz2] = s;
  return [(1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz2, (yz - wx) * sz2, (1 - (xx + yy)) * sz2, 0, t[0], t[1], t[2], 1];
}
function mul(a, b) {
  const o = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++)
    o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return o;
}
const xform = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
  m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
const axisLen = (m, c) => Math.hypot(m[c * 4], m[c * 4 + 1], m[c * 4 + 2]);
const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

// ---------- cena ----------
function buildScene(g) {
  const nodes = g.json.nodes.map((n, i) => ({ i, name: n.name || `node${i}`, children: n.children || [], mesh: n.mesh, skin: n.skin, t: n.translation || [0, 0, 0], q: n.rotation || [0, 0, 0, 1], s: n.scale || [1, 1, 1] }));
  return { nodes, roots: g.json.scenes[g.json.scene || 0].nodes || [] };
}
function worldMats(sc) {
  const W = new Array(sc.nodes.length);
  const rec = (i, pm) => { const n = sc.nodes[i]; W[i] = mul(pm, compose(n.t, n.q, n.s)); n.children.forEach((c) => rec(c, W[i])); };
  sc.roots.forEach((r) => rec(r, mIdent()));
  return W;
}
// pose = clipe externo (GLB só de animação) casado por NOME de nó; devolve W animado
function poseWith(sc, file, tt) {
  const saved = sc.nodes.map((n) => ({ t: n.t, q: n.q, s: n.s }));
  const ag = readGLB(file);
  const an = ag.json.animations && ag.json.animations[0];
  if (an) {
    const byName = new Map(sc.nodes.map((n) => [n.name, n]));
    for (const ch of an.channels) {
      const src = ag.json.nodes[ch.target.node], dst = src && byName.get(src.name);
      if (!dst) continue;
      const smp = an.samplers[ch.sampler], inp = accessor(ag, smp.input), out = accessor(ag, smp.output);
      const dur = inp[inp.length - 1] || 1, t2 = dur > 0 ? (tt % dur) : 0;
      let k = 0; while (k < inp.length - 1 && inp[k + 1] < t2) k++;
      const k1 = Math.min(k + 1, inp.length - 1), span = (inp[k1] - inp[k]) || 1;
      const a = Math.max(0, Math.min(1, (t2 - inp[k]) / span));
      const n = ch.target.path === 'rotation' ? 4 : 3, st = smp.interpolation === 'CUBICSPLINE' ? 3 : 1;
      const g0 = k * n * st + (st === 3 ? n : 0), g1 = k1 * n * st + (st === 3 ? n : 0);
      const v = []; for (let c = 0; c < n; c++) v.push(out[g0 + c] * (1 - a) + out[g1 + c] * a);
      if (ch.target.path === 'rotation') { const l = Math.hypot(...v) || 1; dst.q = v.map((x) => x / l); }
      else if (ch.target.path === 'translation') dst.t = v;
      else dst.s = v;
    }
  }
  const W = worldMats(sc);
  sc.nodes.forEach((n, i) => { n.t = saved[i].t; n.q = saved[i].q; n.s = saved[i].s; });
  return W;
}
// skinning de verdade: p_render = Σ w_k · (ossoMundo_k · IBM_k) · bindMatrix · p
function skinVerts(sc, g, W, stride = 1) {
  const out = [];
  const skins = (g.json.skins || []).map((sk) => ({ joints: sk.joints, ibm: sk.inverseBindMatrices !== undefined ? accessor(g, sk.inverseBindMatrices) : null }));
  sc.nodes.forEach((n) => {
    if (n.mesh === undefined) return;
    const bind = W[n.i];
    const sk = n.skin !== undefined ? skins[n.skin] : null;
    for (const p of g.json.meshes[n.mesh].primitives) {
      if (p.attributes.POSITION === undefined) continue;
      const P = accessor(g, p.attributes.POSITION);
      const J = sk && sk.ibm && p.attributes.JOINTS_0 !== undefined ? accessor(g, p.attributes.JOINTS_0) : null;
      const WT = J && p.attributes.WEIGHTS_0 !== undefined ? accessor(g, p.attributes.WEIGHTS_0) : null;
      const cnt = P.length / 3;
      for (let i = 0; i < cnt; i += stride) {
        // O GLTFLoader do three faz bind com matriz IDENTIDADE (a spec do glTF manda
        // IGNORAR o transform do nó da malha skinada). Sem isso a conta erra por 100×
        // nestes assets (Armature em 0,01 + inverseBind em 100) — foi essa a armadilha.
        const base = WT ? [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]] : xform(bind, [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]]);
        if (!WT) { out.push({ p: base, j: null, w: null }); continue; }
        const acc = [0, 0, 0]; let tot = 0;
        for (let k = 0; k < 4; k++) {
          const wk = WT[i * 4 + k]; if (wk <= 0) continue;
          const ji = J[i * 4 + k], node = sk.joints[ji];
          const ibm = []; for (let c = 0; c < 16; c++) ibm.push(sk.ibm[ji * 16 + c]);
          const q = xform(mul(W[node], ibm), base);
          acc[0] += q[0] * wk; acc[1] += q[1] * wk; acc[2] += q[2] * wk; tot += wk;
        }
        if (tot > 1e-4) out.push({ p: [acc[0] / tot, acc[1] / tot, acc[2] / tot], j: [J[i * 4], J[i * 4 + 1], J[i * 4 + 2], J[i * 4 + 3]], w: [WT[i * 4], WT[i * 4 + 1], WT[i * 4 + 2], WT[i * 4 + 3]] });
      }
    }
  });
  return out;
}
const bboxOf = (vs) => {
  const b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (const v of vs) for (let k = 0; k < 3; k++) { b[k] = Math.min(b[k], v.p[k]); b[3 + k] = Math.max(b[3 + k], v.p[k]); }
  return b;
};

const RX_HAND = /right.?hand|hand.?r\b|rhand|r_hand/i, RX_ANY = /hand/i, RX_FORE = /right.?forearm|r_forearm/i;
const CHARS = ['esquerdomacho', 'sindicato', 'mst', 'doutora', 'mistico', 'caminhoneiro', 'sertanejo',
  'coach', 'gotinha', 'farialimer', 'bombado', 'hipster', 'dollynho', 'et', 'ancap', 'bozo', 'canarinho',
  'proerd', 'emo', 'blackmetal', 'metaleiro', 'punk', 'skatista', 'clubber', 'rapper', 'reggae', 'funkeiro'];
const f = (v, n = 3) => (v === null || v === undefined || !isFinite(v) ? '   -   ' : (v >= 0 ? ' ' : '') + v.toFixed(n));

// caixa real da arma (metros, cano em +Z) como o weapons.js a constrói
function weaponBox(id, len, rotDeg) {
  const g = readGLB(path.join(PUB, 'models/weapons', `${id}.glb`));
  const sc = buildScene(g); const W = worldMats(sc);
  const b = bboxOf(skinVerts(sc, g, W, 7));
  let d = [b[3] - b[0], b[4] - b[1], b[5] - b[2]];
  const ry = ((rotDeg[1] % 360) + 360) % 360;
  if (ry === 90 || ry === 270) d = [d[2], d[1], d[0]];
  const s = Math.min(8, Math.max(0.05, len / (d[2] || 1)));
  return d.map((v) => v * s);
}
const aabbMax = (R, d) => Math.max(...[0, 1, 2].map((r) => Math.abs(R[r]) * d[0] + Math.abs(R[3 + r]) * d[1] + Math.abs(R[6 + r]) * d[2]));
const rotOf = (m) => { const a = axisLen(m, 0) || 1, b = axisLen(m, 1) || 1, c = axisLen(m, 2) || 1; return [m[0] / a, m[1] / a, m[2] / a, m[4] / b, m[5] / b, m[6] / b, m[8] / c, m[9] / c, m[10] / c]; };

const WPN = [['uzi', 0.60, [0, 270, 0]], ['ak', 0.88, [0, 270, 0]], ['awp', 1.15, [0, 90, 0]]];
const boxes = WPN.map((w) => weaponBox(w[0], w[1], w[2]));
console.log('caixa real das armas (m):', WPN.map((w, i) => `${w[0]}=[${boxes[i].map((v) => v.toFixed(2)).join(',')}]`).join('  '));

const R1 = [];
for (const id of CHARS) {
  const file = path.join(PUB, 'models/characters', `${id}.glb`);
  if (!fs.existsSync(file)) { console.log(`${id}: SEM MODELO`); continue; }
  const g = readGLB(file), sc = buildScene(g);
  const hand = sc.nodes.find((n) => RX_HAND.test(n.name)) || sc.nodes.find((n) => RX_ANY.test(n.name));
  const fore = sc.nodes.find((n) => RX_FORE.test(n.name));
  if (!hand) { console.log(`${id}: SEM OSSO DE MÃO`); continue; }
  const Wb = worldMats(sc);
  const bb = bboxOf(skinVerts(sc, g, Wb, 3));
  const S = TARGET_H / ((bb[4] - bb[1]) || 1);          // = o que o three mede (bbox com skinning)
  const chain = axisLen(Wb[hand.i], 0) * S;             // escala acumulada do osso da mão (mundo)
  const pick = (s) => (fs.existsSync(path.join(PUB, 'models/anims', id, `${s}.glb`)) ? path.join(PUB, 'models/anims', id, `${s}.glb`) : path.join(PUB, 'models/anims/mixamo', `${s}.glb`));
  const Wi = poseWith(sc, pick('idle'), T);
  const hp = xform(Wi[hand.i], [0, 0, 0]).map((v) => v * S);
  const ep = fore ? xform(Wi[fore.i], [0, 0, 0]).map((v) => v * S) : null;
  const dir = ep ? norm(sub(hp, ep)) : null;             // vetor que HOJE vira o cano
  const yaw = dir ? Math.atan2(dir[0], dir[2]) * 180 / Math.PI : NaN;
  const pitch = dir ? Math.asin(Math.max(-1, Math.min(1, dir[1]))) * 180 / Math.PI : NaN;
  const R = rotOf(Wb[hand.i]);
  const err = boxes.map((d) => Math.max(...d) / aabbMax(R, d));   // renderizado / real
  const vi = skinVerts(sc, g, Wi, 3).map((v) => ({ ...v, p: v.p.map((x) => x * S) }));
  const bi = bboxOf(vi), y0 = bi[1];
  const ji = (g.json.skins[0].joints || []).indexOf(hand.i);
  let pc = [0, 0, 0], pn = 0;
  for (const v of vi) { if (!v.j) continue; let w = 0; for (let k = 0; k < 4; k++) if (v.j[k] === ji) w += v.w[k]; if (w > 0.5) { pc = [pc[0] + v.p[0], pc[1] + v.p[1], pc[2] + v.p[2]]; pn++; } }
  const palm = pn ? pc.map((x) => x / pn) : null;
  let zmax = -Infinity;
  for (const v of vi) {
    if (Math.abs(v.p[1] - hp[1]) > 0.07) continue;
    let w = 0; if (v.j) for (let k = 0; k < 4; k++) if (v.j[k] === ji) w += v.w[k];
    if (w > 0.2) continue;                               // ignora a própria mão
    if (Math.abs(v.p[0]) > 0.30) continue;               // só tronco (braço esticado fora)
    zmax = Math.max(zmax, v.p[2]);
  }
  const gz = palm ? palm[2] : hp[2];
  R1.push({ id, H: bb[4] - bb[1], S, chain, hy: hp[1] - y0, yaw, pitch, err, palm, hp, zmax, buried: isFinite(zmax) && gz < zmax, need: isFinite(zmax) ? zmax - gz + 0.04 : 0, dPalm: palm ? Math.hypot(...sub(palm, hp)) : null });
}
console.log('\n=== 1. rig, mount e ângulo do cano (algoritmo ATUAL) ===');
console.log('id            altura  escala  escOsso  mãoY   cano_yaw°  cano_pitch°  erroEsc uzi/ak/awp');
for (const r of R1) console.log(`${r.id.padEnd(13)}${f(r.H)} ${f(r.S)} ${f(r.chain, 4)} ${f(r.hy)} ${f(r.yaw, 1)}    ${f(r.pitch, 1)}     ${r.err.map((e) => e.toFixed(2)).join(' / ')}`);
console.log('\nyaw 0 = cano pra FRENTE; |yaw|>60 = arma atravessada/pra trás. pitch<0 = cano pro CHÃO.');
console.log('erroEsc = tamanho renderizado / real (a AABB em mundo encolhe quando o osso está girado).');

console.log('\n=== 2. palma × osso × tronco (m, personagem já em 1,72 m) ===');
console.log('id            palma-osso  palmaZ  frenteTroncoZ  arma nasce dentro do corpo?');
for (const r of R1) console.log(`${r.id.padEnd(13)}${f(r.dPalm)}     ${f(r.palm ? r.palm[2] : null)}  ${f(r.zmax)}        ${r.buried ? 'SIM (falta ' + r.need.toFixed(3) + ' m pra fora)' : 'não'}`);

// ---------- 3. a palma está DENTRO da silhueta do corpo? (caso Dollynho) ----------
// Mascote de braço-toco: a palma fica dentro do volume do tronco, então a arma montada
// nela nasce ENTERRADA na malha e o dono lê como "não segura arma nenhuma". Medimos o
// raio da palma em torno do eixo do corpo contra o raio da MALHA (sem a própria mão) na
// mesma altura e na mesma direção — número, não olhômetro.
console.log('\n=== 3. palma dentro da silhueta do corpo? ===');
console.log('id            raioPalma  raioCorpo(mesma direção)  folga    veredito');
for (const id of CHARS) {
  const file = path.join(PUB, 'models/characters', `${id}.glb`);
  if (!fs.existsSync(file)) continue;
  const g = readGLB(file), sc = buildScene(g);
  const hand = sc.nodes.find((n) => RX_HAND.test(n.name)) || sc.nodes.find((n) => RX_ANY.test(n.name));
  if (!hand) continue;
  const S = TARGET_H / ((bboxOf(skinVerts(sc, g, worldMats(sc), 3))[4] - bboxOf(skinVerts(sc, g, worldMats(sc), 3))[1]) || 1);
  const Wi = poseWith(sc, fs.existsSync(path.join(PUB, 'models/anims', id, 'idle.glb')) ? path.join(PUB, 'models/anims', id, 'idle.glb') : path.join(PUB, 'models/anims/mixamo/idle.glb'), T);
  const vi = skinVerts(sc, g, Wi, 3).map((v) => ({ ...v, p: v.p.map((x) => x * S) }));
  const ji = (g.json.skins[0].joints || []).indexOf(hand.i);
  const armJ = new Set(sc.nodes.filter((n) => /hand|forearm|arm\b/i.test(n.name)).map((n) => (g.json.skins[0].joints || []).indexOf(n.i)));
  let pc = [0, 0, 0], pn = 0;
  for (const v of vi) { if (!v.j) continue; let w = 0; for (let k = 0; k < 4; k++) if (v.j[k] === ji) w += v.w[k]; if (w > 0.5) { pc = [pc[0] + v.p[0], pc[1] + v.p[1], pc[2] + v.p[2]]; pn++; } }
  if (!pn) { console.log(`${id.padEnd(13)} sem palma medível`); continue; }
  const palm = pc.map((x) => x / pn);
  const dirp = norm([palm[0], 0, palm[2]]);
  const rp = Math.hypot(palm[0], palm[2]);
  let rc = 0;
  for (const v of vi) {
    if (Math.abs(v.p[1] - palm[1]) > 0.05) continue;
    let aw = 0; if (v.j) for (let k = 0; k < 4; k++) if (armJ.has(v.j[k])) aw += v.w[k];
    if (aw > 0.3) continue;                                  // fora braço/mão: só corpo
    const proj = v.p[0] * dirp[0] + v.p[2] * dirp[2];        // alcance do corpo NA direção da palma
    const lat = Math.abs(v.p[0] * dirp[2] - v.p[2] * dirp[0]);
    if (lat > 0.07) continue;                                 // só o que está na linha da palma
    rc = Math.max(rc, proj);
  }
  const folga = rp - rc;
  console.log(`${id.padEnd(13)}${f(rp)}      ${f(rc)}              ${f(folga)}  ${folga < 0.02 ? 'ENTERRADA -> precisa de mount próprio' : 'ok'}`);
}

// ---------- 4. o que o MOUNT V2 (glbchars.js) faz em cada rig ----------
// Replica a regra que foi pro código: perfil de raio do tronco por faixa de 5 cm (sem
// braços/mãos), palma medida, empurrão = raio_tronco + folga - raio_palma - tolerância.
const TP_CLEAR = 0.06, TP_BURIED_TOL = 0.10, TP_CLEAR_MAX = 0.20;
console.log('\n=== 4. MOUNT V2: empurrão aplicado por personagem ===');
console.log('id            raioPalma  raioTronco(perfil)  empurrão   cano antes -> depois');
for (const id of CHARS) {
  const file = path.join(PUB, 'models/characters', `${id}.glb`);
  if (!fs.existsSync(file)) continue;
  const g = readGLB(file), sc = buildScene(g);
  const hand = sc.nodes.find((n) => RX_HAND.test(n.name)) || sc.nodes.find((n) => RX_ANY.test(n.name));
  const fore = sc.nodes.find((n) => RX_FORE.test(n.name));
  if (!hand) continue;
  const joints = g.json.skins[0].joints || [];
  const armJ = new Set(sc.nodes.filter((n) => /arm|hand|shoulder|clavicle|curl/i.test(n.name)).map((n) => joints.indexOf(n.i)).filter((i) => i >= 0));
  // perfil no espaço da MALHA (= espaço local do model, com bind identidade)
  const prof = new Float32Array(64);
  {
    const mn = sc.nodes.find((n) => n.mesh !== undefined && n.skin !== undefined);
    const p = g.json.meshes[mn.mesh].primitives[0];
    const P = accessor(g, p.attributes.POSITION), J = accessor(g, p.attributes.JOINTS_0), WT = accessor(g, p.attributes.WEIGHTS_0);
    for (let i = 0; i < P.length / 3; i += 3) {
      let w = 0; for (let k = 0; k < 4; k++) if (armJ.has(J[i * 4 + k])) w += WT[i * 4 + k];
      if (w > 0.3) continue;
      const b = Math.floor(P[i * 3 + 1] / 0.05);
      if (b < 0 || b >= 64) continue;
      const r = Math.hypot(P[i * 3], P[i * 3 + 2]);
      if (r > prof[b]) prof[b] = r;
    }
  }
  const Wi = poseWith(sc, fs.existsSync(path.join(PUB, 'models/anims', id, 'idle.glb')) ? path.join(PUB, 'models/anims', id, 'idle.glb') : path.join(PUB, 'models/anims/mixamo/idle.glb'), T);
  const vi = skinVerts(sc, g, Wi, 3);
  const ji = joints.indexOf(hand.i);
  let pc = [0, 0, 0], pn = 0;
  for (const v of vi) { if (!v.j) continue; let w = 0; for (let k = 0; k < 4; k++) if (v.j[k] === ji) w += v.w[k]; if (w > 0.5) { pc = [pc[0] + v.p[0], pc[1] + v.p[1], pc[2] + v.p[2]]; pn++; } }
  if (!pn) { console.log(`${id.padEnd(13)} sem palma`); continue; }
  const palm = pc.map((x) => x / pn);
  const b = Math.floor(palm[1] / 0.05);
  let rt = 0; for (let k = b - 1; k <= b + 1; k++) if (k >= 0 && k < 64 && prof[k] > rt) rt = prof[k];
  const rp = Math.hypot(palm[0], palm[2]);
  const need = Math.max(0, Math.min(TP_CLEAR_MAX, rt + TP_CLEAR - rp - TP_BURIED_TOL));
  const hp = xform(Wi[hand.i], [0, 0, 0]);
  const ep = fore ? xform(Wi[fore.i], [0, 0, 0]) : null;
  const d = ep ? norm(sub(hp, ep)) : [0, 0, 1];
  const yaw0 = Math.atan2(d[0], d[2]) * 180 / Math.PI, p0 = Math.asin(clampN(d[1])) * 180 / Math.PI;
  console.log(`${id.padEnd(13)}${f(rp)}      ${f(rt)}          ${f(need)}   yaw ${yaw0.toFixed(0).padStart(3)}°/pitch ${p0.toFixed(0).padStart(3)}° -> yaw 4°/pitch -6°`);
}
function clampN(v) { return Math.max(-1, Math.min(1, v)); }
