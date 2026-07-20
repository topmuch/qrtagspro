import { db } from './db';

/**
 * QRTags — Génération de références et lots de QR codes
 *
 * Toutes les références QRTags suivent le format :
 *   QRT<YY>-<6 chars alphanum>
 *   ex: QRT26-MLQGY7
 *
 * Les anciens préfixes HAJJ/VOL sont conservés en rétrocompat pour la lecture,
 * mais toute nouvelle génération utilise QRT.
 */

// ─── Generate random alphanumeric string ───────────────────────────
export function generateRandomCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ─── Type alias (rétrocompat) ───────────────────────────────────────
// QRTags n'a plus de distinction hajj/voyageur — tout est 'voyageur'.
// On garde le type pour ne pas casser les imports existants.
export type TagType = 'hajj' | 'voyageur';

// ─── Generate unique reference (single) ────────────────────────────
export async function generateReference(type?: TagType): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  // QRTags : toujours préfixe QRT (ignore l'ancien param `type`)
  const prefix = 'QRT';

  let reference = '';
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    reference = `${prefix}${year}-${generateRandomCode(6)}`;

    const existing = await db.baggage.findUnique({
      where: { reference },
    });

    if (!existing) {
      return reference;
    }
    attempts++;
  }

  throw new Error('Failed to generate unique reference');
}

/**
 * Generate multiple unique references in bulk — single DB query for uniqueness check.
 */
export async function generateReferencesBulk(type: TagType | null, count: number): Promise<string[]> {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = 'QRT';
  const uniqueRefs = new Set<string>();
  let iterations = 0;
  const maxIterations = 10;

  while (uniqueRefs.size < count && iterations < maxIterations) {
    const needed = count - uniqueRefs.size;
    const candidates: string[] = [];
    for (let i = 0; i < needed; i++) {
      candidates.push(`${prefix}${year}-${generateRandomCode(6)}`);
    }

    const existing = await db.baggage.findMany({
      where: { reference: { in: candidates } },
      select: { reference: true },
    });
    const existingSet = new Set(existing.map((b) => b.reference));

    for (const candidate of candidates) {
      if (!existingSet.has(candidate) && !uniqueRefs.has(candidate)) {
        uniqueRefs.add(candidate);
      }
    }

    iterations++;
  }

  if (uniqueRefs.size < count) {
    throw new Error(`Failed to generate ${count} unique references (only got ${uniqueRefs.size})`);
  }

  return Array.from(uniqueRefs);
}

// ─── Generate unique set ID (lot) ──────────────────────────────────
export function generateSetId(type?: TagType): string {
  const year = new Date().getFullYear();
  const random = generateRandomCode(4);
  return `LOT-${year}-${random}`;
}

// ─── Generate multiple baggages (legacy, kept for compat) ──────────
export interface GenerateBaggageOptions {
  type?: TagType;
  agencyId?: string;
  count: 1 | 2 | 3;
}

export interface GenerateIndividualOptions {
  type?: TagType;
  firstName: string;
  lastName: string;
  whatsapp: string;
  duration: '7d' | '1y';
  baggageCount: 1 | 2;
}

/**
 * @deprecated Use the API route /api/admin/baggages/generate instead.
 */
export async function generateBaggages(options: GenerateBaggageOptions): Promise<string[]> {
  const { type = 'voyageur', agencyId, count } = options;

  const setId = generateSetId(type);
  const references = await generateReferencesBulk(type, count);

  await db.baggage.createMany({
    data: references.map((reference, i) => ({
      reference,
      type,
      setId,
      agencyId: agencyId || null,
      baggageIndex: i + 1,
      baggageType: 'soute',
      // QRTags : nouveau statut par défaut
      status: agencyId ? 'assigned_to_agency' : 'in_stock',
      assignedToAgencyAt: agencyId ? new Date() : null,
    })),
  });

  return references;
}

// ─── Calculate expiration date ─────────────────────────────────────
// QRTags : 1 an par défaut. Le param `type` est ignoré (kept for compat).
export function calculateExpirationDate(type?: TagType, subtype?: 'sticker' | 'tag'): Date {
  const now = new Date();

  // QRTags : tous les tags ont une validité d'1 an
  if (subtype === 'sticker') {
    // Sticker courte durée (7 jours) — rare en QRTags mais conservé
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  // Tag longue durée : 1 an
  return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
}

// ─── Validate reference format ─────────────────────────────────────
// Accepte QRT (nouveau), HAJJ (legacy) et VOL (legacy)
export function isValidReferenceFormat(reference: string): boolean {
  const qrtPattern = /^QRT\d{2}-[A-Z0-9]{6}$/;
  const hajjPattern = /^HAJJ\d{2}-[A-Z0-9]{6}$/;
  const volPattern = /^VOL\d{2}-[A-Z0-9]{6}$/;
  return qrtPattern.test(reference) || hajjPattern.test(reference) || volPattern.test(reference);
}

// ─── Get baggage status info (UI helpers) ──────────────────────────
export function getBaggageStatusInfo(status: string) {
  const map: Record<string, { label: string; color: string; icon: string }> = {
    in_stock:            { label: 'En stock',          color: 'slate',   icon: '📦' },
    assigned_to_agency:  { label: 'Assigné à agence',  color: 'blue',    icon: '🏢' },
    sold:                { label: 'Vendu',             color: 'amber',   icon: '💰' },
    activated:           { label: 'Activé',            color: 'emerald', icon: '✅' },
    pending_activation:  { label: 'En attente',        color: 'slate',   icon: '⏳' },
    active:              { label: 'Activé',            color: 'emerald', icon: '✅' },
    scanned:             { label: 'Scanné',            color: 'purple',  icon: '📍' },
    lost:                { label: 'Perdu',             color: 'red',     icon: '🚨' },
    found:               { label: 'Retrouvé',          color: 'green',   icon: '🎉' },
    blocked:             { label: 'Bloqué',            color: 'zinc',    icon: '🚫' },
    expired:             { label: 'Expiré',            color: 'zinc',    icon: '⌛' },
  };
  return map[status] || { label: status, color: 'slate', icon: '❓' };
}
