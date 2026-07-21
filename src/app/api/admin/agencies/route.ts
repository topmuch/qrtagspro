import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

/**
 * QRTags — API de gestion des agences
 *
 * QRTags v1 : notifications Email/SMS/Wakit désactivées (règle WAME-only).
 * On garde les in-app notifications (Notification table) pour le Superadmin.
 */

// Validation schema — slug est OPTIONNEL (auto-généré depuis le name si absent)
const agencySchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  slug: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().optional().nullable(),
  agencyType: z.enum(['hotel', 'school', 'luggage_locker', 'car_rental', 'medical', 'custom', 'generic']).optional(),
  customTypeId: z.string().optional().nullable(),
});

// ─── Helper : génère un slug unique depuis le nom ──────────────────
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || `agence-${Date.now()}`;
  let slug = base;
  let i = 1;
  while (await db.agency.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

// GET - List all agencies
export async function GET() {
  try {
    const agencies = await db.agency.findMany({
      include: {
        _count: {
          select: { baggages: true, users: true }
        },
        customType: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ agencies });

  } catch (error) {
    console.error('Get agencies error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new agency
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = agencySchema.parse(body);

    // QRTags : auto-générer le slug si non fourni
    let slug = validatedData.slug?.trim();
    if (!slug) {
      slug = await generateUniqueSlug(validatedData.name);
    } else {
      // Check slug uniqueness si fourni
      const existing = await db.agency.findUnique({ where: { slug } });
      if (existing) {
        return NextResponse.json(
          { error: 'Ce slug est déjà utilisé', field: 'slug' },
          { status: 400 }
        );
      }
    }

    // V3: Si agencyType === 'custom', customTypeId est obligatoire
    const agencyType = validatedData.agencyType || 'generic';
    const customTypeId = agencyType === 'custom'
      ? (validatedData.customTypeId || null)
      : null;
    if (agencyType === 'custom' && !customTypeId) {
      return NextResponse.json(
        { error: 'customTypeId est requis quand agencyType = "custom"' },
        { status: 400 }
      );
    }
    // Vérifier que le customType existe si fourni
    if (customTypeId) {
      const ct = await db.customAgencyType.findUnique({ where: { id: customTypeId } });
      if (!ct) {
        return NextResponse.json(
          { error: 'Métier personnalisé introuvable' },
          { status: 400 }
        );
      }
    }

    const agency = await db.agency.create({
      data: {
        name: validatedData.name,
        slug,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        contactPhone: validatedData.contactPhone || null,
        address: validatedData.address || null,
        logoUrl: validatedData.logoUrl || null,
        agencyType,
        customTypeId,
      }
    });

    // QRTags v1 : pas d'email (WAME-only). In-app notification conservée.
    await db.notification.create({
      data: {
        type: 'new_agency',
        message: `🏢 Nouvelle agence créée : ${agency.name}${agency.email ? ` (${agency.email})` : ''}`,
        read: false,
      }
    });

    // QRTags : forcer le refresh du cache Next.js
    revalidatePath('/admin/agences');

    return NextResponse.json({ agency });

  } catch (error) {
    console.error('Create agency error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Erreur de validation', details: error.issues },
        { status: 400 }
      );
    }

    // QRTags : retourner le VRAI message d'erreur Prisma au lieu du générique
    const errMsg = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: `Erreur serveur : ${errMsg}` },
      { status: 500 }
    );
  }
}

// QRTags : revalider le cache après création d'agence
// (appelé depuis le POST ci-dessus via revalidatePath)

// PUT - Update agency
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, active, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    // Validate only the fields that are present
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone || null;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.agencyType !== undefined) {
      updateData.agencyType = data.agencyType;
      // V3: gérer customTypeId selon agencyType
      if (data.agencyType === 'custom') {
        if (data.customTypeId) {
          // Vérifier que le customType existe
          const ct = await db.customAgencyType.findUnique({ where: { id: data.customTypeId } });
          if (!ct) {
            return NextResponse.json(
              { error: 'Métier personnalisé introuvable' },
              { status: 400 }
            );
          }
          updateData.customTypeId = data.customTypeId;
        } else if (data.customTypeId === null) {
          updateData.customTypeId = null;
        }
        // Si customTypeId non fourni (undefined), on garde l'existant
      } else {
        // Pas custom → on nettoie customTypeId
        updateData.customTypeId = null;
      }
    }
    if (active !== undefined) updateData.active = active;

    // Check slug uniqueness if slug is being updated
    if (data.slug) {
      const existingWithSlug = await db.agency.findFirst({
        where: { slug: data.slug, NOT: { id } }
      });
      if (existingWithSlug) {
        return NextResponse.json(
          { error: 'Ce slug est déjà utilisé par une autre agence' },
          { status: 400 }
        );
      }
    }

    const agency = await db.agency.update({
      where: { id },
      data: updateData,
    });

    // QRTags : forcer le refresh du cache Next.js après update
    revalidatePath('/admin/agences');

    return NextResponse.json({ agency });

  } catch (error) {
    console.error('Update agency error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete agency
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    await db.agency.delete({
      where: { id }
    });

    // QRTags : forcer le refresh du cache Next.js après suppression
    revalidatePath('/admin/agences');

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete agency error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
