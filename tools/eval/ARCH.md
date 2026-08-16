# ARCH.md — mapa de arquitetura e de CONFLITO (CS BRASIL / CORO SOLTO)

<!-- BEGIN:GERADO — não edite à mão, rode `npm run arch` -->

> Gerado por `node tools/gen-arch.mjs`. **Não edite este bloco à mão.**
> Versão do jogo: 2.0.0-alpha.115 · `npm run arch` para regenerar · `npm run arch:check` no CI.

## Tamanho dos arquivos indexados

| Arquivo | Linhas | Símbolos |
|---|---:|---:|
| `public/js/game.js` | 6534 | 230 |
| `public/js/main.js` | 2391 | 213 |
| `public/js/glbchars.js` | 838 | 60 |
| `public/js/characters.js` | 1076 | 42 |
| `public/js/vmattach.js` | 629 | 4 |
| `public/js/springs.js` | 261 | 28 |
| `public/js/weapons.js` | 345 | 20 |

## Maiores métodos de `game.js` — onde o conflito mora

Os 15 maiores somam **3027 linhas (46% do arquivo)**. Método grande = PR irrevisável e merge conflitante.

| Linhas | Início | Método | |
|---:|---:|---|---|
| 797 | 5212 | `_updateBot()` | ⚠️ candidato a extração |
| 546 | 574 | `constructor()` | 🔴 append-only |
| 310 | 4458 | `_updatePlayer()` | ⚠️ candidato a extração |
| 248 | 1886 | `_resetPositions()` |  |
| 241 | 1217 | `_buildViewModels()` |  |
| 148 | 4768 | `_updatePickups()` |  |
| 133 | 4068 | `_botCtf()` |  |
| 84 | 3802 | `_initCTF()` |  |
| 83 | 2667 | `_tryShoot()` |  |
| 80 | 6351 | `_updateHud()` |  |
| 79 | 3003 | `_dmgArc()` |  |
| 76 | 4207 | `_updateCtfHud()` |  |
| 71 | 6022 | `_updateBotNN()` |  |
| 67 | 6431 | `update()` | 🔴 append-only |
| 64 | 2939 | `_kill()` |  |

## Tabela de CONFLITO — resolvida para as linhas de hoje

Declare sua frente antes de editar. Em `game.js` use **só a ferramenta Edit, nunca Write**.
Duas frentes com faixas disjuntas podem rodar em paralelo — foi medido: 3 agentes editaram
faixas disjuntas simultaneamente com zero conflito de conteúdo.

| Frente | Faixas em `game.js` | Arquivos exclusivos |
|---|---|---|
| **ARMAS / VIEWMODEL** | `25–73` `335–335` `363–457` `484–505` `1217–1615` `2434–2439` `2521–2602` `2621–2814` `3224–3247` `3295–3357` `3423–3439` | `public/js/vmattach.js` `public/js/springs.js` `public/js/weapons.js` `public/js/fparms.js` `public/js/handik.js` `public/js/recoil.js` `public/js/vmlab.js` |
| **BOTS / JOGABILIDADE** | `189–192` `243–243` `269–280` `547–558` `2900–3002` `3746–3801` `3964–4200` `4283–4305` `4458–4767` `5084–5101` `5183–6008` | — |
| **MAPAS / MUNDO** | `1163–1216` `1886–2133` `3802–3941` `4768–4915` | `public/js/maps.js` `public/js/mapprops.js` `public/js/map_brasilia.js` `public/js/map_havan.js` `public/js/map_piscina.js` `public/js/map_piscinao_ramos.js` `public/js/map_ferrovelho.js` |
| **GRÁFICOS / FX** | `1616–1658` `2370–2382` `3248–3286` `3368–3422` | `public/js/bloom.js` `public/js/textures.js` `public/js/vao.js` `public/js/stylize.js` `public/js/gpuparticles.js` |
| **UI / HUD / MENU** | `1120–1162` `2330–2348` `2364–2369` `2383–2389` `3003–3144` `3160–3223` `6175–6238` `6269–6315` `6351–6430` | `public/js/main.js` `public/style.css` `src/pages/index.astro` |
| **ÁUDIO** | — | `public/js/audio.js` |
| **PERSONAGENS** | — | `public/js/characters.js` `public/js/glbchars.js` |
| **SITE / BACKEND** | — | `src/` `supabase/` |

**🔴 Zonas vermelhas (append-only, qualquer frente pode precisar):** `update()` 6431–6497 · `_dom()` 1120–1162 · `constructor()` 574–1119

Nenhuma sobreposição entre frentes — todas as faixas são disjuntas. ✓

Cobertura: **3740 de 6534 linhas (57%)** do `game.js` têm dono declarado. O resto é território neutro — declare a frente mesmo assim.

<details><summary><strong>Índice completo de <code>game.js</code> (todos os símbolos)</strong></summary>

| Linha | Símbolo | Linhas |
|---:|---|---:|
| 25 | `WEAPONS` | 49 |
| 76 | `VMLAB` | 8 |
| 84 | `VM_MAT_LEGACY` | 4 |
| 90 | `DROP_TTL` | 8 |
| 98 | `ROUNDS_MAX` | 27 |
| 128 | `CTF_CLOCK_SHOW` | 4 |
| 132 | `KILLS_PER_PLAYER` | 7 |
| 139 | `PACE` | 33 |
| 172 | `PAUSE_ARM_MS` | 9 |
| 182 | `confirmGate` | 7 |
| 193 | `BOT_AIM_PITCH` | 4 |
| 197 | `BOT_DMG_PLAYER` | 21 |
| 218 | `BOT_FAIR` | 5 |
| 223 | `BOT_MOVE2` | 15 |
| 247 | `BOT_FOCUS_MIN` | 22 |
| 273 | `BOT_TOKEN_REST` | 7 |
| 281 | `MOVE_MUL` | 6 |
| 288 | `MOVE2` | 5 |
| 293 | `RACK_OLD` | 4 |
| 297 | `RACK_RETA` | 25 |
| 324 | `RADIO` | 5 |
| 330 | `MK_LABELS` | 5 |
| 336 | `D2R` | 4 |
| 340 | `DMG_FALLOFF` | 5 |
| 345 | `HS_MUL` | 3 |
| 348 | `BALL_CLASS` | 15 |
| 363 | `STATIC_CLASS` | 75 |
| 439 | `VM_KNOB` | 19 |
| 460 | `vmFovForAspect` | 24 |
| 484 | `VM_OFF` | 22 |
| 506 | `vmOffY` | 35 |
| 541 | `VMP` | 6 |
| 547 | `BOT_SKILLS` | 11 |
| 559 | `diffKey` | 4 |
| 564 | `rollBotSkill` | 7 |
| 574 | `constructor()` | 546 |
| 1120 | `_dom()` | 43 |
| 1163 | `_buildEnv()` | 54 |
| 1217 | `_buildViewModels()` | 241 |
| 1458 | `_vmFrame` | 158 |
| 1616 | `_makePuffTexture()` | 11 |
| 1627 | `_makeFlashTex()` | 22 |
| 1649 | `_makeFlashCoreTex()` | 10 |
| 1659 | `_input()` | 2 |
| 1661 | `_kd` | 37 |
| 1698 | `_ku` | 4 |
| 1702 | `_md` | 34 |
| 1736 | `_mu` | 7 |
| 1743 | `_mm` | 15 |
| 1758 | `_cc` | 1 |
| 1759 | `_blur` | 1 |
| 1760 | `_plc` | 14 |
| 1774 | `_requestLock()` | 23 |
| 1797 | `_travaAtalhos()` | 4 |
| 1801 | `_soltaAtalhos()` | 3 |
| 1804 | `_acceptInput()` | 8 |
| 1812 | `_pauseBackdrop()` | 7 |
| 1819 | `_radioShow()` | 6 |
| 1825 | `_radioUi()` | 8 |
| 1833 | `_radioPick()` | 14 |
| 1847 | `start()` | 4 |
| 1851 | `_startRound()` | 35 |
| 1886 | `_resetPositions()` | 248 |
| 2134 | `_checkCtfAlvo()` | 13 |
| 2147 | `_checkPace()` | 13 |
| 2160 | `_endRound()` | 37 |
| 2197 | `_fimDaPartida()` | 11 |
| 2208 | `_endMatch()` | 58 |
| 2266 | `_ensureDolly()` | 41 |
| 2307 | `_tickDolly()` | 23 |
| 2330 | `setPaused()` | 19 |
| 2349 | `_now()` | 3 |
| 2352 | `pauseArmed()` | 1 |
| 2353 | `_syncPauseArm()` | 7 |
| 2360 | `resume()` | 4 |
| 2364 | `applySettings()` | 6 |
| 2370 | `_applyQuality()` | 13 |
| 2383 | `onResize()` | 7 |
| 2390 | `_switchTeam()` | 44 |
| 2434 | `_applyVmVisibility()` | 6 |
| 2440 | `_vmlabEnsure()` | 14 |
| 2454 | `_vmlabFrame()` | 28 |
| 2482 | `_tuneGet()` | 15 |
| 2497 | `_tune()` | 23 |
| 2520 | `_fxSet()` | 1 |
| 2521 | `_switchWeapon()` | 30 |
| 2551 | `_deploySfx()` | 7 |
| 2558 | `_scope()` | 17 |
| 2575 | `_zoomFov()` | 8 |
| 2583 | `_reloading()` | 1 |
| 2584 | `_startReload()` | 19 |
| 2603 | `_reloadLayers()` | 18 |
| 2621 | `_installRecoil()` | 33 |
| 2654 | `_shotRecoil()` | 13 |
| 2667 | `_tryShoot()` | 83 |
| 2750 | `_meleeHit()` | 12 |
| 2762 | `_fireHitscan()` | 53 |
| 2815 | `_surfaceOf()` | 27 |
| 2842 | `_fleshImpact()` | 19 |
| 2861 | `_fxVoice()` | 9 |
| 2870 | `_impactSfx()` | 14 |
| 2884 | `_tintFx()` | 16 |
| 2900 | `_damage()` | 39 |
| 2939 | `_kill()` | 64 |
| 3003 | `_dmgArc()` | 79 |
| 3082 | `_mkBanner()` | 9 |
| 3091 | `_hitmarker()` | 15 |
| 3106 | `_dmgNumber()` | 20 |
| 3126 | `_feed()` | 19 |
| 3145 | `_skullIcon()` | 6 |
| 3151 | `_killfeedWeaponIcon()` | 9 |
| 3160 | `_wpnIcon()` | 64 |
| 3224 | `_tracer()` | 24 |
| 3248 | `_puff()` | 39 |
| 3287 | `_holeDecalMat()` | 8 |
| 3295 | `_flash()` | 54 |
| 3349 | `_muzzleWorld()` | 9 |
| 3358 | `_updateDoors()` | 10 |
| 3368 | `_updateFx()` | 55 |
| 3423 | `_ejectCasing()` | 17 |
| 3440 | `_makeCtfFlagTex()` | 23 |
| 3463 | `_paintFlagSymbol()` | 9 |
| 3472 | `_flagTexFor()` | 26 |
| 3498 | `_legadoSimbolo()` | 8 |
| 3506 | `_loadCtfSymbols()` | 22 |
| 3528 | `_makeCtfZoneTex()` | 31 |
| 3559 | `_makeSmokeTex()` | 8 |
| 3567 | `_updateSmokeHud()` | 6 |
| 3573 | `_spawnGrenade()` | 11 |
| 3584 | `_throwSmoke()` | 8 |
| 3592 | `_throwFrag()` | 10 |
| 3602 | `_explodeFrag()` | 38 |
| 3640 | `_corDaFumaca()` | 15 |
| 3655 | `_popSmoke()` | 19 |
| 3674 | `_updateGrenades()` | 27 |
| 3701 | `_teamColor()` | 14 |
| 3715 | `_teamInk()` | 6 |
| 3721 | `_factionOf()` | 1 |
| 3722 | `_voiceKey()` | 1 |
| 3723 | `_teamName()` | 1 |
| 3724 | `_teamTag()` | 6 |
| 3730 | `_plaqueta()` | 13 |
| 3743 | `_mirror()` | 3 |
| 3746 | `_botSeparation()` | 56 |
| 3802 | `_initCTF()` | 84 |
| 3886 | `_updateCTF()` | 56 |
| 3942 | `_ctfWin()` | 22 |
| 3964 | `_freeYaw()` | 25 |
| 3989 | `_pullString()` | 23 |
| 4012 | `_walkReach()` | 18 |
| 4030 | `_wpComp()` | 16 |
| 4046 | `_findPathLocal()` | 22 |
| 4068 | `_botCtf()` | 133 |
| 4201 | `_hideCtfHud()` | 6 |
| 4207 | `_updateCtfHud()` | 76 |
| 4283 | `_collide()` | 23 |
| 4306 | `_collideRot()` | 26 |
| 4332 | `_freeSpot()` | 30 |
| 4362 | `_retaAndavel()` | 20 |
| 4382 | `_walkDepth()` | 16 |
| 4398 | `_noteHit()` | 17 |
| 4415 | `_deathFeedback()` | 43 |
| 4458 | `_updatePlayer()` | 310 |
| 4768 | `_updatePickups()` | 148 |
| 4916 | `_wpnMode()` | 5 |
| 4921 | `_botWeapon()` | 12 |
| 4933 | `_municaoInfinita()` | 1 |
| 4934 | `_pickupAllowed()` | 7 |
| 4941 | `_grabPickup()` | 34 |
| 4975 | `_assentarNoChao()` | 11 |
| 4986 | `_dropWeapon()` | 18 |
| 5004 | `_sumirDrop()` | 36 |
| 5040 | `_spawnY()` | 3 |
| 5043 | `_pickSpawn()` | 23 |
| 5066 | `_respawnPlayer()` | 18 |
| 5084 | `_losClear()` | 18 |
| 5102 | `_botCall()` | 37 |
| 5139 | `_teamMarkTex()` | 23 |
| 5162 | `_makeTeamMark()` | 14 |
| 5176 | `_updateTeamMark()` | 7 |
| 5183 | `_botEye()` | 1 |
| 5184 | `_enemyOf()` | 8 |
| 5192 | `_duelToken()` | 20 |
| 5212 | `_updateBot()` | 797 |
| 6009 | `_flushTraining()` | 13 |
| 6022 | `_updateBotNN()` | 71 |
| 6093 | `_botShootNN()` | 44 |
| 6137 | `_radarFoot()` | 38 |
| 6175 | `_updateRadar()` | 64 |
| 6239 | `_banner()` | 26 |
| 6265 | `_resultadoDaRodada()` | 4 |
| 6269 | `_showScoreboard()` | 47 |
| 6316 | `_updateWeaponHud()` | 35 |
| 6351 | `_updateHud()` | 80 |
| 6431 | `update()` | 67 |
| 6498 | `dispose()` | 36 |

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
