'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, AlertCircle, Clock, MapPin, Eye,
  CheckCircle2, ArrowLeft, MessageCircle, Navigation,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

// ─── Design tokens QRTags (fond jaune moutarde + cartes blanches) ───
const QRTAGS_BG       = '#E3B23C';
const QRTAGS_INK      = '#111111';
const QRTAGS_RED      = '#DC2626';
const QRTAGS_GREEN    = '#16A34A';
const CARD_CLASS      = 'bg-white rounded-xl p-6 shadow-xl border-2 border-black';

interface ObjectInfo {
  category?: string | null;
  category_label?: string | null;
  object_name?: string | null;
  object_description?: string | null;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  reward?: string | null;
  message_to_finder?: string | null;
  city?: string | null;
  country?: string | null;
}

interface SuiviScan {
  id?: string;
  location: string | null;
  city: string | null;
  country: string | null;
  finderName: string | null;
  finderPhone: string | null;
  message: string | null;
  scannedAt: string;
  hasMap?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

interface SuiviData {
  status: string;
  message?: string;
  baggage?: {
    reference: string;
    type: string;
    travelerName: string;
    status: string;
    agency?: string | null;
    createdAt?: string | null;
    lastScanDate?: string | null;
    lastLocation?: string | null;
    lastScanLocation?: string | null;
    scanCount?: number;
    declaredLostAt?: string | null;
    foundAt?: string | null;
    expiresAt?: string | null;
    trackingToken?: string | null;
    objectInfo?: ObjectInfo | null;
  };
  lastFinder?: { name: string | null; phone: string | null } | null;
  scans?: SuiviScan[];
  lastPosition?: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    hasCoordinates: boolean;
  } | null;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

export default function SuiviPage() {
  const params = useParams();
  const router = useRouter();
  const reference = (params?.reference as string) || '';

  const [data, setData] = useState<SuiviData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stocker la référence dans localStorage pour /mes-bagages
  useEffect(() => {
    if (!reference) return;
    if (typeof window === 'undefined') return;
    try {
      const KEY = 'qrbag_my_references';
      const refs: string[] = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (!refs.includes(reference)) {
        refs.unshift(reference);
        localStorage.setItem(KEY, JSON.stringify(refs.slice(0, 20)));
      }
    } catch {
      // silent
    }
  }, [reference]);

  useEffect(() => {
    if (!reference) return;
    (async () => {
      try {
        const res = await fetch(`/api/suivi/${reference}`, { cache: 'no-store' });
        if (!res.ok) {
          setError('Erreur lors du chargement');
          return;
        }
        const d: SuiviData = await res.json();
        setData(d);
      } catch (err) {
        console.error('[suivi] error:', err);
        setError('Erreur réseau');
      } finally {
        setLoading(false);
      }
    })();
  }, [reference]);

  // Auto-refresh toutes les 30s
  useEffect(() => {
    if (!reference || loading || error) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/suivi/${reference}`, { cache: 'no-store' });
        if (res.ok) {
          const d: SuiviData = await res.json();
          setData(d);
        }
      } catch {
        // silent
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [reference, loading, error]);

  // ─── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: QRTAGS_BG }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-black" />
          <p className="text-lg font-bold text-black">Chargement du suivi...</p>
        </div>
      </main>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────
  if (error || !data || !data.baggage) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: QRTAGS_BG }}>
        <div className={`${CARD_CLASS} max-w-md w-full text-center`}>
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: QRTAGS_RED }} />
          <h1 className="text-2xl font-black text-black mb-3">Suivi indisponible</h1>
          <p className="text-black/70 mb-6">
            {error || data?.message || 'Ce tag n\'existe pas ou n\'est pas encore activé.'}
          </p>
          <a href="/" className="inline-block px-6 py-3 rounded-lg bg-black text-[#E3B23C] font-bold">
            Retour à l'accueil
          </a>
        </div>
      </main>
    );
  }

  // ─── Pending activation ─────────────────────────────────────────
  if (data.status === 'pending_activation') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: QRTAGS_BG }}>
        <div className={`${CARD_CLASS} max-w-md w-full text-center`}>
          <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: QRTAGS_INK }} />
          <h1 className="text-2xl font-black text-black mb-3">Tag non activé</h1>
          <p className="text-black/70 mb-6">Ce QR code n'a pas encore été activé par son propriétaire.</p>
          <a href={`/inscrire?qr=${reference}`} className="inline-block px-6 py-3 rounded-lg bg-black text-[#E3B23C] font-bold">
            L'activer maintenant
          </a>
        </div>
      </main>
    );
  }

  // ─── Expired ────────────────────────────────────────────────────
  if (data.status === 'expired') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: QRTAGS_BG }}>
        <div className={`${CARD_CLASS} max-w-md w-full text-center`}>
          <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: QRTAGS_RED }} />
          <h1 className="text-2xl font-black text-black mb-3">Tag expiré</h1>
          <p className="text-black/70 mb-6">La période de validité de ce tag est terminée.</p>
          <a href="/" className="inline-block px-6 py-3 rounded-lg bg-black text-[#E3B23C] font-bold">
            Retour à l'accueil
          </a>
        </div>
      </main>
    );
  }

  // ─── Blocked ────────────────────────────────────────────────────
  if (data.status === 'blocked') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: QRTAGS_BG }}>
        <div className={`${CARD_CLASS} max-w-md w-full text-center`}>
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: QRTAGS_RED }} />
          <h1 className="text-2xl font-black text-black mb-3">Tag bloqué</h1>
          <a href="/" className="inline-block px-6 py-3 rounded-lg bg-black text-[#E3B23C] font-bold">
            Retour à l'accueil
          </a>
        </div>
      </main>
    );
  }

  const baggage = data.baggage;
  const objInfo = baggage.objectInfo;
  const isLost = data.status === 'lost' || Boolean(baggage.declaredLostAt && !baggage.foundAt);
  const scans = data.scans || [];
  const lastFinder = data.lastFinder;
  const hasTrackingToken = Boolean(baggage.trackingToken);

  return (
    <main className="min-h-screen py-8 px-4" style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_INK }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white inline-block px-6 py-3 rounded-lg mb-4 shadow-lg border-2 border-black">
            <QRTagsLogo size="md" variant="light" />
          </div>
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-4 border-2 border-black">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: isLost ? QRTAGS_RED : QRTAGS_GREEN }}
            />
            <span className="text-black font-bold text-sm">
              {isLost ? 'Objet signalé perdu' : 'Objet suivi'}
            </span>
          </div>
          <h1 className="text-3xl font-black text-black mb-2">📍 SUIVI DE L'OBJET</h1>
          <p className="text-black/80">
            Référence : <span className="font-bold text-black">{baggage.reference}</span>
          </p>
        </div>

        {/* Si l'utilisateur est le propriétaire et a un trackingToken,
            proposer le lien vers /track/[token] (page propriétaire avec actions) */}
        {hasTrackingToken && (
          <div className={`${CARD_CLASS} mb-6`}>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: QRTAGS_GREEN }} />
              <div className="flex-1">
                <p className="font-bold text-black mb-1">Vous êtes le propriétaire de cet objet ?</p>
                <p className="text-sm text-black/70 mb-3">
                  Accédez à votre page de suivi propriétaire pour signaler une perte, partager le lien
                  sur WhatsApp, ou voir les statistiques détaillées.
                </p>
                <button
                  type="button"
                  onClick={() => router.push(`/track/${baggage.trackingToken}`)}
                  className="inline-block px-5 py-2 rounded-lg font-bold text-sm bg-black text-[#E3B23C] hover:bg-gray-900 transition"
                >
                  Ouvrir ma page de suivi →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Carte : infos objet */}
        <div className={`${CARD_CLASS} mb-6`}>
          <h3 className="text-lg font-bold text-black mb-4">📦 INFORMATIONS</h3>
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-black">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-black/60 uppercase font-bold">Propriétaire</p>
                <p className="text-black font-bold">{baggage.travelerName || 'Anonyme'}</p>
              </div>
              <div>
                <p className="text-xs text-black/60 uppercase font-bold">Statut</p>
                <p className="font-bold" style={{ color: isLost ? QRTAGS_RED : QRTAGS_GREEN }}>
                  {isLost ? '🚨 Perdu' : '✅ Actif'}
                </p>
              </div>
              {objInfo?.object_name && (
                <div>
                  <p className="text-xs text-black/60 uppercase font-bold">Objet</p>
                  <p className="text-black font-bold">{objInfo.object_name}</p>
                </div>
              )}
              {objInfo?.category_label && (
                <div>
                  <p className="text-xs text-black/60 uppercase font-bold">Catégorie</p>
                  <p className="text-black font-bold">{objInfo.category_label}</p>
                </div>
              )}
              {objInfo?.color && (
                <div>
                  <p className="text-xs text-black/60 uppercase font-bold">Couleur</p>
                  <p className="text-black font-bold">{objInfo.color}</p>
                </div>
              )}
              {objInfo?.brand && (
                <div>
                  <p className="text-xs text-black/60 uppercase font-bold">Marque</p>
                  <p className="text-black font-bold">{objInfo.brand}</p>
                </div>
              )}
              {baggage.agency && (
                <div>
                  <p className="text-xs text-black/60 uppercase font-bold">Agence</p>
                  <p className="text-black font-bold">{baggage.agency}</p>
                </div>
              )}
              {baggage.expiresAt && (
                <div>
                  <p className="text-xs text-black/60 uppercase font-bold">Expire le</p>
                  <p className="text-black font-bold">{formatDate(baggage.expiresAt)}</p>
                </div>
              )}
            </div>

            {objInfo?.object_description && (
              <div className="mt-4 pt-4 border-t-2 border-gray-200">
                <p className="text-xs text-black/60 uppercase font-bold mb-1">Description</p>
                <p className="text-black text-sm">{objInfo.object_description}</p>
              </div>
            )}

            {objInfo?.message_to_finder && (
              <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7', border: '2px solid #111' }}>
                <p className="text-xs text-black/60 uppercase font-bold mb-1">💬 Message du propriétaire</p>
                <p className="text-black text-sm italic">"{objInfo.message_to_finder}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Carte : statistiques */}
        <div className={`${CARD_CLASS} mb-6`}>
          <h3 className="text-lg font-bold text-black mb-4">📊 STATISTIQUES</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Eye className="w-5 h-5 mx-auto mb-1" style={{ color: QRTAGS_INK }} />
              <p className="text-3xl font-black text-black">{baggage.scanCount || 0}</p>
              <p className="text-xs text-black/70 mt-1">Scans</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Clock className="w-5 h-5 mx-auto mb-1" style={{ color: QRTAGS_INK }} />
              <p className="text-3xl font-black text-black">{scans.length}</p>
              <p className="text-xs text-black/70 mt-1">Activités</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              {isLost ? (
                <>
                  <AlertCircle className="w-5 h-5 mx-auto mb-1" style={{ color: QRTAGS_RED }} />
                  <p className="text-3xl font-black" style={{ color: QRTAGS_RED }}>🚨</p>
                  <p className="text-xs text-black/70 mt-1">Perdu</p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1" style={{ color: QRTAGS_GREEN }} />
                  <p className="text-3xl font-black" style={{ color: QRTAGS_GREEN }}>✅</p>
                  <p className="text-xs text-black/70 mt-1">Sûr</p>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t-2 border-gray-200">
            <p className="text-sm text-black/60 flex items-center gap-1">
              <Clock className="w-4 h-4" /> Dernière activité
            </p>
            <p className="text-black font-bold">{formatDate(baggage.lastScanDate)}</p>
            {baggage.lastScanLocation && (
              <>
                <p className="text-sm text-black/60 mt-2 flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> Dernière position connue
                </p>
                <p className="text-black font-bold">📍 {baggage.lastScanLocation}</p>
              </>
            )}
          </div>
        </div>

        {/* Carte : dernier trouveur */}
        {lastFinder && (lastFinder.name || lastFinder.phone) && (
          <div className={`${CARD_CLASS} mb-6`}>
            <h3 className="text-lg font-bold text-black mb-4">👤 DERNIER TROUVEUR</h3>
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-black">
              {lastFinder.name && (
                <p className="text-sm">
                  <span className="text-black/60">Nom :</span>{' '}
                  <span className="font-bold text-black">{lastFinder.name}</span>
                </p>
              )}
              {lastFinder.phone && (
                <p className="text-sm mt-1">
                  <span className="text-black/60">Téléphone :</span>{' '}
                  <span className="font-bold text-black">{lastFinder.phone}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Carte : historique des scans */}
        <div className={`${CARD_CLASS} mb-6`}>
          <h3 className="text-lg font-bold text-black mb-4">📜 HISTORIQUE DES SCANS</h3>
          {scans.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">👁️</p>
              <p className="text-black font-bold">Aucun scan pour le moment</p>
              <p className="text-sm text-black/70 mt-2">
                Si quelqu'un trouve cet objet et scanne le QR code, vous verrez l'activité ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scans.map((scan, idx) => (
                <div
                  key={scan.id || idx}
                  className="p-4 bg-gray-50 rounded-lg border-l-4"
                  style={{ borderColor: QRTAGS_INK }}
                >
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <p className="text-sm font-bold text-black flex items-center gap-1">
                      📅 {formatDate(scan.scannedAt)}
                    </p>
                    <span className="text-xs bg-black text-[#E3B23C] px-2 py-1 rounded-full font-bold">
                      Scan #{scans.length - idx}
                    </span>
                  </div>
                  {(scan.location || scan.city) && (
                    <p className="text-sm text-black/80 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {scan.location || scan.city}
                    </p>
                  )}
                  {scan.finderName && (
                    <p className="text-sm text-black/80 mt-1">
                      👤 Trouveur : {scan.finderName}
                      {scan.finderPhone ? ` • ${scan.finderPhone}` : ''}
                    </p>
                  )}
                  {scan.message && (
                    <p className="text-sm text-black/80 mt-2 italic">💬 "{scan.message}"</p>
                  )}
                  {scan.latitude && scan.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${scan.latitude},${scan.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline mt-2 inline-block"
                      style={{ color: QRTAGS_INK }}
                    >
                      🗺️ Voir sur Google Maps
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-black/70 hover:text-black text-sm">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </a>
          <p className="text-black/70 text-sm mt-2">
            Propulsé par <span className="font-bold text-black">QRTags</span>
          </p>
        </div>
      </div>
    </main>
  );
}
