import { PrismaClient } from '@prisma/client';
import { runMigrationIfNeeded } from '@/lib/migrate';

// Pour éviter les problèmes de hot-reload en dev
declare global {
  var prisma: PrismaClient | undefined;
  var prismaMigrationDone: boolean | undefined;
}

const createClient = () => {
  const client = new PrismaClient();

  // ─── Lazy migration ───────────────────────────────────────────────
  // Run migration on client creation (fire and forget).
  // Ensures QRTags columns exist even if init-db.sh failed.
  if (!global.prismaMigrationDone) {
    global.prismaMigrationDone = true;
    runMigrationIfNeeded(client).catch((err) => {
      console.error('[prisma] Migration failed:', err instanceof Error ? err.message : err);
      global.prismaMigrationDone = false;
    });
  }

  return client;
};

const prisma = global.prisma || createClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
