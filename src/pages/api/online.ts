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
    const { count, error } = await supabaseAdmin
      .from('online_now')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return new Response(JSON.stringify({ online: count ?? 0 }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 's-maxage=30, stale-while-revalidate=60' },
    });
  } catch {
    // rodapé esconde o contador quando não há número — nunca quebra o menu
    return new Response(JSON.stringify({ online: null }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  }
};
