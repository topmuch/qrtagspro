'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface HouseGuideData {
  id: string;
  wifiNetwork: string | null;
  wifiPassword: string | null;
  checkInInstructions: string | null;
  checkOutInstructions: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  houseRules: string | null;
  homeTutorials: string | null;
  hostRecommendations: string | null;
  hostName: string | null;
  hostPhone: string | null;
  hostWelcomeMessage: string | null;
  photos: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgencyInfo {
  id: string;
  name: string;
  slug: string;
  braceletProfile: string | null;
  agencyType: string | null;
}

export interface HouseGuideResult {
  success: boolean;
  guide?: HouseGuideData | null;
  agency?: AgencyInfo;
  error?: string;
}

interface SaveHouseGuideInput {
  wifiNetwork?: string | null;
  wifiPassword?: string | null;
  checkInInstructions?: string | null;
  checkOutInstructions?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  houseRules?: string | null;
  homeTutorials?: string | null;
  hostRecommendations?: string | null;
  hostName?: string | null;
  hostPhone?: string | null;
  hostWelcomeMessage?: string | null;
  photos?: string | null;
  isActive?: boolean;
}

interface SaveResult {
  success: boolean;
  error?: string;
  guide?: HouseGuideData;
  profileSwitched?: boolean;
}

// ─── Helper : récupère l'agencyId depuis la session ─────────────────────────

async function getAgencyIdOrFail(): Promise<string> {
  const { getSession } = await import('@/lib/session');
  const user = await getSession();
  if (!user) {
    throw new Error('REDIRECT:/agence/connexion');
  }
  if (user.role !== 'agency' || !user.agencyId) {
    throw new Error('REDIRECT:/admin/tableau-de-bord');
  }
  return user.agencyId;
}

// ─── Helper : revalidatePath safe (hors contexte Next.js) ───────────────────

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // No-op hors contexte Next.js (ex: tests, scripts)
  }
}

// ─── Action : récupérer le guide de la maison + infos agence ─────────────────

/**
 * Récupère le HouseGuide de l'agence connectée ainsi que les infos
 * d'identification (name, slug, braceletProfile) utilisées par le dashboard
 * pour construire le lien /welcome/[slug]?context=WRISTBAND et détecter si
 * l'agence n'est pas encore configurée en profil "HOST".
 *
 * Sécurité : agencyId récupéré depuis la session (jamais côté client).
 */
export async function getHouseGuide(): Promise<HouseGuideResult> {
  try {
    const agencyId = await getAgencyIdOrFail();

    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: {
        id: true,
        name: true,
        slug: true,
        braceletProfile: true,
        agencyType: true,
      },
    });

    if (!agency) {
      return { success: false, error: 'Agence introuvable.' };
    }

    const guide = await db.houseGuide.findUnique({
      where: { agencyId },
    });

    return {
      success: true,
      guide: guide as HouseGuideData | null,
      agency: {
        id: agency.id,
        name: agency.name,
        slug: agency.slug,
        braceletProfile: agency.braceletProfile,
        agencyType: agency.agencyType,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('REDIRECT:')) {
      throw error;
    }
    console.error('[getHouseGuide] Error:', error);
    return { success: false, error: 'Erreur lors du chargement du guide.' };
  }
}

// ─── Action : sauvegarder (upsert) le guide de la maison ────────────────────

/**
 * Crée ou met à jour le HouseGuide de l'agence connectée.
 *
 * Comportement spécial :
 *   Si l'agence n'a pas braceletProfile === 'HOST', on le bascule
 *   automatiquement en 'HOST' (le guide ne sert à rien sinon, car la page
 *   /welcome/[slug]?context=WRISTBAND ne déclenche pas la vue HostView).
 *
 * Sécurité : agencyId récupéré depuis la session (jamais côté client).
 */
export async function saveHouseGuide(input: SaveHouseGuideInput): Promise<SaveResult> {
  try {
    const agencyId = await getAgencyIdOrFail();

    // ─── Normalisation des entrées ───
    const data = {
      wifiNetwork: input.wifiNetwork?.trim() || null,
      wifiPassword: input.wifiPassword?.trim() || null,
      checkInInstructions: input.checkInInstructions?.trim() || null,
      checkOutInstructions: input.checkOutInstructions?.trim() || null,
      checkInTime: input.checkInTime?.trim() || null,
      checkOutTime: input.checkOutTime?.trim() || null,
      houseRules: input.houseRules?.trim() || null,
      homeTutorials: input.homeTutorials?.trim() || null,
      hostRecommendations: input.hostRecommendations?.trim() || null,
      hostName: input.hostName?.trim() || null,
      hostPhone: input.hostPhone?.trim() || null,
      hostWelcomeMessage: input.hostWelcomeMessage?.trim() || null,
      photos: input.photos?.trim() || null,
      isActive: input.isActive !== false,
    };

    // ─── Upsert ───
    const guide = await db.houseGuide.upsert({
      where: { agencyId },
      create: {
        agencyId,
        ...data,
      },
      update: {
        ...data,
      },
    });

    // ─── Auto-switch braceletProfile vers 'HOST' si nécessaire ───
    let profileSwitched = false;
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: { braceletProfile: true, slug: true },
    });

    if (agency && agency.braceletProfile !== 'HOST') {
      await db.agency.update({
        where: { id: agencyId },
        data: { braceletProfile: 'HOST' },
      });
      profileSwitched = true;
      console.log(
        `[saveHouseGuide] braceletProfile auto-switched to 'HOST' for agency ${agencyId}`
      );
    }

    safeRevalidate('/agence/host');
    if (agency?.slug) {
      safeRevalidate(`/welcome/${agency.slug}`);
    }

    return {
      success: true,
      guide: guide as HouseGuideData,
      profileSwitched,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('REDIRECT:')) {
      throw error;
    }
    console.error('[saveHouseGuide] Error:', error);
    return { success: false, error: 'Erreur lors de la sauvegarde du guide.' };
  }
}
