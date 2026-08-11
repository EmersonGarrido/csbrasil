# ARCH.md — mapa de arquitetura e de CONFLITO (CS BRASIL / CORO SOLTO)

<!-- BEGIN:GERADO — não edite à mão, rode `npm run arch` -->

> Gerado por `node tools/gen-arch.mjs`. **Não edite este bloco à mão.**
> Versão do jogo: 2.0.0-alpha.70 · `npm run arch` para regenerar · `npm run arch:check` no CI.

## Tamanho dos arquivos indexados

| Arquivo | Linhas | Símbolos |
|---|---:|---:|
| `public/js/game.js` | 6289 | 222 |
| `public/js/main.js` | 1952 | 170 |
| `public/js/glbchars.js` | 838 | 60 |
| `public/js/characters.js` | 1067 | 41 |
| `public/js/vmattach.js` | 629 | 4 |
| `public/js/springs.js` | 261 | 28 |
| `public/js/weapons.js` | 345 | 20 |

## Maiores métodos de `game.js` — onde o conflito mora

Os 15 maiores somam **2977 linhas (47% do arquivo)**. Método grande = PR irrevisável e merge conflitante.

| Linhas | Início | Método | |
|---:|---:|---|---|
| 800 | 5122 | `_updateBot()` | ⚠️ candidato a extração |
| 530 | 566 | `constructor()` | 🔴 append-only |
| 306 | 4395 | `_updatePlayer()` | ⚠️ candidato a extração |
| 248 | 1853 | `_resetPositions()` |  |
| 241 | 1185 | `_buildViewModels()` |  |
| 146 | 4701 | `_updatePickups()` |  |
| 133 | 4007 | `_botCtf()` |  |
| 84 | 3741 | `_initCTF()` |  |
| 83 | 2628 | `_tryShoot()` |  |
| 77 | 2962 | `_dmgArc()` |  |
| 76 | 4146 | `_updateCtfHud()` |  |
| 66 | 5960 | `_updateRadar()` |  |
| 64 | 3111 | `_wpnIcon()` |  |
| 62 | 2900 | `_kill()` |  |
| 61 | 6192 | `update()` | 🔴 append-only |

## Tabela de CONFLITO — resolvida para as linhas de hoje

Declare sua frente antes de editar. Em `game.js` use **só a ferramenta Edit, nunca Write**.
Duas frentes com faixas disjuntas podem rodar em paralelo — foi medido: 3 agentes editaram
faixas disjuntas simultaneamente com zero conflito de conteúdo.

| Frente | Faixas em `game.js` | Arquivos exclusivos |
|---|---|---|
| **ARMAS / VIEWMODEL** | `18–66` `327–327` `355–449` `476–497` `1185–1583` `2395–2400` `2482–2563` `2582–2775` `3175–3198` `3246–3308` `3374–3390` | `public/js/vmattach.js` `public/js/springs.js` `public/js/weapons.js` `public/js/fparms.js` `public/js/handik.js` `public/js/recoil.js` `public/js/vmlab.js` |
| **BOTS / JOGABILIDADE** | `181–184` `235–235` `261–272` `539–550` `2861–2961` `3685–3740` `3903–4139` `4222–4244` `4395–4700` `4994–5011` `5093–5921` | — |
| **MAPAS / MUNDO** | `1131–1184` `1853–2100` `3741–3880` `4701–4846` | `public/js/maps.js` `public/js/mapprops.js` `public/js/map_brasilia.js` `public/js/map_havan.js` `public/js/map_piscina.js` `public/js/map_piscinao_ramos.js` `public/js/map_ferrovelho.js` |
| **GRÁFICOS / FX** | `1584–1626` `2331–2343` `3199–3237` `3319–3373` | `public/js/bloom.js` `public/js/textures.js` `public/js/vao.js` `public/js/stylize.js` `public/js/gpuparticles.js` |
| **UI / HUD / MENU** | `1096–1130` `2291–2309` `2325–2330` `2344–2350` `2962–3174` `5960–6025` `6056–6099` `6133–6191` | `public/js/main.js` `public/style.css` `src/pages/index.astro` |
| **ÁUDIO** | — | `public/js/audio.js` |
| **PERSONAGENS** | — | `public/js/characters.js` `public/js/glbchars.js` |
| **SITE / BACKEND** | — | `src/` `supabase/` |

**🔴 Zonas vermelhas (append-only, qualquer frente pode precisar):** `update()` 6192–6252 · `_dom()` 1096–1130 · `constructor()` 566–1095

Nenhuma sobreposição entre frentes — todas as faixas são disjuntas. ✓

Cobertura: **3703 de 6289 linhas (59%)** do `game.js` têm dono declarado. O resto é território neutro — declare a frente mesmo assim.

<details><summary><strong>Índice completo de <code>game.js</code> (todos os símbolos)</strong></summary>

| Linha | Símbolo | Linhas |
|---:|---|---:|
| 18 | `WEAPONS` | 49 |
| 69 | `VMLAB` | 8 |
| 77 | `VM_MAT_LEGACY` | 4 |
| 81 | `ROUND_TIME` | 8 |
| 89 | `ROUNDS_MAX` | 28 |
| 120 | `CTF_CLOCK_SHOW` | 4 |
| 124 | `KILLS_PER_PLAYER` | 7 |
| 131 | `PACE` | 33 |
| 164 | `PAUSE_ARM_MS` | 9 |
| 174 | `confirmGate` | 7 |
| 185 | `BOT_AIM_PITCH` | 4 |
| 189 | `BOT_DMG_PLAYER` | 21 |
| 210 | `BOT_FAIR` | 5 |
| 215 | `BOT_MOVE2` | 15 |
| 239 | `BOT_FOCUS_MIN` | 22 |
| 265 | `BOT_TOKEN_REST` | 7 |
| 273 | `MOVE_MUL` | 6 |
| 280 | `MOVE2` | 5 |
| 285 | `RACK_OLD` | 4 |
| 289 | `RACK_RETA` | 25 |
| 316 | `RADIO` | 5 |
| 322 | `MK_LABELS` | 5 |
| 328 | `D2R` | 4 |
| 332 | `DMG_FALLOFF` | 5 |
| 337 | `HS_MUL` | 3 |
| 340 | `BALL_CLASS` | 15 |
| 355 | `STATIC_CLASS` | 75 |
| 431 | `VM_KNOB` | 19 |
| 452 | `vmFovForAspect` | 24 |
| 476 | `VM_OFF` | 22 |
| 498 | `vmOffY` | 35 |
| 533 | `VMP` | 6 |
| 539 | `BOT_SKILLS` | 11 |
| 551 | `diffKey` | 4 |
| 556 | `rollBotSkill` | 7 |
| 566 | `constructor()` | 530 |
| 1096 | `_dom()` | 35 |
| 1131 | `_buildEnv()` | 54 |
| 1185 | `_buildViewModels()` | 241 |
| 1426 | `_vmFrame` | 158 |
| 1584 | `_makePuffTexture()` | 11 |
| 1595 | `_makeFlashTex()` | 22 |
| 1617 | `_makeFlashCoreTex()` | 10 |
| 1627 | `_input()` | 2 |
| 1629 | `_kd` | 37 |
| 1666 | `_ku` | 4 |
| 1670 | `_md` | 34 |
| 1704 | `_mu` | 7 |
| 1711 | `_mm` | 14 |
| 1725 | `_cc` | 1 |
| 1726 | `_blur` | 1 |
| 1727 | `_plc` | 14 |
| 1741 | `_requestLock()` | 23 |
| 1764 | `_travaAtalhos()` | 4 |
| 1768 | `_soltaAtalhos()` | 3 |
| 1771 | `_acceptInput()` | 8 |
| 1779 | `_pauseBackdrop()` | 7 |
| 1786 | `_radioShow()` | 6 |
| 1792 | `_radioUi()` | 8 |
| 1800 | `_radioPick()` | 14 |
| 1814 | `start()` | 4 |
| 1818 | `_startRound()` | 35 |
| 1853 | `_resetPositions()` | 248 |
| 2101 | `_checkCtfAlvo()` | 13 |
| 2114 | `_checkPace()` | 13 |
| 2127 | `_endRound()` | 37 |
| 2164 | `_fimDaPartida()` | 14 |
| 2178 | `_endMatch()` | 49 |
| 2227 | `_ensureDolly()` | 41 |
| 2268 | `_tickDolly()` | 23 |
| 2291 | `setPaused()` | 19 |
| 2310 | `_now()` | 3 |
| 2313 | `pauseArmed()` | 1 |
| 2314 | `_syncPauseArm()` | 7 |
| 2321 | `resume()` | 4 |
| 2325 | `applySettings()` | 6 |
| 2331 | `_applyQuality()` | 13 |
| 2344 | `onResize()` | 7 |
| 2351 | `_switchTeam()` | 44 |
| 2395 | `_applyVmVisibility()` | 6 |
| 2401 | `_vmlabEnsure()` | 14 |
| 2415 | `_vmlabFrame()` | 28 |
| 2443 | `_tuneGet()` | 15 |
| 2458 | `_tune()` | 23 |
| 2481 | `_fxSet()` | 1 |
| 2482 | `_switchWeapon()` | 30 |
| 2512 | `_deploySfx()` | 7 |
| 2519 | `_scope()` | 17 |
| 2536 | `_zoomFov()` | 8 |
| 2544 | `_reloading()` | 1 |
| 2545 | `_startReload()` | 19 |
| 2564 | `_reloadLayers()` | 18 |
| 2582 | `_installRecoil()` | 33 |
| 2615 | `_shotRecoil()` | 13 |
| 2628 | `_tryShoot()` | 83 |
| 2711 | `_meleeHit()` | 12 |
| 2723 | `_fireHitscan()` | 53 |
| 2776 | `_surfaceOf()` | 27 |
| 2803 | `_fleshImpact()` | 19 |
| 2822 | `_fxVoice()` | 9 |
| 2831 | `_impactSfx()` | 14 |
| 2845 | `_tintFx()` | 16 |
| 2861 | `_damage()` | 39 |
| 2900 | `_kill()` | 62 |
| 2962 | `_dmgArc()` | 77 |
| 3039 | `_mkBanner()` | 9 |
| 3048 | `_hitmarker()` | 15 |
| 3063 | `_dmgNumber()` | 20 |
| 3083 | `_feed()` | 19 |
| 3102 | `_skullIcon()` | 9 |
| 3111 | `_wpnIcon()` | 64 |
| 3175 | `_tracer()` | 24 |
| 3199 | `_puff()` | 39 |
| 3238 | `_holeDecalMat()` | 8 |
| 3246 | `_flash()` | 54 |
| 3300 | `_muzzleWorld()` | 9 |
| 3309 | `_updateDoors()` | 10 |
| 3319 | `_updateFx()` | 55 |
| 3374 | `_ejectCasing()` | 17 |
| 3391 | `_makeCtfFlagTex()` | 23 |
| 3414 | `_paintFlagSymbol()` | 9 |
| 3423 | `_flagTexFor()` | 26 |
| 3449 | `_legadoSimbolo()` | 8 |
| 3457 | `_loadCtfSymbols()` | 22 |
| 3479 | `_makeCtfZoneTex()` | 31 |
| 3510 | `_makeSmokeTex()` | 8 |
| 3518 | `_updateSmokeHud()` | 6 |
| 3524 | `_spawnGrenade()` | 11 |
| 3535 | `_throwSmoke()` | 8 |
| 3543 | `_throwFrag()` | 10 |
| 3553 | `_explodeFrag()` | 38 |
| 3591 | `_corDaFumaca()` | 15 |
| 3606 | `_popSmoke()` | 19 |
| 3625 | `_updateGrenades()` | 27 |
| 3652 | `_teamColor()` | 18 |
| 3670 | `_teamInk()` | 8 |
| 3678 | `_factionOf()` | 1 |
| 3679 | `_voiceKey()` | 1 |
| 3680 | `_teamName()` | 1 |
| 3681 | `_teamTag()` | 1 |
| 3682 | `_mirror()` | 3 |
| 3685 | `_botSeparation()` | 56 |
| 3741 | `_initCTF()` | 84 |
| 3825 | `_updateCTF()` | 56 |
| 3881 | `_ctfWin()` | 22 |
| 3903 | `_freeYaw()` | 25 |
| 3928 | `_pullString()` | 23 |
| 3951 | `_walkReach()` | 18 |
| 3969 | `_wpComp()` | 16 |
| 3985 | `_findPathLocal()` | 22 |
| 4007 | `_botCtf()` | 133 |
| 4140 | `_hideCtfHud()` | 6 |
| 4146 | `_updateCtfHud()` | 76 |
| 4222 | `_collide()` | 23 |
| 4245 | `_collideRot()` | 26 |
| 4271 | `_freeSpot()` | 30 |
| 4301 | `_retaAndavel()` | 20 |
| 4321 | `_walkDepth()` | 16 |
| 4337 | `_noteHit()` | 15 |
| 4352 | `_deathFeedback()` | 43 |
| 4395 | `_updatePlayer()` | 306 |
| 4701 | `_updatePickups()` | 146 |
| 4847 | `_wpnMode()` | 3 |
| 4850 | `_botWeapon()` | 10 |
| 4860 | `_pickupAllowed()` | 7 |
| 4867 | `_grabPickup()` | 34 |
| 4901 | `_assentarNoChao()` | 11 |
| 4912 | `_dropWeapon()` | 38 |
| 4950 | `_spawnY()` | 3 |
| 4953 | `_pickSpawn()` | 23 |
| 4976 | `_respawnPlayer()` | 18 |
| 4994 | `_losClear()` | 18 |
| 5012 | `_botCall()` | 37 |
| 5049 | `_teamMarkTex()` | 23 |
| 5072 | `_makeTeamMark()` | 14 |
| 5086 | `_updateTeamMark()` | 7 |
| 5093 | `_botEye()` | 1 |
| 5094 | `_enemyOf()` | 8 |
| 5102 | `_duelToken()` | 20 |
| 5122 | `_updateBot()` | 800 |
| 5922 | `_radarFoot()` | 38 |
| 5960 | `_updateRadar()` | 66 |
| 6026 | `_banner()` | 26 |
| 6052 | `_resultadoDaRodada()` | 4 |
| 6056 | `_showScoreboard()` | 44 |
| 6100 | `_updateWeaponHud()` | 33 |
| 6133 | `_updateHud()` | 59 |
| 6192 | `update()` | 61 |
| 6253 | `dispose()` | 36 |

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
