-- CS BRASIL — schema do ranking global (Fase 2, futuro)
-- Rode no SQL Editor do Supabase. Depois configure URL + anon key no client
-- (js/ranking.js, a criar) — a anon key é pública por design; a segurança
-- vem das policies abaixo, não de esconder a chave.

-- Tabela de jogadores: id UUID estável (PK, futuro link com auth.users na
-- Fase 3) + nick único (identidade anti-impersonação, estilo CS 1.6).
-- Se um dia quiser nicks duplicados (modelo BattleTag), basta dropar o
-- unique do nick — o id continua distinguindo cada jogador.
create table if not exists public.players (
  id          uuid primary key default gen_random_uuid(),
  nick        text not null unique check (char_length(nick) between 2 and 14),
  token       uuid not null,
  social_link text check (char_length(social_link) <= 60),
  socials     jsonb not null default '[]'::jsonb,   -- [{net, url}] multi-redes
  avatar_url  text,                            -- OAuth avatar ou upload no Storage
  auth_user   uuid,                            -- Fase 3: link com auth.users(id)
  hidden      boolean not null default false,  -- moderação: esconde do ranking
  created_at  timestamptz not null default now()
);

-- Stats agregadas por jogador (1:1 com players).
create table if not exists public.stats (
  nick        text primary key references public.players(nick) on delete cascade,
  matches     int not null default 0,
  wins        int not null default 0,
  rounds      int not null default 0,
  matches_p   int not null default 0,   -- partidas como Petista
  matches_b   int not null default 0,   -- partidas como Bolsonarista
  kills       int not null default 0,
  deaths      int not null default 0,
  headshots   int not null default 0,
  best_streak int not null default 0,
  play_seconds bigint not null default 0,
  updated_at  timestamptz not null default now()
);

alter table public.players enable row level security;

-- ---------------------------------------------------------------------------
-- AUTO-CURA de bancos antigos: create table if not exists NÃO adiciona
-- colunas em tabelas já existentes. Estes ALTERs são idempotentes e trazem
-- qualquer versão anterior do schema pra forma atual.
-- ---------------------------------------------------------------------------
alter table public.players add column if not exists avatar_url text;
alter table public.players add column if not exists auth_user uuid;
alter table public.players add column if not exists hidden boolean not null default false;
alter table public.players add column if not exists socials jsonb not null default '[]'::jsonb;
alter table public.players add column if not exists flagged_count int not null default 0;
alter table public.stats add column if not exists rounds int not null default 0;
alter table public.stats add column if not exists matches_p int not null default 0;
alter table public.stats add column if not exists matches_b int not null default 0;
alter table public.stats add column if not exists play_seconds bigint not null default 0;
alter table public.stats add column if not exists last_character text;
-- city_daily só é CRIADA lá embaixo (bloco de PRESENÇA & MAPA). Num banco novo
-- este ALTER rodava antes da tabela existir e o schema.sql inteiro morria com
-- `relation "public.city_daily" does not exist` — ou seja, o arquivo que a
-- documentação manda "rodar no SQL Editor" só funcionava em banco que JÁ tinha
-- passado pela migration 005. Guardado, ele é no-op no banco novo e continua
-- curando o banco antigo. (Verificado em Postgres 16 limpo, 2026-08-03.)
do $$
begin
  if to_regclass('public.city_daily') is not null then
    alter table public.city_daily add column if not exists rounds int not null default 0;
  end if;
end $$;

alter table public.stats   enable row level security;

-- Leitura pública (o ranking é público).
drop policy if exists "players: leitura pública" on public.players;
create policy "players: leitura pública" on public.players
  for select using (true);
drop policy if exists "stats: leitura pública" on public.stats;
create policy "stats: leitura pública" on public.stats
  for select using (true);

-- SEGURANÇA DE COLUNA (migration 011): a RLS acima controla LINHAS, não
-- COLUNAS — com a policy `using (true)` a anon key lia players.token e podia
-- forjar submit em nome de qualquer jogador. Privilégio por coluna resolve sem
-- renomear nada. A superfície pública suportada é a view players_public.
revoke select on public.players from anon, authenticated;
grant select (
  id, nick, social_link, socials, avatar_url, auth_user, hidden,
  flagged_count, created_at
) on public.players to anon, authenticated;

create or replace view public.players_public as
select id, nick, social_link, socials, avatar_url, hidden, created_at
from public.players;
do $$
begin
  execute 'alter view public.players_public set (security_invoker = on)';
exception when others then
  raise notice 'security_invoker indisponível nesta versão do Postgres — seguindo';
end $$;
grant select on public.players_public to anon, authenticated;

-- NADA de insert/update/delete direto: só via RPC abaixo (security definer),
-- que valida o token antes de gravar.

-- Registrar nick novo (falha se o nick já existir) ou validar token existente.
create or replace function public.register_player(p_nick text, p_token uuid, p_social text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into players (nick, token, social_link) values (p_nick, p_token, p_social)
  on conflict (nick) do nothing;
  if not exists (select 1 from players where nick = p_nick and token = p_token) then
    raise exception 'nick já está em uso';
  end if;
  if p_social is not null then
    update players set social_link = p_social where nick = p_nick and token = p_token;
  end if;
end $$;

-- Log de submits pra rate limit por IP e moderação (retenção 7 dias —
-- apagar registros velhos periodicamente; dado operacional de segurança).
create table if not exists public.submit_log (
  id         bigint generated always as identity primary key,
  nick       text,
  ip         text,
  created_at timestamptz not null default now()
);
alter table public.submit_log enable row level security;  -- sem policy pública: só o servidor lê/escreve
revoke all on public.submit_log from anon, authenticated;
-- o rate limit por IP do submit_match filtra por (ip, created_at) em TODO
-- submit; sem índice isso é seq scan na tabela que mais cresce (migration 011)
create index if not exists submit_log_ip_created_idx
  on public.submit_log (ip, created_at desc);

-- Retenção real dos 7 dias prometidos acima (migration 011 agenda no pg_cron).
create or replace function public.purge_submit_log(p_days int default 7)
returns integer language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  delete from submit_log where created_at < now() - make_interval(days => p_days);
  get diagnostics v_n = row_count;
  return v_n;
end $$;
revoke all on function public.purge_submit_log(int) from anon, authenticated;

-- Rate limit DURÁVEL (migration 011): o Map na memória da lambda some no cold
-- start; o Postgres é a única memória compartilhada que este projeto já tem.
create table if not exists public.rate_limit (
  bucket       text not null,
  subject      text not null,
  window_start timestamptz not null,
  hits         int not null default 0,
  primary key (bucket, subject)
);
alter table public.rate_limit enable row level security;
revoke all on public.rate_limit from anon, authenticated;

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

create or replace function public.purge_rate_limit()
returns integer language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  delete from rate_limit where window_start < now() - interval '1 day';
  get diagnostics v_n = row_count;
  return v_n;
end $$;
revoke all on function public.purge_rate_limit() from anon, authenticated;

-- Marca um jogador como suspeito; 3+ flags = some do ranking automaticamente.
create or replace function public._flag(p_nick text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update players set flagged_count = flagged_count + 1 where nick = p_nick;
  update players set hidden = true where nick = p_nick and flagged_count >= 3;
end $$;

-- ---------------------------------------------------------------------------
-- IMPORTANTE: "create or replace function" NÃO substitui quando a assinatura
-- muda — ele cria OVERLOADS (foi o que quebrou o submit: versões de 9/10/11
-- params coexistindo). Este bloco derruba TODAS as sobrecargas antes de
-- recriar a assinatura atual. Manter sempre aqui.
-- ---------------------------------------------------------------------------
do $$
declare f record;
begin
  for f in select p.oid::regprocedure::text as sig
           from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where p.proname = 'submit_match' and n.nspname = 'public'
  loop
    execute 'drop function if exists ' || f.sig || ' cascade';
  end loop;
end $$;

-- Submeter stats de uma partida (token + rate limits + CONSISTÊNCIA FÍSICA anti-trainer).
create or replace function public.submit_match(
  p_nick text, p_token uuid,
  p_won boolean, p_kills int, p_deaths int, p_headshots int, p_best_streak int,
  p_rounds int default 0, p_team text default null, p_seconds int default 0,
  p_character text default null, p_ip text default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_last timestamptz;
  v_ip_last timestamptz;
  v_ip_today int;
begin
  if not exists (select 1 from players where nick = p_nick and token = p_token) then
    raise exception 'token inválido';
  end if;
  -- rate limit por nick: 1 partida a cada 90s
  select updated_at into v_last from stats where nick = p_nick;
  if v_last is not null and now() - v_last < interval '90 seconds' then
    raise exception 'aguarde antes de submeter outra partida';
  end if;
  -- rate limit por IP: 60s entre submits + teto de 200/dia (anti nick-hopping)
  if p_ip is not null then
    select max(created_at) into v_ip_last from submit_log where ip = p_ip;
    if v_ip_last is not null and now() - v_ip_last < interval '60 seconds' then
      raise exception 'muitas partidas seguidas — respira um pouco';
    end if;
    select count(*) into v_ip_today from submit_log where ip = p_ip and created_at > now() - interval '1 day';
    if v_ip_today >= 200 then
      raise exception 'limite diário de partidas atingido';
    end if;
  end if;
  -- tetos absolutos (folga pra jogo real)
  if p_kills < 0 or p_kills > 150 or p_deaths < 0 or p_deaths > 150
     or p_headshots < 0 or p_headshots > p_kills or p_best_streak < 0 or p_best_streak > 30
     or p_rounds < 0 or p_rounds > 6 or p_seconds < 0 or p_seconds > 1500 then
    perform public._flag(p_nick);
    raise exception 'stats implausíveis';
  end if;
  -- CONSISTÊNCIA FÍSICA (anti-trainer):
  -- a) kills por round: respawn de 2,5s => teto teórico ~40/round; 45 com folga
  if p_kills > 45 * greatest(p_rounds, 1) then
    perform public._flag(p_nick);
    raise exception 'kills além do fisicamente possível';
  end if;
  -- b) tempo mínimo por round (~80s): speed hack não produz partida instantânea
  if p_rounds > 0 and p_seconds > 0 and p_seconds < p_rounds * 80 then
    perform public._flag(p_nick);
    raise exception 'partida rápida demais pra ser verdade';
  end if;
  if p_ip is not null then
    insert into submit_log (nick, ip) values (p_nick, p_ip);
  end if;
  insert into stats (nick, matches, wins, rounds, matches_p, matches_b, kills, deaths, headshots, best_streak, play_seconds, last_character)
  values (p_nick, 1, p_won::int, p_rounds,
          (p_team = 'P')::int, (p_team = 'B')::int,
          p_kills, p_deaths, p_headshots, p_best_streak, p_seconds, p_character)
  on conflict (nick) do update set
    matches     = stats.matches + 1,
    wins        = stats.wins + p_won::int,
    rounds      = stats.rounds + p_rounds,
    matches_p   = stats.matches_p + (p_team = 'P')::int,
    matches_b   = stats.matches_b + (p_team = 'B')::int,
    kills       = stats.kills + p_kills,
    deaths      = stats.deaths + p_deaths,
    headshots   = stats.headshots + p_headshots,
    best_streak = greatest(stats.best_streak, p_best_streak),
    play_seconds = stats.play_seconds + p_seconds,
    last_character = coalesce(p_character, stats.last_character),
    updated_at  = now();
end $$;

-- Leaderboard: top por kills, sem jogadores escondidos pela moderação.
-- (drop antes de recriar: o Postgres não aceita mudar colunas de uma view
-- existente com create or replace)
drop view if exists public.leaderboard;
create view public.leaderboard as
select p.id, s.nick, p.social_link, p.socials, p.avatar_url, s.matches, s.wins, s.rounds,
       s.matches_p, s.matches_b, s.kills, s.deaths,
       s.headshots, s.best_streak, s.play_seconds, s.last_character,
       round(s.kills::numeric / greatest(s.deaths, 1), 2) as kd
from stats s join players p on p.nick = s.nick
where not p.hidden
order by s.kills desc, s.wins desc
limit 500;

-- ---------------------------------------------------------------------------
-- PRESENÇA & MAPA ("mapa da treta ao vivo")
-- Preenchida por uma Edge Function (Deno) — RPC do PostgREST NÃO tem acesso
-- ao IP do client. A function lê x-forwarded-for, resolve GeoIP (cidade) e
-- faz upsert aqui. LGPD: NÃO guardar IP bruto — só geo aproximado (cidade),
-- com consentimento na tela de registro.
-- ---------------------------------------------------------------------------
create table if not exists public.presence (
  nick      text primary key references public.players(nick) on delete cascade,
  last_seen timestamptz not null default now(),
  city      text,
  country   text,
  lat       float8,
  lon       float8
);

alter table public.presence enable row level security;
drop policy if exists "presence: leitura pública" on public.presence;
create policy "presence: leitura pública" on public.presence
  for select using (true);

-- =============================================================================
-- STORAGE (avatars do ranking) — bucket público "avatars"; escrita só do dono
-- (nome do arquivo = <auth.users.id>.<ext>). Avatares são redimensionados pra
-- 128×128 no client antes do upload.
-- =============================================================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');
drop policy if exists "avatars owner insert" on storage.objects;
create policy "avatars owner insert" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "avatars owner delete" on storage.objects;
create policy "avatars owner delete" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- "online agora" = heartbeat nos últimos 2 minutos
create or replace view public.online_now as
select nick, city, country, lat, lon, last_seen
from presence
where last_seen > now() - interval '2 minutes';

-- Histórico AGREGADO por cidade (não por pessoa) — privacidade primeiro.
create table if not exists public.city_daily (
  day     date not null,
  city    text not null,
  country text,
  matches int not null default 0,
  rounds  int not null default 0,
  primary key (day, city)
);

alter table public.city_daily enable row level security;
drop policy if exists "city_daily: leitura pública" on public.city_daily;
create policy "city_daily: leitura pública" on public.city_daily
  for select using (true);

-- =============================================================================
-- FECHAMENTO DOS RPC (migration 011 §4) — TEM QUE FICAR NO FIM DO ARQUIVO
-- =============================================================================
-- No Postgres, toda função nasce com `execute` concedido ao pseudo-papel
-- PUBLIC, e o PostgREST publica toda função executável como
-- POST /rest/v1/rpc/<nome>. Com a anon key isso permitia:
--   * /rpc/_flag           -> 3 chamadas escondiam QUALQUER jogador do ranking
--   * /rpc/submit_match    -> submeter sem p_ip, pulando o rate limit por IP e
--                             o teto diário (que só rodam com p_ip não nulo)
--   * /rpc/register_player -> nick squatting sem o limite de 10/min por IP
-- Nenhuma rota do site precisa disso: todas chamam com service_role.
-- `revoke ... from anon` sozinho NÃO resolve — o privilégio vem por PUBLIC.
--
-- Fica no FIM porque revoga por assinatura descoberta no catálogo: precisa que
-- todas as funções acima já tenham sido criadas.
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
