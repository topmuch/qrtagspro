'use client';

/**
 * QRTagsPro V4 — Page de connexion Agence
 *
 * Design: split-screen bleu (#134288) à gauche, formulaire blanc à droite.
 * Couleurs: bleu corporate + vert #32ba5d pour les accents.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Loader2,
  Building2, CheckCircle2, Shield, Zap,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';
import { useAuth } from '@/contexts/AuthContext';

export default function AgenceLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'agency' }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        login(data.user);
        router.push('/agence/tableau-de-bord');
      } else {
        setError(data.error || 'Identifiants incorrects');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* ─── LEFT: Hero ─── */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#134288] to-[#0d3266] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 30% 20%, #32ba5d 0%, transparent 50%), radial-gradient(circle at 70% 80%, #32ba5d 0%, transparent 50%)',
          }}
        />

        <div className="relative">
          <QRTagsLogo size="sm" href="/" withHover />
        </div>

        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#32ba5d]/20 border border-[#32ba5d]/40">
            <Building2 className="w-3.5 h-3.5 text-[#32ba5d]" />
            <span className="text-xs font-semibold text-[#32ba5d]">Espace Agence</span>
          </div>
          <h1 className="text-4xl font-black leading-tight">
            Bienvenue sur votre<br />
            <span className="text-[#32ba5d]">espace agence</span>
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Gérez vos QR codes, faites le check-in de vos clients
            et suivez les objets perdus en temps réel.
          </p>

          <div className="space-y-3 pt-4">
            {[
              'Dashboard temps réel par métier',
              'Check-in via scan webcam',
              'Check-out automatique à la date de départ',
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#32ba5d] flex-shrink-0" />
                <span className="text-sm text-blue-100">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-blue-300">
          <Shield className="w-3.5 h-3.5" />
          <span>Connexion sécurisée • Données chiffrées</span>
        </div>
      </div>

      {/* ─── RIGHT: Formulaire ─── */}
      <div className="flex-1 md:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 bg-slate-50">
        <div className="md:hidden mb-8">
          <QRTagsLogo size="sm" href="/" />
        </div>

        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#32ba5d] text-white mb-4">
              <Building2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
              Connexion Agence
            </h2>
            <p className="text-sm text-slate-600">
              Connectez-vous pour accéder à votre dashboard
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@hotel.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#32ba5d] text-white font-bold rounded-lg hover:bg-[#28a54f] hover:-translate-y-0.5 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Connexion...</>
              ) : (
                <>Se connecter <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">OU</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="space-y-2 text-center text-sm">
            <Link
              href="/admin/connexion"
              className="block text-slate-600 hover:text-[#134288] transition"
            >
              Vous êtes superadmin ?{' '}
              <span className="font-semibold text-[#134288] underline">Espace superadmin</span>
            </Link>
            <Link
              href="/login"
              className="block text-xs text-slate-400 hover:text-slate-600"
            >
              ← Retour à la sélection
            </Link>
            <Link
              href="/"
              className="block text-xs text-slate-400 hover:text-slate-600"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
