import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/service-request
 * Crée une demande client depuis le bracelet.
 * Body: { serviceId, agencyId, baggageId?, roomNumber?, guestName?, guestPhone?, guestEmail?, notes?, items? }
 *
 * GET /api/service-request?agencyId=xxx&status=new
 * Récupère les demandes d'une agence (pour le dashboard staff).
 *
 * PATCH /api/service-request?id=xxx&status=in_progress
 * Met à jour le statut d'une demande (new→in_progress→done→cancelled).
 * Notifie le client par email si guestEmail est disponible.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://entreprise.qrtags.pro';

// ─── i18n pour emails client ───
const T = {
  fr: {
    subjectInProgress: 'Votre demande est en cours de traitement',
    subjectDone: 'Votre demande a été traitée',
    subjectCancelled: 'Votre demande a été annulée',
    bodyInProgress: 'Bonjour,\n\nVotre demande "{serviceName}" est maintenant en cours de traitement par notre équipe.\n\nNous vous tiendrons informé(e) de son avancement.\n\nCordialement,\n{agencyName}',
    bodyDone: 'Bonjour,\n\nVotre demande "{serviceName}" a été traitée avec succès.\n\nMerci pour votre confiance.\n\nCordialement,\n{agencyName}',
    bodyCancelled: 'Bonjour,\n\nVotre demande "{serviceName}" a été annulée. Si vous pensez qu\'il s\'agit d\'une erreur, n\'hésitez pas à nous contacter.\n\nCordialement,\n{agencyName}',
  },
  en: {
    subjectInProgress: 'Your request is being processed',
    subjectDone: 'Your request has been completed',
    subjectCancelled: 'Your request has been cancelled',
    bodyInProgress: 'Hello,\n\nYour request "{serviceName}" is now being processed by our team.\n\nWe will keep you informed of its progress.\n\nBest regards,\n{agencyName}',
    bodyDone: 'Hello,\n\nYour request "{serviceName}" has been successfully completed.\n\nThank you for your trust.\n\nBest regards,\n{agencyName}',
    bodyCancelled: 'Hello,\n\nYour request "{serviceName}" has been cancelled. If you believe this is an error, please contact us.\n\nBest regards,\n{agencyName}',
  },
  es: {
    subjectInProgress: 'Su solicitud está siendo procesada',
    subjectDone: 'Su solicitud ha sido completada',
    subjectCancelled: 'Su solicitud ha sido cancelada',
    bodyInProgress: 'Hola,\n\nSu solicitud "{serviceName}" está siendo procesada por nuestro equipo.\n\nLe mantendremos informado del progreso.\n\nSaludos cordiales,\n{agencyName}',
    bodyDone: 'Hola,\n\nSu solicitud "{serviceName}" ha sido completada con éxito.\n\nGracias por su confianza.\n\nSaludos cordiales,\n{agencyName}',
    bodyCancelled: 'Hola,\n\nSu solicitud "{serviceName}" ha sido cancelada. Si cree que es un error, contáctenos.\n\nSaludos cordiales,\n{agencyName}',
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agencyIdParam = searchParams.get('agencyId');
  const status = searchParams.get('status');

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
    const { serviceId, agencyId, baggageId, roomNumber, guestName, guestPhone, guestEmail, notes, items } = body;

    if (!serviceId || !agencyId) {
      return NextResponse.json({ error: 'serviceId et agencyId requis' }, { status: 400 });
    }

    // Récupérer le service + agence
    const service = await db.hotelService.findUnique({
      where: { id: serviceId },
      select: { isFree: true, price: true, name: true, assignedTeam: true, category: true, type: true, icon: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service introuvable' }, { status: 404 });
    }

    // Récupérer l'email client depuis Stay si pas fourni directement
    let clientEmail = guestEmail;
    let clientLang = 'fr';
    if (!clientEmail && baggageId) {
      const stay = await db.stay.findFirst({
        where: { baggageId, status: 'active' },
        select: { guestEmail: true, language: true, guestName: true, roomNumber: true },
      });
      if (stay) {
        clientEmail = stay.guestEmail;
        clientLang = stay.language || 'fr';
      }
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

    // ─── Email staff (équipe assignée) ───
    try {
      const team = await db.team.findFirst({
        where: { agencyId, category: service.assignedTeam },
        select: { email: true, label: true },
      });
      const agency = await db.agency.findUnique({ where: { id: agencyId }, select: { name: true } });

      if (team?.email) {
        const { sendEmail } = await import('@/lib/email');
        const dashboardLink = `${APP_URL}/agence/staff?request=${request_record.id}`;
        const itemsList = items && Array.isArray(items) && items.length > 0
          ? items.map((i: { name?: string; quantity?: number; price?: number }) => `  • ${i.quantity || 1}x ${i.name || ''} — ${(i.price || 0) * (i.quantity || 1)} FCFA`).join('\n')
          : '';
        await sendEmail({
          to: team.email,
          subject: `🔔 [${service.assignedTeam}] ${service.name}${roomNumber ? ` — Ch. ${roomNumber}` : ''} — ${agency?.name || ''}`,
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #134288; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
                <h2 style="margin: 0;">${service.icon} Nouvelle demande — ${service.name}</h2>
                <p style="margin: 8px 0 0 0; opacity: 0.9;">Équipe: ${team.label || service.assignedTeam}</p>
              </div>
              <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
                <table style="width: 100%; font-size: 14px;">
                  <tr><td style="color: #64748b; padding: 6px 0;">Client:</td><td style="font-weight: 600;">${guestName || 'Non identifié'}</td></tr>
                  ${roomNumber ? `<tr><td style="color: #64748b; padding: 6px 0;">Chambre:</td><td style="font-weight: 600;">${roomNumber}</td></tr>` : ''}
                  ${guestPhone ? `<tr><td style="color: #64748b; padding: 6px 0;">Téléphone:</td><td style="font-weight: 600;">${guestPhone}</td></tr>` : ''}
                  <tr><td style="color: #64748b; padding: 6px 0;">Type:</td><td style="font-weight: 600;">${service.type}</td></tr>
                  <tr><td style="color: #64748b; padding: 6px 0;">Montant:</td><td style="font-weight: 600;">${totalAmount > 0 ? totalAmount + ' FCFA' : 'Gratuit'}</td></tr>
                </table>
                ${itemsList ? `<div style="margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 8px;"><p style="margin: 0 0 8px 0; font-weight: 600; color: #134288;">Articles commandés:</p><pre style="margin: 0; font-family: monospace; white-space: pre-wrap;">${itemsList}</pre></div>` : ''}
                ${notes ? `<div style="margin-top: 16px; padding: 12px; background: #fef3c7; border-radius: 8px;"><p style="margin: 0 0 4px 0; font-weight: 600; color: #92400e;">Notes du client:</p><p style="margin: 0;">${notes}</p></div>` : ''}
                <div style="margin-top: 24px;">
                  <a href="${dashboardLink}" style="background: #32ba5d; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Traiter la demande →</a>
                </div>
                <p style="margin-top: 16px; font-size: 12px; color: #64748b;">ID: ${request_record.id} · Reçu le ${new Date().toLocaleString('fr-FR')}</p>
              </div>
            </div>
          `,
          text: `Nouvelle demande: ${service.name} - Ch. ${roomNumber || 'N/A'} - ${guestName || 'Non identifié'}\nLien: ${dashboardLink}`,
          type: 'service_request',
        });
        console.log(`[service-request] Email envoyé à ${team.email}`);
      }
    } catch (emailErr) {
      console.error('[service-request] Email staff failed:', emailErr);
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

    // ─── Email client (changement de statut) ───
    try {
      const req = await db.serviceRequest.findUnique({
        where: { id },
        include: {
          service: { select: { name: true } },
          baggage: { include: { stays: { where: { status: 'active' }, take: 1 } } },
          agency: { select: { name: true } },
        },
      });

      if (req) {
        // Récupère email + langue du Stay lié
        const stay = req.baggage?.stays?.[0];
        const clientEmail = stay?.guestEmail;
        const clientLang = (stay?.language || 'fr') as 'fr' | 'en' | 'es';

        if (clientEmail && status !== 'new') {
          const { sendEmail } = await import('@/lib/email');
          const t = T[clientLang] || T.fr;
          const subject = status === 'in_progress' ? t.subjectInProgress
                        : status === 'done' ? t.subjectDone
                        : status === 'cancelled' ? t.subjectCancelled
                        : null;
          const bodyTemplate = status === 'in_progress' ? t.bodyInProgress
                              : status === 'done' ? t.bodyDone
                              : status === 'cancelled' ? t.bodyCancelled
                              : null;
          if (subject && bodyTemplate) {
            const text = bodyTemplate
              .replace('{serviceName}', req.service.name)
              .replace('{agencyName}', req.agency.name);
            await sendEmail({
              to: clientEmail,
              subject,
              text,
              type: 'service_status',
            });
            console.log(`[service-request] Email client envoyé à ${clientEmail} (${clientLang})`);
          }
        }
      }
    } catch (emailErr) {
      console.error('[service-request] Email client failed:', emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/service-request PATCH] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
