# QRTags — Déploiement sur Coolify

Guide complet pour déployer QRTags sur un serveur Coolify.

---

## 📋 Prérequis

- Un serveur Coolify opérationnel (v4.x recommandé)
- Un compte GitHub avec accès au repo `topmuch/qrtagsori`
- Un nom de domaine pointé vers Coolify (optionnel — Coolify fournit aussi un sous-domaine `.coolify.app`)

---

## 🚀 Déploiement en 5 étapes

### 1. Créer un nouveau projet Coolify

Dans le dashboard Coolify :
1. Cliquez sur **+ New Project**
2. Nommez-le `QRTags`
3. Cliquez sur **Add New Resource** → **Docker Compose based**

### 2. Connecter le repo GitHub

1. Sélectionnez **Private repository** (ou Public) 
2. Repository : `topmuch/qrtagsori`
3. Branch : `main`
4. Coolify détecte automatiquement le `docker-compose.yml` à la racine

### 3. Configurer les variables d'environnement

Dans l'onglet **Environment Variables** de votre service Coolify, ajoutez (au minimum) :

```env
# URLs publiques (remplacez par votre domaine Coolify)
NEXT_PUBLIC_BASE_URL=https://qrtags.votre-domaine.com
NEXT_PUBLIC_APP_URL=https://qrtags.votre-domaine.com
NEXTAUTH_URL=https://qrtags.votre-domaine.com

# Secrets (générez avec : openssl rand -base64 32)
NEXTAUTH_SECRET=<votre-secret-32-caracteres>
ENCRYPTION_KEY=<votre-cle-32-caracteres>

# Superadmin par défaut
ADMIN_EMAIL=admin@qrtags.com
ADMIN_PASSWORD=<un-mot-de-passe-fort>

# Cron backup
CRON_BACKUP_SECRET=<votre-secret-cron>
```

> 💡 **Tip** : Coolify peut générer automatiquement des secrets aléatoires via le bouton "Generate" à côté de chaque variable.

### 4. Configurer le volume persistant

Coolify monte automatiquement les volumes déclarés dans `docker-compose.yml` :
- `qrtags_data` → `/app/data` (base SQLite + backups)
- `qrtags_uploads` → `/app/public/uploads` (photos de dommages, etc.)

Aucune action supplémentaire requise.

### 5. Déployer

Cliquez sur **Deploy**. Le build prend environ **3-5 minutes** (build Next.js standalone + Prisma generate + optimisations).

À la fin du build, Coolify démarre le container et exécute automatiquement :
1. `prisma db push` (crée/migre la base SQLite)
2. `create-admin.cjs` (crée le superadmin si DB vide)
3. `node server.js` (serveur Next.js sur le port 3000)

---

## ✅ Vérification post-déploiement

1. Visitez `https://qrtags.votre-domaine.com` → la landing QRTags s'affiche
2. Visitez `https://qrtags.votre-domaine.com/admin/connexion` → connectez-vous avec `admin@qrtags.com` / `<ADMIN_PASSWORD>`
3. Le dashboard Superadmin s'affiche avec la charte noir/jaune moutarde

---

## 🔧 Configuration avancée

### Variables optionnelles

| Variable | Description | Défaut |
|---|---|---|
| `GROQ_API_KEY` | Active l'IA (traduction, détection fraude) | (vide) |
| `AVIATIONSTACK_API_KEY` | Suivi de vols (legacy QRBags) | (vide) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Notifications push PWA | (vide) |
| `VAPID_PRIVATE_KEY` | Notifications push PWA (privé) | (vide) |
| `PAYPAL_CLIENT_ID` | Paiement PayPal pour les tags | (vide) |
| `PAYPAL_CLIENT_SECRET` | Paiement PayPal (secret) | (vide) |

### Backup automatique

Le cron de backup tourne toutes les heures via l'API `/api/cron/backup-db`. Pour l'activer :

1. Définissez `CRON_BACKUP_SECRET` dans les variables Coolify
2. Configurez un cron externe (ou Coolify Cron Jobs) :
   ```
   0 * * * * curl -s -H "Authorization: Bearer <CRON_BACKUP_SECRET>" https://qrtags.votre-domaine.com/api/cron/backup-db
   ```

Les backups sont stockés dans `/app/data/backups/` (volume persistant).

---

## 🛠️ Dépannage

### Le container ne démarre pas

Vérifiez les logs Coolify :
```bash
docker logs qrtags --tail 50
```

Causes fréquentes :
- `NEXTAUTH_SECRET` ou `ENCRYPTION_KEY` manquants → ajoutez-les dans Coolify
- `DATABASE_URL` mal formaté → doit être `file:/app/data/qrtags.db`

### Erreur "Prisma can't reach database"

Le volume persistant n'est pas monté. Vérifiez que Coolify a bien créé les volumes `qrtags_data` et `qrtags_uploads`.

### Le build échoue avec "nodemailer peer dep"

C'est normal — le `--legacy-peer-deps` est géré dans le Dockerfile (étape `deps`). Si vous build hors Docker, utilisez :
```bash
npm install --legacy-peer-deps
```

### Oubli du mot de passe admin

1. Arrêtez le container : `docker stop qrtags`
2. Supprimez la DB : `docker exec qrtags rm /app/data/qrtags.db` (⚠️ perte de données)
3. Redémarrez : `docker start qrtags`
4. Le superadmin par défaut sera recréé

---

## 📦 Stack technique

- **Next.js 16** (Turbopack, standalone build)
- **Prisma 6** + SQLite
- **TypeScript 5**
- **Tailwind CSS 4** + shadcn/ui
- **Node 20 Alpine**
- **Multi-stage Docker** (deps → build → runtime)
- **Tini** comme init system (gestion propre des signaux)

---

## 🔄 Mise à jour

Pour déployer une nouvelle version :
1. Poussez sur `topmuch/qrtagsori` main
2. Coolify redéploie automatiquement (si "Auto-deploy" activé)
3. Sinon, cliquez sur **Redeploy** dans Coolify

Le schéma Prisma est synchronisé à chaque démarrage (`prisma db push`), donc les migrations sont automatiques.

---

## 📞 Support

- Issues : https://github.com/topmuch/qrtagsori/issues
- Repo : https://github.com/topmuch/qrtagsori
