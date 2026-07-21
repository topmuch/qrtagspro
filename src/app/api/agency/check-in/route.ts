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
 *   - 'medical': patientName, fileNumber, service, roomNumber, emergencyContactName, emergencyContactPhone, admissionDate, dischargeDate, notes
 *   - 'car_rental': tenantName, contractNumber, carModel, licensePlate, startDate, endDate, tenantPhone, objectType, notes
 *   - 'luggage_locker': lockerNumber, baggageDescription, depositTime, retrievalTime, travelerName, travelerPhone, depositType, notes
 *   - 'custom': customTypeId, fields (Record<string, unknown>) — validé contre fieldsSchema du CustomAgencyType
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

const medicalSchema = z.object({
  reference: z.string().min(1),
  agencyId: z.string().min(1),
  agencyType: z.literal('medical'),
  patientName: z.string().min(1, 'Nom du patient requis'),
  fileNumber: z.string().min(1, 'N° de dossier requis'),
  service: z.string().optional().nullable(),
  roomNumber: z.string().optional().nullable(),
  emergencyContactName: z.string().min(1, 'Nom du contact d\'urgence requis'),
  emergencyContactPhone: z.string().min(1, 'Téléphone du contact d\'urgence requis'),
  admissionDate: z.string().min(1, 'Date d\'admission requise'),
  dischargeDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const carRentalSchema = z.object({
  reference: z.string().min(1),
  agencyId: z.string().min(1),
  agencyType: z.literal('car_rental'),
  tenantName: z.string().min(1, 'Nom du locataire requis'),
  contractNumber: z.string().min(1, 'N° de contrat requis'),
  carModel: z.string().min(1, 'Modèle du véhicule requis'),
  licensePlate: z.string().min(1, 'Immatriculation requise'),
  startDate: z.string().min(1, 'Date de début de location requise'),
  endDate: z.string().min(1, 'Date de fin de location requise'),
  tenantPhone: z.string().min(1, 'Téléphone du locataire requis'),
  objectType: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const luggageLockerSchema = z.object({
  reference: z.string().min(1),
  agencyId: z.string().min(1),
  agencyType: z.literal('luggage_locker'),
  lockerNumber: z.string().min(1, 'N° de casier requis'),
  baggageDescription: z.string().min(1, 'Description du bagage requise'),
  depositTime: z.string().min(1, 'Heure de dépôt requise'),
  retrievalTime: z.string().min(1, 'Date/heure de retrait prévu requis'),
  travelerName: z.string().min(1, 'Nom du voyageur requis'),
  travelerPhone: z.string().min(1, 'Téléphone du voyageur requis'),
  depositType: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const customSchema = z.object({
  reference: z.string().min(1),
  agencyId: z.string().min(1),
  agencyType: z.literal('custom'),
  customTypeId: z.string().min(1, 'customTypeId requis'),
  fields: z.record(z.string(), z.unknown()),
});

const checkInSchema = z.discriminatedUnion('agencyType', [
  hotelSchema, schoolSchema, medicalSchema, carRentalSchema, luggageLockerSchema, customSchema,
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = checkInSchema.parse(body);

    // 1. Vérifier que le QR existe et appartient à l'agence
    const baggage = await db.baggage.findUnique({
      where: { reference: data.reference },
      include: { agency: { select: {
        id: true, name: true, agencyType: true,
        customTypeId: true,
        customType: { select: {
          id: true, key: true, name: true, icon: true,
          fieldsSchema: true, departureFieldKey: true,
          finderMessage: true, colClientLabel: true, colSubLabel: true,
        } },
      } } },
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
    } else if (data.agencyType === 'school') {
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
    } else if (data.agencyType === 'medical') {
      // medical (clinique)
      const admission = new Date(data.admissionDate);
      if (isNaN(admission.getTime())) {
        return NextResponse.json({ error: 'Date d\'admission invalide' }, { status: 400 });
      }

      // DepartureDate: si dischargeDate fournie → l'utiliser, sinon +30 jours par défaut
      if (data.dischargeDate) {
        const discharge = new Date(data.dischargeDate);
        if (isNaN(discharge.getTime())) {
          return NextResponse.json({ error: 'Date de sortie invalide' }, { status: 400 });
        }
        if (discharge <= admission) {
          return NextResponse.json(
            { error: 'La date de sortie doit être après la date d\'admission' },
            { status: 400 }
          );
        }
        departureDate = discharge;
      } else {
        // Par défaut : 30 jours d'hospitalisation
        departureDate = new Date(admission.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      // Séparer le nom du patient en prénom + nom
      const nameParts = data.patientName.trim().split(/\s+/);
      travelerFirstName = nameParts[0] || '';
      travelerLastName = nameParts.slice(1).join(' ') || '';
      whatsappOwner = data.emergencyContactPhone || null;
      summary = `${data.patientName} — Dossier ${data.fileNumber}`;
      customData = {
        agencyType: 'medical',
        patient_name: data.patientName.trim(),
        patient_first_name: travelerFirstName,
        patient_last_name: travelerLastName,
        file_number: data.fileNumber.trim(),
        service: data.service || null,
        room_number: data.roomNumber || null,
        emergency_contact_name: data.emergencyContactName.trim(),
        emergency_contact_phone: data.emergencyContactPhone.trim(),
        admission_date: data.admissionDate,
        discharge_date: data.dischargeDate || null,
        notes: data.notes || null,
        checked_in_at: new Date().toISOString(),
      };
    } else if (data.agencyType === 'car_rental') {
      // car_rental (loueur auto)
      const startD = new Date(data.startDate);
      const endD = new Date(data.endDate);
      if (isNaN(startD.getTime()) || isNaN(endD.getTime())) {
        return NextResponse.json({ error: 'Dates invalides' }, { status: 400 });
      }
      if (endD <= startD) {
        return NextResponse.json(
          { error: 'La date de fin doit être après la date de début' },
          { status: 400 }
        );
      }
      departureDate = endD;

      // Séparer le nom du locataire en prénom + nom
      const nameParts = data.tenantName.trim().split(/\s+/);
      travelerFirstName = nameParts[0] || '';
      travelerLastName = nameParts.slice(1).join(' ') || '';
      whatsappOwner = data.tenantPhone || null;
      summary = `${data.tenantName} — ${data.carModel} (${data.licensePlate})`;
      customData = {
        agencyType: 'car_rental',
        tenant_name: data.tenantName.trim(),
        tenant_first_name: travelerFirstName,
        tenant_last_name: travelerLastName,
        contract_number: data.contractNumber.trim(),
        car_model: data.carModel.trim(),
        license_plate: data.licensePlate.trim(),
        start_date: data.startDate,
        end_date: data.endDate,
        tenant_phone: data.tenantPhone.trim(),
        object_type: data.objectType || 'clés', // clés, documents, GPS, siège enfant...
        notes: data.notes || null,
        checked_in_at: new Date().toISOString(),
      };
    } else if (data.agencyType === 'luggage_locker') {
      // luggage_locker (consigne)
      // depositTime: heure HH:MM, retrievalTime: datetime-local yyyy-MM-ddTHH:mm
      const depositNow = new Date();
      // Si depositTime est au format HH:mm, on combine avec aujourd'hui
      let depositDate: Date;
      if (data.depositTime.length <= 5) {
        // Format HH:mm
        const [hh, mm] = data.depositTime.split(':').map(n => parseInt(n, 10));
        depositDate = new Date(depositNow);
        if (!isNaN(hh) && !isNaN(mm)) {
          depositDate.setHours(hh, mm, 0, 0);
        }
      } else {
        depositDate = new Date(data.depositTime);
      }

      const retrievalD = new Date(data.retrievalTime);
      if (isNaN(retrievalD.getTime())) {
        return NextResponse.json(
          { error: 'Date/heure de retrait invalide' },
          { status: 400 }
        );
      }
      if (retrievalD <= depositDate) {
        return NextResponse.json(
          { error: 'La date de retrait doit être après l\'heure de dépôt' },
          { status: 400 }
        );
      }
      departureDate = retrievalD;

      // Séparer le nom du voyageur en prénom + nom
      const nameParts = data.travelerName.trim().split(/\s+/);
      travelerFirstName = nameParts[0] || '';
      travelerLastName = nameParts.slice(1).join(' ') || '';
      whatsappOwner = data.travelerPhone || null;
      summary = `Casier ${data.lockerNumber} — ${data.travelerName}`;
      customData = {
        agencyType: 'luggage_locker',
        locker_number: data.lockerNumber.trim(),
        baggage_description: data.baggageDescription.trim(),
        deposit_time: data.depositTime,
        deposit_iso: depositDate.toISOString(),
        retrieval_time: data.retrievalTime,
        retrieval_iso: retrievalD.toISOString(),
        traveler_name: data.travelerName.trim(),
        traveler_first_name: travelerFirstName,
        traveler_last_name: travelerLastName,
        traveler_phone: data.travelerPhone.trim(),
        deposit_type: data.depositType || '24h', // 24h, 48h, 7j
        notes: data.notes || null,
        checked_in_at: new Date().toISOString(),
      };
    } else {
      // custom (métier personnalisable V3)
      const customType = baggage.agency?.customType;
      if (!customType) {
        return NextResponse.json(
          { error: 'Métier personnalisé introuvable pour cette agence' },
          { status: 400 }
        );
      }

      // Vérifier que le customTypeId correspond
      if (baggage.agency?.customTypeId !== data.customTypeId) {
        return NextResponse.json(
          { error: 'customTypeId ne correspond pas à l\'agence' },
          { status: 400 }
        );
      }

      // Parser fieldsSchema pour valider les champs requis
      let fieldsSchema: Array<{
        key: string; label: string; type: string;
        required: boolean; placeholder?: string | null;
        options?: string[] | null; helper?: string | null;
      }>;
      try {
        fieldsSchema = JSON.parse(customType.fieldsSchema);
      } catch {
        return NextResponse.json(
          { error: 'Schéma de champs invalide pour ce métier' },
          { status: 500 }
        );
      }

      // Valider les champs requis
      for (const f of fieldsSchema) {
        if (f.required) {
          const val = data.fields[f.key];
          if (val === undefined || val === null || String(val).trim() === '') {
            return NextResponse.json(
              { error: `Champ requis manquant: ${f.label}` },
              { status: 400 }
            );
          }
        }
      }

      // Déterminer departureDate depuis departureFieldKey (si défini)
      const depKey = customType.departureFieldKey;
      if (depKey && data.fields[depKey]) {
        const depValue = String(data.fields[depKey]);
        const parsed = new Date(depValue);
        if (!isNaN(parsed.getTime())) {
          departureDate = parsed;
        } else {
          // Si parsing échoue, on met une date lointaine (QR reste actif)
          departureDate = new Date('2099-12-31T23:59:59');
        }
      } else {
        // Pas de departureFieldKey → QR reste actif jusqu'au check-out manuel
        departureDate = new Date('2099-12-31T23:59:59');
      }

      // Chercher un champ "nom" pour travelerFirstName/travelerLastName
      const nameField = fieldsSchema.find(f =>
        /name|nom|client|tenant|traveler|patient|student|participant/i.test(f.key) ||
        /nom|name/i.test(f.label)
      );
      const nameValue = nameField ? String(data.fields[nameField.key] || '').trim() : '';
      const nameParts = nameValue.split(/\s+/);
      travelerFirstName = nameParts[0] || '';
      travelerLastName = nameParts.slice(1).join(' ') || '';

      // Chercher un champ téléphone pour whatsappOwner
      const telField = fieldsSchema.find(f => f.type === 'tel');
      whatsappOwner = telField ? String(data.fields[telField.key] || '').trim() || null : null;

      // Construire le summary (premier champ non-vide + nom du métier)
      const firstNonEmpty = fieldsSchema.find(f => {
        const v = data.fields[f.key];
        return v !== undefined && v !== null && String(v).trim() !== '';
      });
      const summaryValue = firstNonEmpty ? String(data.fields[firstNonEmpty.key]) : '';
      summary = summaryValue ? `${summaryValue} — ${customType.name}` : customType.name;

      // Construire customData
      customData = {
        agencyType: 'custom',
        customTypeId: customType.id,
        customTypeName: customType.name,
        customTypeKey: customType.key,
        fields: data.fields,
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
