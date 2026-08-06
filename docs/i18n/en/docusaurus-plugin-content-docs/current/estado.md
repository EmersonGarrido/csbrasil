---
id: estado
title: 'Measured state: what is green and what is red'
sidebar_label: Measured state
sidebar_position: 8
description: What is green and what is red TODAY, with real gate output, and the project's declared debts.
---
{/* traduzido de docs/docs/estado.md em 06/08/2026 — números refletem essa data; sync automático: issue #54 */}

# Measured state: what is green and what is red

This page has **real** gate output, pasted from an actual run. If it diverges from what
you see on your machine, your machine is right and this page is stale — run it and
report.

## How to reproduce {#como-reproduzir}

```bash
node tools/eval/invariants.mjs
```

On the machine where this was run (2 CPUs, with five other evaluation processes
competing), the run took about **10 minutes**. It boots the real game five times
(once per map), runs 60 s of bot simulation per map and audits 26 GLBs.

:::danger READ THIS BEFORE THE PASTED OUTPUT: it is from 2026-08-03 and the game has moved a lot
The output further down remains word for word as it came out of a real run — rewriting
gate numbers by hand is exactly what this page exists to prevent. But what it
photographed **is not today's game**, and reading that block as if it were sends the
contributor off to fix what has already been fixed.

What changed, item by item:

| What the 03/08 output says | State on 2026-08-05 | How to check |
|---|---|---|
| maps: `awp_map`, **`praca_old`**, `fy_pool_day`, `fy_havan`, `fy_ferrovelho` | **`praca_old` is OUT** and **`fy_quebrada` is IN**. Still 5 — which is why no count caught it | `MAPS` in `public/js/maps.js:8-36` |
| CTF measured on 5 maps | **3 maps open in capture** (`fy_havan`, `fy_ferrovelho`, `fy_quebrada`); the other 2 open in rounds | `ctfMode` in the same object |
| `CRÍTICAS: 31/42` | **36/49** — the count grew because new invariants came in | `KNOWN-BUGS.md`, header |
| `CHR5B` as a WARNING (27/44 characters without surface maps) | **GREEN**: 0 of 44 | `KNOWN-BUGS.md` |
| `TEX1` green | **RED**, due to 10 surfaces of `fy_quebrada`, which is a map under construction | `KNOWN-BUGS.md` |
| `public/models/anims/` not versioned → TPM1 red on a clean clone | **versioned**: 438 files | `git ls-files public/models/anims \| wc -l` |
| `npm run arch` / `arch:check` do not exist | they **exist** in `package.json` | `npm run arch:check` |
| README sends the dev to the wrong place | **fixed** | root `README.md` |
| `version.js` = `3.3.0` | `2.0.0-alpha.12` | `public/js/version.js:5` |

And two **game-rule** changes that the output has no way of showing, because they are not
gate invariants:

- **Health regeneration OFF** (`game.js:303`). `?regen=1` turns it back on.
- **Ranking OFF** (`RANKING_ON = false`, `src/lib/site.ts:68`), replaced by
  anonymous telemetry. `/ranking` and `/u/*` respond 200 with a notice and `noindex`.

The current state, with the root cause and the `arquivo:linha` of each red one, lives in
[`KNOWN-BUGS.md`](https://github.com/rubenmarcus/csbrasil/blob/main/KNOWN-BUGS.md) — that
is the file maintained day by day, not this page.
:::

:::caution Wherever `praca_old` appears below, read "a map that no longer exists"
The Praça (classic) left the registry at the owner's literal request (*"vamos apagar praça
clássica"*) and `public/js/map.js` was deleted along with it — it was an earlier
procedural version of the same square that `awp_map` already delivers in faithful
Brasília form. Measured side effect: the `pickup-check` dropped from 246 to 244 pickups
(it had 2 weapons on the ground). The map that took its place, and which **appears in no
line of the 03/08 output**, is `fy_quebrada` — a straight street with a baile funk
roundabout at one end and a dirt football pitch at the other, 4-flag CTF.
:::

## Scoreboard of the last PASTED run (2026-08-03) {#placar-da-última-execução-colada-2026-08-03}

This is not today's scoreboard — it is the last one that exists pasted in full. Run from
`2026-08-03`, commit `e332c87`, `public/js/version.js` = `3.3.0`:

```
CRÍTICAS: 31/42 passam  ← VM1, VM3, VM5, VM12, VM16, VM18, VM18b, VM19, TPM1, BOT8, CHR1 VERMELHAS
AVISOS:   BOT1, BOT2, CHR5B fora do alvo
PULADAS:  4 (exigem browser ou arnês ausente)
```

Exit code: **1**. The gate is **red**, and as a consequence so is CI —
`.github/workflows/ci.yml:31-32` runs exactly this command and has no `continue-on-error`.

:::warning This is the real state, not a showcase
The owner asked for this doc to carry real output. It is here in full, including what
fails. A project that only shows the green cannot receive help on the red.
:::

## The full output, uncut {#a-saída-completa-sem-cortes}

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



## Reading the red {#leitura-do-vermelho}

### VM1, VM3, VM5, VM12, VM16, VM18, VM18b, VM19 — viewmodel framing {#vm1-vm3-vm5-vm12-vm16-vm18-vm18b-vm19--enquadramento-do-viewmodel}

Eight of the eleven red criticals are the same front: the **framing of the weapons on
screen**. It is the most measured front in the repository and the hardest, because the
invariants intersect (see [The gate](./quality-gates.md#lei-2--teto-sem-procedência-é-opinião)).

What the output says, weapon by weapon:

| ID | Band | Measured | Out |
|---|---|---|---|
| VM1 | left edge 0,50–0,60 | 0,525–0,631 | 2/26 (`famas`, `uzi`) |
| VM3 | silhouette axis 22–42° | 22,1–44,5° | 1/26 (`revolver38`) |
| VM5 | area 6–16% in both aspects | 16:9 6,3–12,8% · 3:2 5,6–11,6% | 3/26 (`deagle`, `carbine`, `sks`) |
| VM12 | muzzle 0,50–0,62 | 0,498–0,660 | 5/52 measurements (worst `famas`@3:2 0,660) |
| VM16 | slice at the right edge 0,02–0,20 | 0–0,316 | 12 do not touch it · 9 stick out too far |
| VM18 | fatness 0,684–0,948 | 0,276–0,660 | **52/52 thin** |
| VM18b | long weapon covers 8,0–13,09% | — | 15 below 8,0% · 0 above |
| VM19 | ADS at least as legible as the hip | gain −0,024 to 0,311 | 2 weapons where aiming makes it WORSE |

The honest reading: **VM18 fails in 52 of 52 measurements.** No weapon in the arsenal is
within the "fatness" band measured on the reference frames — all of them are thinner than
CS 1.6. That is not one broken weapon; it is a global framing decision that does not yet
match the reference. VM12 and VM1, on the other hand, fail in very few cases and are
per-weapon point fixes.

Suggested order of attack: VM12 and VM1 (few weapons, local fix) → VM5/VM18b (area) →
VM18/VM16/VM19 (the global fatness/foreshortening problem, which probably moves all the
others along with it). Use `node tools/eval/vm-solve.mjs` before tuning by eye: it reads
the ceilings from `invariants.mjs` itself and answers whether a feasible point exists —
previous rounds tuned one invariant at a time and every fix broke another one.

### TPM1 — missing asset, not a code bug (RESOLVED) {#tpm1--asset-ausente-não-bug-de-código-resolvida}

```
✗ FALHA   TPM1  sonda de mount 3ª pessoa roda sem erro e sem FAIL
                 Command failed: node tools/eval/tp-mount-probe.mjs
                 Error: ENOENT ... public/models/anims/mixamo/idle.glb
```

:::tip RESOLVED — do not pick up this task
At the time, `public/models/anims/` was not versioned and **TPM1 failed on every clean
clone**, leaving `npm run check` and CI red for a reason that was not code. The chosen
way out was to version it: today `git ls-files public/models/anims | wc -l` returns
**438**.

A lesson remained that is worth more than the task: on 05/08 it was discovered that **100
clips were on disk but not in git** — 10 characters with 1 of 11 clips versioned. On a
clean clone (and in the deploy) that means 100 404 requests and 10 characters falling
back to the shared pack without anyone knowing, because `glbchars.js` swallowed the
failure in an empty `catch`. What found it was a new ruler (quality gate) clause, not a
human looking. *"It is on my disk"* and *"it is in the repository"* are different claims,
and only the second one reaches the user.
:::

### BOT8 — bot with line of sight and not shooting {#bot8--bot-com-linha-de-visão-e-sem-atirar}

```
✗ FALHA   BOT8  2.7 episódios | maior silêncio 3.03 s | 494 s em condição
```

Ceiling: zero episodes of a bot with LOS on the player for more than 1,5 s without
firing. On 03/08: 2,7 episodes, maximum silence of 3,03 s over 494 s in condition. It is
the "the bot saw me and just stood there" defect — visible in game and measurable.

**It has gotten WORSE since then: 4 episodes, maximum silence 4,23 s.** And the root
cause has already been found (BUG-03): `game.js:5361` evaluates
`const hasTurn = !(BOT_FAIR && e.isPlayer) || this._duelToken(b)` **every frame, for
every bot whose target is the player**, before any "may shoot" gate — and `_duelToken`
does not consult, it **reserves** the token for `BOT_TOKEN_HOLD`. A bot in reaction
delay, reloading or without a firing line steals one of the 2 tokens and holds on to it;
the others get `hasTurn === false` and cross the field of view without firing. The fix is
to move the call inside the `if`. It is the cheapest debt to close in the entire
repository.

### CHR1 — human proportions {#chr1--proporção-humana}

```
✗ FALHA   CHR1  44/44 medidos no GLB | mediana: cabeca/H 0.223 (ref 0.13) ...
                pior índice de balão: bombado 6.52x
                teto absoluto = FALLBACK PUBLICADO (Drillis & Contini 1966 / Winter fig.4.1)
```

Three medians out: `cabecaSobreAltura` 0,223 against 0,13; `cinturaSobreOmbro` 1,305
against 0,74; `larguraTorsoSobreAltura` 0,889 against 0,174. It is "the funkeiros are
still balloons" translated into numbers.

**Read the caveat that the invariant itself prints**: the absolute ceiling is a
*published fallback*, not measured photos — the `references/funkeiros/` and
`references/palhacos/` folders do not exist in this tree (`tools/eval/char-probe.mjs:28-42`).
The game's style is cartoonish on purpose, so part of that deviation may be intentional.
**If it is**, the right answer is to change the ceiling explicitly, with a justification —
not to ignore the invariant. It is Law 1 applied in reverse.

### Warnings (they do not block) {#avisos-não-bloqueiam}

| ID | Ceiling | Measured on 03/08 | Today |
|---|---|---|---|
| BOT1 | latFlips ≤ 12/min | 12,3/min | still in warning |
| BOT2 | spin ≤ 0,25 turn/min | 0,25/min | still in warning |
| CHR5B | character not below the finish of the best map | 27/44 characters with 0 surface maps | **GREEN — 0 of 44** |

BOT1 and BOT2 are **right on the exact edge of the ceiling**. That is information, not
noise: any change to `_updateBot` will push both of them to one side or the other, and it
is worth measuring before and after.

**CHR5B was resolved on 04/08 and is no longer a task.** It was the "three levels of
finish on the same screen" that the owner described — 27 of the 44 characters with **no**
surface map at all (normal + roughness + AO) — and today it is 0 of 44. The original
text's reference ("70 normalMaps in `praca_old`") points to a map that no longer exists.

## What is green, and worth defending {#o-que-está-verde-e-que-vale-defender}

31 criticals passed on 03/08 (36 today). It is worth naming the ones that cost the most —
all remain green, except where indicated:

- **AUD1** — the ruler matches the game, including the ADS pose: *"pior Δ(grip,boca) 0.001 m
  · pior Δescala 0.0004 · lente do JSON casa (V0=42°, VM_OFF=[0.03,-0.1,0]) · termo
  vertical do argumento Y casa (vmOffY(16:9)=-0.1 = VM_OFF[1])"*. It is the META invariant
  that closes the mutation holes described in [The gate](./quality-gates.md#teste-de-mutação-da-própria-régua).
- **VM14** — 246 pickups across 5 maps, **0** unreachable, **0** below the floor, **0**
  floating, with a real connectivity flood-fill (215.758 cells in the `awp_map`). *There
  are **244** since `praca_old` left, which had 2 weapons on the ground — and that is the
  only ground-weapon reduction of the round, coming from a deleted map, not a live one.
  The owner's veto still stands: **do not reduce the number of weapons on the ground**,
  because today it is the only way the player can choose a weapon.*
- **MAP1/MAP2/MAP3** — no body inside solid geometry; the store respawn on the mezzanine
  at 3,4 m with **0,0%** exposure at ≥ 25 m; stairs within NBR 9077 (riser 0,17 m, tread
  0,2911 m, 2h+p 0,631 m, 31,55°) and the A* climbs them.
- **MAT1** — the same GLB with the same material on the 3 paths: ΔL\* 1st person − ground
  from −0,0 to 5,3 per map. With the legacy mode (`?vmmat=legacy`) the same ΔL\* on the
  `awp_map` would be **15,5**. That is the "in the hand it turns white/chromed" issue
  solved and locked down.
- **CHR6** — 44 distinct silhouettes for 44 characters, 0 pairs above IoU 0,98.
- **FOG1** — no smoke layer brighter than the measured sky (0,75× on all 5 maps). Still
  green.
- **TEX1** — no large, bright surface without albedo. **Today it is RED**, due to 10
  surfaces of `fy_quebrada` — the map that came in after this measurement and is still
  under construction. It is a new-map regression, not a character one.

## The 4 skipped {#as-4-puladas}

```
·· PULADO PX1   no ADS o jogador vê a arma E a mira        — exige browser
·· PULADO PX2   silhuetas das 26 armas diferem (IoU < 0,85) — exige browser
·· PULADO PX3   mão travada no grip em todo frame          — exige browser/traço
·· PULADO PX4   aliado × inimigo distinguíveis a 5/20/40 m — exige browser
```

A skip is a **gate green by absence of data**, and that is why each one states its
reason. All four depend on real pixels, under SwiftShader, at a cost of minutes per map
load.

:::warning The PX message points to a file that does not exist
All four say "use `tools/eval/motion.mjs`" — and `ls tools/eval/motion.mjs` returns an
error. Either the harness was renamed and the message was left behind, or it never
existed. Either way: **four skipped invariants pointing to a nonexistent file is the very
failure mode the entire gate exists to prevent.** Writing that harness (or fixing the
message to point to the right script) is a high-value contribution — see
[How to contribute](./colaborar.md).
:::

## Declared debts {#dívidas-declaradas}

None of these is a surprise: all of them are written down in the repo, and they are
gathered here.

| Debt | Where it is declared | Impact |
|---|---|---|
| `_updateBot()` with **800** lines | `tools/eval/ARCH.md` (generated) marks it as an extraction candidate | unreviewable PR, conflict-prone merges |
| `tools/eval/ARCH.md` out of date | `npm run arch:check` exits **red** today — and for a small reason: the generated block carries the game's version number, which went up to `2.0.0-alpha.12`. An `npm run arch` fixes it | the check has `continue-on-error: true` in CI, so it **does not block** |
| ~~`npm run arch` / `arch:check` do not exist~~ **RESOLVED** | both are in `package.json` | — |
| ~~`public/models/anims/` not versioned~~ **RESOLVED** | `git ls-files public/models/anims` → 438 | — |
| Content is code, not data | the "content as data" direction in `docs/ROADMAP.md` | every new map/weapon is a risky code PR |
| Forgeable scoreboard | `docs/historico/RELATORIO-ANALISE.md` §2 | the global ranking is not trustworthy without HMAC — and that is one of the reasons it is **off** today |
| ~~README sends the dev to the wrong place~~ **RESOLVED** | root `README.md`, revised on 05/08 | — |
| `setTimeout`s not cleared in `dispose()` | `RELATORIO-ANALISE.md:134` — **the `game.js:NNN` references there are stale**, the file has shifted ~1.000 lines; use `grep -n setTimeout` | leak between matches |
| Missing character references | `tools/eval/char-probe.mjs:28-42` | CHR1's ceiling is a published fallback, not a measurement |

## Where the project is going {#para-onde-o-projeto-vai}

**Not on this page, on purpose.** State and direction age at different rates: the gate
scoreboard changes with every round, the direction changes with every owner decision.
Keeping them in the same file guarantees that one of the two is stale.

| You want | Go to |
|---|---|
| the direction, the v2 scope and what was replaced | [`docs/ROADMAP.md`](https://github.com/rubenmarcus/csbrasil/blob/main/docs/ROADMAP.md) |
| the executable plan, step by step, with the cut defended | [`plans/08-RELEASE-PROFISSIONAL.md`](https://github.com/rubenmarcus/csbrasil/blob/main/plans/08-RELEASE-PROFISSIONAL.md) |
| the state of the defects, with root cause | [`KNOWN-BUGS.md`](https://github.com/rubenmarcus/csbrasil/blob/main/KNOWN-BUGS.md) |

What **this** page adds to the roadmap is the link between the two: a good part of what
the plan calls "consistency" is already locked down by invariant (MAT1/MAT2, FOG1, TEX1,
VM14, MAP1–MAP3), and what remains red is the viewmodel framing and the characters'
finish — with name, number and measured band, all above.

:::warning The multiplayer plan written in the repo was CONTRADICTED by a later decision
`plans/03` argues for an **authoritative server** — it is literally the title of its §1.
The owner's decision is the opposite: **WebRTC, with the server created by the user
themselves**. That plan needs to be **rewritten** before it becomes a task, not followed
in parallel.

And there is no netcode at all in the repository today (`grep -rl "RTCPeerConnection\|WebSocket"
public/js/ src/` returns empty): the model is client-authoritative, with the anti-cheat
living in the `submit_match` RPC. **A P2P match cannot submit to `submit_match`** without
rethinking the anti-cheat — it is the central contradiction of `plans/08 §2`.
:::

## How to keep this page honest {#como-manter-esta-página-honesta}

It ages. When you go to update it:

1. Actually run `node tools/eval/invariants.mjs` and **paste the entire output**, not a
   summary.
2. Note the commit and the date.
3. If something changed from red to green, say which PR did it.
4. Do not edit numbers by hand. Ever.
