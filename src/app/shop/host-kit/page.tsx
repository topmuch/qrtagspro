import { HOST_KIT_OFFERS, PHYSICAL_SUPPORTS, formatFCFA } from '@/lib/host-kit';
import HostKitOrderForm from './HostKitOrderForm';

export const metadata = {
  title: 'Kit Hôte QRTags — Conciergerie digitale Airbnb | QRTags Pro',
  description:
    'Kit physique + dashboard digital pour hôtes Airbnb. Chevalet, aimant frigo, sticker NFC. Automatisation WhatsApp. À partir de 25 000 FCFA.',
};

export default function HostKitShopPage() {
  return (
    <div className="min-h-screen bg-[#111111] text-white">
      {/* ─── Header ─── */}
      <header className="bg-[#B45309] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <span className="inline-block bg-black/30 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
            🏠 QRTags Host
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Kit Hôte QRTags
          </h1>
          <p className="text-lg md:text-xl font-medium mb-2">
            La conciergerie digitale pour vos locations Airbnb
          </p>
          <p className="text-base font-semibold text-white/80 italic mb-6">
            Remplacez le classeur sur la table de nuit par un QR code scannable
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm font-semibold">
            <span className="bg-black/30 text-white px-4 py-2 rounded-full">📱 WiFi copiable en 1 clic</span>
            <span className="bg-black/30 text-white px-4 py-2 rounded-full">💬 WhatsApp auto J-1 + check-out</span>
            <span className="bg-black/30 text-white px-4 py-2 rounded-full">🪧 Chevalet + aimant + NFC inclus</span>
          </div>
        </div>
      </header>

      {/* ─── Supports physiques ─── */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3 text-[#E3B23C]">
            Ce que contient le Kit
          </h2>
          <p className="text-center text-gray-400 mb-10 max-w-2xl mx-auto">
            3 supports physiques premium pour que votre voyageur trouve le QR code
            où qu'il soit dans l'appartement.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PHYSICAL_SUPPORTS.map((support) => (
              <div
                key={support.id}
                className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 hover:border-[#E3B23C] transition-colors"
              >
                <div className="text-5xl mb-4 text-center">{support.icon}</div>
                <h3 className="text-lg font-bold text-white text-center mb-2">{support.name}</h3>
                <p className="text-sm text-gray-400 text-center mb-4 leading-relaxed">{support.description}</p>
                <div className="space-y-1.5 pt-4 border-t border-gray-800">
                  {support.specs.map((spec, i) => (
                    <p key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                      <span className="text-[#E3B23C] shrink-0">✓</span>
                      <span>{spec}</span>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="py-12 px-4 bg-black/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3 text-[#E3B23C]">
            Choisissez votre offre
          </h2>
          <p className="text-center text-gray-400 mb-10">
            Un seul produit, 3 formules selon votre profil d'hôte
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOST_KIT_OFFERS.map((offer) => (
              <div
                key={offer.id}
                className={`relative p-6 rounded-2xl border-2 transition-all ${
                  offer.popular
                    ? 'border-[#E3B23C] bg-[#E3B23C]/5 shadow-lg shadow-[#E3B23C]/10'
                    : 'border-gray-700 bg-black/50'
                }`}
              >
                {offer.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E3B23C] text-black text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    ⭐ LE PLUS POPULAIRE
                  </span>
                )}

                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">{offer.icon}</div>
                  <h3 className="text-lg font-bold text-white">{offer.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{offer.target}</p>
                </div>

                <div className="text-center mb-6">
                  <p className="text-3xl font-black text-[#E3B23C]">{offer.priceLabel}</p>
                  <p className="text-xs text-gray-500 mt-1">{offer.period}</p>
                </div>

                <ul className="space-y-2 mb-6">
                  {offer.includes.map((item, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                      <span className="text-[#E3B23C] shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Formulaire de commande ─── */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3 text-[#E3B23C]">
            Commander mon Kit Hôte
          </h2>
          <p className="text-center text-gray-400 mb-8">
            Recevez votre Kit Starter (chevalet + aimant + sticker NFC) + 3 mois de dashboard
          </p>
          <HostKitOrderForm />
        </div>
      </section>

      {/* ─── Comment ça marche ─── */}
      <section className="py-12 px-4 bg-black/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#E3B23C]">
            Comment ça marche
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '1', icon: '📦', title: 'Commandez', desc: 'Kit Starter 25 000 FCFA' },
              { step: '2', icon: '📱', title: 'Configurez', desc: 'WiFi, règles, recommandations' },
              { step: '3', icon: '🪧', title: 'Posez', desc: 'Chevalet sur la table de nuit' },
              { step: '4', icon: '✅', title: 'Détendez', desc: 'WhatsApp auto fait le reste' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#E3B23C] text-black flex items-center justify-center font-black text-xl">
                  {item.step}
                </div>
                <div className="text-2xl mb-1">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
