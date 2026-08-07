// GET /api/online — quantos jogadores "online agora" (heartbeat nos últimos 2 min).
// Lê a VIEW public.online_now (schema.sql), que já filtra por janela. Cache curto de
// borda: o número é social proof do rodapé do menu, não telemetria — 30 s de atraso
// é invisível e corta o QPS no Postgres.
import type { APIRoute } from 'astro';
import { supabaseAdmin, NOT_CONFIGURED } from '../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async () => {
  if (NOT_CONFIGURED) {
    return new Response(JSON.stringify({ online: null }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  }
  try {
    /* `online_anon`, não `online_now` (07/08). A `online_now` conta jogador
       REGISTRADO DENTRO DE PARTIDA, porque é isso que o /api/heartbeat exige — e
       era por isso que a Vercel Analytics mostrava 8 pessoas no site e o rodapé
       mostrava nada. As duas medidas estavam certas; contavam coisas diferentes.
       "N online" é lido como "quantas pessoas estão com o jogo aberto", então a
       fonte passa a ser a presença anônima por `anonId` (migration 014), que
       inclui quem está parado no menu. A `online_now` continua existindo: é ela
       que alimenta o mapa de cidades da /mapa, com nick. */
    const { count, error } = await supabaseAdmin
      .from('online_anon')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return new Response(JSON.stringify({ online: count ?? 0 }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 's-maxage=30, stale-while-revalidate=60' },
    });
  } catch (e) {
    /* O `catch` mudo custou caro (07/08): com o site no ar, esta rota devolvia
       `{"online": null}` e o rodapé escondia o contador — comportamento correto do
       rodapé, defeito invisível aqui. `null` era a MESMA resposta de "Supabase não
       configurado" e de "a query explodiu", então não havia como distinguir sem
       abrir o banco. A causa real: a view `online_now` não existe em produção (ela
       morava no `schema.sql`, que saiu do repo público) — agora tem migration, a 014.
       O log não muda a resposta: o contador continua sumindo em silêncio para o
       jogador, que é o certo. Ele só deixa de sumir em silêncio para NÓS. */
    console.error('[online] a consulta a `online_now` falhou — a view existe? (ver supabase/migrations/014):', e);
    return new Response(JSON.stringify({ online: null }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  }
};
