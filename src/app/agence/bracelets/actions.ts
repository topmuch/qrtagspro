'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { generateReferencesBulk } from '@/lib/qr';
import { sendEmail } from '@/lib/email';
import {
  getProductionStartedEmail,
  getShippedEmail,
  getDeliveredEmail,
  getCustomerEmail,
  type BraceletOrderEmailData,
} from '@/lib/emails/bracelet-templates';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AgencyOrderSummary {
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
  createdAt: Date;
  deliveredAt: Date | null;
  activatedAt: Date | null;
  activatedCount: number;
  trackingNumber: string | null;
  logoUrl: string | null;
  brandText: string | null;
  _count: { baggages: number };
  totalScans: number;
}

export interface BraceletAnalyticsData {
  totalScans: number;
  activeWristbands: number;
  scansByDay: Array<{ date: string; count: number }>;
  topServices: Array<{ name: string; count: number }>;
  peakHours: Array<{ hour: number; count: number }>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Récupère l'agencyId depuis la session courante (cookie-based).
 * Redirige (throw) si l'utilisateur n'est pas connecté ou n'est pas une agence.
 */
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

// ─── Action : liste des commandes bracelets de l'agence ─────────────────────

/**
 * Récupère toutes les commandes de bracelets de l'agence connectée,
 * avec le compte de QR codes générés et le total de scans.
 */
export async function getAgencyBraceletOrders(): Promise<{
  success: boolean;
  orders?: AgencyOrderSummary[];
  stats?: {
    totalOrders: number;
    totalBracelets: number;
    activatedBracelets: number;
    totalScans: number;
  };
  error?: string;
}> {
  try {
    const agencyId = await getAgencyIdOrFail();

    const orders = await db.braceletPackOrder.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { baggages: true } },
        baggages: {
          select: {
            scanCount: true,
            status: true,
            // On compte les ScanLog réels plutôt que de faire confiance au
            // champ dénormalisé scanCount (qui peut être 0 si non maintenu).
            _count: { select: { scanLogs: true } },
          },
        },
      },
    });

    const summary: AgencyOrderSummary[] = orders.map((order) => ({
      id: order.id,
      quantity: order.quantity,
      isBranded: order.isBranded,
      unitPrice: order.unitPrice,
      totalPrice: order.totalPrice,
      status: order.status,
      maquetteStatus: order.maquetteStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      createdAt: order.createdAt,
      deliveredAt: order.deliveredAt,
      activatedAt: order.activatedAt,
      activatedCount: order.activatedCount,
      trackingNumber: order.trackingNumber,
      logoUrl: order.logoUrl,
      brandText: order.brandText,
      _count: { baggages: order._count.baggages },
      // totalScans = somme des ScanLog réels (et non du champ dénormalisé scanCount)
      totalScans: order.baggages.reduce((sum, b) => sum + b._count.scanLogs, 0),
    }));

    // Stats globales
    const stats = {
      totalOrders: summary.length,
      totalBracelets: summary.reduce((s, o) => s + o.quantity, 0),
      activatedBracelets: summary.reduce((s, o) => s + o.activatedCount, 0),
      totalScans: summary.reduce((s, o) => s + o.totalScans, 0),
    };

    return { success: true, orders: summary, stats };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('REDIRECT:')) {
      throw error; // Propage la redirection
    }
    console.error('[getAgencyBraceletOrders] Error:', error);
    return { success: false, error: 'Erreur lors du chargement des commandes.' };
  }
}

// ─── Action : mise à jour du statut de production ───────────────────────────

/**
 * Avance le statut d'une commande dans le workflow de production :
 *   PENDING → PRODUCING → SHIPPED → DELIVERED
 *
 * Règles :
 *   - L'utilisateur doit appartenir à l'agence propriétaire de la commande.
 *   - Le statut doit avancer séquentiellement (pas de saut arrière).
 *   - SHIPPED → DELIVERED enregistre `deliveredAt`.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const agencyId = await getAgencyIdOrFail();

    const order = await db.braceletPackOrder.findUnique({
      where: { id: orderId },
      select: {
        agencyId: true,
        status: true,
        // Champs nécessaires pour l'email transactionnel
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

    // Sécurité : l'agence ne peut modifier que ses propres commandes
    if (order.agencyId !== agencyId) {
      return { success: false, error: 'Accès refusé : cette commande ne vous appartient pas.' };
    }

    // Validation : transitions autorisées uniquement vers l'avant
    const workflow = ['PENDING', 'PRODUCING', 'SHIPPED', 'DELIVERED'];
    const currentIdx = workflow.indexOf(order.status);
    const newIdx = workflow.indexOf(newStatus);

    if (newIdx === -1) {
      return { success: false, error: `Statut invalide: ${newStatus}` };
    }
    if (newIdx <= currentIdx) {
      return { success: false, error: 'Impossible de reculer dans le workflow de production.' };
    }

    // Mise à jour
    const updateData: { status: string; shippedAt?: Date; deliveredAt?: Date } = {
      status: newStatus,
    };
    if (newStatus === 'SHIPPED') updateData.shippedAt = new Date();
    if (newStatus === 'DELIVERED') updateData.deliveredAt = new Date();

    await db.braceletPackOrder.update({
      where: { id: orderId },
      data: updateData,
    });

    // ─── Email transactionnel au client ───
    // Envoi async non-bloquant : si l'email échoue, la transition de statut
    // reste valide (on log l'erreur mais on ne bloque pas l'action).
    await sendBraceletStatusEmail(newStatus, {
      customerName: order.customerName,
      orderId,
      quantity: order.quantity,
      isBranded: order.isBranded,
      totalPrice: order.totalPrice,
      agencyName: order.agency?.name ?? null,
      trackingNumber: order.trackingNumber ?? null,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      agencySlug: order.agency?.slug ?? null,
    }).catch((err) => {
      console.error(`[updateOrderStatus] Email failed for ${orderId}:`, err);
    });

    try {
      revalidatePath('/agence/bracelets');
    } catch {
      // No-op hors contexte Next.js (tests)
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('REDIRECT:')) {
      throw error;
    }
    console.error('[updateOrderStatus] Error:', error);
    return { success: false, error: 'Erreur lors de la mise à jour du statut.' };
  }
}

// ─── Helper : envoi d'email transactionnel selon le nouveau statut ──────────

interface StatusEmailPayload {
  customerName: string;
  orderId: string;
  quantity: number;
  isBranded: boolean;
  totalPrice: number;
  agencyName: string | null;
  trackingNumber: string | null;
  customerEmail: string | null;
  customerPhone: string;
  agencySlug: string | null;
}

/**
 * Envoie l'email transactionnel approprié selon la transition de statut.
 *
 * - PRODUCING → email "Production en cours"
 * - SHIPPED   → email "Expédition"
 * - DELIVERED → email "Livraison + activation"
 *
 * Si le client n'a pas d'email (customerEmail null), l'email n'est pas envoyé
 * (on ne dégrade pas vers une passerelle SMS fictive — l'utilisateur sera
 * notifié via le dashboard / WhatsApp).
 *
 * L'email est logged automatiquement en DB par sendEmail() (EmailLog).
 */
async function sendBraceletStatusEmail(
  newStatus: string,
  payload: StatusEmailPayload
): Promise<void> {
  const customerEmail = getCustomerEmail({
    customerEmail: payload.customerEmail,
    customerPhone: payload.customerPhone,
  });

  if (!customerEmail) {
    console.warn(
      `[sendBraceletStatusEmail] Pas d'email pour ${payload.orderId} — ` +
      `notification dashboard uniquement.`
    );
    return;
  }

  const emailData: BraceletOrderEmailData = {
    customerName: payload.customerName,
    orderId: payload.orderId,
    quantity: payload.quantity,
    isBranded: payload.isBranded,
    totalPrice: payload.totalPrice,
    agencyName: payload.agencyName,
    trackingNumber: payload.trackingNumber,
    activationUrl: payload.agencySlug
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/agence/bracelets`
      : null,
  };

  let template;
  let type: string;
  switch (newStatus) {
    case 'PRODUCING':
      template = getProductionStartedEmail(emailData);
      type = 'bracelet_production_started';
      break;
    case 'SHIPPED':
      template = getShippedEmail(emailData);
      type = 'bracelet_shipped';
      break;
    case 'DELIVERED':
      template = getDeliveredEmail(emailData);
      type = 'bracelet_delivered';
      break;
    default:
      // PENDING ou statut non couvert : pas d'email
      return;
  }

  const result = await sendEmail({
    to: customerEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type,
    agencyId: undefined, // pas d'agencyId dans le contexte email log
  });

  if (!result.success) {
    console.error(
      `[sendBraceletStatusEmail] Échec envoi email ${type} à ${customerEmail}:`,
      result.error
    );
  }
}

// ─── Action : activation des QR codes (génération des Baggage wristband) ────

/**
 * Génère les N QR codes (Baggage, context=WRISTBAND) pour une commande livrée.
 *
 * Conditions :
 *   - Commande doit être DELIVERED
 *   - Pas déjà activée (activatedCount === 0)
 *   - L'utilisateur doit appartenir à l'agence propriétaire
 *
 * Génère des références uniques au format QRT<YY>-<6chars> (réutilise
 * generateReferencesBulk de src/lib/qr.ts pour la cohérence avec le reste
 * de l'app).
 */
export async function activateBracelets(
  orderId: string,
  context: string = 'WRISTBAND'
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const agencyId = await getAgencyIdOrFail();

    // ─── 1. Vérifications préalables ───
    const order = await db.braceletPackOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        agencyId: true,
        quantity: true,
        status: true,
        activatedCount: true,
        isBranded: true,
      },
    });

    if (!order) {
      return { success: false, error: 'Commande introuvable.' };
    }

    if (order.agencyId !== agencyId) {
      return { success: false, error: 'Accès refusé : cette commande ne vous appartient pas.' };
    }

    if (order.status !== 'DELIVERED') {
      return {
        success: false,
        error: 'La commande doit être livrée avant activation des QR codes.',
      };
    }

    if (order.activatedCount > 0) {
      return { success: false, error: 'Les QR codes ont déjà été générés pour cette commande.' };
    }

    // ─── 2. Validation du contexte ───
    const validContexts = ['WRISTBAND', 'ROOM', 'POOL', 'RESTAURANT', 'LOBBY', 'LUGGAGE'];
    if (!validContexts.includes(context)) {
      return { success: false, error: `Contexte invalide: ${context}` };
    }

    // ─── 3. Génération des références uniques ───
    // Réutilise l'utilitaire partagé de src/lib/qr.ts (format QRT<YY>-<6chars>).
    const references = await generateReferencesBulk(null, order.quantity);

    // ─── 4. Création en masse des Baggage (QR codes wristband) ───
    // Utilise une transaction pour garantir l'atomicité :
    //   - Soit tous les Baggage sont créés ET la commande marquée activée
    //   - Soit rien n'est créé (en cas d'erreur)
    await db.$transaction([
      db.baggage.createMany({
        data: references.map((reference) => ({
          reference,
          type: 'voyageur',
          agencyId,
          baggageType: 'cabine',
          status: 'active',
          context,
          braceletPackOrderId: orderId,
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 mois
        })),
      }),
      db.braceletPackOrder.update({
        where: { id: orderId },
        data: {
          activatedAt: new Date(),
          activatedCount: order.quantity,
        },
      }),
    ]);

    // L'email "DELIVERED" (envoyé lors de la transition de statut) contient
    // déjà le CTA "Activez vos bracelets". Pas d'email supplémentaire ici :
    // l'activation est une action interne de l'agence, pas une transition
    // de statut visible côté client.

    try {
      revalidatePath('/agence/bracelets');
    } catch {
      // No-op hors contexte Next.js (tests)
    }

    return { success: true, count: order.quantity };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('REDIRECT:')) {
      throw error;
    }
    console.error('[activateBracelets] Error:', error);
    return { success: false, error: 'Erreur lors de l\'activation des QR codes.' };
  }
}

// ─── Action : analytics des scans bracelets ─────────────────────────────────

/**
 * Calcule les analytics de scans pour les bracelets (context=WRISTBAND)
 * de l'agence connectée :
 *   - Total scans
 *   - Scans par jour (7 derniers jours)
 *   - Services les plus consultés (basé sur ScanLog.location)
 *   - Heures de pic (répartition 24h)
 */
export async function getBraceletAnalytics(): Promise<{
  success: boolean;
  data?: BraceletAnalyticsData;
  error?: string;
}> {
  try {
    const agencyId = await getAgencyIdOrFail();

    // ─── 1. Récupérer tous les wristbands de l'agence ───
    const wristbands = await db.baggage.findMany({
      where: {
        agencyId,
        context: 'WRISTBAND',
      },
      select: {
        id: true,
        scanCount: true,
        status: true,
        scanLogs: {
          select: { createdAt: true, location: true },
          orderBy: { createdAt: 'desc' },
          take: 2000, // Limite pour performance
        },
      },
    });

    const activeWristbands = wristbands.filter((w) => w.status === 'active').length;
    // totalScans = nombre réel de ScanLog (le champ scanCount peut être 0 si non maintenu)
    const totalScans = wristbands.reduce((s, w) => s + w.scanLogs.length, 0);

    // ─── 2. Scans par jour (7 derniers jours) ───
    const scansByDay: Array<{ date: string; count: number }> = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const count = wristbands.reduce((sum, w) => {
        return sum + w.scanLogs.filter((scan) => {
          const scanDate = new Date(scan.createdAt);
          return scanDate >= day && scanDate <= dayEnd;
        }).length;
      }, 0);

      const dateLabel = day.toLocaleDateString('fr-FR', { weekday: 'short' });
      scansByDay.push({ date: dateLabel, count });
    }

    // ─── 3. Services les plus consultés ───
    // Basé sur ScanLog.location (ex: "pool", "restaurant", "bar", "spa", "lobby")
    const serviceCounts = new Map<string, number>();
    for (const w of wristbands) {
      for (const scan of w.scanLogs) {
        const loc = scan.location || 'autre';
        serviceCounts.set(loc, (serviceCounts.get(loc) || 0) + 1);
      }
    }

    // Map location → label lisible
    const serviceLabels: Record<string, string> = {
      pool: 'Piscine / Plage',
      restaurant: 'Restaurant',
      bar: 'Bar',
      spa: 'Spa',
      lobby: 'Lobby / Réception',
      room: 'Chambre',
      autre: 'Autre',
    };

    const topServices = Array.from(serviceCounts.entries())
      .map(([key, count]) => ({ name: serviceLabels[key] || key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Si aucune donnée réelle, on ne simule pas (contrairement au code fourni)
    // — on retourne un tableau vide pour rester honnête sur les métriques.

    // ─── 4. Heures de pic (distribution 24h) ───
    const peakHours: Array<{ hour: number; count: number }> = Array.from(
      { length: 24 },
      (_, hour) => {
        const count = wristbands.reduce((sum, w) => {
          return sum + w.scanLogs.filter((scan) => {
            return new Date(scan.createdAt).getHours() === hour;
          }).length;
        }, 0);
        return { hour, count };
      }
    );

    return {
      success: true,
      data: {
        totalScans,
        activeWristbands,
        scansByDay,
        topServices,
        peakHours,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('REDIRECT:')) {
      throw error;
    }
    console.error('[getBraceletAnalytics] Error:', error);
    return { success: false, error: 'Erreur lors du chargement des analytics.' };
  }
}
