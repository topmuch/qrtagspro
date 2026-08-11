'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import {
  SERVICE_CATEGORIES,
  SERVICE_TYPES,
  TEAMS,
  DISPLAY_TABS,
  type HotelServiceSummary,
} from './constants';

interface ActionResult {
  success: boolean;
  error?: string;
  serviceId?: string;
}

// ─── Helper ────────────────────────────────────────────────────────────────

async function getAgencyIdOrNull(): Promise<string | null> {
  try {
    const { getSession } = await import('@/lib/session');
    const user = await getSession();
    if (!user || user.role !== 'agency' || !user.agencyId) return null;
    return user.agencyId;
  } catch {
    return null;
  }
}

function safeRevalidate(path: string) {
  try { revalidatePath(path); } catch { /* no-op */ }
}

// ─── Action : liste des services ────────────────────────────────────────────

export async function getHotelServices(): Promise<{
  success: boolean;
  services?: HotelServiceSummary[];
  stats?: {
    total: number;
    active: number;
    byCategory: Record<string, number>;
    byTab: Record<string, number>;
  };
  error?: string;
}> {
  try {
    const agencyId = await getAgencyIdOrNull();
    if (!agencyId) return { success: false, error: 'Session expirée. Reconnectez-vous.' };

    const services = await db.hotelService.findMany({
      where: { agencyId },
      orderBy: [{ displayTab: 'asc' }, { category: 'asc' }, { createdAt: 'desc' }],
    });

    const byCategory: Record<string, number> = {};
    const byTab: Record<string, number> = {};
    for (const s of services) {
      byCategory[s.category] = (byCategory[s.category] || 0) + 1;
      byTab[s.displayTab] = (byTab[s.displayTab] || 0) + 1;
    }

    return {
      success: true,
      services,
      stats: {
        total: services.length,
        active: services.filter((s) => s.isActive).length,
        byCategory,
        byTab,
      },
    };
  } catch (error) {
    console.error('[getHotelServices] Error:', error);
    return { success: false, error: 'Erreur lors du chargement des services.' };
  }
}

// ─── Action : créer ou mettre à jour un service ────────────────────────────

interface ServiceInput {
  name: string;
  description?: string;
  icon: string;
  type: string;
  category: string;
  isFree: boolean;
  price?: number;
  schedule?: string;
  slots?: string;
  menu?: string;
  assignedTeam: string;
  displayTab: string;
  modeleId?: string | null;
  photoCustom?: string | null;
  videoUrl?: string | null;
  etapes?: string | null;
  depannage?: string | null;
}

export async function createOrUpdateService(
  input: ServiceInput,
  serviceId?: string
): Promise<ActionResult> {
  try {
    const agencyId = await getAgencyIdOrNull();
    if (!agencyId) return { success: false, error: 'Session expirée.' };

    if (!input.name?.trim()) return { success: false, error: 'Le nom est obligatoire.' };

    const validCategories = ['housekeeping', 'maintenance', 'food', 'spa', 'reception', 'transport', 'guide', 'other'];
    if (!validCategories.includes(input.category)) {
      return { success: false, error: 'Catégorie invalide: ' + input.category };
    }

    const data = {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      icon: input.icon || '📋',
      type: input.type || 'request',
      category: input.category,
      isFree: input.isFree,
      price: input.price || 0,
      schedule: input.schedule || null,
      slots: input.slots || null,
      menu: input.menu || null,
      assignedTeam: input.assignedTeam || 'reception',
      displayTab: input.displayTab || 'hotel',
      modeleId: input.modeleId || null,
      photoCustom: input.photoCustom || null,
      videoUrl: input.videoUrl || null,
      etapes: input.etapes || null,
      depannage: input.depannage || null,
    };

    if (serviceId) {
      const existing = await db.hotelService.findUnique({
        where: { id: serviceId },
        select: { agencyId: true },
      });
      if (!existing) return { success: false, error: 'Service introuvable.' };
      if (existing.agencyId !== agencyId) return { success: false, error: 'Accès refusé.' };

      await db.hotelService.update({ where: { id: serviceId }, data });
    } else {
      const created = await db.hotelService.create({ data: { agencyId, ...data } });
      serviceId = created.id;
    }

    safeRevalidate('/agence/services');
    return { success: true, serviceId };
  } catch (error) {
    console.error('[createOrUpdateService] Error:', error);
    return { success: false, error: 'Erreur lors de la sauvegarde.' };
  }
}

// ─── Action : activer/désactiver ───────────────────────────────────────────

export async function toggleServiceStatus(serviceId: string): Promise<ActionResult> {
  try {
    const agencyId = await getAgencyIdOrNull();
    if (!agencyId) return { success: false, error: 'Session expirée.' };

    const service = await db.hotelService.findUnique({
      where: { id: serviceId },
      select: { agencyId: true, isActive: true },
    });
    if (!service) return { success: false, error: 'Service introuvable.' };
    if (service.agencyId !== agencyId) return { success: false, error: 'Accès refusé.' };

    await db.hotelService.update({
      where: { id: serviceId },
      data: { isActive: !service.isActive },
    });

    safeRevalidate('/agence/services');
    return { success: true };
  } catch (error) {
    console.error('[toggleServiceStatus] Error:', error);
    return { success: false, error: 'Erreur.' };
  }
}

// ─── Action : supprimer ────────────────────────────────────────────────────

export async function deleteService(serviceId: string): Promise<ActionResult> {
  try {
    const agencyId = await getAgencyIdOrNull();
    if (!agencyId) return { success: false, error: 'Session expirée.' };

    const service = await db.hotelService.findUnique({
      where: { id: serviceId },
      select: { agencyId: true },
    });
    if (!service) return { success: false, error: 'Service introuvable.' };
    if (service.agencyId !== agencyId) return { success: false, error: 'Accès refusé.' };

    await db.hotelService.delete({ where: { id: serviceId } });
    safeRevalidate('/agence/services');
    return { success: true };
  } catch (error) {
    console.error('[deleteService] Error:', error);
    return { success: false, error: 'Erreur lors de la suppression.' };
  }
}

// ─── Action : récupérer les services pour la page welcome (public) ─────────

export async function getPublicHotelServices(agencyId: string): Promise<{
  success: boolean;
  services?: HotelServiceSummary[];
  error?: string;
}> {
  try {
    const services = await db.hotelService.findMany({
      where: { agencyId, isActive: true },
      orderBy: [{ displayTab: 'asc' }, { category: 'asc' }],
    });
    return { success: true, services };
  } catch (error) {
    console.error('[getPublicHotelServices] Error:', error);
    return { success: false, error: 'Erreur.' };
  }
}
