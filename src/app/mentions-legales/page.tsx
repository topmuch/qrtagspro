'use client';

import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <QRTagsLogo size="sm" href="/" withHover />
          <Link href="/" className="text-sm text-slate-500 hover:text-[#134288]">
            <ArrowLeft className="w-4 h-4 inline mr-1" /> Accueil
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#134288] flex items-center justify-center">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">Mentions légales</h1>
        </div>

        <div className="prose prose-slate max-w-none space-y-6">
          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Éditeur</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>QRTagsPro</strong><br />
              Plateforme SaaS de gestion d'objets perdus pour entreprises<br />
              Adresse : Paris, France<br />
              Email : contact@qrtagspro.com<br />
              Téléphone : +33 1 23 45 67 89
            </p>
          </section>

          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Hébergement</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Le site est hébergé sur Coolify (auto-hébergement).<br />
              Serveur : Docker container (Node.js 20 + SQLite)<br />
              Localisation : Union Européenne
            </p>
          </section>

          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Propriété intellectuelle</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              L'ensemble des contenus présents sur le site (textes, logos, images, design, code source)
              est la propriété exclusive de QRTagsPro, sauf mention contraire.
              Toute reproduction, représentation, modification, publication ou adaptation,
              totale ou partielle, est interdite sans autorisation écrite préalable.
            </p>
          </section>

          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Données personnelles</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Le traitement des données personnelles est décrit dans notre{' '}
              <Link href="/confidentialite" className="text-[#134288] underline">Politique de confidentialité</Link>.
              <br />
              Contact DPO : rgpd@qrtagspro.com
            </p>
          </section>

          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Cookies</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              QRTagsPro utilise uniquement des cookies techniques nécessaires au bon fonctionnement
              du site (session, authentification). Aucun cookie publicitaire ou de tracking n'est utilisé.
              Le consentement est demandé via notre bannière RGPD au premier visite.
            </p>
          </section>

          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Droit applicable</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Les présentes mentions légales sont régies par le droit français.
              En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#134288]">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
