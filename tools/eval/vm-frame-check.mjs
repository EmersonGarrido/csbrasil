// Confere a geometria do enquadramento SEM browser: reproduz a formula do _vmFrame
// e imprime, por arma, onde a coronha e a boca caem em NDC nos dois aspectos.
import { readFileSync } from 'node:fs';
const src = readFileSync('/root/csb/public/js/vmattach.js','utf8');
const wsrc = readFileSync('/root/csb/public/js/weapons.js','utf8');
const F = JSON.parse(JSON.stringify(eval('(' + src.slice(src.indexOf('export const VM_FRAME = {')+24, src.indexOf('\n};', src.indexOf('export const VM_FRAME = {'))+2) + ')')));
const CFG = {};
for (const m of wsrc.matchAll(/(\w+):\s*\{\s*len:\s*([\d.]+),\s*rot:[^}]*?gripZ:\s*([\d.]+)([^}]*)\}/g)) {
  const vm = /vm:\s*([\d.]+)/.exec(m[4]); CFG[m[1]] = { len: +m[2], gripZ: +m[3], vm: vm ? +vm[1] : 1 };
}
const V0 = 62, NEAR_X = 0.80;
for (const asp of [16/9, 3/2]) {
  const halfTanH = Math.tan(V0/2*Math.PI/180) * asp;
  let worstNear = 0, worstName = '', minLeft = 9;
  for (const id of Object.keys(F.classOf)) {
    const cfg = CFG[id]; if (!cfg) continue;
    const t = F.cls[F.classOf[id]] || F.cls.rifle;
    const S = F.vmScale * (cfg.vm ?? 1);
    const back = S * cfg.len * (1 - cfg.gripZ), fwd = S * cfg.len * cfg.gripZ;
    let Zg = Math.max(back + t.clear, t.minz, fwd / t.fwdTan) * (F.zMul[id] || 1); Zg *= 1.35;
    const lim = NEAR_X * halfTanH;
    if (lim > t.tanH + 1e-3 && back > 0) Zg = Math.max(Zg, (back*lim)/(lim - t.tanH));
    const gx = Zg * t.tanH;
    const zNear = Zg - back, zFar = Zg + fwd;
    const ndcNear = (gx/zNear)/halfTanH, ndcFar = (gx/zFar)/halfTanH;
    if (ndcNear > worstNear) { worstNear = ndcNear; worstName = id; }
    minLeft = Math.min(minLeft, ndcFar);
    if (asp === 3/2 && ['ak','awp','uzi','deagle','p90','knife'].includes(id))
      console.log(` ${id.padEnd(7)} Zg=${Zg.toFixed(3)} coronha z=${zNear.toFixed(3)}m ndcX=${ndcNear.toFixed(2)}  boca ndcX=${ndcFar.toFixed(2)}`);
  }
  console.log(`asp ${asp.toFixed(2)}: pior coronha NDC ${worstNear.toFixed(3)} (${worstName})  |  boca mais a esquerda NDC ${minLeft.toFixed(3)}`);
}
