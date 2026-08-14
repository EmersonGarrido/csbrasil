// Sidebar MANUAL, na ordem em que a doc deve ser lida.
// Autogerado ficaria em ordem de arquivo e a leitura perderia o fio: aqui a ordem é
//
//   o que é o jogo -> com o que é feito -> como o trabalho é feito -> qual é a régua
//   -> como não colidir com quem já está editando -> como entrar -> sob que licença
//   -> o que está verde e o que está vermelho HOJE
//
// Duas trocas de 05/08/2026, e o motivo de cada uma:
//   · `arquitetura` subiu para ANTES de `colaborar`, porque a página de colaborar manda
//     consultar a tabela de conflito e antes mandava para uma página que vinha depois.
//   · `estado` fica por último de propósito: é a única página que envelhece por si, e é a
//     que menos ajuda quem ainda não entendeu a régua.

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  dev: [
    'comecando',
    'stack',
    'instrumentacao-ai',
    'quality-gates',
    'arquitetura',
    'colaborar',
    // logo depois de `colaborar` de propósito: é o desdobramento dela para quem vem de
    // fora contribuir mapa — a receita técnica mora lá, o processo/política mora aqui.
    'mapas-comunidade',
    'licenca',
    'estado',
  ],
};

module.exports = sidebars;
