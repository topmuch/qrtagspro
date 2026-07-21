import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

/**
 * GET /api/admin/custom-types
 * Liste tous les métiers personnalisés (CustomAgencyType)
 */
export async function GET() {
  try {
    const types = await db.customAgencyType.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Compter les agences qui utilisent chaque type
    const typesWithCount = await Promise.all(
      types.map(async (t) => {
        const agencyCount = await db.agency.count({
          where: { customTypeId: t.id },
        });
        return {
          ...t,
          agencyCount,
        };
      })
    );

    return NextResponse.json({ customTypes: typesWithCount });
  } catch (error) {
    console.error('[custom-types GET] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Validation pour un champ du schéma
const fieldSchema = z.object({
  key: z.string().min(1).max(50).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Clé invalide (lettres + chiffres + _ uniquement)'),
  label: z.string().min(1).max(100),
  type: z.enum(['text', 'tel', 'email', 'date', 'datetime-local', 'textarea', 'number', 'select']),
  required: z.boolean().default(false),
  placeholder: z.string().optional().nullable(),
  helper: z.string().optional().nullable(),
  options: z.array(z.string()).optional().nullable(), // pour type=select
  defaultValue: z.string().optional().nullable(),
});

const createSchema = z.object({
  key: z.string().min(1).max(50).regex(/^[a-z][a-z0-9_]*$/, 'Clé invalide (minuscules + chiffres + _)'),
  name: z.string().min(1).max(100),
  icon: z.string().min(1).max(10).default('💼'),
  description: z.string().max(500).optional().nullable(),
  fieldsSchema: z.array(fieldSchema).min(1, 'Au moins 1 champ requis'),
  departureFieldKey: z.string().optional().nullable(),
  finderMessage: z.string().max(1000).optional().nullable(),
  colClientLabel: z.string().max(50).optional().nullable(),
  colSubLabel: z.string().max(50).optional().nullable(),
});

/**
 * POST /api/admin/custom-types
 * Crée un nouveau métier personnalisé
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    // Vérifier que la clé est unique
    const existing = await db.customAgencyType.findUnique({
      where: { key: data.key },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Le métier avec la clé "${data.key}" existe déjà` },
        { status: 400 }
      );
    }

    // Vérifier que departureFieldKey correspond à un champ existant
    if (data.departureFieldKey) {
      const fieldExists = data.fieldsSchema.some(f => f.key === data.departureFieldKey);
      if (!fieldExists) {
        return NextResponse.json(
          { error: `Le champ de départ "${data.departureFieldKey}" n'existe pas dans le schéma` },
          { status: 400 }
        );
      }
      // Vérifier que le champ est de type date ou datetime-local
      const depField = data.fieldsSchema.find(f => f.key === data.departureFieldKey);
      if (!['date', 'datetime-local'].includes(depField!.type)) {
        return NextResponse.json(
          { error: `Le champ de départ doit être de type "date" ou "datetime-local"` },
          { status: 400 }
        );
      }
    }

    const customType = await db.customAgencyType.create({
      data: {
        key: data.key,
        name: data.name,
        icon: data.icon,
        description: data.description || null,
        fieldsSchema: JSON.stringify(data.fieldsSchema),
        departureFieldKey: data.departureFieldKey || null,
        finderMessage: data.finderMessage || null,
        colClientLabel: data.colClientLabel || null,
        colSubLabel: data.colSubLabel || null,
      },
    });

    revalidatePath('/admin/metiers');
    revalidatePath('/admin/agences');

    return NextResponse.json({
      success: true,
      customType: {
        ...customType,
        fieldsSchema: JSON.parse(customType.fieldsSchema),
      },
    });
  } catch (error) {
    console.error('[custom-types POST] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
