# ARCH.md — mapa de arquitetura e de CONFLITO (CS BRASIL / CORO SOLTO)

<!-- BEGIN:GERADO — não edite à mão, rode `npm run arch` -->

> Gerado por `node tools/gen-arch.mjs`. **Não edite este bloco à mão.**
> Versão do jogo: 2.0.0-alpha.41 · `npm run arch` para regenerar · `npm run arch:check` no CI.

## Tamanho dos arquivos indexados

| Arquivo | Linhas | Símbolos |
|---|---:|---:|
| `public/js/game.js` | 6263 | 221 |
| `public/js/main.js` | 1861 | 163 |
| `public/js/glbchars.js` | 838 | 60 |
| `public/js/characters.js` | 1067 | 41 |
| `public/js/vmattach.js` | 629 | 4 |
| `public/js/springs.js` | 261 | 28 |
| `public/js/weapons.js` | 345 | 20 |

## Maiores métodos de `game.js` — onde o conflito mora

Os 15 maiores somam **2977 linhas (48% do arquivo)**. Método grande = PR irrevisável e merge conflitante.

| Linhas | Início | Método | |
|---:|---:|---|---|
| 800 | 5130 | `_updateBot()` | ⚠️ candidato a extração |
| 530 | 569 | `constructor()` | 🔴 append-only |
| 306 | 4403 | `_updatePlayer()` | ⚠️ candidato a extração |
| 248 | 1856 | `_resetPositions()` |  |
| 241 | 1188 | `_buildViewModels()` |  |
| 146 | 4709 | `_updatePickups()` |  |
| 133 | 4015 | `_botCtf()` |  |
| 84 | 3749 | `_initCTF()` |  |
| 83 | 2636 | `_tryShoot()` |  |
| 77 | 2970 | `_dmgArc()` |  |
| 76 | 4154 | `_updateCtfHud()` |  |
| 66 | 5968 | `_updateRadar()` |  |
| 64 | 3119 | `_wpnIcon()` |  |
| 62 | 2908 | `_kill()` |  |
| 61 | 6166 | `update()` | 🔴 append-only |

## Tabela de CONFLITO — resolvida para as linhas de hoje

Declare sua frente antes de editar. Em `game.js` use **só a ferramenta Edit, nunca Write**.
Duas frentes com faixas disjuntas podem rodar em paralelo — foi medido: 3 agentes editaram
faixas disjuntas simultaneamente com zero conflito de conteúdo.

| Frente | Faixas em `game.js` | Arquivos exclusivos |
|---|---|---|
| **ARMAS / VIEWMODEL** | `18–66` `328–328` `358–452` `479–500` `1188–1586` `2398–2406` `2490–2571` `2590–2783` `3183–3206` `3254–3316` `3382–3398` | `public/js/vmattach.js` `public/js/springs.js` `public/js/weapons.js` `public/js/fparms.js` `public/js/handik.js` `public/js/recoil.js` `public/js/vmlab.js` |
| **BOTS / JOGABILIDADE** | `182–185` `236–236` `262–273` `542–553` `2869–2969` `3693–3748` `3911–4147` `4230–4252` `4403–4708` `5002–5019` `5101–5929` | — |
| **MAPAS / MUNDO** | `1134–1187` `1856–2103` `3749–3888` `4709–4854` | `public/js/maps.js` `public/js/mapprops.js` `public/js/map_brasilia.js` `public/js/map_havan.js` `public/js/map_piscina.js` `public/js/map_piscinao_ramos.js` `public/js/map_ferrovelho.js` |
| **GRÁFICOS / FX** | `1587–1629` `2334–2346` `3207–3245` `3327–3381` | `public/js/bloom.js` `public/js/textures.js` `public/js/vao.js` `public/js/stylize.js` `public/js/gpuparticles.js` |
| **UI / HUD / MENU** | `1099–1133` `2294–2312` `2328–2333` `2347–2353` `2970–3182` `5968–6033` `6064–6165` | `public/js/main.js` `public/style.css` `src/pages/index.astro` |
| **ÁUDIO** | — | `public/js/audio.js` |
| **PERSONAGENS** | — | `public/js/characters.js` `public/js/glbchars.js` |
| **SITE / BACKEND** | — | `src/` `supabase/` |

**🔴 Zonas vermelhas (append-only, qualquer frente pode precisar):** `update()` 6166–6226 · `_dom()` 1099–1133 · `constructor()` 569–1098

Nenhuma sobreposição entre frentes — todas as faixas são disjuntas. ✓

Cobertura: **3705 de 6263 linhas (59%)** do `game.js` têm dono declarado. O resto é território neutro — declare a frente mesmo assim.

<details><summary><strong>Índice completo de <code>game.js</code> (todos os símbolos)</strong></summary>

| Linha | Símbolo | Linhas |
|---:|---|---:|
| 18 | `WEAPONS` | 49 |
| 67 | `QS` | 3 |
| 70 | `VMLAB` | 8 |
| 78 | `VM_MAT_LEGACY` | 4 |
| 82 | `ROUND_TIME` | 8 |
| 90 | `ROUNDS_MAX` | 28 |
| 121 | `CTF_CLOCK_SHOW` | 4 |
| 125 | `KILLS_PER_PLAYER` | 7 |
| 132 | `PACE` | 33 |
| 165 | `PAUSE_ARM_MS` | 9 |
| 175 | `confirmGate` | 7 |
| 186 | `BOT_AIM_PITCH` | 4 |
| 190 | `BOT_DMG_PLAYER` | 21 |
| 211 | `BOT_FAIR` | 5 |
| 216 | `BOT_MOVE2` | 15 |
| 240 | `BOT_FOCUS_MIN` | 22 |
| 266 | `BOT_TOKEN_REST` | 7 |
| 274 | `MOVE_MUL` | 6 |
| 281 | `MOVE2` | 5 |
| 286 | `RACK_OLD` | 4 |
| 290 | `RACK_RETA` | 25 |
| 317 | `RADIO` | 5 |
| 323 | `MK_LABELS` | 5 |
| 329 | `D2R` | 6 |
| 335 | `DMG_FALLOFF` | 5 |
| 340 | `HS_MUL` | 3 |
| 343 | `BALL_CLASS` | 15 |
| 358 | `STATIC_CLASS` | 75 |
| 434 | `VM_KNOB` | 19 |
| 455 | `vmFovForAspect` | 24 |
| 479 | `VM_OFF` | 22 |
| 501 | `vmOffY` | 35 |
| 536 | `VMP` | 6 |
| 542 | `BOT_SKILLS` | 11 |
| 554 | `diffKey` | 4 |
| 559 | `rollBotSkill` | 7 |
| 569 | `constructor()` | 530 |
| 1099 | `_dom()` | 35 |
| 1134 | `_buildEnv()` | 54 |
| 1188 | `_buildViewModels()` | 241 |
| 1429 | `_vmFrame` | 158 |
| 1587 | `_makePuffTexture()` | 11 |
| 1598 | `_makeFlashTex()` | 22 |
| 1620 | `_makeFlashCoreTex()` | 10 |
| 1630 | `_input()` | 2 |
| 1632 | `_kd` | 37 |
| 1669 | `_ku` | 4 |
| 1673 | `_md` | 34 |
| 1707 | `_mu` | 7 |
| 1714 | `_mm` | 14 |
| 1728 | `_cc` | 1 |
| 1729 | `_blur` | 1 |
| 1730 | `_plc` | 14 |
| 1744 | `_requestLock()` | 23 |
| 1767 | `_travaAtalhos()` | 4 |
| 1771 | `_soltaAtalhos()` | 3 |
| 1774 | `_acceptInput()` | 8 |
| 1782 | `_pauseBackdrop()` | 7 |
| 1789 | `_radioShow()` | 6 |
| 1795 | `_radioUi()` | 8 |
| 1803 | `_radioPick()` | 14 |
| 1817 | `start()` | 4 |
| 1821 | `_startRound()` | 35 |
| 1856 | `_resetPositions()` | 248 |
| 2104 | `_checkCtfAlvo()` | 13 |
| 2117 | `_checkPace()` | 13 |
| 2130 | `_endRound()` | 37 |
| 2167 | `_fimDaPartida()` | 14 |
| 2181 | `_endMatch()` | 49 |
| 2230 | `_ensureDolly()` | 41 |
| 2271 | `_tickDolly()` | 23 |
| 2294 | `setPaused()` | 19 |
| 2313 | `_now()` | 3 |
| 2316 | `pauseArmed()` | 1 |
| 2317 | `_syncPauseArm()` | 7 |
| 2324 | `resume()` | 4 |
| 2328 | `applySettings()` | 6 |
| 2334 | `_applyQuality()` | 13 |
| 2347 | `onResize()` | 7 |
| 2354 | `_switchTeam()` | 44 |
| 2398 | `_applyVmVisibility()` | 9 |
| 2407 | `_vmlabEnsure()` | 14 |
| 2421 | `_vmlabFrame()` | 30 |
| 2451 | `_tuneGet()` | 15 |
| 2466 | `_tune()` | 23 |
| 2489 | `_fxSet()` | 1 |
| 2490 | `_switchWeapon()` | 30 |
| 2520 | `_deploySfx()` | 7 |
| 2527 | `_scope()` | 17 |
| 2544 | `_zoomFov()` | 8 |
| 2552 | `_reloading()` | 1 |
| 2553 | `_startReload()` | 19 |
| 2572 | `_reloadLayers()` | 18 |
| 2590 | `_installRecoil()` | 33 |
| 2623 | `_shotRecoil()` | 13 |
| 2636 | `_tryShoot()` | 83 |
| 2719 | `_meleeHit()` | 12 |
| 2731 | `_fireHitscan()` | 53 |
| 2784 | `_surfaceOf()` | 27 |
| 2811 | `_fleshImpact()` | 19 |
| 2830 | `_fxVoice()` | 9 |
| 2839 | `_impactSfx()` | 14 |
| 2853 | `_tintFx()` | 16 |
| 2869 | `_damage()` | 39 |
| 2908 | `_kill()` | 62 |
| 2970 | `_dmgArc()` | 77 |
| 3047 | `_mkBanner()` | 9 |
| 3056 | `_hitmarker()` | 15 |
| 3071 | `_dmgNumber()` | 20 |
| 3091 | `_feed()` | 19 |
| 3110 | `_skullIcon()` | 9 |
| 3119 | `_wpnIcon()` | 64 |
| 3183 | `_tracer()` | 24 |
| 3207 | `_puff()` | 39 |
| 3246 | `_holeDecalMat()` | 8 |
| 3254 | `_flash()` | 54 |
| 3308 | `_muzzleWorld()` | 9 |
| 3317 | `_updateDoors()` | 10 |
| 3327 | `_updateFx()` | 55 |
| 3382 | `_ejectCasing()` | 17 |
| 3399 | `_makeCtfFlagTex()` | 23 |
| 3422 | `_paintFlagSymbol()` | 9 |
| 3431 | `_flagTexFor()` | 26 |
| 3457 | `_legadoSimbolo()` | 8 |
| 3465 | `_loadCtfSymbols()` | 22 |
| 3487 | `_makeCtfZoneTex()` | 31 |
| 3518 | `_makeSmokeTex()` | 8 |
| 3526 | `_updateSmokeHud()` | 6 |
| 3532 | `_spawnGrenade()` | 11 |
| 3543 | `_throwSmoke()` | 8 |
| 3551 | `_throwFrag()` | 10 |
| 3561 | `_explodeFrag()` | 38 |
| 3599 | `_corDaFumaca()` | 15 |
| 3614 | `_popSmoke()` | 19 |
| 3633 | `_updateGrenades()` | 27 |
| 3660 | `_teamColor()` | 18 |
| 3678 | `_teamInk()` | 8 |
| 3686 | `_factionOf()` | 1 |
| 3687 | `_voiceKey()` | 1 |
| 3688 | `_teamName()` | 1 |
| 3689 | `_teamTag()` | 1 |
| 3690 | `_mirror()` | 3 |
| 3693 | `_botSeparation()` | 56 |
| 3749 | `_initCTF()` | 84 |
| 3833 | `_updateCTF()` | 56 |
| 3889 | `_ctfWin()` | 22 |
| 3911 | `_freeYaw()` | 25 |
| 3936 | `_pullString()` | 23 |
| 3959 | `_walkReach()` | 18 |
| 3977 | `_wpComp()` | 16 |
| 3993 | `_findPathLocal()` | 22 |
| 4015 | `_botCtf()` | 133 |
| 4148 | `_hideCtfHud()` | 6 |
| 4154 | `_updateCtfHud()` | 76 |
| 4230 | `_collide()` | 23 |
| 4253 | `_collideRot()` | 26 |
| 4279 | `_freeSpot()` | 30 |
| 4309 | `_retaAndavel()` | 20 |
| 4329 | `_walkDepth()` | 16 |
| 4345 | `_noteHit()` | 15 |
| 4360 | `_deathFeedback()` | 43 |
| 4403 | `_updatePlayer()` | 306 |
| 4709 | `_updatePickups()` | 146 |
| 4855 | `_wpnMode()` | 3 |
| 4858 | `_botWeapon()` | 10 |
| 4868 | `_pickupAllowed()` | 7 |
| 4875 | `_grabPickup()` | 34 |
| 4909 | `_assentarNoChao()` | 11 |
| 4920 | `_dropWeapon()` | 38 |
| 4958 | `_spawnY()` | 3 |
| 4961 | `_pickSpawn()` | 23 |
| 4984 | `_respawnPlayer()` | 18 |
| 5002 | `_losClear()` | 18 |
| 5020 | `_botCall()` | 37 |
| 5057 | `_teamMarkTex()` | 23 |
| 5080 | `_makeTeamMark()` | 14 |
| 5094 | `_updateTeamMark()` | 7 |
| 5101 | `_botEye()` | 1 |
| 5102 | `_enemyOf()` | 8 |
| 5110 | `_duelToken()` | 20 |
| 5130 | `_updateBot()` | 800 |
| 5930 | `_radarFoot()` | 38 |
| 5968 | `_updateRadar()` | 66 |
| 6034 | `_banner()` | 26 |
| 6060 | `_resultadoDaRodada()` | 4 |
| 6064 | `_showScoreboard()` | 44 |
| 6108 | `_updateHud()` | 58 |
| 6166 | `update()` | 61 |
| 6227 | `dispose()` | 36 |

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
