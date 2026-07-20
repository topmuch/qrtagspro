/**
 * QRTagsPro V1 — i18n stub (FR only)
 *
 * V1 is French-only. This file is kept as a minimal stub for backward
 * compatibility with components that import `Language` and `LANGUAGE_NAMES`
 * (e.g. LanguageSelector). All translation helpers now return FR / empty.
 */

export type Language = 'fr' | 'en' | 'ar';

export const LANGUAGE_NAMES: Record<Language, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
};

export const LANGUAGE_DIRECTION: Record<Language, 'ltr' | 'rtl'> = {
  fr: 'ltr',
  en: 'ltr',
  ar: 'rtl',
};

export const LANGUAGE_COOKIE_NAME = 'qrtags_locale';
export const LANGUAGE_COOKIE_MAX_AGE_DAYS = 7;

/** V1 FR-only — always returns 'fr'. Kept for backward compatibility. */
export function detectLanguageFromBrowser(): Language {
  return 'fr';
}

/** V1 FR-only — always returns 'fr'. Kept for backward compatibility. */
export function detectLanguageFromCountry(_countryCode: string): Language {
  return 'fr';
}

/** V1 FR-only — always returns 'fr'. Kept for backward compatibility. */
export function detectLocaleFromHeaders(_headers: Headers): Language {
  return 'fr';
}

/** V1 FR-only — returns empty map (no external translation files). */
export async function loadTranslations(_lang: Language): Promise<Record<string, string>> {
  return {};
}
