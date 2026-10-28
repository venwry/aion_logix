# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; fi; \
    npm ci --omit=dev --strict-ssl=true && npm cache clean --force
COPY --chown=node:node . .
USER node
ENV NODE_ENV=production AION_BIND=0.0.0.0 PORT=10000
EXPOSE 10000
CMD ["node", "server/index.js"]
