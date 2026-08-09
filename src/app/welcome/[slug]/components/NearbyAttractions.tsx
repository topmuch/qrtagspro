'use client';

import { useState, useEffect } from 'react';

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

interface NearbyAttractionsProps {
  hotelLat: number;
  hotelLng: number;
  /** Slug de l'hôtel (requis pour l'API /api/pois qui filtre par hôtel) */
  agencySlug: string;
  /** ID de l'hôtel (requis pour le tracking des clics) */
  agencyId: string;
}

// ─── Catégories (filtres scrollables) ───────────────────────────────────────

const CATEGORIES = [
  { id: 'ALL', label: 'Tous', icon: '🌍' },
  { id: 'RESTAURANT', label: 'Manger', icon: '🍽️' },
  { id: 'ATTRACTION', label: 'Visiter', icon: '🏛️' },
  { id: 'BEACH', label: 'Plages', icon: '🏖️' },
  { id: 'SHOPPING', label: 'Shopping', icon: '🛍️' },
  { id: 'HEALTH', label: 'Santé', icon: '💊' },
  { id: 'EXCURSION', label: 'Excursions', icon: '⛴️' },
] as const;

// ─── Composant ──────────────────────────────────────────────────────────────

/**
 * Composant "Découverte Touristique" — affiché sur la page welcome du bracelet.
 *
 * Consomme l'API /api/pois et affiche les lieux recommandés par l'hôtel
 * (source DB, vérifiés, avec codes promo) + complément OpenStreetMap si besoin.
 *
 * Fonctionnalités :
 *   - Filtres par catégorie (scroll horizontal, mobile-first)
 *   - Tri par distance (géré côté API)
 *   - Badge "Vérifié" pour les partenaires de l'hôtel
 *   - Code promo mis en avant (monétisation)
 *   - Bouton "Y aller" → Google Maps directions
 *   - Bouton "Carte complète" → Google Maps global
 *   - États : loading, error, empty
 */
export default function NearbyAttractions({ hotelLat, hotelLng, agencySlug, agencyId }: NearbyAttractionsProps) {
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  useEffect(() => {
    const fetchPOIs = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          lat: hotelLat.toString(),
          lng: hotelLng.toString(),
          radius: '5',
          slug: agencySlug,
        });
        if (activeCategory !== 'ALL') {
          params.set('category', activeCategory);
        }

        const response = await fetch(`/api/pois?${params.toString()}`);
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        const result = await response.json();

        if (result.success) {
          setPois(result.data);
        } else {
          setError(result.error || 'Impossible de charger les lieux.');
        }
      } catch {
        setError('Erreur de connexion.');
      } finally {
        setLoading(false);
      }
    };

    fetchPOIs();
  }, [hotelLat, hotelLng, activeCategory, agencySlug]);

  // Icône par défaut selon la catégorie
  const getCategoryIcon = (category: string): string => {
    return CATEGORIES.find((c) => c.id === category)?.icon || '📍';
  };

  return (
    <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800 shadow-lg">
      {/* ─── En-tête ─── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#E3B23C] flex items-center gap-2">
          🌍 Découvrir les Alentours
        </h2>
        <span className="text-[10px] bg-[#E3B23C]/20 text-[#E3B23C] px-2 py-1 rounded-full font-bold uppercase tracking-wide">
          Sélection Hôtel
        </span>
      </div>

      {/* ─── Filtres Catégories (scroll horizontal) ─── */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            aria-pressed={activeCategory === cat.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-[#E3B23C] text-black shadow-md'
                : 'bg-black border border-gray-700 text-gray-300 hover:border-[#E3B23C]'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* ─── État de chargement ─── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <div className="w-8 h-8 border-2 border-[#E3B23C] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Recherche des meilleurs lieux…</p>
        </div>
      )}

      {/* ─── État d'erreur ─── */}
      {error && !loading && (
        <div className="text-center py-8 text-red-400 text-sm bg-red-500/10 rounded-xl">
          ⚠️ {error}
        </div>
      )}

      {/* ─── Liste des lieux ─── */}
      {!loading && !error && (
        <div className="space-y-3">
          {pois.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-6">
              Aucun lieu trouvé dans cette catégorie.
            </p>
          ) : (
            pois.map((place) => (
              <div
                key={place.id}
                className="flex items-center gap-4 p-3 bg-black rounded-xl border border-gray-800 hover:border-[#E3B23C] transition-all group"
              >
                {/* Icône */}
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gray-900 rounded-lg text-2xl border border-gray-700 group-hover:border-[#E3B23C] transition-colors">
                  {place.isVerified ? getCategoryIcon(place.category) : '📍'}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-white text-sm truncate">{place.name}</h3>
                    {place.isVerified && (
                      <span className="text-[10px] text-[#E3B23C] font-bold bg-[#E3B23C]/10 px-1.5 py-0.5 rounded shrink-0">
                        ✓ Vérifié
                      </span>
                    )}
                  </div>

                  {place.description && (
                    <p className="text-xs text-gray-500 mb-0.5 truncate">{place.description}</p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                    <span>📍 {place.distance}</span>
                    <span>•</span>
                    <span>⭐ {place.rating.toFixed(1)}</span>
                    {place.promoCode && (
                      <>
                        <span>•</span>
                        <span className="text-[#E3B23C] font-bold">🎁 {place.promoCode}</span>
                      </>
                    )}
                    {place.source === 'OSM' && (
                      <>
                        <span>•</span>
                        <span className="text-gray-600 text-[10px]">OSM</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action : Google Maps directions + tracking clic */}
                <a
                  href={place.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    // Tracking non-bloquant (fire and forget) pour les stats ROI.
                    // On n'attend pas la réponse : le clic ouvre Google Maps dans
                    // un nouvel onglet, le tracking s'enregistre en arrière-plan.
                    // On n'envoie que l'ID du partenaire (pas de données perso).
                    if (place.source === 'DB') {
                      fetch('/api/pois/click', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          partnerId: place.id,
                          agencyId,
                          deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'MOBILE' : 'DESKTOP',
                          source: 'WRISTBAND',
                        }),
                      }).catch(() => {
                        // Silencieux : le tracking ne doit jamais bloquer l'UX
                      });
                    }
                  }}
                  className="flex-shrink-0 px-3 py-2 bg-gray-800 text-[#E3B23C] text-xs font-bold rounded-lg hover:bg-[#E3B23C] hover:text-black transition-colors"
                >
                  Y aller →
                </a>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Bouton Carte Complète ─── */}
      {!loading && !error && pois.length > 0 && (
        <a
          href={`https://www.google.com/maps/search/tourisme+autour+de+moi/@${hotelLat},${hotelLng},14z`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full mt-5 py-3 bg-black border-2 border-[#E3B23C] text-[#E3B23C] font-bold text-center rounded-xl hover:bg-[#E3B23C] hover:text-black transition-all active:scale-95"
        >
          🗺️ Ouvrir la carte complète
        </a>
      )}
    </section>
  );
}
