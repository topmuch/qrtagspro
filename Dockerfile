FROM node:20-slim

# ────────────────────────────────────────────────────────────────────
# QRTagsPro — Dockerfile (NPM only, no bun)
# ⚠️ Coolify : si le build échoue avec "bun run build", c'est que
# vous utilisez un vieux cache. Videz le cache ou passez en Nixpacks.
# ────────────────────────────────────────────────────────────────────

# Installer sqlite3 + outils
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    sqlite3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 🔒 SUPPRIMER bun définitivement (empêche tout appel accidentel)
RUN rm -f /usr/local/bin/bun /usr/bin/bun /root/.bun/bin/bun 2>/dev/null; \
    command -v bun && rm -f "$(command -v bun)" 2>/dev/null; \
    true

# Vérifier que npm est bien disponible
RUN npm --version && node --version

WORKDIR /app

# Copier le code source
COPY . .

# Installer les dépendances avec npm (PAS bun)
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Générer le client Prisma
RUN npx prisma generate

# Build Next.js (standalone output) — utilise npm explicitement
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/tmp/build.db
RUN npx next build

# Supprimer les devDependencies pour réduire la taille
RUN npm prune --production

# Copier les fichiers nécessaires dans le standalone
RUN cp -r .next/static .next/standalone/.next/ && \
    cp -r public .next/standalone/public && \
    cp -r node_modules .next/standalone/node_modules && \
    cp -r prisma .next/standalone/prisma && \
    cp -r scripts .next/standalone/scripts && \
    cp package.json .next/standalone/package.json && \
    cp init-db.sh .next/standalone/init-db.sh

RUN mkdir -p /app/data

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrtags.db

WORKDIR /app/.next/standalone
CMD ["sh", "/app/init-db.sh"]
