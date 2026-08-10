'use client';

import { useState } from 'react';
import { Loader2, X, Save } from 'lucide-react';
import {
  createOrUpdateService,
} from '../actions';
import {
  SERVICE_CATEGORIES,
  SERVICE_TYPES,
  TEAMS,
  DISPLAY_TABS,
  type HotelServiceSummary,
} from '../constants';

interface ServiceFormProps {
  service?: HotelServiceSummary | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ServiceForm({ service, onClose, onSaved }: ServiceFormProps) {
  const isEditing = !!service;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: service?.name || '',
    description: service?.description || '',
    icon: service?.icon || '📋',
    type: service?.type || 'request',
    category: service?.category || 'other',
    isFree: service?.isFree ?? true,
    price: service?.price || 0,
    schedule: service?.schedule || '',
    assignedTeam: service?.assignedTeam || 'reception',
    displayTab: service?.displayTab || 'hotel',
  });

  const update = (key: string, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await createOrUpdateService(form, service?.id);
      setSubmitting(false);
      if (result.success) {
        onSaved();
      } else {
        setError(result.error || 'Erreur lors de la sauvegarde.');
      }
    } catch (err) {
      setSubmitting(false);
      console.error('ServiceForm submit error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inattendue.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg my-8 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEditing ? '✏️ Modifier le service' : '✨ Nouveau service'}
          </h2>
          <button onClick={onClose} disabled={submitting} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom + Icon */}
          <div className="flex gap-3">
            <div className="w-16">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Icône</label>
              <input type="text" value={form.icon} onChange={(e) => update('icon', e.target.value)} maxLength={2}
                className="w-full px-2 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-center text-xl outline-none focus:border-[#134288] dark:focus:border-[#32ba5d]" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Nom du service *</label>
              <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} required placeholder="Ex: Serviettes supplémentaires"
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:border-[#134288] dark:focus:border-[#32ba5d] text-sm" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={2} placeholder="Ex: Demandez des serviettes supplémentaires pour votre chambre"
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:border-[#134288] dark:focus:border-[#32ba5d] text-sm resize-none" />
          </div>

          {/* Type + Catégorie */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Type</label>
              <select value={form.type} onChange={(e) => update('type', e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:border-[#134288] text-sm">
                {SERVICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Catégorie</label>
              <select value={form.category} onChange={(e) => update('category', e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:border-[#134288] text-sm">
                {SERVICE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Onglet d'affichage */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Affiché dans l'onglet</label>
            <div className="grid grid-cols-3 gap-2">
              {DISPLAY_TABS.map((t) => (
                <button key={t.value} type="button" onClick={() => update('displayTab', t.value)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border-2 transition ${
                    form.displayTab === t.value
                      ? 'bg-[#134288] text-white border-[#134288]'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Équipe destinataire */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Routé vers l'équipe</label>
            <select value={form.assignedTeam} onChange={(e) => update('assignedTeam', e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:border-[#134288] text-sm">
              {TEAMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Payant + Prix */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFree} onChange={(e) => update('isFree', e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Gratuit</span>
            </label>
            {!form.isFree && (
              <div className="flex-1">
                <input type="number" value={form.price} onChange={(e) => update('price', parseInt(e.target.value) || 0)} placeholder="Prix FCFA"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none text-sm" />
              </div>
            )}
          </div>

          {/* Horaires */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Horaires (JSON)</label>
            <input type="text" value={form.schedule} onChange={(e) => update('schedule', e.target.value)} placeholder='[{"day":"mon","open":"07:00","close":"21:00"}]'
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none text-sm font-mono" />
            <p className="text-[10px] text-slate-400 mt-1">Laisser vide pour 24/7</p>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">⚠️ {error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={submitting}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 transition text-sm">Annuler</button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 bg-[#32ba5d] text-black font-bold rounded-lg hover:bg-[#2ba14f] transition flex items-center justify-center gap-2 text-sm">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Sauvegarde…</> : <><Save className="w-4 h-4" />{isEditing ? 'Mettre à jour' : 'Créer'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
