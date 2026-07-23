FROM node:20-slim

# Installer sqlite3 + outils nécessaires
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    sqlite3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# S'assurer qu'aucun runtime bun n'est utilisé
RUN rm -f /usr/local/bin/bun 2>/dev/null; true

WORKDIR /app

# Copier le code source
COPY . .

# Installer les dépendances (npm, PAS bun — problèmes pdf-lib/lightningcss/prisma)
RUN npm install --legacy-peer-deps --no-audit --no-fund
RUN npx prisma generate

# Build Next.js (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/tmp/build.db
RUN npm run build

# QRTagsPro: supprimer les devDependencies pour réduire la taille de l'image
RUN npm prune --production

# Copier les fichiers nécessaires dans le standalone
RUN cp -r .next/static .next/standalone/.next/ && \
    cp -r public .next/standalone/public && \
    cp -r node_modules .next/standalone/node_modules && \
    cp -r prisma .next/standalone/prisma && \
    cp -r scripts .next/standalone/scripts && \
    cp package.json .next/standalone/package.json

RUN mkdir -p /app/data

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrtags.db

WORKDIR /app/.next/standalone
CMD ["sh", "/app/init-db.sh"]
