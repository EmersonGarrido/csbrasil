import { initTextures, bootGame, THREE } from './harness.mjs';

const arg = process.argv.find((value) => value.startsWith('--mutante='));
const mutante = arg ? arg.split('=')[1] : '';
const falhas = [];
const verdes = [];
let mutou = false;

const game = bootGame('praca_poderes', { textures: initTextures(), ctf: true, seed: 3311 });
const world = game.world;
const root = world.root;
game.scene.updateMatrixWorld(true);
root.updateMatrixWorld(true);

const visivel = (objeto) => {
  for (let atual = objeto; atual; atual = atual.parent) if (!atual.visible) return false;
  return true;
};

// PA1 — o espelho usa a água viva já auditada pelo runtime, em vez de um plano opaco.
{
  let agua = null;
  root.traverse((objeto) => {
    if (objeto.isMesh && objeto.userData?.aguaViva) agua = objeto;
  });
  if (mutante === 'agua' && agua) {
    agua.userData.aguaViva = false;
    agua = null;
    mutou = true;
  }
  if (!agua) {
    falhas.push('PA1: espelho sem mesh aguaViva');
  } else {
    const caixa = new THREE.Box3().setFromObject(agua);
    const lista = game.scene.userData.waters || [];
    const uniforme = agua.material?.uniforms || {};
    const sol = world.sun.position.clone().normalize();
    const alinhamento = uniforme.uSolDir?.value?.clone().normalize().dot(sol) ?? -1;
    if (!agua.material?.isShaderMaterial) falhas.push('PA1: aguaViva não usa ShaderMaterial');
    if (!lista.some((item) => item.mesh === agua)) falhas.push('PA1: água fora de scene.userData.waters');
    if (caixa.min.z < 70 || caixa.max.z > 90 || caixa.max.x - caixa.min.x < 20)
      falhas.push(`PA1: água fora da bacia (${caixa.min.x.toFixed(1)}..${caixa.max.x.toFixed(1)} / ${caixa.min.z.toFixed(1)}..${caixa.max.z.toFixed(1)})`);
    if (alinhamento < 0.98) falhas.push(`PA1: sol da água desalinhado (${alinhamento.toFixed(3)})`);
    if (uniforme.uProfEscala?.value > 1) falhas.push(`PA1: profundidade de oceano (${uniforme.uProfEscala.value})`);
    if (!falhas.some((falha) => falha.startsWith('PA1'))) verdes.push(`PA1 água viva e alinhada (dot ${alinhamento.toFixed(3)})`);
  }
}

// PA2 — das rotas sob os pilotis, o horizonte precisa terminar em massa urbana vertical.
{
  if (mutante === 'horizonte') {
    root.traverse((objeto) => {
      if (objeto.userData?.pracaHorizonte) {
        objeto.visible = false;
        mutou = true;
      }
    });
  }
  const alvos = [];
  root.traverse((objeto) => {
    if (objeto.isMesh && !objeto.isSprite && visivel(objeto) && objeto.material?.visible !== false) alvos.push(objeto);
  });
  const raio = new THREE.Raycaster();
  raio.near = 20;
  raio.far = 330;
  const origem = new THREE.Vector3();
  const direcao = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const angulos = [0, 10, -10, 20, -20, 35, -35, 50, -50].map((graus) => graus * Math.PI / 180);
  let total = 0;
  let acertos = 0;
  for (const sinal of [-1, 1]) for (const x of [36, 44]) for (let z = -60; z <= 60; z += 10) {
    for (const angulo of angulos) {
      origem.set(sinal * x, 1.62, z);
      direcao.set(sinal * Math.cos(angulo), 0, Math.sin(angulo)).normalize();
      raio.set(origem, direcao);
      total++;
      const acertou = raio.intersectObjects(alvos, false).some((hit) => {
        if (!hit.face) return false;
        normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
        return Math.abs(normal.y) < 0.6;
      });
      if (acertou) acertos++;
    }
  }
  const fracao = acertos / total;
  if (fracao < 0.5) falhas.push(`PA2: horizonte urbano cobre ${(fracao * 100).toFixed(0)}% dos raios [mínimo 50%]`);
  else verdes.push(`PA2 horizonte urbano ${(fracao * 100).toFixed(0)}%`);
}

// PA3 — cobertura baixa deve quebrar as quatro saídas dos flancos em intervalos jogáveis.
// A medida usa colliders reais, na altura do peito, e não o nome/tag da malha.
{
  const amostras = [];
  for (const x of [-34, 34]) for (const z of [-48, -24, 0, 24, 48]) amostras.push({ x, z });
  let cobertas = 0;
  const cobertura = (ponto) => world.colliders.some((c) => {
    if (c.minY > 0.35 || c.maxY < 1.05 || c.maxY > 3.6) return false;
    const cx = (c.minX + c.maxX) / 2;
    const cz = (c.minZ + c.maxZ) / 2;
    const area = (c.maxX - c.minX) * (c.maxZ - c.minZ);
    return area <= 60 && Math.hypot(cx - ponto.x, cz - ponto.z) <= 8;
  });
  if (mutante === 'cobertura') {
    for (const c of world.colliders) {
      if (c.pracaR2) {
        c.minY = 9;
        c.maxY = 9.1;
        mutou = true;
      }
    }
  }
  for (const ponto of amostras) if (cobertura(ponto)) cobertas++;
  if (cobertas < 8) falhas.push(`PA3: cobertura dos flancos em ${cobertas}/${amostras.length} intervalos [mínimo 8/10]`);
  else verdes.push(`PA3 cobertura dos flancos ${cobertas}/${amostras.length}`);
}

// PA4 — três famílias de rota continuam acessíveis dos dois spawns às três bandeiras.
{
  const nos = world.waypoints.nodes;
  const adj = world.waypoints.adj;
  if (mutante === 'rota') {
    for (let i = 0; i < nos.length; i++) if (nos[i].x > 8) adj[i] = [];
    mutou = true;
  }
  const alcança = (inicio, fim, faixa = () => true) => {
    const fila = [inicio];
    const vistos = new Uint8Array(nos.length);
    vistos[inicio] = 1;
    for (let cursor = 0; cursor < fila.length; cursor++) {
      const atual = fila[cursor];
      if (atual === fim) return true;
      for (const proximo of adj[atual]) {
        if (vistos[proximo] || !faixa(nos[proximo])) continue;
        vistos[proximo] = 1;
        fila.push(proximo);
      }
    }
    return false;
  };
  const faixas = [
    ['oeste', (n) => n.x < -8],
    ['centro', (n) => Math.abs(n.x) <= 14],
    ['leste', (n) => n.x > 8],
  ];
  let ligacoes = 0;
  for (const spawns of Object.values(world.spawns)) {
    const inicio = world.nearestWaypoint(spawns[0].x, spawns[0].z);
    for (const bandeira of game.ctfPts) {
      const fim = world.nearestWaypoint(bandeira.x, bandeira.z);
      if (alcança(inicio, fim)) ligacoes++;
    }
  }
  const rotasLongitudinais = faixas.map(([nome, faixa]) => {
    const candidatos = nos.map((n, i) => ({ ...n, i })).filter(faixa);
    const sul = candidatos.reduce((melhor, n) => !melhor || n.z < melhor.z ? n : melhor, null);
    const norte = candidatos.reduce((melhor, n) => !melhor || n.z > melhor.z ? n : melhor, null);
    return { nome, ok: !!(sul && norte && norte.z - sul.z >= 100 && alcança(sul.i, norte.i, faixa)) };
  });
  const laterais = rotasLongitudinais.every((rota) => rota.ok);
  if (ligacoes !== 6 || !laterais) falhas.push(`PA4: rotas acessíveis ${ligacoes}/6; eixos ${rotasLongitudinais.map((r) => `${r.nome}=${r.ok}`).join(', ')}`);
  else verdes.push('PA4 seis ligações spawn→CTF e três eixos longitudinais navegáveis');
}

if (mutante && !mutou) {
  console.error(`MUTANTE NÃO APLICOU: ${mutante}`);
  process.exit(2);
}
for (const verde of verdes) console.log(`  ✓ ${verde}`);
for (const falha of falhas) console.log(`  ✗ ${falha}`);
console.log(falhas.length ? `✗ PRACA-R2${mutante ? ` [${mutante}]` : ''}: ${falhas.length} falha(s)` : `✓ PRACA-R2${mutante ? ` [${mutante}]` : ''}: PA1–PA4 verdes`);
process.exit(falhas.length ? 1 : 0);
