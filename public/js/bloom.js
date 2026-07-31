// Pós-processamento (FASE 4/5/6) — composer por cena, SEM tocar no game.js.
// RenderPass → SSAO (half-res, depth-only) → [vmPass] → UnrealBloomPass → CompositePass
// (AgX calibrado + vinheta + piso de ambiente) → AA/Sharpen/Grain.
//
// PORQUÊ das mudanças da R7 (crítica de gráficos, nota 3.2):
//  (1) Não existia NENHUMA fonte de oclusão ambiental no projeto — props liam como
//      "adesivo colado no chão". Entra SSAO escrito à mão (o vendor é r160, N8AO exige
//      r161+ e o npm está bloqueado), reconstruindo posição de view a partir do
//      depthTexture do render target do composer + inverse projection.
//  (2) A imagem estava ~1.5 stop subexposta e crushada: uLook.power 1.25 é uma gama
//      aplicada DEPOIS da normalização log2 do AgX — ela puxa todo o meio-tom pra baixo.
//      Agora power 1.0, exposure por mapa e um piso de ambiente suave (o "clamp do
//      indirect lighting cache" da Riot) que impede sombra virar #000 sem informação.
//  (3) renderer.toneMapping é alavanca MORTA com composer (three só aplica tonemap quando
//      o alvo é null) — main.js agora deixa NoToneMapping explícito quando o composite
//      está ativo, pra não haver dúvida de tonemap duplo.
//  (4) Sem MSAA no composer (target HDR) a imagem serrilhava: FXAA barato + sharpen leve
//      pós-tonemap no último passe (grain migrou pra lá, senão o sharpen amplifica ruído).
//  (5) Foco dinâmico do shadow map do sol em volta do jogador: 12.8 cm/texel → ~2.2 cm/texel.
import * as THREE from 'three';
import { EffectComposer } from '../vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from '../vendor/addons/postprocessing/ShaderPass.js';
import { OutputPass } from '../vendor/addons/postprocessing/OutputPass.js';
import { Pass, FullScreenQuad } from '../vendor/addons/postprocessing/Pass.js';

const QP = () => new URLSearchParams(location.search);

/* ================================================================
   LOOK POR MAPA — exposição e piso de ambiente
   Os 4 mapas dividiam a MESMA exposição, e eles não têm nada a ver um com o outro
   (Brasília meio-dia vs. Ferro Velho fim de tarde). Medição do crítico: awp_map com
   L* médio 8.5 e 22.7 % dos pixels abaixo de L* 3 — o mapa mais escuro leva a maior
   exposição. `floor` é um piso ADITIVO SUAVE em luz linear (bounce/GI que o jogo não
   simula): em hdr=0 vale `floor`, e some sozinho conforme hdr cresce — não achata highlight.
   Override pra tuning do lead: ?exp=1.7&floor=0.014
   ================================================================ */
// Calibrado invertendo a curva ANTIGA sobre os L* medidos pelo crítico e reaplicando a
// nova (tools ad-hoc, ver relatório): L* médio esperado awp_map 8.4→37.5, havan 26.6→49.6,
// ferrovelho 22.5→46.9, pool_day 45.9→62.2; sombra profunda 0.4→23.4 (alvo: < 1 % em L*<3).
const LOOKS = {
  awp_map:       { exposure: 2.00, floor: 0.016 },   // Brasília: o frame mais crushado medido
  praca_old:     { exposure: 1.90, floor: 0.014 },
  fy_pool_day:   { exposure: 1.10, floor: 0.013 },   // Piscinão: céu grande, já é o mais claro
  fy_havan:      { exposure: 1.45, floor: 0.010 },
  fy_ferrovelho: { exposure: 1.55, floor: 0.012 },
};
const DEFAULT_LOOK = { exposure: 1.55, floor: 0.012 };

function currentLook() {
  let id = null;
  try {
    id = QP().get('map') || (JSON.parse(localStorage.getItem('awpbr_settings') || '{}').map);
  } catch (e) { /* localStorage bloqueado — cai no default */ }
  const base = LOOKS[id] || DEFAULT_LOOK;
  const q = QP();
  const exp = parseFloat(q.get('exp'));
  const flo = parseFloat(q.get('floor'));
  return {
    exposure: isFinite(exp) ? exp : base.exposure,
    floor: isFinite(flo) ? flo : base.floor,
  };
}

/* ================================================================
   SSAO — half-res, 10 amostras, reconstrução por inverse projection
   ================================================================ */
const SSAO_SAMPLES = 10;

// kernel hemisférico determinístico (LCG com seed fixa: mesmo AO todo boot, sem surpresa)
function makeKernel(n) {
  const out = []; let seed = 20260731 >>> 0;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, 0.18 + rnd() * 0.82).normalize();
    // amostras concentradas perto do centro do hemisfério = contato mais nítido no encosto
    let s = (i + 1) / n; s = 0.22 + 0.78 * s * s;
    out.push(v.multiplyScalar(s));
  }
  return out;
}

const SSAO_COMMON = /* glsl */`
  uniform vec2 uNearFar;
  uniform mat4 uProj;
  uniform mat4 uInvProj;
  float owViewZ( float d ) {
    // depth não-linear -> viewZ (negativo, à frente da câmera)
    return ( uNearFar.x * uNearFar.y ) / ( ( uNearFar.y - uNearFar.x ) * d - uNearFar.y );
  }
  vec3 owViewPos( vec2 uv, float d ) {
    float vz = owViewZ( d );
    float clipW = uProj[2][3] * vz + uProj[3][3];
    vec4 clip = vec4( ( vec3( uv, d ) - 0.5 ) * 2.0, 1.0 ) * clipW;
    return ( uInvProj * clip ).xyz;
  }
`;

const SSAO_FRAG = /* glsl */`
  uniform sampler2D tDepth;
  uniform vec2 uTexel;      // 1/resolução do buffer de AO (meia res)
  uniform vec4 uAo;         // x raio(m), y falloff(m), z power, w bias(m)
  uniform vec3 uKernel[ ${SSAO_SAMPLES} ];
  varying vec2 vUv;
  ${SSAO_COMMON}
  float owHash12( vec2 p ) {
    vec3 p3 = fract( vec3( p.xyx ) * 0.1031 );
    p3 += dot( p3, p3.yzx + 33.33 );
    return fract( ( p3.x + p3.y ) * p3.z );
  }
  void main() {
    float d = texture2D( tDepth, vUv ).x;
    // céu (depth 1) não ocluí nada e não deve ser escurecido
    if ( d >= 0.9999 ) { gl_FragColor = vec4( 1.0, 1.0, 0.0, 1.0 ); return; }
    vec3 p = owViewPos( vUv, d );

    // Normal reconstruída por 4 taps com escolha da menor derivada (evita "aba" nas
    // silhuetas, que é onde a derivada simples inventa geometria e vaza AO no céu).
    vec2 e = uTexel;
    vec3 pL = owViewPos( vUv - vec2( e.x, 0.0 ), texture2D( tDepth, vUv - vec2( e.x, 0.0 ) ).x );
    vec3 pR = owViewPos( vUv + vec2( e.x, 0.0 ), texture2D( tDepth, vUv + vec2( e.x, 0.0 ) ).x );
    vec3 pD = owViewPos( vUv - vec2( 0.0, e.y ), texture2D( tDepth, vUv - vec2( 0.0, e.y ) ).x );
    vec3 pU = owViewPos( vUv + vec2( 0.0, e.y ), texture2D( tDepth, vUv + vec2( 0.0, e.y ) ).x );
    vec3 dx = ( abs( pR.z - p.z ) < abs( p.z - pL.z ) ) ? ( pR - p ) : ( p - pL );
    vec3 dy = ( abs( pU.z - p.z ) < abs( p.z - pD.z ) ) ? ( pU - p ) : ( p - pD );
    vec3 n = normalize( cross( dx, dy ) );
    if ( dot( n, -p ) < 0.0 ) n = -n;

    float ang = owHash12( gl_FragCoord.xy ) * 6.2831853;
    vec3 rv = vec3( cos( ang ), sin( ang ), 0.0 );
    vec3 t = normalize( rv - n * dot( rv, n ) );
    vec3 b = cross( n, t );
    mat3 tbn = mat3( t, b, n );

    float radius = uAo.x;
    // bias cresce com a distância: o depth de 24 bits perde resolução longe e um bias fixo
    // vira acne/banda no chão em ângulo rasante
    float bias = uAo.w * ( 1.0 + 0.04 * ( -p.z ) );
    float occ = 0.0;
    for ( int i = 0; i < ${SSAO_SAMPLES}; i++ ) {
      vec3 sp = p + ( tbn * uKernel[ i ] ) * radius;
      vec4 off = uProj * vec4( sp, 1.0 );
      // sem continue: GLSL ES 1.00 exige loop bem-comportado pra indexar uniform array
      vec2 suv = ( off.xy / max( off.w, 1e-4 ) ) * 0.5 + 0.5;
      float sd = texture2D( tDepth, clamp( suv, vec2( 0.0 ), vec2( 1.0 ) ) ).x;
      float sz = owViewZ( sd );
      // sz > sp.z => a superfície amostrada está MAIS PERTO da câmera => ocluí
      float diff = sz - sp.z;
      float range = smoothstep( 0.0, 1.0, uAo.y / max( 1e-4, abs( p.z - sz ) ) );
      occ += step( bias, diff ) * range;
    }
    float ao = 1.0 - occ / float( ${SSAO_SAMPLES} );
    ao = pow( clamp( ao, 0.0, 1.0 ), uAo.z );
    // g = depth linear normalizado em 20 m — chave do blur bilateral (8 bits ≈ 8 cm)
    gl_FragColor = vec4( ao, clamp( -p.z / 20.0, 0.0, 1.0 ), 0.0, 1.0 );
  }
`;

// blur bilateral 4x4 (16 taps) na meia-res, com edge-stop pelo depth do canal g:
// AO ruidoso sem blur lê como "sujeira animada" — pior que não ter AO.
const SSAO_BLUR_FRAG = /* glsl */`
  uniform sampler2D tAO;
  uniform vec2 uTexel;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D( tAO, vUv );
    float sum = 0.0, wsum = 0.0;
    for ( int y = -2; y <= 1; y++ ) {
      for ( int x = -2; x <= 1; x++ ) {
        vec2 uv = vUv + vec2( float( x ) + 0.5, float( y ) + 0.5 ) * uTexel;
        vec4 s = texture2D( tAO, uv );
        // peso cai forte com diferença de profundidade (0.02 ≈ 40 cm no range de 20 m)
        float w = exp( -abs( s.g - c.g ) / 0.02 );
        sum += s.r * w; wsum += w;
      }
    }
    gl_FragColor = vec4( wsum > 0.0 ? sum / wsum : c.r, c.g, 0.0, 1.0 );
  }
`;

// Aplicação: multiplica o buffer inteiro (não há MRT pra separar direto/indireto), mas
// com rolloff no highlight — assim o AO não come o especular do sol nem o céu.
const SSAO_APPLY_FRAG = /* glsl */`
  uniform sampler2D tDiffuse;
  uniform sampler2D tAO;
  uniform vec2 uApply;   // x força, y rolloff no highlight
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D( tDiffuse, vUv ).rgb;
    float ao = texture2D( tAO, vUv ).r;
    float l = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );
    float k = uApply.x * ( 1.0 - uApply.y * smoothstep( 0.20, 1.40, l ) );
    gl_FragColor = vec4( c * mix( 1.0, ao, clamp( k, 0.0, 1.0 ) ), 1.0 );
  }
`;

const SSAO_VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }
`;

class SSAOPass extends Pass {
  constructor(camera, opts = {}) {
    super();
    this.camera = camera;
    this.needsSwap = true;
    const rtOpt = { depthBuffer: false, stencilBuffer: false, type: THREE.UnsignedByteType, format: THREE.RGBAFormat };
    this.aoRT = new THREE.WebGLRenderTarget(1, 1, rtOpt);
    this.blurRT = new THREE.WebGLRenderTarget(1, 1, rtOpt);
    const kernel = makeKernel(SSAO_SAMPLES);
    this.ssaoMat = new THREE.ShaderMaterial({
      name: 'ssao', vertexShader: SSAO_VERT, fragmentShader: SSAO_FRAG, depthTest: false, depthWrite: false,
      uniforms: {
        tDepth: { value: null },
        uTexel: { value: new THREE.Vector2(1, 1) },
        uNearFar: { value: new THREE.Vector2(0.1, 400) },
        uProj: { value: new THREE.Matrix4() },
        uInvProj: { value: new THREE.Matrix4() },
        // raio 0.6 m / falloff 1.2 m / power 1.35 / bias 2 cm (mata self-occlusion do depth 24 bits)
        uAo: { value: new THREE.Vector4(opts.radius ?? 0.6, 1.2, opts.power ?? 1.35, 0.02) },
        uKernel: { value: kernel },
      },
    });
    this.blurMat = new THREE.ShaderMaterial({
      name: 'ssao-blur', vertexShader: SSAO_VERT, fragmentShader: SSAO_BLUR_FRAG, depthTest: false, depthWrite: false,
      uniforms: { tAO: { value: null }, uTexel: { value: new THREE.Vector2(1, 1) } },
    });
    this.applyMat = new THREE.ShaderMaterial({
      name: 'ssao-apply', vertexShader: SSAO_VERT, fragmentShader: SSAO_APPLY_FRAG, depthTest: false, depthWrite: false,
      uniforms: { tDiffuse: { value: null }, tAO: { value: null }, uApply: { value: new THREE.Vector2(opts.strength ?? 0.95, 0.55) } },
    });
    this.strength = opts.strength ?? 0.95;
    this.applyMat.uniforms.tAO.value = this.blurRT.texture;   // sempre um sampler válido
    this.fq = new FullScreenQuad(this.ssaoMat);
  }
  setSize(w, h) {
    const hw = Math.max(2, Math.floor(w / 2)), hh = Math.max(2, Math.floor(h / 2));
    this.aoRT.setSize(hw, hh); this.blurRT.setSize(hw, hh);
    this.ssaoMat.uniforms.uTexel.value.set(1 / hw, 1 / hh);
    this.blurMat.uniforms.uTexel.value.set(1 / hw, 1 / hh);
  }
  render(renderer, writeBuffer, readBuffer) {
    const dt = readBuffer.depthTexture;
    const cam = this.camera;
    // Fail-safe: sem depth texture (ou câmera não-perspectiva) o passe vira um blit puro —
    // nunca tela preta, só sem AO.
    this.applyMat.uniforms.uApply.value.x = (dt && cam && cam.isPerspectiveCamera) ? this.strength : 0.0;
    if (dt && cam && cam.isPerspectiveCamera) {
      const u = this.ssaoMat.uniforms;
      u.tDepth.value = dt;
      u.uNearFar.value.set(cam.near, cam.far);
      u.uProj.value.copy(cam.projectionMatrix);
      u.uInvProj.value.copy(cam.projectionMatrixInverse);
      renderer.setRenderTarget(this.aoRT); this.fq.material = this.ssaoMat; this.fq.render(renderer);
      this.blurMat.uniforms.tAO.value = this.aoRT.texture;
      renderer.setRenderTarget(this.blurRT); this.fq.material = this.blurMat; this.fq.render(renderer);
    }
    this.applyMat.uniforms.tDiffuse.value = readBuffer.texture;
    this.applyMat.uniforms.tAO.value = this.blurRT.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.fq.material = this.applyMat; this.fq.render(renderer);
  }
  dispose() {
    this.aoRT.dispose(); this.blurRT.dispose();
    this.ssaoMat.dispose(); this.blurMat.dispose(); this.applyMat.dispose(); this.fq.dispose();
  }
}

/* ================================================================
   COMPOSITE — CA radial + piso de ambiente + vinheta + AgX
   ================================================================ */
const COMPOSITE = {
  uniforms: {
    tDiffuse: { value: null },
    // x CA, y vinheta (0.28 → 0.14: a 0.28 os cantos perdiam ~1 stop em luz LINEAR), z grain, w time
    uLens: { value: new THREE.Vector4(0.0016, 0.14, 0.0, 0) },
    // x agx slope, y power (1.25 → 1.00: era gama pós-log2, crushava o meio-tom), z sat, w exposure
    uLook: { value: new THREE.Vector4(1.0, 1.0, 1.02, 1.55) },
    uFloor: { value: 0.012 },   // piso de ambiente aditivo suave (linear)
  },
  vertexShader: SSAO_VERT,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform vec4 uLens;
    uniform vec4 uLook;
    uniform float uFloor;
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
      // PISO DE AMBIENTE (soft): vale uFloor quando hdr=0 e desaparece sozinho quando
      // hdr >> uFloor. É o bounce/GI que o jogo não simula — sem ele 22.7 % do frame
      // ficava em L* < 3 (preto sem informação). max() puro criava degrau visível.
      hdr += uFloor * uFloor / ( hdr + vec3( uFloor ) );
      hdr *= uLook.w;
      // vinheta cos⁴ em LUZ LINEAR (transmissão da lente — antes da curva de tom)
      float cos4 = pow( 1.0 / ( 1.0 + r2 * 2.4 ), 2.0 );
      hdr *= mix( 1.0, cos4, uLens.y );
      // tone map AgX
      vec3 col = owAgX( hdr, uLook.x, uLook.y, uLook.z );
      col = clamp( col, 0.0, 1.0 );
      vec3 disp = owLinearToSrgb( col );
      // grain em display space, menos nos escuros (só quando ESTE é o último passe —
      // com o passe de AA/sharpen ativo o grain migra pra lá, senão o sharpen o amplifica)
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

/* ================================================================
   AA + SHARPEN + GRAIN (último passe, em display space)
   O composer renderiza em RT HDR — o antialias:true do canvas NÃO vale ali, então a
   imagem serrilhava em toda aresta. FXAA console (5 taps) + unsharp reaproveitando os
   mesmos taps: custo ~0.3 ms em 1080p.
   ================================================================ */
const AA_SHARPEN = {
  uniforms: {
    tDiffuse: { value: null },
    uTexel: { value: new THREE.Vector2(1 / 1280, 1 / 720) },
    uAa: { value: new THREE.Vector3(1.0, 0.22, 0.035) },   // x fxaa on/off, y sharpen, z grain
    uTime: { value: 0 },
  },
  vertexShader: SSAO_VERT,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform vec2 uTexel;
    uniform vec3 uAa;
    uniform float uTime;
    varying vec2 vUv;
    float owLum( vec3 c ) { return dot( c, vec3( 0.299, 0.587, 0.114 ) ); }
    float owHash12( vec2 p ) {
      vec3 p3 = fract( vec3( p.xyx ) * 0.1031 );
      p3 += dot( p3, p3.yzx + 33.33 );
      return fract( ( p3.x + p3.y ) * p3.z );
    }
    void main() {
      vec2 rcp = uTexel;
      vec3 rgbNW = texture2D( tDiffuse, vUv + vec2( -1.0, -1.0 ) * rcp ).rgb;
      vec3 rgbNE = texture2D( tDiffuse, vUv + vec2(  1.0, -1.0 ) * rcp ).rgb;
      vec3 rgbSW = texture2D( tDiffuse, vUv + vec2( -1.0,  1.0 ) * rcp ).rgb;
      vec3 rgbSE = texture2D( tDiffuse, vUv + vec2(  1.0,  1.0 ) * rcp ).rgb;
      vec3 rgbM  = texture2D( tDiffuse, vUv ).rgb;
      vec3 col = rgbM;
      if ( uAa.x > 0.5 ) {
        float lNW = owLum( rgbNW ), lNE = owLum( rgbNE ), lSW = owLum( rgbSW ), lSE = owLum( rgbSE ), lM = owLum( rgbM );
        float lMin = min( lM, min( min( lNW, lNE ), min( lSW, lSE ) ) );
        float lMax = max( lM, max( max( lNW, lNE ), max( lSW, lSE ) ) );
        vec2 dir = vec2( -( ( lNW + lNE ) - ( lSW + lSE ) ), ( ( lNW + lSW ) - ( lNE + lSE ) ) );
        float red = max( ( lNW + lNE + lSW + lSE ) * 0.03125, 0.0078125 );
        float rcpMin = 1.0 / ( min( abs( dir.x ), abs( dir.y ) ) + red );
        dir = clamp( dir * rcpMin, vec2( -8.0 ), vec2( 8.0 ) ) * rcp;
        vec3 rgbA = 0.5 * ( texture2D( tDiffuse, vUv + dir * ( 1.0 / 3.0 - 0.5 ) ).rgb
                          + texture2D( tDiffuse, vUv + dir * ( 2.0 / 3.0 - 0.5 ) ).rgb );
        vec3 rgbB = rgbA * 0.5 + 0.25 * ( texture2D( tDiffuse, vUv - dir * 0.5 ).rgb
                                        + texture2D( tDiffuse, vUv + dir * 0.5 ).rgb );
        float lB = owLum( rgbB );
        col = ( lB < lMin || lB > lMax ) ? rgbA : rgbB;
      }
      // unsharp leve pós-tonemap: devolve a microdefinição que FXAA e o upsample do AO comem
      if ( uAa.y > 0.001 ) {
        vec3 blur = ( rgbNW + rgbNE + rgbSW + rgbSE ) * 0.25;
        col = clamp( col + ( col - blur ) * uAa.y, 0.0, 1.0 );
      }
      if ( uAa.z > 0.0005 ) {
        float g = owHash12( gl_FragCoord.xy + uTime * 137.13 ) - 0.5;
        float g2 = owHash12( gl_FragCoord.xy * 1.7 - uTime * 71.3 ) - 0.5;
        float l = owLum( col );
        col += ( g * 0.65 + g2 * 0.35 ) * uAa.z * ( 0.35 + 0.65 * smoothstep( 0.0, 0.30, l ) );
      }
      gl_FragColor = vec4( col, 1.0 );
    }
  `,
};

/* ================================================================
   FOCO DINÂMICO DO SHADOW MAP DO SOL
   A shadow camera dos mapas cobre ~120 m com 2048² = 5.9 cm/texel (e 12.8 cm nos mapas
   grandes). Ninguém olha 120 m de sombra nítida — o que importa é o raio de combate.
   Aqui a ortho segue o jogador com raio de 22 m (2 × 22 / 2048 ≈ 2.1 cm/texel, ~6× melhor),
   com SNAP AO TEXEL (senão a sombra "ferve" quando o jogador anda) e bias/normalBias
   recalibrados pro novo extent (o bias antigo, tunado pra 120 m, viraria peter-panning).
   Kill-switch: ?shadowfocus=0
   ================================================================ */
const _sfV = {
  center: new THREE.Vector3(), fwd: new THREE.Vector3(), dir: new THREE.Vector3(),
  x: new THREE.Vector3(), y: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0),
};
let _sfEnabled = null;
let _sfR = null;
export function focusSunShadow(scene, camera, radius) {
  if (_sfEnabled === null) _sfEnabled = QP().get('shadowfocus') !== '0';
  if (!_sfEnabled || !scene || !camera || !camera.isPerspectiveCamera) return;
  let st = scene.userData.__sf;
  if (st === undefined) {
    st = null;
    scene.traverse(o => {
      if (o.isDirectionalLight && o.castShadow && o.shadow && o.shadow.camera && o.shadow.camera.isOrthographicCamera) {
        if (!st || o.intensity > st.light.intensity) st = { light: o };
      }
    });
    if (st) {
      const l = st.light;
      st.dir = new THREE.Vector3().copy(l.position).sub(l.target.position);
      st.dist = Math.max(20, st.dir.length());
      st.dir.normalize();
      if (l.shadow.mapSize.width < 2048) { l.shadow.mapSize.set(2048, 2048); l.shadow.map = null; }
      l.shadow.bias = -0.00008;      // extent 6× menor => bias 5× menor (senão peter-panning)
      l.shadow.normalBias = 0.03;    // 3 cm: mata o acne sem descolar o contato
    }
    scene.userData.__sf = st || false;
  }
  if (!st) return;
  if (_sfR === null) { const r = parseFloat(QP().get('shadowr')); _sfR = isFinite(r) ? r : 26; }
  const l = st.light, R = radius || _sfR;
  const v = _sfV;
  camera.getWorldDirection(v.fwd); v.fwd.y = 0;
  if (v.fwd.lengthSq() > 1e-6) v.fwd.normalize(); else v.fwd.set(0, 0, -1);
  // centro adiantado 35 % do raio na direção da vista: sobra mais sombra à frente
  v.center.copy(camera.position).addScaledVector(v.fwd, R * 0.35); v.center.y = 0;
  // snap ao texel no plano perpendicular à luz (anti-shimmer)
  const q = (2 * R) / l.shadow.mapSize.width;
  v.x.copy(v.up).cross(st.dir);
  if (v.x.lengthSq() < 1e-6) v.x.set(1, 0, 0);
  v.x.normalize();
  v.y.copy(st.dir).cross(v.x).normalize();
  const px = v.center.dot(v.x), py = v.center.dot(v.y);
  v.center.addScaledVector(v.x, Math.round(px / q) * q - px);
  v.center.addScaledVector(v.y, Math.round(py / q) * q - py);
  l.target.position.copy(v.center); l.target.updateMatrixWorld();
  l.position.copy(v.center).addScaledVector(st.dir, st.dist);
  l.updateMatrixWorld();
  const sc = l.shadow.camera;
  if (sc.right !== R) {
    sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R;
    sc.near = Math.max(0.5, st.dist - R * 2.2); sc.far = st.dist + R * 2.2;
    sc.updateProjectionMatrix();
  }
}

/* ================================================================ */
export function enableLightBloom(renderer, opts = {}) {
  const composers = new Map();
  const rawRender = renderer.render.bind(renderer);
  renderer.__postPatched = true;   // game.js: sem essa flag ele desenha a vmScene manualmente
  const qp = QP();
  const quality = opts.quality || 'med';
  // SSAO: só em med/high (gate de custo) e desligável por ?ao=0. ?ao=1 força mesmo em low.
  const aoOn = qp.get('ao') === '1' || (qp.get('ao') !== '0' && (quality === 'med' || quality === 'high'));
  const aaOn = qp.get('fxaa') !== '0';
  const useComposite = qp.get('post') !== 'output';

  const patched = (scene, camera) => {
    const cp = forScene(scene, camera);
    // EffectComposer.render() chama renderer.render internamente (quads dos passes):
    // restaura o raw durante o composer p/ não recursar infinito, reinstala depois.
    renderer.render = rawRender;
    cp._time = (cp._time || 0) + 1 / 60;
    if (cp._composite) cp._composite.uniforms.uLens.value.w = cp._time;
    if (cp._aa) cp._aa.uniforms.uTime.value = cp._time;
    if (cp._ssao) cp._ssao.camera = camera;   // a cena pode trocar de câmera (menu/preview)
    if (scene.userData.vmPass) focusSunShadow(scene, camera);   // só na cena de jogo
    cp.render();
    renderer.render = patched;
  };

  const attachDepth = (cp) => {
    // depthTexture próprio em CADA render target: o RenderPass do mundo escreve no
    // readBuffer, que alterna entre rt1/rt2 conforme os swaps — o SSAOPass sempre lê o
    // depth do buffer que acabou de receber a cena. (clone() já duplicaria, mas Texture
    // .copy() compartilha o Source; instâncias novas evitam qualquer aliasing de GL.)
    for (const rt of [cp.renderTarget1, cp.renderTarget2]) {
      if (rt.depthTexture) rt.depthTexture.dispose();
      const dtex = new THREE.DepthTexture(rt.width, rt.height);
      dtex.type = THREE.UnsignedIntType; dtex.format = THREE.DepthFormat;
      dtex.minFilter = THREE.NearestFilter; dtex.magFilter = THREE.NearestFilter;
      rt.depthTexture = dtex;
    }
  };

  const forScene = (scene, camera) => {
    let cp = composers.get(scene);
    if (!cp) {
      cp = new EffectComposer(renderer);
      cp.setPixelRatio(renderer.getPixelRatio());
      cp.setSize(innerWidth, innerHeight);
      cp._w = innerWidth; cp._h = innerHeight;
      cp.addPass(new RenderPass(scene, camera));
      if (aoOn) {
        attachDepth(cp);
        // SSAO ANTES do vmPass: o RenderPass do viewmodel faz clearDepth e apagaria o
        // depth do mundo. Antes do bloom também, pra o AO não virar fonte de brilho.
        const ss = new SSAOPass(camera, {
          radius: parseFloat(qp.get('aoradius')) || 0.6,
          strength: parseFloat(qp.get('aostr')) || (quality === 'high' ? 1.0 : 0.85),
          power: 1.35,
        });
        ss.setSize(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio());
        cp.addPass(ss); cp._ssao = ss;
      }
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
      if (!useComposite) cp.addPass(new OutputPass());
      else {
        const comp = new ShaderPass(COMPOSITE);
        const look = currentLook();
        comp.uniforms.uLook.value.w = look.exposure;
        comp.uniforms.uFloor.value = look.floor;
        comp.uniforms.uLens.value.z = aaOn ? 0.0 : 0.035;   // grain vai pro passe de AA quando houver
        cp.addPass(comp); cp._composite = comp;
        if (aaOn) {
          const aa = new ShaderPass(AA_SHARPEN);
          aa.uniforms.uAa.value.set(1.0, quality === 'high' ? 0.24 : 0.18, 0.035);
          aa.uniforms.uTexel.value.set(1 / (innerWidth * renderer.getPixelRatio()), 1 / (innerHeight * renderer.getPixelRatio()));
          cp.addPass(aa); cp._aa = aa;
        }
      }
      composers.set(scene, cp);
    } else if (cp._w !== innerWidth || cp._h !== innerHeight) {
      cp.setSize(innerWidth, innerHeight);   // acompanha resize da janela
      cp._w = innerWidth; cp._h = innerHeight;
      if (cp._ssao) attachDepth(cp);         // setSize dispõe os RTs: recria o depth
      if (cp._aa) cp._aa.uniforms.uTexel.value.set(1 / (innerWidth * renderer.getPixelRatio()), 1 / (innerHeight * renderer.getPixelRatio()));
    }
    return cp;
  };
  renderer.render = patched;
  return () => { renderer.render = rawRender; renderer.__postPatched = false; composers.clear(); };   // off switch (debug)
}
