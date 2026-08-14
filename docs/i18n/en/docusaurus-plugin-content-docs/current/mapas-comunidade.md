---
id: mapas-comunidade
title: Community maps
sidebar_label: Community maps
sidebar_position: 7
description: How to submit your own map to the game — the standard every map fulfills, the origin fields in the registry, the PR template and the acceptance criteria.
---

# Community maps

The game has two kinds of map, and the difference is **origin, not quality**:

- **Official** — made by the project team.
- **Community** — submitted via pull request by anyone, under the **same contract and the
  same gauges** as the official ones.

A community map shows up in the in-game menu with the **COMMUNITY MAP** tag and credit to
its author (on the full-screen poster), after the official maps in the carousel order, and
gets its own section on [`/maps`](https://www.csbrasil.online/maps) on the site.

:::info It is 100% open source
A submitted map enters the public repository under the **AGPL-3.0**, like all the rest of
the code. There is no such thing as a closed community map.
:::

## There is only one standard

There is no "community map format". There is **the** map format — the same as the official
ones:

- A `public/js/map_<name>.js` file exporting `build<Name>()`, which returns the complete
  **world contract**. The canonical example (and the smallest registered map) is the
  return of `map_piscina.js`:

```js
return {
  root, colliders, occluders, decalSolids, groundHeightAt, slowAt,
  spawns, sun, hemi, pickups, ctfPoints,
  waypoints: { nodes, adj }, nearestWaypoint, findPath,
  bounds,
};
```

  `waypoints`/`nearestWaypoint`/`findPath` are not optional: without them the bots can't
  navigate, and a disconnected waypoint is the most common defect in a new map.

- The technical step-by-step (how to build it, what each gauge measures) is in the recipe
  [How to add a map](./colaborar.md#how-to-add-a-map) — read it first. This page covers
  what changes because the map comes from outside: registry, template and acceptance.

## The registry line

Every playable map is an entry in the `MAPS` object of `public/js/maps.js`. A community
map goes **in the marked section at the end of the object**, with three fields on top of
what an official one has:

```js
my_map: { name: 'Menu Name', build: buildMyMap, props: MYMAP_PROPS, ctfMode: true, community: true, author: 'Your Name', authorGithub: 'your-username', desc: 'One sentence of description for the full-screen poster.' },
```

- `community: true` — this is what turns on the menu tag, the site section and the
  "Origin" column of the generated maps table.
- `author` / `authorGithub` — the credit shown in the game and on `/maps`.
- `desc` — one sentence (mood + tactical read) shown on the full-screen poster. Official
  maps keep theirs in `main.js`'s `MAP_DESC`; yours lives in the registry line itself, so
  the PR doesn't need to touch `main.js`.

**The id follows the house convention**: lowercase, no CS legacy prefix (`fy_*` was
dropped on 11/08), no accents and no spaces — it becomes the preview file name and appears
in URLs. Example: `my_map`, not `fy_my_map` nor `myMap`.

:::warning The entry is ONE line, and that's not pedantry
`tools/gen-docs.mjs` (which generates the maps table in the README and the docs) reads the
registry **line by line**. An entry broken across lines makes your map **vanish from the
generated docs with no error** — or show up without its mode/author. One line, after the
last official map.
:::

## The PR has 3 files

A map PR is lean on purpose — it makes review and rollback easy:

| File | What it is |
|---|---|
| `public/js/map_<name>.js` | The geometry + complete world contract |
| `public/js/maps.js` | **One** new line, in the community section |
| `public/img/map-previews/<id>.jpg` | A real capture of the map (it's the menu poster and the art on `/maps`) |

Open the PR with its own template by appending `?template=mapa_comunidade.md` to the pull
request creation URL (or copy it from
[`.github/PULL_REQUEST_TEMPLATE/mapa_comunidade.md`](https://github.com/rubenmarcus/csbrasil/blob/main/.github/PULL_REQUEST_TEMPLATE/mapa_comunidade.md)).

## Acceptance criteria

Review of a community map looks at, in this order:

1. **Green gauges, with the output pasted in the PR** — the same ones as the official
   maps:
   - `node tools/eval/map-check.mjs <id>` — spawns, stairs, occluders, flags
     (`MAP1`–`MAP5`, `CTF1`/`CTF2` if it opens in capture);
   - `node tools/eval/pickup-check.mjs` — every pickup reachable **on foot** from the
     spawns;
   - `node tools/eval/botsim.mjs 60 <id>` — bots navigate without getting stuck
     (`BOT1`–`BOT3`, stuck ≤ 4%);
   - `npm run syntax`.
2. **A PR with the 3 files and the registry line in the format above** — clean id, right
   section, one line.
3. **Human gameplay review** — a green gauge proves the map isn't *broken*; it doesn't
   prove it's *good*. Someone on the team plays the map before merge (label
   `needs-human-gameplay`). Balance, route readability and visual identity are judged
   here.
4. **Honest mode** — `ctfMode: true` only if the geometry was designed around the flags.
   The mode is never a lock (`MOD1`): the player switches it in the menu.

An accepted map is a maintained map: if an engine change breaks a gauge on your map, the
fix can come from the team or from you — the registry keeps the `author` precisely so that
conversation is easy.
