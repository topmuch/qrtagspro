import { notFound } from 'next/navigation';
import Link from 'next/link';
import { METIERS } from '@/lib/landing-data';

export async function generateStaticParams() {
  return Object.keys(METIERS).map((slug) => ({ slug }));
}

export default async function MetierPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const metier = METIERS[slug];
  if (!metier) notFound();

  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section className="pt-32 pb-20 px-5 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, ${metier.accentColor}22 0%, transparent 60%)`,
          }}
        />
        <div className="max-w-6xl mx-auto relative">
          <Link href="/#metiers" className="text-sm text-slate-500 hover:text-slate-900 mb-6 inline-block">
            ← Retour aux métiers
          </Link>
          <div className="text-7xl mb-6">{metier.heroImage}</div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
            {metier.heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mb-8">
            {metier.heroSubtitle}
          </p>
          <div className="flex gap-4">
            <Link
              href="/devenir-partenaire"
              className="px-6 py-4 rounded-xl font-bold text-base inline-flex items-center gap-2"
              style={{ background: metier.accentColor, color: '#0d0d0f' }}
            >
              Devenir partenaire {metier.title}
            </Link>
            <Link
              href="#how-it-works"
              className="px-6 py-4 rounded-xl font-bold text-base border-2 border-slate-300 text-slate-900 hover:bg-slate-50"
            >
              Comment ça marche
            </Link>
          </div>
        </div>
      </section>

      {/* DESCRIPTION */}
      <section className="py-16 px-5 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-6">Le contexte</h2>
          <p className="text-lg text-slate-700 leading-relaxed">{metier.description}</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-12 text-center">Comment ça marche</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {metier.howItWorks.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm"
                  style={{ background: metier.accentColor, color: '#0d0d0f' }}
                >
                  {step.step}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXAMPLES */}
      <section className="py-20 px-5 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-4 text-center">Exemples d'utilisation</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Cas concrets de la vie quotidienne en {metier.title.toLowerCase()}
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {metier.examples.map((ex, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="text-3xl mb-3">{ex.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{ex.title}</h3>
                <p className="text-slate-600 text-sm">{ex.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BRANDING */}
      <section className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl p-12" style={{ background: `linear-gradient(145deg, ${metier.accentColor}, ${metier.accentColor}cc)`, color: '#0d0d0f' }}>
            <h2 className="text-3xl font-black mb-4">{metier.brandingTitle}</h2>
            <p className="text-lg mb-8 opacity-90 max-w-3xl">{metier.brandingDesc}</p>
            <div className="grid md:grid-cols-3 gap-4">
              {metier.customFields.map((f, i) => (
                <div key={i} className="bg-white/30 backdrop-blur rounded-xl p-4 border border-black/10">
                  <div className="font-bold text-sm mb-1">{f.name}</div>
                  <div className="text-sm opacity-80">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-20 px-5 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-12 text-center">Les bénéfices</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metier.benefits.map((b, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 text-center">
                <div className="text-4xl mb-3">{b.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{b.title}</h3>
                <p className="text-sm text-slate-600">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            Prêt à équiper votre {metier.title.toLowerCase().replace('s', '')} ?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Rejoignez les {metier.title.toLowerCase()} qui utilisent déjà QRTags.
          </p>
          <Link
            href="/devenir-partenaire"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-black text-base"
            style={{ background: metier.accentColor, color: '#0d0d0f' }}
          >
            Devenir partenaire
          </Link>
        </div>
      </section>
    </main>
  );
}
