'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { type PartnerSummary, VALID_CATEGORIES } from './constants';

interface ActionResult {
  success: boolean;
  error?: string;
  partnerId?: string;
}

// ─── Helper : récupère l'agencyId depuis la session ─────────────────────────

async function getAgencyIdOrNull(): Promise<string | null> {
  try {
    const { getSession } = await import('@/lib/session');
    const user = await getSession();
    if (!user || user.role !== 'agency' || !user.agencyId) {
      return null;
    }
    return user.agencyId;
  } catch {
    return null;
  }
}

// ─── Helper : revalidatePath safe (hors contexte Next.js) ───────────────────

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // No-op hors contexte Next.js (ex: tests)
  }
}

// ─── Action : liste des partenaires de l'agence connectée ───────────────────

export async function getAgencyPartners(): Promise<{
  success: boolean;
  partners?: PartnerSummary[];
  stats?: {
    total: number;
    active: number;
    withPromo: number;
    byCategory: Record<string, number>;
  };
  error?: string;
}> {
  try {
    const agencyId = await getAgencyIdOrNull();
    if (!agencyId) {
      return { success: false, error: 'Session expirée. Reconnectez-vous.' };
    }

    const partners = await db.hotelPartner.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        latitude: true,
        longitude: true,
        rating: true,
        promoCode: true,
        commission: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Stats par catégorie
    const byCategory: Record<string, number> = {};
    for (const p of partners) {
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    }

    return {
      success: true,
      partners,
      stats: {
        total: partners.length,
        active: partners.filter((p) => p.isActive).length,
        withPromo: partners.filter((p) => p.promoCode).length,
        byCategory,
      },
    };
  } catch (error) {
    console.error('[getAgencyPartners] Error:', error);
    return { success: false, error: 'Erreur lors du chargement des partenaires.' };
  }
}

// ─── Action : créer ou mettre à jour un partenaire ──────────────────────────

interface PartnerInput {
  name: string;
  category: string;
  description?: string;
  latitude: number;
  longitude: number;
  rating?: number;
  promoCode?: string;
  commission?: number;
}

/**
 * Crée un nouveau partenaire ou met à jour un partenaire existant.
 *
 * Sécurité :
 *   - agencyId récupéré depuis la session (jamais depuis le client)
 *   - Pour une mise à jour : vérifie que le partenaire appartient bien à l'agence
 *
 * Validation :
 *   - name, category, latitude, longitude obligatoires
 *   - category doit être dans VALID_CATEGORIES
 *   - latitude ∈ [-90, 90], longitude ∈ [-180, 180]
 *   - rating ∈ [0, 5], commission ∈ [0, 100]
 */
export async function createOrUpdatePartner(
  input: PartnerInput,
  partnerId?: string
): Promise<ActionResult> {
  try {
    const agencyId = await getAgencyIdOrNull();
    if (!agencyId) return { success: false, error: "Session expirée" };

    // ─── Validation ───
    const name = input.name?.trim();
    if (!name) {
      return { success: false, error: 'Le nom du lieu est obligatoire.' };
    }

    if (!VALID_CATEGORIES.includes(input.category as (typeof VALID_CATEGORIES)[number])) {
      return { success: false, error: `Catégorie invalide: ${input.category}` };
    }

    if (
      typeof input.latitude !== 'number' ||
      typeof input.longitude !== 'number' ||
      isNaN(input.latitude) ||
      isNaN(input.longitude) ||
      input.latitude < -90 ||
      input.latitude > 90 ||
      input.longitude < -180 ||
      input.longitude > 180
    ) {
      return { success: false, error: 'Coordonnées GPS invalides.' };
    }

    const rating = input.rating !== undefined ? Number(input.rating) : 4.5;
    if (isNaN(rating) || rating < 0 || rating > 5) {
      return { success: false, error: 'La note doit être entre 0 et 5.' };
    }

    const commission = input.commission !== undefined ? Number(input.commission) : 0;
    if (isNaN(commission) || commission < 0 || commission > 100) {
      return { success: false, error: 'La commission doit être entre 0 et 100%.' };
    }

    const promoCode = input.promoCode?.trim() || null;
    const description = input.description?.trim() || null;

    // ─── Création ou mise à jour ───
    if (partnerId) {
      // Vérifie l'ownership avant update
      const existing = await db.hotelPartner.findUnique({
        where: { id: partnerId },
        select: { agencyId: true },
      });
      if (!existing) {
        return { success: false, error: 'Partenaire introuvable.' };
      }
      if (existing.agencyId !== agencyId) {
        return { success: false, error: 'Accès refusé : ce partenaire ne vous appartient pas.' };
      }

      await db.hotelPartner.update({
        where: { id: partnerId },
        data: {
          name,
          category: input.category,
          description,
          latitude: input.latitude,
          longitude: input.longitude,
          rating,
          promoCode,
          commission,
        },
      });
    } else {
      const created = await db.hotelPartner.create({
        data: {
          agencyId,
          name,
          category: input.category,
          description,
          latitude: input.latitude,
          longitude: input.longitude,
          rating,
          promoCode,
          commission,
          isVerified: true,
          isActive: true,
        },
      });
      partnerId = created.id;
    }

    safeRevalidate('/agence/partenaires');
    return { success: true, partnerId };
  } catch (error) {
    console.error('[createOrUpdatePartner] Error:', error);
    return { success: false, error: 'Erreur lors de la sauvegarde.' };
  }
}

// ─── Action : activer/désactiver un partenaire ──────────────────────────────

export async function togglePartnerStatus(partnerId: string): Promise<ActionResult> {
  try {
    const agencyId = await getAgencyIdOrNull();
    if (!agencyId) return { success: false, error: "Session expirée" };

    const partner = await db.hotelPartner.findUnique({
      where: { id: partnerId },
      select: { agencyId: true, isActive: true },
    });

    if (!partner) {
      return { success: false, error: 'Partenaire introuvable.' };
    }
    if (partner.agencyId !== agencyId) {
      return { success: false, error: 'Accès refusé.' };
    }

    await db.hotelPartner.update({
      where: { id: partnerId },
      data: { isActive: !partner.isActive },
    });

    safeRevalidate('/agence/partenaires');
    return { success: true };

  } catch (error) {
    console.error('[togglePartnerStatus] Error:', error);
    return { success: false, error: 'Erreur lors du changement de statut.' };
  }
}

// ─── Action : supprimer un partenaire ───────────────────────────────────────

export async function deletePartner(partnerId: string): Promise<ActionResult> {
  try {
    const agencyId = await getAgencyIdOrNull();
    if (!agencyId) return { success: false, error: "Session expirée" };

    const partner = await db.hotelPartner.findUnique({
      where: { id: partnerId },
      select: { agencyId: true },
    });

    if (!partner) {
      return { success: false, error: 'Partenaire introuvable.' };
    }
    if (partner.agencyId !== agencyId) {
      return { success: false, error: 'Accès refusé.' };
    }

    await db.hotelPartner.delete({ where: { id: partnerId } });

    safeRevalidate('/agence/partenaires');
    return { success: true };

  } catch (error) {
    console.error('[deletePartner] Error:', error);
    return { success: false, error: 'Erreur lors de la suppression.' };
  }
}

// ─── Action : statistiques des clics partenaires (30 derniers jours) ────────

export interface PartnerStat {
  partnerId: string;
  name: string;
  category: string;
  commission: number;
  clicks: number;
}

export interface PartnerStatsResult {
  success: boolean;
  stats?: {
    totalClicks: number;
    uniquePartnersClicked: number;
    accumulatedCommissionPercent: number;
    byPartner: PartnerStat[];
    byDay: Array<{ date: string; count: number }>;
    byDevice: { MOBILE: number; TABLET: number; DESKTOP: number; UNKNOWN: number };
  };
  error?: string;
}

/**
 * Récupère les statistiques de clics sur les partenaires de l'agence connectée.
 *
 * Période : 30 derniers jours (glissants).
 *
 * Retourne :
 *   - totalClicks : nombre total de clics
 *   - uniquePartnersClicked : nombre de lieux distincts cliqués
 *   - accumulatedCommissionPercent : somme des % de commission des partenaires cliqués
 *     (indicateur de potentiel de revenu, pas un montant réel — la commission
 *      se calcule sur le CA réel du partenaire, qu'on ne trace pas ici)
 *   - byPartner : top lieux par clics (décroissant)
 *   - byDay : clics par jour (7 derniers jours) pour le graphique
 *   - byDevice : répartition MOBILE/TABLET/DESKTOP
 *
 * Sécurité : agencyId récupéré depuis la session (jamais côté client).
 */
export async function getPartnerStats(): Promise<PartnerStatsResult> {
  try {
    const agencyId = await getAgencyIdOrNull();
    if (!agencyId) return { success: false, error: "Session expirée" };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // ─── Tous les clics des 30 derniers jours ───
    const clicks = await db.partnerClick.findMany({
      where: {
        agencyId,
        clickedAt: { gte: thirtyDaysAgo },
      },
      include: {
        partner: {
          select: { name: true, category: true, commission: true },
        },
      },
      orderBy: { clickedAt: 'desc' },
    });

    // ─── Agrégation par partenaire ───
    const byPartnerMap = new Map<string, PartnerStat>();
    for (const click of clicks) {
      const existing = byPartnerMap.get(click.partnerId);
      if (existing) {
        existing.clicks += 1;
      } else {
        byPartnerMap.set(click.partnerId, {
          partnerId: click.partnerId,
          name: click.partner.name,
          category: click.partner.category,
          commission: click.partner.commission,
          clicks: 1,
        });
      }
    }
    const byPartner = Array.from(byPartnerMap.values()).sort((a, b) => b.clicks - a.clicks);

    // ─── Clics par jour (7 derniers jours) ───
    const byDay: Array<{ date: string; count: number }> = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const count = clicks.filter((c) => {
        const t = new Date(c.clickedAt);
        return t >= day && t <= dayEnd;
      }).length;

      byDay.push({
        date: day.toLocaleDateString('fr-FR', { weekday: 'short' }),
        count,
      });
    }

    // ─── Par device ───
    const byDevice = { MOBILE: 0, TABLET: 0, DESKTOP: 0, UNKNOWN: 0 };
    for (const click of clicks) {
      const dt = click.deviceType || 'UNKNOWN';
      if (dt in byDevice) {
        (byDevice as Record<string, number>)[dt] += 1;
      } else {
        byDevice.UNKNOWN += 1;
      }
    }

    // ─── Commission cumulée (indicateur de potentiel) ───
    // Somme des % de commission des partenaires cliqués (pas un montant réel).
    // L'hôtel sait ainsi quel volume de clics a généré du potentiel de commission.
    const accumulatedCommissionPercent = byPartner.reduce(
      (sum, p) => sum + p.commission * p.clicks,
      0
    );

    return {
      success: true,
      stats: {
        totalClicks: clicks.length,
        uniquePartnersClicked: byPartnerMap.size,
        accumulatedCommissionPercent,
        byPartner,
        byDay,
        byDevice,
      },
    };

  } catch (error) {
    console.error('[getPartnerStats] Error:', error);
    return { success: false, error: 'Erreur lors du chargement des statistiques.' };
  }
}
