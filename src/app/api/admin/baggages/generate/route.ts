import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Schéma simplifié — uniquement les champs de base
const agencySchema = z.object({
  context: z.literal('agency'),
  agencyId: z.union([z.string().min(1), z.literal('')]).optional(),
  count: z.number().min(1).max(3),
  travelerCount: z.number().min(1).max(5000),
});

const individualSchema = z.object({
  context: z.literal('individual'),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  whatsapp: z.string().min(6).max(20),
  duration: z.enum(['7d', '1y']),
  baggageCount: z.number().min(1).max(2),
});

const combinedSchema = z.discriminatedUnion('context', [individualSchema, agencySchema]);

function generateRandomCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

async function generateUniqueReference(): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  for (let i = 0; i < 100; i++) {
    const ref = `QRT${year}-${generateRandomCode(6)}`;
    const existing = await db.baggage.findUnique({ where: { reference: ref }, select: { id: true } });
    if (!existing) return ref;
  }
  return `QRT${year}-${Date.now()}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = combinedSchema.parse(body);

    const references: string[] = [];
    const total = data.context === 'individual' ? data.baggageCount : data.travelerCount * data.count;

    // Générer les références uniques
    for (let i = 0; i < total; i++) {
      references.push(await generateUniqueReference());
    }

    // ─── INSERT ULTRA-SIMPLIFIÉ ───
    // Uniquement les colonnes qui existent à 100% dans TOUTES les versions de DB
    // Pas de transitMode, transportMode, assignedToAgencyAt, lotId, etc.
    const agencyId = data.context === 'agency' && data.agencyId && data.agencyId.trim() !== ''
      ? data.agencyId
      : null;

    if (data.context === 'individual') {
      // Individuel : créer avec infos client
      for (const ref of references) {
        await db.baggage.create({
          data: {
            reference: ref,
            type: 'voyageur',
            agencyId: null,
            travelerFirstName: data.firstName,
            travelerLastName: data.lastName,
            whatsappOwner: data.whatsapp,
            status: 'in_stock',
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
      }
    } else {
      // Agence : créer en stock ou assigné à l'agence (PAS activated)
      for (const ref of references) {
        await db.baggage.create({
          data: {
            reference: ref,
            type: 'voyageur',
            agencyId: agencyId,
            status: agencyId ? 'assigned_to_agency' : 'in_stock',
          },
        });
      }
    }

    revalidatePath('/admin/etiquettes');
    revalidatePath('/admin/qrcodes');
    revalidatePath('/agence/baggages');
    revalidatePath('/agence/tableau-de-bord');

    return NextResponse.json({
      success: true,
      generated: references.length,
      references,
    });
  } catch (error) {
    console.error('[QRTags/generate] Erreur:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Erreur de validation', details: error.issues },
        { status: 400 },
      );
    }

    const errMsg = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: `Erreur génération: ${errMsg}` },
      { status: 500 },
    );
  }
}

// GET
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
      include: { agency: { select: { id: true, name: true, agencyType: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ baggages });
  } catch (error) {
    console.error('[QRTags/generate GET] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
