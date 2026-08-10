'use client';

import { useState } from 'react';
import { Loader2, Pencil, Eye, EyeOff, Trash2 } from 'lucide-react';
import { togglePartnerStatus, deletePartner } from '../actions';
import { type PartnerSummary } from '../constants';
import PartnerForm from './PartnerForm';

// ─── Icônes par catégorie ───────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  RESTAURANT: '🍽️',
  ATTRACTION: '🏛️',
  BEACH: '🏖️',
  SHOPPING: '🛍️',
  HEALTH: '💊',
  TRANSPORT: '🚖',
  EXCURSION: '⛴️',
};

const CATEGORY_LABELS: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  ATTRACTION: 'Attraction',
  BEACH: 'Plage',
  SHOPPING: 'Shopping',
  HEALTH: 'Santé',
  TRANSPORT: 'Transport',
  EXCURSION: 'Excursion',
};

// ─── Composant ──────────────────────────────────────────────────────────────

interface PartnerCardProps {
  partner: PartnerSummary;
  onRefresh: () => void;
}

export default function PartnerCard({ partner, onRefresh }: PartnerCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setToggling(true);
    setError(null);
    const result = await togglePartnerStatus(partner.id);
    setToggling(false);
    if (!result.success) {
      setError(result.error || 'Échec du changement de statut.');
    } else {
      onRefresh();
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer définitivement « ${partner.name} » ?\n\nCette action est irréversible.`)) {
      return;
    }
    setDeleting(true);
    setError(null);
    const result = await deletePartner(partner.id);
    setDeleting(false);
    if (!result.success) {
      setError(result.error || 'Échec de la suppression.');
    } else {
      onRefresh();
    }
  };

  return (
    <>
      <div
        className={`bg-white dark:bg-slate-900 border rounded-xl p-4 transition-all ${
          partner.isActive
            ? 'border-slate-200 dark:border-slate-800'
            : 'border-slate-200 dark:border-slate-800 opacity-60'
        }`}
      >
        {/* ─── En-tête ─── */}
        <div className="flex items-start gap-3">
          <div className="text-2xl bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
            {CATEGORY_ICONS[partner.category] || '📍'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white truncate">{partner.name}</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  partner.isActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {partner.isActive ? 'ACTIF' : 'MASQUÉ'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {CATEGORY_LABELS[partner.category] || partner.category} · ⭐ {partner.rating.toFixed(1)}
            </p>
            {partner.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                {partner.description}
              </p>
            )}
            {partner.promoCode && (
              <p className="text-[11px] text-[#134288] dark:text-[#32ba5d] font-bold mt-1.5">
                🎁 Code: {partner.promoCode}
                {partner.commission > 0 && ` (${partner.commission}% com.)`}
              </p>
            )}
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
              📍 {partner.latitude.toFixed(4)}, {partner.longitude.toFixed(4)}
            </p>
          </div>
        </div>

        {/* ─── Erreur ─── */}
        {error && (
          <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-2 text-xs">
            ⚠️ {error}
          </div>
        )}

        {/* ─── Actions ─── */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            Modifier
          </button>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {toggling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : partner.isActive ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                Masquer
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                Afficher
              </>
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition flex items-center justify-center disabled:opacity-50"
            aria-label="Supprimer"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ─── Modal d'édition ─── */}
      {isEditing && (
        <PartnerForm
          partner={partner}
          onClose={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
