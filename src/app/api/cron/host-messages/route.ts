import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getCheckInReminderMessage,
  getCheckOutMessage,
  getReviewUrl,
} from '@/lib/emails/host-whatsapp';

/**
 * GET /api/cron/host-messages
 *
 * Cron job — Module QRTags Host (Conciergerie digitale Airbnb).
 *
 * Envoie 2 types de messages WhatsApp automatisés :
 *   1. Message J-1 (veille du check-in) :
 *      - ACTIVE reservations où checkInDate est demain
 *      - reminderSentAt est null
 *      → Marque reminderSentAt = now()
 *
 *   2. Message de check-out (jour du départ) :
 *      - ACTIVE reservations où checkOutDate est aujourd'hui
 *      - checkoutSentAt est null
 *      → Marque checkoutSentAt = now() + status = COMPLETED
 *
 * MVP : pas d'envoi WhatsApp API réel. On logge le message (console.log)
 * pour debug, et on retourne le détail dans la réponse JSON.
 *
 * Header requis : x-cron-secret: ${CRON_SECRET}
 * (ou ?secret=... pour test navigateur)
 *
 * À appeler une fois par jour vers 9h (heure locale).
 */
export async function GET(request: NextRequest) {
  const logs: string[] = [];
  const log = (msg: string) => {
    console.log(`[host-messages] ${msg}`);
    logs.push(msg);
  };

  // ─── Auth ───
  const cronSecret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const secretFromHeader = request.headers.get('x-cron-secret');
  const secretFromQuery = url.searchParams.get('secret');

  if (cronSecret && secretFromHeader !== cronSecret && secretFromQuery !== cronSecret) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let remindersSent = 0;
    let checkoutsSent = 0;

    // ─── 1. Rappels J-1 (check-in demain) ───
    const tomorrowReservations = await db.hostReservation.findMany({
      where: {
        status: 'ACTIVE',
        reminderSentAt: null,
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            houseGuide: {
              select: {
                hostName: true,
                checkInTime: true,
                checkOutTime: true,
              },
            },
          },
        },
      },
    });

    const tomorrowCheckIns = tomorrowReservations.filter((r) =>
      isTomorrow(new Date(r.checkInDate), now)
    );

    log(`[J-1] ${tomorrowCheckIns.length} réservation(s) à rappeler (check-in demain)`);

    for (const reservation of tomorrowCheckIns) {
      const agency = reservation.agency;
      const guide = agency.houseGuide;
      const welcomeUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/welcome/${agency.slug}?context=WRISTBAND`;

      const message = getCheckInReminderMessage({
        guestName: reservation.guestName,
        guestPhone: reservation.guestPhone,
        hostName: guide?.hostName || agency.name,
        apartmentName: agency.name,
        welcomeUrl,
        checkInTime: guide?.checkInTime || null,
        checkOutTime: guide?.checkOutTime || null,
      });

      log(
        `[J-1] → ${reservation.guestName} (${reservation.guestPhone}) — ${agency.name}\n` +
          `      URL: ${message.waMeUrl}`
      );

      await db.hostReservation.update({
        where: { id: reservation.id },
        data: { reminderSentAt: now },
      });

      remindersSent++;
    }

    // ─── 2. Messages de check-out (départ aujourd'hui) ───
    const todayReservations = await db.hostReservation.findMany({
      where: {
        status: 'ACTIVE',
        checkoutSentAt: null,
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            houseGuide: {
              select: {
                hostName: true,
                checkInTime: true,
                checkOutTime: true,
              },
            },
          },
        },
      },
    });

    const todayCheckOuts = todayReservations.filter((r) =>
      isSameDay(new Date(r.checkOutDate), now)
    );

    log(`[Départ] ${todayCheckOuts.length} réservation(s) à clore (check-out aujourd'hui)`);

    for (const reservation of todayCheckOuts) {
      const agency = reservation.agency;
      const guide = agency.houseGuide;
      const reviewUrl = getReviewUrl(agency.name, agency.address);

      const message = getCheckOutMessage({
        guestName: reservation.guestName,
        guestPhone: reservation.guestPhone,
        hostName: guide?.hostName || agency.name,
        apartmentName: agency.name,
        welcomeUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/welcome/${agency.slug}?context=WRISTBAND`,
        checkInTime: guide?.checkInTime || null,
        checkOutTime: guide?.checkOutTime || null,
        reviewUrl,
      });

      log(
        `[Départ] → ${reservation.guestName} (${reservation.guestPhone}) — ${agency.name}\n` +
          `      URL: ${message.waMeUrl}`
      );

      await db.hostReservation.update({
        where: { id: reservation.id },
        data: {
          checkoutSentAt: now,
          status: 'COMPLETED',
        },
      });

      checkoutsSent++;
    }

    log(`✓ Terminé : ${remindersSent} rappel(s) J-1, ${checkoutsSent} check-out(s) envoyés`);

    return NextResponse.json({
      success: true,
      remindersSent,
      checkoutsSent,
      logs,
      runAt: now.toISOString(),
    });
  } catch (error) {
    console.error('[host-messages] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur serveur',
        logs,
      },
      { status: 500 }
    );
  }
}

// ─── Helpers : comparaison de dates (sans l'heure) ───────────────────────────

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isTomorrow(target: Date, reference: Date): boolean {
  const next = new Date(reference);
  next.setDate(next.getDate() + 1);
  return isSameDay(target, next);
}
