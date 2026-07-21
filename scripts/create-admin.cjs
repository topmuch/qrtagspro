/**
 * QRTagsPro — Création du superadmin au démarrage
 *
 * Ce script est appelé par le Dockerfile au démarrage du container.
 * Il crée le superadmin s'il n'existe pas, avec le mot de passe "admin123".
 *
 * Usage: node scripts/create-admin.cjs
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SUPERADMIN_EMAIL = 'admin@qrtags.com';
const SUPERADMIN_PASSWORD = 'admin123';
const SUPERADMIN_NAME = 'QRTagsPro SuperAdmin';

async function main() {
  console.log('══════════════════════════════════════════════════');
  console.log('  QRTagsPro — Création du superadmin');
  console.log('══════════════════════════════════════════════════');

  try {
    // Vérifier si le superadmin existe déjà
    const existing = await prisma.user.findUnique({
      where: { email: SUPERADMIN_EMAIL },
    });

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);

    if (existing) {
      // Mettre à jour le mot de passe et le rôle
      await prisma.user.update({
        where: { email: SUPERADMIN_EMAIL },
        data: {
          password: hashedPassword,
          role: 'superadmin',
          name: SUPERADMIN_NAME,
        },
      });
      console.log(`✅ Superadmin mis à jour: ${SUPERADMIN_EMAIL} (mot de passe: ${SUPERADMIN_PASSWORD})`);
    } else {
      // Créer le superadmin
      await prisma.user.create({
        data: {
          email: SUPERADMIN_EMAIL,
          name: SUPERADMIN_NAME,
          password: hashedPassword,
          role: 'superadmin',
        },
      });
      console.log(`✅ Superadmin créé: ${SUPERADMIN_EMAIL} (mot de passe: ${SUPERADMIN_PASSWORD})`);
    }
  } catch (error) {
    console.error('❌ Erreur création superadmin:', error.message);
    // Non-fatal — le serveur peut quand même démarrer
  } finally {
    await prisma.$disconnect();
  }
}

main();
