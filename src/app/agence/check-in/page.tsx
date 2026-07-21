'use client';

/**
 * QRTagsPro V2 — Page Check-in Multi-métiers
 *
 * Workflow:
 *   1. Saisir/scanner la référence QR (via webcam ou saisie manuelle)
 *   2. Vérifier que le QR appartient à l'agence et est en stock
 *   3. Afficher le formulaire SPÉCIFIQUE au agencyType (hotel / school / ...)
 *   4. Soumettre → POST /api/agency/check-in
 *   5. Afficher la confirmation
 *
 * Design: cartes blanches + bordures noires 2px + fond jaune moutarde.
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, QrCode, Info, Camera,
  CheckCircle2, RotateCcw,
} from 'lucide-react';
import { useAgency } from '../layout';
import { useToast } from '@/hooks/use-toast';
import QRScanner from '@/components/qrtags/QRScanner';
import HotelCheckInForm from '@/components/checkin/HotelCheckInForm';
import SchoolCheckInForm from '@/components/checkin/SchoolCheckInForm';
import MedicalCheckInForm from '@/components/checkin/MedicalCheckInForm';
import CarRentalCheckInForm from '@/components/checkin/CarRentalCheckInForm';
import LuggageLockerCheckInForm from '@/components/checkin/LuggageLockerCheckInForm';
import DynamicCheckInForm, { CustomField } from '@/components/checkin/DynamicCheckInForm';

const INPUT =
  'w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-black text-black ' +
  'placeholder-gray-400 focus:outline-none focus:border-[#E3B23C] ' +
  'focus:ring-2 focus:ring-[#E3B23C] transition';

type Step = 'scan' | 'form' | 'success';

interface SuccessInfo {
  reference: string;
  summary: string;
  departureDate: string;
}

// Libellés des types d'agence pour affichage
const AGENCY_TYPE_LABELS: Record<string, string> = {
  hotel: '🏨 Hôtel',
  school: '🎓 École',
  luggage_locker: '🧳 Consigne',
  car_rental: '🚗 Loueur auto',
  medical: '🏥 Clinique',
  generic: '💼 Général',
};

export default function CheckInPage() {
  const { agencyId, agencyName, agencyType, customTypeId, customType } = useAgency();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('scan');
  const [scannerOpen, setScannerOpen] = useState(false);

  const [reference, setReference] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);

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
    const match = decodedText.match(/([A-Z]{3}\d{2}-[A-Z0-9]{6})/i);
    const ref = match ? match[1].toUpperCase() : decodedText.trim().toUpperCase();
    setReference(ref);
    verifyReference(ref);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyReference(reference);
  };

  const handleSuccess = (summary: string, departureDate: string) => {
    setSuccess({ reference, summary, departureDate });
    setStep('success');
  };

  const handleNewCheckIn = () => {
    setReference('');
    setSuccess(null);
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

  const agencyLabel = agencyType ? (AGENCY_TYPE_LABELS[agencyType] || agencyType) : '';

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
        <h1 className="text-2xl font-bold text-black">
          Check-in {agencyLabel}
        </h1>
        <p className="text-sm text-slate-500">
          {agencyName} — Activez un QR code pour un nouvel élément.
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
          Infos
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
              Scannez le sticker QR avec la caméra, ou saisissez la référence manuellement.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            disabled={verifying}
            className="w-full py-4 rounded-xl bg-black text-[#E3B23C] font-bold border-2 border-black hover:-translate-y-0.5 transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Camera className="w-5 h-5" />
            Ouvrir le scanner caméra
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">OU</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

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
                <><Loader2 className="w-4 h-4 animate-spin" /> Vérification...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Vérifier le QR</>
              )}
            </button>
          </form>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#E3B23C]/15 border-2 border-[#E3B23C]/40 text-sm text-black">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#111111]" />
            <p>
              Le QR doit appartenir à votre stock (statut « en attente »).
              Si le QR est déjà activé, faites d&apos;abord un check-out.
            </p>
          </div>
        </div>
      )}

      {/* ═════ STEP 2: FORM (dépend de agencyType) ═════ */}
      {step === 'form' && (
        <>
          {!agencyType && (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 text-sm text-red-700">
              Type d&apos;agence non défini. Contactez le superadmin pour configurer
              le <code>agencyType</code> de votre agence.
            </div>
          )}
          {agencyType === 'hotel' && (
            <HotelCheckInForm
              reference={reference}
              agencyId={agencyId}
              onBack={() => setStep('scan')}
              onSuccess={handleSuccess}
            />
          )}
          {agencyType === 'school' && (
            <SchoolCheckInForm
              reference={reference}
              agencyId={agencyId}
              onBack={() => setStep('scan')}
              onSuccess={handleSuccess}
            />
          )}
          {agencyType === 'medical' && (
            <MedicalCheckInForm
              reference={reference}
              agencyId={agencyId}
              onBack={() => setStep('scan')}
              onSuccess={handleSuccess}
            />
          )}
          {agencyType === 'car_rental' && (
            <CarRentalCheckInForm
              reference={reference}
              agencyId={agencyId}
              onBack={() => setStep('scan')}
              onSuccess={handleSuccess}
            />
          )}
          {agencyType === 'luggage_locker' && (
            <LuggageLockerCheckInForm
              reference={reference}
              agencyId={agencyId}
              onBack={() => setStep('scan')}
              onSuccess={handleSuccess}
            />
          )}
          {agencyType === 'custom' && customType && customTypeId && (
            <DynamicCheckInForm
              reference={reference}
              agencyId={agencyId}
              customTypeId={customTypeId}
              customTypeName={customType.name}
              fieldsSchema={JSON.parse(customType.fieldsSchema) as CustomField[]}
              onBack={() => setStep('scan')}
              onSuccess={handleSuccess}
            />
          )}
          {agencyType === 'custom' && (!customType || !customTypeId) && (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 text-sm text-red-700">
              <p className="font-bold mb-1">⚠️ Configuration incomplète</p>
              <p>
                Type d&apos;agence personnalisé mais aucune configuration trouvée.
                Contactez le superadmin pour configurer le métier personnalisé de votre agence.
              </p>
            </div>
          )}
          {agencyType && !['hotel', 'school', 'medical', 'car_rental', 'luggage_locker', 'custom'].includes(agencyType) && (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6 text-center">
              <p className="font-bold text-black mb-2">
                🚧 Type d&apos;agence « {agencyType} » — formulaire en développement
              </p>
              <p className="text-sm text-slate-700 mb-4">
                Le check-in pour ce métier n&apos;est pas encore disponible.
                Utilisez le check-in manuel via le tableau de bord pour le moment.
              </p>
              <Link
                href="/agence/tableau-de-bord"
                className="inline-block px-5 py-2.5 rounded-xl bg-black text-[#E3B23C] font-semibold text-sm"
              >
                Retour au tableau de bord
              </Link>
            </div>
          )}
        </>
      )}

      {/* ═════ STEP 3: SUCCESS ═════ */}
      {step === 'success' && success && (
        <div className="bg-white rounded-2xl p-8 border-2 border-black shadow-xl text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-2">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-black">Check-in réussi !</h2>
          <p className="text-sm text-slate-600">
            Le QR code est maintenant actif. {agencyLabel}.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 border-2 border-black/20 text-left space-y-2 my-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Référence QR</span>
              <span className="font-mono font-bold text-black">{success.reference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Détails</span>
              <span className="font-bold text-black">{success.summary}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Expire le</span>
              <span className="font-bold text-black">{formatDate(success.departureDate)}</span>
            </div>
          </div>

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

      {scannerOpen && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
}
