FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    sqlite3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cloner le repo (indépendant du cache Coolify)
RUN git clone https://github.com/topmuch/qrtagspro.git .

# Nettoyer complètement node_modules et lock file pour éviter le bug "idealTree"
RUN rm -rf node_modules package-lock.json
RUN npm cache clean --force

# Installer les dépendances (tout est en dependencies, pas besoin de --include=dev)
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Générer le client Prisma
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/tmp/build.db
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TYPESCRIPT_CHECK=false
RUN npm run build

# Copier les fichiers dans le standalone
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
