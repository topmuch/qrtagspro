/**
 * Module QRTags Host — Kit Hôte (supports physiques)
 * ================================================
 * Source de vérité pour les offres du Kit Hôte QRTags.
 *
 * 3 offres :
 *   1. STARTER (25 000 FCFA one-shot) — 1 chevalet + 1 aimant + 3 mois dashboard
 *   2. SUBSCRIPTION (2 500 FCFA/mois) — Dashboard illimité + automatisation WhatsApp
 *   3. MULTI (20 000 FCFA/mois) — Jusqu'à 10 appartements + analytics
 *
 * Supports physiques inclus dans le Kit Starter :
 *   - Chevalet bois/acrylique pour table de nuit (QR code imprimé)
 *   - Aimant frigo avec QR code
 *   - Sticker NFC+QR pour box internet
 */

export type HostKitOffer = 'STARTER' | 'SUBSCRIPTION' | 'MULTI';

export interface KitOffer {
  id: HostKitOffer;
  name: string;
  nameEn: string;
  tagline: string;
  taglineEn: string;
  price: number; // FCFA
  priceLabel: string; // "25 000 FCFA" ou "2 500 FCFA/mois"
  period: string; // "one-shot" ou "/mois"
  popular?: boolean;
  icon: string;
  includes: string[];
  includesEn: string[];
  target: string;
  targetEn: string;
}

export const HOST_KIT_OFFERS: readonly KitOffer[] = [
  {
    id: 'STARTER',
    name: 'Kit Hôte Starter',
    nameEn: 'Host Starter Kit',
    tagline: 'Tout pour démarrer — supports physiques + 3 mois de dashboard',
    taglineEn: 'Everything to start — physical supports + 3 months dashboard',
    price: 25000,
    priceLabel: '25 000 FCFA',
    period: 'one-shot',
    icon: '📦',
    popular: true,
    includes: [
      '1 chevalet bois/acrylique (table de nuit)',
      '1 aimant frigo avec QR code',
      '1 sticker NFC+QR pour box internet',
      '3 mois de dashboard illimité',
      'Configuration du QR code personnalisée',
      'Guide digital interactif (WiFi, règles, recommandations)',
    ],
    includesEn: [
      '1 wood/acrylic stand (nightstand)',
      '1 fridge magnet with QR code',
      '1 NFC+QR sticker for internet box',
      '3 months unlimited dashboard',
      'Custom QR code configuration',
      'Interactive digital guide (WiFi, rules, recommendations)',
    ],
    target: 'Hôte débutant (1 appartement)',
    targetEn: 'Beginner host (1 apartment)',
  },
  {
    id: 'SUBSCRIPTION',
    name: 'Abonnement Host',
    nameEn: 'Host Subscription',
    tagline: 'Dashboard illimité + automatisation WhatsApp',
    taglineEn: 'Unlimited dashboard + WhatsApp automation',
    price: 2500,
    priceLabel: '2 500 FCFA',
    period: '/mois',
    icon: '🔄',
    includes: [
      'Dashboard illimité (guide de la maison)',
      'Automatisation WhatsApp (J-1 + check-out)',
      'Réservations illimitées',
      'Messages automatiques personnalisables',
      'Statistiques de clics et vues',
      'Support prioritaire',
    ],
    includesEn: [
      'Unlimited dashboard (home guide)',
      'WhatsApp automation (J-1 + checkout)',
      'Unlimited reservations',
      'Customizable automatic messages',
      'Click and view statistics',
      'Priority support',
    ],
    target: 'Hôte régulier',
    targetEn: 'Regular host',
  },
  {
    id: 'MULTI',
    name: 'Pack Multi-Apparts',
    nameEn: 'Multi-Apartment Pack',
    tagline: 'Jusqu\'à 10 appartements + analytics avancés',
    taglineEn: 'Up to 10 apartments + advanced analytics',
    price: 20000,
    priceLabel: '20 000 FCFA',
    period: '/mois',
    icon: '🏢',
    includes: [
      'Jusqu\'à 10 appartements',
      'Dashboard illimité pour chaque appartement',
      'Automatisation WhatsApp pour tous les logements',
      'Analytics consolidés (clics, vues, taux de conversion)',
      'White label (votre logo sur le bracelet)',
      'Gestionnaire de réservations partagé',
      'API d\'intégration (Airbnb, Booking.com)',
      'Account manager dédié',
    ],
    includesEn: [
      'Up to 10 apartments',
      'Unlimited dashboard for each apartment',
      'WhatsApp automation for all properties',
      'Consolidated analytics (clicks, views, conversion)',
      'White label (your logo on the wristband)',
      'Shared reservation manager',
      'API integration (Airbnb, Booking.com)',
      'Dedicated account manager',
    ],
    target: 'Hôte professionnel / Agence immobilière',
    targetEn: 'Professional host / Real estate agency',
  },
] as const;

// ─── Supports physiques inclus dans le Kit Starter ──────────────────────────

export interface PhysicalSupport {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  specs: string[];
}

export const PHYSICAL_SUPPORTS: readonly PhysicalSupport[] = [
  {
    id: 'chevalet',
    name: 'Chevalet Bois/Acrylique',
    nameEn: 'Wood/Acrylic Stand',
    description: 'Chevalet élégant pour la table de nuit. Le voyageur scanne le QR code en arrivant.',
    descriptionEn: 'Elegant stand for the nightstand. The guest scans the QR code upon arrival.',
    icon: '🪧',
    specs: ['Matériau : bois + acrylique', 'Dimensions : 10×15 cm', 'QR code gravé + imprimé', 'Personnalisable (nom du logement)'],
  },
  {
    id: 'aimant',
    name: 'Aimant Frigo QR',
    nameEn: 'Fridge Magnet QR',
    description: 'Aimant frigo avec QR code. Toujours visible dans la cuisine, accessible à tout moment.',
    descriptionEn: 'Fridge magnet with QR code. Always visible in the kitchen, accessible anytime.',
    icon: '🧲',
    specs: ['Aimant puissant', 'Dimensions : 8×8 cm', 'Résistant à l\'eau', 'QR code vinyle haute durabilité'],
  },
  {
    id: 'sticker-nfc',
    name: 'Sticker NFC+QR',
    nameEn: 'NFC+QR Sticker',
    description: 'Sticker pour la box internet. Le voyageur touche le sticker avec son téléphone (NFC) ou scanne le QR code.',
    descriptionEn: 'Sticker for the internet box. The guest taps the sticker with their phone (NFC) or scans the QR code.',
    icon: '📱',
    specs: ['NFC + QR code dual', 'Adhésif repositionnable', 'Dimensions : 5×5 cm', 'Compatible tous smartphones NFC'],
  },
] as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getOfferById(id: string): KitOffer | undefined {
  return HOST_KIT_OFFERS.find((o) => o.id === id);
}

export function formatFCFA(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

// ─── Options de paiement ────────────────────────────────────────────────────

export const PAYMENT_METHODS: { value: string; label: string; icon: string }[] = [
  { value: 'wave', label: 'Wave', icon: '💙' },
  { value: 'orange_money', label: 'Orange Money', icon: '🟠' },
  { value: 'cash_on_delivery', label: 'Cash à la livraison', icon: '💵' },
];
