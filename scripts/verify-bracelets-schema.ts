/**
 * Verify the BraceletPackOrder model and new Baggage columns exist in the DB.
 * Run: npx tsx /home/z/my-project/scripts/verify-bracelets-schema.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. BraceletPackOrder table exists + count rows
  const orderCount = await prisma.braceletPackOrder.count();
  console.log(`✅ BraceletPackOrder table exists — ${orderCount} rows`);

  // 2. Query a Baggage row and confirm new fields are queryable
  const sample = await prisma.baggage.findFirst({
    select: { id: true, reference: true, context: true, braceletPackOrderId: true },
  });
  console.log('✅ Baggage.context field queryable:', sample?.context ?? '(null — default applied on insert)');
  console.log('✅ Baggage.braceletPackOrderId field queryable:', sample?.braceletPackOrderId ?? '(null)');

  // 3. Confirm the relation works (BraceletPackOrder -> Baggage[])
  const relationCheck = await prisma.braceletPackOrder.findFirst({
    include: { _count: { select: { baggages: true } }, agency: { select: { name: true } } },
  });
  console.log('✅ BraceletPackOrder.baggages relation works:', relationCheck ? `${relationCheck._count.baggages} baggages` : '(no rows yet)');

  console.log('\n🎉 Schema verification PASSED — Phase 1 database ready.');
}

main()
  .catch((e) => {
    console.error('❌ Verification FAILED:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
