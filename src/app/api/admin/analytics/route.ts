import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ─── Analytics Dashboard (Admin only) ───
// GET /api/admin/analytics

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'superadmin' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const [
      totalBaggages,
      activeBaggages,
      lostBaggages,
      foundBaggages,
      expiredBaggages,
      totalScans,
      totalAgencies,
      totalUsers,
      baggagesByType,
      scansToday,
    ] = await Promise.all([
      db.baggage.count(),
      db.baggage.count({ where: { status: 'active' } }),
      db.baggage.count({ where: { status: 'lost' } }),
      db.baggage.count({ where: { status: 'found' } }),
      db.baggage.count({ where: { status: 'blocked' } }),
      db.scanLog.count(),
      db.agency.count(),
      db.user.count(),
      db.baggage.groupBy({ by: ['type'], _count: true }),
      db.scanLog.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);

    // Recovery rate
    const recoveryRate = lostBaggages + foundBaggages > 0
      ? Math.round((foundBaggages / (lostBaggages + foundBaggages)) * 100)
      : 0;

    return NextResponse.json({
      baggages: {
        total: totalBaggages,
        active: activeBaggages,
        lost: lostBaggages,
        found: foundBaggages,
        expired: expiredBaggages,
        recoveryRate,
      },
      scans: {
        total: totalScans,
        today: scansToday,
      },
      agencies: totalAgencies,
      users: totalUsers,
      byType: baggagesByType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error('[analytics] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
