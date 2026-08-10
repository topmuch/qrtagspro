import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/service-request
 * Crée une demande client depuis le bracelet.
 * Body: { serviceId, agencyId, baggageId?, roomNumber?, guestName?, notes? }
 *
 * GET /api/service-request?agencyId=xxx&status=new
 * Récupère les demandes d'une agence (pour le dashboard staff).
 *
 * PATCH /api/service-request?id=xxx&status=in_progress
 * Met à jour le statut d'une demande (new→in_progress→done→cancelled).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agencyIdParam = searchParams.get('agencyId');
  const status = searchParams.get('status');

  // Récupère l'agencyId depuis la session si pas fourni
  let agencyId = agencyIdParam;
  if (!agencyId || agencyId === 'auto') {
    try {
      const { getSession } = await import('@/lib/session');
      const user = await getSession();
      agencyId = user?.agencyId || null;
    } catch { /* ignore */ }
  }

  if (!agencyId) {
    return NextResponse.json({ success: true, requests: [] });
  }

  try {
    const requests = await db.serviceRequest.findMany({
      where: {
        agencyId,
        ...(status && status !== 'all' ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        service: { select: { id: true, name: true, icon: true, category: true, type: true, assignedTeam: true } },
      },
      take: 50,
    });

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('[api/service-request GET] Error:', error);
    return NextResponse.json({ success: true, requests: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, agencyId, baggageId, roomNumber, guestName, guestPhone, notes, items } = body;

    if (!serviceId || !agencyId) {
      return NextResponse.json({ error: 'serviceId et agencyId requis' }, { status: 400 });
    }

    // Récupérer le service pour le montant
    const service = await db.hotelService.findUnique({
      where: { id: serviceId },
      select: { isFree: true, price: true, name: true, assignedTeam: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service introuvable' }, { status: 404 });
    }

    const totalAmount = service.isFree ? 0 : (service.price || 0);

    const request_record = await db.serviceRequest.create({
      data: {
        agencyId,
        serviceId,
        baggageId: baggageId || null,
        roomNumber: roomNumber || null,
        guestName: guestName || null,
        guestPhone: guestPhone || null,
        notes: notes || null,
        items: items ? JSON.stringify(items) : null,
        status: 'new',
        totalAmount,
      },
    });

    // TODO: envoyer email à l'équipe (service.assignedTeam → Team.email)
    // Pour l'instant: console.log
    console.log(`[service-request] Nouvelle demande: ${service.name} → équipe ${service.assignedTeam}`);

    // Envoyer un email si le système email est configuré
    try {
      const team = await db.team.findFirst({
        where: { agencyId, category: service.assignedTeam },
        select: { email: true },
      });
      if (team?.email) {
        const { sendEmail } = await import('@/lib/email');
        await sendEmail({
          to: team.email,
          subject: `Nouvelle demande: ${service.name}${roomNumber ? ` - Ch. ${roomNumber}` : ''}`,
          html: `
            <h2>Nouvelle demande client</h2>
            <p><strong>Service:</strong> ${service.name}</p>
            <p><strong>Client:</strong> ${guestName || 'Non identifié'}</p>
            ${roomNumber ? `<p><strong>Chambre:</strong> ${roomNumber}</p>` : ''}
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            <p><strong>Montant:</strong> ${totalAmount > 0 ? totalAmount + ' FCFA' : 'Gratuit'}</p>
            <p style="margin-top:20px"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://entreprise.qrtags.pro'}/agence/staff" style="background:#32ba5d;color:#000;padding:10px 20px;text-decoration:none;border-radius:8px;font-weight:bold">Voir la demande</a></p>
          `,
          text: `Nouvelle demande: ${service.name} - Ch. ${roomNumber || 'N/A'} - ${guestName || 'Non identifié'}`,
          type: 'service_request',
        });
        console.log(`[service-request] Email envoyé à ${team.email}`);
      }
    } catch (emailErr) {
      console.error('[service-request] Email failed:', emailErr);
    }

    return NextResponse.json({ success: true, requestId: request_record.id });
  } catch (error) {
    console.error('[api/service-request POST] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const status = searchParams.get('status');
  const handledBy = searchParams.get('handledBy');

  if (!id || !status) {
    return NextResponse.json({ error: 'id et status requis' }, { status: 400 });
  }

  try {
    const data: Record<string, unknown> = { status };
    if (status === 'in_progress' || status === 'done') {
      data.handledBy = handledBy || 'Staff';
      if (status === 'done') data.handledAt = new Date();
    }

    await db.serviceRequest.update({ where: { id }, data });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/service-request PATCH] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
