'use client';

/**
 * QRTagsPro V4 — Page Finder Démo (formulaire réaliste)
 *
 * Le client potentiel remplit le formulaire après avoir scanné le QR de démo.
 * Fonctionnalités:
 *   - Géolocalisation automatique (GPS + Nominatim reverse geocoding)
 *   - Formulaire: nom, téléphone WhatsApp, lieu, message
 *   - Sauvegarde dans DemoScan (expiresAt = +2h)
 *   - Génération du lien WhatsApp WAME avec message pré-rempli
 *   - Ouverture dans un nouvel onglet
 *   - Page de succès
 *
 * Design: couleurs QRTagsPro (bleu #134288 + vert #32ba5d)
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Loader2, CheckCircle2, AlertCircle,
  MapPin, User, Phone, MessageCircle, Navigation, RefreshCw,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';
import { useCountryDetection, formatPhoneWithDialCode } from '@/hooks/useCountryDetection';

const DEMO_PHONE = '33600000000'; // Numéro fictif pour la démo WhatsApp

type GpsStatus = 'idle' | 'loading' | 'success' | 'error';
type Step = 'form' | 'success';

const INPUT_CLASS =
  'w-full px-4 py-3 border-2 border-[#134288] rounded-lg bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d] transition';

function DemoFinderContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('t') || 'DEMO-TEST';
  const { dialCode, country } = useCountryDetection();

  const [step, setStep] = useState<Step>('form');
  const [finderName, setFinderName] = useState('');
  const [finderPhone, setFinderPhone] = useState('');
  const [otherLocation, setOtherLocation] = useState('');
  const [finderMessage, setFinderMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // GPS
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAddress, setGpsAddress] = useState<string>('');

  // Auto GPS au chargement
  useEffect(() => {
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

        // Reverse geocoding via Nominatim (gratuit)
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
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!finderName.trim() || !finderPhone.trim()) {
      alert('Veuillez remplir votre nom et téléphone');
      return;
    }
    setIsSubmitting(true);

    const formattedPhone = formatPhoneWithDialCode(finderPhone, dialCode);
    const locationStr = otherLocation.trim() || gpsAddress || '';
    const mapsLink = gpsCoords
      ? `https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}`
      : locationStr;

    try {
      // 1. Sauvegarder dans DemoScan (expiresAt = +2h)
      await fetch('/api/demo/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finderName,
          finderPhone: formattedPhone,
          location: locationStr,
          mapsLink,
          message: finderMessage || null,
        }),
      });

      // 2. Générer le message WhatsApp
      const msg =
        `🎯 DÉMO QRTagsPro\n\n` +
        `Bonjour, j'ai trouvé un objet (réf. ${reference}).\n\n` +
        `📍 Ma position : ${mapsLink}\n` +
        (locationStr ? `📌 Adresse : ${locationStr}\n` : '') +
        `👤 Trouveur : ${finderName}\n` +
        `📞 Contact : ${formattedPhone}\n` +
        (finderMessage ? `💬 Message : ${finderMessage}\n` : '') +
        `\n— Message envoyé via la démo QRTagsPro`;

      const whatsappUrl = `https://wa.me/${DEMO_PHONE}?text=${encodeURIComponent(msg)}`;

      // 3. Ouvrir WhatsApp dans un nouvel onglet
      window.open(whatsappUrl, '_blank');

      // 4. Afficher la page de succès
      setStep('success');
    } catch (err) {
      console.error('Demo submit error:', err);
      alert('Erreur lors de l\'envoi');
    } finally {
      setIsSubmitting(false);
    }
  }, [finderName, finderPhone, otherLocation, gpsAddress, gpsCoords, finderMessage, reference, dialCode]);

  // ─── Succès ─────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#32ba5d] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border-2 border-[#134288] shadow-2xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#32ba5d]/15 mb-4">
            <CheckCircle2 className="w-12 h-12 text-[#32ba5d]" />
          </div>
          <h1 className="text-2xl font-black text-[#134288] mb-3">Message prêt !</h1>
          <p className="text-sm text-slate-600 mb-6">
            WhatsApp s'est ouvert dans un nouvel onglet avec un message pré-rempli.
            Cliquez sur "Envoyer" dans WhatsApp pour finaliser.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 border-2 border-[#134288]/20 text-left mb-6">
            <p className="text-xs font-bold text-[#134288] mb-2">📋 Prochaines étapes :</p>
            <ul className="text-sm text-slate-700 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#32ba5d] flex-shrink-0 mt-0.5" />
                <span>WhatsApp s'est ouvert avec le message pré-rempli</span>
              </li>
              <li className="flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-[#134288] flex-shrink-0 mt-0.5" />
                <span>Cliquez sur "Envoyer" dans WhatsApp</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#134288] flex-shrink-0 mt-0.5" />
                <span>Votre position GPS est incluse dans le message</span>
              </li>
            </ul>
          </div>
          <a
            href="/demo"
            className="inline-block w-full py-3 rounded-lg bg-[#134288] text-white font-bold hover:bg-[#0d3266] transition"
          >
            Retour à la démo
          </a>
        </div>
      </div>
    );
  }

  // ─── Formulaire ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#32ba5d] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white inline-block px-6 py-3 rounded-lg mb-4 shadow-lg border-2 border-[#134288]">
            <QRTagsLogo size="sm" />
          </div>
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-4 border-2 border-[#134288]">
            <div className="w-3 h-3 rounded-full animate-pulse bg-[#32ba5d]" />
            <span className="text-[#134288] font-bold text-sm">Démo QRTagsPro</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[#134288] mb-2">
            🎯 Objet trouvé
          </h1>
          <p className="text-[#134288]/80">
            Référence : <span className="font-bold">{reference}</span>
          </p>
        </div>

        {/* GPS */}
        <div className="bg-white rounded-xl p-6 shadow-xl border-2 border-[#134288] mb-6">
          <h3 className="text-lg font-bold text-[#134288] mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5" /> VOTRE POSITION GPS
          </h3>

          {gpsStatus === 'idle' && (
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-slate-600 text-sm">En attente...</p>
            </div>
          )}

          {gpsStatus === 'loading' && (
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[#134288]" />
              <p className="text-[#134288] font-bold">Détection de votre position...</p>
              <p className="text-sm text-slate-500 mt-2">Veuillez autoriser la géolocalisation</p>
            </div>
          )}

          {gpsStatus === 'success' && gpsCoords && (
            <div className="bg-green-50 rounded-lg p-4 border-2 border-[#32ba5d]">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5 text-[#32ba5d]" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#32ba5d] mb-1">Position détectée !</p>
                  <p className="text-[#134288] text-sm mb-2 break-words">{gpsAddress}</p>
                  <div className="bg-white rounded-md p-2 border border-[#32ba5d]">
                    <p className="text-xs text-slate-500">Coordonnées GPS</p>
                    <p className="text-[#134288] font-mono font-bold text-sm">
                      {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-sm font-bold hover:underline text-[#32ba5d]"
                  >
                    🗺️ Voir sur Google Maps →
                  </a>
                </div>
              </div>
            </div>
          )}

          {gpsStatus === 'error' && (
            <div className="bg-red-50 rounded-lg p-4 border-2 border-red-500">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-600" />
                <div>
                  <p className="font-bold text-red-600 mb-2">Géolocalisation indisponible</p>
                  <p className="text-[#134288] text-sm mb-3">
                    Vous pouvez remplir le formulaire ci-dessous et indiquer le lieu manuellement.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-xl p-6 shadow-xl border-2 border-[#134288] mb-6">
          <h3 className="text-lg font-bold text-[#134288] mb-4 flex items-center gap-2">
            <User className="w-5 h-5" /> VOS INFORMATIONS
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#134288] mb-2">
                <User className="w-3 h-3 inline mr-1" /> Votre nom *
              </label>
              <input
                type="text"
                required
                value={finderName}
                onChange={(e) => setFinderName(e.target.value)}
                placeholder="Votre nom complet"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#134288] mb-2">
                <Phone className="w-3 h-3 inline mr-1" /> Votre numéro WhatsApp *
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 py-3 rounded-l-lg bg-[#134288] text-white font-bold text-sm border-2 border-r-0 border-[#134288]">
                  {dialCode}
                </span>
                <input
                  type="tel"
                  required
                  value={finderPhone}
                  onChange={(e) => setFinderPhone(e.target.value)}
                  placeholder="6 12 34 56 78"
                  className={`${INPUT_CLASS} rounded-l-none border-l-0`}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Pays détecté : {country} — tapez juste votre numéro local
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#134288] mb-2">
                <MapPin className="w-3 h-3 inline mr-1" /> Lieu précis (optionnel)
              </label>
              <input
                type="text"
                value={otherLocation}
                onChange={(e) => setOtherLocation(e.target.value)}
                placeholder={gpsAddress ? `Pré-rempli: ${gpsAddress.slice(0, 40)}...` : 'Ex: Hall d\'accueil, réception...'}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#134288] mb-2">
                <MessageCircle className="w-3 h-3 inline mr-1" /> Message (optionnel)
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

          {/* Bouton WhatsApp */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full mt-6 px-6 py-4 rounded-lg font-bold text-lg text-white transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            style={{ backgroundColor: '#134288' }}
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
                Envoyer via WhatsApp
              </>
            )}
          </button>

          <p className="text-xs text-slate-500 text-center mt-4">
            📱 WhatsApp s'ouvrira avec un message pré-rempli. Données supprimées après 2h.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center">
          <a
            href="/demo"
            className="inline-flex items-center gap-2 text-[#134288] hover:underline text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la démo
          </a>
        </div>
      </div>
    </div>
  );
}

export default function DemoFinderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#32ba5d] flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#134288]" />
        </div>
      }
    >
      <DemoFinderContent />
    </Suspense>
  );
}
