# HANDOFF — sessão Kimi (21/07) — estado do CS BRASIL

Documento de continuidade. Se esta for uma sessão nova, leia isto primeiro: aqui está onde paramos e o que vem a seguir.

## ✅ ATUALIZAÇÃO 22/07 (sobrescreve onde conflitar com o resto do doc)

**Mint CONECTADO** (OAuth feito; pro tier; tools `mcp__mint__*` funcionando; agentes geram/animam/baixam GLBs em background com sucesso — pipeline: start_model_generation(riggable t_pose) → animate_generated_model(basic_locomotion) → artifact manifest → rigged GLB → otimizar LOCAL com gltf-transform (resize 512/webp/dedup/prune; **NUNCA optimize_generated_model — Draco quebra o GLTFLoader pelado**)).

**Entregue nesta sessão** (tudo verificado com screenshots/testes, 0 erros):
- **3 personagens novos**: `bozo` (P, palhaço Bozo), `canarinho` (B, Canarinho Pistola camisa 24), `proerd` (B, Leão do Proerd camisa PRETA c/ logo vermelho). Rigs Meshy compatíveis (26 nós = dollynho menos Curl_R/L) → clipes compartilhados bindam 100% (idle/walk/shoot/death verificados via `botview.html?char=<id>&anim=walk`). Wiring: characters.js + GLB_CHARS + CHAR_WEAPON (`bozo:revolver38, canarinho:deagle, proerd:md97`). Registro em `mint-assets.json`. ATENÇÃO: Bozo v2 semi-real veio com rig QUEBRADO (A-pose reportada como t_pose) — **v1 restaurado**; lição: sempre validar anims com `botview.html` antes de trocar um char, bones.match sozinho NÃO basta (proporção/bind importam).
- **Spawn protection (issue #24)**: `SPAWN_PROT=3s` — `protUntil` em player/bots, guard no `_damage`, blink nos bots, badge `#prot-badge` no HUD. Round start NÃO ganha proteção.
- **Mapa Brasília**: urna eletrônica no centro `(0,0)`, Towner = carrinho de hotdog `(12,-15)`, +2 stalls +2 tents no lado B (z −21..−27). Props novos: `public/models/props/{urna,towner}.glb` (26MB→252KB e 14MB→1.7MB via gltf-transform); adicionar SEMPRE em `MAP_PROPS` (main.js) **e na lista hardcoded do `mapeval.html`**.
- **Dollynho dançando** no fim de round: `models/dollynho_dance.glb` (clipe Mixamo embutido) toca num canvas próprio dentro do `#scoreboard` (`_ensureDolly`/`_tickDolly` no game.js).
- **Bots**: pool agora ROTACIONA por partida (antes só os 8 primeiros do time apareciam).

**FASE 1 (mãos 1ª pessoa) — ✅ ENTREGUE**: `fparms.js` (novo) — clone SkeletonUtils do GLB do próprio personagem pendurado no `vm.root` (Head scale 0.0001), pose idle congelada (`mixer.setTime(0.6)` p/ zerar drift CCD), IK CCD (`handik.js`) por frame: R no grip / L no guarda-mão (`poseToWeapon` depois dos transforms do vm.root; kick/reloadDip/sway/bob/ADS/draw intocados — mãos re-travam em todos). Detalhes que fizeram a diferença: **efetor da palma medido dos skin weights** (`measurePalmLocal` — sem isso a palma flutuava 9cm), orientação da mão = transplante da pose congelada c/ correção do eixo do rifle (`qFix`, 2 passadas). `gripPoints(id)` em weapons.js = fonte única (grip na origem, cano +Z; fore null em ONE_HANDED). ARM_MOUNTS aproximaram as armas p/ alcance real (z −0.5 era além do braço). Draw animation nova (sobe de baixo). **Métrica: gripError ≤ 3.7mm em 12 armas** (exceção: bozo+AWP L 37mm — braço curto, visual ainda OK). Fallback procedural (`fpArm/frontHand` mantidos) p/ doutora/influencer/senhora/sindicato (props FUNDIDOS na malha, inspetado) e canarinho (ave). **Bugs latentes corrigidos**: `this.playerCharId` NUNCA era atribuído no Game (afetava pal+spawn weapon); `_swayX/Y` undefined→NaN escondia o viewmodel inteiro em headless (`|| 0`).

**FASE 2 (IK 3ª pessoa + tela de seleção) — ✅ ENTREGUE**: `ctrl.ikL` (chain LeftArm→LeftForeArm→LeftHand) resolvido no guarda-mão da arma montada após o mixer em `CharController.update` (glbchars.js) — vale p/ bots E preview da seleção (main.js agora dirige `pv.ctrl.update` em vez de mixer cru). Select: mão esquerda agora SEGURA o guarda-mão; pistola sai da altura do rosto. Pendência conhecida: pistoleiros na seleção ainda fazem pose de 2 mãos (só há clipe de rifle; precisa clipe 1-mão no futuro). Team-switch (M) mantém os braços do char original até reload.

**FASE 4 (gráfico/som) — ✅ ENTREGUE**: sons REAIS CC0 por arma (Freesound qubodup, `public/audio/cc0/` completo, SOURCES.md) — `manifest.default.json` (produção) e `manifest.json` (dev) apontam p/ cc0 (AWP→sniper-fps, mosin→sniper-field, ak/akm→ak47, g3→g3, m4→m16, shotgun→shotgun-fp, pistolas→gunshot-pistol, reloads rifle/sniper). Bloom leve: `public/js/bloom.js` (novo) faz patch em `renderer.render` — EffectComposer por cena (RenderPass→UnrealBloomPass 0.25/0.45/0.85→OutputPass; OutputPass é OBRIGATÓRIO no r160 p/ ACES/sRGB; raw restaurado durante composer.render p/ não recursar). Ligado por padrão, pulado em quality 'low'. Vendor novo: `public/vendor/addons/postprocessing/` + `shaders/` (three 0.160 jsdelivr).

**FASE 3 (bots) — ✅ ENTREGUE**: a maioria já existia na branch (lanePref, exploração 40% far-node, anti-moonwalk c/ backpedal reverso, stuck-sidestep) — verificado c/ vídeos before/after (`/tmp/fase3/`, rotas se espalham em leque ✓). O que faltava, "olhar pra baixo", foi corrigido em **malha fechada**: `ctrl.aimPitch` (game.js, pitch pro alvo) → em `CharController.update` (glbchars.js) mede o pitch REAL do olhar (eixo +Z da cabeça em mundo) e gira o osso Head pela DIFERENÇA (clamp ±0.5 rad ≈ 28°, suavizado dt*6, só quando aimPitch definido = bots; seleção/FP intocados). Medido ao vivo: clipes assavam ~12-28° de tilt pra baixo; correção converge pra 0.202-0.5 conforme o char.

**RODADA 5 — CS v2 alpha (correções finais) — ✅**:
- **Roster CORRIGIDO** (eu tinha lido ao contrário na rodada 2): saem Tia Zilá e Influencer de Dubai; voltam **Canarinho Pistola e Leão do Proerd** (GLBs restaurados via `git checkout 6063150`). Time B = caminhoneiro, sertanejo, coach, farialimer, bombado, dollynho, ancap, canarinho, proerd (9×9 com P). Lição: "substituir X por Y" em PT é ambíguo — confirmar sempre quem sai.
- **Stance**: idle/walk trocados pelas variantes **não-aim** (`rifle_idle_1`, `rifle_walk_1` — a aim/bladed deixava os chars corcundas). Re-retarget pelo `tools/retarget-mixamo.mjs` (EXPORT map editável). Novo `WALK_REF 1.43→0.84` (medido via stance-speed). run/crouchwalk mantidos (2.08/0.75).
- **ikL skip pra mascotes** (`IK_L_SKIP` no glbchars): dollynho, gotinha, et, canarinho — braços-toco viravam mão gigante flutuando (caso do Dollynho no select).
- **fpArm/frontHand esbeltados** (palma 0.036→0.030, dedos mais longos/finos, antebraço mais magro, escala fallback 0.85) — adeus "blocão redonda".
- **walk1h** (`pistol_aim_walk` do mirror) entregue — mata o 404 e dá walk de 1 mão pros pistoleiros.
- gripError ≤ 0.0014, build ✓, select B verificado (Proerd/Canarinho/Dollynho).
- **Seleção**: correção da cabeça volta a ser SÓ nos bots (em todos deixava esquisito) — preview com a pose natural do clipe reparado.
- **Roster**: Proerd e Canarinho REMOVIDOS a pedido do usuário (time B fica Tia Zilá + Influencer). GLBs deletados, mint-assets.json anotado, 18 arquétipos.
- **Dollynho inteiro no placar**: framing por **bounding sphere skinned-aware** (r160) no `_tickDolly` — quadril NÃO serve de referência nesse rig (fica a 1.75m).
- **Mãos FP proporcionais**: `FP_SCALE=0.93` em fparms.js (?fps= tunável), CCD iterations 8→14, L_OFF baixado, ARM_MOUNTS z restaurado (-0.42/-0.36/-0.36), mão procedural fallback escalada 0.85. gripError ≤ 0.002 (faca 0.02). Licão: escala corporal e distância da arma afetam o ALCANCE do IK — medir gripError a cada ajuste.
- **Pendente registrado**: mira ADS ainda cruza a manga esquerda levemente (precisa IK com pole-vector no cotovelo); mão "blocão redonda" dos chars fallback é o fpArm procedural (design — props fundidos no GLB).
- **Pacote Mixamo rifle ADOTADO como padrão** (`models/anims/mixamo/`, 8 estados, fonte S-N-D-R/UnityMixamoLibrary + `tools/retarget-mixamo.mjs` novo): rifle-hold real em TODOS os estados (stance bladed ~40°), death com queda real, crouch tático. REFs recalibrados medidos: `WALK_REF 0.79→1.43, RUN_REF 1.92→2.08, CROUCH_REF 0.83→0.75`. `ANIM_DIR` default trocado no glbchars.js (override: ?animdir=models/anims). gripError até melhorou (≤0.001). Aposentado: clips Meshy antigos (backup em models/anims/ na raiz).
- **Cabeça dobrando até sumir (seleção/idle)**: causa raiz = `idle.glb` com TODOS os keyframes no tempo 0 (duração zero → `action.time=NaN` → mixer não escreve nenhum osso) + HEAD_UP open-loop acumulando ~2°/frame. Fix duplo: (1) `idle.glb` reparado (keyframes duplicados pra [0,1.766]; backup /tmp/idle-zeroed-backup.glb); (2) correção da cabeça agora é SEMPRE malha fechada (alvo = aimPitch ?? 0; o HEAD_UP fixo foi removido do glbchars.js). Verificado: cabeça estável t=4.5s+. Lição: validar duração dos clipes com `node trackcheck` (min/max dos tempos).
- **Braços FP deformados (lençóis brancos, patas-camarão, rabo, gola)**: anatomias não-humanas não aguentam o IK. `FP_FALLBACK` agora inclui: doutora, influencer, senhora, sindicato (props fundidos), canarinho (ave), **gotinha (gota), et (alien), dollynho (garrafa), proerd (patas+rabo)** e **bozo (gola-gargantilha invade o quadro em qualquer ?fpy=)**. mst e humanoides normais mantêm braços reais IK. Verificado com screenshots por char.
- **Idle de 1 mão p/ pistolas (idle1h) — ✅ ENTREGUE**: clipe `Gesture_with_Hand_on_Gun` (Meshy action 292, set pistol_combat no bozo v1, 6.17s) strippado c/ `tools/strip-anim.mjs` → `models/anims/idle1h.glb` (raiz, p/ override) e `models/anims/mixamo/idle1h.glb` (padrão). Wiring em glbchars.js: `OPT_STATES=['idle1h','walk1h']` (load opcional, falha silenciosa = fallback 2 mãos), `ctrl.oneHanded = ONE_HANDED.has(opts.weaponId)`, máquina de estados troca idle→idle1h (walk→walk1h quando existir). Pistoleiros (esquerdomacho, coach…) não ficam mais com a arma na altura do rosto + mão L vazia: seguram a pistola só na mão D, L no quadril. **walk1h ENTREGUE na rodada 5** (`pistol_aim_walk` retargetado do mirror Mixamo; o walk "Walk_Forward_While_Shooting" do set Meshy foi rejeitado por recuo baked-in). Validar clipes novos com `node tools/check-clip.mjs` (ossos/duração/root-motion). Verificado: botview before/after, seleção, bot em jogo (roundEnd), gripError ≤ 0.0007.

## Branch e commits recentes (tudo verificado em jogo, 0 erros)

Branch: `feat/evio-feel`. Commits desta sessão (mais novos primeiro):
- `d949204` **loadout**: (1) knife com a lâmina pra frente; (2) arsenal COMPLETO no respawn em 4 fileiras por tipo (snipers/rifles/bullpups-SMG/pistolas), sem arma espalhada (removido drop de bot); (3) player spawna com a arma da tela de seleção; (4) slot-memory (tecla 1 = última primária, 2 = última pistola).
- `c3dbbc9` **armas invertidas rodada 2**: +5 (tavor, uzi, m400, p90, revolver38) via medição OBJETIVA.
- `04459e2` **armas invertidas rodada 1**: 6 (ak, m92, g3, md97, rem700, mosin).
- `3310d9a` **partículas GPU batched** (flash+puff em 1 draw call; tracers pooled).
- `36d9bc8` **mount da arma** = média antebraço→mão na walk (cano pra frente em todos os rigs).
- `7a36aaa` **dedos curvando** na empunhadura (curl bones nos 17).

## Aprendizados-chave (NÃO repetir erros)

- **Orientação de arma**: NUNCA julgar à olho em render pequeno (eu errei nas bullpups). Usar a **medição objetiva** do `weapontest.html` (seção transversal: cano=fino, coronha=grossa) — `node tools/eval/weapon-capture.mjs`. `weaponModel()` em `weapons.js` tem `rot` POR ARMA; alimenta 1ª E 3ª pessoa.
- **Verificação**: sempre com evidência (screenshot/métrica/vídeo) antes de declarar pronto. Tools em `tools/eval/`: `weapon-capture`, `mount-capture` (usa `public/mounttest.html`), `walk-video`, `fx-test`, `loadout-test`, `stance-speed`.
- **Clipes**: os atuais são Meshy **in-place** (plantam o pé: walk vFoot 0.78). O retarget UE5 foi **aposentado** (fonte root-motion, sem in-place → patina). Backups em `/tmp/backup-*-meshy.glb`.
- **Sem API keys** de Tripo/Gemini/ElevenLabs. **Mint** = via MCP (ver abaixo).
- Usuário testa em `localhost:4321` (Astro). Servidor de teste meu: `node tools/eval/serve.mjs 8123`.

## Mint MCP — conexão pendente (FAZER PRIMEIRO)

Criei `.kimi-code/mcp.json` com o servidor `mint` (`https://mcp.mint.gg/mcp`). Pra ativar:
1. **`kimi resume`** desta sessão (MCP só carrega no startup; resume mantém o histórico).
2. `/mcp-config login mint` → OAuth no navegador (uma vez).
3. `/mcp` pra confirmar `mint` conectado → aí tenho as tools `mcp__mint__*`.

## Plano ev.io (prioridade do usuário) — próximos passos

1. **FASE 1 — mãos/braços em 1ª pessoa** (maior salto visual; hoje são cápsulas). Viewmodel com braço+mão real por personagem + animações draw/reload/switch. Via Mint (se conectar) ou Mixamo/Sketchfab grátis.
2. **FASE 2 — holds/IK + andar**: IK da mão de apoio no guarda-mão (`handik.js` existe) integrado no `buildCharacterModel`; isso resolve a **tela de seleção** (mão esquerda vazia em pistola — hack de osso foi revertido por piorar). Walk/run melhores (in-place).
3. **FASE 3 — bots**: rotas variadas (hoje mesmo caminho), moonwalk, olhar pra baixo.
4. **FASE 4 — gráfico/som**: bloom leve, **som por arma** (nagant/AKM/AK74/G3/M92 reais, não CS).
5. **FASE 5 — +3 personagens**: usuário tem 3 ideias. `ASSETS-PROMPTS.md` tem o formato pronto (10 arquétipos) pra gerar no Mint.

## Pendências abertas

- Tela de seleção: arma na altura do rosto + mão esquerda vazia (arma 1 mão). Causa: só há clipe de rifle. Conserto = Fase 2 (IK) ou clipe de 1 mão. NÃO tentar rotação de osso (piora).
- Usuário vai mandar as 3 ideias de personagem.
