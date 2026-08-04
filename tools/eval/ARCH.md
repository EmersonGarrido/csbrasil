# ARCH.md — mapa de arquitetura e de CONFLITO (CS BRASIL / CORO SOLTO)

<!-- BEGIN:GERADO — não edite à mão, rode `npm run arch` -->

> Gerado por `node tools/gen-arch.mjs`. **Não edite este bloco à mão.**
> Versão do jogo: 2.0.0-alpha.11 · `npm run arch` para regenerar · `npm run arch:check` no CI.

## Tamanho dos arquivos indexados

| Arquivo | Linhas | Símbolos |
|---|---:|---:|
| `public/js/game.js` | 6428 | 228 |
| `public/js/main.js` | 1546 | 147 |
| `public/js/glbchars.js` | 750 | 59 |
| `public/js/characters.js` | 1061 | 41 |
| `public/js/vmattach.js` | 628 | 4 |
| `public/js/springs.js` | 261 | 28 |
| `public/js/weapons.js` | 345 | 20 |

## Maiores métodos de `game.js` — onde o conflito mora

Os 15 maiores somam **2953 linhas (46% do arquivo)**. Método grande = PR irrevisável e merge conflitante.

| Linhas | Início | Método | |
|---:|---:|---|---|
| 800 | 5308 | `_updateBot()` | ⚠️ candidato a extração |
| 522 | 675 | `constructor()` | 🔴 append-only |
| 327 | 4585 | `_updatePlayer()` | ⚠️ candidato a extração |
| 244 | 2149 | `_resetPositions()` |  |
| 242 | 1286 | `_buildViewModels()` |  |
| 146 | 4912 | `_updatePickups()` |  |
| 133 | 4204 | `_botCtf()` |  |
| 83 | 2889 | `_tryShoot()` |  |
| 77 | 3220 | `_dmgArc()` |  |
| 69 | 4343 | `_updateCtfHud()` |  |
| 66 | 6146 | `_updateRadar()` |  |
| 64 | 3369 | `_wpnIcon()` |  |
| 61 | 6332 | `update()` | 🔴 append-only |
| 60 | 3962 | `_initCTF()` |  |
| 59 | 3161 | `_kill()` |  |

## Tabela de CONFLITO — resolvida para as linhas de hoje

Declare sua frente antes de editar. Em `game.js` use **só a ferramenta Edit, nunca Write**.
Duas frentes com faixas disjuntas podem rodar em paralelo — foi medido: 3 agentes editaram
faixas disjuntas simultaneamente com zero conflito de conteúdo.

| Frente | Faixas em `game.js` | Arquivos exclusivos |
|---|---|---|
| **ARMAS / VIEWMODEL** | `15–63` `316–316` `350–359` `384–410` `511–528` `555–576` `602–605` `622–641` `1286–1912` `2671–2728` `2743–2824` `2843–3036` `3433–3456` `3504–3564` `3630–3646` | `public/js/vmattach.js` `public/js/springs.js` `public/js/weapons.js` `public/js/fparms.js` `public/js/handik.js` |
| **BOTS / JOGABILIDADE** | `170–173` `224–224` `250–261` `648–659` `3122–3219` `3906–3961` `4100–4336` `4412–4434` `4585–4911` `5180–5197` `5279–6107` | — |
| **MAPAS / MUNDO** | `1232–1285` `2149–2392` `3962–4077` `4912–5057` | `public/js/maps.js` `public/js/mapprops.js` `public/js/map_brasilia.js` `public/js/map_havan.js` `public/js/map_pool_day.js` `public/js/map_pool_ramos.js` `public/js/map_ferrovelho.js` |
| **GRÁFICOS / FX** | `1913–1955` `2607–2619` `3457–3495` `3575–3629` | `public/js/bloom.js` `public/js/textures.js` `public/js/vao.js` `public/js/stylize.js` `public/js/gpuparticles.js` |
| **UI / HUD / MENU** | `1197–1231` `2572–2585` `2601–2606` `2620–2626` `3220–3432` `6146–6211` `6242–6331` | `public/js/main.js` `public/style.css` `src/pages/index.astro` |
| **ÁUDIO** | — | `public/js/audio.js` |
| **PERSONAGENS** | — | `public/js/characters.js` `public/js/glbchars.js` |
| **SITE / BACKEND** | — | `src/` `supabase/` |

**🔴 Zonas vermelhas (append-only, qualquer frente pode precisar):** `update()` 6332–6392 · `_dom()` 1197–1231 · `constructor()` 675–1196

Nenhuma sobreposição entre frentes — todas as faixas são disjuntas. ✓

Cobertura: **3937 de 6428 linhas (61%)** do `game.js` têm dono declarado. O resto é território neutro — declare a frente mesmo assim.

<details><summary><strong>Índice completo de <code>game.js</code> (todos os símbolos)</strong></summary>

| Linha | Símbolo | Linhas |
|---:|---|---:|
| 15 | `WEAPONS` | 49 |
| 64 | `QS` | 8 |
| 72 | `VM_MAT_LEGACY` | 4 |
| 76 | `ROUND_TIME` | 8 |
| 84 | `ROUNDS_MAX` | 22 |
| 109 | `CTF_CLOCK_SHOW` | 4 |
| 113 | `KILLS_PER_PLAYER` | 7 |
| 120 | `PACE` | 33 |
| 153 | `PAUSE_ARM_MS` | 9 |
| 163 | `confirmGate` | 7 |
| 174 | `BOT_AIM_PITCH` | 4 |
| 178 | `BOT_DMG_PLAYER` | 21 |
| 199 | `BOT_FAIR` | 5 |
| 204 | `BOT_MOVE2` | 15 |
| 228 | `BOT_FOCUS_MIN` | 22 |
| 254 | `BOT_TOKEN_REST` | 7 |
| 262 | `MOVE_MUL` | 6 |
| 269 | `MOVE2` | 5 |
| 274 | `RACK_OLD` | 4 |
| 278 | `RACK_RETA` | 25 |
| 305 | `RADIO` | 5 |
| 311 | `MK_LABELS` | 5 |
| 317 | `D2R` | 7 |
| 324 | `buildRecoilPattern` | 12 |
| 336 | `RECOIL_PATTERN` | 7 |
| 343 | `RECOIL_CLASS` | 7 |
| 350 | `REC_DEG` | 10 |
| 360 | `REC_HOLD` | 3 |
| 363 | `DMG_FALLOFF` | 5 |
| 368 | `HS_MUL` | 3 |
| 371 | `BALL_CLASS` | 13 |
| 384 | `STATIC_CLASS` | 27 |
| 411 | `SNIPER_VM` | 15 |
| 426 | `RIFLE_VM` | 21 |
| 447 | `PISTOL_VM` | 9 |
| 456 | `SHOTGUN_VM` | 55 |
| 512 | `VM_KNOB` | 17 |
| 531 | `vmFovForAspect` | 24 |
| 555 | `VM_OFF` | 22 |
| 579 | `staticVmKey` | 10 |
| 589 | `DED_VM` | 13 |
| 602 | `MINT_VM` | 4 |
| 606 | `vmPreloadClasses` | 16 |
| 622 | `VM_SHRINK` | 20 |
| 642 | `VMP` | 6 |
| 648 | `BOT_SKILLS` | 11 |
| 660 | `diffKey` | 4 |
| 665 | `rollBotSkill` | 7 |
| 675 | `constructor()` | 522 |
| 1197 | `_dom()` | 35 |
| 1232 | `_buildEnv()` | 54 |
| 1286 | `_buildViewModels()` | 242 |
| 1528 | `_vmFrame` | 148 |
| 1676 | `_buildStaticVmClass` | 237 |
| 1913 | `_makePuffTexture()` | 11 |
| 1924 | `_makeFlashTex()` | 22 |
| 1946 | `_makeFlashCoreTex()` | 10 |
| 1956 | `_input()` | 2 |
| 1958 | `_kd` | 33 |
| 1991 | `_ku` | 4 |
| 1995 | `_md` | 34 |
| 2029 | `_mu` | 7 |
| 2036 | `_mm` | 14 |
| 2050 | `_cc` | 1 |
| 2051 | `_blur` | 1 |
| 2052 | `_plc` | 14 |
| 2066 | `_requestLock()` | 3 |
| 2069 | `_acceptInput()` | 8 |
| 2077 | `_pauseBackdrop()` | 7 |
| 2084 | `_radioShow()` | 6 |
| 2090 | `_radioUi()` | 8 |
| 2098 | `_radioPick()` | 14 |
| 2112 | `start()` | 4 |
| 2116 | `_startRound()` | 33 |
| 2149 | `_resetPositions()` | 244 |
| 2393 | `_checkCtfAlvo()` | 13 |
| 2406 | `_checkPace()` | 13 |
| 2419 | `_endRound()` | 37 |
| 2456 | `_fimDaPartida()` | 14 |
| 2470 | `_endMatch()` | 38 |
| 2508 | `_ensureDolly()` | 41 |
| 2549 | `_tickDolly()` | 23 |
| 2572 | `setPaused()` | 14 |
| 2586 | `_now()` | 3 |
| 2589 | `pauseArmed()` | 1 |
| 2590 | `_syncPauseArm()` | 7 |
| 2597 | `resume()` | 4 |
| 2601 | `applySettings()` | 6 |
| 2607 | `_applyQuality()` | 13 |
| 2620 | `onResize()` | 7 |
| 2627 | `_switchTeam()` | 44 |
| 2671 | `_applyVmVisibility()` | 24 |
| 2695 | `_ensureStaticVm()` | 34 |
| 2729 | `_rebuildStaticVmClass()` | 14 |
| 2743 | `_switchWeapon()` | 30 |
| 2773 | `_deploySfx()` | 7 |
| 2780 | `_scope()` | 17 |
| 2797 | `_zoomFov()` | 8 |
| 2805 | `_reloading()` | 1 |
| 2806 | `_startReload()` | 19 |
| 2825 | `_reloadLayers()` | 18 |
| 2843 | `_installRecoil()` | 33 |
| 2876 | `_shotRecoil()` | 13 |
| 2889 | `_tryShoot()` | 83 |
| 2972 | `_meleeHit()` | 12 |
| 2984 | `_fireHitscan()` | 53 |
| 3037 | `_surfaceOf()` | 27 |
| 3064 | `_fleshImpact()` | 19 |
| 3083 | `_fxVoice()` | 9 |
| 3092 | `_impactSfx()` | 14 |
| 3106 | `_tintFx()` | 16 |
| 3122 | `_damage()` | 39 |
| 3161 | `_kill()` | 59 |
| 3220 | `_dmgArc()` | 77 |
| 3297 | `_mkBanner()` | 9 |
| 3306 | `_hitmarker()` | 15 |
| 3321 | `_dmgNumber()` | 20 |
| 3341 | `_feed()` | 19 |
| 3360 | `_skullIcon()` | 9 |
| 3369 | `_wpnIcon()` | 64 |
| 3433 | `_tracer()` | 24 |
| 3457 | `_puff()` | 39 |
| 3496 | `_holeDecalMat()` | 8 |
| 3504 | `_flash()` | 52 |
| 3556 | `_muzzleWorld()` | 9 |
| 3565 | `_updateDoors()` | 10 |
| 3575 | `_updateFx()` | 55 |
| 3630 | `_ejectCasing()` | 17 |
| 3647 | `_makeCtfFlagTex()` | 23 |
| 3670 | `_paintFlagSymbol()` | 9 |
| 3679 | `_flagTexFor()` | 7 |
| 3686 | `_loadCtfSymbols()` | 14 |
| 3700 | `_makeCtfZoneTex()` | 31 |
| 3731 | `_makeSmokeTex()` | 8 |
| 3739 | `_updateSmokeHud()` | 6 |
| 3745 | `_spawnGrenade()` | 11 |
| 3756 | `_throwSmoke()` | 8 |
| 3764 | `_throwFrag()` | 10 |
| 3774 | `_explodeFrag()` | 38 |
| 3812 | `_corDaFumaca()` | 15 |
| 3827 | `_popSmoke()` | 19 |
| 3846 | `_updateGrenades()` | 27 |
| 3873 | `_teamColor()` | 18 |
| 3891 | `_teamInk()` | 8 |
| 3899 | `_factionOf()` | 1 |
| 3900 | `_voiceKey()` | 1 |
| 3901 | `_teamName()` | 1 |
| 3902 | `_teamTag()` | 1 |
| 3903 | `_mirror()` | 3 |
| 3906 | `_botSeparation()` | 56 |
| 3962 | `_initCTF()` | 60 |
| 4022 | `_updateCTF()` | 56 |
| 4078 | `_ctfWin()` | 22 |
| 4100 | `_freeYaw()` | 25 |
| 4125 | `_pullString()` | 23 |
| 4148 | `_walkReach()` | 18 |
| 4166 | `_wpComp()` | 16 |
| 4182 | `_findPathLocal()` | 22 |
| 4204 | `_botCtf()` | 133 |
| 4337 | `_hideCtfHud()` | 6 |
| 4343 | `_updateCtfHud()` | 69 |
| 4412 | `_collide()` | 23 |
| 4435 | `_collideRot()` | 26 |
| 4461 | `_freeSpot()` | 30 |
| 4491 | `_retaAndavel()` | 20 |
| 4511 | `_walkDepth()` | 16 |
| 4527 | `_noteHit()` | 15 |
| 4542 | `_deathFeedback()` | 43 |
| 4585 | `_updatePlayer()` | 327 |
| 4912 | `_updatePickups()` | 146 |
| 5058 | `_wpnMode()` | 3 |
| 5061 | `_botWeapon()` | 10 |
| 5071 | `_pickupAllowed()` | 7 |
| 5078 | `_grabPickup()` | 34 |
| 5112 | `_assentarNoChao()` | 11 |
| 5123 | `_dropWeapon()` | 16 |
| 5139 | `_pickSpawn()` | 23 |
| 5162 | `_respawnPlayer()` | 18 |
| 5180 | `_losClear()` | 18 |
| 5198 | `_botCall()` | 37 |
| 5235 | `_teamMarkTex()` | 23 |
| 5258 | `_makeTeamMark()` | 14 |
| 5272 | `_updateTeamMark()` | 7 |
| 5279 | `_botEye()` | 1 |
| 5280 | `_enemyOf()` | 8 |
| 5288 | `_duelToken()` | 20 |
| 5308 | `_updateBot()` | 800 |
| 6108 | `_radarFoot()` | 38 |
| 6146 | `_updateRadar()` | 66 |
| 6212 | `_banner()` | 26 |
| 6238 | `_resultadoDaRodada()` | 4 |
| 6242 | `_showScoreboard()` | 32 |
| 6274 | `_updateHud()` | 58 |
| 6332 | `update()` | 61 |
| 6393 | `dispose()` | 35 |

</details>

## Validação dos ponteiros escritos à mão

Nenhum ponteiro `arquivo:linha` da prosa aponta para fora do arquivo. ✓

<!-- END:GERADO -->


Gerado no gauntlet de 31/07. Use para saber ONDE mexer e ONDE **não** mexer.

## Índice de `public/js/game.js` (3234 linhas)

| Linhas | Bloco |
|---|---|
| 13–45 | `WEAPONS` — tabela de stats (dmg/mag/rate/reload/spreadHip/spreadScope/recoil/auto/scope/pellets/range) |
| 46–57 | constantes de partida/bot (`ROUND_TIME=99`, `ROUNDS_TO_WIN=3`, `RESPAWN_DELAY=2.5`, `SPAWN_PROT=3`, `BOT_SPEED=3.3`, `BOT_VIEW=45`) |
| 58–65 | `STATIC_CLASS` (arma → classe de VM) |
| 66–106 | `SNIPER_VM` / `RIFLE_VM` / `PISTOL_VM` / `SHOTGUN_VM` (variantes visuais) |
| 107–137 | `vmFovForAspect()` 111, `staticVmKey()` 117, `DED_VM` 127, `vmPreloadClasses()` 131 |
| 141 | `VM_SHRINK = 0.72` |
| 143–156 | `BOT_SKILLS` / `rollBotSkill()` |
| 157–431 | constructor — cena/câmera 172-176, `_buildEnv()` 180, bots 235-274, **rig de luz do VM 276-300**, pools de FX 305-363, `_adsPose` 364-376, `_vmMuzzle` 377-390, CTF 403-412 |
| 432–454 | `_dom()` (refs do HUD) — **ZONA VERMELHA, append-only** |
| 455–473 | `_buildEnv()` — IBL/env map (gradiente → PMREM) |
| 474–882 | `_buildViewModels()` — mãos, `fixVmMaterials` 622, braços GLB 662-683, `_buildStaticVmClass` 692-856 (materiais 716-750, **`VM_FWD` 754-785**, gun-space/muzzle 786-832, attachments 834-855) |
| 883–925 | texturas de FX (`_makePuffTexture`, `_makeFlashTex`, `_makeFlashCoreTex`) |
| 926–1059 | input (teclado/mouse/sensibilidade/rádio) |
| 1060–1208 | rounds / spawn / placar (`_startRound` 1064, `_resetPositions` 1077, rack 1120-1148, `_endRound` 1154, `_endMatch` 1177) |
| 1259–1290 | `setPaused`/`applySettings`/**`_applyQuality()` 1276**/`onResize` |
| 1291–1396 | troca de time + lazy-load de VM (`_applyVmVisibility` 1335, `_ensureStaticVm` 1350) |
| 1397–1447 | `_switchWeapon` 1397, **`_scope()` 1412**, **`_zoomFov()` 1429**, `_startReload` 1438 |
| 1448–1505 | **`_tryShoot()`** (bloom de spread 1467, spread 1468, kick 1481-1487, flash 1489), `_meleeHit` 1494 |
| 1506–1537 | `_fireHitscan()` — raycast + headshot (1527) |
| 1538–1609 | `_damage()` 1538, `_kill()` 1573 |
| 1610–1743 | HUD de combate: `_hitmarker()` 1619, `_dmgNumber()` 1634, `_feed()` 1654, `_wpnIcon` 1680 |
| 1744–1840 | `_tracer()` 1744, `_puff()` 1766, **`_flash()` 1783**, `_muzzleWorld()` 1832 |
| 1841–1922 | `_updateFx()` 1851, `_ejectCasing()` 1906 |
| 1923–2085 | granadas / fumaça |
| 2113–2317 | CTF (`_initCTF` 2113, `_updateCTF` 2159, **`_findPathLocal()` A\* 2225**, `_botCtf` 2247) |
| 2318–2333 | `_collide()` |
| 2334–2512 | **`_updatePlayer()`** — crouch 2345, velmax 2349, accel 2357, atrito 2367, pulo 2379, gravidade 2381, olho 2408, **FOV/ADS 2422-2432**, crosshair 2436, kick/bob/sway 2461-2492, IK 2495 |
| 2513–2612 | pickups / loadout |
| 2613–2644 | respawn / LOS |
| 2645–3034 | **`_updateBot()`** — percepção 2679-2712, combate 2726-2830 (mira 2729, juke 2740, flanco 2770, granada 2783, **chance de acerto 2799**, dano 2814), CTF 2831, roam+A\* 2836-2960, stuck 2975 |
| 3035–3100 | radar |
| 3101–3165 | `_showScoreboard` 3113, **`_updateHud()` 3132** |
| 3166–3204 | **`update(dt)`** — loop principal — **ZONA VERMELHA, append-only** |

## Levers por frente

### GRÁFICOS
- renderer / tonemapping / exposição / sombras: `main.js:26–31` (ACESFilmic, exposure 1.06, PCFSoft)
- bloom + composite (AgX, CA, vinheta, grain): `main.js:33–40` → `bloom.js:14–118` (`COMPOSITE`), `bloom.js:119` (`enableLightBloom`)
- stylize/cel (`?style=1`): `stylize.js:49`
- qualidade (pixelRatio 2/1/0.75, sombras): `game.js:1276` (`_applyQuality`) — **duplicado** com `main.js:26–41`
- IBL/env map: `game.js:455–473` (`_buildEnv`, gradiente 16×128 hardcoded 460-463); VM usa em `game.js:275`
- rig de luz do viewmodel: `game.js:276–300` (key 3.2 / fill 0.8 / rim 0.25 / bounce 1.6 / hemi 0.85)
- luz+fog+céu por mapa: `map.js:268–292`, `map_brasilia.js:264–290`, `map_pool_day.js:1240–1265`, `map_havan.js:413–420`, `map_ferrovelho.js:470–530`
- shadow map 2048² em câmera de 160×160 m = **12,8 cm/texel** (`map_brasilia.js:279` etc.)
- texturas procedurais do mundo: `textures.js:53` (`initTextures`), helpers 4-52
- materiais do VM (metalness/roughness/envMapIntensity): `game.js:716–750`

### ARMAS
- stats: `game.js:13–45`; classe: `game.js:60–65`; heróis: `DED_VM` `game.js:127`
- framing: `VM_FWD` `game.js:754–785`, `VM_SHRINK` `game.js:141`, `VM_GUNSPACE`/`gunBasis`/`buildVmAttachment` `vmattach.js:9/40/49`
- ADS: `_scope` `game.js:1412`, `_zoomFov` `game.js:1429`, `_adsPose` `game.js:364`, interpolação `game.js:2422–2492`
- tiro: `_tryShoot` `game.js:1448`; recoil `RecoilAxis` `springs.js:34` + instância `game.js:859` + recuperação `game.js:2405`
- muzzle: `_flash` `game.js:1783`, pools 330-357, `_vmMuzzle` 377-390; tracers `_tracer` 1744
- feedback: `_hitmarker` `game.js:1619`, `_dmgNumber` 1634, CSS `style.css:195–217`
- som: `audio.js:230` (`_gunshot`), `:319` (`shotWeapon`); chamadas `game.js:1466` e `:2825`
- braços/IK: `fparms.js:149/251`, `ARM_MOUNTS` `game.js:670`; armas no mundo: `weapons.js:31–62`

### UI / MENU
- roteamento: `main.js:117–124` (`show`)
- menu CS: `index.astro:165–241` + `style.css:351–397`
- setup (nick/armas/mapa/bots): `index.astro:183–235` + `main.js:396–508` + `style.css:55–106,398–404`
- times: `index.astro:244–267` + `main.js:783–805` + `style.css:131–147`
- personagens: `index.astro:270–284` + `main.js:219–280` + `style.css:150–164`
- settings/ranking/howto: `index.astro:287–347` + `main.js:724–866`
- **HUD**: `index.astro:349–408` + `game.js:432–454`/`:3132` + `style.css:174–312`
- paleta/tema: `style.css:7–21` (`:root`)

### JOGABILIDADE
- bots: `BOT_SKILLS`/`rollBotSkill` `game.js:146/151`, visão `:48`, reação `:2708`, cadência `:2794`, chance de acerto `:2799`, dano `:2814`
- movimento: maxSp `:2349` (6.6 sprint / 4.7 andar), accel `:2357` (92/23), atrito `:2367` (7/11), pulo `:2379` (vel.y 5.0), gravidade `:2381` (20.6), crouch `:2345`, olho `:2408` (1.62 / -0.52)
- sensibilidade: `game.js:999`
- spawn/rack/respawn: `:1077`, `:1120–1148`, `:2613`
- rounds: `:46`, `:1064`, `:1154`, `:1177`; CTF `:2113–2317` (CAP=3 em `:2160`)
- **BUG/alavanca morta**: `settings.difficulty` é gravado no menu (`main.js:503–508`) mas **nunca lido** — dificuldade é 100% aleatória via `rollBotSkill()`

## Tabela de CONFLITO — quem pode mexer em quê

| Arquivo | Dono no gauntlet | Observação |
|---|---|---|
| `main.js:24–44` (renderer/qualidade) | GRÁFICOS-CORE | UI não toca |
| `main.js:110–160, 396–560, 724–880` (menus) | UI | gráficos não toca |
| `bloom.js`, `stylize.js`, `textures.js` | GRÁFICOS-CORE | exclusivo |
| `map_brasilia.js` | MAPA-BRASILIA | exclusivo |
| `map_pool_day.js` | MAPA-POOL | exclusivo |
| `map_havan.js` | MAPA-HAVAN | exclusivo |
| `map_ferrovelho.js` | MAPA-FERRO | exclusivo |
| `map.js` | GRÁFICOS-CORE | mapa legado |
| `weapons.js`, `vmattach.js`, `springs.js`, `fparms.js` | ARMAS | exclusivo |
| `audio.js` | ARMAS (`_gunshot`/`shotWeapon`) | resto intocado |
| `style.css` linhas 1–172 e 315–460 | UI-MENU | fronteira na l.173 |
| `style.css` linhas 174–312 | UI-HUD | mesma pessoa que UI-MENU nesta rodada |
| `index.astro` 126–347 | UI-MENU | fronteira na l.348 |
| `index.astro` 349–408 | UI-HUD | idem |
| `glbchars.js`, `characters.js` | JOGABILIDADE | materiais de char = combinar antes |

### `game.js` — partição obrigatória (use **só** a ferramenta Edit, NUNCA Write)

| Ranges | Dono |
|---|---|
| 180, 275–300, 455–473, 716–750, 1276–1283 | GRÁFICOS-CORE |
| 13–45, 58–141, 364–390, 474–715, 751–882, 1397–1505, 1506–1537, 1744–1840, 1906–1922 | ARMAS |
| 46–57, 143–156, 199–274, 1060–1208, 2318–2512(**≤2409**), 2513–2644, 2645–3034 | JOGABILIDADE |
| 1538–1743, 3035–3165 | UI (HUD/feedback) |
| 432–454 e 3166–3204 | **ninguém reescreve** — só append de 1-2 linhas quando inevitável |

Zonas de atrito conhecidas: `_tryShoot` (armas+gráficos+áudio), `_updatePlayer` (cortar em 2409), `_buildViewModels:716–750` (materiais compartilhados), cluster `_damage/_kill/_hitmarker/_feed`.
