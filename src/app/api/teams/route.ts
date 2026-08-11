import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function getAgencyId(): Promise<string | null> {
  try {
    const { getSession } = await import('@/lib/session');
    const user = await getSession();
    if (!user || user.role !== 'agency' || !user.agencyId) return null;
    return user.agencyId;
  } catch { return null; }
}

// GET — liste les équipes + récupère l'email principal du compte (pour pré-remplir)
export async function GET() {
  const agencyId = await getAgencyId();
  if (!agencyId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const agency = await db.agency.findUnique({
    where: { id: agencyId },
    select: { email: true, agencyType: true, name: true },
  });
  const teams = await db.team.findMany({
    where: { agencyId },
    orderBy: { category: 'asc' },
  });

  // Détermine les catégories attendues selon le type d'agence
  const isAirbnb = agency?.agencyType === 'airbnb';
  const expectedCategories = isAirbnb
    ? ['reception', 'housekeeping', 'maintenance', 'concierge']
    : ['reception', 'kitchen', 'housekeeping', 'maintenance', 'spa', 'bar', 'management'];

  return NextResponse.json({
    success: true,
    agencyEmail: agency?.email || '',
    agencyName: agency?.name || '',
    agencyType: agency?.agencyType || 'generic',
    teams,
    expectedCategories,
  });
}

// POST — crée ou met à jour une équipe
export async function POST(req: NextRequest) {
  const agencyId = await getAgencyId();
  if (!agencyId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json();
  const { category, email, label } = body;
  if (!category || !email) return NextResponse.json({ error: 'Catégorie et email requis' }, { status: 400 });

  // Upsert: une équipe par catégorie par agence (@@unique([agencyId, category]))
  const team = await db.team.upsert({
    where: { agencyId_category: { agencyId, category } },
    create: { agencyId, category, email, label: label || null },
    update: { email, label: label || null },
  });

  return NextResponse.json({ success: true, team });
}

// PATCH — met à jour plusieurs équipes d'un coup
export async function PATCH(req: NextRequest) {
  const agencyId = await getAgencyId();
  if (!agencyId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json();
  const teams = body.teams as Array<{ category: string; email: string; label?: string }>;

  if (!Array.isArray(teams)) return NextResponse.json({ error: 'Format invalide' }, { status: 400 });

  for (const t of teams) {
    if (!t.category || !t.email) continue;
    await db.team.upsert({
      where: { agencyId_category: { agencyId, category: t.category } },
      create: { agencyId, category: t.category, email: t.email, label: t.label || null },
      update: { email: t.email, label: t.label || null },
    });
  }

  return NextResponse.json({ success: true });
}
