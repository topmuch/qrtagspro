#!/bin/sh
# ════════════════════════════════════════════════════════════════════
# QRTags — init-db.sh (v5 — Debian-slim + prisma db push + migration Node)
# ════════════════════════════════════════════════════════════════════
set -e

echo "══════════════════════════════════════════════════"
echo "  QRTags — Démarrage"
echo "  DATABASE_URL: ${DATABASE_URL:-file:/app/data/qrtags.db}"
echo "══════════════════════════════════════════════════"

mkdir -p /app/data /app/data/backups /app/public/uploads/damage

DB_FILE=$(echo "${DATABASE_URL:-file:/app/data/qrtags.db}" | sed 's/^file://')
SCHEMA_PATH="/app/prisma/schema.prisma"

# ════════════════════════════════════════════════════════════════════
# ÉTAPE 1 : Vérifier si la DB a un schéma obsolète (hard reset si oui)
# ════════════════════════════════════════════════════════════════════
if [ -f "$DB_FILE" ]; then
  echo "📂 DB existante détectée — vérification schéma QRTags..."
  HAS_TRACKING=$(sqlite3 "$DB_FILE" "PRAGMA table_info(Baggage);" 2>/dev/null | grep -c "trackingToken" || echo "0")
  if [ "$HAS_TRACKING" = "0" ]; then
    echo "🚨 Schéma obsolète (pas de trackingToken) — HARD RESET..."
    rm -f "$DB_FILE" "$DB_FILE-journal" "$DB_FILE-wal" "$DB_FILE-shm"
  else
    echo "✅ Schéma QRTags OK"
  fi
fi

# ════════════════════════════════════════════════════════════════════
# ÉTAPE 2 : prisma db push (crée ou met à jour le schéma)
# Sur Debian-slim, le moteur Prisma (debian-openssl-3.0.x) fonctionne nativement
# ════════════════════════════════════════════════════════════════════
echo "📦 Application du schéma Prisma..."
PRISMA_BIN=""
for path in "/app/node_modules/.bin/prisma" "/app/.next/standalone/node_modules/.bin/prisma"; do
  if [ -x "$path" ]; then
    PRISMA_BIN="$path"
    break
  fi
done
if [ -z "$PRISMA_BIN" ]; then
  PRISMA_BIN="npx prisma"
fi
echo "  Using prisma: $PRISMA_BIN"

$PRISMA_BIN db push --schema="$SCHEMA_PATH" --skip-generate --accept-data-loss 2>&1 || {
  echo "⚠️ prisma db push failed — will rely on migration script"
}
echo "✅ Schéma DB appliqué"

# ════════════════════════════════════════════════════════════════════
# ÉTAPE 3 : Migration idempotente Node.js (backup — ajoute colonnes manquantes)
# ════════════════════════════════════════════════════════════════════
echo "🔧 Migration idempotente..."
MIGRATE_SCRIPT="/app/scripts/migrate-qrtags-columns.cjs"
if [ -f "$MIGRATE_SCRIPT" ]; then
  node "$MIGRATE_SCRIPT" 2>&1 || {
    echo "⚠️ Migration script failed"
  }
fi

# ════════════════════════════════════════════════════════════════════
# ÉTAPE 4 : Vérification finale
# ════════════════════════════════════════════════════════════════════
if [ -f "$DB_FILE" ]; then
  echo "📊 Vérification finale..."
  COL_COUNT=$(sqlite3 "$DB_FILE" "PRAGMA table_info(Baggage);" 2>/dev/null | grep -c "trackingToken\|trackingEnabled\|scanCount\|isLost\|customData" || echo "0")
  echo "  Colonnes QRTags: $COL_COUNT / 5"
  if [ "$COL_COUNT" -lt 5 ]; then
    echo "❌ Colonnes toujours manquantes après migration"
    echo "  Vérifie les logs ci-dessus pour le détail"
  fi
fi

# ════════════════════════════════════════════════════════════════════
# ÉTAPE 5 : Démarrer le serveur
# ════════════════════════════════════════════════════════════════════
echo "🚀 Démarrage Next.js..."
exec node server.js
