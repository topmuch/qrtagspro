import { NextRequest, NextResponse } from 'next/server';
import { getEmergencyContacts, getAllSupportedCountries } from '@/lib/emergency-contacts';

// ─── LABS — Feature F: API pour récupérer les contacts d'urgence par pays ───
//
// GET /api/emergency-contacts?country=SN
//   → renvoie les contacts d'urgence du Sénégal
//
// GET /api/emergency-contacts
//   → renvoie la liste de tous les pays supportés

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  if (country) {
    const contacts = getEmergencyContacts(country);
    if (!contacts) {
      return NextResponse.json(
        {
          error: 'Pays non répertorié',
          country: country.toUpperCase(),
          supportedCountries: getAllSupportedCountries().map((c) => c.countryCode),
        },
        { status: 404 }
      );
    }
    return NextResponse.json({ contacts });
  }

  // Pas de paramètre country → liste tous les pays
  return NextResponse.json({
    countries: getAllSupportedCountries(),
    total: getAllSupportedCountries().length,
  });
}
