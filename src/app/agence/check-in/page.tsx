'use client';

/**
 * QRTagsPro V1 — Page Check-in Hôtel
 *
 * Workflow:
 *   1. Saisir/scanner la référence QR (via webcam ou saisie manuelle)
 *   2. Vérifier que le QR appartient à l'agence et est en stock
 *   3. Remplir le formulaire client (nom, chambre, dates, téléphone)
 *   4. Soumettre → POST /api/agency/check-in
 *   5. Afficher la confirmation
 *
 * Design: cartes blanches + bordures noires 2px + fond jaune moutarde.
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, LogIn, Loader2, QrCode, Info, Camera,
  CheckCircle2, AlertCircle, User, Phone, Mail, BedDouble,
  CalendarDays, FileText, RotateCcw,
} from 'lucide-react';
import { useAgency } from '../layout';
import { useToast } from '@/hooks/use-toast';
import QRScanner from '@/components/qrtags/QRScanner';

const INPUT =
  'w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-black text-black ' +
  'placeholder-gray-400 focus:outline-none focus:border-[#E3B23C] ' +
  'focus:ring-2 focus:ring-[#E3B23C] transition';

type Step = 'scan' | 'form' | 'success';

interface CheckInResult {
  reference: string;
  clientName: string;
  roomNumber: string;
  arrivalDate: string;
  departureDate: string;
  expiresAt: string | null;
}

export default function CheckInPage() {
  const { agencyId, agencyName } = useAgency();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('scan');
  const [scannerOpen, setScannerOpen] = useState(false);

  // Référence QR
  const [reference, setReference] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Formulaire
  const [form, setForm] = useState({
    clientName: '',
    roomNumber: '',
    arrivalDate: new Date().toISOString().slice(0, 10), // aujourd'hui par défaut
    departureDate: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);

  // ─── Vérifier la référence QR ────────────────────────────────────
  const verifyReference = useCallback(async (ref: string) => {
    if (!ref.trim() || !agencyId) return;
    setVerifying(true);
    try {
      const res = await fetch(
        `/api/agency/check-in?reference=${encodeURIComponent(ref.trim())}&agencyId=${encodeURIComponent(agencyId)}`,
        { cache: 'no-store' }
      );
      const data = await res.json();

      if (!res.ok || !data.available) {
        toast({
          title: 'QR invalide',
          description: data.error || 'QR non disponible pour check-in',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'QR validé',
        description: `${ref} prêt pour check-in`,
      });
      setReference(ref.trim().toUpperCase());
      setStep('form');
    } catch (err) {
      toast({
        title: 'Erreur réseau',
        description: 'Impossible de vérifier le QR',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  }, [agencyId, toast]);

  const handleScan = (decodedText: string) => {
    setScannerOpen(false);
    // Extraire la référence de l'URL si le QR contient une URL
    // (ex: https://qrtags.com/scan/QRT26-ABCD12 → QRT26-ABCD12)
    const match = decodedText.match(/([A-Z]{3}\d{2}-[A-Z0-9]{6})/i);
    const ref = match ? match[1].toUpperCase() : decodedText.trim().toUpperCase();
    setReference(ref);
    verifyReference(ref);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyReference(reference);
  };

  // ─── Soumettre le check-in ───────────────────────────────────────
  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.clientName.trim() || !form.roomNumber.trim() || !form.departureDate) {
      toast({
        title: 'Champs manquants',
        description: 'Nom, chambre et date de départ sont obligatoires',
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
          clientName: form.clientName,
          roomNumber: form.roomNumber,
          arrivalDate: form.arrivalDate,
          departureDate: form.departureDate,
          phone: form.phone || null,
          email: form.email || null,
          notes: form.notes || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Échec du check-in');
      }

      setResult({
        reference: data.baggage.reference,
        clientName: data.baggage.clientName,
        roomNumber: data.baggage.roomNumber,
        arrivalDate: data.baggage.arrivalDate,
        departureDate: data.baggage.departureDate,
        expiresAt: data.baggage.expiresAt,
      });
      setStep('success');
      toast({
        title: 'Check-in réussi 🎉',
        description: `${form.clientName} — Chambre ${form.roomNumber}`,
      });
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

  // ─── Nouveau check-in ────────────────────────────────────────────
  const handleNewCheckIn = () => {
    setReference('');
    setForm({
      clientName: '',
      roomNumber: '',
      arrivalDate: new Date().toISOString().slice(0, 10),
      departureDate: '',
      phone: '',
      email: '',
      notes: '',
    });
    setResult(null);
    setStep('scan');
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <Link
          href="/agence/tableau-de-bord"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-black mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-black">Check-in client</h1>
        <p className="text-sm text-slate-500">
          {agencyName} — Activez un QR code pour un nouveau client.
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 text-xs font-semibold">
        <div className={`flex items-center gap-1.5 ${step === 'scan' ? 'text-black' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step === 'scan' ? 'bg-black text-[#E3B23C]' : 'bg-slate-200 text-slate-500'}`}>
            {step === 'scan' ? '1' : <CheckCircle2 className="w-3.5 h-3.5" />}
          </span>
          Scanner le QR
        </div>
        <div className="flex-1 h-0.5 bg-slate-200" />
        <div className={`flex items-center gap-1.5 ${step === 'form' ? 'text-black' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step === 'form' ? 'bg-black text-[#E3B23C]' : step === 'success' ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
            {step === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : '2'}
          </span>
          Infos client
        </div>
        <div className="flex-1 h-0.5 bg-slate-200" />
        <div className={`flex items-center gap-1.5 ${step === 'success' ? 'text-black' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step === 'success' ? 'bg-black text-[#E3B23C]' : 'bg-slate-200 text-slate-500'}`}>
            3
          </span>
          Confirmation
        </div>
      </div>

      {/* ═════ STEP 1: SCAN ═════ */}
      {step === 'scan' && (
        <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-xl space-y-5">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E3B23C]/20 mb-3">
              <QrCode className="w-8 h-8 text-black" />
            </div>
            <h2 className="text-lg font-bold text-black mb-1">Étape 1 — Scanner le QR code</h2>
            <p className="text-sm text-slate-600">
              Scannez le sticker QR du client avec la caméra, ou saisissez la référence manuellement.
            </p>
          </div>

          {/* Scan button */}
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            disabled={verifying}
            className="w-full py-4 rounded-xl bg-black text-[#E3B23C] font-bold border-2 border-black hover:-translate-y-0.5 transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Camera className="w-5 h-5" />
            Ouvrir le scanner caméra
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">OU</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Manual entry */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label htmlFor="reference" className="block text-sm font-semibold text-black mb-1.5">
                Saisir la référence QR <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="reference"
                  type="text"
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value.toUpperCase())}
                  placeholder="QRT26-ABCD12"
                  className={INPUT + ' pl-10 font-mono uppercase'}
                  autoCapitalize="characters"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Format : 3 lettres + 2 chiffres + tiret + 6 caractères (ex: QRT26-ABCD12)
              </p>
            </div>

            <button
              type="submit"
              disabled={!reference.trim() || verifying}
              className="w-full py-3 rounded-xl bg-[#E3B23C] text-black font-bold border-2 border-black hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Vérifier le QR
                </>
              )}
            </button>
          </form>

          {/* Info banner */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#E3B23C]/15 border-2 border-[#E3B23C]/40 text-sm text-black">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#111111]" />
            <p>
              Le QR doit appartenir à votre stock (statut « en attente »).
              Si le QR est déjà activé, faites d&apos;abord un check-out.
            </p>
          </div>
        </div>
      )}

      {/* ═════ STEP 2: FORM ═════ */}
      {step === 'form' && (
        <form
          onSubmit={handleCheckIn}
          className="bg-white rounded-2xl p-6 border-2 border-black shadow-xl space-y-4"
        >
          {/* Référence (read-only) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 border-2 border-black/20">
            <div>
              <p className="text-xs text-slate-500 font-medium">Référence QR</p>
              <p className="font-mono font-bold text-black">{reference}</p>
            </div>
            <button
              type="button"
              onClick={() => setStep('scan')}
              className="text-xs px-3 py-1.5 rounded-lg bg-white border border-black/20 hover:bg-black/5 transition flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Changer
            </button>
          </div>

          <div className="pt-2">
            <h2 className="text-lg font-bold text-black mb-1">Étape 2 — Informations client</h2>
            <p className="text-sm text-slate-600 mb-4">
              Renseignez les infos du client et son séjour.
            </p>
          </div>

          {/* Nom du client */}
          <div>
            <label htmlFor="clientName" className="block text-sm font-semibold text-black mb-1.5">
              <User className="w-3.5 h-3.5 inline mr-1" />
              Nom complet du client <span className="text-red-600">*</span>
            </label>
            <input
              id="clientName"
              type="text"
              required
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              placeholder="Marie Dupont"
              className={INPUT}
              autoFocus
            />
          </div>

          {/* N° chambre */}
          <div>
            <label htmlFor="roomNumber" className="block text-sm font-semibold text-black mb-1.5">
              <BedDouble className="w-3.5 h-3.5 inline mr-1" />
              N° de chambre <span className="text-red-600">*</span>
            </label>
            <input
              id="roomNumber"
              type="text"
              required
              value={form.roomNumber}
              onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
              placeholder="204"
              className={INPUT}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="arrivalDate" className="block text-sm font-semibold text-black mb-1.5">
                <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
                Date d&apos;arrivée <span className="text-red-600">*</span>
              </label>
              <input
                id="arrivalDate"
                type="date"
                required
                value={form.arrivalDate}
                onChange={(e) => setForm({ ...form, arrivalDate: e.target.value })}
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="departureDate" className="block text-sm font-semibold text-black mb-1.5">
                <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
                Date de départ <span className="text-red-600">*</span>
              </label>
              <input
                id="departureDate"
                type="date"
                required
                min={form.arrivalDate}
                value={form.departureDate}
                onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
                className={INPUT}
              />
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-black mb-1.5">
              <Phone className="w-3.5 h-3.5 inline mr-1" />
              Téléphone client (optionnel)
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+33 6 12 34 56 78"
              className={INPUT}
            />
            <p className="mt-1 text-xs text-slate-500">
              Utilisé si l&apos;agence doit contacter le client pour restitution.
            </p>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-black mb-1.5">
              <Mail className="w-3.5 h-3.5 inline mr-1" />
              Email client (optionnel)
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="marie@email.com"
              className={INPUT}
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-black mb-1.5">
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              Notes / Description de l&apos;objet (optionnel)
            </label>
            <textarea
              id="notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ex: Valise noire rigide, sac à dos rouge..."
              className={INPUT + ' resize-none'}
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <Link
              href="/agence/tableau-de-bord"
              className="inline-flex items-center px-5 py-3 rounded-xl bg-white border-2 border-black text-sm font-semibold text-black hover:-translate-y-0.5 transition-transform"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-black text-[#E3B23C] text-sm font-semibold border-2 border-black hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Check-in…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Valider le check-in
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ═════ STEP 3: SUCCESS ═════ */}
      {step === 'success' && result && (
        <div className="bg-white rounded-2xl p-8 border-2 border-black shadow-xl text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-2">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-black">Check-in réussi !</h2>
          <p className="text-sm text-slate-600">
            Le QR code est maintenant actif pour ce client.
          </p>

          {/* Récap */}
          <div className="bg-gray-50 rounded-xl p-4 border-2 border-black/20 text-left space-y-2 my-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Référence QR</span>
              <span className="font-mono font-bold text-black">{result.reference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Client</span>
              <span className="font-bold text-black">{result.clientName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Chambre</span>
              <span className="font-bold text-black">{result.roomNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Séjour</span>
              <span className="font-bold text-black">
                {formatDate(result.arrivalDate)} → {formatDate(result.departureDate)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Expire le</span>
              <span className="font-bold text-black">{formatDate(result.departureDate)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={handleNewCheckIn}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-black text-[#E3B23C] text-sm font-semibold border-2 border-black hover:-translate-y-0.5 transition-transform"
            >
              <RotateCcw className="w-4 h-4" />
              Nouveau check-in
            </button>
            <Link
              href="/agence/tableau-de-bord"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border-2 border-black text-sm font-semibold text-black hover:-translate-y-0.5 transition-transform"
            >
              <ArrowLeft className="w-4 h-4" />
              Tableau de bord
            </Link>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {scannerOpen && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
}
