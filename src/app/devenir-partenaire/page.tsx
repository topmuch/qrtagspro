'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  GraduationCap,
  Luggage,
  Car,
  Stethoscope,
  Package,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Send,
  Menu,
  X,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

// Couleurs QRTags (clair, harmonisé avec le logo)
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

const METIERS = [
  { icon: Building2, name: 'Hôtels', slug: 'hotels' },
  { icon: GraduationCap, name: 'Écoles', slug: 'ecoles' },
  { icon: Luggage, name: 'Consignes', slug: 'consignes' },
  { icon: Car, name: 'Loueurs auto', slug: 'loueurs' },
  { icon: Stethoscope, name: 'Cliniques', slug: 'cliniques' },
  { icon: Package, name: 'Autres', slug: 'autres' },
];

const AVANTAGES = [
  { title: 'Zéro investissement', desc: 'Pas d\'app à développer, pas de hardware. Vous commandez des tags, c\'est tout.' },
  { title: 'Setup en 24h', desc: 'Inscription, validation, réception des premiers tags en 24-48h.' },
  { title: 'Marque préservée', desc: 'Vos clients voient votre logo, pas QRTags. Page 100% blanche.' },
  { title: 'Support inclus', desc: 'Assistance WhatsApp + email pour vous et vos clients.' },
  { title: 'Pas d\'engagement', desc: 'Payez au tag vendu. Pas d\'abonnement mensuel.' },
  { title: 'ROI immédiat', desc: '1 objet retrouvé = 100€+ de valeur pour le client. Le tag coûte quelques centimes.' },
];

const ETAPES = [
  { num: '1', title: 'Inscription', desc: 'Vous remplissez le formulaire ci-dessous avec votre activité.' },
  { num: '2', title: 'Validation', desc: 'Notre équipe valide votre compte en 24h et vous envoie un lot de tags.' },
  { num: '3', title: 'Vente à vos clients', desc: 'Vous vendez les tags à vos clients depuis votre dashboard.' },
  { num: '4', title: 'Vos clients activent', desc: 'Le client scanne, remplit ses infos, son objet est protégé.' },
  { num: '5', title: 'Suivi & stats', desc: 'Vous voyez tout depuis votre dashboard : ventes, activations, objets retrouvés.' },
];

export default function DevenirPartenairePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    agencyType: 'hotel',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ici on enverrait à /api/contact ou /api/admin/agencies
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen" style={{ background: COLORS.bg, color: COLORS.text }}>
      {/* NAVBAR */}
      <header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b"
        style={{ background: 'rgba(255,255,255,0.95)', borderColor: COLORS.border }}
      >
        <div className="max-w-screen-2xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <QRTagsLogo size="md" variant="light" />
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <a href="#avantages" className="text-sm font-medium hover:text-[#c89a00]">Avantages</a>
              <a href="#etapes" className="text-sm font-medium hover:text-[#c89a00]">Comment ça marche</a>
              <a href="#metiers" className="text-sm font-medium hover:text-[#c89a00]">Métiers</a>
              <a href="#formulaire" className="px-5 py-2 rounded-lg font-bold text-sm" style={{ background: COLORS.accent, color: COLORS.text }}>
                Devenir partenaire
              </a>
            </div>
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          {menuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <a href="#avantages" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm">Avantages</a>
              <a href="#etapes" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm">Comment ça marche</a>
              <a href="#metiers" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm">Métiers</a>
              <a href="#formulaire" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-bold text-center rounded-lg" style={{ background: COLORS.accent, color: COLORS.text }}>
                Devenir partenaire
              </a>
            </div>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="pt-32 pb-20 px-5 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-50"
          style={{ background: `radial-gradient(ellipse at 30% 20%, ${COLORS.accent}22 0%, transparent 60%)` }}
        />
        <div className="max-w-screen-2xl mx-auto relative">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: '#fffdf5', border: `1px solid ${COLORS.borderAccent}` }}
          >
            <Sparkles className="w-4 h-4" style={{ color: COLORS.accentDark }} />
            <span className="text-sm font-medium" style={{ color: COLORS.accentDark }}>
              Programme partenaire QRTags
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight max-w-4xl">
            Devenez partenaire QRTags et <span style={{ color: COLORS.accentDark }}>protégez les objets</span> de vos clients
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-3xl" style={{ color: COLORS.textMuted }}>
            Hôtel, école, consigne, loueur, clinique — proposez QRTags à vos clients
            et générez un revenu complémentaire tout en améliorant leur expérience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#formulaire"
              className="px-6 py-4 rounded-xl font-bold text-base inline-flex items-center justify-center gap-2 transition-all hover:scale-105"
              style={{ background: COLORS.accent, color: COLORS.text }}
            >
              Démarrer maintenant
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#avantages"
              className="px-6 py-4 rounded-xl font-bold text-base border-2 inline-flex items-center justify-center"
              style={{ borderColor: COLORS.border, color: COLORS.text }}
            >
              Voir les avantages
            </a>
          </div>
        </div>
      </section>

      {/* AVANTAGES */}
      <section id="avantages" className="py-20 px-5" style={{ background: COLORS.bgAlt }}>
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Pourquoi devenir <span style={{ color: COLORS.accentDark }}>partenaire</span> ?
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textMuted }}>
              6 raisons de rejoindre le réseau QRTags
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AVANTAGES.map((a, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-xl"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: COLORS.accent, color: COLORS.text }}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold mb-2">{a.title}</h3>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ÉTAPES */}
      <section id="etapes" className="py-20 px-5">
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Comment <span style={{ color: COLORS.accentDark }}>ça marche</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textMuted }}>
              5 étapes simples pour devenir partenaire
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-6">
            {ETAPES.map((e, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 relative"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
              >
                <div
                  className="absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm"
                  style={{ background: COLORS.accent, color: COLORS.text }}
                >
                  {e.num}
                </div>
                <h3 className="text-base font-bold mb-2 mt-4">{e.title}</h3>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MÉTIERS */}
      <section id="metiers" className="py-20 px-5" style={{ background: COLORS.bgAlt }}>
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              6 métiers <span style={{ color: COLORS.accentDark }}>supportés</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textMuted }}>
              QRTags s'adapte à votre activité. Cliquez pour voir le détail.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {METIERS.map((m, i) => (
              <Link
                key={i}
                href={`/metiers/${m.slug}`}
                className="rounded-2xl p-6 text-center transition-all hover:scale-105 hover:shadow-xl"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
              >
                <m.icon className="w-10 h-10 mx-auto mb-3" style={{ color: COLORS.accentDark }} />
                <div className="font-bold text-sm">{m.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FORMULAIRE */}
      <section id="formulaire" className="py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Demandez votre <span style={{ color: COLORS.accentDark }}>compte partenaire</span>
            </h2>
            <p className="text-lg" style={{ color: COLORS.textMuted }}>
              Réponse sous 24h. Sans engagement.
            </p>
          </div>

          {submitted ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: COLORS.card, border: `2px solid ${COLORS.accent}` }}
            >
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: COLORS.accentDark }} />
              <h3 className="text-2xl font-bold mb-2">Demande envoyée !</h3>
              <p className="mb-6" style={{ color: COLORS.textMuted }}>
                Notre équipe vous contactera sous 24h à {form.email}.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold"
                style={{ background: COLORS.accent, color: COLORS.text }}
              >
                Retour à l'accueil
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl p-8 space-y-4"
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Nom complet *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2"
                    style={{ borderColor: COLORS.border }}
                    placeholder="Marie Dupont"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Email professionnel *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2"
                    style={{ borderColor: COLORS.border }}
                    placeholder="marie@hotel-leroyal.com"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2"
                    style={{ borderColor: COLORS.border }}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Entreprise *</label>
                  <input
                    type="text"
                    required
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2"
                    style={{ borderColor: COLORS.border }}
                    placeholder="Hôtel Le Royal"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Type d'activité *</label>
                <select
                  required
                  value={form.agencyType}
                  onChange={(e) => setForm({ ...form, agencyType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2"
                  style={{ borderColor: COLORS.border }}
                >
                  <option value="hotel">🏨 Hôtel</option>
                  <option value="school">🎓 École</option>
                  <option value="luggage_locker">🛅 Consigne</option>
                  <option value="car_rental">🚗 Loueur auto</option>
                  <option value="medical">🏥 Clinique</option>
                  <option value="generic">📦 Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Message (optionnel)</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 resize-none"
                  style={{ borderColor: COLORS.border }}
                  placeholder="Parlez-nous de votre besoin : nombre d'objets à étiqueter, types d'objets, etc."
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 rounded-xl font-bold text-base inline-flex items-center justify-center gap-2 transition-all hover:scale-105"
                style={{ background: COLORS.accent, color: COLORS.text }}
              >
                Envoyer ma demande
                <Send className="w-5 h-5" />
              </button>
              <p className="text-xs text-center" style={{ color: COLORS.textMuted }}>
                En soumettant ce formulaire, vous acceptez d'être contacté par QRTags.
                Vos données ne seront pas partagées.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-5 border-t" style={{ borderColor: COLORS.border, background: COLORS.bgAlt }}>
        <div className="max-w-screen-2xl mx-auto text-center">
          <QRTagsLogo size="md" variant="light" />
          <p className="text-sm mt-4" style={{ color: COLORS.textMuted }}>
            © {new Date().getFullYear()} QRTags. Tous droits réservés.
          </p>
        </div>
      </footer>
    </main>
  );
}
