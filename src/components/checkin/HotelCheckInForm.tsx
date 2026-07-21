'use client';

/**
 * Formulaire de check-in Hôtel
 * Champs: clientName, roomNumber, arrivalDate, departureDate, phone, email, notes
 */

import { useState } from 'react';
import {
  LogIn, Loader2, User, Phone, Mail, BedDouble,
  CalendarDays, FileText, RotateCcw, CheckCircle2, MessageCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const INPUT =
  'w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-[#134288] text-black ' +
  'placeholder-gray-400 focus:outline-none focus:border-[#32ba5d] ' +
  'focus:ring-2 focus:ring-[#32ba5d] transition';

interface Props {
  reference: string;
  agencyId: string;
  onBack: () => void;
  onSuccess: (summary: string, departureDate: string) => void;
}

export default function HotelCheckInForm({ reference, agencyId, onBack, onSuccess }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    clientName: '',
    roomNumber: '',
    arrivalDate: new Date().toISOString().slice(0, 10),
    departureDate: '',
    phone: '',
    email: '',
    notes: '',
    clientOptIn: true, // Cochée par défaut (Q1: Option B)
    clientWhatsapp: '', // WhatsApp du client pour contact direct après séjour
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim() || !form.roomNumber.trim() || !form.departureDate) {
      toast({
        title: 'Champs manquants',
        description: 'Nom, chambre et date de départ sont obligatoires',
        variant: 'destructive',
      });
      return;
    }
    // Si opt-in coché, le WhatsApp client est requis
    if (form.clientOptIn && !form.clientWhatsapp.trim()) {
      toast({
        title: 'WhatsApp client requis',
        description: 'Le client a autorisé le contact direct — saisissez son numéro WhatsApp',
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
          agencyType: 'hotel',
          clientName: form.clientName,
          roomNumber: form.roomNumber,
          arrivalDate: form.arrivalDate,
          departureDate: form.departureDate,
          phone: form.phone || null,
          email: form.email || null,
          notes: form.notes || null,
          clientOptIn: form.clientOptIn,
          clientWhatsapp: form.clientOptIn ? (form.clientWhatsapp || null) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec du check-in');
      toast({
        title: 'Check-in réussi 🎉',
        description: `${form.clientName} — Chambre ${form.roomNumber}`,
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
        <h2 className="text-lg font-bold text-black mb-1">Informations client hôtel</h2>
        <p className="text-sm text-slate-600 mb-4">
          Renseignez les infos du client et son séjour.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-1.5">
          <User className="w-3.5 h-3.5 inline mr-1" />
          Nom complet du client <span className="text-red-600">*</span>
        </label>
        <input
          type="text" required autoFocus
          value={form.clientName}
          onChange={(e) => setForm({ ...form, clientName: e.target.value })}
          placeholder="Marie Dupont"
          className={INPUT}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-1.5">
          <BedDouble className="w-3.5 h-3.5 inline mr-1" />
          N° de chambre <span className="text-red-600">*</span>
        </label>
        <input
          type="text" required
          value={form.roomNumber}
          onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
          placeholder="204"
          className={INPUT}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-black mb-1.5">
            <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
            Date d&apos;arrivée <span className="text-red-600">*</span>
          </label>
          <input
            type="date" required
            value={form.arrivalDate}
            onChange={(e) => setForm({ ...form, arrivalDate: e.target.value })}
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-1.5">
            <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
            Date de départ <span className="text-red-600">*</span>
          </label>
          <input
            type="date" required min={form.arrivalDate}
            value={form.departureDate}
            onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
            className={INPUT}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-1.5">
          <Phone className="w-3.5 h-3.5 inline mr-1" />
          Téléphone client (optionnel)
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+33 6 12 34 56 78"
          className={INPUT}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-1.5">
          <Mail className="w-3.5 h-3.5 inline mr-1" />
          Email client (optionnel)
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="marie@email.com"
          className={INPUT}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-1.5">
          <FileText className="w-3.5 h-3.5 inline mr-1" />
          Notes / Description de l&apos;objet (optionnel)
        </label>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Ex: Valise noire rigide, sac à dos rouge..."
          className={INPUT + ' resize-none'}
        />
      </div>

      {/* Opt-in contact direct après séjour */}
      <div className="pt-3 border-t-2 border-[#134288]/10">
        <h3 className="text-sm font-bold text-[#134288] mb-3 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Fidélisation client (après séjour)
        </h3>
        <label className="flex items-start gap-3 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={form.clientOptIn}
            onChange={(e) => setForm({ ...form, clientOptIn: e.target.checked })}
            className="mt-1 w-5 h-5 accent-[#32ba5d] border-2 border-[#134288] rounded"
          />
          <span className="text-sm text-[#134288]">
            Le client autorise le <strong>contact direct via WhatsApp</strong> après son séjour.
            Si quelqu'un trouve son objet après son départ, le trouveur pourra contacter directement le client.
          </span>
        </label>
        {form.clientOptIn && (
          <div>
            <label className="block text-sm font-semibold text-[#134288] mb-1.5">
              <Phone className="w-3.5 h-3.5 inline mr-1" />
              Numéro WhatsApp du client *
            </label>
            <input
              type="tel"
              value={form.clientWhatsapp}
              onChange={(e) => setForm({ ...form, clientWhatsapp: e.target.value })}
              placeholder="+33 6 12 34 56 78"
              className={INPUT}
            />
            <p className="mt-1 text-xs text-slate-500">
              Utilisé uniquement après le départ du client. Pendant le séjour, le trouveur contacte la réception.
            </p>
          </div>
        )}
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
