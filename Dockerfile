FROM node:20-slim

# Installer les paquets requis
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    sqlite3 \
    ca-certificates \
    libc6 \
    && rm -rf /var/lib/apt/lists/*

# Supprimer bun
RUN rm -f /usr/local/bin/bun 2>/dev/null; true

WORKDIR /app

# Cloner le repository
RUN git clone https://github.com/topmuch/qrtagspro.git .

# Installer les dépendances avec npm (y compris devDependencies pour le build)
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Générer le client Prisma
RUN npx prisma generate

# Build Next.js avec webpack (Turbopack crashe dans Docker)
# NODE_OPTIONS augmente la mémoire (évite OOM)
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/tmp/build.db
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npx next build --webpack || (echo "=== BUILD FAILED ===" && cat /tmp/build-error.log 2>/dev/null && exit 1)

# Copier les fichiers statiques + prisma + scripts dans le standalone
RUN cp -r .next/static .next/standalone/.next/ 2>/dev/null || true && \
    cp -r public .next/standalone/public && \
    cp -r prisma .next/standalone/prisma && \
    cp -r scripts .next/standalone/scripts && \
    cp package.json .next/standalone/package.json

# Supprimer les devDependencies pour réduire la taille de l'image
RUN npm prune --production

# Recopier node_modules après prune (le standalone a besoin des deps prod)
RUN cp -r node_modules .next/standalone/node_modules

# Créer le répertoire data
RUN mkdir -p /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrtags-entreprise.db

WORKDIR /app/.next/standalone

CMD sh -c "mkdir -p /app/data && npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || true && exec node server.js"
