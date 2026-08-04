---
id: estado
title: Roadmap e estado
sidebar_label: Roadmap e estado
sidebar_position: 6
description: O que está verde e o que está vermelho HOJE, com a saída real do portão, e as dívidas declaradas do projeto.
---

# Roadmap e estado

Esta página tem a saída **real** do portão, colada de uma execução de verdade. Se ela
divergir do que você vê na sua máquina, a sua máquina está certa e esta página está
velha — rode e reporte.

## Como reproduzir

```bash
node tools/eval/invariants.mjs
```

Na máquina onde isto foi rodado (2 CPUs, com outros cinco processos de avaliação
concorrendo), a execução levou cerca de **10 minutos**. Ela sobe o jogo real cinco vezes
(um por mapa), roda 60 s de simulação de bots por mapa e audita 26 GLBs.

:::danger LEIA ISTO ANTES DA SAÍDA COLADA: ela é de 2026-08-03 e o jogo andou muito
A saída lá embaixo continua palavra por palavra como saiu de uma execução real — reescrever
número de portão à mão é exatamente o que esta página existe para impedir. Mas o que ela
fotografou **não é o jogo de hoje**, e ler aquele bloco como se fosse manda o contribuidor
consertar o que já foi consertado.

O que mudou, item a item:

| O que a saída de 03/08 diz | Estado em 2026-08-05 | Como conferir |
|---|---|---|
| mapas: `awp_map`, **`praca_old`**, `fy_pool_day`, `fy_havan`, `fy_ferrovelho` | **`praca_old` SAIU** e **`fy_quebrada` ENTROU**. Continuam 5 — por isso nenhuma contagem acusou | `MAPS` em `public/js/maps.js:8-36` |
| CTF medido em 5 mapas | **3 mapas abrem em captura** (`fy_havan`, `fy_ferrovelho`, `fy_quebrada`); os outros 2 abrem em rodadas | `ctfMode` no mesmo objeto |
| `CRÍTICAS: 31/42` | **36/49** — a contagem cresceu porque entraram invariantes novas | `KNOWN-BUGS.md`, cabeçalho |
| `CHR5B` como AVISO (27/44 personagens sem mapa de superfície) | **VERDE**: 0 de 44 | `KNOWN-BUGS.md` |
| `TEX1` verde | **VERMELHA**, por 10 superfícies do `fy_quebrada`, que é mapa em obra | `KNOWN-BUGS.md` |
| `public/models/anims/` não versionado → TPM1 vermelha em clone limpo | **versionada**: 438 arquivos | `git ls-files public/models/anims \| wc -l` |
| `npm run arch` / `arch:check` não existem | **existem** no `package.json` | `npm run arch:check` |
| README manda o dev pro lugar errado | **corrigido** | `README.md` da raiz |
| `version.js` = `3.3.0` | `2.0.0-alpha.12` | `public/js/version.js:5` |

E duas mudanças de **regra de jogo** que a saída não tem como mostrar, porque não são
invariantes de portão:

- **Regeneração de vida DESLIGADA** (`game.js:303`). `?regen=1` religa.
- **Ranking DESLIGADO** (`RANKING_ON = false`, `src/lib/site.ts:68`), trocado por
  telemetria anônima. `/ranking` e `/u/*` respondem 200 com aviso e `noindex`.

O estado corrente, com causa raiz e `arquivo:linha` de cada vermelha, mora em
[`KNOWN-BUGS.md`](https://github.com/rubenmarcus/csbrasil/blob/main/KNOWN-BUGS.md) — é ele
que é mantido dia a dia, não esta página.
:::

:::caution Onde `praca_old` aparecer abaixo, leia "mapa que não existe mais"
A Praça (clássico) saiu do registro por pedido literal do dono (*"vamos apagar praça
clássica"*) e o `public/js/map.js` foi apagado junto — era uma versão procedural anterior
da mesma praça que o `awp_map` já entrega em Brasília fiel. Efeito colateral medido: o
`pickup-check` caiu de 246 para 244 pickups (ela tinha 2 armas no chão). O mapa que
entrou no lugar, e que **não aparece em nenhuma linha da saída de 03/08**, é o
`fy_quebrada` — rua reta com rotunda de baile numa ponta e campinho de terra na outra,
CTF de 4 bandeiras.
:::

## Placar da última execução COLADA (2026-08-03)

Não é o placar de hoje — é o último que existe colado por inteiro. Execução em
`2026-08-03`, commit `e332c87`, `public/js/version.js` = `3.3.0`:

```
CRÍTICAS: 31/42 passam  ← VM1, VM3, VM5, VM12, VM16, VM18, VM18b, VM19, TPM1, BOT8, CHR1 VERMELHAS
AVISOS:   BOT1, BOT2, CHR5B fora do alvo
PULADAS:  4 (exigem browser ou arnês ausente)
```

Código de saída: **1**. O portão está **vermelho**, e por consequência o CI também está —
`.github/workflows/ci.yml:31-32` roda exatamente este comando e não tem `continue-on-error`.

:::warning Isso é o estado real, não uma vitrine
O dono pediu esta doc com a saída de verdade. Ela está aqui inteira, incluindo o que
falha. Um projeto que só mostra o verde não consegue receber ajuda no vermelho.
:::

## A saída completa, sem cortes

```text
=============== INVARIANTES — CORO SOLTO ===============

✓ PASSA   SYN   todos os public/js/*.js parseiam
                ok
✗ FALHA   VM1   borda esquerda da silhueta entre 0,50 e 0,60 (ref medida 0,520-0,565)
                0.525 a 0.631 | 2/26 armas fora (pior famas, uzi)
✓ PASSA   VM2   antebraço sai pela borda direita (≥ 0,99)
                mín 2.109
✗ FALHA   VM3   eixo da silhueta entre 22° e 42° na tela (ref CS 1.6 medida 28,0° e 34,8°)
                22.1° a 44.5° | 1/26 armas fora (pior revolver38)
✓ PASSA   VM4   enquadramento igual em 16:9 e 3:2 (Δ ≤ 0,03)
                Δ máx 0
✗ FALHA   VM5   área da arma na tela entre 6% e 16%, nos 2 aspectos (ref medida 9,76-13,09%)
                16:9 6.3-12.8% | 3:2 5.6-11.6% | 3/26 armas fora (pior deagle, carbine, sks)
✓ PASSA   VM6   as 26 armas passam pelo pipeline de viewmodel
                26 armas auditadas
✓ PASSA   VM9   grip entre 0,90 e 1,08 da ALTURA da tela, nos 2 aspectos (ref medida: 0,915 na M4; FORA do quadro na AK e na Vandal)
                0.959 a 1.063 da altura | 0/26 armas fora da banda
✓ PASSA   VM10  grip no MESMO ponto vertical em 16:9 e 3:2 (Δ ≤ 0,03)
                Δy máx 0.016 (awp) em 26 armas
✗ FALHA   VM12  look CS 1.6: boca do cano LOGO abaixo da mira (y entre 0,50 e 0,62) nos 2 aspectos
                0.498 a 0.66 da altura em 52 medidas | 5 fora da faixa (16:9 2, 3:2 3) — pior famas@3:2 0.66, famas@16:9 0.647, tavor@3:2 0.637, g3sg1@3:2 0.632
✗ FALHA   VM16  a coronha sai pela QUINA de raspão: fatia na borda direita entre 0,02 e 0,20 da altura (ref 0,053-0,095)
                0 a 0.316 da altura em 52 medidas | 12 não encostam na borda direita | 9 saem demais — pior awp, deagle, revolver38, carbine
✗ FALHA   VM18  legibilidade: a silhueta visível é uma ARMA e não um cano — gordura 0,684-0,948 (ref medida), cano inteiro na tela e corpo atrás do gatilho
                gordura 0.276-0.66 em 52 medidas | 52 magras (< 0,684) | 0 gordas (> 0,948) | 0 sem o cano inteiro (frente < 0,95) | 9 sem corpo atrás do gatilho (trás < 0,20) — piores shotgun 0.276, shotgun 0.29, carbine 0.315, carbine 0.332, knife 0.368
✗ FALHA   VM18b arma longa cobre entre 8,0% e 13,09% da tela (ref medida em 3 fuzis: 9,76 / 9,78 / 13,09%)
                44 medidas em 22 armas longas | 0 acima de 13,09% | 15 abaixo de 8,0% (awp, shotgun, g3, md97, carbine, mosin)
✗ FALHA   VM19  a pose de MIRA é a âncora: em toda arma o ADS é ao menos tão legível quanto o quadril, e mostra corpo atrás do gatilho
                26 armas | ganho de gordura no ADS -0.024 a 0.311 | dentro da faixa medida (0,684-0,948): ADS 8/26 vs quadril 0/26 | 2 armas em que mirar PIORA a legibilidade | 1 sem corpo atrás do gatilho no ADS — deagle, revolver38
✓ PASSA   VM15  distância MÉDIA do grip até a banda 0,90-1,08 (escalar da VM9; 0 = todos dentro)
                média 0 | pior 0 | 52/52 medidas dentro da banda
✓ PASSA   VM8   z da coronha ≤ −0,05 no pico do coice em TODAS as armas (folga sobre o near plane)
                pior -0.051 (carbine) | 0/26 acima do teto
✓ PASSA   VM7   pitch do viewmodel em rajada ≤ 6° em todas as armas (REC_DEG declarado ≤ 4,9°)
                máx 3.5° (awp) | 0/26 acima do teto
✓ PASSA   AUD1  o frame() do vm-mint-audit espelha o _vmFrame do game.js (recuoZ, nearX, VM_OFF, vmOffY, pitch/yaw/roll, pose de ADS)
                26 armas | pior Δ(grip,boca) 0.001 m (knife) | pior Δescala 0.0004 | grip no ADS casa (pior Δ 0.0016 de tela, knife) | lente do JSON casa (V0=42°, VM_OFF=[0.03,-0.1,0]) | termo vertical do argumento Y casa (vmOffY(16:9)=-0.1 = VM_OFF[1])
✓ PASSA   VM17  no ADS o pitch/yaw próprios da arma são zerados (rampa vmAdsRot)
                vmAdsRot(24°, adsF): quadril 24° | meio 12° | mira 0° — a arma volta ao eixo antes da alça
✓ PASSA   RIG   rig de viewmodel: ADS/bob/recarga/troca/coice
                16 PASS / 0 FAIL
✗ FALHA   TPM1  sonda de mount 3ª pessoa roda sem erro e sem FAIL
                 Command failed: /opt/node22/bin/node /tmp/wE/tools/eval/tp-mount-probe.mjs
node:fs:560
  return binding.open(
         
✗ FALHA   BOT1  bot não fica indo de lado (latFlips ≤ 12/min)
                12.3/min
✗ FALHA   BOT2  bot não gira em torno de si (≤ 0,25 volta/min)
                0.25/min
✓ PASSA   BOT3  bot não trava (stuck ≤ 4% do tempo)
                2.2%
✓ PASSA   BOT4  janela entre o 1º tiro e a morte ≥ 3 s
                4.07 s
✓ PASSA   BOT5  fração de headshot do bot ≤ 10%
                0.013
✓ PASSA   BOT6  taxa de acerto do bot ≤ 22%
                0.067
✓ PASSA   BOT7  jogador morre ≤ 3 vezes/min no duelo
                0.94/min
✗ FALHA   BOT8  zero episódios de bot com LOS no jogador por > 1,5 s sem disparar
                2.7 episódios | maior silêncio 3.03 s | 494 s em condição
✓ PASSA   VM14  todo pickup é alcançável (conectividade a pé do spawn, chão ≥ −0,10, arma encostada ≤ 0,05)
                246 pickups em 5 mapas | sem alcance 0 [-] | abaixo do piso 0 [-] | flutuando 0 [-] | flood-fill: awp_map 215758 cel, praca_old 67893 cel, fy_pool_day 23218 cel, fy_havan 81905 cel, fy_ferrovelho 54777 cel
✓ PASSA   ARM1  toda arma com scope:true declara spreadScope
                26 armas conferidas
✓ PASSA   ARM2  ADS reduz o spread no caminho de tiro
                ok
✓ PASSA   ARM4  nenhuma arma longa demais (len ≤ 1,25 m fora de sniper de ferrolho)
                26 armas
✓ PASSA   ARM5  killfeed emitido de um lugar só por morte
                1 chamadas de _feed
✓ PASSA   ESP1  existe rack/armário de armas (em vez de arma espalhada)
                ok
✓ PASSA   MOD1  nenhum mapa força CTF (ctfOnly removido)
                0 mapas com ctfOnly:true
✗ FALHA   CHR1  proporção humana: mediana do elenco dentro de ±35% da antropometria e ninguém "balão"
                44/44 medidos no GLB | mediana: cabeca/H 0.223(ref 0.13) ombro/H 0.174(ref 0.259) cintura/omb 1.305(ref 0.74) larguraTorso/H 0.889(ref 0.174) braco/H 0.298(ref 0.44) perna/H 0.378(ref 0.53) | pior índice de balão: bombado 6.52x | MEDIANA FORA: cabecaSobreAltura 0.223 vs 0.13, cinturaSobreOmbro 1.305 vs 0.74, larguraTorsoSobreAltura 0.889 vs 0.174 | BALÃO: esquerdomacho 5.01x, sindicato 6.12x, mst 5.64x, doutora 4.69x, mistico 5.06x, caminhoneiro 5.97x (+33) | teto absoluto = FALLBACK PUBLICADO (Drillis & Contini 1966 / Winter fig.4.1) — NÃO é foto medida
✓ PASSA   CHR2  altura do CORPO dentro de meia hitbox de cabeça entre todos (dispersão ≤ 0,15 m)
                dispersão 0.000 m (min 1.720 / max 1.720); teto 0.15 = metade da hitbox de cabeça de 0,30 m (glbchars.js:296). Altura medida SEM adereço: chapéu/cabelo/mastro inflam a bbox e no caminho GLB fazem o glbchars.js:319-322 encolher o corpo — maior adereço agora: nenhum
✓ PASSA   CHR3  pés no chão na bind pose E em cada clipe (|base da bbox| ≤ 0,01 m)
                44 personagens × poses | afundando 0 [-] | flutuando 0 [-] | o sinal separa dois defeitos diferentes: y<0 é pé DENTRO do chão, y>0 é boneco no ar
✓ PASSA   CHR5  todo personagem tem geometria e material (e o acabamento é medido contra o mundo)
                personagens: mediana 4856 triângulos, 27/44 com ZERO mapa de superfície (normal+rough+ao). Mundo MEDIDO em runtime: 5 mapas, 640 materiais, 113 normalMap, 113 roughnessMap, 0 aoMap (melhor mapa: praca_old com 70). NB: o enunciado da rodada dizia "0 normalMap nos 5 mapas"; a medição em runtime desmente — o map.js:20-28 (lam) pendura normal+rough derivados do albedo, e só o praca_old passa por lá.
✗ FALHA   CHR5B personagem não fica abaixo do acabamento do melhor mapa do mundo
                27/44 personagens com 0 mapas de superfície contra 70 normalMaps no praca_old — é este o "três níveis de acabamento na mesma tela" que o dono descreveu. Fonte medida: GLB.
✓ PASSA   CHR6  nenhum par de personagens com a MESMA silhueta (IoU par a par ≤ 0,98)
                44 silhuetas distintas para 44 personagens; 0 pares acima de 0,98 | pior par ALIADO×INIMIGO: farialimer×pagodeiro 0.844
✓ PASSA   CHR4  nenhuma palma nasce ENTERRADA no corpo (mount de 3ª pessoa)
                0 personagens com a palma dentro da silhueta do corpo
✓ PASSA   MOD2  o modo escolhido é o modo jogado nos 5 mapas (5 mapas × 2 modos + badge + padrão do mapa)
                20/20 casos | 0 falhas
✓ PASSA   MAP1  nenhum spawn e nenhum chão andável com o corpo DENTRO de geometria sólida (sonda vertical do peito ao chão; teto = degrau de 0,30 m)
                pontos por mapa (medido/teto): awp_map 47/47, praca_old 8/8, fy_pool_day 474/474, fy_havan 0/0, fy_ferrovelho 4/4 | spawns dentro de sólido: 0 | pior penetração no fy_havan 0 m
✓ PASSA   MAP2  cada time nasce todo no MESMO andar, e o respawn da loja (fy_havan/B) fica no andar de cima e não é visto de fora
                fy_havan/B chão 3.4 m (mezanino = 3,4) · exposição 0.0% dos pontos a ≥ 25 m · maior visada 0 m | slots fora de nível: 0 | awp_map/B chão 0 m exp 86.2% · awp_map/P chão 0 m exp 78.0% · praca_old/P chão 1.4 m exp 81.9% · praca_old/B chão 1.4 m exp 81.7% · fy_pool_day/P chão 0 m exp 37.0% · fy_pool_day/B chão 0 m exp 36.3% · fy_havan/B chão 3.4 m exp 0.0% · fy_havan/P chão 0 m exp 58.4% · fy_ferrovelho/P chão 0 m exp 34.8% · fy_ferrovelho/B chão 0 m exp 23.3%
✓ PASSA   MAP3  escada dentro da faixa de escada real (NBR 9077/Blondel) e o grafo + o flood-fill sobem por ela
                espelho 0.17 m [0,16-0,19] · piso 0.2911 m [0,25-0,32] · 2h+p 0.631 m [0,62-0,66] · largura livre 2.35 m [≥1,20] · 31.55° [25-40] · desvio pé↔degrau 0.015 m [≤0,10] · 0 critério(s) fora | mezanino: 3438 células alcançadas a pé (≥500), 82 waypoints, A* chega true
✓ PASSA   CTF1  bandeiras distribuídas: não colineares (altura do triângulo > raio de captura), ≥ 2 raios do spawn mais próximo e nenhuma enterrada na geometria
                awp_map tri 6.28 m / spawn↔bandeira mín 36.0 m · praca_old tri 6.28 m / spawn↔bandeira mín 24.4 m · fy_pool_day tri 5.02 m / spawn↔bandeira mín 12.2 m · fy_havan tri 26.42 m / spawn↔bandeira mín 17.8 m · fy_ferrovelho tri 6.84 m / spawn↔bandeira mín 11.1 m | colineares: 0 | coladas no spawn (<9 m): 0 | sem linha de tiro: 0
✓ PASSA   MAT1  o mesmo GLB tem o MESMO material nos 3 caminhos (1ª pessoa, drop de chão, 3ª pessoa)
                26 GLB declaram metallicFactor 1 / roughnessFactor 1 COM mapa metallicRoughness (0 fora do padrão) · VM (game.js:1221) entrega metal 1 rough 1 envInt 1 · chão (game.js:602/4665) e 3ª pessoa (glbchars.js:308) não transformam (0 escrita(s) em .material) · ΔL* 1ªpessoa−chão por mapa: awp_map 5.3 · praca_old 3.1 · fy_pool_day -0.0 · fy_havan 1.8 · fy_ferrovelho 1.3 | com ?vmmat=legacy o mesmo ΔL* no awp_map seria 15.5
✓ PASSA   MAT2  orçamento de luz do viewmodel dentro da faixa do mapa que ele acompanha, e o IBL é o mesmo nas duas cenas
                awp_map mapa 3.6 / vm 4.14 = 1.15× · praca_old mapa 2.8 / vm 3.22 = 1.15× · fy_pool_day mapa 3.25 / vm 3.74 = 1.15× · fy_havan mapa 2.84 / vm 3.27 = 1.15× · fy_ferrovelho mapa 2.6 / vm 2.99 = 1.15× | dispersão entre os 5 mapas 1.38× (teto 1,60 = a que eles já têm) | fora da faixa [0,80-1,40]: 0 | cenas sem o env do mapa: 0
✓ PASSA   FOG1  nenhuma camada que cobre a tela é mais clara que o CÉU MEDIDO do mapa (fumaça de granada)
                awp_map fumaça 0.238 / céu 0.317 = 0.75× (α centro 1) · praca_old fumaça 0.238 / céu 0.317 = 0.75× (α centro 1) · fy_pool_day fumaça 0.347 / céu 0.462 = 0.75× (α centro 1) · fy_havan fumaça 0.397 / céu 0.529 = 0.75× (α centro 0.98) · fy_ferrovelho fumaça 0.402 / céu 0.536 = 0.75× (α centro 1) | acima do céu: 0 | névoa (absolvida, só satura além de ~200 m): awp_map ρ0.0066 f@100m 0.35 contraluz 0.47 · praca_old ρ0.0066 f@100m 0.35 contraluz 0.47 · fy_havan ρ0.0088 f@100m 0.54 contraluz 0.78 · fy_ferrovelho ρ0.0112 f@100m 0.71 contraluz 0.79
✓ PASSA   TEX1  nenhuma superfície visível grande e clara sem mapa de albedo (maior triângulo ≥ 6 m², luminância ≥ 0,55)
                claros sem map por mapa: awp_map 0 · praca_old 0 · fy_pool_day 0 · fy_havan 0 · fy_ferrovelho 0 | total 0 | critério: maiorTri ≥ 6 m² E luminância de albedo ≥ 0.55, só malha VISÍVEL e OPACA
·· PULADO PX1   no ADS o jogador vê a arma E a mira
                exige browser — use tools/eval/motion.mjs
·· PULADO PX2   silhuetas das 26 armas diferem (IoU par a par < 0,85)
                exige browser — use tools/eval/motion.mjs
·· PULADO PX3   mão travada no grip em todo frame de toda animação
                exige browser/traço — use tools/eval/motion.mjs
·· PULADO PX4   aliado × inimigo distinguíveis em 1 frame a 5/20/40 m
                exige browser

--------------------------------------------------------
CRÍTICAS: 31/42 passam  ← VM1, VM3, VM5, VM12, VM16, VM18, VM18b, VM19, TPM1, BOT8, CHR1 VERMELHAS
AVISOS:   BOT1, BOT2, CHR5B fora do alvo
PULADAS:  4 (exigem browser ou arnês ausente)
--------------------------------------------------------
```


## Leitura do vermelho

### VM1, VM3, VM5, VM12, VM16, VM18, VM18b, VM19 — enquadramento do viewmodel

Oito das onze críticas vermelhas são a mesma frente: o **enquadramento das armas na
tela**. É a frente mais medida do repositório e a mais difícil, porque as invariantes se
cruzam (ver [Quality gates](./quality-gates.md#lei-2--teto-sem-procedência-é-opinião)).

O que a saída diz, arma a arma:

| ID | Faixa | Medido | Fora |
|---|---|---|---|
| VM1 | borda esquerda 0,50–0,60 | 0,525–0,631 | 2/26 (`famas`, `uzi`) |
| VM3 | eixo da silhueta 22–42° | 22,1–44,5° | 1/26 (`revolver38`) |
| VM5 | área 6–16% nos 2 aspectos | 16:9 6,3–12,8% · 3:2 5,6–11,6% | 3/26 (`deagle`, `carbine`, `sks`) |
| VM12 | boca do cano 0,50–0,62 | 0,498–0,660 | 5/52 medidas (pior `famas`@3:2 0,660) |
| VM16 | fatia na borda direita 0,02–0,20 | 0–0,316 | 12 não encostam · 9 saem demais |
| VM18 | gordura 0,684–0,948 | 0,276–0,660 | **52/52 magras** |
| VM18b | arma longa cobre 8,0–13,09% | — | 15 abaixo de 8,0% · 0 acima |
| VM19 | ADS ao menos tão legível quanto o quadril | ganho −0,024 a 0,311 | 2 armas em que mirar PIORA |

A leitura honesta: **VM18 falha em 52 de 52 medidas.** Nenhuma arma do arsenal está
dentro da faixa de "gordura" medida nos frames de referência — todas são mais magras que
o CS 1.6. Isso não é uma arma quebrada; é uma decisão de enquadramento global que ainda
não bate com a referência. VM12 e VM1, por outro lado, falham em pouquíssimos casos e são
correções pontuais por arma.

Ordem sugerida de ataque: VM12 e VM1 (poucas armas, correção local) → VM5/VM18b (área) →
VM18/VM16/VM19 (o problema global de gordura/escorço, que provavelmente move os outros
todos junto). Use `node tools/eval/vm-solve.mjs` antes de tunar no olho: ele lê os tetos
do próprio `invariants.mjs` e responde se existe um ponto viável — as rodadas anteriores
tunaram uma invariante por vez e cada acerto quebrava outra.

### TPM1 — asset ausente, não bug de código

```
✗ FALHA   TPM1  sonda de mount 3ª pessoa roda sem erro e sem FAIL
                 Command failed: node tools/eval/tp-mount-probe.mjs
                 Error: ENOENT ... public/models/anims/mixamo/idle.glb
```

:::tip RESOLVIDO — não pegue esta tarefa
Na época, `public/models/anims/` não estava versionado e **TPM1 falhava em todo clone
limpo**, deixando `npm run check` e CI vermelhos por motivo que não era código. Foi
escolhida a saída de versionar: hoje `git ls-files public/models/anims | wc -l` devolve
**438**.

Ficou uma lição que vale mais que a tarefa: em 05/08 descobriu-se que **100 clipes
estavam no disco mas não no git** — 10 personagens com 1 de 11 clipes versionados. Num
clone limpo (e no deploy) isso são 100 requisições 404 e 10 personagens caindo no pack
compartilhado sem ninguém saber, porque `glbchars.js` engolia a falha num `catch` vazio.
Quem achou foi uma cláusula de régua nova, não um humano olhando. *"Está no meu disco"* e
*"está no repositório"* são afirmações diferentes, e só a segunda chega no usuário.
:::

### BOT8 — bot com linha de visão e sem atirar

```
✗ FALHA   BOT8  2.7 episódios | maior silêncio 3.03 s | 494 s em condição
```

Teto: zero episódios de bot com LOS no jogador por mais de 1,5 s sem disparar. Em 03/08:
2,7 episódios, silêncio máximo 3,03 s em 494 s de condição. É o defeito "o bot me viu e
ficou parado" — visível em jogo e mensurável.

**Ela PIOROU desde então: 4 episódios, silêncio máximo 4,23 s.** E a causa raiz já está
achada (BUG-03): `game.js:5361` avalia
`const hasTurn = !(BOT_FAIR && e.isPlayer) || this._duelToken(b)` **todo frame, para todo
bot cujo alvo é o jogador**, antes de qualquer gate de "pode atirar" — e `_duelToken` não
consulta, ele **reserva** o token por `BOT_TOKEN_HOLD`. Um bot em atraso de reação,
recarregando ou sem linha de tiro rouba um dos 2 tokens e o segura; os outros recebem
`hasTurn === false` e atravessam o campo de visão sem disparar. A correção é mover a
chamada para dentro do `if`. É a dívida mais barata de fechar do repositório inteiro.

### CHR1 — proporção humana

```
✗ FALHA   CHR1  44/44 medidos no GLB | mediana: cabeca/H 0.223 (ref 0.13) ...
                pior índice de balão: bombado 6.52x
                teto absoluto = FALLBACK PUBLICADO (Drillis & Contini 1966 / Winter fig.4.1)
```

Três medianas fora: `cabecaSobreAltura` 0,223 contra 0,13; `cinturaSobreOmbro` 1,305
contra 0,74; `larguraTorsoSobreAltura` 0,889 contra 0,174. É o "os funkeiros tão ainda
balão" traduzido para número.

**Leia a ressalva que a própria invariante imprime**: o teto absoluto é *fallback
publicado*, não foto medida — as pastas `references/funkeiros/` e `references/palhacos/`
não existem nesta árvore (`tools/eval/char-probe.mjs:28-42`). O estilo do jogo é
cartunesco de propósito, então parte desse desvio pode ser intenção. **Se for**, a
resposta certa é mudar o teto explicitamente, com justificativa — não ignorar a
invariante. É a Lei 1 aplicada ao contrário.

### Avisos (não bloqueiam)

| ID | Teto | Medido em 03/08 | Hoje |
|---|---|---|---|
| BOT1 | latFlips ≤ 12/min | 12,3/min | segue no aviso |
| BOT2 | spin ≤ 0,25 volta/min | 0,25/min | segue no aviso |
| CHR5B | personagem não abaixo do acabamento do melhor mapa | 27/44 personagens com 0 mapa de superfície | **VERDE — 0 de 44** |

BOT1 e BOT2 estão **na borda exata do teto**. Isso é informação, não ruído: qualquer
mudança no `_updateBot` vai empurrar os dois para um lado ou para o outro, e vale medir
antes e depois.

**CHR5B foi resolvida em 04/08 e não é mais tarefa.** Ela era o "três níveis de acabamento
na mesma tela" que o dono descreveu — 27 dos 44 personagens sem **nenhum** mapa de
superfície (normal + roughness + AO) — e hoje são 0 de 44. A referência do texto original
("70 normalMaps no `praca_old`") aponta para um mapa que não existe mais.

## O que está verde, e que vale defender

31 críticas passam. Vale nomear as que custaram mais caro:

- **AUD1** — a régua bate com o jogo, incluindo a pose de ADS: *"pior Δ(grip,boca) 0.001 m
  · pior Δescala 0.0004 · lente do JSON casa (V0=42°, VM_OFF=[0.03,-0.1,0]) · termo
  vertical do argumento Y casa (vmOffY(16:9)=-0.1 = VM_OFF[1])"*. É a invariante META que
  fecha os buracos de mutação descritos em [Quality gates](./quality-gates.md#teste-de-mutação-da-própria-régua).
- **VM14** — 246 pickups em 5 mapas, **0** sem alcance, **0** abaixo do piso, **0**
  flutuando, com flood-fill de conectividade real (215.758 células no `awp_map`).
- **MAP1/MAP2/MAP3** — nenhum corpo dentro de sólido; respawn da loja no mezanino a 3,4 m
  com **0,0%** de exposição a ≥ 25 m; escada dentro da NBR 9077 (espelho 0,17 m, piso
  0,2911 m, 2h+p 0,631 m, 31,55°) e o A* sobe por ela.
- **MAT1** — o mesmo GLB com o mesmo material nos 3 caminhos: ΔL\* 1ª pessoa − chão de
  −0,0 a 5,3 por mapa. Com o modo legado (`?vmmat=legacy`) o mesmo ΔL\* no `awp_map` seria
  **15,5**. Esse é o "na mão fica branca/cromada" resolvido e travado.
- **CHR6** — 44 silhuetas distintas para 44 personagens, 0 pares acima de IoU 0,98.
- **FOG1 / TEX1** — nenhuma camada de fumaça mais clara que o céu medido (0,75× em todos
  os 5 mapas), e nenhuma superfície grande e clara sem albedo.

## As 4 puladas

```
·· PULADO PX1   no ADS o jogador vê a arma E a mira        — exige browser
·· PULADO PX2   silhuetas das 26 armas diferem (IoU < 0,85) — exige browser
·· PULADO PX3   mão travada no grip em todo frame          — exige browser/traço
·· PULADO PX4   aliado × inimigo distinguíveis a 5/20/40 m — exige browser
```

Pulada é **portão verde por ausência de dado**, e por isso cada uma diz o motivo. As
quatro dependem de pixel real, sob SwiftShader, ao custo de minutos por carga de mapa.

:::warning A mensagem das PX aponta pra um arquivo que não existe
As quatro mandam "use `tools/eval/motion.mjs`" — e `ls tools/eval/motion.mjs` devolve
erro. Ou o arnês foi renomeado e a mensagem ficou para trás, ou ele nunca existiu. De
qualquer forma: **quatro invariantes puladas apontando para um arquivo inexistente é o
mesmo modo de falha que o portão inteiro existe para impedir.** Escrever esse arnês (ou
corrigir a mensagem para o script certo) é contribuição de alto valor — ver
[Como colaborar](./colaborar.md).
:::

## Dívidas declaradas

Nenhuma destas é surpresa: todas estão escritas no repo, e estão aqui reunidas.

| Dívida | Onde está declarada | Impacto |
|---|---|---|
| `_updateBot()` com **800** linhas | `tools/eval/ARCH.md` (gerado) marca como candidato a extração | PR irrevisável, merge conflitante |
| `tools/eval/ARCH.md` desatualizado | `npm run arch:check` sai **vermelho** hoje — e por um motivo pequeno: o bloco gerado carrega o número de versão do jogo, que subiu para `2.0.0-alpha.12`. Um `npm run arch` resolve | o cheque está com `continue-on-error: true` no CI, então ele **não bloqueia** |
| ~~`npm run arch` / `arch:check` não existem~~ **RESOLVIDA** | os dois estão no `package.json` | — |
| ~~`public/models/anims/` não versionado~~ **RESOLVIDA** | `git ls-files public/models/anims` → 438 | — |
| Conteúdo é código, não dado | `ROADMAP.md`, Fase 2 | cada mapa/arma novo é PR de código arriscado |
| Placar forjável | `ROADMAP.md`, Fase 3 + `RELATORIO-ANALISE.md` §2 | ranking global não é confiável sem HMAC — e é uma das razões de ele estar **desligado** hoje |
| ~~README manda o dev pro lugar errado~~ **RESOLVIDA** | `README.md` da raiz, revisado em 05/08 | — |
| `setTimeout` não limpos no `dispose()` | `RELATORIO-ANALISE.md:134` — **os `game.js:NNN` de lá estão velhos**, o arquivo andou ~1.000 linhas; use `grep -n setTimeout` | vazamento entre partidas |
| Referências de personagem ausentes | `tools/eval/char-probe.mjs:28-42` | o teto do CHR1 é fallback publicado, não medição |

## Roadmap

O documento canônico é `ROADMAP.md` na raiz. O resumo, com o que já está medido aqui:

**Fase 1 — Gráficos e jogabilidade (nível CS 1.3).** Boa parte já foi entregue e está
travada por invariante: material consistente (MAT1/MAT2), fog (FOG1), textura (TEX1),
pickups alcançáveis (VM14), geometria de mapa (MAP1–MAP3). O que resta é o enquadramento
do viewmodel (as 8 VM vermelhas) e o acabamento dos personagens (CHR1, CHR5B).

**Fase 2 — Extensibilidade.** Mapas/armas/personagens como JSON, loader único, waypoints
validados por teste. É a fase que transforma *"cada contribuição é um PR de código
hand-coded arriscado"* em *"abre um JSON e cria conteúdo"*. É onde o projeto mais precisa
de gente, e é o pré-requisito do cliente Godot.

**Fase 3 — Infra e viralidade.** Multiplayer, anti-cheat com HMAC, card de resultado
compartilhável, desafio por link.

:::warning O plano de multiplayer escrito no repo foi CONTRADITO por decisão posterior
`plans/03` defende **servidor autoritativo** — é literalmente o título da §1 dele: *"Por
que servidor autoritativo e não P2P"*. A decisão do dono em 04/08 é o contrário:
**WebRTC, com o servidor criado pelo próprio usuário**, público (entra numa lista) ou por
código (só convidado). Não dá para "seguir o plano 03 com prioridade alta" — ele precisa
ser reescrito antes de virar tarefa.

Não existe netcode nenhum no repositório hoje
(`grep -rl "WebSocket\|geckos\|socket.io" public/js/ src/` devolve vazio) e o modelo é
client-authoritative, com o anti-cheat vivendo no RPC `submit_match`. Três decisões vêm
antes de qualquer código: topologia (malha P2P × um par fazendo de host), quem faz o
*signaling* e hospeda a lista de servidores públicos (é serviço com custo e com
moderação), e o que acontece com o ranking — partida P2P **não pode** submeter no
`submit_match` sem repensar o anti-cheat.
:::

**Fase 4 — Analytics e `/mapa`.** Barato e paralelizável. A parte de medição já começou:
a telemetria anônima que substituiu o ranking (`POST /api/telemetry`, migration `012`)
agrega tempo de jogo e mapa por dia, e cobre também quem **não digita nick** — que era
invisível para o banco.

Princípios que não mudam, do `ROADMAP.md:12-16`: fricção zero é o superpoder (o jogo abre
num link, ~1,5 MB); web é o cliente canônico; conteúdo é dado, não código; sátira 100%
ficcional; **a barreira de contribuição é baixa de propósito**.

## Como manter esta página honesta

Ela envelhece. Quando for atualizá-la:

1. Rode `node tools/eval/invariants.mjs` de verdade e **cole a saída inteira**, não um
   resumo.
2. Anote o commit e a data.
3. Se algo mudou de vermelho para verde, diga qual PR fez.
4. Não edite números à mão. Nunca.
