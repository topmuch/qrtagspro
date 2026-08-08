/**
 * Seed script — Volet Touristique Géolocalisé
 * ============================================
 * Crée des données de test réalistes pour le volet touristique :
 *   - 1 hôtel de test (Hôtel Terrou-Bi, Dakar) avec coordonnées GPS réelles
 *   - 6 partenaires touristiques géolocalisés autour de l'hôtel
 *     (RESTAURANT, EXCURSION, HEALTH, SHOPPING, BEACH, ATTRACTION)
 *   - Met aussi à jour les coordonnées GPS des 4 hôtels du seed bracelets
 *
 * Run: npm run db:seed:tourism
 *
 * Idempotent : supprime les anciens partenaires de l'hôtel Terrou-Bi avant
 * de les recréer (via upsert sur l'agence + deleteMany sur HotelPartner).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Coordonnées GPS réelles approximatives (Dakar) ─────────────────────────
// Source : Google Maps (approximations)
const GPS = {
  terrouBi: { lat: 14.7167, lng: -17.4677 },
  baobabResort: { lat: 14.4444, lng: -16.9597 }, // Saly Portudal
  plateauBusiness: { lat: 14.6708, lng: -17.4383 }, // Dakar Plateau
  airportInn: { lat: 14.6708, lng: -17.0731 }, // Diass (AIBD)
  maisonAlmadies: { lat: 14.7497, lng: -17.5169 }, // Les Almadies
};

// ─── Partenaires touristiques autour du Terrou-Bi ───────────────────────────
const PARTNERS = [
  {
    name: 'Restaurant Le Ngor',
    category: 'RESTAURANT',
    description: 'Poisson braisé authentique et vue sur la mer.',
    latitude: 14.745,
    longitude: -17.515,
    rating: 4.8,
    promoCode: 'TERROU10',
    commission: 10,
  },
  {
    name: 'Île de Gorée (Départ)',
    category: 'EXCURSION',
    description: 'Visite historique incontournable. Départ de la jetée.',
    latitude: 14.6678,
    longitude: -17.3983,
    rating: 4.9,
    promoCode: null,
    commission: 15,
  },
  {
    name: 'Pharmacie des Almadies',
    category: 'HEALTH',
    description: 'Pharmacie de garde, ouverte 24h/24.',
    latitude: 14.73,
    longitude: -17.5,
    rating: 4.5,
    promoCode: null,
    commission: 0,
  },
  {
    name: 'Village Artisanal de Soumbédioune',
    category: 'SHOPPING',
    description: 'Artisanat sénégalais, sculptures et tissus.',
    latitude: 14.685,
    longitude: -17.45,
    rating: 4.6,
    promoCode: 'ARTISAN5',
    commission: 5,
  },
  {
    name: "Plage de N'Gor",
    category: 'BEACH',
    description: 'Plage calme, idéale pour la baignade et le surf.',
    latitude: 14.748,
    longitude: -17.518,
    rating: 4.7,
    promoCode: null,
    commission: 0,
  },
  {
    name: 'Musée Théodore Monod (IFAN)',
    category: 'ATTRACTION',
    description: "Musée fondamental de l'Afrique de l'Ouest.",
    latitude: 14.67,
    longitude: -17.43,
    rating: 4.4,
    promoCode: null,
    commission: 0,
  },
] as const;

async function main() {
  console.log('🌱 Seeding Volet Touristique Géolocalisé...\n');

  // ─── 0. Mise à jour des coordonnées GPS des 4 hôtels existants ────────────
  console.log('0. Mise à jour des coordonnées GPS des hôtels existants...');
  await prisma.agency.updateMany({
    where: { slug: 'baobab_beach_resort' },
    data: { latitude: GPS.baobabResort.lat, longitude: GPS.baobabResort.lng },
  });
  await prisma.agency.updateMany({
    where: { slug: 'le_plateau_business' },
    data: { latitude: GPS.plateauBusiness.lat, longitude: GPS.plateauBusiness.lng },
  });
  await prisma.agency.updateMany({
    where: { slug: 'airport_inn_dakar' },
    data: { latitude: GPS.airportInn.lat, longitude: GPS.airportInn.lng },
  });
  await prisma.agency.updateMany({
    where: { slug: 'maison_almadies' },
    data: { latitude: GPS.maisonAlmadies.lat, longitude: GPS.maisonAlmadies.lng },
  });
  console.log('   ✓ 4 hôtels existants géolocalisés\n');

  // ─── 1. Créer l'hôtel Terrou-Bi (test) ────────────────────────────────────
  console.log('1. Création de l\'hôtel Terrou-Bi (test)...');
  const terrouBi = await prisma.agency.upsert({
    where: { slug: 'hotel-terrou-bi-test' },
    update: {
      name: 'Hôtel Terrou-Bi',
      email: 'contact@terroubi-test.com',
      phone: '+221 33 839 90 90',
      contactPhone: '+221 77 839 90 90',
      address: 'Boulevard Martin Luther King, Dakar',
      agencyType: 'hotel',
      braceletProfile: 'RESORT',
      latitude: GPS.terrouBi.lat,
      longitude: GPS.terrouBi.lng,
      logoUrl: 'https://placehold.co/200x200/0F766E/FFFFFF/png?text=TERROU',
    },
    create: {
      id: 'demo-tourism-terroubi',
      name: 'Hôtel Terrou-Bi',
      slug: 'hotel-terrou-bi-test',
      email: 'contact@terroubi-test.com',
      phone: '+221 33 839 90 90',
      contactPhone: '+221 77 839 90 90',
      address: 'Boulevard Martin Luther King, Dakar',
      agencyType: 'hotel',
      braceletProfile: 'RESORT',
      latitude: GPS.terrouBi.lat,
      longitude: GPS.terrouBi.lng,
      logoUrl: 'https://placehold.co/200x200/0F766E/FFFFFF/png?text=TERROU',
    },
  });
  console.log(`   ✓ ${terrouBi.name} (lat: ${terrouBi.latitude}, lng: ${terrouBi.longitude})\n`);

  // ─── 2. Nettoyer les anciens partenaires de cet hôtel (idempotence) ───────
  console.log('2. Nettoyage des anciens partenaires du Terrou-Bi...');
  const deleted = await prisma.hotelPartner.deleteMany({
    where: { agencyId: terrouBi.id },
  });
  console.log(`   ✓ ${deleted.count} anciens partenaires supprimés\n`);

  // ─── 3. Créer les 6 partenaires touristiques ──────────────────────────────
  console.log('3. Création des 6 partenaires touristiques...');
  for (const p of PARTNERS) {
    const created = await prisma.hotelPartner.create({
      data: {
        ...p,
        agencyId: terrouBi.id,
      },
    });
    console.log(
      `   ✓ ${created.category.padEnd(11)} | ${created.name.padEnd(38)} | ` +
      `⭐ ${created.rating} | ${created.promoCode ? `code: ${created.promoCode}` : 'no promo'} | ` +
      `comm: ${created.commission}%`
    );
  }

  // ─── 4. Résumé ────────────────────────────────────────────────────────────
  const totalPartners = await prisma.hotelPartner.count();
  const totalGeolocated = await prisma.agency.count({
    where: { AND: [{ latitude: { not: null } }, { longitude: { not: null } }] },
  });

  console.log('\n─────────────────────────────────────────────────────');
  console.log('🎉 Seed touristique terminé !');
  console.log('─────────────────────────────────────────────────────');
  console.log(`   Hôtel test          : ${terrouBi.name} (slug: ${terrouBi.slug})`);
  console.log(`   Partenaires créés   : ${PARTNERS.length}`);
  console.log(`   Total HotelPartner  : ${totalPartners}`);
  console.log(`   Hôtels géolocalisés : ${totalGeolocated} (4 seed bracelets + Terrou-Bi)`);
  console.log('─────────────────────────────────────────────────────');
  console.log('\n📋 Catégories disponibles :');
  console.log('   RESTAURANT · ATTRACTION · BEACH · SHOPPING · HEALTH · TRANSPORT · EXCURSION');
  console.log('\n🧪 Test :');
  console.log(`   /welcome/${terrouBi.slug}?context=WRISTBAND → bracelet du Terrou-Bi`);
  console.log('   (Phase 2 affichera les partenaires triés par distance)');
}

main()
  .catch((e) => {
    console.error('❌ Seed touristique failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
