import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ─── Backup DB automatique ───
// GET /api/cron/backup-db
// Appelé par un cron externe (Coolify cron job) toutes les heures.
// Crée une copie de la DB SQLite dans /app/data/backups/
// Garde les 24 derniers backups (rotation).

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Auth simple: vérifier le header CRON_SECRET
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'qrlabs-backup-2026';
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || '/app/data/qrlabs.db';
    const backupDir = path.join(path.dirname(dbPath), 'backups');

    // Créer le dossier de backup
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Nom du backup: qrlags-YYYY-MM-DD-HH-MM.db
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = path.join(backupDir, `qrlabs-${timestamp}.db`);

    // Copier la DB
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
    } else {
      return NextResponse.json({ error: 'DB not found', dbPath }, { status: 404 });
    }

    // Rotation: garder les 24 derniers backups
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('qrlabs-') && f.endsWith('.db'))
      .sort()
      .reverse();

    const MAX_BACKUPS = 24;
    if (backups.length > MAX_BACKUPS) {
      for (const oldBackup of backups.slice(MAX_BACKUPS)) {
        fs.unlinkSync(path.join(backupDir, oldBackup));
      }
    }

    return NextResponse.json({
      success: true,
      backup: backupPath,
      timestamp,
      totalBackups: Math.min(backups.length, MAX_BACKUPS),
    });
  } catch (error) {
    console.error('[backup-db] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du backup' },
      { status: 500 }
    );
  }
}
