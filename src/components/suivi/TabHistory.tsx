'use client';

import { useState } from 'react';
import { ChevronDown, MapPin, Clock, User } from 'lucide-react';
import type { ScanEntry } from './types';

export function TabHistory({
  scans,
  lang,
  t,
}: {
  scans: ScanEntry[];
  lang: string;
  t: (key: string, params?: Record<string, string>) => string;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleScans = showAll ? scans : scans.slice(0, 5);

  const formatDate = (dateStr: string) => {
    const locale = lang === 'ar' ? 'ar-SA' : lang === 'en' ? 'en-US' : 'fr-FR';
    return new Date(dateStr).toLocaleDateString(locale, {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (scans.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-6 text-center">
        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-600">Aucun scan enregistré</p>
        <p className="text-xs text-slate-400 mt-1">
          Les scans de votre QR code apparaîtront ici en temps réel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-[#1a1a1a] flex items-center gap-2">
            <Clock className="w-4 h-4" /> Historique des scans ({scans.length})
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {visibleScans.map((scan, idx) => (
            <div key={scan.id} className="p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#111111]/10 border border-[#111111]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[#111111]">{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1a1a1a]">{formatDate(scan.scannedAt)}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {[scan.city, scan.country].filter(Boolean).join(', ') || scan.location || 'Lieu non précisé'}
                </p>
                {scan.finderName && (
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3" />{scan.finderName}
                  </p>
                )}
                {scan.hasMap && scan.latitude && scan.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${scan.latitude},${scan.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-xs font-bold text-[#111111] hover:underline"
                  >
                    <MapPin className="w-3 h-3" />
                    📍 Voir sur Google Maps ({scan.latitude.toFixed(4)}, {scan.longitude.toFixed(4)})
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
        {scans.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-3 text-sm font-bold text-[#111111] bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1"
          >
            {showAll ? 'Réduire' : `Voir tout (${scans.length})`}
            <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
}
