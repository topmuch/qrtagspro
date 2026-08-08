'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { HOST_KIT_OFFERS, getOfferById, type HostKitOffer } from '@/lib/host-kit';

// ─── Types ──────────────────────────────────────────────────────────────────

interface HostKitInput {
  offer: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  propertyName?: string;
  propertyAddress?: string;
  deliveryCity?: string;
  deliveryAddress?: string;
  paymentMethod?: string;
}

interface ActionResult {
  success: boolean;
  orderId?: string;
  totalPrice?: number;
  error?: string;
}

// ─── Helper ────────────────────────────────────────────────────────────────

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // No-op
  }
}

// ─── Server Action : créer une commande de Kit Hôte ──────────────────────────

/**
 * Crée une commande de Kit Hôte QRTags.
 *
 * Sécurité :
 *   - L'offre est validée contre HOST_KIT_OFFERS (pas d'injection)
 *   - Le prix est recalculé côté serveur depuis la grille (jamais du client)
 *   - agencyId est optionnel (walk-in client sans compte)
 */
export async function createHostKitOrder(input: HostKitInput): Promise<ActionResult> {
  try {
    // ─── 1. Validation de l'offre ───
    const offer = getOfferById(input.offer);
    if (!offer) {
      return { success: false, error: `Offre invalide: ${input.offer}` };
    }

    // ─── 2. Validation des champs obligatoires ───
    if (!input.customerName?.trim()) {
      return { success: false, error: 'Le nom est obligatoire.' };
    }
    if (!input.customerPhone?.trim()) {
      return { success: false, error: 'Le téléphone est obligatoire.' };
    }

    // Le Kit Starter (one-shot) nécessite une adresse de livraison
    if (offer.id === 'STARTER') {
      if (!input.deliveryCity?.trim()) {
        return { success: false, error: 'La ville de livraison est obligatoire pour le Kit Starter.' };
      }
      if (!input.deliveryAddress?.trim()) {
        return { success: false, error: 'L\'adresse de livraison est obligatoire pour le Kit Starter.' };
      }
    }

    // ─── 3. Prix recalculé côté serveur (sécurité) ───
    const totalPrice = offer.price;

    // ─── 4. Création de la commande ───
    const order = await db.hostKitOrder.create({
      data: {
        offer: offer.id,
        totalPrice,
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone.trim(),
        customerEmail: input.customerEmail?.trim() || null,
        propertyName: input.propertyName?.trim() || null,
        propertyAddress: input.propertyAddress?.trim() || null,
        deliveryCity: input.deliveryCity?.trim() || null,
        deliveryAddress: input.deliveryAddress?.trim() || null,
        paymentMethod: input.paymentMethod || 'cash_on_delivery',
        paymentStatus: 'PENDING',
        status: 'PENDING',
      },
      select: { id: true, totalPrice: true },
    });

    safeRevalidate('/admin/host-kits');

    // TODO: envoyer email de confirmation au client + notification superadmin

    return {
      success: true,
      orderId: order.id,
      totalPrice: order.totalPrice,
    };
  } catch (error) {
    console.error('[createHostKitOrder] Erreur:', error);
    return { success: false, error: 'Erreur lors de la création de la commande.' };
  }
}
