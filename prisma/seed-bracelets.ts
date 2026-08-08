/**
 * Seed script — Module Bracelets de Séjour Universel
 * =============================================
 * Crée des données de test réalistes pour le module Bracelets :
 *   - 1 hôtel resort de démo (Agency avec agencyType="hotel")
 *   - 3 commandes BraceletPackOrder (Standard 50, Brandé 100, Standard 500)
 *   - QR codes (Baggage, context=WRISTBAND) générés pour les commandes activées
 *   - ScanLogs simulés pour l'analytics
 *
 * Run: npx tsx prisma/seed-bracelets.ts
 *
 * Idempotent: efface uniquement les données du module bracelets (préfixe référence
 * "WRT" et orders avec un agencyId correspondant à l'hôtel de démo) avant de recréer.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Pricing grid (FCFA) — source de vérité partagée avec la page boutique ───
export const BRACELET_PACKS = [
  { quantity: 50, standardPrice: 45000, brandedPrice: 70000 },
  { quantity: 100, standardPrice: 85000, brandedPrice: 130000 },
  { quantity: 500, standardPrice: 400000, brandedPrice: 600000 },
] as const;

// ─── Génération de référence (réplique de src/lib/qr.ts) ───────────────────
// On ne peut pas importer src/lib/qr.ts ici car il dépend du runtime Next.js (db.ts).
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1
function generateRandomCode(length: number = 6): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}
async function generateUniqueWristbandRefs(count: number, existing: Set<string> = new Set()): Promise<string[]> {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = 'WRT'; // Wristband
  const unique = new Set<string>(existing);
  let iterations = 0;
  while (unique.size < count && iterations < 10) {
    const needed = count - unique.size;
    const candidates: string[] = [];
    for (let i = 0; i < needed; i++) {
      candidates.push(`${prefix}${year}-${generateRandomCode(6)}`);
    }
    const inDb = await prisma.baggage.findMany({
      where: { reference: { in: candidates } },
      select: { reference: true },
    });
    const taken = new Set(inDb.map((b) => b.reference));
    for (const c of candidates) {
      if (!taken.has(c) && !unique.has(c)) unique.add(c);
    }
    iterations++;
  }
  if (unique.size < count) {
    throw new Error(`Failed to generate ${count} unique wristband references`);
  }
  return Array.from(unique).slice(0, count);
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log('🌱 Seeding Bracelets Universel module (4 hotel profiles)...\n');

  // ─── 0. Cleanup (idempotent) ─────────────────────────────────────────────
  console.log('0. Cleaning previous bracelet seed data...');

  // Delete baggages with context=WRISTBAND first (cascade-safe: ScanLog/DamageReport cascade)
  const wristbandBaggages = await prisma.baggage.findMany({
    where: { context: 'WRISTBAND' },
    select: { id: true, braceletPackOrderId: true },
  });
  if (wristbandBaggages.length > 0) {
    await prisma.scanLog.deleteMany({
      where: { baggageId: { in: wristbandBaggages.map((b) => b.id) } },
    });
    await prisma.baggage.deleteMany({
      where: { id: { in: wristbandBaggages.map((b) => b.id) } },
    });
    console.log(`   Deleted ${wristbandBaggages.length} wristband baggages + their scan logs`);
  }

  // Delete bracelet orders for the demo resort
  const demoOrders = await prisma.braceletPackOrder.findMany({
    where: { customerEmail: { contains: 'resort-demo' } },
    select: { id: true },
  });
  if (demoOrders.length > 0) {
    await prisma.braceletPackOrder.deleteMany({
      where: { id: { in: demoOrders.map((o) => o.id) } },
    });
    console.log(`   Deleted ${demoOrders.length} previous bracelet orders`);
  }

  // ─── 1. Create demo hotels (4 types: RESORT, BUSINESS, TRANSIT, BOUTIQUE) ──
  console.log('\n1. Creating demo hotels (4 bracelet profiles)...');

  // 1a. RESORT — Baobab Beach Resort (Saly) — existe déjà, on update le braceletProfile
  const resort = await prisma.agency.upsert({
    where: { slug: 'baobab_beach_resort' },
    update: {
      name: 'Baobab Beach Resort',
      email: 'contact@baobabbeach.example',
      phone: '+221 33 800 00 00',
      contactPhone: '+221 77 800 00 00',
      address: 'Saly Portudal, Mbour, Sénégal',
      agencyType: 'hotel',
      braceletProfile: 'RESORT',
      logoUrl: 'https://placehold.co/200x200/0F766E/FFFFFF/png?text=BAOBAB',
    },
    create: {
      id: 'demo-resort-baobab',
      name: 'Baobab Beach Resort',
      slug: 'baobab_beach_resort',
      email: 'contact@baobabbeach.example',
      phone: '+221 33 800 00 00',
      contactPhone: '+221 77 800 00 00',
      address: 'Saly Portudal, Mbour, Sénégal',
      agencyType: 'hotel',
      braceletProfile: 'RESORT',
      logoUrl: 'https://placehold.co/200x200/0F766E/FFFFFF/png?text=BAOBAB',
    },
  });
  console.log(`   ✓ RESORT: ${resort.name} (slug: ${resort.slug})`);

  // 1b. BUSINESS — Hôtel Le Plateau (Dakar) — hôtel d'affaires
  const business = await prisma.agency.upsert({
    where: { slug: 'le_plateau_business' },
    update: {
      name: 'Hôtel Le Plateau',
      email: 'contact@leplateau.example',
      phone: '+221 33 821 00 00',
      contactPhone: '+221 77 821 00 00',
      address: 'Avenue Léopold S. Senghor, Dakar Plateau',
      agencyType: 'hotel',
      braceletProfile: 'BUSINESS',
      logoUrl: 'https://placehold.co/200x200/1E40AF/FFFFFF/png?text=PLATEAU',
    },
    create: {
      id: 'demo-business-plateau',
      name: 'Hôtel Le Plateau',
      slug: 'le_plateau_business',
      email: 'contact@leplateau.example',
      phone: '+221 33 821 00 00',
      contactPhone: '+221 77 821 00 00',
      address: 'Avenue Léopold S. Senghor, Dakar Plateau',
      agencyType: 'hotel',
      braceletProfile: 'BUSINESS',
      logoUrl: 'https://placehold.co/200x200/1E40AF/FFFFFF/png?text=PLATEAU',
    },
  });
  console.log(`   ✓ BUSINESS: ${business.name} (slug: ${business.slug})`);

  // 1c. TRANSIT — Airport Inn Dakar (Aéroport Blaise Diagne)
  const transit = await prisma.agency.upsert({
    where: { slug: 'airport_inn_dakar' },
    update: {
      name: 'Airport Inn Dakar',
      email: 'contact@airportinn.example',
      phone: '+221 33 836 00 00',
      contactPhone: '+221 77 836 00 00',
      address: 'Aéroport International Blaise Diagne, Diass',
      agencyType: 'hotel',
      braceletProfile: 'TRANSIT',
      logoUrl: 'https://placehold.co/200x200/7C3AED/FFFFFF/png?text=AIRPORT',
    },
    create: {
      id: 'demo-transit-airport',
      name: 'Airport Inn Dakar',
      slug: 'airport_inn_dakar',
      email: 'contact@airportinn.example',
      phone: '+221 33 836 00 00',
      contactPhone: '+221 77 836 00 00',
      address: 'Aéroport International Blaise Diagne, Diass',
      agencyType: 'hotel',
      braceletProfile: 'TRANSIT',
      logoUrl: 'https://placehold.co/200x200/7C3AED/FFFFFF/png?text=AIRPORT',
    },
  });
  console.log(`   ✓ TRANSIT: ${transit.name} (slug: ${transit.slug})`);

  // 1d. BOUTIQUE — Maison Almadies (maison d'hôtes)
  const boutique = await prisma.agency.upsert({
    where: { slug: 'maison_almadies' },
    update: {
      name: 'Maison Almadies',
      email: 'contact@maisonalmadies.example',
      phone: '+221 33 820 50 50',
      contactPhone: '+221 77 820 50 50',
      address: 'Route des Almadies, Dakar',
      agencyType: 'hotel',
      braceletProfile: 'BOUTIQUE',
      logoUrl: 'https://placehold.co/200x200/B45309/FFFFFF/png?text=MAISON',
    },
    create: {
      id: 'demo-boutique-almadies',
      name: 'Maison Almadies',
      slug: 'maison_almadies',
      email: 'contact@maisonalmadies.example',
      phone: '+221 33 820 50 50',
      contactPhone: '+221 77 820 50 50',
      address: 'Route des Almadies, Dakar',
      agencyType: 'hotel',
      braceletProfile: 'BOUTIQUE',
      logoUrl: 'https://placehold.co/200x200/B45309/FFFFFF/png?text=MAISON',
    },
  });
  console.log(`   ✓ BOUTIQUE: ${boutique.name} (slug: ${boutique.slug})`);

  // ─── 2. Order #1 — Standard pack of 50, DELIVERED with 50 QR codes activated ─
  console.log('\n2. Creating Order #1 — Standard 50 (delivered, fully activated)...');
  const pack1 = BRACELET_PACKS[0];
  const order1 = await prisma.braceletPackOrder.create({
    data: {
      agencyId: resort.id,
      quantity: pack1.quantity,
      isBranded: false,
      unitPrice: pack1.standardPrice / pack1.quantity,
      totalPrice: pack1.standardPrice,
      status: 'DELIVERED',
      maquetteStatus: 'VALIDATED',
      maquetteValidatedAt: daysAgo(20),
      customerName: 'Aïssatou Diop',
      customerPhone: '+221 77 123 45 67',
      customerEmail: 'aissatou.diop@resort-demo.example',
      deliveryCity: 'Dakar',
      deliveryQuartier: 'Almadies',
      deliveryAddress: 'Route de l\'Aéroport, Dakar',
      paymentMethod: 'wave',
      paymentStatus: 'PAID',
      paymentReference: 'WV-DEMO-0001',
      trackingNumber: 'SD-TRACK-001',
      shippedAt: daysAgo(15),
      deliveredAt: daysAgo(12),
      activatedAt: daysAgo(12),
      activatedCount: pack1.quantity,
      notes: 'Commande de test — pack Standard livré et activé',
      createdAt: daysAgo(22),
    },
  });

  // Generate 50 wristband Baggage records
  const refs1 = await generateUniqueWristbandRefs(pack1.quantity);
  await prisma.baggage.createMany({
    data: refs1.map((reference) => ({
      reference,
      type: 'voyageur',
      agencyId: resort.id,
      baggageType: 'cabine',
      status: 'active',
      context: 'WRISTBAND',
      braceletPackOrderId: order1.id,
      expiresAt: daysFromNow(180), // 6 months validity
      createdAt: daysAgo(12),
    })),
  });
  console.log(`   ✓ Order ${order1.id} — ${pack1.quantity} wristband QR codes generated`);

  // Simulate scans on ~70% of the activated wristbands (analytics)
  const wristbands1 = await prisma.baggage.findMany({
    where: { braceletPackOrderId: order1.id },
    select: { id: true },
  });
  const scannedBaggages = wristbands1.filter(() => Math.random() < 0.7);
  const scanContexts = ['pool', 'restaurant', 'bar', 'spa', 'lobby'];
  for (const w of scannedBaggages) {
    const scanCount = Math.floor(Math.random() * 8) + 1;
    for (let i = 0; i < scanCount; i++) {
      await prisma.scanLog.create({
        data: {
          baggageId: w.id,
          ipAddress: '41.82.0.0',
          country: 'Senegal',
          city: 'Dakar',
          location: pick(scanContexts),
          context: 'static_location',
          createdAt: daysAgo(Math.floor(Math.random() * 11)),
        },
      });
    }
  }
  console.log(`   ✓ Simulated scans on ${scannedBaggages.length} wristbands`);

  // ─── 3. Order #2 — Branded pack of 100, PRODUCING (maquette validated, QR not yet activated) ─
  console.log('\n3. Creating Order #2 — Brandé 100 (in production, maquette validated)...');
  const pack2 = BRACELET_PACKS[1];
  const order2 = await prisma.braceletPackOrder.create({
    data: {
      agencyId: resort.id,
      quantity: pack2.quantity,
      isBranded: true,
      unitPrice: pack2.brandedPrice / pack2.quantity,
      totalPrice: pack2.brandedPrice,
      status: 'PRODUCING',
      maquetteStatus: 'VALIDATED',
      maquetteUrl: 'https://placehold.co/600x400/0F766E/FFFFFF/png?text=Maquette+Baobab',
      maquetteValidatedAt: daysAgo(3),
      logoUrl: 'https://placehold.co/200x200/0F766E/FFFFFF/png?text=BAOBAB',
      brandText: 'Baobab Beach Resort — Séjour Resort',
      brandColors: JSON.stringify({ primary: '#0F766E', secondary: '#F59E0B' }),
      customerName: 'Aïssatou Diop',
      customerPhone: '+221 77 123 45 67',
      customerEmail: 'aissatou.diop@resort-demo.example',
      deliveryCity: 'Dakar',
      deliveryQuartier: 'Almadies',
      deliveryAddress: 'Route de l\'Aéroport, Dakar',
      paymentMethod: 'orange_money',
      paymentStatus: 'PAID',
      paymentReference: 'OM-DEMO-0002',
      notes: 'Commande brandée — maquette validée, en production',
      createdAt: daysAgo(7),
    },
  });
  console.log(`   ✓ Order ${order2.id} — branded, maquette validated, awaiting production`);

  // ─── 4. Order #3 — Walk-in client (no agency), Standard pack of 500, PENDING ─
  console.log('\n4. Creating Order #3 — Standard 500 (walk-in, pending payment)...');
  const pack3 = BRACELET_PACKS[2];
  const order3 = await prisma.braceletPackOrder.create({
    data: {
      agencyId: null, // walk-in client, no agency account
      quantity: pack3.quantity,
      isBranded: false,
      unitPrice: pack3.standardPrice / pack3.quantity,
      totalPrice: pack3.standardPrice,
      status: 'PENDING',
      maquetteStatus: 'PENDING',
      customerName: 'Mamadou Sy',
      customerPhone: '+221 70 987 65 43',
      customerEmail: 'mamadou.sy@resort-demo.example',
      deliveryCity: 'Saly',
      deliveryQuartier: 'Centre',
      deliveryAddress: 'Hôtel Le Lamantin, Saly',
      paymentMethod: 'cash_on_delivery',
      paymentStatus: 'PENDING',
      notes: 'Commande walk-in — paiement à la livraison',
      createdAt: daysAgo(1),
    },
  });
  console.log(`   ✓ Order ${order3.id} — walk-in, pending`);

  // ─── 5. Summary ──────────────────────────────────────────────────────────
  const totalOrders = await prisma.braceletPackOrder.count();
  const totalWristbands = await prisma.baggage.count({ where: { context: 'WRISTBAND' } });
  const totalScans = await prisma.scanLog.count({
    where: { baggage: { context: 'WRISTBAND' } },
  });

  console.log('\n─────────────────────────────────────────────────────');
  console.log('🎉 Bracelet seed completed!');
  console.log('─────────────────────────────────────────────────────');
  console.log('   Demo hotels (4 bracelet profiles):');
  console.log(`     • RESORT   : ${resort.name}        → /welcome/${resort.slug}?context=WRISTBAND`);
  console.log(`     • BUSINESS : ${business.name}    → /welcome/${business.slug}?context=WRISTBAND`);
  console.log(`     • TRANSIT  : ${transit.name}        → /welcome/${transit.slug}?context=WRISTBAND`);
  console.log(`     • BOUTIQUE : ${boutique.name}        → /welcome/${boutique.slug}?context=WRISTBAND`);
  console.log(`   Orders       :  ${totalOrders}`);
  console.log(`     #1 Standard 50  → DELIVERED, ${pack1.quantity} QR codes activated`);
  console.log(`     #2 Brandé 100   → PRODUCING (maquette validated)`);
  console.log(`     #3 Standard 500 → PENDING (walk-in, cash on delivery)`);
  console.log(`   Wristbands   :  ${totalWristbands} Baggage records (context=WRISTBAND)`);
  console.log(`   Scan logs    :  ${totalScans} simulated scans`);
  console.log('─────────────────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Bracelet seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
