# ARCH.md — mapa de arquitetura e de CONFLITO (CS BRASIL / CORO SOLTO)

<!-- BEGIN:GERADO — não edite à mão, rode `npm run arch` -->

> Gerado por `node tools/gen-arch.mjs`. **Não edite este bloco à mão.**
> Versão do jogo: 2.0.0-alpha.166 · `npm run arch` para regenerar · `npm run arch:check` no CI.

## Tamanho dos arquivos indexados

| Arquivo | Linhas | Símbolos |
|---|---:|---:|
| `public/js/game.js` | 6893 | 249 |
| `public/js/main.js` | 2647 | 250 |
| `public/js/glbchars.js` | 838 | 60 |
| `public/js/characters.js` | 1069 | 40 |
| `public/js/vmattach.js` | 629 | 4 |
| `public/js/springs.js` | 261 | 28 |
| `public/js/weapons.js` | 345 | 20 |

## Maiores métodos de `game.js` — onde o conflito mora

Os 15 maiores somam **3101 linhas (45% do arquivo)**. Método grande = PR irrevisável e merge conflitante.

| Linhas | Início | Método | |
|---:|---:|---|---|
| 812 | 5544 | `_updateBot()` | ⚠️ candidato a extração |
| 538 | 570 | `constructor()` | 🔴 append-only |
| 315 | 4777 | `_updatePlayer()` | ⚠️ candidato a extração |
| 248 | 2139 | `_resetPositions()` |  |
| 241 | 1205 | `_buildViewModels()` |  |
| 148 | 5092 | `_updatePickups()` |  |
| 133 | 4354 | `_botCtf()` |  |
| 115 | 1883 | `_touchControls()` |  |
| 84 | 4088 | `_initCTF()` |  |
| 83 | 2927 | `_tryShoot()` |  |
| 80 | 6700 | `_updateHud()` |  |
| 79 | 3288 | `_dmgArc()` |  |
| 76 | 4493 | `_updateCtfHud()` |  |
| 76 | 6780 | `update()` | 🔴 append-only |
| 73 | 3215 | `_kill()` |  |

## Tabela de CONFLITO — resolvida para as linhas de hoje

Declare sua frente antes de editar. Em `game.js` use **só a ferramenta Edit, nunca Write**.
Duas frentes com faixas disjuntas podem rodar em paralelo — foi medido: 3 agentes editaram
faixas disjuntas simultaneamente com zero conflito de conteúdo.

| Frente | Faixas em `game.js` | Arquivos exclusivos |
|---|---|---|
| **ARMAS / VIEWMODEL** | `302–304` `333–427` `454–475` `1205–1603` `2692–2697` `2779–2862` `2881–3074` `3509–3532` `3580–3642` `3709–3725` | `public/js/vmattach.js` `public/js/springs.js` `public/js/weapons.js` `public/js/fparms.js` `public/js/handik.js` `public/js/recoil.js` `public/js/vmlab.js` |
| **BOTS / JOGABILIDADE** | `156–159` `210–210` `236–247` `517–528` `3176–3287` `4032–4087` `4250–4486` `4569–4591` `4777–5091` `5416–5433` `5515–6355` | — |
| **MAPAS / MUNDO** | `1151–1204` `2139–2386` `4088–4227` `5092–5239` | `public/js/maps.js` `public/js/mapprops.js` `public/js/map_brasilia.js` `public/js/map_havan.js` `public/js/map_piscina.js` `public/js/map_piscinao_ramos.js` `public/js/map_ferrovelho.js` |
| **GRÁFICOS / FX** | `1604–1613` `1728–1759` `2622–2634` `3533–3571` `3653–3708` | `public/js/bloom.js` `public/js/textures.js` `public/js/vao.js` `public/js/stylize.js` `public/js/gpuparticles.js` |
| **UI / HUD / MENU** | `1108–1150` `2579–2600` `2616–2621` `2635–2641` `3288–3429` `3445–3508` `6523–6586` `6617–6664` `6700–6779` | `public/js/main.js` `public/style.css` `src/pages/index.astro` |
| **ÁUDIO** | — | `public/js/audio.js` |
| **PERSONAGENS** | — | `public/js/characters.js` `public/js/glbchars.js` |
| **SITE / BACKEND** | — | `src/` `supabase/` |

**🔴 Zonas vermelhas (append-only, qualquer frente pode precisar):** `update()` 6780–6855 · `_dom()` 1108–1150 · `constructor()` 570–1107

Nenhuma sobreposição entre frentes — todas as faixas são disjuntas. ✓

Cobertura: **3728 de 6893 linhas (54%)** do `game.js` têm dono declarado. O resto é território neutro — declare a frente mesmo assim.

<details><summary><strong>Índice completo de <code>game.js</code> (todos os símbolos)</strong></summary>

| Linha | Símbolo | Linhas |
|---:|---|---:|
| 43 | `VMLAB` | 8 |
| 51 | `VM_MAT_LEGACY` | 4 |
| 57 | `DROP_TTL` | 8 |
| 65 | `ROUNDS_MAX` | 27 |
| 95 | `CTF_CLOCK_SHOW` | 4 |
| 99 | `KILLS_PER_PLAYER` | 7 |
| 106 | `PACE` | 33 |
| 139 | `PAUSE_ARM_MS` | 9 |
| 149 | `confirmGate` | 7 |
| 160 | `BOT_AIM_PITCH` | 4 |
| 164 | `BOT_DMG_PLAYER` | 21 |
| 185 | `BOT_FAIR` | 5 |
| 190 | `BOT_MOVE2` | 15 |
| 214 | `BOT_FOCUS_MIN` | 22 |
| 240 | `BOT_TOKEN_REST` | 7 |
| 248 | `MOVE_MUL` | 6 |
| 255 | `MOVE2` | 5 |
| 260 | `RACK_OLD` | 4 |
| 264 | `RACK_RETA` | 25 |
| 291 | `RADIO` | 5 |
| 297 | `MK_LABELS` | 5 |
| 302 | `GUNFEEL` | 3 |
| 306 | `D2R` | 4 |
| 310 | `DMG_FALLOFF` | 5 |
| 315 | `HS_MUL` | 3 |
| 318 | `BALL_CLASS` | 15 |
| 333 | `STATIC_CLASS` | 75 |
| 409 | `VM_KNOB` | 19 |
| 430 | `vmFovForAspect` | 24 |
| 454 | `VM_OFF` | 22 |
| 476 | `vmOffY` | 35 |
| 511 | `VMP` | 6 |
| 517 | `BOT_SKILLS` | 11 |
| 529 | `diffKey` | 4 |
| 534 | `rollBotSkill` | 7 |
| 541 | `botTier` | 4 |
| 545 | `_cyclePool` | 4 |
| 549 | `_rosterPool` | 12 |
| 561 | `pickMatchRoster` | 8 |
| 570 | `constructor()` | 538 |
| 1108 | `_dom()` | 43 |
| 1151 | `_buildEnv()` | 54 |
| 1205 | `_buildViewModels()` | 241 |
| 1446 | `_vmFrame` | 158 |
| 1604 | `_makePuffTexture()` | 10 |
| 1614 | `_makeBloodTex()` | 19 |
| 1633 | `_makeBloodPoolTex()` | 21 |
| 1654 | `_bloodDecal()` | 16 |
| 1670 | `_makeBloodFx()` | 20 |
| 1690 | `_bloodSpatter()` | 18 |
| 1708 | `_bloodPoolAt()` | 6 |
| 1714 | `_updateBlood()` | 14 |
| 1728 | `_makeFlashTex()` | 22 |
| 1750 | `_makeFlashCoreTex()` | 10 |
| 1760 | `_input()` | 2 |
| 1762 | `_kd` | 42 |
| 1804 | `_ku` | 4 |
| 1808 | `_md` | 34 |
| 1842 | `_mu` | 7 |
| 1849 | `_mm` | 15 |
| 1864 | `_cc` | 1 |
| 1865 | `_blur` | 1 |
| 1866 | `_plc` | 17 |
| 1883 | `_touchControls()` | 115 |
| 1998 | `_aimAssist()` | 28 |
| 2026 | `_requestLock()` | 24 |
| 2050 | `_travaAtalhos()` | 4 |
| 2054 | `_soltaAtalhos()` | 3 |
| 2057 | `_acceptInput()` | 8 |
| 2065 | `_pauseBackdrop()` | 7 |
| 2072 | `_radioShow()` | 6 |
| 2078 | `_radioUi()` | 8 |
| 2086 | `_radioPick()` | 14 |
| 2100 | `start()` | 4 |
| 2104 | `_startRound()` | 35 |
| 2139 | `_resetPositions()` | 248 |
| 2387 | `_checkCtfAlvo()` | 13 |
| 2400 | `_checkPace()` | 13 |
| 2413 | `_endRound()` | 37 |
| 2450 | `_fimDaPartida()` | 7 |
| 2457 | `_endMatch()` | 58 |
| 2515 | `_ensureDolly()` | 41 |
| 2556 | `_tickDolly()` | 23 |
| 2579 | `setPaused()` | 22 |
| 2601 | `_now()` | 3 |
| 2604 | `pauseArmed()` | 1 |
| 2605 | `_syncPauseArm()` | 7 |
| 2612 | `resume()` | 4 |
| 2616 | `applySettings()` | 6 |
| 2622 | `_applyQuality()` | 13 |
| 2635 | `onResize()` | 7 |
| 2642 | `_switchTeam()` | 50 |
| 2692 | `_applyVmVisibility()` | 6 |
| 2698 | `_vmlabEnsure()` | 14 |
| 2712 | `_vmlabFrame()` | 28 |
| 2740 | `_tuneGet()` | 15 |
| 2755 | `_tune()` | 23 |
| 2778 | `_fxSet()` | 1 |
| 2779 | `_switchWeapon()` | 32 |
| 2811 | `_deploySfx()` | 7 |
| 2818 | `_scope()` | 17 |
| 2835 | `_zoomFov()` | 8 |
| 2843 | `_reloading()` | 1 |
| 2844 | `_startReload()` | 19 |
| 2863 | `_reloadLayers()` | 18 |
| 2881 | `_installRecoil()` | 33 |
| 2914 | `_shotRecoil()` | 13 |
| 2927 | `_tryShoot()` | 83 |
| 3010 | `_meleeHit()` | 12 |
| 3022 | `_fireHitscan()` | 53 |
| 3075 | `_surfaceOf()` | 27 |
| 3102 | `_fleshImpact()` | 35 |
| 3137 | `_fxVoice()` | 9 |
| 3146 | `_impactSfx()` | 14 |
| 3160 | `_tintFx()` | 16 |
| 3176 | `_damage()` | 39 |
| 3215 | `_kill()` | 73 |
| 3288 | `_dmgArc()` | 79 |
| 3367 | `_mkBanner()` | 9 |
| 3376 | `_hitmarker()` | 15 |
| 3391 | `_dmgNumber()` | 20 |
| 3411 | `_feed()` | 19 |
| 3430 | `_skullIcon()` | 6 |
| 3436 | `_killfeedWeaponIcon()` | 9 |
| 3445 | `_wpnIcon()` | 64 |
| 3509 | `_tracer()` | 24 |
| 3533 | `_puff()` | 39 |
| 3572 | `_holeDecalMat()` | 8 |
| 3580 | `_flash()` | 54 |
| 3634 | `_muzzleWorld()` | 9 |
| 3643 | `_updateDoors()` | 10 |
| 3653 | `_updateFx()` | 56 |
| 3709 | `_ejectCasing()` | 17 |
| 3726 | `_makeCtfFlagTex()` | 23 |
| 3749 | `_paintFlagSymbol()` | 9 |
| 3758 | `_flagTexFor()` | 26 |
| 3784 | `_legadoSimbolo()` | 8 |
| 3792 | `_loadCtfSymbols()` | 22 |
| 3814 | `_makeCtfZoneTex()` | 31 |
| 3845 | `_makeSmokeTex()` | 8 |
| 3853 | `_updateSmokeHud()` | 6 |
| 3859 | `_spawnGrenade()` | 11 |
| 3870 | `_throwSmoke()` | 8 |
| 3878 | `_throwFrag()` | 10 |
| 3888 | `_explodeFrag()` | 38 |
| 3926 | `_corDaFumaca()` | 15 |
| 3941 | `_popSmoke()` | 19 |
| 3960 | `_updateGrenades()` | 27 |
| 3987 | `_teamColor()` | 14 |
| 4001 | `_teamInk()` | 6 |
| 4007 | `_factionOf()` | 1 |
| 4008 | `_voiceKey()` | 1 |
| 4009 | `_teamName()` | 1 |
| 4010 | `_teamTag()` | 6 |
| 4016 | `_plaqueta()` | 13 |
| 4029 | `_mirror()` | 3 |
| 4032 | `_botSeparation()` | 56 |
| 4088 | `_initCTF()` | 84 |
| 4172 | `_updateCTF()` | 56 |
| 4228 | `_ctfWin()` | 22 |
| 4250 | `_freeYaw()` | 25 |
| 4275 | `_pullString()` | 23 |
| 4298 | `_walkReach()` | 18 |
| 4316 | `_wpComp()` | 16 |
| 4332 | `_findPathLocal()` | 22 |
| 4354 | `_botCtf()` | 133 |
| 4487 | `_hideCtfHud()` | 6 |
| 4493 | `_updateCtfHud()` | 76 |
| 4569 | `_collide()` | 23 |
| 4592 | `_collideRot()` | 26 |
| 4618 | `_freeSpot()` | 30 |
| 4648 | `_retaAndavel()` | 20 |
| 4668 | `_walkDepth()` | 16 |
| 4684 | `_noteHit()` | 17 |
| 4701 | `_deathFeedback()` | 43 |
| 4744 | `_updateReplayCam()` | 33 |
| 4777 | `_updatePlayer()` | 315 |
| 5092 | `_updatePickups()` | 148 |
| 5240 | `_wpnMode()` | 5 |
| 5245 | `_botWeapon()` | 12 |
| 5257 | `_municaoInfinita()` | 1 |
| 5258 | `_pickupAllowed()` | 7 |
| 5265 | `_grabPickup()` | 35 |
| 5300 | `_assentarNoChao()` | 11 |
| 5311 | `_dropWeapon()` | 18 |
| 5329 | `_sumirDrop()` | 36 |
| 5365 | `_spawnY()` | 3 |
| 5368 | `_pickSpawn()` | 23 |
| 5391 | `_respawnPlayer()` | 25 |
| 5416 | `_losClear()` | 18 |
| 5434 | `_botCall()` | 37 |
| 5471 | `_teamMarkTex()` | 23 |
| 5494 | `_makeTeamMark()` | 14 |
| 5508 | `_updateTeamMark()` | 7 |
| 5515 | `_botEye()` | 1 |
| 5516 | `_enemyOf()` | 8 |
| 5524 | `_duelToken()` | 20 |
| 5544 | `_updateBot()` | 812 |
| 6356 | `_flushTraining()` | 13 |
| 6369 | `_updateBotNN()` | 71 |
| 6440 | `_botShootNN()` | 45 |
| 6485 | `_radarFoot()` | 38 |
| 6523 | `_updateRadar()` | 64 |
| 6587 | `_banner()` | 26 |
| 6613 | `_resultadoDaRodada()` | 4 |
| 6617 | `_showScoreboard()` | 48 |
| 6665 | `_updateWeaponHud()` | 35 |
| 6700 | `_updateHud()` | 80 |
| 6780 | `update()` | 76 |
| 6856 | `dispose()` | 37 |

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
