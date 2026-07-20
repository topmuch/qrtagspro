'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Luggage, Search, ArrowRight, Clock, MapPin, Shield } from 'lucide-react';

interface BaggageItem {
  reference: string;
  type: string;
  status: string;
  travelerName: string;
  lastScanDate: string | null;
  lastLocation: string | null;
  lastScanLocation: string | null;
  scanCount: number;
  trackingToken: string | null;
  expiresAt: string | null;
  objectInfo?: {
    object_name?: string | null;
    category_label?: string | null;
    color?: string | null;
  } | null;
}

export default function MesBagagesPage() {
  const [baggages, setBaggages] = useState<BaggageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Load baggages from localStorage (références consultées)
  useEffect(() => {
    const refs = JSON.parse(localStorage.getItem('qrbag_my_references') || '[]');
    if (refs.length === 0) {
      setLoading(false);
      return;
    }
    // Fetch all baggages
    Promise.all(
      refs.map((ref: string) =>
        fetch(`/api/suivi/${ref}`).then(r => r.ok ? r.json() : null).catch(() => null)
      )
    ).then(results => {
      const valid: BaggageItem[] = results
        .filter(r => r && r.baggage)
        .map(r => ({
          reference: r.baggage.reference,
          type: r.baggage.type,
          status: r.baggage.status,
          travelerName: r.baggage.travelerName,
          lastScanDate: r.baggage.lastScanDate,
          lastLocation: r.baggage.lastLocation,
          lastScanLocation: r.baggage.lastScanLocation,
          scanCount: r.baggage.scanCount || 0,
          trackingToken: r.baggage.trackingToken || null,
          expiresAt: r.baggage.expiresAt,
          objectInfo: r.baggage.objectInfo || null,
        }));
      setBaggages(valid);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const filtered = baggages.filter(b =>
    b.reference.toLowerCase().includes(search.toLowerCase()) ||
    b.travelerName.toLowerCase().includes(search.toLowerCase()) ||
    (b.objectInfo?.object_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.lastScanLocation || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'activated':
        return 'bg-green-500 text-white';
      case 'scanned': return 'bg-[#E3B23C] text-[#1a1a1a]';
      case 'lost': return 'bg-red-600 text-white';
      case 'found': return 'bg-green-600 text-white';
      case 'blocked': return 'bg-slate-500 text-white';
      default: return 'bg-slate-300 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
      case 'activated':
        return '🛡️ Actif';
      case 'lost': return '🚨 Perdu';
      case 'found': return '✅ Trouvé';
      case 'scanned': return '📍 Scanné';
      default: return status;
    }
  };

  return (
    <main className="min-h-screen bg-[#111111] flex flex-col">
      <header className="bg-[#111111] border-b border-[#E3B23C]/30 py-4 px-4">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <Luggage className="w-5 h-5 text-[#E3B23C]" />
          <h1 className="text-lg font-bold text-white">Mes bagages</h1>
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-6 pb-20">
        {loading ? (
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-[#E3B23C] rounded-full mx-auto mb-3" />
            <p className="text-white/70 text-sm">Chargement...</p>
          </div>
        ) : baggages.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-8 text-center">
            <Luggage className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-700 mb-2">Aucun bagage enregistré</h2>
            <p className="text-sm text-slate-500 mb-6">
              Activez un QR code QRTags pour le voir apparaître ici.
            </p>
            <Link href="/inscrire" className="inline-block bg-[#111111] text-white px-6 py-3 rounded-xl font-bold">
              Activer un QR code
            </Link>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher (référence, nom, destination)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-2 border-[#1a1a1a] text-[#1a1a1a] text-sm focus:ring-2 focus:ring-[#E3B23C]"
              />
            </div>

            {/* Baggage list */}
            <div className="space-y-3">
              {filtered.map((baggage) => {
                // Si l'utilisateur a un trackingToken, on privilégie /track/[token]
                // (page de suivi propriétaire). Sinon, fallback /suivi/[reference].
                const trackHref = baggage.trackingToken
                  ? `/track/${baggage.trackingToken}`
                  : `/suivi/${baggage.reference}`;
                return (
                  <Link
                    key={baggage.reference}
                    href={trackHref}
                    className="block bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4 hover:bg-[#E3B23C]/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-[#1a1a1a]">{baggage.reference}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(baggage.status)}`}>
                        {getStatusLabel(baggage.status)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">{baggage.travelerName}</p>
                    {baggage.objectInfo?.object_name && (
                      <p className="text-xs text-slate-700 font-semibold">
                        📦 {baggage.objectInfo.object_name}
                        {baggage.objectInfo.color ? ` · ${baggage.objectInfo.color}` : ''}
                      </p>
                    )}
                    {baggage.lastScanLocation && (
                      <p className="text-xs text-slate-500">📍 {baggage.lastScanLocation}</p>
                    )}
                    {baggage.scanCount > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        👁️ {baggage.scanCount} scan{baggage.scanCount > 1 ? 's' : ''}
                      </p>
                    )}
                    {baggage.lastScanDate && (
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Dernier scan: {new Date(baggage.lastScanDate).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    <div className="flex items-center justify-end mt-2">
                      <span className="text-xs font-bold text-[#111111] flex items-center gap-1">
                        Voir le suivi <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
