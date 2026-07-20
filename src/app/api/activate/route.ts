import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';

const activateSchema = z.object({
  reference: z.string().min(1, 'Référence requise'),
  travelerFirstName: z.string().min(1, 'Prénom requis'),
  travelerLastName: z.string().min(1, 'Nom requis'),
  whatsappOwner: z.string().min(1, 'Numéro WhatsApp requis'),
  customData: z.record(z.string(), z.unknown()).optional(),
});

const PENDING_STATUSES = new Set(['in_stock', 'assigned_to_agency', 'sold', 'pending_activation']);

/**
 * Génère un token de suivi unique (24 caractères base36, sans ambiguous chars).
 * Exemple: "x7k2mp9q4t8h6v3f1j5n0wby"
 */
function generateTrackingToken(): string {
  return crypto.randomBytes(12).toString('base64url').replace(/[-_]/g, '').slice(0, 24);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = activateSchema.parse(body);

    const baggage = await db.baggage.findUnique({
      where: { reference: validatedData.reference },
      include: { agency: true },
    });

    if (!baggage) {
      return NextResponse.json({ error: 'Tag introuvable' }, { status: 404 });
    }

    if (!PENDING_STATUSES.has(baggage.status)) {
      return NextResponse.json({ error: 'Tag déjà activé' }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Génère un token unique (avec retry si collision — improbable mais safe)
    let trackingToken = generateTrackingToken();
    let attempts = 0;
    while (attempts < 3) {
      const existing = await db.baggage.findUnique({
        where: { trackingToken },
        select: { id: true },
      });
      if (!existing) break;
      trackingToken = generateTrackingToken();
      attempts++;
    }

    const updatedBaggage = await db.baggage.update({
      where: { id: baggage.id },
      data: {
        travelerFirstName: validatedData.travelerFirstName,
        travelerLastName: validatedData.travelerLastName,
        whatsappOwner: validatedData.whatsappOwner,
        status: 'activated',
        expiresAt,
        trackingToken,
        trackingEnabled: true,
        scanCount: 0,
        isLost: false,
        customData: validatedData.customData ? JSON.stringify(validatedData.customData) : null,
      },
    });

    return NextResponse.json({
      success: true,
      baggage: {
        id: updatedBaggage.id,
        reference: updatedBaggage.reference,
        type: updatedBaggage.type,
        status: updatedBaggage.status,
        expiresAt: updatedBaggage.expiresAt,
        trackingToken: updatedBaggage.trackingToken,
      },
    });
  } catch (error) {
    console.error('[activate] Erreur:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Erreur de validation', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
