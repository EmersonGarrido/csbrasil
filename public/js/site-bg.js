/* Fundo das páginas do site: o mesmo mundo 3D do menu do jogo, orbitando.
   `buildWorld` (public/js/map.js, a "Praça clássica") -> `buildBrasilia`: o mapa clássico foi
   APAGADO nesta rodada a pedido do dono e o arquivo dele foi junto. Este era o último lugar
   fora do registro que ainda o importava — e trocar por Brasília é o que o comentário acima
   já prometia: o menu abre no `awp_map` (maps.js `DEFAULT_MAP`), que é justamente o
   buildBrasilia. Agora o fundo do site é, de fato, o mesmo mundo do menu. */
import * as THREE from 'three';
import { initTextures } from './textures.js';
import { buildBrasilia } from './map_brasilia.js';

const canvas = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;

const scene = new THREE.Scene();
buildBrasilia(scene, initTextures());
const cam = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400);

let angle = Math.random() * 10, last = performance.now();
function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  angle += dt * 0.06;
  cam.position.set(Math.sin(angle) * 34, 17 + Math.sin(angle * 0.6) * 4, Math.cos(angle) * 34);
  cam.lookAt(0, 1, 0);
  renderer.render(scene, cam);
}
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
});
requestAnimationFrame(loop);
