/**
 * QRTagsPro — Provider Cloudbeds (PMS Integration)
 *
 * Implémentation de l'interface PMSProvider pour Cloudbeds.
 * Utilise l'API Cloudbeds PMS v1.3 (Sandbox + Production).
 *
 * Docs API: https://api.cloudbeds.com/pms/1.3/
 *
 * Sandbox Base URL: https://api.cloudbeds.com/pms/1.3/
 * Production Base URL: https://api.cloudbeds.com/pms/1.3/
 *
 * Authentification: Bearer Token (API Key)
 *
 * Sécurité:
 *   - Les clés API ne sont JAMAIS loggées en clair
 *   - Toutes les erreurs sont catchées avec logs explicites
 *   - Les timeouts sont configurés (8s par défaut)
 */

import {
  PMSProvider,
  PMSProviderType,
  PMSConfig,
  PMSReservation,
  PMSReservationStatus,
  PMSGuest,
  PMSRoom,
  PMSWebhookEvent,
  PMSAuthError,
  PMSApiError,
  PMSWebhookError,
} from '../types';

// ═══════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════

const CLOUDBEDS_SANDBOX_URL = 'https://api.cloudbeds.com/pms/1.3/';
const CLOUDBEDS_PRODUCTION_URL = 'https://api.cloudbeds.com/pms/1.3/';
const DEFAULT_TIMEOUT_MS = 8000;

// Mapping des statuts Cloudbeds → PMSReservationStatus
const CLOUDBEDS_STATUS_MAP: Record<string, PMSReservationStatus> = {
  confirmed: 'CONFIRMED',
  checked_in: 'CHECKED_IN',
  in_house: 'CHECKED_IN',
  checked_out: 'CHECKED_OUT',
  cancelled: 'CANCELLED',
  canceled: 'CANCELLED',
  no_show: 'NO_SHOW',
};

// ═══════════════════════════════════════════════════════════════════
// TYPES INTERNE (réponses API Cloudbeds)
// ═══════════════════════════════════════════════════════════════════

interface CloudbedsReservationResponse {
  success: boolean;
  data?: {
    id: string;
    status: string;
    guestName?: string;
    firstName?: string;
    lastName?: string;
    guestEmail?: string;
    guestPhone?: string;
    room?: string;
    roomType?: string;
    dateArrival?: string;
    dateDeparture?: string;
    source?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  message?: string;
  error?: string;
}

interface CloudbedsGuestResponse {
  success: boolean;
  data?: {
    guestId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    country?: string;
    language?: string;
    reservations?: Array<{
      id: string;
      status: string;
      room?: string;
      dateArrival?: string;
      dateDeparture?: string;
    }>;
  };
  message?: string;
}

interface CloudbedsTestResponse {
  success: boolean;
  data?: {
    propertyId?: string;
    propertyName?: string;
  };
  message?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════
// PROVIDER CLOUDBEDS
// ═══════════════════════════════════════════════════════════════════

export class CloudbedsProvider implements PMSProvider {
  readonly providerName: PMSProviderType = 'CLOUDBEDS';

  private readonly config: PMSConfig;
  private readonly baseUrl: string;
  private cachedToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: PMSConfig) {
    if (!config.apiKey) {
      throw new PMSAuthError('Clé API manquante', 'CLOUDBEDS');
    }
    if (!config.propertyId) {
      throw new PMSAuthError('Property ID manquant', 'CLOUDBEDS');
    }

    this.config = config;
    // Utiliser l'URL configurée, sinon détecter sandbox vs production
    this.baseUrl = config.baseUrl || CLOUDBEDS_SANDBOX_URL;
  }

  // ─── Authentification ────────────────────────────────────────────

  async authenticate(): Promise<string> {
    // Si on a un token en cache encore valide, le retourner
    if (this.cachedToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.cachedToken;
    }

    // Cloudbeds utilise directement l'API Key comme Bearer Token
    // (pas de flux OAuth2 pour l'API Key — simplifié pour la sandbox)
    // En production avec OAuth2, on ferait un POST /oauth/token ici.

    // Pour l'API Key, le "token" = l'API Key elle-même
    // On le met en cache avec une expiration de 1h (sécurité)
    this.cachedToken = this.config.apiKey;
    this.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // +1h

    return this.config.apiKey;
  }

  // ─── Récupérer une réservation ───────────────────────────────────

  async getReservation(reservationId: string): Promise<PMSReservation> {
    const token = await this.authenticate();

    try {
      const url = `${this.baseUrl}getReservation?reservationId=${encodeURIComponent(reservationId)}`;
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.getHeaders(token),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'N/A');
        console.error('[Cloudbeds] getReservation failed:', response.status, errorBody);
        throw new PMSApiError(
          `Réservation ${reservationId} introuvable (${response.status})`,
          'CLOUDBEDS',
          'getReservation',
          response.status,
        );
      }

      const body: CloudbedsReservationResponse = await response.json();

      if (!body.success || !body.data) {
        throw new PMSApiError(
          body.message || body.error || 'Réponse invalide',
          'CLOUDBEDS',
          'getReservation',
        );
      }

      const d = body.data;
      return this.mapReservation(d, reservationId);
    } catch (error) {
      if (error instanceof PMSApiError) throw error;
      console.error('[Cloudbeds] getReservation error:', error);
      throw new PMSApiError(
        `Erreur réseau: ${error instanceof Error ? error.message : 'Unknown'}`,
        'CLOUDBEDS',
        'getReservation',
      );
    }
  }

  // ─── Récupérer le client par n° de chambre ──────────────────────

  async getGuestByRoom(roomNumber: string, date?: string): Promise<PMSGuest | null> {
    const token = await this.authenticate();
    const searchDate = date || new Date().toISOString().slice(0, 10); // yyyy-mm-dd

    try {
      // Cloudbeds: GET /getGuestsInHouse pour récupérer les clients actuellement présents
      // On filtre ensuite par roomNumber côté client (l'API ne supporte pas le filtre direct)
      const url = `${this.baseUrl}getGuestsInHouse?propertyId=${encodeURIComponent(this.config.propertyId)}`;
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.getHeaders(token),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'N/A');
        console.error('[Cloudbeds] getGuestByRoom failed:', response.status, errorBody);
        throw new PMSApiError(
          `Erreur API (${response.status})`,
          'CLOUDBEDS',
          'getGuestsInHouse',
          response.status,
        );
      }

      const body: CloudbedsGuestResponse = await response.json();

      if (!body.success || !body.data) {
        return null;
      }

      // Chercher une réservation avec la chambre correspondante
      const reservation = body.data.reservations?.find(
        (r) => r.room === roomNumber,
      );

      if (!reservation) {
        return null; // Chambre vide ou pas de réservation pour cette chambre
      }

      return {
        guestId: body.data.guestId || reservation.id,
        firstName: body.data.firstName || '',
        lastName: body.data.lastName || '',
        email: body.data.email || null,
        phone: body.data.phone || null,
        country: body.data.country || null,
        language: body.data.language || null,
      };
    } catch (error) {
      if (error instanceof PMSApiError) throw error;
      console.error('[Cloudbeds] getGuestByRoom error:', error);
      throw new PMSApiError(
        `Erreur réseau: ${error instanceof Error ? error.message : 'Unknown'}`,
        'CLOUDBEDS',
        'getGuestsInHouse',
      );
    }
  }

  // ─── Webhook ────────────────────────────────────────────────────

  async getWebhookPayload(event: string, rawBody: unknown): Promise<PMSWebhookEvent> {
    try {
      // Cloudbeds envoie les webhooks avec un format spécifique
      // Format: { event, data: { reservationId, propertyId, ... } }
      const body = rawBody as Record<string, unknown>;

      if (!body || typeof body !== 'object') {
        throw new PMSWebhookError('Payload invalide (pas un objet JSON)', 'CLOUDBEDS');
      }

      const data = (body.data || body) as Record<string, unknown>;
      const reservationId = String(data.reservationId || data.reservation_id || '');
      const propertyId = String(data.propertyId || data.property_id || this.config.propertyId);

      if (!reservationId) {
        throw new PMSWebhookError('reservationId manquant dans le payload', 'CLOUDBEDS');
      }

      return {
        event: event as PMSWebhookEvent['event'],
        reservationId,
        propertyId,
        timestamp: new Date().toISOString(),
        rawSignature: body.signature as string | undefined,
      };
    } catch (error) {
      if (error instanceof PMSWebhookError) throw error;
      throw new PMSWebhookError(
        `Erreur parsing webhook: ${error instanceof Error ? error.message : 'Unknown'}`,
        'CLOUDBEDS',
      );
    }
  }

  // ─── Vérification signature webhook ─────────────────────────────

  async verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean> {
    // Cloudbeds utilise HMAC-SHA256 avec un secret partagé
    // En production, on utiliserait crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    // Pour la sandbox, on accepte toutes les signatures (à adapter en prod)
    if (!signature) return false;
    return true; // TODO: implémenter la vérification HMAC en production
  }

  // ─── Test de connexion ──────────────────────────────────────────

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const token = await this.authenticate();

    try {
      const url = `${this.baseUrl}getProperty?propertyId=${encodeURIComponent(this.config.propertyId)}`;
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.getHeaders(token),
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Erreur ${response.status}: ${response.statusText}`,
        };
      }

      const body: CloudbedsTestResponse = await response.json();

      if (body.success && body.data) {
        return {
          success: true,
          message: `✅ Connecté à Cloudbeds — Propriété: ${body.data.propertyName || this.config.propertyId}`,
        };
      }

      return {
        success: false,
        message: body.message || body.error || 'Réponse invalide',
      };
    } catch (error) {
      console.error('[Cloudbeds] testConnection error:', error);
      return {
        success: false,
        message: `Erreur de connexion: ${error instanceof Error ? error.message : 'Unknown'}`,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS PRIVÉS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Headers HTTP avec authentification Bearer.
   * ⚠️ Ne JAMAIS logger le token en clair.
   */
  private getHeaders(token: string): HeadersInit {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'QRTagsPro-PMS/1.0',
    };
  }

  /**
   * Fetch avec timeout configurable.
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Mapper une réponse Cloudbeds vers PMSReservation.
   */
  private mapReservation(
    d: NonNullable<CloudbedsReservationResponse['data']>,
    reservationId: string,
  ): PMSReservation {
    // Extraire le prénom et le nom du guestName si firstName/lastName absents
    const fullName = d.guestName || `${d.firstName || ''} ${d.lastName || ''}`.trim();
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ');

    const room: PMSRoom | null = d.room
      ? {
          roomId: d.room,
          roomNumber: d.room,
          roomType: d.roomType || undefined,
        }
      : null;

    const status = CLOUDBEDS_STATUS_MAP[d.status?.toLowerCase()] || 'CONFIRMED';

    return {
      reservationId,
      status,
      guest: {
        guestId: reservationId, // Cloudbeds n'expose pas toujours le guestId séparément
        firstName: d.firstName || firstName || '',
        lastName: d.lastName || lastName || '',
        email: d.guestEmail || null,
        phone: d.guestPhone || null,
      },
      room,
      checkIn: d.dateArrival || new Date().toISOString(),
      checkOut: d.dateDeparture || new Date().toISOString(),
      source: d.source,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// FACTORY (utilisé par pmsService.ts — Étape 3)
// ═══════════════════════════════════════════════════════════════════

/**
 * Créer une instance du provider Cloudbeds.
 * @throws PMSAuthError si la config est invalide
 */
export function createCloudbedsProvider(config: PMSConfig): CloudbedsProvider {
  return new CloudbedsProvider(config);
}
