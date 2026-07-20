import { PrismaClient } from '@prisma/client'
import { runMigrationIfNeeded } from '@/lib/migrate'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaMigrationDone: boolean | undefined
}

// Force new PrismaClient to get latest schema changes
// This ensures we have access to all models including Lead
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })

  // ─── Lazy migration ───────────────────────────────────────────────
  // Run migration on client creation (fire and forget).
  // The migration checks if QRTags columns exist and adds them if missing.
  // This ensures the DB is always up-to-date, even if init-db.sh failed.
  //
  // We use $connect() to trigger the migration before any query.
  // The migration is idempotent — safe to run multiple times.
  if (!globalForPrisma.prismaMigrationDone) {
    globalForPrisma.prismaMigrationDone = true
    // Fire and forget — don't block client creation
    runMigrationIfNeeded(client).catch((err) => {
      console.error('[db] Migration failed:', err instanceof Error ? err.message : err)
      // Reset flag so migration can retry on next client creation
      globalForPrisma.prismaMigrationDone = false
    })
  }

  return client
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Export type for TypeScript support
export type { PrismaClient }
