import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

/**
 * GET /api/agency/check-in?reference=XXX&agencyId=YYY
 *
 * Vérifie qu'un QR est valide pour check-in:
 *   - existe
 *   - appartient à l'agence
 *   - est en statut 'in_stock' ou 'assigned_to_agency'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const agencyId = searchParams.get('agencyId');

    if (!reference || !agencyId) {
      return NextResponse.json(
        { error: 'reference et agencyId requis' },
        { status: 400 }
      );
    }

    const baggage = await db.baggage.findUnique({
      where: { reference },
      select: {
        id: true,
        reference: true,
        status: true,
        agencyId: true,
        createdAt: true,
      },
    });

    if (!baggage) {
      return NextResponse.json(
        { available: false, error: 'QR code introuvable' },
        { status: 404 }
      );
    }

    if (baggage.agencyId !== agencyId) {
      return NextResponse.json(
        { available: false, error: 'Ce QR n\'appartient pas à votre agence' },
        { status: 403 }
      );
    }

    const PENDING_STATUSES = ['in_stock', 'assigned_to_agency'];
    if (!PENDING_STATUSES.includes(baggage.status)) {
      return NextResponse.json(
        {
          available: false,
          error: `Ce QR est déjà activé (statut: ${baggage.status})`,
          currentStatus: baggage.status,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      available: true,
      reference: baggage.reference,
      status: baggage.status,
      createdAt: baggage.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('[check-in GET] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agency/check-in
 *
 * Active un QR code pour un client hôtel (check-in).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const schema = z.object({
      reference: z.string().min(1, 'Référence requise'),
      agencyId: z.string().min(1, 'Agency ID requis'),
      clientName: z.string().min(1, 'Nom du client requis'),
      roomNumber: z.string().min(1, 'N° de chambre requis'),
      arrivalDate: z.string().min(1, 'Date d\'arrivée requise'),
      departureDate: z.string().min(1, 'Date de départ requise'),
      phone: z.string().optional().nullable(),
      email: z.string().email().optional().nullable(),
      notes: z.string().optional().nullable(),
    });

    const data = schema.parse(body);

    // 1. Vérifier que le QR existe et appartient à l'agence
    const baggage = await db.baggage.findUnique({
      where: { reference: data.reference },
      include: { agency: { select: { id: true, name: true } } },
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

    // 2. Vérifier que le QR n'est pas déjà activé
    const PENDING_STATUSES = ['in_stock', 'assigned_to_agency', 'sold', 'pending_activation'];
    if (!PENDING_STATUSES.includes(baggage.status)) {
      return NextResponse.json(
        {
          error: `Ce QR est déjà activé (statut: ${baggage.status}). Faites un check-out d'abord si nécessaire.`,
          currentStatus: baggage.status,
        },
        { status: 400 }
      );
    }

    // 3. Parser les dates (gérer format yyyy-mm-dd depuis input type="date")
    const arrivalDate = new Date(data.arrivalDate);
    const departureDate = new Date(data.departureDate);

    if (isNaN(arrivalDate.getTime()) || isNaN(departureDate.getTime())) {
      return NextResponse.json(
        { error: 'Dates invalides' },
        { status: 400 }
      );
    }

    if (departureDate <= arrivalDate) {
      return NextResponse.json(
        { error: 'La date de départ doit être après la date d\'arrivée' },
        { status: 400 }
      );
    }

    // 4. Séparer le nom complet en prénom + nom
    const nameParts = data.clientName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // 5. Construire customData (JSON string)
    const customData = {
      agencyType: 'hotel',
      client_name: data.clientName.trim(),
      client_first_name: firstName,
      client_last_name: lastName,
      room_number: data.roomNumber.trim(),
      arrival_date: data.arrivalDate,
      departure_date: data.departureDate,
      phone: data.phone || null,
      email: data.email || null,
      notes: data.notes || null,
      checked_in_at: new Date().toISOString(),
    };

    // 6. Activer le QR
    const updated = await db.baggage.update({
      where: { id: baggage.id },
      data: {
        status: 'activated',
        travelerFirstName: firstName,
        travelerLastName: lastName,
        whatsappOwner: data.phone || null,
        customData: JSON.stringify(customData),
        departureDate,
        expiresAt: departureDate,
        isLost: false,
        lostReportedAt: null,
        lostMessage: null,
      },
    });

    return NextResponse.json({
      success: true,
      baggage: {
        id: updated.id,
        reference: updated.reference,
        status: updated.status,
        clientName: data.clientName,
        roomNumber: data.roomNumber,
        arrivalDate: data.arrivalDate,
        departureDate: data.departureDate,
        expiresAt: updated.expiresAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('[check-in] Error:', error);

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
