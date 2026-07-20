/**
 * QRTags — Superadmin creation script (CommonJS for Docker entrypoint)
 *
 * Creates a default superadmin user if none exists. Safe to run multiple
 * times (uses upsert). Called by docker-entrypoint.sh on container startup.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 QRTags — Vérification du compte superadmin...');

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@qrtags.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  // Check if any superadmin exists
  let existingAdmin = null;
  try {
    existingAdmin = await prisma.user.findFirst({
      where: { role: 'superadmin' },
    });
  } catch (e) {
    console.log('⚠️  Table User inaccessible:', e.message);
    console.log('   Tentative de création directe...');
  }

  if (existingAdmin) {
    console.log('✅ Superadmin déjà existant:', existingAdmin.email);
    // QRTags : s'assurer que le mot de passe est correct
    const isValid = await bcrypt.compare(adminPassword, existingAdmin.password || '');
    if (!isValid) {
      console.log('⚠️  Reset du mot de passe du superadmin...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { password: hashedPassword, role: 'superadmin' },
      });
      console.log('✅ Mot de passe reset:', adminEmail);
    }
    return;
  }

  // Create default superadmin (ou reset si existe avec un autre rôle)
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: 'superadmin',
      name: 'QRTags SuperAdmin',
    },
    create: {
      email: adminEmail,
      name: 'QRTags SuperAdmin',
      password: hashedPassword,
      role: 'superadmin',
    },
  });

  console.log(`✅ Superadmin créé: ${adminEmail} / ${adminPassword}`);

  // Vérification : lire le user pour confirmer
  const verify = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (verify) {
    const checkPassword = await bcrypt.compare(adminPassword, verify.password || '');
    console.log(`✅ Vérification: ${verify.email} | role: ${verify.role} | password OK: ${checkPassword}`);
  } else {
    console.log('⚠️  Vérification échouée: user non retrouvé après création');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur création admin:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
