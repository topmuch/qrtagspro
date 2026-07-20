/**
 * QRTags — Brand color tokens (shared across pages)
 *
 * Charte QRTags : Noir (#111111) + Jaune Moutarde (#E3B23C).
 * Texte clair sur fond noir, texte noir sur jaune moutarde.
 * High-contrast, modern, mobile-first.
 *
 * (Hérité de QRTags mais refondu pour QRTags — bleu supprimé.)
 */

export const BRAND = '#111111';   // Noir QRTags — fonds principaux, headers, boutons primaires (sur jaune)
export const ACCENT = '#E3B23C';  // Jaune Moutarde QRTags — cards, blocs de contenu, accents, boutons (sur noir)
export const ACCENT_HOVER = '#FFDB58'; // Variante hover plus claire
export const INK = '#111111';     // Noir — texte sur jaune, bordures dashed

export const BRAND_COLORS = {
  BRAND,
  ACCENT,
  ACCENT_HOVER,
  INK,
  BLACK: INK,
  MUSTARD: ACCENT,
} as const;
