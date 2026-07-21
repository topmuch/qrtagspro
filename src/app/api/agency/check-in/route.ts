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
 * Active un QR code pour un client (check-in) — multi-métiers.
 *
 * Schéma discriminé sur 'agencyType':
 *   - 'hotel': clientName, roomNumber, arrivalDate, departureDate, phone, email, notes
 *   - 'school': studentFirstName, studentLastName, className, parentName, parentPhone, parentEmail, schoolYear
 *
 * L'agencyType est récupéré depuis l'agence du QR (pas du body) pour sécurité.
 */
const hotelSchema = z.object({
  reference: z.string().min(1),
  agencyId: z.string().min(1),
  agencyType: z.literal('hotel'),
  clientName: z.string().min(1, 'Nom du client requis'),
  roomNumber: z.string().min(1, 'N° de chambre requis'),
  arrivalDate: z.string().min(1),
  departureDate: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const schoolSchema = z.object({
  reference: z.string().min(1),
  agencyId: z.string().min(1),
  agencyType: z.literal('school'),
  studentFirstName: z.string().min(1, 'Prénom de l\'élève requis'),
  studentLastName: z.string().min(1, 'Nom de l\'élève requis'),
  className: z.string().min(1, 'Classe requise'),
  parentName: z.string().min(1, 'Nom du parent requis'),
  parentPhone: z.string().min(1, 'Téléphone du parent requis'),
  parentEmail: z.string().email().optional().nullable(),
  schoolYear: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const checkInSchema = z.discriminatedUnion('agencyType', [hotelSchema, schoolSchema]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = checkInSchema.parse(body);

    // 1. Vérifier que le QR existe et appartient à l'agence
    const baggage = await db.baggage.findUnique({
      where: { reference: data.reference },
      include: { agency: { select: { id: true, name: true, agencyType: true } } },
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

    // Vérifier cohérence agencyType (body vs DB)
    const expectedType = baggage.agency?.agencyType || 'generic';
    if (data.agencyType !== expectedType) {
      return NextResponse.json(
        { error: `Type d'agence incohérent (attendu: ${expectedType})` },
        { status: 400 }
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

    // ─── Construction customData + departureDate selon agencyType ───
    let customData: Record<string, unknown>;
    let departureDate: Date;
    let travelerFirstName: string;
    let travelerLastName: string;
    let whatsappOwner: string | null;
    let summary: string; // pour le message de confirmation

    if (data.agencyType === 'hotel') {
      const arrival = new Date(data.arrivalDate);
      departureDate = new Date(data.departureDate);
      if (isNaN(arrival.getTime()) || isNaN(departureDate.getTime())) {
        return NextResponse.json({ error: 'Dates invalides' }, { status: 400 });
      }
      if (departureDate <= arrival) {
        return NextResponse.json(
          { error: 'La date de départ doit être après la date d\'arrivée' },
          { status: 400 }
        );
      }
      const nameParts = data.clientName.trim().split(/\s+/);
      travelerFirstName = nameParts[0] || '';
      travelerLastName = nameParts.slice(1).join(' ') || '';
      whatsappOwner = data.phone || null;
      summary = `${data.clientName} — Chambre ${data.roomNumber}`;
      customData = {
        agencyType: 'hotel',
        client_name: data.clientName.trim(),
        client_first_name: travelerFirstName,
        client_last_name: travelerLastName,
        room_number: data.roomNumber.trim(),
        arrival_date: data.arrivalDate,
        departure_date: data.departureDate,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
        checked_in_at: new Date().toISOString(),
      };
    } else {
      // school
      // Date de départ = 30 juin de l'année scolaire en cours
      // Si on est entre janvier et juin, on prend le 30 juin de cette année
      // Si on est entre juillet et décembre, on prend le 30 juin de l'année suivante
      const now = new Date();
      const year = now.getFullYear();
      const june30ThisYear = new Date(year, 5, 30, 23, 59, 59); // mois 0-indexed: 5 = juin
      departureDate = now <= june30ThisYear
        ? june30ThisYear
        : new Date(year + 1, 5, 30, 23, 59, 59);

      const schoolYear = data.schoolYear || `${year}-${year + 1}`;
      travelerFirstName = data.studentFirstName.trim();
      travelerLastName = data.studentLastName.trim();
      whatsappOwner = data.parentPhone || null;
      summary = `${data.studentFirstName} ${data.studentLastName} — ${data.className}`;
      customData = {
        agencyType: 'school',
        student_first_name: data.studentFirstName.trim(),
        student_last_name: data.studentLastName.trim(),
        student_name: `${data.studentFirstName} ${data.studentLastName}`.trim(),
        class_name: data.className.trim(),
        parent_name: data.parentName.trim(),
        parent_phone: data.parentPhone.trim(),
        parent_email: data.parentEmail || null,
        school_year: schoolYear,
        notes: data.notes || null,
        checked_in_at: new Date().toISOString(),
      };
    }

    // 3. Activer le QR
    const updated = await db.baggage.update({
      where: { id: baggage.id },
      data: {
        status: 'activated',
        travelerFirstName,
        travelerLastName,
        whatsappOwner,
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
        agencyType: data.agencyType,
        summary,
        departureDate: departureDate.toISOString(),
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
