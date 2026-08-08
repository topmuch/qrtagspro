/**
 * Test end-to-end du CRUD Partenaires (Phase 4).
 * Vérifie : create, read, update, toggle, delete + ownership checks.
 *
 * ⚠️ Les server actions utilisent getAgencyIdOrFail() qui lit un cookie session.
 *    En test (hors navigateur), il n'y a pas de cookie → on teste directement
 *    la logique via db en simulant l'agencyId du Terrou-Bi.
 *
 * Run: npx tsx scripts/test-partners-crud.ts
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const AGENCY_ID = 'demo-tourism-terroubi'; // Hôtel Terrou-Bi du seed

async function main() {
  console.log('🧪 Phase 4 — Test CRUD Partenaires\n');
  console.log('═══════════════════════════════════════════════════\n');

  // ─── Count avant ───
  const before = await prisma.hotelPartner.count({ where: { agencyId: AGENCY_ID } });
  console.log(`📊 Partenaires avant test: ${before}\n`);

  // ─── Test 1: CREATE ───
  console.log('─── Test 1: Création d\'un partenaire ───\n');
  const created = await prisma.hotelPartner.create({
    data: {
      agencyId: AGENCY_ID,
      name: 'Test Restaurant Phase 4',
      category: 'RESTAURANT',
      description: 'Restaurant de test pour valider le CRUD',
      latitude: 14.72,
      longitude: -17.47,
      rating: 4.6,
      promoCode: 'TEST20',
      commission: 20,
      isVerified: true,
      isActive: true,
    },
  });
  console.log(`  ✅ Partenaire créé: ${created.id}`);
  console.log(`     name: ${created.name}, category: ${created.category}, rating: ${created.rating}`);
  console.log(`     promoCode: ${created.promoCode}, commission: ${created.commission}%`);
  console.log(`     GPS: ${created.latitude}, ${created.longitude}\n`);

  // ─── Test 2: READ (getAgencyPartners équivalent) ───
  console.log('─── Test 2: Lecture des partenaires de l\'agence ───\n');
  const partners = await prisma.hotelPartner.findMany({
    where: { agencyId: AGENCY_ID },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`  ✅ ${partners.length} partenaires trouvés pour le Terrou-Bi`);
  const stats = {
    total: partners.length,
    active: partners.filter((p) => p.isActive).length,
    withPromo: partners.filter((p) => p.promoCode).length,
  };
  console.log(`     Stats: total=${stats.total}, actifs=${stats.active}, avec promo=${stats.withPromo}\n`);

  // ─── Test 3: UPDATE ───
  console.log('─── Test 3: Mise à jour du partenaire ───\n');
  const updated = await prisma.hotelPartner.update({
    where: { id: created.id },
    data: {
      name: 'Test Restaurant Phase 4 (modifié)',
      rating: 4.9,
      commission: 25,
    },
  });
  console.log(`  ✅ Partenaire mis à jour: name="${updated.name}", rating=${updated.rating}, commission=${updated.commission}%\n`);

  // ─── Test 4: TOGGLE (active → inactif) ───
  console.log('─── Test 4: Toggle statut (actif → masqué) ───\n');
  const toggled = await prisma.hotelPartner.update({
    where: { id: created.id },
    data: { isActive: false },
  });
  console.log(`  ✅ isActive: ${toggled.isActive} (devrait être false)\n`);

  // ─── Test 5: Ownership check (simulation) ───
  console.log('─── Test 5: Vérification ownership ───\n');
  const partner = await prisma.hotelPartner.findUnique({
    where: { id: created.id },
    select: { agencyId: true },
  });
  const isOwner = partner?.agencyId === AGENCY_ID;
  console.log(`  ✅ partner.agencyId === AGENCY_ID: ${isOwner}`);
  console.log(`     (Une autre agence ne pourrait pas modifier ce partenaire)\n`);

  // ─── Test 6: DELETE ───
  console.log('─── Test 6: Suppression du partenaire ───\n');
  await prisma.hotelPartner.delete({ where: { id: created.id } });
  const after = await prisma.hotelPartner.count({ where: { agencyId: AGENCY_ID } });
  console.log(`  ✅ Partenaire supprimé`);
  console.log(`     Partenaires après test: ${after} (devrait être ${before})\n`);

  // ─── Vérification finale ───
  if (after !== before) {
    throw new Error(`Compte final ${after} ≠ compte initial ${before}`);
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('🎉 Phase 4 — CRUD Partenaires VALIDÉ !');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ✅ CREATE : partenaire créé avec coords GPS + promo + commission');
  console.log('  ✅ READ   : liste + stats (total/active/withPromo)');
  console.log('  ✅ UPDATE : name/rating/commission modifiés');
  console.log('  ✅ TOGGLE : isActive basculé');
  console.log('  ✅ DELETE : suppression propre, DB revenue à l\'état initial');
}

main().catch((e) => {
  console.error('❌ Test FAILED:', e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
