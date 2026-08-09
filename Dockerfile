FROM node:20-slim

# ────────────────────────────────────────────────────────────────────
# QRTagsPro — Dockerfile (Debian-slim + NPM, PAS bun, PAS alpine)
# ⚠️ Alpine crashe avec lightningcss/TailwindCSS v4. Utiliser slim.
# ────────────────────────────────────────────────────────────────────

# Installer les paquets requis (apt = gestionnaire Debian)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    sqlite3 \
    ca-certificates \
    libc6 \
    && rm -rf /var/lib/apt/lists/*

# 🔒 Supprimer bun s'il existe
RUN rm -f /usr/local/bin/bun 2>/dev/null; true

WORKDIR /app

# Cloner le repository
RUN git clone https://github.com/topmuch/qrtagspro.git .

# Installer les dépendances avec npm
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Générer le client Prisma
RUN npx prisma generate

# Build Next.js — allouer plus de mémoire (évite OOM kill)
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/tmp/build.db
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# Supprimer les devDependencies
RUN npm prune --production

# Copier les fichiers critiques dans le standalone
RUN cp -r node_modules .next/standalone/node_modules && \
    cp -r prisma .next/standalone/prisma && \
    cp -r scripts .next/standalone/scripts && \
    cp -r public .next/standalone/public && \
    cp -r .next/static .next/standalone/.next/ && \
    cp package.json .next/standalone/package.json

# Créer le répertoire data
RUN mkdir -p /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrtags-entreprise.db

WORKDIR /app/.next/standalone

# Start command
CMD sh -c "mkdir -p /app/data && npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || true && exec node server.js"
