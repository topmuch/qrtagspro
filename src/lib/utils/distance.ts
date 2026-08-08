/**
 * Utilitaires de géolocalisation — Volet Touristique
 * ===================================================
 * Calcul de distance entre deux points GPS (formule de Haversine) et
 * formatage pour l'affichage.
 *
 * Utilisé par :
 *   - L'API /api/pois (tri des partenaires par distance)
 *   - Les composants frontend (NearbyAttractions, etc.)
 */

/**
 * Calcule la distance entre deux points GPS en kilomètres.
 * Utilise la formule de Haversine (distance orthodromique sur une sphère).
 *
 * @param lat1 Latitude du point 1 (degrés décimaux)
 * @param lon1 Longitude du point 1
 * @param lat2 Latitude du point 2
 * @param lon2 Longitude du point 2
 * @returns Distance en kilomètres
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon moyen de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convertit des degrés en radians.
 */
function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Formate une distance en km pour l'affichage mobile.
 * - < 1 km → mètres (ex: "450 m")
 * - >= 1 km → km avec 1 décimale (ex: "1.2 km")
 *
 * @param km Distance en kilomètres
 * @returns Chaîne formatée
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}
