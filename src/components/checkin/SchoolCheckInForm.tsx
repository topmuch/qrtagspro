'use client';

/**
 * Formulaire de check-in École
 * Champs: studentFirstName, studentLastName, className, parentName, parentPhone, parentEmail, notes
 *
 * Pas de departureDate saisie — calculée automatiquement au 30 juin
 * de l'année scolaire en cours (géré côté API).
 */

import { useState } from 'react';
import {
  LogIn, Loader2, User, Phone, Mail,
  GraduationCap, Users, FileText, RotateCcw, Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const INPUT =
  'w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-black text-black ' +
  'placeholder-gray-400 focus:outline-none focus:border-[#E3B23C] ' +
  'focus:ring-2 focus:ring-[#E3B23C] transition';

interface Props {
  reference: string;
  agencyId: string;
  onBack: () => void;
  onSuccess: (summary: string, departureDate: string) => void;
}

export default function SchoolCheckInForm({ reference, agencyId, onBack, onSuccess }: Props) {
  const { toast } = useToast();

  // Année scolaire par défaut : si on est entre jan-juin → année N-1/N, sinon N/N+1
  const now = new Date();
  const year = now.getFullYear();
  const isAfterJune = now.getMonth() >= 6; // 0-indexed, 6 = juillet
  const defaultSchoolYear = isAfterJune
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;

  const [form, setForm] = useState({
    studentFirstName: '',
    studentLastName: '',
    className: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    schoolYear: defaultSchoolYear,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentFirstName.trim() || !form.studentLastName.trim() ||
        !form.className.trim() || !form.parentName.trim() || !form.parentPhone.trim()) {
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
          agencyType: 'school',
          studentFirstName: form.studentFirstName,
          studentLastName: form.studentLastName,
          className: form.className,
          parentName: form.parentName,
          parentPhone: form.parentPhone,
          parentEmail: form.parentEmail || null,
          schoolYear: form.schoolYear || null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec du check-in');
      toast({
        title: 'Check-in réussi 🎉',
        description: `${form.studentFirstName} ${form.studentLastName} — ${form.className}`,
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
          <GraduationCap className="w-5 h-5" />
          Informations élève
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Le QR sera actif jusqu&apos;au 30 juin {defaultSchoolYear.split('-')[1]} (fin d&apos;année scolaire).
        </p>
      </div>

      {/* Nom + Prénom élève */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-black mb-1.5">
            <User className="w-3.5 h-3.5 inline mr-1" />
            Prénom de l&apos;élève <span className="text-red-600">*</span>
          </label>
          <input
            type="text" required autoFocus
            value={form.studentFirstName}
            onChange={(e) => setForm({ ...form, studentFirstName: e.target.value })}
            placeholder="Luc"
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-1.5">
            <User className="w-3.5 h-3.5 inline mr-1" />
            Nom de l&apos;élève <span className="text-red-600">*</span>
          </label>
          <input
            type="text" required
            value={form.studentLastName}
            onChange={(e) => setForm({ ...form, studentLastName: e.target.value })}
            placeholder="Martin"
            className={INPUT}
          />
        </div>
      </div>

      {/* Classe + Année scolaire */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-black mb-1.5">
            <GraduationCap className="w-3.5 h-3.5 inline mr-1" />
            Classe <span className="text-red-600">*</span>
          </label>
          <input
            type="text" required
            value={form.className}
            onChange={(e) => setForm({ ...form, className: e.target.value })}
            placeholder="6ème B"
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-1.5">
            <GraduationCap className="w-3.5 h-3.5 inline mr-1" />
            Année scolaire
          </label>
          <input
            type="text"
            value={form.schoolYear}
            onChange={(e) => setForm({ ...form, schoolYear: e.target.value })}
            placeholder="2025-2026"
            className={INPUT}
          />
        </div>
      </div>

      {/* Parent */}
      <div className="pt-3 border-t-2 border-black/10">
        <h3 className="text-sm font-bold text-black mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Contact parent
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              <User className="w-3.5 h-3.5 inline mr-1" />
              Nom du parent <span className="text-red-600">*</span>
            </label>
            <input
              type="text" required
              value={form.parentName}
              onChange={(e) => setForm({ ...form, parentName: e.target.value })}
              placeholder="Sophie Martin"
              className={INPUT}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-1.5">
                <Phone className="w-3.5 h-3.5 inline mr-1" />
                Téléphone parent <span className="text-red-600">*</span>
              </label>
              <input
                type="tel" required
                value={form.parentPhone}
                onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                placeholder="+33 6 12 34 56 78"
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-1.5">
                <Mail className="w-3.5 h-3.5 inline mr-1" />
                Email parent (optionnel)
              </label>
              <input
                type="email"
                value={form.parentEmail}
                onChange={(e) => setForm({ ...form, parentEmail: e.target.value })}
                placeholder="sophie@email.com"
                className={INPUT}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-black mb-1.5">
          <FileText className="w-3.5 h-3.5 inline mr-1" />
          Notes / Description de l&apos;objet (optionnel)
        </label>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Ex: Cartable bleu, gourde rouge, trousse..."
          className={INPUT + ' resize-none'}
        />
      </div>

      {/* Info: expiration auto */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-[#E3B23C]/15 border-2 border-[#E3B23C]/40 text-sm text-black">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#111111]" />
        <p>
          Le QR s&apos;activera jusqu&apos;au <strong>30 juin {form.schoolYear.split('-')[1] || ''}</strong>.
          Le trouveur contactera l&apos;école (pas le parent directement). L&apos;école
          appellera le parent pour restitution.
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
