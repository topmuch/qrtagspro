'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAgency } from '../layout';
import {
  getAgencyBraceletOrders,
  getBraceletAnalytics,
  type AgencyOrderSummary,
  type BraceletAnalyticsData,
} from './actions';
import OrdersList from './components/OrdersList';
import Analytics from './components/Analytics';
import Link from 'next/link';
import { Package, Plus, ShoppingBag, Loader2 } from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  totalBracelets: number;
  activatedBracelets: number;
  totalScans: number;
}

export default function AgencyBraceletsPage() {
  const { agencyId } = useAgency();
  const [orders, setOrders] = useState<AgencyOrderSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<BraceletAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    setError(null);

    try {
      const [ordersResult, analyticsResult] = await Promise.all([
        getAgencyBraceletOrders(),
        getBraceletAnalytics(),
      ]);

      if (!ordersResult.success) {
        setError(ordersResult.error || 'Erreur de chargement');
        return;
      }

      setOrders(ordersResult.orders || []);
      setStats(ordersResult.stats || null);

      if (analyticsResult.success && analyticsResult.data) {
        setAnalytics(analyticsResult.data);
      }
    } catch (err) {
      console.error('Erreur dashboard bracelets:', err);
      setError('Une erreur est survenue lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── États de chargement ───
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#134288] dark:text-[#32ba5d]" />
        <span className="ml-3 text-slate-600 dark:text-slate-300">
          Chargement de vos bracelets...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          Une erreur est survenue
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
        <button
          onClick={loadData}
          className="px-6 py-3 bg-[#134288] text-white font-bold rounded-xl hover:bg-[#0f3670] transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // ─── État vide : aucune commande ───
  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader />
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#134288]/10 flex items-center justify-center">
            <Package className="w-8 h-8 text-[#134288] dark:text-[#32ba5d]" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            Aucune commande de bracelets
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Vous n&apos;avez pas encore commandé de bracelets All-Inclusive.
            Passez votre première commande pour commencer à distribuer des QR codes
            à vos clients.
          </p>
          <Link
            href="/shop/bracelets"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#32ba5d] text-black font-bold rounded-xl hover:bg-[#2ba14f] transition"
          >
            <ShoppingBag className="w-5 h-5" />
            Commander des bracelets
          </Link>
        </div>
      </div>
    );
  }

  // ─── État normal : dashboard avec stats + analytics + liste ───
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader />

      {/* ─── Stats Cards ─── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Commandes"
            value={stats.totalOrders}
            icon={<ShoppingBag className="w-5 h-5" />}
          />
          <StatCard
            label="Bracelets total"
            value={stats.totalBracelets}
            icon={<Package className="w-5 h-5" />}
          />
          <StatCard
            label="QR codes activés"
            value={stats.activatedBracelets}
            subtitle={`sur ${stats.totalBracelets}`}
          />
          <StatCard
            label="Scans total"
            value={stats.totalScans}
          />
        </div>
      )}

      {/* ─── Analytics ─── */}
      {analytics && <Analytics data={analytics} />}

      {/* ─── Liste des commandes ─── */}
      <OrdersList orders={orders} onRefresh={loadData} />

      {/* ─── CTA commande supplémentaire ─── */}
      <div className="text-center pt-4">
        <Link
          href="/shop/bracelets"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#134288] text-white font-bold rounded-xl hover:bg-[#0f3670] transition"
        >
          <Plus className="w-5 h-5" />
          Commander d&apos;autres bracelets
        </Link>
      </div>
    </div>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
          Gestion des Bracelets
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Suivez vos commandes, activez vos QR codes et consultez vos statistiques
        </p>
      </div>
      <Link
        href="/shop/bracelets"
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#32ba5d] text-black font-semibold rounded-xl hover:bg-[#2ba14f] transition text-sm self-start"
      >
        <Plus className="w-4 h-4" />
        Nouvelle commande
      </Link>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string;
  value: number;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {label}
        </p>
        {icon && (
          <span className="text-[#134288] dark:text-[#32ba5d]">{icon}</span>
        )}
      </div>
      <p className="text-2xl font-black text-slate-900 dark:text-white">
        {value.toLocaleString('fr-FR')}
      </p>
      {subtitle && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
