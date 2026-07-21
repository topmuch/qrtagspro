'use client';

/**
 * QRTagsPro V1 — Page Trouveur (Pro)
 *
 * Affichée quand un trouveur scanne un QR code QRTagsPro.
 *
 * Comportement:
 *   - Statut 'active' ou 'lost' → affiche "Objet de [Agence]"
 *     + bouton WhatsApp vers la RÉCEPTION (agency.contactPhone)
 *     + formulaire (nom, téléphone, lieu, message) pour le trouveur
 *   - Statut 'pending_activation' → "Ce QR n'est pas encore activé"
 *   - Statut 'expired' → "Ce QR a expiré (séjour terminé)"
 *   - Statut 'blocked' → "Ce QR a été bloqué"
 *   - Statut 'not_found' → "Ce QR n'existe pas"
 *
 * Confidentialité (PRO):
 *   ❌ Le trouveur ne voit JAMAIS le nom du client
 *   ❌ Le trouveur ne voit JAMAIS le n° de chambre
 *   ❌ Le trouveur ne voit JAMAIS le téléphone du client
 *   ✅ Le trouveur voit uniquement le nom de l'agence + téléphone réception
 *
 * Design: fond jaune moutarde + cartes blanches + bordures noires 2px.
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  AlertCircle, Clock, Shield, Loader2, CheckCircle2,
  MapPin, MessageCircle, User, Phone, Navigation, RefreshCw,
  Building2, ArrowLeft,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';
import { useCountryDetection, formatPhoneWithDialCode } from '@/hooks/useCountryDetection';

// ─── Design tokens QRTagsPro V4 ────────────────────────────────────
const QRTAGS_BG       = '#32ba5d';   // Vert — fond de la page trouveur
const QRTAGS_INK      = '#134288';   // Bleu corporate — texte et bordures
const QRTAGS_RED      = '#DC2626';   // Rouge — erreurs
const QRTAGS_GREEN    = '#134288';   // Bleu (utilisé pour "succès" — cohérence)
const QRTAGS_CARD     = '#FFFFFF';
const QRTAGS_BTN_WA   = '#134288';   // Bleu pour bouton WhatsApp (au lieu de vert)
const FALLBACK_PHONE  = '33600000000';
const CARD_CLASS      = 'bg-white rounded-xl p-6 shadow-xl border-2 border-[#134288]';
const INPUT_CLASS     =
  'w-full px-4 py-3 border-2 border-[#134288] rounded-lg bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d] transition';

type GpsStatus = 'idle' | 'loading' | 'success' | 'error';

interface AgencyInfo {
  name: string;
  agencyType: string | null;
  contactPhone: string | null;
  email: string | null;
  logoUrl?: string | null;
  customType?: {
    name: string;
    icon: string;
    finderMessage: string | null;
  } | null;
}

interface ScanData {
  status: string;
  message?: string;
  reference?: string;
  agency?: AgencyInfo | null;
  isLost?: boolean;
  declaredLostAt?: string | null;
  foundAt?: string | null;
  createdAt?: string | null;
}

export default function FinderPage() {
  const params = useParams();
  const reference = (params?.reference as string) || '';
  const { dialCode, country } = useCountryDetection();

  const [data, setData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulaire trouveur
  const [finderName, setFinderName] = useState('');
  const [finderPhone, setFinderPhone] = useState('');
  const [otherLocation, setOtherLocation] = useState('');
  const [finderMessage, setFinderMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // GPS
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAddress, setGpsAddress] = useState<string>('');

  // ─── Fetch tag data ───────────────────────────────────────────────
  useEffect(() => {
    if (!reference) return;
    (async () => {
      try {
        const res = await fetch(`/api/scan/${reference}`, { cache: 'no-store' });
        const json: ScanData = await res.json();
        setData(json);
      } catch (err) {
        console.error('[finder] fetch error:', err);
        setData({ status: 'error', message: 'Erreur réseau' });
      } finally {
        setLoading(false);
      }
    })();
  }, [reference]);

  // ─── Auto GPS (uniquement si statut active/lost) ─────────────────
  useEffect(() => {
    if (!data || (data.status !== 'active' && data.status !== 'lost')) return;
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

        // Reverse geocoding via Nominatim (gratuit, sans clé API)
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'fr' } }
        )
          .then((r) => r.json())
          .then((d) => {
            setGpsAddress(d?.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          })
          .catch(() => {
            setGpsAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          });
      },
      (error) => {
        console.error('[finder] GPS error:', error);
        setGpsStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [data]);

  // ─── Retry GPS ────────────────────────────────────────────────────
  const retryGps = () => {
    setGpsStatus('idle');
    setGpsCoords(null);
    setGpsAddress('');
    setTimeout(() => {
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
    }, 100);
  };

  // ─── Submit → POST scan + open WhatsApp ───────────────────────────
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
          finderPhone: formatPhoneWithDialCode(finderPhone, dialCode),
          message: finderMessage.trim() || null,
          latitude: gpsCoords?.lat,
          longitude: gpsCoords?.lng,
        }),
      });

      const result = await res.json();
      if (result.whatsappUrl) {
        // Ouvrir WhatsApp dans un nouvel onglet
        window.open(result.whatsappUrl, '_blank');
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 6000);
    } catch (err) {
      console.error('[finder] submit error:', err);
      alert('Erreur lors de la notification');
    } finally {
      setIsSubmitting(false);
    }
  }, [finderName, finderPhone, otherLocation, finderMessage, gpsCoords, gpsAddress, reference, dialCode]);

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: QRTAGS_BG }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-black" />
          <p className="text-lg font-bold text-black">Vérification du QR code...</p>
        </div>
      </main>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────
  if (!data || data.status === 'error') {
    return (
      <ErrorScreen
        icon={<AlertCircle style={{ color: QRTAGS_RED }} />}
        title="Erreur"
        message={data?.message || 'Une erreur est survenue. Réessayez dans un moment.'}
      />
    );
  }

  // ─── Not found ────────────────────────────────────────────────────
  if (data.status === 'not_found') {
    return (
      <ErrorScreen
        icon={<AlertCircle style={{ color: QRTAGS_RED }} />}
        title="QR code invalide"
        message="Ce code QR n'existe pas dans notre système."
      />
    );
  }

  // ─── Blocked ──────────────────────────────────────────────────────
  if (data.status === 'blocked') {
    return (
      <ErrorScreen
        icon={<Shield style={{ color: QRTAGS_RED }} />}
        title="QR code bloqué"
        message="Ce QR code a été bloqué par l'agence."
      />
    );
  }

  // ─── Pending activation ──────────────────────────────────────────
  if (data.status === 'pending_activation') {
    return (
      <main className="min-h-screen py-8 px-4" style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_INK }}>
        <div className="max-w-md mx-auto">
          <div className={`${CARD_CLASS} text-center space-y-4`}>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#134288]/10 mb-2">
              <Clock className="w-12 h-12" style={{ color: QRTAGS_INK }} />
            </div>
            <h1 className="text-2xl font-black text-[#134288]">QR code en attente d'activation</h1>
            <p className="text-sm text-slate-600">
              Ce QR code appartient à{' '}
              <strong className="text-[#134288]">{data.agency?.name || 'un établissement'}</strong>{' '}
              mais n'a pas encore été activé.
            </p>
            <div className="bg-[#32ba5d]/10 border-2 border-[#32ba5d]/30 rounded-xl p-4 text-left">
              <p className="text-sm font-bold text-[#134288] mb-2">📋 Pour le staff de l'établissement :</p>
              <p className="text-xs text-slate-700 mb-3">
                Ce QR est en stock. Pour l'activer, connectez-vous à votre espace agence
                et faites le check-in du client :
              </p>
              <ol className="text-xs text-slate-700 space-y-1 list-decimal list-inside">
                <li>Connectez-vous sur <strong>/agence/connexion</strong></li>
                <li>Allez dans <strong>Check-in</strong></li>
                <li>Scannez ce QR ou saisissez la référence</li>
                <li>Remplissez les infos client (nom, chambre, dates...)</li>
              </ol>
            </div>
            <p className="text-xs text-slate-500">
              Référence : <span className="font-mono font-bold">{reference}</span>
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 rounded-lg bg-[#134288] text-white font-bold text-sm hover:bg-[#0d3266] transition"
            >
              Retour à l'accueil
            </a>
          </div>
        </div>
      </main>
    );
  }

  // ─── Expired ──────────────────────────────────────────────────────
  if (data.status === 'expired') {
    return (
      <ErrorScreen
        icon={<Clock style={{ color: QRTAGS_RED }} />}
        title="QR code expiré"
        message={`Ce QR code a expiré (séjour terminé)${data.agency?.name ? ` à ${data.agency.name}` : ''}.`}
      />
    );
  }

  // ─── Active / Lost → main finder page ─────────────────────────────
  const agency = data.agency;
  const agencyName = agency?.name || 'l\'établissement';
  const contactPhone = agency?.contactPhone;
  const isLost = data.isLost;

  return (
    <main className="min-h-screen py-8 px-4" style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_INK }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Logo QRTagsPro */}
          <div className="bg-white inline-block px-6 py-3 rounded-lg mb-4 shadow-lg border-2 border-[#134288]">
            <QRTagsLogo size="md" variant="light" />
          </div>

          {/* Logo de l'agence (si configuré) */}
          {agency?.logoUrl && (
            <div className="mb-4">
              <img
                src={agency.logoUrl}
                alt={agencyName}
                className="h-20 w-auto mx-auto object-contain bg-white rounded-xl p-3 shadow-lg border-2 border-[#134288]"
              />
            </div>
          )}

          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-4 border-2 border-[#134288]">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: isLost ? QRTAGS_RED : QRTAGS_GREEN }}
            />
            <span className="text-black font-bold text-sm">
              {isLost ? 'Objet signalé perdu' : 'Objet trouvé'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-black mb-2">
            🎯 {isLost ? 'OBJET PERDU' : 'OBJET TROUVÉ'}
          </h1>
          <p className="text-black/80">
            Référence : <span className="font-bold text-black">{reference}</span>
          </p>
        </div>

        {/* Carte: objet appartient à l'agence */}
        <div className={`${CARD_CLASS} mb-6`}>
          <div className="flex items-start gap-3 mb-4">
            <Building2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: QRTAGS_INK }} />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-black mb-1">
                Cet objet appartient à
              </h2>
              <p className="text-2xl font-black text-black">{agencyName}</p>
            </div>
          </div>

          {/* Privacy notice */}
          <div className="bg-gray-50 rounded-lg p-3 border-2 border-black/10 text-sm">
            <p className="text-black/70">
              🔒 Pour des raisons de confidentialité, les coordonnées du client
              ne sont pas affichées. Veuillez contacter directement{' '}
              <strong className="text-black">{agencyName}</strong> pour organiser
              la restitution.
            </p>
          </div>

          {isLost && (
            <div
              className="mt-3 p-3 rounded-lg border-2 text-sm"
              style={{ backgroundColor: '#FEE2E2', borderColor: QRTAGS_RED, color: QRTAGS_INK }}
            >
              <p className="font-bold" style={{ color: QRTAGS_RED }}>
                🚨 Cet objet est signalé perdu par l'établissement.
              </p>
              <p className="mt-1">
                Merci de contacter {agencyName} rapidement pour faciliter la restitution.
              </p>
            </div>
          )}
        </div>

        {/* Carte: GPS automatique */}
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
                    Vous pouvez quand même remplir le formulaire ci-dessous et
                    indiquer le lieu manuellement.
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

        {/* Carte: formulaire trouveur */}
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
              <div className="flex">
                <span className="inline-flex items-center px-3 py-3 rounded-l-lg bg-[#134288] text-white font-bold text-sm border-2 border-r-0 border-[#134288]">
                  {dialCode}
                </span>
                <input
                  type="tel"
                  value={finderPhone}
                  onChange={(e) => setFinderPhone(e.target.value)}
                  placeholder="6 12 34 56 78"
                  className={`${INPUT_CLASS} rounded-l-none border-l-0`}
                />
              </div>
              <p className="text-xs text-black/60 mt-1">
                Pays détecté : {country} — tapez juste votre numéro local
              </p>
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
                <MessageCircle className="w-3 h-3 inline mr-1" /> Message à l'établissement (optionnel)
              </label>
              <textarea
                rows={3}
                value={finderMessage}
                onChange={(e) => setFinderMessage(e.target.value)}
                placeholder="Ex: J'ai trouvé cet objet ce matin dans le hall..."
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>
          </div>

          {/* Bouton WhatsApp vers la RÉCEPTION */}
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
                Contacter {agencyName} via WhatsApp
              </>
            )}
          </button>

          <p className="text-xs text-black/60 text-center mt-4">
            Votre message sera envoyé à la réception de {agencyName} via WhatsApp
            (clic-vers-chat). Aucune autre notification n'est envoyée.
          </p>

          {contactPhone && (
            <p className="text-xs text-black/50 text-center mt-2">
              📞 Téléphone direct : {contactPhone}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-black/70 hover:text-black text-sm">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </a>
          <p className="text-black/70 text-sm mt-2">
            Propulsé par <span className="font-bold text-black">QRTagsPro</span>
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
              WhatsApp s'est ouvert dans un nouvel onglet avec le message pré-rempli
              pour {agencyName}. Cliquez sur "Envoyer" dans WhatsApp pour finaliser.
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
                  <Building2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: QRTAGS_INK }} />
                  <span>{agencyName} vous répondra pour organiser la restitution</span>
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

// ─── Error screen component ─────────────────────────────────────────
function ErrorScreen({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: QRTAGS_BG }}>
      <div className={`${CARD_CLASS} max-w-md w-full text-center`}>
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
          {icon}
        </div>
        <h1 className="text-2xl font-black text-black mb-3">{title}</h1>
        <p className="text-black/70 mb-6">{message}</p>
        <a
          href="/"
          className="inline-block px-6 py-3 rounded-lg bg-black text-[#E3B23C] font-bold"
        >
          Retour à l'accueil
        </a>
      </div>
    </main>
  );
}
