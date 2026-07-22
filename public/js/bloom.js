// Bloom leve (FASE 4) — composer por cena, SEM tocar no game.js.
// Faz patch em renderer.render: toda cena passa a renderizar via
// EffectComposer (RenderPass → UnrealBloomPass → OutputPass), com cache por Scene.
// O OutputPass é obrigatório no three r160 p/ manter ACES tone mapping + sRGB corretos.
import * as THREE from 'three';
import { EffectComposer } from '../vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/addons/postprocessing/OutputPass.js';

export function enableLightBloom(renderer) {
  const composers = new Map();
  const rawRender = renderer.render.bind(renderer);
  const patched = (scene, camera) => {
    const cp = forScene(scene, camera);
    // EffectComposer.render() chama renderer.render internamente (quads dos passes):
    // restaura o raw durante o composer p/ não recursar infinito, reinstala depois.
    renderer.render = rawRender;
    cp.render();
    renderer.render = patched;
  };
  const forScene = (scene, camera) => {
    let cp = composers.get(scene);
    if (!cp) {
      cp = new EffectComposer(renderer);
      cp.setPixelRatio(renderer.getPixelRatio());
      cp.setSize(innerWidth, innerHeight);
      cp.addPass(new RenderPass(scene, camera));
      // threshold alto (0.85): só picos de brilho (sol, flash de tiro, speculars) — "bloom leve"
      cp.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.25, 0.45, 0.85));
      cp.addPass(new OutputPass());
      composers.set(scene, cp);
    } else if (cp._w !== innerWidth || cp._h !== innerHeight) {
      cp.setSize(innerWidth, innerHeight);   // acompanha resize da janela
      cp._w = innerWidth; cp._h = innerHeight;
    }
    return cp;
  };
  renderer.render = patched;
  return () => { renderer.render = rawRender; composers.clear(); };   // off switch (debug)
}
