# BOTBRAIN — rodar e treinar local

A rede dos bots aprende por **behavioral cloning**: grava pares (estado→ação), treina um
MLP que imita, e o bot passa a jogar pela rede. Dá pra rodar tudo na sua máquina, com ou
sem Docker, e sem montar Supabase.

## 1. Sem Docker (mais rápido — o jeito recomendado)

### Testar os bots neurais (modelo já vem treinado no repo)
```bash
npm run dev
# abra http://localhost:4321/?botbrain=1   → os bots são dirigidos pela rede
# sem ?botbrain=1 o jogo é o normal (roteirizado); a flag é isolada
```

### Treinar com o "professor" roteirizado (bootstrap — não precisa jogar)
```bash
npm i -D @tensorflow/tfjs-node          # nativa pesada, fica FORA das deps do projeto
npm run bot:record 60 all               # gera tools/eval/data/bootstrap.ndjson
npm run bot:train -- --epochs=40         # treina → public/models/bot-brain/
npm run bot:brain:check                  # régua: a rede é funcional? (verde/vermelho)
# recarregue http://localhost:4321/?botbrain=1 pra ver o modelo novo
```

### Treinar com VOCÊ jogando (o objetivo real: aprende do jogador)
```bash
npm run dev                              # sem SUPABASE_URL/KEY, o /api/train-frames
                                         # grava seus frames em tools/eval/data/collected.ndjson
# jogue algumas partidas em http://localhost:4321/  (coleta ligada por padrão nas config.)
npm run bot:train -- --epochs=40          # treina com bootstrap + SEUS frames juntos
```
> `bot:train` lê **todos** os `.ndjson` de `tools/eval/data/` por padrão — seus dados
> entram no treino sem passo extra. Quanto mais você joga, melhor a rede fica.

## 2. Com Docker

```bash
# jogar/coletar (o jogo roda no SEU navegador; o container só serve)
docker compose -f docker-compose.botbrain.yml up game
#   → http://localhost:4321/?botbrain=1

# treinar (instala o tfjs-node no container, gera o modelo no volume montado)
docker compose -f docker-compose.botbrain.yml run --rm train
#   → recarregue o jogo pra usar o modelo novo
```
> Em Apple Silicon o `tfjs-node` pode não ter binário prebuilt pro Linux ARM do container;
> se o `train` falhar na instalação, treine no host (seção 1) — o resultado é o mesmo.

## 3. Produção (Supabase) — coleta de muitos jogadores

O sink local é só de dev. Em produção, defina `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
e aplique `docs/db/bot_training_frames.sql`. Aí o `/api/train-frames` grava no banco e o
treino puxa com `npm run bot:train -- --from-supabase`.

## Como as peças se encaixam
| Arquivo | Papel |
|---|---|
| `public/js/botbrain/{features,sense,recorder,brain}.js` | features, percepção, gravação, inferência |
| `public/js/game.js` (`_updateBotNN`) | bot dirigido pela rede, atrás de `?botbrain=1` |
| `src/pages/api/train-frames.ts` | recebe frames (Supabase em prod, arquivo em dev) |
| `tools/eval/bot-record.mjs` | dataset bootstrap (professor roteirizado) |
| `tools/eval/bot-train.mjs` | treino do MLP (tfjs-node) → `public/models/bot-brain/` |
| `tools/eval/bot-brain-check.mjs` | régua: a rede é funcional e a régua mede a rede |
