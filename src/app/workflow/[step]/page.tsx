import { notFound } from 'next/navigation';
import Link from 'next/link';
import { WORKFLOW_STEPS_DATA } from '@/lib/landing-data';

export async function generateStaticParams() {
  return Object.keys(WORKFLOW_STEPS_DATA).map((step) => ({ step }));
}

export default async function WorkflowStepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  const data = WORKFLOW_STEPS_DATA[step];
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
          <Link href="/#workflow" className="text-sm text-slate-500 hover:text-slate-900 mb-6 inline-block">
            ← Retour au workflow
          </Link>
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black"
              style={{ background: '#FDB900', color: '#0d0d0f' }}
            >
              {data.step}
            </div>
            <div className="text-5xl">{data.icon}</div>
          </div>
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
          <h2 className="text-3xl font-black text-slate-900 mb-6">En détail</h2>
          <p className="text-lg text-slate-700 leading-relaxed">{data.description}</p>
        </div>
      </section>

      {/* DETAILS */}
      <section className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-12 text-center">Les étapes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {data.details.map((d, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="text-3xl mb-3">{d.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{d.title}</h3>
                <p className="text-slate-600 text-sm">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXAMPLES */}
      <section className="py-20 px-5 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-12 text-center">Exemples</h2>
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

      {/* NAV PREV/NEXT */}
      <section className="py-12 px-5 border-t border-slate-200">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
          {data.prevStep ? (
            <Link
              href={`/workflow/${data.prevStep.slug}`}
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50"
            >
              <span className="text-slate-400">←</span>
              <div>
                <div className="text-xs text-slate-500">Étape précédente</div>
                <div className="font-bold text-slate-900">{data.prevStep.title}</div>
              </div>
            </Link>
          ) : <div />}
          {data.nextStep ? (
            <Link
              href={`/workflow/${data.nextStep.slug}`}
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-right"
            >
              <div>
                <div className="text-xs text-slate-500">Étape suivante</div>
                <div className="font-bold text-slate-900">{data.nextStep.title}</div>
              </div>
              <span className="text-slate-400">→</span>
            </Link>
          ) : <div />}
        </div>
      </section>
    </main>
  );
}
