# ROADMAP — próximos passos

> Atualizado em **07/08/2026** (`2.0.0-alpha.32`). Este arquivo é a VISTA DE CIMA:
> a ordem e o porquê. O detalhe de execução mora em [`TRILHA-V2.md`](TRILHA-V2.md)
> (T1–T32, com critério de aceite por tarefa) e nos planos por frente em
> [`PLANS/`](PLANS/). Defeito aberto é [`KNOWN-BUGS.md`](KNOWN-BUGS.md); tarefa de
> entrada pra contribuidor é [issue no GitHub](https://github.com/rubenmarcus/csbrasil/issues)
> + [`docs/issues/`](docs/issues/). Quando um item daqui fechar, ele sai daqui —
> histórico é o git, não este arquivo.

## Agora (fecha o release v2)

1. **Bloco 1 da trilha (T1–T3)** — o que quebra calado em produção:
   asserção pós-fetch de áudio/decalques, tirar os 154 MB de `fpvm` do publicado,
   build limpo do zero. *Plano revisado em 07/08 — ver correções na seção
   "Plano do Bloco 1" abaixo.*
2. **Paridade de grafite em produção** — prod builda do git puro e o acervo de
   decalques (gitignored por procedência) dá 404: só as peças originais `or-*`
   existem lá. Caminho: continuar gerando levas `or-*` via OpenRouter
   (`tools/gen-image.mjs`) até aposentar o acervo baixado da web. A cobertura
   procedural já existe (map_quebrada/piscina/havan/ferrovelho); falta volume de
   peça própria e o adensamento da Brasília.
3. **Aplicar a migration `013_feedback.sql` no Supabase de prod** — o form de
   FEEDBACK do menu (semente da newsletter) responde "indisponível" até isso.
4. **BOT8 / BUG-03** — bot com linha de visão no jogador por segundos sem atirar.
   Última dívida de *jogabilidade* de verdade; régua existe, botsim reproduz.
5. **Blocos 2–7 da trilha, na ordem** — AI engineering (mutation testing, portão
   por severidade, CI comentando placar), telemetria, canais, primeira impressão,
   repo de colaborador, release. T25 (form de feedback) **já caiu em 07/08**;
   T23 (captura mobile) e T28 (issues no GitHub) estão meio andados.

## Depois do release

- **Multiplayer 4×4 com servidor autoritativo** — a maior frente; decisão de
  02/08, plano em [`PLANS/03-MULTIPLAYER-4V4.md`](PLANS/03-MULTIPLAYER-4V4.md). É v3.
- **Dívidas do portão** ([`tools/eval/KNOWN-RED.json`](tools/eval/KNOWN-RED.json)) —
  13 críticas conhecidas que não reprovam o CI mas continuam devidas:
  enquadramento de viewmodel (VM1/3/9/12/16/18/19/20), antropometria do elenco
  (CHR1/3/4), CTF1. Quitar uma → remover da lista (o portão avisa).
- **Braços FP** — rig sem forma; padrão hoje é arma sozinha (`?hands=1` religa).
- **HUD mobile retrato** — o menu foi consertado (07/08); o HUD in-game em pé
  ainda é um amasso. Mobile continua "aviso + dá pra entrar".
- **Newsletter de verdade** — o funil: exportar `feedback where newsletter=true`,
  escolher provedor, primeira edição (capturas em `newsletter/`, fora do git).
- **Monetização** — doações + anúncios próprios + portais (CrazyGames/itch:
  `frame-ancestors` já liberado, falta o pacote de submissão).

## Plano do Bloco 1 — revisão de 07/08

O plano (T1–T3) está **aprovado no desenho** — asserção sempre (inclusive no
early-exit da sentinela), poda pós-build em vez de mover `public/`, clone
descartável como Vercel-símile. Três correções de fato, porque o repo mudou
embaixo dele em 07/08:

1. **`DECAL_FILES` não tem mais 174 entradas fixas**: são 174 estáticas + 12
   `or-*` via `push` (total 196 em runtime, e vai crescer). O assert de decals
   deve extrair a lista COMPLETA em runtime (import do módulo em node, não parse
   das linhas 535-712) e tratar as duas classes: `or-*` vêm do GIT (falta = clone
   quebrado), o resto vem do PACK (falta = fetch quebrado).
2. **A sentinela do `fetch-decals.sh` foi corrigida em 07/08** ("tem >0 PNG"
   passaria sempre num clone fresco, porque os `or-*` versionados já chegam com o
   clone — o pack nunca baixaria). Já conta só o acervo (`grep -cv '/or-'`). O
   assert do T1 continua necessário por cima disso.
3. **O piso de entradas do manifest de áudio (≥250)** precisa ser re-medido na
   execução com o método documentado no próprio script — o número do plano (306)
   foi medido com outro contador; a forma da medição importa mais que o valor.

## Como contribuir

Comece por [`CONTRIBUTING.md`](CONTRIBUTING.md) e pelas
[issues abertas](https://github.com/rubenmarcus/csbrasil/issues) — cada uma tem
arquivo, linha e critério de aceite. As de entrada estão espelhadas em
[`docs/issues/`](docs/issues/). Regras que não se negociam:
régua antes do conserto, mutação que prova a régua, nenhuma crítica verde vira
vermelha (`npm run check`), e comentário explica o *porquê*.
