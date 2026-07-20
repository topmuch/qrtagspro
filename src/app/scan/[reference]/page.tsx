'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle, Clock, Shield, Sparkles,
  MapPin, Loader2, CheckCircle2, ArrowLeft, RefreshCw,
  Package, Gift, MessageCircle, User, Phone, Navigation,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

// ─── Design tokens QRTags (fond jaune moutarde + cartes blanches) ───
const QRTAGS_BG       = '#E3B23C';
const QRTAGS_INK      = '#111111';
const QRTAGS_RED      = '#DC2626';
const QRTAGS_GREEN    = '#16A34A';
const FALLBACK_PHONE  = '33600000000';
const CARD_CLASS      = 'bg-white rounded-xl p-6 shadow-xl border-2 border-black';
const INPUT_CLASS     =
  'w-full px-4 py-3 border-2 border-black rounded-lg bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:border-[#E3B23C] focus:ring-2 focus:ring-[#E3B23C] transition';

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

interface BaggageData {
  status: string;
  message?: string;
  baggage?: {
    reference: string;
    travelerName: string;
    travelerFirstName?: string | null;
    status: string;
    agency?: string | null;
    whatsappOwner?: string | null;
    declaredLostAt?: string | null;
    foundAt?: string | null;
    createdAt?: string | null;
    isLost?: boolean;
    objectInfo?: ObjectInfo | null;
  };
}

type GpsStatus = 'idle' | 'loading' | 'success' | 'error';

const PENDING_STATUSES = new Set(['in_stock', 'assigned_to_agency', 'sold', 'pending_activation']);

export default function FinderPage() {
  const params = useParams();
  const router = useRouter();
  const reference = (params?.reference as string) || '';

  const [tagData, setTagData] = useState<BaggageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [finderName, setFinderName] = useState('');
  const [finderPhone, setFinderPhone] = useState('');
  const [otherLocation, setOtherLocation] = useState('');
  const [finderMessage, setFinderMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasContactedOwner, setHasContactedOwner] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // GPS state
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAddress, setGpsAddress] = useState<string>('');

  // ─── Fetch tag data ───────────────────────────────────────────────
  useEffect(() => {
    if (!reference) return;
    (async () => {
      try {
        const res = await fetch(`/api/scan/${reference}`, { cache: 'no-store' });
        const data: BaggageData = await res.json();
        setTagData(data);
        if (typeof window !== 'undefined' &&
            localStorage.getItem(`contacted_owner_${reference}`) === 'true') {
          setHasContactedOwner(true);
        }
      } catch (err) {
        console.error('Erreur fetch tag:', err);
        setTagData({ status: 'not_found' });
      } finally {
        setLoading(false);
      }
    })();
  }, [reference]);

  // ─── Redirect to inscription if pending activation ────────────────
  useEffect(() => {
    if (tagData && PENDING_STATUSES.has(tagData.status)) {
      router.push(`/inscrire?qr=${reference}`);
    }
  }, [tagData, reference, router]);

  // ─── Auto GPS detection on mount (only for active tags) ──────────
  useEffect(() => {
    if (!tagData || tagData.status !== 'active') return;
    if (!('geolocation' in navigator)) {
      setGpsStatus('error');
      return;
    }

    setGpsStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        setGpsStatus('success');

        // Reverse geocoding via Nominatim (OpenStreetMap) — gratuit, sans clé API
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'fr' } }
        )
          .then((res) => res.json())
          .then((data) => {
            if (data?.display_name) {
              setGpsAddress(data.display_name);
            } else {
              setGpsAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
          })
          .catch(() => {
            setGpsAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          });
      },
      (error) => {
        console.error('Erreur GPS:', error);
        setGpsStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [tagData]);

  // ─── Submit → POST scan + open WhatsApp in new tab ────────────────
  const handleSubmit = useCallback(async () => {
    if (!finderName.trim() || !finderPhone.trim()) {
      alert('Veuillez remplir votre nom et téléphone');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/scan/${reference}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: otherLocation.trim() || gpsAddress || '',
          finderName: finderName.trim(),
          finderPhone: finderPhone.trim(),
          message: finderMessage.trim() || null,
          latitude: gpsCoords?.lat,
          longitude: gpsCoords?.lng,
        }),
      });

      const data = await res.json();
      const whatsappUrl = data.whatsappUrl as string;
      if (whatsappUrl) {
        // Ouvrir WhatsApp dans un nouvel onglet (pour garder la page trouveur ouverte)
        window.open(whatsappUrl, '_blank');
      }
      setShowSuccess(true);
      setHasContactedOwner(true);
      localStorage.setItem(`contacted_owner_${reference}`, 'true');
      setTimeout(() => setShowSuccess(false), 6000);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la notification');
    } finally {
      setIsSubmitting(false);
    }
  }, [finderName, finderPhone, otherLocation, finderMessage, gpsCoords, gpsAddress, reference]);

  const retryGps = () => {
    setGpsStatus('idle');
    setGpsCoords(null);
    setGpsAddress('');
    // Re-trigger the GPS effect by toggling state
    setTimeout(() => {
      if ('geolocation' in navigator) {
        setGpsStatus('loading');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setGpsCoords({ lat: latitude, lng: longitude });
            setGpsStatus('success');
            fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              { headers: { 'Accept-Language': 'fr' } }
            )
              .then((r) => r.json())
              .then((d) => setGpsAddress(d?.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`))
              .catch(() => setGpsAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`));
          },
          () => setGpsStatus('error'),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setGpsStatus('error');
      }
    }, 100);
  };

  // ─── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: QRTAGS_BG }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-black" />
          <p className="text-lg font-bold text-black">Chargement...</p>
        </div>
      </main>
    );
  }

  // ─── Not found ───────────────────────────────────────────────────
  if (tagData?.status === 'not_found') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: QRTAGS_BG }}>
        <div className={`${CARD_CLASS} max-w-md w-full text-center`}>
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: QRTAGS_RED }} />
          <h1 className="text-2xl font-black text-black mb-3">Code QR non valide</h1>
          <p className="text-black/70 mb-6">Ce code QR n'existe pas dans notre système.</p>
          <a href="/" className="inline-block px-6 py-3 rounded-lg bg-black text-[#E3B23C] font-bold">
            Retour à l'accueil
          </a>
        </div>
      </main>
    );
  }

  // ─── Expired ─────────────────────────────────────────────────────
  if (tagData?.status === 'expired') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: QRTAGS_BG }}>
        <div className={`${CARD_CLASS} max-w-md w-full text-center`}>
          <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: QRTAGS_RED }} />
          <h1 className="text-2xl font-black text-black mb-3">Tag expiré</h1>
          <a href="/" className="inline-block px-6 py-3 rounded-lg bg-black text-[#E3B23C] font-bold">Retour</a>
        </div>
      </main>
    );
  }

  // ─── Blocked ─────────────────────────────────────────────────────
  if (tagData?.status === 'blocked') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: QRTAGS_BG }}>
        <div className={`${CARD_CLASS} max-w-md w-full text-center`}>
          <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: QRTAGS_RED }} />
          <h1 className="text-2xl font-black text-black mb-3">Tag bloqué</h1>
          <a href="/" className="inline-block px-6 py-3 rounded-lg bg-black text-[#E3B23C] font-bold">Retour</a>
        </div>
      </main>
    );
  }

  // ─── Pending activation (redirection en cours) ───────────────────
  if (tagData && PENDING_STATUSES.has(tagData.status)) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: QRTAGS_BG }}>
        <div className={`${CARD_CLASS} max-w-md w-full text-center`}>
          <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: QRTAGS_INK }} />
          <h1 className="text-2xl font-black text-black mb-3">Redirection...</h1>
          <p className="text-black/70">Ce tag doit être activé. Vous allez être redirigé.</p>
        </div>
      </main>
    );
  }

  const baggage = tagData?.baggage;
  const objInfo = baggage?.objectInfo || null;
  const ownerName = baggage?.travelerName || 'Anonyme';
  const ownerFirstName = baggage?.travelerFirstName || '';
  const objectRef = baggage?.reference || reference;
  const isLost = baggage?.isLost || (baggage?.declaredLostAt && !baggage?.foundAt);

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
              {isLost ? 'Objet signalé perdu' : 'Objet retrouvé'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-black mb-2">
            🎯 {isLost ? 'OBJET PERDU' : 'OBJET RETROUVÉ'}
          </h1>
          <p className="text-black/80">
            Référence : <span className="font-bold text-black">{objectRef}</span>
          </p>
        </div>

        {/* Carte : infos de l'objet */}
        <div className={`${CARD_CLASS} mb-6`}>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-black flex items-center gap-2">
              <Package className="w-5 h-5" /> OBJET
            </h2>
            {objInfo?.reward && (
              <span
                className="px-3 py-1 rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: QRTAGS_GREEN }}
              >
                <Gift className="w-3 h-3 inline mr-1" />
                Récompense : {objInfo.reward}
              </span>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border-2 border-black">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-black/60 uppercase font-bold">Nom de l'objet</p>
                <p className="text-black font-bold text-lg">
                  {objInfo?.object_name || 'Objet non spécifié'}
                </p>
              </div>
              <div>
                <p className="text-xs text-black/60 uppercase font-bold">Catégorie</p>
                <p className="text-black font-bold">{objInfo?.category_label || objInfo?.category || '—'}</p>
              </div>
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
              {objInfo?.model && (
                <div>
                  <p className="text-xs text-black/60 uppercase font-bold">Modèle</p>
                  <p className="text-black font-bold">{objInfo.model}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-black/60 uppercase font-bold">Propriétaire</p>
                <p className="text-black font-bold">{ownerName}</p>
              </div>
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

        {/* Carte : Géolocalisation automatique */}
        <div className={`${CARD_CLASS} mb-6`}>
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5" /> VOTRE POSITION GPS
          </h3>

          {gpsStatus === 'idle' && (
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-black/40" />
              <p className="text-black/70 text-sm">En attente de détection...</p>
            </div>
          )}

          {gpsStatus === 'loading' && (
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: QRTAGS_INK }} />
              <p className="text-black font-bold">Détection de votre position...</p>
              <p className="text-sm text-black/60 mt-2">Veuillez autoriser l'accès à la géolocalisation</p>
            </div>
          )}

          {gpsStatus === 'success' && gpsCoords && (
            <div className="bg-green-50 rounded-lg p-4 border-2" style={{ borderColor: QRTAGS_GREEN }}>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: QRTAGS_GREEN }} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold mb-1" style={{ color: QRTAGS_GREEN }}>Position détectée avec succès !</p>
                  <p className="text-black text-sm mb-2 break-words">
                    {gpsAddress || `${gpsCoords.lat.toFixed(6)}, ${gpsCoords.lng.toFixed(6)}`}
                  </p>
                  <div className="bg-white rounded-md p-2 border" style={{ borderColor: QRTAGS_GREEN }}>
                    <p className="text-xs text-black/60">Coordonnées GPS</p>
                    <p className="text-black font-mono font-bold text-sm">
                      {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-sm font-bold hover:underline"
                    style={{ color: QRTAGS_GREEN }}
                  >
                    🗺️ Voir sur Google Maps →
                  </a>
                </div>
              </div>
            </div>
          )}

          {gpsStatus === 'error' && (
            <div className="bg-red-50 rounded-lg p-4 border-2" style={{ borderColor: QRTAGS_RED }}>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: QRTAGS_RED }} />
                <div className="flex-1">
                  <p className="font-bold mb-2" style={{ color: QRTAGS_RED }}>Géolocalisation non disponible</p>
                  <p className="text-black text-sm mb-3">
                    La géolocalisation aide le propriétaire à retrouver son objet plus rapidement.
                    Vous pouvez quand même remplir le formulaire ci-dessous.
                  </p>
                  <button
                    type="button"
                    onClick={retryGps}
                    className="px-4 py-2 rounded-lg font-bold text-sm text-white transition"
                    style={{ backgroundColor: QRTAGS_RED }}
                  >
                    <RefreshCw className="w-3 h-3 inline mr-1" /> Réessayer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Carte : Formulaire du trouveur */}
        <div className={`${CARD_CLASS} mb-6`}>
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
            <User className="w-5 h-5" /> VOS INFORMATIONS
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                <User className="w-3 h-3 inline mr-1" /> Votre nom *
              </label>
              <input
                type="text"
                value={finderName}
                onChange={(e) => setFinderName(e.target.value)}
                placeholder="Entrez votre nom complet"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2">
                <Phone className="w-3 h-3 inline mr-1" /> Votre téléphone *
              </label>
              <input
                type="tel"
                value={finderPhone}
                onChange={(e) => setFinderPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                className={INPUT_CLASS}
              />
              <p className="text-xs text-black/60 mt-1">Format international recommandé</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2">
                <MapPin className="w-3 h-3 inline mr-1" /> Lieu précis (optionnel)
              </label>
              <input
                type="text"
                value={otherLocation}
                onChange={(e) => setOtherLocation(e.target.value)}
                placeholder="Ex: Hall d'accueil, réception, devant la gare..."
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2">
                <MessageCircle className="w-3 h-3 inline mr-1" /> Message au propriétaire (optionnel)
              </label>
              <textarea
                rows={3}
                value={finderMessage}
                onChange={(e) => setFinderMessage(e.target.value)}
                placeholder="Ex: J'ai trouvé votre objet ce matin devant l'entrée..."
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>
          </div>

          {/* Bouton WhatsApp */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full mt-6 px-6 py-4 rounded-lg font-bold text-lg text-white transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            style={{ backgroundColor: QRTAGS_GREEN }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contacter le propriétaire via WhatsApp
              </>
            )}
          </button>

          <p className="text-xs text-black/60 text-center mt-4">
            Le propriétaire sera contacté via WhatsApp (clic-vers-chat).
            Aucune autre notification n'est envoyée.
          </p>
        </div>

        {/* Confirmation si déjà contacté */}
        {hasContactedOwner && !showSuccess && (
          <div className={`${CARD_CLASS} mb-6`}>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: QRTAGS_GREEN }} />
              <div className="text-sm">
                <div className="font-bold mb-1 text-black">Propriétaire déjà contacté</div>
                <div className="text-black/70">
                  Vous avez déjà envoyé un message au propriétaire de cet objet. Vous pouvez
                  renvoyer un message si nécessaire.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-black/70 hover:text-black text-sm">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </a>
          <p className="text-black/70 text-sm mt-2">
            Propulsé par <span className="font-bold text-black">QRTags</span>
          </p>
          <p className="text-black/50 text-xs mt-1">Ensemble, retrouvons les objets perdus</p>
        </div>
      </div>

      {/* Modal de succès */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full text-center border-2 border-black shadow-2xl">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: QRTAGS_GREEN }}
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-black text-black mb-3">MESSAGE ENVOYÉ !</h2>
            <p className="text-black/80 mb-6">
              WhatsApp s'est ouvert dans un nouvel onglet avec le message pré-rempli.
              Le propriétaire a aussi reçu votre position GPS.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-black mb-6 text-left">
              <p className="text-sm font-bold text-black mb-2">Prochaines étapes :</p>
              <ul className="text-sm text-black space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: QRTAGS_GREEN }} />
                  <span>WhatsApp s'est ouvert avec le message pré-rempli</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: QRTAGS_INK }} />
                  <span>Cliquez sur "Envoyer" dans WhatsApp</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: QRTAGS_INK }} />
                  <span>Convenez d'un rendez-vous pour la restitution</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowSuccess(false)}
              className="w-full px-6 py-3 rounded-lg font-bold bg-black text-[#E3B23C] hover:bg-gray-900 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
