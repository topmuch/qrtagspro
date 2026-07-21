'use client';

/**
 * QRTagsPro — Page Contact
 *
 * Formulaire de contact + carte Google Maps intégrée.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ArrowLeft, Mail, Phone, MapPin, Clock,
  CheckCircle2, Loader2, Send, MessageCircle,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: 'Demande d\'information',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      const body = `Nom: ${form.name}\nEmail: ${form.email}\nTéléphone: ${form.phone}\nEntreprise: ${form.company}\nSujet: ${form.subject}\n\nMessage:\n${form.message}`;
      window.location.href = `mailto:contact@qrtagspro.com?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(body)}`;
      setSubmitted(true);
      setSending(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <QRTagsLogo size="sm" href="/" withHover />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <Link href="/comment-ca-marche" className="hover:text-[#134288] transition">Comment ça marche</Link>
            <Link href="/metiers" className="hover:text-[#134288] transition">Métiers</Link>
            <Link href="/tarifs" className="hover:text-[#134288] transition">Tarifs</Link>
            <Link href="/contact" className="text-[#134288]">Contact</Link>
            <Link href="/demo" className="hover:text-[#134288] transition">Démo</Link>
          </nav>
          <Link href="/login" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#32ba5d] text-white rounded-lg hover:bg-[#28a54f] transition">
            Connexion
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#134288] to-[#0d3266] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Contactez-nous</h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            Une question, un projet, un devis ? Notre équipe vous répond sous 24h.
          </p>
        </div>
      </section>

      {/* Content: Form + Map */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-8">
          {/* Left: Contact info + Form */}
          <div className="space-y-6">
            {/* Coordonnées */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <Mail className="w-6 h-6 text-[#134288] mb-2" />
                <p className="text-xs font-bold text-slate-500 uppercase">Email</p>
                <p className="text-sm text-slate-900 font-medium">contact@qrtagspro.com</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <Phone className="w-6 h-6 text-[#134288] mb-2" />
                <p className="text-xs font-bold text-slate-500 uppercase">Téléphone</p>
                <p className="text-sm text-slate-900 font-medium">+33 1 23 45 67 89</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <MapPin className="w-6 h-6 text-[#134288] mb-2" />
                <p className="text-xs font-bold text-slate-500 uppercase">Adresse</p>
                <p className="text-sm text-slate-900 font-medium">Paris, France</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <Clock className="w-6 h-6 text-[#134288] mb-2" />
                <p className="text-xs font-bold text-slate-500 uppercase">Horaires</p>
                <p className="text-sm text-slate-900 font-medium">Lun–Ven, 9h–18h</p>
              </div>
            </div>

            {/* Form */}
            {submitted ? (
              <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-[#32ba5d] text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#32ba5d]/15 mb-4">
                  <CheckCircle2 className="w-10 h-10 text-[#32ba5d]" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Message envoyé !</h2>
                <p className="text-sm text-slate-600 mb-4">
                  Votre client email s'est ouvert. Nous vous répondons sous 24h.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-sm font-semibold text-[#134288] hover:underline"
                >
                  ← Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-xl border-2 border-slate-200 space-y-4">
                <h2 className="text-lg font-bold text-slate-900 mb-2">Envoyez-nous un message</h2>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text" required placeholder="Nom *"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30"
                  />
                  <input
                    type="text" placeholder="Entreprise"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="email" required placeholder="Email *"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30"
                  />
                  <input
                    type="tel" placeholder="Téléphone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30"
                  />
                </div>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30"
                >
                  <option>Demande d'information</option>
                  <option>Demande de devis</option>
                  <option>Support technique</option>
                  <option>Partenariat</option>
                  <option>Autre</option>
                </select>
                <textarea
                  rows={4} required placeholder="Votre message *"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30 resize-none"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3 bg-[#32ba5d] text-white font-bold rounded-lg hover:bg-[#28a54f] hover:-translate-y-0.5 transition-all shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Envoi...' : 'Envoyer'}
                </button>
              </form>
            )}
          </div>

          {/* Right: Google Map */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl border-2 border-slate-200">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.999!2d2.3522!3d48.8566!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e1f06e2b70f%3A0x40b82c3688c4460!2sParis%2C%20France!5e0!3m2!1sfr!2sfr!4v1700000000000"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="QRTagsPro - Paris"
              />
            </div>

            {/* WhatsApp direct */}
            <div className="bg-[#134288] rounded-2xl p-6 text-white text-center">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-[#32ba5d]" />
              <h3 className="font-bold mb-2">Contact direct WhatsApp</h3>
              <p className="text-sm text-blue-100 mb-4">
                Pour une réponse rapide, contactez-nous directement sur WhatsApp.
              </p>
              <a
                href="https://wa.me/33123456789?text=Bonjour%20QRTagsPro%2C%20je%20souhaite%20des%20informations"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#32ba5d] text-white font-bold rounded-lg hover:bg-[#28a54f] transition"
              >
                <MessageCircle className="w-4 h-4" />
                Discuter sur WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d3266] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-blue-200 hover:text-[#32ba5d]">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <p className="mt-4 text-xs text-blue-300">© {new Date().getFullYear()} QRTagsPro</p>
        </div>
      </footer>
    </div>
  );
}
