'use client';

/**
 * QRTagsPro — Page Onboarding (Inscription)
 *
 * Wizard en 4 étapes pour qu'un nouvel établissement crée son compte:
 *   Étape 1: Choix du métier (hôtel, école, clinique, etc.)
 *   Étape 2: Infos établissement (nom, téléphone, adresse, logo)
 *   Étape 3: Compte (email, mot de passe, nom du gérant)
 *   Étape 4: Confirmation → redirection vers login
 *
 * URL: /onboarding
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, ArrowLeft, CheckCircle2, Loader2, Building2,
  Hotel, GraduationCap, Stethoscope, Car, Luggage, Briefcase,
  Phone, MapPin, Mail, Lock, User, Camera, Sparkles,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

const INPUT =
  'w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30 transition';

const METIERS = [
  { value: 'hotel',          label: 'Hôtel',          icon: '🏨', desc: 'Hôtels, résidences, clubs', color: '#134288' },
  { value: 'school',         label: 'École',          icon: '🎓', desc: 'Écoles, collèges, lycées', color: '#32ba5d' },
  { value: 'medical',        label: 'Clinique',       icon: '🏥', desc: 'Cliniques, hôpitaux, EHPAD', color: '#134288' },
  { value: 'car_rental',     label: 'Loueur auto',    icon: '🚗', desc: 'Loueurs de voitures', color: '#32ba5d' },
  { value: 'luggage_locker', label: 'Consigne',       icon: '🧳', desc: 'Consignes gare/aéroport', color: '#134288' },
  { value: 'generic',        label: 'Autre',          icon: '💼', desc: 'Autre métier', color: '#32ba5d' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    // Étape 1
    agencyType: '',
    // Étape 2
    agencyName: '',
    contactPhone: '',
    address: '',
    logoUrl: '',
    // Étape 3
    userName: '',
    userEmail: '',
    userPassword: '',
  });

  // ─── Validations par étape ────────────────────────────────────────
  const validateStep = (s: number): boolean => {
    setError('');
    if (s === 1) {
      if (!form.agencyType) {
        setError('Veuillez choisir votre métier');
        return false;
      }
    }
    if (s === 2) {
      if (!form.agencyName.trim() || form.agencyName.length < 2) {
        setError('Nom de l\'établissement requis (min 2 caractères)');
        return false;
      }
      if (!form.contactPhone.trim() || form.contactPhone.length < 6) {
        setError('Téléphone de réception (WhatsApp) requis');
        return false;
      }
    }
    if (s === 3) {
      if (!form.userName.trim() || form.userName.length < 2) {
        setError('Votre nom requis');
        return false;
      }
      if (!form.userEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.userEmail)) {
        setError('Email valide requis');
        return false;
      }
      if (!form.userPassword || form.userPassword.length < 8) {
        setError('Mot de passe requis (min 8 caractères)');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  // ─── Logo upload ──────────────────────────────────────────────────
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) {
      setError('Logo trop volumineux (max 500KB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, logoUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  // ─── Submit final ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyName: form.agencyName,
          agencyType: form.agencyType,
          contactPhone: form.contactPhone,
          address: form.address || null,
          logoUrl: form.logoUrl || null,
          userName: form.userName,
          userEmail: form.userEmail,
          userPassword: form.userPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création du compte');
      }

      setSuccess(true);
      // Rediriger vers login après 3 secondes
      setTimeout(() => {
        router.push('/agence/connexion');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Succès ───────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#134288] to-[#0d3266] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border-2 border-[#32ba5d]">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#32ba5d]/15 mb-4">
            <CheckCircle2 className="w-12 h-12 text-[#32ba5d]" />
          </div>
          <h1 className="text-2xl font-black text-[#134288] mb-3">Compte créé ! 🎉</h1>
          <p className="text-slate-600 mb-4">
            Votre établissement <strong>{form.agencyName}</strong> est enregistré.
            Vous allez être redirigé vers la page de connexion.
          </p>
          <Loader2 className="w-6 h-6 animate-spin text-[#32ba5d] mx-auto" />
        </div>
      </div>
    );
  }

  // ─── Wizard ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <QRTagsLogo size="sm" href="/" withHover />
          <Link href="/login" className="text-sm text-slate-500 hover:text-[#134288]">
            Déjà un compte ? <span className="font-semibold text-[#134288]">Connexion</span>
          </Link>
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  s < step
                    ? 'bg-[#32ba5d] text-white'
                    : s === step
                    ? 'bg-[#134288] text-white'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                    s < step ? 'bg-[#32ba5d]' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-500 mb-8">
          <span>Métier</span>
          <span>Établissement</span>
          <span>Compte</span>
          <span>Confirmation</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ÉTAPE 1 — Choix du métier */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Quel est votre métier ?</h2>
            <p className="text-slate-500 mb-6">Sélectionnez votre type d'établissement</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {METIERS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setForm({ ...form, agencyType: m.value })}
                  className={`p-5 rounded-2xl text-center transition-all border-2 ${
                    form.agencyType === m.value
                      ? 'border-[#32ba5d] bg-[#32ba5d]/5 shadow-lg scale-105'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-4xl mb-2">{m.icon}</div>
                  <p className="font-bold text-slate-900">{m.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-8">
              <button
                type="button"
                onClick={nextStep}
                disabled={!form.agencyType}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#32ba5d] text-white font-bold rounded-xl hover:bg-[#28a54f] hover:-translate-y-0.5 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 — Infos établissement */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Informations de l'établissement</h2>
            <p className="text-slate-500 mb-6">Ces informations apparaîtront sur la page trouveur</p>

            {/* Logo */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Camera className="w-4 h-4 inline mr-1" /> Logo (optionnel)
              </label>
              <div className="flex items-center gap-4">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="h-16 w-16 object-contain border-2 border-slate-200 rounded-xl bg-white p-1" />
                ) : (
                  <div className="h-16 w-16 border-2 border-dashed border-slate-300 rounded-xl bg-white flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-slate-300" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#32ba5d] file:text-white hover:file:bg-[#28a54f] cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Affiché sur la page trouveur. Max 500KB.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <Building2 className="w-4 h-4 inline mr-1" /> Nom de l'établissement *
                </label>
                <input
                  type="text"
                  value={form.agencyName}
                  onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
                  placeholder="Hôtel Radisson Dakar"
                  className={INPUT}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <Phone className="w-4 h-4 inline mr-1" /> Téléphone réception (WhatsApp) *
                </label>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="+221 33 869 69 69"
                  className={INPUT}
                />
                <p className="text-xs text-slate-500 mt-1">Numéro contacté par le trouveur via WhatsApp</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <MapPin className="w-4 h-4 inline mr-1" /> Adresse (optionnel)
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="12 Rue de la République, Dakar"
                  className={INPUT}
                />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-2 px-5 py-3 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#32ba5d] text-white font-bold rounded-xl hover:bg-[#28a54f] hover:-translate-y-0.5 transition-all shadow-lg"
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 — Compte */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Votre compte</h2>
            <p className="text-slate-500 mb-6">Créez vos identifiants de connexion</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <User className="w-4 h-4 inline mr-1" /> Votre nom complet *
                </label>
                <input
                  type="text"
                  value={form.userName}
                  onChange={(e) => setForm({ ...form, userName: e.target.value })}
                  placeholder="Marie Dupont"
                  className={INPUT}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <Mail className="w-4 h-4 inline mr-1" /> Email *
                </label>
                <input
                  type="email"
                  value={form.userEmail}
                  onChange={(e) => setForm({ ...form, userEmail: e.target.value })}
                  placeholder="marie@hotel-radisson.com"
                  className={INPUT}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <Lock className="w-4 h-4 inline mr-1" /> Mot de passe * (min 8 caractères)
                </label>
                <input
                  type="password"
                  value={form.userPassword}
                  onChange={(e) => setForm({ ...form, userPassword: e.target.value })}
                  placeholder="••••••••"
                  className={INPUT}
                />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-2 px-5 py-3 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <button
                type="button"
                onClick={() => { if (validateStep(3)) setStep(4); }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#32ba5d] text-white font-bold rounded-xl hover:bg-[#28a54f] hover:-translate-y-0.5 transition-all shadow-lg"
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 4 — Confirmation */}
        {step === 4 && (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Confirmation</h2>
            <p className="text-slate-500 mb-6">Vérifiez vos informations avant de créer le compte</p>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-3 mb-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded-lg border border-slate-200 bg-white p-1" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-[#134288] flex items-center justify-center text-2xl">
                    {METIERS.find(m => m.value === form.agencyType)?.icon || '🏢'}
                  </div>
                )}
                <div>
                  <p className="font-bold text-slate-900 text-lg">{form.agencyName}</p>
                  <p className="text-sm text-slate-500">{METIERS.find(m => m.value === form.agencyType)?.label}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">TÉLÉPHONE</p>
                  <p className="text-slate-900 font-medium">{form.contactPhone}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">ADRESSE</p>
                  <p className="text-slate-900 font-medium">{form.address || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">VOTRE NOM</p>
                  <p className="text-slate-900 font-medium">{form.userName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">EMAIL</p>
                  <p className="text-slate-900 font-medium">{form.userEmail}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#32ba5d]/10 border border-[#32ba5d]/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-[#134288]">
                ✅ En cliquant sur "Créer mon compte", votre établissement sera enregistré.
                Le superadmin devra générer des QR codes pour vous avant que vous puissiez faire
                votre premier check-in.
              </p>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-3 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#32ba5d] text-white font-bold rounded-xl hover:bg-[#28a54f] hover:-translate-y-0.5 transition-all shadow-lg disabled:opacity-60"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Création...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Créer mon compte</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
