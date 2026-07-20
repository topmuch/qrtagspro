'use client';

/**
 * CountryRegionSelect
 * Sélecteur de pays groupé par région/continent.
 * Composant contrôlé (value + onChange).
 *
 * Design : fond blanc, texte noir, bordure noire — pensé pour s'intégrer
 * sur un conteneur jaune moutarde (#c5a643) avec bordures pointillées noires.
 */

import { COUNTRY_REGIONS, type CountryOption } from '@/lib/country-data';

// Re-export for backward compatibility (other files may import from here)
export type { CountryOption };
export { COUNTRY_REGIONS };

interface CountryRegionSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  'aria-label'?: string;
}

export default function CountryRegionSelect({
  value,
  onChange,
  placeholder = 'Sélectionnez votre destination',
  required = false,
  id,
  'aria-label': ariaLabel,
}: CountryRegionSelectProps) {
  return (
    <select
      id={id}
      aria-label={ariaLabel || 'Destination'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full bg-white border-2 border-black text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black rounded-lg px-3 py-2.5 text-base min-h-[48px] appearance-none cursor-pointer"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: '36px',
      }}
    >
      <option value="" disabled={required}>
        {placeholder}
      </option>
      {COUNTRY_REGIONS.map((region) => (
        <optgroup key={region.region} label={region.region}>
          {region.countries.map((country) => (
            <option key={`${region.region}-${country.code}`} value={country.name}>
              {country.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
