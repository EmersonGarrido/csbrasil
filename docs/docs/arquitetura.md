---
id: arquitetura
title: Arquitetura
sidebar_label: Arquitetura
sidebar_position: 5
description: A arquitetura de verdade, gerada por tools/gen-arch.mjs — e o mecanismo de faixas de linha disjuntas que permite agentes em paralelo sem colisão.
---

# Arquitetura

## Por que este documento é gerado por script

O `tools/eval/ARCH.md` não é escrito à mão. Ele é gerado por `node tools/gen-arch.mjs`,
e a razão está no cabeçalho do script (`tools/gen-arch.mjs:5-8`):

> O `ARCH.md` escrito à mão dizia "game.js (3234 linhas)" quando o arquivo tinha 5361.
> Todos os ponteiros `arquivo:linha` da tabela de conflito estavam deslocados — e essa
> tabela é justamente o que impede dois agentes (ou dois contribuidores) de editarem a
> mesma região. Um índice por número de linha escrito à mão desatualiza no primeiro
> commit; a única correção é gerar.

E a separação que faz isso funcionar (`tools/gen-arch.mjs:11-13`):

```
frente -> SÍMBOLO   = conhecimento humano, estável, vive nas FRENTES do script
símbolo -> LINHA    = volátil, é o que este script resolve toda vez
```

O `ARCH.md` antigo cravava **frente → linha**, misturando os dois prazos de validade. É
uma ideia pequena com consequência grande: a partição de trabalho é declarada em termos
que não mudam (nomes de método), e a resolução para coordenadas voláteis (números de
linha) é recalculada a cada execução.

:::note O `arch:check` está VERMELHO agora — e isso é a melhor demonstração da página
`npm run arch` e `npm run arch:check` existem hoje no `package.json` da raiz, e o cheque
não está passando:

```
$ npm run arch:check
✗ ARCH1  ARCH.md está DESATUALIZADO em relação ao código.
         game.js tem 6428 linhas; o índice do ARCH.md não bate.
         Rode: npm run arch
```

O motivo desta vez é pequeno e vale conhecer, porque a mensagem induz ao erro: **o índice
de símbolos está certo.** O que ficou para trás é o **número de versão do jogo**, que o
bloco gerado também carrega e que subiu para `2.0.0-alpha.12` sem ninguém rodar
`npm run arch`. A mensagem fala de linhas porque é o resumo que ela sabe imprimir; o que o
`--check` compara de verdade é o bloco inteiro, byte a byte. Um comando resolve.

Cuidado que continua valendo: no CI o passo está com `continue-on-error: true`, então o
cheque roda mas **não bloqueia** — foi exatamente por isso que ele conseguiu ficar
vermelho sem que ninguém percebesse. Tirar essa linha é o que o transforma em portão de
verdade.
:::

## Os arquivos indexados, medidos agora

`node tools/gen-arch.mjs --json`, nesta árvore:

| Arquivo | Linhas | Símbolos |
|---|---:|---:|
| `public/js/game.js` | 6.428 | 228 |
| `public/js/main.js` | 1.546 | 147 |
| `public/js/characters.js` | 1.061 | 41 |
| `public/js/glbchars.js` | 750 | 59 |
| `public/js/vmattach.js` | 628 | 4 |
| `public/js/weapons.js` | 345 | 20 |
| `public/js/springs.js` | 261 | 28 |

### Os maiores métodos de `game.js` — onde o conflito mora

Os 15 maiores somam **3.219 linhas, 50% do arquivo** — a concentração PIOROU desde a
medição anterior (2.717 linhas / 46%). Método grande = PR irrevisável e merge conflitante.

| Linhas | Início | Método | |
|---:|---:|---|---|
| 800 | 5308 | `_updateBot()` | ⚠️ candidato a extração |
| 522 | 675 | `constructor()` | 🔴 append-only |
| 327 | 4585 | `_updatePlayer()` | ⚠️ candidato a extração |
| 244 | 2149 | `_resetPositions()` | |
| 242 | 1286 | `_buildViewModels()` | |
| 237 | 1676 | `_buildStaticVmClass()` | |
| 148 | 1528 | `_vmFrame()` | |
| 146 | 4912 | `_updatePickups()` | |
| 133 | 4204 | `_botCtf()` | |
| 83 | 2889 | `_tryShoot()` | |
| 77 | 3220 | `_dmgArc()` | |
| 69 | 4343 | `_updateCtfHud()` | |
| 66 | 6146 | `_updateRadar()` | |
| 64 | 3369 | `_wpnIcon()` | |
| 61 | 6332 | `update()` | |

> Os números de linha desta tabela envelhecem a cada commit em `game.js`, de propósito:
> a fonte é `node tools/gen-arch.mjs --json`, e o `tools/eval/ARCH.md` gerado é o que
> vale na hora de partir trabalho. Esta tabela é ilustração, não contrato.

Um método de 800 linhas é dívida declarada. Extrair `_updateBot` em partes menores é
trabalho de valor alto e risco médio — coordene antes de começar, porque a região é
compartilhada.

## Faixas de linha disjuntas

Este é o mecanismo que permite vários agentes (ou contribuidores) editarem o **mesmo
arquivo de 6.428 linhas** ao mesmo tempo, sem conflito de merge.

### Como funciona

1. **Cada frente declara SÍMBOLOS, nunca linhas.** Em `tools/gen-arch.mjs:32-73`, a
   constante `FRENTES` lista, por frente, três coisas: `arquivos` exclusivos, `simbolos`
   (métodos) e `consts` (constantes de topo). Exemplo, a frente ARMAS/VIEWMODEL possui
   `_buildViewModels`, `_vmFrame`, `_tryShoot`, `_shotRecoil`… e as constantes `WEAPONS`,
   `VM_FOV_DEFAULT`, `VM_OFF`, `REC_DEG`.
2. **O script indexa o arquivo e resolve símbolo → faixa.** `indexar()`
   (`tools/gen-arch.mjs:80-111`) varre o arquivo linha a linha com três padrões: método
   de classe (exatamente 2 espaços de indentação), **método-arrow atribuído em runtime**
   (`this._vmFrame = (force) => {`) e declaração de topo. O fim de cada símbolo é o
   início do próximo.
3. **Faixas contíguas são fundidas** (gap ≤ 12 linhas) para a tabela ficar legível
   (`tools/gen-arch.mjs:172-178`).
4. **Sobreposição entre frentes é detectada**, porque uma tabela de conflito que se
   contradiz é pior que nenhuma (`tools/gen-arch.mjs:190-200`).

O detalhe do passo 2 vale destacar: a v1 do script só via métodos de classe, e por isso
`_vmFrame` — cerca de 100 linhas que nascem **dentro** de outro método, como arrow que
fecha sobre variáveis locais — ficava **invisível no índice**
(`tools/gen-arch.mjs:95-97`). Um índice que não vê o método mais disputado do arquivo é
pior que nenhum índice, porque dá falsa confiança.

### A tabela de conflito

Do `tools/eval/ARCH.md` (bloco gerado — as faixas abaixo são as da geração anterior; rode
`node tools/gen-arch.mjs` para as de hoje):

| Frente | Arquivos exclusivos |
|---|---|
| **ARMAS / VIEWMODEL** | `vmattach.js` `springs.js` `weapons.js` `fparms.js` `handik.js` |
| **BOTS / JOGABILIDADE** | — (só faixas em `game.js`) |
| **MAPAS / MUNDO** | `maps.js` `mapprops.js` `map_brasilia.js` `map_havan.js` `map_pool_day.js` `map_pool_ramos.js` `map_ferrovelho.js` |
| **GRÁFICOS / FX** | `bloom.js` `textures.js` `vao.js` `stylize.js` `gpuparticles.js` |
| **UI / HUD / MENU** | `main.js` `public/style.css` `src/pages/index.astro` |
| **ÁUDIO** | `audio.js` |
| **PERSONAGENS** | `characters.js` `glbchars.js` |
| **SITE / BACKEND** | `src/` `supabase/` |

:::caution Dois arquivos de mapa NÃO têm dono declarado
`map_quebrada.js` (1.319 linhas, o mapa mais novo) e `map_decals.js` **não aparecem em
frente nenhuma** de `tools/gen-arch.mjs` — a lista acima é cópia fiel do `FRENTES`, e eles
não estão lá. Quem editar os dois não colide com ninguém *segundo a tabela*, que é
justamente a garantia que a tabela deveria dar e não dá. Acrescentá-los é uma linha em
`tools/gen-arch.mjs` seguida de `npm run arch`.

(O `map.js` já foi listado aqui e **não existe mais**: era a "Praça (clássico)", apagada
junto com o mapa `praca_old`.)
:::

### As zonas vermelhas

Três métodos são **append-only**, porque qualquer frente pode precisar deles
(`tools/gen-arch.mjs:75-77`):

- `update()` — o loop
- `_dom()` — o wiring de HUD
- `constructor()` — **522 linhas** hoje, o segundo maior método do arquivo

Editar o miolo destes é o jeito mais rápido de dois contribuidores se atropelarem.
Acrescente no fim; não reorganize.

### As regras operacionais

- **Declare sua frente antes de editar.** Se for um PR humano, diga na descrição.
- **Em `game.js`, use edição por trecho — nunca sobrescreva o arquivo inteiro.** Uma
  ferramenta que reescreve o arquivo apaga o trabalho de quem está na outra faixa.
- **Duas frentes com faixas disjuntas rodam em paralelo.** O `ARCH.md` gerado registra
  que isso foi medido: *"3 agentes editaram faixas disjuntas simultaneamente com zero
  conflito de conteúdo"* (`tools/gen-arch.mjs:163`).
- **Mexeu num símbolo? Mova o nome na declaração da frente, não o número.** O script
  avisa quando um símbolo declarado some do código.

:::tip Por que isso importa pra você, humano
A mesma partição que evita colisão entre agentes é o que torna um PR seu revisável. Um
PR que toca `_updateBot` + `style.css` + `map_havan.js` é três PRs escondidos num só, e
vai colidir com três frentes diferentes. Um PR por frente entra rápido.
:::

## As três zonas do repositório

```
public/     jogo      vanilla ES modules, zero build, Three.js vendorizado
src/        site      Astro 7 + adapter Vercel, API routes SSR
tools/      arnês     140 scripts .mjs/.py — a régua, o portão e as sondas
```

O acoplamento entre elas é deliberadamente fino e vale entender:

- **O site carrega o jogo por import map**, em `src/pages/index.astro:97-123`. É o único
  ponto onde o Astro sabe da existência dos módulos do jogo.
- **O arnês carrega o jogo direto do disco**, sem browser: `tools/eval/harness.mjs` stuba
  DOM/canvas/`fetch` e importa `public/js/game.js` como módulo. Por isso o portão mede o
  código de produção, e não uma reimplementação.
- **`tools/eval/serve.mjs:15`** faz a ponte pro caso de teste: serve `public/` e mapeia
  `/` para o fonte do `index.astro`, sem Astro no caminho.

### Consequência prática

O jogo **não pode** ganhar dependência de runtime nem passo de build. Isso não é
conservadorismo: é o que faz `harness.mjs` conseguir subir a classe `Game` em node puro
em segundos, que é o que faz o portão existir. Um bundler no meio quebraria a régua junto
com a portabilidade.

## Sistema de dados de conteúdo

Hoje mapas, armas e personagens são **código** (`map_havan.js` tem 1.866 linhas de
geometria declarada à mão). O `ROADMAP.md`, Fase 2, define a direção: migrar para JSON
com loader único, para que uma contribuição de conteúdo seja *"abre um JSON e cria
conteúdo"* em vez de *"um PR de código hand-coded arriscado"*.

Se você quer o trabalho de maior alavancagem no projeto inteiro, é esse. Ver
[Roadmap e estado](./estado.md).
