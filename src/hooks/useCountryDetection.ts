'use client';

import { useState, useEffect } from 'react';

/**
 * QRTagsPro — Hook de détection du pays via IP
 *
 * Détecte le pays du visiteur via /api/detect-country et retourne:
 *   - dialCode: l'indicatif téléphonique (ex: "+221", "+33", "+1")
 *   - countryCode: le code ISO (ex: "SN", "FR", "US")
 *   - country: le nom du pays
 *
 * Le trouveur n'a plus qu'à taper son numéro local sans l'indicatif.
 */

// Mapping codes ISO → indicatif téléphonique
const COUNTRY_DIAL_CODES: Record<string, string> = {
  SN: '+221', FR: '+33', US: '+1', GB: '+44', DE: '+49',
  ES: '+34', IT: '+39', BE: '+32', CH: '+41', PT: '+351',
  MA: '+212', DZ: '+213', TN: '+216', CI: '+225', ML: '+223',
  BF: '+226', NE: '+227', TG: '+228', BJ: '+229', CG: '+242',
  CD: '+243', CM: '+237', GA: '+241', GN: '+224', MR: '+222',
  CA: '+1', AU: '+61', JP: '+81', CN: '+86', IN: '+91',
  BR: '+55', MX: '+52', NL: '+31', SE: '+46', NO: '+47',
  DK: '+45', FI: '+358', AT: '+43', IE: '+353', LU: '+352',
  GR: '+30', PL: '+48', CZ: '+420', RO: '+40', TR: '+90',
  RU: '+7', ZA: '+27', NG: '+234', KE: '+254', EG: '+20',
  SA: '+966', AE: '+971', QA: '+974', KW: '+965', BH: '+973',
  LB: '+961', JO: '+962', IL: '+972', IR: '+98', IQ: '+964',
  TH: '+66', VN: '+84', ID: '+62', MY: '+60', SG: '+65',
  PH: '+63', KR: '+82', HK: '+852', TW: '+886', NZ: '+64',
  AR: '+54', CL: '+56', CO: '+57', PE: '+51', VE: '+58',
  EC: '+593', BO: '+591', PY: '+595', UY: '+598', CR: '+506',
  PA: '+507', DO: '+809', GT: '+502', HN: '+504', SV: '+503',
  NI: '+505', CU: '+53', HT: '+509', JM: '+876', TT: '+868',
};

export interface CountryInfo {
  dialCode: string;
  countryCode: string;
  country: string;
  loading: boolean;
}

export function useCountryDetection(): CountryInfo {
  const [dialCode, setDialCode] = useState('+33'); // défaut France
  const [countryCode, setCountryCode] = useState('FR');
  const [country, setCountry] = useState('France');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch('/api/detect-country', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();

        if (!mounted) return;

        const cc = (data.countryCode || 'FR').toUpperCase();
        const dc = COUNTRY_DIAL_CODES[cc] || '+33';

        setDialCode(dc);
        setCountryCode(cc);
        setCountry(data.country || cc);
      } catch {
        // silent fallback → France
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  return { dialCode, countryCode, country, loading };
}

/**
 * Formate un numéro de téléphone avec l'indicatif détecté.
 * Si l'utilisateur a déjà tapé "+", on garde tel quel.
 * Sinon, on prépend l'indicatif.
 */
export function formatPhoneWithDialCode(phone: string, dialCode: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.startsWith('00')) return '+' + trimmed.slice(2);
  // Retirer le 0 initial (convention française/africaine)
  const local = trimmed.replace(/^0+/, '');
  return `${dialCode}${local}`;
}
