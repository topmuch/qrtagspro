/**
 * QRTagsPro — PMS Service Unifié (Router)
 *
 * Reçoit un agencyId, regarde quel pmsProvider est configuré en DB,
 * instancie dynamiquement le bon provider (Cloudbeds, Mews, etc.)
 * et appelle la méthode demandée.
 *
 * Architecture:
 *   lib/pms/
 *   ├── types.ts                ← Interface commune
 *   ├── pmsService.ts           ← CE FICHIER (Router)
 *   └── providers/
 *       ├── cloudbeds.ts        ← Provider Cloudbeds
 *       └── mews.ts             ← (à venir)
 */

import { db } from '@/lib/db';
import {
  PMSProvider,
  PMSProviderType,
  PMSConfig,
  PMSReservation,
  PMSGuest,
  PMSWebhookEvent,
  PMSConfigError,
  PMSAuthError,
} from './types';
import { CloudbedsProvider, createCloudbedsProvider } from './providers/cloudbeds';

// ═══════════════════════════════════════════════════════════════════
// CACHE (évite de relire la DB à chaque appel)
// ═══════════════════════════════════════════════════════════════════

interface CachedProvider {
  provider: PMSProvider;
  config: PMSConfig;
  cachedAt: number;
}

const providerCache = new Map<string, CachedProvider>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ═══════════════════════════════════════════════════════════════════
// FACTORY — instancie le bon provider selon le type
// ═══════════════════════════════════════════════════════════════════

function createProvider(providerType: PMSProviderType, config: PMSConfig): PMSProvider {
  switch (providerType) {
    case 'CLOUDBEDS':
      return createCloudbedsProvider(config);

    case 'MEWS':
      // TODO: créer providers/mews.ts
      throw new PMSConfigError(
        'Provider MEWS non encore implémenté',
        config.propertyId,
      );

    case 'SIRVOY':
      // TODO: créer providers/sirvoy.ts
      throw new PMSConfigError(
        'Provider SIRVOY non encore implémenté',
        config.propertyId,
      );

    case 'NONE':
      throw new PMSConfigError(
        'Aucun PMS configuré pour cette agence',
        config.propertyId,
      );

    default:
      throw new PMSConfigError(
        `Provider PMS inconnu: ${providerType}`,
        config.propertyId,
      );
  }
}

// ═══════════════════════════════════════════════════════════════════
// SERVICE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

/**
 * Récupère le provider PMS configuré pour une agence.
 * Utilise un cache de 5 min pour éviter les requêtes DB répétées.
 *
 * @param agencyId — ID de l'agence
 * @returns Le provider PMS instancié
 * @throws PMSConfigError si le PMS n'est pas configuré
 */
export async function getPMSProvider(agencyId: string): Promise<PMSProvider> {
  // Vérifier le cache
  const cached = providerCache.get(agencyId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.provider;
  }

  // Lire la config en DB
  const agency = await db.agency.findUnique({
    where: { id: agencyId },
    select: {
      pmsProvider: true,
      pmsApiKeys: true,
      pmsPropertyId: true,
    },
  });

  if (!agency) {
    throw new PMSConfigError('Agence introuvable', agencyId);
  }

  if (!agency.pmsProvider || agency.pmsProvider === 'NONE') {
    throw new PMSConfigError(
      'Aucun PMS configuré. Configurez-le dans Paramètres → Intégration PMS.',
      agencyId,
    );
  }

  // Parser pmsApiKeys (JSON string)
  let configData: { apiKey?: string; baseUrl?: string } = {};
  if (agency.pmsApiKeys) {
    try {
      configData = JSON.parse(agency.pmsApiKeys);
    } catch {
      throw new PMSConfigError(
        'Configuration PMS corrompue (JSON invalide)',
        agencyId,
      );
    }
  }

  if (!configData.apiKey) {
    throw new PMSConfigError(
      'Clé API PMS manquante. Configurez-la dans Paramètres → Intégration PMS.',
      agencyId,
    );
  }

  if (!agency.pmsPropertyId) {
    throw new PMSConfigError(
      'Property ID PMS manquant. Configurez-le dans Paramètres → Intégration PMS.',
      agencyId,
    );
  }

  // Construire la config
  const config: PMSConfig = {
    provider: agency.pmsProvider as PMSProviderType,
    apiKey: configData.apiKey,
    propertyId: agency.pmsPropertyId,
    baseUrl: configData.baseUrl,
  };

  // Instancier le provider
  const provider = createProvider(config.provider, config);

  // Mettre en cache
  providerCache.set(agencyId, {
    provider,
    config,
    cachedAt: Date.now(),
  });

  return provider;
}

/**
 * Invalider le cache pour une agence (après modification de config).
 */
export function invalidatePMSCache(agencyId: string): void {
  providerCache.delete(agencyId);
}

// ═══════════════════════════════════════════════════════════════════
// MÉTHODES DE HAUT NIVEAU (wrappers avec gestion d'erreurs)
// ═══════════════════════════════════════════════════════════════════

/**
 * Récupérer une réservation PMS par son ID.
 */
export async function getReservation(
  agencyId: string,
  reservationId: string,
): Promise<PMSReservation> {
  const provider = await getPMSProvider(agencyId);
  return provider.getReservation(reservationId);
}

/**
 * Récupérer le client occupant une chambre (aujourd'hui par défaut).
 * Utilisé pour le check-in QRTagsPro: l'hôtel saisit le n° de chambre,
 * on interroge le PMS pour récupérer automatiquement le nom du client.
 */
export async function getGuestByRoom(
  agencyId: string,
  roomNumber: string,
  date?: string,
): Promise<PMSGuest | null> {
  const provider = await getPMSProvider(agencyId);
  return provider.getGuestByRoom(roomNumber, date);
}

/**
 * Tester la connexion PMS d'une agence.
 */
export async function testPMSConnection(
  agencyId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const provider = await getPMSProvider(agencyId);
    return await provider.testConnection();
  } catch (error) {
    if (error instanceof PMSConfigError || error instanceof PMSAuthError) {
      return { success: false, message: error.message };
    }
    console.error('[pmsService] testConnection error:', error);
    return {
      success: false,
      message: `Erreur: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

/**
 * Parser un webhook PMS pour une agence.
 */
export async function parsePMSWebhook(
  agencyId: string,
  event: string,
  rawBody: unknown,
): Promise<PMSWebhookEvent> {
  const provider = await getPMSProvider(agencyId);
  return provider.getWebhookPayload(event, rawBody);
}

/**
 * Vérifier si une agence a un PMS configuré.
 */
export async function hasPMSConfigured(agencyId: string): Promise<boolean> {
  try {
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: { pmsProvider: true, pmsApiKeys: true, pmsPropertyId: true },
    });
    return !!(
      agency?.pmsProvider &&
      agency.pmsProvider !== 'NONE' &&
      agency.pmsApiKeys &&
      agency.pmsPropertyId
    );
  } catch {
    return false;
  }
}

/**
 * Récupérer la config PMS d'une agence (pour affichage dashboard).
 * ⚠️ Ne retourne JAMAIS la clé API en clair (masquée).
 */
export async function getPMSConfig(
  agencyId: string,
): Promise<{
  provider: string | null;
  propertyId: string | null;
  hasApiKey: boolean;
  baseUrl?: string | null;
} | null> {
  const agency = await db.agency.findUnique({
    where: { id: agencyId },
    select: { pmsProvider: true, pmsApiKeys: true, pmsPropertyId: true },
  });

  if (!agency) return null;

  let baseUrl: string | null = null;
  if (agency.pmsApiKeys) {
    try {
      const parsed = JSON.parse(agency.pmsApiKeys);
      baseUrl = parsed.baseUrl || null;
    } catch {
      // ignore
    }
  }

  return {
    provider: agency.pmsProvider,
    propertyId: agency.pmsPropertyId,
    hasApiKey: !!agency.pmsApiKeys,
    baseUrl,
  };
}

/**
 * Mettre à jour la config PMS d'une agence.
 */
export async function updatePMSConfig(
  agencyId: string,
  config: {
    provider: PMSProviderType;
    apiKey: string;
    propertyId: string;
    baseUrl?: string;
  },
): Promise<void> {
  const apiKeys = JSON.stringify({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl || null,
  });

  await db.agency.update({
    where: { id: agencyId },
    data: {
      pmsProvider: config.provider,
      pmsApiKeys: apiKeys,
      pmsPropertyId: config.propertyId,
    },
  });

  // Invalider le cache
  invalidatePMSCache(agencyId);
}

/**
 * Supprimer la config PMS d'une agence.
 */
export async function removePMSConfig(agencyId: string): Promise<void> {
  await db.agency.update({
    where: { id: agencyId },
    data: {
      pmsProvider: null,
      pmsApiKeys: null,
      pmsPropertyId: null,
    },
  });

  invalidatePMSCache(agencyId);
}
