import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import { aeoCurado } from './scripts/aeo.mjs';

export default defineConfig({
  output: 'static',
  adapter: vercel(),

  // AEO: llms-full.txt, ai-index.json, docs.json e espelhos .md das páginas de
  // conteúdo. Usa os geradores da `aeo.js` com a lista de páginas curada —
  // o porquê da curadoria (12 telas de laboratório que o robots.txt bloqueia)
  // está medido em scripts/aeo.mjs.
  integrations: [
    aeoCurado({
      site: 'https://www.csbrasil.online',
      title: 'CORO SOLTO: Treta Suprema',
      description:
        'FPS gratuito de navegador estilo CS 1.6: arena de sniper satírica numa ' +
        'Brasília fictícia, com cinco facções e 44 personagens originais.',
    }),
  ],

  // COM `www`, E ISSO IMPORTA.
  // A produção responde em https://www.csbrasil.online, mas o `site` dizia
  // https://csbrasil.online. Como o Layout monta o canonical com
  // `new URL(pathname, Astro.site)`, TODA página servida no host com www
  // apontava o canonical pro host SEM www — canonical split clássico: o
  // buscador vê dois hosts, dilui sinal entre eles e escolhe sozinho qual
  // indexar. Nada de SEO funciona direito enquanto o canonical apontar pro
  // host errado; por isso é a primeira correção da lista.
  // Se um dia a produção virar o apex, mude AQUI e em src/lib/site.ts.
  // NOTA: `trailingSlash` fica no default ('ignore') de propósito. Mudar pra
  // 'never' mexe no roteamento do build e não dá pra validar sem `npm install`
  // (sem rede nesta máquina) — é risco desnecessário no dia do release. A
  // normalização de barra final é feita no canonical, em Layout.astro.
  site: 'https://www.csbrasil.online',
});
