// rig-from-donor.mjs — give an UNRIGGED Mint mesh a working Meshy skeleton by
// transplanting a DONOR character's skeleton (same bone names the shared clips were
// baked against) and auto-skinning the mesh by bone-segment proximity.
//
// Why: Mint's humanoid classifier stalled (humanoidRiggable=null) so animate_generated_model
// refuses these meshes. But every Meshy rig shares identical bone names, and the shared
// clips (idle/walk/run/...) were baked on ONE reference rig (mst). So we clone mst's
// skeleton onto the clown mesh → the shared clips drive it directly, no per-char retarget.
//
// CRITICAL: the donor skeleton lives under an `Armature` node scaled 0.01 (bones are in cm,
// Hips.y≈82). The shared clips animate the Hips translation in that cm space. We MUST
// recreate that Armature (and any ancestor chain) so the clip's Hips translation is scaled
// back to metres — dropping it makes the mesh shoot ~82m up (or, with unit bones, explode).
//
// Alignment: donor MESH is in metres (H≈1.7, feet≈0); the Mint "normalized" mesh is a unit
// box centred at origin. Uniform-scale the mesh to donorH and translate feet→donorFootY,
// centre X/Z. mst's inverseBindMatrices map that metre mesh-space to the cm joint-space, so
// reusing them on our metre-aligned mesh is consistent.
//
// Skinning: per vertex, distance to every bone SEGMENT (parentWorld→jointWorld); nearest 2,
// weight ∝ 1/d² (normalised). Rigid-ish but smooth enough for distant bots.
//
// usage: node tools/rig-from-donor.mjs <donor.glb> <mesh.glb> <out.glb>
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import * as THREE from '../public/vendor/three.module.js';

const [, , donorPath, meshPath, outPath] = process.argv;
if (!donorPath || !meshPath || !outPath) { console.error('usage: rig-from-donor <donor.glb> <mesh.glb> <out.glb>'); process.exit(1); }
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

function worldMap(doc) {
  const info = new Map();
  for (const n of doc.getRoot().listNodes()) info.set(n, new THREE.Matrix4().compose(
    new THREE.Vector3().fromArray(n.getTranslation()), new THREE.Quaternion().fromArray(n.getRotation()), new THREE.Vector3().fromArray(n.getScale())));
  const parent = new Map();
  for (const n of doc.getRoot().listNodes()) for (const c of n.listChildren()) parent.set(c, n);
  const wm = new Map();
  const world = (n) => { if (wm.has(n)) return wm.get(n); const p = parent.get(n); const m = p ? new THREE.Matrix4().multiplyMatrices(world(p), info.get(n)) : info.get(n).clone(); wm.set(n, m); return m; };
  for (const n of doc.getRoot().listNodes()) world(n);
  return { wm, parent };
}
function meshBBox(doc) {
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9], any = false, el = [];
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) {
    const a = p.getAttribute('POSITION'); if (!a) continue; any = true;
    for (let i = 0; i < a.getCount(); i++) { a.getElement(i, el); for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], el[k]); mx[k] = Math.max(mx[k], el[k]); } }
  }
  return any ? { mn, mx } : null;
}

// ================= DONOR: extract skeleton + armature chain =================
const donor = await io.read(donorPath);
const dSkin = donor.getRoot().listSkins()[0];
if (!dSkin) { console.error('donor has no skin'); process.exit(1); }
const dJoints = dSkin.listJoints();
const jSet = new Set(dJoints);
const dIBM = dSkin.getInverseBindMatrices().getArray();
const { wm: dWM, parent: dParent } = worldMap(donor);

const rootJoint = dJoints.find(j => !jSet.has(dParent.get(j)));   // joint whose parent is not a joint
// ancestor (armature) chain of the root joint: nearest-first up to scene
const armChain = [];
for (let a = dParent.get(rootJoint); a; a = dParent.get(a)) armChain.push({ name: a.getName(), t: a.getTranslation(), r: a.getRotation(), s: a.getScale() });

const jointInfo = dJoints.map((j) => {
  const p = dParent.get(j);
  return { name: j.getName(), t: j.getTranslation(), r: j.getRotation(), s: j.getScale(),
    parentName: jSet.has(p) ? p.getName() : null, world: new THREE.Vector3().setFromMatrixPosition(dWM.get(j)) };
});
const nameToIdx = new Map(jointInfo.map((j, i) => [j.name, i]));
const segs = jointInfo.map((j, i) => {
  const pi = j.parentName != null ? nameToIdx.get(j.parentName) : null;
  const a = j.world, b = pi != null ? jointInfo[pi].world : j.world.clone().add(new THREE.Vector3(0, -0.05, 0));
  return { a, b, idx: i };
});
const dBox = meshBBox(donor);
const donorH = dBox.mx[1] - dBox.mn[1], donorFootY = dBox.mn[1];

// ================= MESH: read + align =================
const doc = await io.read(meshPath);
const mBox = meshBBox(doc);
const scale = donorH / (mBox.mx[1] - mBox.mn[1]);
const cx = (mBox.mn[0] + mBox.mx[0]) / 2, cz = (mBox.mn[2] + mBox.mx[2]) / 2;
const tx = -cx * scale, tz = -cz * scale, ty = donorFootY - mBox.mn[1] * scale;
const alignPt = (v) => new THREE.Vector3(v[0] * scale + tx, v[1] * scale + ty, v[2] * scale + tz);
const buffer = doc.getRoot().listBuffers()[0] || doc.createBuffer();
const scene = doc.getRoot().listScenes()[0];

// ---- recreate armature chain (top-of-chain under scene, nested down) ----
const armNodes = armChain.map(a => doc.createNode(a.name).setTranslation(a.t).setRotation(a.r).setScale(a.s));
for (let i = armChain.length - 1; i > 0; i--) armNodes[i].addChild(armNodes[i - 1]);
if (armNodes.length) scene.addChild(armNodes[armNodes.length - 1]);
const armParent = armNodes.length ? armNodes[0] : scene;

// ---- rebuild joints with ORIGINAL local TRS ----
const newNodes = jointInfo.map(j => doc.createNode(j.name).setTranslation(j.t).setRotation(j.r).setScale(j.s));
jointInfo.forEach((j, i) => { if (j.parentName != null) newNodes[nameToIdx.get(j.parentName)].addChild(newNodes[i]); });
armParent.addChild(newNodes[nameToIdx.get(rootJoint.getName())]);

const ibmAcc = doc.createAccessor().setType('MAT4').setArray(Float32Array.from(dIBM)).setBuffer(buffer);
const skin = doc.createSkin('rig').setInverseBindMatrices(ibmAcc).setSkeleton(newNodes[nameToIdx.get(rootJoint.getName())]);
newNodes.forEach(n => skin.addJoint(n));

// ---- skin every primitive (align positions + proximity weights) ----
function segDist(p, s) {
  const ab = new THREE.Vector3().subVectors(s.b, s.a), ap = new THREE.Vector3().subVectors(p, s.a);
  let t = ab.lengthSq() > 1e-9 ? ap.dot(ab) / ab.lengthSq() : 0; t = Math.max(0, Math.min(1, t));
  return new THREE.Vector3().copy(s.a).addScaledVector(ab, t).distanceToSquared(p);
}
for (const mesh of doc.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const posA = prim.getAttribute('POSITION'); if (!posA) continue;
    const n = posA.getCount();
    const posArr = Float32Array.from(posA.getArray());
    const JI = new Uint16Array(n * 4), JW = new Float32Array(n * 4), el = [];
    for (let i = 0; i < n; i++) {
      posA.getElement(i, el);
      const p = alignPt(el);
      posArr[i * 3] = p.x; posArr[i * 3 + 1] = p.y; posArr[i * 3 + 2] = p.z;
      // nearest-4 bone segments com falloff suave (potência 1.5): mistura ao longo da
      // articulação em vez de pular entre 2 ossos (nearest-2 rígido pinçava cotovelo/joelho).
      const best = [{ i: 0, d: 1e18 }, { i: 0, d: 1e18 }, { i: 0, d: 1e18 }, { i: 0, d: 1e18 }];
      for (const s of segs) {
        const d = segDist(p, s);
        if (d < best[3].d) { best[3] = { i: s.idx, d }; best.sort((a, b) => a.d - b.d); }
      }
      let ws = 0; const w = best.map((b) => { const x = 1 / Math.pow(b.d + 1e-5, 1.5); ws += x; return x; });
      for (let k = 0; k < 4; k++) { JI[i * 4 + k] = best[k].i; JW[i * 4 + k] = w[k] / ws; }
    }
    posA.setArray(posArr);
    prim.setAttribute('JOINTS_0', doc.createAccessor().setType('VEC4').setArray(JI).setBuffer(buffer));
    prim.setAttribute('WEIGHTS_0', doc.createAccessor().setType('VEC4').setArray(JW).setBuffer(buffer));
  }
  for (const nd of doc.getRoot().listNodes()) if (nd.getMesh() === mesh) nd.setSkin(skin).setTranslation([0, 0, 0]).setRotation([0, 0, 0, 1]).setScale([1, 1, 1]);
}

await io.write(outPath, doc);
console.log(`ok: ${outPath.split('/').pop()}  ${jointInfo.length} bones + ${armChain.length} armature node(s) from ${donorPath.split('/').pop()}  (scale ${scale.toFixed(3)})`);
