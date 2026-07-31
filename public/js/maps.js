// Map registry — single source of truth for selectable arenas.
import { buildBrasilia } from './map_brasilia.js';
import { buildWorld } from './map.js';
import { buildPoolDay } from './map_pool_day.js';
import { buildHavan, havanPropsForMatch } from './map_havan.js';
import { buildFerroVelho, FERRO_PROPS } from './map_ferrovelho.js';

export const MAPS = {
  awp_map:     { name: 'Praça dos Três Poderes', build: buildBrasilia }, // Brasília fiel (substitui o clássico)
  praca_old:   { name: 'Praça (clássico)',       build: buildWorld },
  fy_pool_day: { name: 'Piscina da Treta',        build: buildPoolDay },   // salão fechado do CS 1.6; a versão Piscinão está em map_pool_ramos.js, fora do registro
  // props via getter: a seleção de carros é sorteada por partida (seed no startGame) — peso
  // `ctfMode: true` = ABRE em CTF, mas o jogador pode trocar pra rounds no menu.
  // Era um flag `ctfOnly` que travava o modo. Pedido do dono: "os mapas todos podem ser rounds
  // ou CTF, mas tem uns que forçam ser CTF". A geometria dos dois foi desenhada em volta
  // das bandeiras, então CTF continua sendo o padrão — só deixou de ser prisão.
  fy_havan:    { name: 'Loja H (Estacionamento)', build: buildHavan, get props() { return havanPropsForMatch(); }, ctfMode: true },
  fy_ferrovelho: { name: 'Ferro Velho do Zé',    build: buildFerroVelho, props: FERRO_PROPS, ctfMode: true },
};
export const MAP_IDS = Object.keys(MAPS);
export const DEFAULT_MAP = 'awp_map';

export function resolveMapId(id) {
  return MAPS[id] ? id : DEFAULT_MAP;
}
