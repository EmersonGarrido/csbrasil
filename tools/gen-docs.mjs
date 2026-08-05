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
/* Varredura recursiva. `src/pages/` tem subpasta (`api/`, `u/`), e contar só o primeiro
   nível devolvia 10 páginas para um site que tem mais — número errado com cara de medido. */
const globR = (dir, teste, acc = []) => {
  if (!existe(dir)) return acc;
  for (const e of readdirSync(R(dir), { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) globR(p, teste, acc);
    else if (teste(e.name)) acc.push(p);
  }
  return acc.sort();
};
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
  /* ---- o site, para a tabela de ZONAS: a fronteira public/ × src/ é a primeira coisa
         que um agente precisa saber, e ela tem tamanho medível dos dois lados ---- */
  f.site = {
    paginas: globR('src/pages', (x) => x.endsWith('.astro')).length,
    apis: globR('src/pages/api', (x) => x.endsWith('.ts')).length,
    /* A pegadinha que custa a primeira hora de todo mundo, medida em vez de afirmada:
       servir `public/` estaticamente NÃO roda o jogo, porque não há index.html ali. Se
       um dia alguém criar o arquivo, este bloco muda e a frase inverte sozinha. */
    indexHtml: existe('public/index.html'),
    cmd: "find src/pages -name '*.astro' | wc -l · find src/pages/api -name '*.ts' | wc -l · ls public/index.html",
  };

  /* ---- licença: o arquivo LICENSE é a verdade, e as SUPERFÍCIES são os lugares que
         repetem o nome dela e por isso mudam JUNTO com ela.
         Duas listas escritas à mão já enumeraram esses lugares (README.md e
         `plans/08 §3`) e as duas esquecem o JSON-LD de `src/pages/index.astro` e o
         rodapé desta documentação. Lista à mão de onde a licença aparece tem o mesmo
         prazo de validade de qualquer outro número escrito à mão — por isso é medida. */
  const NOME_LICENCA = /\b(AGPL-3\.0|AGPL|GPL-3\.0|MIT)\b/;
  const SUPERFICIES = [
    ['licença canônica', 'LICENSE'],
    ['badge + seção de licenças', 'README.md'],
    ['termo que o contribuidor aceita', 'CONTRIBUTING.md'],
    ['rodapé do site', 'src/layouts/Layout.astro'],
    ['JSON-LD do jogo', 'src/pages/index.astro'],
    ['página `/sobre`', 'src/pages/sobre.astro'],
    ['`llms.txt` (resposta para LLM)', 'public/llms.txt'],
    ['rodapé desta documentação', 'docs/docusaurus.config.js'],
  ];
  const cabecalho = existe('LICENSE') ? ler('LICENSE').split('\n')[0].trim() : null;
  const atual = cabecalho && NOME_LICENCA.exec(cabecalho) ? NOME_LICENCA.exec(cabecalho)[1] : null;
  const ondeAparece = (arq, nome) => {
    if (!existe(arq) || !nome) return [];
    const re = new RegExp(`\\b${nome.replace(/[.]/g, '\\.')}\\b`);
    return ler(arq).split('\n').map((l, i) => (re.test(l) ? i + 1 : 0)).filter(Boolean);
  };
  f.licenca = {
    nome: cabecalho,
    atual,
    superficies: SUPERFICIES.map(([rotulo, arq]) => ({
      rotulo, arquivo: arq, existe: existe(arq), linhas: ondeAparece(arq, atual),
    })),
    /* Quem já NOMEIA a licença futura. A regra escrita no README é que nenhum arquivo
       pode DECLARAR AGPL antes de o LICENSE dizer — as menções de hoje são avisos de
       mudança planejada, e este número existe para que a diferença não passe batida. */
    outroNome: atual === 'MIT' ? 'AGPL' : 'MIT',
    mencoesOutro: SUPERFICIES.map(([, arq]) => ({ arquivo: arq, linhas: ondeAparece(arq, atual === 'MIT' ? 'AGPL' : 'MIT') }))
      .filter((x) => x.linhas.length),
    cmdNome: 'head -1 LICENSE',
    cmd: 'grep -n do nome lido do LICENSE, nas superfícies declaradas em tools/gen-docs.mjs',
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
    `| Tarefas de entrada escritas | ${f.issues.escritas} | \`ls docs/issues/[0-9]*.md \\| wc -l\` |`,
    `| Versão | \`${f.versao.jogo}\` | \`public/js/version.js\`${f.versao.concordam ? ' e `package.json` (batem)' : ' — **DIVERGE do `package.json`: `' + f.versao.pacote + '`**'} |`,
    rodape('o comando da coluna direita de cada linha'),
  ].join('\n'),

  /* AS DUAS ZONAS (mais o arnês). É a primeira coisa que um agente precisa saber antes de
     escrever uma linha, e é a que mais gente escreve à mão errado — por isso os dois lados
     da fronteira vêm MEDIDOS. O porquê de cada regra é conhecimento humano e mora na doc;
     aqui só o tamanho e a regra em uma linha. */
  zonas: (f) => [
    '| Zona | O que é | Tamanho medido | Regra |',
    '|---|---|---|---|',
    `| \`public/\` | o **jogo** | ${f.jogo.arquivos} arquivos \`.js\`, ${num(f.jogo.linhas)} linhas · Three.js \`${f.stack.three}\` vendorizado | ES modules servidos crus, **zero build**, sem dependência de runtime |`,
    `| \`src/\` | o **site** | ${f.site.paginas} páginas \`.astro\`, ${f.site.apis} rotas \`/api\` · Astro \`${f.stack.astro}\` | framework é bem-vindo; \`service_role\` só no servidor |`,
    `| \`tools/\` | o **arnês** | ${f.portao.scriptsEval} scripts em \`tools/eval/\`, ${f.portao.scriptsTools} em \`tools/\` | node puro: sobe o jogo real sem browser |`,
    '',
    f.site.indexHtml
      ? '⚠️ **Existe `public/index.html`** — o que contradiz a doc, que afirma o contrário em várias páginas. Confira quem serve o quê antes de acreditar em qualquer das duas.'
      : '**Não existe `public/index.html`.** O HTML do jogo é `src/pages/index.astro`, servido na rota `/`. ' +
        'Servir `public/` estaticamente entrega os arnêses visuais, **não o jogo** — é a pegadinha que custa a primeira hora de todo mundo.',
    rodape(f.site.cmd),
  ].join('\n'),

  /* AS SUPERFÍCIES DA LICENÇA — todo arquivo que REPETE o nome da licença e por isso muda
     JUNTO com ela. Duas listas escritas à mão já tentaram enumerar isto (README.md e
     `plans/08 §3`) e as duas esquecem lugares reais. A lista de superfícies é decisão
     humana (vive no topo deste script); ONDE cada uma nomeia a licença é medido. */
  licenca_pontos: (f) => [
    `| Superfície | Arquivo | Onde diz \`${f.licenca.atual || '?'}\` |`,
    '|---|---|---|',
    ...f.licenca.superficies.map((s) => `| ${s.rotulo} | \`${s.arquivo}\` | ${
      !s.existe ? '**arquivo não existe**'
        : s.linhas.length ? `linha${s.linhas.length > 1 ? 's' : ''} ${s.linhas.join(', ')}`
          : '— (não nomeia a licença)'}  |`),
    '',
    `**${f.licenca.superficies.reduce((a, s) => a + s.linhas.length, 0)} ocorrências** de ` +
    `\`${f.licenca.atual}\` em **${f.licenca.superficies.filter((s) => s.linhas.length).length}** das ` +
    `${f.licenca.superficies.length} superfícies declaradas. Trocar a licença é mudar **todas elas no mesmo commit**: ` +
    'metade trocada é pior que nenhuma, porque cada arquivo passa a responder uma coisa diferente para quem pergunta.',
    '',
    f.licenca.mencoesOutro.length
      ? `\`${f.licenca.outroNome}\` já aparece em ${f.licenca.mencoesOutro.map((m) => `\`${m.arquivo}\` (linha${m.linhas.length > 1 ? 's' : ''} ${m.linhas.join(', ')})`).join(', ')} — ` +
        `como **aviso de mudança planejada**, não como declaração. A regra é essa: nenhum arquivo pode DECLARAR \`${f.licenca.outroNome}\` antes de o \`LICENSE\` dizer.`
      : `Nenhuma superfície menciona \`${f.licenca.outroNome}\`.`,
    rodape(f.licenca.cmd),
  ].join('\n'),

  /* Regras de partida, lidas das constantes. */
  regras: (f) => [
    '| Regra | Valor | Constante |',
    '|---|---|---|',
    `| Facções · personagens | ${f.elenco.faccoes} · ${f.elenco.total} (${Object.entries(f.elenco.porFaccao).sort().map(([k, v]) => `${k} ${v}`).join(' · ')}) | \`CHARACTERS\` |`,
    `| Mapas no menu | ${f.mapas.total} — ${f.mapas.emRodadas} abrem em rodadas, **${f.mapas.emCaptura} em captura** | \`MAPS\` / \`ctfMode\` |`,
    `| Respawn | ${String(f.regras.respawn).replace('.', ',')} s | \`RESPAWN_DELAY\` |`,
    `| Round | ${f.regras.roundTime} s, ${f.regras.roundsToWin} vitórias | \`ROUND_TIME\` / \`ROUNDS_TO_WIN\` |`,
    /* O alvo da rodada de captura NÃO é mais derivável de uma constante: desde 05/08 ele é
       `this.ctfPts.length` — TODAS as bandeiras do mapa, que hoje são 3 ou 4 conforme o mapa
       (pedido literal do dono: "tem que ser todas sempre"). Escrever "alvo de 3" aqui era
       justamente o tipo de número certo-em-um-lugar-e-errado-no-jogo que este gerador existe
       para impedir. `CTF_CAPS_TO_WIN` sobrou como fallback do layout padrão e por isso saiu
       da frase. */
    `| Captura | alvo = **todas as bandeiras do mapa**, ${f.regras.ctfRounds} rodadas (rede de segurança ${f.regras.ctfMatchTime} s) | \`capsToWin = ctfPts.length\` / \`CTF_ROUNDS_TO_WIN\` |`,
    `| Regeneração de vida | **${f.regras.regenLigado === false ? 'DESLIGADA — `?regen=1` religa' : 'LIGADA por padrão'}** | \`REGEN\` |`,
    `| Ranking / páginas \`/u/\` | **${f.regras.rankingOn ? 'LIGADOS' : 'DESLIGADOS — é uma flag, volta numa linha'}** | \`RANKING_ON\` em \`src/lib/site.ts\` |`,
    rodape(f.regras.cmd),
  ].join('\n'),

  /* O registro de mapas. Quem não está aqui não é jogável. */
  mapas: (f) => [
    '| Id | Nome no menu | Abre em | Arquivo em `public/js/` | Linhas |',
    '|---|---|---|---|---:|',
    ...f.mapas.registrados.map((m) => {
      const arq = glob('public/js', (x) => /^map_.*\.js$/.test(x))
        .find((a) => a.replace(/^map_|\.js$/g, '') === m.id.replace(/^fy_|^awp_/, '') || (m.id === 'awp_map' && a === 'map_brasilia.js'));
      return `| \`${m.id}\` | ${m.nome} | ${m.ctf ? '**captura**' : 'rodadas'} | \`${arq || '—'}\` | ${arq ? num(linhas('public/js/' + arq)) : '—'} |`;
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
  /* 4 colunas com caminho longo estouravam a largura do conteúdo do Docusaurus a
     1200 px e a última coluna era CORTADA (capturado antes de commitar). 3 colunas
     curtas cabem; o detalhe de cada linha está na prosa logo abaixo do bloco. */
  stack: (f) => [
    '| Camada | Ferramenta | Versão |',
    '|---|---|---|',
    `| Motor 3D (WebGL) | **Three.js**, vendorizado | \`${f.stack.three}\` |`,
    `| Jogo | ES modules vanilla, **zero build** | ${f.jogo.arquivos} arquivos |`,
    `| Site | **Astro** com SSR | \`${f.stack.astro}\` |`,
    `| Hospedagem | adapter **Vercel** | \`${f.stack.adapter}\` |`,
    `| Banco | **Supabase** (Postgres + RLS) | \`${f.stack.supabase}\` |`,
    `| Browser nas réguas | **Playwright** | \`${f.stack.playwright}\` |`,
    `| Pipeline de GLB | **gltf-transform** | \`${f.stack.gltfTransform}\` |`,
    `| Compressão de malha | **meshoptimizer** | \`${f.stack.meshopt}\` |`,
    `| Imagem (build e API) | **sharp** · **resvg** | \`${f.stack.sharp}\` · \`${f.stack.resvg}\` |`,
    `| Esta documentação | **Docusaurus** | \`${f.stack.docusaurus}\` |`,
    `| Runtime de CI | **Node** | \`${f.stack.node}\` |`,
    '',
    `Three.js sai de \`public/vendor/three.module.js\` (**sem CDN, sem npm no runtime**). ` +
    `Astro e Vercel de \`package.json\` + \`astro.config.mjs\` + \`vercel.json\`. ` +
    `Supabase tem ${f.supabase.migrations} migrations em \`supabase/\`. ` +
    `Dos scripts de \`tools/\`, **${f.pipeline.playwright}** importam Playwright, ` +
    `**${f.pipeline.gltf}** importam gltf-transform e **${f.pipeline.meshopt}** importam meshoptimizer.`,
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
  /* De propósito SEM o total de commits: ele muda a cada commit e deixaria o `docs:check`
     vermelho logo depois de todo commit — inclusive dos commits que só mexem em doc.
     Vermelho que não corresponde a defeito ensina a ignorar vermelho. O que este bloco
     publica é quem assina, que muda quando alguém novo aparece — que é o fato. */
  /* "neste repositório" era FALSO e custou caro descobrir: o shortlog roda contra o HEAD, e
     o HEAD é uma branch. A `v2/alpha` saiu de `main` antes do merge do PR #14 e por isso não
     tem os 13 commits do William Oliveira — a doc anunciava 3 pessoas num repositório que
     tem 4, apagando um contribuidor de terceiro da própria página que fala de contribuir.
     A frase agora diz qual histórico foi medido; a diferença entre branches está em
     `docs/docs/licenca.md`, com o comando que a reproduz. */
  pessoas: (f) => [
    `**${f.pessoas.humanos} pessoa${f.pessoas.humanos === 1 ? '' : 's'}** assinam commit no histórico ` +
    `**desta branch**: ${f.pessoas.nomes.map((n) => `\`${n}\``).join(', ')}. O resto dos commits é assinado por agentes de IA. ` +
    'Branch não é repositório: quem contribuiu num ramo que esta branch não contém **não aparece aqui**.',
    rodape(f.pessoas.cmd),
  ].join('\n'),

  /* Licença — a resposta correta é a que está no arquivo LICENSE, e só ela. */
  /* SEM link markdown para `LICENSE`: um link relativo `(LICENSE)` funciona no GitHub e
     é LINK QUEBRADO no Docusaurus (`onBrokenLinks: 'throw'` derruba o build), porque
     `LICENSE` não é uma rota do site. O mesmo bloco vive nos dois lugares, então ele só
     pode conter markdown que sobrevive aos dois renderizadores. */
  licenca: (f) => [
    `O código está sob **${f.licenca.nome}** — é o que vale hoje, e a fonte é o arquivo ` +
    '`LICENSE` na raiz do repositório. Nenhum outro arquivo tem autoridade sobre isso.',
    rodape(f.licenca.cmdNome),
  ].join('\n'),

  /* Validação dos ponteiros arquivo:linha escritos à mão na prosa. Um ponteiro que aponta
     para além do fim do arquivo é a versão barata do mesmo defeito que este script combate. */
  ponteiros: () => {
    const alvos = ['README.md', 'STATUS.md', 'HANDOFF.md', 'KNOWN-BUGS.md', 'AGENTS.md',
      ...glob('docs/docs', (x) => x.endsWith('.md')).map((x) => `docs/docs/${x}`),
      ...(existe('.claude/skills/gauntlet-fps') ? ['.claude/skills/gauntlet-fps/SKILL.md'] : [])];
    const quebrados = [];
    let conferidos = 0;
    /* O QUE ESTE FILTRO CONSERTA — vale a explicação, porque o defeito era um loop.
       A varredura lia o arquivo INTEIRO, inclusive o bloco que ela mesma escreve. Quando
       um ponteiro quebrado era reportado, o relatório passava a CONTER o ponteiro
       (`… → \`game.js:99999\` …`), e a execução seguinte o encontrava de novo — no próprio
       relatório. Resultado medido: o `arquitetura.md` acusava um `game.js:99999` que não
       existia em parágrafo nenhum da página; o único lugar em que ele aparecia era a
       denúncia anterior. Régua que se alimenta da própria saída nunca fica verde, e
       vermelho que não corresponde a defeito ensina a ignorar vermelho.
       Conteúdo entre marcadores é GERADO — não é prosa humana e não se audita. */
    const semGerados = (t) => {
      const out = [];
      let dentro = false;
      for (const l of t.split('\n')) {
        if (/BEGIN:GERADO:/.test(l)) { dentro = true; continue; }
        if (/END:GERADO:/.test(l)) { dentro = false; continue; }
        if (!dentro) out.push(l);
      }
      return out.join('\n');
    };
    for (const alvo of alvos) {
      if (!existe(alvo)) continue;
      const txt = semGerados(ler(alvo));
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
   "apaga o marcador de `mapas` em comecando.md" passava VERDE antes desta tabela.
   O contrato agora é dos dois lados — o conteúdo é gerado E o lugar é declarado. */
const COLOCACAO = {
  numeros: ['README.md', 'docs/docs/comecando.md'],
  regras: ['README.md', 'docs/docs/comecando.md'],
  mapas: ['README.md', 'docs/docs/comecando.md', 'docs/docs/colaborar.md'],
  scripts: ['README.md', 'docs/docs/comecando.md', 'AGENTS.md'],
  zonas: ['AGENTS.md'],
  stack: ['README.md', 'docs/docs/stack.md'],
  assets: ['docs/docs/stack.md'],
  skills: ['docs/docs/stack.md'],
  licenca: ['README.md', 'docs/docs/licenca.md'],
  licenca_pontos: ['docs/docs/licenca.md'],
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
