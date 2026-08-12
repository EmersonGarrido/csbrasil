// MÓDULOS PRIVADOS — multiplayer e editor de mapa NÃO vão no build público/oficial.
//
// Regra da flag `PRIVATE_FEATURES` (avaliada em BUILD, estática):
//  • `astro dev` (import.meta.env.DEV): SEMPRE ligado — você testa MP/editor localmente sem config.
//  • `astro build` com env `PUBLIC_PRIVATE_FEATURES=1`: ligado — build PRIVADO seu (deploy interno).
//  • `astro build` SEM a env (público/oficial): DESLIGADO — o menu Multiplayer some e a
//    rota /editor redireciona pra home. O público não tem acesso a nenhum dos dois.
//
// Como ligar num build privado:  PUBLIC_PRIVATE_FEATURES=1 npm run build
// (o prefixo PUBLIC_ é exigido pelo Vite para a variável chegar em import.meta.env.)
export const PRIVATE_FEATURES: boolean =
  import.meta.env.DEV === true || import.meta.env.PUBLIC_PRIVATE_FEATURES === '1';
