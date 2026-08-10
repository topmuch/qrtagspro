import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateDistance, formatDistance } from '@/lib/utils/distance';

/**
 * GET /api/pois
 * =============
 * API de Points d'Intérêt (POI) géolocalisés pour le volet touristique.
 *
 * Combine deux sources de données :
 *   1. Partenaires en base (HotelPartner) — priorité absolue, source de monétisation
 *      (commissions, codes promo, lieux vérifiés par l'hôtel)
 *   2. OpenStreetMap (Overpass API) — fallback/complément gratuit pour éviter
 *      les "pages blanches" si l'hôtel n'a pas encore de partenaires
 *
 * Query params :
 *   - lat (requis)   : latitude du point de référence (hôtel ou utilisateur)
 *   - lng (requis)   : longitude
 *   - radius (défaut 2) : rayon de recherche en km
 *   - category (optionnel) : filtre par catégorie (RESTAURANT, ATTRACTION, BEACH,
 *     SHOPPING, HEALTH, TRANSPORT, EXCURSION, ou ALL pour tout)
 *   - agencyId (optionnel) : si fourni, ne renvoie QUE les partenaires de cet hôtel
 *     (utile pour la page welcome qui veut scoper aux recommandations de l'hôtel scanné)
 *
 * Réponse :
 *   { success: true, count: number, data: POI[] }
 *   Trié par distance croissante, limité à 10 résultats.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

interface POI {
  id: string;
  name: string;
  category: string;
  description?: string;
  distance: string;
  distanceKm: number;
  rating: number;
  promoCode?: string;
  isVerified: boolean;
  source: 'DB' | 'OSM';
  mapsUrl: string;
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');
  const radius = parseFloat(searchParams.get('radius') || '2');
  const category = searchParams.get('category');
  const agencySlug = searchParams.get('slug');
  const agencyIdParam = searchParams.get('agencyId');

  // ─── Validation des coordonnées ───
  if (!lat || !lng || (lat === 0 && lng === 0)) {
    return NextResponse.json(
      { error: 'Coordonnées GPS requises (?lat=...&lng=...)' },
      { status: 400 }
    );
  }

  // ─── 🔒 SÉCURITÉ : un identifiant d'hôtel est OBLIGATOIRE ───
  // Sans slug ni agencyId, l'API refuserait de servir (évite de retourner
  // tous les partenaires de la base à n'importe qui).
  if (!agencySlug && !agencyIdParam) {
    return NextResponse.json(
      { error: 'Paramètre requis : ?slug=<hotel-slug> ou ?agencyId=<id>' },
      { status: 400 }
    );
  }

  // ─── Résolution de l'agence (par slug prioritaire, sinon par id) ───
  let agency: { id: string; name: string } | null = null;
  if (agencySlug) {
    agency = await db.agency.findUnique({
      where: { slug: agencySlug },
      select: { id: true, name: true },
    });
  } else if (agencyIdParam) {
    agency = await db.agency.findUnique({
      where: { id: agencyIdParam },
      select: { id: true, name: true },
    });
  }

  if (!agency) {
    return NextResponse.json(
      { error: 'Hôtel introuvable' },
      { status: 404 }
    );
  }

  try {
    const pois: POI[] = [];

    // ==========================================
    // 1. PARTENAIRES EN BASE (priorité absolue)
    // ==========================================
    // 🔒 Filtrage par agencyId : un hôtel ne voit QUE ses propres partenaires.
    const dbPartners = await db.hotelPartner.findMany({
      where: {
        agencyId: agency.id,
        isActive: true,
        ...(category && category !== 'ALL' ? { category } : {}),
      },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        latitude: true,
        longitude: true,
        rating: true,
        promoCode: true,
        isVerified: true,
      },
    });

    for (const partner of dbPartners) {
      const distKm = calculateDistance(lat, lng, partner.latitude, partner.longitude);

      // On ne garde que ceux dans le rayon demandé
      if (distKm <= radius) {
        pois.push({
          id: partner.id,
          name: partner.name,
          category: partner.category,
          description: partner.description || undefined,
          distance: formatDistance(distKm),
          distanceKm: distKm,
          rating: partner.rating,
          promoCode: partner.promoCode || undefined,
          isVerified: partner.isVerified,
          source: 'DB',
          mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${partner.latitude},${partner.longitude}`,
        });
      }
    }

    // ==========================================
    // 2. COMPLÉMENT OPENSTREETMAP (Overpass API)
    // ==========================================
    // On complète TOUOURS avec OSM (pas seulement si < 3 résultats).
    // Les partenaires DB restent prioritaires (tri par distance les met en premier
    // s'ils sont plus proches que les lieux OSM).
    if (pois.length < 10) {
      const osmPois = await fetchFromOverpass(lat, lng, radius, category);

      // On ajoute seulement les lieux qui ne sont pas déjà dans la DB (anti-doublon)
      for (const osmPoi of osmPois) {
        const existsInDb = pois.some(
          (p) => p.name.toLowerCase() === osmPoi.name.toLowerCase()
        );
        if (!existsInDb) {
          pois.push(osmPoi);
        }
      }
    }

    // ==========================================
    // 3. TRI PAR DISTANCE + LIMITATION
    // ==========================================
    pois.sort((a, b) => a.distanceKm - b.distanceKm);

    return NextResponse.json({
      success: true,
      agencyName: agency.name,
      count: pois.length,
      data: pois.slice(0, 10), // Max 10 résultats
    });
  } catch (error) {
    console.error('[api/pois] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ==========================================
// FONCTION SECONDAIRE : APPEL À OVERPASS API (OpenStreetMap)
// ==========================================

/**
 * Interroge l'API Overpass d'OpenStreetMap pour récupérer des POI gratuits
 * autour d'un point GPS.
 *
 * Cache Next.js : 24h (86400s) — évite les bannissements pour abus et
 * garantit une réponse < 100ms après le premier appel.
 *
 * En cas d'échec réseau (offline, timeout), retourne un tableau vide —
 * l'API principale renvoie alors seulement les partenaires DB.
 */
async function fetchFromOverpass(
  lat: number,
  lng: number,
  radius: number,
  category?: string | null
): Promise<POI[]> {
  const radiusMeters = radius * 1000;

  // Mapping de nos catégories vers les tags OpenStreetMap
  const osmQueries: Record<string, string> = {
    RESTAURANT: 'node["amenity"="restaurant"]; node["amenity"="cafe"];',
    ATTRACTION: 'node["tourism"="attraction"]; node["historic"];',
    BEACH: 'node["natural"="beach"];',
    HEALTH: 'node["amenity"="pharmacy"]; node["amenity"="hospital"]',
    SHOPPING: 'node["shop"];',
    TRANSPORT: 'node["amenity"="taxi"]; node["public_transport"]',
    EXCURSION: 'node["tourism"="attraction"];',
  };

  const queryFilter =
    category && osmQueries[category]
      ? osmQueries[category]
      : 'node["amenity"="restaurant"]; node["tourism"="attraction"]; node["natural"="beach"]; node["amenity"="pharmacy"];';

  const overpassQuery = `
    [out:json][timeout:10];
    (
      ${queryFilter}(around:${radiusMeters},${lat},${lng});
    );
    out body 50;
  `;

  try {
    // Cache natif Next.js : revalidate 24h
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
      next: { revalidate: 86400 },
    });

    if (!response.ok) return [];

    const data = await response.json();

    return (data.elements as any[])
      .filter((element) => element.lat && element.lon)
      .map((element) => {
        const distKm = calculateDistance(lat, lng, element.lat, element.lon);
        return {
          id: `osm-${element.id}`,
          name: element.tags?.name || 'Lieu non nommé',
          category: mapOsmCategory(element.tags),
          distance: formatDistance(distKm),
          distanceKm: distKm,
          rating: 4.0, // Note par défaut pour OSM (pas de système de note natif)
          isVerified: false,
          source: 'OSM' as const,
          mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${element.lat},${element.lon}`,
        };
      });
  } catch (error) {
    // Fallback gracieux : si Overpass échoue (offline, timeout), on retourne []
    // L'API principale se contente des partenaires DB.
    console.warn('[api/pois] Overpass API échoué:', error);
    return [];
  }
}

/**
 * Mappe les tags OSM vers nos catégories normalisées.
 */
function mapOsmCategory(tags: any): string {
  if (tags?.amenity === 'restaurant' || tags?.amenity === 'cafe') return 'RESTAURANT';
  if (tags?.tourism === 'attraction' || tags?.historic) return 'ATTRACTION';
  if (tags?.natural === 'beach') return 'BEACH';
  if (tags?.amenity === 'pharmacy' || tags?.amenity === 'hospital') return 'HEALTH';
  if (tags?.shop) return 'SHOPPING';
  if (tags?.amenity === 'taxi' || tags?.public_transport) return 'TRANSPORT';
  return 'OTHER';
}
