'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, MapPin, Loader2, AlertCircle, RefreshCw, BarChart3 } from 'lucide-react';
import {
  getAgencyPartners,
  type PartnerSummary,
} from './actions';
import PartnerCard from './components/PartnerCard';
import PartnerForm from './components/PartnerForm';

// ─── Composant principal ────────────────────────────────────────────────────

export default function PartnersDashboardPage() {
  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    withPromo: number;
    byCategory: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAgencyPartners();
      if (!result.success) {
        setError(result.error || 'Erreur de chargement');
        return;
      }
      setPartners(result.partners || []);
      setStats(result.stats || null);
    } catch (err) {
      console.error('Erreur dashboard partenaires:', err);
      // Si la table n'existe pas encore, on affiche l'état vide
      setError(null);
      setPartners([]);
      setStats({ total: 0, active: 0, withPromo: 0, byCategory: {} });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── États ───
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#134288] dark:text-[#32ba5d]" />
        <span className="ml-3 text-slate-600 dark:text-slate-300">
          Chargement de vos partenaires…
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Mes Lieux Recommandés
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Gérez votre guide touristique local — ces lieux s&apos;affichent sur le bracelet de vos clients
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/agence/partenaires/stats"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition text-sm"
          >
            <BarChart3 className="w-4 h-4" />
            Statistiques
          </Link>
          <button
            onClick={loadData}
            className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Rafraîchir"
            aria-label="Rafraîchir"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#32ba5d] text-black font-bold rounded-xl hover:bg-[#2ba14f] transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter un lieu
          </button>
        </div>
      </div>

      {/* ─── Stats ─── */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="Total" value={stats.total} color="text-slate-900 dark:text-white" />
          <StatBox label="Actifs" value={stats.active} color="text-green-600 dark:text-green-400" />
          <StatBox label="Avec promo" value={stats.withPromo} color="text-[#134288] dark:text-[#32ba5d]" />
        </div>
      )}

      {/* ─── Liste des partenaires ─── */}
      {partners.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
            Aucun lieu ajouté
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Ajoutez vos restaurants, attractions et partenaires préférés. Ils apparaîtront
            automatiquement sur le bracelet de vos clients, triés par distance.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#32ba5d] text-black font-bold rounded-xl hover:bg-[#2ba14f] transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter mon premier lieu
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} onRefresh={loadData} />
          ))}
        </div>
      )}

      {/* ─── Astuce ─── */}
      {partners.length > 0 && partners.length < 3 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400">
          💡 <strong>Astuce :</strong> Plus vous ajoutez de lieux, plus le bracelet de vos clients
          sera riche. Visez au moins 5 partenaires pour couvrir les catégories essentielles
          (restaurant, attraction, plage, santé).
        </div>
      )}

      {/* ─── Modal formulaire ─── */}
      {showForm && (
        <PartnerForm
          partner={null}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// ─── Sous-composant ─────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">
        {label}
      </p>
    </div>
  );
}
