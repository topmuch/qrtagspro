'use client';

/**
 * QRTagsPro V3 — DynamicCheckInForm
 *
 * Formulaire de check-in générique pour les métiers personnalisés (custom types).
 * Génère dynamiquement les champs à partir du `fieldsSchema` (JSON stocké dans
 * CustomAgencyType.fieldsSchema).
 *
 * Champs supportés:
 *   - text, textarea, number, tel, email, date, datetime-local, select
 *
 * Soumet à /api/agency/check-in avec agencyType: 'custom' + customTypeId + fields (key-value).
 */

import { useState } from 'react';
import {
  LogIn, Loader2, RotateCcw, Info, Asterisk,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const INPUT =
  'w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-[#134288] text-black placeholder-gray-400 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d] transition';

export interface CustomField {
  key: string;
  label: string;
  type: 'text' | 'tel' | 'email' | 'date' | 'datetime-local' | 'textarea' | 'number' | 'select';
  required: boolean;
  placeholder?: string | null;
  helper?: string | null;
  options?: string[] | null;
  defaultValue?: string | null;
}

interface Props {
  reference: string;
  agencyId: string;
  customTypeId: string;
  customTypeName: string;
  fieldsSchema: CustomField[];
  onBack: () => void;
  onSuccess: (summary: string, departureDate: string) => void;
}

export default function DynamicCheckInForm({
  reference,
  agencyId,
  customTypeId,
  customTypeName,
  fieldsSchema,
  onBack,
  onSuccess,
}: Props) {
  const { toast } = useToast();

  // Initialiser les valeurs depuis defaultValue
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of fieldsSchema) {
      if (f.defaultValue) init[f.key] = f.defaultValue;
      else if (f.type === 'date') init[f.key] = new Date().toISOString().slice(0, 10);
      else if (f.type === 'datetime-local') {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        init[f.key] = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      }
    }
    return init;
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (key: string, value: string) => {
    setValues({ ...values, [key]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation des champs requis
    for (const f of fieldsSchema) {
      if (f.required && !values[f.key]?.trim()) {
        toast({
          title: 'Champ requis',
          description: `"${f.label}" est obligatoire`,
          variant: 'destructive',
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/agency/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          agencyId,
          agencyType: 'custom',
          customTypeId,
          fields: values,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec du check-in');
      toast({
        title: 'Check-in réussi 🎉',
        description: data.baggage?.summary || `${customTypeName} — Check-in effectué`,
      });
      onSuccess(data.baggage.summary, data.baggage.departureDate);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      toast({
        title: 'Erreur de check-in',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Icône selon le type de champ
  const renderField = (f: CustomField) => {
    const value = values[f.key] || '';
    const commonProps = {
      id: `field-${f.key}`,
      required: f.required,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        handleChange(f.key, e.target.value),
      placeholder: f.placeholder || '',
      className: INPUT,
    };

    if (f.type === 'textarea') {
      return <textarea rows={3} {...commonProps} className={INPUT + ' resize-none'} />;
    }

    if (f.type === 'select' && f.options) {
      return (
        <select {...commonProps}>
          <option value="">— Sélectionner —</option>
          {f.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    return <input type={f.type} {...commonProps} />;
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border-2 border-[#134288] shadow-xl space-y-4">
      {/* Référence */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 border-2 border-[#134288]/20 mb-2">
        <div>
          <p className="text-xs text-slate-500 font-medium">Référence QR</p>
          <p className="font-mono font-bold text-black">{reference}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs px-3 py-1.5 rounded-lg bg-white border border-[#134288]/20 hover:bg-black/5 transition flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Changer
        </button>
      </div>

      {/* Titre */}
      <div className="pt-2">
        <h2 className="text-lg font-bold text-black mb-1">
          Check-in {customTypeName}
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Renseignez les informations ci-dessous.
        </p>
      </div>

      {/* Champs dynamiques */}
      <div className="space-y-4">
        {fieldsSchema.map(f => (
          <div key={f.key}>
            <label htmlFor={`field-${f.key}`} className="block text-sm font-semibold text-black mb-1.5">
              {f.label}
              {f.required && <span className="text-red-600 ml-1"><Asterisk className="w-3 h-3 inline" /></span>}
            </label>
            {renderField(f)}
            {f.helper && (
              <p className="mt-1 text-xs text-slate-500">{f.helper}</p>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-[#32ba5d]/15 border-2 border-[#32ba5d]/40 text-sm text-black">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#134288]" />
        <p>
          Le trouveur contactera votre établissement (pas le client directement).
          L&apos;établissement gérera la restitution.
        </p>
      </div>

      {/* Submit */}
      <div className="pt-2 flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#134288] text-white text-sm font-semibold border-2 border-[#134288] hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Check-in…</>
          ) : (
            <><LogIn className="w-4 h-4" /> Valider le check-in</>
          )}
        </button>
      </div>
    </form>
  );
}
