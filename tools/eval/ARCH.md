# ARCH.md — mapa de arquitetura e de CONFLITO (CS BRASIL / CORO SOLTO)

<!-- BEGIN:GERADO — não edite à mão, rode `npm run arch` -->

> Gerado por `node tools/gen-arch.mjs`. **Não edite este bloco à mão.**
> Versão do jogo: 2.0.0-alpha.36 · `npm run arch` para regenerar · `npm run arch:check` no CI.

## Tamanho dos arquivos indexados

| Arquivo | Linhas | Símbolos |
|---|---:|---:|
| `public/js/game.js` | 6581 | 232 |
| `public/js/main.js` | 1712 | 154 |
| `public/js/glbchars.js` | 812 | 60 |
| `public/js/characters.js` | 1067 | 41 |
| `public/js/vmattach.js` | 628 | 4 |
| `public/js/springs.js` | 261 | 28 |
| `public/js/weapons.js` | 345 | 20 |

## Maiores métodos de `game.js` — onde o conflito mora

Os 15 maiores somam **2990 linhas (45% do arquivo)**. Método grande = PR irrevisável e merge conflitante.

| Linhas | Início | Método | |
|---:|---:|---|---|
| 800 | 5448 | `_updateBot()` | ⚠️ candidato a extração |
| 524 | 682 | `constructor()` | 🔴 append-only |
| 327 | 4700 | `_updatePlayer()` | ⚠️ candidato a extração |
| 248 | 2191 | `_resetPositions()` |  |
| 242 | 1295 | `_buildViewModels()` |  |
| 146 | 5027 | `_updatePickups()` |  |
| 133 | 4312 | `_botCtf()` |  |
| 84 | 4046 | `_initCTF()` |  |
| 83 | 2938 | `_tryShoot()` |  |
| 77 | 3269 | `_dmgArc()` |  |
| 76 | 4451 | `_updateCtfHud()` |  |
| 66 | 6286 | `_updateRadar()` |  |
| 64 | 3418 | `_wpnIcon()` |  |
| 61 | 6484 | `update()` | 🔴 append-only |
| 59 | 3210 | `_kill()` |  |

## Tabela de CONFLITO — resolvida para as linhas de hoje

Declare sua frente antes de editar. Em `game.js` use **só a ferramenta Edit, nunca Write**.
Duas frentes com faixas disjuntas podem rodar em paralelo — foi medido: 3 agentes editaram
faixas disjuntas simultaneamente com zero conflito de conteúdo.

| Frente | Faixas em `game.js` | Arquivos exclusivos |
|---|---|---|
| **ARMAS / VIEWMODEL** | `16–64` `323–323` `357–366` `391–417` `518–535` `562–583` `609–612` `629–648` `1295–1921` `2720–2777` `2792–2873` `2892–3085` `3482–3505` `3553–3613` `3679–3695` | `public/js/vmattach.js` `public/js/springs.js` `public/js/weapons.js` `public/js/fparms.js` `public/js/handik.js` |
| **BOTS / JOGABILIDADE** | `177–180` `231–231` `257–268` `655–666` `3171–3268` `3990–4045` `4208–4444` `4527–4549` `4700–5026` `5320–5337` `5419–6247` | — |
| **MAPAS / MUNDO** | `1241–1294` `2191–2438` `4046–4185` `5027–5172` | `public/js/maps.js` `public/js/mapprops.js` `public/js/map_brasilia.js` `public/js/map_havan.js` `public/js/map_piscina.js` `public/js/map_piscinao_ramos.js` `public/js/map_ferrovelho.js` |
| **GRÁFICOS / FX** | `1922–1964` `2656–2668` `3506–3544` `3624–3678` | `public/js/bloom.js` `public/js/textures.js` `public/js/vao.js` `public/js/stylize.js` `public/js/gpuparticles.js` |
| **UI / HUD / MENU** | `1206–1240` `2616–2634` `2650–2655` `2669–2675` `3269–3481` `6286–6351` `6382–6483` | `public/js/main.js` `public/style.css` `src/pages/index.astro` |
| **ÁUDIO** | — | `public/js/audio.js` |
| **PERSONAGENS** | — | `public/js/characters.js` `public/js/glbchars.js` |
| **SITE / BACKEND** | — | `src/` `supabase/` |

**🔴 Zonas vermelhas (append-only, qualquer frente pode precisar):** `update()` 6484–6544 · `_dom()` 1206–1240 · `constructor()` 682–1205

Nenhuma sobreposição entre frentes — todas as faixas são disjuntas. ✓

Cobertura: **3982 de 6581 linhas (61%)** do `game.js` têm dono declarado. O resto é território neutro — declare a frente mesmo assim.

<details><summary><strong>Índice completo de <code>game.js</code> (todos os símbolos)</strong></summary>

| Linha | Símbolo | Linhas |
|---:|---|---:|
| 16 | `WEAPONS` | 49 |
| 65 | `QS` | 8 |
| 73 | `VM_MAT_LEGACY` | 4 |
| 77 | `ROUND_TIME` | 8 |
| 85 | `ROUNDS_MAX` | 28 |
| 116 | `CTF_CLOCK_SHOW` | 4 |
| 120 | `KILLS_PER_PLAYER` | 7 |
| 127 | `PACE` | 33 |
| 160 | `PAUSE_ARM_MS` | 9 |
| 170 | `confirmGate` | 7 |
| 181 | `BOT_AIM_PITCH` | 4 |
| 185 | `BOT_DMG_PLAYER` | 21 |
| 206 | `BOT_FAIR` | 5 |
| 211 | `BOT_MOVE2` | 15 |
| 235 | `BOT_FOCUS_MIN` | 22 |
| 261 | `BOT_TOKEN_REST` | 7 |
| 269 | `MOVE_MUL` | 6 |
| 276 | `MOVE2` | 5 |
| 281 | `RACK_OLD` | 4 |
| 285 | `RACK_RETA` | 25 |
| 312 | `RADIO` | 5 |
| 318 | `MK_LABELS` | 5 |
| 324 | `D2R` | 7 |
| 331 | `buildRecoilPattern` | 12 |
| 343 | `RECOIL_PATTERN` | 7 |
| 350 | `RECOIL_CLASS` | 7 |
| 357 | `REC_DEG` | 10 |
| 367 | `REC_HOLD` | 3 |
| 370 | `DMG_FALLOFF` | 5 |
| 375 | `HS_MUL` | 3 |
| 378 | `BALL_CLASS` | 13 |
| 391 | `STATIC_CLASS` | 27 |
| 418 | `SNIPER_VM` | 15 |
| 433 | `RIFLE_VM` | 21 |
| 454 | `PISTOL_VM` | 9 |
| 463 | `SHOTGUN_VM` | 55 |
| 519 | `VM_KNOB` | 17 |
| 538 | `vmFovForAspect` | 24 |
| 562 | `VM_OFF` | 22 |
| 586 | `staticVmKey` | 10 |
| 596 | `DED_VM` | 13 |
| 609 | `MINT_VM` | 4 |
| 613 | `vmPreloadClasses` | 16 |
| 629 | `VM_SHRINK` | 20 |
| 649 | `VMP` | 6 |
| 655 | `BOT_SKILLS` | 11 |
| 667 | `diffKey` | 4 |
| 672 | `rollBotSkill` | 7 |
| 682 | `constructor()` | 524 |
| 1206 | `_dom()` | 35 |
| 1241 | `_buildEnv()` | 54 |
| 1295 | `_buildViewModels()` | 242 |
| 1537 | `_vmFrame` | 148 |
| 1685 | `_buildStaticVmClass` | 237 |
| 1922 | `_makePuffTexture()` | 11 |
| 1933 | `_makeFlashTex()` | 22 |
| 1955 | `_makeFlashCoreTex()` | 10 |
| 1965 | `_input()` | 2 |
| 1967 | `_kd` | 37 |
| 2004 | `_ku` | 4 |
| 2008 | `_md` | 34 |
| 2042 | `_mu` | 7 |
| 2049 | `_mm` | 14 |
| 2063 | `_cc` | 1 |
| 2064 | `_blur` | 1 |
| 2065 | `_plc` | 14 |
| 2079 | `_requestLock()` | 23 |
| 2102 | `_travaAtalhos()` | 4 |
| 2106 | `_soltaAtalhos()` | 3 |
| 2109 | `_acceptInput()` | 8 |
| 2117 | `_pauseBackdrop()` | 7 |
| 2124 | `_radioShow()` | 6 |
| 2130 | `_radioUi()` | 8 |
| 2138 | `_radioPick()` | 14 |
| 2152 | `start()` | 4 |
| 2156 | `_startRound()` | 35 |
| 2191 | `_resetPositions()` | 248 |
| 2439 | `_checkCtfAlvo()` | 13 |
| 2452 | `_checkPace()` | 13 |
| 2465 | `_endRound()` | 37 |
| 2502 | `_fimDaPartida()` | 14 |
| 2516 | `_endMatch()` | 36 |
| 2552 | `_ensureDolly()` | 41 |
| 2593 | `_tickDolly()` | 23 |
| 2616 | `setPaused()` | 19 |
| 2635 | `_now()` | 3 |
| 2638 | `pauseArmed()` | 1 |
| 2639 | `_syncPauseArm()` | 7 |
| 2646 | `resume()` | 4 |
| 2650 | `applySettings()` | 6 |
| 2656 | `_applyQuality()` | 13 |
| 2669 | `onResize()` | 7 |
| 2676 | `_switchTeam()` | 44 |
| 2720 | `_applyVmVisibility()` | 24 |
| 2744 | `_ensureStaticVm()` | 34 |
| 2778 | `_rebuildStaticVmClass()` | 14 |
| 2792 | `_switchWeapon()` | 30 |
| 2822 | `_deploySfx()` | 7 |
| 2829 | `_scope()` | 17 |
| 2846 | `_zoomFov()` | 8 |
| 2854 | `_reloading()` | 1 |
| 2855 | `_startReload()` | 19 |
| 2874 | `_reloadLayers()` | 18 |
| 2892 | `_installRecoil()` | 33 |
| 2925 | `_shotRecoil()` | 13 |
| 2938 | `_tryShoot()` | 83 |
| 3021 | `_meleeHit()` | 12 |
| 3033 | `_fireHitscan()` | 53 |
| 3086 | `_surfaceOf()` | 27 |
| 3113 | `_fleshImpact()` | 19 |
| 3132 | `_fxVoice()` | 9 |
| 3141 | `_impactSfx()` | 14 |
| 3155 | `_tintFx()` | 16 |
| 3171 | `_damage()` | 39 |
| 3210 | `_kill()` | 59 |
| 3269 | `_dmgArc()` | 77 |
| 3346 | `_mkBanner()` | 9 |
| 3355 | `_hitmarker()` | 15 |
| 3370 | `_dmgNumber()` | 20 |
| 3390 | `_feed()` | 19 |
| 3409 | `_skullIcon()` | 9 |
| 3418 | `_wpnIcon()` | 64 |
| 3482 | `_tracer()` | 24 |
| 3506 | `_puff()` | 39 |
| 3545 | `_holeDecalMat()` | 8 |
| 3553 | `_flash()` | 52 |
| 3605 | `_muzzleWorld()` | 9 |
| 3614 | `_updateDoors()` | 10 |
| 3624 | `_updateFx()` | 55 |
| 3679 | `_ejectCasing()` | 17 |
| 3696 | `_makeCtfFlagTex()` | 23 |
| 3719 | `_paintFlagSymbol()` | 9 |
| 3728 | `_flagTexFor()` | 26 |
| 3754 | `_legadoSimbolo()` | 8 |
| 3762 | `_loadCtfSymbols()` | 22 |
| 3784 | `_makeCtfZoneTex()` | 31 |
| 3815 | `_makeSmokeTex()` | 8 |
| 3823 | `_updateSmokeHud()` | 6 |
| 3829 | `_spawnGrenade()` | 11 |
| 3840 | `_throwSmoke()` | 8 |
| 3848 | `_throwFrag()` | 10 |
| 3858 | `_explodeFrag()` | 38 |
| 3896 | `_corDaFumaca()` | 15 |
| 3911 | `_popSmoke()` | 19 |
| 3930 | `_updateGrenades()` | 27 |
| 3957 | `_teamColor()` | 18 |
| 3975 | `_teamInk()` | 8 |
| 3983 | `_factionOf()` | 1 |
| 3984 | `_voiceKey()` | 1 |
| 3985 | `_teamName()` | 1 |
| 3986 | `_teamTag()` | 1 |
| 3987 | `_mirror()` | 3 |
| 3990 | `_botSeparation()` | 56 |
| 4046 | `_initCTF()` | 84 |
| 4130 | `_updateCTF()` | 56 |
| 4186 | `_ctfWin()` | 22 |
| 4208 | `_freeYaw()` | 25 |
| 4233 | `_pullString()` | 23 |
| 4256 | `_walkReach()` | 18 |
| 4274 | `_wpComp()` | 16 |
| 4290 | `_findPathLocal()` | 22 |
| 4312 | `_botCtf()` | 133 |
| 4445 | `_hideCtfHud()` | 6 |
| 4451 | `_updateCtfHud()` | 76 |
| 4527 | `_collide()` | 23 |
| 4550 | `_collideRot()` | 26 |
| 4576 | `_freeSpot()` | 30 |
| 4606 | `_retaAndavel()` | 20 |
| 4626 | `_walkDepth()` | 16 |
| 4642 | `_noteHit()` | 15 |
| 4657 | `_deathFeedback()` | 43 |
| 4700 | `_updatePlayer()` | 327 |
| 5027 | `_updatePickups()` | 146 |
| 5173 | `_wpnMode()` | 3 |
| 5176 | `_botWeapon()` | 10 |
| 5186 | `_pickupAllowed()` | 7 |
| 5193 | `_grabPickup()` | 34 |
| 5227 | `_assentarNoChao()` | 11 |
| 5238 | `_dropWeapon()` | 38 |
| 5276 | `_spawnY()` | 3 |
| 5279 | `_pickSpawn()` | 23 |
| 5302 | `_respawnPlayer()` | 18 |
| 5320 | `_losClear()` | 18 |
| 5338 | `_botCall()` | 37 |
| 5375 | `_teamMarkTex()` | 23 |
| 5398 | `_makeTeamMark()` | 14 |
| 5412 | `_updateTeamMark()` | 7 |
| 5419 | `_botEye()` | 1 |
| 5420 | `_enemyOf()` | 8 |
| 5428 | `_duelToken()` | 20 |
| 5448 | `_updateBot()` | 800 |
| 6248 | `_radarFoot()` | 38 |
| 6286 | `_updateRadar()` | 66 |
| 6352 | `_banner()` | 26 |
| 6378 | `_resultadoDaRodada()` | 4 |
| 6382 | `_showScoreboard()` | 44 |
| 6426 | `_updateHud()` | 58 |
| 6484 | `update()` | 61 |
| 6545 | `dispose()` | 36 |

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
