/* ============================================================================
   map_decals.js — AS DUAS COISAS QUE TODO MAPA PRECISA ANTES DE PINTAR PAREDE
   ----------------------------------------------------------------------------
   1. `decalIds(T, nomes)`  — pool de decalque por NOME de arquivo, não por índice.
   2. `paredeAtras(...)`    — raycast que confirma que existe sólido atrás da peça.

   ── POR QUE (1): ÍNDICE É PONTEIRO PRA LISTA GERADA ──────────────────────────
   Os pools nasceram como `const D_MURAL = [157, 158, ...]`: índices dentro do
   `DECAL_FILES` que `tools/gen-graffiti-decals.mjs` REESCREVE no textures.js. Ou
   seja, qualquer arquivo que entre ou saia do pacote de recortes renumera tudo
   que vem depois dele — e os 5 mapas passam a apontar pra arte errada SEM ERRO
   NENHUM, porque o índice continua válido. Aconteceu de verdade nesta rodada: a
   remoção de 3 recortes com fundo não removido (lobo-mau, gato-rosa, smiley-dedo)
   deslocou 80 índices. Nome de arquivo não desliza; índice desliza calado.

   ── POR QUE (2): "GRAFFITE EM LUGAR QUE NÃO É PAREDE" ────────────────────────
   Reprovação literal do dono (04/08): "os graffites que colocaste, colocaste em
   lugares que não são parede". A rodada anterior consertou dois casos na mão
   (mural cruzando a divisa de dois barracos de alturas diferentes; peça em fita
   de vidro fumê na Brasília) e sobraram outros — porque conserto caso a caso não
   fecha a classe do defeito, só os que aparecem na captura daquele dia.

   O decalque é PLANO SEM COLLIDER (regra da casa: decalque que empurra colisor
   vira parede invisível — BUG-21). Isso o desacopla da geometria de um jeito que
   nenhuma outra régua enxerga: dá pra colar uma peça de 5 m no meio do ar e todo
   portão continua verde. `paredeAtras` fecha esse buraco no ÚNICO momento em que
   dá pra fechar — antes de desenhar: 25 raios saindo do quad para TRÁS, e se
   qualquer um deles não encontrar sólido em 0,8 m, a peça não é criada.

   Isso mata a classe inteira:
     · peça no ar (nada atrás)                     -> nenhum raio bate
     · peça atravessando a divisa de dois volumes  -> a metade de fora não bate
     · peça passando do topo do muro               -> a fileira de cima não bate
     · peça em vão de porta / recuo de fachada     -> as amostras do vão não batem

   O que ele NÃO vê, e continua sendo motivo pra CAPTURAR E OLHAR: vidro é sólido
   igual concreto. Cartaz em vidro de abrigo de ônibus passa aqui e ainda assim é
   errado — esse caso sai por decisão de onde chamar, não por régua.
   ============================================================================ */

/* Índices de `T.decals` a partir dos nomes de arquivo. Nome que não existe no
   pacote é AVISO ALTO e não entra no pool: pool vazio desenha nada (visível),
   pool com `undefined` desenha textura errada (invisível). */
export function decalIds(T, nomes) {
  const files = T && T.decalFiles;
  if (!files || !files.length) return [];
  const out = [];
  for (const n of nomes) {
    const i = files.indexOf(n);
    if (i < 0) { console.warn('[decals] "' + n + '" não existe em public/img/decals — fora do pool'); continue; }
    out.push(i);
  }
  return out;
}

/* Caixa GIRADA como sólido de decalque. As caixas de `colliders` são AABB de
   mundo e não sabem de `ry`; quem é girado (as duas folhas do portão do Ferro
   Velho, ry = ∓0,9) precisa entrar por aqui, senão o raio sai pela lateral da
   AABB não-girada e a peça certa é reprovada. `y` é a BASE, igual `addBox`. */
export function caixaGirada(w, h, d, x, y, z, ry = 0) {
  return { obb: true, cx: x, cy: y + h / 2, cz: z, hx: w / 2, hy: h / 2, hz: d / 2, ry };
}

/* Sólido a partir de um Box3 já calculado (fachada de GLB, que não tem collider
   quando o prédio é vazado por baixo — o caso dos ministérios sobre pilotis). */
export function caixaDeBox3(bb, folga = 0) {
  return {
    minX: bb.min.x - folga, maxX: bb.max.x + folga, minY: bb.min.y - folga, maxY: bb.max.y + folga,
    minZ: bb.min.z - folga, maxZ: bb.max.z + folga,
  };
}

// slab test: t de entrada do raio numa AABB, ou -1
function _aabb(ox, oy, oz, dx, dy, dz, b, tmax) {
  let t0 = 0, t1 = tmax;
  const eixo = (o, d, mn, mx) => {
    if (Math.abs(d) < 1e-9) return o >= mn && o <= mx;
    let a = (mn - o) / d, c = (mx - o) / d;
    if (a > c) { const s = a; a = c; c = s; }
    if (a > t0) t0 = a;
    if (c < t1) t1 = c;
    return t0 <= t1;
  };
  if (!eixo(ox, dx, b.minX, b.maxX)) return -1;
  if (!eixo(oy, dy, b.minY, b.maxY)) return -1;
  if (!eixo(oz, dz, b.minZ, b.maxZ)) return -1;
  return t0;
}

function _bate(solids, px, py, pz, dx, dz, alcance) {
  for (let i = 0; i < solids.length; i++) {
    const s = solids[i];
    if (s.obb) {
      // leva o raio pro referencial da caixa (gira -ry em torno do centro)
      const c = Math.cos(-s.ry), si = Math.sin(-s.ry);
      const ax = px - s.cx, az = pz - s.cz;
      const lx = ax * c + az * si, lz = -ax * si + az * c;
      const ldx = dx * c + dz * si, ldz = -dx * si + dz * c;
      if (_aabb(lx, py, lz, ldx, 0, ldz,
        { minX: -s.hx, maxX: s.hx, minY: s.cy - s.hy, maxY: s.cy + s.hy, minZ: -s.hz, maxZ: s.hz }, alcance) >= 0) return true;
    } else if (_aabb(px, py, pz, dx, 0, dz, s, alcance) >= 0) return true;
  }
  return false;
}

/* TEM PAREDE ATRÁS?  (x, y, z) é o CENTRO do quad; `ry` a rotação dele.
   25 amostras (5×5) no quad encolhido 6% — a margem existe porque o decalque
   costuma ir encostado na quina e 6% evita reprovar por meio pixel de borda.
   `alcance` é curto de propósito (0,8 m): parede a mais de 0,8 m atrás do plano
   não é a parede daquele decalque, é outra coisa lá longe, e a peça está
   flutuando na frente dela. */
export function paredeAtras(solids, x, y, z, ry, w, h, alcance = 0.8) {
  if (!solids || !solids.length) return false;
  const nx = Math.sin(ry), nz = Math.cos(ry);      // normal (a face que aparece)
  const ux = Math.cos(ry), uz = -Math.sin(ry);     // eixo horizontal do quad
  const N = 5, INSET = 0.94;
  for (let a = 0; a < N; a++) {
    const su = (a / (N - 1) - 0.5) * w * INSET;
    const px = x + ux * su, pz = z + uz * su;
    for (let b = 0; b < N; b++) {
      const py = y + (b / (N - 1) - 0.5) * h * INSET;
      if (!_bate(solids, px, py, pz, -nx, -nz, alcance)) return false;
    }
  }
  return true;
}
