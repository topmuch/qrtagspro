/**
 * Module Bracelets de Séjour Universel — Constantes & helpers partagés
 * ================================================================
 * Source de vérité unique pour la grille tarifaire, utilisée par :
 *   - La page boutique (/shop/bracelets)
 *   - La server action (création de commande)
 *   - Le seed (prisma/seed-bracelets.ts — réplique la grille)
 *   - Le dashboard agence (affichage prix)
 *
 * ⚠️ Ne pas dupliquer cette grille ailleurs. Toute évolution tarifaire
 *    doit se faire ici uniquement.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type BraceletType = 'standard' | 'branded';
export type BraceletQuantity = 50 | 100 | 500;
export type PaymentMethod = 'wave' | 'orange_money' | 'cash_on_delivery';

export interface BraceletPack {
  quantity: BraceletQuantity;
  standardPrice: number; // FCFA — prix total du pack standard
  brandedPrice: number; // FCFA — prix total du pack brandé
  label: string; // Nom commercial du pack
  popular?: boolean; // Met en avant le pack le plus vendu
  deliveryDays: string; // Délai de livraison affiché
}

// ─── Grille tarifaire (FCFA) ────────────────────────────────────────────────
// Alignée sur le brief mission :
//   Pack 50  : Standard 45 000 / Brandé 70 000
//   Pack 100 : Standard 85 000 / Brandé 130 000
//   Pack 500 : Standard 400 000 / Brandé 600 000

export const BRACELET_PACKS: readonly BraceletPack[] = [
  {
    quantity: 50,
    standardPrice: 45000,
    brandedPrice: 70000,
    label: 'Découverte',
    deliveryDays: '48-72h',
  },
  {
    quantity: 100,
    standardPrice: 85000,
    brandedPrice: 130000,
    label: 'Saison',
    popular: true,
    deliveryDays: '48h',
  },
  {
    quantity: 500,
    standardPrice: 400000,
    brandedPrice: 600000,
    label: 'Haute Saison',
    deliveryDays: '72h',
  },
] as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Récupère un pack par sa quantité.
 * @throws si la quantité n'est pas dans la grille (50/100/500).
 */
export function getPackByQuantity(quantity: number): BraceletPack {
  const pack = BRACELET_PACKS.find((p) => p.quantity === quantity);
  if (!pack) {
    throw new Error(`Quantité invalide: ${quantity}. Valeurs acceptées: 50, 100, 500.`);
  }
  return pack;
}

/**
 * Calcule le prix total d'un pack selon le type (standard/brandé).
 * Utilisé côté serveur (server action) pour ne jamais faire confiance au
 * prix envoyé par le client.
 */
export function computeTotalPrice(quantity: number, isBranded: boolean): number {
  const pack = getPackByQuantity(quantity);
  return isBranded ? pack.brandedPrice : pack.standardPrice;
}

/**
 * Calcule le prix unitaire (FCFA par bracelet), arrondi à l'entier le plus proche.
 * Stocké dans BraceletPackOrder.unitPrice au moment de la commande (snapshot).
 */
export function computeUnitPrice(quantity: number, isBranded: boolean): number {
  const total = computeTotalPrice(quantity, isBranded);
  return Math.round(total / quantity);
}

/**
 * Formate un montant FCFA avec séparateur de milliers.
 * Utilisé pour l'affichage prix côté UI.
 */
export function formatFCFA(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

// ─── Options de paiement ────────────────────────────────────────────────────

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'wave', label: 'Wave', icon: '💙' },
  { value: 'orange_money', label: 'Orange Money', icon: '🟠' },
  { value: 'cash_on_delivery', label: 'Cash à la livraison', icon: '💵' },
];

// ─── Limites upload logo ────────────────────────────────────────────────────

export const LOGO_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const LOGO_ACCEPTED_TYPES = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'] as const;
export const LOGO_ACCEPT_ATTR = '.svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp';
