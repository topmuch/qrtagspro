import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/cleanup-demo
 *
 * Cron job — supprime les entrées DemoScan expirées (expiresAt < now).
 * À appeler toutes les heures via Coolify Scheduled Tasks ou cron-job.org.
 *
 * Header: Authorization: Bearer ${CRON_SECRET} (recommandé mais optionnel)
 *
 * Retourne:
 *   { success: true, deletedCount: N }
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret cron (optionnel — permet test navigateur)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const url = new URL(request.url);
    const secretParam = url.searchParams.get('secret');

    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && secretParam !== cronSecret) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const deleted = await db.demoScan.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    console.log(`[cleanup-demo] ${deleted.count} entrées DemoScan supprimées`);

    return NextResponse.json({
      success: true,
      deletedCount: deleted.count,
    });
  } catch (error) {
    console.error('[cleanup-demo] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
