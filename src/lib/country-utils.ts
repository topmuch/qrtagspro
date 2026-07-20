/**
 * LABS — Feature #4: Country utilities
 *
 * Helpers pour normaliser les noms de pays en codes ISO 3166-1 alpha-2.
 * Utilisé pour la détection de mismatch entre la destination enregistrée
 * et le pays où le QR a été scanné.
 *
 * Source des données : COUNTRY_REGIONS dans CountryRegionSelect.tsx
 */

import { COUNTRY_REGIONS } from '@/lib/country-data';

// ─── Map : country name (lowercase) → ISO code ───
const COUNTRY_NAME_TO_CODE: Record<string, string> = {};
for (const region of COUNTRY_REGIONS) {
  for (const country of region.countries) {
    COUNTRY_NAME_TO_CODE[country.name.toLowerCase()] = country.code;
  }
}

// ─── Map : ISO code → country name ───
const COUNTRY_CODE_TO_NAME: Record<string, string> = {};
for (const region of COUNTRY_REGIONS) {
  for (const country of region.countries) {
    COUNTRY_CODE_TO_NAME[country.code.toUpperCase()] = country.name;
  }
}

/**
 * Convertit un nom de pays en code ISO alpha-2.
 * Retourne null si le pays n'est pas trouvé dans la liste.
 *
 * @example
 * countryNameToCode('Sénégal') → 'SN'
 * countryNameToCode('Maroc') → 'MA'
 * countryNameToCode('inconnu') → null
 */
export function countryNameToCode(name: string | null | undefined): string | null {
  if (!name) return null;
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;
  return COUNTRY_NAME_TO_CODE[normalized] || null;
}

/**
 * Convertit un code ISO alpha-2 en nom de pays.
 * Retourne le code tel quel si non trouvé.
 *
 * @example
 * countryCodeToName('SN') → 'Sénégal'
 * countryCodeToName('XX') → 'XX'
 */
export function countryCodeToName(code: string | null | undefined): string {
  if (!code) return '';
  const normalized = code.trim().toUpperCase();
  return COUNTRY_CODE_TO_NAME[normalized] || code;
}

/**
 * Vérifie si une chaîne ressemble à un code ISO pays (2 lettres).
 */
export function isCountryCode(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^[A-Z]{2}$/.test(value.trim().toUpperCase());
}
