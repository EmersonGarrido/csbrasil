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
  // Favicon = o MESMO arquivo do site (`public/favicon.ico`, 16/32/48), que é o canarinho.
  // Copiado, não linkado: o Docusaurus só enxerga `docs/static/`. Se o do site mudar,
  // rode `cp ../public/favicon.ico static/img/favicon.ico` — dois ícones diferentes para
  // o mesmo produto é o tipo de detalhe que faz a doc parecer de outro projeto.
  favicon: 'img/favicon.ico',

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
        // O ícone da navbar é o CANARINHO (o mascote), não a logomarca: a logomarca é um
        // letreiro de 4 linhas ("CORO / SOLTO / TRETA / SUPREMA") e a 32 px de altura ela
        // vira borrão ilegível. O letreiro inteiro aparece no cabeçalho da home, onde tem
        // espaço para ser lido. Mesma divisão que o site usa: ícone pequeno, letreiro grande.
        logo: {
          alt: 'Canarinho — mascote do CORO SOLTO',
          src: 'img/canarinho-icone.webp',
        },
        items: [
          { type: 'docSidebar', sidebarId: 'dev', position: 'left', label: 'Documentação' },
          { href: 'https://csbrasil.online/', label: 'Jogar', position: 'right' },
          { href: 'https://github.com/rubenmarcus/csbrasil', label: 'GitHub', position: 'right' },
        ],
      },
      footer: {
        style: 'dark',
        // A LOGOMARCA (`public/logo.png` da raiz, recortada e convertida) mora aqui: é o
        // único lugar da doc com largura sobrando para um letreiro de 4 linhas ser lido.
        // Até 05/08/2026 esse arquivo não era usado por ninguém, em lugar nenhum.
        logo: {
          alt: 'CORO SOLTO: Treta Suprema',
          src: 'img/logo-coro-solto.webp',
          href: 'https://csbrasil.online/',
          width: 200,
          height: 152,
        },
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
              { label: 'O portão (quality gates)', to: '/quality-gates' },
            ],
          },
          {
            title: 'Projeto',
            items: [
              { label: 'Licença, arte e marca', to: '/licenca' },
              { label: 'GitHub', href: 'https://github.com/rubenmarcus/csbrasil' },
              { label: 'Issues', href: 'https://github.com/rubenmarcus/csbrasil/issues' },
            ],
          },
        ],
        // O rodapé NÃO nomeia a licença de propósito. Ele dizia "código MIT" à mão, e este
        // arquivo é uma das 8 superfícies que precisam mudar JUNTO quando a licença mudar —
        // e era a única que NENHUMA das duas listas escritas à mão (README e plans/08 §3)
        // lembrava. Superfície que não repete o nome é uma a menos para esquecer; quem quer
        // a resposta clica no link acima, que aponta para a fonte gerada do `LICENSE`.
        copyright: 'CORO SOLTO: Treta Suprema — código aberto; a licença vigente está na página "Licença, arte e marca". Sátira ficcional.',
      },
      prism: {
        additionalLanguages: ['bash', 'json', 'diff'],
      },
    }),
};

module.exports = config;
