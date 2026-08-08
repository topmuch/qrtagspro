'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import {
  getCheckInReminderMessage,
  getCheckOutMessage,
  getReviewUrl,
} from '@/lib/emails/host-whatsapp';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface HostReservationSummary {
  id: string;
  guestName: string;
  guestPhone: string;
  checkInDate: Date;
  checkOutDate: Date;
  notes: string | null;
  reminderSentAt: Date | null;
  checkoutSentAt: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HostReservationsResult {
  success: boolean;
  reservations?: HostReservationSummary[];
  stats?: {
    total: number;
    active: number;
    upcoming: number;
    completed: number;
    remindersSent: number;
    checkoutsSent: number;
  };
  error?: string;
}

export interface CreateReservationInput {
  guestName: string;
  guestPhone: string;
  checkInDate: string; // ISO yyyy-mm-dd
  checkOutDate: string; // ISO yyyy-mm-dd
  notes?: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
  whatsappUrl?: string;
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

// ─── Action : liste des réservations + stats ────────────────────────────────

/**
 * Récupère toutes les réservations Host de l'agence connectée,
 * triées par date de check-in décroissante, avec un récap statistique.
 *
 * Sécurité : agencyId récupéré depuis la session (jamais côté client).
 */
export async function getHostReservations(): Promise<HostReservationsResult> {
  try {
    const agencyId = await getAgencyIdOrFail();

    const reservations = await db.hostReservation.findMany({
      where: { agencyId },
      orderBy: { checkInDate: 'desc' },
    });

    const now = new Date();

    return {
      success: true,
      reservations: reservations as HostReservationSummary[],
      stats: {
        total: reservations.length,
        active: reservations.filter((r) => r.status === 'ACTIVE').length,
        upcoming: reservations.filter(
          (r) => r.status === 'ACTIVE' && new Date(r.checkInDate) > now
        ).length,
        completed: reservations.filter((r) => r.status === 'COMPLETED').length,
        remindersSent: reservations.filter((r) => r.reminderSentAt !== null).length,
        checkoutsSent: reservations.filter((r) => r.checkoutSentAt !== null).length,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('REDIRECT:')) {
      throw error;
    }
    console.error('[getHostReservations] Error:', error);
    return { success: false, error: 'Erreur lors du chargement des réservations.' };
  }
}

// ─── Action : créer une réservation ─────────────────────────────────────────

/**
 * Crée une nouvelle réservation Host pour l'agence connectée.
 *
 * Validation :
 *   - guestName, guestPhone, checkInDate, checkOutDate obligatoires
 *   - checkOutDate doit être strictement postérieure à checkInDate
 *
 * Sécurité : agencyId récupéré depuis la session (jamais côté client).
 */
export async function createReservation(
  input: CreateReservationInput
): Promise<ActionResult> {
  try {
    const agencyId = await getAgencyIdOrFail();

    // ─── Validation ───
    const guestName = input.guestName?.trim();
    if (!guestName) {
      return { success: false, error: 'Le nom du voyageur est obligatoire.' };
    }

    const guestPhone = input.guestPhone?.trim();
    if (!guestPhone) {
      return { success: false, error: 'Le téléphone du voyageur est obligatoire.' };
    }

    if (!input.checkInDate || !input.checkOutDate) {
      return { success: false, error: 'Les dates d\'arrivée et de départ sont obligatoires.' };
    }

    const checkInDate = new Date(input.checkInDate);
    const checkOutDate = new Date(input.checkOutDate);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return { success: false, error: 'Dates invalides.' };
    }

    if (checkOutDate <= checkInDate) {
      return {
        success: false,
        error: 'La date de départ doit être postérieure à la date d\'arrivée.',
      };
    }

    const notes = input.notes?.trim() || null;

    const reservation = await db.hostReservation.create({
      data: {
        agencyId,
        guestName,
        guestPhone,
        checkInDate,
        checkOutDate,
        notes,
        status: 'ACTIVE',
      },
    });

    safeRevalidate('/agence/host/reservations');
    return { success: true, id: reservation.id };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('REDIRECT:')) {
      throw error;
    }
    console.error('[createReservation] Error:', error);
    return { success: false, error: 'Erreur lors de la création de la réservation.' };
  }
}

// ─── Action : annuler une réservation ───────────────────────────────────────

/**
 * Annule une réservation (status = CANCELLED).
 * Vérifie l'ownership avant modification.
 */
export async function cancelReservation(id: string): Promise<ActionResult> {
  try {
    const agencyId = await getAgencyIdOrFail();

    const reservation = await db.hostReservation.findUnique({
      where: { id },
      select: { agencyId: true, status: true },
    });

    if (!reservation) {
      return { success: false, error: 'Réservation introuvable.' };
    }
    if (reservation.agencyId !== agencyId) {
      return { success: false, error: 'Accès refusé : cette réservation ne vous appartient pas.' };
    }
    if (reservation.status === 'CANCELLED') {
      return { success: false, error: 'Cette réservation est déjà annulée.' };
    }

    await db.hostReservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    safeRevalidate('/agence/host/reservations');
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('REDIRECT:')) {
      throw error;
    }
    console.error('[cancelReservation] Error:', error);
    return { success: false, error: 'Erreur lors de l\'annulation.' };
  }
}

// ─── Action : supprimer une réservation ─────────────────────────────────────

/**
 * Supprime définitivement une réservation.
 * Vérifie l'ownership avant suppression.
 */
export async function deleteReservation(id: string): Promise<ActionResult> {
  try {
    const agencyId = await getAgencyIdOrFail();

    const reservation = await db.hostReservation.findUnique({
      where: { id },
      select: { agencyId: true },
    });

    if (!reservation) {
      return { success: false, error: 'Réservation introuvable.' };
    }
    if (reservation.agencyId !== agencyId) {
      return { success: false, error: 'Accès refusé : cette réservation ne vous appartient pas.' };
    }

    await db.hostReservation.delete({ where: { id } });

    safeRevalidate('/agence/host/reservations');
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('REDIRECT:')) {
      throw error;
    }
    console.error('[deleteReservation] Error:', error);
    return { success: false, error: 'Erreur lors de la suppression.' };
  }
}

// ─── Action : générer une URL WhatsApp pour une réservation ─────────────────

/**
 * Génère une URL wa.me pré-remplie pour une réservation donnée.
 *
 * Types :
 *   - 'checkin'    : message J-1 (rappel check-in)
 *   - 'checkout'   : message de départ (merci + avis)
 *
 * Sécurité : agencyId récupéré depuis la session (jamais côté client).
 * Vérifie l'ownership de la réservation.
 */
export async function getWhatsAppUrl(
  id: string,
  type: 'checkin' | 'checkout'
): Promise<ActionResult> {
  try {
    const agencyId = await getAgencyIdOrFail();

    const reservation = await db.hostReservation.findUnique({
      where: { id },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            houseGuide: {
              select: {
                hostName: true,
                checkInTime: true,
                checkOutTime: true,
              },
            },
          },
        },
      },
    });

    if (!reservation) {
      return { success: false, error: 'Réservation introuvable.' };
    }
    if (reservation.agencyId !== agencyId) {
      return { success: false, error: 'Accès refusé : cette réservation ne vous appartient pas.' };
    }

    const agency = reservation.agency;
    const guide = agency.houseGuide;
    const welcomeUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/welcome/${agency.slug}?context=WRISTBAND`;

    if (type === 'checkin') {
      const message = getCheckInReminderMessage({
        guestName: reservation.guestName,
        guestPhone: reservation.guestPhone,
        hostName: guide?.hostName || agency.name,
        apartmentName: agency.name,
        welcomeUrl,
        checkInTime: guide?.checkInTime || null,
        checkOutTime: guide?.checkOutTime || null,
      });
      return { success: true, whatsappUrl: message.waMeUrl };
    }

    if (type === 'checkout') {
      const reviewUrl = getReviewUrl(agency.name, agency.address);
      const message = getCheckOutMessage({
        guestName: reservation.guestName,
        guestPhone: reservation.guestPhone,
        hostName: guide?.hostName || agency.name,
        apartmentName: agency.name,
        welcomeUrl,
        checkInTime: guide?.checkInTime || null,
        checkOutTime: guide?.checkOutTime || null,
        reviewUrl,
      });
      return { success: true, whatsappUrl: message.waMeUrl };
    }

    return { success: false, error: 'Type de message invalide.' };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('REDIRECT:')) {
      throw error;
    }
    console.error('[getWhatsAppUrl] Error:', error);
    return { success: false, error: 'Erreur lors de la génération du lien WhatsApp.' };
  }
}
