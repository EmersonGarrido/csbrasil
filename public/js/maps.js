// Map registry — single source of truth for selectable arenas.
import { buildBrasilia } from './map_brasilia.js';
import { buildWorld } from './map.js';
import { buildPoolDay } from './map_pool_day.js';
import { buildHavan, havanPropsForMatch } from './map_havan.js';
import { buildFerroVelho, FERRO_PROPS } from './map_ferrovelho.js';

export const MAPS = {
  awp_map:     { name: 'Praça dos Três Poderes', build: buildBrasilia }, // Brasília fiel (substitui o clássico)
  praca_old:   { name: 'Praça (clássico)',       build: buildWorld },
  fy_pool_day: { name: 'Piscinão de Ramos',      build: buildPoolDay },
  // props via getter: a seleção de carros é sorteada por partida (seed no startGame) — peso
  fy_havan:    { name: 'Havan (Estacionamento)', build: buildHavan, get props() { return havanPropsForMatch(); }, ctfOnly: true },  // CTF: Bolso na loja
  fy_ferrovelho: { name: 'Ferro Velho do Zé',    build: buildFerroVelho, props: FERRO_PROPS, ctfOnly: true },  // CTF 4 bandeiras
};
export const MAP_IDS = Object.keys(MAPS);
export const DEFAULT_MAP = 'awp_map';

export function resolveMapId(id) {
  return MAPS[id] ? id : DEFAULT_MAP;
}
