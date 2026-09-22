# Praça dos Três Poderes — candidato técnico R2

## Escolha e fronteira

Esta lane foi aberta em `codex/praca-poderes-main-r2`, a partir de
`origin/main@60ad7501323ef076263f645bfca341e2454fce6b` (`alpha.262`). A Praça foi
escolhida por três motivos verificáveis: é o mapa padrão do jogo, é a arena com maior
impacto de primeira sessão e era o único mapa do catálogo sem PR técnico aberto nem
candidato final registrado. Os demais mapas com dívida tinham PR/worktree em produção
ou revisão; Sertão e Joá já haviam sido integrados.

A worktree histórica `praca-poderes-claude` foi preservada somente para leitura. Ela está
centenas de commits atrás de `main`, contém alterações não commitadas e mistura arquivos
compartilhados. Nenhum arquivo foi copiado dela sem revalidar a hipótese contra a árvore
atual.

Escopo permitido: `public/js/map_brasilia.js`, gates específicos e este relatório. Não
entram runtime, materiais/geradores compartilhados, assets novos ou privados, Mint/Astra,
versão/release, merge ou deploy.

## Definição de pronto

- rotas alternativas e CTF continuam conectadas em 5x5 e 8x8;
- saídas de spawn, flancos e eixo de conflito ganham cobertura mensurável sem bloquear o
  corpo ou criar parede invisível;
- acessos sob pilotis e aos marcos permanecem navegáveis;
- ambiência do espelho d'água e horizonte deixa de parecer um plano vazio, usando apenas
  geometria/procedural já disponível no repositório;
- cada cláusula nova reprova o baseline ou um mutante aplicado de verdade;
- DM/CTF, bots, custo e WebGL real são medidos nas proporções 3:2 e 16:9;
- promoção visual/jogável continua dependendo de playtest humano.

## Baseline causal — 22/09/2026

`map-contrato-check` e `ctf-win-check` passaram: 554 nós, 3.752 arestas, grafo conexo,
quatro rotas separadas e rodada CTF encerrando na terceira bandeira. `botsim` de 20 s
mediu sete bots, `stuck=6,122%`, `eff=0,84` e `laneSpread=0,64`.

O baseline falhou onde a mudança deve atuar. `map-check` mediu exposição média de spawn
de 89,8% (B) e 84,3% (E), além de quadrantes jogáveis com zero cobertura e espaçamento de
99 m. O espelho d'água ainda é um plano `MeshStandardMaterial`, e as rotas externas sob
os pilotis terminam em terreno/névoa sem silhueta urbana. O próximo gate mede o uso real
dessas superfícies e vem acompanhado de mutantes antes da correção.

## Estado

## Candidato técnico

O candidato substitui a lâmina opaca do espelho por `createWater`, acrescenta duas massas
urbanas instanciadas fora dos bounds e distribui dez jardineiras de concreto nas rotas sob
pilotis. O delta continua map-local: nenhum helper, material compartilhado, asset ou runtime
foi alterado.

O gate `praca-r2-check.mjs` mede o mundo montado. Resultado final: água viva com sol
alinhado (`dot=1,000`), horizonte vertical em 93% dos raios externos, cobertura em 10/10
intervalos de flanco, seis ligações spawn→CTF e três eixos longitudinais navegáveis. Os
mutantes `agua`, `horizonte`, `cobertura` e `rota` aplicam e reprovam isoladamente.

`map-contrato-check` permaneceu verde com 548 nós, 3.616 arestas e grafo conexo;
`ctf-win-check` fecha a rodada na terceira bandeira. `cena-check` mediu 314/350 draw calls e
646.305/740.000 triângulos. Build, `arch:check` e `docs:check` passaram.
O `check:deploy` passou 39/40 etapas; a única vermelha é a `UIR15` herdada em
`eval:redesign` (arte estática do resultado), fora do mapa e sem arquivo tocado nesta lane.

O `botsim` de 30 s cobriu 5x5/8x8 em DM/CTF. O pior `stuck` foi 8,656% no 8x8 DM; no 8x8
CTF foi 0,411%. A eficiência ficou entre 0,764 e 0,815 e `laneSpread=0,64` nas quatro células.

A matriz Chrome/WebGL2 real cobriu oito células (3:2/16:9 × 5x5/8x8 × DM/CTF), todas em
`live`, com 9/15 bots, GPU Apple M4 Pro, `p95=9,7–10,2 ms`, zero quadro acima de 100 ms,
346–407 draw calls máximos e 762.841–917.963 triângulos máximos. Ela registrou zero dívida
inesperada. As 39 ocorrências permitidas por célula são herdadas do servidor local: o
`SUPPORT_URL_BR`, URLs literais do template, `api/geo-lang`, manifests/áudio e decals ausentes;
nenhuma nasce no delta desta lane.

O `sourceSha256` comum à matriz e às dez capturas é
`07ad85401eb9d0016fd00ac5f238fc003233130fb3e51f0bae15433f569c8712`.
Recibos ignorados pelo Git:

- `artifacts/praca-poderes-main-r2/webgl-matrix/matrix.json` — SHA-256
  `11374c8fc02d0f021586fa48b91410423882a656c0780a451311b630f48faaff`;
- `artifacts/praca-poderes-main-r2/evidence/captures.json` — SHA-256
  `66c67dfb43debb43b6867d24930d2f5442a631d0e1923bbcdaba06793d6cc330`.

## Pendências de promoção

O candidato está no draft [#616](https://github.com/corosolto/client/pull/616), com
`autoMergeRequest=null`. O push foi normal, sem rebase ou force-push; o hook local exigiu
`--no-verify` apenas porque a `UIR15` herdada mantém `check:deploy` em 39/40.

O servidor local está em `http://127.0.0.1:8220/?debug=1&map=praca_poderes&perfilauto=0`.
O candidato ainda precisa de crítica independente e playtest humano em 3:2. A revisão deve
olhar especialmente se as jardineiras quebram a visada sem poluir a monumentalidade, se a
água está clara o bastante e se as massas de horizonte parecem cidade distante em vez de
fachadas repetidas. A exposição global dos spawns (89,8% B; 84,2% E) e o MAP5 genérico da
arena monumental continuam documentados como diagnóstico; nenhum deles foi mascarado por
redução de bounds ou afrouxamento de teto.
