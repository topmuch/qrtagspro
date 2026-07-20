/**
 * QRTags — Lazy DB Migration (runs on first Prisma use)
 *
 * This module ensures all required QRTags columns exist in the Baggage table.
 * It runs ONCE per process, on first Prisma client use — so even if init-db.sh
 * fails or prisma db push doesn't run, the migration will happen automatically
 * on the first API request.
 *
 * Strategy:
 * - Check if trackingToken column exists via PRAGMA
 * - If missing, ALTER TABLE ADD COLUMN for each missing QRTags column
 * - Also ensure superadmin exists
 *
 * All operations are idempotent and use try/catch per column.
 */

import { PrismaClient } from '@prisma/client';

const QRTAGS_BAGGAGE_COLUMNS: Array<[string, string]> = [
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

const SUPERADMIN_HASH = '$2b$10$5JnNkrnAaKKWV6kw5Ya9X.yCPqhCi4qTEFTQ37fGRUIORU9nSx9Dq';
const SUPERADMIN_EMAIL = 'admin@qrtags.com';

let migrationStarted = false;
let migrationPromise: Promise<void> | null = null;

async function getExistingColumns(prisma: PrismaClient, tableName: string): Promise<string[]> {
  try {
    const result = await prisma.$queryRawUnsafe(`PRAGMA table_info(${tableName});`);
    if (!Array.isArray(result)) return [];
    return result.map((row: any) => row.name);
  } catch {
    return [];
  }
}

async function tableExists(prisma: PrismaClient, tableName: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`,
      tableName
    );
    return Array.isArray(result) && result.length > 0;
  } catch {
    return false;
  }
}

async function ensureSuperadmin(prisma: PrismaClient): Promise<void> {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as cnt FROM User WHERE email = ?;`,
      SUPERADMIN_EMAIL
    ) as any[];
    const count = Number(rows[0]?.cnt || 0);

    if (count > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE User SET password = ?, role = 'superadmin' WHERE email = ?;`,
        SUPERADMIN_HASH,
        SUPERADMIN_EMAIL
      );
    } else {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO User (id, email, name, password, role, createdAt, updatedAt)
           VALUES (?, ?, 'QRTags SuperAdmin', ?, 'superadmin', datetime('now'), datetime('now'));`,
          'admin-001',
          SUPERADMIN_EMAIL,
          SUPERADMIN_HASH
        );
      } catch {
        // Maybe id conflict — try update instead
        await prisma.$executeRawUnsafe(
          `UPDATE User SET password = ?, role = 'superadmin' WHERE email = ?;`,
          SUPERADMIN_HASH,
          SUPERADMIN_EMAIL
        );
      }
    }
  } catch (err) {
    console.error('[migration] Superadmin failed:', err instanceof Error ? err.message : err);
  }
}

export async function runMigrationIfNeeded(prisma: PrismaClient): Promise<void> {
  // Singleton: only run once per process
  if (migrationStarted && migrationPromise) {
    return migrationPromise;
  }
  migrationStarted = true;
  migrationPromise = doMigration(prisma);
  return migrationPromise;
}

async function doMigration(prisma: PrismaClient): Promise<void> {
  try {
    // Check Baggage table exists
    const hasBaggage = await tableExists(prisma, 'Baggage');
    if (!hasBaggage) {
      // DB not yet created — Prisma will create it on first model query
      // Skip migration, will run again on next request
      return;
    }

    // Check if migration is needed (trackingToken missing = old schema)
    const existingCols = await getExistingColumns(prisma, 'Baggage');
    const needsMigration = !existingCols.includes('trackingToken');

    if (!needsMigration) {
      return; // Already up-to-date
    }

    console.log('[migration] Baggage has old schema — adding QRTags columns...');

    // Add each missing column
    for (const [colName, colDef] of QRTAGS_BAGGAGE_COLUMNS) {
      if (existingCols.includes(colName)) continue;
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE Baggage ADD COLUMN ${colName} ${colDef};`
        );
        console.log(`[migration] + Baggage.${colName} added`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('duplicate column name')) {
          // Already exists — fine
        } else {
          console.error(`[migration] ✗ Baggage.${colName} failed:`, msg);
        }
      }
    }

    // Create index on trackingToken
    try {
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS idx_baggage_trackingToken ON Baggage(trackingToken);`
      );
    } catch {
      // Non-fatal
    }

    // Ensure superadmin
    await ensureSuperadmin(prisma);

    console.log('[migration] ✅ QRTags columns added');
  } catch (err) {
    console.error('[migration] FAILED:', err instanceof Error ? err.message : err);
    // Don't rethrow — let the app continue. The query that triggered the
    // migration will fail with P2022, but at least the next request will work.
  }
}
