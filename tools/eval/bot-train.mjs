/* ============================================================================
   bot-train.mjs — TREINO DA REDE DOS BOTS (behavioral cloning, tfjs-node).
   ----------------------------------------------------------------------------
   Lê os pares (estado→ação) — do dataset bootstrap (bots roteirizados) e/ou do Supabase
   (jogadores reais) — e treina um MLP que mapeia estado→ação. É a "rede de verdade": pesos
   aprendidos por gradiente descendente, não tabela à mão. Exporta pro formato que o TF.js
   do navegador carrega direto (public/models/bot-brain/).

   Duas cabeças, porque as saídas têm naturezas diferentes:
     contínua  [moveFwd, moveStrafe, dyaw, dpitch]  → tanh + MSE
     binária   [fire, crouch, reload]               → sigmoid + BCE

   REQUER @tensorflow/tfjs-node instalado LOCALMENTE (não é dep do projeto — é uma nativa de
   100+ MB usada só aqui, no treino offline; instale com `npm i -D @tensorflow/tfjs-node`).

   Uso: node tools/eval/bot-train.mjs [--epochs=40] [--data=caminho.ndjson] [--from-supabase]
   ============================================================================ */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

let tf;
try { tf = await import('@tensorflow/tfjs-node'); }
catch { console.error('bot-train precisa do tfjs-node: npm i -D @tensorflow/tfjs-node'); process.exit(2); }

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STATE_DIM = 27, ACTION_DIM = 7;
const CONT_IDX = [0, 1, 2, 3];   // moveFwd, moveStrafe, dyaw, dpitch
const BIN_IDX = [4, 5, 6];       // fire, crouch, reload
const OUT_DIR = path.resolve(HERE, '../../public/models/bot-brain');

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true];
}));
const EPOCHS = parseInt(args.epochs || '40', 10);
const DATA_DIR = path.join(HERE, 'data');
// Por padrão treina com TODO ndjson de tools/eval/data/: bootstrap.ndjson (professor
// roteirizado) + collected.ndjson (VOCÊ jogando, via sink local do /api/train-frames).
// Assim seus dados entram no treino sem passo extra. --data=arquivo força um só.
const DATA_FILES = args.data
  ? [path.resolve(process.cwd(), args.data)]
  : (fs.existsSync(DATA_DIR) ? fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.ndjson')).map((f) => path.join(DATA_DIR, f)) : []);
const MIN_FRAMES = parseInt(args['min-frames'] || '2000', 10);

// ---- carregar lotes (mesmo shape do /api/train-frames: {dims,n,data(base64 Int8)}) ----
function decodeBatch(b) {
  const S = b.dims.s, A = b.dims.a, n = b.n;
  if (S !== STATE_DIM || A !== ACTION_DIM) return null;
  const bytes = Buffer.from(b.data, 'base64');
  if (bytes.length !== n * (S + A)) return null;
  const i8 = new Int8Array(bytes.buffer, bytes.byteOffset, bytes.length);
  const X = [], Y = [];
  for (let f = 0; f < n; f++) {
    const base = f * (S + A);
    const x = new Array(S), y = new Array(A);
    for (let i = 0; i < S; i++) x[i] = i8[base + i] / 127;
    for (let i = 0; i < A; i++) y[i] = i8[base + S + i] / 127;
    X.push(x); Y.push(y);
  }
  return { X, Y };
}

const X = [], Y = [];
function ingest(lines, tag) {
  let n = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    let b; try { b = JSON.parse(line); } catch { continue; }
    const d = decodeBatch(b); if (!d) continue;
    for (let i = 0; i < d.X.length; i++) { X.push(d.X[i]); Y.push(d.Y[i]); }
    n += d.X.length;
  }
  console.error(`  ${tag}: ${n} frames`);
}

if (DATA_FILES.length) for (const f of DATA_FILES) ingest(fs.readFileSync(f, 'utf8').split('\n'), path.relative(process.cwd(), f));
else console.error(`  (sem dataset em ${DATA_DIR})`);

if (args['from-supabase']) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) console.error('  --from-supabase pedido mas SUPABASE_URL/KEY ausentes — pulando');
  else {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await sb.from('bot_training_frames').select('n,schema,map,mode,weapon,data,state_dim,action_dim').eq('schema', 1).limit(5000);
    if (error) console.error('  supabase erro:', error.message);
    else ingest((data || []).map((r) => JSON.stringify({ dims: { s: r.state_dim, a: r.action_dim }, n: r.n, data: r.data })), 'supabase');
  }
}

if (X.length < MIN_FRAMES) {
  console.error(`\ndados insuficientes: ${X.length} < ${MIN_FRAMES}. Rode bot-record.mjs primeiro.`);
  process.exit(1);
}
console.error(`\nTOTAL: ${X.length} frames`);

// ---- normalização (média/desvio por feature; a inferência aplica o mesmo) ----
const mean = new Array(STATE_DIM).fill(0), std = new Array(STATE_DIM).fill(0);
for (const x of X) for (let i = 0; i < STATE_DIM; i++) mean[i] += x[i];
for (let i = 0; i < STATE_DIM; i++) mean[i] /= X.length;
for (const x of X) for (let i = 0; i < STATE_DIM; i++) { const d = x[i] - mean[i]; std[i] += d * d; }
for (let i = 0; i < STATE_DIM; i++) std[i] = Math.sqrt(std[i] / X.length) || 1;

// OVERSAMPLING do fogo: fire é ~15% dos frames mesmo com a janela de rajada; sem reforço o
// sigmoid tende a nunca cruzar 0.5. Duplica as amostras COM fogo até equilibrar (~1:1).
const fireIdx = [];
for (let i = 0; i < Y.length; i++) if (Y[i][BIN_IDX[0]] > 0.5) fireIdx.push(i);
const fireRate = fireIdx.length / Math.max(1, Y.length);
const dup = fireRate > 0 && fireRate < 0.4 ? Math.min(6, Math.round(0.4 / fireRate) - 1) : 0;
for (let d = 0; d < dup; d++) for (const i of fireIdx) { X.push(X[i]); Y.push(Y[i]); }
console.error(`  fogo ${(fireRate * 100).toFixed(1)}% → +${dup}× oversample (total agora ${X.length})`);

const Xn = X.map((x) => x.map((v, i) => (v - mean[i]) / std[i]));
const Ycont = Y.map((y) => CONT_IDX.map((i) => y[i]));
const Ybin = Y.map((y) => BIN_IDX.map((i) => (y[i] > 0.5 ? 1 : 0)));

const xs = tf.tensor2d(Xn, [Xn.length, STATE_DIM]);
const yc = tf.tensor2d(Ycont, [Ycont.length, CONT_IDX.length]);
const yb = tf.tensor2d(Ybin, [Ybin.length, BIN_IDX.length]);

// ---- modelo: 27 → 64 → 64 → [tanh(4), sigmoid(3)] ----
const input = tf.input({ shape: [STATE_DIM] });
let hidden = tf.layers.dense({ units: 64, activation: 'relu' }).apply(input);
hidden = tf.layers.dense({ units: 64, activation: 'relu' }).apply(hidden);
const outCont = tf.layers.dense({ units: CONT_IDX.length, activation: 'tanh', name: 'cont' }).apply(hidden);
const outBin = tf.layers.dense({ units: BIN_IDX.length, activation: 'sigmoid', name: 'bin' }).apply(hidden);
const model = tf.model({ inputs: input, outputs: [outCont, outBin] });
model.compile({ optimizer: tf.train.adam(0.002), loss: { cont: 'meanSquaredError', bin: 'binaryCrossentropy' } });

console.error(`\ntreinando ${EPOCHS} épocas (params: ${model.countParams()})...`);
await model.fit(xs, [yc, yb], {
  epochs: EPOCHS, batchSize: 256, validationSplit: 0.15, shuffle: true, verbose: 0,
  callbacks: {
    onEpochEnd: (ep, logs) => {
      if (ep % 5 === 0 || ep === EPOCHS - 1)
        console.error(`  época ${ep + 1}/${EPOCHS}  loss ${logs.loss.toFixed(4)}  val ${(logs.val_loss ?? 0).toFixed(4)}  cont ${(logs.cont_loss ?? logs.val_cont_loss ?? 0).toFixed(4)}  bin ${(logs.bin_loss ?? 0).toFixed(4)}`);
    },
  },
});

// ---- exportar (model.json + weights.bin + norm.json) ----
fs.mkdirSync(OUT_DIR, { recursive: true });
await model.save(`file://${OUT_DIR}`);
fs.writeFileSync(path.join(OUT_DIR, 'norm.json'), JSON.stringify({
  stateDim: STATE_DIM, actionDim: ACTION_DIM, contIdx: CONT_IDX, binIdx: BIN_IDX,
  mean, std, frames: X.length, epochs: EPOCHS,
}, null, 0));

xs.dispose(); yc.dispose(); yb.dispose();
console.error(`\nSALVO: ${path.relative(process.cwd(), OUT_DIR)}/ (model.json + weights.bin + norm.json)`);
