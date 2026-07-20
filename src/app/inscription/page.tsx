'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  GraduationCap,
  Luggage,
  Car,
  Stethoscope,
  Package,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Sparkles,
  Mail,
  Lock,
  Phone,
  User,
  MapPin,
  Briefcase,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';
import { AGENCY_TYPES } from '@/lib/agency-types';

const COLORS = {
  bg: '#ffffff',
  bgAlt: '#fafafa',
  text: '#0d0d0f',
  textMuted: '#525252',
  accent: '#FDB900',
  accentAlt: '#E3B23C',
  accentDark: '#c89a00',
  card: '#ffffff',
  border: '#e5e5e5',
  borderAccent: 'rgba(253, 185, 0, 0.3)',
};

export default function InscriptionPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    // Étape 1 : choix métier
    agencyType: 'hotel',
    // Étape 2 : infos entreprise
    name: '',
    email: '',
    phone: '',
    address: '',
    // Étape 3 : compte utilisateur
    password: '',
    confirmPassword: '',
  });

  const selectedType = AGENCY_TYPES.find((t) => t.value === form.agencyType);

  const validateStep1 = () => {
    if (!form.agencyType) {
      setError('Veuillez sélectionner votre type d\'activité');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setError('');
    if (!form.name.trim()) {
      setError('Le nom de votre entreprise est requis');
      return false;
    }
    if (!form.email.trim()) {
      setError('L\'email professionnel est requis');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Format d\'email invalide');
      return false;
    }
    if (!form.phone.trim()) {
      setError('Le téléphone est requis');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    setError('');
    if (!form.password || form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    if (!/[A-Z]/.test(form.password)) {
      setError('Le mot de passe doit contenir au moins une majuscule');
      return false;
    }
    if (!/\d/.test(form.password)) {
      setError('Le mot de passe doit contenir au moins un chiffre');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setLoading(true);
    setError('');

    try {
      // ─── 1. Créer l'agence ──────────────────────────────────
      const agencyResp = await fetch('/api/admin/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          agencyType: form.agencyType,
        }),
      });

      const agencyData = await agencyResp.json();

      if (!agencyResp.ok) {
        setError(agencyData.error || 'Erreur lors de la création de l\'entreprise');
        setLoading(false);
        return;
      }

      // ─── 2. Créer l'utilisateur admin de l'agence ──────────
      const userResp = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          password: form.password,
          role: 'agency',
          agencyId: agencyData.agency.id,
        }),
      });

      if (!userResp.ok) {
        const userErr = await userResp.json();
        // L'agence est créée mais l'utilisateur a échoué
        console.warn('Agence créée mais utilisateur échoué:', userErr);
      }

      // ─── 3. Succès ──────────────────────────────────────────
      setSuccess(true);
      setLoading(false);

      // Redirection auto après 3s vers la page de connexion
      setTimeout(() => {
        router.push('/agence/connexion');
      }, 3000);
    } catch (err) {
      console.error('Erreur inscription:', err);
      setError('Erreur réseau. Veuillez réessayer.');
      setLoading(false);
    }
  };

  // ─── ÉCRAN SUCCÈS ───────────────────────────────────────────
  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center p-5" style={{ background: COLORS.bg }}>
        <div
          className="max-w-md w-full rounded-3xl p-8 text-center"
          style={{ background: COLORS.card, border: `2px solid ${COLORS.accent}` }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: COLORS.accent }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: COLORS.text }} />
          </div>
          <h1 className="text-3xl font-black mb-3" style={{ color: COLORS.text }}>
            Inscription réussie !
          </h1>
          <p className="mb-6" style={{ color: COLORS.textMuted }}>
            Votre compte entreprise <strong>{form.name}</strong> a été créé.
            <br />
            Vous allez être redirigé vers la page de connexion.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: COLORS.textMuted }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirection en cours...
          </div>
          <Link
            href="/agence/connexion"
            className="inline-block mt-4 px-6 py-3 rounded-xl font-bold"
            style={{ background: COLORS.accent, color: COLORS.text }}
          >
            Aller à la connexion maintenant
          </Link>
        </div>
      </main>
    );
  }

  // ─── FORMULAIRE MULTI-ÉTAPES ────────────────────────────────
  return (
    <main className="min-h-screen py-12 px-5" style={{ background: COLORS.bgAlt }}>
      <div className="max-w-2xl mx-auto">
        {/* Logo + retour */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm" style={{ color: COLORS.textMuted }}>
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <QRTagsLogo size="sm" variant="light" />
        </div>

        {/* Titre */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{ background: '#fffdf5', border: `1px solid ${COLORS.borderAccent}` }}
          >
            <Sparkles className="w-4 h-4" style={{ color: COLORS.accentDark }} />
            <span className="text-sm font-medium" style={{ color: COLORS.accentDark }}>
              Inscription entreprise
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3" style={{ color: COLORS.text }}>
            Créez votre compte QRTags
          </h1>
          <p className="text-base" style={{ color: COLORS.textMuted }}>
            Étape {step}/3 — {step === 1 ? 'Votre activité' : step === 2 ? 'Votre entreprise' : 'Votre compte'}
          </p>
        </div>

        {/* Barre de progression */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="flex-1 h-2 rounded-full transition-all"
              style={{
                background: s <= step ? COLORS.accent : COLORS.border,
              }}
            />
          ))}
        </div>

        {/* Card formulaire */}
        <div
          className="rounded-2xl p-8"
          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
        >
          {/* ─── ÉTAPE 1 : CHOIX MÉTIER ─── */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>
                Quel est votre type d'activité ?
              </h2>
              <p className="text-sm mb-6" style={{ color: COLORS.textMuted }}>
                Sélectionnez le métier qui correspond à votre entreprise. Cette option détermine les champs dynamiques de vos tags.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {AGENCY_TYPES.map((t) => {
                  const Icon = {
                    hotel: Building2,
                    school: GraduationCap,
                    luggage_locker: Luggage,
                    car_rental: Car,
                    medical: Stethoscope,
                    generic: Package,
                  }[t.value] || Package;
                  const isSelected = form.agencyType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm({ ...form, agencyType: t.value })}
                      className="p-4 rounded-xl text-left transition-all"
                      style={{
                        background: isSelected ? '#fffdf5' : COLORS.bgAlt,
                        border: `2px solid ${isSelected ? COLORS.accent : COLORS.border}`,
                      }}
                    >
                      <Icon
                        className="w-6 h-6 mb-2"
                        style={{ color: isSelected ? COLORS.accentDark : COLORS.textMuted }}
                      />
                      <div className="font-bold text-sm" style={{ color: COLORS.text }}>{t.label}</div>
                    </button>
                  );
                })}
              </div>

              {/* Description du métier sélectionné */}
              {selectedType && (
                <div
                  className="rounded-xl p-4 mb-6"
                  style={{ background: '#fffdf5', border: `1px solid ${COLORS.borderAccent}` }}
                >
                  <div className="text-sm font-bold mb-1" style={{ color: COLORS.accentDark }}>
                    {selectedType.label}
                  </div>
                  <div className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                    {selectedType.description}
                  </div>
                  <div className="text-xs" style={{ color: COLORS.textMuted }}>
                    <strong>Champs personnalisés :</strong>{' '}
                    {selectedType.customFields.map((f) => f.label).join(', ')}
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-600 mb-4">⚠️ {error}</p>}

              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) {
                    setError('');
                    setStep(2);
                  }
                }}
                className="w-full py-4 rounded-xl font-bold text-base inline-flex items-center justify-center gap-2 transition-all hover:scale-105"
                style={{ background: COLORS.accent, color: COLORS.text }}
              >
                Continuer
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ─── ÉTAPE 2 : INFOS ENTREPRISE ─── */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.text }}>
                Informations de votre entreprise
              </h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: COLORS.text }}>
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2"
                    style={{ borderColor: COLORS.border }}
                    placeholder="Hôtel Le Royal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: COLORS.text }}>
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email professionnel *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2"
                    style={{ borderColor: COLORS.border }}
                    placeholder="contact@hotel-leroyal.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: COLORS.text }}>
                    <Phone className="w-4 h-4 inline mr-1" />
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2"
                    style={{ borderColor: COLORS.border }}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: COLORS.text }}>
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Adresse (optionnel)
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2"
                    style={{ borderColor: COLORS.border }}
                    placeholder="12 rue de la Paix, 75002 Paris"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-600 mb-4">⚠️ {error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep(1);
                  }}
                  className="flex-1 py-4 rounded-xl font-bold border-2"
                  style={{ borderColor: COLORS.border, color: COLORS.text }}
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) {
                      setError('');
                      setStep(3);
                    }
                  }}
                  className="flex-[2] py-4 rounded-xl font-bold inline-flex items-center justify-center gap-2"
                  style={{ background: COLORS.accent, color: COLORS.text }}
                >
                  Continuer
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ─── ÉTAPE 3 : COMPTE UTILISATEUR ─── */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>
                Créez votre mot de passe
              </h2>
              <p className="text-sm mb-6" style={{ color: COLORS.textMuted }}>
                Ces identifiants vous serviront à vous connecter à votre dashboard entreprise.
              </p>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: COLORS.text }}>
                    <User className="w-4 h-4 inline mr-1" />
                    Email de connexion
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border-2 opacity-60"
                    style={{ borderColor: COLORS.border, background: COLORS.bgAlt }}
                  />
                  <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                    Identique à l'email professionnel saisi à l'étape précédente
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: COLORS.text }}>
                    <Lock className="w-4 h-4 inline mr-1" />
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2"
                    style={{ borderColor: COLORS.border }}
                    placeholder="••••••••"
                  />
                  <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                    Min. 8 caractères, 1 majuscule, 1 chiffre
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: COLORS.text }}>
                    <Lock className="w-4 h-4 inline mr-1" />
                    Confirmer le mot de passe *
                  </label>
                  <input
                    type="password"
                    required
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2"
                    style={{ borderColor: COLORS.border }}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Récap métier */}
              <div
                className="rounded-xl p-4 mb-6 text-sm"
                style={{ background: COLORS.bgAlt, border: `1px solid ${COLORS.border}` }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: COLORS.textMuted }}>Type d'activité :</span>
                  <strong style={{ color: COLORS.text }}>{selectedType?.label}</strong>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span style={{ color: COLORS.textMuted }}>Entreprise :</span>
                  <strong style={{ color: COLORS.text }}>{form.name}</strong>
                </div>
              </div>

              {error && <p className="text-sm text-red-600 mb-4">⚠️ {error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep(2);
                  }}
                  className="flex-1 py-4 rounded-xl font-bold border-2"
                  style={{ borderColor: COLORS.border, color: COLORS.text }}
                  disabled={loading}
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] py-4 rounded-xl font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: COLORS.accent, color: COLORS.text }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      Créer mon compte
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Aide */}
        <p className="text-center text-sm mt-6" style={{ color: COLORS.textMuted }}>
          Déjà un compte ?{' '}
          <Link href="/agence/connexion" className="font-bold" style={{ color: COLORS.accentDark }}>
            Connectez-vous
          </Link>
        </p>
      </div>
    </main>
  );
}
