---
id: mapas-comunidade
title: Mapas da comunidade
sidebar_label: Mapas da comunidade
sidebar_position: 7
description: Como enviar um mapa seu para o jogo — o padrão que todo mapa cumpre, os campos de origem no registro, o template de PR e os critérios de aceite.
---

# Mapas da comunidade

O jogo tem dois tipos de mapa, e a diferença é **de origem, não de qualidade**:

- **Oficial** — feito pelo time do projeto.
- **Da comunidade** — enviado por pull request de qualquer pessoa, no **mesmo contrato e
  nas mesmas réguas** dos oficiais.

Mapa da comunidade aparece no menu do jogo com a etiqueta **MAPA DA COMUNIDADE** e o
crédito de quem fez (no cartaz em tela cheia), depois dos oficiais na ordem do carrossel,
e ganha seção própria em [`/mapas`](https://www.csbrasil.online/mapas) no site.

:::info É 100% open source
Mapa submetido entra no repositório público sob a **AGPL-3.0**, como todo o resto do
código. Não existe mapa da comunidade fechado.
:::

## O padrão é um só

Não existe "formato de mapa da comunidade". Existe **o** formato de mapa — o mesmo dos
oficiais:

- Um arquivo `public/js/map_<nome>.js` exportando `build<Nome>()`, que devolve o **world
  contract** completo. O exemplo canônico (e o menor registrado) é o retorno de
  `map_piscina.js`:

```js
return {
  root, colliders, occluders, decalSolids, groundHeightAt, slowAt,
  spawns, sun, hemi, pickups, ctfPoints,
  waypoints: { nodes, adj }, nearestWaypoint, findPath,
  bounds,
};
```

  `waypoints`/`nearestWaypoint`/`findPath` não são opcionais: sem eles os bots não
  navegam, e waypoint desconexo é o defeito mais comum de mapa novo.

- O passo a passo técnico (como construir, o que cada régua mede) está na receita
  [Como adicionar um mapa](./colaborar.md#como-adicionar-um-mapa) — leia ela primeiro.
  Esta página cobre o que muda por o mapa vir de fora: registro, template e aceite.

## A linha de registro

Todo mapa jogável é uma entrada no objeto `MAPS` de `public/js/maps.js`. Mapa da
comunidade entra **na seção marcada no fim do objeto**, com três campos a mais que um
oficial:

```js
meu_mapa: { name: 'Nome no Menu', build: buildMeuMapa, props: MEUMAPA_PROPS, ctfMode: true, community: true, author: 'Seu Nome', authorGithub: 'seu-usuario', desc: 'Uma frase de descrição pro cartaz em tela cheia.' },
```

- `community: true` — é o que liga a etiqueta no menu, a seção do site e a coluna
  "Origem" da tabela gerada de mapas.
- `author` / `authorGithub` — o crédito exibido no jogo e em `/mapas`.
- `desc` — uma frase (clima + leitura tática) mostrada no cartaz em tela cheia. Mapas
  oficiais têm as suas no `MAP_DESC` do `main.js`; a sua mora na própria linha do
  registro, para o PR não precisar tocar o `main.js`.

**O id segue a convenção da casa**: minúsculo, sem prefixo herdado do CS (`fy_*` saiu no
rename de 11/08), sem acento e sem espaço — ele vira nome de arquivo de preview e aparece
em URL. Exemplo: `meu_mapa`, não `fy_meu_mapa` nem `meuMapa`.

:::warning A entrada é UMA linha, e não é frescura
O `tools/gen-docs.mjs` (que gera a tabela de mapas do README e da doc) lê o registro
**linha a linha**. Entrada quebrada em várias linhas faz o seu mapa **sumir da doc gerada
sem erro nenhum** — ou aparecer sem o modo/autor. Uma linha, depois do último oficial.
:::

## O PR tem 3 arquivos

Um PR de mapa é enxuto de propósito — facilita o review e o rollback:

| Arquivo | O que é |
|---|---|
| `public/js/map_<nome>.js` | A geometria + world contract completo |
| `public/js/maps.js` | **Uma** linha nova, na seção da comunidade |
| `public/img/map-previews/<id>.jpg` | Captura real do mapa (é o cartaz do menu e a arte em `/mapas`) |

Abra o PR com o template próprio, acrescentando `?template=mapa_comunidade.md` à URL de
criação do pull request (ou copie de
[`.github/PULL_REQUEST_TEMPLATE/mapa_comunidade.md`](https://github.com/rubenmarcus/csbrasil/blob/main/.github/PULL_REQUEST_TEMPLATE/mapa_comunidade.md)).

## Critérios de aceite

O review de um mapa da comunidade olha, nesta ordem:

1. **Réguas verdes, com a saída colada no PR** — as mesmas dos oficiais:
   - `node tools/eval/map-check.mjs <id>` — spawns, escadas, occluders, bandeiras
     (`MAP1`–`MAP5`, `CTF1`/`CTF2` se abrir em captura);
   - `node tools/eval/pickup-check.mjs` — todo pickup alcançável **a pé** a partir dos
     spawns;
   - `node tools/eval/botsim.mjs 60 <id>` — bots navegam sem travar (`BOT1`–`BOT3`,
     stuck ≤ 4%);
   - `npm run syntax`.
2. **PR com os 3 arquivos e a linha de registro no formato acima** — id limpo, seção
   certa, uma linha.
3. **Review humano de gameplay** — régua verde prova que o mapa não está *quebrado*; não
   prova que ele é *bom*. Alguém do time joga o mapa antes do merge (label
   `needs-human-gameplay`). Balanceamento, leitura das rotas e identidade visual entram
   aqui.
4. **Modo honesto** — `ctfMode: true` só se a geometria foi desenhada em volta das
   bandeiras. O modo nunca é trava (`MOD1`): o jogador troca no menu.

Mapa aceito é mapa mantido: se uma mudança de motor quebrar uma régua no seu mapa, o
conserto pode vir do time ou de você — o registro guarda o `author` justamente para essa
conversa ser fácil.
