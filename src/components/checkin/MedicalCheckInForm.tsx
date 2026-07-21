'use client';

/**
 * Formulaire de check-in Clinique / Hôpital
 *
 * Champs:
 *   - patientName * (nom complet du patient)
 *   - fileNumber * (n° de dossier médical)
 *   - service (optionnel — ex: Cardiologie, Urgences)
 *   - roomNumber (optionnel — n° de chambre)
 *   - emergencyContactName * (nom du contact d'urgence — famille)
 *   - emergencyContactPhone * (téléphone du contact d'urgence)
 *   - admissionDate * (date d'admission — auto = aujourd'hui)
 *   - dischargeDate (optionnel — date de sortie prévue; si vide → +30 jours)
 *   - notes (optionnel — effets personnels: lunettes, prothèse auditive, etc.)
 *
 * Logic API:
 *   - departureDate = dischargeDate si fournie, sinon admissionDate + 30 jours
 *   - whatsappOwner = emergencyContactPhone (le trouveur contacte la clinique,
 *     qui appelle le contact d'urgence)
 */

import { useState } from 'react';
import {
  LogIn, Loader2, User, Phone, FileText, RotateCcw,
  Stethoscope, BedDouble, CalendarDays, AlertTriangle, Info,
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

export default function MedicalCheckInForm({ reference, agencyId, onBack, onSuccess }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    patientName: '',
    fileNumber: '',
    service: '',
    roomNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    admissionDate: new Date().toISOString().slice(0, 10),
    dischargeDate: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientName.trim() || !form.fileNumber.trim() ||
        !form.emergencyContactName.trim() || !form.emergencyContactPhone.trim() ||
        !form.admissionDate) {
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
          agencyType: 'medical',
          patientName: form.patientName,
          fileNumber: form.fileNumber,
          service: form.service || null,
          roomNumber: form.roomNumber || null,
          emergencyContactName: form.emergencyContactName,
          emergencyContactPhone: form.emergencyContactPhone,
          admissionDate: form.admissionDate,
          dischargeDate: form.dischargeDate || null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec du check-in');
      toast({
        title: 'Check-in réussi 🎉',
        description: `${form.patientName} — Dossier ${form.fileNumber}`,
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

  // Calculer la date de départ prévisionnelle pour info
  const computeDischargeInfo = (): string => {
    if (form.dischargeDate) {
      return new Date(form.dischargeDate).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
    }
    if (!form.admissionDate) return '30 jours après admission';
    const d = new Date(form.admissionDate);
    d.setDate(d.getDate() + 30);
    return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} (30 j. par défaut)`;
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
          <Stethoscope className="w-5 h-5" />
          Informations patient
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Le QR sera actif jusqu&apos;à la sortie du patient.
        </p>
      </div>

      {/* Patient + N° dossier */}
      <div>
        <label className="block text-sm font-semibold text-black mb-1.5">
          <User className="w-3.5 h-3.5 inline mr-1" />
          Nom du patient <span className="text-red-600">*</span>
        </label>
        <input
          type="text" required autoFocus
          value={form.patientName}
          onChange={(e) => setForm({ ...form, patientName: e.target.value })}
          placeholder="Jean Dupont"
          className={INPUT}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-1.5">
          <FileText className="w-3.5 h-3.5 inline mr-1" />
          N° de dossier médical <span className="text-red-600">*</span>
        </label>
        <input
          type="text" required
          value={form.fileNumber}
          onChange={(e) => setForm({ ...form, fileNumber: e.target.value })}
          placeholder="DOS-2026-0142"
          className={INPUT}
        />
      </div>

      {/* Service + Chambre */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-black mb-1.5">
            <Stethoscope className="w-3.5 h-3.5 inline mr-1" />
            Service (optionnel)
          </label>
          <input
            type="text"
            value={form.service}
            onChange={(e) => setForm({ ...form, service: e.target.value })}
            placeholder="Cardiologie, Urgences..."
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-1.5">
            <BedDouble className="w-3.5 h-3.5 inline mr-1" />
            N° de chambre (optionnel)
          </label>
          <input
            type="text"
            value={form.roomNumber}
            onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
            placeholder="312"
            className={INPUT}
          />
        </div>
      </div>

      {/* Contact d'urgence */}
      <div className="pt-3 border-t-2 border-[#134288]/10">
        <h3 className="text-sm font-bold text-black mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Contact d&apos;urgence (famille)
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              <User className="w-3.5 h-3.5 inline mr-1" />
              Nom du contact <span className="text-red-600">*</span>
            </label>
            <input
              type="text" required
              value={form.emergencyContactName}
              onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
              placeholder="Marie Dupont (épouse)"
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              <Phone className="w-3.5 h-3.5 inline mr-1" />
              Téléphone du contact <span className="text-red-600">*</span>
            </label>
            <input
              type="tel" required
              value={form.emergencyContactPhone}
              onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
              placeholder="+33 6 12 34 56 78"
              className={INPUT}
            />
          </div>
        </div>
      </div>

      {/* Dates admission / sortie */}
      <div className="pt-3 border-t-2 border-[#134288]/10">
        <h3 className="text-sm font-bold text-black mb-3 flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          Séjour
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
              Date d&apos;admission <span className="text-red-600">*</span>
            </label>
            <input
              type="date" required
              value={form.admissionDate}
              onChange={(e) => setForm({ ...form, admissionDate: e.target.value })}
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
              Date de sortie prévue (optionnel)
            </label>
            <input
              type="date" min={form.admissionDate}
              value={form.dischargeDate}
              onChange={(e) => setForm({ ...form, dischargeDate: e.target.value })}
              className={INPUT}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-black mb-1.5">
          <FileText className="w-3.5 h-3.5 inline mr-1" />
          Notes / Effets personnels (optionnel)
        </label>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Ex: Lunettes, prothèse auditive, canne, dentier..."
          className={INPUT + ' resize-none'}
        />
      </div>

      {/* Info: expiration */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-[#32ba5d]/15 border-2 border-[#32ba5d]/40 text-sm text-black">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#134288]" />
        <p>
          Le QR sera actif jusqu&apos;au <strong>{computeDischargeInfo()}</strong>.
          Le trouveur contactera la clinique (pas le patient directement). La clinique
          appellera le contact d&apos;urgence pour restitution.
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
