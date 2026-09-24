# ARCH.md — mapa de arquitetura e de CONFLITO (CS BRASIL / CORO SOLTO)

<!-- BEGIN:GERADO — não edite à mão, rode `npm run arch` -->

> Gerado por `node tools/gen-arch.mjs`. **Não edite este bloco à mão.**
> Versão do jogo: 2.0.0-alpha.264 · `npm run arch` para regenerar · `npm run arch:check` no CI.

## Tamanho dos arquivos indexados

| Arquivo | Linhas | Símbolos |
|---|---:|---:|
| `public/js/game.js` | 7495 | 277 |
| `public/js/main.js` | 3546 | 289 |
| `public/js/glbchars.js` | 852 | 60 |
| `public/js/characters.js` | 1100 | 40 |
| `public/js/vmattach.js` | 629 | 4 |
| `public/js/springs.js` | 261 | 28 |
| `public/js/weapons.js` | 354 | 22 |

## Maiores métodos de `game.js` — onde o conflito mora

Os 15 maiores somam **3145 linhas (42% do arquivo)**. Método grande = PR irrevisável e merge conflitante.

| Linhas | Início | Método | |
|---:|---:|---|---|
| 822 | 6105 | `_updateBot()` | ⚠️ candidato a extração |
| 586 | 622 | `constructor()` | 🔴 append-only |
| 248 | 2277 | `_resetPositions()` |  |
| 247 | 5310 | `_updatePlayer()` |  |
| 241 | 1306 | `_buildViewModels()` |  |
| 148 | 5570 | `_updatePickups()` |  |
| 137 | 4706 | `_botCtf()` |  |
| 115 | 2002 | `_touchControls()` |  |
| 98 | 5212 | `_moveEntity()` |  |
| 90 | 7361 | `update()` | 🔴 append-only |
| 87 | 7274 | `_updateHud()` |  |
| 86 | 4421 | `_initCTF()` |  |
| 85 | 3093 | `_tryShoot()` |  |
| 79 | 3551 | `_dmgArc()` |  |
| 76 | 4849 | `_updateCtfHud()` |  |

## Tabela de CONFLITO — resolvida para as linhas de hoje

Declare sua frente antes de editar. Em `game.js` use **só a ferramenta Edit, nunca Write**.
Duas frentes com faixas disjuntas podem rodar em paralelo — foi medido: 3 agentes editaram
faixas disjuntas simultaneamente com zero conflito de conteúdo.

| Frente | Faixas em `game.js` | Arquivos exclusivos |
|---|---|---|
| **ARMAS / VIEWMODEL** | `300–305` `362–456` `483–504` `1306–1705` `2854–2860` `2942–3028` `3047–3193` `3238–3291` `3779–3802` `3850–3933` `4005–4021` | `public/js/vmattach.js` `public/js/springs.js` `public/js/weapons.js` `public/js/fparms.js` `public/js/handik.js` `public/js/recoil.js` `public/js/vmlab.js` |
| **BOTS / JOGABILIDADE** | `154–157` `208–208` `234–245` `546–557` `3431–3550` `4360–4420` `4588–4842` `4925–4947` `5310–5556` `5926–5943` `6053–6083` `6105–6926` | — |
| **MAPAS / MUNDO** | `1252–1305` `2277–2524` `4421–4564` `5570–5717` | `public/js/maps.js` `public/js/mapprops.js` `public/js/map_brasilia.js` `public/js/map_havan.js` `public/js/map_piscina.js` `public/js/map_piscinao_ramos.js` `public/js/map_ferrovelho.js` |
| **GRÁFICOS / FX** | `1720–1729` `1844–1875` `2776–2788` `3803–3841` `3949–4004` | `public/js/bloom.js` `public/js/textures.js` `public/js/vao.js` `public/js/stylize.js` `public/js/gpuparticles.js` |
| **UI / HUD / MENU** | `1208–1251` `2729–2751` `2767–2775` `2789–2795` `3551–3629` `3646–3699` `3715–3778` `7097–7160` `7191–7238` `7274–7360` | `public/js/main.js` `public/style.css` `src/pages/index.astro` |
| **ÁUDIO** | — | `public/js/audio.js` |
| **PERSONAGENS** | — | `public/js/characters.js` `public/js/glbchars.js` |
| **SITE / BACKEND** | — | `src/` `supabase/` |

**🔴 Zonas vermelhas (append-only, qualquer frente pode precisar):** `update()` 7361–7450 · `_dom()` 1208–1251 · `constructor()` 622–1207

Nenhuma sobreposição entre frentes — todas as faixas são disjuntas. ✓

Cobertura: **3749 de 7495 linhas (50%)** do `game.js` têm dono declarado. O resto é território neutro — declare a frente mesmo assim.

<details><summary><strong>Índice completo de <code>game.js</code> (todos os símbolos)</strong></summary>

| Linha | Símbolo | Linhas |
|---:|---|---:|
| 37 | `ANNOUNCER_LAB` | 4 |
| 41 | `VMLAB` | 8 |
| 49 | `VM_MAT_LEGACY` | 4 |
| 55 | `DROP_TTL` | 8 |
| 63 | `ROUNDS_MAX` | 27 |
| 93 | `CTF_CLOCK_SHOW` | 4 |
| 97 | `KILLS_PER_PLAYER` | 7 |
| 104 | `PACE` | 33 |
| 137 | `PAUSE_ARM_MS` | 9 |
| 147 | `confirmGate` | 7 |
| 158 | `BOT_AIM_PITCH` | 4 |
| 162 | `BOT_DMG_PLAYER` | 21 |
| 183 | `BOT_FAIR` | 5 |
| 188 | `BOT_MOVE2` | 15 |
| 212 | `BOT_FOCUS_MIN` | 22 |
| 238 | `BOT_TOKEN_REST` | 7 |
| 246 | `MOVE_MUL` | 6 |
| 253 | `MOVE2` | 5 |
| 258 | `RACK_OLD` | 4 |
| 262 | `RACK_RETA` | 25 |
| 289 | `RADIO` | 5 |
| 295 | `MK_LABELS` | 5 |
| 300 | `GUNFEEL` | 6 |
| 311 | `coneDoDisparo` | 23 |
| 335 | `D2R` | 4 |
| 339 | `DMG_FALLOFF` | 5 |
| 344 | `HS_MUL` | 3 |
| 347 | `BALL_CLASS` | 15 |
| 362 | `STATIC_CLASS` | 75 |
| 438 | `VM_KNOB` | 19 |
| 459 | `vmFovForAspect` | 24 |
| 483 | `VM_OFF` | 22 |
| 505 | `vmOffY` | 35 |
| 540 | `VMP` | 6 |
| 546 | `BOT_SKILLS` | 11 |
| 558 | `diffKey` | 4 |
| 563 | `rollBotSkill` | 7 |
| 570 | `botTier` | 4 |
| 574 | `_cyclePool` | 4 |
| 578 | `_rosterPool` | 15 |
| 593 | `pickMatchRoster` | 12 |
| 605 | `BOT_WEAPON_POOL` | 5 |
| 610 | `pickMatchWeapons` | 9 |
| 622 | `constructor()` | 586 |
| 1208 | `_dom()` | 44 |
| 1252 | `_buildEnv()` | 54 |
| 1306 | `_buildViewModels()` | 241 |
| 1547 | `_vmFrame` | 159 |
| 1706 | `_vmMontarTardio` | 14 |
| 1720 | `_makePuffTexture()` | 10 |
| 1730 | `_makeBloodTex()` | 19 |
| 1749 | `_makeBloodPoolTex()` | 21 |
| 1770 | `_bloodDecal()` | 16 |
| 1786 | `_makeBloodFx()` | 20 |
| 1806 | `_bloodSpatter()` | 18 |
| 1824 | `_bloodPoolAt()` | 6 |
| 1830 | `_updateBlood()` | 14 |
| 1844 | `_makeFlashTex()` | 22 |
| 1866 | `_makeFlashCoreTex()` | 10 |
| 1876 | `_input()` | 2 |
| 1878 | `_kd` | 45 |
| 1923 | `_ku` | 4 |
| 1927 | `_md` | 34 |
| 1961 | `_mu` | 7 |
| 1968 | `_mm` | 15 |
| 1983 | `_cc` | 1 |
| 1984 | `_blur` | 1 |
| 1985 | `_plc` | 17 |
| 2002 | `_touchControls()` | 115 |
| 2117 | `_aimAssist()` | 28 |
| 2145 | `_requestLock()` | 27 |
| 2172 | `_travaAtalhos()` | 4 |
| 2176 | `_soltaAtalhos()` | 5 |
| 2181 | `espectando()` | 2 |
| 2183 | `_acceptInput()` | 8 |
| 2191 | `_pauseBackdrop()` | 7 |
| 2198 | `_radioShow()` | 6 |
| 2204 | `_radioUi()` | 8 |
| 2212 | `_radioPick()` | 16 |
| 2228 | `start()` | 5 |
| 2233 | `_startAnnouncerLab()` | 9 |
| 2242 | `_startRound()` | 35 |
| 2277 | `_resetPositions()` | 248 |
| 2525 | `_checkCtfAlvo()` | 13 |
| 2538 | `_checkPace()` | 13 |
| 2551 | `_endRound()` | 34 |
| 2585 | `_roundWinnerVoice()` | 12 |
| 2597 | `_fimDaPartida()` | 7 |
| 2604 | `_endMatch()` | 61 |
| 2665 | `_ensureDolly()` | 41 |
| 2706 | `_tickDolly()` | 23 |
| 2729 | `setPaused()` | 23 |
| 2752 | `_now()` | 3 |
| 2755 | `pauseArmed()` | 1 |
| 2756 | `_syncPauseArm()` | 7 |
| 2763 | `resume()` | 4 |
| 2767 | `applySettings()` | 9 |
| 2776 | `_applyQuality()` | 13 |
| 2789 | `onResize()` | 7 |
| 2796 | `_switchTeam()` | 58 |
| 2854 | `_applyVmVisibility()` | 7 |
| 2861 | `_vmlabEnsure()` | 14 |
| 2875 | `_vmlabFrame()` | 28 |
| 2903 | `_tuneGet()` | 15 |
| 2918 | `_tune()` | 23 |
| 2941 | `_fxSet()` | 1 |
| 2942 | `_switchWeapon()` | 34 |
| 2976 | `_deploySfx()` | 7 |
| 2983 | `_scope()` | 17 |
| 3000 | `_zoomFov()` | 8 |
| 3008 | `_reloading()` | 1 |
| 3009 | `_startReload()` | 20 |
| 3029 | `_reloadLayers()` | 18 |
| 3047 | `_installRecoil()` | 33 |
| 3080 | `_shotRecoil()` | 13 |
| 3093 | `_tryShoot()` | 85 |
| 3178 | `_meleeHit()` | 16 |
| 3194 | `_meleeRange()` | 5 |
| 3199 | `_botMelee()` | 28 |
| 3227 | `_shotDamage()` | 11 |
| 3238 | `_fireHitscan()` | 54 |
| 3292 | `_targetFromHit()` | 9 |
| 3301 | `_penetrationExit()` | 20 |
| 3321 | `_surfaceOf()` | 27 |
| 3348 | `_armoredTarget()` | 3 |
| 3351 | `_fleshImpact()` | 38 |
| 3389 | `_fxVoice()` | 9 |
| 3398 | `_impactSfx()` | 17 |
| 3415 | `_tintFx()` | 16 |
| 3431 | `_damage()` | 41 |
| 3472 | `_playerHurtFx()` | 6 |
| 3478 | `_kill()` | 73 |
| 3551 | `_dmgArc()` | 79 |
| 3630 | `_mkBanner()` | 11 |
| 3641 | `_acertoPrevisto()` | 5 |
| 3646 | `_hitmarker()` | 15 |
| 3661 | `_dmgNumber()` | 20 |
| 3681 | `_feed()` | 19 |
| 3700 | `_skullIcon()` | 6 |
| 3706 | `_killfeedWeaponIcon()` | 9 |
| 3715 | `_wpnIcon()` | 64 |
| 3779 | `_tracer()` | 24 |
| 3803 | `_puff()` | 39 |
| 3842 | `_holeDecalMat()` | 8 |
| 3850 | `_flash()` | 66 |
| 3916 | `_muzzleWorld()` | 18 |
| 3934 | `_aimOrigin()` | 5 |
| 3939 | `_updateDoors()` | 10 |
| 3949 | `_updateFx()` | 56 |
| 4005 | `_ejectCasing()` | 17 |
| 4022 | `_makeCtfFlagTex()` | 23 |
| 4045 | `_paintFlagSymbol()` | 9 |
| 4054 | `_flagTexFor()` | 26 |
| 4080 | `_legadoSimbolo()` | 8 |
| 4088 | `_loadCtfSymbols()` | 22 |
| 4110 | `_makeCtfZoneTex()` | 31 |
| 4141 | `_makeSmokeTex()` | 8 |
| 4149 | `_updateSmokeHud()` | 4 |
| 4153 | `_grenadeSpatial()` | 14 |
| 4167 | `_spawnGrenade()` | 13 |
| 4180 | `_throwSmoke()` | 11 |
| 4191 | `_throwFrag()` | 13 |
| 4204 | `_explodeFrag()` | 40 |
| 4244 | `_corDaFumaca()` | 15 |
| 4259 | `_popSmoke()` | 21 |
| 4280 | `_updateGrenades()` | 35 |
| 4315 | `_teamColor()` | 14 |
| 4329 | `_teamInk()` | 6 |
| 4335 | `_factionOf()` | 1 |
| 4336 | `_voiceKey()` | 1 |
| 4337 | `_teamName()` | 1 |
| 4338 | `_teamTag()` | 6 |
| 4344 | `_plaqueta()` | 13 |
| 4357 | `_mirror()` | 3 |
| 4360 | `_botSeparation()` | 61 |
| 4421 | `_initCTF()` | 86 |
| 4507 | `_updateCTF()` | 58 |
| 4565 | `_ctfWin()` | 23 |
| 4588 | `_freeYaw()` | 25 |
| 4613 | `_pullString()` | 23 |
| 4636 | `_walkReach()` | 32 |
| 4668 | `_wpComp()` | 16 |
| 4684 | `_findPathLocal()` | 22 |
| 4706 | `_botCtf()` | 137 |
| 4843 | `_hideCtfHud()` | 6 |
| 4849 | `_updateCtfHud()` | 76 |
| 4925 | `_collide()` | 23 |
| 4948 | `_collideRot()` | 26 |
| 4974 | `_freeSpot()` | 30 |
| 5004 | `_retaAndavel()` | 20 |
| 5024 | `_walkDepth()` | 16 |
| 5040 | `_noteHit()` | 17 |
| 5057 | `_deathFeedback()` | 45 |
| 5102 | `_toggleCamView()` | 11 |
| 5113 | `_syncCamViewVis()` | 8 |
| 5121 | `_ensurePlayerTP()` | 25 |
| 5146 | `_updatePlayerTP()` | 35 |
| 5181 | `_tpDeath()` | 18 |
| 5199 | `_tpRevive()` | 13 |
| 5212 | `_moveEntity()` | 98 |
| 5310 | `_updatePlayer()` | 247 |
| 5557 | `_footstepSurface()` | 13 |
| 5570 | `_updatePickups()` | 148 |
| 5718 | `_wpnMode()` | 5 |
| 5723 | `_botWeapon()` | 10 |
| 5733 | `_municaoInfinita()` | 1 |
| 5734 | `_pickupAllowed()` | 7 |
| 5741 | `_grabPickup()` | 35 |
| 5776 | `_assentarNoChao()` | 10 |
| 5786 | `refreshPickupModels()` | 24 |
| 5810 | `_dropWeapon()` | 20 |
| 5830 | `_sumirDrop()` | 36 |
| 5866 | `_spawnY()` | 3 |
| 5869 | `_spawnYaw()` | 5 |
| 5874 | `_pickSpawn()` | 23 |
| 5897 | `_respawnPlayer()` | 29 |
| 5926 | `_losClear()` | 18 |
| 5944 | `_botCall()` | 41 |
| 5985 | `_teamMarkTex()` | 23 |
| 6008 | `_makeTeamMark()` | 16 |
| 6024 | `_syncRemoteWeapon()` | 22 |
| 6046 | `_updateTeamMark()` | 7 |
| 6053 | `_botEye()` | 1 |
| 6054 | `_enemyOf()` | 8 |
| 6062 | `_duelToken()` | 22 |
| 6084 | `_respawnEntity()` | 21 |
| 6105 | `_updateBot()` | 822 |
| 6927 | `_flushTraining()` | 13 |
| 6940 | `_updateBotNN()` | 73 |
| 7013 | `_botShootNN()` | 46 |
| 7059 | `_radarFoot()` | 38 |
| 7097 | `_updateRadar()` | 64 |
| 7161 | `_banner()` | 26 |
| 7187 | `_resultadoDaRodada()` | 4 |
| 7191 | `_showScoreboard()` | 48 |
| 7239 | `_updateWeaponHud()` | 35 |
| 7274 | `_updateHud()` | 87 |
| 7361 | `update()` | 90 |
| 7451 | `dispose()` | 44 |

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
