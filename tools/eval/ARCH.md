# ARCH.md — mapa de arquitetura e de CONFLITO (CS BRASIL / CORO SOLTO)

<!-- BEGIN:GERADO — não edite à mão, rode `npm run arch` -->

> Gerado por `node tools/gen-arch.mjs`. **Não edite este bloco à mão.**
> Versão do jogo: 2.0.0-alpha.268 · `npm run arch` para regenerar · `npm run arch:check` no CI.

## Tamanho dos arquivos indexados

| Arquivo | Linhas | Símbolos |
|---|---:|---:|
| `public/js/game.js` | 7523 | 277 |
| `public/js/main.js` | 3576 | 292 |
| `public/js/glbchars.js` | 852 | 60 |
| `public/js/characters.js` | 1100 | 40 |
| `public/js/vmattach.js` | 629 | 4 |
| `public/js/springs.js` | 261 | 28 |
| `public/js/weapons.js` | 354 | 22 |

## Maiores métodos de `game.js` — onde o conflito mora

Os 15 maiores somam **3176 linhas (42% do arquivo)**. Método grande = PR irrevisável e merge conflitante.

| Linhas | Início | Método | |
|---:|---:|---|---|
| 822 | 6133 | `_updateBot()` | ⚠️ candidato a extração |
| 582 | 618 | `constructor()` | 🔴 append-only |
| 256 | 5307 | `_updatePlayer()` |  |
| 248 | 2277 | `_resetPositions()` |  |
| 241 | 1298 | `_buildViewModels()` |  |
| 158 | 5576 | `_updatePickups()` |  |
| 137 | 4703 | `_botCtf()` |  |
| 131 | 1986 | `_touchControls()` |  |
| 98 | 5209 | `_moveEntity()` |  |
| 90 | 7389 | `update()` | 🔴 append-only |
| 87 | 7302 | `_updateHud()` |  |
| 86 | 4418 | `_initCTF()` |  |
| 85 | 3090 | `_tryShoot()` |  |
| 79 | 3548 | `_dmgArc()` |  |
| 76 | 4846 | `_updateCtfHud()` |  |

## Tabela de CONFLITO — resolvida para as linhas de hoje

Declare sua frente antes de editar. Em `game.js` use **só a ferramenta Edit, nunca Write**.
Duas frentes com faixas disjuntas podem rodar em paralelo — foi medido: 3 agentes editaram
faixas disjuntas simultaneamente com zero conflito de conteúdo.

| Frente | Faixas em `game.js` | Arquivos exclusivos |
|---|---|---|
| **ARMAS / VIEWMODEL** | `300–305` `362–456` `483–504` `1298–1697` `2851–2857` `2939–3025` `3044–3190` `3235–3288` `3776–3799` `3847–3930` `4002–4018` | `public/js/vmattach.js` `public/js/springs.js` `public/js/weapons.js` `public/js/fparms.js` `public/js/handik.js` `public/js/recoil.js` `public/js/vmlab.js` |
| **BOTS / JOGABILIDADE** | `154–157` `208–208` `234–245` `546–557` `3428–3547` `4357–4417` `4585–4839` `4922–4944` `5307–5562` `5954–5971` `6081–6111` `6133–6954` | — |
| **MAPAS / MUNDO** | `1244–1297` `2277–2524` `4418–4561` `5576–5733` | `public/js/maps.js` `public/js/mapprops.js` `public/js/map_brasilia.js` `public/js/map_havan.js` `public/js/map_piscina.js` `public/js/map_piscinao_ramos.js` `public/js/map_ferrovelho.js` |
| **GRÁFICOS / FX** | `1712–1721` `1836–1867` `2773–2785` `3800–3838` `3946–4001` | `public/js/bloom.js` `public/js/textures.js` `public/js/vao.js` `public/js/stylize.js` `public/js/gpuparticles.js` |
| **UI / HUD / MENU** | `1200–1243` `2729–2751` `2767–2772` `2786–2792` `3548–3626` `3643–3696` `3712–3775` `7125–7188` `7219–7266` `7302–7388` | `public/js/main.js` `public/style.css` `src/pages/index.astro` |
| **ÁUDIO** | — | `public/js/audio.js` |
| **PERSONAGENS** | — | `public/js/characters.js` `public/js/glbchars.js` |
| **SITE / BACKEND** | — | `src/` `supabase/` |

**🔴 Zonas vermelhas (append-only, qualquer frente pode precisar):** `update()` 7389–7478 · `_dom()` 1200–1243 · `constructor()` 618–1199

Nenhuma sobreposição entre frentes — todas as faixas são disjuntas. ✓

Cobertura: **3765 de 7523 linhas (50%)** do `game.js` têm dono declarado. O resto é território neutro — declare a frente mesmo assim.

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
| 610 | `pickMatchWeapons` | 7 |
| 618 | `constructor()` | 582 |
| 1200 | `_dom()` | 44 |
| 1244 | `_buildEnv()` | 54 |
| 1298 | `_buildViewModels()` | 241 |
| 1539 | `_vmFrame` | 159 |
| 1698 | `_vmMontarTardio` | 14 |
| 1712 | `_makePuffTexture()` | 10 |
| 1722 | `_makeBloodTex()` | 19 |
| 1741 | `_makeBloodPoolTex()` | 21 |
| 1762 | `_bloodDecal()` | 16 |
| 1778 | `_makeBloodFx()` | 20 |
| 1798 | `_bloodSpatter()` | 18 |
| 1816 | `_bloodPoolAt()` | 6 |
| 1822 | `_updateBlood()` | 14 |
| 1836 | `_makeFlashTex()` | 22 |
| 1858 | `_makeFlashCoreTex()` | 10 |
| 1868 | `_input()` | 2 |
| 1870 | `_kd` | 37 |
| 1907 | `_ku` | 4 |
| 1911 | `_md` | 34 |
| 1945 | `_mu` | 7 |
| 1952 | `_mm` | 15 |
| 1967 | `_cc` | 1 |
| 1968 | `_blur` | 1 |
| 1969 | `_plc` | 17 |
| 1986 | `_touchControls()` | 131 |
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
| 2767 | `applySettings()` | 6 |
| 2773 | `_applyQuality()` | 13 |
| 2786 | `onResize()` | 7 |
| 2793 | `_switchTeam()` | 58 |
| 2851 | `_applyVmVisibility()` | 7 |
| 2858 | `_vmlabEnsure()` | 14 |
| 2872 | `_vmlabFrame()` | 28 |
| 2900 | `_tuneGet()` | 15 |
| 2915 | `_tune()` | 23 |
| 2938 | `_fxSet()` | 1 |
| 2939 | `_switchWeapon()` | 34 |
| 2973 | `_deploySfx()` | 7 |
| 2980 | `_scope()` | 17 |
| 2997 | `_zoomFov()` | 8 |
| 3005 | `_reloading()` | 1 |
| 3006 | `_startReload()` | 20 |
| 3026 | `_reloadLayers()` | 18 |
| 3044 | `_installRecoil()` | 33 |
| 3077 | `_shotRecoil()` | 13 |
| 3090 | `_tryShoot()` | 85 |
| 3175 | `_meleeHit()` | 16 |
| 3191 | `_meleeRange()` | 5 |
| 3196 | `_botMelee()` | 28 |
| 3224 | `_shotDamage()` | 11 |
| 3235 | `_fireHitscan()` | 54 |
| 3289 | `_targetFromHit()` | 9 |
| 3298 | `_penetrationExit()` | 20 |
| 3318 | `_surfaceOf()` | 27 |
| 3345 | `_armoredTarget()` | 3 |
| 3348 | `_fleshImpact()` | 38 |
| 3386 | `_fxVoice()` | 9 |
| 3395 | `_impactSfx()` | 17 |
| 3412 | `_tintFx()` | 16 |
| 3428 | `_damage()` | 41 |
| 3469 | `_playerHurtFx()` | 6 |
| 3475 | `_kill()` | 73 |
| 3548 | `_dmgArc()` | 79 |
| 3627 | `_mkBanner()` | 11 |
| 3638 | `_acertoPrevisto()` | 5 |
| 3643 | `_hitmarker()` | 15 |
| 3658 | `_dmgNumber()` | 20 |
| 3678 | `_feed()` | 19 |
| 3697 | `_skullIcon()` | 6 |
| 3703 | `_killfeedWeaponIcon()` | 9 |
| 3712 | `_wpnIcon()` | 64 |
| 3776 | `_tracer()` | 24 |
| 3800 | `_puff()` | 39 |
| 3839 | `_holeDecalMat()` | 8 |
| 3847 | `_flash()` | 66 |
| 3913 | `_muzzleWorld()` | 18 |
| 3931 | `_aimOrigin()` | 5 |
| 3936 | `_updateDoors()` | 10 |
| 3946 | `_updateFx()` | 56 |
| 4002 | `_ejectCasing()` | 17 |
| 4019 | `_makeCtfFlagTex()` | 23 |
| 4042 | `_paintFlagSymbol()` | 9 |
| 4051 | `_flagTexFor()` | 26 |
| 4077 | `_legadoSimbolo()` | 8 |
| 4085 | `_loadCtfSymbols()` | 22 |
| 4107 | `_makeCtfZoneTex()` | 31 |
| 4138 | `_makeSmokeTex()` | 8 |
| 4146 | `_updateSmokeHud()` | 4 |
| 4150 | `_grenadeSpatial()` | 14 |
| 4164 | `_spawnGrenade()` | 13 |
| 4177 | `_throwSmoke()` | 11 |
| 4188 | `_throwFrag()` | 13 |
| 4201 | `_explodeFrag()` | 40 |
| 4241 | `_corDaFumaca()` | 15 |
| 4256 | `_popSmoke()` | 21 |
| 4277 | `_updateGrenades()` | 35 |
| 4312 | `_teamColor()` | 14 |
| 4326 | `_teamInk()` | 6 |
| 4332 | `_factionOf()` | 1 |
| 4333 | `_voiceKey()` | 1 |
| 4334 | `_teamName()` | 1 |
| 4335 | `_teamTag()` | 6 |
| 4341 | `_plaqueta()` | 13 |
| 4354 | `_mirror()` | 3 |
| 4357 | `_botSeparation()` | 61 |
| 4418 | `_initCTF()` | 86 |
| 4504 | `_updateCTF()` | 58 |
| 4562 | `_ctfWin()` | 23 |
| 4585 | `_freeYaw()` | 25 |
| 4610 | `_pullString()` | 23 |
| 4633 | `_walkReach()` | 32 |
| 4665 | `_wpComp()` | 16 |
| 4681 | `_findPathLocal()` | 22 |
| 4703 | `_botCtf()` | 137 |
| 4840 | `_hideCtfHud()` | 6 |
| 4846 | `_updateCtfHud()` | 76 |
| 4922 | `_collide()` | 23 |
| 4945 | `_collideRot()` | 26 |
| 4971 | `_freeSpot()` | 30 |
| 5001 | `_retaAndavel()` | 20 |
| 5021 | `_walkDepth()` | 16 |
| 5037 | `_noteHit()` | 17 |
| 5054 | `_deathFeedback()` | 45 |
| 5099 | `_toggleCamView()` | 11 |
| 5110 | `_syncCamViewVis()` | 8 |
| 5118 | `_ensurePlayerTP()` | 25 |
| 5143 | `_updatePlayerTP()` | 35 |
| 5178 | `_tpDeath()` | 18 |
| 5196 | `_tpRevive()` | 13 |
| 5209 | `_moveEntity()` | 98 |
| 5307 | `_updatePlayer()` | 256 |
| 5563 | `_footstepSurface()` | 13 |
| 5576 | `_updatePickups()` | 158 |
| 5734 | `_wpnMode()` | 5 |
| 5739 | `_botWeapon()` | 10 |
| 5749 | `_municaoInfinita()` | 1 |
| 5750 | `_pickupAllowed()` | 9 |
| 5759 | `_grabNearPickup()` | 10 |
| 5769 | `_grabPickup()` | 35 |
| 5804 | `_assentarNoChao()` | 10 |
| 5814 | `refreshPickupModels()` | 24 |
| 5838 | `_dropWeapon()` | 20 |
| 5858 | `_sumirDrop()` | 36 |
| 5894 | `_spawnY()` | 3 |
| 5897 | `_spawnYaw()` | 5 |
| 5902 | `_pickSpawn()` | 23 |
| 5925 | `_respawnPlayer()` | 29 |
| 5954 | `_losClear()` | 18 |
| 5972 | `_botCall()` | 41 |
| 6013 | `_teamMarkTex()` | 23 |
| 6036 | `_makeTeamMark()` | 16 |
| 6052 | `_syncRemoteWeapon()` | 22 |
| 6074 | `_updateTeamMark()` | 7 |
| 6081 | `_botEye()` | 1 |
| 6082 | `_enemyOf()` | 8 |
| 6090 | `_duelToken()` | 22 |
| 6112 | `_respawnEntity()` | 21 |
| 6133 | `_updateBot()` | 822 |
| 6955 | `_flushTraining()` | 13 |
| 6968 | `_updateBotNN()` | 73 |
| 7041 | `_botShootNN()` | 46 |
| 7087 | `_radarFoot()` | 38 |
| 7125 | `_updateRadar()` | 64 |
| 7189 | `_banner()` | 26 |
| 7215 | `_resultadoDaRodada()` | 4 |
| 7219 | `_showScoreboard()` | 48 |
| 7267 | `_updateWeaponHud()` | 35 |
| 7302 | `_updateHud()` | 87 |
| 7389 | `update()` | 90 |
| 7479 | `dispose()` | 44 |

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
