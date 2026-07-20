/**
 * LABS — Feature F: Coordonnées utiles par destination
 *
 * Base de données des contacts d'urgence pour les principales destinations
 * des voyageurs QRTags.
 *
 * Source : ambassades de France à l'étranger, numéros d'urgence locaux
 * (vérifiés sur sites officiels). À maintenir à jour périodiquement.
 */

export interface EmergencyContacts {
  countryCode: string;       // ISO 3166-1 alpha-2 (ex: "SN")
  countryName: string;       // Nom français (ex: "Sénégal")
  flag: string;              // Emoji drapeau
  police: string;            // Numéro police locale
  medical: string;           // Urgences médicales
  fire: string;              // Pompiers
  frenchEmbassy: string;     // Ambassade de France (téléphone)
  frenchEmbassyUrl?: string; // URL ambassade
  mainAirline?: string;      // Compagnie aérienne principale
  mainAirlinePhone?: string; // Contact compagnie
  notes?: string;            // Conseils spécifiques au pays
}

export const EMERGENCY_CONTACTS: Record<string, EmergencyContacts> = {
  SN: {
    countryCode: 'SN',
    countryName: 'Sénégal',
    flag: '🇸🇳',
    police: '17',
    medical: 'SAMU : 1515',
    fire: '18',
    frenchEmbassy: '+221 33 823 55 55',
    frenchEmbassyUrl: 'https://sn.ambafrance.org',
    mainAirline: 'Air Sénégal',
    mainAirlinePhone: '+221 33 869 00 00',
    notes: 'En cas de perte de bagage à l\'aéroport Blaise Diagne, contactez directement le comptoir Air Sénégal.',
  },
  MA: {
    countryCode: 'MA',
    countryName: 'Maroc',
    flag: '🇲🇦',
    police: '19',
    medical: '150',
    fire: '15',
    frenchEmbassy: '+212 522 46 11 11',
    frenchEmbassyUrl: 'https://ma.ambafrance.org',
    mainAirline: 'Royal Air Maroc',
    mainAirlinePhone: '+212 522 91 00 00',
    notes: 'Pour Hajj via Casablanca, conservez tous les reçus de transit.',
  },
  DZ: {
    countryCode: 'DZ',
    countryName: 'Algérie',
    flag: '🇩🇿',
    police: '17',
    medical: 'SAMU : 14',
    fire: '14',
    frenchEmbassy: '+213 21 98 21 21',
    frenchEmbassyUrl: 'https://dz.ambafrance.org',
    mainAirline: 'Air Algérie',
    mainAirlinePhone: '+213 21 50 40 40',
  },
  TN: {
    countryCode: 'TN',
    countryName: 'Tunisie',
    flag: '🇹🇳',
    police: '197',
    medical: '190',
    fire: '198',
    frenchEmbassy: '+216 71 105 105',
    frenchEmbassyUrl: 'https://tn.ambafrance.org',
    mainAirline: 'Tunisair',
    mainAirlinePhone: '+216 71 940 000',
  },
  CI: {
    countryCode: 'CI',
    countryName: 'Côte d\'Ivoire',
    flag: '🇨🇮',
    police: '170',
    medical: '185',
    fire: '180',
    frenchEmbassy: '+225 27 22 49 10 00',
    frenchEmbassyUrl: 'https://ci.ambafrance.org',
    mainAirline: 'Air Côte d\'Ivoire',
    mainAirlinePhone: '+225 27 22 51 51 51',
  },
  ML: {
    countryCode: 'ML',
    countryName: 'Mali',
    flag: '🇲🇱',
    police: '17',
    medical: '15',
    fire: '18',
    frenchEmbassy: '+223 44 98 63 00',
    frenchEmbassyUrl: 'https://ml.ambafrance.org',
    notes: 'Pour Hajj via Bamako, vérifiez votre transit avec la compagnie aérienne.',
  },
  FR: {
    countryCode: 'FR',
    countryName: 'France',
    flag: '🇫🇷',
    police: '17',
    medical: 'SAMU : 15',
    fire: '18',
    frenchEmbassy: '—',
    notes: 'En France, le 112 (urgence européenne) fonctionne pour toutes les urgences.',
  },
  SA: {
    countryCode: 'SA',
    countryName: 'Arabie Saoudite',
    flag: '🇸🇦',
    police: '999',
    medical: '997',
    fire: '998',
    frenchEmbassy: '+966 11 488 99 99',
    frenchEmbassyUrl: 'https://sa.ambafrance.org',
    notes: 'Pour Hajj/Umrah : conservez votre bracelet d\'identification. En cas de perte de bagage à Jeddah ou Médine, contactez votre agence de voyage immédiatement.',
  },
  AE: {
    countryCode: 'AE',
    countryName: 'Émirats Arabes Unis',
    flag: '🇦🇪',
    police: '999',
    medical: '998',
    fire: '997',
    frenchEmbassy: '+971 2 44 66 700',
    frenchEmbassyUrl: 'https://ae.ambafrance.org',
    mainAirline: 'Emirates',
    mainAirlinePhone: '+971 600 555 555',
  },
  TR: {
    countryCode: 'TR',
    countryName: 'Turquie',
    flag: '🇹🇷',
    police: '155',
    medical: '112',
    fire: '110',
    frenchEmbassy: '+90 312 470 30 00',
    frenchEmbassyUrl: 'https://tr.ambafrance.org',
    mainAirline: 'Turkish Airlines',
    mainAirlinePhone: '+90 212 463 63 63',
  },
  JP: {
    countryCode: 'JP',
    countryName: 'Japon',
    flag: '🇯🇵',
    police: '110',
    medical: '119',
    fire: '119',
    frenchEmbassy: '+81 3 5798 6000',
    frenchEmbassyUrl: 'https://jp.ambafrance.org',
    mainAirline: 'Japan Airlines / ANA',
    notes: 'Le 119 combine urgences médicales et pompiers au Japon.',
  },
  US: {
    countryCode: 'US',
    countryName: 'États-Unis',
    flag: '🇺🇸',
    police: '911',
    medical: '911',
    fire: '911',
    frenchEmbassy: '+1 202 944 6000',
    frenchEmbassyUrl: 'https://fr.ambafrance.org',
    notes: 'Le 911 est le numéro unique pour toutes les urgences aux États-Unis.',
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    flag: '🇨🇦',
    police: '911',
    medical: '911',
    fire: '911',
    frenchEmbassy: '+1 613 567 1616',
    frenchEmbassyUrl: 'https://ca.ambafrance.org',
    notes: 'Le 911 est le numéro unique pour toutes les urgences au Canada.',
  },
};

/**
 * Récupère les contacts d'urgence pour un pays donné.
 * @param countryCode Code ISO 3166-1 alpha-2 (ex: "SN")
 * @returns EmergencyContacts ou null si pays non répertorié
 */
export function getEmergencyContacts(countryCode: string | null | undefined): EmergencyContacts | null {
  if (!countryCode) return null;
  const code = countryCode.toUpperCase().substring(0, 2);
  return EMERGENCY_CONTACTS[code] || null;
}

/**
 * Liste tous les pays disponibles.
 */
export function getAllSupportedCountries(): EmergencyContacts[] {
  return Object.values(EMERGENCY_CONTACTS);
}
