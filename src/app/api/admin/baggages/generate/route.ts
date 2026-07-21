import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/admin/baggages/generate
 *
 * Génère un lot de QR codes assignés à une agence (Pro).
 *
 * Body:
 *   agencyId: string  — l'agence destinataire (OBLIGATOIRE en Pro)
 *   quantity: number  — nombre de QR à générer (1 à 5000)
 *
 * Le QR est créé avec:
 *   - reference: QRT{YY}-{6 chars aléatoires}
 *   - type: 'voyageur' (compat)
 *   - agencyId: fourni
 *   - status: 'in_stock' (en attente de check-in par l'agence)
 *
 * Retourne:
 *   { success, generated, references }
 */
const generateSchema = z.object({
  agencyId: z.string().min(1, 'Agency ID requis'),
  quantity: z.number().min(1).max(5000, 'Maximum 5000 QR par lot'),
});

function generateRandomCode(length = 6): string {
  // Caractères sans ambigüité (pas de 0/O, 1/I/L)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generateUniqueReference(): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  for (let i = 0; i < 100; i++) {
    const ref = `QRT${year}-${generateRandomCode(6)}`;
    const existing = await db.baggage.findUnique({
      where: { reference: ref },
      select: { id: true },
    });
    if (!existing) return ref;
  }
  // Fallback improbable : timestamp
  return `QRT${year}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = generateSchema.parse(body);

    // 1. Vérifier que l'agence existe
    const agency = await db.agency.findUnique({
      where: { id: data.agencyId },
      select: { id: true, name: true, agencyType: true },
    });

    if (!agency) {
      return NextResponse.json(
        { error: 'Agence introuvable' },
        { status: 404 }
      );
    }

    // 2. Générer les références uniques
    const references: string[] = [];
    for (let i = 0; i < data.quantity; i++) {
      references.push(await generateUniqueReference());
    }

    // 3. Créer les baggages en lot (uniquement les colonnes de base)
    // Status: 'in_stock' = en attente de check-in par l'agence
    await db.baggage.createMany({
      data: references.map(ref => ({
        reference: ref,
        type: 'voyageur',
        agencyId: agency.id,
        status: 'in_stock',
      })),
    });

    // 4. Revalider les pages concernées
    revalidatePath('/admin/etiquettes');
    revalidatePath('/admin/qrcodes');
    revalidatePath('/admin/generer');
    revalidatePath('/agence/baggages');
    revalidatePath('/agence/tableau-de-bord');

    return NextResponse.json({
      success: true,
      generated: references.length,
      references,
      agency: {
        id: agency.id,
        name: agency.name,
        agencyType: agency.agencyType,
      },
    });
  } catch (error) {
    console.error('[generate] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: `Erreur génération: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/baggages/generate
 *
 * Liste les QR codes (avec filtres optionnels).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '500');

    const where: Record<string, unknown> = {};
    if (agencyId) where.agencyId = agencyId;
    if (type) where.type = type;
    if (status) where.status = status;

    const baggages = await db.baggage.findMany({
      where,
      include: {
        agency: { select: { id: true, name: true, agencyType: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ baggages });
  } catch (error) {
    console.error('[generate GET] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
