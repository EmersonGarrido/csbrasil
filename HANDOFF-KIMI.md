# HANDOFF — sessão Kimi (21/07) — estado do CS BRASIL

Documento de continuidade. Se esta for uma sessão nova, leia isto primeiro: aqui está onde paramos e o que vem a seguir.

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
