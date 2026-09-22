# Praça dos Três Poderes — candidato técnico R2

## Escolha e fronteira

Esta lane foi aberta em `codex/praca-poderes-main-r2`, a partir de
`origin/main@60ad7501323ef076263f645bfca341e2454fce6b` (`alpha.262`). A Praça foi
escolhida por três motivos verificáveis: é o mapa padrão do jogo, é a arena com maior
impacto de primeira sessão e era o único mapa do catálogo sem PR técnico aberto nem
candidato final registrado. Os demais mapas com dívida tinham PR/worktree em produção
ou revisão; Sertão e Joá já haviam sido integrados.

A worktree histórica `praca-poderes-claude` foi preservada somente para leitura. Ela está
centenas de commits atrás de `main`, contém alterações não commitadas e mistura arquivos
compartilhados. Nenhum arquivo foi copiado dela sem revalidar a hipótese contra a árvore
atual.

Escopo permitido: `public/js/map_brasilia.js`, gates específicos e este relatório. Não
entram runtime, materiais/geradores compartilhados, assets novos ou privados, Mint/Astra,
versão/release, merge ou deploy.

## Definição de pronto

- rotas alternativas e CTF continuam conectadas em 5x5 e 8x8;
- saídas de spawn, flancos e eixo de conflito ganham cobertura mensurável sem bloquear o
  corpo ou criar parede invisível;
- acessos sob pilotis e aos marcos permanecem navegáveis;
- ambiência do espelho d'água e horizonte deixa de parecer um plano vazio, usando apenas
  geometria/procedural já disponível no repositório;
- cada cláusula nova reprova o baseline ou um mutante aplicado de verdade;
- DM/CTF, bots, custo e WebGL real são medidos nas proporções 3:2 e 16:9;
- promoção visual/jogável continua dependendo de playtest humano.

## Baseline causal — 22/09/2026

`map-contrato-check` e `ctf-win-check` passaram: 554 nós, 3.752 arestas, grafo conexo,
quatro rotas separadas e rodada CTF encerrando na terceira bandeira. `botsim` de 20 s
mediu sete bots, `stuck=6,122%`, `eff=0,84` e `laneSpread=0,64`.

O baseline falhou onde a mudança deve atuar. `map-check` mediu exposição média de spawn
de 89,8% (B) e 84,3% (E), além de quadrantes jogáveis com zero cobertura e espaçamento de
99 m. O espelho d'água ainda é um plano `MeshStandardMaterial`, e as rotas externas sob
os pilotis terminam em terreno/névoa sem silhueta urbana. O próximo gate mede o uso real
dessas superfícies e vem acompanhado de mutantes antes da correção.

## Estado

Diagnóstico concluído; implementação ainda não promovida. URL/PR e matrizes finais serão
registrados somente depois dos gates e da crítica independente.
