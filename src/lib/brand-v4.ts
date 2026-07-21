/**
 * QRTagsPro V4 — Brand tokens centralisés
 *
 * Nouvelle charte graphique:
 *   - Bleu corporate: #134288 (fond principal, en-têtes)
 *   - Vert: #32ba5d (accents, boutons primary, highlights)
 *   - Blanc: #FFFFFF (cartes, formulaires)
 *   - Noir: #0f172a (texte sur fond clair)
 *
 * Utilisation:
 *   import { BRAND } from '@/lib/brand-v4';
 *   <div style={{ backgroundColor: BRAND.bg, color: BRAND.textOnDark }}>
 */

export const BRAND = {
  // Couleurs principales
  bg: '#134288',           // Bleu corporate — fond principal
  bgDark: '#0d3266',       // Bleu plus foncé — dégradés, hover
  bgLight: '#1e5bb0',      // Bleu plus clair — accents secondaires

  accent: '#32ba5d',       // Vert — boutons, highlights, badges "succès"
  accentHover: '#28a54f',  // Vert hover
  accentLight: '#4ecb76',  // Vert clair

  // Couleurs neutres
  white: '#FFFFFF',
  ink: '#0f172a',          // Texte principal sur fond clair
  textOnDark: '#f5f5f5',   // Texte clair sur fond bleu
  textMuted: '#64748b',    // Texte secondaire

  // Couleurs sémantiques
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  info: '#0ea5e9',

  // Cartes et formulaires
  cardBg: '#FFFFFF',
  cardBorder: '#0f172a',   // Bordures noires 2px pour les cartes
  inputBg: '#f8fafc',      // Fond des inputs

  // Dégradés
  gradientHero: 'linear-gradient(135deg, #134288 0%, #0d3266 100%)',
  gradientAccent: 'linear-gradient(135deg, #32ba5d 0%, #28a54f 100%)',

  // Classes Tailwind fréquentes (pour éviter les répétitions)
  classes: {
    card: 'bg-white rounded-xl p-6 shadow-xl border-2 border-[#0f172a]',
    input:
      'w-full px-4 py-3 rounded-lg bg-gray-50 border-2 border-[#0f172a] text-black placeholder-gray-400 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d] transition',
    buttonPrimary:
      'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#32ba5d] text-white font-bold border-2 border-[#0f172a] hover:bg-[#28a54f] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed',
    buttonSecondary:
      'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white text-[#134288] font-bold border-2 border-[#0f172a] hover:bg-gray-100 hover:-translate-y-0.5 transition-all',
    buttonDark:
      'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#134288] text-white font-bold border-2 border-[#134288] hover:bg-[#0d3266] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed',
    badgeSuccess:
      'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#32ba5d]/15 text-[#28a54f] border border-[#32ba5d]/30',
    badgeWarning:
      'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300',
    badgeDanger:
      'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300',
  },
} as const;

// Aliases pour compatibilité avec l'ancien code
export const QRTAGS_BG = BRAND.bg;
export const QRTAGS_ACCENT = BRAND.accent;
export const QRTAGS_INK = BRAND.ink;
export const QRTAGS_RED = BRAND.danger;
export const QRTAGS_GREEN = BRAND.success;
