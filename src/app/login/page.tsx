'use client';

/**
 * QRTagsPro V4 — Page de sélection de connexion
 *
 * Point d'entrée unique pour se connecter:
 *   - Espace Superadmin (gestion globale)
 *   - Espace Agence (hôtel, école, clinique, etc.)
 *
 * Design: split-screen avec hero bleu à gauche, choix à droite.
 */

import Link from 'next/link';
import {
  ArrowRight, Shield, Building2, Lock, Sparkles,
  CheckCircle2, QrCode,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* ─── LEFT: Hero (desktop only) ─── */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#134288] to-[#0d3266] text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Pattern décoratif */}
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
            <Sparkles className="w-3.5 h-3.5 text-[#32ba5d]" />
            <span className="text-xs font-semibold text-[#32ba5d]">Plateforme de gestion d'objets perdus</span>
          </div>
          <h1 className="text-4xl font-black leading-tight">
            La gestion d'objets perdus,<br />
            <span className="text-[#32ba5d]">simple et professionnelle</span>
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Connectez-vous pour gérer vos QR codes, suivre vos clients
            et coordonner les restitutions.
          </p>

          {/* Features */}
          <div className="space-y-3 pt-4">
            {[
              'Dashboard temps réel par métier',
              'Check-in via scan webcam',
              'WhatsApp WAME pour le trouveur',
              'Auto-expiration à la date de départ',
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#32ba5d] flex-shrink-0" />
                <span className="text-sm text-blue-100">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-blue-300">
          <Lock className="w-3.5 h-3.5" />
          <span>Connexion sécurisée • Données chiffrées</span>
        </div>
      </div>

      {/* ─── RIGHT: Login selection ─── */}
      <div className="flex-1 md:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 bg-slate-50">
        {/* Mobile logo */}
        <div className="md:hidden mb-8">
          <QRTagsLogo size="sm" href="/" />
        </div>

        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
              Connexion
            </h2>
            <p className="text-sm text-slate-600">
              Choisissez votre espace pour vous connecter
            </p>
          </div>

          {/* Carte Superadmin */}
          <Link
            href="/admin/connexion"
            className="block bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-[#134288] hover:shadow-lg transition-all mb-4 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#134288] flex items-center justify-center text-white flex-shrink-0 group-hover:scale-105 transition-transform">
                <Shield className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-1">Espace Superadmin</h3>
                <p className="text-xs text-slate-500">
                  Gestion globale : agences, métiers, génération QR
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#134288] group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* Carte Agence */}
          <Link
            href="/agence/connexion"
            className="block bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-[#32ba5d] hover:shadow-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#32ba5d] flex items-center justify-center text-white flex-shrink-0 group-hover:scale-105 transition-transform">
                <Building2 className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-1">Espace Agence</h3>
                <p className="text-xs text-slate-500">
                  Hôtel, école, clinique... Check-in et dashboard
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#32ba5d] group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">OU</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Demande de démo */}
          <Link
            href="/demo"
            className="block text-center text-sm text-slate-600 hover:text-[#134288] transition"
          >
            Pas encore client ?{' '}
            <span className="font-semibold text-[#134288] underline">
              Demandez une démo
            </span>
          </Link>

          {/* Retour accueil */}
          <Link
            href="/"
            className="block text-center text-xs text-slate-400 hover:text-slate-600 mt-4"
          >
            ← Retour à l'accueil
          </Link>
        </div>

        {/* Footer mobile */}
        <div className="md:hidden mt-8 flex items-center gap-2 text-xs text-slate-400">
          <Lock className="w-3.5 h-3.5" />
          <span>Connexion sécurisée</span>
        </div>
      </div>
    </div>
  );
}
