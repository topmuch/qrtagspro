'use client';

import { useState, useCallback } from 'react';
import { X, Clock, Calendar, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ExtendValidityModalProps {
  reference: string;
  currentExpiry: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newExpiry: string) => void;
}

const QUICK_OPTIONS = [
  { label: '+ 7 jours', days: 7 },
  { label: '+ 1 mois', days: 30 },
  { label: '+ 3 mois', days: 90 },
  { label: '+ 1 an', days: 365 },
];

export function ExtendValidityModal({
  reference,
  currentExpiry,
  isOpen,
  onClose,
  onSuccess,
}: ExtendValidityModalProps) {
  const [selectedDays, setSelectedDays] = useState<number | null>(null);
  const [customDate, setCustomDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Illimité (pas de date d\'expiration)';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const computeNewDate = (): Date | null => {
    if (customDate) return new Date(customDate);
    if (selectedDays) {
      const now = new Date();
      let base: Date;
      if (currentExpiry && new Date(currentExpiry) > now) {
        base = new Date(currentExpiry);
      } else {
        base = now;
      }
      const result = new Date(base);
      result.setDate(result.getDate() + selectedDays);
      return result;
    }
    return null;
  };

  const newDate = computeNewDate();

  const handleExtend = useCallback(async () => {
    if (!newDate) {
      setError('Veuillez sélectionner une durée ou une date.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const body: Record<string, unknown> = { reference };
      if (customDate) {
        body.customDate = new Date(customDate).toISOString();
      } else if (selectedDays) {
        body.durationToAdd = selectedDays;
      }

      const res = await fetch('/api/admin/extend-validity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Validité prolongée !');
        setTimeout(() => {
          onSuccess(data.baggage.expiresAt);
          onClose();
          setSelectedDays(null);
          setCustomDate('');
          setSuccess('');
        }, 1500);
      } else {
        setError(data.error || 'Erreur lors de la prolongation');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [reference, newDate, customDate, selectedDays, onSuccess, onClose]);

  if (!isOpen) return null;

  const isUnlimited = !currentExpiry;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#111111]" />
            <h3 className="text-lg font-bold text-slate-900">Prolonger la validité</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
          <p className="text-xs text-slate-500 mb-1">Référence</p>
          <p className="font-mono font-bold text-slate-900">{reference}</p>
          <p className="text-xs text-slate-500 mt-2 mb-1">Expiration actuelle</p>
          <p className={`text-sm font-bold ${isUnlimited ? 'text-green-600' : 'text-slate-700'}`}>
            {formatDate(currentExpiry)}
          </p>
        </div>

        {isUnlimited && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-xs text-green-700">
            ℹ️ Ce QR n&apos;a pas de date d&apos;expiration. Vous pouvez en définir une.
          </div>
        )}

        {/* Quick options */}
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Durée rapide</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {QUICK_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => { setSelectedDays(opt.days); setCustomDate(''); }}
              className={`py-2.5 px-3 rounded-xl text-sm font-bold border-2 transition-colors ${
                selectedDays === opt.days && !customDate
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-[#111111]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom date */}
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date personnalisée</p>
        <div className="relative mb-4">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={customDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => { setCustomDate(e.target.value); setSelectedDays(null); }}
            className="w-full pl-10 pr-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#111111] focus:border-[#111111]"
          />
        </div>

        {/* New date preview */}
        {newDate && (
          <div className="bg-[#111111]/10 border border-[#111111]/20 rounded-xl p-3 mb-4">
            <p className="text-xs text-[#111111]/70 mb-1">Nouvelle expiration</p>
            <p className="text-sm font-bold text-[#111111]">
              {newDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}

        {/* Error/Success */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleExtend}
            disabled={loading || !newDate}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-[#111111] hover:bg-[#0033a8] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Prolongation...</>
            ) : (
              <><Clock className="w-4 h-4" /> Prolonger</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
