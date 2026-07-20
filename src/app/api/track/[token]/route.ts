import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/track/[token]
 * Renvoie les données de suivi complètes pour le propriétaire :
 *   - infos objet (référence, type, statut, dates, photo, etc.)
 *   - stats (scanCount, dernière activité, dernière position)
 *   - 10 derniers ScanLog
 *
 * Aucune information sensible (whatsappOwner, prénom/nom) n'est renvoyée
 * au-delà du prénom du propriétaire (pour personnaliser le message WhatsApp).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const baggage = await prisma.baggage.findUnique({
      where: { trackingToken: token },
      include: {
        agency: { select: { id: true, name: true } },
        scanLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!baggage || !baggage.trackingEnabled) {
      return NextResponse.json(
        { status: 'not_found', message: 'Lien de suivi invalide ou désactivé' },
        { status: 404 }
      );
    }

    const isLost = Boolean(baggage.isLost) || Boolean(baggage.declaredLostAt && !baggage.foundAt);

    return NextResponse.json({
      status: 'active',
      baggage: {
        reference: baggage.reference,
        type: baggage.type,
        travelerFirstName: baggage.travelerFirstName,
        travelerLastName: baggage.travelerLastName,
        travelerName: `${baggage.travelerFirstName || ''} ${baggage.travelerLastName || ''}`.trim(),
        whatsappOwner: baggage.whatsappOwner,
        status: baggage.status,
        createdAt: baggage.createdAt?.toISOString() || null,
        expiresAt: baggage.expiresAt?.toISOString() || null,
        lastScanDate: baggage.lastScanDate?.toISOString() || null,
        lastScanLocation: baggage.lastScanLocation || null,
        scanCount: baggage.scanCount || 0,
        isLost,
        lostReportedAt: baggage.lostReportedAt?.toISOString() || null,
        lostMessage: baggage.lostMessage || null,
        declaredLostAt: baggage.declaredLostAt?.toISOString() || null,
        foundAt: baggage.foundAt?.toISOString() || null,
        agency: baggage.agency?.name || null,
        trackingToken: baggage.trackingToken,
      },
      scans: baggage.scanLogs.map((s) => ({
        id: s.id,
        scannedAt: s.createdAt?.toISOString() || null,
        location: s.location || null,
        finderName: s.finderName || null,
        finderPhone: s.finderPhone || null,
        message: s.message || null,
        latitude: s.latitude || null,
        longitude: s.longitude || null,
      })),
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error('[track GET] Error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/track/[token]
 * Body: { action: 'declare_lost' | 'cancel_lost', lostMessage?: string }
 * Permet au propriétaire de signaler son objet comme perdu (ou d'annuler).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body?.action as string | undefined;
    const lostMessage = (body?.lostMessage as string | undefined)?.trim() || null;

    const baggage = await prisma.baggage.findUnique({
      where: { trackingToken: token },
      select: { id: true, trackingEnabled: true, declaredLostAt: true },
    });

    if (!baggage || !baggage.trackingEnabled) {
      return NextResponse.json(
        { error: 'Lien de suivi invalide ou désactivé' },
        { status: 404 }
      );
    }

    if (action === 'declare_lost') {
      await prisma.baggage.update({
        where: { id: baggage.id },
        data: {
          isLost: true,
          lostReportedAt: new Date(),
          lostMessage,
          declaredLostAt: baggage.declaredLostAt || new Date(),
        },
      });
      return NextResponse.json({ success: true, isLost: true });
    }

    if (action === 'cancel_lost') {
      await prisma.baggage.update({
        where: { id: baggage.id },
        data: {
          isLost: false,
          lostMessage: null,
          foundAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, isLost: false });
    }

    return NextResponse.json(
      { error: 'Action inconnue. Utilisez declare_lost ou cancel_lost.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[track POST] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
