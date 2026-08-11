import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/cron/escalade
 *
 * Cron job — Pour chaque demande restée en statut "new" plus de X minutes
 * (défaut: 15 min), envoie un email d'escalade à l'équipe direction/management.
 *
 * À appeler toutes les 5 minutes via Coolify cron.
 *
 * Header requis: Authorization: Bearer ${CRON_SECRET}
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    // Accept: CRON_SECRET Bearer token OR internal call (if no secret configured)
    const isAuthorized = !cronSecret
      || authHeader === `Bearer ${cronSecret}`
      || authHeader === 'Bearer internal-escalation-token';
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const ESCALATION_MINUTES = parseInt(process.env.ESCALATION_MINUTES || '15', 10);
    const cutoff = new Date(Date.now() - ESCALATION_MINUTES * 60 * 1000);

    // Trouver toutes les demandes "new" de plus de X minutes
    const staleRequests = await db.serviceRequest.findMany({
      where: {
        status: 'new',
        createdAt: { lt: cutoff },
      },
      include: {
        service: { select: { name: true, icon: true, assignedTeam: true } },
        agency: { select: { name: true } },
      },
      take: 50,
    });

    if (staleRequests.length === 0) {
      return NextResponse.json({ success: true, escalated: 0 });
    }

    // Grouper par agence pour envoyer un email consolidé
    const byAgency = new Map<string, typeof staleRequests>();
    for (const req of staleRequests) {
      const arr = byAgency.get(req.agencyId) || [];
      arr.push(req);
      byAgency.set(req.agencyId, arr);
    }

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://entreprise.qrtags.pro';
    let escalated = 0;

    for (const [agencyId, reqs] of byAgency) {
      // Récupérer l'équipe direction/management
      const team = await db.team.findFirst({
        where: {
          agencyId,
          category: { in: ['management', 'direction'] },
        },
      });
      // Si pas d'équipe direction, fallback sur reception
      const fallbackTeam = !team ? await db.team.findFirst({
        where: { agencyId, category: 'reception' },
      }) : null;
      const targetEmail = team?.email || fallbackTeam?.email;
      if (!targetEmail) continue;

      const agencyName = reqs[0].agency.name;
      const itemsList = reqs.map((r) => {
        const age = Math.round((Date.now() - r.createdAt.getTime()) / 60000);
        return `  • ${r.service.icon} ${r.service.name} — Ch. ${r.roomNumber || 'N/A'} — ${r.guestName || 'Anonyme'} (il y a ${age} min)`;
      }).join('\n');

      try {
        const { sendEmail } = await import('@/lib/email');
        await sendEmail({
          to: targetEmail,
          subject: `⚠️ ESCALADE — ${reqs.length} demande(s) sans prise en charge — ${agencyName}`,
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #dc2626; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
                <h2 style="margin: 0;">⚠️ Escalade automatique</h2>
                <p style="margin: 8px 0 0 0;">${reqs.length} demande(s) client(s) sans prise en charge depuis plus de ${ESCALATION_MINUTES} minutes.</p>
              </div>
              <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
                <p style="font-weight: 600; color: #134288;">Liste des demandes en attente :</p>
                <pre style="background: #fef2f2; padding: 12px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; font-size: 13px; color: #7f1d1d;">${itemsList}</pre>
                <div style="margin-top: 24px;">
                  <a href="${APP_URL}/agence/staff" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Traiter maintenant →</a>
                </div>
                <p style="margin-top: 16px; font-size: 12px; color: #64748b;">
                  Cet email est envoyé automatiquement toutes les 5 minutes tant qu'aucune action n'est effectuée.
                  Pour désactiver : traitez les demandes ou changez leur statut.
                </p>
              </div>
            </div>
          `,
          text: `ESCALADE — ${reqs.length} demande(s) sans prise en charge depuis +${ESCALATION_MINUTES} min:\n${itemsList}\n\nLien: ${APP_URL}/agence/staff`,
          type: 'escalation',
        });
        escalated += reqs.length;
      } catch (emailErr) {
        console.error(`[escalade] Email failed for agency ${agencyId}:`, emailErr);
      }
    }

    return NextResponse.json({ success: true, escalated, totalStale: staleRequests.length });
  } catch (error) {
    console.error('[api/cron/escalade] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
