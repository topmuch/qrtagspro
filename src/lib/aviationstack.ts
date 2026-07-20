/**
 * LABS — Feature #5: AviationStack API helper
 *
 * Documentation: https://aviationstack.com/documentation
 *
 * Tiers:
 *  - Free: 100 requests/month (suffisant pour tests)
 *  - $49/mois: 10,000 requests/month (production)
 *
 * Pour activer l'intégration automatique:
 *  1. Créer un compte sur https://aviationstack.com
 *  2. Récupérer l'access_key dans le dashboard
 *  3. Ajouter dans .env.local:
 *     AVIATIONSTACK_API_KEY=your_access_key_here
 *     AVIATIONSTACK_BASE_URL=http://api.aviationstack.com/v1
 *
 * Le cron /api/cron/check-connections (à créer) utilisera ce helper
 * pour détecter automatiquement les retards de vol.
 */

const API_KEY = process.env.AVIATIONSTACK_API_KEY;
const BASE_URL = process.env.AVIATIONSTACK_BASE_URL || 'http://api.aviationstack.com/v1';

export interface FlightStatus {
  flightNumber: string;
  airline: string | null;
  status: string | null; // "scheduled", "active", "landed", "cancelled", "diverted", "delayed"
  departure: {
    airport: string | null;
    scheduledTime: string | null;
    estimatedTime: string | null;
    actualTime: string | null;
    delay: number | null; // minutes
    gate: string | null;
    terminal: string | null;
  };
  arrival: {
    airport: string | null;
    scheduledTime: string | null;
    estimatedTime: string | null;
    actualTime: string | null;
    delay: number | null; // minutes
    gate: string | null;
    terminal: string | null;
    baggageBelt: string | null;
  };
}

export function isAviationStackConfigured(): boolean {
  return !!API_KEY;
}

/**
 * Récupère le statut temps réel d'un vol via AviationStack.
 *
 * @param flightIata Code IATA du vol (ex: "AF1234", "BA456")
 * @returns FlightStatus ou null si non trouvé / erreur / API non configurée
 */
export async function getFlightStatus(flightIata: string): Promise<FlightStatus | null> {
  if (!API_KEY) {
    console.warn('[aviationstack] API key not configured — set AVIATIONSTACK_API_KEY in .env.local');
    return null;
  }

  try {
    const url = `${BASE_URL}/flights?access_key=${API_KEY}&flight_iata=${encodeURIComponent(flightIata)}`;
    const response = await fetch(url, {
      method: 'GET',
      // 10 secondes max pour ne pas bloquer le cron
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`[aviationstack] HTTP ${response.status} for ${flightIata}`);
      return null;
    }

    const data = await response.json();

    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      console.warn(`[aviationstack] No flight found for IATA ${flightIata}`);
      return null;
    }

    const flight = data.data[0];

    return {
      flightNumber: flightIata,
      airline: flight.airline?.name || null,
      status: flight.flight_status || null,
      departure: {
        airport: flight.departure?.airport || null,
        scheduledTime: flight.departure?.scheduled || null,
        estimatedTime: flight.departure?.estimated || null,
        actualTime: flight.departure?.actual || null,
        delay: typeof flight.departure?.delay === 'number' ? flight.departure.delay : null,
        gate: flight.departure?.gate || null,
        terminal: flight.departure?.terminal || null,
      },
      arrival: {
        airport: flight.arrival?.airport || null,
        scheduledTime: flight.arrival?.scheduled || null,
        estimatedTime: flight.arrival?.estimated || null,
        actualTime: flight.arrival?.actual || null,
        delay: typeof flight.arrival?.delay === 'number' ? flight.arrival.delay : null,
        gate: flight.arrival?.gate || null,
        terminal: flight.arrival?.terminal || null,
        baggageBelt: flight.arrival?.baggage || null,
      },
    };
  } catch (error) {
    console.error(`[aviationstack] Error fetching ${flightIata}:`, error);
    return null;
  }
}

/**
 * Détermine si une correspondance est risquée/manquée à partir des données de vol.
 *
 * @param firstFlightDelay Retard du premier vol en minutes
 * @param connectionTimeMinutes Temps de correspondance prévu en minutes
 * @param minConnectionTime Temps minimum de correspondance (défaut: 45 min)
 * @returns 'ok' | 'at_risk' | 'missed'
 */
export function evaluateConnection(
  firstFlightDelay: number,
  connectionTimeMinutes: number,
  minConnectionTime: number = 45
): 'ok' | 'at_risk' | 'missed' {
  const effectiveConnectionTime = connectionTimeMinutes - firstFlightDelay;

  if (effectiveConnectionTime <= 0) {
    return 'missed'; // retard ≥ temps de correspondance → impossible
  }
  if (effectiveConnectionTime < minConnectionTime) {
    return 'at_risk'; // retard critique → correspondance très serrée
  }
  return 'ok';
}

/**
 * Liste tous les bagages actifs qui ont un numéro de vol + correspondance enregistrés.
 * Utilisé par le cron pour savoir quels bagages vérifier automatiquement.
 */
export async function getBaggagesWithConnectingFlight(): Promise<Array<{
  id: string;
  reference: string;
  flightNumber: string;
  connectingFlight: string;
  travelerFirstName: string | null;
  travelerLastName: string | null;
}>> {
  const { db } = await import('@/lib/db');
  const baggages = await db.baggage.findMany({
    where: {
      status: { in: ['active', 'scanned'] },
      flightNumber: { not: null },
      connectingFlight: { not: null },
    },
    select: {
      id: true,
      reference: true,
      flightNumber: true,
      connectingFlight: true,
      travelerFirstName: true,
      travelerLastName: true,
    },
  });
  // Coerce nulls to string for type compat with callers expecting non-null flightNumber
  return baggages.map((b) => ({
    ...b,
    flightNumber: b.flightNumber || '',
    connectingFlight: b.connectingFlight || '',
  }));
}
