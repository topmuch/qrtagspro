import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── LABS — Feature G: API publique pour la page de partage ───
//
// GET /api/share/[token]
//   Renvoie les informations de suivi (LECTURE SEULE) pour la page
//   /share/[token]. Aucun PIN requis — le token lui-même est l'auth.
//
// Note QRTags: la colonne `shareToken` a été supprimée du schéma lors
// des fix précédents. Cette route est gardée pour compatibilité mais
// renvoie 404 (le partage se fait désormais via /track/[trackingToken]).
//
// Sécurité :
//  - Aucune info sensible renvoyée (pas de phone, pas d'email)

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 16) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 400 }
      );
    }

    // QRTags: la colonne shareToken n'existe plus.
    // Le partage se fait maintenant via /track/[trackingToken].
    // On essaie quand même avec trackingToken pour rétro-compatibilité.
    const baggage = await db.baggage.findUnique({
      where: { trackingToken: token },
      include: {
        scanLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            location: true,
            city: true,
            country: true,
            finderName: true,
            createdAt: true,
          },
        },
      },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Lien de partage invalide ou révoqué' },
        { status: 404 }
      );
    }

    if (baggage.status === 'pending_activation') {
      return NextResponse.json(
        { error: 'Ce bagage n\'est pas encore activé' },
        { status: 400 }
      );
    }

    // Construire la réponse — SANS données sensibles
    return NextResponse.json({
      reference: baggage.reference,
      travelerName: `${baggage.travelerFirstName || ''} ${baggage.travelerLastName || ''}`.trim() || 'Voyageur',
      type: baggage.type,
      status: baggage.status,
      lastScanDate: baggage.lastScanDate?.toISOString() || null,
      lastLocation: baggage.lastLocation,
      lastScanLocation: baggage.lastScanLocation,
      scanCount: baggage.scanCount || 0,
      declaredLostAt: baggage.declaredLostAt?.toISOString() || null,
      foundAt: baggage.foundAt?.toISOString() || null,
      expiresAt: baggage.expiresAt?.toISOString() || null,
      scans: baggage.scanLogs.map((scan) => ({
        location: scan.location,
        city: scan.city,
        country: scan.country,
        finderName: scan.finderName,
        scannedAt: scan.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[share GET] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
