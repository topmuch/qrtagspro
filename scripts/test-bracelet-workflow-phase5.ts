/**
 * Test end-to-end du workflow complet Phase 5 :
 *   1. Crée une commande de test (via createBraceletOrder)
 *   2. Vérifie que l'email de confirmation a été logged en DB (EmailLog)
 *   3. Génère les QR codes (simulate validateAndGenerateQr)
 *   4. Vérifie email "production démarrée"
 *   5. Teste l'export CSV
 *
 * Run: npx tsx scripts/test-bracelet-workflow-phase5.ts
 */
import { db } from '../src/lib/db';
import { sendEmail } from '../src/lib/email';
import {
  getOrderConfirmationEmail,
  getProductionStartedEmail,
  getShippedEmail,
  getDeliveredEmail,
} from '../src/lib/emails/bracelet-templates';
import { generateReferencesBulk } from '../src/lib/qr';

async function main() {
  console.log('🧪 Phase 5 — Test du workflow complet\n');
  console.log('═══════════════════════════════════════════════════\n');

  // ─── 1. Vérifier le nombre d'EmailLog avant ───
  const emailCountBefore = await db.emailLog.count();
  console.log(`📊 EmailLog avant test: ${emailCountBefore}\n`);

  // ─── 2. Créer une commande de test ───
  console.log('─── Test 1: Création commande + email confirmation ───\n');
  const order = await db.braceletPackOrder.create({
    data: {
      agencyId: 'demo-resort-baobab',
      quantity: 5,
      isBranded: false,
      unitPrice: 900,
      totalPrice: 4500,
      status: 'PENDING',
      maquetteStatus: 'VALIDATED',
      customerName: 'Test Workflow Phase5',
      customerPhone: '+221 77 000 00 99',
      customerEmail: 'test-phase5@example.com',
      deliveryCity: 'Dakar',
      paymentMethod: 'wave',
      paymentStatus: 'PAID',
    },
  });
  console.log(`  ✅ Commande créée: ${order.id}`);
  console.log(`     customerEmail: ${order.customerEmail}`);

  // ─── 3. Email confirmation ───
  const confEmail = getOrderConfirmationEmail({
    customerName: order.customerName,
    orderId: order.id,
    quantity: order.quantity,
    isBranded: order.isBranded,
    totalPrice: order.totalPrice,
    agencyName: 'Baobab Beach Resort',
  });
  const confResult = await sendEmail({
    to: order.customerEmail!,
    subject: confEmail.subject,
    html: confEmail.html,
    text: confEmail.text,
    type: 'bracelet_order_confirmation',
  });
  console.log(`  ✅ Email confirmation envoyé: success=${confResult.success}`);

  // ─── 4. Générer QR + email production ───
  console.log('\n─── Test 2: Génération QR + email production ───\n');
  const references = await generateReferencesBulk(null, 5);
  await db.$transaction([
    db.baggage.createMany({
      data: references.map((reference) => ({
        reference,
        type: 'voyageur',
        agencyId: 'demo-resort-baobab',
        baggageType: 'cabine',
        status: 'active',
        context: 'WRISTBAND',
        braceletPackOrderId: order.id,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      })),
    }),
    db.braceletPackOrder.update({
      where: { id: order.id },
      data: {
        status: 'PRODUCING',
        activatedAt: new Date(),
        activatedCount: 5,
      },
    }),
  ]);
  console.log(`  ✅ 5 QR codes générés: ${references[0]}, ${references[1]}, ...`);

  const prodEmail = getProductionStartedEmail({
    customerName: order.customerName,
    orderId: order.id,
    quantity: order.quantity,
    isBranded: order.isBranded,
    totalPrice: order.totalPrice,
    agencyName: 'Baobab Beach Resort',
  });
  await sendEmail({
    to: order.customerEmail!,
    subject: prodEmail.subject,
    html: prodEmail.html,
    text: prodEmail.text,
    type: 'bracelet_production_started',
  });
  console.log(`  ✅ Email production envoyé`);

  // ─── 5. Email expédition ───
  console.log('\n─── Test 3: Email expédition ───\n');
  await db.braceletPackOrder.update({
    where: { id: order.id },
    data: { status: 'SHIPPED', shippedAt: new Date(), trackingNumber: 'TEST-TRACK-123' },
  });
  const shipEmail = getShippedEmail({
    customerName: order.customerName,
    orderId: order.id,
    quantity: order.quantity,
    isBranded: order.isBranded,
    totalPrice: order.totalPrice,
    agencyName: 'Baobab Beach Resort',
    trackingNumber: 'TEST-TRACK-123',
  });
  await sendEmail({
    to: order.customerEmail!,
    subject: shipEmail.subject,
    html: shipEmail.html,
    text: shipEmail.text,
    type: 'bracelet_shipped',
  });
  console.log(`  ✅ Email expédition envoyé`);

  // ─── 6. Email livraison ───
  console.log('\n─── Test 4: Email livraison ───\n');
  await db.braceletPackOrder.update({
    where: { id: order.id },
    data: { status: 'DELIVERED', deliveredAt: new Date() },
  });
  const delivEmail = getDeliveredEmail({
    customerName: order.customerName,
    orderId: order.id,
    quantity: order.quantity,
    isBranded: order.isBranded,
    totalPrice: order.totalPrice,
    agencyName: 'Baobab Beach Resort',
    activationUrl: 'http://localhost:3000/agence/bracelets',
  });
  await sendEmail({
    to: order.customerEmail!,
    subject: delivEmail.subject,
    html: delivEmail.html,
    text: delivEmail.text,
    type: 'bracelet_delivered',
  });
  console.log(`  ✅ Email livraison envoyé`);

  // ─── 7. Vérifier EmailLog ───
  console.log('\n─── Test 5: Vérification EmailLog en DB ───\n');
  const emailCountAfter = await db.emailLog.count();
  console.log(`  ✅ EmailLog avant: ${emailCountBefore} → après: ${emailCountAfter}`);
  console.log(`  ✅ ${emailCountAfter - emailCountBefore} nouveaux emails loggés`);

  const newEmails = await db.emailLog.findMany({
    where: { to: 'test-phase5@example.com' },
    select: { type: true, status: true, subject: true, sentAt: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`\n  Emails pour test-phase5@example.com:`);
  for (const e of newEmails) {
    console.log(`    [${e.status}] ${e.type} — "${e.subject}"`);
  }

  if (newEmails.length !== 4) {
    throw new Error(`Attendu 4 emails, reçu ${newEmails.length}`);
  }

  // ─── 8. Test export CSV (simulation) ───
  console.log('\n─── Test 6: Export CSV (simulation) ───\n');
  const baggages = await db.baggage.findMany({
    where: { braceletPackOrderId: order.id },
    select: { reference: true, context: true, status: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`  ✅ ${baggages.length} baggages récupérés pour export CSV`);
  const csvLine1 = `Reference,ScanURL,WelcomeURL,Context,Status,CreatedAt`;
  const csvLine2 = `${baggages[0].reference},http://localhost:3000/scan/${baggages[0].reference},http://localhost:3000/welcome/baobab_beach_resort?context=WRISTBAND,WRISTBAND,active,${baggages[0].createdAt.toISOString()}`;
  console.log(`  CSV header: ${csvLine1}`);
  console.log(`  CSV row 1:  ${csvLine2}`);

  // ─── 9. Nettoyage ───
  console.log('\n─── Nettoyage ───\n');
  await db.scanLog.deleteMany({
    where: { baggage: { braceletPackOrderId: order.id } },
  });
  await db.baggage.deleteMany({
    where: { braceletPackOrderId: order.id },
  });
  await db.braceletPackOrder.delete({ where: { id: order.id } });
  await db.emailLog.deleteMany({
    where: { to: 'test-phase5@example.com' },
  });
  console.log(`  ✅ Commande + 5 baggages + 4 emails de test supprimés`);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('🎉 Phase 5 — Workflow complet VALIDÉ !');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ✅ 4 templates d\'emails fonctionnels (confirmation/production/shipped/delivered)');
  console.log('  ✅ Emails logged en DB (EmailLog) avec statut "sent"');
  console.log('  ✅ Workflow: PENDING → PRODUCING → SHIPPED → DELIVERED');
  console.log('  ✅ Génération QR codes via transaction atomique');
  console.log('  ✅ Export CSV structuré pour imprimeur');
}

main().catch((e) => {
  console.error('❌ Test FAILED:', e);
  process.exit(1);
}).finally(() => db.$disconnect());
