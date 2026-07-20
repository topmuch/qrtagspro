import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ─── Export CSV des bagages (Admin only) ───
// GET /api/admin/export-baggages?type=voyageur|hajj|all&status=active|lost|all

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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';

    const where: Record<string, unknown> = {};
    if (type !== 'all') where.type = type;
    if (status !== 'all') where.status = status;

    const baggages = await db.baggage.findMany({
      where,
      include: { agency: true },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    // CSV header
    const headers = [
      'Reference', 'Type', 'Status', 'Voyageur', 'WhatsApp',
      'Vol', 'Compagnie', 'Destination', 'Pays Destination',
      'Date Depart', 'Heure Depart', 'Agence',
      'Cree le', 'Expire le', 'Dernier Scan', 'Derniere Position',
      'Declare Perdu', 'Retrouve', 'Prolonge par',
    ];

    const rows = baggages.map(b => [
      b.reference,
      b.type,
      b.status,
      `${b.travelerFirstName || ''} ${b.travelerLastName || ''}`.trim(),
      b.whatsappOwner || '',
      b.flightNumber || b.trainNumber || b.busLineNumber || '',
      b.airlineName || b.trainCompany || b.busCompany || b.shipName || '',
      b.destination || '',
      b.destinationCountry || '',
      b.departureDate ? new Date(b.departureDate).toLocaleDateString('fr-FR') : '',
      b.departureTime || '',
      b.agency?.name || '',
      b.createdAt ? new Date(b.createdAt).toLocaleDateString('fr-FR') : '',
      b.expiresAt ? new Date(b.expiresAt).toLocaleDateString('fr-FR') : 'Illimité',
      b.lastScanDate ? new Date(b.lastScanDate).toLocaleDateString('fr-FR') : 'Jamais',
      b.lastLocation || '',
      b.declaredLostAt ? new Date(b.declaredLostAt).toLocaleDateString('fr-FR') : '',
      b.foundAt ? new Date(b.foundAt).toLocaleDateString('fr-FR') : '',
      b.validityExtendedBy || '',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="qrtags-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('[export-baggages] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
