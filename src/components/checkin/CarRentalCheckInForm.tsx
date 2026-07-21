'use client';

/**
 * Formulaire de check-in Loueur Auto
 *
 * Champs:
 *   - tenantName * (nom complet du locataire)
 *   - contractNumber * (n° de contrat)
 *   - carModel * (modèle du véhicule)
 *   - licensePlate * (immatriculation)
 *   - startDate * (date de début de location)
 *   - endDate * (date de fin de location)
 *   - tenantPhone * (téléphone du locataire)
 *   - objectType (type d'objet étiqueté: clés, documents, GPS, siège enfant)
 *   - notes (optionnel)
 *
 * Logic API:
 *   - departureDate = endDate
 *   - whatsappOwner = tenantPhone (le trouveur contacte le loueur,
 *     qui appelle le locataire)
 */

import { useState } from 'react';
import {
  LogIn, Loader2, User, Phone, FileText, RotateCcw,
  Car, CalendarDays, Hash, KeyRound, Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const INPUT =
  'w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-black text-black ' +
  'placeholder-gray-400 focus:outline-none focus:border-[#E3B23C] ' +
  'focus:ring-2 focus:ring-[#E3B23C] transition';

const OBJECT_TYPES = [
  { value: 'clés', label: '🔑 Clés du véhicule' },
  { value: 'documents', label: '📄 Documents (contrat, assurance)' },
  { value: 'gps', label: '📍 GPS / Navigation' },
  { value: 'siège_enfant', label: '🪑 Siège enfant' },
  { value: 'badge', label: '🎴 Badge parking / télépéage' },
  { value: 'autre', label: '📦 Autre' },
];

interface Props {
  reference: string;
  agencyId: string;
  onBack: () => void;
  onSuccess: (summary: string, departureDate: string) => void;
}

export default function CarRentalCheckInForm({ reference, agencyId, onBack, onSuccess }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    tenantName: '',
    contractNumber: '',
    carModel: '',
    licensePlate: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    tenantPhone: '',
    objectType: 'clés',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenantName.trim() || !form.contractNumber.trim() ||
        !form.carModel.trim() || !form.licensePlate.trim() ||
        !form.startDate || !form.endDate || !form.tenantPhone.trim()) {
      toast({
        title: 'Champs manquants',
        description: 'Tous les champs marqués * sont obligatoires',
        variant: 'destructive',
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/agency/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          agencyId,
          agencyType: 'car_rental',
          tenantName: form.tenantName,
          contractNumber: form.contractNumber,
          carModel: form.carModel,
          licensePlate: form.licensePlate,
          startDate: form.startDate,
          endDate: form.endDate,
          tenantPhone: form.tenantPhone,
          objectType: form.objectType || null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec du check-in');
      toast({
        title: 'Check-in réussi 🎉',
        description: `${form.tenantName} — ${form.carModel} (${form.licensePlate})`,
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

  // Date de retour prévisionnel pour info
  const computeReturnInfo = (): string => {
    if (!form.endDate) return '—';
    return new Date(form.endDate).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border-2 border-black shadow-xl space-y-4">
      <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 border-2 border-black/20 mb-2">
        <div>
          <p className="text-xs text-slate-500 font-medium">Référence QR</p>
          <p className="font-mono font-bold text-black">{reference}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs px-3 py-1.5 rounded-lg bg-white border border-black/20 hover:bg-black/5 transition flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Changer
        </button>
      </div>

      <div className="pt-2">
        <h2 className="text-lg font-bold text-black mb-1 flex items-center gap-2">
          <Car className="w-5 h-5" />
          Informations location
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Le QR sera actif jusqu&apos;à la fin de la location.
        </p>
      </div>

      {/* Locataire */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-black mb-1.5">
            <User className="w-3.5 h-3.5 inline mr-1" />
            Nom du locataire <span className="text-red-600">*</span>
          </label>
          <input
            type="text" required autoFocus
            value={form.tenantName}
            onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
            placeholder="Karim Benali"
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-1.5">
            <Phone className="w-3.5 h-3.5 inline mr-1" />
            Téléphone locataire <span className="text-red-600">*</span>
          </label>
          <input
            type="tel" required
            value={form.tenantPhone}
            onChange={(e) => setForm({ ...form, tenantPhone: e.target.value })}
            placeholder="+33 6 12 34 56 78"
            className={INPUT}
          />
        </div>
      </div>

      {/* Contrat */}
      <div>
        <label className="block text-sm font-semibold text-black mb-1.5">
          <Hash className="w-3.5 h-3.5 inline mr-1" />
          N° de contrat <span className="text-red-600">*</span>
        </label>
        <input
          type="text" required
          value={form.contractNumber}
          onChange={(e) => setForm({ ...form, contractNumber: e.target.value })}
          placeholder="C-2026-0142"
          className={INPUT}
        />
      </div>

      {/* Véhicule */}
      <div className="pt-3 border-t-2 border-black/10">
        <h3 className="text-sm font-bold text-black mb-3 flex items-center gap-2">
          <Car className="w-4 h-4" />
          Véhicule
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              <Car className="w-3.5 h-3.5 inline mr-1" />
              Modèle <span className="text-red-600">*</span>
            </label>
            <input
              type="text" required
              value={form.carModel}
              onChange={(e) => setForm({ ...form, carModel: e.target.value })}
              placeholder="Renault Clio 5"
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              Immatriculation <span className="text-red-600">*</span>
            </label>
            <input
              type="text" required
              value={form.licensePlate}
              onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
              placeholder="AB-123-CD"
              className={INPUT + ' uppercase font-mono'}
            />
          </div>
        </div>
      </div>

      {/* Dates location */}
      <div className="pt-3 border-t-2 border-black/10">
        <h3 className="text-sm font-bold text-black mb-3 flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          Période de location
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
              Date de début <span className="text-red-600">*</span>
            </label>
            <input
              type="date" required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
              Date de fin <span className="text-red-600">*</span>
            </label>
            <input
              type="date" required min={form.startDate}
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className={INPUT}
            />
          </div>
        </div>
      </div>

      {/* Type d'objet étiqueté */}
      <div>
        <label className="block text-sm font-semibold text-black mb-1.5">
          <KeyRound className="w-3.5 h-3.5 inline mr-1" />
          Type d&apos;objet étiqueté
        </label>
        <select
          value={form.objectType}
          onChange={(e) => setForm({ ...form, objectType: e.target.value })}
          className={INPUT}
        >
          {OBJECT_TYPES.map(ot => (
            <option key={ot.value} value={ot.value}>{ot.label}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-500">
          Indiquez ce sur quoi le QR est collé (clés, documents, GPS, etc.)
        </p>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-black mb-1.5">
          <FileText className="w-3.5 h-3.5 inline mr-1" />
          Notes (optionnel)
        </label>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Ex: Second jeu de clés, badge télépéage inclus..."
          className={INPUT + ' resize-none'}
        />
      </div>

      {/* Info: expiration */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-[#E3B23C]/15 border-2 border-[#E3B23C]/40 text-sm text-black">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#111111]" />
        <p>
          Le QR sera actif jusqu&apos;au <strong>{computeReturnInfo()}</strong> (fin de location).
          Le trouveur contactera le loueur (pas le locataire directement). Le loueur
          appellera le locataire pour restitution.
        </p>
      </div>

      <div className="pt-2 flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-black text-[#E3B23C] text-sm font-semibold border-2 border-black hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
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
