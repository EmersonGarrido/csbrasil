// @ts-check
// Config MÍNIMA de propósito. Cada opção aqui existe por um motivo declarado —
// nada de plugin extra que ninguém consegue depurar num domingo.
//
// baseUrl '/docs/': este site é buildado PARA DENTRO do site Astro (ver README.md
// desta pasta). O Astro copia `public/` inteiro para `dist/client/`, então uma
// pasta `public/docs/` é servida em `https://.../docs/`. Se você for publicar em
// outro host (GitHub Pages num repo próprio, Netlify, etc), troque baseUrl para '/'.

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'CORO SOLTO — Docs do Dev',
  tagline: 'Instrumentação de IA, quality gates e como colaborar',
  favicon: 'img/favicon.svg',

  url: 'https://csbrasil.online',
  baseUrl: '/docs/',

  organizationName: 'rubenmarcus',
  projectName: 'csbrasil',

  // Link quebrado é doc que mente. Aqui ele derruba o build, igual invariante vermelha.
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          // docs-only: o site inteiro É a documentação, sem landing separada.
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/rubenmarcus/csbrasil/tree/main/docs/',
          showLastUpdateTime: false,
        },
        blog: false,
        pages: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'dark',
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'CORO SOLTO · Docs',
        items: [
          { type: 'docSidebar', sidebarId: 'dev', position: 'left', label: 'Documentação' },
          { href: 'https://csbrasil.online/', label: 'Jogar', position: 'right' },
          { href: 'https://github.com/rubenmarcus/csbrasil', label: 'GitHub', position: 'right' },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Comece por aqui',
            items: [
              { label: 'Começando', to: '/' },
              { label: 'Como colaborar', to: '/colaborar' },
            ],
          },
          {
            title: 'A régua',
            items: [
              { label: 'Instrumentação de IA', to: '/instrumentacao-ai' },
              { label: 'Quality gates', to: '/quality-gates' },
            ],
          },
          {
            title: 'Projeto',
            items: [
              { label: 'GitHub', href: 'https://github.com/rubenmarcus/csbrasil' },
              { label: 'Issues', href: 'https://github.com/rubenmarcus/csbrasil/issues' },
            ],
          },
        ],
        copyright: 'CORO SOLTO: Treta Suprema — código MIT. Sátira ficcional.',
      },
      prism: {
        additionalLanguages: ['bash', 'json', 'diff'],
      },
    }),
};

module.exports = config;
