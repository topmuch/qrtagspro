'use client';

import { useState } from 'react';
import { QrCode, AlertCircle, Loader2, X } from 'lucide-react';
import { activateBracelets } from '../actions';
import type { AgencyOrderSummary } from '../actions';

interface ActivationModalProps {
  order: AgencyOrderSummary;
  onClose: () => void;
  onActivated: () => void;
}

const CONTEXT_OPTIONS = [
  { value: 'WRISTBAND', label: 'Bracelet de Séjour', description: 'Contenu adaptatif (carte, services, animations, recommandations)' },
  { value: 'ROOM', label: 'Chambre', description: 'Infos chambre + services hôtel' },
  { value: 'POOL', label: 'Piscine / Plage', description: 'Services piscine + bar' },
  { value: 'RESTAURANT', label: 'Restaurant', description: 'Menu + réservations' },
  { value: 'LOBBY', label: 'Lobby / Réception', description: 'Infos générales + conciergerie' },
];

export default function ActivationModal({ order, onClose, onActivated }: ActivationModalProps) {
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState('WRISTBAND');

  const handleActivate = async () => {
    setIsActivating(true);
    setError(null);

    try {
      const result = await activateBracelets(order.id, context);

      if (result.success) {
        onActivated();
      } else {
        setError(result.error || 'Erreur lors de l\'activation.');
      }
    } catch {
      setError('Une erreur inattendue est survenue.');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isActivating) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* ─── Header ─── */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#32ba5d]/10 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-[#32ba5d]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Activer les QR codes
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Génération de {order.quantity} QR codes uniques
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isActivating}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Récap commande ─── */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Pack commandé
              </p>
              <p className="text-slate-900 dark:text-white font-bold">
                {order.quantity} bracelets {order.isBranded ? 'brandés' : 'standard'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Statut
              </p>
              <p className="text-green-600 dark:text-green-400 font-semibold text-sm">
                ✓ Livré
              </p>
            </div>
          </div>
        </div>

        {/* ─── Sélecteur de contexte ─── */}
        <div className="mb-5">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
            Contexte d&apos;utilisation
          </label>
          <select
            value={context}
            onChange={(e) => setContext(e.target.value)}
            disabled={isActivating}
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:border-[#134288] dark:focus:border-[#32ba5d] outline-none transition disabled:opacity-50"
          >
            {CONTEXT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {CONTEXT_OPTIONS.find((o) => o.value === context)?.description}
          </p>
        </div>

        {/* ─── Info importante ─── */}
        <div className="bg-[#134288]/5 dark:bg-[#32ba5d]/5 border border-[#134288]/20 dark:border-[#32ba5d]/20 rounded-lg p-4 mb-5">
          <p className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
            <span className="text-[#134288] dark:text-[#32ba5d] shrink-0">ℹ️</span>
            <span>
              Cette action va générer{' '}
              <strong>{order.quantity} QR codes uniques</strong> au format
              <code className="mx-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">
                QRT&lt;YY&gt;-XXXXXX
              </code>
              et les lier à votre agence. Chaque QR restera actif 6 mois.
              Les bracelets seront prêts à être distribués à vos clients.
            </span>
          </p>
        </div>

        {/* ─── Erreur ─── */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-400 text-sm mb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ─── Actions ─── */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isActivating}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleActivate}
            disabled={isActivating}
            className="flex-1 py-3 bg-[#32ba5d] text-black font-bold rounded-lg hover:bg-[#2ba14f] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isActivating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Activation...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                Activer {order.quantity} QR
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
