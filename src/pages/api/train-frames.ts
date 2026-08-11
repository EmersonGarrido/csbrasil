// POST /api/train-frames - recebe lotes opt-in para treino offline dos bots.
import type { APIRoute } from 'astro';
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { supabaseAdmin, NOT_CONFIGURED } from '../../lib/supabase';
import { rateLimit } from '../../lib/ratelimit';
import { logInternalError } from '../../lib/api-error';
import { resolvePlayerIdentity, validUid } from '../../lib/player-identity';

export const prerender = false;

const MAX_FRAMES = 5000;
const MAX_BYTES = 400_000;
const STATE_DIM = 27;
const ACTION_DIM = 7;
const BASE64_RE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

// O sink sem autenticação só existe no servidor local de desenvolvimento.
const LOCAL_ENABLED = !supabaseAdmin && import.meta.env.DEV;
const LOCAL_FILE = path.resolve(process.cwd(), 'tools/eval/data/collected.ndjson');

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!supabaseAdmin && !LOCAL_ENABLED)
    return new Response(NOT_CONFIGURED, { status: 503, headers: { 'content-type': 'application/json' } });

  if (supabaseAdmin && !(await rateLimit(supabaseAdmin, 'train_frames_ip', clientAddress || 'unknown', 20, 60)))
    return json({ error: 'rate_limited' }, 429);

  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'bad_json' }, 400); }

  const { uid: rawUid, token, v, dims, n, meta, data } = body ?? {};
  if (!validUid(rawUid) || !validUid(token))
    return json({ error: 'invalid_identity' }, 400);

  const s = dims?.s | 0, a = dims?.a | 0;
  if (s !== STATE_DIM || a !== ACTION_DIM) return json({ error: 'bad_dims' }, 400);
  if (!Number.isInteger(n) || n < 1 || n > MAX_FRAMES) return json({ error: 'bad_n' }, 400);
  if (typeof data !== 'string' || data.length > MAX_BYTES * 2 || !BASE64_RE.test(data))
    return json({ error: 'bad_data' }, 400);

  const buf = Buffer.from(data, 'base64');
  if (buf.length !== n * (s + a) || buf.length > MAX_BYTES)
    return json({ error: 'len_mismatch' }, 400);

  const m = meta && typeof meta === 'object' && !Array.isArray(meta) ? meta : {};
  const clip = (value: unknown, len: number) => typeof value === 'string' ? value.slice(0, len) : null;

  if (!supabaseAdmin) {
    try {
      await mkdir(path.dirname(LOCAL_FILE), { recursive: true });
      await appendFile(LOCAL_FILE, JSON.stringify({ v: v | 0 || 1, dims: { s, a }, n, meta: m, data }) + '\n');
      return json({ ok: true, stored: 'local' });
    } catch (error) {
      logInternalError('api/train-frames(local)', error, { uid: rawUid });
      return json({ error: 'storage_failed' }, 503);
    }
  }

  const identity = await resolvePlayerIdentity(supabaseAdmin, {
    uid: rawUid,
    token,
    nick: null,
  });
  if (identity.error) {
    logInternalError('api/train-frames-identity', identity.error, { uid: rawUid });
    return json({ error: 'identity_unavailable' }, 503);
  }
  if (!identity.player) return json({ error: 'invalid_identity' }, 403);
  if (!(await rateLimit(supabaseAdmin, 'train_frames_player', identity.player.id, 10, 60)))
    return json({ error: 'rate_limited' }, 429);

  try {
    const { error } = await supabaseAdmin.rpc('insert_training_frames', {
      p_player_id: identity.player.id,
      p_schema: v | 0 || 1,
      p_map: clip(m.map, 40) || 'desconhecido',
      p_mode: m.mode === 'ctf' ? 'ctf' : 'rounds',
      p_weapon: clip(m.weapon, 32),
      p_n: n,
      p_state_dim: s,
      p_action_dim: a,
      p_data: data,
    });
    if (error) throw error;
  } catch (error) {
    logInternalError('api/train-frames', error, { uid: rawUid, playerId: identity.player.id });
    return json({ error: 'storage_failed' }, 503);
  }
  return json({ ok: true, stored: true });
};
