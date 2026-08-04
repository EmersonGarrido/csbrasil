# Documentação — índice e ordem de leitura

Este diretório existe porque a raiz tinha **18 arquivos `.md`** sem hierarquia
nenhuma, e um dev novo (ou um agente) não sabia por onde entrar. Agora tem
ordem.

---

## Ordem de leitura

### 1. Chegando agora (15 minutos)

| # | Arquivo | Por quê |
|---|---|---|
| 1 | [`../STATUS.md`](../STATUS.md) | **Comece aqui.** O estado de hoje, em ≤100 linhas: o que existe, o que está aberto, qual é a régua. |
| 2 | [`../README.md`](../README.md) | O que é o projeto, como rodar, onde fica cada coisa. |
| 3 | [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | Como abrir um PR que passa. |
| 4 | [`issues/`](issues/) | 15 tarefas boas pra primeira contribuição, cada uma com arquivos e critério de aceite. |

### 2. Vai mexer no JOGO (`public/js/`)

| # | Arquivo | Por quê |
|---|---|---|
| 5 | [`../tools/eval/ARCH.md`](../tools/eval/ARCH.md) | **Índice por linha e tabela de conflito.** É GERADO (`npm run arch`) — nunca edite o bloco entre os marcadores. Leia antes de tocar em `game.js`. |
| 6 | [`../tools/eval/BAR-CONSISTENCIA.md`](../tools/eval/BAR-CONSISTENCIA.md) | A régua vigente: 25 critérios de consistência e flow. **Tem precedência** sobre a `BAR.md`. |
| 7 | [`../tools/eval/BAR.md`](../tools/eval/BAR.md) | A régua de fidelidade visual. Consulta, não leitura obrigatória. |
| 8 | [`../tools/eval/README.md`](../tools/eval/README.md) | Catálogo do arnês: o que cada script mede, e quais estão obsoletos. |

### 3. Vai mexer no SITE ou no BANCO

| # | Arquivo | Por quê |
|---|---|---|
| 9 | [`seguranca.md`](seguranca.md) | O que foi fechado no pré-release, onde estava e como testar. Leia antes de mexer em `/api/*` ou em `supabase/`. |
| 10 | [`../supabase/README.md`](../supabase/README.md) | Como aplicar as migrations. |
| 11 | [`../supabase/opcional/OFUSCACAO-README.md`](../supabase/opcional/OFUSCACAO-README.md) | A ofuscação de schema entregue pronta e **não aplicada**. |

### 4. Contexto e direção

| Arquivo | O que é |
|---|---|
| [`ROADMAP.md`](ROADMAP.md) | Para onde o projeto vai. |
| [`IDEAS.md`](IDEAS.md) | Ideias soltas, não priorizadas. Bom lugar pra achar o que fazer. |
| [`QUALITY.md`](QUALITY.md) | Critérios de qualidade do produto. |
| [`TRIBOS-URBANAS.md`](TRIBOS-URBANAS.md) | O documento de design da facção Tribos Urbanas. |
| [`ASSETS-PROMPTS.md`](ASSETS-PROMPTS.md) | Prompts usados pra gerar os assets 3D (Mint/Tripo). Pipeline de asset. |
| [`../CHANGELOG.md`](../CHANGELOG.md) | O que mudou, versão por versão. Também renderizado em `/changelog`. |
| [`../SECURITY.md`](../SECURITY.md) | Política de reporte de vulnerabilidade. |

### 5. Histórico ([`historico/`](historico/))

Nada aqui descreve o estado atual. São documentos que **já foram** o estado
atual, guardados porque explicam *por que* as coisas são como são.

| Arquivo | O que era |
|---|---|
| `HANDOFF-KIMI.md` | 84 KB de log append-only de 28 sessões. Foi substituído pelo `STATUS.md`. Ainda é a melhor fonte sobre a causa raiz de decisões antigas. |
| `HANDOFF-CLAUDE-CODE.md` | Handoff de uma sessão específica. Cita arquivos e branches que não existem mais. |
| `PROMPT.md` | O prompt único que gerou a primeira versão do jogo. Valor histórico e de marketing. |
| `PROMPT-SPECS.md`, `PROMPT-ANALISE.md` | Especificações derivadas do prompt original. |
| `RELATORIO-ANALISE.md` | Auditoria de uma rodada antiga. |
| `BOOTSTRAP-STUDIO.md`, `STUDIO_CONSTITUTION.md` | Descrevem um `studio/` em Python que **nunca existiu neste repo**; só sobrou `tools/studio.mjs`. |
| `TESTE-5MIN.md` | Roteiro de 8 perguntas de teste manual usado numa rodada. |

---

## Convenções

- **Português.** Código, comentário, commit e doc.
- **Um lugar por informação.** Se um número aparece em dois arquivos, um dos
  dois está errado — e vai continuar errado. Prefira apontar para a fonte.
- **Doc que envelhece vai pro `historico/`,** não fica na raiz esperando alguém
  perceber que está mentindo.
- **`arquivo:linha`** em qualquer afirmação sobre código.
