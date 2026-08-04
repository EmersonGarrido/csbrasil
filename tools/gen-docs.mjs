#!/usr/bin/env node
// Gera (e VALIDA) os BLOCOS NUMÉRICOS da documentação — README.md, docs/ e os SKILL.md.
//
// POR QUE ESTE SCRIPT EXISTE
// O `.claude/skills/gauntlet-fps/SKILL.md` afirmava que o `game.js` tinha 3.234 linhas
// quando o arquivo já tinha 6.427. O `docs/` inteiro carregava dezenas de números do mesmo
// tipo — contagem de personagens, de armas, de mapas, de scripts do arnês, versão, tamanho
// de arquivo — todos escritos à mão, todos com prazo de validade de um commit.
//
// Corrigir 3.234 para 6.427 dura até o próximo commit. É a mesma lição que criou o
// `tools/gen-arch.mjs` (leia o cabeçalho dele), aplicada agora à documentação inteira:
//
//     número DERIVÁVEL do código   -> bloco GERADO, com `--check` no portão
//     número NÃO derivável         -> não é número, é decisão: escreva sem ele
//
// E a Lei 1 da casa fecha o argumento: o que não vira régua é otimizado para fora. Um
// gerador sem `--check` no `check:fast` desatualiza de novo em uma semana, porque nada
// obriga ninguém a rodá-lo.
//
// USO
//   node tools/gen-docs.mjs            reescreve os blocos gerados nos arquivos alvo
//   node tools/gen-docs.mjs --check    sai 1 se qualquer bloco estiver desatualizado (CI)
//   node tools/gen-docs.mjs --json     imprime TODOS os fatos medidos (para outras ferramentas)
//
// COMO MARCAR UM BLOCO NUM ARQUIVO
//   Markdown puro (README.md, .md lido no GitHub):
//     <!-- BEGIN:GERADO:numeros --> ... <!-- END:GERADO:numeros -->
//   MDX (tudo em docs/docs/, que o Docusaurus 3 compila como MDX — comentário HTML
//   ali é erro de parse, não comentário):
//     {/* BEGIN:GERADO:numeros */} ... {/* END:GERADO:numeros */}
//
// O script preserva a sintaxe do marcador que encontrar, e só reescreve o MIOLO. Texto
// fora dos marcadores é conhecimento humano e nunca é tocado.
//
// REGRA DE OURO DESTE ARQUIVO: todo fato aqui carrega o COMANDO que o reproduz, e o
// comando vai impresso na saída. Afirmação sem procedência é opinião — inclusive a minha.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const R = (p) => join(ROOT, p);
const ler = (p) => readFileSync(R(p), 'utf8');
const existe = (p) => existsSync(R(p));
/* contagem de linhas = `wc -l`, ou seja NEWLINES. O gen-arch.mjs usa split('\n').length,
   que dá +1 em arquivo terminado em newline — é por isso que ARCH.md diz 6.428 e o
   `wc -l` diz 6.427 para o MESMO arquivo. Os dois estão certos; o que não pode é a doc
   escolher um dos dois no olho e não dizer qual. Aqui é sempre `wc -l`. */
const linhas = (p) => {
  const t = ler(p);
  return t.length ? t.split('\n').length - (t.endsWith('\n') ? 1 : 0) : 0;
};
const num = (n) => n.toLocaleString('pt-BR');
const sh = (cmd, args) => {
  try { return execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8' }); } catch { return ''; }
};
const glob = (dir, teste) => (existe(dir) ? readdirSync(R(dir)).filter(teste).sort() : []);
/* Comentário É a cultura deste repo — os arquivos têm parágrafos inteiros explicando de
   onde cada número veio, e vários CITAM a constante com outro valor ("Com CTF_CAPS_TO_WIN
   = 2, o mapa mais lento…"). Ler constante sem tirar comentário antes devolve o número da
   HISTÓRIA em vez do número do CÓDIGO — foi exatamente o que aconteceu na 1ª execução
   deste script, que leu 2 onde o código diz 3. */
const semComentarios = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/* ═══════════════════════════════════════════════════════════ FATOS MEDIDOS
   Cada campo diz de onde veio. Se um `try` falhar, o campo vira null e o bloco que o usa
   diz "não medido" em vez de inventar — silêncio é melhor que número errado. */

function medir() {
  const f = {};

  /* ---- o jogo, em arquivos e linhas ---- */
  const js = glob('public/js', (x) => x.endsWith('.js'));
  f.jogo = {
    arquivos: js.length,
    linhas: js.reduce((a, x) => a + linhas(`public/js/${x}`), 0),
    porArquivo: Object.fromEntries(js.map((x) => [x, linhas(`public/js/${x}`)])),
    cmd: 'cat public/js/*.js | wc -l · ls public/js/*.js | wc -l',
  };

  /* ---- versão: version.js e package.json TÊM que concordar ---- */
  const pkg = JSON.parse(ler('package.json'));
  const vjs = ler('public/js/version.js').match(/VERSION\s*=\s*'([^']+)'/);
  f.versao = {
    jogo: vjs ? vjs[1] : null,
    pacote: pkg.version,
    concordam: !!vjs && vjs[1] === pkg.version,
    cmd: "grep VERSION public/js/version.js · node -p \"require('./package.json').version\"",
  };

  /* ---- assets em GLB ---- */
  f.assets = {
    armas: glob('public/models/weapons', (x) => x.endsWith('.glb')).length,
    personagens: glob('public/models/characters', (x) => x.endsWith('.glb')).length,
    props: glob('public/models/props', (x) => x.endsWith('.glb')).length,
    anims: (sh('git', ['ls-files', 'public/models/anims']).trim().split('\n').filter(Boolean)).length,
    cmd: 'ls public/models/PASTA/*.glb | wc -l · git ls-files public/models/anims | wc -l',
  };

  /* ---- elenco: parseado do array CHARACTERS, não de um grep solto no arquivo inteiro
         (há `team:` fora do array, e grep no arquivo devolvia 47 para 44 personagens) ---- */
  const csrc = ler('public/js/characters.js');
  const ini = csrc.indexOf('export const CHARACTERS');
  const bloco = ini >= 0 ? csrc.slice(ini, csrc.indexOf('\n];', ini)) : '';
  /* id e team lidos JUNTOS, da mesma entrada: as linhas de comentário que separam as
     facções escrevem `team:'C'` no texto, e contá-las dava 47 personagens para 44. */
  const entradas = [...bloco.matchAll(/\{\s*id:\s*'([^']+)',\s*team:\s*'([A-Z])'/g)];
  const times = {};
  for (const [, , t] of entradas) times[t] = (times[t] || 0) + 1;
  f.elenco = {
    total: entradas.length,
    porFaccao: times,
    faccoes: Object.keys(times).length,
    cmd: "array CHARACTERS de public/js/characters.js (node tools/gen-docs.mjs --json)",
  };

  /* ---- mapas: o REGISTRO é a verdade. Arquivo map_*.js no disco não implica mapa
         jogável — o map_pool_ramos.js está no disco e fora do menu de propósito. ---- */
  const msrc = ler('public/js/maps.js');
  const mbloco = msrc.slice(msrc.indexOf('export const MAPS'), msrc.indexOf('\n};', msrc.indexOf('export const MAPS')));
  const mapas = [];
  for (const l of mbloco.split('\n')) {
    const m = /^\s{2}([a-z0-9_]+):\s*\{.*?name:\s*'([^']+)'/.exec(l);
    if (m) mapas.push({ id: m[1], nome: m[2], ctf: /ctfMode:\s*true/.test(l) });
  }
  /* "Fora do registro" = existe no disco e NINGUÉM o importa em maps.js. É o caso do
     map_pool_ramos.js (o "Piscinão"), e a distinção importa: arquivo de mapa em
     public/js/ não implica mapa jogável — quem decide é o objeto MAPS. */
  const arquivosMapa = glob('public/js', (x) => /^map_.*\.js$/.test(x) && /export function build/.test(ler(`public/js/${x}`)));
  const importados = new Set([...msrc.matchAll(/from\s+'\.\/(map_[\w]+\.js)'/g)].map((m) => m[1]));
  f.mapas = {
    registrados: mapas,
    total: mapas.length,
    emCaptura: mapas.filter((m) => m.ctf).length,
    emRodadas: mapas.filter((m) => !m.ctf).length,
    arquivosNoDisco: arquivosMapa.length,
    importados: [...importados],
    foraDoRegistro: arquivosMapa.filter((a) => !importados.has(a)),
    cmd: 'objeto MAPS de public/js/maps.js',
  };

  /* ---- regras de partida: lidas das constantes, não da memória de quem escreveu a doc ---- */
  const gsrc = ler('public/js/game.js');
  const gcode = semComentarios(gsrc);
  const cte = (re) => { const m = re.exec(gcode); return m ? m[1] : null; };
  const linhaDe = (re) => {
    const l = gsrc.split('\n').findIndex((x) => re.test(x));
    return l >= 0 ? l + 1 : null;
  };
  f.regras = {
    roundTime: cte(/\bROUND_TIME\s*=\s*([\d.]+)/),
    roundsToWin: cte(/\bROUNDS_TO_WIN\s*=\s*([\d.]+)/),
    respawn: cte(/\bRESPAWN_DELAY\s*=\s*([\d.]+)/),
    ctfCaps: cte(/\bCTF_CAPS_TO_WIN\s*=\s*([\d.]+)/),
    ctfRounds: cte(/\bCTF_ROUNDS_TO_WIN\s*=\s*([\d.]+)/),
    ctfMatchTime: cte(/\bCTF_MATCH_TIME\s*=\s*([\d.]+)/),
    /* REGEN e RANKING_ON são FLAGS, e o estado delas é decisão do dono. O que este script
       mede é qual é o padrão HOJE no código — se alguém religar, a doc muda sozinha. */
    regenLigado: /const\s+REGEN\s*=\s*QS\.get\('regen'\)\s*===\s*'1'/.test(gcode) ? false : null,
    regenLinha: linhaDe(/const\s+REGEN\s*=/),
    rankingOn: existe('src/lib/site.ts') ? /RANKING_ON\s*=\s*true/.test(ler('src/lib/site.ts')) : null,
    cmd: 'constantes de public/js/game.js · RANKING_ON de src/lib/site.ts',
  };

  /* ---- o portão ---- */
  const inv = 'tools/eval/invariants.mjs';
  const uniq = (re) => new Set([...ler(inv).matchAll(re)].map((m) => m[1])).size;
  f.portao = {
    linhas: linhas(inv),
    ids: uniq(/put\('([A-Z0-9_]+)'/g),
    comSkip: uniq(/skip\('([A-Z0-9_]+)'/g),
    scriptsEval: glob('tools/eval', (x) => x.endsWith('.mjs') || x.endsWith('.py')).length,
    scriptsTools: glob('tools', (x) => x.endsWith('.mjs')).length,
    arnesesHtml: glob('public', (x) => x.endsWith('.html')).length,
    cmd: "grep -o \"put('[A-Z0-9_]*'\" tools/eval/invariants.mjs | sort -u | wc -l",
  };

  /* ---- scripts do package.json (as chaves `//nome` são comentário, não script) ---- */
  const scripts = Object.entries(pkg.scripts).filter(([k]) => !k.startsWith('//'));
  f.scripts = {
    total: scripts.length,
    check: pkg.scripts.check || null,
    checkFast: pkg.scripts['check:fast'] || null,
    nomes: scripts.map(([k]) => k),
    cmd: "node -p \"Object.keys(require('./package.json').scripts)\"",
  };

  /* ---- stack: versão declarada, não versão lembrada ---- */
  const dep = (n) => pkg.dependencies?.[n] || pkg.devDependencies?.[n] || null;
  const three = existe('public/vendor/three.module.js')
    ? (ler('public/vendor/three.module.js').match(/REVISION\s*=\s*'([^']+)'/) || [])[1] : null;
  const docsPkg = existe('docs/package.json') ? JSON.parse(ler('docs/package.json')) : null;
  f.stack = {
    three: three ? `r${three}` : null,
    threeOnde: 'public/vendor/three.module.js (vendorizado — sem CDN, sem npm no runtime)',
    astro: dep('astro'),
    adapter: dep('@astrojs/vercel'),
    supabase: dep('@supabase/supabase-js'),
    playwright: dep('playwright'),
    gltfTransform: dep('@gltf-transform/core'),
    meshopt: dep('meshoptimizer'),
    sharp: dep('sharp'),
    resvg: dep('@resvg/resvg-js'),
    docusaurus: docsPkg?.dependencies?.['@docusaurus/core'] || null,
    node: (() => { const m = /node-version:\s*'?([\d.]+)/.exec(existe('.github/workflows/ci.yml') ? ler('.github/workflows/ci.yml') : ''); return m ? m[1] : null; })(),
    cmd: 'dependencies/devDependencies do package.json · REVISION de public/vendor/three.module.js',
  };

  /* ---- pipeline de asset: quem consome cada SDK, medido por grep ---- */
  const consomem = (padrao, dir) => {
    const out = sh('grep', ['-rl', padrao, dir]).trim().split('\n').filter(Boolean);
    return out.filter((x) => x.endsWith('.mjs')).length;
  };
  f.pipeline = {
    playwright: consomem('playwright', 'tools'),
    gltf: consomem('@gltf-transform', 'tools'),
    meshopt: consomem('meshoptimizer', 'tools'),
    mint: (() => {
      if (!existe('mint-assets.json')) return null;
      const j = JSON.parse(ler('mint-assets.json'));
      const a = Object.values(j.assets || {});
      const kinds = {};
      for (const x of a) kinds[x.source?.kind || '?'] = (kinds[x.source?.kind || '?'] || 0) + 1;
      return { total: a.length, kinds };
    })(),
    cmd: 'grep -rl SDK tools/ | grep .mjs · mint-assets.json',
  };

  /* ---- skills: o que vem no CLONE (git), não o que está no disco de alguém ---- */
  const skl = sh('git', ['ls-files', '.agents/skills']).trim().split('\n').filter(Boolean);
  const dirsSkill = new Set(skl.map((p) => p.split('/')[2]).filter(Boolean));
  /* Três contagens diferentes de propósito, porque elas DIVERGEM e a diferença é o fato:
     o lock declara N skills, o git carrega M (o que chega em quem clona) e o disco tem P.
     Doc que publica só uma das três esconde justamente o que o contribuidor precisa saber. */
  const comMdNoDisco = existe('.agents/skills')
    ? readdirSync(R('.agents/skills')).filter((d) => !d.startsWith('.') && existe(`.agents/skills/${d}/SKILL.md`)).length : 0;
  f.skills = {
    versionadas: dirsSkill.size,
    comSkillMd: skl.filter((p) => p.endsWith('/SKILL.md') && p.split('/').length === 4).length,
    pastasNoDisco: existe('.agents/skills') ? readdirSync(R('.agents/skills')).filter((d) => !d.startsWith('.')).length : 0,
    comSkillMdNoDisco: comMdNoDisco,
    lock: existe('skills-lock.json') ? Object.keys(JSON.parse(ler('skills-lock.json')).skills || {}).length : null,
    gauntlet: existe('.claude/skills/gauntlet-fps/SKILL.md'),
    cmd: 'git ls-files .agents/skills · skills-lock.json · ls .agents/skills',
  };

  /* ---- gente: quem assina commit, descontando agentes ---- */
  const short = sh('git', ['shortlog', '-sn', '--no-merges', 'HEAD']).trim().split('\n').filter(Boolean);
  const autores = short.map((l) => { const m = /^\s*(\d+)\s+(.*)$/.exec(l); return m ? { n: +m[1], nome: m[2] } : null; }).filter(Boolean);
  const ehAgente = (n) => /^claude\b/i.test(n) || /^(codex|kimi|gpt|cursor|devin)\b/i.test(n);
  const humanos = autores.filter((a) => !ehAgente(a.nome));
  f.pessoas = {
    humanos: humanos.length,
    nomes: humanos.map((a) => a.nome),
    commitsDeAgente: autores.filter((a) => ehAgente(a.nome)).reduce((s, a) => s + a.n, 0),
    total: autores.reduce((s, a) => s + a.n, 0),
    cmd: 'git shortlog -sn --no-merges (descontando autores que são agentes)',
  };

  /* ---- backend e licença ---- */
  f.supabase = {
    migrations: glob('supabase/migrations', (x) => x.endsWith('.sql')).length,
    opcionais: glob('supabase/opcional', (x) => x.endsWith('.sql')).length,
    cmd: 'ls supabase/migrations/*.sql | wc -l',
  };
  f.licenca = {
    nome: existe('LICENSE') ? ler('LICENSE').split('\n')[0].trim() : null,
    cmd: 'head -1 LICENSE',
  };
  f.issues = {
    escritas: glob('docs/issues', (x) => /^\d+-.*\.md$/.test(x)).length,
    cmd: 'ls docs/issues/[0-9]*.md | wc -l',
  };

  return f;
}

/* ═══════════════════════════════════════════════════════════ BLOCOS
   Cada bloco é uma função pura de `f` para markdown. NENHUM número literal aqui. */

/* O `cmd` sai SEMPRE dentro de crase. Sem isso, um comando com `<sdk>` ou `<pasta>` vira
   tag JSX aberta e derruba o build do Docusaurus — medido: `end-tag-mismatch` em stack.md. */
const rodape = (cmd) => `\n> Bloco gerado por \`node tools/gen-docs.mjs\`. Fonte: \`${cmd}\`\n`;

const BLOCOS = {
  /* Os números do projeto, com o comando que reproduz cada um. */
  numeros: (f) => [
    '| O que | Quanto | Onde confere |',
    '|---|---:|---|',
    `| Código do jogo | ${num(f.jogo.linhas)} linhas em ${f.jogo.arquivos} arquivos | \`cat public/js/*.js \\| wc -l\` |`,
    `| \`game.js\` | **${num(f.jogo.porArquivo['game.js'])}** linhas | \`wc -l public/js/game.js\` |`,
    `| \`main.js\` | ${num(f.jogo.porArquivo['main.js'])} linhas | \`wc -l public/js/main.js\` |`,
    `| Armas com GLB | ${f.assets.armas} | \`ls public/models/weapons/*.glb \\| wc -l\` |`,
    `| GLBs de personagem | ${f.assets.personagens} | \`ls public/models/characters/*.glb \\| wc -l\` |`,
    `| Props em GLB | ${f.assets.props} | \`ls public/models/props/*.glb \\| wc -l\` |`,
    `| Clipes de animação versionados | ${num(f.assets.anims)} | \`git ls-files public/models/anims \\| wc -l\` |`,
    `| Personagens jogáveis | ${f.elenco.total}, em ${f.elenco.faccoes} facções | array \`CHARACTERS\` de \`characters.js\` |`,
    `| Mapas no registro | ${f.mapas.total} | objeto \`MAPS\` de \`maps.js\` |`,
    `| Arnêses visuais em HTML | ${f.portao.arnesesHtml} | \`ls public/*.html \\| wc -l\` |`,
    `| Scripts do arnês | ${f.portao.scriptsEval} | \`ls tools/eval/*.mjs tools/eval/*.py \\| wc -l\` |`,
    `| Scripts de pipeline | ${f.portao.scriptsTools} | \`ls tools/*.mjs \\| wc -l\` |`,
    `| Migrations do Supabase | ${f.supabase.migrations} | \`ls supabase/migrations/*.sql \\| wc -l\` |`,
    `| Versão | \`${f.versao.jogo}\` | \`public/js/version.js\`${f.versao.concordam ? ' e `package.json` (batem)' : ' — **DIVERGE do `package.json`: `' + f.versao.pacote + '`**'} |`,
    rodape('o comando da coluna direita de cada linha'),
  ].join('\n'),

  /* Regras de partida, lidas das constantes. */
  regras: (f) => [
    '| Regra | Valor | Constante |',
    '|---|---|---|',
    `| Facções · personagens | ${f.elenco.faccoes} · ${f.elenco.total} (${Object.entries(f.elenco.porFaccao).sort().map(([k, v]) => `${k} ${v}`).join(' · ')}) | \`CHARACTERS\` |`,
    `| Mapas no menu | ${f.mapas.total} — ${f.mapas.emRodadas} abrem em rodadas, **${f.mapas.emCaptura} em captura** | \`MAPS\` / \`ctfMode\` |`,
    `| Respawn | ${String(f.regras.respawn).replace('.', ',')} s | \`RESPAWN_DELAY\` |`,
    `| Round | ${f.regras.roundTime} s, ${f.regras.roundsToWin} vitórias | \`ROUND_TIME\` / \`ROUNDS_TO_WIN\` |`,
    `| Captura | alvo de ${f.regras.ctfCaps} bandeiras, ${f.regras.ctfRounds} rodadas (rede de segurança ${f.regras.ctfMatchTime} s) | \`CTF_CAPS_TO_WIN\` / \`CTF_ROUNDS_TO_WIN\` |`,
    `| Regeneração de vida | **${f.regras.regenLigado === false ? 'DESLIGADA — `?regen=1` religa' : 'LIGADA por padrão'}** | \`REGEN\` |`,
    `| Ranking / páginas \`/u/\` | **${f.regras.rankingOn ? 'LIGADOS' : 'DESLIGADOS — é uma flag, volta numa linha'}** | \`RANKING_ON\` em \`src/lib/site.ts\` |`,
    rodape(f.regras.cmd),
  ].join('\n'),

  /* O registro de mapas. Quem não está aqui não é jogável. */
  mapas: (f) => [
    '| Id | Nome no menu | Abre em | Arquivo |',
    '|---|---|---|---|',
    ...f.mapas.registrados.map((m) => {
      const arq = glob('public/js', (x) => /^map_.*\.js$/.test(x))
        .find((a) => a.replace(/^map_|\.js$/g, '') === m.id.replace(/^fy_|^awp_/, '') || (m.id === 'awp_map' && a === 'map_brasilia.js'));
      return `| \`${m.id}\` | ${m.nome} | ${m.ctf ? '**captura**' : 'rodadas'} | ${arq ? `\`public/js/${arq}\` (${num(linhas('public/js/' + arq))} linhas)` : '—'} |`;
    }),
    '',
    `**${f.mapas.total} mapas registrados** — ${f.mapas.emRodadas} abrem em rodadas e ${f.mapas.emCaptura} em captura. ` +
    `\`ctfMode\` **abre** o mapa em captura, não prende: o jogador troca no menu (é a \`MOD1\`). ` +
    `Há ${f.mapas.arquivosNoDisco} arquivos \`map_*.js\` em \`public/js/\` — arquivo no disco **não** implica mapa jogável.`,
    rodape(f.mapas.cmd),
  ].join('\n'),

  /* Tamanho dos arquivos que o gen-arch.mjs indexa. */
  arquivos: (f) => {
    const alvos = ['game.js', 'main.js', 'characters.js', 'glbchars.js', 'vmattach.js', 'weapons.js', 'springs.js'];
    return [
      '| Arquivo | Linhas |',
      '|---|---:|',
      ...alvos.filter((a) => f.jogo.porArquivo[a] != null)
        .sort((a, b) => f.jogo.porArquivo[b] - f.jogo.porArquivo[a])
        .map((a) => `| \`public/js/${a}\` | ${num(f.jogo.porArquivo[a])} |`),
      '',
      `Total de \`public/js/\`: **${num(f.jogo.linhas)} linhas em ${f.jogo.arquivos} arquivos**. ` +
      'O índice símbolo→linha, com a tabela de conflito, é outro bloco gerado: `tools/eval/ARCH.md` (`npm run arch`).',
      rodape('`wc -l public/js/*.js`'),
    ].join('\n');
  },

  /* A stack — o que este projeto usa, com a versão declarada. */
  stack: (f) => [
    '| Camada | Ferramenta | Versão | Onde está declarada |',
    '|---|---|---|---|',
    `| Motor 3D | **Three.js** (WebGL) | \`${f.stack.three}\` | \`public/vendor/three.module.js\` — **vendorizado**, sem CDN e sem npm no runtime |`,
    `| Jogo | ES modules vanilla | — | \`public/js/\` (${f.jogo.arquivos} arquivos, **zero build**) |`,
    `| Site | **Astro** com SSR | \`${f.stack.astro}\` | \`package.json\` · \`astro.config.mjs\` |`,
    `| Hospedagem | adapter **Vercel** | \`${f.stack.adapter}\` | \`package.json\` · \`vercel.json\` |`,
    `| Banco | **Supabase** (Postgres + RLS) | \`${f.stack.supabase}\` | \`supabase/\` (${f.supabase.migrations} migrations) |`,
    `| Browser nas réguas | **Playwright** | \`${f.stack.playwright}\` | ${f.pipeline.playwright} scripts de \`tools/\` importam |`,
    `| Pipeline de GLB | **gltf-transform** | \`${f.stack.gltfTransform}\` | ${f.pipeline.gltf} scripts de \`tools/\` importam |`,
    `| Compressão de malha | **meshoptimizer** | \`${f.stack.meshopt}\` | ${f.pipeline.meshopt} scripts de \`tools/\` importam |`,
    `| Imagem (build/API) | **sharp** · **resvg** | \`${f.stack.sharp}\` · \`${f.stack.resvg}\` | badge PNG em runtime, textura em WebP |`,
    `| Esta documentação | **Docusaurus** | \`${f.stack.docusaurus}\` | \`docs/package.json\` |`,
    `| Runtime de CI | **Node** | \`${f.stack.node}\` | \`.github/workflows/ci.yml\` |`,
    rodape(f.stack.cmd),
  ].join('\n'),

  /* Geração de asset: qual serviço faz o quê, e por qual script. */
  assets: (f) => [
    '| Serviço | O que gera | Script | Chave |',
    '|---|---|---|---|',
    '| **mint.gg** (Mint MCP) | personagens rigados, packs, animação | ferramentas MCP; o registro do que foi gerado é `mint-assets.json` | conta do dono, via MCP |',
    '| **Tripo3D** | props 3D por texto (padrão) | `tools/gen-asset.mjs --provider tripo` | `TRIPO_API_KEY` |',
    '| **Meshy** | props 3D por texto (alternativa) e rig | `tools/gen-asset.mjs --provider meshy` | `MESHY_API_KEY` |',
    '| **OpenRouter** | arte 2D (cartaz de facção, wallpaper, splash) | `tools/gen-image.mjs` | `OPENROUTER_API_KEY` |',
    '',
    f.pipeline.mint
      ? `\`mint-assets.json\` registra **${f.pipeline.mint.total} assets** gerados via Mint (${Object.entries(f.pipeline.mint.kinds).map(([k, v]) => `${v} \`${k}\``).join(' · ')}), cada um com \`assetId\`, \`chatUrl\` e notas do que deu errado na tentativa anterior.`
      : '`mint-assets.json` não foi encontrado nesta árvore.',
    '',
    'As três chaves de API vivem em `.env` na raiz — **gitignored, modo 600, nunca em `argv`** ' +
    '(argv vaza no `ps` de qualquer processo da máquina). Sem elas o jogo roda igual: o pipeline ' +
    'de geração é offline, o resultado é que entra no repositório.',
    rodape(f.pipeline.cmd),
  ].join('\n'),

  /* Skills de agente versionadas no repositório. */
  skills: (f) => [
    '| Contagem | Quanto | O que significa |',
    '|---|---:|---|',
    `| Declaradas no \`skills-lock.json\` | ${f.skills.lock} | com \`source\`, \`skillPath\` e \`computedHash\` — skill de terceiro que mudar de conteúdo é detectável |`,
    `| Pastas em \`.agents/skills/\` no disco | ${f.skills.pastasNoDisco} | o que existe **nesta máquina** |`,
    `| …dessas, com \`SKILL.md\` presente | ${f.skills.comSkillMdNoDisco} | o resto é pasta vazia: a skill está no lock e o conteúdo não foi baixado |`,
    `| Versionadas (chegam em quem clona) | ${f.skills.versionadas} | \`git ls-files .agents/skills\` |`,
    `| …dessas, com \`SKILL.md\` no git | ${f.skills.comSkillMd} | é o que um clone limpo consegue ler |`,
    '',
    '**As três contagens divergem de propósito, e a diferença é o fato:** a maioria das skills é ' +
    'de terceiro, fixada por hash no lock e baixada sob demanda. Quem clonar o repositório recebe ' +
    'o lock inteiro e só uma parte do conteúdo. Publicar só uma das contagens esconderia exatamente ' +
    'o que o contribuidor precisa saber.',
    '',
    '`.claude/skills/` são **symlinks** para `.agents/skills/` — uma cópia só, dois nomes, porque ' +
    'o Claude Code lê de `.claude/` e outros arnêses leem de `.agents/`.',
    '',
    f.skills.gauntlet
      ? 'A skill do loop desta casa, **`gauntlet-fps`**, é a única que nasceu aqui: vive em `.claude/skills/gauntlet-fps/SKILL.md`, não é symlink e não entra no lock.'
      : '⚠️ A skill `gauntlet-fps` **não foi encontrada** nesta árvore.',
    rodape(f.skills.cmd),
  ].join('\n'),

  /* O portão, em números. */
  invariantes: (f) => [
    `- \`tools/eval/invariants.mjs\`: **${num(f.portao.linhas)} linhas**, **${f.portao.ids} identificadores de invariante declarados** (\`put()\`), dos quais **${f.portao.comSkip}** têm caminho de \`skip()\` declarado.`,
    `- O arnês inteiro são **${f.portao.scriptsEval} scripts** em \`tools/eval/\` (\`.mjs\` + \`.py\`), mais **${f.portao.scriptsTools} scripts** de pipeline em \`tools/\`.`,
    `- Quantas invariantes rodam como **críticas** numa execução **não é derivável do fonte**: depende de qual insumo existe na máquina (o JSON do auditor de viewmodel, um GLB, uma pasta de anims). Esse número só sai rodando o portão — e o lugar dele é o cabeçalho do \`KNOWN-BUGS.md\`, atualizado com saída real.`,
    '',
    'Reproduza:',
    '',
    '```bash',
    "grep -o \"put('[A-Z0-9_]*'\"  tools/eval/invariants.mjs | sort -u | wc -l",
    "grep -o \"skip('[A-Z0-9_]*'\" tools/eval/invariants.mjs | sort -u | wc -l",
    '```',
    rodape(f.portao.cmd),
  ].join('\n'),

  /* Os scripts do portão, direto do package.json. */
  scripts: (f) => [
    '```bash',
    `npm run check        # ${f.scripts.check}`,
    `npm run check:fast   # ${f.scripts.checkFast}`,
    '```',
    '',
    `\`package.json\` tem **${f.scripts.total} scripts**. Vários trazem uma chave \`//nome\` logo acima com o motivo de existirem — é onde mora o porquê.`,
    rodape(f.scripts.cmd),
  ].join('\n'),

  /* Quantas pessoas. */
  pessoas: (f) => [
    `**${f.pessoas.humanos} pessoa${f.pessoas.humanos === 1 ? '' : 's'}** assinam commit neste repositório (${f.pessoas.nomes.map((n) => `\`${n}\``).join(', ')}), ` +
    `mais ${num(f.pessoas.commitsDeAgente)} commits assinados por agentes de IA, de ${num(f.pessoas.total)} no total.`,
    rodape(f.pessoas.cmd),
  ].join('\n'),

  /* Licença — a resposta correta é a que está no arquivo LICENSE, e só ela. */
  licenca: (f) => [
    `O código está sob **${f.licenca.nome}** ([\`LICENSE\`](LICENSE)) — é o que vale hoje.`,
    rodape(f.licenca.cmd),
  ].join('\n'),

  /* Validação dos ponteiros arquivo:linha escritos à mão na prosa. Um ponteiro que aponta
     para além do fim do arquivo é a versão barata do mesmo defeito que este script combate. */
  ponteiros: () => {
    const alvos = ['README.md', 'STATUS.md', 'HANDOFF.md', 'KNOWN-BUGS.md',
      ...glob('docs/docs', (x) => x.endsWith('.md')).map((x) => `docs/docs/${x}`),
      ...(existe('.claude/skills/gauntlet-fps') ? ['.claude/skills/gauntlet-fps/SKILL.md'] : [])];
    const quebrados = [];
    let conferidos = 0;
    for (const alvo of alvos) {
      if (!existe(alvo)) continue;
      const txt = ler(alvo);
      for (const [, arq, ln] of txt.matchAll(/`([\w./-]+\.(?:js|mjs|ts|py|astro|css|json|sql|yml))[:](\d+)/g)) {
        const cand = ['', 'public/js/', 'tools/eval/', 'tools/', 'src/lib/', 'src/pages/', 'public/']
          .map((p) => p + arq).find((p) => existe(p) && statSync(R(p)).isFile());
        if (!cand) continue;
        conferidos++;
        const total = linhas(cand);
        if (+ln > total) quebrados.push(`\`${alvo}\` → \`${arq}:${ln}\` (o arquivo tem ${num(total)} linhas)`);
      }
    }
    /* De propósito NÃO publica "N ponteiros conferidos": esse número muda a cada
       parágrafo escrito em qualquer doc, e o `--check` ficaria vermelho por edição de
       prosa. Vermelho que não corresponde a defeito ensina a ignorar vermelho. Aqui o
       bloco só muda quando um ponteiro DE FATO quebra. */
    void conferidos;
    return [
      quebrados.length
        ? ['⚠️ **Ponteiros que apontam para além do fim do arquivo** (a prosa envelheceu — corrija à mão):', '',
          ...[...new Set(quebrados)].map((q) => `- ${q}`)].join('\n')
        : 'Nenhum ponteiro `arquivo:linha` das docs aponta para fora do arquivo que ele cita. ✓',
      '',
      '> Isto confere só o **limite** do arquivo: um ponteiro que ainda cabe mas mudou de assunto ' +
      'passa aqui. É a razão de a doutrina da casa ser declarar o SÍMBOLO e deixar a linha para o ' +
      'gerador — ver `tools/gen-arch.mjs`.',
      rodape('varredura de `arquivo:linha` em README/STATUS/HANDOFF/KNOWN-BUGS/docs/docs/SKILL'),
    ].join('\n');
  },
};

/* ═══════════════════════════════════════════════════════════ MOTOR
   Acha os marcadores nos arquivos, reescreve o miolo, preserva o resto. */

/* COLOCAÇÃO DECLARADA: bloco -> arquivos em que ele TEM que aparecer.
   Sem isto, apagar o marcador de UMA página some com o bloco em silêncio e o `--check`
   continua verde, porque o bloco ainda existe em outra página. Foi medido: a mutação
   "apaga o marcador de `mapas` em comecango.md" passava VERDE antes desta tabela.
   O contrato agora é dos dois lados — o conteúdo é gerado E o lugar é declarado. */
const COLOCACAO = {
  numeros: ['README.md', 'docs/docs/comecando.md'],
  regras: ['README.md', 'docs/docs/comecando.md'],
  mapas: ['README.md', 'docs/docs/comecando.md'],
  scripts: ['README.md', 'docs/docs/comecando.md'],
  stack: ['README.md', 'docs/docs/stack.md'],
  assets: ['docs/docs/stack.md'],
  skills: ['docs/docs/stack.md'],
  licenca: ['README.md'],
  arquivos: ['docs/docs/arquitetura.md'],
  ponteiros: ['docs/docs/arquitetura.md'],
  invariantes: ['docs/docs/quality-gates.md'],
  pessoas: ['docs/docs/colaborar.md'],
};
const ARQUIVOS_ALVO = [...new Set(Object.values(COLOCACAO).flat())];

/* Aceita as duas sintaxes de comentário. MDX (docs/docs/) não tem comentário HTML:
   `<!--` ali é erro de parse do MDX 3, e derruba o build do Docusaurus. */
const marcador = (nome) => new RegExp(
  `(<!--\\s*BEGIN:GERADO:${nome}\\b[^>]*-->|\\{/\\*\\s*BEGIN:GERADO:${nome}\\b.*?\\*/\\})` +
  `([\\s\\S]*?)` +
  `(<!--\\s*END:GERADO:${nome}\\s*-->|\\{/\\*\\s*END:GERADO:${nome}\\s*\\*/\\})`,
);

function aplicar(fatos) {
  const mudancas = [];              // { arquivo, novo }
  const achados = new Map();        // bloco -> Set(arquivos em que foi encontrado)

  for (const arq of ARQUIVOS_ALVO) {
    if (!existe(arq)) continue;
    const atual = ler(arq);
    let novo = atual;
    for (const [nome, gerar] of Object.entries(BLOCOS)) {
      const re = marcador(nome);
      if (!re.test(novo)) continue;
      if (!achados.has(nome)) achados.set(nome, new Set());
      achados.get(nome).add(arq);
      novo = novo.replace(re, (_, abre, __, fecha) => `${abre}\n\n${gerar(fatos).trim()}\n\n${fecha}`);
    }
    if (novo !== atual) mudancas.push({ arquivo: arq, novo });
  }

  /* Três defeitos diferentes, e cada um tem que ter nome próprio na saída. */
  const semLugar = Object.keys(BLOCOS).filter((n) => !COLOCACAO[n]);            // bloco sem colocação declarada
  const faltando = [];                                                          // colocação declarada, marcador ausente
  for (const [nome, arqs] of Object.entries(COLOCACAO))
    for (const a of arqs)
      if (existe(a) && !achados.get(nome)?.has(a)) faltando.push(`${nome} → ${a}`);
  const semBloco = Object.keys(COLOCACAO).filter((n) => !BLOCOS[n]);            // colocação de bloco inexistente

  return { mudancas, achados, semLugar, faltando, semBloco };
}

/* ═══════════════════════════════════════════════════════════ SAÍDA */

const fatos = medir();

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(fatos, null, 2));
  process.exit(0);
}

const { mudancas, achados, semLugar, faltando, semBloco } = aplicar(fatos);

/* Consistências que NÃO são bloco de doc, mas que a doc depende para não mentir. */
const inconsistencias = [];
if (!fatos.versao.concordam)
  inconsistencias.push(`version.js diz '${fatos.versao.jogo}' e package.json diz '${fatos.versao.pacote}'`);

if (process.argv.includes('--check')) {
  const erros = [];
  if (mudancas.length) erros.push(`${mudancas.length} arquivo(s) com bloco gerado DESATUALIZADO: ${mudancas.map((m) => m.arquivo).join(', ')}`);
  if (faltando.length) erros.push(`${faltando.length} marcador(es) DECLARADO(S) e AUSENTE(S): ${faltando.join(' · ')}`);
  if (semLugar.length) erros.push(`${semLugar.length} bloco(s) sem colocação declarada em COLOCACAO: ${semLugar.join(', ')}`);
  if (semBloco.length) erros.push(`${semBloco.length} colocação(ões) apontando para bloco inexistente: ${semBloco.join(', ')}`);
  for (const i of inconsistencias) erros.push(i);
  if (erros.length) {
    console.error('✗ DOCS1  a documentação está DESATUALIZADA em relação ao código.');
    for (const e of erros) console.error('         - ' + e);
    console.error('         Rode: npm run docs');
    process.exit(1);
  }
  const marcadores = [...achados.values()].reduce((s, x) => s + x.size, 0);
  console.log(`✓ DOCS1  docs em dia (${achados.size} blocos em ${marcadores} marcadores, ${fatos.jogo.arquivos} arquivos de jogo, ${num(fatos.jogo.linhas)} linhas)`);
  process.exit(0);
}

for (const m of mudancas) writeFileSync(R(m.arquivo), m.novo);
console.log(`✓ gen-docs — ${mudancas.length} arquivo(s) atualizado(s), ${achados.size} bloco(s) gerados`);
for (const m of mudancas) console.log(`  · ${m.arquivo}`);
if (faltando.length) {
  console.log(`\n  ⚠ ${faltando.length} marcador(es) declarado(s) em COLOCACAO e AUSENTE(S) no arquivo:`);
  for (const x of faltando) console.log(`    - ${x}`);
  console.log('    (cole o marcador na página, ou tire a linha do COLOCACAO — as duas coisas são decisão, não acidente)');
}
for (const x of semLugar) console.log(`\n  ⚠ bloco '${x}' existe no gerador e não tem colocação declarada — ninguém o consome`);
for (const x of semBloco) console.log(`\n  ⚠ COLOCACAO declara '${x}', que não existe em BLOCOS`);
for (const i of inconsistencias) console.log(`\n  ⚠ ${i}`);
