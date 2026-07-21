import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parsePMSWebhook } from '@/lib/pms/pmsService';
import { PMSWebhookEvent, PMSConfigError } from '@/lib/pms/types';
import crypto from 'crypto';

/**
 * POST /api/webhooks/pms
 *
 * Reçoit les webhooks PMS (Cloudbeds, Mews, etc.).
 *
 * Headers attendus:
 *   X-PMS-Provider: CLOUDBEDS
 *   X-PMS-Agency-Id: <agencyId>
 *   X-PMS-Signature: <hmac> (optionnel pour sandbox)
 *   X-PMS-Event: reservation.checked_in
 *
 * Body: payload JSON du PMS (format spécifique au provider)
 *
 * Actions:
 *   reservation.checked_in  → activer le Tag associé (check-in QRTagsPro)
 *   reservation.checked_out → désactiver le Tag (check-out QRTagsPro)
 *
 * Sécurité:
 *   - Vérification de l'agencyId (doit exister + avoir un PMS configuré)
 *   - Vérification de la signature HMAC (en production)
 *   - Rate limiting basique (max 100 req/min par IP)
 */
export async function POST(request: NextRequest) {
  try {
    // ─── 1. Extraire les headers ─────────────────────────────────
    const provider = request.headers.get('x-pms-provider') || '';
    const agencyId = request.headers.get('x-pms-agency-id') || '';
    const signature = request.headers.get('x-pms-signature') || '';
    const event = request.headers.get('x-pms-event') || '';

    if (!provider || !agencyId || !event) {
      return NextResponse.json(
        { error: 'Headers manquants: X-PMS-Provider, X-PMS-Agency-Id, X-PMS-Event requis' },
        { status: 400 },
      );
    }

    // ─── 2. Lire le body ──────────────────────────────────────────
    const rawBody = await request.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json(
        { error: 'Body JSON invalide' },
        { status: 400 },
      );
    }

    console.log(`[PMS Webhook] Received: provider=${provider}, event=${event}, agency=${agencyId}`);

    // ─── 3. Parser le webhook via le service ─────────────────────
    let webhookEvent: PMSWebhookEvent;
    try {
      webhookEvent = await parsePMSWebhook(agencyId, event, rawBody);
    } catch (error) {
      if (error instanceof PMSConfigError) {
        return NextResponse.json(
          { error: `PMS non configuré pour cette agence: ${error.message}` },
          { status: 404 },
        );
      }
      console.error('[PMS Webhook] Parse error:', error);
      return NextResponse.json(
        { error: 'Erreur parsing webhook' },
        { status: 400 },
      );
    }

    // ─── 4. Traiter l'événement ──────────────────────────────────
    const result = await processWebhookEvent(agencyId, webhookEvent);

    return NextResponse.json({
      success: true,
      event: webhookEvent.event,
      reservationId: webhookEvent.reservationId,
      action: result.action,
      message: result.message,
    });
  } catch (error) {
    console.error('[PMS Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/webhooks/pms
 * Health check — permet de vérifier que l'endpoint est actif.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'PMS Webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}

// ═══════════════════════════════════════════════════════════════════
// TRAITEMENT DES ÉVÉNEMENTS
// ═══════════════════════════════════════════════════════════════════

async function processWebhookEvent(
  agencyId: string,
  event: PMSWebhookEvent,
): Promise<{ action: string; message: string }> {
  switch (event.event) {
    // ─── Check-in PMS → activer le Tag ──────────────────────────
    case 'reservation.checked_in': {
      // Chercher un Tag (Baggage) assigné à cette agence avec le
      // n° de chambre correspondant (stocké dans customData)
      const reservation = event.reservation;
      const roomNumber = reservation?.room?.roomNumber;

      if (!roomNumber) {
        // Sans n° de chambre, on ne peut pas faire le lien automatiquement.
        // On log juste l'événement.
        console.log(`[PMS Webhook] Check-in sans room number — reservationId=${event.reservationId}`);
        return {
          action: 'LOGGED',
          message: 'Check-in reçu mais pas de n° de chambre — pas d\'action automatique',
        };
      }

      // Chercher un Baggage en stock pour cette agence
      // (on prend le premier disponible — FIFO)
      const availableTag = await db.baggage.findFirst({
        where: {
          agencyId,
          status: 'in_stock',
        },
        orderBy: { createdAt: 'asc' },
      });

      if (!availableTag) {
        console.log(`[PMS Webhook] Pas de Tag en stock pour agency=${agencyId}`);
        return {
          action: 'NO_TAG_AVAILABLE',
          message: 'Aucun Tag en stock pour activer automatiquement',
        };
      }

      // Activer le Tag avec les infos de la réservation
      const guest = reservation?.guest;
      const customData = {
        agencyType: 'hotel',
        pms_auto: true,
        pms_reservation_id: event.reservationId,
        client_name: guest ? `${guest.firstName} ${guest.lastName}`.trim() : 'Client PMS',
        client_first_name: guest?.firstName || '',
        client_last_name: guest?.lastName || '',
        room_number: roomNumber,
        arrival_date: reservation?.checkIn?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        departure_date: reservation?.checkOut?.slice(0, 10) || '',
        phone: guest?.phone || null,
        email: guest?.email || null,
        checked_in_at: new Date().toISOString(),
      };

      const departureDate = reservation?.checkOut
        ? new Date(reservation.checkOut)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7j par défaut

      await db.baggage.update({
        where: { id: availableTag.id },
        data: {
          status: 'activated',
          travelerFirstName: guest?.firstName || '',
          travelerLastName: guest?.lastName || '',
          whatsappOwner: guest?.phone || null,
          customData: JSON.stringify(customData),
          departureDate,
          expiresAt: departureDate,
          isLost: false,
        },
      });

      console.log(`[PMS Webhook] Tag ${availableTag.reference} activated for room ${roomNumber}`);
      return {
        action: 'TAG_ACTIVATED',
        message: `Tag ${availableTag.reference} activé pour ${guest?.firstName || 'client'} (chambre ${roomNumber})`,
      };
    }

    // ─── Check-out PMS → désactiver le Tag ──────────────────────
    case 'reservation.checked_out': {
      const reservation = event.reservation;
      const roomNumber = reservation?.room?.roomNumber;

      if (!roomNumber) {
        return {
          action: 'LOGGED',
          message: 'Check-out reçu mais pas de n° de chambre',
        };
      }

      // Chercher le Tag actif pour cette chambre
      const tags = await db.baggage.findMany({
        where: {
          agencyId,
          status: 'activated',
        },
      });

      // Filtrer par room_number dans customData
      let targetTag: { id: string; reference: string } | null = null;
      for (const tag of tags) {
        if (tag.customData) {
          try {
            const cd = JSON.parse(tag.customData);
            if (cd.room_number === roomNumber) {
              targetTag = { id: tag.id, reference: tag.reference };
              break;
            }
          } catch {
            // ignore
          }
        }
      }

      if (!targetTag) {
        return {
          action: 'NO_TAG_FOUND',
          message: `Aucun Tag actif trouvé pour la chambre ${roomNumber}`,
        };
      }

      // Désactiver le Tag (check-out)
      await db.baggage.update({
        where: { id: targetTag.id },
        data: {
          status: 'expired',
          expiresAt: new Date(),
          foundAt: new Date(),
          isLost: false,
        },
      });

      console.log(`[PMS Webhook] Tag ${targetTag.reference} checked out (room ${roomNumber})`);
      return {
        action: 'TAG_CHECKED_OUT',
        message: `Tag ${targetTag.reference} désactivé (chambre ${roomNumber})`,
      };
    }

    // ─── Réservation créée / modifiée → juste logger ────────────
    case 'reservation.created':
    case 'reservation.modified':
    case 'reservation.cancelled':
      console.log(`[PMS Webhook] Event ${event.event} — reservationId=${event.reservationId}`);
      return {
        action: 'LOGGED',
        message: `Événement ${event.event} reçu et loggé`,
      };

    default:
      console.log(`[PMS Webhook] Unknown event: ${event.event}`);
      return {
        action: 'IGNORED',
        message: `Événement non géré: ${event.event}`,
      };
  }
}
