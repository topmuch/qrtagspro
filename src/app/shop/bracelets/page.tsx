import PricingCards from './components/PricingCards';
import OrderForm from './components/OrderForm';

export const metadata = {
  title: 'Bracelets QR All-Inclusive | QRTags Pro',
  description:
    "Bracelets imperméables avec QR codes dynamiques pour hôtels resorts. Offrez à vos clients un accès instantané aux services, animations et conciergerie digitale.",
};

export default function BraceletsShopPage() {
  return (
    <div className="min-h-screen bg-[#111111] text-white">
      {/* ─── Header ─── */}
      <header className="bg-[#E3B23C] text-black py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Bracelets QR All-Inclusive
          </h1>
          <p className="text-lg md:text-xl font-medium">
            Bracelets imperméables avec QR codes dynamiques pour vos clients
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-semibold">
            <span className="bg-black text-[#E3B23C] px-4 py-2 rounded-full">
              ✅ Imperméable
            </span>
            <span className="bg-black text-[#E3B23C] px-4 py-2 rounded-full">
              ✅ QR Dynamique
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

      {/* ─── Pricing Section ─── */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#E3B23C]">
            Choisissez votre pack
          </h2>
          <PricingCards />
        </div>
      </section>

      {/* ─── Order Form Section ─── */}
      <section className="py-12 px-4 bg-black/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#E3B23C]">
            Commander maintenant
          </h2>
          <OrderForm />
        </div>
      </section>

      {/* ─── Footer Info ─── */}
      <section className="py-12 px-4">
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
      <section className="py-12 px-4 bg-black/50">
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
              <p className="text-sm text-gray-400">Distribuez à vos clients</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
