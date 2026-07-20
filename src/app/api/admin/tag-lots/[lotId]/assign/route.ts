import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * QRTags — API d'assignation d'un lot à une agence
 *
 * POST /api/admin/tag-lots/[lotId]/assign
 *   { agencyId: string }
 *
 * Étape 1 (suite) du workflow QRTags :
 *   Le Superadmin prend un lot existant (status 'generated') et l'assigne
 *   à une agence. Tous les tags du lot passent de 'in_stock' à
 *   'assigned_to_agency'.
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lotId: string }> },
) {
  try {
    const { lotId } = await params;
    const body = await request.json();
    const { agencyId } = body;

    if (!agencyId) {
      return NextResponse.json(
        { error: 'agencyId est requis' },
        { status: 400 },
      );
    }

    // ─── 1. Vérifier que le lot existe ──────────────────────────
    const lot = await db.tagLot.findUnique({
      where: { id: lotId },
      include: { _count: { select: { baggages: true } } },
    });

    if (!lot) {
      return NextResponse.json(
        { error: 'Lot introuvable' },
        { status: 404 },
      );
    }

    // ─── 2. Vérifier que l'agence existe ────────────────────────
    const agency = await db.agency.findUnique({ where: { id: agencyId } });
    if (!agency) {
      return NextResponse.json(
        { error: 'Agence introuvable' },
        { status: 404 },
      );
    }

    // ─── 3. Mettre à jour le lot ────────────────────────────────
    const now = new Date();
    await db.tagLot.update({
      where: { id: lotId },
      data: {
        agencyId,
        status: 'assigned',
        assignedAt: now,
      },
    });

    // ─── 4. Mettre à jour tous les tags du lot ──────────────────
    // Passe de 'in_stock' → 'assigned_to_agency'
    const result = await db.baggage.updateMany({
      where: { lotId, status: 'in_stock' },
      data: {
        agencyId,
        status: 'assigned_to_agency',
        assignedToAgencyAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      lotId,
      agencyId,
      agencyName: agency.name,
      tagsAssigned: result.count,
      message: `${result.count} tag(s) assignés à ${agency.name}`,
    });
  } catch (error) {
    console.error('[QRTags/assign-lot] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'assignation' },
      { status: 500 },
    );
  }
}
