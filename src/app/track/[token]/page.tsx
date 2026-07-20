'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  MapPin, Clock, Eye, Activity, AlertTriangle, CheckCircle2,
  Share2, Copy, Flag, ArrowLeft, Loader2, MessageCircle, X,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

// ─── Design tokens QRTags (fond jaune moutarde + cartes blanches) ───
const QRTAGS_BG       = '#E3B23C';
const QRTAGS_CARD     = '#FFFFFF';
const QRTAGS_INK      = '#111111';
const QRTAGS_RED      = '#DC2626';
const QRTAGS_GREEN    = '#16A34A';
const CARD_CLASS      = 'bg-white rounded-xl p-6 shadow-xl border-2 border-black';

interface ScanEntry {
  id: string;
  scannedAt: string | null;
  location: string | null;
  finderName: string | null;
  finderPhone: string | null;
  message: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface BaggageTracking {
  reference: string;
  type: string;
  travelerName: string;
  travelerFirstName: string | null;
  whatsappOwner: string | null;
  status: string;
  createdAt: string | null;
  expiresAt: string | null;
  lastScanDate: string | null;
  lastScanLocation: string | null;
  scanCount: number;
  isLost: boolean;
  lostReportedAt: string | null;
  lostMessage: string | null;
  agency: string | null;
  trackingToken: string;
}

interface TrackResponse {
  status: string;
  message?: string;
  baggage?: BaggageTracking;
  scans?: ScanEntry[];
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Jamais';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  } catch {
    return 'Date invalide';
  }
}

export default function TrackPage() {
  const params = useParams();
  const token = (params?.token as string) || '';

  const [data, setData] = useState<TrackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostMessage, setLostMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/track/${token}`, { cache: 'no-store' });
      const json: TrackResponse = await res.json();
      setData(json);
    } catch (err) {
      console.error('[track] fetch error:', err);
      setData({ status: 'error', message: 'Erreur réseau' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
    // Auto-refresh toutes les 30 secondes pour suivre en temps réel
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleShareWhatsApp = () => {
    if (!data?.baggage) return;
    const trackUrl = `${window.location.origin}/track/${data.baggage.trackingToken}`;
    const objectName = data.baggage.reference;
    const message =
      `📍 Je suis mon objet (${objectName}) avec QRTags !\n\n` +
      `Si je le perds, je pourrai le retrouver grâce à ce lien de suivi sécurisé.\n\n` +
      `🔗 ${trackUrl}\n\n` +
      `Protégez vos objets aussi : ${window.location.origin}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyLink = async () => {
    if (!data?.baggage) return;
    const trackUrl = `${window.location.origin}/track/${data.baggage.trackingToken}`;
    try {
      await navigator.clipboard.writeText(trackUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback mobile
      const input = document.createElement('input');
      input.value = trackUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeclareLost = async () => {
    if (!data?.baggage) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/track/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'declare_lost',
          lostMessage: lostMessage.trim() || null,
        }),
      });
      if (res.ok) {
        setShowLostModal(false);
        setLostMessage('');
        refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Erreur lors du signalement');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelLost = async () => {
    if (!data?.baggage) return;
    if (!confirm('Marquer cet objet comme retrouvé ?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/track/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_lost' }),
      });
      if (res.ok) {
        refresh();
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ─── États de chargement / erreur ────────────────────────────────
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

  if (!data || data.status !== 'active' || !data.baggage) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: QRTAGS_BG }}>
        <div className={`${CARD_CLASS} max-w-md w-full text-center`}>
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: QRTAGS_RED }} />
          <h1 className="text-2xl font-black text-black mb-3">Lien invalide</h1>
          <p className="text-black/70 mb-6">
            Ce lien de suivi n'existe pas, a été désactivé, ou l'objet a été supprimé.
          </p>
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

  const baggage = data.baggage;
  const scans = data.scans || [];
  const trackUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://qrtags.com'}/track/${baggage.trackingToken}`;

  return (
    <main className="min-h-screen py-8 px-4" style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_INK }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white inline-block px-6 py-3 rounded-lg mb-4 shadow-lg border-2 border-black">
            <QRTagsLogo size="md" variant="light" />
          </div>
          <h1 className="text-3xl font-black text-black mb-2">📍 SUIVI DE MON OBJET</h1>
          <p className="text-black/80">Suivez votre objet en temps réel</p>
        </div>

        {/* Carte principale : objet + statut */}
        <div className={`${CARD_CLASS} mb-6`}>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-black break-all">
                {baggage.reference}
              </h2>
              <p className="text-sm text-black/60 mt-1">
                {baggage.agency ? `Agence : ${baggage.agency}` : 'Tag individuel'}
                {' • '}
                Activé le {formatDate(baggage.createdAt)}
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: baggage.isLost ? QRTAGS_RED : QRTAGS_GREEN }}
            >
              {baggage.isLost ? '🚨 PERDU' : '✅ ACTIF'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-black/60 text-sm">Propriétaire</p>
              <p className="text-black font-bold">{baggage.travelerName || 'Anonyme'}</p>
            </div>
            <div>
              <p className="text-black/60 text-sm">Expire le</p>
              <p className="text-black font-bold">
                {baggage.expiresAt ? formatDate(baggage.expiresAt) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Statistiques de suivi */}
        <div className={`${CARD_CLASS} mb-6`}>
          <h3 className="text-lg font-bold text-black mb-4">📊 STATISTIQUES DE SUIVI</h3>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Eye className="w-5 h-5 mx-auto mb-1" style={{ color: QRTAGS_INK }} />
              <p className="text-3xl font-black text-black">{baggage.scanCount}</p>
              <p className="text-xs text-black/70 mt-1">Scans</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Activity className="w-5 h-5 mx-auto mb-1" style={{ color: QRTAGS_INK }} />
              <p className="text-3xl font-black text-black">{scans.length}</p>
              <p className="text-xs text-black/70 mt-1">Activités</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              {baggage.isLost ? (
                <>
                  <AlertTriangle className="w-5 h-5 mx-auto mb-1" style={{ color: QRTAGS_RED }} />
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

        {/* Message personnalisé de perte (si l'objet est perdu) */}
        {baggage.isLost && baggage.lostMessage && (
          <div
            className="mb-6 p-4 rounded-xl border-2"
            style={{ backgroundColor: '#FEE2E2', borderColor: QRTAGS_RED, color: QRTAGS_INK }}
          >
            <p className="text-sm font-bold mb-1" style={{ color: QRTAGS_RED }}>
              🚨 Message du propriétaire :
            </p>
            <p className="text-sm italic">"{baggage.lostMessage}"</p>
          </div>
        )}

        {/* Historique des scans */}
        <div className={`${CARD_CLASS} mb-6`}>
          <h3 className="text-lg font-bold text-black mb-4">📜 HISTORIQUE DES SCANS</h3>

          {scans.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">👁️</p>
              <p className="text-black font-bold">Aucun scan pour le moment</p>
              <p className="text-sm text-black/70 mt-2">
                Si quelqu'un trouve votre objet et scanne le QR code, vous serez notifié ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scans.map((scan, idx) => (
                <div
                  key={scan.id}
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
                  {scan.location && (
                    <p className="text-sm text-black/80 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {scan.location}
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

        {/* Actions rapides */}
        <div className={`${CARD_CLASS} mb-6`}>
          <h3 className="text-lg font-bold text-black mb-4">🎯 ACTIONS RAPIDES</h3>

          <div className="space-y-3">
            {/* Partager sur WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full px-6 py-4 rounded-lg font-bold text-lg bg-green-600 text-white hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" /> Partager ce lien sur WhatsApp
            </button>

            {/* Copier le lien */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full px-6 py-4 rounded-lg font-bold text-lg bg-black text-[#E3B23C] hover:bg-gray-900 transition flex items-center justify-center gap-2"
            >
              {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Lien copié !' : 'Copier le lien de suivi'}
            </button>

            {/* Afficher l'URL pour référence */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-black/60 mb-1">Votre lien privé de suivi :</p>
              <p className="text-xs font-mono text-black break-all">{trackUrl}</p>
              <p className="text-xs text-black/60 mt-2">
                ⚠️ <strong>Gardez ce lien secret.</strong> Il vous permet de suivre votre objet.
              </p>
            </div>

            {/* Signaler comme perdu / annuler */}
            {baggage.isLost ? (
              <button
                type="button"
                onClick={handleCancelLost}
                disabled={actionLoading}
                className="w-full px-6 py-4 rounded-lg font-bold text-lg bg-white text-black border-2 border-black hover:bg-gray-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                J'ai retrouvé mon objet
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowLostModal(true)}
                disabled={actionLoading}
                className="w-full px-6 py-4 rounded-lg font-bold text-lg text-white transition flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: QRTAGS_RED }}
              >
                <Flag className="w-5 h-5" /> Signaler comme PERDU
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mb-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-black/70 hover:text-black text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </a>
          <p className="text-black/70 text-sm mt-2">
            Propulsé par <span className="font-bold text-black">QRTags</span>
          </p>
        </div>
      </div>

      {/* Modal : Signaler comme perdu */}
      {showLostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full border-2 border-black shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-black flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" style={{ color: QRTAGS_RED }} />
                Signaler comme PERDU
              </h3>
              <button
                type="button"
                onClick={() => setShowLostModal(false)}
                className="text-black/60 hover:text-black"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-black/80 mb-4">
              Décrivez brièvement les circonstances de la perte. Ce message sera visible par vous
              sur cette page de suivi.
            </p>

            <textarea
              rows={4}
              value={lostMessage}
              onChange={(e) => setLostMessage(e.target.value)}
              placeholder="Ex : Perdu dans le hall de la gare de Dakar, vers 14h le 21/07."
              className="w-full px-4 py-3 border-2 border-black rounded-lg bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:border-[#E3B23C] focus:ring-2 focus:ring-[#E3B23C] resize-none"
            />

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowLostModal(false)}
                className="flex-1 px-4 py-3 rounded-lg font-bold bg-gray-200 text-black hover:bg-gray-300 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeclareLost}
                disabled={actionLoading}
                className="flex-1 px-4 py-3 rounded-lg font-bold text-white disabled:opacity-50 transition"
                style={{ backgroundColor: QRTAGS_RED }}
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                ) : (
                  'Confirmer la perte'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
