import PricingCards from './components/PricingCards';
import OrderForm from './components/OrderForm';
import { SPECIALIZED_PROFILES, UNIVERSAL_BRACELET_TAGLINE } from '@/lib/bracelet-profiles';

export const metadata = {
  title: 'Bracelet de Séjour Universel QR | QRTags Pro',
  description:
    "Bracelets imperméables avec QR codes adaptatifs pour tous types d'hôtels. " +
    "Un seul produit, 4 expériences personnalisées selon votre clientèle : Business, Transit, Resort, Boutique.",
};

export default function BraceletsShopPage() {
  return (
    <div className="min-h-screen bg-[#111111] text-white">
      {/* ─── Header ─── */}
      <header className="bg-[#E3B23C] text-black py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <span className="inline-block bg-black text-[#E3B23C] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
            ✅ S&apos;adapte à votre type d&apos;hôtel automatiquement
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Bracelet de Séjour Universel
          </h1>
          <p className="text-lg md:text-xl font-medium mb-2">
            Bracelets imperméables avec QR codes adaptatifs pour tous types d&apos;hôtels
          </p>
          <p className="text-base font-semibold text-black/80 italic">
            {UNIVERSAL_BRACELET_TAGLINE}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-semibold">
            <span className="bg-black text-[#E3B23C] px-4 py-2 rounded-full">
              ✅ Imperméable
            </span>
            <span className="bg-black text-[#E3B23C] px-4 py-2 rounded-full">
              ✅ QR Adaptatif
            </span>
            <span className="bg-black text-[#E3B23C] px-4 py-2 rounded-full">
              ✅ Brandable
            </span>
            <span className="bg-black text-[#E3B23C] px-4 py-2 rounded-full">
              ✅ Sans application
            </span>
          </div>
        </div>
      </header>

      {/* ─── Universal Section : 4 types d'hôtels ─── */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#E3B23C] mb-3">
              Un bracelet pour chaque hôtel
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Le contenu du QR code s&apos;adapte automatiquement au profil de votre hôtel.
              Vos clients voient exactement ce dont ils ont besoin, ni plus, ni moins.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {SPECIALIZED_PROFILES.map((profile) => (
              <div
                key={profile.value}
                className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 hover:border-[#E3B23C] transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: `${profile.accentColor}20` }}
                  >
                    {profile.emoji}
                  </span>
                  <div>
                    <h3 className="font-bold text-white">{profile.label}</h3>
                    <span className="text-xs text-gray-500">{profile.marketShare} du marché</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-3 leading-relaxed">
                  {profile.tagline}
                </p>
                <ul className="space-y-1.5">
                  {profile.services.slice(0, 4).map((service, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                      <span className="text-[#E3B23C] shrink-0">✓</span>
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Exemples</p>
                  <p className="text-xs text-gray-400">{profile.examples.join(' · ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Section ─── */}
      <section className="py-12 px-4 bg-black/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#E3B23C]">
            Choisissez votre pack
          </h2>
          <PricingCards />
        </div>
      </section>

      {/* ─── Order Form Section ─── */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#E3B23C]">
            Commander maintenant
          </h2>
          <OrderForm />
        </div>
      </section>

      {/* ─── Footer Info ─── */}
      <section className="py-12 px-4 bg-black/50">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#E3B23C] text-black p-6 rounded-xl border-4 border-black">
            <h3 className="font-bold text-lg mb-2">🚚 Livraison Rapide</h3>
            <p className="text-sm">Dakar: 24h | Régions: 48-72h</p>
          </div>
          <div className="bg-[#E3B23C] text-black p-6 rounded-xl border-4 border-black">
            <h3 className="font-bold text-lg mb-2">💳 Paiement Flexible</h3>
            <p className="text-sm">Wave, Orange Money, Cash à la livraison</p>
          </div>
          <div className="bg-[#E3B23C] text-black p-6 rounded-xl border-4 border-black">
            <h3 className="font-bold text-lg mb-2">🎨 Branding Inclus</h3>
            <p className="text-sm">Logo + couleurs personnalisées sur bracelet</p>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#E3B23C]">
            Comment ça marche
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#E3B23C] text-black flex items-center justify-center font-black text-xl">
                1
              </div>
              <h3 className="font-bold mb-1">Commandez</h3>
              <p className="text-sm text-gray-400">Choisissez votre pack et payez</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#E3B23C] text-black flex items-center justify-center font-black text-xl">
                2
              </div>
              <h3 className="font-bold mb-1">Production</h3>
              <p className="text-sm text-gray-400">QR codes générés et imprimés</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#E3B23C] text-black flex items-center justify-center font-black text-xl">
                3
              </div>
              <h3 className="font-bold mb-1">Livraison</h3>
              <p className="text-sm text-gray-400">Bracelets livrés à votre hôtel</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#E3B23C] text-black flex items-center justify-center font-black text-xl">
                4
              </div>
              <h3 className="font-bold mb-1">Activation</h3>
              <p className="text-sm text-gray-400">Configurez votre profil hôtel, distribuez</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
