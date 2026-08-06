-- Migration 011 — SEGURANÇA (pré-release v2)
--
-- Fecha três furos catalogados na auditoria, SEM renomear nenhuma entidade
-- (a ofuscação de schema é opcional e vive em supabase/opcional/, não aqui):
--
--   §1  players.token é legível pela ANON KEY  -> ranking forjável
--   §2  submit_log guarda IP bruto e promete 7 dias de retenção, sem job
--   §3  rate limit vive em Map na memória da lambda -> some no cold start
--
-- É IDEMPOTENTE: pode rodar mais de uma vez. Rollback no fim do arquivo,
-- comentado.
--
-- =============================================================================
-- §1 — O TOKEN NÃO PODE SER LIDO PELA ANON KEY
-- =============================================================================
-- O que estava errado (supabase/schema.sql:38 + :60-62):
--
--     alter table public.players enable row level security;
--     create policy "players: leitura pública" on public.players
--       for select using (true);
--
-- RLS controla QUAIS LINHAS, não QUAIS COLUNAS. Com a anon key (pública por
-- design, servida em /api/config) qualquer pessoa fazia
--
--     GET /rest/v1/players?select=nick,token
--
-- e recebia o par (nick, token) do ranking inteiro. Com esse par dá pra chamar
-- /api/submit-match no lugar de outro jogador: o RPC submit_match valida
-- exatamente `nick + token` (schema.sql:131) e nada mais. Ou seja: o ranking
-- inteiro era forjável por qualquer um, sem cheat no cliente.
--
-- A CORREÇÃO MENOS INVASIVA é privilégio por COLUNA. Não renomeia tabela, não
-- muda nome de coluna, não mexe em RPC, não muda nenhuma rota do site (todas
-- usam service_role, que tem grants próprios e não é afetada aqui).
--
-- ORDEM IMPORTA: revoke primeiro (derruba o grant "tabela inteira" herdado do
-- `alter default privileges` do Supabase), depois grant coluna a coluna.

revoke select on public.players from anon, authenticated;

grant select (
  id, nick, social_link, socials, avatar_url, auth_user, hidden,
  flagged_count, created_at
) on public.players to anon, authenticated;

-- CUIDADO OPERACIONAL: depois disto, `select=*` em public.players com a anon
-- key passa a devolver 42501 (permission denied) — PostgREST expande `*` para
-- a tabela inteira e o token não está mais na lista. Quem usar a anon key
-- direto tem que ler a VIEW abaixo, que é a superfície pública suportada.
-- (Auditado em 2026-08-03: nenhum arquivo de public/js/ nem de src/ consome a
--  anon key hoje — o único emissor é GET /api/config, sem consumidor.)

create or replace view public.players_public as
select id, nick, social_link, socials, avatar_url, hidden, created_at
from public.players;

-- security_invoker = on faz a view respeitar a RLS de quem chama, em vez de
-- rodar com os poderes do dono. Sem isto, a view viraria um bypass de RLS.
-- (Postgres 15+; o Supabase está em 15+. Em banco antigo, o alter falha e a
--  view continua válida — só passa a rodar como o dono, que aqui é o mesmo
--  resultado, porque a policy de players é `using (true)`.)
do $$
begin
  execute 'alter view public.players_public set (security_invoker = on)';
exception when others then
  raise notice 'security_invoker indisponível nesta versão do Postgres — seguindo';
end $$;

grant select on public.players_public to anon, authenticated;

-- Cinto e suspensório: submit_log NUNCA pode ser lido pelo cliente (tem IP).
revoke all on public.submit_log from anon, authenticated;

-- Índice que o rate limit por IP do submit_match usa em TODO submit
-- (schema.sql:141 e :145 fazem max(created_at) e count(*) filtrando por ip).
-- Sem ele é seq scan na tabela que mais cresce do banco — é um vetor de DoS
-- barato: basta submeter muito pra deixar a validação lenta pra todo mundo.
create index if not exists submit_log_ip_created_idx
  on public.submit_log (ip, created_at desc);

-- =============================================================================
-- §2 — RETENÇÃO DE 7 DIAS DO submit_log (a promessa que não tinha job)
-- =============================================================================
-- schema.sql:84-85 promete "retenção 7 dias — apagar registros velhos
-- periodicamente". Nenhuma migration apagava nada. IP é dado pessoal sob LGPD:
-- guardar indefinidamente um dado que a própria doc diz que é temporário é o
-- pior dos dois mundos (risco jurídico + tabela crescendo sem teto).

create or replace function public.purge_submit_log(p_days int default 7)
returns integer language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  delete from submit_log where created_at < now() - make_interval(days => p_days);
  get diagnostics v_n = row_count;
  return v_n;
end $$;

revoke all on function public.purge_submit_log(int) from anon, authenticated;

-- Agenda diária às 04:00 UTC (01:00 em Brasília). pg_cron é uma extensão que o
-- Supabase oferece mas NÃO habilita sozinho. O bloco abaixo agenda se ela já
-- estiver instalada e, se não estiver, avisa em vez de quebrar a migration.
do $do$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('purge_submit_log')
      where exists (select 1 from cron.job where jobname = 'purge_submit_log');
    perform cron.schedule('purge_submit_log', '0 4 * * *',
                          $cron$select public.purge_submit_log(7)$cron$);
    raise notice 'purge_submit_log agendado no pg_cron (04:00 UTC)';
  else
    raise notice 'pg_cron NÃO instalado. Habilite em Database > Extensions e rode: select cron.schedule(''purge_submit_log'', ''0 4 * * *'', $cron$select public.purge_submit_log(7)$cron$);';
  end if;
end $do$;

-- =============================================================================
-- §3 — RATE LIMIT DURÁVEL, SEM INFRA NOVA
-- =============================================================================
-- src/pages/api/register.ts:8 e src/pages/api/submit-match.ts:11 guardam os
-- contadores num `new Map()` no módulo. Na Vercel cada invocação pode cair numa
-- instância nova (cold start) e cada instância tem o Map dela: o atacante que
-- abre 10 conexões em paralelo ganha 10 orçamentos independentes, e um curto
-- intervalo entre requests já garante instâncias diferentes. Ou seja: o limite
-- existe no código e não existe na prática.
--
-- A única memória compartilhada que este projeto JÁ TEM é o Postgres. Nada de
-- Redis, nada de Upstash, nada de conta nova: um bucket contado em tabela.
-- Custo por chamada = 1 upsert num índice primário.

create table if not exists public.rate_limit (
  bucket      text not null,          -- 'register' | 'heartbeat' | 'avatar' | ...
  subject     text not null,          -- ip, nick, ou o que fizer sentido
  window_start timestamptz not null,
  hits        int not null default 0,
  primary key (bucket, subject)
);
alter table public.rate_limit enable row level security;   -- sem policy: só o servidor
revoke all on public.rate_limit from anon, authenticated;

-- Devolve TRUE se a ação está liberada, FALSE se estourou o teto.
-- Janela fixa (não deslizante) — mais barata e suficiente pra barrar automação.
create or replace function public.rl_take(
  p_bucket text, p_subject text, p_limit int, p_window_secs int
) returns boolean language plpgsql security definer set search_path = public as $$
declare v_hits int;
begin
  if p_subject is null or p_subject = '' then return true; end if;

  insert into rate_limit (bucket, subject, window_start, hits)
  values (p_bucket, p_subject, now(), 1)
  on conflict (bucket, subject) do update set
    window_start = case when rate_limit.window_start < now() - make_interval(secs => p_window_secs)
                        then now() else rate_limit.window_start end,
    hits         = case when rate_limit.window_start < now() - make_interval(secs => p_window_secs)
                        then 1 else rate_limit.hits + 1 end
  returning hits into v_hits;

  return v_hits <= p_limit;
end $$;

revoke all on function public.rl_take(text, text, int, int) from anon, authenticated;

-- Limpeza dos buckets velhos junto do purge do log (mesma janela de cron).
create or replace function public.purge_rate_limit()
returns integer language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  delete from rate_limit where window_start < now() - interval '1 day';
  get diagnostics v_n = row_count;
  return v_n;
end $$;

revoke all on function public.purge_rate_limit() from anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('purge_rate_limit')
      where exists (select 1 from cron.job where jobname = 'purge_rate_limit');
    perform cron.schedule('purge_rate_limit', '20 4 * * *',
                          $cron$select public.purge_rate_limit()$cron$);
  end if;
end $$;

-- =============================================================================
-- §4 — NENHUM RPC PODE SER CHAMADO PELA ANON KEY
-- =============================================================================
-- DESCOBERTO TESTANDO ESTA MIGRATION num Postgres 16 limpo, e é o achado mais
-- sério depois do token: no Postgres, TODA função nasce com `execute` concedido
-- ao pseudo-papel PUBLIC. `revoke ... from anon, authenticated` NÃO tira isso —
-- o privilégio vem por PUBLIC, e anon continua executando.
--
-- E o PostgREST publica toda função executável do schema exposto como
-- `POST /rest/v1/rpc/<nome>`. Ou seja, com a anon key dava pra:
--
--   POST /rest/v1/rpc/_flag           {"p_nick":"<vitima>"}
--     -> +1 flag por chamada. Com 3 chamadas, `_flag` (schema.sql:99) marca
--        hidden = true e o jogador SOME do ranking. É moderação automática
--        acionável por qualquer um: griefing de um curl.
--
--   POST /rest/v1/rpc/submit_match    {...}
--     -> submete partida SEM passar por /api/submit-match, e portanto sem o
--        `p_ip` (que é default null) — o rate limit por IP e o teto de 200/dia
--        do próprio RPC ficam desligados, porque os dois só rodam quando p_ip
--        não é nulo (schema.sql:140).
--
--   POST /rest/v1/rpc/register_player -> nick squatting sem passar pelo limite
--        de 10/min por IP da rota.
--
-- Nenhum cliente precisa desses RPCs: TODAS as rotas do site chamam com
-- service_role. Então: revoke de PUBLIC, grant explícito só pra service_role.

do $do$
declare f record;
begin
  for f in
    select p.oid::regprocedure::text as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('register_player', 'submit_match', '_flag',
                        'rl_take', 'purge_submit_log', 'purge_rate_limit')
  loop
    execute 'revoke all on function ' || f.sig || ' from public, anon, authenticated';
    execute 'grant execute on function ' || f.sig || ' to service_role';
  end loop;
end $do$;

-- =============================================================================
-- COMO TESTAR (staging, nunca produção primeiro)
-- =============================================================================
-- 1) O furo do token, com a anon key:
--      curl -s "$SUPABASE_URL/rest/v1/players?select=nick,token" \
--           -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
--    ANTES : 200 e a lista de tokens.
--    DEPOIS: 403 {"code":"42501","message":"permission denied for table players"}
--
-- 2) O que continua funcionando com a anon key:
--      curl -s "$SUPABASE_URL/rest/v1/players_public?select=nick,avatar_url" ...
--      curl -s "$SUPABASE_URL/rest/v1/leaderboard?select=*" ...
--    Os dois seguem 200. (leaderboard nunca expôs token.)
--
-- 3) O site inteiro continua igual: /ranking, /u/*, /api/* usam
--    SUPABASE_SERVICE_ROLE_KEY, que não teve nada revogado.
--
-- 4) Retenção:  select public.purge_submit_log(7);   -- devolve nº de linhas
--    Agenda:    select jobname, schedule from cron.job;
--
-- 5) Rate limit (como service_role / no SQL Editor):
--      select public.rl_take('teste','1.2.3.4',3,60);  -- t, t, t, f, f...
--
-- 6) Os RPCs fechados pra anon (§4):
--      curl -sX POST "$SUPABASE_URL/rest/v1/rpc/_flag" -H "apikey: $ANON" \
--           -H 'content-type: application/json' -d '{"p_nick":"qualquer"}'
--    ANTES : 200/204 e o jogador ganha uma flag (3 = some do ranking)
--    DEPOIS: 404 (o PostgREST deixa de enxergar a função) ou 42501
--    O mesmo para /rpc/submit_match e /rpc/register_player.
--    E o site continua funcionando: ele chama tudo com service_role.
--
-- =============================================================================
-- ROLLBACK (cole no SQL Editor se algo quebrar)
-- =============================================================================
-- grant select on public.players to anon, authenticated;
-- drop view if exists public.players_public;
-- select cron.unschedule('purge_submit_log');
-- select cron.unschedule('purge_rate_limit');
-- drop function if exists public.purge_submit_log(int);
-- drop function if exists public.purge_rate_limit();
-- drop function if exists public.rl_take(text, text, int, int);
-- drop table if exists public.rate_limit;
-- drop index if exists public.submit_log_ip_created_idx;
-- -- §4 (só se algum cliente legítimo de anon key aparecer — improvável):
-- grant execute on function public.register_player(text, uuid, text) to public;
-- grant execute on function public._flag(text) to public;
--
-- O rollback do §1 REABRE o furo do token. Só use se o revoke tiver derrubado
-- um consumidor de anon key que a auditoria não encontrou — e nesse caso, o
-- certo é apontar esse consumidor para public.players_public, não desfazer.
