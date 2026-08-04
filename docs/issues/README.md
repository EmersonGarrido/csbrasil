# Tarefas boas pra primeira contribuição

15 issues escritas pra serem **coladas direto no GitHub**. Cada arquivo é uma
issue completa: contexto, o que fazer, critério de aceite e quais arquivos
tocar. Nenhuma delas depende de conhecimento tácito que não esteja escrito.

**Como usar:** copie o conteúdo do `.md`, abra a issue, cole. O título é a
primeira linha (`# …`).

## Por tempo disponível

| Tenho… | Pegue |
|---|---|
| 30 min | [01](01-hreflang-e-og-locale.md) · [11](11-api-config-morta.md) |
| 1 h | [06](06-skip-link-e-foco.md) · [07](07-404-personalizada.md) · [08](08-vendorizar-leaflet.md) · [09](09-atomizar-city-daily.md) · [10](10-validar-charset-do-nick.md) · [14](14-changelog-anchors.md) |
| 2-3 h | [02](02-sitemap-index.md) · [03](03-og-image-por-pagina.md) · [04](04-pagina-faccao.md) · [05](05-tabela-comparativa-armas.md) · [12](12-skills-lock-verificar-hash.md) · [13](13-aposentar-evals-obsoletos.md) · [15](15-teste-de-fumaca-do-site.md) |

## Por área

| Área | Issues |
|---|---|
| **SEO / conteúdo** | 01, 02, 03, 04, 14 |
| **UI / front** | 05, 06, 07, 14 |
| **Segurança / backend** | 08, 09, 10, 11 |
| **Qualidade / CI / limpeza** | 12, 13, 15 |

## A lista

| # | Título | Dificuldade |
|---|---|---|
| 01 | [`hreflang` e alternate para o host sem `www`](01-hreflang-e-og-locale.md) | fácil |
| 02 | [Partir o sitemap em índice acima de 5.000 URLs](02-sitemap-index.md) | média |
| 03 | [`og:image` própria para `/mapas` e `/armas`](03-og-image-por-pagina.md) | média |
| 04 | [Uma página por facção: `/faccoes/<id>`](04-pagina-faccao.md) | fácil |
| 05 | [Tabela comparativa de armas com ordenação](05-tabela-comparativa-armas.md) | fácil |
| 06 | [Skip link, foco visível e contraste](06-skip-link-e-foco.md) | fácil |
| 07 | [Página 404 personalizada](07-404-personalizada.md) | fácil |
| 08 | [Vendorizar o Leaflet e tirar o unpkg da CSP](08-vendorizar-leaflet.md) | média |
| 09 | [Corrigir a condição de corrida em `city_daily`](09-atomizar-city-daily.md) | média |
| 10 | [Validar os caracteres do nick](10-validar-charset-do-nick.md) | fácil |
| 11 | [Decidir o destino de `GET /api/config`](11-api-config-morta.md) | fácil |
| 12 | [Verificar os hashes do `skills-lock.json`](12-skills-lock-verificar-hash.md) | média |
| 13 | [Aposentar de verdade os evals obsoletos](13-aposentar-evals-obsoletos.md) | fácil |
| 14 | [Âncoras por versão no `/changelog`](14-changelog-anchors.md) | fácil |
| 15 | [Teste de fumaça das rotas do site no CI](15-teste-de-fumaca-do-site.md) | média |

## Antes de abrir o PR

Leia [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md) e rode:

```bash
npm run check        # portão completo (bloqueante)
npm run build        # o site tem que buildar
```

**Nenhuma destas 15 issues exige tocar em `public/js/*.js`** — de propósito.
Esse é o código onde os agentes de gameplay trabalham em paralelo e onde a
tabela de conflito do `tools/eval/ARCH.md` manda. A única que chega perto é a
10, e ela diz explicitamente pra combinar antes.
