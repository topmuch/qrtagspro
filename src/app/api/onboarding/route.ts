import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/onboarding
 *
 * Crée une nouvelle agence + un utilisateur agence en une seule requête.
 * C'est le point d'entrée de l'onboarding (inscription d'un nouvel établissement).
 *
 * Body:
 *   agencyName: string
 *   agencyType: 'hotel' | 'school' | 'medical' | 'car_rental' | 'luggage_locker' | 'generic'
 *   contactPhone: string (WhatsApp réception)
 *   address: string (optionnel)
 *   logoUrl: string (optionnel, base64)
 *   userEmail: string (email de connexion)
 *   userPassword: string (min 8 chars)
 *   userName: string (prénom + nom du gérant)
 */
const schema = z.object({
  agencyName: z.string().min(2, 'Nom de l\'établissement requis (min 2 caractères)'),
  agencyType: z.enum(['hotel', 'school', 'medical', 'car_rental', 'luggage_locker', 'generic']),
  contactPhone: z.string().min(6, 'Téléphone de réception requis'),
  address: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  userEmail: z.string().email('Email invalide'),
  userPassword: z.string().min(8, 'Mot de passe requis (min 8 caractères)'),
  userName: z.string().min(2, 'Votre nom requis'),
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    // 1. Vérifier que l'email n'existe pas déjà
    const existingUser = await db.user.findUnique({
      where: { email: data.userEmail.toLowerCase() },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email. Connectez-vous.' },
        { status: 400 }
      );
    }

    // 2. Générer un slug unique
    let slug = slugify(data.agencyName);
    let suffix = 1;
    while (await db.agency.findUnique({ where: { slug } })) {
      slug = `${slugify(data.agencyName)}-${suffix++}`;
    }

    // 3. Créer l'agence
    const agency = await db.agency.create({
      data: {
        name: data.agencyName,
        slug,
        agencyType: data.agencyType,
        contactPhone: data.contactPhone,
        address: data.address || null,
        logoUrl: data.logoUrl || null,
        active: true,
      },
    });

    // 4. Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(data.userPassword, 10);

    // 5. Créer l'utilisateur (lié à l'agence, rôle "agency")
    const user = await db.user.create({
      data: {
        email: data.userEmail.toLowerCase(),
        name: data.userName,
        password: hashedPassword,
        role: 'agency',
        agencyId: agency.id,
      },
    });

    // 6. Notification au superadmin
    await db.notification.create({
      data: {
        type: 'new_agency',
        message: `🏢 Nouvelle inscription: ${agency.name} (${data.agencyType}) — ${user.email}`,
      },
    }).catch(() => {
      // Non-bloquant
    });

    revalidatePath('/admin/agences');

    return NextResponse.json({
      success: true,
      agency: {
        id: agency.id,
        name: agency.name,
        slug: agency.slug,
        agencyType: agency.agencyType,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: 'Compte créé avec succès ! Vous pouvez vous connecter.',
    });
  } catch (error) {
    console.error('[onboarding] Error:', error);

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
