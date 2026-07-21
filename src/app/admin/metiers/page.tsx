'use client';

/**
 * QRTagsPro V3 — Page d'administration des métiers personnalisés
 *
 * URL: /admin/metiers
 *
 * Fonctionnalités:
 *   - Liste des métiers personnalisés (cards avec nom, icône, nb champs, nb agences)
 *   - Création d'un nouveau métier via un builder (form builder)
 *   - Édition d'un métier existant
 *   - Suppression (refusée si des agences l'utilisent)
 *
 * Le builder permet de:
 *   - Définir nom + icône + description
 *   - Ajouter/réorganiser/supprimer des champs
 *   - Choisir un champ "date de départ" (pour cron auto-checkout)
 *   - Personnaliser le message WhatsApp trouveur
 *   - Définir les labels des colonnes dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Trash2, Edit, X, Save, Loader2,
  GripVertical, ChevronUp, ChevronDown, AlertCircle,
  CheckCircle2, Sparkles, Building2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const INPUT =
  'w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-[#134288] text-black placeholder-gray-400 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d] transition';

const FIELD_TYPES = [
  { value: 'text', label: '📝 Texte court' },
  { value: 'textarea', label: '📄 Texte long' },
  { value: 'number', label: '🔢 Nombre' },
  { value: 'tel', label: '📞 Téléphone' },
  { value: 'email', label: '✉️ Email' },
  { value: 'date', label: '📅 Date' },
  { value: 'datetime-local', label: '📅 Date + heure' },
  { value: 'select', label: '📋 Liste déroulante' },
];

interface CustomField {
  key: string;
  label: string;
  type: 'text' | 'tel' | 'email' | 'date' | 'datetime-local' | 'textarea' | 'number' | 'select';
  required: boolean;
  placeholder?: string | null;
  helper?: string | null;
  options?: string[] | null;
  defaultValue?: string | null;
}

interface CustomType {
  id: string;
  key: string;
  name: string;
  icon: string;
  description?: string | null;
  fieldsSchema: CustomField[];
  departureFieldKey?: string | null;
  finderMessage?: string | null;
  colClientLabel?: string | null;
  colSubLabel?: string | null;
  agencyCount?: number;
  createdAt?: string;
}

const EMOJI_CHOICES = ['💼', '🏢', '🎓', '🏥', '🚗', '🧳', '🏨', '🏋️', '🏕️', '✈️', '🎫', '🛳️', '🏛️', '🐕', '🎨', '🚕', '🛒', '⛽'];

export default function CustomTypesPage() {
  const { toast } = useToast();
  const [types, setTypes] = useState<CustomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingType, setEditingType] = useState<CustomType | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/custom-types', { cache: 'no-store' });
      const data = await res.json();
      setTypes(data.customTypes || []);
    } catch (err) {
      console.error('Fetch error:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les métiers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleEdit = (t: CustomType) => {
    setEditingType(t);
    setShowBuilder(true);
  };

  const handleNew = () => {
    setEditingType(null);
    setShowBuilder(true);
  };

  const handleDelete = async (t: CustomType) => {
    if (!confirm(`Supprimer le métier "${t.name}" ? Cette action est irréversible.`)) return;
    try {
      const res = await fetch(`/api/admin/custom-types/${t.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec suppression');
      toast({
        title: 'Métier supprimé',
        description: `"${t.name}" a été supprimé.`,
      });
      fetchTypes();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/tableau-de-bord"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-black mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-black flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Métiers personnalisés
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Créez des métiers sur-mesure sans coder. Chaque métier peut être utilisé par une ou plusieurs agences.
            </p>
          </div>
          <button
            type="button"
            onClick={handleNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#134288] text-white font-bold border-2 border-[#134288] hover:-translate-y-0.5 transition-transform"
          >
            <Plus className="w-4 h-4" />
            Nouveau métier
          </button>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Chargement...
        </div>
      ) : types.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border-2 border-[#134288]/20 shadow-md text-center">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <h2 className="text-lg font-bold text-black mb-2">Aucun métier personnalisé</h2>
          <p className="text-sm text-slate-600 mb-4">
            Créez votre premier métier pour couvrir un cas d&apos;usage spécifique (spa, gym, entreprise, etc.).
          </p>
          <button
            type="button"
            onClick={handleNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#32ba5d] text-white font-bold border-2 border-[#134288] hover:-translate-y-0.5 transition-transform"
          >
            <Plus className="w-4 h-4" />
            Créer un métier
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {types.map(t => (
            <div key={t.id} className="bg-white rounded-2xl p-5 border-2 border-[#134288] shadow-xl">
              <div className="flex items-start gap-3 mb-3">
                <div className="text-3xl">{t.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-black">{t.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">@{t.key}</p>
                </div>
              </div>
              {t.description && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{t.description}</p>
              )}
              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
                  <p className="font-bold text-black text-base">{t.fieldsSchema.length}</p>
                  <p className="text-slate-500">champs</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
                  <p className="font-bold text-black text-base">{t.agencyCount || 0}</p>
                  <p className="text-slate-500">agences</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
                  <p className="font-bold text-black text-base">{t.departureFieldKey ? '✅' : '—'}</p>
                  <p className="text-slate-500">auto-expire</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(t)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#32ba5d] text-white text-sm font-semibold border border-[#134288] hover:bg-[#d4a535] transition"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Éditer
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t)}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-white text-red-600 text-sm font-semibold border border-red-200 hover:bg-red-50 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Builder Modal */}
      {showBuilder && (
        <CustomTypeBuilder
          editingType={editingType}
          onClose={() => {
            setShowBuilder(false);
            setEditingType(null);
          }}
          onSaved={() => {
            setShowBuilder(false);
            setEditingType(null);
            fetchTypes();
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Builder Component
// ═══════════════════════════════════════════════════════════════════

function CustomTypeBuilder({
  editingType,
  onClose,
  onSaved,
}: {
  editingType: CustomType | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const isEdit = !!editingType;

  const [form, setForm] = useState({
    key: editingType?.key || '',
    name: editingType?.name || '',
    icon: editingType?.icon || '💼',
    description: editingType?.description || '',
    departureFieldKey: editingType?.departureFieldKey || '',
    finderMessage: editingType?.finderMessage || '',
    colClientLabel: editingType?.colClientLabel || '',
    colSubLabel: editingType?.colSubLabel || '',
  });
  const [fields, setFields] = useState<CustomField[]>(
    editingType?.fieldsSchema || [
      { key: 'clientName', label: 'Nom du client', type: 'text', required: true, placeholder: 'Marie Dupont' },
    ]
  );
  const [saving, setSaving] = useState(false);

  const addField = () => {
    setFields([
      ...fields,
      {
        key: `champ_${fields.length + 1}`,
        label: 'Nouveau champ',
        type: 'text',
        required: false,
        placeholder: '',
      },
    ]);
  };

  const updateField = (index: number, updates: Partial<CustomField>) => {
    setFields(fields.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newFields = [...fields];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      setFields(newFields);
    } else if (direction === 'down' && index < fields.length - 1) {
      const newFields = [...fields];
      [newFields[index + 1], newFields[index]] = [newFields[index], newFields[index + 1]];
      setFields(newFields);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!form.name.trim()) {
      toast({ title: 'Nom requis', variant: 'destructive' });
      return;
    }
    if (!form.key.trim() && !isEdit) {
      toast({ title: 'Clé technique requise', description: 'Minuscules + chiffres + _', variant: 'destructive' });
      return;
    }
    if (fields.length === 0) {
      toast({ title: 'Au moins 1 champ', variant: 'destructive' });
      return;
    }
    // Vérifier clés uniques
    const keys = fields.map(f => f.key);
    if (new Set(keys).size !== keys.length) {
      toast({ title: 'Clés dupliquées', description: 'Chaque champ doit avoir une clé unique', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        key: form.key,
        name: form.name,
        icon: form.icon,
        description: form.description || null,
        fieldsSchema: fields,
        departureFieldKey: form.departureFieldKey || null,
        finderMessage: form.finderMessage || null,
        colClientLabel: form.colClientLabel || null,
        colSubLabel: form.colSubLabel || null,
      };

      const url = isEdit
        ? `/api/admin/custom-types/${editingType!.id}`
        : '/api/admin/custom-types';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec sauvegarde');

      toast({
        title: isEdit ? 'Métier mis à jour' : 'Métier créé 🎉',
        description: `"${form.name}" est maintenant disponible pour les agences.`,
      });
      onSaved();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Champs date disponibles pour departureFieldKey
  const dateFields = fields.filter(f => f.type === 'date' || f.type === 'datetime-local');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border-2 border-[#134288] shadow-2xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#111111] text-white p-4 flex items-center justify-between border-b-2 border-[#134288] z-10">
          <h3 className="font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#32ba5d]" />
            {isEdit ? 'Éditer le métier' : 'Nouveau métier personnalisé'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white p-1"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Infos générales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-sm font-semibold text-black mb-1.5">Icône</label>
              <div className="grid grid-cols-6 gap-1">
                {EMOJI_CHOICES.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setForm({ ...form, icon: e })}
                    className={`text-2xl p-2 rounded-lg border-2 transition ${
                      form.icon === e
                        ? 'border-[#134288] bg-[#32ba5d]'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">
                  Nom du métier <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Spa & Thalasso"
                  className={INPUT}
                />
              </div>
              {!isEdit && (
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">
                    Clé technique <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.key}
                    onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    placeholder="spa_thalasso"
                    className={INPUT + ' font-mono'}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Minuscules + chiffres + _ (utilisée en interne, non modifiable après création)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Description (optionnel)</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ex: Étiquetage des peignoirs, claquettes et effets personnels des clients"
              className={INPUT + ' resize-none'}
            />
          </div>

          {/* Builder de champs */}
          <div className="pt-3 border-t-2 border-[#134288]/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-black flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Champs du formulaire de check-in
              </h4>
              <button
                type="button"
                onClick={addField}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#32ba5d] text-white text-xs font-bold border border-[#134288] hover:bg-[#d4a535] transition"
              >
                <Plus className="w-3 h-3" />
                Ajouter
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-3 border-2 border-gray-200">
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col gap-1 pt-2">
                      <button
                        type="button"
                        onClick={() => moveField(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-black disabled:opacity-30"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <GripVertical className="w-3 h-3 text-slate-300" />
                      <button
                        type="button"
                        onClick={() => moveField(index, 'down')}
                        disabled={index === fields.length - 1}
                        className="p-1 text-slate-400 hover:text-black disabled:opacity-30"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        placeholder="Libellé"
                        className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-sm text-black focus:outline-none focus:border-[#32ba5d]"
                      />
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) => updateField(index, { key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                        placeholder="cle_technique"
                        className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-sm font-mono text-black focus:outline-none focus:border-[#32ba5d]"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value as CustomField['type'] })}
                        className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-sm text-black focus:outline-none focus:border-[#32ba5d]"
                      >
                        {FIELD_TYPES.map(ft => (
                          <option key={ft.value} value={ft.value}>{ft.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                        placeholder="Placeholder (optionnel)"
                        className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-sm text-black focus:outline-none focus:border-[#32ba5d]"
                      />
                      {field.type === 'select' && (
                        <input
                          type="text"
                          value={(field.options || []).join(', ')}
                          onChange={(e) => updateField(index, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                          placeholder="Options séparées par virgule"
                          className="sm:col-span-2 px-3 py-2 rounded-lg bg-white border border-gray-300 text-sm text-black focus:outline-none focus:border-[#32ba5d]"
                        />
                      )}
                      <label className="flex items-center gap-2 text-sm text-black">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                          className="w-4 h-4 accent-black"
                        />
                        Obligatoire
                      </label>
                      {(field.type === 'date' || field.type === 'datetime-local') && (
                        <label className="flex items-center gap-2 text-sm text-black">
                          <input
                            type="radio"
                            name="departureField"
                            checked={form.departureFieldKey === field.key}
                            onChange={() => setForm({ ...form, departureFieldKey: field.key })}
                            className="w-4 h-4 accent-black"
                          />
                          Date de départ (cron auto-checkout)
                        </label>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {fields.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  Aucun champ. Cliquez sur &quot;Ajouter&quot; pour commencer.
                </p>
              )}
            </div>
          </div>

          {/* Options avancées */}
          <details className="pt-3 border-t-2 border-[#134288]/10">
            <summary className="cursor-pointer text-sm font-bold text-black mb-3">
              Options avancées (optionnel)
            </summary>
            <div className="space-y-3 mt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">
                    Label colonne &quot;Client&quot; (dashboard)
                  </label>
                  <input
                    type="text"
                    value={form.colClientLabel}
                    onChange={(e) => setForm({ ...form, colClientLabel: e.target.value })}
                    placeholder="Ex: Adhérent, Participant, Client..."
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">
                    Label colonne &quot;Sub&quot; (dashboard)
                  </label>
                  <input
                    type="text"
                    value={form.colSubLabel}
                    onChange={(e) => setForm({ ...form, colSubLabel: e.target.value })}
                    placeholder="Ex: Badge, Dossier, Casier..."
                    className={INPUT}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">
                  Message WhatsApp personnalisé (optionnel)
                </label>
                <textarea
                  rows={3}
                  value={form.finderMessage}
                  onChange={(e) => setForm({ ...form, finderMessage: e.target.value })}
                  placeholder="Bonjour {agencyName}, j'ai trouvé un objet (réf. {reference}) à ma position: {location}. Trouveur: {finderName}, {finderPhone}."
                  className={INPUT + ' resize-none font-mono text-xs'}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Variables: {'{reference}, {agencyName}, {finderName}, {finderPhone}, {location}'}. Si vide, message par défaut utilisé.
                </p>
              </div>
            </div>
          </details>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white p-4 border-t-2 border-[#134288] flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white border-2 border-[#134288] text-sm font-semibold text-black hover:bg-gray-100 transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#134288] text-white text-sm font-bold border-2 border-[#134288] hover:-translate-y-0.5 transition-transform disabled:opacity-60"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde...</>
            ) : (
              <><Save className="w-4 h-4" /> {isEdit ? 'Mettre à jour' : 'Créer le métier'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
