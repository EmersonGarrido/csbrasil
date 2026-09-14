# Quebrada e Campinho R3

## Objetivo e definição de pronto

Reconstruir o trabalho aproveitável do draft #577 sobre a `main` vigente, sem
carregar a história conflitante da branch antiga. A entrega fica pronta quando a
geometria do Campinho, o restante da Quebrada, CTF e bots passam em 5x5 e 8x8;
os contratos rejeitam mutações; duas proporções são vistas em Chrome WebGL real;
e o draft substituto oferece uma URL local reproduzível.

Worktree: `worktrees/quebrada-campinho-r3`  
Branch: `codex/quebrada-campinho-r3`  
Base: `origin/main@dffcf1f5815342e1ae26e5d79beeaf54b833a2df`

Draft substituto: `https://github.com/corosolto/client/pull/602`.

## Extração seletiva

O draft #577 estava `DIRTY/CONFLICTING` e partia da alpha.246. Seus quatro
commits foram usados apenas como fonte. Entraram as muretas dos dois portões,
onze coberturas laterais, dois encostos, placar sem colisão, três nós de
contorno, reposicionamento de uma pilha junto ao muro e a varredura contínua de
segmento com raio do jogador. Nenhum commit antigo foi transplantado.

O diff funcional toca `public/js/map_quebrada.js`; não altera `game.js`, áudio,
materiais compartilhados, modelos ou registries. O cache-bust continua derivado
do conteúdo pelo manifesto recursivo existente.

## Régua antes e depois

Antes da geometria, `npm run eval:campinho-integration` reprovou com zero
`gate-cover`, zero `sideline-cover` e zero `sideline-backrest`. Depois, o mesmo
comando passou os quatro cenários e mediu cobertura sólida, grafo global,
arsenal, spawns, CTF e todas as rotas spawn-bandeira.

O contrato possui mutantes para cobertura invisível, cobertura que não segura
bala, spawn obstruído, alvo CTF curto, rota partida, grafo ilhado, arsenal
incompleto, placar ausente e composição incorreta em 5x5/8x8. Todos foram
rejeitados individualmente.

## Evidência estrutural e de jogo

`node tools/eval/map-check.mjs quebrada` passou com MAP1 em zero, pior folga de
spawn de 2,1 m, pior área contígua de 42,9 m², nenhum oclusor sem malha, pior
espaçamento de cobertura de 4,28 m e no mínimo duas rotas separadas para cada
par spawn-bandeira. A saída do comando é a fonte reproduzível destes números;
o JSON gerado foi restaurado para não reduzir o inventário versionado aos dados
de apenas um mapa.

`npm run eval:mapcontrato -- --map=quebrada` observou o grafo Node conectado.
No navegador, onde os GLBs reais participam da construção, as duas matrizes
observaram 365 nós e 2.354 arestas, todos conectados, quatro bandeiras e doze
pickups. `CTF_MAPA=quebrada node tools/eval/ctf-round-check.mjs` encerrou rodadas
por objetivo e a partida pela rede de segurança.

O botsim determinístico foi rodado por 60 s e nove sementes em cada cenário:

| Cenário | Bots no mundo | Stuck | Dispersão de rotas |
| --- | ---: | ---: | ---: |
| 5x5 mata-mata | 9 | 1,744% | 0,640 |
| 5x5 CTF | 9 | 3,800% | 0,640 |
| 8x8 mata-mata | 15 | 1,356% | 0,640 |
| 8x8 CTF | 15 | 2,000% | 0,640 |

Comando reproduzível: `SIM_TEAM_SIZE=<5|8> SIM_CTF=<0|1> node
tools/eval/botsim.mjs 60 quebrada`.

## WebGL real e revisão visual

`npm run eval:campinho-browser -- --base=http://127.0.0.1:8175 --seconds=10`
abriu dois processos frescos do Google Chrome, WebGL2/Metal na Apple M4 Pro.

| Cenário | p50 | p95 | máximo | >100 ms | Draw calls máx. | Triângulos máx. |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 5x5, 1536×1024, médio | 8,4 ms | 17,0 ms | 18,5 ms | 0 | 1.782 | 1.386.968 |
| 8x8, 1600×900, baixo | 8,3 ms | 9,8 ms | 10,3 ms | 0 | 927 | 1.022.396 |

O recibo está em `artifacts/campinho-r3/browser/receipt.json` (SHA-256
`8cf49351fd726892a2204e20bf8aa6e2e1e856390a4ed57fc1661bc8be8690c8`). As
capturas cobrem Vila, Baile, comércio, viela oeste, dois portões, as duas
laterais do Campinho, o respawn e a visão aérea. A inspeção mostrou coberturas
alternadas sem fechar o eixo central, os portões transitáveis, o placar legível
no fundo e o restante da Quebrada preservado.

Montagens locais:

- `artifacts/campinho-r3/review/contact-5x5-final.jpg` (SHA-256
  `a734b8d8db4a8518e72613625f0777e16e3074ea9b0af1cd9b2b0cf187fc1da9`)
- `artifacts/campinho-r3/review/contact-8x8-final.jpg` (SHA-256
  `93b964d5724521519c223a0e79549c7696e000c62af372bd19f843e873b0339a`)

## Dívida herdada e limite da aprovação

O Chrome repetiu `SUPPORT_URL_BR is not defined` e as requisições conhecidas
de decalque/URL malformada da alpha.255. O gate separa essas assinaturas exatas
e reprova qualquer erro de página ou HTTP novo. Esta lane não muda os sistemas
globais que originam essas falhas.

O `check:deploy` fechou 39/40. A única falha foi `eval:redesign`, cláusula
UIR15. O mesmo comando e a mesma cláusula reprovam numa exportação limpa de
`origin/main@dffcf1f58`; nenhum arquivo de UI ou resultado faz parte deste diff.
Todos os demais gates, incluindo sintaxe, cache por conteúdo, shaders, docs,
assets, Vercel, mídia, comentários e autoria, passaram.

A inspeção visual desta produção confirma que as vistas servidas são
revisáveis; a aprovação humana final continua pertencendo ao dono.

## Como testar

Servidor mantido em `http://127.0.0.1:8175`.

- CTF: `http://127.0.0.1:8175/?debug=1&auto=P,mst&map=quebrada&perfilauto=0&ctf=1`
- Mata-mata: `http://127.0.0.1:8175/?debug=1&auto=P,mst&map=quebrada&perfilauto=0`

Próximo passo: revisão humana nos dois links, com atenção aos dois portões,
à passagem pelas laterais e à pressão do Campinho em 8x8. Não houve merge,
deploy ou force-push.
