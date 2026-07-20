'use client';

/**
 * QRTagsPro V1 — useTranslation stub (FR only)
 *
 * V1 is French-only. This hook returns a no-op `t()` that returns the key
 * as-is (FR text is now hardcoded in components). Kept as a stub so that
 * existing admin pages (e.g. /admin/monitoring) continue to compile.
 */

import { useCallback } from 'react';
import { Language, LANGUAGE_NAMES, LANGUAGE_DIRECTION } from '@/lib/i18n';

interface UseTranslationReturn {
  t: (key: string, params?: Record<string, string>) => string;
  lang: Language;
  setLang: (lang: Language) => void;
  dir: 'ltr' | 'rtl';
  langName: string;
  isLoading: boolean;
  countryCode: string;
}

export function useTranslation(): UseTranslationReturn {
  const lang: Language = 'fr';

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    if (!params) return key;
    let text = key;
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`{${k}}`, 'g'), v);
    }
    return text;
  }, []);

  const setLang = useCallback((_newLang: Language) => {
    /* V1 FR-only — no-op */
  }, []);

  return {
    t,
    lang,
    setLang,
    dir: LANGUAGE_DIRECTION[lang],
    langName: LANGUAGE_NAMES[lang],
    isLoading: false,
    countryCode: 'FR',
  };
}

/** Non-hook translation helper (returns the key as-is). */
export function t(key: string, params?: Record<string, string>): string {
  if (!params) return key;
  let text = key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`{${k}}`, 'g'), v);
  }
  return text;
}

export { LANGUAGE_NAMES, LANGUAGE_DIRECTION };
export type { Language };
