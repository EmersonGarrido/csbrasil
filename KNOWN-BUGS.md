# BUGS CONHECIDOS — CORO SOLTO: Treta Suprema

> Estado: **2026-08-04**. Só entra aqui defeito com **evidência**: `arquivo:linha`, saída de
> régua ou passo de reprodução. Suspeita sem medição vai para o fim, na seção
> *Relatados, ainda não reproduzidos*.
>
> Regra da casa: bug que o dono reporta vira **invariante permanente** em
> `tools/eval/invariants.mjs`. Enquanto não virar, fica aqui com o campo `Régua: nenhuma`.

**Portão na data deste arquivo** (`node tools/eval/invariants.mjs`, ~10-12 min):

```
CRÍTICAS: 36/49 passam  ← VM1, VM3, VM5, VM12, VM16, VM18, VM18b, VM19,
                          BOT8, CHR1, CHR3, CHR4, TEX1 VERMELHAS
AVISOS:   nenhum
PULADAS:  4 (exigem browser)
```

Mudou em 04/08: **CHR5B saiu do aviso e ficou VERDE** (27/44 personagens sem mapa de
superfície → 0/44) e entrou a **CHR7** (convenção de skin), verde — daí 49 e não 48.
**TEX1 ficou vermelha** por 10 superfícies grandes e claras sem albedo, **todas no
`fy_quebrada`**, que é mapa em obra — não é regressão de personagem.
CHR1/CHR3/CHR4 seguem exatamente como estavam (conferido personagem a personagem: a
lista de "balão" do CHR1 tem os mesmos 13 antes e depois).

---

## P0 — quebram o jogo ou mentem para quem mede

### ~~BUG-00 · "o jogo reiniciou sozinho e foi pro menu principal"~~ · RESOLVIDO 04/08

**Sintoma (do dono, cinco ocorrências):** *"pela quinta vez o jogo reiniciou sozinho, eu
estava no meio de uma partida e ele foi pro menu principal sozinho"*.

**Causa raiz — confirmada, e NÃO era caminho automático.** `quitToMenu()` tem exatamente
dois chamadores (`public/js/main.js`, `#btn-quit` e `#btn-menu`) e os dois são `onclick`;
`show('main-menu')` só aparece em handlers de clique e no ESC do próprio menu (guardado por
`#map-screen` visível, impossível em partida porque `startGame` chama `show(null)`). Não há
`location.reload`, `history`, nem um `<a href>` na página do jogo. **O clique era real.** O
defeito é que o jogo põe os botões que destroem a partida debaixo da mira, sozinho:

1. `game.js:_plc` pausa a **qualquer** perda de pointer lock — alt-tab, ESC, notificação do
   SO, o Chrome tirando o foco. O jogador não pediu pausa nenhuma.
2. O menu de pausa nasce clicável no mesmo frame, centrado.
3. **Medido** (`node tools/eval/pause-check.mjs --geo`, Chromium 1536×1024, o enquadramento
   3:2 do dono, com o pause aberto):

   | sob o cursor | % da tela |
   |---|---|
   | canvas (o "clique pra voltar") | **0,00 %** |
   | `#pause-menu` (fundo) | 95,59 % |
   | os 5 botões | 4,42 % — `REINICIAR`+`SAIR` somam 1,66 % |

   E na coluna vertical do **centro da tela**, que é onde mora a mira:
   centro → `CONFIGURAÇÕES`; centro **+100 px** → `REINICIAR PARTIDA` (*"reiniciou
   sozinho"*); centro **+150 px** → `SAIR PRO MENU` (*"foi pro menu principal sozinho"*).
4. O escape hatch estava **morto**: `_md` só retomava com
   `e.target === renderer.domElement`, e com 0,00 % de canvas exposto isso nunca acontece
   pausado. O gate nasceu no G2-R2 pra consertar o inverso (*"clico em SAIR PRO MENU e não
   acontece nada"*) e, ao consertar aquilo, entregou **todo** clique pausado pros botões.

**O que foi descartado com medição, não com palpite:** o fim de partida (`_endMatch`) não
dispara cedo — `killsToWin`/`capsToWin` são `Infinity` e só são lidos sob `PACE`
(`QS.get('pace')==='1'`, desligado); 900 s headless em 5 mapas (harness `bootGame`) fecham
sempre em 5 rodadas / 530,7 s, sem transição espúria. `dispose()` só é chamado por
`startGame` e `quitToMenu`. `beforeunload`/`sendBeacon` não navegam.

**Correção** (`game.js` + `main.js`):
- `PAUSE_ARM_MS = 600` — o painel de ações nasce com `pointer-events:none`, então o tiro
  em voo não alcança botão nenhum;
- clique no **fundo** do menu (95,59 % da tela) retoma a partida — o escape hatch de volta,
  agora num alvo que existe;
- passada a guarda o painel volta a aceitar clique (senão o G2-R2 ressuscita);
- `confirmGate` (game.js) — `SAIR PRO MENU` e `REINICIAR` exigem dois toques com
  **CONFIRM_MIN_MS = 350 ms de silêncio** entre eles. Não é "clique de novo" ingênuo: a
  primeira versão desta trava foi **reprovada em Chromium por uma rajada de 8 cliques a
  60 ms no mesmo pixel** (o que a mão do jogador faz quando a arma "para de atirar"), que
  confirmou sozinha e saiu pro menu. Clique cedo demais agora **re-arma** o relógio.

**Régua: `tools/eval/pause-check.mjs`** (node puro, ~5 s, no `check:fast` e no portão como
invariante `PAUSA`). 6 cláusulas, **7 mutações medidas, todas fazem a cláusula certa ficar
vermelha** — inclusive `PAUSA5`, que reprova qualquer caminho automático novo (um
`setTimeout(quitToMenu, 1000)` deixa o portão vermelho). Duas armadilhas achadas escrevendo
a própria régua e consertadas: a isenção do corpo de `quitToMenu` era por "tem `function
quitToMenu` por perto" (passava verde com a mutação colada logo abaixo da função) e a busca
era por `quitToMenu(` (não pegava `setTimeout(quitToMenu, …)`, que é justamente como se
cria um caminho automático sem escrever parênteses).

---

### BUG-01 · Bandeiras de CTF aparecem no HUD em partida de rodadas

**Sintoma (do dono):** mapas em modo *rounds* mostram a faixa de bandeiras no HUD, sem existir
captura nenhuma.

**Causa raiz — confirmada.** `#ctf-hud` nasce escondido (`src/pages/index.astro:589`,
`class="hidden"`) e `_updateCtfHud()` faz `classList.remove('hidden')`
(`public/js/game.js:4161`) **sem nenhuma guarda**. Não existe, em lugar nenhum do repo,
um `add('hidden')` para esse elemento — `grep -rn "ctfHud\|ctf-hud" public/ src/` devolve 5
ocorrências e nenhuma esconde. O `if (this.ctf)` de `game.js:2011` protege só a *criação* das
bandeiras (`_initCTF`), não a visibilidade do HUD.

**Reprodução:** jogar uma partida de CTF → voltar ao menu → iniciar partida de *rounds*
**sem recarregar a página**. A faixa continua visível, com o HTML da partida anterior.
Efeito colateral visível: `public/style.css:578` (`#ctf-hud:not(.hidden) ~ #killfeed{top:114px}`)
empurra o killfeed 38 px para baixo no modo errado.

**Correção:** guardar a exibição por modo em `_updateCtfHud()` e esconder + limpar o
`innerHTML` na saída de partida (junto do bloco `game.js:6112-6124`, que já esconde 12 outros
elementos e esqueceu este).

**Régua:** nenhuma. `tools/eval/mode-check.mjs` passa 16/16 porque compara *modo escolhido ×
modo jogado*, não *modo jogado × HUD desenhado*. Precisa de cláusula nova (`UI`), com mutação.

---

### ~~BUG-02 · O portão se auto-sabota~~ · RESOLVIDO 04/08

`package.json` passou a rodar **`eval:vm` antes de `eval:invariants`** (e ganhou
`audio:check`). O diagnóstico abaixo fica porque explica por que a ordem importa e por que
nenhuma vermelha de VM vale sem regenerar o JSON antes.

**Causa raiz — confirmada.** `package.json` define
`check = syntax && eval:invariants && eval:vm && ...`. As invariantes de viewmodel leem
`tools/eval/vm_mint_audit.json`, que é **gerado pelo `eval:vm` — que roda depois**. Como
`eval:invariants` sai 1, o `&&` corta e o JSON nunca é regenerado. Ele congela.

**Impacto medido (04/08):** o JSON no repo era de 03/08 07:39, com `V0=80°` e
`vmOff=[0.03,-0.23,0]`; o `game.js` está em `V0=42°` e `VM_OFF=[0.03,-0.10,0]`
(`game.js:436` e `game.js:480`). Resultado — antes × depois de `npm run eval:vm`:

| Invariante | com JSON velho | com JSON regenerado |
|---|---|---|
| VM5 área da arma na tela | 1,1–4,5% · **26/26 fora** | 6,3–12,8% · 3/26 fora |
| VM1 borda esquerda | **26/26 fora** | 2/26 fora |
| VM9 grip | **26/26 fora** | ✓ passa |
| AUD1 (meta-invariante) | ✗ "lente do JSON DIVERGE" | ✓ passa |

A `AUD1` — que o `HANDOFF.md` manda manter verde — detectou o problema corretamente. Ela é a
única razão de isso não ter virado três dias perseguindo um defeito que não existe.

**Correção:** inverter a ordem (`eval:vm` antes de `eval:invariants`) **ou** fazer
`invariants.mjs` recusar-se a rodar quando `vm_mint_audit.json` for mais antigo que `game.js`
(falha explícita vale mais que vermelho falso).

---

### BUG-03 · BOT8 — bot com linha de visão no jogador por segundos, sem atirar

**Medido:** `4 episódios | maior silêncio 4,23 s | 690 s em condição`. Vermelha desde o
baseline, nunca atacada (era C9 no handoff anterior, com 2,7 episódios / 3,03 s — **piorou**).

**Causa raiz — confirmada.** `public/js/game.js:5361`:

```js
const hasTurn = !(BOT_FAIR && e.isPlayer) || this._duelToken(b);
```

Essa `const` é avaliada **todo frame, para todo bot cujo alvo é o jogador**, antes de qualquer
gate de "pode atirar" (o `if` só vem em `game.js:5363`). E `_duelToken` não consulta: ele
**reserva** o token por `BOT_TOKEN_HOLD`. Um bot em atraso de reação, recarregando, ou sem
linha de tiro, rouba um dos 2 tokens e o segura. Os outros recebem `hasTurn === false`,
continuam avançando e **atravessam o campo de visão sem disparar**.

**Correção:** mover a chamada para dentro do `if`, depois dos gates de munição/LOS/mira.

**Régua:** BOT8 já existe e morde. Basta rodar depois.

---

### BUG-04 · `ViewModelRig` está escrito, testado — e nunca foi importado

`public/js/springs.js:94` exporta uma máquina de estados completa de viewmodel: idle com
respiração, sway com mola, bob, **reload em 5 fases com queda de carregador**, holster+draw com
troca de malha no ponto baixo do arco, ADS. Tem teste dedicado (`tools/eval/vmrig-test.mjs`).

`public/js/game.js:11` importa **só** `RecoilAxis` de `springs.js`. O `vmrig-test.mjs` valida
código que **não roda no jogo**. Consequência de produto: o reload não tem fase visível nem
carregador caindo — o critério V5 do plano de release é impossível de atender enquanto isso não
mudar.

---

## P1 — o jogador vê

### ~~BUG-21 · Parede invisível a 2,3 m do ônibus (Brasília)~~ · RESOLVIDO 04/08

**Sintoma (do dono, com print):** *"o mapa não deixa eu andar perto do ônibus"*.

**Causa raiz.** O ônibus está girado **0,55 rad (31,5°)**. O occluder respeita a rotação
(`bx.rotation.y`), mas `col()` empurra `{minX,maxX,minY,maxY,minZ,maxZ}` e **o motor não tem
collider rotacionado em lugar nenhum** — nem `_collide`, nem o A* dos bots. A caixa única de
9,0 × 5,2 alinhada aos eixos é o retângulo girado achatado: sobra nas quinas, falta nas
laterais.

**Medido** (planta, amostragem de 2 cm):

| | antes | depois |
|---|---|---|
| bloqueio onde não há ônibus | 12,9 m² | 9,3 m² |
| **parede invisível mais distante da lataria** | **2,33 m** | **0,68 m** |
| ônibus **sem** colisão (dava pra entrar pelas quinas) | 7,6 m² | **0 m²** |

**Correção:** decompor o retângulo girado numa grade 6×3 no espaço local do ônibus e empurrar
a AABB exata de cada célula — uma escada de 18 caixas seguindo a diagonal. 0,68 m já é menor
que o raio do jogador (0,38 m) mais o passo.

**O conserto de verdade, se voltar a incomodar:** collider com rotação no motor. Aí todo prop
girado ganha de graça — e há outros. É mudança em `_collide`, caminho quente usado por jogador
e bots, e não cabia junto desta correção.

### ~~BUG-22 · Não dá para andar debaixo da escada (Havan)~~ · RESOLVIDO 04/08 (metade do jogador)

**Correção: chão multinível no motor.** `groundHeightAt(x, z)` virou
`groundHeightAt(x, z, yRef)` — o mapa passou a responder *"qual superfície é o chão de quem
está nesse Y"* em vez de "a de cima, sempre". Sem `yRef` devolve o topo, que é o
comportamento antigo: nenhuma régua e nenhum chamador que ainda não passa o Y mudou.

**Pé-direito faz parte da regra** (`ALTURA_LIVRE = 1,95 m`): só abre a camada de baixo onde
cabe gente em pé. Medido na escada da Havan:

| altura da escada no ponto | jogador em y=0 | jogador em y=3,4 |
|---|---|---|
| 3,40 m · 2,98 m · 2,46 m · 1,96 m | **passa por baixo (chão 0)** | desce pela escada |
| 1,45 m · 0,77 m · 0,09 m | sobe a escada (não cabe embaixo) | desce pela escada |

Sem o pé-direito o jogador entraria embaixo do primeiro degrau — 17 cm de vão — com a cabeça
dentro da geometria.

**A METADE QUE FALTA: os bots.** O A* é um grafo de `(x, z)` sem dimensão de camada, e
`blocked()`/geração de nós chamam `groundHeightAt` **sem** `yRef`. Consequência: o bot não
*planeja* rota por baixo da escada — ele só deixa de ser puxado pro topo quando já está lá
embaixo. Grafo com camada é a segunda metade desta frente, e destrava de vez mezanino, ponte
e viaduto em todos os mapas.

<details><summary>Diagnóstico original, mantido porque explica por que não era collider</summary>

**Sintoma (do dono):** *"não dá pra andar debaixo das escadas do respawn da loja, de dentro"*.

**Causa raiz.** A escada **não tem collider**: os degraus são `addBox(..., { collide: false })`
e a subida é feita por `groundHeightAt(x, z)` (`map_havan.js:1507`), que devolve a altura da
rampa para todo o retângulo `RAMP`. E aí está o problema: `groundHeightAt` é um **heightfield
escalar — um único Y por (x, z)**. Não existe "embaixo" para o motor: dentro daquela pegada, o
chão *é* a escada, na altura da escada.

Visualmente, porém, os degraus são caixas finas (0,06 m) com espelho, então **o vão embaixo é
visível** — o jogador vê espaço, anda até lá e é levado pro topo da rampa. Ver espaço e não
poder usar é pior que não ter espaço.

**Duas saídas, e a escolha é de design:**
- **Fechar o vão** (saia sólida sob a escada). É o padrão da era CS — escada é bloco maciço.
  Barato, honesto, e o mapa deixa de prometer o que não entrega. **Mas você perde o espaço.**
- **Chão multinível no motor** (`groundHeightAt` devolvendo camadas, com o A* ciente delas).
  É o que dá o "embaixo da escada" de verdade, e destrava mezanino, ponte e viaduto em todos
  os mapas. É mudança estrutural e mexe no pathfinding.

</details>

### BUG-05 · A UI não bate com as telas de referência (`references/telas/`) — PARCIALMENTE FECHADO

Nove telas de referência medidas em `tools/eval/ref_ui.json`. Dois desvios sistemáticos, ambos
medidos:

- **Cor — FECHADO.** `--bg-900/800/700` eram azuis (h ≈ 253°) contra o marrom-neutro medido
  (h 84-129°). O que travava era o literal: **79 ocorrências de `rgba(5,8,11,…)` no CSS, nenhuma
  via token**. Consertado na causa — o token virou DERIVADO de `--bg-900-rgb` e todo scrim
  consome `rgba(var(--bg-900-rgb),α)`, então token e literal não podem mais divergir. Medido
  depois: o fundo do jogo saiu de h 260,7° para **h 81,0°** e o painel ficou em
  `#3c372f` L\* 23,2 · C\* 5,4 · h 85,1 contra `#38342e` L\* 22,0 · C\* 4,3 · h 85,5 da
  referência. Virou invariante na **UI5** (cláusula `b* >= 0`, com a mutação `ui5_fundo_azul`).
- **Escala — MARGENS FECHADAS, TIPOGRAFIA PARCIAL.** As margens do HUD saíram de 1,17% / 0,98%
  para **4,49% / 2,73%** (referência 4,69% / 7,03%) — trilho esquerdo de 68 px, direito de 48 px,
  topo/base de 36 px em 1536×1024. A tipografia subiu os três degraus de título
  (fs-700/800/900 = 40/56/76 px) e a razão título/corpo foi de 1,80-2,20 para 2,20-3,00 contra
  3,33-5,00 da referência.

**O QUE FICA ABERTO, e por quê:**

1. **A razão título/corpo não fechou.** Falta ~35%. Subir mais em px cria o problema oposto em
   tela baixa: a referência é uma FRAÇÃO da altura e o jogo é PX FIXO, então a proporção só bate
   numa resolução. A correção certa é escala fluida (`clamp()`/`vh`), e ela **está bloqueada pela
   régua**: `caixaDe()` (`tools/eval/ui-check.mjs:563`) lê `font-size` com `parseFloat`, e a UI3
   só isenta elemento de canto ancorado em PX (`emPx`, mesma linha de raciocínio em :637).
   Com `vh`/`clamp()` a UI3 mede caixa de 3,9 px e fica **cega**. **Ordem correta: ensinar
   `px()`/`caixaDe()` a resolver `clamp()/min()/max()/vh` — com mutação — e só depois tornar a
   escala fluida.**
2. **`corpoFracMediana` (o -20% do menor corpo) não foi perseguido de propósito.** O piso de
   11 px está documentado como "legível em 1280×720" e o desvio repousa numa banda que o próprio
   `ref-ui.py` admite medir com ±12% de erro a 512 px (docstring). Encolher legibilidade por
   ruído de instrumento seria o inverso da regra da casa.
3. **`margens.baseFrac` da tela 05 continua medindo 0,0000.** Não é o CSS (a base do HUD está em
   36 px = 3,5%): é o instrumento — `margens()` conta tinta de contraste alto, e o **viewmodel**
   encosta na borda inferior. Medir margem de HUD sobre uma tela com arma exige máscara.

**Verificação exige browser** (`#btn-jogar` é sticky, `.cs-setup` tem largura fixa — mudar
tipografia sem olhar overflow já quebrou tela antes). As 9 telas foram capturadas em
Chrome headless a 1536×1024 (3:2, o enquadramento do dono) e medidas com o mesmo `ref-ui.py`
apontado para as capturas.

### BUG-06 · Alvo de capturas do CTF não deriva do número de bandeiras

`game.js:1092`: `this.capsToWin = this.ctf ? CTF_CAPS_TO_WIN : Infinity` — constante. O Havan
tem **4** bandeiras, o ferro velho **4**, e o alvo continua fixo. As strings já usam a variável
`alvo` (o hardcode "DOMINARAM OS 3 PODERES" não existe mais), então o conserto é só na origem
do número: `Math.floor(world.ctfPoints.length / 2) + 1`, mantendo **dominação = vitória
imediata**. A cláusula "ALVO DECLARADO" da `UI4` (`tools/eval/ui-check.mjs`) tem que ser
atualizada junto, senão passa a mentir.

### ~~BUG-07 · Metade do áudio do repo nunca toca no jogo~~ · RESOLVIDO 04/08 (parcial)

O manifest passou a ser **gerado do disco** por `tools/gen-audio-manifest.mjs`
(`npm run audio`), com `npm run audio:check` no portão. A pasta virou a verdade: som novo
na pasta + um comando = som tocando. Ganho medido no mesmo dia:

| | antes | depois |
|---|---|---|
| voz dos **funkeiros** | 0 (usava a dos Tribos) | **40 ingame + 20 round** |
| voz do petista | 11 + 7 | **17 + 14** |
| voz do bolsonaro | 13 + 6 | **16 + 14** |
| capture | 5 | 6 |
| `soundtrack/` | invisível | 30 listadas (falta o player) |

Os 289 caminhos do manifest foram verificados um a um contra o disco: **0 quebrados**. Os
nomes com espaço e parêntese (`…olodum (1).mp3`) agora saem codificados — sem isso o
arquivo existe, o manifest aponta e o som não toca, que é o pior tipo de defeito. Servido
e conferido em `npm run dev` (HTTP 200 no arquivo com parêntese).

**O que continua aberto** está no BUG-19 (chegar em produção) e nos 176 órfãos que sobram:
132 em `weapons/` (variantes `.wav` do pack antigo; a chave `weapons` é curada 1-para-1 de
propósito), 26 em `menu-music/` (entram por `MENU_TRACKS` no código, não pelo manifest) e
**16 em `cc0/`** — sons de arma CC0 com procedência documentada em `cc0/SOURCES.md`,
comprados e nunca ligados. Esses últimos entram sem risco nenhum e ninguém ligou.

<details><summary>Diagnóstico original (04/08), mantido porque explica o desenho</summary>

**Medido em 04/08:** `find public/audio -name '*.mp3'` → **295 arquivos**. Referenciados pelo
`manifest.json` → **136**. O resto é ou som que deveria estar no jogo e não está, ou peso morto
no bundle — e hoje não dá para saber qual é qual olhando o repo.

| Pasta | Em disco | Fora do manifest | O que é |
|---|---|---|---|
| `funkeiros/` | 60 | **60** | facção inteira sem voz própria: a chave `F` aponta para `audio/tribos/…` |
| `soundtrack/` | 30 | **30** | **nenhum código referencia** — nem manifest, nem `grep` em `public/js` |
| `cc0/` | 16 | **16** | **nenhum código referencia** |
| `petista/` | 31 | 13 | manifest defasado |
| `bolsonaro/` | 30 | 12 | manifest defasado |
| `tribos/` | 27 | 1 | ok |
| `palhacos/` | 46 | 0 | **é a referência de como deve ficar** |
| `capture/`, `game/` | 29 | 2 | ok |
| `menu-music/` | 26 | 26 | esperado — entra por `MENU_TRACKS` no código, não pelo manifest |

Três defeitos diferentes escondidos num número só:

1. **Facção sem voz** (funkeiros) — é o mais visível para o jogador: 9 personagens novos
   falando com a voz de outra tribo. Cuidado ao apontar: há `.DS_Store` nas pastas e nomes com
   espaço e parêntese (`…olodum (1).mp3`), então o caminho tem que funcionar **como URL**.
2. **Manifest defasado** (petista, bolsonaro) — som gravado, pago e commitado que nunca toca.
3. **Pastas órfãs** (`soundtrack/`, `cc0/`) — 46 arquivos que nenhuma linha de código menciona.
   Ou entram (trilha in-game é decisão de design, não de bug), ou saem do bundle. Hoje são
   **peso morto que conta contra o teto de 250 MB da CrazyGames**.

</details>

### BUG-08 · Mídia nova na pasta é ignorada em silêncio (música, wallpaper, splash)

Três listas hardcoded em `public/js/main.js`, todas com o mesmo defeito: **o arquivo entra na
pasta e nada acontece, sem erro no console.**

| Lista | Código | Em disco | Ignorado |
|---|---|---|---|
| Wallpaper (`wall-*`) | array de 8 | 9 png | `wall-9.png` |
| Splash (`loading-*`) | array de 5 | 6 png | `loading-6.png` |
| Música de menu | `Array.from({ length: 26 }, …)` | 26 mp3 | nada **hoje** |

Confirmado em 04/08: o dono adicionou `wall-9.png` e `loading-6.png` e **nenhum dos dois
aparecia**. Os dois arrays foram estendidos à mão no mesmo dia (paliativo, com comentário no
código).

*Correção de um número que o handoff anterior trazia errado:* `menu-music/` tem **26** mp3 e o
array tem 26 — a lista está certa **por enquanto**. Ela é a mesma armadilha, só que ainda não
disparou: a 27ª faixa some no dia em que entrar.

**Correção de verdade:** página estática não lista diretório pelo browser, então o caminho é um
**manifesto gerado em build** (`tools/` → `public/img/walls.json`, `public/audio/menu-tracks.json`)
lido com fallback para a lista atual. Aí jogar arquivo na pasta vira um comando, não uma edição
de código — e deixa de depender de alguém lembrar.

### BUG-09 · Bloom global lava os personagens

`public/js/bloom.js:879` — `new UnrealBloomPass(…, 0.25, 0.45, 0.85)` aplicado à cena inteira.
Precisa virar bloom **seletivo por layer**, com kill-switch (`?charbloom=1` volta), **sem**
quebrar o `vmPass` (o viewmodel recebe bloom/AgX de propósito, `bloom.js:872`) nem o caminho
`quality:'low'` / `?bloom=0`, que não tem pós-processamento. Medir o custo: máquina fraca é
requisito do dono.

### ~~BUG-24 · "todos os personagens depois desses também tão ruim na cor e iluminação"~~ · RESOLVIDO 04/08

**Causa raiz — medida, e não era a textura.** O C9 (`char-color.mjs`) já tinha provado que a
diferença ENTRE personagens nasce no GLB (saturação mediana 0,390, mas gotinha 0,031 contra
canarinho 0,689 — spread de 22×) e tinha refutado resolução de textura como explicação. O que
faltava era o que o SHADER faz com essa textura. `characters.js` aplicava o piso de albedo como
um **DEGRAU por texel**: `diffuseColor.rgb *= max(1.0, csAlbMin / csMx)`, com `csAlbMin = 0,09`.

**0,09 é LINEAR — vale sRGB 0,332 = byte 85 = L\* 36.** Não é "levantar o preto": é um **cinza
médio**. Medido nas texturas reais dos 45 GLB (`tools/eval/char-floor.mjs`, C10):

| | % do albedo abaixo do piso | contraste interno perdido |
|---|---|---|
| trapfunk | **94,1 %** | **61 %** |
| palhaço mal | 90,4 % | 33 % |
| oakley | 86,6 % | 46 % |
| emo · punk | 79,2 % | 46 % · 43 % |
| coach | 74,7 % | 43 % |
| black metal | 67,3 % | 45 % |
| **padata · canarinho** | **8,4 % · 8,8 %** | 10 % · 13 % |

Ou seja: o personagem escuro inteiro colapsava num único valor (era isso o "liso, cor chapada,
parece manequim") enquanto o claro não era tocado. **Mediana do elenco: 21 % do contraste
interno comido pelo próprio piso.**

**Correção.** O piso passou a olhar o nível **REGIONAL** do albedo (`textureLod(map, vMapUv, 6)`)
e a multiplicar o texel por esse ganho. O ganho é constante dentro da região, então toda razão
entre texels sobrevive por construção — o piso levanta o NÍVEL sem tocar no contraste — e acima
do piso o ganho é 1,0 exato (personagem claro não muda um pixel). Perda mediana **21 % → 0,2 %**;
pior caso 60,9 % (trapfunk) → 7,5 %. Medido no jogo (`char-shade.mjs`, C11, Havan + Ferro Velho):
contraste interno **+19 % a +41 %** nos escuros, croma **+8 %**, e **padata/canarinho idênticos**.
Preço: os dois mais escuros ficam 4-6 L\* mais escuros — o que na Havan **melhorou** a separação
do C1 (ΔL\* mediano 7,8 → 10,6). Imagem: `tools/eval/char_piso_antes_depois.png`.

Junto foi corrigido o fill do piso de irradiância, que somava **branco** (`irradiance += vec3(csAdd)`)
e desbotava o iluminante na sombra: agora o fill herda a crominância do próprio ambiente com a
**mesma luminância** (`dot(fill*csAdd, LUMA) == csAdd`), então é impossível estourar por causa
dele. No Ferro Velho isso sozinho deu **C\* 7,2 → 7,6 com L\* byte a byte igual**.

**Régua: `tools/eval/char-floor.mjs`** (C10, node+magick, ~40 s), no portão como **CHR8**, com o
modo julgado LIDO DO FONTE (devolver o piso ao degrau acende a invariante sozinho) e 2 mutações
medidas (`--mutante=bloco1`, `--mutante=pisozero`), cada uma acendendo a cláusula certa.
Kill-switches: `?charalbreg=0` (volta ao degrau) e `?charambchroma=0` (volta ao fill branco).

### BUG-10 · Elenco: proporção, pés no chão e palma enterrada

Três invariantes vermelhas, todas medidas no GLB, 44/44 personagens:

- **CHR1** — mediana fora da antropometria em 3 índices (cabeça/altura 0,223 vs 0,13;
  cintura/ombro 1,081 vs 0,74; braço/altura 0,278 vs 0,44). "Balão": ancap 1,93×,
  caminhoneiro 1,58×, sindicato 1,56× (+7).
- **CHR3** — pés fora do chão: 24 afundando, 32 flutuando.
- **CHR4** — 3 personagens com a palma nascendo **dentro** da silhueta do corpo.

A causa de fundo é o re-rig (C1 do handoff): 18 modelos compartilham **um único esqueleto**
(o do `mst`, transplantado por auto-skin), com raio de skin 1,55×–1,97× maior que o normal.
**Não tem conserto em runtime.**

#### O "BALÃO" — CAUSA RAIZ ACHADA E CORRIGIDA (04/08)

Não era proporção, não era `MAX_R` e não era o `raioSkin`. Era a **convenção de segmento**
do auto-skin: `rig-from-donor.mjs` montava o osso como `[junta → PAI]`, e num rig Meshy o
osso aponta pro filho (`LeftArm` = OMBRO, `LeftForeArm` = COTOVELO, `LeftHand` = PUNHO).
Resultado: **todo membro pintado com a junta DISTAL** — a carne do braço obedecendo ao
cotovelo, a da coxa ao joelho. Dobrar uma junta girava o membro inteiro.

Medido por `tools/eval/skin-offbyone.mjs`: **raul 15×0** para o pai, **mandrake 0×17** para
o filho. 17 dos 44 estavam invertidos (8 palhaços + 9 funkeiros).

Duas coisas que a régua antiga dizia e que são **falso positivo**, com número:

- `raioSkin` do C7 — 60% dos vértices caem no `head_end`, uma FOLHA rígida 29,5 cm acima do
  `Head`, e o C7 mede folha como PONTO. Deformação de folha rígida é idêntica à do pai
  (M_f·IBM_f = M_p·L·L⁻¹·IBM_p) e as tracks de `head_end` nos clipes são constantes
  (conferido). Remapear folha→pai leva raul de 0,171 pra 0,074 **sem mover um vértice**.
- `MAX_R` — o sweep 0,22→0,09 já tinha sido refutado, e continua irrelevante.

**Régua que enxerga o defeito:** `tools/eval/pose-inflate.mjs` — LBS na unha com os clipes
reais, esticamento de aresta em razão **simétrica** `max(L/L0, L0/L) − 1`. A primeira versão
usava `|L/L0 − 1|`, que satura em 1,0 no colapso e **premiava malha rasgada** (o jozo
marcava melhor com o tronco aberto num talho). Corrigida antes de valer nota.

Consertado por `tools/reskin-glb.mjs`, que repinta só `JOINTS_0`/`WEIGHTS_0` do GLB pronto
(malha, textura, esqueleto, IBM e clipes intactos) — **custo em disco: ZERO byte**.
Mediana do lote **1,152 → 0,535**; oakley 1,835 → 0,591; raul 1,131 → 0,424.
Referência: mandrake 0,402 (rigado no Mint), mst 0,312 (doador). `raioSkinP50` da família
transplantada: 0,150 → 0,078 (critério era ≤ 0,10). Guarda: **invariante CHR7**, teto zero.

**Continua aberto:** a POSTURA encurvada (o personagem anda dobrado pra frente) é outro
defeito, do retarget de clipe (C2 do handoff), e aparece igual antes e depois do reskin.

### BUG-11 · VM18 / VM18b — a silhueta é um cano, não uma arma

12 das 26 armas têm espessura perpendicular **abaixo do piso medido no CS 1.6** (shotgun 0,269 ·
carbine 0,296 · sks 0,343 contra piso 0,427). Duas buscas em grade (768 e 1.280 pontos) e a
hipótese de escorço foram **refutadas com número**. Nenhum parâmetro de câmera engorda uma
malha: o caminho é **malha nova ou outra família de pose**. Não gaste rodada procurando
parâmetro.

---

### ~~BUG-24 · "as armas estão 1,5x do tamanho que deveriam"~~ · RESOLVIDO 04/08

**Sintoma (do dono):** *"o ângulo das armas está muito bom, mas a escala está grande ainda —
digamos que estão 1,5x do tamanho que deveriam. Eu vejo isso pq o cano da arma pra mira no
centro da tela a distância é minúscula."* Reportado com o portão **VERDE** em VM5/VM9/VM10/VM15.

**Causa raiz — confirmada, e NÃO era área.** Medido no render (diff on/off do
`vm-quake-capture`, 1200×800 = 3:2) contra a referência (`ref_viewmodel.json`):

| | área na tela | boca → mira (altura de tela) |
|---|---|---|
| ref CS 1.6 AK / M4 / Vandal | 9,76 · 9,78 · 13,09 % | 0,103 · 0,131 · 0,277 |
| nós, escala 1,00 | ak 7,95 · m4 8,63 % | **ak 0,073 · m4 0,093** |
| nós, escala 0,67 | ak 5,44 · m4 6,30 % | ak 0,137 · m4 0,154 |

A arma **nunca** cobriu mais tela que a do CS 1.6 — ela entrava no quadro com **82,2 % da malha
FORA dele** (`foraPct` da ak, 3:2; mediana do arsenal 84,1 %), então o que aparecia era um
pedaço **ampliado** de cano e guarda-mão com a boca em cima da mira. `areaPct` não é régua de
escala quando o recorte muda — e era a única régua de tamanho que existia. A distância
boca→mira, o número que o dono nomeou, **não era medida por ninguém**: a VM12 olha só o `y` da
boca. Lei 1 da casa, ao vivo — e a faca é a prova: o `vm: 2.2` dela (`weapons.js`) foi posto
para satisfazer o piso de 6 % da VM5, e virou uma lâmina atravessando a tela inteira.

**Correção:** `VM_FRAME.recuoZ` 1,00 → **1,50** (`public/js/vmattach.js`) — encolhe o tamanho
aparente em 1/1,5 em torno do grip, que fica no mesmo pixel. Ângulo, pose, `tanBarrel` e
`knifeRot` **intocados** (eixo da silhueta no render: ak 34,8° → 33,3°). `foraPct` mediano cai
de 84,1 % para 49,6 %.

**Réguas:** **VM20** nova (distância boca→mira, faixa **0,100–0,290**, medida dos 3 frames),
VM5 e VM18b com **piso condicional** (4 % de cobertura para malha mais magra que a referência,
piso medido para malha gorda; **tetos intocados**). Mutação: com o audit do estado antigo a
VM20 acusa 14/52 fora. Capturas: `/tmp/vmscale/z{1.0,1.1765,1.3333,1.5}` e o comparativo em
`/tmp/vmscale/comparativo.png`.

**Custo declarado, medido:** VM9/VM15 ficaram **vermelhas** (grip sobe de 0,959-1,063 para
0,835-0,902 contra a faixa medida 0,90-1,08 — o `VM_OFF[1]` é deslocamento em METROS e perde
efeito quando o grip se afasta), VM1 vai de 3 para 10 armas fora e VM3 de 2 para 8. E, com
`?hands=1`, 15 armas passam a acusar "MÃO SOLTA NO AR" (folga do braço 0,174 → 0,003 m) —
invisível hoje, porque `WEAPON_ONLY` é o padrão.

---

## P2 — infra, repo e deploy

### BUG-12 · `issues/` tem 2,5 GB fora do git e fora do `.gitignore`

`du -sh issues` → **2,5 GB**; `git ls-files issues | wc -l` → **0**. Não está versionado nem
ignorado: polui todo `git status` e é um passo em falso de distância de entrar num commit.
`references/` (9,4 MB) tem 28 arquivos versionados e uma negação explícita
(`.gitignore:58`, `!references/**/*.png`) — decidir o que fica.

### BUG-13 · `tools/eval/ARCH.md` desatualizado e o CI não reprova

`npm run arch:check` falha, e no workflow o passo está com `continue-on-error: true`. Regenerar
(`npm run arch`), commitar, e **remover a linha** para virar gate de verdade.

### ~~BUG-14 · O build nunca tinha rodado — e estava quebrado~~ · RESOLVIDO 04/08

`npm run build` rodou pela primeira vez nesta árvore em 04/08 e **falhou**:

```
[ERROR] ENOENT: no such file or directory, open '.../dist/server/CHANGELOG.md'
```

`changelog.astro` lia o `CHANGELOG.md` com `readFileSync(new URL('../../CHANGELOG.md',
import.meta.url))`. Parece build-time, mas não é: no build a página vira um chunk em
`dist/server/.prerender/chunks/`, `import.meta.url` passa a apontar para lá, e o caminho
relativo resolve para um arquivo que não existe. **O prerender morria e derrubava o build
inteiro** — ou seja, o deploy do site estava quebrado e ninguém sabia, porque o build nunca
tinha sido executado.

Corrigido trocando por `import md from '../../CHANGELOG.md?raw'`, que faz o Vite embutir o
conteúdo no bundle: não há caminho para resolver em runtime.

No mesmo build, `scripts/copy-wasm.mjs` rodou e gerou **`public/wasm/resvg.wasm`** (2,4 MB) —
o arquivo que faltava para as páginas `/u/*` terem og:image. Os dois itens B1 do handoff
fecharam juntos.

### BUG-15 · `public/models/anims/` não é versionado

`git ls-files` devolve vazio para o caminho. `TPM1` falha em qualquer clone limpo e o CI fica
vermelho por motivo que não é código. **Sem a pasta no deploy, todo personagem congela em
T-pose** — e `glbchars.js:196-209` engole a falha em silêncio.

### BUG-16 · Migration de segurança pronta e não aplicada

`supabase/migrations/011_*` fecha dois furos reais (`players.token` legível pela anon key; todos
os RPCs chamáveis pela anon key — um `curl` em `/rest/v1/rpc/_flag` escondia qualquer jogador do
ranking sem token). **Está no código, não está em produção**, e sequer está commitada.

### BUG-17 · Sem link do GitHub dentro do jogo

`src/layouts/Layout.astro:222` e `src/pages/sobre.astro:99` têm o link — mas são páginas do
site. `src/pages/index.astro` (a tela do jogo: menu, pausa, fim de partida) não tem nenhum link
externo. Quem entra pelo link direto do jogo nunca vê o repositório.

---

### BUG-23 · `references/graffiti/` é material de REFERÊNCIA, não pacote de assets

Pedido do dono (04/08): decodificar as imagens da pasta, recortar os elementos com fundo
transparente e aplicar como decalque em todos os mapas.

**A pasta não pode ser aplicada como está.** 62 arquivos, 118 MB, e a amostra que abri mostra
o padrão: é acervo de inspiração baixado da web, não biblioteca licenciada.

| arquivo | o que é | pode ir pro jogo? |
|---|---|---|
| `beeaea08…jpg` | **pôster do AKIRA**, com crédito impresso na própria arte (Katsuhiro Otomo · 1998 Akira Committee · Streamline Pictures · design de Owen Roe) | **não** |
| `003de6c0…jpg` | folha de alfabeto da **Bombing Science** (loja), assinada `acmefourtune`, com logo da marca | **não** |
| `61p6GBWKMKL._AC_UF894…jpg` | peça "KING" — o nome do arquivo é ID de imagem de produto da **Amazon** (print à venda) | **não** |
| `cco_decal_-_graffiti_textures.glb` | atlas 1024² de peça wildstyle, **rotulado CC0** na origem | **sim**, com a procedência anotada |

É o mesmo padrão do `soundtrack/` (BUG-19) e pelo mesmo motivo: material recolhido para
olhar, tratado depois como material para embarcar. Aqui é pior em dois aspectos — o repo é
**público**, então a lista de arquivos é a própria denúncia, e o Akira tem titular ativo.

**O que serve, e é o que a pasta é boa pra fazer:** essas imagens são a REFERÊNCIA de estilo.
Forma de letra não é protegida — o desenho específico é. O `PIXO_GLYPHS` de `textures.js` já
nasceu assim (alfabeto próprio, medido contra a letra paulistana) e é 100% nosso. O caminho é
estender a mesma família com um gerador de *throw-up* (letra bolha com contorno), que é o que
a folha da Bombing Science ensina, e usar o decalque CC0 como peça grande pontual.

**Não apliquei nada em mapa.** O pedido foi feito com o dono indo dormir e a decisão de
licença é dele, não minha — e é irreversível na prática, porque asset entra em commit, em
build e em deploy antes de alguém revisar.

### BUG-18 · O trabalho de duas semanas nunca saiu desta máquina · **o mais grave da lista**

`main` está no commit **`b4ee2b3`, de 18/07** (`v1.12.4`). A branch de trabalho tinha
**143 commits à frente** e **nenhum upstream** — nunca foi enviada. Verificado de fora:

```
https://www.csbrasil.online/js/main.js      -> 200
https://www.csbrasil.online/img/wall-1.png  -> 404   (existe e está commitado — só aqui)
```

O que **não** está em produção: personagens GLB reais, funkeiros, palhaços, o viewmodel
refeito, o Ferro Velho, os mapas novos, os wallpapers. O jogo que as pessoas jogam hoje é o
de 18 de julho.

Contribuiu para isso um `.git/index.lock` **morto desde 02/08 19:36** (0 byte, nenhum
processo segurando), que fazia qualquer commit falhar. Removido em 04/08.

A branch foi renomeada para **`v2/alpha`** e a regra `v2/<assunto>` está no
`CONTRIBUTING.md`. **Continua sem upstream de propósito** — a decisão do dono é testar
local antes de subir.

### BUG-19 · O áudio de produção é um pacote de julho, e o build baixa ele por cima

`vercel.json` roda `bash scripts/fetch-audio.sh && npm run build`. O script baixa
`audio-pack.zip` de um **release do GitHub** (`audio-pack-v1`, 199 arquivos, 4,3 MB, de
17-18/07) porque `public/audio/` é gitignored. Em disco hoje há **458 arquivos, 187 MB**.

Consequência: mesmo com o manifest consertado (BUG-07), **produção não tem os arquivos**.
Medido: `csbrasil.online/audio/manifest.json` responde 200, mas
`audio/menu-music/m01.mp3` responde **404**.

Dois problemas dentro de um:

1. **O pacote precisa ser regerado** a partir do disco e publicado como `audio-pack-v2`.
   Sem isso, todo som novo morre no deploy — inclusive os 85 que acabaram de ser ligados.
2. **187 MB não cabe.** `soundtrack/` sozinha tem **104 MB** (30 faixas inteiras) e
   `menu-music/` 49 MB, contra o teto de **250 MB da CrazyGames** somando *tudo*, com
   `public/models/` já pesado. A decisão do dono é cortar e reencodar
   (*"podemos cortá-los e renomear em outra pasta mas vão"*) — `ffmpeg` está disponível na
   máquina. Renomear resolve de quebra o outro problema: os nomes de arquivo de
   `soundtrack/` são de faixas comerciais (Sepultura, Racionais, Charlie Brown Jr, O Rappa,
   Fatboy Slim, Ramones), e num repo público eles são a própria lista de denúncia.

### ~~BUG-20 · PDFs pessoais dentro de `public/`~~ · RESOLVIDO 04/08

`public/audio/soundtrack/` continha `Numa_Interview_Pack_v1.pdf`,
`Numa_Interview_Playbook_Ruben.pdf` e `Numa_Interview_Playbook_v2.pdf` — documentos
pessoais do dono. Tudo em `public/` é servido pelo site: o build de 04/08 copiou os três
para `dist/client/audio/soundtrack/`, e um `vercel deploy` local os publicaria.

**Não chegaram a ficar expostos** (404 em produção, e não estavam no git — o deploy vem do
git). Movidos para `~/Documents/numa-interview/` e apagados do `dist/`.

Lição que fica: `public/` não é pasta de trabalho. Qualquer arquivo largado ali é
publicação em potencial, e o `.gitignore` não protege de um deploy local.

---

## Relatados, ainda não reproduzidos

- **"E vice-versa" do BUG-01** — partida de CTF *sem* a faixa de bandeiras no HUD. O caminho
  `this.ctf → _initCTF → _updateCtfHud` sempre desconde, então o mecanismo não é o mesmo do
  BUG-01. Precisa de mapa + modo + se houve recarga de página.
- **BOT1** (aviso) — bot indo de lado, 12,9 flips/min contra teto de 12/min.
- ~~**CHR5B** (aviso) — 27 dos 44 personagens com **zero** mapa de superfície~~ · **RESOLVIDO
  04/08**: `tools/char-surface-maps.mjs` deriva normal+roughness do próprio albedo do GLB
  com a MESMA fórmula do `textures.js` (Sobel + `hi+(lo−hi)·lum`), 512 px, FORÇA 1,8
  escolhida comparando imagem a 1,1/1,8/3,0. **27/44 → 0/44**, custo +1,64 MB nos 27
  arquivos (11.624.996 → 13.347.320 bytes).
  No caminho apareceu um defeito maior: `upgradeCharMaterial` (characters.js) carregava
  `map` e `normalMap` e **largava o `roughnessMap`** — os 17 personagens com
  metallicRoughnessTexture do Mint pagavam o download e a tela desenhava `roughness: 0.86`
  fixo. O CHR5B contava ARQUIVO, o jogador via CONSTANTE. Corrigido junto.
- **C10** — `_freeSpot` (`game.js`) ignora colisores com `minY ≥ 1,5`; no mezanino não empurra
  arma para fora de parede. Não mordeu ainda; é armadilha para o próximo mapa com andar de cima.
