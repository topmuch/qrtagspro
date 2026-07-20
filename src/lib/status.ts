/**
 * Status Normalization — Central helper (QRTags)
 *
 * Statuts QRTags :
 *   in_stock | assigned_to_agency | sold | activated | scanned | lost | found | blocked | expired
 *
 * Rétrocompatibilité QRBags :
 *   pending_activation → in_stock
 *   active             → activated
 *
 * Aliases français (legacy) :
 *   EN_ATTENTE, ACTIF, SCANNÉ, PERDU, TROUVÉ, BLOQUÉ, EXPIRÉ
 */

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

export type BaggageStatus =
  | 'in_stock'
  | 'assigned_to_agency'
  | 'sold'
  | 'activated'
  | 'scanned'
  | 'lost'
  | 'found'
  | 'blocked'
  | 'expired'
  // Rétrocompat (mappés vers les nouveaux)
  | 'pending_activation'
  | 'active';

// ═══════════════════════════════════════════════════════
//  ALIASES
// ═══════════════════════════════════════════════════════

const STATUS_ALIASES: Record<string, BaggageStatus> = {
  // French legacy → English
  EN_ATTENTE: 'in_stock',
  ACTIF: 'activated',
  SCANNÉ: 'scanned',
  PERDU: 'lost',
  TROUVÉ: 'found',
  BLOQUÉ: 'blocked',
  EXPIRÉ: 'expired',
  // Lowercase French
  en_attente: 'in_stock',
  actif: 'activated',
  scanné: 'scanned',
  perdu: 'lost',
  trouvé: 'found',
  bloqué: 'blocked',
  expiré: 'expired',
  // QRBags → QRTags
  pending_activation: 'in_stock',
  active: 'activated',
};

// ═══════════════════════════════════════════════════════
//  NORMALIZE
// ═══════════════════════════════════════════════════════

/**
 * Normalize any status string to QRTags standard format.
 * Returns 'in_stock' as safe default for null/undefined.
 */
export function normalizeStatus(status: string | null | undefined): BaggageStatus {
  if (!status) return 'in_stock';
  return STATUS_ALIASES[status] || (status as BaggageStatus);
}

/**
 * Check if status is "pending" (tag not yet sold/activated).
 */
export function isPending(status: string | null | undefined): boolean {
  const s = normalizeStatus(status);
  return s === 'in_stock' || s === 'assigned_to_agency' || s === 'pending_activation';
}

/**
 * Check if status is "activated" (or scanned — still active).
 */
export function isActive(status: string | null | undefined): boolean {
  const s = normalizeStatus(status);
  return s === 'activated' || s === 'active' || s === 'scanned';
}

/**
 * Check if status is "scanned".
 */
export function isScanned(status: string | null | undefined): boolean {
  return normalizeStatus(status) === 'scanned';
}

/**
 * Check if status is "lost".
 */
export function isLost(status: string | null | undefined): boolean {
  return normalizeStatus(status) === 'lost';
}

/**
 * Check if status is "found".
 */
export function isFound(status: string | null | undefined): boolean {
  return normalizeStatus(status) === 'found';
}

/**
 * Build a Prisma `{ in: [...] }` filter for a given standard status
 * that matches BOTH French and English variants in DB.
 */
export function statusFilterIn(standardStatus: BaggageStatus): { in: string[] } {
  const aliases = Object.entries(STATUS_ALIASES)
    .filter(([, eng]) => eng === standardStatus)
    .map(([fr]) => fr);
  return { in: [standardStatus, ...aliases] };
}

/**
 * Build a Prisma `{ in: [...] }` filter for multiple standard statuses.
 */
export function statusFilterInMany(standardStatuses: BaggageStatus[]): { in: string[] } {
  const all: string[] = [];
  for (const s of standardStatuses) {
    const f = statusFilterIn(s);
    all.push(...f.in);
  }
  return { in: [...new Set(all)] };
}
