import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * GET /api/admin/bracelets/[orderId]/export
 *
 * Exporte la liste des QR codes (Baggage wristband) d'une commande au format
 * CSV, pour envoi à l'imprimeur.
 *
 * Format CSV :
 *   Reference,URL,Context,Status,CreatedAt
 *   QRT26-ABC123,https://qrtags.pro/scan/QRT26-ABC123,WRISTBAND,active,2026-08-08T...
 *
 * Sécurité : réservé au superadmin (vérification session).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // ─── Auth : superadmin uniquement ───
    const user = await getSession();
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { orderId } = await params;

    // ─── Vérifie que la commande existe ───
    const order = await db.braceletPackOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        quantity: true,
        isBranded: true,
        customerName: true,
        agency: { select: { name: true, slug: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    // ─── Récupère tous les QR codes (Baggage) de la commande ───
    const baggages = await db.baggage.findMany({
      where: { braceletPackOrderId: orderId },
      select: {
        reference: true,
        context: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (baggages.length === 0) {
      return NextResponse.json(
        { error: 'Aucun QR code généré pour cette commande. Validez et générez les QR d\'abord.' },
        { status: 400 }
      );
    }

    // ─── Génère le CSV ───
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qrtags.pro';
    // Le scan URL pointe vers la page trouveur existante /scan/[reference]
    // (le wristband context sera géré côté /scan si on l'étend, ou redirigé
    // vers /welcome/[slug]?context=WRISTBAND dans une future itération).
    const agencySlug = order.agency?.slug;

    const csvLines: string[] = [];
    // En-tête
    csvLines.push('Reference,ScanURL,WelcomeURL,Context,Status,CreatedAt');

    // Lignes de données
    for (const b of baggages) {
      const scanUrl = `${baseUrl}/scan/${b.reference}`;
      const welcomeUrl = agencySlug
        ? `${baseUrl}/welcome/${agencySlug}?context=WRISTBAND`
        : '';
      // Échappe les virgules (les références n'en contiennent pas, mais par sécurité)
      const ref = b.reference.includes(',') ? `"${b.reference}"` : b.reference;
      csvLines.push(
        [
          ref,
          scanUrl,
          welcomeUrl,
          b.context || 'WRISTBAND',
          b.status,
          b.createdAt.toISOString(),
        ].join(',')
      );
    }

    const csvContent = csvLines.join('\n');

    // ─── Nom de fichier lisible ───
    const dateStr = new Date().toISOString().slice(0, 10);
    const customerSlug = order.customerName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
    const fileName = `qr-codes-${order.quantity}-${customerSlug}-${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': Buffer.byteLength(csvContent, 'utf-8').toString(),
      },
    });
  } catch (error) {
    console.error('[export CSV] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du CSV.' },
      { status: 500 }
    );
  }
}
