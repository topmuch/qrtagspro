'use client';

import {
  MapPin,
  Calendar,
  Plane,
  Train,
  Ship,
  Bus,
  User,
  Clock,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import type { SuiviData, BaggageInfo } from './types';

const INK = '#1a1a1a';

export function TabOverview({
  data,
  baggage,
  lang,
  t,
}: {
  data: SuiviData;
  baggage: BaggageInfo;
  lang: string;
  t: (key: string, params?: Record<string, string>) => string;
}) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const locale = lang === 'ar' ? 'ar-SA' : lang === 'en' ? 'en-US' : 'fr-FR';
    return new Date(dateStr).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const TransportIcon = baggage.transportMode === 'train' ? Train
    : baggage.transportMode === 'boat' ? Ship
    : baggage.transportMode === 'bus' ? Bus
    : Plane;

  return (
    <div className="space-y-3">
      {/* ─── Alerte expiration proche (≤ 3 jours) ─── */}
      {(() => {
        if (!baggage.expiresAt) return null;
        const now = new Date();
        const expiry = new Date(baggage.expiresAt);
        const diffMs = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return null; // déjà expiré — pas d'alerte ici
        if (diffDays > 3) return null; // plus de 3 jours — pas d'alerte

        return (
          <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-700">
                  ⏰ Votre QR code expire {diffDays === 0 ? "aujourd'hui" : diffDays === 1 ? 'demain' : `dans ${diffDays} jours`}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Date d&apos;expiration : {expiry.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Contactez votre agence ou QRTags pour prolonger la validité.
                </p>
                <a
                  href="mailto:contact@qrtags.com?subject=Prolongation QR Bag"
                  className="inline-block mt-2 bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
                >
                  Demander une prolongation
                </a>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Travel info */}
      <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
        <h2 className="text-xs uppercase tracking-widest font-bold mb-3 flex items-center gap-2" style={{ color: INK }}>
          <TransportIcon className="w-4 h-4" /> Informations de voyage
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Voyageur</span>
            <span className="font-bold" style={{ color: INK }}>{baggage.travelerName}</span>
          </div>
          {baggage.flightNumber && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Vol</span>
              <span className="font-mono font-bold" style={{ color: INK }}>{baggage.airlineName} {baggage.flightNumber}</span>
            </div>
          )}
          {baggage.trainNumber && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Train</span>
              <span className="font-mono font-bold" style={{ color: INK }}>{baggage.trainCompany} {baggage.trainNumber}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-500"><MapPin className="w-3.5 h-3.5 inline" /> Destination</span>
            <span className="font-bold" style={{ color: INK }}>{baggage.destination || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500"><Calendar className="w-3.5 h-3.5 inline" /> Départ</span>
            <span className="font-bold" style={{ color: INK }}>
              {formatDate(baggage.departureDate)}{baggage.departureTime ? ` — ${baggage.departureTime}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Last scan */}
      <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
        <h2 className="text-xs uppercase tracking-widest font-bold mb-3 flex items-center gap-2" style={{ color: INK }}>
          <Clock className="w-4 h-4" /> Dernier scan
        </h2>
        {baggage.lastScanDate ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Date</span>
              <span className="font-bold" style={{ color: INK }}>{formatDate(baggage.lastScanDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Lieu</span>
              <span className="font-bold" style={{ color: INK }}>{baggage.lastLocation || 'Non précisé'}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Aucun scan pour le moment.</p>
        )}
      </div>

      {/* Finder info */}
      {data.lastFinder && (data.lastFinder.name || data.lastFinder.phone) && (
        <div className="bg-green-600 border-2 border-green-700 rounded-2xl p-4">
          <h2 className="text-xs uppercase tracking-widest font-bold mb-3 text-white flex items-center gap-2">
            <User className="w-4 h-4" /> Trouveur
          </h2>
          <div className="space-y-2 text-sm">
            {data.lastFinder.name && (
              <div className="flex items-center justify-between">
                <span className="text-green-200">Nom</span>
                <span className="font-bold text-white">{data.lastFinder.name}</span>
              </div>
            )}
            {data.lastFinder.phone && (
              <div className="flex items-center justify-between">
                <span className="text-green-200">Téléphone</span>
                <a href={`tel:${data.lastFinder.phone}`} className="font-bold text-white underline" dir="ltr">
                  {data.lastFinder.phone}
                </a>
              </div>
            )}
          </div>
          <p className="text-xs text-green-100 mt-3 bg-green-700/50 rounded-lg p-2">
            💡 Allez dans l&apos;onglet <strong>Contact</strong> pour appeler ou envoyer un WhatsApp.
          </p>
        </div>
      )}

      {/* Trust note */}
      <div className="text-center text-xs text-white/60 flex items-center justify-center gap-1.5 pt-2">
        <Shield className="w-3 h-3" />
        <span>QRTags — Suivi sécurisé</span>
      </div>
    </div>
  );
}
