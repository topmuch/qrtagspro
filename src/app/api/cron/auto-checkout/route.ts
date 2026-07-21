import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/cron/auto-checkout
 *
 * Cron job — fait passer en 'post_stay' tous les QR dont la departureDate
 * est dépassée. À appeler toutes les heures via Coolify cron.
 *
 * V4 — Fidélisation:
 *   Le statut passe à 'post_stay' (au lieu de 'expired') pour permettre:
 *   - Affichage du logo hôtel (pub gratuite)
 *   - Contact direct client si opt-in activé
 *   - Réactivation du QR pour un nouveau séjour
 *
 * Le statut 'expired' est réservé au check-out MANUEL explicite
 * (bouton "Check-out" dans le dashboard agence).
 *
 * Header requis: Authorization: Bearer ${CRON_SECRET}
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const now = new Date();

    // 1. Sélectionner les baggages dont departureDate < now() et encore actifs
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
        processed: 0,
        notified: 0,
      });
    }

    // 2. Faire passer en 'post_stay' (V4 — au lieu de 'expired')
    const updateResult = await db.baggage.updateMany({
      where: {
        id: { in: toExpire.map(b => b.id) },
      },
      data: {
        status: 'post_stay',
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
      console.error('[auto-checkout] Notification creation failed:', notifErr);
    }

    console.log(`[auto-checkout] ${updateResult.count} QR passés en post_stay`);

    return NextResponse.json({
      success: true,
      message: `${updateResult.count} QR passés en mode après-séjour (post_stay)`,
      processed: updateResult.count,
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

// GET pour test facile depuis le navigateur
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

  return POST(request);
}
