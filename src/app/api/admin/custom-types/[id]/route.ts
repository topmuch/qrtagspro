import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const fieldSchema = z.object({
  key: z.string().min(1).max(50).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  label: z.string().min(1).max(100),
  type: z.enum(['text', 'tel', 'email', 'date', 'datetime-local', 'textarea', 'number', 'select']),
  required: z.boolean().default(false),
  placeholder: z.string().optional().nullable(),
  helper: z.string().optional().nullable(),
  options: z.array(z.string()).optional().nullable(),
  defaultValue: z.string().optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().min(1).max(10).optional(),
  description: z.string().max(500).optional().nullable(),
  fieldsSchema: z.array(fieldSchema).min(1).optional(),
  departureFieldKey: z.string().optional().nullable(),
  finderMessage: z.string().max(1000).optional().nullable(),
  colClientLabel: z.string().max(50).optional().nullable(),
  colSubLabel: z.string().max(50).optional().nullable(),
});

/**
 * GET /api/admin/custom-types/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customType = await db.customAgencyType.findUnique({
      where: { id },
    });

    if (!customType) {
      return NextResponse.json(
        { error: 'Métier introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      customType: {
        ...customType,
        fieldsSchema: JSON.parse(customType.fieldsSchema),
      },
    });
  } catch (error) {
    console.error('[custom-types GET by id] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/custom-types/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const existing = await db.customAgencyType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Métier introuvable' },
        { status: 404 }
      );
    }

    // Si fieldsSchema modifié, valider departureFieldKey
    const fieldsToCheck = data.fieldsSchema
      ? data.fieldsSchema
      : JSON.parse(existing.fieldsSchema);

    if (data.departureFieldKey !== undefined && data.departureFieldKey) {
      const fieldExists = fieldsToCheck.some((f: any) => f.key === data.departureFieldKey);
      if (!fieldExists) {
        return NextResponse.json(
          { error: `Le champ de départ "${data.departureFieldKey}" n'existe pas dans le schéma` },
          { status: 400 }
        );
      }
      const depField = fieldsToCheck.find((f: any) => f.key === data.departureFieldKey);
      if (!['date', 'datetime-local'].includes(depField.type)) {
        return NextResponse.json(
          { error: `Le champ de départ doit être de type "date" ou "datetime-local"` },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.fieldsSchema !== undefined) updateData.fieldsSchema = JSON.stringify(data.fieldsSchema);
    if (data.departureFieldKey !== undefined) updateData.departureFieldKey = data.departureFieldKey || null;
    if (data.finderMessage !== undefined) updateData.finderMessage = data.finderMessage || null;
    if (data.colClientLabel !== undefined) updateData.colClientLabel = data.colClientLabel || null;
    if (data.colSubLabel !== undefined) updateData.colSubLabel = data.colSubLabel || null;

    const updated = await db.customAgencyType.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/admin/metiers');
    revalidatePath('/admin/agences');

    return NextResponse.json({
      success: true,
      customType: {
        ...updated,
        fieldsSchema: JSON.parse(updated.fieldsSchema),
      },
    });
  } catch (error) {
    console.error('[custom-types PUT] Error:', error);
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

/**
 * DELETE /api/admin/custom-types/[id]
 * Supprime un métier personnalisé.
 * Refusé si des agences l'utilisent encore.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier qu'aucune agence ne l'utilise
    const agencyCount = await db.agency.count({
      where: { customTypeId: id },
    });
    if (agencyCount > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer : ${agencyCount} agence(s) utilisent encore ce métier. Changez leur type d'abord.`,
          agencyCount,
        },
        { status: 400 }
      );
    }

    await db.customAgencyType.delete({ where: { id } });

    revalidatePath('/admin/metiers');
    revalidatePath('/admin/agences');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[custom-types DELETE] Error:', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
