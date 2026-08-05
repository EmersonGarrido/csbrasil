# ARCH.md — mapa de arquitetura e de CONFLITO (CS BRASIL / CORO SOLTO)

<!-- BEGIN:GERADO — não edite à mão, rode `npm run arch` -->

> Gerado por `node tools/gen-arch.mjs`. **Não edite este bloco à mão.**
> Versão do jogo: 2.0.0-alpha.16 · `npm run arch` para regenerar · `npm run arch:check` no CI.

## Tamanho dos arquivos indexados

| Arquivo | Linhas | Símbolos |
|---|---:|---:|
| `public/js/game.js` | 6520 | 230 |
| `public/js/main.js` | 1550 | 147 |
| `public/js/glbchars.js` | 812 | 60 |
| `public/js/characters.js` | 1061 | 41 |
| `public/js/vmattach.js` | 628 | 4 |
| `public/js/springs.js` | 261 | 28 |
| `public/js/weapons.js` | 345 | 20 |

## Maiores métodos de `game.js` — onde o conflito mora

Os 15 maiores somam **2979 linhas (46% do arquivo)**. Método grande = PR irrevisável e merge conflitante.

| Linhas | Início | Método | |
|---:|---:|---|---|
| 800 | 5400 | `_updateBot()` | ⚠️ candidato a extração |
| 524 | 681 | `constructor()` | 🔴 append-only |
| 327 | 4652 | `_updatePlayer()` | ⚠️ candidato a extração |
| 248 | 2157 | `_resetPositions()` |  |
| 242 | 1294 | `_buildViewModels()` |  |
| 146 | 4979 | `_updatePickups()` |  |
| 133 | 4271 | `_botCtf()` |  |
| 83 | 2901 | `_tryShoot()` |  |
| 80 | 4009 | `_initCTF()` |  |
| 77 | 3232 | `_dmgArc()` |  |
| 69 | 4410 | `_updateCtfHud()` |  |
| 66 | 6238 | `_updateRadar()` |  |
| 64 | 3381 | `_wpnIcon()` |  |
| 61 | 6424 | `update()` | 🔴 append-only |
| 59 | 3173 | `_kill()` |  |

## Tabela de CONFLITO — resolvida para as linhas de hoje

Declare sua frente antes de editar. Em `game.js` use **só a ferramenta Edit, nunca Write**.
Duas frentes com faixas disjuntas podem rodar em paralelo — foi medido: 3 agentes editaram
faixas disjuntas simultaneamente com zero conflito de conteúdo.

| Frente | Faixas em `game.js` | Arquivos exclusivos |
|---|---|---|
| **ARMAS / VIEWMODEL** | `15–63` `322–322` `356–365` `390–416` `517–534` `561–582` `608–611` `628–647` `1294–1920` `2683–2740` `2755–2836` `2855–3048` `3445–3468` `3516–3576` `3642–3658` | `public/js/vmattach.js` `public/js/springs.js` `public/js/weapons.js` `public/js/fparms.js` `public/js/handik.js` |
| **BOTS / JOGABILIDADE** | `176–179` `230–230` `256–267` `654–665` `3134–3231` `3953–4008` `4167–4403` `4479–4501` `4652–4978` `5272–5289` `5371–6199` | — |
| **MAPAS / MUNDO** | `1240–1293` `2157–2404` `4009–4144` `4979–5124` | `public/js/maps.js` `public/js/mapprops.js` `public/js/map_brasilia.js` `public/js/map_havan.js` `public/js/map_pool_day.js` `public/js/map_pool_ramos.js` `public/js/map_ferrovelho.js` |
| **GRÁFICOS / FX** | `1921–1963` `2619–2631` `3469–3507` `3587–3641` | `public/js/bloom.js` `public/js/textures.js` `public/js/vao.js` `public/js/stylize.js` `public/js/gpuparticles.js` |
| **UI / HUD / MENU** | `1205–1239` `2584–2597` `2613–2618` `2632–2638` `3232–3444` `6238–6303` `6334–6423` | `public/js/main.js` `public/style.css` `src/pages/index.astro` |
| **ÁUDIO** | — | `public/js/audio.js` |
| **PERSONAGENS** | — | `public/js/characters.js` `public/js/glbchars.js` |
| **SITE / BACKEND** | — | `src/` `supabase/` |

**🔴 Zonas vermelhas (append-only, qualquer frente pode precisar):** `update()` 6424–6484 · `_dom()` 1205–1239 · `constructor()` 681–1204

Nenhuma sobreposição entre frentes — todas as faixas são disjuntas. ✓

Cobertura: **3961 de 6520 linhas (61%)** do `game.js` têm dono declarado. O resto é território neutro — declare a frente mesmo assim.

<details><summary><strong>Índice completo de <code>game.js</code> (todos os símbolos)</strong></summary>

| Linha | Símbolo | Linhas |
|---:|---|---:|
| 15 | `WEAPONS` | 49 |
| 64 | `QS` | 8 |
| 72 | `VM_MAT_LEGACY` | 4 |
| 76 | `ROUND_TIME` | 8 |
| 84 | `ROUNDS_MAX` | 28 |
| 115 | `CTF_CLOCK_SHOW` | 4 |
| 119 | `KILLS_PER_PLAYER` | 7 |
| 126 | `PACE` | 33 |
| 159 | `PAUSE_ARM_MS` | 9 |
| 169 | `confirmGate` | 7 |
| 180 | `BOT_AIM_PITCH` | 4 |
| 184 | `BOT_DMG_PLAYER` | 21 |
| 205 | `BOT_FAIR` | 5 |
| 210 | `BOT_MOVE2` | 15 |
| 234 | `BOT_FOCUS_MIN` | 22 |
| 260 | `BOT_TOKEN_REST` | 7 |
| 268 | `MOVE_MUL` | 6 |
| 275 | `MOVE2` | 5 |
| 280 | `RACK_OLD` | 4 |
| 284 | `RACK_RETA` | 25 |
| 311 | `RADIO` | 5 |
| 317 | `MK_LABELS` | 5 |
| 323 | `D2R` | 7 |
| 330 | `buildRecoilPattern` | 12 |
| 342 | `RECOIL_PATTERN` | 7 |
| 349 | `RECOIL_CLASS` | 7 |
| 356 | `REC_DEG` | 10 |
| 366 | `REC_HOLD` | 3 |
| 369 | `DMG_FALLOFF` | 5 |
| 374 | `HS_MUL` | 3 |
| 377 | `BALL_CLASS` | 13 |
| 390 | `STATIC_CLASS` | 27 |
| 417 | `SNIPER_VM` | 15 |
| 432 | `RIFLE_VM` | 21 |
| 453 | `PISTOL_VM` | 9 |
| 462 | `SHOTGUN_VM` | 55 |
| 518 | `VM_KNOB` | 17 |
| 537 | `vmFovForAspect` | 24 |
| 561 | `VM_OFF` | 22 |
| 585 | `staticVmKey` | 10 |
| 595 | `DED_VM` | 13 |
| 608 | `MINT_VM` | 4 |
| 612 | `vmPreloadClasses` | 16 |
| 628 | `VM_SHRINK` | 20 |
| 648 | `VMP` | 6 |
| 654 | `BOT_SKILLS` | 11 |
| 666 | `diffKey` | 4 |
| 671 | `rollBotSkill` | 7 |
| 681 | `constructor()` | 524 |
| 1205 | `_dom()` | 35 |
| 1240 | `_buildEnv()` | 54 |
| 1294 | `_buildViewModels()` | 242 |
| 1536 | `_vmFrame` | 148 |
| 1684 | `_buildStaticVmClass` | 237 |
| 1921 | `_makePuffTexture()` | 11 |
| 1932 | `_makeFlashTex()` | 22 |
| 1954 | `_makeFlashCoreTex()` | 10 |
| 1964 | `_input()` | 2 |
| 1966 | `_kd` | 33 |
| 1999 | `_ku` | 4 |
| 2003 | `_md` | 34 |
| 2037 | `_mu` | 7 |
| 2044 | `_mm` | 14 |
| 2058 | `_cc` | 1 |
| 2059 | `_blur` | 1 |
| 2060 | `_plc` | 14 |
| 2074 | `_requestLock()` | 3 |
| 2077 | `_acceptInput()` | 8 |
| 2085 | `_pauseBackdrop()` | 7 |
| 2092 | `_radioShow()` | 6 |
| 2098 | `_radioUi()` | 8 |
| 2106 | `_radioPick()` | 14 |
| 2120 | `start()` | 4 |
| 2124 | `_startRound()` | 33 |
| 2157 | `_resetPositions()` | 248 |
| 2405 | `_checkCtfAlvo()` | 13 |
| 2418 | `_checkPace()` | 13 |
| 2431 | `_endRound()` | 37 |
| 2468 | `_fimDaPartida()` | 14 |
| 2482 | `_endMatch()` | 38 |
| 2520 | `_ensureDolly()` | 41 |
| 2561 | `_tickDolly()` | 23 |
| 2584 | `setPaused()` | 14 |
| 2598 | `_now()` | 3 |
| 2601 | `pauseArmed()` | 1 |
| 2602 | `_syncPauseArm()` | 7 |
| 2609 | `resume()` | 4 |
| 2613 | `applySettings()` | 6 |
| 2619 | `_applyQuality()` | 13 |
| 2632 | `onResize()` | 7 |
| 2639 | `_switchTeam()` | 44 |
| 2683 | `_applyVmVisibility()` | 24 |
| 2707 | `_ensureStaticVm()` | 34 |
| 2741 | `_rebuildStaticVmClass()` | 14 |
| 2755 | `_switchWeapon()` | 30 |
| 2785 | `_deploySfx()` | 7 |
| 2792 | `_scope()` | 17 |
| 2809 | `_zoomFov()` | 8 |
| 2817 | `_reloading()` | 1 |
| 2818 | `_startReload()` | 19 |
| 2837 | `_reloadLayers()` | 18 |
| 2855 | `_installRecoil()` | 33 |
| 2888 | `_shotRecoil()` | 13 |
| 2901 | `_tryShoot()` | 83 |
| 2984 | `_meleeHit()` | 12 |
| 2996 | `_fireHitscan()` | 53 |
| 3049 | `_surfaceOf()` | 27 |
| 3076 | `_fleshImpact()` | 19 |
| 3095 | `_fxVoice()` | 9 |
| 3104 | `_impactSfx()` | 14 |
| 3118 | `_tintFx()` | 16 |
| 3134 | `_damage()` | 39 |
| 3173 | `_kill()` | 59 |
| 3232 | `_dmgArc()` | 77 |
| 3309 | `_mkBanner()` | 9 |
| 3318 | `_hitmarker()` | 15 |
| 3333 | `_dmgNumber()` | 20 |
| 3353 | `_feed()` | 19 |
| 3372 | `_skullIcon()` | 9 |
| 3381 | `_wpnIcon()` | 64 |
| 3445 | `_tracer()` | 24 |
| 3469 | `_puff()` | 39 |
| 3508 | `_holeDecalMat()` | 8 |
| 3516 | `_flash()` | 52 |
| 3568 | `_muzzleWorld()` | 9 |
| 3577 | `_updateDoors()` | 10 |
| 3587 | `_updateFx()` | 55 |
| 3642 | `_ejectCasing()` | 17 |
| 3659 | `_makeCtfFlagTex()` | 23 |
| 3682 | `_paintFlagSymbol()` | 9 |
| 3691 | `_flagTexFor()` | 26 |
| 3717 | `_legadoSimbolo()` | 8 |
| 3725 | `_loadCtfSymbols()` | 22 |
| 3747 | `_makeCtfZoneTex()` | 31 |
| 3778 | `_makeSmokeTex()` | 8 |
| 3786 | `_updateSmokeHud()` | 6 |
| 3792 | `_spawnGrenade()` | 11 |
| 3803 | `_throwSmoke()` | 8 |
| 3811 | `_throwFrag()` | 10 |
| 3821 | `_explodeFrag()` | 38 |
| 3859 | `_corDaFumaca()` | 15 |
| 3874 | `_popSmoke()` | 19 |
| 3893 | `_updateGrenades()` | 27 |
| 3920 | `_teamColor()` | 18 |
| 3938 | `_teamInk()` | 8 |
| 3946 | `_factionOf()` | 1 |
| 3947 | `_voiceKey()` | 1 |
| 3948 | `_teamName()` | 1 |
| 3949 | `_teamTag()` | 1 |
| 3950 | `_mirror()` | 3 |
| 3953 | `_botSeparation()` | 56 |
| 4009 | `_initCTF()` | 80 |
| 4089 | `_updateCTF()` | 56 |
| 4145 | `_ctfWin()` | 22 |
| 4167 | `_freeYaw()` | 25 |
| 4192 | `_pullString()` | 23 |
| 4215 | `_walkReach()` | 18 |
| 4233 | `_wpComp()` | 16 |
| 4249 | `_findPathLocal()` | 22 |
| 4271 | `_botCtf()` | 133 |
| 4404 | `_hideCtfHud()` | 6 |
| 4410 | `_updateCtfHud()` | 69 |
| 4479 | `_collide()` | 23 |
| 4502 | `_collideRot()` | 26 |
| 4528 | `_freeSpot()` | 30 |
| 4558 | `_retaAndavel()` | 20 |
| 4578 | `_walkDepth()` | 16 |
| 4594 | `_noteHit()` | 15 |
| 4609 | `_deathFeedback()` | 43 |
| 4652 | `_updatePlayer()` | 327 |
| 4979 | `_updatePickups()` | 146 |
| 5125 | `_wpnMode()` | 3 |
| 5128 | `_botWeapon()` | 10 |
| 5138 | `_pickupAllowed()` | 7 |
| 5145 | `_grabPickup()` | 34 |
| 5179 | `_assentarNoChao()` | 11 |
| 5190 | `_dropWeapon()` | 38 |
| 5228 | `_spawnY()` | 3 |
| 5231 | `_pickSpawn()` | 23 |
| 5254 | `_respawnPlayer()` | 18 |
| 5272 | `_losClear()` | 18 |
| 5290 | `_botCall()` | 37 |
| 5327 | `_teamMarkTex()` | 23 |
| 5350 | `_makeTeamMark()` | 14 |
| 5364 | `_updateTeamMark()` | 7 |
| 5371 | `_botEye()` | 1 |
| 5372 | `_enemyOf()` | 8 |
| 5380 | `_duelToken()` | 20 |
| 5400 | `_updateBot()` | 800 |
| 6200 | `_radarFoot()` | 38 |
| 6238 | `_updateRadar()` | 66 |
| 6304 | `_banner()` | 26 |
| 6330 | `_resultadoDaRodada()` | 4 |
| 6334 | `_showScoreboard()` | 32 |
| 6366 | `_updateHud()` | 58 |
| 6424 | `update()` | 61 |
| 6485 | `dispose()` | 35 |

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
