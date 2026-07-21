'use client';

/**
 * QRTagsPro V1 — Landing page (B2B)
 *
 * FR only — no i18n. Black (#111111) + mustard yellow (#E3B23C) design tokens.
 * Sections: Header → Hero → Comment ça marche → Métiers → Avantages → Démo → Footer
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  QrCode,
  ScanLine,
  MessageCircle,
  ClipboardCheck,
  Hotel,
  GraduationCap,
  Stethoscope,
  Car,
  Luggage,
  Briefcase,
  ShieldCheck,
  BarChart3,
  Bell,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

// ─── Design tokens ───
const COLORS = {
  bg: '#111111',
  accent: '#E3B23C',
  card: '#FFFFFF',
  ink: '#111111',
  muted: '#525252',
};

const PRIMARY_BTN =
  'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl ' +
  'bg-black text-[#E3B23C] font-semibold border-2 border-[#E3B23C] ' +
  'transition-transform duration-200 hover:-translate-y-0.5 ' +
  'focus:outline-none focus:ring-2 focus:ring-[#E3B23C] focus:ring-offset-2 focus:ring-offset-black';

const SECONDARY_BTN =
  'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl ' +
  'bg-white text-black font-semibold border-2 border-black ' +
  'transition-transform duration-200 hover:-translate-y-0.5 ' +
  'focus:outline-none focus:ring-2 focus:ring-[#E3B23C] focus:ring-offset-2 focus:ring-offset-white';

const CARD =
  'bg-white rounded-2xl p-6 border-2 border-black shadow-xl ' +
  'transition-transform duration-200 hover:-translate-y-1';

const INPUT =
  'w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-black text-black ' +
  'placeholder-gray-400 focus:outline-none focus:border-[#E3B23C] ' +
  'focus:ring-2 focus:ring-[#E3B23C] transition';

// ─── Métiers ───
interface Metier {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: 'Disponible' | 'Bientôt' | 'Sur devis';
}

const METIERS: Metier[] = [
  {
    icon: <Hotel className="w-7 h-7" />,
    title: 'Hôtels',
    description:
      "Étiquetez les bagages de vos clients dès le check-in. Contact direct avec votre réception en cas de perte.",
    badge: 'Disponible',
  },
  {
    icon: <GraduationCap className="w-7 h-7" />,
    title: 'Écoles',
    description:
      "Identifiez cartables et uniformes des élèves. Contact automatique des parents.",
    badge: 'Disponible',
  },
  {
    icon: <Stethoscope className="w-7 h-7" />,
    title: 'Cliniques',
    description:
      "Étiquetez les effets personnels des patients. Contact d'urgence prévenu.",
    badge: 'Disponible',
  },
  {
    icon: <Car className="w-7 h-7" />,
    title: 'Loueurs auto',
    description:
      "Traçabilité des clés, documents et équipements. Contact direct du locataire.",
    badge: 'Bientôt',
  },
  {
    icon: <Luggage className="w-7 h-7" />,
    title: 'Consignes',
    description:
      "Étiquetage des bagages en consigne. Suivi par casier.",
    badge: 'Bientôt',
  },
  {
    icon: <Briefcase className="w-7 h-7" />,
    title: 'Autres métiers',
    description: 'Configuration sur-mesure pour votre activité.',
    badge: 'Sur devis',
  },
];

function badgeClass(badge: Metier['badge']): string {
  if (badge === 'Disponible') {
    return 'bg-green-100 text-green-700 border-2 border-green-600';
  }
  if (badge === 'Bientôt') {
    return 'bg-amber-100 text-amber-700 border-2 border-amber-500';
  }
  return 'bg-gray-100 text-gray-700 border-2 border-gray-500';
}

// ─── Comment ça marche ───
const STEPS = [
  {
    icon: <QrCode className="w-7 h-7" />,
    title: 'Superadmin génère les QR',
    description:
      "Le superadmin crée des lots de QR codes assignés à votre entreprise.",
  },
  {
    icon: <ScanLine className="w-7 h-7" />,
    title: 'Votre staff fait le check-in',
    description:
      "Au check-in, scannez le QR et saisissez les infos client (nom, chambre, dates).",
  },
  {
    icon: <MessageCircle className="w-7 h-7" />,
    title: 'Le trouveur scanne',
    description:
      "En cas de perte, le trouveur scanne le QR et contacte votre réception via WhatsApp.",
  },
  {
    icon: <ClipboardCheck className="w-7 h-7" />,
    title: 'Vous gérez la restitution',
    description:
      "Votre réception reçoit le message, vérifie le client, et restitue l'objet.",
  },
];

// ─── Avantages ───
const AVANTAGES = [
  {
    icon: <ShieldCheck className="w-8 h-8" />,
    title: 'Contrôle total',
    description:
      "Votre réception garde le contrôle. Le trouveur vous contacte, pas le client directement.",
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: 'Dashboard temps réel',
    description:
      "Suivez les QR actifs, les check-out à venir, les objets perdus.",
  },
  {
    icon: <Bell className="w-8 h-8" />,
    title: 'Notifications WhatsApp',
    description:
      "Réception automatique des alertes via WhatsApp WAME (clic-vers-chat).",
  },
];

// ════════════════════════════════════════════════════════════════
//  Page
// ════════════════════════════════════════════════════════════════

export default function QRTagsProLanding() {
  const [form, setForm] = useState({
    company: '',
    metier: 'Hôtel',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // V1: pas de backend — simple stub
    alert("Merci, nous vous contacterons sous 24h.");
    setForm({ company: '', metier: 'Hôtel', email: '', phone: '', message: '' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ─── Header ─── */}
      <header className="bg-[#111111] text-white sticky top-0 z-30 border-b-2 border-[#E3B23C]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <QRTagsLogo size="sm" variant="dark" />
            <span className="ml-2 text-lg font-bold tracking-tight">
              QRTags<span className="text-[#E3B23C]">Pro</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#comment" className="hover:text-[#E3B23C] transition-colors">Comment ça marche</a>
            <a href="#metiers" className="hover:text-[#E3B23C] transition-colors">Métiers</a>
            <a href="#avantages" className="hover:text-[#E3B23C] transition-colors">Avantages</a>
            <a href="#demo" className="hover:text-[#E3B23C] transition-colors">Démo</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/agence/connexion"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white border-2 border-white/40 hover:border-[#E3B23C] hover:text-[#E3B23C] transition-colors"
            >
              Espace agence
            </Link>
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-[#E3B23C] text-black hover:-translate-y-0.5 transition-transform"
            >
              Superadmin
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section
        className="bg-[#111111] text-white relative overflow-hidden"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(227,178,60,0.18) 0, transparent 40%), radial-gradient(circle at 80% 60%, rgba(227,178,60,0.10) 0, transparent 50%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E3B23C]/15 border border-[#E3B23C]/40 text-[#E3B23C] text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              QRTagsPro V1 — Hôtels
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
              QRTagsPro — La solution de gestion d'objets perdus pour les entreprises
            </h1>
            <p className="mt-6 text-base sm:text-lg text-white/80 leading-relaxed">
              Hôtels, écoles, cliniques, loueurs auto... Protégez les effets de vos clients
              avec des QR codes traçables.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="#demo" className={PRIMARY_BTN}>
                Demander une démo
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link href="/agence/connexion" className={SECONDARY_BTN}>
                Espace agence
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Comment ça marche ─── */}
      <section id="comment" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-black">Comment ça marche</h2>
            <p className="mt-3 text-[#525252]">
              Un flux simple en 4 étapes, du QR code jusqu'à la restitution.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className={CARD}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-black text-[#E3B23C] flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="text-3xl font-bold text-gray-200">{i + 1}</span>
                </div>
                <h3 className="text-base font-semibold text-black mb-2">{step.title}</h3>
                <p className="text-sm text-[#525252] leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Métiers ─── */}
      <section id="metiers" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-black">Métiers</h2>
            <p className="mt-3 text-[#525252]">
              Une solution pensée pour chaque secteur. V1 dédiée aux hôtels.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {METIERS.map((m, i) => (
              <div key={i} className={CARD}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E3B23C]/15 text-black flex items-center justify-center">
                    {m.icon}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClass(m.badge)}`}>
                    {m.badge}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">{m.title}</h3>
                <p className="text-sm text-[#525252] leading-relaxed">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Avantages ─── */}
      <section id="avantages" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-black">Avantages</h2>
            <p className="mt-3 text-[#525252]">
              Pourquoi les entreprises choisissent QRTagsPro.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {AVANTAGES.map((a, i) => (
              <div key={i} className={CARD}>
                <div className="w-14 h-14 rounded-xl bg-black text-[#E3B23C] flex items-center justify-center mb-4">
                  {a.icon}
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">{a.title}</h3>
                <p className="text-sm text-[#525252] leading-relaxed">{a.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Demande de démo ─── */}
      <section id="demo" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-black">Demande de démo</h2>
            <p className="mt-3 text-[#525252]">
              Remplissez le formulaire ci-dessous, nous vous recontactons sous 24h.
            </p>
          </div>
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-black shadow-xl space-y-4"
          >
            <div>
              <label htmlFor="company" className="block text-sm font-semibold text-black mb-1.5">
                Nom de l'entreprise <span className="text-red-600">*</span>
              </label>
              <input
                id="company"
                type="text"
                required
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Hôtel de la Plage"
                className={INPUT}
              />
            </div>

            <div>
              <label htmlFor="metier" className="block text-sm font-semibold text-black mb-1.5">
                Type de métier
              </label>
              <select
                id="metier"
                value={form.metier}
                onChange={(e) => setForm({ ...form, metier: e.target.value })}
                className={INPUT}
              >
                <option>Hôtel</option>
                <option>École</option>
                <option>Clinique</option>
                <option>Loueur</option>
                <option>Consigne</option>
                <option>Autre</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-black mb-1.5">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contact@hotel-plage.com"
                  className={INPUT}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-black mb-1.5">
                  Téléphone <span className="text-red-600">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                  className={INPUT}
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-black mb-1.5">
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Décrivez votre besoin en quelques lignes…"
                className={INPUT}
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-[#525252]">
                En soumettant ce formulaire, vous acceptez d'être recontacté par QRTagsPro.
              </p>
              <button type="submit" className={PRIMARY_BTN}>
                Envoyer la demande
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[#111111] text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div className="max-w-sm">
              <Link href="/" className="inline-flex items-center gap-2">
                <QRTagsLogo size="sm" variant="dark" />
                <span className="ml-2 text-lg font-bold">
                  QRTags<span className="text-[#E3B23C]">Pro</span>
                </span>
              </Link>
              <p className="mt-3 text-sm text-white/70 leading-relaxed">
                La solution de gestion d'objets perdus pour les entreprises.
                QR codes traçables, contact direct trouveur ↔ réception.
              </p>
            </div>
            <nav className="flex flex-col gap-2 text-sm">
              <span className="text-white/60 font-semibold uppercase tracking-wider text-xs mb-1">Accès</span>
              <Link href="/agence/connexion" className="text-white/80 hover:text-[#E3B23C] transition-colors">
                Espace agence
              </Link>
              <Link href="/login" className="text-white/80 hover:text-[#E3B23C] transition-colors">
                Espace superadmin
              </Link>
              <a href="#demo" className="text-white/80 hover:text-[#E3B23C] transition-colors">
                Contact
              </a>
            </nav>
          </div>
          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/60">
            <p>© {new Date().getFullYear()} QRTagsPro. Tous droits réservés.</p>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#E3B23C]" />
              <span>V1 — Hôtels</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
