/**
 * Module Bracelets Universel — Profils d'hôtel
 * =============================================
 * Source de vérité pour les 4 profils d'hôtel qui déterminent le contenu
 * affiché sur /welcome/[slug]?context=WRISTBAND.
 *
 * Un seul produit (bracelet QR), 4 expériences personnalisées selon le type
 * d'hôtel et la clientèle.
 *
 * Utilisé par :
 *   - WristbandView (rendu conditionnel selon braceletProfile)
 *   - Page boutique (section explicative des 4 profils)
 *   - Dashboard agence (sélecteur + preview des services)
 *   - Server actions (validation du profil à la sauvegarde)
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type BraceletProfile = 'BUSINESS' | 'TRANSIT' | 'RESORT' | 'BOUTIQUE' | 'HOST' | 'STANDARD';

export interface ProfileMeta {
  value: BraceletProfile;
  label: string;          // Nom commercial affiché
  labelEn: string;
  emoji: string;
  tagline: string;        // Phrase d'accroche
  taglineEn: string;
  description: string;    // Description pour la boutique / dashboard
  descriptionEn: string;
  marketShare: string;    // % du marché (argumentaire commercial)
  examples: string[];     // Exemples d'hôtels
  accentColor: string;    // Couleur d'accent (hex) pour l'UI
  services: string[];     // Liste des services clés (pour preview dashboard)
  servicesEn: string[];
}

// ─── Les 4 profils + STANDARD (fallback) ────────────────────────────────────

export const BRACELET_PROFILES: readonly ProfileMeta[] = [
  {
    value: 'BUSINESS',
    label: 'Business',
    labelEn: 'Business',
    emoji: '💼',
    tagline: 'Productivité et confort pour vos séjours professionnels',
    taglineEn: 'Productivity and comfort for your business stays',
    description:
      "Hôtels d'affaires en zones économiques (Dakar Plateau, centre des affaires). " +
      "Services axés sur la productivité : WiFi haut débit, business center, pressing express, " +
      "transport aéroport, restaurants proches pour repas d'affaires.",
    descriptionEn:
      'Business hotels in economic districts. Productivity-focused services: ' +
      'high-speed WiFi, business center, express laundry, airport transport, nearby restaurants.',
    marketShare: '35%',
    examples: ['Hôtel Le Plateau', 'Novotel Dakar', 'Pullman Dakar'],
    accentColor: '#1E40AF', // Bleu business
    services: [
      'WiFi Business (mot de passe copiable)',
      'Business Center (horaires, étage)',
      'Pressing Express (WhatsApp)',
      'Transport Aéroport (réservation)',
      'Restaurants pro (top 5 à 500m)',
      'Pharmacie 24h',
    ],
    servicesEn: [
      'Business WiFi (copyable password)',
      'Business Center (hours, floor)',
      'Express Laundry (WhatsApp)',
      'Airport Transport (booking)',
      'Pro restaurants (top 5 within 500m)',
      '24h Pharmacy',
    ],
  },
  {
    value: 'TRANSIT',
    label: 'Transit',
    labelEn: 'Transit',
    emoji: '✈️',
    tagline: 'Pratique et rassurant pour vos escales',
    taglineEn: 'Practical and reassuring for your layovers',
    description:
      "Hôtels aéroport et gare. Services axés sur la logistique : horaires de navettes, " +
      "restaurants ouverts tard ou 24h/24, bureau de change, pharmacie de garde, " +
      "check-out express pour les départs matinaux.",
    descriptionEn:
      'Airport and train station hotels. Logistics-focused services: shuttle schedules, ' +
      'late/24h restaurants, currency exchange, on-duty pharmacy, express check-out.',
    marketShare: '20%',
    examples: ['Airport Inn Dakar', 'Hôtel Blaise Diagne', 'Ibis Aéroport'],
    accentColor: '#7C3AED', // Violet transit
    services: [
      'Horaires navettes aéroport/gare',
      'Restaurants ouverts tard / 24h',
      'Bureau de change proche',
      'Pharmacie de garde',
      'Check-out express',
      'Réveil programmé',
    ],
    servicesEn: [
      'Airport/station shuttle schedules',
      'Late / 24h restaurants',
      'Nearby currency exchange',
      'On-duty pharmacy',
      'Express check-out',
      'Wake-up call',
    ],
  },
  {
    value: 'RESORT',
    label: 'Resort',
    labelEn: 'Resort',
    emoji: '🏝️',
    tagline: 'Détente et animations pour vos vacances',
    taglineEn: 'Relaxation and activities for your holidays',
    description:
      "Resorts balnéaires et clubs de vacances (Saly, Cap Skirring). Services axés sur " +
      "les loisirs : carte du resort, zones (piscine, plage, spa, restaurant), " +
      "animations du jour, excursions, boutons WhatsApp pour commander au bar/piscine.",
    descriptionEn:
      'Beach resorts and holiday clubs. Leisure-focused services: resort map, ' +
      'zones (pool, beach, spa, restaurant), daily activities, excursions, WhatsApp ordering.',
    marketShare: '25%',
    examples: ['Baobab Beach Resort', 'Royal Saly', 'Cap Skirring Resort'],
    accentColor: '#0F766E', // Teal resort
    services: [
      'Carte interactive du resort',
      'Zones (piscine, plage, spa, restaurant)',
      'Animations du jour (timeline dynamique)',
      'QuickActions WhatsApp (bar, spa, taxi)',
      'Excursions partenaires',
      'Avis Google Maps',
    ],
    servicesEn: [
      'Interactive resort map',
      'Zones (pool, beach, spa, restaurant)',
      'Daily activities (dynamic timeline)',
      'WhatsApp QuickActions (bar, spa, taxi)',
      'Partner excursions',
      'Google Maps reviews',
    ],
  },
  {
    value: 'BOUTIQUE',
    label: 'Boutique',
    labelEn: 'Boutique',
    emoji: '🏡',
    tagline: 'Authenticité et conseils locaux personnalisés',
    taglineEn: 'Authenticity and personalized local tips',
    description:
      "Maisons d'hôtes et hôtels de charme. Services axés sur l'authenticité : " +
      "recommandations personnelles de l'hôte, artisans locaux partenaires, spots cachés " +
      "du quartier, histoire et culture locale, restaurants authentiques.",
    descriptionEn:
      'Guesthouses and charm hotels. Authenticity-focused services: host personal ' +
      'recommendations, local artisan partners, hidden neighborhood spots, local history and culture.',
    marketShare: '20%',
    examples: ['Maison Almadies', 'Villa Kér Saly', "L'Hôte Dakar"],
    accentColor: '#B45309', // Ambre boutique
    services: [
      'Recommandations personnelles de l\'hôte',
      'Artisans locaux partenaires',
      'Spots cachés du quartier',
      'Histoire et culture locale',
      'Restaurants authentiques',
      'Bonnes adresses exclusives',
    ],
    servicesEn: [
      'Host personal recommendations',
      'Local artisan partners',
      'Hidden neighborhood spots',
      'Local history and culture',
      'Authentic restaurants',
      'Exclusive insider tips',
    ],
  },
  {
    value: 'HOST',
    label: 'Hôte Airbnb',
    labelEn: 'Airbnb Host',
    emoji: '🏠',
    tagline: 'Guide de la maison pour locations courte durée',
    taglineEn: 'Home guide for short-term rentals',
    description:
      "Locations Airbnb et maisons d'hôtes. Conciergerie digitale : WiFi (copiable en 1 clic), instructions check-in/out, règles, tutoriels, recommandations de l'hôte, contact WhatsApp direct.",
    descriptionEn:
      'Airbnb rentals and guesthouses. Digital concierge: WiFi (1-click copy), check-in/out, house rules, tutorials, host recommendations, WhatsApp.',
    marketShare: '—',
    examples: ['Appartement Almadies', 'Studio Sacré-Cœur', 'Villa Saly'],
    accentColor: '#B45309',
    services: [
      'WiFi (copiable en 1 clic)',
      'Instructions check-in / check-out',
      'Règles de la maison',
      'Tutoriels maison (clim, café, parking)',
      'Recommandations de l\'hôte',
      'Contact WhatsApp direct',
    ],
    servicesEn: [
      'WiFi (1-click copy)',
      'Check-in / check-out instructions',
      'House rules',
      'Home tutorials',
      'Host recommendations',
      'Direct WhatsApp contact',
    ],
  },
  {
    value: 'STANDARD',
    label: 'Standard',
    labelEn: 'Standard',
    emoji: '🏨',
    tagline: 'Services essentiels pour tous les hôtels',
    taglineEn: 'Essential services for all hotels',
    description:
      "Profil par défaut pour les hôtels non encore configurés. Affiche les services " +
      "essentiels : réception, urgences, infos pratiques, attractions à proximité. " +
      "L'hôtel peut passer à un profil spécialisé à tout moment depuis son dashboard.",
    descriptionEn:
      'Default profile for unconfigured hotels. Shows essential services: reception, ' +
      'emergencies, practical info, nearby attractions. Hotel can switch anytime.',
    marketShare: '—',
    examples: [],
    accentColor: '#E3B23C', // Or QRTags
    services: [
      'Réception et contact',
      'Urgences',
      'Infos pratiques',
      'Attractions à proximité',
    ],
    servicesEn: [
      'Reception and contact',
      'Emergencies',
      'Practical info',
      'Nearby attractions',
    ],
  },
] as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Récupère les métadonnées d'un profil par sa valeur.
 * Retourne STANDARD si le profil n'existe pas ou est null.
 */
export function getProfileMeta(profile: string | null | undefined): ProfileMeta {
  const found = BRACELET_PROFILES.find((p) => p.value === profile);
  return found || BRACELET_PROFILES.find((p) => p.value === 'STANDARD')!;
}

/**
 * Valide qu'une valeur est un braceletProfile valide.
 * Utilisé par les server actions pour valider l'input utilisateur.
 */
export function isValidProfile(profile: string): profile is BraceletProfile {
  return BRACELET_PROFILES.some((p) => p.value === profile);
}

/**
 * Liste des profils "spécialisés" (exclut STANDARD qui est le fallback).
 * Utilisé pour le sélecteur dans le dashboard agence.
 */
export const SPECIALIZED_PROFILES: readonly ProfileMeta[] = BRACELET_PROFILES.filter(
  (p) => p.value !== 'STANDARD'
);

/**
 * Message marketing principal pour la boutique.
 */
export const UNIVERSAL_BRACELET_TAGLINE = 'Un seul produit, 4 expériences personnalisées selon votre clientèle';
export const UNIVERSAL_BRACELET_TAGLINE_EN = 'One product, 4 personalized experiences based on your guests';
