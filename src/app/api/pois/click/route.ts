import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/pois/click
 * ====================
 * Tracking des clics sur les partenaires depuis le bracelet client.
 *
 * Enregistre un PartnerClick pour :
 *   1. Justifier les commissions (preuve de conversion)
 *   2. Mesurer la performance de chaque partenaire (ROI hôtel)
 *   3. Identifier les lieux populaires pour optimiser le guide
 *
 * Body JSON :
 *   { partnerId: string, agencyId: string, deviceType?: string, source?: string }
 *
 * Sécurité :
 *   - partnerId et agencyId requis
 *   - Vérifie que le partenaire appartient bien à l'agence (anti-fraude)
 *   - Aucune donnée personnelle stockée (pas d'IP, pas d'user agent détaillé)
 *
 * Privacy :
 *   - deviceType est agrégé (MOBILE/TABLET/DESKTOP), pas l'UA complet
 *   - source indique juste le contexte du scan (WRISTBAND/ROOM_QR/LOBBY)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partnerId, agencyId, deviceType, source } = body;

    // ─── Validation ───
    if (!partnerId || !agencyId) {
      return NextResponse.json(
        { error: 'partnerId et agencyId sont requis' },
        { status: 400 }
      );
    }

    // ─── Vérification d'ownership (anti-fraude) ───
    // Le partenaire doit appartenir à l'agence déclarée.
    // Empêche un client malveillant d'injecter des clics sur les partenaires
    // d'un autre hôtel.
    const partner = await db.hotelPartner.findUnique({
      where: { id: partnerId },
      select: { agencyId: true },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire introuvable' }, { status: 404 });
    }

    if (partner.agencyId !== agencyId) {
      // Clic suspect : le partenaire n'appartient pas à cette agence.
      // On refuse silencieusement (200) pour ne pas donner d'info à un attaquant,
      // mais on n'enregistre pas le clic.
      return NextResponse.json({ success: false, error: 'Ownership mismatch' }, { status: 403 });
    }

    // ─── Validation des enums ───
    const validDeviceTypes = ['MOBILE', 'TABLET', 'DESKTOP'];
    const validSources = ['WRISTBAND', 'ROOM_QR', 'LOBBY', 'POOL', 'RESTAURANT'];

    const finalDeviceType = validDeviceTypes.includes(deviceType) ? deviceType : 'MOBILE';
    const finalSource = validSources.includes(source) ? source : 'WRISTBAND';

    // ─── Enregistrement ───
    await db.partnerClick.create({
      data: {
        partnerId,
        agencyId,
        deviceType: finalDeviceType,
        source: finalSource,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/pois/click] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
