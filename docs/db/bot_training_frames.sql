-- BOTBRAIN — armazenamento dos frames de behavioral cloning (Fase A da rede dos bots).
--
-- Recebe lotes (estado→ação) do jogador via POST /api/train-frames. O treino offline
-- (tools/eval/bot-train.mjs) lê daqui para gerar o bot-brain. Anônimo por anon_id (UUID
-- de navegador, sem PII, sem IP). Cap por anon evita que um jogador enviese o dataset e
-- mantém o storage limitado.
--
-- Aplicar no Supabase do projeto: /supabase/ é git-ignored, então esta é a fonte de
-- verdade versionada (docs/db/). Rodar este SQL no editor do Supabase antes de habilitar
-- o endpoint /api/train-frames.

create table if not exists public.bot_training_frames (
  id          bigint generated always as identity primary key,
  anon_id     text        not null,
  schema      int         not null default 1,   -- versão do vetor de features (features.js)
  map         text        not null default 'desconhecido',
  mode        text        not null default 'rounds',
  weapon      text,
  n           int         not null,             -- nº de frames no lote
  state_dim   int         not null,             -- casa com STATE_DIM (27)
  action_dim  int         not null,             -- casa com ACTION_DIM (7)
  data        text        not null,             -- base64 do Int8 quantizado (n*(s+a) bytes)
  created_at  timestamptz not null default now()
);

create index if not exists bot_training_frames_anon_idx    on public.bot_training_frames (anon_id, created_at desc);
create index if not exists bot_training_frames_schema_idx  on public.bot_training_frames (schema, created_at desc);

-- Fechado: só o service role (endpoint) escreve; ninguém lê pelo cliente.
alter table public.bot_training_frames enable row level security;

-- CAP_PER_ANON: mantém só os N lotes mais recentes por anon. 20 lotes ≈ 20 partidas,
-- suficiente pra representar um estilo sem deixar um único jogador dominar o dataset.
create or replace function public.insert_training_frames(
  p_anon_id    text,
  p_schema     int,
  p_map        text,
  p_mode       text,
  p_weapon     text,
  p_n          int,
  p_state_dim  int,
  p_action_dim int,
  p_data       text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cap_per_anon constant int := 20;
begin
  insert into public.bot_training_frames
    (anon_id, schema, map, mode, weapon, n, state_dim, action_dim, data)
  values
    (p_anon_id, coalesce(p_schema, 1), p_map, p_mode, p_weapon, p_n, p_state_dim, p_action_dim, p_data);

  -- poda: descarta os lotes que excedem o cap deste anon (mantém os mais novos)
  delete from public.bot_training_frames
  where id in (
    select id from public.bot_training_frames
    where anon_id = p_anon_id
    order by created_at desc
    offset cap_per_anon
  );
end;
$$;

revoke all on function public.insert_training_frames(text,int,text,text,text,int,int,int,text) from public, anon, authenticated;
