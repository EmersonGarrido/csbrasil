// GET /sitemap.xml — sitemap DINÂMICO.
//
// POR QUE NÃO `@astrojs/sitemap`
// (a) a integration não está instalada e esta máquina não tem rede pra
//     `npm install`; (b) mais importante: ela só enxerga rotas conhecidas em
// build time, e o conteúdo que escala aqui é `/u/<id>/<nick>` — uma página por
// jogador, criada em runtime. Um sitemap que lista 8 páginas fixas e ignora os
// perfis deixa de fora exatamente o que faz o site crescer.
//
// Este endpoint lista as páginas fixas + todos os jogadores do ranking (a view
// `leaderboard` já filtra `hidden`, então quem foi escondido pela moderação não
// entra). Sem envs do Supabase, degrada pras páginas fixas e não quebra.
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../lib/supabase';
import { SITE } from '../lib/site';

export const prerender = false;

// prioridade/frequência: sinal fraco pro Google, mas o Bing e os crawlers de
// IA ainda leem. Custa nada e ajuda a ordenar o rastreio.
const STATIC: [string, string, string][] = [
  ['/',            '1.0', 'daily'],
  ['/ranking',     '0.9', 'hourly'],
  ['/como-jogar',  '0.8', 'weekly'],
  ['/personagens', '0.8', 'weekly'],
  ['/mapas',       '0.8', 'weekly'],
  ['/armas',       '0.8', 'weekly'],
  ['/sobre',       '0.7', 'monthly'],
  ['/mapa',        '0.6', 'daily'],
  ['/changelog',   '0.5', 'weekly'],
];

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const GET: APIRoute = async () => {
  const today = new Date().toISOString().slice(0, 10);
  const urls: string[] = STATIC.map(([path, prio, freq]) =>
    `  <url><loc>${SITE}${path}</loc><lastmod>${today}</lastmod>` +
    `<changefreq>${freq}</changefreq><priority>${prio}</priority></url>`);

  if (supabaseAdmin) {
    // Vai em `stats` e não na view `leaderboard` por dois motivos: a view tem
    // `limit 500` cravado (o sitemap tem que cobrir TODO mundo, não o top 500)
    // e não expõe `updated_at`, que é o `lastmod` honesto de um perfil.
    const { data } = await supabaseAdmin
      .from('stats')
      .select('updated_at, players!inner(id, nick, hidden)')
      .eq('players.hidden', false)
      .limit(5000);
    for (const row of (data ?? []) as any[]) {
      const p = row.players;
      if (!p?.id || !p?.nick) continue;
      const loc = `${SITE}/u/${p.id}/${encodeURIComponent(p.nick)}`;
      const lastmod = row.updated_at ? String(row.updated_at).slice(0, 10) : today;
      urls.push(
        `  <url><loc>${esc(loc)}</loc><lastmod>${lastmod}</lastmod>` +
        `<changefreq>weekly</changefreq><priority>0.6</priority></url>`);
    }
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.join('\n') + `\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      // 1h no CDN: crawler não precisa de sitemap fresco ao segundo, e sem
      // isso cada rastreio vira um SELECT de 5000 linhas no Supabase.
      'cache-control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
