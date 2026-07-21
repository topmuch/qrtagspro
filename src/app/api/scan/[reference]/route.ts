import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/scan/[reference]
 *
 * Page trouveur (Pro) — Renvoie les infos PUBLIQUES d'un QR code pour
 * que le trouveur contacte l'agence (pas le client directement).
 *
 * Confidentialité:
 *   ✅ Nom de l'agence + téléphone de la réception (contactPhone)
 *   ✅ Référence du QR
 *   ✅ Type d'agence (hotel, school, etc.) pour personnaliser l'affichage
 *   ✅ Statut (active / lost / expired / pending_activation)
 *   ❌ PAS le nom du client (privacy)
 *   ❌ PAS le n° de chambre (privacy)
 *   ❌ PAS le téléphone du client (le contact passe par l'agence)
 *   ❌ PAS l'email du client
 *
 * Le trouveur voit: "Objet appartenant à l'Hôtel X — contactez la réception"
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    const baggage = await db.baggage.findUnique({
      where: { reference },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            agencyType: true,
            contactPhone: true,
            phone: true, // fallback si contactPhone pas défini
            email: true,
            logoUrl: true,
            customType: {
              select: {
                id: true,
                name: true,
                icon: true,
                finderMessage: true,
              },
            },
          },
        },
      },
    });

    if (!baggage) {
      return NextResponse.json({
        status: 'not_found',
        message: 'Ce code QR n\'existe pas dans notre système.',
      }, { status: 404 });
    }

    // ─── Statut: bloqué ──────────────────────────────────────────
    if (baggage.status === 'blocked') {
      return NextResponse.json({
        status: 'blocked',
        message: 'Ce QR code a été bloqué.',
        agency: baggage.agency?.name || null,
      });
    }

    // ─── Statut: pas encore activé (en stock) ────────────────────
    const PENDING_STATUSES = ['in_stock', 'assigned_to_agency', 'sold', 'pending_activation'];
    if (PENDING_STATUSES.includes(baggage.status)) {
      return NextResponse.json({
        status: 'pending_activation',
        message: 'Ce QR code n\'est pas encore activé.',
        agency: baggage.agency?.name || null,
      });
    }

    // ─── Statut: expiré (check-out fait ou date dépassée) ────────
    if (baggage.expiresAt && new Date() > baggage.expiresAt) {
      return NextResponse.json({
        status: 'expired',
        message: 'Ce QR code a expiré (séjour terminé).',
        agency: baggage.agency?.name || null,
      });
    }

    // ─── Statut: perdu ou actif ──────────────────────────────────
    const isLost = Boolean(baggage.isLost) ||
      Boolean(baggage.declaredLostAt && !baggage.foundAt);

    // Téléphone de contact = contactPhone (priorité) ou phone (fallback)
    const contactPhone = baggage.agency?.contactPhone || baggage.agency?.phone || null;

    return NextResponse.json({
      status: isLost ? 'lost' : 'active',
      reference: baggage.reference,
      agency: baggage.agency ? {
        name: baggage.agency.name,
        agencyType: baggage.agency.agencyType,
        contactPhone,
        email: baggage.agency.email,
        logoUrl: baggage.agency.logoUrl,
        customType: baggage.agency.customType ? {
          name: baggage.agency.customType.name,
          icon: baggage.agency.customType.icon,
          finderMessage: baggage.agency.customType.finderMessage,
        } : null,
      } : null,
      // POUR LE MOMENT on ne renvoie rien du client (privacy total V1)
      // Plus tard, on pourra renvoyer un message personnalisé configuré par l'agence
      isLost,
      declaredLostAt: baggage.declaredLostAt?.toISOString() || null,
      foundAt: baggage.foundAt?.toISOString() || null,
      createdAt: baggage.createdAt?.toISOString() || null,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[scan GET] Error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scan/[reference]
 *
 * Logger un scan trouveur et renvoyer l'URL WhatsApp WAME pré-remplie
 * vers l'agence (contactPhone) — PAS vers le client.
 *
 * Body:
 *   finderName:    string (nom du trouveur)
 *   finderPhone:   string (téléphone du trouveur)
 *   location?:     string (lieu précis saisi par le trouveur)
 *   latitude?:     number (GPS)
 *   longitude?:    number (GPS)
 *   message?:      string (message optionnel du trouveur)
 *
 * Retourne:
 *   whatsappUrl: string — URL wa.me pré-remplie vers l'agence
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json().catch(() => ({}));
    const {
      location,
      finderName,
      finderPhone,
      latitude,
      longitude,
      message,
    } = body;

    const baggage = await db.baggage.findUnique({
      where: { reference },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            agencyType: true,
            contactPhone: true,
            phone: true,
            customType: {
              select: {
                id: true,
                name: true,
                finderMessage: true,
              },
            },
          },
        },
      },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'QR code introuvable' },
        { status: 404 }
      );
    }

    if (!baggage.agency) {
      return NextResponse.json(
        { error: 'Aucune agence associée à ce QR' },
        { status: 400 }
      );
    }

    // ─── Logger le scan (ScanLog) ────────────────────────────────
    try {
      await db.scanLog.create({
        data: {
          baggageId: baggage.id,
          location: location || null,
          finderName: finderName || null,
          finderPhone: finderPhone || null,
          latitude: latitude || null,
          longitude: longitude || null,
          message: message || null,
        },
      });
    } catch (err) {
      // Non-bloquant si le log échoue
      console.error('[scan POST] ScanLog creation failed:', err);
    }

    // ─── Mettre à jour les stats du baggage ──────────────────────
    try {
      await db.baggage.update({
        where: { id: baggage.id },
        data: {
          lastScanDate: new Date(),
          lastLocation: location || null,
          lastScanLocation: location ||
            (latitude && longitude
              ? `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`
              : 'Position non partagée'),
          scanCount: { increment: 1 },
          founderName: finderName || null,
          founderPhone: finderPhone || null,
          founderAt: new Date(),
        },
      });
    } catch (err) {
      // Non-bloquant
      console.error('[scan POST] Baggage update failed:', err);
    }

    // ─── Construire l'URL WhatsApp WAME vers l'agence ────────────
    const agencyName = baggage.agency.name;
    const contactPhone = baggage.agency.contactPhone || baggage.agency.phone || '';

    if (!contactPhone) {
      return NextResponse.json({
        success: false,
        error: 'Aucun numéro de contact configuré pour cette agence',
        agencyName,
      }, { status: 400 });
    }

    // Nettoyer le numéro (garder uniquement les chiffres)
    const phoneDigits = contactPhone.replace(/[^0-9]/g, '');

    // Position du trouveur
    const locationLine = latitude && longitude
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : (location || 'Position non précisée');

    // Message WhatsApp pré-rempli à destination de la RÉCEPTION
    // Si customType.finderMessage est défini, l'utiliser avec variables
    // Variables supportées: {reference}, {agencyName}, {finderName}, {finderPhone}, {location}
    let whatsappText: string;
    const customFinderMessage = baggage.agency?.customType?.finderMessage;

    if (customFinderMessage && customFinderMessage.trim()) {
      // Substitution des variables
      whatsappText = customFinderMessage
        .replace(/\{reference\}/g, reference)
        .replace(/\{agencyName\}/g, agencyName)
        .replace(/\{finderName\}/g, finderName || 'Anonyme')
        .replace(/\{finderPhone\}/g, finderPhone || 'Non fourni')
        .replace(/\{location\}/g, locationLine)
        .replace(/\{message\}/g, message || '');
    } else {
      // Message par défaut
      whatsappText =
        `Bonjour ${agencyName},\n\n` +
        `J'ai trouvé un objet portant votre QR code (réf. ${reference}).\n\n` +
        `📍 Ma position : ${locationLine}\n` +
        (finderName ? `👤 Trouveur : ${finderName}\n` : '') +
        (finderPhone ? `📞 Contact : ${finderPhone}\n` : '') +
        (message ? `💬 Message : ${message}\n` : '') +
        `\nMerci de me confirmer la marche à suite pour la restitution.\n\n` +
        `— Message envoyé via QRTagsPro`;
    }

    const whatsappUrl = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(whatsappText)}`;

    return NextResponse.json({
      success: true,
      whatsappUrl,
      agencyName,
      isLost: Boolean(baggage.isLost) ||
        Boolean(baggage.declaredLostAt && !baggage.foundAt),
    });
  } catch (error) {
    console.error('[scan POST] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
