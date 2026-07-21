'use client';

/**
 * QRTagsPro — Page Tarifs
 *
 * 3 formules: Start (500€), Bronze (700€), Premium (Devis)
 */

import Link from 'next/link';
import {
  ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Crown, Award,
  QrCode, Building2, BarChart3, Clock, Shield, Phone,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

const PLANS = [
  {
    name: 'Start',
    icon: <Sparkles className="w-8 h-8" />,
    price: '500€',
    period: 'HT / lot',
    badge: null,
    color: '#134288',
    bgColor: 'bg-white',
    features: [
      'Page trouveur personnalisée',
      "Page d'inscription (check-in)",
      'Branding avec votre logo',
      '200 étiquettes QR incluses',
      'Tableau de bord agence',
      'Validité des étiquettes : 1 an',
      'Support email',
    ],
    notIncluded: [
      "Intégration PMS (Cloudbeds)",
      'Multi-établissements',
      'Statistiques avancées',
    ],
    cta: 'Choisir Start',
    ctaHref: '/contact',
  },
  {
    name: 'Bronze',
    icon: <Award className="w-8 h-8" />,
    price: '700€',
    period: 'HT / lot',
    badge: 'Le plus populaire',
    color: '#32ba5d',
    bgColor: 'bg-[#32ba5d]/5',
    features: [
      'Page trouveur personnalisée',
      "Page d'inscription (check-in)",
      'Branding avec votre logo',
      '500 étiquettes QR incluses',
      'Tableau de bord agence',
      'Validité des étiquettes : 1 an',
      'Support email + WhatsApp',
      "Intégration PMS (Cloudbeds)",
    ],
    notIncluded: [
      'Multi-établissements',
      'Statistiques avancées',
    ],
    cta: 'Choisir Bronze',
    ctaHref: '/contact',
  },
  {
    name: 'Premium',
    icon: <Crown className="w-8 h-8" />,
    price: 'Sur devis',
    period: '',
    badge: null,
    color: '#0d3266',
    bgColor: 'bg-white',
    features: [
      'Tout ce qui est inclus dans Bronze',
      'Étiquettes illimitées',
      'Multi-établissements',
      'Statistiques avancées + export',
      'Intégration PMS (Cloudbeds + Mews)',
      'Account manager dédié',
      'Support prioritaire 24/7',
      'Formation équipe sur site',
    ],
    notIncluded: [],
    cta: 'Nous contacter',
    ctaHref: '/contact',
  },
];

const COMPARISON = [
  { feature: 'Page trouveur', start: true, bronze: true, premium: true },
  { feature: 'Page inscription (check-in)', start: true, bronze: true, premium: true },
  { feature: 'Branding logo', start: true, bronze: true, premium: true },
  { feature: 'Tableau de bord', start: true, bronze: true, premium: true },
  { feature: 'Validité étiquettes', start: '1 an', bronze: '1 an', premium: 'Illimitée' },
  { feature: 'Étiquettes QR', start: '200', bronze: '500', premium: 'Illimitées' },
  { feature: 'Intégration PMS', start: false, bronze: 'Cloudbeds', premium: 'Cloudbeds + Mews' },
  { feature: 'Multi-établissements', start: false, bronze: false, premium: true },
  { feature: 'Statistiques avancées', start: false, bronze: false, premium: true },
  { feature: 'Support', start: 'Email', bronze: 'Email + WhatsApp', premium: '24/7 prioritaire' },
];

export default function TarifsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <QRTagsLogo size="sm" href="/" withHover />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <Link href="/comment-ca-marche" className="hover:text-[#134288] transition">Comment ça marche</Link>
            <Link href="/metiers" className="hover:text-[#134288] transition">Métiers</Link>
            <Link href="/tarifs" className="text-[#134288]">Tarifs</Link>
            <Link href="/contact" className="hover:text-[#134288] transition">Contact</Link>
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
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Des tarifs simples et transparents
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            Choisissez la formule adaptée à votre établissement.
            Sans engagement, sans frais cachés.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-8 border-2 ${plan.bgColor} ${
                  plan.badge ? 'border-[#32ba5d] shadow-xl scale-105' : 'border-slate-200 shadow-md'
                } transition-all hover:shadow-2xl`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-block px-4 py-1 bg-[#32ba5d] text-white text-xs font-bold rounded-full shadow-lg">
                      ⭐ {plan.badge}
                    </span>
                  </div>
                )}

                {/* Icon + Name */}
                <div className="text-center mb-6">
                  <div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white mb-3"
                    style={{ backgroundColor: plan.color }}
                  >
                    {plan.icon}
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{plan.name}</h2>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <p className="text-4xl font-black text-slate-900">{plan.price}</p>
                  <p className="text-sm text-slate-500">{plan.period}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-[#32ba5d] flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-300">✗</span>
                      <span className="line-through">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={plan.ctaHref}
                  className="block w-full py-3 text-center font-bold rounded-lg transition-all hover:-translate-y-0.5 shadow-lg"
                  style={{
                    backgroundColor: plan.color,
                    color: '#fff',
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tableau comparatif */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-black text-slate-900 mb-8 text-center">
            Comparatif détaillé
          </h2>
          <div className="bg-white rounded-2xl overflow-hidden border-2 border-slate-200 shadow-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#134288] text-white">
                  <th className="py-4 px-4 text-left font-bold">Fonctionnalité</th>
                  <th className="py-4 px-4 text-center font-bold">Start</th>
                  <th className="py-4 px-4 text-center font-bold bg-[#32ba5d]/20">Bronze</th>
                  <th className="py-4 px-4 text-center font-bold">Premium</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="py-3 px-4 font-medium text-slate-900">{row.feature}</td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.start === 'boolean' ? (
                        row.start ? <CheckCircle2 className="w-4 h-4 text-[#32ba5d] mx-auto" /> : <span className="text-slate-300">—</span>
                      ) : <span className="text-slate-700">{row.start}</span>}
                    </td>
                    <td className="py-3 px-4 text-center bg-[#32ba5d]/5">
                      {typeof row.bronze === 'boolean' ? (
                        row.bronze ? <CheckCircle2 className="w-4 h-4 text-[#32ba5d] mx-auto" /> : <span className="text-slate-300">—</span>
                      ) : <span className="text-slate-700 font-medium">{row.bronze}</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.premium === 'boolean' ? (
                        row.premium ? <CheckCircle2 className="w-4 h-4 text-[#32ba5d] mx-auto" /> : <span className="text-slate-300">—</span>
                      ) : <span className="text-slate-700">{row.premium}</span>}
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#134288]/5">
                  <td className="py-4 px-4 font-black text-slate-900">Prix</td>
                  <td className="py-4 px-4 text-center font-black text-[#134288]">500€ HT</td>
                  <td className="py-4 px-4 text-center font-black text-[#32ba5d]">700€ HT</td>
                  <td className="py-4 px-4 text-center font-black text-slate-900">Sur devis</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-black text-slate-900 mb-8 text-center">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: "Les étiquettes QR sont-elles incluses ?", a: "Oui ! Chaque formule inclut un lot d'étiquettes QR (200 pour Start, 500 pour Bronze, illimitées pour Premium). Les étiquettes sont valides 1 an." },
              { q: "Puis-je changer de formule ?", a: 'Oui, à tout moment. Contactez-nous pour upgrader votre formule. La différence est proratisée.' },
              { q: "Que se passe-t-il après 1 an ?", a: 'Les étiquettes expirent après 1 an. Vous pouvez commander un nouveau lot pour continuer à protéger vos clients.' },
              { q: "L'intégration PMS est-elle difficile ?", a: "Non ! Configurez votre clé API Cloudbeds dans le dashboard et c'est prêt. Les check-in/check-out sont automatiquement synchronisés." },
              { q: "Proposez-vous un essai gratuit ?", a: 'Vous pouvez tester QRTagsPro gratuitement sur notre page Démo. Pour un essai complet, contactez-nous.' },
            ].map((faq, i) => (
              <details key={i} className="bg-white rounded-xl p-5 border-2 border-slate-200 group">
                <summary className="cursor-pointer font-semibold text-slate-900 flex items-center justify-between">
                  {faq.q}
                  <ArrowRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
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
