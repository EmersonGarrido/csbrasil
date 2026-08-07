// GET /api/leaderboard — ranking global (top 100) via service key no servidor.
import type { APIRoute } from 'astro';
import { supabaseAdmin, NOT_CONFIGURED } from '../../lib/supabase';
import { RANKING_ON } from '../../lib/site';

export const prerender = false;

export const GET: APIRoute = async () => {
  // Ranking desligado (site.ts): a rota responde 200 com `disabled`, não 404 nem
  // 503. É o cliente que decide como mostrar, e `disabled` diz "de propósito",
  // enquanto um erro diria "quebrou" — e o jogador entenderia bug onde é escolha.
  if (!RANKING_ON)
    return new Response(JSON.stringify({ disabled: true }), {
      headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=300' },
    });
  if (!supabaseAdmin)
    return new Response(NOT_CONFIGURED, { status: 503, headers: { 'content-type': 'application/json' } });
  const { data, error } = await supabaseAdmin.from('leaderboard').select('*');
  if (error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'content-type': 'application/json' } });
  return new Response(JSON.stringify({ players: data }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=30' },
  });
};
