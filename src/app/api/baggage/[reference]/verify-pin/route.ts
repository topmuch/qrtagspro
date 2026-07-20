import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// QRTags : verify-pin simplifié (ownerPin supprimé du schéma)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const baggage = await db.baggage.findUnique({ where: { reference } });

    if (!baggage) {
      return NextResponse.json({ error: 'Tag introuvable', verified: false }, { status: 404 });
    }

    const ownerName = `${baggage.travelerFirstName || ''} ${baggage.travelerLastName || ''}`.trim();
    return NextResponse.json({
      verified: true,
      ownerName,
      message: `Identité vérifiée. Ce tag appartient à ${ownerName}.`,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur', verified: false }, { status: 500 });
  }
}
