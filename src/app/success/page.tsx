'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle2, Home, MessageCircle, Copy, AlertCircle,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

const QRTAGS_BG       = '#E3B23C';
const QRTAGS_INK      = '#111111';
const CARD_CLASS      = 'bg-white rounded-xl p-6 shadow-xl border-2 border-black';
const INPUT_INFO_CLASS =
  'w-full px-4 py-3 border-2 border-black rounded-lg bg-gray-50 text-black';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activationData, setActivationData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('activationData');
    if (stored) {
      try {
        setActivationData(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const trackingToken = activationData?.trackingToken as string | undefined;
  const trackUrl =
    typeof window !== 'undefined' && trackingToken
      ? `${window.location.origin}/track/${trackingToken}`
      : '';

  const handleShareWhatsApp = () => {
    if (!trackingToken) return;
    const objectName = activationData?.objectName || activationData?.reference || 'mon objet';
    const message =
      `📍 Je suis ${objectName} avec QRTags !\n\n` +
      `Si je le perds, je pourrai le retrouver grâce à ce lien de suivi sécurisé.\n\n` +
      `🔗 ${trackUrl}\n\n` +
      `Protégez vos objets aussi : ${window.location.origin}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyLink = async () => {
    if (!trackUrl) return;
    try {
      await navigator.clipboard.writeText(trackUrl);
    } catch {
      const input = document.createElement('input');
      input.value = trackUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goToTrackingPage = () => {
    if (trackingToken) {
      router.push(`/track/${trackingToken}`);
    }
  };

  return (
    <main className="min-h-screen py-8 px-4" style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_INK }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white inline-block px-6 py-3 rounded-lg mb-4 shadow-lg border-2 border-black">
            <QRTagsLogo size="md" variant="light" />
          </div>
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: QRTAGS_INK }}
          >
            <CheckCircle2 className="w-12 h-12" style={{ color: QRTAGS_BG }} />
          </div>
          <h1 className="text-3xl font-black text-black mb-2">🎉 Votre QR code est activé !</h1>
          {activationData?.objectName && (
            <p className="text-base text-black/80 mb-1">
              Votre <strong>{activationData.objectName}</strong> est maintenant protégé.
            </p>
          )}
          <p className="text-sm text-black/70">
            Si vous le perdez, le trouveur pourra vous contacter directement sur WhatsApp
            {activationData?.whatsapp ? ` au ${activationData.whatsapp}` : ''}.
          </p>
        </div>

        {/* Carte : Référence + Expiration */}
        {activationData && (
          <div className={`${CARD_CLASS} mb-6`}>
            <h3 className="text-lg font-bold text-black mb-4">📋 DÉTAILS DE VOTRE TAG</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-black/60 mb-1">RÉFÉRENCE</p>
                <p className="font-mono font-bold text-sm text-black break-all">
                  {activationData.reference}
                </p>
              </div>
              {activationData.expiresAt && (
                <div>
                  <p className="text-xs font-bold text-black/60 mb-1">EXPIRE LE</p>
                  <p className="text-sm font-bold text-black">{formatDate(activationData.expiresAt)}</p>
                </div>
              )}
              {activationData.category && (
                <div className="col-span-2">
                  <p className="text-xs font-bold text-black/60 mb-1">CATÉGORIE</p>
                  <p className="text-sm font-bold text-black">{activationData.category}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Carte : Lien de suivi privé */}
        {trackingToken && (
          <div className={`${CARD_CLASS} mb-6`}>
            <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              🔗 VOTRE LIEN DE SUIVI PRIVÉ
            </h3>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg border-2 border-black">
              <p className="text-xs text-black/60 mb-1">Lien de suivi :</p>
              <p className="text-black font-bold text-sm break-all font-mono">{trackUrl}</p>
            </div>

            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7', border: '2px solid #111' }}>
              <p className="text-sm text-black flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Gardez ce lien secret !</strong> Il vous permet de suivre votre objet
                  en temps réel et de recevoir des notifications quand quelqu'un scanne le QR code.
                </span>
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full px-6 py-4 rounded-lg font-bold text-lg bg-green-600 text-white hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" /> Partager sur WhatsApp
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full px-6 py-4 rounded-lg font-bold text-lg bg-black text-[#E3B23C] hover:bg-gray-900 transition flex items-center justify-center gap-2"
              >
                {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Lien copié !' : 'Copier le lien'}
              </button>
            </div>
          </div>
        )}

        {/* Carte : Que faire maintenant ? */}
        <div className={`${CARD_CLASS} mb-6`}>
          <h3 className="text-lg font-bold text-black mb-4">🚀 QUE FAIRE MAINTENANT ?</h3>
          <ol className="space-y-3 text-sm text-black">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-[#E3B23C] flex items-center justify-center text-xs font-bold">1</span>
              <span>Collez le QR code physique sur votre objet (sur une face visible).</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-[#E3B23C] flex items-center justify-center text-xs font-bold">2</span>
              <span>
                <strong>Partagez ce lien de suivi sur WhatsApp</strong> et gardez-le en lieu sûr
                (favoris, notes).
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-[#E3B23C] flex items-center justify-center text-xs font-bold">3</span>
              <span>
                Si vous perdez l'objet, ouvrez le lien de suivi et cliquez sur
                <strong> « Signaler comme PERDU »</strong>. Vous pourrez suivre chaque scan en
                temps réel.
              </span>
            </li>
          </ol>
        </div>

        {/* Boutons d'action principaux */}
        <div className="space-y-3">
          {trackingToken && (
            <button
              type="button"
              onClick={goToTrackingPage}
              className="w-full px-6 py-4 rounded-lg font-bold text-lg bg-[#E3B23C] text-black border-2 border-black hover:bg-[#d4a535] transition flex items-center justify-center gap-2"
            >
              📍 Ouvrir ma page de suivi
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full px-6 py-4 rounded-lg font-bold text-lg bg-white text-black border-2 border-black hover:bg-gray-100 transition flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" /> Retour à l'accueil
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-black/70 text-sm">
            Propulsé par <span className="font-bold text-black">QRTags</span>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: '#E3B23C' }} />}>
      <SuccessContent />
    </Suspense>
  );
}
