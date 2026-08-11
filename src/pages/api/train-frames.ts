// POST /api/train-frames — frames de behavioral cloning (anônimos), um lote por partida.
// Ver docs/db/bot_training_frames.sql (fonte da tabela + RPC; aplicar no Supabase).
//
// Guarda pares (estado→ação) do JOGADOR gravados pelo public/js/botbrain/recorder.js.
// É o combustível do treino offline (tools/eval/bot-train.mjs) que gera o bot-brain.
//
// ANÔNIMO POR DESIGN: anonId = UUID de localStorage (navegador, não pessoa), nenhum IP
// gravado. Respeita opt-out (o cliente só chama isto se o jogador não desligou a coleta).
// NÃO usa sendBeacon: o lote pode passar de 64 KB, e é enviado por fetch normal na tela de
// fim de partida (página viva), então a resposta pode ser lida e o tamanho não é limitado.
import type { APIRoute } from 'astro';
import { supabaseAdmin, NOT_CONFIGURED } from '../../lib/supabase';
import { rateLimit } from '../../lib/ratelimit';
import { logInternalError } from '../../lib/api-error';

export const prerender = false;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FRAMES = 5000; // teto de frames por lote (recorder corta em 2400; folga p/ variação)
const MAX_BYTES = 400_000; // teto de payload decodificado (~1 partida longa comprimível)
const STATE_DIM = 27; // casa com public/js/botbrain/features.js
const ACTION_DIM = 7;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseAdmin) return new Response(NOT_CONFIGURED, { status: 503, headers: { 'content-type': 'application/json' } });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (!(await rateLimit(supabaseAdmin, 'train_frames', ip, 20, 60)))
    return json({ error: 'rate_limited' }, 429);

  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'bad_json' }, 400); }

  const { anonId, v, dims, n, meta, data } = body ?? {};

  if (typeof anonId !== 'string' || !UUID_RE.test(anonId))
    return json({ error: 'bad_anon_id' }, 400);

  // esquema do lote: dims precisam bater com o que o treino espera, senão a rede
  // receberia colunas trocadas. Rejeita drift em vez de gravar dado envenenado.
  const s = dims?.s | 0, a = dims?.a | 0;
  if (s !== STATE_DIM || a !== ACTION_DIM) return json({ error: 'bad_dims' }, 400);
  if (!Number.isInteger(n) || n < 1 || n > MAX_FRAMES) return json({ error: 'bad_n' }, 400);
  if (typeof data !== 'string' || data.length > MAX_BYTES * 2) return json({ error: 'bad_data' }, 400);

  // integridade: o base64 tem que decodificar em EXATAMENTE n*(s+a) bytes.
  let buf: Buffer;
  try { buf = Buffer.from(data, 'base64'); } catch { return json({ error: 'bad_base64' }, 400); }
  if (buf.length !== n * (s + a) || buf.length > MAX_BYTES)
    return json({ error: 'len_mismatch' }, 400);

  const m = meta && typeof meta === 'object' && !Array.isArray(meta) ? meta : {};
  const clip = (x: unknown, len: number) => (typeof x === 'string' ? x.slice(0, len) : null);

  try {
    const { error } = await supabaseAdmin.rpc('insert_training_frames', {
      p_anon_id: anonId,
      p_schema: v | 0 || 1,
      p_map: clip(m.map, 40) || 'desconhecido',
      p_mode: m.mode === 'ctf' ? 'ctf' : 'rounds',
      p_weapon: clip(m.weapon, 32),
      p_n: n,
      p_state_dim: s,
      p_action_dim: a,
      p_data: data, // base64 do Int8 quantizado; storage bounded por cap por anon no RPC
    });
    if (error) {
      logInternalError('api/train-frames', error, { anonId });
      return json({ ok: true, stored: false });
    }
  } catch (error) {
    logInternalError('api/train-frames', error, { anonId });
    return json({ ok: true, stored: false });
  }
  return json({ ok: true, stored: true });
};
