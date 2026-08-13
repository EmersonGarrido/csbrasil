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
// A saída NUNCA sobrescreve a do passo 1: sufixo `-<estilo>`. Uma corrida com chave
// não pode apagar o render fiel, que é o único artefato que não dá para refazer sem
// o browser.
//
// Uso:
//   node tools/gen-char-realista.mjs --ids mandrake,canarinho --base http://localhost:8137
//   node tools/gen-char-realista.mjs --todos --estilo gamer
//
//   --estilo gamer|foto   gamer (padrao) = hero render 3D estilizado, casa com o jogo.
//                         foto = retrato fotorrealista de estudio.
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

/* OS PROMPTS SÃO GENÉRICOS DE PROPÓSITO — ver o cabeçalho. Cada um diz o que
   PRESERVAR (tudo que define quem é) e o que MUDAR (só o acabamento). Descrever a
   roupa personagem por personagem seria reintroduzir, em texto, exatamente a chance
   de errar o personagem que a referência existe para eliminar.

   As duas travas do fim nasceram de defeito MEDIDO na primeira leva de 5: o modelo
   pôs uma corrente prateada no canarinho (o busto corta na gola e ele preencheu o
   vazio) e trocou o casaco rosa do palhacomal por couro vinho — ele "conserta" para
   o plausível, e plausível não é o personagem. */
const PRESERVAR = [
  'PRESERVE COM EXATIDÃO, sem inventar nem substituir nada: o rosto e suas proporções,',
  'o tom de pele, o cabelo e o corte, todos os acessórios de cabeça (boné, chapéu, capuz,',
  'faixa, máscara), os óculos e a cor exata das lentes, cada peça de roupa com as MESMAS',
  'cores, o mesmo recorte e os mesmos blocos de cor, correntes e joias, tatuagens e suas',
  'posições, e qualquer adereço que apareça. Mesma pose, mesmo ângulo da cabeça e do',
  'tronco, mesmo enquadramento.',
].join('\n');

const TRAVAS = [
  'NÃO acrescente NENHUM objeto que não esteja na referência — nem corrente, colar,',
  'brinco, arma, faca, cigarro nem objeto na mão. Se o enquadramento cortar o peito, o',
  'que fica de fora simplesmente não existe: não preencha.',
  'TRATE COR SATURADA COMO A COR REAL DO TECIDO, não como estilização a corrigir. Rosa',
  'é rosa, verde-limão é verde-limão. Não "amadureça" a paleta para tons realistas.',
  'NÃO acrescente texto, legenda, marca de água, logotipo inventado nem moldura.',
  'NÃO troque a etnia, o tipo físico, a idade aparente ou o gênero do personagem.',
].join('\n');

const PROMPTS = {
  /* ESCOLHIDO como padrão: o jogo é 3D estilizado, então retrato fotorrealista
     brigaria com o próprio personagem que aparece jogando na tela ao lado. */
  gamer: [
    'Render 3D de personagem de videogame AAA moderno, no MESMO estilo estilizado da',
    'referência — NÃO é fotografia, NÃO é pessoa real.', '', PRESERVAR, '',
    'Mantenha a linguagem estilizada de personagem de jogo: feições simplificadas,',
    'silhueta legível, proporção levemente caricata.', '',
    'O QUE MUDA — mais DENSIDADE DE DETALHE que o modelo de origem: malha de alta',
    'resolução no lugar do low-poly (nada de facetas chapadas nem silhueta poligonal),',
    'materiais PBR de verdade com mapa de normal e rugosidade, trama visível no tecido,',
    'costura e barra nas roupas, desgaste e sujeira sutis, metal com reflexo anisotrópico,',
    'tatuagens com traço nítido. Iluminação de game art: luz-chave direcional forte, luz',
    'de contorno separando o personagem do fundo, oclusão de ambiente nas dobras. Fundo',
    'escuro liso neutro.', '',
    'Resultado alvo: o hero render de capa do jogo — Overwatch, Valorant, Fortnite.', '',
    TRAVAS,
  ].join('\n'),

  foto: [
    'Fotografia de retrato do personagem da imagem de referência.', '', PRESERVAR, '',
    'MUDE APENAS O MEIO: em vez de um render 3D estilizado, entregue uma fotografia feita',
    'com câmera real e lente de retrato. Pele com poros, pelos finos e dispersão',
    'subsuperficial; tecido com trama, costura e fiapos; metal com reflexo especular; couro',
    'e plástico com micro-riscos. Profundidade de campo rasa com o rosto em foco. Luz de',
    'estúdio contrastada vinda da esquerda, preenchimento suave à direita, recorte de luz na',
    'silhueta. Fundo liso escuro neutro, sem cenário.', '',
    TRAVAS,
  ].join('\n'),
};

/* DICAS POR PERSONAGEM — a lista de exceções, e ela existe por um motivo medido.
   O modelo não erra ao acaso: ele SUBSTITUI o item específico pelo genérico da
   categoria. Palhaço ganha casaco escuro de circo, médica perde a faixa de cabeça,
   e o Mandrake ganhou um Wayfarer no lugar da Juliet — que é justamente a peça que
   define o arquétipo. Enquadrar melhor resolveu omissão de peça grande (as
   ombreiras do palhaço voltaram); NÃO resolve esse viés, porque aqui o modelo tem
   a informação e escolhe "corrigir".
   A alavanca que funciona é NOMEAR o objeto: o modelo sabe o que é uma Oakley
   Juliet. Por isso a dica é uma linha curta e só para quem escorrega — descrever
   os 44 à mão traria de volta a chance de errar o personagem no texto.
   REGRA: só entra aqui item que já foi visto errado numa geração. Não é lugar de
   palpite preventivo. */
const DICAS = {
  mandrake: 'Os óculos são uma OAKLEY JULIET: armação de metal escovado envolvente, '
    + 'hastes com detalhe de parafuso, lente vermelha em duas peças curvas. NÃO é Wayfarer, '
    + 'NÃO é armação quadrada de acetato, NÃO é óculos redondo de metal fino.',
  doutora: 'Ela usa uma FAIXA/BANDANA na testa, sobre a linha do cabelo, presa por trás. '
    + 'Ela existe na referência e não pode sumir.',
  palhacomal: 'O casaco é ROSA-LILÁS claro, não vinho nem bordô. Mantenha o rosa como está '
    + 'na referência mesmo que pareça improvável para um palhaço sombrio.',
};

const ESTILO = arg('estilo', 'gamer');
if (!PROMPTS[ESTILO]) die(`--estilo desconhecido: ${ESTILO} (use gamer ou foto)`);
const PROMPT_BASE = PROMPTS[ESTILO];
const comDica = (id) => (DICAS[id] ? `${PROMPT_BASE}\n\nATENÇÃO NESTE PERSONAGEM: ${DICAS[id]}` : PROMPT_BASE);

mkdirSync(TMP, { recursive: true });
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });

let feitos = 0, pulados = 0, falhas = 0;
for (const ID of IDS) {
  const saida = `${OUT}/${ID}-${ESTILO}.${PUBLICAR ? 'webp' : 'png'}`;
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
  const flags = ['tools/gen-image.mjs', '--id', `${ID}-${ESTILO}`, '--ref', ref,
    '--model', MODEL, '--aspect', '1:1', '--prompt', comDica(ID)];
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
