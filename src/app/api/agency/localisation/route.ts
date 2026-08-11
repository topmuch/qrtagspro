import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function getAgencyId(): Promise<string | null> {
  try {
    const { getSession } = await import('@/lib/session');
    const user = await getSession();
    if (!user || user.role !== 'agency' || !user.agencyId) return null;
    return user.agencyId;
  } catch { return null; }
}

// GET — retourne les infos contact + localisation
export async function GET() {
  const agencyId = await getAgencyId();
  if (!agencyId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const agency = await db.agency.findUnique({
    where: { id: agencyId },
    select: {
      name: true, address: true,
      latitude: true, longitude: true,
      phone: true, contactPhone: true,
      // Pas de champ country dans le schéma actuel — on le déduit de l'adresse
    },
  });

  if (!agency) return NextResponse.json({ error: 'Agence introuvable' }, { status: 404 });

  return NextResponse.json({ success: true, agency });
}

// PATCH — met à jour adresse + tel + lat/lng
export async function PATCH(req: NextRequest) {
  const agencyId = await getAgencyId();
  if (!agencyId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json();
  const { address, latitude, longitude, phone, contactPhone } = body;

  const updated = await db.agency.update({
    where: { id: agencyId },
    data: {
      ...(address !== undefined && { address }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(phone !== undefined && { phone }),
      ...(contactPhone !== undefined && { contactPhone }),
    },
  });

  return NextResponse.json({ success: true, agency: updated });
}

// POST — géocode une adresse via OpenStreetMap Nominatim (gratuit, pas de clé API)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { address } = body;
  if (!address?.trim()) return NextResponse.json({ error: 'Adresse requise' }, { status: 400 });

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'QRTagsPro/1.0 (contact@qrtags.pro)',
      },
    });
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Adresse introuvable' }, { status: 404 });
    }
    const result = data[0];
    return NextResponse.json({
      success: true,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      country: result.address?.country || '',
      countryCode: result.address?.country_code?.toUpperCase() || '',
    });
  } catch (e) {
    console.error('[geocode] Error:', e);
    return NextResponse.json({ error: 'Erreur de géocodage' }, { status: 500 });
  }
}
