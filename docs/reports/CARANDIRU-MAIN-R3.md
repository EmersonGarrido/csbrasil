# Carandiru — reconstrução limpa sobre `main`

## Objetivo e escolha

- Worktree: `/Volumes/Zenith/Projects/game/corosolto/csbrasil/worktrees/carandiru-main-r3`.
- Branch: `codex/carandiru-main-r3`.
- Base: `origin/main@dffcf1f5815342e1ae26e5d79beeaf54b833a2df` (`v2.0.0-alpha.255`).
- Mapa: id técnico `penitenciaria`, identidade pretendida **Carandiru**.
- Prioridade: o inventário do PR #538 mede a pior densidade visual e custo de cena do grupo legado; o teste humano mais recente relatou escadas da muralha e guaritas inacessíveis e janelas suspensas no pavilhão. Obras, Parque, Atacadão, Posto, Piscina, Quebrada, Ferro Velho, Loja H e Córrego já têm candidatos atuais em draft; a UPA pertence a outra lane.
- Origem a preservar: builder original do Emerson Garrido e reautoria estrutural válida do PR #556. A nova lane extrai somente geometria, navegação, identidade procedural e gates que funcionem sobre a `main` atual.

## Restrições

- Somente `public/js/map_penitenciaria.js`, gates específicos e este dossiê.
- Sem runtime, materiais compartilhados, registro global de mapas, áudio compartilhado, Mint/Astra, assets privados, merge, deploy ou force-push.
- O asset Mint do PR #556 não entra: a própria descrição registra termos comerciais ainda pendentes. O mapa deve funcionar e manter identidade com geometria procedural e assets locais já licenciados.
- Aprovação visual humana não será presumida.

## Baseline na `main`

Comandos: `npm run eval:penitenciaria`, `node tools/eval/map-check.mjs penitenciaria`, `node tools/eval/botsim.mjs 20 penitenciaria` e `node tools/eval/ctf-win-check.mjs penitenciaria`.

- A régua antiga PEN1–PEN5 fica verde, mas não mede os defeitos relatados.
- MAP1 encontra 14 corpos dentro de sólido, com pior penetração de 1,02 m.
- Exposição de spawn: E 79,3% e B 76,1%; visadas máximas de 97,4 m e 98,5 m.
- MAP5: pior espaçamento sem cobertura de 20,60 m, acima do teto de 7 m; pior razão de props 0,12× da mediana.
- CTF1: três pontos colineares, altura do triângulo 0 m.
- CTF2 encontra quatro rotas no grafo térreo, mas isso não demonstra acesso à muralha, às guaritas ou ao pavimento superior.
- Botsim de 20 s: `stuckPct=3,311`, `eff=0,887`, `laneSpread=0,64`.
- O CTF encerra corretamente na terceira e última bandeira.

## Definição de pronto

- Quatro acessos reais do piso à muralha, quatro passarelas, quatro guaritas de canto e duas torres centrais alcançáveis em ida e volta.
- Pavilhão central oco no térreo, pavimento superior alcançável e janelas com parede, peitoril, verga, piso e posição de tiro.
- Três decisões de rota por spawn ligadas ao MID, cobertura contra linhas longas e CTF não colinear.
- Identidade de instituição prisional paulista dos anos 1990 por composição procedural local, sem pessoa real, gore ou marca.
- 5×5 e 8×8, DM e CTF, bots, mutantes causais, performance e matriz Chrome/WebGL2 em 3:2 e 16:9.
- Capturas inspecionadas por esta lane e crítica adversarial independente antes da promoção do draft.

## Entrega map-local

- A composição agora identifica fisicamente a **Casa de Detenção / Carandiru** e o **Pavilhão 6**, com pátio, alas, reboco gasto, tijolo aparente, grades, arame, marcações de quadra e uma viatura procedural. Nenhuma malha externa foi adicionada.
- Quatro escadas contínuas ligam o piso às passarelas da muralha. As quatro guaritas de canto e duas torres centrais têm entradas e rotas registradas.
- O Pavilhão 6 é oco: possui passagens norte–sul e leste–oeste, escada interna, galeria superior e 12 janelas inseridas em paredes reais, com piso, peitoril e posição de tiro.
- As rotas `radial-interna`, `externa-oeste` e `muralha-leste` ligam cada spawn ao MID. O MID do CTF foi deslocado para formar triângulo com altura de 8 m.
- Sessenta e quatro coberturas baixas instanciadas fecham os vazios próximos aos spawns sem bloquear as três rotas. A pior lacuna do MAP5 caiu de 20,60 m para 6,64 m e a razão de props subiu de 0,12× para 0,54×.
- A ambiência cria 11 animais com os tipos já pré-carregados para o mapa, três loops já existentes (`vento`, `hum`, `cidade`) e fachos móveis nas torres.

## Régua causal

`node tools/eval/carandiru-main-r3-check.mjs` mede a cena e os colliders reais:

- CR3-1: identidade, procedência e ausência de asset privado/Mint.
- CR3-2: quatro acessos, quatro passarelas e seis entradas/rotas de guarita.
- CR3-3: duas passagens, escada/galeria e 12 janelas sustentadas no Pavilhão 6.
- CR3-4: três famílias de rota e CTF não colinear.
- CR3-5: cobertura entre spawn e centro e contrafogo às posições elevadas.
- CR3-6: fauna e loops de ambiência.

O self-test exige a cláusula exata para oito mutantes de mundo: `fecha-escada`, `fecha-guarita`, `pavilhao-solido`, `janela-suspensa`, `rota-unica`, `ctf-colinear`, `spawn-exposto` e `sem-ambiencia`. Resultado: **8/8 contraprovas rejeitadas**; não há autoatestação por regex.

## Validação técnica

Comandos executados sobre a base `alpha.255`:

```text
npm run syntax                                                    PASS
npm run build                                                     PASS
npm run eval:penitenciaria                                       PASS
node tools/eval/carandiru-main-r3-check.mjs                       PASS (CR3-1..6)
node tools/eval/carandiru-main-r3-check.mjs --selftest-mutantes   PASS (8/8)
node tools/eval/carandiru-browser-matrix.mjs --self-test          PASS
node tools/eval/ctf-win-check.mjs penitenciaria                   PASS (3ª bandeira encerra)
```

O `map-check` confirma MAP2B (2,85 m / 69,6 m²), MAP4 (zero oclusores invisíveis), MAP5 (6,64 m / 0,54×), CTF1 (8 m) e CTF2 (quatro rotas entre todos os pares). A leitura genérica MAP1 ainda acusa 40 interseções não submersas, pior profundidade 1,133 m; parte vem de superfícies baixas transitáveis/escadas porque a régua empilha `groundHeightAt` sem `yRef`. A exposição genérica ficou E 62,2% e B 55,2%, melhor que o baseline, mas ainda alta. Esses dois pontos permanecem dívida declarada, sem mascarar a saída.

Botsim de 20 s: `stuckPct=2,989`, melhor que 3,311 do baseline; `laneSpread=0,64` foi preservado; `eff=0,833` ficou abaixo do baseline 0,887.

## Chrome/WebGL e A/B

A matriz real entra pelo menu e cobre `3:2/16:9 × 5x5/8x8 × DM/CTF`. As oito células usaram WebGL2 por hardware, qualidade média, 9/15 bots reais, zero frame acima de 100 ms e zero dívida inesperada. A allowlist é explícita para os 404s locais de áudio/geo e CORS do backend; o self-test prova falha para `pageerror`, console, HTTP, request failure e teto de performance desconhecidos.

| Caso | p95 ms | calls | tris |
| --- | ---: | ---: | ---: |
| 3:2 5x5 DM | 9,7 | 941 | 1.117.883 |
| 3:2 5x5 CTF | 9,7 | 949 | 1.119.557 |
| 3:2 8x8 DM | 9,9 | 1.067 | 1.262.271 |
| 3:2 8x8 CTF | 9,9 | 1.039 | 1.263.817 |
| 16:9 5x5 DM | 9,9 | 949 | 1.118.011 |
| 16:9 5x5 CTF | 9,8 | 959 | 1.129.423 |
| 16:9 8x8 DM | 9,7 | 1.093 | 1.262.397 |
| 16:9 8x8 CTF | 9,8 | 1.009 | 1.265.593 |

O A/B fresco em DM compara o candidato com `origin/main@dffcf1f581`: as draw calls caíram entre 27% e 33%; triângulos cresceram entre 21% e 25%; o p95 permaneceu em 9,7–9,9 ms contra 9,9–10,2 ms. Hash do mapa no candidato: `7f68f2ae5d675a7feb8b3c4902521a25e832a4aef18e4bf98e511576ea632cfd`; baseline: `0c7759794db25f0a639ac5bd604e96ed11152029a76718fabe2fa3eb8ea2acaf`.

Recibos ignorados pelo Git ficam em:

- `artifacts/carandiru-main-r3/webgl-matrix/matrix.json` — matriz final 8/8.
- `artifacts/carandiru-main-r3/baseline-main/matrix.json` — A/B da `main`.
- `artifacts/carandiru-main-r3/evidence/captures.json` — manifesto das 14 capturas e hashes.

## Revisão visual

Foram inspecionadas 14 capturas reais, sete enquadramentos em cada proporção. As duas escadas da muralha mostram degraus contínuos até a abertura superior; a galeria mostra piso, paredes e janelas sustentadas; o enquadramento elevado mostra a hierarquia do pátio, Pavilhão 6, muralhas e coberturas. A viatura é procedural e funcional como leitura de cena, mas ainda tem acabamento simples. A aprovação visual/jogável do proprietário continua pendente.

URL local do candidato:

`http://127.0.0.1:8210/?debug=1&auto=E,mst&map=penitenciaria&perfilauto=0`

## Dívidas e fronteiras

- O seletor e o minimapa ainda exibem “Penitenciária da Treta”; essa string vive no registro compartilhado `maps.js` e a troca global para “Carandiru” foi deliberadamente deixada fora desta lane map-local.
- A dívida genérica MAP1/exposição e a queda de eficiência do botsim estão registradas acima e precisam de teste humano antes de promoção.
- Não houve consumo de Mint/Astra nem inclusão de assets privados. O PR #556 permanece como fonte histórica; esta branch não o carrega como stack.
- Merge, deploy e aprovação visual humana não fazem parte desta entrega.

## Estado

Implementação, régua causal, build, CTF, bots, matriz WebGL e capturas concluídos. A crítica adversarial independente está em andamento; o draft PR só será aberto após GO ou correção de bloqueios.
