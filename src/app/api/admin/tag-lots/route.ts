import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * QRTags — API de liste des lots de QR codes (Superadmin)
 *
 * GET /api/admin/tag-lots
 *   ?agencyId=xxx    → filtre par agence
 *   ?status=xxx      → filtre par statut (generated | assigned | partially_sold | sold_out)
 *
 * Retourne la liste des TagLot avec compteurs de tags par statut.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (agencyId) where.agencyId = agencyId;
    if (status)   where.status = status;

    const lots = await db.tagLot.findMany({
      where,
      include: {
        agency: {
          select: { id: true, name: true, agencyType: true },
        },
        generatedBy: {
          select: { id: true, name: true, email: true },
        },
        _count: { select: { baggages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrichir avec compteurs par statut de tag
    const enriched = await Promise.all(
      lots.map(async (lot) => {
        const tagStats = await db.baggage.groupBy({
          by: ['status'],
          where: { lotId: lot.id },
          _count: true,
        });
        const statsMap: Record<string, number> = {};
        for (const s of tagStats) {
          statsMap[s.status] = s._count;
        }
        return {
          ...lot,
          tagCount: lot._count.baggages,
          tagStats: statsMap,
        };
      }),
    );

    return NextResponse.json({ lots: enriched });
  } catch (error) {
    console.error('[QRTags/tag-lots GET] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
