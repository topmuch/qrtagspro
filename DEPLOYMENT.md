# QRTagsPro — Guide de déploiement Coolify

## 🚀 Installation rapide (5 minutes)

### 1. Connecter le repo GitHub

1. Dans Coolify → **New Resource** → **Public Repository** (ou Private avec token)
2. Repository: `topmuch/qrtagspro`
3. Branch: `main`
4. Coolify détecte automatiquement `nixpacks.toml` et l'utilise pour le build

### 2. Configurer les variables d'environnement

Dans Coolify → **Environment Variables**, ajouter:

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
DATABASE_URL=file:/app/data/qrtags.db

NEXT_PUBLIC_BASE_URL=https://votre-domaine.com
NEXTAUTH_URL=https://votre-domaine.com
NEXTAUTH_SECRET=générer-avec-openssl-rand-base64-32
ENCRYPTION_KEY=générer-avec-openssl-rand-base64-32

CRON_SECRET=générer-une-chaine-aleatoire
CRON_BACKUP_ENABLED=true
CRON_BACKUP_SECRET=générer-une-chaine-aleatoire
```

### 3. Configurer le volume persistant

Dans Coolify → **Persistent Storage** (Volumes):

| Path | Description |
|------|-------------|
| `/app/data` | Base de données SQLite + backups |
| `/app/public/uploads` | Uploads (photos, etc.) |

### 4. Configurer le domaine

Dans Coolify → **Domains**:
- Ajouter votre domaine (ex: `qrtags.votre-domaine.com`)
- Coolify génère automatiquement le certificat SSL Let's Encrypt

### 5. Déployer

Cliquer **Deploy** — le build prend ~3-5 minutes:
1. `npm install` (installe les dépendances)
2. `npx prisma generate` (génère le client Prisma)
3. `npm run build` (build Next.js standalone)
4. Au démarrage: `prisma db push` + `migrate-qrtags-columns.cjs` + `node server.js`

### 6. Premier login

Après déploiement, aller sur `https://votre-domaine.com/login`:
- **Email**: `admin@qrtags.com`
- **Mot de passe**: `admin123`

⚠️ **Changer le mot de passe immédiatement** après la 1ère connexion !

---

## ⏰ Cron job (auto-checkout)

Le check-out automatique expire les QR dont la `departureDate` est dépassée.

### Option A — Coolify Scheduled Tasks

Dans Coolify → **Scheduled Tasks**:
- **Command**: `curl -X POST http://localhost:3000/api/cron/auto-checkout -H "Authorization: Bearer ${CRON_SECRET}"`
- **Frequency**: Every hour (`0 * * * *`)

### Option B — cron-job.org (gratuit)

1. Créer un compte sur [cron-job.org](https://cron-job.org)
2. Add cron job:
   - URL: `https://votre-domaine.com/api/cron/auto-checkout`
   - Method: POST
   - Headers: `Authorization: Bearer votre-cron-secret`
   - Schedule: Every hour

---

## 🏗️ Architecture

```
GitHub (topmuch/qrtagspro)
    ↓
Coolify (nixpacks build)
    ├── npm install
    ├── npx prisma generate
    ├── npm run build (Next.js standalone)
    └── Start cmd:
        ├── mkdir -p /app/data
        ├── npx prisma db push (crée/maj le schéma DB)
        ├── node scripts/migrate-qrtags-columns.cjs (backup migration)
        └── npm start (node .next/standalone/server.js)
    ↓
Container (node:20-slim + sqlite3)
    ├── /app/data/qrtags.db (SQLite, volume persistant)
    ├── /app/.next/standalone/server.js (Next.js)
    └── Port 3000
```

## 🗄️ Base de données

SQLite — fichier unique `/app/data/qrtags.db`.

### Backup manuel

```bash
curl -X POST https://votre-domaine.com/api/cron/backup-db \
  -H "Authorization: Bearer ${CRON_BACKUP_SECRET}"
```

### Reset complet (⚠️ supprime toutes les données)

Dans Coolify → **Exec** (terminal du container):
```bash
rm -f /app/data/qrtags.db /app/data/qrtags.db-journal
# Redémarrer le container → la DB est recréée from scratch
```

---

## 🔧 Dépannage

### Le build échoue avec "lightningcss"

→ Vérifier que `bun.lock` n'existe pas dans le repo. Il a été supprimé pour forcer npm.

### Erreur "trackingEnabled does not exist in DB"

→ Le script de migration n'a pas tourné. Vérifier les logs de démarrage.
Solution: dans Coolify → Exec:
```bash
node scripts/migrate-qrtags-columns.cjs
```

### Le superadmin ne peut pas se connecter

→ Vérifier que le hash bcrypt est correct. Le mot de passe par défaut est `admin123`.
Reset: dans Coolify → Exec:
```bash
sqlite3 /app/data/qrtags.db "UPDATE User SET password='\$2b\$10\$5JnNkrnAaKKWV6kw5Ya9X.yCPqhCi4qTEFTQ37fGRUIORU9nSx9Dq' WHERE email='admin@qrtags.com';"
```

### Les QR codes générés n'apparaissent pas

→ Vérifier que l'agence a bien un `agencyType` défini et que `customTypeId` est null (sauf pour les métiers custom).
