/**
 * QRTagsPro — PMS Integration Module
 *
 * Types & interfaces communs pour l'intégration PMS (Property Management System).
 *
 * Pattern Strategy: chaque provider (Cloudbeds, Mews, Sirvoy...) implémente
 * l'interface PMSProvider. Le service unifié (pmsService.ts) instancie
 * dynamiquement le bon provider selon la config de l'agence.
 *
 * Architecture:
 *   lib/pms/
 *   ├── types.ts                    ← Interface commune + types (CE FICHIER)
 *   ├── pmsService.ts               ← Router (Étape 3 — à venir)
 *   └── providers/
 *       ├── cloudbeds.ts            ← Provider Cloudbeds (Étape 2)
 *       ├── mews.ts                 ← Provider Mews (à venir)
 *       └── sirvoy.ts               ← Provider Sirvoy (à venir)
 */

// ═══════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════

/**
 * Providers PMS supportés.
 * "NONE" = aucune intégration PMS (workflow manuel).
 */
export type PMSProviderType = 'CLOUDBEDS' | 'MEWS' | 'SIRVOY' | 'NONE';

/**
 * Configuration PMS stockée dans Agency.pmsApiKeys (JSON chiffré en prod).
 * Chaque provider a ses propres clés — on garde un type union pour la sécurité.
 */
export interface PMSConfig {
  provider: PMSProviderType;
  apiKey: string;
  propertyId: string;
  /** URL de base de l'API (sandbox ou production) */
  baseUrl?: string;
  /** Token OAuth (si applicable — rafraîchi automatiquement) */
  accessToken?: string;
  /** Date d'expiration du token (ISO) */
  tokenExpiresAt?: string;
}

// ═══════════════════════════════════════════════════════════════════
// TYPES MÉTIER (DTOs)
// ═══════════════════════════════════════════════════════════════════

/**
 * Réservation PMS (retournée par getReservation).
 */
export interface PMSReservation {
  reservationId: string;
  status: PMSReservationStatus;
  guest: PMSGuest;
  room?: PMSRoom | null;
  checkIn: string;   // ISO date
  checkOut: string;  // ISO date
  source?: string;   // Ex: "Booking.com", "Direct"
  createdAt?: string;
  updatedAt?: string;
}

export type PMSReservationStatus =
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'NO_SHOW';

/**
 * Client/invité PMS.
 */
export interface PMSGuest {
  guestId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  language?: string | null;
}

/**
 * Chambre PMS.
 */
export interface PMSRoom {
  roomId: string;
  roomNumber: string;
  roomType?: string;   // Ex: "Standard", "Deluxe"
  floor?: number | null;
}

// ═══════════════════════════════════════════════════════════════════
// WEBHOOKS
// ═══════════════════════════════════════════════════════════════════

/**
 * Événement webhook reçu du PMS.
 * Le service unifié mappe ces événements vers des actions QRTagsPro:
 *   - reservation.checked_in  → activer le Tag (check-in QRTagsPro)
 *   - reservation.checked_out → désactiver le Tag (check-out QRTagsPro)
 */
export interface PMSWebhookEvent {
  /** Nom de l'événement (ex: "reservation.checked_in") */
  event: PMSWebhookEventType;
  /** ID de la réservation dans le PMS */
  reservationId: string;
  /** ID de la propriété (hôtel) dans le PMS */
  propertyId: string;
  /** Données complètes de la réservation (si disponibles) */
  reservation?: PMSReservation;
  /** Timestamp de l'événement (ISO) */
  timestamp: string;
  /** Signature brute pour vérification (HMAC, etc.) */
  rawSignature?: string;
}

export type PMSWebhookEventType =
  | 'reservation.created'
  | 'reservation.checked_in'
  | 'reservation.checked_out'
  | 'reservation.modified'
  | 'reservation.cancelled';

// ═══════════════════════════════════════════════════════════════════
// INTERFACE COMMUNE (Pattern Strategy)
// ═══════════════════════════════════════════════════════════════════

/**
 * Interface que TOUS les providers PMS doivent implémenter.
 *
 * Le service unifié (pmsService.ts) appelle ces méthodes sans connaître
 * le provider concret — il suffit d'implémenter cette interface.
 */
export interface PMSProvider {
  /** Identifiant du provider (ex: "CLOUDBEDS") */
  readonly providerName: PMSProviderType;

  /**
   * Authentifier auprès de l'API PMS et récupérer un token.
   * @returns Le token d'accès (Bearer Token)
   * @throws PMSAuthError si l'authentification échoue
   */
  authenticate(): Promise<string>;

  /**
   * Récupérer une réservation par son ID.
   * @param reservationId — ID de la réservation dans le PMS
   * @returns Les détails de la réservation (client, chambre, dates)
   * @throws PMSApiError si la réservation n'existe pas ou l'API échoue
   */
  getReservation(reservationId: string): Promise<PMSReservation>;

  /**
   * Récupérer le client occupant une chambre à une date donnée.
   * Utilisé pour le check-in QRTagsPro: l'hôtel saisit le n° de chambre,
   * on interroge le PMS pour récupérer automatiquement le nom du client.
   *
   * @param roomNumber — N° de chambre (ex: "402")
   * @param date — Date ISO (par défaut: aujourd'hui)
   * @returns Le client + la réservation, ou null si la chambre est vide
   * @throws PMSApiError si l'API échoue
   */
  getGuestByRoom(roomNumber: string, date?: string): Promise<PMSGuest | null>;

  /**
   * Parser le payload d'un webhook reçu du PMS.
   * Chaque PMS a un format de webhook différent — cette méthode normalise
   * le payload en PMSWebhookEvent.
   *
   * @param event — Nom de l'événement (ex: "reservation.checked_in")
   * @param rawBody — Body brut reçu (objet JSON décodé)
   * @returns L'événement normalisé
   * @throws PMSWebhookError si le payload est invalide
   */
  getWebhookPayload(event: string, rawBody: unknown): Promise<PMSWebhookEvent>;

  /**
   * Vérifier la signature d'un webhook (sécurité).
   * @param rawBody — Body brut (string)
   * @param signature — Signature reçue dans le header
   * @returns true si la signature est valide
   */
  verifyWebhookSignature?(rawBody: string, signature: string): Promise<boolean>;

  /**
   * Tester la connexion à l'API (bouton "Tester la connexion" dans le dashboard).
   * @returns Un message de succès ou lance une erreur
   */
  testConnection(): Promise<{ success: boolean; message: string }>;
}

// ═══════════════════════════════════════════════════════════════════
// ERREURS PERSONNALISÉES
// ═══════════════════════════════════════════════════════════════════

/**
 * Erreur d'authentification PMS (clé API invalide, token expiré).
 */
export class PMSAuthError extends Error {
  constructor(
    message: string,
    public readonly provider: PMSProviderType,
    public readonly statusCode?: number,
  ) {
    super(`[${provider}] Auth Error: ${message}`);
    this.name = 'PMSAuthError';
  }
}

/**
 * Erreur d'API PMS (réservation introuvable, chambre vide, etc.).
 */
export class PMSApiError extends Error {
  constructor(
    message: string,
    public readonly provider: PMSProviderType,
    public readonly endpoint?: string,
    public readonly statusCode?: number,
  ) {
    super(`[${provider}] API Error: ${message}`);
    this.name = 'PMSApiError';
  }
}

/**
 * Erreur de webhook PMS (payload invalide, signature incorrecte).
 */
export class PMSWebhookError extends Error {
  constructor(
    message: string,
    public readonly provider: PMSProviderType,
  ) {
    super(`[${provider}] Webhook Error: ${message}`);
    this.name = 'PMSWebhookError';
  }
}

/**
 * Erreur de configuration PMS (provider non configuré, clés manquantes).
 */
export class PMSConfigError extends Error {
  constructor(
    message: string,
    public readonly agencyId: string,
  ) {
    super(`[Agency ${agencyId}] PMS Config Error: ${message}`);
    this.name = 'PMSConfigError';
  }
}
