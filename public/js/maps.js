// Map registry — single source of truth for selectable arenas.
import { buildBrasilia } from './map_brasilia.js';
import { buildPoolDay } from './map_piscina.js';
import { buildHavan, havanPropsForMatch } from './map_havan.js';
import { buildFerroVelho, FERRO_PROPS } from './map_ferrovelho.js';
import { buildQuebrada, QUEBRADA_PROPS } from './map_quebrada.js';
import { buildPosto, POSTO_PROPS } from './map_posto.js';
import { buildAtacadao, ATACADAO_PROPS } from './map_atacadao.js';
import { buildObras, OBRAS_PROPS } from './map_obras.js';
import { buildUpa, UPA_PROPS } from './map_upa.js';
import { buildFavela, FAVELA_PROPS } from './map_favela.js';

export const MAPS = {
  awp_map:     { name: 'Praça dos Três Poderes', build: buildBrasilia }, // Brasília fiel (substitui o clássico)
  /* `praca_old` (a "Praça (clássico)", public/js/map.js) SAIU DO REGISTRO — pedido literal do
     dono: "vamos apagar a praça clássica". Ela era a versão procedural anterior da mesma
     praça que o awp_map já entrega em Brasília fiel, e ficava no menu como um 5º cartaz que
     ninguém escolhia. O arquivo map.js foi apagado junto; nada mais o importava (o awp_map
     mora em map_brasilia.js e NÃO compartilha código com ele — as duas funções de construção
     eram independentes, cada uma com seu próprio `addBox`/`lam`).
     Efeitos colaterais desta remoção, todos medidos e conferidos:
       • pickup-check cai de 246 para 244 pickups (o praca_old tinha 2 armas no chão) — é a
         ÚNICA redução de arma desta rodada e ela vem do mapa apagado, não de mapa vivo;
       • as réguas que iteram "os 5 mapas" passam a iterar 4 (map-check, invariants, botsim);
       • `tools/eval/ui-check.mjs` ainda lista 'praca_old' na constante MAPAS dele — não é
         defeito: `resolveMapId` (logo abaixo) devolve o DEFAULT_MAP para id desconhecido,
         então aquela corrida vira uma segunda passada no awp_map em vez de quebrar. O
         arquivo está em mão de outro agente nesta rodada e por isso não foi tocado. */
  fy_pool_day: { name: 'Piscina da Treta',        build: buildPoolDay },   // salão fechado do CS 1.6; a versão Piscinão está em map_piscinao_ramos.js, fora do registro
  // props via getter: a seleção de carros é sorteada por partida (seed no startGame) — peso
  // `ctfMode: true` = ABRE em CTF, mas o jogador pode trocar pra rounds no menu.
  // Era um flag `ctfOnly` que travava o modo. Pedido do dono: "os mapas todos podem ser rounds
  // ou CTF, mas tem uns que forçam ser CTF". A geometria dos dois foi desenhada em volta
  // das bandeiras, então CTF continua sendo o padrão — só deixou de ser prisão.
  fy_havan:    { name: 'Loja H (Estacionamento)', build: buildHavan, get props() { return havanPropsForMatch(); }, ctfMode: true },
  fy_ferrovelho: { name: 'Ferro Velho do Zé',    build: buildFerroVelho, props: FERRO_PROPS, ctfMode: true },
  // Quebrada: rua reta com rotunda do baile numa ponta e campinho de terra na outra, CTF de
  // 4 bandeiras (campinho · bar de esquina · ponto de ônibus · praça do baile). Spec do dono
  // em HANDOFF.md §A0.10. As vielas de fundo (x = ∓23) são requisito da CTF2, não decoração.
  fy_quebrada: { name: 'Quebrada (Rua do Baile)', build: buildQuebrada, props: QUEBRADA_PROPS, ctfMode: true },
  // Posto de gasolina de beira de estrada, hora dourada. 3 corredores (loja O · marquise C ·
  // pátio L), simétrico em z=0. Procedural (marquise/bombas/loja) + props (kombi/fusca/pneus…).
  fy_posto: { name: 'Posto da Treta', build: buildPosto, props: POSTO_PROPS, ctfMode: true },
  // Galpão de atacado (paródia), estilo CS clássico: corredores de gôndola, caixas na
  // entrada, doca de carga no fundo. Simétrico em z=0. A treta é o preço absurdo.
  fy_atacadao: { name: 'Atacadão da Treta', build: buildAtacadao, props: ATACADAO_PROPS, ctfMode: true },
  // Canteiro de obra da prefeitura que nunca acaba: estrutura meio-construída no centro, tapumes,
  // andaimes, entulho, guindaste. Simétrico em z=0. A treta é a verba que sumiu.
  fy_obras: { name: 'Obras da Prefeitura', build: buildObras, props: OBRAS_PROPS, ctfMode: true },
  // UPA 24h: pronto-socorro lotado, mapa 100% INTERNO (prédio fechado, sem céu). Salas de verdade
  // — recepção/espera, triagem, consultórios, raio-x, farmácia, enfermaria e emergência — ligadas
  // por corredor central em cruz com portas. Cheio de canto pra se esconder. A treta é a fila eterna.
  fy_upa: { name: 'UPA 24h da Treta', build: buildUpa, props: UPA_PROPS, ctfMode: true },
  // Favela da Treta: o MAIOR mapa e o único vertical — morro em 3 terraços (rua → miolo → laje do
  // baile) ligados por escadarias, labirinto de becos entre casas coladas. Verticalidade via
  // groundHeightAt. E nasce no asfalto, B na laje. A treta é a boca, o baile e o gatonet.
  fy_favela: { name: 'Favela da Treta', build: buildFavela, props: FAVELA_PROPS, ctfMode: true },

  /* ═══ MAPAS DA COMUNIDADE — PRs de fora, mesmo contrato e mesmas réguas dos oficiais ═══
     Regras desta seção (ver docs/docs/mapas-comunidade.md e o template de PR em
     .github/PULL_REQUEST_TEMPLATE/mapa_comunidade.md):
       • entrada em UMA LINHA — o parser do tools/gen-docs.mjs lê o registro linha a linha;
         quebrar a linha faz o mapa sumir da doc gerada sem erro;
       • sempre DEPOIS do último oficial — MAP_IDS ordena o menu (oficiais primeiro);
       • campos obrigatórios além dos de sempre: community: true, author, authorGithub, desc
         (a desc vai pro cartaz em tela cheia — o contribuidor NÃO mexe no MAP_DESC do main.js).
     Exemplo (mantido comentado até o primeiro PR de comunidade):
  fy_exemplo: { name: 'Nome no Menu', build: buildExemplo, props: EXEMPLO_PROPS, ctfMode: true, community: true, author: 'Fulano', authorGithub: 'fulano', desc: 'Uma frase de descrição pro cartaz em tela cheia.' },
  */
};
export const MAP_IDS = Object.keys(MAPS);
// Derivado do registro — nunca listar ids de comunidade à mão em outro lugar.
export const COMMUNITY_MAP_IDS = MAP_IDS.filter((id) => MAPS[id].community);
export const DEFAULT_MAP = 'awp_map';

export function resolveMapId(id) {
  return MAPS[id] ? id : DEFAULT_MAP;
}
