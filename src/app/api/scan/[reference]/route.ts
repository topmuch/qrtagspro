import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Récupérer les infos d'un tag pour la page trouveur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    const baggage = await prisma.baggage.findUnique({
      where: { reference },
      include: { agency: { select: { id: true, name: true } } },
    });

    if (!baggage) {
      return NextResponse.json({
        status: 'not_found',
        message: 'Code QR non valide',
      }, { status: 404 });
    }

    if (baggage.status === 'blocked') {
      return NextResponse.json({
        status: 'blocked',
        message: 'Ce tag a été bloqué',
      });
    }

    // QRTags : Si le tag n'a PAS de whatsappOwner, il n'est pas vraiment activé
    // → rediriger vers /inscrire pour l'activation
    // (même si le statut est 'activated' à cause d'un ancien bug de génération)
    if (!baggage.whatsappOwner || baggage.whatsappOwner.trim() === '') {
      return NextResponse.json({
        status: 'pending_activation',
        message: 'Ce tag n\'est pas encore activé',
      });
    }

    // Check expiration
    if (baggage.expiresAt && new Date() > baggage.expiresAt) {
      return NextResponse.json({
        status: 'expired',
        message: 'Ce tag a expiré',
        agency: baggage.agency?.name || null,
        baggage: {
          type: baggage.type,
          travelerName: `${baggage.travelerFirstName} ${baggage.travelerLastName}`,
        },
      });
    }

    // Check if declared lost
    const isDeclaredLost = baggage.declaredLostAt && !baggage.foundAt;

    // Parser customData pour afficher les infos objet au trouveur
    // (filtre de confidentialité : on ne renvoie PAS email ni photo au trouveur)
    let objectInfo: Record<string, unknown> | null = null;
    if (baggage.customData) {
      try {
        const parsed = JSON.parse(baggage.customData) as Record<string, unknown>;
        objectInfo = {
          category: parsed.category || null,
          category_label: parsed.category_label || null,
          object_name: parsed.object_name || null,
          object_description: parsed.object_description || null,
          brand: parsed.brand || null,
          model: parsed.model || null,
          color: parsed.color || null,
          reward: parsed.reward || null,
          message_to_finder: parsed.message_to_finder || null,
          city: parsed.city || null,
          country: parsed.country || null,
        };
      } catch {
        objectInfo = null;
      }
    }

    return NextResponse.json({
      status: isDeclaredLost ? 'lost' : 'active',
      theme: baggage.type === 'hajj' ? 'hajj' : 'voyageur',
      type: baggage.type,
      baggage: {
        reference: baggage.reference,
        type: baggage.type,
        travelerName: `${baggage.travelerFirstName} ${baggage.travelerLastName}`,
        travelerFirstName: baggage.travelerFirstName || null,
        status: baggage.status,
        agency: baggage.agency?.name || null,
        whatsappOwner: baggage.whatsappOwner || null,
        declaredLostAt: baggage.declaredLostAt,
        foundAt: baggage.foundAt,
        createdAt: baggage.createdAt?.toISOString() || null,
        isLost: Boolean(baggage.isLost),
        objectInfo,
      },
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

// POST - Logger un scan (quand le trouveur clique sur WhatsApp)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();
    const { location, finderName, finderPhone, latitude, longitude, message } = body;

    const baggage = await prisma.baggage.findUnique({
      where: { reference },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Tag introuvable' },
        { status: 404 }
      );
    }

    // Logger le scan
    await prisma.scanLog.create({
      data: {
        baggageId: baggage.id,
        location: location || null,
        finderName: finderName || null,
        finderPhone: finderPhone || null,
        latitude: latitude || null,
        longitude: longitude || null,
        message: message || null,
      },
    }).catch(() => {
      // Non-bloquant si le log échoue
    });

    // Construire la chaîne de localisation lisible pour le suivi propriétaire
    const readableLocation = location && location.trim() !== ''
      ? location
      : (latitude && longitude
          ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          : 'Position non partagée');

    // Mettre à jour lastScanDate, lastLocation + INCRÉMENTER scanCount + lastScanLocation
    await prisma.baggage.update({
      where: { id: baggage.id },
      data: {
        lastScanDate: new Date(),
        lastLocation: location || null,
        lastScanLocation: readableLocation,
        scanCount: { increment: 1 },
        founderName: finderName || null,
        founderPhone: finderPhone || null,
        founderAt: new Date(),
      },
    }).catch(() => {
      // Non-bloquant
    });

    // Construire l'URL WhatsApp WAME
    const ownerFirstName = baggage.travelerFirstName?.trim() || '';
    const typeLabel = 'objet';
    const lieu = location || 'lieu non précisé';
    const address = latitude && longitude
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : lieu;

    const whatsappText =
      `Bonjour${ownerFirstName ? ` ${ownerFirstName}` : ''}, ` +
      `j'ai trouvé votre ${typeLabel} (réf. ${reference}). ` +
      `Je suis actuellement à cette position : ${address}. ` +
      `— Message envoyé via QRTags.` +
      (finderName ? ` Trouveur : ${finderName}.` : '') +
      (finderPhone ? ` Contact : ${finderPhone}.` : '');

    const phone = (baggage.whatsappOwner || '').replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}`;

    return NextResponse.json({
      success: true,
      whatsappUrl,
      isDeclaredLost: baggage.declaredLostAt && !baggage.foundAt,
    });
  } catch (error) {
    console.error('[scan POST] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
