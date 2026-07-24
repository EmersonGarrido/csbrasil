// Versão do jogo — bump a cada release (segue as tags git v*).
// ATENÇÃO: o mesmo ?v= vai no import map do index.astro (bump dos dois lados juntos,
// senão o navegador serve módulos JS velhos do cache — causa raiz de "correções que
// não chegavam ao usuário" por dias).
export const VERSION = '1.20.5';
