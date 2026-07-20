#!/bin/sh
# ════════════════════════════════════════════════════════════════════
# QRTags — docker-entrypoint.sh (simplifié et robuste)
# ════════════════════════════════════════════════════════════════════

echo "══════════════════════════════════════════════════"
echo "  QRTags — Démarrage"
echo "  DATABASE_URL: ${DATABASE_URL:-file:/app/data/qrtags.db}"
echo "══════════════════════════════════════════════════"

mkdir -p /app/data /app/data/backups /app/public/uploads/damage

DB_FILE=$(echo "${DATABASE_URL:-file:/app/data/qrtags.db}" | sed 's/file//')

# 1. Hard reset DB si anciennes colonnes QRBags présentes
if [ -f "$DB_FILE" ]; then
  GHOST=$(sqlite3 "$DB_FILE" "PRAGMA table_info(Agency);" 2>/dev/null | grep -c "maxTags\|identificationMark\|itemBrand\|objectCategory")
  if [ "$GHOST" -gt 0 ]; then
    echo "🗑️  Anciennes colonnes QRBags détectées — suppression DB..."
    rm -f "$DB_FILE" "$DB_FILE-journal"
  fi
fi

# 2. Créer la DB from scratch
echo "📦 Création schéma DB..."
npx prisma db push --skip-generate 2>&1
echo "✅ Schéma DB créé"

# 3. Créer le superadmin via SQL DIRECT (hash bcrypt précalculé pour "admin123")
echo "👤 Création superadmin..."

# Hash bcrypt valide pour "admin123" (généré avec bcryptjs)
ADMIN_HASH='$2b$10$5JnNkrnAaKKWV6kw5Ya9X.yCPqhCi4qTEFTQ37fGRUIORU9nSx9Dq'

sqlite3 "$DB_FILE" "INSERT OR IGNORE INTO User (id, email, name, password, role, createdAt, updatedAt) VALUES ('admin-superadmin-001', 'admin@qrtags.com', 'QRTags SuperAdmin', '$ADMIN_HASH', 'superadmin', datetime('now'), datetime('now'));"
sqlite3 "$DB_FILE" "UPDATE User SET password='$ADMIN_HASH', role='superadmin' WHERE email='admin@qrtags.com';"

# Vérification
COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM User WHERE email='admin@qrtags.com' AND role='superadmin';" 2>/dev/null)
echo "✅ Superadmin en DB: $COUNT"

# 4. Démarrer le serveur
echo "🚀 Démarrage Next.js..."
exec node server.js
