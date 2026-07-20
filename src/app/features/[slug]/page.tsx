import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FEATURES_DATA } from '@/lib/landing-data';

export async function generateStaticParams() {
  return Object.keys(FEATURES_DATA).map((slug) => ({ slug }));
}

export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = FEATURES_DATA[slug];
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section className="pt-32 pb-20 px-5 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, #FDB90022 0%, transparent 60%)`,
          }}
        />
        <div className="max-w-6xl mx-auto relative">
          <Link href="/#features" className="text-sm text-slate-500 hover:text-slate-900 mb-6 inline-block">
            ← Retour aux fonctionnalités
          </Link>
          <div className="text-6xl mb-6">{data.icon}</div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
            {data.heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mb-8">
            {data.heroSubtitle}
          </p>
        </div>
      </section>

      {/* DESCRIPTION */}
      <section className="py-16 px-5 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-6">Comment ça marche</h2>
          <p className="text-lg text-slate-700 leading-relaxed">{data.description}</p>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-12 text-center">Les bénéfices</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {data.benefits.map((b, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{b.title}</h3>
                <p className="text-slate-600 text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS STEPS */}
      <section className="py-20 px-5 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-12 text-center">Étapes détaillées</h2>
          <ol className="space-y-4">
            {data.howItWorks.map((step, i) => (
              <li key={i} className="flex gap-4 bg-white rounded-xl p-4 border border-slate-200">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                  style={{ background: '#FDB900', color: '#0d0d0f' }}
                >
                  {i + 1}
                </div>
                <p className="text-slate-700 pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* EXAMPLES */}
      <section className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-12 text-center">Exemples concrets</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {data.examples.map((ex, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2">{ex.title}</h3>
                <p className="text-slate-600 text-sm">{ex.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-4">
            Envie d'en savoir plus ?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Découvrez toutes les fonctionnalités QRTags ou devenez partenaire.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/#features"
              className="px-6 py-3 rounded-xl font-bold border-2 border-slate-300 text-slate-900 hover:bg-slate-100"
            >
              Toutes les fonctionnalités
            </Link>
            <Link
              href="/devenir-partenaire"
              className="px-6 py-3 rounded-xl font-bold"
              style={{ background: '#FDB900', color: '#0d0d0f' }}
            >
              Devenir partenaire
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
