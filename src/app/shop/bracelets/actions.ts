'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email';
import { getOrderConfirmationEmail } from '@/lib/emails/bracelet-templates';
import {
  BRACELET_PACKS,
  computeTotalPrice,
  computeUnitPrice,
  getPackByQuantity,
  LOGO_MAX_SIZE_BYTES,
  LOGO_ACCEPTED_TYPES,
  type PaymentMethod,
} from '@/lib/bracelets';

// ─── Types ──────────────────────────────────────────────────────────────────

interface LogoPayload {
  data: number[]; // bytes du fichier (sérialisés pour le transport server action)
  name: string;
  type: string; // MIME type
}

interface CreateOrderInput {
  quantity: number;
  isBranded: boolean;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  hotelName?: string;
  deliveryCity: string;
  deliveryQuartier?: string;
  paymentMethod: PaymentMethod;
  logo?: LogoPayload | null;
}

interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  totalPrice?: number;
  error?: string;
}

// ─── Server Action ──────────────────────────────────────────────────────────

/**
 * Crée une commande de pack de bracelets de séjour universel.
 *
 * Sécurité :
 *   - Le prix est RECALCULÉ côté serveur depuis la grille BRACELET_PACKS.
 *     Le client ne peut pas injecter un prix arbitraire.
 *   - Le logo est re-validé (type + taille) côté serveur.
 *   - Tous les champs obligatoires sont re-vérifiés.
 *
 * Workflow post-création :
 *   - status = PENDING (attente de paiement / production)
 *   - paymentStatus = PENDING
 *   - maquetteStatus = PENDING (pour brandés, validation manuelle à venir)
 *   - Les QR codes ne sont PAS générés ici — ils le seront via le dashboard
 *     agence ou le workflow Phase 5 (lors du passage à PRODUCING).
 */
export async function createBraceletOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  try {
    // ─── 1. Validation des champs obligatoires ───
    if (!input.customerName?.trim()) {
      return { success: false, error: 'Le nom complet est obligatoire.' };
    }
    if (!input.customerPhone?.trim()) {
      return { success: false, error: 'Le téléphone est obligatoire.' };
    }
    if (!input.deliveryCity?.trim()) {
      return { success: false, error: 'La ville de livraison est obligatoire.' };
    }

    // ─── 2. Validation de la quantité ───
    const validQuantities = BRACELET_PACKS.map((p) => p.quantity);
    if (!validQuantities.includes(input.quantity as (typeof validQuantities)[number])) {
      return {
        success: false,
        error: `Quantité invalide. Valeurs acceptées : ${validQuantities.join(', ')}.`,
      };
    }

    // ─── 3. Recalcul du prix côté serveur (sécurité) ───
    // On ignore tout prix envoyé par le client et on recalcule depuis la grille.
    const totalPrice = computeTotalPrice(input.quantity, input.isBranded);
    const unitPrice = computeUnitPrice(input.quantity, input.isBranded);

    // ─── 4. Validation du logo (si brandé) ───
    let logoDataUrl: string | null = null;
    if (input.isBranded) {
      if (!input.logo || input.logo.data.length === 0) {
        return { success: false, error: 'Le logo est obligatoire pour les bracelets brandés.' };
      }

      // Re-validation type MIME côté serveur
      if (!LOGO_ACCEPTED_TYPES.includes(input.logo.type as (typeof LOGO_ACCEPTED_TYPES)[number])) {
        return {
          success: false,
          error: `Format de logo non supporté (${input.logo.type}). Acceptés : SVG, PNG, JPG, WEBP.`,
        };
      }

      // Re-validation taille côté serveur
      const logoBytes = Buffer.from(input.logo.data);
      if (logoBytes.length > LOGO_MAX_SIZE_BYTES) {
        return {
          success: false,
          error: `Logo trop volumineux (${(logoBytes.length / 1024 / 1024).toFixed(1)} MB). Max 5 MB.`,
        };
      }

      // Stockage en data URL (base64) dans la colonne logoUrl.
      // ⚠️ Phase 5 : migrer vers stockage fichier (/public/uploads/bracelets/)
      // ou objet S3 pour éviter de gonfler la base SQLite.
      const base64 = logoBytes.toString('base64');
      logoDataUrl = `data:${input.logo.type};base64,${base64}`;
    }

    // ─── 5. Gestion du nom de l'hôtel ───
    // Pour les bracelets brandés : on stocke dans brandText (utilisée pour la maquette).
    // Pour les bracelets standard : on stocke dans notes (info contextuelle).
    const hotelName = input.hotelName?.trim() || null;
    const brandText = input.isBranded ? hotelName : null;
    const notes = !input.isBranded && hotelName ? `Hôtel : ${hotelName}` : null;

    // ─── 6. Création de la commande ───
    const order = await db.braceletPackOrder.create({
      data: {
        quantity: input.quantity,
        isBranded: input.isBranded,
        unitPrice,
        totalPrice,
        // Workflow initial
        status: 'PENDING',
        maquetteStatus: input.isBranded ? 'PENDING' : 'VALIDATED', // Standard auto-validé
        // Logo & branding
        logoUrl: logoDataUrl,
        brandText,
        // Infos client
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone.trim(),
        customerEmail: input.customerEmail?.trim() || null,
        // Livraison
        deliveryCity: input.deliveryCity.trim(),
        deliveryQuartier: input.deliveryQuartier?.trim() || null,
        // Paiement
        paymentMethod: input.paymentMethod,
        paymentStatus: 'PENDING',
        // Métadonnées
        notes,
      },
      select: { id: true, totalPrice: true },
    });

    // ─── 7. Post-création : email de confirmation au client ───
    // Envoi non-bloquant : si l'email échoue, la commande reste créée.
    // (Le client peut n'avoir pas fourni d'email → on skip proprement.)
    const customerEmailStr = input.customerEmail?.trim() || null;
    if (customerEmailStr) {
      const confirmationEmail = getOrderConfirmationEmail({
        customerName: input.customerName.trim(),
        orderId: order.id,
        quantity: input.quantity,
        isBranded: input.isBranded,
        totalPrice: order.totalPrice,
        agencyName: null, // walk-in client — pas d'agence liée à la création
      });

      sendEmail({
        to: customerEmailStr,
        subject: confirmationEmail.subject,
        html: confirmationEmail.html,
        text: confirmationEmail.text,
        type: 'bracelet_order_confirmation',
      }).catch((err) => {
        console.error(`[createBraceletOrder] Email confirmation failed for ${order.id}:`, err);
      });
    }

    // Revalidate les pages qui listent les commandes.
    // try/catch : revalidatePath ne fonctionne que dans un contexte de requête Next.js
    // (server action appelée depuis un client component). En test hors runtime Next,
    // l'appel lèverait une erreur — on l'ignore pour ne pas casser la création de commande.
    try {
      revalidatePath('/admin/bracelets');
      revalidatePath('/agence/bracelets');
    } catch {
      // No-op : hors contexte Next.js (ex: test script). La commande est bien créée.
    }

    return {
      success: true,
      orderId: order.id,
      totalPrice: order.totalPrice,
    };
  } catch (error) {
    // Log serveur (ne pas exposer les détails techniques au client)
    console.error('[createBraceletOrder] Erreur:', error);

    // Détecte les erreurs Prisma connues pour des messages user-friendly
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { success: false, error: 'Une commande avec ces informations existe déjà.' };
    }

    return {
      success: false,
      error: 'Une erreur est survenue lors de la création de la commande. Veuillez réessayer.',
    };
  }
}

// ─── Helper : liste des packs (pour usage futur côté dashboard) ─────────────

export async function getBraceletPacks() {
  return BRACELET_PACKS.map((p) => ({
    quantity: p.quantity,
    label: p.label,
    popular: p.popular ?? false,
    standardPrice: p.standardPrice,
    brandedPrice: p.brandedPrice,
    unitPriceStandard: computeUnitPrice(p.quantity, false),
    unitPriceBranded: computeUnitPrice(p.quantity, true),
  }));
}
