# syntax=docker/dockerfile:1
#
# A imagem da demonstracao (`compose.yaml`, `docs/DEMONSTRACAO.md`). Nao e a
# de producao: essa depende do alojamento, que esta por decidir.
#
# Uma imagem so, com as dependencias de desenvolvimento, porque a preparacao
# (`npm run demo:pecas`, `npm run admin`) corre scripts em TypeScript.

FROM node:22-bookworm-slim

ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir /app && chown node:node /app
WORKDIR /app
USER node

# O segredo `ca` so serve atras de um proxy com certificado proprio; sem ele
# nao faz nada.
COPY --chown=node:node package.json package-lock.json ./
RUN --mount=type=secret,id=ca,uid=1000 \
    if [ -s /run/secrets/ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/ca; fi; \
    npm ci --no-audit --no-fund

COPY --chown=node:node . .

# Fica escrito no codigo no build: e o endereco das ligacoes nos emails.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN --mount=type=secret,id=ca,uid=1000 \
    if [ -s /run/secrets/ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/ca; fi; \
    npm run build

# Onde ficam as fotografias carregadas pelo painel (`lib/imagens.ts`). Criada
# aqui, como `node`, para o volume do compose nascer com o dono certo.
RUN mkdir -p /app/dados/imagens

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
