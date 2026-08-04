-- Migration 012 — TELEMETRIA (ranking desligado, medição ligada)
--
-- Decisão do dono (04/08/2026): "vamos desabilitar o ranking por enquanto,
-- depois a gente ajeita; vamos usar o supabase pra monitorar os usuários por
-- enquanto" — e medir **quanto tempo cada jogador joga** e **que tipo de mapa**.
--
-- É IDEMPOTENTE: pode rodar mais de uma vez. Rollback no fim, comentado.
--
-- POR QUE TABELA NOVA E NÃO UMA COLUNA EM `stats`
--
--   1. `stats` é por NICK, e `main.js` só registra quando o jogador digita um
--      (`if (nick && !testMode)`). Quem entra e joga sem nick não existe para o
--      banco: nem register, nem heartbeat, nem submit. Medir só o registrado
--      enviesa a amostra exatamente para o jogador mais engajado — que é o
--      contrário do que serve para decidir mapa e balanceamento.
--
--   2. `stats` não tem dimensão de MAPA. Nenhuma tem: o payload de submit-match
--      manda nick/kills/deaths/rounds/team/seconds/character e para aí.
--
--   3. `submit_match` tem rate limit de 1 partida/90 s por nick e 60 s por IP.
--      Para ranking isso é anti-cheat. Para telemetria é perda silenciosa de
--      dado: partida curta some, e dois irmãos no mesmo Wi-Fi viram um.
--      Telemetria não pode passar por aquele gate.
--
-- MODELO DE PRIVACIDADE (o mesmo do city_daily, que já era agregado por cidade)
--   · nada aqui guarda IP;
--   · `anon_id` é um UUID gerado NO CLIENTE e guardado no localStorage. Não
--     identifica pessoa, identifica navegador — e some quando o jogador limpa
--     o storage. É o suficiente para "quanto tempo joga" sem exigir cadastro;
--   · `nick` é opcional e só existe quando o jogador escolheu um;
--   · as duas tabelas são AGREGADAS POR DIA. Não há linha por partida, então
--     não há como reconstruir a sessão de ninguém.
--
-- ACESSO: as duas tabelas são escritas e lidas SÓ pela service_role (as rotas
-- Astro). A anon key não recebe grant nenhum — sem leitura pública, porque
-- telemetria não é vitrine. Isso segue a linha da 011: fechado por padrão.

-- =============================================================================
-- §1 — QUE TIPO DE MAPA (e de modo) SE JOGA
-- =============================================================================
create table if not exists public.map_daily (
  day      date not null,
  map      text not null,
  mode     text not null default 'rounds',   -- 'rounds' | 'ctf'
  matches  int  not null default 0,
  rounds   int  not null default 0,
  seconds  bigint not null default 0,
  primary key (day, map, mode)
);

alter table public.map_daily enable row level security;
revoke all on public.map_daily from anon, authenticated;

-- =============================================================================
-- §2 — QUANTO TEMPO CADA JOGADOR JOGA
-- =============================================================================
-- Grão = (dia, navegador). Duas linhas do mesmo anon_id em dias diferentes
-- dizem retenção; a soma de `seconds` diz tempo de jogo. `nick` é o último
-- nick visto naquele dia, e serve só para cruzar com `stats` quando o ranking
-- voltar — não é chave.
create table if not exists public.player_daily (
  day       date not null,
  anon_id   uuid not null,
  nick      text,
  matches   int  not null default 0,
  rounds    int  not null default 0,
  seconds   bigint not null default 0,
  last_map  text,
  last_seen timestamptz not null default now(),
  primary key (day, anon_id)
);

alter table public.player_daily enable row level security;
revoke all on public.player_daily from anon, authenticated;

create index if not exists player_daily_anon_idx on public.player_daily (anon_id);

-- =============================================================================
-- §3 — A ESCRITA, NUMA FUNÇÃO SÓ
-- =============================================================================
-- `security definer` + `revoke ... from anon` na §4: só a service_role chama.
-- Um upsert por partida, os dois lados na mesma transação — se a telemetria de
-- mapa gravar e a de jogador não, o total de partidas diverge entre as duas
-- tabelas e ninguém descobre por semanas.
--
-- Os tetos abaixo NÃO são anti-cheat (não há prêmio para trapacear em
-- telemetria). São contra dado absurdo estragar a média: uma partida de 9h por
-- aba esquecida aberta distorce "tempo médio de jogo" para sempre.
create or replace function public.track_match(
  p_anon_id uuid,
  p_map text,
  p_mode text default 'rounds',
  p_seconds int default 0,
  p_rounds int default 0,
  p_nick text default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_sec int := least(greatest(coalesce(p_seconds, 0), 0), 7200);   -- teto 2 h
  v_rds int := least(greatest(coalesce(p_rounds, 0), 0), 60);
  v_map text := left(coalesce(nullif(p_map, ''), 'desconhecido'), 40);
  v_mode text := case when p_mode = 'ctf' then 'ctf' else 'rounds' end;
begin
  insert into map_daily (day, map, mode, matches, rounds, seconds)
  values (current_date, v_map, v_mode, 1, v_rds, v_sec)
  on conflict (day, map, mode) do update
    set matches = map_daily.matches + 1,
        rounds  = map_daily.rounds + v_rds,
        seconds = map_daily.seconds + v_sec;

  insert into player_daily (day, anon_id, nick, matches, rounds, seconds, last_map, last_seen)
  values (current_date, p_anon_id, left(p_nick, 32), 1, v_rds, v_sec, v_map, now())
  on conflict (day, anon_id) do update
    set matches   = player_daily.matches + 1,
        rounds    = player_daily.rounds + v_rds,
        seconds   = player_daily.seconds + v_sec,
        nick      = coalesce(left(p_nick, 32), player_daily.nick),
        last_map  = v_map,
        last_seen = now();
end $$;

-- =============================================================================
-- §4 — FECHAMENTO (mesma regra da 011: nenhum RPC chamável pela anon key)
-- =============================================================================
-- Toda função nasce com `execute` para PUBLIC, e o PostgREST publica tudo que é
-- executável como POST /rest/v1/rpc/<nome>. Sem este revoke, qualquer um com a
-- anon key (que é pública por design, servida em /api/config) inflaria a
-- telemetria com um `curl` em loop.
revoke all on function public.track_match(uuid, text, text, int, int, text) from public, anon, authenticated;
grant execute on function public.track_match(uuid, text, text, int, int, text) to service_role;

-- =============================================================================
-- ROLLBACK (comentado de propósito)
-- =============================================================================
-- drop function if exists public.track_match(uuid, text, text, int, int, text);
-- drop table if exists public.player_daily;
-- drop table if exists public.map_daily;
