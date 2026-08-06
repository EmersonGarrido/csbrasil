# supabase/

Esta pasta é pública **de propósito** — e deve continuar assim.

## O que pode ficar aqui (seguro)

- `schema.sql` e migrations: estrutura de tabelas, RPCs, policies, views.
  Publicar schema NÃO enfraquece a segurança: as defesas (RLS, validação de
  token nos RPCs, rate limits) não dependem de segredo — um atacante já
  descobriria os endpoints observando o tráfego do client de qualquer forma.

## O que NUNCA pode entrar aqui (ou em qualquer lugar do git)

- `.env` / `.env.*` (ignorados globalmente no `.gitignore`)
- `service_role` key, senha do banco, connection strings com senha
- chaves de API de terceiros

A `service_role` e a `SUPABASE_URL` vivem **só** nas env vars da Vercel.
A `anon` key do client é pública por design — a segurança vem do RLS,
não de esconder a chave.

Se um segredo for commitado por acidente: **revogue imediatamente**
(Project Settings → API → regenerate) e reforce as envs na Vercel —
apagar o commit não basta, o histórico do git preserva.

---

## Como aplicar

O `schema.sql` é **idempotente e auto-curativo**: rodar ele inteiro no SQL
Editor traz qualquer versão anterior do banco para a forma atual, e é o caminho
oficial de recuperação. As migrations numeradas existem para registrar *quando*
cada coisa mudou, não como caminho alternativo.

```
001..010   evolução até a v1 (stats, storage, playtime, geo, anti-cheat…)
011        SEGURANÇA — aplique esta antes de qualquer coisa no dia do release
opcional/  ofuscação de schema: entregue pronta, NÃO aplicada
```

**Ordem no dia do release:**

1. Backup (Database → Backups).
2. Rode `011_seguranca_token_retencao_ratelimit.sql` em **staging**.
3. Teste: `/ranking`, `/u/<id>/<nick>`, `/api/badge/<id>.png`, uma partida completa.
4. Repita em produção.
5. Se o `pg_cron` não estiver habilitado, a migration avisa e imprime o comando
   de agendamento — habilite em Database → Extensions e rode o comando.

A 011 é **compatível nos dois sentidos** com o código: o site funciona com ela
aplicada ou não (o `rl_take` faz fail-open se o RPC não existir). Dá pra fazer
SQL e deploy em ordens diferentes sem janela de erro.

**Verificado em Postgres 16 limpo (2026-08-03):** o ciclo
`schema.sql` ×2 → `011` ×2 → `opcional/012` → `ROLLBACK` → `schema.sql` roda sem
erro, preserva os dados e mantém as travas de anon em toda etapa.

## O que a 011 muda no comportamento

| Antes | Depois |
|---|---|
| `GET /rest/v1/players?select=*` com anon key | **42501** — leia `players_public` |
| `GET /rest/v1/players?select=nick,token` | **42501** |
| `POST /rest/v1/rpc/_flag` com anon key | **404** (fechado; era griefing de ranking) |
| `POST /rest/v1/rpc/submit_match` com anon key | **404** (fechado; pulava o rate limit por IP) |
| `GET /rest/v1/leaderboard` | igual, 200 |
| tudo com `service_role` | igual |

Detalhe completo: [`../docs/seguranca.md`](../docs/seguranca.md).
