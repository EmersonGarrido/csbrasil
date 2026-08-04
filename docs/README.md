# `docs/` — site de documentação para desenvolvedores (Docusaurus 3)

Aplicação **separada** do site Astro da raiz. Tem o próprio `package.json` e o próprio
`node_modules`. Nada aqui é importado pelo jogo nem pelo site principal.

Conteúdo: instrumentação de IA, processos, quality gates, arquitetura, estado medido e
como colaborar. Tudo escrito contra o código, com `arquivo:linha` conferido.

```
docs/
  .gitignore              node_modules, build, .docusaurus
  package.json            docusaurus 3.6.3 + react 18 (+ override do webpackbar, ver abaixo)
  docusaurus.config.js    config mínima; baseUrl '/docs/'
  sidebars.js             sidebar manual, na ordem de leitura
  src/css/custom.css      paleta do HUD do jogo
  static/
    img/favicon.svg
    .nojekyll
  docs/
    comecando.md          o que é, 3 comandos, estrutura real do repo
    instrumentacao-ai.md  o loop: régua -> builders -> crítico -> caçador de regressões
    quality-gates.md      invariantes, as 2 leis da casa, teste de mutação da régua
    colaborar.md          setup, portão, o que um PR precisa, boas primeiras tarefas
    arquitetura.md        ARCH gerado + faixas de linha disjuntas
    estado.md             saída REAL do portão + dívidas declaradas
  issues/                 as 15 good-first-issues, uma por arquivo (README.md indexa)
  historico/              prompts e handoffs antigos — arquivo morto, não é doc viva
  INDICE.md               índice dos .md soltos desta pasta
  seguranca.md ROADMAP.md QUALITY.md IDEAS.md TRIBOS-URBANAS.md ASSETS-PROMPTS.md
```

> Só o que está em `docs/docs/` entra no site Docusaurus — é o `routeBasePath: '/'` do
> preset. Os `.md` soltos e o `historico/` ficam de fora de propósito: são material de
> repositório, lido no GitHub, não página publicada.

## Subir localmente

```bash
cd docs
npm install
npm start          # http://localhost:3000/docs/
```

`npm start` respeita o `baseUrl: '/docs/'`, então o dev server abre em
`http://localhost:3000/docs/`, não na raiz. É de propósito: é o mesmo caminho da produção.

Build:

```bash
cd docs
npm run build      # gera docs/build/
npm run serve      # serve docs/build/ localmente pra conferir
```

### O build RODA — e o que precisou para rodar (05/08/2026)

Até 05/08 esta seção dizia "ninguém rodou `npm run build` ainda", porque a doc foi
escrita numa máquina sem rede. Rodou. `npm install` (1.307 pacotes) e
`npx docusaurus build` completam, com **uma** correção necessária:

```
[ERROR] Error: Unable to build website for locale pt-BR.
  [cause]: ValidationError: Invalid options object.
    Progress Plugin has been initialized using an options object that does not
    match the API schema.
     * options has an unknown property 'name'  … 'color' … 'reporters' … 'reporter'
```

**Causa raiz:** `webpackbar@6.0.1` (o que o Docusaurus 3.6.3 traz) passa `{name, color,
reporter, reporters}` para o `ProgressPlugin` do webpack. O webpack resolvido aqui é o
**5.109.2**, que apertou o schema desse plugin e passou a rejeitar propriedade
desconhecida. Não é config nossa nem conteúdo: é incompatibilidade entre duas
dependências transitivas.

**Correção:** um `overrides` de uma linha em `docs/package.json`, subindo o `webpackbar`
para a `7.0.0` (a versão que fala com o webpack 5.10x). É a menor mudança que resolve —
não mexe na versão do Docusaurus nem na do webpack:

```json
"overrides": { "webpackbar": "^7.0.0" }
```

Depois disso: `✔ Client: Compiled successfully` e `[SUCCESS] Generated static files in
"build"`. O `npm start` (dev server) usa o mesmo webpack e o mesmo plugin, então a
correção vale para os dois.

> O CLI avisa que existe Docusaurus 3.10.2. Subir de versão maior **também** resolveria,
> e com menos gambiarra a longo prazo — mas é troca grande num pacote que ninguém tinha
> conseguido buildar até hoje. Primeiro fazer rodar, depois atualizar.

## Publicar em `/docs` junto do site Astro

A forma mais simples é buildar a documentação **para dentro** do diretório estático do
Astro:

```bash
cd docs
npm run build:site      # equivale a: docusaurus build --out-dir ../public/docs
```

Depois o build normal do site na raiz publica tudo junto:

```bash
cd ..
npm run build           # astro build
```

Resultado: `https://csbrasil.online/docs/`.

### Por que isso funciona — conferido neste repositório

1. `astro.config.mjs` não sobrescreve `publicDir`. O padrão do Astro é `./public`, e o
   conteúdo desse diretório é copiado **como está** para a saída do build, servido a
   partir da raiz do site.
2. A prova de que `public/` é servido na raiz está no próprio jogo: o import map de
   `src/pages/index.astro:97-123` aponta para `./js/main.js`, `./js/game.js` etc., e esses
   arquivos existem **só** em `public/js/`. Como o jogo funciona em produção, `public/X` é
   servido em `/X`. Logo `public/docs/` é servido em `/docs/`.
3. O `package.json` da raiz confirma o layout da saída: o script `preview` é
   `python3 -m http.server 4321 -d dist/client` — ou seja, a saída estática (incluindo o
   que veio de `public/`) fica em `dist/client`.
4. `baseUrl: '/docs/'` já está configurado em `docusaurus.config.js`. Sem ele, todo asset
   e todo link internos apontariam para a raiz e quebrariam.
5. Não existe rota `/docs` no Astro (`ls src/pages` não tem `docs.astro` nem
   `docs/index.astro`), então não há colisão de rota.

### Cuidados

- **A raiz TEM `.gitignore`** (esta seção afirmava o contrário; era verdade quando foi
  escrita e deixou de ser). Ele não lista `public/docs/`, então build gerado ali entra no
  `git status` pronto pra ser commitado. Escolha uma das duas:
  - **Não commitar o build** — crie um `.gitignore` com `public/docs/` e faça o build da
    doc entrar no `buildCommand` do `vercel.json`, antes do `npm run build`. Ex.:
    `"buildCommand": "bash scripts/fetch-audio.sh && (cd docs && npm ci && npm run build:site) && npm run build"`.
  - **Commitar o build** — mais simples, funciona sem mexer no pipeline da Vercel, mas
    polui o diff. Nesse caso, rode `npm run build:site` sempre que mudar a doc.
- **`docusaurus build --out-dir` apaga o diretório de saída antes de escrever.** Não
  aponte para `public/` inteiro. Aponte para `public/docs/` e só.
- **Não coloque nada em `public/docs/` à mão.** Ele é gerado.

### Alternativa: publicar separado

Se preferir manter a doc fora do domínio do jogo (GitHub Pages, Netlify, Vercel em outro
projeto), troque em `docusaurus.config.js`:

```js
baseUrl: '/',            // em vez de '/docs/'
url: 'https://SEU-DOMINIO',
```

e rode `npm run build` normal. Nesse caso `static/.nojekyll` (já incluído) é o que impede
o GitHub Pages de ignorar diretórios começados com `_`.

## Como manter esta documentação honesta

A regra é a mesma do resto do repositório: **nada de número inventado**.

- Toda afirmação técnica tem `arquivo:linha`. Se o arquivo andar, o ponteiro fica errado —
  confira antes de editar (é o mesmo problema que o `tools/gen-arch.mjs` resolve para o
  `ARCH.md`).
- A página `estado.md` tem saída de terminal **colada de uma execução real**. Ao
  atualizar, rode `node tools/eval/invariants.mjs` de verdade e cole a saída inteira,
  incluindo o que falha. Anote commit e data.
- Se não mediu, não escreva.
