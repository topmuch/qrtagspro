import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

// POST /api/teams/test-email — envoie un email de test à l'équipe
// Body: { category }
export async function POST(req: NextRequest) {
  try {
    const { getSession } = await import('@/lib/session');
    const user = await getSession();
    if (!user || user.role !== 'agency' || !user.agencyId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const { category } = body;
    if (!category) return NextResponse.json({ error: 'Catégorie requise' }, { status: 400 });

    const team = await db.team.findUnique({
      where: { agencyId_category: { agencyId: user.agencyId, category } },
      include: { agency: { select: { name: true } } },
    });
    if (!team) return NextResponse.json({ error: 'Équipe introuvable' }, { status: 404 });

    const emailText = `Bonjour,\n\nCeci est un email de test envoyé depuis QRTags Pro.\n\nÉquipe: ${team.label || category}\nAgence: ${team.agency.name}\nDate: ${new Date().toLocaleString('fr-FR')}\n\nSi vous recevez cet email, les notifications fonctionnent correctement. Vous recevrez ici les nouvelles demandes clients.\n\nLien dashboard: ${process.env.NEXTAUTH_URL || 'https://entreprise.qrtags.pro'}/agence/staff\n\nQRTags Pro`;
    const result = await sendEmail({
      to: team.email,
      subject: `[TEST] Équipe ${team.label || category} — ${team.agency.name}`,
      text: emailText,
      html: `<div style="font-family: sans-serif; max-width: 600px;"><p>Bonjour,</p><p>Ceci est un email de test envoyé depuis QRTags Pro.</p><p><strong>Équipe:</strong> ${team.label || category}<br><strong>Agence:</strong> ${team.agency.name}<br><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p><p>Si vous recevez cet email, les notifications fonctionnent correctement. Vous recevrez ici les nouvelles demandes clients.</p><p><a href="${process.env.NEXTAUTH_URL || 'https://entreprise.qrtags.pro'}/agence/staff">Lien dashboard</a></p><p>QRTags Pro</p></div>`,
    });

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error || 'Échec envoi email' }, { status: 500 });
    }
  } catch (e) {
    console.error('[test-email] Error:', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
