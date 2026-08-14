<!-- Template de PR para MAPA DA COMUNIDADE.
     Guia completo: https://www.csbrasil.online/docs/mapas-comunidade
     Receita técnica: https://www.csbrasil.online/docs/colaborar#como-adicionar-um-mapa -->

## Mapa da comunidade

- **id**: `fy_` <!-- minúsculo, prefixo fy_, sem acento e sem espaço — vira arquivo de preview e URL -->
- **Nome no menu**:
- **Autor**: Nome (@usuario-github)
- **Modo padrão**: [ ] rounds  [ ] captura (`ctfMode: true` — só se a geometria foi desenhada em volta das bandeiras)
- **Descrição PT** (1 frase, vai no cartaz do jogo — campo `desc` do registro):
- **Descrição EN** (para o overlay do site em `src/pages/maps.astro`, se souber traduzir):

## Arquivos do PR (devem ser só estes 3)

- [ ] `public/js/map_<nome>.js` — exporta `build<Nome>()` com o world contract completo (incluindo `waypoints`/`nearestWaypoint`/`findPath`)
- [ ] `public/js/maps.js` — **UMA linha** nova na seção de mapas da comunidade, com `community: true, author, authorGithub, desc`
- [ ] `public/img/map-previews/<id>.jpg` — captura real do mapa

## Réguas (cole a saída de cada uma abaixo)

- [ ] `node tools/eval/map-check.mjs <id>` — MAP1–MAP5 verdes (+ CTF1/CTF2 se abre em captura)
- [ ] `node tools/eval/pickup-check.mjs` — todo pickup alcançável a pé
- [ ] `node tools/eval/botsim.mjs 60 <id>` — BOT1–BOT3 verdes, stuck ≤ 4%
- [ ] `npm run syntax`

```
(saídas aqui)
```

## Risk

- [x] medium — UI/site/runtime path touched

## Bot notes

- [x] needs `needs-human-gameplay` <!-- mapa novo sempre passa por review humano de gameplay antes do merge -->
