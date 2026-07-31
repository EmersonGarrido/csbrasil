// Pós-processamento (FASE 4/5) — composer por cena, SEM tocar no game.js.
// RenderPass → UnrealBloomPass (leve, só picos) → CompositePass (look CoD, port do
// Claude-of-Duty src/render/composite.js: chromatic aberration radial + vinheta cos⁴ em
// linear + tone map AgX (ombros modernos, sem o magenta do ACES) + grain/dither em display).
import * as THREE from 'three';
import { EffectComposer } from '../vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from '../vendor/addons/postprocessing/ShaderPass.js';
import { OutputPass } from '../vendor/addons/postprocessing/OutputPass.js';

// GLSL portado 1:1 do CoD (glsl.js COMMON + TONEMAP, composite.js main) — enxuto:
// sem LUT/exposure adaptativa/sharpen (esses dependem do prepass MRT dele).
const COMPOSITE = {
  uniforms: {
    tDiffuse: { value: null },
    uLens: { value: new THREE.Vector4(0.0016, 0.28, 0.05, 0) },   // x CA, y vinheta, z grain, w time
    uLook: { value: new THREE.Vector4(1.0, 1.25, 1.05, 1.0) },    // x agx slope, y power, z sat, w exposure
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform vec4 uLens;
    uniform vec4 uLook;
    varying vec2 vUv;

    float owLum( vec3 c ) { return dot( c, vec3( 0.2126, 0.7152, 0.0722 ) ); }
    vec3 owLinearToSrgb( vec3 c ) {
      c = max( c, vec3( 0.0 ) );
      return mix( c * 12.92, 1.055 * pow( c, vec3( 0.41666667 ) ) - 0.055, step( 0.0031308, c ) );
    }
    float owHash12( vec2 p ) {
      vec3 p3 = fract( vec3( p.xyx ) * 0.1031 );
      p3 += dot( p3, p3.yzx + 33.33 );
      return fract( ( p3.x + p3.y ) * p3.z );
    }
    const mat3 OW_REC2020_FROM_SRGB = mat3(
      vec3( 0.6274, 0.0691, 0.0164 ),
      vec3( 0.3293, 0.9195, 0.0880 ),
      vec3( 0.0433, 0.0113, 0.8956 ) );
    const mat3 OW_SRGB_FROM_REC2020 = mat3(
      vec3(  1.6605, -0.1246, -0.0182 ),
      vec3( -0.5876,  1.1329, -0.1006 ),
      vec3( -0.0728, -0.0083,  1.1187 ) );
    vec3 owAgxContrast( vec3 x ) {
      vec3 x2 = x * x;
      vec3 x4 = x2 * x2;
      return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x
           + 0.4298 * x2 + 0.1191 * x - 0.00232;
    }
    vec3 owAgX( vec3 color, float slope, float power, float sat ) {
      const mat3 inset = mat3(
        vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
        vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
        vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 ) );
      const mat3 outset = mat3(
        vec3(  1.1271005818144368, -0.1413297634984383, -0.14132976349843826 ),
        vec3( -0.11060664309660323, 1.157823702216272, -0.11060664309660294 ),
        vec3( -0.016493938717834573, -0.016493938717834257, 1.2519364065950405 ) );
      const float minEv = -12.47393;
      const float maxEv = 4.026069;
      color = OW_REC2020_FROM_SRGB * color;
      color = inset * color;
      color = max( color, 1e-10 );
      color = ( log2( color ) - minEv ) / ( maxEv - minEv );
      color = clamp( color, 0.0, 1.0 );
      color = pow( max( color * slope, 0.0 ), vec3( power ) );
      float l = owLum( color );
      color = l + sat * ( color - l );
      color = owAgxContrast( clamp( color, 0.0, 1.0 ) );
      color = outset * color;
      color = pow( max( color, vec3( 0.0 ) ), vec3( 2.2 ) );
      color = OW_SRGB_FROM_REC2020 * color;
      return clamp( color, 0.0, 1.0 );
    }

    void main() {
      vec2 d = vUv - 0.5;
      float r2 = dot( d, d );
      // chromatic aberration radial (cantos)
      vec3 hdr;
      float ca = uLens.x * r2;
      if ( ca > 0.00002 ) {
        vec2 o = d * ca;
        hdr.r = texture2D( tDiffuse, vUv + o ).r;
        hdr.g = texture2D( tDiffuse, vUv ).g;
        hdr.b = texture2D( tDiffuse, vUv - o ).b;
      } else {
        hdr = texture2D( tDiffuse, vUv ).rgb;
      }
      hdr = max( hdr, vec3( 0.0 ) );
      hdr *= uLook.w;
      // vinheta cos⁴ em LUZ LINEAR (transmissão da lente — antes da curva de tom)
      float cos4 = pow( 1.0 / ( 1.0 + r2 * 2.4 ), 2.0 );
      hdr *= mix( 1.0, cos4, uLens.y );
      // tone map AgX
      vec3 col = owAgX( hdr, uLook.x, uLook.y, uLook.z );
      col = clamp( col, 0.0, 1.0 );
      vec3 disp = owLinearToSrgb( col );
      // grain em display space, menos nos escuros
      if ( uLens.z > 0.0005 ) {
        float g = owHash12( gl_FragCoord.xy + uLens.w * 137.13 ) - 0.5;
        float g2 = owHash12( gl_FragCoord.xy * 1.7 - uLens.w * 71.3 ) - 0.5;
        float noise = ( g * 0.65 + g2 * 0.35 );
        float l = owLum( disp );
        float response = uLens.z * ( 0.35 + 0.65 * smoothstep( 0.0, 0.30, l ) );
        disp += noise * response;
      }
      // dither ordenado anti-banding
      disp += ( owHash12( gl_FragCoord.xy * 0.5 + uLens.w ) - 0.5 ) * 0.0022;
      gl_FragColor = vec4( disp, 1.0 );
    }
  `,
};

export function enableLightBloom(renderer) {
  const composers = new Map();
  const rawRender = renderer.render.bind(renderer);
  renderer.__postPatched = true;   // game.js: sem essa flag ele desenha a vmScene manualmente
  const patched = (scene, camera) => {
    const cp = forScene(scene, camera);
    // EffectComposer.render() chama renderer.render internamente (quads dos passes):
    // restaura o raw durante o composer p/ não recursar infinito, reinstala depois.
    renderer.render = rawRender;
    cp._time = (cp._time || 0) + 1 / 60;
    const lastU = cp.passes[cp.passes.length - 1].uniforms;
    if (lastU && lastU.uLens) lastU.uLens.value.w = cp._time;
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
      // Viewmodel em cena própria (rig de luz dedicado, port CoD): desenha POR CIMA do
      // mundo, limpando só a profundidade — arma nunca clipa na geometria do mapa e
      // recebe bloom/AgX junto (mesmo look). game.js seta scene.userData.vmPass.
      if (scene.userData.vmPass) {
        const vmp = new RenderPass(scene.userData.vmPass.scene, scene.userData.vmPass.camera);
        vmp.clear = false; vmp.clearDepth = true;
        cp.addPass(vmp);
      }
      // threshold alto (0.85): só picos de brilho (sol, flash de tiro, speculars) — "bloom leve"
      cp.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.25, 0.45, 0.85));
      // A/B: ?post=output usa o OutputPass clássico (ACES), default = composite AgX
      if (new URLSearchParams(location.search).get('post') === 'output') cp.addPass(new OutputPass());
      else cp.addPass(new ShaderPass(COMPOSITE));   // AgX + vinheta + grain (look CoD)
      composers.set(scene, cp);
    } else if (cp._w !== innerWidth || cp._h !== innerHeight) {
      cp.setSize(innerWidth, innerHeight);   // acompanha resize da janela
      cp._w = innerWidth; cp._h = innerHeight;
    }
    return cp;
  };
  renderer.render = patched;
  return () => { renderer.render = rawRender; renderer.__postPatched = false; composers.clear(); };   // off switch (debug)
}
