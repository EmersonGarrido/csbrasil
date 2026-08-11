# BOTBRAIN — imagem para rodar o jogo (dev) e o treino da rede localmente.
# node:22 casa com a engine do projeto. Ferramentas de build entram só para o caso de o
# tfjs-node precisar compilar (o serviço `train` instala tfjs-node em runtime).
FROM node:22-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

# instala as deps do projeto a partir do lockfile (npm — o repo é npm-locked)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

COPY . .

EXPOSE 4321

# padrão: sobe o dev server acessível do host (o jogo roda no SEU navegador)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "4321"]
