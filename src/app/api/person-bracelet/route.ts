import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper — récupère l'agencyId depuis la session
async function getAgencyIdOrNull(): Promise<string | null> {
  try {
    const { getSession } = await import('@/lib/session');
    const user = await getSession();
    if (!user || user.role !== 'agency' || !user.agencyId) return null;
    return user.agencyId;
  } catch { return null; }
}

// GET /api/person-bracelet?reference=QRT26-XXXX (public, by baggage reference)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference');
  const agencyView = searchParams.get('agencyView'); // if staff: list all

  // Staff dashboard view
  if (agencyView === '1') {
    const agencyId = await getAgencyIdOrNull();
    if (!agencyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const personnes = await db.personBracelet.findMany({
      where: { agencyId },
      include: { baggage: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, personnes });
  }

  // Public: by reference
  if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
  const baggage = await db.baggage.findUnique({
    where: { reference },
    include: { personBracelet: true },
  });
  if (!baggage || !baggage.personBracelet) {
    return NextResponse.json({ found: false });
  }
  if (baggage.personBracelet.status === 'returned') {
    return NextResponse.json({ found: true, returned: true });
  }
  return NextResponse.json({ found: true, person: baggage.personBracelet });
}

// POST /api/person-bracelet — create (staff)
export async function POST(req: NextRequest) {
  const agencyId = await getAgencyIdOrNull();
  if (!agencyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { baggageId, personName, personType, birthDate, language, description, photoUrl, medicalInfo, allergies, bloodType, emergencyContacts } = body;

  if (!personName) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });

  // Check if baggage already linked to a person
  if (baggageId) {
    const existing = await db.personBracelet.findUnique({ where: { baggageId } });
    if (existing) {
      // Update instead of create
      const updated = await db.personBracelet.update({
        where: { id: existing.id },
        data: {
          personName, personType, birthDate: birthDate ? new Date(birthDate) : null,
          language: language || 'fr', description, photoUrl,
          medicalInfo, allergies, bloodType,
          emergencyContacts: emergencyContacts ? JSON.stringify(emergencyContacts) : null,
        },
      });
      return NextResponse.json({ success: true, person: updated });
    }
  }

  const person = await db.personBracelet.create({
    data: {
      agencyId,
      baggageId: baggageId || null,
      personName,
      personType: personType || 'child',
      birthDate: birthDate ? new Date(birthDate) : null,
      language: language || 'fr',
      description, photoUrl,
      medicalInfo, allergies, bloodType,
      emergencyContacts: emergencyContacts ? JSON.stringify(emergencyContacts) : null,
    },
  });

  // Mark baggage as PERSON context
  if (baggageId) {
    await db.baggage.update({ where: { id: baggageId }, data: { context: 'PERSON' } });
  }

  return NextResponse.json({ success: true, person });
}

// PATCH /api/person-bracelet — update status
export async function PATCH(req: NextRequest) {
  const agencyId = await getAgencyIdOrNull();
  if (!agencyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, status, lastSeenLocation } = body;

  const updated = await db.personBracelet.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(lastSeenLocation && { lastSeenLocation, lastSeenAt: new Date() }),
    },
  });

  return NextResponse.json({ success: true, person: updated });
}
