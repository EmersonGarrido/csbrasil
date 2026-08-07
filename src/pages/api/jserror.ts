// POST /api/jserror — exceção do navegador de quem está jogando.
// Ver supabase/migrations/015.
//
// POR QUE ESTA ROTA EXISTE, EM UMA FRASE: o botão JOGAR ficou inerte em produção
// (BUG-34) com o site respondendo 200, o build passando e o check:fast verde. O
// overlay de crash do `index.astro` já mostrava o erro NA TELA do jogador — e
// morria ali. Erro na máquina de quem joga é o único sinal que portão nenhum
// desta casa alcança.
//
// RATE LIMIT DE 30/MIN POR IP, e o número tem razão: o cliente já agrupa e
// segura (`fingerprint` + teto por sessão em index.astro), então 30 significa
// "trinta erros DISTINTOS num minuto", que não é jogo — é loop ou curl. Perder
// envio nesse regime não perde informação: a 31ª cópia do mesmo erro não conta
// nada que a 1ª já não tenha contado.
//
// FAIL-SILENT PARA O JOGADOR: qualquer erro daqui responde 2xx/4xx curto e o
// cliente ignora a resposta. Coletor de erro que atrapalha o jogo é pior que não
// ter coletor — e um coletor que lança dentro do handler de erro do navegador é
// como se faz um loop infinito.
import type { APIRoute } from 'astro';
import { supabaseAdmin, NOT_CONFIGURED } from '../../lib/supabase';
import { rateLimit } from '../../lib/ratelimit';

export const prerender = false;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const str = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseAdmin) return new Response(NOT_CONFIGURED, { status: 503, headers: { 'content-type': 'application/json' } });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (!(await rateLimit(supabaseAdmin, 'jserror', ip, 30, 60)))
    return json({ error: 'rate_limited' }, 429);

  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'bad_json' }, 400); }

  /* `fingerprint` e `message` são os dois únicos obrigatórios: sem chave de
     agrupamento a tabela vira lixeira, e sem mensagem a linha não diz nada. */
  const fingerprint = str(body?.fingerprint, 64);
  const message = str(body?.message, 500);
  if (!fingerprint || !message) return json({ error: 'bad_payload' }, 400);

  /* A ROTA É TRUNCADA E PERDE A QUERY STRING DE PROPÓSITO. `?debug=1` é inócuo,
     mas a query é o lugar onde um dia alguém põe token — e log de erro é o
     último lugar em que se quer descobrir isso depois. */
  let route = str(body?.route, 200);
  if (route) route = route.split('?')[0].split('#')[0];

  /* Migalhas: ação de JOGO, nunca texto escrito pelo jogador (ver o topo da
     migration 015). O teto de 20 é o que cabe numa tela de admin sem virar
     rolagem infinita, e o de 120 chars corta qualquer coisa que não seja rótulo. */
  const breadcrumbs = Array.isArray(body?.breadcrumbs)
    ? body.breadcrumbs.slice(-20).map((b: unknown) => String(b).slice(0, 120))
    : null;

  const anonId = str(body?.anonId, 36);
  const matchSecs = Number.isFinite(body?.matchSecs)
    ? Math.max(0, Math.min(86400, Math.floor(body.matchSecs)))
    : null;

  const { error } = await supabaseAdmin.rpc('report_js_error', {
    p_fingerprint: fingerprint,
    p_kind: ['error', 'promise', 'console'].includes(body?.kind) ? body.kind : 'error',
    p_message: message,
    p_source: str(body?.source, 300),
    p_stack: str(body?.stack, 4000),
    p_version: str(body?.version, 40),
    p_route: route,
    p_user_agent: str(request.headers.get('user-agent'), 400),
    p_anon_id: anonId && UUID_RE.test(anonId) ? anonId : null,
    p_nick: str(body?.nick, 40),
    p_map: str(body?.map, 40),
    p_mode: str(body?.mode, 20),
    p_faction: str(body?.faction, 4),
    p_match_secs: matchSecs,
    p_breadcrumbs: breadcrumbs,
  });
  if (error) return json({ error: 'indisponivel' }, 503);
  return json({ ok: true });
};
