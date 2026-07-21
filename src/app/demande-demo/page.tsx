'use client';

/**
 * QRTagsPro — Page "Démo"
 *
 * Formulaire de demande de démo avec confirmation.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ArrowLeft, CheckCircle2, Mail, Phone, Building2,
  Sparkles, Clock, Shield,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

export default function DemoPage() {
  const [form, setForm] = useState({
    company: '',
    metier: 'hotel',
    email: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = `Entreprise: ${form.company}\nMétier: ${form.metier}\nEmail: ${form.email}\nTéléphone: ${form.phone}\nMessage: ${form.message}`;
    window.location.href = `mailto:contact@qrtagspro.com?subject=${encodeURIComponent('Demande de démo QRTagsPro')}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <QRTagsLogo size="xs" href="/" withHover />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <Link href="/comment-ca-marche" className="hover:text-[#134288] transition">Comment ça marche</Link>
            <Link href="/metiers" className="hover:text-[#134288] transition">Métiers</Link>
            <Link href="/avantages" className="hover:text-[#134288] transition">Avantages</Link>
            <Link href="/demande-demo" className="text-[#134288]">Démo</Link>
          </nav>
          <Link
            href="/agence/connexion"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#32ba5d] text-white rounded-lg hover:bg-[#28a54f] transition"
          >
            Espace agence
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#134288] to-[#0d3266] text-white py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-[#32ba5d]" />
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Demandez une démo
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            Découvrez QRTagsPro adapté à votre métier.
            Réponse sous 24h, démo personnalisée gratuite.
          </p>
        </div>
      </section>

      {/* Form + Garanties */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6 grid md:grid-cols-3 gap-8">
          {/* Form (2 cols) */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-slate-200">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#32ba5d]/15 mb-4">
                    <CheckCircle2 className="w-12 h-12 text-[#32ba5d]" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Merci !</h2>
                  <p className="text-slate-600 mb-6">
                    Votre demande a été préparée dans votre client email.
                    Nous vous recontactons sous 24h.
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#134288] text-white font-bold rounded-lg hover:bg-[#0d3266] transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour à l\'accueil
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        <Building2 className="w-3.5 h-3.5 inline mr-1" />
                        Entreprise *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
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
                        value={form.metier}
                        onChange={(e) => setForm({ ...form, metier: e.target.value })}
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
                        <Mail className="w-3.5 h-3.5 inline mr-1" />
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="contact@entreprise.com"
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        <Phone className="w-3.5 h-3.5 inline mr-1" />
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Décrivez votre besoin, le nombre d'établissements, le volume de QR attendu..."
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

          {/* Garanties (1 col) */}
          <div className="space-y-4">
            <div className="bg-[#134288] rounded-2xl p-6 text-white">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#32ba5d]" />
                Nos garanties
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#32ba5d] flex-shrink-0 mt-0.5" />
                  <span>Démo gratuite et sans engagement</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#32ba5d] flex-shrink-0 mt-0.5" />
                  <span>Réponse sous 24h ouvrées</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#32ba5d] flex-shrink-0 mt-0.5" />
                  <span>Adapté à votre métier</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#32ba5d] flex-shrink-0 mt-0.5" />
                  <span>Aucune installation requise</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200">
              <Clock className="w-8 h-8 text-[#134288] mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">Réponse rapide</h3>
              <p className="text-sm text-slate-600">
                Notre équipe vous recontacte sous 24h pour planifier une démo personnalisée adaptée à votre activité.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d3266] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-blue-200 hover:text-[#32ba5d]">
            <ArrowLeft className="w-4 h-4" />
            Retour à l\'accueil
          </Link>
          <p className="mt-4 text-xs text-blue-300">© {new Date().getFullYear()} QRTagsPro</p>
        </div>
      </footer>
    </div>
  );
}
