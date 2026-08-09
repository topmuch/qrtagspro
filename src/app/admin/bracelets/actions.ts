'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email';
import {
  getProductionStartedEmail,
  getShippedEmail,
  getDeliveredEmail,
  getCustomerEmail,
  type BraceletOrderEmailData,
} from '@/lib/emails/bracelet-templates';
import { generateReferencesBulk } from '@/lib/qr';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AdminBraceletOrder {
  id: string;
  quantity: number;
  isBranded: boolean;
  unitPrice: number;
  totalPrice: number;
  status: string;
  maquetteStatus: string;
  paymentStatus: string;
  paymentMethod: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryCity: string | null;
  createdAt: Date;
  deliveredAt: Date | null;
  activatedAt: Date | null;
  activatedCount: number;
  trackingNumber: string | null;
  logoUrl: string | null;
  brandText: string | null;
  agency: { id: string; name: string; slug: string } | null;
  _count: { baggages: number };
}

// ─── Helper : récupère le user superadmin depuis la session ─────────────────

async function getSuperadminOrFail(): Promise<{ id: string; email: string }> {
  const { getSession } = await import('@/lib/session');
  const user = await getSession();
  if (!user) {
    throw new Error('REDIRECT:/admin/connexion');
  }
  if (user.role !== 'superadmin') {
    throw new Error('REDIRECT:/agence/tableau-de-bord');
  }
  return { id: user.id, email: user.email };
}

// ─── Action : liste de toutes les commandes (superadmin) ────────────────────

export async function getAllBraceletOrders(): Promise<{
  success: boolean;
  orders?: AdminBraceletOrder[];
  stats?: {
    total: number;
    pending: number;
    producing: number;
    shipped: number;
    delivered: number;
    totalRevenue: number;
  };
  error?: string;
}> {
  try {
    await getSuperadminOrFail();

    const orders = await db.braceletPackOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        agency: { select: { id: true, name: true, slug: true } },
        _count: { select: { baggages: true } },
      },
    });

    const stats = {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'PENDING').length,
      producing: orders.filter((o) => o.status === 'PRODUCING').length,
      shipped: orders.filter((o) => o.status === 'SHIPPED').length,
      delivered: orders.filter((o) => o.status === 'DELIVERED').length,
      totalRevenue: orders
        .filter((o) => o.paymentStatus === 'PAID')
        .reduce((s, o) => s + o.totalPrice, 0),
    };

    return { success: true, orders, stats };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('REDIRECT:')) {
      throw error;
    }
    console.error('[getAllBraceletOrders] Error:', error);
    return { success: false, error: 'Erreur lors du chargement.' };
  }
}

// ─── Action : génère les QR codes + marque PRODUCING + email ────────────────

/**
 * Valide une commande PENDING, génère les QR codes (Baggage wristband) pour
 * l'impression, passe la commande en PRODUCING, et envoie l'email au client.
 *
 * Contrairement à l'activation par l'agence (qui exige DELIVERED), cette
 * action du superadmin génère les QR codes DÈS la validation pour permettre
 * à l'imprimeur de les imprimer. Les QR codes restent en status 'active' mais
 * ne sont pas encore distribués physiquement.
 */
export async function validateAndGenerateQr(
  orderId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    await getSuperadminOrFail();

    const order = await db.braceletPackOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        agencyId: true,
        quantity: true,
        status: true,
        activatedCount: true,
        isBranded: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        totalPrice: true,
        trackingNumber: true,
        agency: { select: { name: true, slug: true } },
      },
    });

    if (!order) {
      return { success: false, error: 'Commande introuvable.' };
    }

    if (order.status !== 'PENDING') {
      return { success: false, error: `La commande n'est pas en attente (statut actuel: ${order.status}).` };
    }

    if (order.activatedCount > 0) {
      return { success: false, error: 'Les QR codes ont déjà été générés.' };
    }

    // ─── Génération des références ───
    const references = await generateReferencesBulk(null, order.quantity);

    // ─── Transaction : créer Baggage + update order ───
    await db.$transaction([
      db.baggage.createMany({
        data: references.map((reference) => ({
          reference,
          type: 'voyageur',
          agencyId: order.agencyId,
          baggageType: 'cabine',
          status: 'active',
          context: 'WRISTBAND',
          braceletPackOrderId: orderId,
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        })),
      }),
      db.braceletPackOrder.update({
        where: { id: orderId },
        data: {
          status: 'PRODUCING',
          activatedAt: new Date(),
          activatedCount: order.quantity,
        },
      }),
    ]);

    // ─── Email "Production démarrée" au client ───
    const customerEmail = getCustomerEmail({
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
    });

    if (customerEmail) {
      const emailData: BraceletOrderEmailData = {
        customerName: order.customerName,
        orderId,
        quantity: order.quantity,
        isBranded: order.isBranded,
        totalPrice: order.totalPrice,
        agencyName: order.agency?.name ?? null,
        trackingNumber: order.trackingNumber,
      };
      const template = getProductionStartedEmail(emailData);

      sendEmail({
        to: customerEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
        type: 'bracelet_production_started',
      }).catch((err) => {
        console.error(`[validateAndGenerateQr] Email failed for ${orderId}:`, err);
      });
    }

    try {
      revalidatePath('/admin/bracelets');
    } catch {
      // No-op hors contexte Next.js
    }

    return { success: true, count: order.quantity };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('REDIRECT:')) {
      throw error;
    }
    console.error('[validateAndGenerateQr] Error:', error);
    return { success: false, error: 'Erreur lors de la génération des QR codes.' };
  }
}

// ─── Action : marquer expédié + email ───────────────────────────────────────

export async function markAsShipped(
  orderId: string,
  trackingNumber?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await getSuperadminOrFail();

    const order = await db.braceletPackOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        quantity: true,
        isBranded: true,
        totalPrice: true,
        trackingNumber: true,
        agency: { select: { name: true } },
      },
    });

    if (!order) {
      return { success: false, error: 'Commande introuvable.' };
    }

    if (order.status !== 'PRODUCING') {
      return { success: false, error: `La commande n'est pas en production (statut: ${order.status}).` };
    }

    const finalTracking = trackingNumber?.trim() || order.trackingNumber;

    await db.braceletPackOrder.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
        shippedAt: new Date(),
        ...(finalTracking ? { trackingNumber: finalTracking } : {}),
      },
    });

    // ─── Email "Expédition" ───
    const customerEmail = getCustomerEmail({
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
    });

    if (customerEmail) {
      const template = getShippedEmail({
        customerName: order.customerName,
        orderId,
        quantity: order.quantity,
        isBranded: order.isBranded,
        totalPrice: order.totalPrice,
        agencyName: order.agency?.name ?? null,
        trackingNumber: finalTracking,
      });

      sendEmail({
        to: customerEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
        type: 'bracelet_shipped',
      }).catch((err) => {
        console.error(`[markAsShipped] Email failed for ${orderId}:`, err);
      });
    }

    try {
      revalidatePath('/admin/bracelets');
    } catch {
      // No-op
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('REDIRECT:')) {
      throw error;
    }
    console.error('[markAsShipped] Error:', error);
    return { success: false, error: 'Erreur lors du marquage expédié.' };
  }
}

// ─── Action : marquer livré + email ─────────────────────────────────────────

export async function markAsDelivered(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await getSuperadminOrFail();

    const order = await db.braceletPackOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        quantity: true,
        isBranded: true,
        totalPrice: true,
        trackingNumber: true,
        agency: { select: { name: true, slug: true } },
      },
    });

    if (!order) {
      return { success: false, error: 'Commande introuvable.' };
    }

    if (order.status !== 'SHIPPED') {
      return { success: false, error: `La commande n'est pas expédiée (statut: ${order.status}).` };
    }

    await db.braceletPackOrder.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
      },
    });

    // ─── Email "Livraison" (avec CTA activation) ───
    const customerEmail = getCustomerEmail({
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
    });

    if (customerEmail) {
      const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/agence/bracelets`;
      const template = getDeliveredEmail({
        customerName: order.customerName,
        orderId,
        quantity: order.quantity,
        isBranded: order.isBranded,
        totalPrice: order.totalPrice,
        agencyName: order.agency?.name ?? null,
        trackingNumber: order.trackingNumber,
        activationUrl,
      });

      sendEmail({
        to: customerEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
        type: 'bracelet_delivered',
      }).catch((err) => {
        console.error(`[markAsDelivered] Email failed for ${orderId}:`, err);
      });
    }

    try {
      revalidatePath('/admin/bracelets');
    } catch {
      // No-op
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('REDIRECT:')) {
      throw error;
    }
    console.error('[markAsDelivered] Error:', error);
    return { success: false, error: 'Erreur lors du marquage livré.' };
  }
}
