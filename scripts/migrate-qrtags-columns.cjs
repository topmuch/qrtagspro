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
  // QRTagsPro V1 — Hotel check-out date (used by cron job for auto-expire)
  ['departureDate',    'DATETIME'],
];

// Columns to ensure exist in Agency table
// QRTagsPro V1 — WhatsApp reception phone (finder scan → wa.me click-to-chat)
// QRTagsPro V3 — customTypeId (référence vers CustomAgencyType pour métiers custom)
const AGENCY_COLUMNS = [
  ['contactPhone', 'TEXT'],
  ['customTypeId', 'TEXT'],
  ['logoUrl', 'TEXT'],
];

// QRTagsPro V3 — CustomAgencyType table
// Permet au superadmin de créer des métiers personnalisés sans coder
const CUSTOM_TYPE_COLUMNS = [
  ['id',                'TEXT NOT NULL PRIMARY KEY'],
  ['key',               'TEXT NOT NULL'],
  ['name',              'TEXT NOT NULL'],
  ['icon',              "TEXT NOT NULL DEFAULT '💼'"],
  ['description',       'TEXT'],
  ['fieldsSchema',      'TEXT NOT NULL'],
  ['departureFieldKey', 'TEXT'],
  ['finderMessage',     'TEXT'],
  ['colClientLabel',    'TEXT'],
  ['colSubLabel',       'TEXT'],
  ['createdAt',         'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'],
  ['updatedAt',         'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'],
];

const CUSTOM_TYPE_INDEXES = [
  ['idx_customtype_key', 'CustomAgencyType', 'key'],
];

// QRTagsPro V4 — DemoScan table (bac à sable, données supprimées après 2h)
const DEMO_SCAN_COLUMNS = [
  ['id',            'TEXT NOT NULL PRIMARY KEY'],
  ['reference',     "TEXT NOT NULL DEFAULT 'DEMO-TEST'"],
  ['finderName',    'TEXT NOT NULL'],
  ['finderPhone',   'TEXT NOT NULL'],
  ['location',      'TEXT'],
  ['mapsLink',      'TEXT'],
  ['message',       'TEXT'],
  ['createdAt',     'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'],
  ['expiresAt',     'DATETIME NOT NULL'],
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

    // 2b. Ensure Agency columns (QRTagsPro V1 — contactPhone, V3 — customTypeId)
    const hasAgency = await tableExists(prisma, 'Agency');
    if (hasAgency) {
      console.log('✓ Table Agency exists');
      console.log('Ensuring Agency columns...');
      for (const [col, def] of AGENCY_COLUMNS) {
        await ensureColumn(prisma, 'Agency', col, def);
      }
    } else {
      console.log('⚠ Table Agency does not exist — skipping Agency columns');
    }

    // 2c. Ensure CustomAgencyType table exists (QRTagsPro V3 — métiers personnalisables)
    const hasCustomType = await tableExists(prisma, 'CustomAgencyType');
    if (!hasCustomType) {
      console.log('  + Creating table CustomAgencyType...');
      await prisma.$executeRawUnsafe(
        `CREATE TABLE "CustomAgencyType" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "key" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "icon" TEXT NOT NULL DEFAULT '💼',
          "description" TEXT,
          "fieldsSchema" TEXT NOT NULL,
          "departureFieldKey" TEXT,
          "finderMessage" TEXT,
          "colClientLabel" TEXT,
          "colSubLabel" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );`
      );
      try {
        await prisma.$executeRawUnsafe(
          `CREATE UNIQUE INDEX IF NOT EXISTS "CustomAgencyType_key_key" ON "CustomAgencyType"("key");`
        );
      } catch (e) {
        // ignore
      }
      console.log('  ✓ Table CustomAgencyType created');
    } else {
      console.log('✓ Table CustomAgencyType exists');
      console.log('Ensuring CustomAgencyType columns...');
      for (const [col, def] of CUSTOM_TYPE_COLUMNS) {
        // Skip 'id' and 'key' since they exist (PRIMARY KEY + UNIQUE handled separately)
        if (col === 'id' || col === 'key') continue;
        await ensureColumn(prisma, 'CustomAgencyType', col, def);
      }
    }

    // 2d. Ensure DemoScan table exists (QRTagsPro V4 — bac à sable démo)
    const hasDemoScan = await tableExists(prisma, 'DemoScan');
    if (!hasDemoScan) {
      console.log('  + Creating table DemoScan...');
      await prisma.$executeRawUnsafe(
        `CREATE TABLE "DemoScan" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "reference" TEXT NOT NULL DEFAULT 'DEMO-TEST',
          "finderName" TEXT NOT NULL,
          "finderPhone" TEXT NOT NULL,
          "location" TEXT,
          "mapsLink" TEXT,
          "message" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "expiresAt" DATETIME NOT NULL
        );`
      );
      console.log('  ✓ Table DemoScan created');
    } else {
      console.log('✓ Table DemoScan exists');
    }

    // 3. Ensure indexes
    console.log('Ensuring indexes...');
    await ensureIndex(prisma, 'idx_baggage_trackingToken', 'Baggage', 'trackingToken');
    // QRTagsPro V1 — Index on departureDate for efficient cron auto-expire queries
    await ensureIndex(prisma, 'idx_baggage_departureDate', 'Baggage', 'departureDate');
    // QRTagsPro V3 — Index on CustomAgencyType.key
    await ensureIndex(prisma, 'idx_customtype_key', 'CustomAgencyType', 'key');

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
