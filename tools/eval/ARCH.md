# ARCH.md — mapa de arquitetura e de CONFLITO (CS BRASIL / CORO SOLTO)

<!-- BEGIN:GERADO — não edite à mão, rode `npm run arch` -->

> Gerado por `node tools/gen-arch.mjs`. **Não edite este bloco à mão.**
> Versão do jogo: 2.0.0-alpha.28 · `npm run arch` para regenerar · `npm run arch:check` no CI.

## Tamanho dos arquivos indexados

| Arquivo | Linhas | Símbolos |
|---|---:|---:|
| `public/js/game.js` | 6526 | 230 |
| `public/js/main.js` | 1605 | 150 |
| `public/js/glbchars.js` | 812 | 60 |
| `public/js/characters.js` | 1061 | 41 |
| `public/js/vmattach.js` | 628 | 4 |
| `public/js/springs.js` | 261 | 28 |
| `public/js/weapons.js` | 345 | 20 |

## Maiores métodos de `game.js` — onde o conflito mora

Os 15 maiores somam **2986 linhas (46% do arquivo)**. Método grande = PR irrevisável e merge conflitante.

| Linhas | Início | Método | |
|---:|---:|---|---|
| 800 | 5406 | `_updateBot()` | ⚠️ candidato a extração |
| 524 | 682 | `constructor()` | 🔴 append-only |
| 327 | 4658 | `_updatePlayer()` | ⚠️ candidato a extração |
| 248 | 2158 | `_resetPositions()` |  |
| 242 | 1295 | `_buildViewModels()` |  |
| 146 | 4985 | `_updatePickups()` |  |
| 133 | 4274 | `_botCtf()` |  |
| 84 | 4008 | `_initCTF()` |  |
| 83 | 2900 | `_tryShoot()` |  |
| 77 | 3231 | `_dmgArc()` |  |
| 72 | 4413 | `_updateCtfHud()` |  |
| 66 | 6244 | `_updateRadar()` |  |
| 64 | 3380 | `_wpnIcon()` |  |
| 61 | 6430 | `update()` | 🔴 append-only |
| 59 | 3172 | `_kill()` |  |

## Tabela de CONFLITO — resolvida para as linhas de hoje

Declare sua frente antes de editar. Em `game.js` use **só a ferramenta Edit, nunca Write**.
Duas frentes com faixas disjuntas podem rodar em paralelo — foi medido: 3 agentes editaram
faixas disjuntas simultaneamente com zero conflito de conteúdo.

| Frente | Faixas em `game.js` | Arquivos exclusivos |
|---|---|---|
| **ARMAS / VIEWMODEL** | `16–64` `323–323` `357–366` `391–417` `518–535` `562–583` `609–612` `629–648` `1295–1921` `2682–2739` `2754–2835` `2854–3047` `3444–3467` `3515–3575` `3641–3657` | `public/js/vmattach.js` `public/js/springs.js` `public/js/weapons.js` `public/js/fparms.js` `public/js/handik.js` |
| **BOTS / JOGABILIDADE** | `177–180` `231–231` `257–268` `655–666` `3133–3230` `3952–4007` `4170–4406` `4485–4507` `4658–4984` `5278–5295` `5377–6205` | — |
| **MAPAS / MUNDO** | `1241–1294` `2158–2405` `4008–4147` `4985–5130` | `public/js/maps.js` `public/js/mapprops.js` `public/js/map_brasilia.js` `public/js/map_havan.js` `public/js/map_piscina.js` `public/js/map_piscinao_ramos.js` `public/js/map_ferrovelho.js` |
| **GRÁFICOS / FX** | `1922–1964` `2618–2630` `3468–3506` `3586–3640` | `public/js/bloom.js` `public/js/textures.js` `public/js/vao.js` `public/js/stylize.js` `public/js/gpuparticles.js` |
| **UI / HUD / MENU** | `1206–1240` `2583–2596` `2612–2617` `2631–2637` `3231–3443` `6244–6309` `6340–6429` | `public/js/main.js` `public/style.css` `src/pages/index.astro` |
| **ÁUDIO** | — | `public/js/audio.js` |
| **PERSONAGENS** | — | `public/js/characters.js` `public/js/glbchars.js` |
| **SITE / BACKEND** | — | `src/` `supabase/` |

**🔴 Zonas vermelhas (append-only, qualquer frente pode precisar):** `update()` 6430–6490 · `_dom()` 1206–1240 · `constructor()` 682–1205

Nenhuma sobreposição entre frentes — todas as faixas são disjuntas. ✓

Cobertura: **3965 de 6526 linhas (61%)** do `game.js` têm dono declarado. O resto é território neutro — declare a frente mesmo assim.

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
| 1967 | `_kd` | 33 |
| 2000 | `_ku` | 4 |
| 2004 | `_md` | 34 |
| 2038 | `_mu` | 7 |
| 2045 | `_mm` | 14 |
| 2059 | `_cc` | 1 |
| 2060 | `_blur` | 1 |
| 2061 | `_plc` | 14 |
| 2075 | `_requestLock()` | 3 |
| 2078 | `_acceptInput()` | 8 |
| 2086 | `_pauseBackdrop()` | 7 |
| 2093 | `_radioShow()` | 6 |
| 2099 | `_radioUi()` | 8 |
| 2107 | `_radioPick()` | 14 |
| 2121 | `start()` | 4 |
| 2125 | `_startRound()` | 33 |
| 2158 | `_resetPositions()` | 248 |
| 2406 | `_checkCtfAlvo()` | 13 |
| 2419 | `_checkPace()` | 13 |
| 2432 | `_endRound()` | 37 |
| 2469 | `_fimDaPartida()` | 14 |
| 2483 | `_endMatch()` | 36 |
| 2519 | `_ensureDolly()` | 41 |
| 2560 | `_tickDolly()` | 23 |
| 2583 | `setPaused()` | 14 |
| 2597 | `_now()` | 3 |
| 2600 | `pauseArmed()` | 1 |
| 2601 | `_syncPauseArm()` | 7 |
| 2608 | `resume()` | 4 |
| 2612 | `applySettings()` | 6 |
| 2618 | `_applyQuality()` | 13 |
| 2631 | `onResize()` | 7 |
| 2638 | `_switchTeam()` | 44 |
| 2682 | `_applyVmVisibility()` | 24 |
| 2706 | `_ensureStaticVm()` | 34 |
| 2740 | `_rebuildStaticVmClass()` | 14 |
| 2754 | `_switchWeapon()` | 30 |
| 2784 | `_deploySfx()` | 7 |
| 2791 | `_scope()` | 17 |
| 2808 | `_zoomFov()` | 8 |
| 2816 | `_reloading()` | 1 |
| 2817 | `_startReload()` | 19 |
| 2836 | `_reloadLayers()` | 18 |
| 2854 | `_installRecoil()` | 33 |
| 2887 | `_shotRecoil()` | 13 |
| 2900 | `_tryShoot()` | 83 |
| 2983 | `_meleeHit()` | 12 |
| 2995 | `_fireHitscan()` | 53 |
| 3048 | `_surfaceOf()` | 27 |
| 3075 | `_fleshImpact()` | 19 |
| 3094 | `_fxVoice()` | 9 |
| 3103 | `_impactSfx()` | 14 |
| 3117 | `_tintFx()` | 16 |
| 3133 | `_damage()` | 39 |
| 3172 | `_kill()` | 59 |
| 3231 | `_dmgArc()` | 77 |
| 3308 | `_mkBanner()` | 9 |
| 3317 | `_hitmarker()` | 15 |
| 3332 | `_dmgNumber()` | 20 |
| 3352 | `_feed()` | 19 |
| 3371 | `_skullIcon()` | 9 |
| 3380 | `_wpnIcon()` | 64 |
| 3444 | `_tracer()` | 24 |
| 3468 | `_puff()` | 39 |
| 3507 | `_holeDecalMat()` | 8 |
| 3515 | `_flash()` | 52 |
| 3567 | `_muzzleWorld()` | 9 |
| 3576 | `_updateDoors()` | 10 |
| 3586 | `_updateFx()` | 55 |
| 3641 | `_ejectCasing()` | 17 |
| 3658 | `_makeCtfFlagTex()` | 23 |
| 3681 | `_paintFlagSymbol()` | 9 |
| 3690 | `_flagTexFor()` | 26 |
| 3716 | `_legadoSimbolo()` | 8 |
| 3724 | `_loadCtfSymbols()` | 22 |
| 3746 | `_makeCtfZoneTex()` | 31 |
| 3777 | `_makeSmokeTex()` | 8 |
| 3785 | `_updateSmokeHud()` | 6 |
| 3791 | `_spawnGrenade()` | 11 |
| 3802 | `_throwSmoke()` | 8 |
| 3810 | `_throwFrag()` | 10 |
| 3820 | `_explodeFrag()` | 38 |
| 3858 | `_corDaFumaca()` | 15 |
| 3873 | `_popSmoke()` | 19 |
| 3892 | `_updateGrenades()` | 27 |
| 3919 | `_teamColor()` | 18 |
| 3937 | `_teamInk()` | 8 |
| 3945 | `_factionOf()` | 1 |
| 3946 | `_voiceKey()` | 1 |
| 3947 | `_teamName()` | 1 |
| 3948 | `_teamTag()` | 1 |
| 3949 | `_mirror()` | 3 |
| 3952 | `_botSeparation()` | 56 |
| 4008 | `_initCTF()` | 84 |
| 4092 | `_updateCTF()` | 56 |
| 4148 | `_ctfWin()` | 22 |
| 4170 | `_freeYaw()` | 25 |
| 4195 | `_pullString()` | 23 |
| 4218 | `_walkReach()` | 18 |
| 4236 | `_wpComp()` | 16 |
| 4252 | `_findPathLocal()` | 22 |
| 4274 | `_botCtf()` | 133 |
| 4407 | `_hideCtfHud()` | 6 |
| 4413 | `_updateCtfHud()` | 72 |
| 4485 | `_collide()` | 23 |
| 4508 | `_collideRot()` | 26 |
| 4534 | `_freeSpot()` | 30 |
| 4564 | `_retaAndavel()` | 20 |
| 4584 | `_walkDepth()` | 16 |
| 4600 | `_noteHit()` | 15 |
| 4615 | `_deathFeedback()` | 43 |
| 4658 | `_updatePlayer()` | 327 |
| 4985 | `_updatePickups()` | 146 |
| 5131 | `_wpnMode()` | 3 |
| 5134 | `_botWeapon()` | 10 |
| 5144 | `_pickupAllowed()` | 7 |
| 5151 | `_grabPickup()` | 34 |
| 5185 | `_assentarNoChao()` | 11 |
| 5196 | `_dropWeapon()` | 38 |
| 5234 | `_spawnY()` | 3 |
| 5237 | `_pickSpawn()` | 23 |
| 5260 | `_respawnPlayer()` | 18 |
| 5278 | `_losClear()` | 18 |
| 5296 | `_botCall()` | 37 |
| 5333 | `_teamMarkTex()` | 23 |
| 5356 | `_makeTeamMark()` | 14 |
| 5370 | `_updateTeamMark()` | 7 |
| 5377 | `_botEye()` | 1 |
| 5378 | `_enemyOf()` | 8 |
| 5386 | `_duelToken()` | 20 |
| 5406 | `_updateBot()` | 800 |
| 6206 | `_radarFoot()` | 38 |
| 6244 | `_updateRadar()` | 66 |
| 6310 | `_banner()` | 26 |
| 6336 | `_resultadoDaRodada()` | 4 |
| 6340 | `_showScoreboard()` | 32 |
| 6372 | `_updateHud()` | 58 |
| 6430 | `update()` | 61 |
| 6491 | `dispose()` | 35 |

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
