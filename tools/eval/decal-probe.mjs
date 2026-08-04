/* ============================================================================
   decal-probe.mjs — O QUE FOI COLADO NA PAREDE, ONDE E DE QUE TAMANHO.
   ----------------------------------------------------------------------------
   POR QUE EXISTE
   Os 179 recortes de `public/img/decals` entram nos mapas como PLANO SEM COLLIDER
   (é a regra: decalque que empurra colisor vira parede invisível — BUG-21, o ônibus
   da Brasília, 2,33 m de parede fantasma). A consequência boa é que nenhuma régua
   de geometria muda quando eles entram; a consequência ruim é que NENHUMA RÉGUA VÊ
   se eles entraram. `map-check` e `pickup-check` dão exatamente o mesmo número com
   49 decalques ou com zero.

   Esta régua fecha esse buraco pelo único caminho que sobra: os mapas nomeiam cada
   plano de decalque como `decal:<arquivo>.png`, e em node a TEXTURA nunca carrega
   mas o NOME e a GEOMETRIA existem. Então dá pra conferir, sem navegador:
     · quantas peças cada mapa cola e quantos arquivos distintos usa;
     · a posição e o `ry` de cada uma (peça virada pro lado errado aparece aqui);
     · a LARGURA × ALTURA final — que é o que o dono pediu ("num tamanho MAIOR que
       os posters atuais"): o cartaz do Piscinão tem 2,2 m, então peça abaixo disso
       numa parede alta é regressão do pedido, não detalhe.

   O QUE ELA **NÃO** MEDE, e é por isso que ela não substitui olhar:
   se a peça está DENTRO de outra malha, se caiu em cima de uma janela, se o mapa
   ficou poluído. Nada disso é número. Os mapas com prédio GLB (a Brasília inteira)
   aparecem com ZERO aqui porque em node nenhum GLB carrega e as fachadas não
   existem — conferir esses é obrigatoriamente por captura.

   Uso:
     node tools/eval/decal-probe.mjs [mapId]     # resumo por mapa
     V=1 node tools/eval/decal-probe.mjs [mapId] # + uma linha por peça
   ============================================================================ */
import { THREE, MAPS, initTextures } from './harness.mjs';

const T = initTextures();
const ONLY = process.argv[2];
const VERBOSE = process.env.V === '1';
const H_CARTAZ = 2.2;   // altura do cartaz do Piscinão — a régua de tamanho do dono

let total = 0, curtos = 0;
for (const [id, m] of Object.entries(MAPS)) {
  if (ONLY && id !== ONLY) continue;
  const scene = new THREE.Scene();
  const W = m.build(scene, T);
  const files = new Map(), linhas = [];
  let n = 0, menor = Infinity, maior = 0;
  W.root.traverse((o) => {
    if (!o.isMesh || !String(o.name).startsWith('decal:')) return;
    const f = o.name.slice(6), g = o.geometry.parameters || {};
    const w = g.width || 0, h = g.height || 0;
    n++; files.set(f, (files.get(f) || 0) + 1);
    menor = Math.min(menor, h); maior = Math.max(maior, h);
    linhas.push(`    ${w.toFixed(2)} × ${h.toFixed(2)} m  ry=${o.rotation.y.toFixed(2)}  `
      + `(${o.position.x.toFixed(2)}, ${o.position.y.toFixed(2)}, ${o.position.z.toFixed(2)})  ${f}`);
  });
  total += n;
  /* Peça mais baixa que o cartaz não é erro por si: em armário de vestiário e em
     muro de 3 m com faixa pintada no topo o teto é FÍSICO. Por isso conta, não reprova. */
  const abaixo = linhas.filter((l) => parseFloat(l.split('×')[1]) < H_CARTAZ).length;
  curtos += abaixo;
  console.log(`${id.padEnd(15)} ${String(n).padStart(3)} decalque(s) | ${files.size} arquivo(s) distinto(s)`
    + (n ? ` | altura ${menor.toFixed(2)}–${maior.toFixed(2)} m | ${abaixo} abaixo dos ${H_CARTAZ} m do cartaz` : ''));
  if (VERBOSE) linhas.sort().forEach((l) => console.log(l));
}
console.log(`DECALPROBE total ${total} | abaixo do cartaz ${curtos}`);
