// Retrato FOTORREALISTA de cada personagem, com a identidade travada pelo render do modelo.
//
// É a etapa 2 do pipeline que começa em `tools/gen-char-video.mjs`. A ordem importa
// e é o ponto inteiro desta ferramenta:
//
//   1. `public/charvideo.html` renderiza o GLB REAL (mesmo rig, mesma luz do jogo)
//   2. esse frame vira `--ref` do modelo de imagem
//   3. o modelo só troca o MEIO — de render estilizado para fotografia
//
// Sem o passo 1 o modelo desenha *um* mandrake. Com ele, desenha O Mandrake: a
// referência é que responde "quem é", e o prompt responde só "como é fotografado".
// Por isso o prompt abaixo é GENÉRICO e igual para os 44 — descrever a roupa de
// cada um à mão seria reintroduzir, em texto, a chance de errar o personagem.
//
// A saída NUNCA sobrescreve a do passo 1: sufixo `-realista`. Uma corrida com chave
// não pode apagar o render fiel, que é o único artefato que não dá para refazer sem
// o browser.
//
// Uso:
//   node tools/gen-char-realista.mjs --ids mandrake,canarinho --base http://localhost:8137
//   node tools/gen-char-realista.mjs --todos
//
// Flags:
//   --ids a,b,c    lista de personagens (obrigatório, salvo --todos)
//   --todos        o elenco inteiro de public/models/characters/
//   --shot         busto (padrão) | corpo
//   --model        padrão openai/gpt-5-image
//   --out          padrão /tmp/gen-char-realista (use --publicar para ir a public/img)
//   --publicar     grava em public/img/chars-realista/<id>.webp já recortado
//   --base         padrão http://localhost:8137 (suba `node tools/eval/serve.mjs 8137`)
//   --forcar       regera mesmo se a saída já existir
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const flag = (n) => argv.includes(`--${n}`);
const die = (m) => { console.error('ERRO:', m); process.exit(1); };

const SHOT = arg('shot', 'busto');
const MODEL = arg('model', 'openai/gpt-5-image');
const BASE = arg('base', process.env.BASE || 'http://localhost:8137');
const PUBLICAR = flag('publicar');
const FORCAR = flag('forcar');
const OUT = arg('out', PUBLICAR ? 'public/img/chars-realista' : '/tmp/gen-char-realista');
const TMP = '/tmp/gen-char-realista/refs';

let IDS;
if (flag('todos')) {
  IDS = readdirSync('public/models/characters').filter((f) => f.endsWith('.glb')).map((f) => f.replace(/\.glb$/, '')).sort();
} else {
  const s = arg('ids');
  if (!s) die('faltou --ids (ou --todos)');
  IDS = s.split(',').map((x) => x.trim()).filter(Boolean);
}

/* O PROMPT É GENÉRICO DE PROPÓSITO — ver o cabeçalho. Ele diz o que PRESERVAR (tudo
   que define quem é) e o que MUDAR (só o meio). A tentação de descrever a roupa
   personagem por personagem é justamente o erro que a referência existe para evitar. */
const PROMPT = [
  'Fotografia de retrato do personagem da imagem de referência.',
  '',
  'PRESERVE COM EXATIDÃO, sem inventar nem substituir nada: o rosto e suas proporções,',
  'o tom de pele, o cabelo e o corte, todos os acessórios de cabeça (boné, chapéu, capuz,',
  'faixa, máscara), os óculos e a cor exata das lentes, cada peça de roupa com as MESMAS',
  'cores, o mesmo recorte e os mesmos blocos de cor, correntes e joias, tatuagens e suas',
  'posições, e qualquer adereço que apareça. Mesma pose, mesmo ângulo da cabeça e do',
  'tronco, mesmo enquadramento.',
  '',
  'MUDE APENAS O MEIO: em vez de um render 3D estilizado, entregue uma fotografia feita',
  'com câmera real e lente de retrato. Pele com poros, pelos finos e dispersão',
  'subsuperficial; tecido com trama, costura e fiapos; metal com reflexo especular; couro',
  'e plástico com micro-riscos. Profundidade de campo rasa com o rosto em foco. Luz de',
  'estúdio contrastada vinda da esquerda, preenchimento suave à direita, recorte de luz na',
  'silhueta. Fundo liso escuro neutro, sem cenário.',
  '',
  'NÃO acrescente texto, legenda, marca de água, logotipo inventado nem moldura.',
  'NÃO troque a etnia, o tipo físico, a idade aparente ou o gênero do personagem.',
].join('\n');

mkdirSync(TMP, { recursive: true });
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });

let feitos = 0, pulados = 0, falhas = 0;
for (const ID of IDS) {
  const saida = `${OUT}/${ID}-realista.${PUBLICAR ? 'webp' : 'png'}`;
  if (!FORCAR && existsSync(saida)) { console.log(`· ${ID} já existe, pulando (use --forcar)`); pulados++; continue; }

  const ref = `${TMP}/${ID}-${SHOT}.png`;
  try {
    // 1. render fiel do modelo
    await page.goto(`${BASE}/charvideo.html?id=${encodeURIComponent(ID)}&bg=alpha&shot=${SHOT}&w=512&h=512`,
      { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.CHARVID && window.CHARVID.ready, null, { timeout: 120000 });
    const dataUrl = await page.evaluate(() => { window.CHARVID.reset(); return window.CHARVID.grab(); });
    writeFileSync(ref, Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'));
  } catch (e) {
    console.error(`✗ ${ID}: falhou no render — ${String(e.message || e).slice(0, 140)}`);
    falhas++; continue;
  }

  // 2. acabamento realista, com o render como referência
  const flags = ['tools/gen-image.mjs', '--id', `${ID}-realista`, '--ref', ref,
    '--model', MODEL, '--aspect', '1:1', '--prompt', PROMPT];
  if (PUBLICAR) flags.push('--out', OUT, '--crop', '1:1', '--w', '512');
  else flags.push('--raw-only');

  try {
    const saidaTxt = execFileSync('node', flags, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const linha = saidaTxt.trim().split('\n').filter((l) => l.includes('→') || l.includes('->')).pop() || saidaTxt.trim().split('\n').pop();
    console.log(`✓ ${ID}  ${linha.trim()}`);
    feitos++;
  } catch (e) {
    console.error(`✗ ${ID}: gen-image falhou — ${String(e.stderr || e.message).slice(0, 200)}`);
    falhas++;
  }
}

await browser.close();
console.log(`\n${feitos} gerado(s), ${pulados} pulado(s), ${falhas} falha(s).`);
console.log(PUBLICAR ? `publicados em ${OUT}/` : `crus em /tmp/gen-image/ (referências em ${TMP}/)`);
if (falhas) process.exit(1);
