'use client';

/**
 * QRTags — DynamicTagForm
 *
 * Formulaire dynamique généré à partir du type d'agence.
 * Lit `agency-type.ts` pour savoir quels champs afficher selon `agencyType`.
 * Stocke les valeurs dans un objet `customData` sérialisé en JSON côté API.
 *
 * Utilisé par :
 *   - /inscrire (côté propriétaire final lors de l'activation)
 *   - Dashboard Agence > Traçabilité > bouton "Activer un tag" (côté admin agence)
 *   - Dashboard Agence > Vendre un tag (champs partiels : nom client + tél)
 */

import { useMemo } from 'react';
import { getCustomFieldsForAgencyType, CustomField } from '@/lib/agency-types';

export interface DynamicTagFormProps {
  agencyType?: string | null;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  /** Compact mode (used in modals/dialogs) */
  compact?: boolean;
}

export default function DynamicTagForm({
  agencyType,
  values,
  onChange,
  errors = {},
  disabled = false,
  compact = false,
}: DynamicTagFormProps) {
  const fields: CustomField[] = useMemo(
    () => getCustomFieldsForAgencyType(agencyType),
    [agencyType],
  );

  if (!agencyType || agencyType === 'generic' || fields.length === 0) {
    // Pas de type d'agence → fallback minimal (nom + téléphone + description)
    return (
      <div className={compact ? 'space-y-3' : 'space-y-4'}>
        <div>
          <label className="block text-sm font-bold mb-1">
            Nom du propriétaire *
          </label>
          <input
            type="text"
            value={values['owner_name'] || ''}
            onChange={(e) => onChange({ ...values, owner_name: e.target.value })}
            disabled={disabled}
            placeholder="Marie Dupont"
            className="w-full px-3 py-2 rounded-lg border-2 border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          {errors['owner_name'] && (
            <p className="text-xs text-destructive mt-1">{errors['owner_name']}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">
            Téléphone *
          </label>
          <input
            type="tel"
            value={values['owner_phone'] || ''}
            onChange={(e) => onChange({ ...values, owner_phone: e.target.value })}
            disabled={disabled}
            placeholder="+33 6 12 34 56 78"
            className="w-full px-3 py-2 rounded-lg border-2 border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          {errors['owner_phone'] && (
            <p className="text-xs text-destructive mt-1">{errors['owner_phone']}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">
            Description de l'objet *
          </label>
          <textarea
            value={values['object_desc'] || ''}
            onChange={(e) => onChange({ ...values, object_desc: e.target.value })}
            disabled={disabled}
            rows={compact ? 2 : 3}
            placeholder="Valise noire rigide, ordinateur portable Dell..."
            className="w-full px-3 py-2 rounded-lg border-2 border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 resize-none"
          />
          {errors['object_desc'] && (
            <p className="text-xs text-destructive mt-1">{errors['object_desc']}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {fields.map((f) => (
        <div key={f.key}>
          <label className="block text-sm font-bold mb-1">
            {f.label}
            {f.required && <span className="text-destructive ml-1">*</span>}
          </label>
          {f.type === 'textarea' ? (
            <textarea
              value={values[f.key] || ''}
              onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
              disabled={disabled}
              required={f.required}
              rows={compact ? 2 : 3}
              placeholder={f.placeholder}
              className="w-full px-3 py-2 rounded-lg border-2 border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 resize-none"
            />
          ) : (
            <input
              type={f.type}
              value={values[f.key] || ''}
              onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
              disabled={disabled}
              required={f.required}
              placeholder={f.placeholder}
              className="w-full px-3 py-2 rounded-lg border-2 border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          )}
          {f.helper && (
            <p className="text-xs text-muted-foreground mt-1">{f.helper}</p>
          )}
          {errors[f.key] && (
            <p className="text-xs text-destructive mt-1">{errors[f.key]}</p>
          )}
        </div>
      ))}
    </div>
  );
}
