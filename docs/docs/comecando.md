---
id: comecando
title: Começando
sidebar_label: Começando
sidebar_position: 1
slug: /
description: O que é o CORO SOLTO, como rodar em 3 comandos e a estrutura real do repositório — conferida contra o código.
---

import useBaseUrl from '@docusaurus/useBaseUrl';

{/* Cabeçalho: o banner do canarinho girando, no formato largo em que ele foi feito
    (604×240, 24 quadros). Ele JÁ traz o letreiro — por isso a logomarca solta não
    aparece aqui; ela mora no rodapé, e o ícone do canarinho na navbar. Repetir o
    letreiro duas vezes na mesma dobra é ruído, não identidade. */}
<div className="cs-hero">
  <img
    className="cs-hero__bird"
    src={useBaseUrl('/img/canarinho-header.webp')}
    alt="CORO SOLTO: Treta Suprema — o canarinho, mascote do jogo, girando"
    width="604"
    height="240"
  />
</div>

# Começando

**CORO SOLTO: Treta Suprema** (ex-CS BRASIL) é um FPS de navegador escrito em
JavaScript vanilla sobre Three.js r160, no estilo do Counter-Strike 1.6: rounds,
bots, AWP, placar por Tab, rádio de voz. Roda num link, sem instalar nada.

Números **medidos em 2026-08-05**. Cada linha traz o comando que reproduz o número:
se a sua saída divergir, a árvore andou e é esta tabela que está velha, não o código.

| O que | Quanto | Onde confere |
|---|---:|---|
| Código do jogo | 24.693 linhas em 26 arquivos | `cat public/js/*.js \| wc -l` · `ls public/js/*.js \| wc -l` |
| `game.js` | **6.427** linhas | `wc -l public/js/game.js` |
| Armas com GLB | 26 | `ls public/models/weapons \| wc -l` |
| GLBs de personagem | 45 | `ls public/models/characters \| wc -l` |
| Personagens jogáveis | 44, em 5 facções | `public/js/characters.js`, array `CHARACTERS` |
| Mapas no registro | 5 | `public/js/maps.js`, objeto `MAPS` |
| Arnêses visuais em HTML | 12 | `ls public/*.html \| wc -l` |
| Scripts do arnês | 140 | `ls tools/eval/*.mjs tools/eval/*.py \| wc -l` |
| Versão | `2.0.0-alpha.12` | `public/js/version.js:5` e `package.json` |

E as regras de partida que mais mudam de lugar, todas lidas do `public/js/game.js`:

| Regra | Valor | Onde confere |
|---|---|---|
| Facções · personagens | 5 · 44 (P 8 · B 9 · U 9 · C 9 · F 9) | array `CHARACTERS` de `characters.js` |
| Mapas no menu | 5 — 2 abrem em rodadas, **3 em captura** | `MAPS` em `maps.js:8-36` (`ctfMode`) |
| Bots por lado | **2×2 a 8×8**, padrão 4×4 | `main.js:847` (menu) · `game.js:772` (o motor aceita 1 a 8) |
| Respawn | **2,2 s** (`RESPAWN_DELAY`) | `game.js:76` |
| Round | 99 s, 3 vitórias | `ROUND_TIME` / `ROUNDS_TO_WIN`, `game.js:76` |
| Captura | alvo de 3 bandeiras, 2 rodadas | `CTF_CAPS_TO_WIN` / `CTF_ROUNDS_TO_WIN`, `game.js:106-107` |
| Regeneração de vida | **DESLIGADA** — `?regen=1` religa | `game.js:303` |
| Ranking / páginas `/u/`| **DESLIGADOS** — é uma flag, volta numa linha | `RANKING_ON` em `src/lib/site.ts:68` |

:::note Dois desses são escolha recente, não defeito
**A regeneração de vida foi desligada** em 05/08 (`REGEN = QS.get('regen') === '1'`). Ela
existia, estilo CoD — 6 s sem tomar dano e 22 HP/s —, e o dono a reportou como bug
(*"a vida do 1st player volta a 100, não sei porque"*) justamente porque era **invisível**:
sem ícone, sem som, sem linha nas configurações. Regra que o jogador não percebe é
indistinguível de defeito. Ela continua inteira atrás de `?regen=1`, com a simetria
jogador↔bot. **Quem religar tem que entregar o feedback junto** — e resolver o que ela
vinha tapando: sem cura, kit ou colete, cada vida depois do primeiro contato já estava
perdida.

**O ranking foi desligado** e trocado por telemetria anônima. `/ranking` e `/u/*`
respondem **200 com aviso + `noindex`** (não 404 — as URLs estão indexadas e vão voltar),
e `/api/leaderboard` responde `{disabled:true}`.
:::

:::caution O portão NÃO está verde, e isso é declarado
Última execução completa registrada (04/08/2026): **36 de 49 invariantes críticas
passam**, mais 4 puladas por exigirem browser. A lista das vermelhas, com causa raiz e
`arquivo:linha`, está em [`KNOWN-BUGS.md`](https://github.com/rubenmarcus/csbrasil/blob/main/KNOWN-BUGS.md)
— é ele que é mantido dia a dia, não esta página.

Não repita o número de cabeça: `npm run eval:vm && node tools/eval/invariants.mjs --json`
leva 10-12 min e devolve o estado de hoje. **A ordem importa** — invariante de viewmodel
medida com o JSON de ontem inventa vermelha (ver [Como colaborar](./colaborar.md#rodar-o-portão)).
:::

## Rodar em 3 comandos

```bash
git clone https://github.com/rubenmarcus/csbrasil.git && cd csbrasil
npm install
npm run dev          # abre em http://localhost:4321 — essa página JÁ É o jogo
```

O pacote de áudio (`npm run fetch-audio`) é **opcional**: sem ele o jogo usa sons
sintetizados. A pasta `public/audio/` não é versionada.

### Alternativa sem Astro (zero dependência de build)

O arnês de avaliação traz um servidor estático de 24 linhas que serve `public/` e
mapeia `/` para o fonte da página do jogo:

```bash
node tools/eval/serve.mjs 8123   # http://localhost:8123
```

Ele existe exatamente porque `src/pages/index.astro` é HTML puro — dá pra servir o
arquivo cru sem passar pelo Astro (`tools/eval/serve.mjs:15`).

## A pegadinha que custa a primeira hora de todo mundo

**Não existe `public/index.html`.** Servir a pasta `public/` estaticamente te dá um
índice de diretório com `eval.html`, `mapview.html` e companhia — nenhum deles é o jogo.
O HTML do jogo é `src/pages/index.astro`, servido na **rota raiz** pelo Astro. Não há
rota `/game`.

A confirmação independente está no próprio arnês: `tools/eval/serve.mjs:15` precisa de um
caso especial `if (p === '/')` que lê `src/pages/index.astro` do disco, justamente porque
não há `index.html` em `public/` pra servir.

:::note Esta seção já foi uma lista de erros do README
Até 04/08/2026 ela existia porque o `README.md` da raiz mandava rodar
`cd public && python3 -m http.server` e falava num "jogo em `/game/`". As duas linhas
foram corrigidas — o README hoje diz o certo. O que sobrou é o fato em si, que continua
sendo a primeira pedra no caminho de quem chega.
:::

## Estrutura real do repositório

Duas zonas de código e uma terceira zona que é a razão desta doc existir (o arnês):

```
public/                 O JOGO — vanilla ES modules, ZERO build
  js/                     26 arquivos, 24.693 linhas
    game.js                 6.427 linhas: a classe Game (loop, bots, tiro, HUD)
    main.js                 1.545 linhas: menu, wiring de DOM, persistência
    vmattach.js springs.js weapons.js fparms.js handik.js   viewmodel/armas
    maps.js                 registro dos 5 mapas do menu (quem não está aqui não é jogável)
    map_brasilia.js map_pool_day.js map_havan.js
    map_ferrovelho.js map_quebrada.js                       os 5 mapas
    map_pool_ramos.js       "Piscinão" — existe no disco, FORA do registro
    mapprops.js map_decals.js                               props e grafite
    bloom.js textures.js vao.js stylize.js gpuparticles.js  gráficos/FX
    characters.js glbchars.js                               personagens
    audio.js version.js site-bg.js
  models/                 26 armas + 45 personagens em GLB
  vendor/                 Three.js r160 vendorizado (sem CDN, sem npm no runtime)
  style.css               o HUD inteiro
  *.html                  12 arnêses visuais (eval, mapview, weapontest, vm-inspect…)

src/                    O SITE (Astro 7 + adapter Vercel)
  pages/index.astro       ⚠ ISTO É O JOGO (HTML + import map + HUD)
  pages/sobre.astro       landing/FAQ com JSON-LD
  pages/personagens.astro  como-jogar.astro  ranking.astro  mapa.astro
  pages/u/[...path].astro  perfil público
  pages/api/*.ts          SSR: leaderboard, submit-match, register, badge, avatar
  layouts/Layout.astro    shell do site (não do jogo)
  lib/                    supabase, svg, geo, fmt

tools/
  eval/                   O ARNÊS — 140 scripts .mjs/.py. Ver "Quality gates"
    invariants.mjs          o portão (49 críticas + 4 que exigem browser, medido 04/08)
    ref-measure.py          mede os frames de referência (a doutrina da casa)
    harness.mjs             sobe o Game real em node com DOM stubado
    ARCH.md BAR.md          mapa de conflito (gerado) e a régua visual
  gen-arch.mjs            gera e VALIDA o ARCH.md

supabase/               schema + 12 migrations do ranking (DESLIGADO — ver estado.md)
.github/workflows/ci.yml  o portão rodando em CI
```

### As duas zonas, e por que a fronteira é dura

- **`public/` é o jogo.** Vanilla JS com ES modules, **sem framework e sem bundler**.
  Isso é decisão de projeto, não preguiça: o jogo tem que rodar arrastando a pasta
  pra qualquer host estático. Three.js é vendorizado em `public/vendor/` — não
  adicione CDN nem dependência de runtime sem abrir issue.
- **`src/` é o site.** Astro, com API routes SSR (`/api/*`). Aqui framework é
  bem-vindo. A `service_role` do Supabase vive no servidor e nunca no browser.

O jogo é carregado pela página Astro via **import map com versão**
(`src/pages/index.astro:97-123`). Isso importa na prática:

:::danger Bump do `?v=` nos dois lados
`public/js/version.js:2-4` avisa, com todas as letras, que o mesmo `?v=` vai no
import map do `index.astro`. Mexeu em `public/js/*.js` sem bumpar os dois lados, o
navegador serve o módulo velho do cache — foi causa raiz de "correções que não
chegavam ao usuário" por dias.
:::

## Comandos que você vai usar

```bash
npm run dev            # site + jogo (Astro, :4321) — a rota / JÁ É o jogo
npm run build          # dist/client + dist/server
npm run check          # O PORTÃO INTEIRO: syntax + áudio + ctfhud + vm + invariantes + coice + bots
npm run check:fast     # ~1 min, sem as invariantes: syntax + arch + áudio + pés + anims
                       #   + ctfhud + pausa + rodada de CTF + regeneração
npm run eval:vm        # enquadramento do viewmodel nas 26 armas — RODE ANTES das invariantes
npm run eval:invariants # as invariantes — node puro, 10-12 min
npm run eval:bots      # botsim 60 s × 5 mapas, sementes fixas
npm run eval:mat       # material/luz/fog/textura nos 5 mapas
node tools/eval/serve.mjs 8123   # servidor estático sem Astro
```

Todos estão em `package.json`, e vários trazem um par `//nome` logo acima com o motivo de
existirem — é onde mora o porquê. O `npm run check` é o mesmo conjunto que o CI roda em
`.github/workflows/ci.yml`.

:::tip Use o `check:fast` no loop, o `check` antes do PR
O `check` gasta 10-12 min porque sobe o jogo cinco vezes. O `check:fast` cobre as réguas
que nasceram dos bugs mais recentes (menu de pausa, rodada de captura, regeneração,
manifesto de animação) e roda em cerca de um minuto.
:::

## Onde ir agora

- **[Instrumentação de IA](./instrumentacao-ai.md)** — como o trabalho é feito aqui.
  Se você nunca colaborou com agentes num repo, comece por aí.
- **[Quality gates](./quality-gates.md)** — o que é uma invariante, como se escreve
  uma, e as duas leis da casa. É a página mais útil do site.
- **[Como colaborar](./colaborar.md)** — o que um PR precisa pra entrar, e as **15 tarefas
  de primeira contribuição** que já estão escritas em
  [`docs/issues/`](https://github.com/rubenmarcus/csbrasil/tree/main/docs/issues) (com um
  `abrir-issues.sh` pronto — elas ainda não foram abertas no GitHub).
- **[Roadmap e estado](./estado.md)** — o que está verde, o que está vermelho, e o que
  mudou desde a última medição colada.
