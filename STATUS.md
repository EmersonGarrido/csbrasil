# STATUS — onde o projeto está hoje

**v2.0.0-alpha.4 · 2026-08-04 · ALPHA — bug conhecido em aberto**

> O número era `3.3.0` e virou `2.0.0-alpha.4` em 04/08. "v3" nunca existiu como coisa
> publicada: o contador saltou de 1.15.0 para 3.1.0 e nenhuma das entradas 3.x tem tag git
> (a última é `v1.12.4`). A escada de agora — alpha → beta → release, com o critério de
> saída de cada degrau — está no topo do [`CHANGELOG.md`](CHANGELOG.md). **Isto é alpha:**
> os defeitos abertos estão em [`KNOWN-BUGS.md`](KNOWN-BUGS.md).

Este arquivo é o estado ATUAL, e só ele. Ele substituiu o topo do
`HANDOFF-KIMI.md` (84 KB de log append-only fazendo papel de estado), que virou
histórico em [`docs/historico/HANDOFF-KIMI.md`](docs/historico/HANDOFF-KIMI.md).
**Regra:** este arquivo não passa de 100 linhas. Quando uma entrada envelhece,
ela desce pro histórico — não fica.

## O que o jogo é hoje

FPS de navegador em Three.js, vanilla, sem build. **5 facções · 44 personagens ·
5 mapas · 26 armas · rounds 4×4 contra bots · Capture the Flag.** Site Astro com
SSR na Vercel, ranking global no Supabase, uma página pública por jogador com
badge PNG gerada em runtime.

## Régua vigente (a ordem importa)

`tools/eval/BAR-CONSISTENCIA.md` **tem precedência** sobre `tools/eval/BAR.md`.
Decisão do dono depois de 3 dias jogando: melhoria visual que quebra o jogo é
regressão. A ordem é: **sem bug perceptível > flow > legibilidade > identidade >
beleza.**

## Portão de qualidade

```bash
npm run check     # sintaxe de public/js + invariants + vm + kick + botsim
npm run arch      # regenera tools/eval/ARCH.md (--check no CI)
```

Nada commita com invariante vermelha. Todo bug que o dono reportar vira
invariante permanente em `tools/eval/invariants.mjs`.

> **Atenção ao rodar em worktree:** `invariants.mjs` e `vm-mint-audit.mjs` leem
> GLBs de `public/models/`. Numa árvore sem os assets baixados eles falham com
> `ENOENT` — é ambiente, não regressão.

## Frentes abertas

| Frente | Estado |
|---|---|
| Braços FP (`buildFPArms`) | **Pendência real.** A escala herdada do pipeline Tripo vira uma massa sem forma de mão. `gripErrR = 0,001 m` prova que o cálculo do grip está certo — o errado é o tamanho do braço, e é rig a refazer. Padrão hoje = **arma sozinha**; `?hands=1` religa. |
| Multiplayer 4×4 | Não começou. É a próxima grande frente (`docs/historico/` tem o plano). Enquanto isso o modelo é client-authoritative, e o anti-cheat vive no RPC `submit_match`. |
| Áudio das facções novas | Funkeiros usam a chave `F` espelhando a dos Tribos; pack próprio é follow-up. Sem a chave, o fallback é gracioso. |
| Portais (CrazyGames/itch) | `frame-ancestors` do `vercel.json` já libera os hosts. Falta o pacote de submissão. |

## Segurança — o que mudou no pré-release

- `players.token` **não é mais legível pela anon key** (privilégio por coluna,
  `supabase/migrations/011`). Era o furo que permitia forjar ranking.
- **Nenhum RPC é mais chamável pela anon key.** `/rpc/_flag` escondia qualquer
  jogador do ranking com 3 chamadas, sem token — achado testando a migration num
  Postgres limpo, não estava na auditoria.
- `schema.sql` voltou a rodar em **banco novo** (o `alter table city_daily`
  rodava antes da tabela existir e derrubava o arquivo inteiro).
- SSRF em `/api/badge` fechado por allowlist (`src/lib/safe-url.ts`).
- Rate limit saiu do `Map` em memória de lambda e passou a contar no Postgres
  (`src/lib/ratelimit.ts` + RPC `rl_take`).
- `submit_log` tem job de retenção de 7 dias (pg_cron).
- Headers de segurança no `vercel.json` (CSP, nosniff, Referrer-Policy,
  Permissions-Policy, HSTS).
- **Não aplicado, entregue pronto:** ofuscação de schema em
  `supabase/opcional/` (SQL de ida, rollback e patch das rotas).

Detalhe e como testar: [`docs/seguranca.md`](docs/seguranca.md).

## Onde mexer no quê

| Quero… | Vá em |
|---|---|
| gameplay, armas, mapas, bots | `public/js/*.js` — leia `tools/eval/ARCH.md` **antes** (tabela de conflito) |
| landing, ranking, SEO, API | `src/` (Astro) |
| ranking/banco | `supabase/` |
| arnês, medição, gates | `tools/eval/` — catálogo em `tools/eval/README.md` |

## Regra de concorrência

`public/js/game.js` é grande e **todas** as frentes precisam dele. Antes de
editar, consulte a tabela de conflito do `tools/eval/ARCH.md`, que é **gerada**
(`node tools/gen-arch.mjs`) e por isso está sempre com os números de linha
certos. Sistema interconectado (arma + mão + animação + ADS + mira + HUD) =
**um agente, sequencial**. Fan-out só para coisas independentes.

## Próximo passo

1. Aplicar `supabase/migrations/011` em staging e depois em produção.
2. Deploy do site (o `www` no `astro.config.mjs` muda todos os canonicals).
3. Enviar o `sitemap.xml` novo no Search Console.
4. Abrir as issues de `docs/issues/` no GitHub.
5. Rig dos braços FP.
