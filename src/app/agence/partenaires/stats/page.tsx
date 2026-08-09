'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  MousePointerClick,
  MapPin,
  TrendingUp,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Smartphone,
  Monitor,
  Tablet,
} from 'lucide-react';
import {
  getPartnerStats,
  type PartnerStat,
} from '../actions';

// ─── Icônes catégories ──────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  RESTAURANT: '🍽️',
  ATTRACTION: '🏛️',
  BEACH: '🏖️',
  SHOPPING: '🛍️',
  HEALTH: '💊',
  TRANSPORT: '🚖',
  EXCURSION: '⛴️',
};

interface Stats {
  totalClicks: number;
  uniquePartnersClicked: number;
  accumulatedCommissionPercent: number;
  byPartner: PartnerStat[];
  byDay: Array<{ date: string; count: number }>;
  byDevice: { MOBILE: number; TABLET: number; DESKTOP: number; UNKNOWN: number };
}

export default function PartnerStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPartnerStats();
      if (!result.success) {
        setError(result.error || 'Erreur de chargement');
        return;
      }
      setStats(result.stats || null);
    } catch (err) {
      console.error('Erreur stats partenaires:', err);
      setError('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#134288] dark:text-[#32ba5d]" />
        <span className="ml-3 text-slate-600 dark:text-slate-300">
          Calcul des statistiques…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Erreur</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
        <button
          onClick={loadData}
          className="px-6 py-3 bg-[#134288] text-white font-bold rounded-xl hover:bg-[#0f3670] dark:bg-[#32ba5d] dark:text-black dark:hover:bg-[#2ba14f] transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const maxDayCount = stats ? Math.max(...stats.byDay.map((d) => d.count), 1) : 1;
  const totalDevices = stats
    ? stats.byDevice.MOBILE + stats.byDevice.TABLET + stats.byDevice.DESKTOP + stats.byDevice.UNKNOWN
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3">
        <Link
          href="/agence/partenaires"
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          title="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#134288] dark:text-[#32ba5d]" />
            Statistiques Partenaires
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Performance de votre guide touristique — 30 derniers jours
          </p>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KpiCard
            label="Clics totaux"
            value={stats.totalClicks}
            icon={<MousePointerClick className="w-5 h-5" />}
            color="text-[#134288] dark:text-[#32ba5d]"
          />
          <KpiCard
            label="Lieux cliqués"
            value={stats.uniquePartnersClicked}
            icon={<MapPin className="w-5 h-5" />}
            color="text-green-600 dark:text-green-400"
          />
          <KpiCard
            label="Potentiel commission"
            value={`${stats.accumulatedCommissionPercent}%`}
            subtitle="clics × % com."
            icon={<TrendingUp className="w-5 h-5" />}
            color="text-blue-600 dark:text-blue-400"
          />
        </div>
      )}

      {/* ─── Graphique : clics par jour (7 derniers jours) ─── */}
      {stats && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">
            📈 Clics par jour (7 derniers jours)
          </h2>
          <div className="flex items-end justify-between gap-2 h-32">
            {stats.byDay.map((day, idx) => {
              const height = (day.count / maxDayCount) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full bg-[#134288]/70 dark:bg-[#32ba5d]/70 hover:bg-[#134288] dark:hover:bg-[#32ba5d] rounded-t transition-all relative group"
                      style={{ height: `${Math.max(height, day.count > 0 ? 8 : 2)}%` }}
                    >
                      {day.count > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition">
                          {day.count}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
                    {day.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Répartition par device ─── */}
      {stats && totalDevices > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">
            📱 Appareils utilisés
          </h2>
          <div className="grid grid-cols-4 gap-3">
            <DeviceStat icon={<Smartphone className="w-4 h-4" />} label="Mobile" count={stats.byDevice.MOBILE} total={totalDevices} />
            <DeviceStat icon={<Tablet className="w-4 h-4" />} label="Tablette" count={stats.byDevice.TABLET} total={totalDevices} />
            <DeviceStat icon={<Monitor className="w-4 h-4" />} label="Desktop" count={stats.byDevice.DESKTOP} total={totalDevices} />
            <DeviceStat icon={<Monitor className="w-4 h-4" />} label="Inconnu" count={stats.byDevice.UNKNOWN} total={totalDevices} />
          </div>
        </div>
      )}

      {/* ─── Top lieux ─── */}
      {stats && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            🏆 Top lieux ce mois-ci
          </h2>
          {stats.byPartner.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Aucune donnée pour le moment
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Les clics apparaîtront ici dès que vos clients utiliseront le bracelet
                pour découvrir vos partenaires recommandés.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.byPartner.map((stat, idx) => (
                <div
                  key={stat.partnerId}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl font-black text-[#134288] dark:text-[#32ba5d] w-7 shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="text-xl shrink-0">
                      {CATEGORY_ICONS[stat.category] || '📍'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {stat.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {stat.category}
                        {stat.commission > 0 && ` · ${stat.commission}% com.`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-[#134288] dark:text-[#32ba5d]">
                      {stat.clicks}
                    </p>
                    <p className="text-[10px] text-slate-400">clic{stat.clicks > 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Note explicative ─── */}
      {stats && stats.totalClicks === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400">
          💡 <strong>Comment ça marche ?</strong> Quand un client scanne son bracelet et
          clique sur « Y aller → » à côté d&apos;un de vos partenaires, un clic est enregistré.
          Ces données vous permettent de mesurer l&apos;intérêt de vos clients pour chaque lieu
          et de justifier vos commissions auprès des partenaires.
        </div>
      )}
    </div>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  subtitle,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {label}
        </p>
        <span className={color}>{icon}</span>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      {subtitle && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

function DeviceStat({
  icon,
  label,
  count,
  total,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="text-center">
      <div className="inline-flex p-2 bg-slate-100 dark:bg-slate-800 rounded-lg mb-1.5 text-slate-600 dark:text-slate-300">
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-900 dark:text-white">{count}</p>
      <p className="text-[10px] text-slate-400 dark:text-slate-500">
        {label} · {pct}%
      </p>
    </div>
  );
}
