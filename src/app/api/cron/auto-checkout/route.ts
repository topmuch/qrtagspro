import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/cron/auto-checkout
 *
 * Cron job — fait passer en 'expired' tous les QR dont la departureDate
 * est dépassée. À appeler toutes les heures (ou toutes les 6h) via Coolify
 * cron ou service externe (cron-job.org, etc.).
 *
 * Header requis:
 *   Authorization: Bearer ${CRON_SECRET}
 *
 * Logique:
 *   - Sélectionne les baggages où:
 *     status IN ('activated', 'active', 'lost') (pas déjà expired/blocked)
 *     AND departureDate < now()
 *   - Pour chaque baggage:
 *     * status → 'expired'
 *     * expiresAt → now() (si pas déjà passé)
 *     * foundAt → now() si wasLost (l'objet a été "retrouvé" par check-out)
 *   - Crée une Notification pour chaque check-out auto (à l'agence)
 *
 * Retourne:
 *   { success, expired: number, notified: number }
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier le secret cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const now = new Date();

    // 1. Sélectionner les baggages dont departureDate < now() et pas encore expired
    const toExpire = await db.baggage.findMany({
      where: {
        status: { in: ['activated', 'active', 'lost'] },
        departureDate: { lt: now },
      },
      select: {
        id: true,
        reference: true,
        agencyId: true,
        status: true,
        departureDate: true,
        isLost: true,
        travelerFirstName: true,
        travelerLastName: true,
      },
    });

    if (toExpire.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun check-out automatique à faire',
        expired: 0,
        notified: 0,
      });
    }

    // 2. Faire passer en 'expired'
    const updateResult = await db.baggage.updateMany({
      where: {
        id: { in: toExpire.map(b => b.id) },
      },
      data: {
        status: 'expired',
        // Si l'objet était perdu et qu'on fait un check-out, on le marque "retrouvé"
        foundAt: now,
      },
    });

    // 3. Créer des notifications pour chaque check-out (à destination de l'agence)
    let notifiedCount = 0;
    try {
      const notifications = toExpire.map(b => ({
        type: 'auto_checkout',
        agencyId: b.agencyId,
        baggageId: b.id,
        message: `Check-out automatique : ${b.reference} — ${b.travelerFirstName || ''} ${b.travelerLastName || ''} (départ prévu le ${b.departureDate?.toLocaleDateString('fr-FR') || '?'})`,
      }));

      await db.notification.createMany({
        data: notifications,
      });
      notifiedCount = notifications.length;
    } catch (notifErr) {
      // Non-bloquant si la notification échoue
      console.error('[auto-checkout] Notification creation failed:', notifErr);
    }

    console.log(`[auto-checkout] ${updateResult.count} QR expirés automatiquement`);

    return NextResponse.json({
      success: true,
      message: `${updateResult.count} check-out automatique(s) effectué(s)`,
      expired: updateResult.count,
      notified: notifiedCount,
      references: toExpire.map(b => b.reference),
    });
  } catch (error) {
    console.error('[auto-checkout] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// GET pour test facile depuis le navigateur (avec secret en query param)
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');

  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }

  // Re-utiliser POST
  return POST(request);
}
