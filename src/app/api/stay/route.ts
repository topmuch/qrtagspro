import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/stay?reference=QRT26-XXXXXX
 * Récupère le séjour lié à un bracelet (pour la page welcome).
 * Public (pas d'auth) — le client scanne le QR et voit son séjour.
 *
 * POST /api/stay
 * Crée un séjour (check-in par la réception).
 * Body: { reference, roomNumber, guestName, guestEmail, guestPhone, language, checkInDate, checkOutDate, nbPersons }
 *
 * DELETE /api/stay?id=xxx
 * Check-out (désactive le séjour + désactive le bracelet)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.json({ error: 'reference requis' }, { status: 400 });
  }

  try {
    const baggage = await db.baggage.findUnique({
      where: { reference },
      select: { id: true, status: true, context: true },
    });

    if (!baggage) {
      return NextResponse.json({ found: false });
    }

    const stay = await db.stay.findFirst({
      where: { baggageId: baggage.id, status: 'active' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        roomNumber: true,
        guestName: true,
        guestEmail: true,
        guestPhone: true,
        language: true,
        checkInDate: true,
        checkOutDate: true,
        nbPersons: true,
        status: true,
      },
    });

    return NextResponse.json({
      found: true,
      baggageStatus: baggage.status,
      baggageContext: baggage.context,
      stay,
    });
  } catch (error) {
    console.error('[api/stay GET] Error:', error);
    return NextResponse.json({ found: false });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, roomNumber, guestName, guestEmail, guestPhone, language, checkInDate, checkOutDate, nbPersons } = body;

    if (!reference) {
      return NextResponse.json({ error: 'reference requis' }, { status: 400 });
    }

    const baggage = await db.baggage.findUnique({
      where: { reference },
      select: { id: true, agencyId: true, status: true },
    });

    if (!baggage) {
      return NextResponse.json({ error: 'Bracelet introuvable' }, { status: 404 });
    }

    if (!baggage.agencyId) {
      return NextResponse.json({ error: 'Bracelet non assigné à un hôtel' }, { status: 400 });
    }

    // Désactiver les anciens stays de ce bracelet
    await db.stay.updateMany({
      where: { baggageId: baggage.id, status: 'active' },
      data: { status: 'checked_out' },
    });

    // Créer le nouveau séjour
    const stay = await db.stay.create({
      data: {
        agencyId: baggage.agencyId,
        baggageId: baggage.id,
        roomNumber: roomNumber || null,
        guestName: guestName || null,
        guestEmail: guestEmail || null,
        guestPhone: guestPhone || null,
        language: language || 'fr',
        checkInDate: new Date(checkInDate || Date.now()),
        checkOutDate: new Date(checkOutDate || (Date.now() + 7 * 24 * 60 * 60 * 1000)),
        nbPersons: nbPersons || 1,
        status: 'active',
      },
    });

    // Activer le bracelet s'il ne l'était pas
    if (baggage.status !== 'active') {
      await db.baggage.update({
        where: { id: baggage.id },
        data: { status: 'active' },
      });
    }

    return NextResponse.json({ success: true, stayId: stay.id });
  } catch (error) {
    console.error('[api/stay POST] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 });
  }

  try {
    // Check-out : désactive le séjour
    const stay = await db.stay.update({
      where: { id },
      data: { status: 'checked_out' },
      select: { baggageId: true },
    });

    // Désactive aussi le bracelet
    if (stay.baggageId) {
      await db.baggage.update({
        where: { id: stay.baggageId },
        data: { status: 'expired' },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/stay DELETE] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
