# Graph Report - .  (2026-08-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2649 nodes · 5073 edges · 224 communities (76 shown, 148 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 134 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b4ee2b37`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 90
- Community 91
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 102
- Community 103
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 145
- Community 146
- Community 147
- Community 149
- Community 150
- Community 151
- Community 152
- Community 153
- Community 154
- Community 155
- Community 156
- Community 157
- Community 159
- Community 160
- Community 161
- Community 162
- Community 163
- Community 164
- Community 165
- Community 166
- Community 167
- Community 168
- Community 169
- Community 170
- Community 172
- Community 173
- Community 174
- Community 176
- Community 177
- Community 178
- Community 179
- Community 180
- Community 181
- Community 182
- Community 183
- Community 184
- Community 185
- Community 186
- Community 187
- Community 188
- Community 189
- Community 190
- Community 191
- Community 192
- Community 193
- Community 194
- Community 195
- Community 198
- Community 199
- Community 200
- Community 201
- Community 202
- Community 203
- Community 204
- Community 205
- Community 206
- Community 207
- Community 208
- Community 212
- Community 215
- Community 217
- Community 219
- Community 220
- Community 221
- Community 223

## God Nodes (most connected - your core abstractions)
1. `Vector3` - 76 edges
2. `Game` - 64 edges
3. `Vector2` - 55 edges
4. `Vector4` - 51 edges
5. `WebGLRenderer` - 51 edges
6. `Object3D` - 47 edges
7. `Sfx` - 45 edges
8. `Quaternion` - 38 edges
9. `Matrix4` - 38 edges
10. `Box3` - 33 edges

## Surprising Connections (you probably didn't know these)
- `pvSetChar()` --calls--> `buildCharacter()`  [EXTRACTED]
  public/js/main.js → public/js/characters.js
- `badgeSvg()` --calls--> `displayTime()`  [EXTRACTED]
  src/pages/api/badge/[...path].png.ts → src/lib/fmt.ts
- `POST()` --calls--> `geoFrom()`  [EXTRACTED]
  src/pages/api/heartbeat.ts → src/lib/geo.ts
- `POST()` --calls--> `geoFrom()`  [EXTRACTED]
  src/pages/api/submit-match.ts → src/lib/geo.ts
- `handle()` --calls--> `socialAvatar()`  [EXTRACTED]
  src/pages/api/badge/[...path].png.ts → src/lib/social.ts

## Import Cycles
- None detected.

## Communities (224 total, 148 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.01
Nodes (237): _addedEvent, _alignedPosition, AnimationUtils, arrayCacheF32, arrayCacheI32, _axis, _axisDirections, _basePosition (+229 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (6): AnimationAction, CubicInterpolant, DiscreteInterpolant, Interpolant, PropertyMixer, QuaternionLinearInterpolant

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (3): Box2, Box3, Box3Helper

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (6): cloneUniformsGroups(), Color, hue2rgb(), LinearToSRGB(), ShaderMaterial, SRGBToLinear()

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (33): clock, container, currentMap, extractFromUrl(), mapSel, menuCam, menuScene, NETS (+25 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (5): CubeCamera, PlaneHelper, PointLightShadow, SkinnedMesh, SpotLightHelper

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (15): AnimationClip, AnimationLoader, _createPlanes(), ExtrudeGeometry, flattenJSON(), getBoneList(), getKeyframeOrder(), getShaderErrors() (+7 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (4): DirectionalLightHelper, SphericalHarmonics3, Sprite, transformVertex()

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (4): checkGeometryIntersection(), checkIntersection(), satForAxes(), Triangle

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (31): addContour(), compareX(), cureLocalIntersections(), earcutLinked(), eliminateHole(), eliminateHoles(), filterPoints(), findHoleBridge() (+23 more)

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (30): astro, @astrojs/vercel, dejavu-fonts-ttf, bugs, url, dependencies, astro, @astrojs/vercel (+22 more)

### Community 19 - "Community 19"
Cohesion: 0.08
Nodes (4): CatmullRom(), CatmullRomCurve3, InstancedMesh, SplineCurve

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (3): arrayNeedsUint32(), BufferGeometry, getTypedArray()

### Community 22 - "Community 22"
Cohesion: 0.08
Nodes (9): RenderTarget, Texture, warnOnce(), WebGLCubeMaps(), WebGLCubeRenderTarget, WebGLCubeUVMaps(), WebGLPrograms(), WebGLRenderLists() (+1 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (3): Line, LOD, _points

### Community 25 - "Community 25"
Cohesion: 0.17
Nodes (5): AudioLoader, BufferGeometryLoader, CompressedTextureLoader, DataTextureLoader, TextureLoader

### Community 26 - "Community 26"
Cohesion: 0.13
Nodes (4): BatchedMesh, CameraHelper, EdgesGeometry, setPoint()

### Community 29 - "Community 29"
Cohesion: 0.09
Nodes (21): filterEmptyLine(), generateCubeUVSize(), generateDefines(), generateEnvMapBlendingDefine(), generateEnvMapModeDefine(), generateEnvMapTypeDefine(), generateExtensions(), generatePrecision() (+13 more)

### Community 30 - "Community 30"
Cohesion: 0.08
Nodes (3): Line3, Mesh, Ray

### Community 33 - "Community 33"
Cohesion: 0.16
Nodes (3): getUnlitUniformColorSpace(), LightShadow, WebGLShadowMap()

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (7): _createRenderTarget(), _getBlurShader(), _getCommonVertexShader(), _getCubemapMaterial(), _getEquirectMaterial(), PMREMGenerator, _setViewport()

### Community 36 - "Community 36"
Cohesion: 0.12
Nodes (3): OrthographicCamera, PerspectiveCamera, SpotLightShadow

### Community 37 - "Community 37"
Cohesion: 0.15
Nodes (17): NET_SVG, sideOf(), NET_INFO, NET_PREFIX, netIcon(), normalizeSocialUrl(), socialAvatar(), socialHref() (+9 more)

### Community 39 - "Community 39"
Cohesion: 0.10
Nodes (5): DepthTexture, EllipseCurve, InstancedBufferAttribute, InstancedBufferGeometry, toJSON$1()

### Community 40 - "Community 40"
Cohesion: 0.16
Nodes (5): convertArray(), isTypedArray(), KeyframeTrack, QuaternionKeyframeTrack, subclip()

### Community 41 - "Community 41"
Cohesion: 0.21
Nodes (19): allocTexUnits(), arraysEqual(), copyArray(), setValueM2(), setValueM3(), setValueM4(), setValueT1Array(), setValueT2DArrayArray() (+11 more)

### Community 42 - "Community 42"
Cohesion: 0.11
Nodes (6): AxesHelper, BoxHelper, HemisphereLightHelper, WebGLGeometries(), WebGLMorphtargets(), WebGLObjects()

### Community 45 - "Community 45"
Cohesion: 0.18
Nodes (11): Geo, geoFrom(), NOT_CONFIGURED, supabaseAdmin, prerender, POST(), prerender, prerender (+3 more)

### Community 48 - "Community 48"
Cohesion: 0.20
Nodes (15): charInner(), charName(), CHARS, charSvg(), charSvgScaled(), FONT_BOLD_B64, avatarDataUri(), badgeSvg() (+7 more)

### Community 52 - "Community 52"
Cohesion: 0.21
Nodes (15): addAccessories(), box(), buildCharacter(), buildRifle(), CHARACTERS, M(), matCache, poseCharacter() (+7 more)

### Community 55 - "Community 55"
Cohesion: 0.21
Nodes (14): api(), getToken(), loadStats(), partialPayload(), quitToMenu(), recordMatchStats(), renderGlobal(), retryPending() (+6 more)

### Community 56 - "Community 56"
Cohesion: 0.14
Nodes (4): GridHelper, PointLightHelper, PolarGridHelper, SkeletonHelper

### Community 57 - "Community 57"
Cohesion: 0.18
Nodes (4): addUniform(), parseUniform(), StructuredUniform, WebGLUniforms

### Community 61 - "Community 61"
Cohesion: 0.17
Nodes (3): DirectionalLight, Scene, WebGLMultipleRenderTargets

### Community 64 - "Community 64"
Cohesion: 0.15
Nodes (8): rows, mapData, pctP, prerender, sideTotal, totals, bolsonaristas, petistas

### Community 66 - "Community 66"
Cohesion: 0.21
Nodes (4): CubicPoly(), Skeleton, WebGLRenderList(), WebGLRenderState()

### Community 70 - "Community 70"
Cohesion: 0.36
Nodes (6): buildPoolDay(), mkTex(), signTexture(), tileTex(), DEFAULT_MAP, MAP_IDS

### Community 71 - "Community 71"
Cohesion: 0.20
Nodes (5): StereoCamera, WebGLBindingStates(), WebGLCapabilities(), WebGLInfo(), WebGLState()

### Community 73 - "Community 73"
Cohesion: 0.22
Nodes (6): AudioContext, createCanvasElement(), createElementNS(), ImageUtils, serializeImage(), WebGLTextures()

### Community 76 - "Community 76"
Cohesion: 0.22
Nodes (7): buildWorld(), cam, canvas, last, loop(), renderer, scene

### Community 82 - "Community 82"
Cohesion: 0.44
Nodes (8): canvas(), concreteBase(), GCOLORS, GRAFFITI, initTextures(), noiseOver(), stains(), tex()

### Community 84 - "Community 84"
Cohesion: 0.22
Nodes (8): **/*, astro/tsconfigs/strict, .astro/types.d.ts, dist, public, exclude, extends, include

### Community 91 - "Community 91"
Cohesion: 0.38
Nodes (3): ascSort(), intersectObject(), Raycaster

### Community 94 - "Community 94"
Cohesion: 0.29
Nodes (7): flatten(), setValueM2Array(), setValueM3Array(), setValueM4Array(), setValueV2fArray(), setValueV3fArray(), setValueV4fArray()

### Community 99 - "Community 99"
Cohesion: 0.38
Nodes (4): public.players, public.register_player(), public.stats, public.submit_log

### Community 100 - "Community 100"
Cohesion: 0.47
Nodes (6): armSwitchHook(), ensurePreview(), pickTeam(), pvSetChar(), pvThumb(), selectChar()

### Community 107 - "Community 107"
Cohesion: 0.40
Nodes (5): CubicBezier(), CubicBezierP0(), CubicBezierP1(), CubicBezierP2(), CubicBezierP3()

### Community 111 - "Community 111"
Cohesion: 0.40
Nodes (4): QuadraticBezier(), QuadraticBezierP0(), QuadraticBezierP1(), QuadraticBezierP2()

### Community 115 - "Community 115"
Cohesion: 0.50
Nodes (4): buildSocialUrl(), POST(), prerender, regHits

### Community 116 - "Community 116"
Cohesion: 0.40
Nodes (4): public.leaderboard, public.submit_log, players, stats

### Community 128 - "Community 128"
Cohesion: 0.50
Nodes (3): public.leaderboard, players, stats

### Community 129 - "Community 129"
Cohesion: 0.50
Nodes (3): public.leaderboard, players, stats

### Community 130 - "Community 130"
Cohesion: 0.50
Nodes (3): buildCommand, headers, $schema

## Knowledge Gaps
- **328 isolated node(s):** `name`, `version`, `description`, `dev`, `build` (+323 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **148 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Quaternion` connect `Community 20` to `Community 0`, `Community 197`, `Community 70`, `Community 47`, `Community 19`, `Community 89`, `Community 158`, `Community 31`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `Vector2` connect `Community 4` to `Community 0`, `Community 69`, `Community 76`, `Community 14`, `Community 47`, `Community 49`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _328 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.006872852233676976 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08035714285714286 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05012531328320802 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05870020964360587 - nodes in this community are weakly interconnected._