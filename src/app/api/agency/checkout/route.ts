import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

/**
 * POST /api/agency/checkout
 *
 * Check-out manuel — fait passer un QR en 'expired' (le client quitte l'hôtel).
 *
 * Body:
 *   reference: string — la référence du QR
 *   agencyId:  string — l'agence qui fait le check-out (vérif appartenance)
 *
 * Le QR doit:
 *   - exister
 *   - appartenir à l'agence
 *   - être en statut 'activated' (ou 'active' / 'lost')
 *
 * Après check-out:
 *   - status → 'expired'
 *   - expiresAt → now()
 *   - foundAt → now() (si l'objet était perdu, marquer comme retrouvé)
 *   - isLost → false (reset)
 *   - lostReportedAt → null
 *   - lostMessage → null
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const schema = z.object({
      reference: z.string().min(1, 'Référence requise'),
      agencyId: z.string().min(1, 'Agency ID requis'),
    });

    const data = schema.parse(body);

    // 1. Vérifier que le QR existe et appartient à l'agence
    const baggage = await db.baggage.findUnique({
      where: { reference: data.reference },
      select: {
        id: true,
        reference: true,
        status: true,
        agencyId: true,
        isLost: true,
        travelerFirstName: true,
        travelerLastName: true,
        customData: true,
        foundAt: true,
      },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'QR code introuvable' },
        { status: 404 }
      );
    }

    if (baggage.agencyId !== data.agencyId) {
      return NextResponse.json(
        { error: 'Ce QR code n\'appartient pas à votre agence' },
        { status: 403 }
      );
    }

    // 2. Vérifier que le QR est bien actif (pas déjà expiré/blocked)
    const ACTIVE_STATUSES = ['activated', 'active', 'lost'];
    if (!ACTIVE_STATUSES.includes(baggage.status)) {
      return NextResponse.json(
        {
          error: `Ce QR n'est pas actif (statut: ${baggage.status}). Impossible de faire un check-out.`,
          currentStatus: baggage.status,
        },
        { status: 400 }
      );
    }

    // 3. Parser customData pour récupérer le nom client (pour le message de confirmation)
    let clientName = '';
    if (baggage.customData) {
      try {
        const parsed = JSON.parse(baggage.customData);
        clientName = parsed.client_name || '';
      } catch {
        // silent
      }
    }
    if (!clientName) {
      clientName = `${baggage.travelerFirstName || ''} ${baggage.travelerLastName || ''}`.trim();
    }

    // 4. Effectuer le check-out
    const updated = await db.baggage.update({
      where: { id: baggage.id },
      data: {
        status: 'expired',
        expiresAt: new Date(),
        foundAt: baggage.isLost ? new Date() : baggage.foundAt,
        isLost: false,
        lostReportedAt: null,
        lostMessage: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Check-out effectué pour ${clientName} (${data.reference})`,
      baggage: {
        id: updated.id,
        reference: updated.reference,
        status: updated.status,
        clientName,
        expiresAt: updated.expiresAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('[checkout] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
