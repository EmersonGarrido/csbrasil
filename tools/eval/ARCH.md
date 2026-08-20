# ARCH.md — mapa de arquitetura e de CONFLITO (CS BRASIL / CORO SOLTO)

<!-- BEGIN:GERADO — não edite à mão, rode `npm run arch` -->

> Gerado por `node tools/gen-arch.mjs`. **Não edite este bloco à mão.**
> Versão do jogo: 2.0.0-alpha.161 · `npm run arch` para regenerar · `npm run arch:check` no CI.

## Tamanho dos arquivos indexados

| Arquivo | Linhas | Símbolos |
|---|---:|---:|
| `public/js/game.js` | 6855 | 239 |
| `public/js/main.js` | 2659 | 248 |
| `public/js/glbchars.js` | 838 | 60 |
| `public/js/characters.js` | 1069 | 40 |
| `public/js/vmattach.js` | 629 | 4 |
| `public/js/springs.js` | 261 | 28 |
| `public/js/weapons.js` | 345 | 20 |

## Maiores métodos de `game.js` — onde o conflito mora

Os 15 maiores somam **3126 linhas (46% do arquivo)**. Método grande = PR irrevisável e merge conflitante.

| Linhas | Início | Método | |
|---:|---:|---|---|
| 812 | 5511 | `_updateBot()` | ⚠️ candidato a extração |
| 570 | 538 | `constructor()` | 🔴 append-only |
| 313 | 4746 | `_updatePlayer()` | ⚠️ candidato a extração |
| 248 | 2148 | `_resetPositions()` |  |
| 241 | 1205 | `_buildViewModels()` |  |
| 148 | 5059 | `_updatePickups()` |  |
| 133 | 4356 | `_botCtf()` |  |
| 117 | 1890 | `_touchControls()` |  |
| 84 | 4090 | `_initCTF()` |  |
| 83 | 2933 | `_tryShoot()` |  |
| 80 | 6667 | `_updateHud()` |  |
| 79 | 3290 | `_dmgArc()` |  |
| 76 | 4495 | `_updateCtfHud()` |  |
| 71 | 6336 | `_updateBotNN()` |  |
| 71 | 6747 | `update()` | 🔴 append-only |

## Tabela de CONFLITO — resolvida para as linhas de hoje

Declare sua frente antes de editar. Em `game.js` use **só a ferramenta Edit, nunca Write**.
Duas frentes com faixas disjuntas podem rodar em paralelo — foi medido: 3 agentes editaram
faixas disjuntas simultaneamente com zero conflito de conteúdo.

| Frente | Faixas em `game.js` | Arquivos exclusivos |
|---|---|---|
| **ARMAS / VIEWMODEL** | `295–298` `327–421` `448–469` `1205–1603` `2698–2703` `2785–2868` `2887–3080` `3511–3534` `3582–3644` `3711–3727` | `public/js/vmattach.js` `public/js/springs.js` `public/js/weapons.js` `public/js/fparms.js` `public/js/handik.js` `public/js/recoil.js` `public/js/vmlab.js` |
| **BOTS / JOGABILIDADE** | `149–152` `203–203` `229–240` `511–522` `3185–3289` `4034–4089` `4252–4488` `4571–4593` `4746–5058` `5383–5400` `5482–6322` | — |
| **MAPAS / MUNDO** | `1151–1204` `2148–2395` `4090–4229` `5059–5206` | `public/js/maps.js` `public/js/mapprops.js` `public/js/map_brasilia.js` `public/js/map_havan.js` `public/js/map_piscina.js` `public/js/map_piscinao_ramos.js` `public/js/map_ferrovelho.js` |
| **GRÁFICOS / FX** | `1604–1614` `1732–1763` `2631–2643` `3535–3573` `3655–3710` | `public/js/bloom.js` `public/js/textures.js` `public/js/vao.js` `public/js/stylize.js` `public/js/gpuparticles.js` |
| **UI / HUD / MENU** | `1108–1150` `2588–2609` `2625–2630` `2644–2650` `3290–3431` `3447–3510` `6490–6553` `6584–6631` `6667–6746` | `public/js/main.js` `public/style.css` `src/pages/index.astro` |
| **ÁUDIO** | — | `public/js/audio.js` |
| **PERSONAGENS** | — | `public/js/characters.js` `public/js/glbchars.js` |
| **SITE / BACKEND** | — | `src/` `supabase/` |

**🔴 Zonas vermelhas (append-only, qualquer frente pode precisar):** `update()` 6747–6817 · `_dom()` 1108–1150 · `constructor()` 538–1107

Nenhuma sobreposição entre frentes — todas as faixas são disjuntas. ✓

Cobertura: **3721 de 6855 linhas (54%)** do `game.js` têm dono declarado. O resto é território neutro — declare a frente mesmo assim.

<details><summary><strong>Índice completo de <code>game.js</code> (todos os símbolos)</strong></summary>

| Linha | Símbolo | Linhas |
|---:|---|---:|
| 36 | `VMLAB` | 8 |
| 44 | `VM_MAT_LEGACY` | 4 |
| 50 | `DROP_TTL` | 8 |
| 58 | `ROUNDS_MAX` | 27 |
| 88 | `CTF_CLOCK_SHOW` | 4 |
| 92 | `KILLS_PER_PLAYER` | 7 |
| 99 | `PACE` | 33 |
| 132 | `PAUSE_ARM_MS` | 9 |
| 142 | `confirmGate` | 7 |
| 153 | `BOT_AIM_PITCH` | 4 |
| 157 | `BOT_DMG_PLAYER` | 21 |
| 178 | `BOT_FAIR` | 5 |
| 183 | `BOT_MOVE2` | 15 |
| 207 | `BOT_FOCUS_MIN` | 22 |
| 233 | `BOT_TOKEN_REST` | 7 |
| 241 | `MOVE_MUL` | 6 |
| 248 | `MOVE2` | 5 |
| 253 | `RACK_OLD` | 4 |
| 257 | `RACK_RETA` | 25 |
| 284 | `RADIO` | 5 |
| 290 | `MK_LABELS` | 5 |
| 295 | `GUNFEEL` | 4 |
| 300 | `D2R` | 4 |
| 304 | `DMG_FALLOFF` | 5 |
| 309 | `HS_MUL` | 3 |
| 312 | `BALL_CLASS` | 15 |
| 327 | `STATIC_CLASS` | 75 |
| 403 | `VM_KNOB` | 19 |
| 424 | `vmFovForAspect` | 24 |
| 448 | `VM_OFF` | 22 |
| 470 | `vmOffY` | 35 |
| 505 | `VMP` | 6 |
| 511 | `BOT_SKILLS` | 11 |
| 523 | `diffKey` | 4 |
| 528 | `rollBotSkill` | 7 |
| 538 | `constructor()` | 570 |
| 1108 | `_dom()` | 43 |
| 1151 | `_buildEnv()` | 54 |
| 1205 | `_buildViewModels()` | 241 |
| 1446 | `_vmFrame` | 158 |
| 1604 | `_makePuffTexture()` | 11 |
| 1615 | `_makeBloodTex()` | 18 |
| 1633 | `_makeBloodPoolTex()` | 21 |
| 1654 | `_bloodDecal()` | 18 |
| 1672 | `_makeBloodFx()` | 21 |
| 1693 | `_bloodSpatter()` | 19 |
| 1712 | `_bloodPoolAt()` | 6 |
| 1718 | `_updateBlood()` | 14 |
| 1732 | `_makeFlashTex()` | 22 |
| 1754 | `_makeFlashCoreTex()` | 10 |
| 1764 | `_input()` | 2 |
| 1766 | `_kd` | 42 |
| 1808 | `_ku` | 4 |
| 1812 | `_md` | 34 |
| 1846 | `_mu` | 7 |
| 1853 | `_mm` | 15 |
| 1868 | `_cc` | 1 |
| 1869 | `_blur` | 1 |
| 1870 | `_plc` | 20 |
| 1890 | `_touchControls()` | 117 |
| 2007 | `_aimAssist()` | 28 |
| 2035 | `_requestLock()` | 24 |
| 2059 | `_travaAtalhos()` | 4 |
| 2063 | `_soltaAtalhos()` | 3 |
| 2066 | `_acceptInput()` | 8 |
| 2074 | `_pauseBackdrop()` | 7 |
| 2081 | `_radioShow()` | 6 |
| 2087 | `_radioUi()` | 8 |
| 2095 | `_radioPick()` | 14 |
| 2109 | `start()` | 4 |
| 2113 | `_startRound()` | 35 |
| 2148 | `_resetPositions()` | 248 |
| 2396 | `_checkCtfAlvo()` | 13 |
| 2409 | `_checkPace()` | 13 |
| 2422 | `_endRound()` | 37 |
| 2459 | `_fimDaPartida()` | 7 |
| 2466 | `_endMatch()` | 58 |
| 2524 | `_ensureDolly()` | 41 |
| 2565 | `_tickDolly()` | 23 |
| 2588 | `setPaused()` | 22 |
| 2610 | `_now()` | 3 |
| 2613 | `pauseArmed()` | 1 |
| 2614 | `_syncPauseArm()` | 7 |
| 2621 | `resume()` | 4 |
| 2625 | `applySettings()` | 6 |
| 2631 | `_applyQuality()` | 13 |
| 2644 | `onResize()` | 7 |
| 2651 | `_switchTeam()` | 47 |
| 2698 | `_applyVmVisibility()` | 6 |
| 2704 | `_vmlabEnsure()` | 14 |
| 2718 | `_vmlabFrame()` | 28 |
| 2746 | `_tuneGet()` | 15 |
| 2761 | `_tune()` | 23 |
| 2784 | `_fxSet()` | 1 |
| 2785 | `_switchWeapon()` | 32 |
| 2817 | `_deploySfx()` | 7 |
| 2824 | `_scope()` | 17 |
| 2841 | `_zoomFov()` | 8 |
| 2849 | `_reloading()` | 1 |
| 2850 | `_startReload()` | 19 |
| 2869 | `_reloadLayers()` | 18 |
| 2887 | `_installRecoil()` | 33 |
| 2920 | `_shotRecoil()` | 13 |
| 2933 | `_tryShoot()` | 83 |
| 3016 | `_meleeHit()` | 12 |
| 3028 | `_fireHitscan()` | 53 |
| 3081 | `_surfaceOf()` | 27 |
| 3108 | `_fleshImpact()` | 38 |
| 3146 | `_fxVoice()` | 9 |
| 3155 | `_impactSfx()` | 14 |
| 3169 | `_tintFx()` | 16 |
| 3185 | `_damage()` | 39 |
| 3224 | `_kill()` | 66 |
| 3290 | `_dmgArc()` | 79 |
| 3369 | `_mkBanner()` | 9 |
| 3378 | `_hitmarker()` | 15 |
| 3393 | `_dmgNumber()` | 20 |
| 3413 | `_feed()` | 19 |
| 3432 | `_skullIcon()` | 6 |
| 3438 | `_killfeedWeaponIcon()` | 9 |
| 3447 | `_wpnIcon()` | 64 |
| 3511 | `_tracer()` | 24 |
| 3535 | `_puff()` | 39 |
| 3574 | `_holeDecalMat()` | 8 |
| 3582 | `_flash()` | 54 |
| 3636 | `_muzzleWorld()` | 9 |
| 3645 | `_updateDoors()` | 10 |
| 3655 | `_updateFx()` | 56 |
| 3711 | `_ejectCasing()` | 17 |
| 3728 | `_makeCtfFlagTex()` | 23 |
| 3751 | `_paintFlagSymbol()` | 9 |
| 3760 | `_flagTexFor()` | 26 |
| 3786 | `_legadoSimbolo()` | 8 |
| 3794 | `_loadCtfSymbols()` | 22 |
| 3816 | `_makeCtfZoneTex()` | 31 |
| 3847 | `_makeSmokeTex()` | 8 |
| 3855 | `_updateSmokeHud()` | 6 |
| 3861 | `_spawnGrenade()` | 11 |
| 3872 | `_throwSmoke()` | 8 |
| 3880 | `_throwFrag()` | 10 |
| 3890 | `_explodeFrag()` | 38 |
| 3928 | `_corDaFumaca()` | 15 |
| 3943 | `_popSmoke()` | 19 |
| 3962 | `_updateGrenades()` | 27 |
| 3989 | `_teamColor()` | 14 |
| 4003 | `_teamInk()` | 6 |
| 4009 | `_factionOf()` | 1 |
| 4010 | `_voiceKey()` | 1 |
| 4011 | `_teamName()` | 1 |
| 4012 | `_teamTag()` | 6 |
| 4018 | `_plaqueta()` | 13 |
| 4031 | `_mirror()` | 3 |
| 4034 | `_botSeparation()` | 56 |
| 4090 | `_initCTF()` | 84 |
| 4174 | `_updateCTF()` | 56 |
| 4230 | `_ctfWin()` | 22 |
| 4252 | `_freeYaw()` | 25 |
| 4277 | `_pullString()` | 23 |
| 4300 | `_walkReach()` | 18 |
| 4318 | `_wpComp()` | 16 |
| 4334 | `_findPathLocal()` | 22 |
| 4356 | `_botCtf()` | 133 |
| 4489 | `_hideCtfHud()` | 6 |
| 4495 | `_updateCtfHud()` | 76 |
| 4571 | `_collide()` | 23 |
| 4594 | `_collideRot()` | 26 |
| 4620 | `_freeSpot()` | 30 |
| 4650 | `_retaAndavel()` | 20 |
| 4670 | `_walkDepth()` | 16 |
| 4686 | `_noteHit()` | 17 |
| 4703 | `_deathFeedback()` | 43 |
| 4746 | `_updatePlayer()` | 313 |
| 5059 | `_updatePickups()` | 148 |
| 5207 | `_wpnMode()` | 5 |
| 5212 | `_botWeapon()` | 12 |
| 5224 | `_municaoInfinita()` | 1 |
| 5225 | `_pickupAllowed()` | 7 |
| 5232 | `_grabPickup()` | 35 |
| 5267 | `_assentarNoChao()` | 11 |
| 5278 | `_dropWeapon()` | 18 |
| 5296 | `_sumirDrop()` | 36 |
| 5332 | `_spawnY()` | 3 |
| 5335 | `_pickSpawn()` | 23 |
| 5358 | `_respawnPlayer()` | 25 |
| 5383 | `_losClear()` | 18 |
| 5401 | `_botCall()` | 37 |
| 5438 | `_teamMarkTex()` | 23 |
| 5461 | `_makeTeamMark()` | 14 |
| 5475 | `_updateTeamMark()` | 7 |
| 5482 | `_botEye()` | 1 |
| 5483 | `_enemyOf()` | 8 |
| 5491 | `_duelToken()` | 20 |
| 5511 | `_updateBot()` | 812 |
| 6323 | `_flushTraining()` | 13 |
| 6336 | `_updateBotNN()` | 71 |
| 6407 | `_botShootNN()` | 45 |
| 6452 | `_radarFoot()` | 38 |
| 6490 | `_updateRadar()` | 64 |
| 6554 | `_banner()` | 26 |
| 6580 | `_resultadoDaRodada()` | 4 |
| 6584 | `_showScoreboard()` | 48 |
| 6632 | `_updateWeaponHud()` | 35 |
| 6667 | `_updateHud()` | 80 |
| 6747 | `update()` | 71 |
| 6818 | `dispose()` | 37 |

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
