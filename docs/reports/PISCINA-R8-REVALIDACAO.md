# Piscina da Treta — revalidação sobre `main`

## Estado e escopo

- PR histórico [#566](https://github.com/corosolto/client/pull/566) foi mergeado em
  22/09/2026 às 01:18 UTC com o head antigo `1e7049994`. Como um PR mergeado não aceita
  atualização de base/head, esta revalidação segue no draft
  [#612](https://github.com/corosolto/client/pull/612), contra `main`.
- Branch/worktree: `codex/piscina-rework-stack` em
  `/Volumes/Zenith/Projects/game/corosolto/csbrasil/worktrees/piscina-rework-stack`.
- `origin/main` inicial: `7bb2707ef576260b30ceb88c5973b9f6618684cd`; atualização
  final após o merge do Carandiru: `60ad7501323ef076263f645bfca341e2454fce6b`.
- Integração preservou o histórico empilhado por merge, mas o estado final contra `main`
  contém somente o mapa, contrato, régua e evidência da Piscina. Nenhum asset Mint/privado,
  material compartilhado ou runtime compartilhado foi incluído.
- `map_uv.js` e `applyAniso`, ausentes na `main`, foram substituídos por uma fábrica UV local
  ao mapa. A sombra usa o orçamento compartilhado já existente por `aplicaSombraSol`.

## Resultado técnico

### Corredores, proteção, visão e navegação

`piscina-rework-check.mjs` passou PIS1/PIS2/PIS3/PIS4/PIS6 e mordeu 8/8 mutantes:
`sem-corredor`, `boca-unica`, `cobertura-submersa`, `ilha-solta`,
`sem-anteparo-spawn`, `porta-estreita`, `spawn-deslocado` e `sem-ambiencia`.

- corredor oeste: 9 nós, duas entradas sul e duas norte, conectado;
- corredor leste: 9 nós, duas entradas sul e duas norte, conectado;
- três famílias de rota e mínimo de duas rotas separadas entre spawn/objetivos;
- vestiários norte/sul: quatro anteparos e três portais de 3 m cada;
- salão: zero cobertura submersa e zero ilha solta nas faixas de spawn;
- ambiência do mundo: indoor, água, hum posicional e splash.

`piscina-stack-evidence.mjs` mediu 122 nós e 593 arestas. As rotas centrais/oeste/leste
têm 41,32 / 65,79 / 70,59 m e passam a cápsula de 0,38 m. As 24 combinações de quatro
spawns por time contra três objetivos são alcançáveis. `eval:mapcontrato`, `eval:ctfwin`,
`eval:webgl`, `docs:check` e o build Astro passaram.

O diagnóstico genérico `map-check` ainda reporta MAP5=99 m e razão de props `0x` nos
quadrantes centrais. Isto corresponde ao tanque aberto, decisão central do layout, e não
foi escondido nem chamado de verde. A aprovação depende de o salão aberto funcionar em
jogo junto dos dois flancos protegidos.

### Bots 5x5 e 8x8

Simulação determinística de 60 s, nove sementes, usando o `Game` e `_updateBot` reais:

| modo | bots | stuck | spin roam | eficiência |
|---|---:|---:|---:|---:|
| DM 5x5 | 9 | 2,222% | 0,019 | 0,124 |
| DM 8x8 | 15 | 1,089% | 0,008 | 0,133 |
| CTF 5x5 | 9 | 3,611% | 0,024 | 0,130 |
| CTF 8x8 | 15 | 0,867% | 0,013 | 0,124 |

Os quatro casos ficaram abaixo do teto de 4% usado no programa de mapas.

### WebGL real e orçamento visual

Chrome WebGL2/ANGLE Metal, Apple M4 Pro, sem software fallback e sem erro JS. Foram
capturados med/low, 5x5/8x8, em 1200x800 (3:2) e 1600x900 (16:9): 56 quadros no total.
Os recibos confirmam 9/15 bots reais.

Nos oito ensaios DM e oito CTF de 12 s, p95 ficou entre 9,1 e 9,2 ms. Um primeiro DM
5x5 med teve uma pausa fria de 416,6 ms; a repetição isolada teve máximo 16,6 ms e zero
quadro acima de 100 ms. Todos os outros casos tiveram zero quadro acima de 100 ms.

O custo absoluto continua parcialmente vermelho no médio:

- 3:2 DM med: 5x5 `809 calls / 933.476 tris`; 8x8 `936 / 1.070.745`;
- 16:9 DM med: 5x5 `851 / 914.818`; 8x8 `920 / 1.080.395`;
- 3:2 CTF med: 5x5 `805 / 926.638`; 8x8 `978 / 1.073.693`;
- 16:9 CTF med: 5x5 `837 / 926.880`; 8x8 `1.004 / 1.044.959`;
- todos os casos low ficaram abaixo de `669 calls / 506.278 tris`.

Assim, o frame time observado é estável, mas o teto histórico de 860 calls / 870 mil
triângulos não está verde em médio. A aprovação de orçamento precisa decidir se o teto
é absoluto ou se o frame time real desta máquina é a régua operacional.

No primeiro baseline sobre `7bb2707ef`, `eval:qualmapas` passou 4/4 e o mutante de sombra
literal foi mordido. A `main` final `60ad75013` introduziu uma falha global alheia à
Piscina: `map_penitenciaria.js` voltou a usar `shadow.mapSize.set` fora de
`mapquality.js`, reprovando QMAP1/QMAP3. A Piscina continua usando `aplicaSombraSol` e
esta lane não alterou o mapa da Penitenciária. No recorte da Piscina, `texel-check` mediu
mediana/p05/p95 de 128 px/m, dispersão p95 1x e 4% da área
abaixo de 64 px/m. Permanecem duas dívidas: máximo/mediana de 6,5x num cilindro e 6% da
área texturizada sem medida (206 malhas, principalmente decalques).

O verificador estático `ambience-registry-check --map=piscina_treta` continua vermelho
porque não reconhece a ambiência declarada diretamente no mundo. A régua causal do mapa
confirma água + hum + splash e o mutante `sem-ambiencia` a derruba. O playtest humano
deve ouvir o mapa com áudio ligado; as capturas automatizadas usam `--mute-audio`.

## Evidência e reprodução

- URL local: `http://127.0.0.1:8152/?debug=1&map=piscina_treta&auto=P,mst&perfilauto=0&ctf=1`
- contato 3:2: `artifacts/piscina-r8-20260922/contact-32.jpg`
  (`c201ffd3b7d4b7850a3f54cae255bc5b4669fbfeee8c9ac9626d42d8a91c2495`)
- contato 16:9: `artifacts/piscina-r8-20260922/contact-169.jpg`
  (`1233d71400134ce207601487e1075aa68591969b077737424f9bd237eac46269`)
- recibos 3:2: `artifacts/piscina-r8-20260922/browser/summary.json`
  (`c02dff5caecf43229bf4264c83fd67c164e6587537cbec8bba7313b94a1dd974`)
- recibos 16:9: `artifacts/piscina-r8-20260922/browser-169/summary.json`
  (`174345a8dddb53f276732b69c432b5c16b2b99b8ee75db72a2d78dea2dcd266c`)
- matriz espacial: `artifacts/piscina-r8-20260922/spatial.json`.
- performance: `artifacts/piscina-r8-20260922/perf-*` e
  `artifacts/piscina-r8-20260922/perf-ctf-*`.

Comandos principais:

```bash
PATH=/opt/homebrew/bin:/usr/bin:/bin node tools/eval/piscina-rework-check.mjs
PATH=/opt/homebrew/bin:/usr/bin:/bin node tools/eval/piscina-rework-check.mjs --mutantes
PATH=/opt/homebrew/bin:/usr/bin:/bin node tools/eval/piscina-stack-evidence.mjs
PATH=/opt/homebrew/bin:/usr/bin:/bin npm run eval:mapcontrato
PATH=/opt/homebrew/bin:/usr/bin:/bin npm run eval:qualmapas
PATH=/opt/homebrew/bin:/usr/bin:/bin npm run eval:ctfwin
PATH=/opt/homebrew/bin:/usr/bin:/bin npm run build
```

## Feedback humano necessário

1. Jogar DM e CTF 8x8 e confirmar se os três portais de cada vestiário permitem sair
   sem virar um gargalo de spawn.
2. Testar os corredores oeste/leste como rota de flanco e confirmar se há proteção útil
   sem virar corredor seguro demais.
3. Decidir se a piscina central deve continuar aberta e dominante ou se ainda falta uma
   peça baixa de proteção que não recrie o labirinto já rejeitado.
4. Ouvir água, hum indoor e splash com áudio ligado.
5. Julgar a linguagem branca/azul nas capturas 3:2; tecnicamente legível, mas ainda cabe
   ao dono decidir se o espaço parece vivo o bastante.

PIS7 (aceite visual/jogável) e o orçamento médio permanecem pendentes. Não há autorização
para merge/deploy nesta lane.
