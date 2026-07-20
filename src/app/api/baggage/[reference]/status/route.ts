import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * QRTags — API de gestion du statut d'un tag
 * GET / POST / PATCH /api/baggage/[reference]/status
 */

const VALID_STATUSES = [
  'in_stock', 'assigned_to_agency', 'sold', 'activated',
  'scanned', 'lost', 'found', 'blocked',
  'pending_activation', 'active',
];

function normalizeStatus(s: string): string {
  if (s === 'pending_activation') return 'in_stock';
  if (s === 'active') return 'activated';
  return s;
}

async function updateTagStatus(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> },
) {
  try {
    const { reference } = await params;
    const body = await request.json();
    const { status: rawStatus, buyerName, buyerPhone, salePrice } = body;

    if (!rawStatus || !VALID_STATUSES.includes(rawStatus)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const status = normalizeStatus(rawStatus);

    const tag = await db.baggage.findUnique({ where: { reference } });
    if (!tag) {
      return NextResponse.json({ error: 'Tag introuvable' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { status };
    if (status === 'sold') updateData.founderName = buyerName || null;
    if (status === 'sold') updateData.founderPhone = buyerPhone || null;
    if (status === 'lost') updateData.declaredLostAt = new Date();
    if (status === 'found') updateData.foundAt = new Date();

    const updated = await db.baggage.update({
      where: { reference },
      data: updateData,
      include: { agency: { select: { id: true, name: true, agencyType: true } } },
    });

    return NextResponse.json({ success: true, tag: updated });
  } catch (error) {
    console.error('[status] Erreur:', error);
    const errMsg = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: `Erreur: ${errMsg}` }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ reference: string }> },
) {
  try {
    const { reference } = await ctx.params;
    const tag = await db.baggage.findUnique({
      where: { reference },
      include: { agency: { select: { id: true, name: true, agencyType: true } } },
    });
    if (!tag) return NextResponse.json({ error: 'Tag introuvable' }, { status: 404 });
    return NextResponse.json({ tag });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ reference: string }> }) {
  return updateTagStatus(request, ctx);
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ reference: string }> }) {
  return updateTagStatus(request, ctx);
}
