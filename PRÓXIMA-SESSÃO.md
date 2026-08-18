# Handoff para a proxima sessao — 18/08/2026

## O que foi feito nesta sessao (Devin)

### PRs mergeadas (8 PRs, todas via rebase + novo PR)
- #329, #323, #291, #288, #305, #267, #306, #312, #326
- Conflitos resolvidos em maps.js, main.js, package.json, docs gerados
- check:fast 53/53 VERDE apos todos os merges

### Bug do Firefox corrigido e pushado na main
- WASD abria Quick Find no Firefox em vez de mover o personagem
- Fix: `e.preventDefault()` quando `document.pointerLockElement` ativo
- Arquivo: `public/js/game.js` linha ~1630
- Commit: `fix(input): preventDefault em pointer lock impede Quick Find do Firefox`

### Issues do estraga-codigo limpas
- Fechadas: #322, #336, #340, #321, #319, #318 (todas resolvidas pelo trabalho de merge)
- Abertas (legitimas): #327 (pickups), #325 (decals ashtar.png 404), #320 (ronda de estado)
- Bug de dedupe do bot ja estava corrigido — duplicatas vieram do periodo de transicao (issues antigas sem marcador `<!-- vigia: -->`)

### KNOWN-RED.json atualizado
- MAT2 e TEX1 adicionados como divida conhecida (mapas Velho Oeste e Penitenciaria)

### eval:fixture corrigido
- `scripts/ci/check_automerge.py` — fixture esperava `needs-greptile-resolution` mas codigo so checava `needs-coderabbit-resolution`

---

## O que falta fazer (plano aprovado pelo Ruben)

### 1. Branch protection no corosolto/client [PRIORIDADE ALTA]
- Hoje: ZERO protecao na main, qualquer push direto funciona
- Fazer: PR obrigatorio + checks verdes (sem review obrigatorio)
- Como: rulesets via GitHub API (org publica suporta)
- Checks requeridos: os que rodam no CI de PR (`pr-fast`, `pr-gates`)

### 2. Limpar package.json [PR separado]
- 138 scripts (70 comentarios `//` + 68 executaveis)
- Mover documentacao dos `//` para um `SCRIPTS.md`
- Corrigir indentacao inconsistente (algumas chaves `//` sem indent)
- Remover `check` legado (usa `&&`, substituido por `check:fast`)

### 3. Reescrever README [PR separado]
- Hoje parece relatorio de engenharia interno
- Precisa: screenshot do jogo, "o que e" em 2 linhas, como jogar, como contribuir
- Feedback do jogador: "conteudo mais humano"
- AGENTS.md fica tecnico (e pra agentes), README vira humano

### 4. Admin panel — panel.csbrasil.online [PRs no csbrasil-admin]
- Repo: `rubenmarcus/csbrasil-admin` (privado)
- Stack: Astro SSR + React + Tailwind + Supabase + Recharts
- Ja tem: 12 paginas (erros, online, jogo, feedback, inteligencia, geografia, conversao, picks, usuarios, saude, login, perfil)
- Ja tem: auth (senha + Google OAuth + GitHub OAuth com allowlist)
- Ja tem: sinais deterministicos, IA via OpenRouter, relatorio diario
- Falta:
  - Mover para org `corosolto` (hoje esta em `rubenmarcus`)
  - CI basico: lint + typecheck + test no PR
  - Apontar dominio `panel.csbrasil.online`
  - Branch protection

### 5. Backend separado [futuro, so planejar]
- 18 APIs em `src/pages/api/` -> migrar para repo `corosolto/backend`
- 4 paginas SSR (ranking, mapa, perfil, sitemap) fazem query Supabase direto
- O repo client ficaria so com site Astro + jogo Three.js (zero service_role)
- Decisao do Ruben: novo repo backend

### 6. Bot Discord + Telegram [criar do zero]
- NAO existe bot do Emerson — procurei em todos os repos publicos dele (69 repos), no diretorio local, nas issues/PRs
- Servidor Discord existe: `discord.gg/MJq7Csam`
- Features pedidas:
  1. Status diario de jogadores e gameplay
  2. Releases novos e merges novos
  3. Novos contribuidores como motivo de festa
  4. Release como motivo de festa
  5. Issues abertas
  6. O que for mais util pro Discord
- Mesmas features pro Telegram
- Stack sugerida: discord.js + Telegraf/grammY, repo `corosolto/discord-bot`

---

## Inventario de APIs do client (para migracao futura)

### Telemetria (anonimas)
- `acquisition.ts` POST — origem do jogador (referrer, UTM)
- `funnel.ts` POST — etapa do funil (land/menu/match_start/match_end/quit)
- `telemetry.ts` POST — quanto se joga e em qual mapa
- `match.ts` POST — evento rico de partida
- `perf.ts` POST — amostra de FPS/boot/dispositivo
- `pick.ts` POST — contadores de escolha (mapa, modo, faccao, arma)
- `presence.ts` POST — "estou com o jogo aberto"
- `jserror.ts` POST — excecao do navegador
- `heartbeat.ts` POST — presenca online com geo

### Jogador (autenticadas por token)
- `register.ts` POST — registra nick + token
- `submit-match.ts` POST — submete partida
- `avatar.ts` POST — upload de avatar (sharp 128x128)
- `train-frames.ts` POST — lotes opt-in para treino de bots

### Leitura publica
- `leaderboard.ts` GET — ranking top 100
- `online.ts` GET — quantos jogadores online
- `health.ts` GET — saude do banco
- `feedback.ts` POST — feedback + email + newsletter

### Imagem dinamica
- `badge/[...path].png.ts` GET — badge PNG do jogador
- `og/[tipo].png.ts` GET — OG:image para mapas/armas/personagens

### Dependencias criticas
- `src/lib/supabase.ts` — client com service_role
- `src/lib/ratelimit.ts` — rate limit via RPC `rl_take`
- `src/lib/player-identity.ts` — resolucao UID/token/nick
- Env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GH_DISPATCH_TOKEN`

---

## Bots locais do Ruben (contexto)

### /Users/ruben/estraga-codigo/
- Conta `estraga-codigo` no GitHub (Outside Collaborator, Read)
- `canarinho.mjs` — revisor de PR por LLM, 5 acoes (leis-da-casa, mapas, frontend-publico, backend-api, ci-portoes)
- Modos: selftest, replay, review, fix, poll, commits
- Dedupe por marcador `<!-- vigia: checagem -->` no body da issue

### /Users/ruben/game3/bots/vigia-prod/
- `plantao.mjs` — vigia producao, abre issues quando checks falham
- Conta: `estraga-codigo`
- Marcador: `<!-- vigia: checagem -->`

### /Users/ruben/game3/bots/zelador/
- `ronda.mjs` — ronda diaria/semanal (audit-cve, assert-assets, ronda-semanal)
- Conta: `estraga-codigo`
- Marcador: `<!-- zelador: checagem -->`
- launchd: `br.corosolto.zelador-diaria` (9h) e `br.corosolto.zelador-semanal` (seg 9:30)

---

## Estado do quality gate
- check:fast: **53/53 VERDE**
- KNOWN-RED.json: MAT2 (Velho Oeste, Penitenciaria), TEX1 (Velho Oeste, Penitenciaria)
- Versao: `2.0.0-alpha.148`
