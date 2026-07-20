import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();
    const { travelerFirstName, travelerLastName, whatsappOwner } = body;

    const baggage = await db.baggage.findUnique({ where: { reference } });
    if (!baggage) {
      return NextResponse.json({ error: 'Tag introuvable' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (travelerFirstName !== undefined) updateData.travelerFirstName = travelerFirstName;
    if (travelerLastName !== undefined) updateData.travelerLastName = travelerLastName;
    if (whatsappOwner !== undefined) updateData.whatsappOwner = whatsappOwner;

    const updated = await db.baggage.update({
      where: { reference },
      data: updateData,
    });

    return NextResponse.json({ success: true, baggage: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
