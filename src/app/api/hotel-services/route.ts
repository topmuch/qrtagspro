import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/hotel-services?agencyId=xxx
 * Récupère les services hôtel actifs pour la page welcome (public).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agencyId = searchParams.get('agencyId');

  if (!agencyId) {
    return NextResponse.json({ error: 'agencyId requis' }, { status: 400 });
  }

  try {
    const services = await db.hotelService.findMany({
      where: { agencyId, isActive: true },
      orderBy: [{ displayTab: 'asc' }, { category: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        type: true,
        category: true,
        isFree: true,
        price: true,
        schedule: true,
        assignedTeam: true,
        displayTab: true,
      },
    });

    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error('[api/hotel-services] Error:', error);
    return NextResponse.json({ success: true, services: [] });
  }
}
