// 8 fictional satirical archetypes — procedural low-poly meshes.
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════════════
   CLAREZA COMPETITIVA DO PERSONAGEM  (critério C1 do BAR + A2 p/ personagens)

   PORQUÊ ISTO EXISTE: o baseline mediu ΔL* silhueta-vs-fundo = 10,8 em
   fy_havan-169-b (alvo ≥ 20) e os bots não tinham NENHUMA sombra de contato —
   liam como adesivo colado no chão. A régua não aceita "o mapa está bem
   iluminado" como resposta: ela exige um mecanismo ATIVO no personagem.

   Três mecanismos, compartilhados pelos personagens GLB (glbchars.js) e pelos
   procedurais de fallback (buildCharacter, mais abaixo):
     1. sombra de contato (plano + alpha radial)                  -> A2
     2. rim/fresnel por time modulado pela DISTÂNCIA              -> C1
     3. clamp de ambiente NA IRRADIÂNCIA (receita VALORANT)       -> C1 no pior canto

   ── CORREÇÃO DA R3 (regressão "personagem fantasma" da R2) ─────────────────
   A R2 aplicou o piso de luminância SOMANDO no `outgoingLight` (a cor já
   iluminada). Isso é matematicamente um "levantar o preto" chapado: como o piso
   é ABSOLUTO, todo texel cujo albedo era escuro chegava EXATAMENTE ao mesmo
   valor do texel claro. Medido nos PNGs (tools/eval/char_probe.py):

     r1 bot camisa roxa   C* 18,5 (p90 36,0)   L* p5/p50/p95 = 16,4 / 58,5 / 70,8
     r2 fantasma ferro    C*  6,8 (p90 10,4)   L* p5/p50/p95 = 54,7 / 57,5 / 74,1
     r2 fantasma piscinão C*  2,9 (p90  6,0)   L* p5/p50/p95 = 54,8 / 57,2 / 62,1

   Repare no p5: na R2 NADA no corpo fica abaixo de L* ~55. Cabelo preto, bota
   preta e jaleco branco viram o mesmo cinza — daí o "vulto branco-rosado"
   (o rosado é o rim do time P somado por cima do cinza). O topo (p95 ~74)
   continuava certo: a luz FUNCIONAVA, o piso é que esmagava os 2/3 de baixo
   da escala de valores.

   Agora o piso vive em `irradiance`, ANTES do BRDF_Lambert — ou seja, ele é
   MULTIPLICADO pelo albedo. Cabelo preto continua preto, jaleco continua
   branco, a razão entre eles (= croma e contraste interno) é preservada por
   construção, e o personagem ainda ganha um mínimo garantido de luz na sombra.
   ═══════════════════════════════════════════════════════════════════════════ */
const _cqp = new URLSearchParams(location.search);
const _cnum = (k, d) => { const v = parseFloat(_cqp.get(k)); return isNaN(v) ? d : v; };
// Qualidade lida do MESMO localStorage do menu (main.js:17-18). Lida UMA vez, na
// construção do material: trocar a qualidade no meio da partida não recompila shader,
// e recompilar 8 personagens em SwiftShader travaria o frame.
let _lowQ = false;
try { _lowQ = JSON.parse(localStorage.getItem('awpbr_settings') || '{}').quality === 'low'; } catch { /* padrão: médio */ }

export const CHAR_FX = {
  on:      _cqp.get('charfx') !== '0',                 // kill-switch geral da injeção de shader
  rim:     _cqp.get('rim') !== '0',                    // kill-switch do rim (pedido explícito da tarefa)
  clamp:   _cqp.get('charclamp') !== '0',              // kill-switch do clamp de ambiente + piso de albedo
  shadow:  _cqp.get('cshadow') !== '0',                // kill-switch da sombra de contato
  recv:    _cqp.get('charrecv') !== '0' && !_lowQ,     // personagem RECEBE a sombra do sol (off em low)
  mats:    _cqp.get('charmat') !== '0',                // kill-switch da correção do material do GLB
  low:     _lowQ,
  // ── clamp de ambiente: unidades de IRRADIÂNCIA do three (useLegacyLights=false),
  // não de cor final. O ambiente difuso real medido nos mapas (hemi 0.52 no piscinão a
  // 1.0 no ferro velho, mais o IBL do PMREM) dá ~1,0. 1.85 é portanto uma decisão de
  // JOGABILIDADE declarada: o personagem é iluminado ~1,8× mais que o mundo à volta.
  // É a mesma escolha da Riot ("clamp do Indirect Lighting Cache") e da Valve ("Boost
  // Player Contrast") — e o BAR §2 diz que clareza tem precedência sobre estética.
  // Calibrado em tools/eval/char_sim.py: com 1.85 o ΔL* previsto contra o anel fica
  // 31/32/20 nos três bots medidos; com 1.25 (o valor "físico") cairia pra 27/28/16.
  floorIrr: _cnum('charfloor', 1.85),                  // piso de irradiância indireta (perto)
  floorFar: _cnum('charfloorfar', 3.00),               // piso a 45 m+ (Riot clareia o agente distante)
  ceilIrr:  _cnum('charceil', 4.5),                    // teto: céu HDR não pode estourar o personagem
  albMin:   _cnum('charalbmin', 0.09),                 // valor mínimo do albedo, por ESCALA (matiz/S intactos)
  sat:      _cnum('charsat', 1.16),                    // ganho de croma do albedo (BAR §2.2: o boneco FURA a faixa do cenário)
  rimNear: _cnum('rimnear', 0.18),                     // rim a queima-roupa: discreto, não vira fantasma
  rimFar:  _cnum('rimfar', 0.70),                      // rim a 34 m+: é longe que o inimigo some no fundo
  rimPow:  _cnum('rimpow', 1.7),                       // expoente da banda LARGA (dá área pro ΔL* médio subir)
  rimEdge: _cnum('rimedge', 1.35),                     // peso da banda FINA (contorno explícito, C1)
  sss:     _lowQ ? 0 : _cnum('charsss', 0.30),         // subsurface falso na pele (0 em low)
  csOp:    _cnum('csop', 0.45),                        // opacidade da sombra de contato
};

// Paleta de rim = a MESMA que o jogo já usa no radar/killfeed (`_teamColor`,
// game.js:2602-2607): P vermelho, B verde, U azul. Puxada pro branco de propósito —
// o C1 mede LUMINÂNCIA (ΔL*), então o contorno precisa ser CLARO antes de ser
// colorido; um rim verde-escuro num fundo escuro não separa nada.
// 0.35 (era 0.45 na R2): com o piso agora multiplicativo o rim voltou a ser o único
// termo aditivo do personagem, e cada ponto que ele anda na direção do branco é croma
// que ele TIRA do boneco. Medido no char_sim: 0.45 custava ~1,5 de C* sem ganhar ΔL*.
const TEAM_RIM = { P: 0xff5555, B: 0x55dd66, U: 0x4aa3ff };
export function charRimColor(def) {
  const c = new THREE.Color(TEAM_RIM[(def && def.team) || 'P'] || 0xffffff);
  return c.lerp(new THREE.Color(0xffffff), 0.35);
}

// ── shader: declarações. Os dois trechos injetados vivem no MESMO main(), mas
// separados por vários #include; por isso csMaxC/csSkinM são globais do shader.
const CS_PARS = `
uniform vec3 csRimColor;
uniform float csRimNear;
uniform float csRimFar;
uniform float csRimPow;
uniform float csRimEdge;
uniform float csFloorIrr;
uniform float csFloorFar;
uniform float csCeilIrr;
uniform float csAlbMin;
uniform float csSat;
uniform float csSss;
float csMaxC;
float csSkinM;
const vec3 CS_LUMA = vec3(0.2126, 0.7152, 0.0722);
`;

// ── shader: ALBEDO. Injetado logo após <map_fragment> (o atlas já foi amostrado).
// REGRA DESTE BLOCO: só operações que preservam matiz e saturação relativa. Nada
// aqui pode "levantar o preto" — foi esse o erro da R2.
const CS_ALBEDO = `
	{
		// (a) ganho de croma. O BAR §2.2/C2 pede cenário dessaturado (S 0,10-0,30) e diz
		// explicitamente que o PERSONAGEM deve furar essa faixa: "é exatamente daí que
		// vem a separação". Operador de saturação em torno da luminância — não desloca
		// o valor médio, só afasta os canais dele.
		float csY = dot(diffuseColor.rgb, CS_LUMA);
		diffuseColor.rgb = max(vec3(0.0), mix(vec3(csY), diffuseColor.rgb, csSat));
		// (b) piso de VALOR do albedo por ESCALA, nunca por soma. Multiplicar os três
		// canais pelo mesmo fator mantém o matiz E a saturação HSV idênticos: o preto do
		// Black Metal deixa de ser um buraco sem virar cinza lavado. (Somar aqui é o que
		// transformava cabelo preto em branco-rosado na R2.)
		float csMx = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));
		diffuseColor.rgb *= max(1.0, csAlbMin / max(csMx, 1e-4));
	}
`;

// ── shader: CLAMP DE AMBIENTE. Injetado ANTES de <lights_fragment_end>, que é o
// único ponto onde `irradiance`/`iblIrradiance` ainda existem e ainda NÃO foram
// multiplicadas pelo albedo (isso acontece dentro de RE_IndirectDiffuse, via
// BRDF_Lambert, e dentro de RE_IndirectSpecular via cosineWeightedIrradiance).
// PORQUÊ AQUI: piso na irradiância é MULTIPLICATIVO no albedo -> clareia sem
// achatar croma. Piso na cor final é ADITIVO -> lava tudo pro mesmo cinza.
const CS_AMB = `
	#if defined( RE_IndirectDiffuse )
	{
		float csD = length(vViewPosition);
		// Os DOIS termos indiretos entram no difuso como (X / PI) * albedo, então o piso
		// tem que olhar a SOMA — senão o env map (PMREM do céu) fica fora da conta e o
		// piso dispara à toa a céu aberto.
		vec3  csAmb = irradiance + iblIrradiance;
		float csAL  = dot(csAmb, CS_LUMA);
		// O piso sobe com a distância porque é longe que o fog/haze come a silhueta
		// (Riot: o agente distante é clareado E ganha mais fresnel).
		float csFl  = mix(csFloorIrr, csFloorFar, smoothstep(10.0, 45.0, csD));
		float csAdd = max(0.0, csFl - csAL);
		irradiance += vec3(csAdd);            // fill neutro: não desloca o matiz do albedo
		// Teto: um céu HDR muito claro não pode estourar o personagem (a outra metade do
		// clamp da Riot — "nem escuro demais, nem claro demais em nenhum canto do mapa").
		float csTot = csAL + csAdd;
		if (csTot > csCeilIrr) {
			float csS = csCeilIrr / max(csTot, 1e-4);
			irradiance *= csS;
			iblIrradiance *= csS;
		}
	}
	#endif
`;

// ── shader: rugosidade POR REGIÃO, injetada logo após <roughnessmap_fragment>
// (aí diffuseColor já foi amostrado do atlas e roughnessFactor já existe).
const CS_REGION = `
	// Os GLB do Meshy trazem UM material por personagem (um atlas só) — não existe
	// slot separado de pele/tecido/metal. Classificamos pelo MATIZ do texel:
	// pele = R>G>B com saturação média; texel escuro = tecido, mais fosco.
	{
		float mxc = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));
		float mnc = min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
		float sat = mxc > 1e-4 ? (mxc - mnc) / mxc : 0.0;
		csMaxC = mxc;
		csSkinM = step(diffuseColor.g, diffuseColor.r) * step(diffuseColor.b, diffuseColor.g)
			* smoothstep(0.09, 0.20, sat) * (1.0 - smoothstep(0.42, 0.60, sat))
			* smoothstep(0.10, 0.20, mxc);
		roughnessFactor = mix(roughnessFactor, 0.52, csSkinM * 0.85);
		roughnessFactor = mix(roughnessFactor, 0.96, (1.0 - smoothstep(0.04, 0.26, mxc)) * 0.6);
		roughnessFactor = clamp(roughnessFactor, 0.08, 1.0);
	}
`;

// ── shader: clareza, injetada ANTES de <opaque_fragment> — ou seja, ainda em
// linear e ANTES do ACES: o rim é comprimido pelo ombro filmico em vez de clipar
// (critérios A3/A5), e o fog continua sendo aplicado por igual em cima.
// Aqui SÓ ficam termos que são luz ADICIONADA de verdade (rim e subsurface). O
// piso de ambiente saiu daqui na R3 — soma de luminância em cima da cor final é
// o que lavava o croma.
const CS_CLARITY = `
	{
		float csDist = length(vViewPosition);      // metros até a câmera
		vec3  csV    = normalize(vViewPosition);   // fragmento -> câmera
		// RIM/FRESNEL por time: o mecanismo ATIVO de separação exigido pelo C1
		// ("se o personagem só lê porque o mapa está bem iluminado, não lê").
		// DUAS bandas de propósito:
		//   - larga  (csRimPow ~1.7): cobre ~1/3 da silhueta, então move a MÉDIA de L*
		//     do recorte, que é o que o critério mede contra o anel de 20 px;
		//   - fina   (expoente 6): contorno explícito no rasante extremo — a alternativa
		//     que a própria régua aceita ("ΔL* ≥ 20 OU rim/contorno explícito").
		float csNV  = clamp(dot(normal, csV), 0.0, 1.0);
		float csF   = pow(1.0 - csNV, csRimPow) + pow(1.0 - csNV, 6.0) * csRimEdge;
		// csUpW prioriza os rasantes VOLTADOS PRA CIMA (ombro/cabeça/braço), onde
		// está a informação de combate — regra literal da Riot.
		vec3  csUp  = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
		float csUpW = mix(0.45, 1.55, clamp(dot(normal, csUp) * 0.5 + 0.5, 0.0, 1.0));
		// Cresce com a distância (Riot: agente longe é clareado e ganha mais fresnel).
		float csK   = mix(csRimNear, csRimFar, smoothstep(4.0, 34.0, csDist));
		outgoingLight += csRimColor * (csF * csUpW * csK);
`;
// Variante de quality low: uma banda só (corta um pow por fragmento). O contorno
// fica mais mole, mas o mecanismo continua existindo.
const CS_CLARITY_LOW = `
	{
		float csDist = length(vViewPosition);
		vec3  csV    = normalize(vViewPosition);
		float csNV  = clamp(dot(normal, csV), 0.0, 1.0);
		float csF   = pow(1.0 - csNV, csRimPow);
		vec3  csUp  = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
		float csUpW = mix(0.45, 1.55, clamp(dot(normal, csUp) * 0.5 + 0.5, 0.0, 1.0));
		float csK   = mix(csRimNear, csRimFar, smoothstep(4.0, 34.0, csDist));
		outgoingLight += csRimColor * (csF * csUpW * csK);
`;
// Fechamento + subsurface falso. Separado porque em quality low o SSS é CORTADO do
// shader (não só zerado): instrução que não existe é instrução que não custa.
const CS_SSS = `
		// 3) SUBSURFACE FALSO na pele: luz vazando na borda, quente e DESSATURADA de
		//    propósito — pele rosa-chiclete é o erro clássico do SSS falso.
		outgoingLight += vec3(0.40, 0.17, 0.12) * (csSkinM * csSss * csF);
`;
const CS_END = `	}
`;

// Instala a injeção num MeshStandardMaterial de personagem. Idempotente.
export function applyCharFX(mat, rimColor) {
  if (!CHAR_FX.on || !mat || !mat.isMeshStandardMaterial || mat.userData.csFx) return mat;
  mat.userData.csFx = true;
  const rimOn = CHAR_FX.rim, clampOn = CHAR_FX.clamp;
  const u = {
    csRimColor: { value: new THREE.Color(rimColor || 0xffffff) },
    csRimNear:  { value: rimOn ? CHAR_FX.rimNear : 0 },
    csRimFar:   { value: rimOn ? CHAR_FX.rimFar : 0 },
    csRimPow:   { value: CHAR_FX.rimPow },
    csRimEdge:  { value: rimOn ? CHAR_FX.rimEdge : 0 },
    csFloorIrr: { value: CHAR_FX.floorIrr },
    csFloorFar: { value: CHAR_FX.floorFar },
    csCeilIrr:  { value: CHAR_FX.ceilIrr },
    csAlbMin:   { value: CHAR_FX.albMin },
    csSat:      { value: CHAR_FX.sat },
    csSss:      { value: CHAR_FX.sss },
  };
  mat.userData.csUniforms = u;   // tuning ao vivo sem recompilar
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    // ?charclamp=0 não zera uniform: REMOVE os dois blocos do fonte. Instrução que
    // não existe é instrução que não custa — e o kill-switch fica sendo prova de que
    // o clamp é a causa, não um palpite (o A/B vira "com bloco" x "sem bloco").
    let f = CS_PARS + shader.fragmentShader
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n' + CS_REGION)
      .replace('#include <opaque_fragment>',
        (CHAR_FX.low ? CS_CLARITY_LOW : CS_CLARITY) + (CHAR_FX.low ? '' : CS_SSS) + CS_END + '\n#include <opaque_fragment>');
    if (clampOn) {
      f = f
        .replace('#include <map_fragment>', '#include <map_fragment>\n' + CS_ALBEDO)
        .replace('#include <lights_fragment_end>', CS_AMB + '\n#include <lights_fragment_end>');
    }
    shader.fragmentShader = f;
  };
  // Sem chave própria o three pode reaproveitar o programa de um material SEM a
  // injeção (a chave de cache padrão não enxerga onBeforeCompile). Constante de
  // propósito: todos os personagens compartilham UM programa, só os uniforms mudam.
  // O sufixo muda com a variante do FONTE (low corta SSS+banda fina; charclamp=0
  // corta albedo+ambiente) — se não mudasse, o three serviria o programa errado.
  mat.customProgramCacheKey = () => 'csCharFx3' + (CHAR_FX.low ? 'L' : 'H') + (clampOn ? 'C' : 'c');
  mat.needsUpdate = true;
  return mat;
}

// Corrige o material que o Meshy/Mint exporta nos GLB. PORQUÊ: os arquivos vêm com
// `pbrMetallicRoughness` SEM metallicFactor/roughnessFactor (o glTF manda assumir
// 1.0/1.0 = metal cru e fosco, que não tem difusa nenhuma) E com emissiveFactor
// [1,1,1] + emissiveTexture apontando pro próprio baseColor. Resultado: o personagem
// é praticamente UNLIT — luz nenhuma o toca, sombra nenhuma o escurece. É a causa
// direta do "chapado" (braço de pele rosa lisa do emo, ET verde uniforme). Aqui:
// metal 0, roughness real, emissivo zerado — o mínimo garantido de luz passa a vir
// do clamp na IRRADIÂNCIA (CS_AMB), que é multiplicativo e não achata o volume.
// (Na R1 esse emissivo é que segurava o croma alto: o personagem era literalmente
// o albedo cru na tela. Bonito de cor, zero volume — e a régua cobrou volume.)
export function upgradeCharMaterial(src, rimColor) {
  const m = new THREE.MeshStandardMaterial({
    map: src.map || null,
    color: src.color ? src.color.clone() : new THREE.Color(0xffffff),
    metalness: 0.0,
    roughness: 0.86,
    side: src.side,
    transparent: !!src.transparent,
    alphaTest: src.alphaTest || 0,
    alphaMap: src.alphaMap || null,
    normalMap: src.normalMap || null,
    vertexColors: !!src.vertexColors,
  });
  if (src.normalScale && m.normalScale) m.normalScale.copy(src.normalScale);
  // 1.0 (era 0.85 na R2): sem o piso aditivo, o IBL do mapa voltou a ser a principal
  // fonte de fill do personagem — cortá-lo em 15% agora só escureceria a sombra.
  m.envMapIntensity = 1.0;
  m.name = src.name || 'char';
  m.userData.csSrcEmissive = true;
  // Se a injeção estiver desligada (?charfx=0) o clamp não existe: devolve um resto
  // de emissivo pro personagem não afundar em preto na sombra. Degradação segura.
  if (!CHAR_FX.on) { m.emissive = new THREE.Color(0xffffff); m.emissiveMap = m.map; m.emissiveIntensity = 0.10; }
  return applyCharFX(m, rimColor);
}

/* ── SOMBRA DE CONTATO ──────────────────────────────────────────────────────
   Um plano com alpha radial sob os pés. PORQUÊ e não o shadow map: a câmera de
   sombra do sol cobre 160 m em 2048² (~12,8 cm/texel, ARCH/BAR §3.5) — nessa
   resolução NÃO existe sombra de contato, e é exatamente por isso que os bots
   aparecem "colados" na areia do Piscinão e no barro do Ferro Velho. Isto custa
   2 triângulos por personagem e resolve o A2 independentemente do shadow map. */
let _csTex = null, _csGeo = null;
function contactShadowTexture() {
  if (_csTex) return _csTex;
  const S = 96;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  // Núcleo quase opaco + cauda longa: sombra de contato real tem miolo escuro sob o
  // pé e abre rápido. Um gradiente linear puro lê como borrão de Photoshop.
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0.00, 'rgba(0,0,0,1)');
  g.addColorStop(0.30, 'rgba(0,0,0,0.86)');
  g.addColorStop(0.60, 'rgba(0,0,0,0.34)');
  g.addColorStop(1.00, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  _csTex = new THREE.CanvasTexture(c);
  _csTex.colorSpace = THREE.SRGBColorSpace;
  return _csTex;
}
export function makeContactShadow(size = 0.9, opacity = CHAR_FX.csOp) {
  if (!_csGeo) _csGeo = new THREE.PlaneGeometry(1, 1);
  const m = new THREE.Mesh(_csGeo, new THREE.MeshBasicMaterial({
    map: contactShadowTexture(), color: 0x000000,
    transparent: true, opacity, depthWrite: false,
    side: THREE.DoubleSide, toneMapped: false,
  }));
  m.rotation.x = -Math.PI / 2;
  m.scale.set(size, size, 1);
  m.position.y = 0.02;                 // 2 cm: some acima do z-fight sem descolar do piso
  m.renderOrder = -1;                  // antes dos outros transparentes (fumaça, tracer)
  m.castShadow = false; m.receiveShadow = false;
  m.frustumCulled = false;
  m.userData.noHit = true;
  m.raycast = () => {};                // NUNCA absorve tiro: game.js raycasta o grupo inteiro
  m.userData.csBase = size;
  return m;
}

export const CHARACTERS = [
  { id: 'esquerdomacho', team: 'P', name: 'Esquerdomacho',
    blurb: 'Barba, tote bag e 47 bottons. Mira acadêmica: analisa a treta antes de atirar.',
    pal: { skin: 0xe8b98a, shirt: 0xb03a2e, pants: 0x3a4a5a, hair: 0x4a3428, boots: 0x2a2a2a } },
  { id: 'sindicato', team: 'P', name: 'Líder do Sindicato',
    blurb: 'Boné vermelho, colete de assembleia e megafone. Convoca greve de fogo a cada round.',
    pal: { skin: 0xc98d5e, shirt: 0x777777, pants: 0x2e3d55, hair: 0x3a3a3a, boots: 0x4a3428 } },
  { id: 'mst', team: 'P', name: 'Líder do MST',
    blurb: 'Do campo pra arena. Bandeira na mochila, bota no barro e tiro certeiro de enxada.',
    pal: { skin: 0x8d5a3b, shirt: 0x7a6a45, pants: 0x4a4030, hair: 0x2a1e14, boots: 0x5a3d1e } },
  { id: 'doutora', team: 'P', name: 'Doutora do SUS',
    blurb: 'Jaleco, estetoscópio e plantão de 24h. Receita tiro certeiro, na veia.',
    pal: { skin: 0xd9a580, shirt: 0xf0f0f0, pants: 0x3a4a5a, hair: 0x3a2a1e, boots: 0x6b6b6b } },
  { id: 'mistico', team: 'P', name: 'Jovem Místico',
    blurb: 'Faixa na testa, cristal no peito e aura calibrada. Só atira quando Mercúrio permite.',
    pal: { skin: 0xe8b98a, shirt: 0x9b59b6, pants: 0x3a4a5a, hair: 0x4a3428, boots: 0x5a3d1e } },
  { id: 'caminhoneiro', team: 'B', name: 'Caminhoneiro',
    blurb: 'Camisa do Brasil, luva de estrada e 40h de BR na semana. Freia pra ninguém.',
    pal: { skin: 0xd9a066, shirt: 0xffd23f, pants: 0x2e3d55, hair: 0x3a2a1e, boots: 0x3a3a3a } },
  { id: 'sertanejo', team: 'B', name: 'Cantor Sertanejo',
    blurb: 'Chapéu de cowboy, fivela de ouro e violão nas costas. Moda de viola em dose dupla.',
    pal: { skin: 0xc98d5e, shirt: 0x8a2f2f, pants: 0x2e3d55, hair: 0x2a1e14, boots: 0x5a3d1e } },
  { id: 'coach', team: 'B', name: 'Coach Quântico',
    blurb: 'Blazer, headset e 47 técnicas de manifestação. Já venceu antes de começar — no quântico.',
    pal: { skin: 0xf2c9a4, shirt: 0xf0f0f0, pants: 0x2a2a2a, hair: 0x2a2a2a, boots: 0x1a1a1a } },
  { id: 'gotinha', team: 'P', name: 'Zé da Gotinha',
    blurb: 'Mascote da saúde. Imuniza a treta com dose de reforço — e ainda pega o SUS de graça.',
    pal: { skin: 0xf4f4f4, shirt: 0xf4f4f4, pants: 0xf4f4f4, hair: 0x2fae5a, boots: 0xe03232 } },
  { id: 'farialimer', team: 'B', name: 'Faria Limer',
    blurb: 'Colete, sapatênis e planilha de day trade. Compra na baixa, atira na alta.',
    pal: { skin: 0xf2c9a4, shirt: 0x8fb8e0, pants: 0xcdbb98, hair: 0x2a2018, boots: 0xf0f0f0 } },
  { id: 'bombado', team: 'B', name: 'Bombado da Academia',
    blurb: 'Peitoral gigante, perna de palito. Pulou o leg day pra treinar o gatilho.',
    pal: { skin: 0x8d5a3b, shirt: 0xffd23f, pants: 0x2e3d55, hair: 0x2a2a2a, boots: 0xf0f0f0 } },
  { id: 'hipster', team: 'P', name: 'Hipster Alternativo',
    blurb: 'Moicano colorido e camiseta de banda que você não conhece. Já jogava isso antes de ser mainstream.',
    pal: { skin: 0xe8b98a, shirt: 0x1a1a1a, pants: 0x3a4a5a, hair: 0x2fd3c0, boots: 0xf0f0f0 } },
  { id: 'dollynho', team: 'B', name: 'Dollynho',
    blurb: 'Mascote do guaraná polêmico. Efervescente, gelado e sempre do contra.',
    pal: { skin: 0x2fae4a, shirt: 0x2fae4a, pants: 0x1f8a38, hair: 0xf0f0f0, boots: 0xf0f0f0 } },
  { id: 'et', team: 'P', name: 'ET de Varginha',
    blurb: 'Veio de longe pra treta. Abduz a direita e some no mato de Minas.',
    pal: { skin: 0x8a9a7a, shirt: 0x8a9a7a, pants: 0x6a7a5a, hair: 0x8a9a7a, boots: 0x5a6a4a } },
  { id: 'ancap', team: 'B', name: 'Ancap Medieval',
    blurb: 'Cota de malha, cruz templária e capa verde-amarela. Privatiza a treta e xinga o Banco Central.',
    pal: { skin: 0xe8b98a, shirt: 0xf0f0f0, pants: 0x3a3a30, hair: 0x8a8a8a, boots: 0x9a9a8a } },
  { id: 'canarinho', team: 'B', name: 'Canarinho Pistola',
    blurb: 'Pistola desde 2016. Bico torto, peito estufado e camisa 24: ele NÃO amarela.',
    pal: { skin: 0xf2c531, shirt: 0xffd23f, pants: 0x2e56c4, hair: 0xf2c531, boots: 0x3a6fd8 } },
  { id: 'proerd', team: 'B', name: 'Leão do Proerd',
    blurb: 'Camisa preta colada, rugido de mascote de formatura e garra afiada na defesa da treta.',
    pal: { skin: 0xd9a25f, shirt: 0x1a1a1a, pants: 0x2e3d55, hair: 0x8a3a26, boots: 0xf0f0f0 } },
  // ── PALHAÇOS (4ª facção, models GLB do Mint). team:'C' + tribe:'palhacos'.
  // bonzo (ex-bozo) já tem GLB; os 8 abaixo entram no GLB_CHARS quando os rigs saírem
  // (hoje: fallback procedural via pal). Voz/round/captura própria (manifest chave 'C').
  { id: 'bonzo', team: 'C', tribe: 'palhacos', name: 'Bonzo',
    blurb: 'Do picadeiro pra praça. Nariz vermelho, sapatão marrom e risada de quem arma o circo.',
    pal: { skin: 0xf5f0e6, shirt: 0x3b6fd4, pants: 0x2f56a8, hair: 0xd43a2e, boots: 0x6b4a2f } },
  { id: 'palhacomal', team: 'C', tribe: 'palhacos', name: 'Palhaço do Mal',
    blurb: 'Riso que gela a espinha. Sai do picadeiro direto pro pesadelo — e ainda cobra ingresso.',
    pal: { skin: 0xf0ece4, shirt: 0x5a1420, pants: 0x3a1018, hair: 0x161616, boots: 0x2a1a14 } },
  { id: 'jozo', team: 'C', tribe: 'palhacos', name: 'Jozo',
    blurb: 'Mascote de lanche pirata. Fritou o juízo no óleo e agora só serve treta com batata.',
    pal: { skin: 0xf4f0ea, shirt: 0xd83030, pants: 0x1a1a1a, hair: 0xd43a2e, boots: 0xd83030 } },
  { id: 'adjim', team: 'C', tribe: 'palhacos', name: 'Adjim',
    blurb: 'Espirra, ri e atira. Metade da dupla que faz a criançada chorar de rir (e de medo).',
    pal: { skin: 0xf0d8c8, shirt: 0x2fae4a, pants: 0xffd23f, hair: 0x2fae4a, boots: 0xffd23f } },
  { id: 'esbirro', team: 'C', tribe: 'palhacos', name: 'Esbirro',
    blurb: 'A outra metade da dupla. Buzina no gatilho e resenha no recuo.',
    pal: { skin: 0xf0d8c8, shirt: 0xd83030, pants: 0x2e56c4, hair: 0xe8792a, boots: 0x2e56c4 } },
  { id: 'titica', team: 'C', tribe: 'palhacos', name: 'Titica',
    blurb: 'Do circo pro Congresso e do Congresso pra arena, sempre no bom humor e no gatilho leve.',
    pal: { skin: 0xd9a066, shirt: 0xe8792a, pants: 0xd83030, hair: 0xf0f0f0, boots: 0x2fae4a } },
  { id: 'padati', team: 'C', tribe: 'palhacos', name: 'Padati',
    blurb: 'Um da dupla mais colorida do picadeiro. Cambalhota, buzina e mira infantil.',
    pal: { skin: 0xf4f0ea, shirt: 0x2e56c4, pants: 0xffd23f, hair: 0x2e6ad8, boots: 0x2e56c4 } },
  { id: 'padata', team: 'C', tribe: 'palhacos', name: 'Padata',
    blurb: 'O outro da dupla. Se um erra, o outro acerta — geralmente na risada.',
    pal: { skin: 0xf4f0ea, shirt: 0xd83030, pants: 0xffd23f, hair: 0xd43a2e, boots: 0xd83030 } },
  { id: 'cadequinha', team: 'C', tribe: 'palhacos', name: 'Cadequinha',
    blurb: 'Clássico dos clássicos. Cartola, xadrez e uma gargalhada que atravessa gerações.',
    pal: { skin: 0xf0dcc8, shirt: 0xd83030, pants: 0xf0ece4, hair: 0xc88030, boots: 0xd83030 } },

  // ── TRIBOS URBANAS (3º grupo, models GLB do Mint). team:'U' = invisível aos filtros P/B
  // (bots e seleção política não os pegam); selecionáveis via tribe:'urbanas' em qualquer lado.
  // Modo de FACÇÃO dedicada (spawns/placar próprios) fica como follow-up. pal é fallback (usam GLB).
  { id: 'emo', team: 'U', tribe: 'urbanas', name: 'Emo',
    blurb: 'Franja na cara e playlist de sofrência. Mira embaçada por um olho só.',
    pal: { skin: 0xe6d3d0, shirt: 0x1a1a1a, pants: 0x1a1a1a, hair: 0x111111, boots: 0x1a1a1a } },
  { id: 'blackmetal', team: 'U', tribe: 'urbanas', name: 'Black Metal',
    blurb: 'Corpse paint, cabelão e blast beat. Congela a treta num inverno norueguês.',
    pal: { skin: 0xf0f0f0, shirt: 0x0a0a0a, pants: 0x0a0a0a, hair: 0x0a0a0a, boots: 0x0a0a0a } },
  { id: 'metaleiro', team: 'U', tribe: 'urbanas', name: 'Metaleiro',
    blurb: 'Jaqueta jeans coberta de bottons e cabelo até a cintura. Headbang no recuo.',
    pal: { skin: 0xd9a580, shirt: 0x1a2740, pants: 0x24324f, hair: 0x2a1e14, boots: 0x1a1a1a } },
  { id: 'punk', team: 'U', tribe: 'urbanas', name: 'Punk',
    blurb: 'Moicano colorido e jaqueta de spikes. Anarquia, três acordes e um tiro só.',
    pal: { skin: 0xe8b98a, shirt: 0x111111, pants: 0x3a2a2a, hair: 0xe23bcf, boots: 0x1a1a1a } },
  { id: 'skatista', team: 'U', tribe: 'urbanas', name: 'Skatista',
    blurb: 'Gorro, camiseta larga e joelho ralado. Dropa a treta de flip.',
    pal: { skin: 0xd9a066, shirt: 0x3a6ea5, pants: 0x2a2a2a, hair: 0x2a1e14, boots: 0xf0f0f0 } },
  { id: 'clubber', team: 'U', tribe: 'urbanas', name: 'Clubber',
    blurb: 'Regata neon e glowstick. Só atira no drop da batida.',
    pal: { skin: 0xf0c9a4, shirt: 0x1affd2, pants: 0x141414, hair: 0x101010, boots: 0xf0f0f0 } },
  { id: 'rapper', team: 'U', tribe: 'urbanas', name: 'Rapper',
    blurb: 'Camisão gigante, correntes de ouro e calça saggy. Rima e recarrega no flow.',
    pal: { skin: 0x8d5a3b, shirt: 0xf0f0f0, pants: 0x2a3550, hair: 0x1a1a1a, boots: 0xf0f0f0 } },
  { id: 'reggae', team: 'U', tribe: 'urbanas', name: 'Rasta',
    blurb: 'Dreads, gorro rastafári e paz interior. Só que armado. Jah guia a mira.',
    pal: { skin: 0x5a3a22, shirt: 0xd9a441, pants: 0x3a5a3a, hair: 0x1a1a1a, boots: 0x6b4a2f } },
  { id: 'funkeiro', team: 'U', tribe: 'urbanas', name: 'Funkeiro',
    blurb: 'Boné Quiksilver, Oakley Juliet vermelho e corrente de ouro. Ostenta e domina.',
    pal: { skin: 0xd9a066, shirt: 0xf0f0f0, pants: 0xd03030, hair: 0xe8e0c0, boots: 0x2e56c4 } },
];
export const byId = id => CHARACTERS.find(c => c.id === id);

// Which weapon each character is shown holding (character-select) AND spawns with.
// Shared by main.js (select screen) and game.js (initial loadout) so they never disagree.
export const CHAR_WEAPON = {
  esquerdomacho: 'pistol', sindicato: 'shotgun', mst: 'ak', doutora: 'm4', mistico: 'mp5',
  caminhoneiro: 'md97', sertanejo: 'revolver38',
  coach: 'scar', gotinha: 'mp5', farialimer: 'm4', bombado: 'lmg', hipster: 'uzi',
  dollynho: 'p90', et: 'awp', ancap: 'mosin',
  bonzo: 'revolver38', canarinho: 'deagle', proerd: 'md97',
  palhacomal: 'deagle', jozo: 'shotgun', adjim: 'uzi', esbirro: 'mp5', titica: 'ak', padati: 'pistol', padata: 'p90', cadequinha: 'revolver38',
};
export const charWeapon = (id) => CHAR_WEAPON[id] || 'ak';

const matCache = new Map();
// Era MeshLambertMaterial em TUDO: sem especular, sem env map, sem rugosidade — o
// personagem procedural não tinha como reagir à nova exposição do mapa. Agora é
// Standard com rugosidade POR REGIÃO (pele lisa x tecido fosco x couro), e recebe a
// mesma injeção de clareza dos GLB. O rim aqui é NEUTRO quente porque o cache é
// global (compartilhado entre times e com as miniaturas do menu); a cor por time só
// existe nos GLB, onde cada bot tem material próprio.
function M(color, rough = 0.86) {
  const k = `${color}|${rough}`;
  if (!matCache.has(k)) {
    matCache.set(k, applyCharFX(new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.0 }), 0xffe8d8));
  }
  return matCache.get(k);
}
function box(w, h, d, color, x = 0, y = 0, z = 0, rough = 0.86) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(color, rough));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = CHAR_FX.recv; return m;
}

// AWP-style rifle, pointing +Z. ~0.9m long.
export function buildRifle(color = 0x2e4a2e) {
  const g = new THREE.Group();
  g.add(box(0.06, 0.10, 0.42, color, 0, 0, 0.05));                    // receiver/body
  g.add(box(0.05, 0.07, 0.22, 0x2a2a2a, 0, -0.045, -0.20));           // stock
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 6), M(0x222222));
  barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.012, 0.48); barrel.castShadow = true; g.add(barrel);
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.16, 8), M(0x1a1a1a));
  scope.rotation.x = Math.PI / 2; scope.position.set(0, 0.09, 0.06); g.add(scope);
  g.add(box(0.02, 0.05, 0.03, 0x222222, 0, 0.045, 0.0));              // scope mount
  g.add(box(0.04, 0.12, 0.06, 0x3a2a1e, 0, -0.10, 0.02));             // grip
  return g;
}

// Humanoid ~1.8m, origin at feet, faces +Z.
export function buildCharacter(def) {
  const p = def.pal, g = new THREE.Group();
  const parts = {};
  const bulky = def.id === 'caminhoneiro';

  // Sombra de contato antes de tudo: o fallback procedural sofria do mesmo A2 dos GLB.
  // Na tela de seleção ela cai sobre o disco escuro do preview (main.js:248) e ancora
  // o personagem ali também.
  if (CHAR_FX.shadow) g.add(makeContactShadow(0.86));

  // legs (pivot at hip)
  for (const s of [-1, 1]) {
    const geo = new THREE.BoxGeometry(0.15, 0.78, 0.17); geo.translate(0, -0.39, 0);
    const leg = new THREE.Mesh(geo, M(p.pants)); leg.castShadow = true; leg.receiveShadow = CHAR_FX.recv;
    leg.position.set(0.11 * s, 0.78, 0);
    leg.add(box(0.16, 0.1, 0.26, p.boots, 0, -0.73, 0.04, 0.62));     // boot (couro: menos fosco)
    g.add(leg); parts[s < 0 ? 'legL' : 'legR'] = leg;
  }
  // torso
  const torsoW = bulky ? 0.52 : 0.44;
  const torso = new THREE.Group(); torso.position.y = 0.78;
  const chest = box(torsoW, 0.6, 0.26, p.shirt, 0, 0.3, 0);
  torso.add(chest);
  g.add(torso); parts.torso = torso; parts.chest = chest;

  // head (pivot at neck) — pele com rugosidade mais baixa que o tecido (0.55): é a
  // diferença que faz o rosto ter volume em vez de ler como papel colorido.
  const head = new THREE.Group(); head.position.y = 1.38;
  head.add(box(0.26, 0.28, 0.26, p.skin, 0, 0.14, 0, 0.55));
  g.add(head); parts.head = head;

  // arms holding rifle forward (pivot at shoulder)
  for (const s of [-1, 1]) {
    const geo = new THREE.BoxGeometry(0.11, 0.5, 0.13); geo.translate(0, -0.25, 0);
    const arm = new THREE.Mesh(geo, M(def.id === 'senhora' ? 0xffd23f : p.shirt));
    arm.castShadow = true; arm.receiveShadow = CHAR_FX.recv;
    arm.position.set((torsoW / 2 + 0.06) * s, 0.52, 0);
    arm.rotation.x = -1.35;                                            // forward hold
    arm.rotation.z = -0.12 * s;
    torso.add(arm); parts[s < 0 ? 'armL' : 'armR'] = arm;
  }
  // rifle in front of chest
  const gun = buildRifle();
  gun.position.set(0.10, 0.34, 0.30);
  torso.add(gun); parts.gun = gun;

  // team armband
  const band = def.team === 'P' ? 0xe03232 : 0x1faa4d;
  parts.armL.add(box(0.13, 0.08, 0.15, band, 0, -0.12, 0));

  addAccessories(def, parts, torsoW);
  return { group: g, parts, def };
}

function addAccessories(def, parts, torsoW) {
  const p = def.pal, head = parts.head, torso = parts.torso;
  const cap = (color) => {
    head.add(box(0.28, 0.09, 0.28, color, 0, 0.30, 0));
    head.add(box(0.26, 0.03, 0.16, color, 0, 0.27, 0.20));            // brim
  };
  const sunglasses = (w = 0.28, color = 0x111111) => {
    head.add(box(w, 0.07, 0.04, color, 0, 0.17, 0.14));
  };
  switch (def.id) {
    case 'esquerdomacho':
      head.add(box(0.24, 0.12, 0.06, 0x3a2a1e, 0, 0.02, 0.13));       // beard
      head.add(box(0.26, 0.10, 0.12, p.hair, 0, 0.30, -0.02));        // hair
      sunglasses(0.26, 0x222222);                                      // glasses
      torso.add(box(0.34, 0.08, 0.30, 0xd32f2f, 0, 0.56, 0));         // red scarf
      torso.add(box(0.20, 0.30, 0.06, 0xe8dcc0, torsoW / 2 + 0.1, -0.05, 0.05)); // tote bag
      torso.add(box(0.04, 0.04, 0.02, 0xffd23f, -0.12, 0.42, 0.14));  // button 1
      torso.add(box(0.04, 0.04, 0.02, 0xe03232, -0.05, 0.38, 0.14));  // button 2
      break;
    case 'sindicato':
      cap(0xc0392b);
      torso.add(box(torsoW + 0.04, 0.5, 0.30, 0x8e2f24, 0, 0.28, 0)); // vest
      torso.add(box(0.07, 0.05, 0.02, 0xffd23f, -0.13, 0.4, 0.16));   // patch
      torso.add(box(0.07, 0.05, 0.02, 0xffd23f, 0.13, 0.32, 0.16));   // patch
      { const mega = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 8), M(0xf0f0f0));
        mega.rotation.x = 2.4; mega.position.set(-torsoW / 2 - 0.1, 0.02, 0.08);
        mega.castShadow = true; torso.add(mega); }                     // megaphone at hip
      break;
    case 'mst':
      cap(0xc0392b);
      torso.add(box(0.32, 0.07, 0.28, 0xd32f2f, 0, 0.55, 0));         // scarf
      torso.add(box(0.34, 0.42, 0.16, 0x3f5a34, 0, 0.28, -0.22));     // backpack
      { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 5), M(0x8a6b48));
        pole.position.set(0.14, 0.75, -0.24); torso.add(pole);
        torso.add(box(0.02, 0.16, 0.24, 0xe03232, 0.14, 0.9, -0.36)); } // little red flag
      break;
    case 'doutora':
      head.add(box(0.28, 0.08, 0.28, p.hair, 0, 0.29, 0));              // hair top
      head.add(box(0.08, 0.22, 0.08, p.hair, 0, 0.14, -0.18));          // ponytail
      torso.add(box(torsoW + 0.04, 0.56, 0.30, 0xf0f0f0, 0, 0.28, 0));  // lab coat
      torso.add(box(torsoW + 0.02, 0.16, 0.28, 0xf0f0f0, 0, -0.04, 0)); // coat skirt
      { const stet = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.014, 6, 14), M(0x2a2a2a));
        stet.position.set(0, 0.55, 0.05); stet.rotation.x = 1.25; torso.add(stet);   // stethoscope
        const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 8), M(0x888888));
        chest.rotation.x = Math.PI / 2; chest.position.set(0.07, 0.38, 0.16); torso.add(chest); }
      torso.add(box(0.06, 0.06, 0.02, 0x2b4d8f, -0.13, 0.44, 0.16));    // ID badge
      torso.add(box(0.16, 0.22, 0.02, 0xd8cfc0, -torsoW / 2 - 0.1, 0.12, 0.08)); // clipboard
      break;
    case 'caminhoneiro':
      cap(0x2456a6);
      sunglasses();
      torso.add(box(0.46, 0.08, 0.28, 0x1faa4d, 0, 0.56, 0));         // green collar stripe
      parts.armR.add(box(0.13, 0.1, 0.15, 0x8a6b48, 0, -0.44, 0));    // trucker glove
      break;
    case 'influencer':
      head.add(box(0.29, 0.12, 0.29, p.hair, 0, 0.31, -0.02));        // blonde
      head.add(box(0.29, 0.26, 0.08, p.hair, 0, 0.16, -0.15));        // long back hair
      sunglasses(0.30, 0xc9a227);                                      // gold shades
      parts.armL.rotation.x = -2.4;                                    // phone up pose
      parts.armL.add(box(0.09, 0.02, 0.14, 0xffffff, 0, -0.5, 0.04)); // phone
      torso.add(box(0.4, 0.06, 0.28, 0xc9a227, 0, 0.06, 0));          // gold belt
      break;
    case 'sertanejo':
      { const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 10), M(0x7a5230));
        brim.position.y = 0.27; brim.castShadow = true; head.add(brim);
        head.add(box(0.24, 0.14, 0.24, 0x7a5230, 0, 0.35, 0)); }      // cowboy hat
      torso.add(box(0.14, 0.1, 0.03, 0xffd23f, 0, 0.02, 0.14));       // big buckle
      { const gc = box(0.22, 0.72, 0.1, 0x2a2a2a, 0.05, 0.3, -0.24);  // guitar case
        gc.rotation.z = 0.18; torso.add(gc); }
      break;
    case 'senhora':
      { const bun = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), M(0xd8d8d8));
        bun.position.set(0, 0.34, -0.1); head.add(bun); }
      head.add(box(0.28, 0.06, 0.26, 0xd8d8d8, 0, 0.28, 0.02));       // gray hair
      sunglasses(0.32, 0x1a1a1a);                                      // oversized shades
      torso.add(box(0.36, 0.4, 0.05, 0xa97f4e, -0.04, 0.32, -0.19));  // corkboard on back
      torso.add(box(0.08, 0.06, 0.02, 0xf2ecd8, -0.12, 0.4, -0.215)); // note
      torso.add(box(0.08, 0.06, 0.02, 0xf2ecd8, 0.04, 0.26, -0.215)); // note
      torso.add(box(0.02, 0.2, 0.02, 0xd33, -0.04, 0.33, -0.215));    // red string
      parts.armR.add(box(0.1, 0.02, 0.15, 0x2b4d8f, 0, -0.44, 0.02)); // stickered phone
      break;
    case 'mistico':
      head.add(box(0.29, 0.05, 0.29, 0xe8bd25, 0, 0.22, 0));          // headband
      head.add(box(0.24, 0.22, 0.06, p.hair, 0, -0.02, 0.13));        // barba comprida
      { const cry = new THREE.Mesh(new THREE.OctahedronGeometry(0.045), M(0x2fd3c0));
        cry.position.set(0, 0.42, 0.15); torso.add(cry); }            // cristal
      break;
    case 'coach':
      torso.add(box(torsoW + 0.05, 0.5, 0.30, 0x1a2a4a, 0, 0.28, 0)); // blazer navy
      { const band = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.015, 6, 12, Math.PI), M(0x1a1a1a));
        band.rotation.z = Math.PI; band.position.set(0, 0.24, 0); head.add(band); } // headset arco
      head.add(box(0.015, 0.015, 0.14, 0x1a1a1a, 0.14, 0.08, 0.1));   // mic
      torso.add(box(0.16, 0.22, 0.03, 0xf0f0f0, -torsoW / 2 - 0.1, 0.12, 0.08)); // livro
      torso.add(box(0.12, 0.03, 0.035, 0xe03232, -torsoW / 2 - 0.1, 0.14, 0.09)); // título do livro
      break;
  }
}

// Procedural walk/idle. `phase` advances with movement, `moving` 0..1.
export function poseCharacter(parts, phase, moving, t) {
  const s = Math.sin(phase), c = Math.cos(phase);
  parts.legL.rotation.x = s * 0.6 * moving;
  parts.legR.rotation.x = -s * 0.6 * moving;
  const breathe = Math.sin(t * 2.2) * 0.012;
  parts.torso.position.y = 0.78 + Math.abs(c) * 0.045 * moving + breathe;
  parts.torso.rotation.y = s * 0.05 * moving;
  parts.head.rotation.z = Math.sin(t * 1.7) * 0.02;
  parts.head.rotation.x = Math.sin(t * 1.3) * 0.02;
}

