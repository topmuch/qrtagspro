# QRTagsPro - Dockerfile for Coolify
FROM node:20-slim

# Install required packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    git sqlite3 ca-certificates libc6 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone the repository
RUN git clone https://github.com/topmuch/qrtagspro.git .

# Install dependencies (force devDependencies for build despite NODE_ENV=production)
RUN npm install --legacy-peer-deps --no-audit --no-fund --include=dev

# Generate Prisma Client
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/tmp/build.db
RUN npm run build

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrtags-entreprise.db

# Start command
CMD sh -c "mkdir -p /app/data && npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || true && exec node .next/standalone/server.js"
