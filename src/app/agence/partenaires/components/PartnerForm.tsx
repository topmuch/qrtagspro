'use client';

import { useState } from 'react';
import { Loader2, MapPin, X, Star, Tag, Percent } from 'lucide-react';
import { createOrUpdatePartner } from '../actions';
import { VALID_CATEGORIES, type PartnerSummary } from '../constants';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PartnerFormProps {
  partner?: PartnerSummary | null; // null = création, défini = édition
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  RESTAURANT: { label: 'Restaurant', icon: '🍽️' },
  ATTRACTION: { label: 'Attraction / Musée', icon: '🏛️' },
  BEACH: { label: 'Plage', icon: '🏖️' },
  SHOPPING: { label: 'Shopping / Artisanat', icon: '🛍️' },
  HEALTH: { label: 'Santé / Pharmacie', icon: '💊' },
  TRANSPORT: { label: 'Transport', icon: '🚖' },
  EXCURSION: { label: 'Excursion', icon: '⛴️' },
};

// ─── Composant ──────────────────────────────────────────────────────────────

export default function PartnerForm({ partner, onClose, onSaved }: PartnerFormProps) {
  const isEditing = !!partner;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // État local contrôlé pour les champs (plus fiable que defaultValue + FormData)
  const [form, setForm] = useState({
    name: partner?.name || '',
    category: partner?.category || 'RESTAURANT',
    description: partner?.description || '',
    latitude: partner?.latitude?.toString() || '',
    longitude: partner?.longitude?.toString() || '',
    rating: partner?.rating?.toString() || '4.5',
    promoCode: partner?.promoCode || '',
    commission: partner?.commission?.toString() || '0',
  });

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ─── Géolocalisation navigateur ───
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par ce navigateur.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update('latitude', pos.coords.latitude.toFixed(6));
        update('longitude', pos.coords.longitude.toFixed(6));
        setGeoLoading(false);
        setError(null);
      },
      (err) => {
        setGeoLoading(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Permission de géolocalisation refusée. Saisissez les coordonnées manuellement.'
            : 'Impossible de récupérer la position. Saisissez manuellement.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ─── Submit ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createOrUpdatePartner(
        {
          name: form.name,
          category: form.category,
          description: form.description || undefined,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          rating: parseFloat(form.rating),
          promoCode: form.promoCode || undefined,
          commission: parseInt(form.commission, 10),
        },
        partner?.id
      );

      setIsSubmitting(false);

      if (result.success) {
        onSaved();
      } else {
        setError(result.error || 'Une erreur est survenue.');
      }
    } catch (err) {
      setIsSubmitting(false);
      console.error('PartnerForm submit error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inattendue.');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md my-8 shadow-2xl">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEditing ? '✏️ Modifier le lieu' : '✨ Ajouter un lieu recommandé'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Nom du lieu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              placeholder="Ex: Restaurant Le Ngor"
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:border-[#134288] dark:focus:border-[#32ba5d] outline-none transition text-sm"
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Catégorie <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:border-[#134288] dark:focus:border-[#32ba5d] outline-none transition text-sm"
            >
              {VALID_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]?.icon} {CATEGORY_LABELS[cat]?.label || cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Description courte
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={2}
              placeholder="Ex: Meilleur poisson braisé du quartier"
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:border-[#134288] dark:focus:border-[#32ba5d] outline-none transition text-sm resize-none"
            />
          </div>

          {/* Coordonnées GPS */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Coordonnées GPS <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => update('latitude', e.target.value)}
                required
                placeholder="Latitude (14.7167)"
                className="px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:border-[#134288] dark:focus:border-[#32ba5d] outline-none transition text-sm font-mono"
              />
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => update('longitude', e.target.value)}
                required
                placeholder="Longitude (-17.4677)"
                className="px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:border-[#134288] dark:focus:border-[#32ba5d] outline-none transition text-sm font-mono"
              />
            </div>
            <button
              type="button"
              onClick={handleGeolocate}
              disabled={geoLoading}
              className="mt-2 w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {geoLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Localisation…
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  Utiliser ma position actuelle
                </>
              )}
            </button>
          </div>

          {/* Note / Promo / Commission */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                <Star className="w-3 h-3 inline" /> Note
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.rating}
                onChange={(e) => update('rating', e.target.value)}
                className="w-full px-2.5 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:border-[#134288] dark:focus:border-[#32ba5d] outline-none transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                <Tag className="w-3 h-3 inline" /> Promo
              </label>
              <input
                type="text"
                value={form.promoCode}
                onChange={(e) => update('promoCode', e.target.value)}
                placeholder="QR10"
                className="w-full px-2.5 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:border-[#134288] dark:focus:border-[#32ba5d] outline-none transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                <Percent className="w-3 h-3 inline" /> Com. %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.commission}
                onChange={(e) => update('commission', e.target.value)}
                className="w-full px-2.5 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:border-[#134288] dark:focus:border-[#32ba5d] outline-none transition text-sm"
              />
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50 text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-[#32ba5d] text-black font-bold rounded-lg hover:bg-[#2ba14f] transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement…
                </>
              ) : isEditing ? (
                'Mettre à jour'
              ) : (
                'Ajouter le lieu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
