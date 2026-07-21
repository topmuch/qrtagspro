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

const CTA_DEMO_SUBJECT = 'Demande de démo QRTagsPro';

const METIERS = [
  {
    icon: <Hotel className="w-7 h-7" />,
    title: 'Hôtels',
    description: 'Étiquetez les bagages de vos clients dès le check-in. Contact direct avec votre réception en cas de perte.',
    badge: 'Disponible',
    color: '#134288',
  },
  {
    icon: <GraduationCap className="w-7 h-7" />,
    title: 'Écoles',
    description: 'Identifiez cartables et uniformes des élèves. Contact automatique des parents en cas de perte.',
    badge: 'Disponible',
    color: '#32ba5d',
  },
  {
    icon: <Stethoscope className="w-7 h-7" />,
    title: 'Cliniques',
    description: 'Étiquetez les effets personnels des patients. Contact d\'urgence prévenu automatiquement.',
    badge: 'Disponible',
    color: '#134288',
  },
  {
    icon: <Car className="w-7 h-7" />,
    title: 'Loueurs auto',
    description: 'Traçabilité des clés, documents et équipements. Contact direct du locataire.',
    badge: 'Disponible',
    color: '#32ba5d',
  },
  {
    icon: <Luggage className="w-7 h-7" />,
    title: 'Consignes',
    description: 'Étiquetage des bagages en consigne. Suivi par casier avec retrait programmé.',
    badge: 'Disponible',
    color: '#134288',
  },
  {
    icon: <Briefcase className="w-7 h-7" />,
    title: 'Autres métiers',
    description: 'Spa, gym, entreprise, événements... Créez votre métier sur-mesure sans coder.',
    badge: 'Sur devis',
    color: '#32ba5d',
  },
];

const STEPS = [
  {
    num: 1,
    icon: <QrCode className="w-7 h-7" />,
    title: 'Génération des QR',
    description: 'Le superadmin crée des lots de QR codes assignés à votre entreprise.',
  },
  {
    num: 2,
    icon: <Users className="w-7 h-7" />,
    title: 'Check-in client',
    description: 'Votre staff scanne le QR et saisit les infos client (nom, chambre, dates).',
  },
  {
    num: 3,
    icon: <Bell className="w-7 h-7" />,
    title: 'Le trouveur scanne',
    description: 'En cas de perte, le trouveur scanne le QR et contacte votre réception via WhatsApp.',
  },
  {
    num: 4,
    icon: <CheckCircle2 className="w-7 h-7" />,
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
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <QRTagsLogo size="sm" href="/" withHover />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <a href="#how" className="hover:text-[#134288] transition">Comment ça marche</a>
            <a href="#metiers" className="hover:text-[#134288] transition">Métiers</a>
            <a href="#avantages" className="hover:text-[#134288] transition">Avantages</a>
            <a href="#demo" className="hover:text-[#134288] transition">Démo</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold text-[#134288] hover:bg-slate-100 rounded-lg transition"
            >
              Espace superadmin
            </Link>
            <Link
              href="/agence/connexion"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#32ba5d] text-white rounded-lg hover:bg-[#28a54f] transition"
            >
              Espace agence
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

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
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
              <a
                href="#demo"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#32ba5d] text-white font-bold rounded-lg hover:bg-[#28a54f] hover:-translate-y-0.5 transition-all shadow-lg"
              >
                Demander une démo
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#how"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-bold rounded-lg border border-white/30 hover:bg-white/20 transition-all"
              >
                Voir comment ça marche
              </a>
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

          {/* Visuel mockup */}
          <div className="relative hidden md:block">
            <div className="bg-white rounded-2xl p-6 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-[#134288] flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Dashboard Hôtel</p>
                  <p className="text-xs text-slate-500">5 QR actifs</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'Marie Dupont', room: '204', status: 'Actif' },
                  { name: 'Karim Benali', room: '108', status: 'Actif' },
                  { name: 'Sophie Martin', room: '302', status: 'Check-out' },
                ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500">Chambre {c.room}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      c.status === 'Actif' ? 'bg-[#32ba5d]/15 text-[#28a54f]' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Badge flottant */}
            <div className="absolute -bottom-4 -left-4 bg-[#32ba5d] text-white p-4 rounded-xl shadow-xl -rotate-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <div>
                  <p className="text-xs font-bold">Nouveau scan !</p>
                  <p className="text-xs opacity-90">Il y a 2 min</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COMMENT ÇA MARCHE ═══ */}
      <section id="how" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
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
                  <div className="w-14 h-14 rounded-xl bg-[#134288] flex items-center justify-center text-white mb-4">
                    {step.icon}
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
        <div className="max-w-7xl mx-auto px-4 md:px-6">
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
                className="bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-[#32ba5d] hover:shadow-lg transition-all group"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white mb-4"
                  style={{ backgroundColor: m.color }}
                >
                  {m.icon}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-slate-900">{m.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    m.badge === 'Disponible'
                      ? 'bg-[#32ba5d]/15 text-[#28a54f]'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {m.badge}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AVANTAGES ═══ */}
      <section id="avantages" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
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

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#0d3266] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <QRTagsLogo size="sm" />
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
    </div>
  );
}
