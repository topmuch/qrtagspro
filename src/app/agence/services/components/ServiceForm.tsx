'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, X, Save, Search, Video, Image as ImageIcon, Wrench } from 'lucide-react';
import { createOrUpdateService } from '../actions';
import {
  SERVICE_CATEGORIES,
  SERVICE_TYPES,
  TEAMS,
  DISPLAY_TABS,
  type HotelServiceSummary,
} from '../constants';

interface ModeleAppareil {
  id: string;
  category: string;
  brand: string;
  model: string;
  photoUrl: string | null;
  videoUrl: string | null;
  etapes: string | null;
  depannage: string | null;
}

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
    modeleId: service?.modeleId || null,
    photoCustom: service?.photoCustom || null,
    videoUrl: service?.videoUrl || null,
    etapes: service?.etapes || null,
    depannage: service?.depannage || null,
  });

  // ─── Autocomplétion ModeleAppareil ───
  const [modeleQuery, setModeleQuery] = useState('');
  const [modeleResults, setModeleResults] = useState<ModeleAppareil[]>([]);
  const [modeleSelected, setModeleSelected] = useState<ModeleAppareil | null>(null);
  const [modeleLoading, setModeleLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Initialize modele query if service has a modeleId (we need to fetch the label)
  useEffect(() => {
    if (service?.modeleId) {
      // Fetch the modele to populate the search field
      fetch(`/api/modeles-appareils?q=${service.modeleId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.modeles?.length > 0) {
            // Find the one matching the ID
            const found = data.modeles.find((m: ModeleAppareil) => m.id === service.modeleId);
            if (found) {
              setModeleSelected(found);
              setModeleQuery(`${found.brand} ${found.model}`);
            }
          }
        })
        .catch(() => {});
    }
  }, [service?.modeleId]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!modeleQuery.trim() || modeleSelected) {
      setModeleResults([]);
      return;
    }
    setModeleLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/modeles-appareils?q=${encodeURIComponent(modeleQuery)}`);
        const data = await res.json();
        if (data.success) {
          setModeleResults(data.modeles || []);
          setShowResults(true);
        }
      } catch (e) { console.error(e); }
      finally { setModeleLoading(false); }
    }, 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [modeleQuery, modeleSelected]);

  // Click outside to close results
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectModele = (m: ModeleAppareil) => {
    setModeleSelected(m);
    setModeleQuery(`${m.brand} ${m.model}`);
    setShowResults(false);
    // Pre-fill from the modele
    setForm((prev) => ({
      ...prev,
      modeleId: m.id,
      name: prev.name || `${m.brand} ${m.model}`,
      icon: '📖',
      type: 'info',
      category: 'guide',
      videoUrl: m.videoUrl || prev.videoUrl,
      etapes: m.etapes || prev.etapes,
      depannage: m.depannage || prev.depannage,
    }));
  };

  const clearModele = () => {
    setModeleSelected(null);
    setModeleQuery('');
    setForm((prev) => ({
      ...prev,
      modeleId: null,
      videoUrl: null,
      etapes: null,
      depannage: null,
    }));
  };

  const update = (key: string, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // File upload (Ma photo)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, photoCustom: reader.result as string }));
    };
    reader.readAsDataURL(file);
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

  const isGuideCategory = form.category === 'guide';

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

          {/* ─── SECTION MODE D'EMPLOI APPAREIL ─── */}
          {isGuideCategory && (
            <div className="border-2 border-amber-200 dark:border-amber-900/40 rounded-xl p-4 bg-amber-50/50 dark:bg-amber-900/10 space-y-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Mode d'emploi appareil (autocomplétion)</p>
              </div>

              {/* Search input */}
              <div className="relative" ref={resultsRef}>
                <input
                  type="text"
                  value={modeleQuery}
                  onChange={(e) => {
                    setModeleQuery(e.target.value);
                    if (modeleSelected) {
                      // If user edits after selecting, reset selection
                      setModeleSelected(null);
                      setForm((prev) => ({ ...prev, modeleId: null, videoUrl: null, etapes: null, depannage: null }));
                    }
                  }}
                  onFocus={() => modeleResults.length > 0 && setShowResults(true)}
                  placeholder="Cherchez: Nespresso, Bosch, Samsung TV, Daikin…"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:border-amber-400 text-sm"
                />
                {modeleLoading && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-amber-500" />}
                {modeleSelected && (
                  <button type="button" onClick={clearModele} className="absolute right-3 top-3 text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Results dropdown */}
                {showResults && modeleResults.length > 0 && !modeleSelected && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    {modeleResults.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => selectModele(m)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 border-b border-slate-100 dark:border-slate-700 last:border-b-0 text-left"
                      >
                        {m.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.photoUrl} alt="" className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl">📦</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{m.brand} {m.model}</p>
                          <p className="text-xs text-slate-500 capitalize">{m.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected modele preview */}
              {modeleSelected && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-amber-200 dark:border-amber-900/40">
                  <div className="flex items-start gap-3">
                    {form.photoCustom ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.photoCustom} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    ) : modeleSelected.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={modeleSelected.photoUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl">📦</div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{modeleSelected.brand} {modeleSelected.model}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {modeleSelected.videoUrl && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                            <Video className="w-3 h-3" /> Vidéo
                          </span>
                        )}
                        {modeleSelected.etapes && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                            <ImageIcon className="w-3 h-3" /> Étapes
                          </span>
                        )}
                        {modeleSelected.depannage && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                            <Wrench className="w-3 h-3" /> Dépannage
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* "Ma photo" override */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">📷 Remplacer par ma photo (appareil réel du logement)</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    {form.photoCustom && (
                      <button type="button" onClick={() => update('photoCustom', '')} className="ml-3 text-xs text-red-500 hover:underline">
                        Retirer ma photo
                      </button>
                    )}
                  </div>

                  {/* Video URL override */}
                  <div className="mt-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">URL vidéo (surcharge possible)</label>
                    <input
                      type="url"
                      value={form.videoUrl || ''}
                      onChange={(e) => update('videoUrl', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=…"
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              <p className="text-[10px] text-amber-700 dark:text-amber-400">
                💡 Sélectionnez un modèle pour pré-remplir automatiquement la photo, la vidéo YouTube, les étapes et le dépannage. Tout est personnalisable.
              </p>
            </div>
          )}

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
