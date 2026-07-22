'use client';

/**
 * QRTagsPro V4 — Landing page professionnelle
 *
 * Charte: Bleu corporate #134288 + Vert #32ba5d
 *
 * Sections:
 *   1. Header sticky (logo + nav + CTA)
 *   2. Hero (titre fort + sous-titre + 2 CTA + visuel)
 *   3. Stats clés (3 chiffres)
 *   4. Comment ça marche (4 étapes)
 *   5. Métiers couverts (6 cards)
 *   6. Avantages clés (3 colonnes)
 *   7. Témoignages / social proof
 *   8. CTA final (demande de démo)
 *   9. Footer
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  QrCode, ArrowRight, Building2, Users, Shield, Clock,
  CheckCircle2, Sparkles, Phone, Mail, MapPin,
  Hotel, GraduationCap, Stethoscope, Car, Luggage, Briefcase,
  Zap, BarChart3, Bell, Lock,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';
import RgpdBanner from '@/components/RgpdBanner';

const CTA_DEMO_SUBJECT = 'Demande de démo QRTagsPro';

const METIERS = [
  {
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop',
    title: 'Hôtels',
    description: 'Étiquetez les bagages de vos clients dès le check-in. Contact direct avec votre réception en cas de perte.',
    badge: 'Disponible',
    color: '#134288',
  },
  {
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop',
    title: 'Écoles',
    description: 'Identifiez cartables et uniformes des élèves. Contact automatique des parents en cas de perte.',
    badge: 'Disponible',
    color: '#32ba5d',
  },
  {
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop',
    title: 'Cliniques',
    description: 'Étiquetez les effets personnels des patients. Contact d\'urgence prévenu automatiquement.',
    badge: 'Disponible',
    color: '#134288',
  },
  {
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&h=400&fit=crop',
    title: 'Loueurs auto',
    description: 'Traçabilité des clés, documents et équipements. Contact direct du locataire.',
    badge: 'Disponible',
    color: '#32ba5d',
  },
  {
    image: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=600&h=400&fit=crop',
    title: 'Consignes',
    description: 'Étiquetage des bagages en consigne. Suivi par casier avec retrait programmé.',
    badge: 'Disponible',
    color: '#134288',
  },
  {
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop',
    title: 'Autres métiers',
    description: 'Spa, gym, entreprise, événements... Créez votre métier sur-mesure sans coder.',
    badge: 'Sur devis',
    color: '#32ba5d',
  },
];

const STEPS = [
  {
    num: 1,
    emoji: '🔢',
    visual: (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="w-6 h-6 bg-[#134288] rounded flex items-center justify-center">
              <QrCode className="w-4 h-4 text-white" />
            </div>
          ))}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-[#32ba5d] text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
          ×500
        </div>
      </div>
    ),
    title: 'Génération des QR',
    description: 'Le superadmin crée des lots de QR codes assignés à votre entreprise.',
  },
  {
    num: 2,
    emoji: '📋',
    visual: (
      <div className="w-full h-full flex items-center justify-center">
        <div className="bg-white rounded-lg p-3 shadow-md border border-slate-200 w-32">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded bg-[#134288] flex items-center justify-center">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="h-2 bg-slate-200 rounded w-full mb-1" />
              <div className="h-2 bg-slate-200 rounded w-2/3" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-[#32ba5d]/30 rounded w-full" />
            <div className="h-2 bg-slate-100 rounded w-3/4" />
            <div className="h-2 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    ),
    title: 'Check-in client',
    description: 'Votre staff scanne le QR et saisit les infos client (nom, chambre, dates).',
  },
  {
    num: 3,
    emoji: '📱',
    visual: (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-32 bg-slate-900 rounded-xl p-1.5 shadow-lg">
            <div className="w-full h-full bg-white rounded-lg flex flex-col items-center justify-center p-2">
              <QrCode className="w-8 h-8 text-[#134288] mb-1" />
              <div className="w-full h-1.5 bg-[#32ba5d] rounded mb-1" />
              <div className="w-2/3 h-1.5 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#32ba5d] rounded-full flex items-center justify-center shadow-lg">
            <Bell className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    ),
    title: 'Le trouveur scanne',
    description: 'En cas de perte, le trouveur scanne le QR et contacte votre réception via WhatsApp.',
  },
  {
    num: 4,
    emoji: '✅',
    visual: (
      <div className="w-full h-full flex items-center justify-center">
        <div className="bg-white rounded-lg p-3 shadow-md border border-slate-200 flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#32ba5d] flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="h-2 bg-[#32ba5d]/30 rounded w-full mb-1" />
            <div className="h-2 bg-slate-100 rounded w-2/3" />
          </div>
        </div>
      </div>
    ),
    title: 'Restitution',
    description: 'Votre réception reçoit le message, vérifie le client et organise la restitution.',
  },
];

const AVANTAGES = [
  {
    icon: <Shield className="w-8 h-8" />,
    title: 'Contrôle total',
    description: 'Votre réception garde le contrôle. Le trouveur vous contacte, pas le client directement. Vous vérifiez etrelayez.',
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: 'Dashboard temps réel',
    description: 'Suivez les QR actifs, les check-out à venir, les objets perdus. Statistiques complètes par métier.',
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: 'Setup en 5 minutes',
    description: 'Créez votre agence, générez vos QR, activez vos clients. Aucune installation, accessible partout.',
  },
];

const STATS = [
  { value: '6+', label: 'Métiers supportés' },
  { value: '< 5min', label: 'Setup complet' },
  { value: '100%', label: 'Sans installation' },
];

export default function HomePage() {
  const [demoForm, setDemoForm] = useState({
    company: '',
    metier: 'hotel',
    email: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // V1: simple alert (pas de backend pour le form)
    const body = `Entreprise: ${demoForm.company}\nMétier: ${demoForm.metier}\nEmail: ${demoForm.email}\nTéléphone: ${demoForm.phone}\nMessage: ${demoForm.message}`;
    window.location.href = `mailto:contact@qrtagspro.com?subject=${encodeURIComponent(CTA_DEMO_SUBJECT)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <QRTagsLogo size="sm" href="/" withHover />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <Link href="/comment-ca-marche" className="hover:text-[#134288] transition">Comment ça marche</Link>
            <Link href="/metiers" className="hover:text-[#134288] transition">Métiers</Link>
            <Link href="/tarifs" className="hover:text-[#134288] transition">Tarifs</Link>
            <Link href="/contact" className="hover:text-[#134288] transition">Contact</Link>
            <Link href="/demo" className="hover:text-[#134288] transition">Démo</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold text-[#134288] hover:bg-slate-100 rounded-lg transition"
            >
              Connexion
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#32ba5d] text-white rounded-lg hover:bg-[#28a54f] transition"
            >
              S'inscrire
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#134288] to-[#0d3266] text-white">
        {/* Pattern décoratif */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 30%, #32ba5d 0%, transparent 50%), radial-gradient(circle at 80% 70%, #32ba5d 0%, transparent 50%)',
          }}
        />

        <div className="relative max-w-[1600px] mx-auto px-4 md:px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#32ba5d]/20 border border-[#32ba5d]/40 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#32ba5d]" />
              <span className="text-xs font-semibold text-[#32ba5d]">Nouvelle version V3 — Métiers personnalisables</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
              La gestion d&apos;objets perdus,<br />
              <span className="text-[#32ba5d]">simple et professionnelle</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed">
              Hôtels, écoles, cliniques, loueurs auto... Protégez les effets de vos clients
              avec des QR codes traçables. Le trouveur vous contacte directement via WhatsApp.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/demande-demo"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#32ba5d] text-white font-bold rounded-lg hover:bg-[#28a54f] hover:-translate-y-0.5 transition-all shadow-lg"
              >
                Demander une démo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/comment-ca-marche"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-bold rounded-lg border border-white/30 hover:bg-white/20 transition-all"
              >
                Voir comment ça marche
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-white/20">
              {STATS.map((s, i) => (
                <div key={i}>
                  <p className="text-3xl font-black text-[#32ba5d]">{s.value}</p>
                  <p className="text-xs text-blue-200 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visuel: Objets avec QR codes */}
          <div className="relative hidden md:block">
            {/* Conteneur principal */}
            <div className="relative">
              {/* Valise avec QR */}
              <div className="bg-white rounded-2xl p-6 shadow-2xl rotate-[-3deg] hover:rotate-0 transition-transform duration-500 mb-4">
                <div className="flex items-center gap-4">
                  {/* QR code visuel */}
                  <div className="flex-shrink-0 w-24 h-24 rounded-xl bg-[#134288] p-2">
                    <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-[#134288]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#32ba5d] uppercase tracking-wide">Valise</p>
                    <p className="text-lg font-bold text-slate-900">Marie Dupont</p>
                    <p className="text-sm text-slate-500">Chambre 204 — Hôtel Radisson</p>
                  </div>
                  <span className="ml-auto text-xs px-3 py-1 rounded-full font-semibold bg-[#32ba5d]/15 text-[#28a54f]">
                    ✅ Actif
                  </span>
                </div>
              </div>

              {/* Cartable avec QR */}
              <div className="bg-white rounded-2xl p-6 shadow-2xl rotate-[2deg] hover:rotate-0 transition-transform duration-500 mb-4 ml-12">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-24 h-24 rounded-xl bg-[#32ba5d] p-2">
                    <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-[#32ba5d]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#134288] uppercase tracking-wide">Cartable</p>
                    <p className="text-lg font-bold text-slate-900">Luc Martin</p>
                    <p className="text-sm text-slate-500">6ème B — École Jules Ferry</p>
                  </div>
                  <span className="ml-auto text-xs px-3 py-1 rounded-full font-semibold bg-[#32ba5d]/15 text-[#28a54f]">
                    ✅ Actif
                  </span>
                </div>
              </div>

              {/* Clés avec QR */}
              <div className="bg-white rounded-2xl p-6 shadow-2xl rotate-[-1deg] hover:rotate-0 transition-transform duration-500 ml-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-24 h-24 rounded-xl bg-slate-800 p-2">
                    <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-slate-800" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Clés voiture</p>
                    <p className="text-lg font-bold text-slate-900">Karim Benali</p>
                    <p className="text-sm text-slate-500">Clio 5 — AB-123-CD</p>
                  </div>
                  <span className="ml-auto text-xs px-3 py-1 rounded-full font-semibold bg-[#32ba5d]/15 text-[#28a54f]">
                    ✅ Actif
                  </span>
                </div>
              </div>
            </div>

            {/* Badge flottant: notification WhatsApp */}
            <div className="absolute -bottom-4 -left-4 bg-[#32ba5d] text-white p-4 rounded-xl shadow-xl -rotate-3 z-10">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <div>
                  <p className="text-xs font-bold">Objet trouvé !</p>
                  <p className="text-xs opacity-90">WhatsApp envoyé ✅</p>
                </div>
              </div>
            </div>

            {/* Badge flottant: QR code animé */}
            <div className="absolute -top-4 -right-4 bg-[#134288] text-white p-3 rounded-xl shadow-xl rotate-6 z-10">
              <div className="flex items-center gap-2">
                <QrCode className="w-6 h-6 text-[#32ba5d]" />
                <div>
                  <p className="text-xs font-bold">QR scanné</p>
                  <p className="text-xs opacity-90">Trouveur notifié</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COMMENT ÇA MARCHE ═══ */}
      <section id="how" className="py-20 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              De la génération des QR à la restitution, un workflow simple en 4 étapes.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-[#32ba5d] transition-colors h-full">
                  <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    {step.visual}
                  </div>
                  <div className="text-xs font-bold text-[#32ba5d] mb-2">ÉTAPE {step.num}</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600">{step.description}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-slate-300 z-10">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MÉTIERS ═══ */}
      <section id="metiers" className="py-20 bg-slate-50">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
              Une solution par métier
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Chaque métier a son propre workflow, ses propres champs et son propre dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {METIERS.map((m, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-[#32ba5d] hover:shadow-lg transition-all group"
              >
                {/* Image réelle */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={m.image}
                    alt={m.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">{m.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      m.badge === 'Disponible'
                        ? 'bg-[#32ba5d] text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {m.badge}
                    </span>
                  </div>
                </div>
                {/* Description */}
                <div className="p-5">
                  <p className="text-sm text-slate-600 leading-relaxed">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AVANTAGES ═══ */}
      <section id="avantages" className="py-20 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
              Pourquoi QRTagsPro ?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Pensé pour les entreprises, simple pour vos équipes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {AVANTAGES.map((a, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#134288] to-[#0d3266] text-white mb-4">
                  {a.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{a.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{a.description}</p>
              </div>
            ))}
          </div>

          {/* Bandeau trust */}
          <div className="mt-16 p-8 bg-gradient-to-r from-[#134288] to-[#0d3266] rounded-2xl text-white">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center">
                <Lock className="w-8 h-8 text-[#32ba5d] mb-2" />
                <p className="text-sm font-semibold">Confidentialité</p>
                <p className="text-xs text-blue-200 mt-1">Le trouveur ne voit jamais les coordonnées client</p>
              </div>
              <div className="flex flex-col items-center">
                <Clock className="w-8 h-8 text-[#32ba5d] mb-2" />
                <p className="text-sm font-semibold">Auto-expiration</p>
                <p className="text-xs text-blue-200 mt-1">Check-out automatique à la date de départ</p>
              </div>
              <div className="flex flex-col items-center">
                <Bell className="w-8 h-8 text-[#32ba5d] mb-2" />
                <p className="text-sm font-semibold">WhatsApp WAME</p>
                <p className="text-xs text-blue-200 mt-1">Click-to-chat, aucune installation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DEMO FORM ═══ */}
      <section id="demo" className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xl border-2 border-slate-200">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-slate-900 mb-3">
                Demandez une démo
              </h2>
              <p className="text-slate-600">
                Découvrez QRTagsPro adapté à votre métier. Réponse sous 24h.
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#32ba5d]/15 mb-4">
                  <CheckCircle2 className="w-10 h-10 text-[#32ba5d]" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Merci !</h3>
                <p className="text-slate-600">
                  Votre demande a été préparée dans votre client email. Nous vous recontactons sous 24h.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Entreprise *
                    </label>
                    <input
                      type="text"
                      required
                      value={demoForm.company}
                      onChange={(e) => setDemoForm({ ...demoForm, company: e.target.value })}
                      placeholder="Hôtel Radisson"
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Métier *
                    </label>
                    <select
                      required
                      value={demoForm.metier}
                      onChange={(e) => setDemoForm({ ...demoForm, metier: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30"
                    >
                      <option value="hotel">🏨 Hôtel</option>
                      <option value="school">🎓 École</option>
                      <option value="medical">🏥 Clinique</option>
                      <option value="car_rental">🚗 Loueur auto</option>
                      <option value="luggage_locker">🧳 Consigne</option>
                      <option value="autre">💼 Autre</option>
                    </select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={demoForm.email}
                      onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                      placeholder="contact@entreprise.com"
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={demoForm.phone}
                      onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                      placeholder="+33 6 12 34 56 78"
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Message (optionnel)
                  </label>
                  <textarea
                    rows={3}
                    value={demoForm.message}
                    onChange={(e) => setDemoForm({ ...demoForm, message: e.target.value })}
                    placeholder="Décrivez votre besoin..."
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#32ba5d] text-white font-bold rounded-lg hover:bg-[#28a54f] hover:-translate-y-0.5 transition-all shadow-lg"
                >
                  Envoyer la demande
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ═══ ONBOARDING / INSCRIPTION ═══ */}
      <section id="onboarding" className="py-20 bg-gradient-to-br from-[#134288] to-[#0d3266] text-white">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-3">
              Démarrez en 3 étapes
            </h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Que vous soyez superadmin ou gérant d'établissement, QRTagsPro
              s'adapte à votre besoin.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Étape 1 — Superadmin */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 rounded-xl bg-[#32ba5d] flex items-center justify-center text-white font-bold text-xl mb-4">
                1
              </div>
              <h3 className="font-bold text-lg mb-2">Superadmin</h3>
              <p className="text-sm text-blue-100 mb-4">
                Créez les agences, générez les lots de QR, gérez les métiers personnalisés.
              </p>
              <Link
                href="/admin/connexion"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#134288] text-sm font-bold rounded-lg hover:bg-blue-50 transition"
              >
                Espace superadmin
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Étape 2 — Agence */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 rounded-xl bg-[#32ba5d] flex items-center justify-center text-white font-bold text-xl mb-4">
                2
              </div>
              <h3 className="font-bold text-lg mb-2">Agence</h3>
              <p className="text-sm text-blue-100 mb-4">
                Connectez-vous, faites le check-in de vos clients, suivez vos QR actifs.
              </p>
              <Link
                href="/agence/connexion"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#32ba5d] text-white text-sm font-bold rounded-lg hover:bg-[#28a54f] transition"
              >
                Espace agence
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Étape 3 — Démo */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 rounded-xl bg-[#32ba5d] flex items-center justify-center text-white font-bold text-xl mb-4">
                3
              </div>
              <h3 className="font-bold text-lg mb-2">Pas encore client ?</h3>
              <p className="text-sm text-blue-100 mb-4">
                Créez votre compte établissement en 2 minutes et commencez à protéger
                les effets de vos clients.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#32ba5d] text-white text-sm font-bold rounded-lg hover:bg-[#28a54f] transition"
              >
                S'inscrire maintenant
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Workflow résumé */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <p className="text-sm font-bold text-[#32ba5d] mb-3 text-center">📋 WORKFLOW COMPLET</p>
            <div className="grid md:grid-cols-4 gap-4 text-center text-sm">
              <div>
                <p className="font-bold text-white mb-1">1. Génération</p>
                <p className="text-blue-200 text-xs">Superadmin génère QR → agence</p>
              </div>
              <div>
                <p className="font-bold text-white mb-1">2. Check-in</p>
                <p className="text-blue-200 text-xs">Agence scanne QR + infos client</p>
              </div>
              <div>
                <p className="font-bold text-white mb-1">3. Perte → Scan</p>
                <p className="text-blue-200 text-xs">Trouveur scanne → WhatsApp réception</p>
              </div>
              <div>
                <p className="font-bold text-white mb-1">4. Restitution</p>
                <p className="text-blue-200 text-xs">Réception vérifie + restitue</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ RGPD / CONFIDENTIALITÉ ═══ */}
      <section className="py-12 bg-slate-100 border-t border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#134288] flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900 mb-2">
                  🔒 Protection des données — RGPD
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  QRTagsPro s'engage à protéger les données personnelles de vos clients conformément
                  au Règlement Général sur la Protection des Données (RGPD). Voici nos engagements :
                </p>
                <div className="grid md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-[#32ba5d] mb-2" />
                    <p className="text-xs font-bold text-slate-900">Confidentialité trouveur</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Le trouveur ne voit jamais les coordonnées du client (nom, chambre, téléphone).
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-[#32ba5d] mb-2" />
                    <p className="text-xs font-bold text-slate-900">Opt-in explicite</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Le contact direct client après séjour nécessite l'accord explicite du client.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-[#32ba5d] mb-2" />
                    <p className="text-xs font-bold text-slate-900">Données chiffrées</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Toutes les données sensibles sont chiffrées en base (bcrypt, AES-256).
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-[#32ba5d] mb-2" />
                    <p className="text-xs font-bold text-slate-900">Suppression auto</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Les données de démo sont supprimées après 2h. Les QR expirés sont archivés.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs">
                  <Link href="/confidentialite" className="text-[#134288] font-semibold hover:underline">
                    Politique de confidentialité
                  </Link>
                  <span className="text-slate-300">|</span>
                  <Link href="/cgu" className="text-[#134288] font-semibold hover:underline">
                    Conditions d'utilisation
                  </Link>
                  <span className="text-slate-300">|</span>
                  <Link href="/mentions-legales" className="text-[#134288] font-semibold hover:underline">
                    Mentions légales
                  </Link>
                  <span className="text-slate-300">|</span>
                  <a href="mailto:rgpd@qrtagspro.com" className="text-[#134288] font-semibold hover:underline">
                    Contact DPO : rgpd@qrtagspro.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PARTENAIRES ═══ */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Ils nous font confiance</h2>
          <p className="text-sm text-slate-500 mb-8">Intégrations et partenaires technologiques</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {/* Cloudbeds */}
            <div className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition">
              <div className="w-16 h-16 rounded-xl bg-[#134288] flex items-center justify-center text-white font-black text-xl">
                CB
              </div>
              <span className="text-xs font-semibold text-slate-600">Cloudbeds</span>
            </div>
            {/* Mews */}
            <div className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition">
              <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center text-white font-black text-xl">
                M
              </div>
              <span className="text-xs font-semibold text-slate-600">Mews</span>
            </div>
            {/* Sirvoy */}
            <div className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition">
              <div className="w-16 h-16 rounded-xl bg-[#32ba5d] flex items-center justify-center text-white font-black text-xl">
                S
              </div>
              <span className="text-xs font-semibold text-slate-600">Sirvoy</span>
            </div>
            {/* Deliverback */}
            <div className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition">
              <div className="w-16 h-16 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-xl">
                DB
              </div>
              <span className="text-xs font-semibold text-slate-600">Deliverback</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#0d3266] text-white py-12">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <QRTagsLogo size="md" />
              <p className="text-sm text-blue-200 mt-4 max-w-sm">
                La solution de gestion d&apos;objets perdus pour les entreprises.
                Simple, professionnelle, multi-métiers.
              </p>
            </div>
            <div>
              <p className="text-sm font-bold mb-3">Accès</p>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><Link href="/agence/connexion" className="hover:text-[#32ba5d]">Espace agence</Link></li>
                <li><Link href="/login" className="hover:text-[#32ba5d]">Espace superadmin</Link></li>
                <li><Link href="/tarifs" className="hover:text-[#32ba5d]">Tarifs</Link></li>
                <li><Link href="/contact" className="hover:text-[#32ba5d]">Contact</Link></li>
                <li><Link href="/demo" className="hover:text-[#32ba5d]">Démo interactive</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold mb-3">Contact</p>
              <ul className="space-y-2 text-sm text-blue-200">
                <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> contact@qrtagspro.com</li>
                <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> +33 1 23 45 67 89</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-blue-300">
            © {new Date().getFullYear()} QRTagsPro. Tous droits réservés.
          </div>
        </div>
      </footer>

      {/* Bannière RGPD */}
      <RgpdBanner />
    </div>
  );
}
