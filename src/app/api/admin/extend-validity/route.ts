import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ─── Extend Validity (SuperAdmin only) ───
//
// POST /api/admin/extend-validity
// Body: { reference: string, durationToAdd?: number (jours), customDate?: string (ISO) }
//
// Logique:
// 1. Auth: vérifier superadmin
// 2. Récupérer le bagage par reference
// 3. Calculer nouvelle date:
//    - Si customDate fournie → utiliser customDate (validation: doit être dans le futur)
//    - Sinon → baseDate = expiresAt ?? new Date()
//      Si expiresAt est dans le passé → baseDate = new Date() (on part de maintenant)
//    - newExpiry = baseDate + durationToAdd jours
// 4. Update DB: { expiresAt, status: 'active', validityExtendedAt, validityExtendedBy }
// 5. Retourner { success: true, newExpiryDate }

const extendSchema = z.object({
  reference: z.string().min(1),
  durationToAdd: z.number().int().min(1).max(3650).optional(), // 1 jour à 10 ans
  customDate: z.string().optional(), // ISO string
}).refine(
  (data) => data.durationToAdd || data.customDate,
  { message: "Soit durationToAdd soit customDate doit être fourni" }
);

export async function POST(request: NextRequest) {
  try {
    // ─── Auth: vérifier superadmin ───
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'superadmin' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé — Admin uniquement' }, { status: 403 });
    }
    const adminEmail = session.user.email || 'unknown';

    // ─── Validation ───
    const body = await request.json();
    const validated = extendSchema.parse(body);

    // ─── Récupérer le bagage ───
    const baggage = await db.baggage.findUnique({
      where: { reference: validated.reference },
      select: {
        id: true,
        reference: true,
        expiresAt: true,
        status: true,
      },
    });

    if (!baggage) {
      return NextResponse.json({ error: 'Bagage introuvable' }, { status: 404 });
    }

    // ─── Calculer la nouvelle date d'expiration ───
    let newExpiryDate: Date;

    if (validated.customDate) {
      // Date personnalisée
      newExpiryDate = new Date(validated.customDate);
      if (isNaN(newExpiryDate.getTime())) {
        return NextResponse.json({ error: 'Date personnalisée invalide' }, { status: 400 });
      }
      if (newExpiryDate <= new Date()) {
        return NextResponse.json({ error: 'La date doit être dans le futur' }, { status: 400 });
      }
    } else if (validated.durationToAdd) {
      // Durée à ajouter
      const now = new Date();
      let baseDate: Date;

      if (baggage.expiresAt && baggage.expiresAt > now) {
        // Le QR n'est pas encore expiré → on ajoute à la date existante
        baseDate = baggage.expiresAt;
      } else {
        // Le QR est expiré ou n'a pas de date → on part de maintenant
        baseDate = now;
      }

      newExpiryDate = new Date(baseDate);
      newExpiryDate.setDate(newExpiryDate.getDate() + validated.durationToAdd);
    } else {
      return NextResponse.json({ error: 'Paramètre manquant' }, { status: 400 });
    }

    // ─── Mettre à jour la DB ───
    const updated = await db.baggage.update({
      where: { id: baggage.id },
      data: {
        expiresAt: newExpiryDate,
        status: 'active', // Réactiver au cas où il était 'blocked' ou expiré
        validityExtendedAt: new Date(),
        validityExtendedBy: adminEmail,
      },
      select: {
        id: true,
        reference: true,
        expiresAt: true,
        status: true,
        validityExtendedAt: true,
        validityExtendedBy: true,
      },
    });

    return NextResponse.json({
      success: true,
      baggage: {
        reference: updated.reference,
        expiresAt: updated.expiresAt?.toISOString() || null,
        status: updated.status,
        validityExtendedAt: updated.validityExtendedAt?.toISOString() || null,
        validityExtendedBy: updated.validityExtendedBy,
      },
      message: `Validité prolongée jusqu'au ${newExpiryDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    });
  } catch (error) {
    console.error('[extend-validity] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
