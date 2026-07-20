'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Plane,
  Train,
  Ship,
  Bus,
  Eye,
} from 'lucide-react';

// ─── Brand constants ───
const BRAND = '#111111';
const ACCENT = '#E3B23C';
const INK = '#1a1a1a';

interface ShareData {
  reference: string;
  travelerName: string;
  type: string;
  transportMode: string;
  flightNumber: string | null;
  airlineName: string | null;
  trainNumber: string | null;
  trainCompany: string | null;
  shipName: string | null;
  busCompany: string | null;
  busLineNumber: string | null;
  destination: string | null;
  status: string;
  lastScanDate: string | null;
  lastLocation: string | null;
  declaredLostAt: string | null;
  foundAt: string | null;
  expiresAt: string | null;
  scans: Array<{
    location: string | null;
    city: string | null;
    country: string | null;
    scannedAt: string;
    finderName: string | null;
  }>;
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
        } else {
          setData(d);
        }
      })
      .catch(() => setError('Erreur réseau'))
      .finally(() => setLoading(false));
  }, [token]);

  // ─── Loading ───
  if (loading) {
    return (
      <main className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white/20 border-t-[#E3B23C] rounded-full mx-auto mb-4" />
          <p className="text-lg text-white">Chargement du suivi...</p>
        </div>
      </main>
    );
  }

  // ─── Error ───
  if (error) {
    return (
      <main className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2" style={{ color: INK }}>Lien invalide</h1>
          <p className="mb-6" style={{ color: INK, opacity: 0.7 }}>{error}</p>
          <p className="text-sm" style={{ color: INK, opacity: 0.6 }}>
            Le propriétaire a peut-être révoqué ce lien, ou celui-ci n&apos;existe pas.
          </p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  // ─── Compute status info ───
  const isLost = data.status === 'lost' || (data.declaredLostAt && !data.foundAt);
  const isFound = data.foundAt;
  const transportIcon = data.transportMode === 'flight' ? Plane
    : data.transportMode === 'train' ? Train
    : data.transportMode === 'boat' ? Ship
    : data.transportMode === 'bus' ? Bus
    : Plane;
  const TransportIcon = transportIcon;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusBadge = isLost
    ? { label: '🚨 Perdu', color: 'bg-red-600 text-white' }
    : isFound
    ? { label: '✅ Trouvé', color: 'bg-green-600 text-white' }
    : data.lastScanDate
    ? { label: '📍 Scanné', color: 'bg-[#E3B23C] text-[#1a1a1a]' }
    : { label: '🛡️ Protégé', color: 'bg-[#1a1a1a] text-[#E3B23C]' };

  return (
    <main className="min-h-screen bg-[#111111] flex flex-col">
      {/* Header — indique que c'est une vue partagée (lecture seule) */}
      <header className="bg-[#1a1a1a] py-2 px-4">
        <div className="max-w-md mx-auto flex items-center justify-center gap-2 text-[#E3B23C] text-xs">
          <Eye className="w-4 h-4" />
          <span className="font-medium">Vue partagée — Lecture seule uniquement</span>
        </div>
      </header>

      <div className="max-w-md mx-auto w-full px-4 py-6 pb-12 space-y-4">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-1">Suivi du bagage</h1>
          <p className="text-white/70 text-sm">Partagé par le propriétaire</p>
        </div>

        {/* Status badge */}
        <div className="text-center">
          <span className={`inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-bold ${statusBadge.color}`}>
            {statusBadge.label}
          </span>
        </div>

        {/* Owner info (limited) */}
        <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
          <h2 className="text-xs uppercase tracking-widest text-[#1a1a1a] font-bold mb-3 flex items-center gap-2">
            <span>👤</span> Propriétaire
          </h2>
          <p className="text-lg font-bold" style={{ color: INK }}>{data.travelerName}</p>
          <p className="text-xs mt-1" style={{ color: INK, opacity: 0.6 }}>
            🔒 Pour contacter le propriétaire, demandez-lui directement.
          </p>
        </div>

        {/* Travel info */}
        <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
          <h2 className="text-xs uppercase tracking-widest text-[#1a1a1a] font-bold mb-3 flex items-center gap-2">
            <TransportIcon className="w-4 h-4" />
            Informations de voyage
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#1a1a1a]/70">Référence</span>
              <span className="font-mono font-bold" style={{ color: INK }}>{data.reference}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#1a1a1a]/70">Destination</span>
              <span className="font-bold" style={{ color: INK }}>{data.destination || '—'}</span>
            </div>
            {data.flightNumber && (
              <div className="flex items-center justify-between">
                <span className="text-[#1a1a1a]/70">Vol</span>
                <span className="font-mono font-bold" style={{ color: INK }}>{data.airlineName} {data.flightNumber}</span>
              </div>
            )}
            {data.trainNumber && (
              <div className="flex items-center justify-between">
                <span className="text-[#1a1a1a]/70">Train</span>
                <span className="font-mono font-bold" style={{ color: INK }}>{data.trainCompany} {data.trainNumber}</span>
              </div>
            )}
            {data.shipName && (
              <div className="flex items-center justify-between">
                <span className="text-[#1a1a1a]/70">Navire</span>
                <span className="font-bold" style={{ color: INK }}>{data.shipName}</span>
              </div>
            )}
            {data.busCompany && (
              <div className="flex items-center justify-between">
                <span className="text-[#1a1a1a]/70">Bus</span>
                <span className="font-bold" style={{ color: INK }}>{data.busCompany}</span>
              </div>
            )}
          </div>
        </div>

        {/* Last scan info */}
        <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
          <h2 className="text-xs uppercase tracking-widest text-[#1a1a1a] font-bold mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Dernier scan
          </h2>
          {data.lastScanDate ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#1a1a1a]/70">Date</span>
                <span className="font-bold" style={{ color: INK }}>{formatDate(data.lastScanDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#1a1a1a]/70">Lieu</span>
                <span className="font-bold" style={{ color: INK }}>{data.lastLocation || 'Non précisé'}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: INK, opacity: 0.6 }}>
              Aucun scan enregistré pour le moment.
            </p>
          )}
        </div>

        {/* Scan history (limited to 5) */}
        {data.scans.length > 0 && (
          <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
            <h2 className="text-xs uppercase tracking-widest text-[#1a1a1a] font-bold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Historique récent ({data.scans.length})
            </h2>
            <div className="space-y-2">
              {data.scans.slice(0, 5).map((scan, idx) => (
                <div key={idx} className="border-l-2 border-[#111111]/30 pl-3 py-1">
                  <p className="text-xs font-bold" style={{ color: INK }}>
                    {formatDate(scan.scannedAt)}
                  </p>
                  <p className="text-xs" style={{ color: INK, opacity: 0.7 }}>
                    📍 {[scan.city, scan.country].filter(Boolean).join(', ') || scan.location || 'Lieu non précisé'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trust note */}
        <div className="text-center text-xs text-white/70 tracking-wide flex items-center justify-center gap-1.5 pt-2">
          <Shield className="w-4 h-4 inline" />
          <span>Suivi QRTags — vue partagée en lecture seule</span>
        </div>

        {/* QRTags link */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-block text-xs text-[#E3B23C] hover:underline"
          >
            En savoir plus sur QRTags →
          </Link>
        </div>
      </div>
    </main>
  );
}
