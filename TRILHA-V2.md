# v2 — trilha de tarefas para fechar o release

> Cole isto inteiro como primeiro prompt numa sessão nova do Claude CLI, na raiz do repo
> (`/Users/ruben/game`, branch `v2/alpha`). É auto-contido.
> Estado do scan: `2.0.0-alpha.25`, portão **39/52**.

---

## CONTEXTO MÍNIMO

FPS de navegador em **Three.js r160 vanilla, zero build** (`public/`), site **Astro SSR**
(`src/`), **Supabase** para ranking, deploy na **Vercel**. Sátira cultural brasileira.
44 personagens, 26 armas, 5 mapas. A v1 fez 1000 jogadores/dia.

**O objetivo desta trilha é FECHAR a v2 e colocar no ar.** Não é melhorar o jogo. Item que
não bloqueia o release vai para `KNOWN-BUGS.md`, não para o diff.

### Regras da casa (não viole, cada uma custou dias)

1. **Régua antes do conserto.** Escreva a medição, prove que ela reprova o estado atual, só
   então conserte.
2. **Teto de invariante só entra com procedência**: arquivo de referência, número medido, e o
   script que reproduz. Número sem medição é opinião. Padrão em `tools/eval/ref-measure.py`.
3. **Toda invariante nova ou alterada vem com uma mutação que a faz ficar vermelha.** Régua
   que não morde não existe.
4. **Nenhuma crítica verde pode virar vermelha.** Rode o portão antes e depois.
5. **Não reduza o número de armas no chão** (veto do dono: é a única forma de escolher arma).
6. **`AUD1` tem que ficar verde.** É ela que garante que o auditor mede o que o jogo desenha.

### Comandos

```bash
npm run check          # portão completo, 10-12 min
npm run check:fast     # cadeia rápida
npm run eval:ctfhud    # 0,4 s     npm run eval:pegada   # 0,4 s
npm run eval:spawn     # 5 s       npm run audio:check   # 4,5 s
```

### NÃO TOQUE (outro agente está nisso agora)

A migração **MIT → AGPL**, que envolve 16 ocorrências em 8 superfícies: `LICENSE`,
`package.json`, `README.md`, `CONTRIBUTING.md`, `src/pages/index.astro`,
`src/pages/sobre.astro`, `public/llms.txt`, `docs/docusaurus.config.js`. Deixe todos em paz.

### Decisões já tomadas pelo dono (não relitigar)

- **As vozes de meme são a identidade do jogo e ficam.** Não proponha substituir.
- **A trilha musical é outra coisa** e pode ser trocada (tarefa 6).
- Mobile mostra aviso em vez de jogo, e isso está certo.

---

# BLOCO 1 — O que quebra calado em produção (faça primeiro)

## T1. Asserção pós-fetch no áudio e nos decalques

**Problema medido.** `scripts/fetch-audio.sh` começa com
`if [ -f "$DEST/manifest.json" ]; then exit 0; fi`. Na máquina do dono o arquivo sempre
existe, então **o caminho de download nunca roda e o bug é invisível**. Na Vercel é checkout
limpo toda vez. Se o `curl` falhar, o fallback copia `manifest.example.json` e **o build
passa**, com o jogo sem tiro real e sem voz, caindo no sintetizado, sem erro nenhum. Mesma
estrutura em `fetch-decals.sh`, com 175 decalques virando 404. Já está registrado como
BUG-19.

**Faça.** Depois do fetch, conte arquivos e chaves do manifest e **falhe o build** se vier
abaixo do esperado. Mesma coisa nos decalques. Mensagem de erro que diga o que faltou.

**Aceite.** Simule a falha (aponte a URL para um endereço inválido) e mostre o build
**reprovando**. Se ele passar, a tarefa não está feita.

## T2. Tirar os 163 MB de código morto do publicado

**Problema medido.** `dist/client/models/fpvm` = **163 MB**, maior que props (112 MB) e
characters (24 MB). Esses GLB só carregam com `?tripovm=1` — `public/js/fparms.js:106` faz
`if (!TRIPO_VM) return` antes de baixar qualquer coisa.

**Faça.** Excluir `public/models/fpvm` do publicado, mantendo o kill-switch funcional para
quem rodar local.

**Aceite.** `du -sh dist/client` antes e depois. Jogo abre e joga normalmente sem
`?tripovm=1`.

## T3. Build limpo, do zero

**Faça.** `rm -rf dist .astro node_modules && npm ci && npm run build`, com as asserções da
T1 ativas.

**Aceite.** Build verde. Confira que existem no `dist`: `models/anims` (sem ela todo
personagem congela em T-pose e o loader engole a falha em silêncio), `wasm/resvg.wasm` (sem
ele toda `/u/*` sai sem og:image), `audio/` com manifest real, `img/decals/`.

---

# BLOCO 2 — Medir antes de escalar

## T4. Quatro campos novos na telemetria

**Por quê.** A rota `/api/telemetry` e a migration 012 já existem. O que falta é o que
coletar. Sem estes quatro números não dá para decidir infra nem preço.

**Faça.** Colete e envie junto do evento de partida:

1. **bytes até o primeiro frame jogável** — soma de `transferSize` de
   `performance.getEntriesByType('resource')`
2. **FPS mediano da sessão** e o **percentil 10**
3. **string da GPU** — `WEBGL_debug_renderer_info`
4. **tier de qualidade efetivo**, e se caiu para `low`

Sem PII, sem nick. Respeite o rate limit que já existe.

**Aceite.** Uma partida local grava as quatro colunas. Mostre a linha do banco.

## T5. `gl-metrics` na corrente do portão

**Problema.** São 52 invariantes e **nenhuma mede tempo de frame**.
`tools/eval/gl-metrics.mjs` existe, já usa Playwright + Chromium (já é dependência) e não
está nem no `check` nem no `check:fast`.

**Faça.** Ligue na corrente com teto por mapa. **Meça primeiro, escolha o teto depois** —
regra 2. Documente de onde veio cada número.

**Aceite.** Invariante nova vermelha quando você degrada de propósito (suba a resolução ou
force `quality: 'high'` em máquina fraca) e verde no estado atual.

---

# BLOCO 3 — Destravar canais

## T6. Auditar os 30 arquivos da trilha

**Problema.** `public/audio/soundtrack/` tem 30 arquivos, 104 MB, e entre eles há
instrumentais de música comercial (*Charlie Brown Jr — Lugar Ao Sol*, *Chief Keef — Faneto*,
*Blitzkrieg Bop*). Isso é o que o **Content ID do YouTube e da Twitch** pega — e o prejuízo
é do **streamer** que jogar o jogo, o que sabota o canal de divulgação por criador.

**Faça.** Tabela dos 30, um a um: `livre` / `licenciado` / `substituir`, com a fonte de cada
julgamento. Para os de substituir, proponha alternativa livre (Sonniss/GDC bundle, Pixabay
Music, Free Music Archive filtrando CC0 ou CC-BY, Uppbeat). Grave a tabela em
`public/audio/soundtrack/SOURCES.md`, no mesmo formato do
`public/audio/cc0/SOURCES.md`, que já é o padrão da casa.

**NÃO TOQUE nas vozes de personagem.** Decisão do dono: são a identidade do jogo.

**Aceite.** `SOURCES.md` com os 30 classificados e link de licença para cada um que ficar.

## T7. Rate limit nas três rotas que não têm

**Medido.** `src/pages/api/badge/[...path].png.ts` (147 linhas, roda resvg-wasm, foi a rota
do SSRF), `leaderboard.ts` e `online.ts` não chamam `rateLimit`. As outras seis chamam.
A `badge` é a que mais vai receber crawler quando o jogo for divulgado.

**Faça.** Aplique o mesmo `rateLimit` das outras rotas. Na `badge`, cache agressivo também.

**Aceite.** Rajada de requisições recebe 429 nas três.

## T8. `hreflang` e sitemap por idioma

**Problema.** O i18n EN entrou com rotas por idioma e sem `hreflang`, então PT e EN competem
entre si e canibalizam ranking. `Cache-Control` já foi feito em `/ranking`, `/u/*`,
`leaderboard`, `online` e `config` — não refaça.

**Faça.** `hreflang` recíproco, sitemap cobrindo as rotas dos dois idiomas, `og:locale` por
idioma. Estenda `tools/eval/seo-check.mjs` para cobrir as páginas novas (`/characters` EN,
`/docs`) — régua que só olha a home dá verde enquanto o resto apodrece.

**Aceite.** `npm run eval:seo` verde, com as invariantes novas provadas por mutação.

---

# BLOCO 4 — Primeira impressão (você tem uma chance com 30 mil seguidores)

## T9. Tela de erro

Hoje, se um GLB falhar ou o contexto WebGL cair, o jogador vê preto.

**Faça.** Mensagem visível e botão de recarregar, em PT e EN. Cubra `webglcontextlost` e
falha de carregamento de GLB.

**Aceite.** Force os dois casos e mostre a tela.

## T10. A tela de mobile vira captura

`public/js/main.js:253` e `:475` detectam mobile e mostram aviso. Está certo — mas metade do
tráfego de um post de LinkedIn abre no celular, e hoje isso é **100% de perda**.

**Faça.** Vídeo curto do jogo, botão de Discord e campo de e-mail (ou só o Discord, se não
houver lista). Transformar rejeição em conversão.

**Aceite.** Tela renderiza em viewport de celular, nos dois idiomas.

## T11. Controles no primeiro minuto

Não existe tela de controles nem tutorial. Quem passa da barreira manda DM dizendo
"viciante"; quem não passa não escreve.

**Faça.** Overlay de controles na primeira partida, dispensável, com `localStorage` para não
repetir. Simples: mover, atirar, mirar, trocar arma, pegar arma.

**Aceite.** Aparece na primeira vez, não aparece na segunda.

---

# BLOCO 5 — Repo pronto para colaborador

## T12. `npm run setup`

Hoje quem clona pega um jogo **sem som e com textura faltando**: `public/audio/`,
`public/img/decals/` e `references/` estão no `.gitignore` por decisão do dono. Está tudo
documentado — mas documentar não conserta a primeira impressão, e o especialista que
interessa fecha a aba em vez de debugar setup.

**Faça.** Um comando: `install` → `fetch-audio` → `fetch-decals` → `copy-wasm` →
`check:fast`, que ao fim **imprime o que faltou e por quê**.

**Aceite.** Rode num clone limpo e mostre a saída.

## T13. `ASSETS.md` — procedência

**Por quê.** Modelador 3D profissional **não contribui arte** para repo com asset de origem
duvidosa, porque contamina o trabalho dele. Hoje há sample do CS, modelo de origem
Mint/Tripo, e o próprio `.gitignore` admite graffiti de "procedência incerta".

**Faça.** `ASSETS.md` na raiz: o que é CC0, o que é gerado, o que é de terceiro e sob que
termo, o que é meme e fica só no pacote local. Sem inventar — onde não souber, escreva
`procedência não verificada`.

**Aceite.** Toda pasta de asset representada. `public/audio/cc0/SOURCES.md` é o padrão de
qualidade a seguir.

## T14. `skills:check`

`skills-lock.json` tem SHA-256 por skill e **nada verifica o hash**. É a issue 12 do próprio
repo.

**Faça.** Script que confere o hash de cada skill e entra no `check:fast`.

**Aceite.** Altere uma skill de propósito e mostre reprovando.

## T15. Issues no GitHub

As **15 good-first-issues** estão escritas em `docs/issues/` e nunca foram abertas. E falta
o outro lado: especialista não quer "adicione um botão", quer o problema que só ele resolve.

**Faça.** Abra as 15. E crie uma seção **WANTED** no `CONTRIBUTING.md` com os três problemas
que precisam de especialista, cada um com a medição, o critério de aceite e **o que já foi
descartado** (é isso que faz um profissional confiar que não vai perder tempo):

- **CHR1** — 18 personagens compartilham UM esqueleto (o do `mst`, transplantado por
  auto-skin). Raio de skin: mandrake 0,087 m contra 0,135–0,171 nos outros, **1,55× a
  1,97×**. Aceite: `char-probe` seção C7, esqueletos distintos ≠ 1 e raioSkin50 ≤ 0,10.
- **VM18/VM20** — 12 armas com espessura de malha abaixo do piso medido no CS 1.6
  (shotgun 0,269 · carbine 0,296 · sks 0,343 contra piso 0,427). **Já refutado com número:**
  duas buscas em grade (768 e 1280 pontos) e a hipótese de escorço (`vm-orto.mjs`). É malha
  nova, não parâmetro.
- **`fy_pool_day` em MeshLambert**, que não aceita normalMap. Precisa de alguém que **meça**
  o custo de converter para Standard em máquina fraca.

**Aceite.** 15 issues abertas com label, e a seção WANTED no ar.

---

# BLOCO 6 — Release

## T16. Rollback

**Faça.** Anote em `docs/RELEASE.md`: URL do deploy anterior fixado, comando exato de
reversão, e o que conferir depois de reverter.

## T17. Soft launch de 24 h

**Faça.** Suba em produção **sem anunciar**. Peça para os 5 contribuidores e uns 20 amigos
jogarem. Fique olhando a telemetria da T4.

**Aceite.** Depois de 24 h, um relatório curto: bytes por sessão (mediana e p90), FPS
mediano e p10, distribuição de GPU, taxa de erro, e onde as pessoas param de jogar.

**É este relatório que decide** se os assets precisam sair da Vercel para um CDN de egress
zero antes de escalar. A conta estimada hoje: se uma sessão puxa ~60 MB, 10 mil
jogadores/dia dão ~18 TB/mês, que na banda da Vercel sai na casa de US$ 2.500/mês e num CDN
de egress zero sai perto de zero. **Não decida isso por estimativa — decida por esse
relatório.**

## T18. `KNOWN-BUGS.md` no fim

**Faça.** Atualize com o placar real do portão e o que ficou de fora, com o motivo. Os itens
que **não** entram nesta trilha e devem estar registrados:

- re-rig dos 18 personagens (CHR1) — precisa de asset novo
- VM18/VM20 — precisa de malha nova
- postura do coach quântico (36,0°) e do dollynho (66,9°) contra mediana 86,5° do elenco
- BOT8 — bot com linha de visão > 1,5 s sem atirar
- decidir o destino do cliente Godot (382 arquivos versionados)
- multiplayer WebRTC / servidor autoritativo — é v3

---

# ORDEM E CRITÉRIO DE PARADA

Faça **na ordem dos blocos**. O Bloco 1 é o único que, se ficar de fora, quebra o release em
silêncio — e silêncio é o pior modo de falha, porque o jogador não reclama, ele fecha a aba.

Depois de cada bloco: `npm run check`, e reporte `CRÍTICAS: n/52` antes e depois.

**Se você só conseguir fazer três tarefas: T1, T2 e T5.** As duas primeiras somam cerca de
uma hora. A terceira é a única que protege o dono depois que ele postar e sair do
computador.
