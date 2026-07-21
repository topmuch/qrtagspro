'use client';

/**
 * Formulaire de check-in Consigne (gare/aéroport/gare routière)
 *
 * Champs:
 *   - lockerNumber * (n° de casier)
 *   - baggageDescription * (description du bagage)
 *   - depositTime * (heure de dépôt — input type="time")
 *   - retrievalTime * (date/heure de retrait prévu — input type="datetime-local")
 *   - travelerName * (nom du voyageur)
 *   - travelerPhone * (téléphone du voyageur)
 *   - depositType (type de consigne: 24h, 48h, 7j)
 *   - notes (optionnel)
 *
 * Logic API:
 *   - departureDate = retrievalTime (précis à l'heure près)
 *   - whatsappOwner = travelerPhone (le trouveur contacte la consigne,
 *     qui appelle le voyageur)
 */

import { useState } from 'react';
import {
  LogIn, Loader2, User, Phone, FileText, RotateCcw,
  Luggage, Clock, CalendarClock, Hash, Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const INPUT =
  'w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-[#134288] text-black ' +
  'placeholder-gray-400 focus:outline-none focus:border-[#32ba5d] ' +
  'focus:ring-2 focus:ring-[#32ba5d] transition';

const DEPOSIT_TYPES = [
  { value: '24h', label: '24 heures' },
  { value: '48h', label: '48 heures' },
  { value: '7j', label: '7 jours' },
  { value: 'perso', label: 'Personnalisé' },
];

interface Props {
  reference: string;
  agencyId: string;
  onBack: () => void;
  onSuccess: (summary: string, departureDate: string) => void;
}

export default function LuggageLockerCheckInForm({ reference, agencyId, onBack, onSuccess }: Props) {
  const { toast } = useToast();

  // Heure actuelle au format HH:MM pour le défaut depositTime
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const defaultDepositTime = `${hh}:${mm}`;

  // Retrieval par défaut = +24h
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const defaultRetrievalTime =
    `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}` +
    `T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;

  const [form, setForm] = useState({
    lockerNumber: '',
    baggageDescription: '',
    depositTime: defaultDepositTime,
    retrievalTime: defaultRetrievalTime,
    travelerName: '',
    travelerPhone: '',
    depositType: '24h',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lockerNumber.trim() || !form.baggageDescription.trim() ||
        !form.depositTime || !form.retrievalTime ||
        !form.travelerName.trim() || !form.travelerPhone.trim()) {
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
          agencyType: 'luggage_locker',
          lockerNumber: form.lockerNumber,
          baggageDescription: form.baggageDescription,
          depositTime: form.depositTime,
          retrievalTime: form.retrievalTime,
          travelerName: form.travelerName,
          travelerPhone: form.travelerPhone,
          depositType: form.depositType || null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec du check-in');
      toast({
        title: 'Check-in réussi 🎉',
        description: `Casier ${form.lockerNumber} — ${form.travelerName}`,
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

  // Calculer le retrait prévu pour info
  const computeRetrievalInfo = (): string => {
    if (!form.retrievalTime) return '—';
    try {
      return new Date(form.retrievalTime).toLocaleString('fr-FR', {
        weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return form.retrievalTime;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border-2 border-[#134288] shadow-xl space-y-4">
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

      <div className="pt-2">
        <h2 className="text-lg font-bold text-black mb-1 flex items-center gap-2">
          <Luggage className="w-5 h-5" />
          Informations consigne
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Le QR sera actif jusqu&apos;au retrait prévu du bagage.
        </p>
      </div>

      {/* N° casier + Type consigne */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-black mb-1.5">
            <Hash className="w-3.5 h-3.5 inline mr-1" />
            N° de casier <span className="text-red-600">*</span>
          </label>
          <input
            type="text" required autoFocus
            value={form.lockerNumber}
            onChange={(e) => setForm({ ...form, lockerNumber: e.target.value.toUpperCase() })}
            placeholder="A-042"
            className={INPUT + ' uppercase font-mono'}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-1.5">
            <Clock className="w-3.5 h-3.5 inline mr-1" />
            Type de consigne
          </label>
          <select
            value={form.depositType}
            onChange={(e) => setForm({ ...form, depositType: e.target.value })}
            className={INPUT}
          >
            {DEPOSIT_TYPES.map(dt => (
              <option key={dt.value} value={dt.value}>{dt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description bagage */}
      <div>
        <label className="block text-sm font-semibold text-black mb-1.5">
          <Luggage className="w-3.5 h-3.5 inline mr-1" />
          Description du bagage <span className="text-red-600">*</span>
        </label>
        <textarea
          rows={2} required
          value={form.baggageDescription}
          onChange={(e) => setForm({ ...form, baggageDescription: e.target.value })}
          placeholder="Ex: Valise noire rigide, roue gauche cassée, autocollant Air France"
          className={INPUT + ' resize-none'}
        />
      </div>

      {/* Horaires dépôt / retrait */}
      <div className="pt-3 border-t-2 border-[#134288]/10">
        <h3 className="text-sm font-bold text-black mb-3 flex items-center gap-2">
          <CalendarClock className="w-4 h-4" />
          Horaires
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              Heure de dépôt <span className="text-red-600">*</span>
            </label>
            <input
              type="time" required
              value={form.depositTime}
              onChange={(e) => setForm({ ...form, depositTime: e.target.value })}
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              <CalendarClock className="w-3.5 h-3.5 inline mr-1" />
              Retrait prévu <span className="text-red-600">*</span>
            </label>
            <input
              type="datetime-local" required
              value={form.retrievalTime}
              onChange={(e) => setForm({ ...form, retrievalTime: e.target.value })}
              className={INPUT}
            />
          </div>
        </div>
      </div>

      {/* Voyageur */}
      <div className="pt-3 border-t-2 border-[#134288]/10">
        <h3 className="text-sm font-bold text-black mb-3 flex items-center gap-2">
          <User className="w-4 h-4" />
          Voyageur
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              <User className="w-3.5 h-3.5 inline mr-1" />
              Nom du voyageur <span className="text-red-600">*</span>
            </label>
            <input
              type="text" required
              value={form.travelerName}
              onChange={(e) => setForm({ ...form, travelerName: e.target.value })}
              placeholder="Alex Voyage"
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              <Phone className="w-3.5 h-3.5 inline mr-1" />
              Téléphone voyageur <span className="text-red-600">*</span>
            </label>
            <input
              type="tel" required
              value={form.travelerPhone}
              onChange={(e) => setForm({ ...form, travelerPhone: e.target.value })}
              placeholder="+33 6 12 34 56 78"
              className={INPUT}
            />
          </div>
        </div>
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
          placeholder="Ex: Bagage fragile, ticket de consigne #1234..."
          className={INPUT + ' resize-none'}
        />
      </div>

      {/* Info: expiration */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-[#32ba5d]/15 border-2 border-[#32ba5d]/40 text-sm text-black">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#134288]" />
        <p>
          Le QR sera actif jusqu&apos;au <strong>{computeRetrievalInfo()}</strong> (retrait prévu).
          Le trouveur contactera la consigne (pas le voyageur directement). La consigne
          appellera le voyageur pour restitution.
        </p>
      </div>

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
