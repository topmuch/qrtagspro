/**
 * QRTags — Migration script (run before server starts)
 *
 * Idempotently ensures all required QRTags columns exist in the Baggage table.
 * Uses Prisma's $executeRawUnsafe with try/catch per column (SQLite doesn't
 * support IF NOT EXISTS for ALTER TABLE ADD COLUMN, so we catch the error
 * if the column already exists).
 *
 * This script is SAFE to run multiple times.
 */

const { PrismaClient } = require('@prisma/client');

// Columns to ensure exist in Baggage table
// Format: [columnName, columnDef]
const BAGGAGE_COLUMNS = [
  ['activatedAt',      'DATETIME'],
  ['customData',       'TEXT'],
  ['ownerPin',         'TEXT'],
  ['ownerPinSetAt',    'DATETIME'],
  ['trackingToken',    'TEXT'],
  ['trackingEnabled',  'INTEGER NOT NULL DEFAULT 1'],
  ['scanCount',        'INTEGER NOT NULL DEFAULT 0'],
  ['lastScanLocation', 'TEXT'],
  ['isLost',           'INTEGER NOT NULL DEFAULT 0'],
  ['lostReportedAt',   'DATETIME'],
  ['lostMessage',      'TEXT'],
];

// Superadmin credentials (bcrypt hash for "admin123")
const SUPERADMIN_ID = 'admin-001';
const SUPERADMIN_EMAIL = 'admin@qrtags.com';
const SUPERADMIN_HASH = '$2b$10$5JnNkrnAaKKWV6kw5Ya9X.yCPqhCi4qTEFTQ37fGRUIORU9nSx9Dq';

async function tableExists(prisma, tableName) {
  const result = await prisma.$queryRawUnsafe(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`,
    tableName
  );
  return Array.isArray(result) && result.length > 0;
}

async function getExistingColumns(prisma, tableName) {
  const result = await prisma.$queryRawUnsafe(`PRAGMA table_info(${tableName});`);
  if (!Array.isArray(result)) return [];
  return result.map((row) => row.name);
}

async function ensureColumn(prisma, tableName, columnName, columnDef) {
  const existing = await getExistingColumns(prisma, tableName);
  if (existing.includes(columnName)) {
    console.log(`  ✓ ${tableName}.${columnName} OK`);
    return;
  }
  try {
    // SQLite ALTER TABLE doesn't support IF NOT EXISTS
    await prisma.$executeRawUnsafe(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef};`
    );
    console.log(`  + ${tableName}.${columnName} added`);
  } catch (err) {
    // If column already exists, SQLite throws "duplicate column name"
    if (String(err?.message || '').includes('duplicate column name')) {
      console.log(`  ✓ ${tableName}.${columnName} OK (already exists)`);
    } else {
      console.error(`  ✗ ${tableName}.${columnName} FAILED:`, err.message);
      throw err;
    }
  }
}

async function ensureIndex(prisma, indexName, tableName, columnName) {
  try {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName}(${columnName});`
    );
    console.log(`  ✓ Index ${indexName} OK`);
  } catch (err) {
    console.error(`  ✗ Index ${indexName} FAILED:`, err.message);
    // Non-fatal
  }
}

async function ensureSuperadmin(prisma) {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as cnt FROM User WHERE email = ?;`,
      SUPERADMIN_EMAIL
    );
    const count = Number(rows[0]?.cnt || 0);
    if (count > 0) {
      // Update password + role to be safe
      await prisma.$executeRawUnsafe(
        `UPDATE User SET password = ?, role = 'superadmin' WHERE email = ?;`,
        SUPERADMIN_HASH,
        SUPERADMIN_EMAIL
      );
      console.log(`  ✓ Superadmin exists (password updated)`);
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO User (id, email, name, password, role, createdAt, updatedAt)
         VALUES (?, ?, 'QRTags SuperAdmin', ?, 'superadmin', datetime('now'), datetime('now'));`,
        SUPERADMIN_ID,
        SUPERADMIN_EMAIL,
        SUPERADMIN_HASH
      );
      console.log(`  + Superadmin created`);
    }
  } catch (err) {
    console.error(`  ✗ Superadmin FAILED:`, err.message);
    // Try simpler update-only fallback
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE User SET password = ?, role = 'superadmin' WHERE email = ?;`,
        SUPERADMIN_HASH,
        SUPERADMIN_EMAIL
      );
      console.log(`  ⚠ Superadmin update fallback applied`);
    } catch (e2) {
      console.error(`  ✗ Superadmin fallback FAILED:`, e2.message);
    }
  }
}

async function main() {
  console.log('══════════════════════════════════════════════════');
  console.log('  QRTags — DB Migration');
  console.log('══════════════════════════════════════════════════');

  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    // 1. Check Baggage table exists
    const hasBaggage = await tableExists(prisma, 'Baggage');
    if (!hasBaggage) {
      console.error('❌ Table Baggage does not exist!');
      console.error('   Run prisma db push first, or delete the DB file to recreate from scratch.');
      process.exit(1);
    }
    console.log('✓ Table Baggage exists');

    // 2. Ensure all QRTags columns exist (idempotent)
    console.log('Ensuring Baggage columns...');
    for (const [col, def] of BAGGAGE_COLUMNS) {
      await ensureColumn(prisma, 'Baggage', col, def);
    }

    // 3. Ensure index on trackingToken
    console.log('Ensuring indexes...');
    await ensureIndex(prisma, 'idx_baggage_trackingToken', 'Baggage', 'trackingToken');

    // 4. Ensure superadmin exists with correct password
    console.log('Ensuring superadmin...');
    await ensureSuperadmin(prisma);

    console.log('══════════════════════════════════════════════════');
    console.log('  ✅ Migration complete');
    console.log('══════════════════════════════════════════════════');
  } catch (err) {
    console.error('══════════════════════════════════════════════════');
    console.error('  ❌ Migration FAILED:', err.message);
    console.error('══════════════════════════════════════════════════');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
