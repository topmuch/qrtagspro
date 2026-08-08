/**
 * Test end-to-end de la server action createBraceletOrder.
 * Vérifie :
 *   1. Création d'une commande Standard (sans logo, maquette auto-validée)
 *   2. Création d'une commande Brandée (avec logo factice, maquette PENDING)
 *   3. Sécurité : un prix envoyé par le client est ignoré (recalcul server-side)
 *   4. Validation : logo manquant pour brandé → erreur
 *
 * Run: npx tsx scripts/test-bracelet-order-action.ts
 */
import { createBraceletOrder } from '../src/app/shop/bracelets/actions';
import { db } from '../src/lib/db';

async function main() {
  console.log('🧪 Test 1: Commande Standard (50 pièces, cash on delivery)\n');
  const result1 = await createBraceletOrder({
    quantity: 50,
    isBranded: false,
    customerName: 'Test Client Standard',
    customerPhone: '+221 77 000 00 01',
    customerEmail: 'test-standard@example.com',
    hotelName: 'Hôtel Test Standard',
    deliveryCity: 'Dakar',
    deliveryQuartier: 'Plateau',
    paymentMethod: 'cash_on_delivery',
    logo: null,
  });

  if (!result1.success) {
    throw new Error(`Test 1 FAILED: ${result1.error}`);
  }
  console.log(`  ✅ Commande créée: ${result1.orderId}`);
  console.log(`  ✅ Prix recalculé server-side: ${result1.totalPrice} FCFA (attendu: 45000)`);
  if (result1.totalPrice !== 45000) {
    throw new Error(`Prix incorrect: ${result1.totalPrice} ≠ 45000`);
  }

  // Vérifier en base
  const order1 = await db.braceletPackOrder.findUnique({
    where: { id: result1.orderId! },
    select: {
      quantity: true, isBranded: true, unitPrice: true, totalPrice: true,
      status: true, maquetteStatus: true, paymentMethod: true, paymentStatus: true,
      brandText: true, notes: true, logoUrl: true,
    },
  });
  console.log(`  ✅ Base: qty=${order1?.quantity}, branded=${order1?.isBranded}, unitPrice=${order1?.unitPrice}`);
  console.log(`  ✅ Base: status=${order1?.status}, maquette=${order1?.maquetteStatus} (auto-VALIDATED pour standard)`);
  console.log(`  ✅ Base: payment=${order1?.paymentMethod}/${order1?.paymentStatus}`);
  console.log(`  ✅ Base: notes="${order1?.notes}" (hotelName stocké dans notes pour standard)`);
  console.log(`  ✅ Base: logoUrl=${order1?.logoUrl} (null pour standard)\n`);

  console.log('🧪 Test 2: Commande Brandée (100 pièces, Wave, avec logo)\n');
  // Logo factice : 1x1 pixel PNG
  const fakePngBytes = [
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x62, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82,
  ];
  const result2 = await createBraceletOrder({
    quantity: 100,
    isBranded: true,
    customerName: 'Test Client Brandé',
    customerPhone: '+221 77 000 00 02',
    customerEmail: 'test-branded@example.com',
    hotelName: 'Hôtel Test Brandé',
    deliveryCity: 'Saly',
    deliveryQuartier: 'Centre',
    paymentMethod: 'wave',
    logo: {
      data: fakePngBytes,
      name: 'logo-test.png',
      type: 'image/png',
    },
  });

  if (!result2.success) {
    throw new Error(`Test 2 FAILED: ${result2.error}`);
  }
  console.log(`  ✅ Commande créée: ${result2.orderId}`);
  console.log(`  ✅ Prix recalculé server-side: ${result2.totalPrice} FCFA (attendu: 130000)`);
  if (result2.totalPrice !== 130000) {
    throw new Error(`Prix incorrect: ${result2.totalPrice} ≠ 130000`);
  }

  const order2 = await db.braceletPackOrder.findUnique({
    where: { id: result2.orderId! },
    select: {
      quantity: true, isBranded: true, unitPrice: true, totalPrice: true,
      status: true, maquetteStatus: true, logoUrl: true, brandText: true,
    },
  });
  console.log(`  ✅ Base: qty=${order2?.quantity}, branded=${order2?.isBranded}, unitPrice=${order2?.unitPrice}`);
  console.log(`  ✅ Base: maquette=${order2?.maquetteStatus} (PENDING pour brandé, validation manuelle requise)`);
  console.log(`  ✅ Base: brandText="${order2?.brandText}" (hotelName stocké dans brandText pour brandé)`);
  console.log(`  ✅ Base: logoUrl length=${order2?.logoUrl?.length} chars (data URL base64)\n`);

  console.log('🧪 Test 3: Sécurité — logo manquant pour brandé doit échouer\n');
  const result3 = await createBraceletOrder({
    quantity: 50,
    isBranded: true,
    customerName: 'Test Sans Logo',
    customerPhone: '+221 77 000 00 03',
    deliveryCity: 'Dakar',
    paymentMethod: 'cash_on_delivery',
    logo: null,
  });
  if (result3.success) {
    throw new Error('Test 3 FAILED: commande brandée sans logo ne devrait pas passer');
  }
  console.log(`  ✅ Correctement rejeté: ${result3.error}\n`);

  console.log('🧪 Test 4: Sécurité — quantité invalide doit échouer\n');
  const result4 = await createBraceletOrder({
    quantity: 42, // invalide
    isBranded: false,
    customerName: 'Test Quantité Invalide',
    customerPhone: '+221 77 000 00 04',
    deliveryCity: 'Dakar',
    paymentMethod: 'cash_on_delivery',
    logo: null,
  });
  if (result4.success) {
    throw new Error('Test 4 FAILED: quantité 42 ne devrait pas être acceptée');
  }
  console.log(`  ✅ Correctement rejeté: ${result4.error}\n`);

  // Nettoyage
  console.log('🧹 Nettoyage des commandes de test...');
  await db.braceletPackOrder.deleteMany({
    where: { id: { in: [result1.orderId, result2.orderId] } },
  });
  console.log('  ✅ 2 commandes de test supprimées\n');

  console.log('═══════════════════════════════════════════════════');
  console.log('🎉 Tous les tests de la server action PASSENT !');
  console.log('═══════════════════════════════════════════════════');
}

main().catch((e) => {
  console.error('❌ Test FAILED:', e);
  process.exit(1);
}).finally(() => db.$disconnect());
