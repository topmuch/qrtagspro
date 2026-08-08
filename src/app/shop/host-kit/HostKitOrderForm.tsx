'use client';

import { useState } from 'react';
import { createHostKitOrder } from './actions';
import { HOST_KIT_OFFERS, PAYMENT_METHODS, formatFCFA, type HostKitOffer } from '@/lib/host-kit';

export default function HostKitOrderForm() {
  const [selectedOffer, setSelectedOffer] = useState<HostKitOffer>('STARTER');
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    propertyName: '',
    propertyAddress: '',
    deliveryCity: '',
    deliveryAddress: '',
    paymentMethod: 'cash_on_delivery' as string,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orderId: string; total: number } | null>(null);

  const offer = HOST_KIT_OFFERS.find((o) => o.id === selectedOffer)!;
  const needsDelivery = selectedOffer === 'STARTER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createHostKitOrder({
      offer: selectedOffer,
      ...form,
    });

    setSubmitting(false);

    if (result.success) {
      setSuccess({ orderId: result.orderId!, total: result.totalPrice! });
    } else {
      setError(result.error || 'Erreur');
    }
  };

  if (success) {
    return (
      <div className="bg-[#1a1a1a] border-2 border-green-500 rounded-xl p-8 text-center space-y-4">
        <div className="text-6xl">✅</div>
        <h3 className="text-2xl font-bold text-green-500">Commande créée !</h3>
        <p className="text-gray-400">
          Merci ! Notre équipe vous contacte dans les plus brefs délais pour finaliser votre Kit Hôte.
        </p>
        <div className="bg-black/50 rounded-lg p-4 inline-block">
          <p className="text-sm text-gray-400">Numéro de suivi</p>
          <p className="text-xl font-mono font-bold text-[#E3B23C]">{success.orderId.slice(-8).toUpperCase()}</p>
          <p className="text-sm text-gray-400 mt-2">Montant</p>
          <p className="text-lg font-bold text-white">{formatFCFA(success.total)}</p>
        </div>
        <button
          onClick={() => setSuccess(null)}
          className="mt-4 px-6 py-3 bg-[#E3B23C] text-black font-bold rounded-lg hover:bg-yellow-500 transition"
        >
          Nouvelle commande
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#1a1a1a] border-2 border-[#E3B23C] rounded-xl p-6 md:p-8 space-y-6"
    >
      {/* ─── Sélection offre ─── */}
      <div>
        <label className="block text-sm font-bold text-white mb-3">Choisissez votre offre *</label>
        <div className="space-y-2">
          {HOST_KIT_OFFERS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelectedOffer(o.id)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedOffer === o.id
                  ? 'border-[#E3B23C] bg-[#E3B23C]/10'
                  : 'border-gray-700 bg-black hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{o.icon}</span>
                  <div>
                    <p className="font-bold text-white text-sm">{o.name}</p>
                    <p className="text-xs text-gray-400">{o.target}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#E3B23C]">{o.priceLabel}</p>
                  <p className="text-[10px] text-gray-500">{o.period}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Infos logement ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-white mb-2">Nom du logement</label>
          <input
            type="text"
            value={form.propertyName}
            onChange={(e) => setForm({ ...form, propertyName: e.target.value })}
            placeholder="Ex: Appartement Almadies"
            className="w-full px-4 py-3 bg-black border-2 border-gray-700 rounded-lg text-white focus:border-[#E3B23C] outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-white mb-2">Adresse du logement</label>
          <input
            type="text"
            value={form.propertyAddress}
            onChange={(e) => setForm({ ...form, propertyAddress: e.target.value })}
            placeholder="Ex: Route des Almadies, Dakar"
            className="w-full px-4 py-3 bg-black border-2 border-gray-700 rounded-lg text-white focus:border-[#E3B23C] outline-none"
          />
        </div>
      </div>

      {/* ─── Infos client ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-white mb-2">Nom complet *</label>
          <input
            type="text"
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            required
            placeholder="Ex: Awa Diop"
            className="w-full px-4 py-3 bg-black border-2 border-gray-700 rounded-lg text-white focus:border-[#E3B23C] outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-white mb-2">Téléphone *</label>
          <input
            type="tel"
            value={form.customerPhone}
            onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
            required
            placeholder="+221 77 123 45 67"
            className="w-full px-4 py-3 bg-black border-2 border-gray-700 rounded-lg text-white focus:border-[#E3B23C] outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-white mb-2">Email</label>
        <input
          type="email"
          value={form.customerEmail}
          onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
          placeholder="contact@example.com"
          className="w-full px-4 py-3 bg-black border-2 border-gray-700 rounded-lg text-white focus:border-[#E3B23C] outline-none"
        />
      </div>

      {/* ─── Livraison (Kit Starter uniquement) ─── */}
      {needsDelivery && (
        <div className="bg-black/30 p-4 rounded-lg border border-[#E3B23C]/20 space-y-4">
          <p className="text-sm font-bold text-[#E3B23C]">📦 Livraison du Kit physique</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-white mb-2">Ville *</label>
              <input
                type="text"
                value={form.deliveryCity}
                onChange={(e) => setForm({ ...form, deliveryCity: e.target.value })}
                required={needsDelivery}
                placeholder="Dakar"
                className="w-full px-4 py-3 bg-black border-2 border-gray-700 rounded-lg text-white focus:border-[#E3B23C] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white mb-2">Adresse *</label>
              <input
                type="text"
                value={form.deliveryAddress}
                onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                required={needsDelivery}
                placeholder="Rue, numéro, quartier"
                className="w-full px-4 py-3 bg-black border-2 border-gray-700 rounded-lg text-white focus:border-[#E3B23C] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Paiement ─── */}
      <div>
        <label className="block text-sm font-bold text-white mb-3">Mode de paiement *</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.value}
              type="button"
              onClick={() => setForm({ ...form, paymentMethod: method.value })}
              className={`py-3 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 text-sm ${
                form.paymentMethod === method.value
                  ? 'bg-[#E3B23C] text-black'
                  : 'bg-black text-[#E3B23C] border-2 border-[#E3B23C] hover:bg-[#E3B23C]/10'
              }`}
            >
              <span className="text-lg">{method.icon}</span>
              {method.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Récapitulatif ─── */}
      <div className="bg-[#E3B23C]/10 border-2 border-[#E3B23C] rounded-lg p-4">
        <h3 className="font-bold text-[#E3B23C] mb-2">Récapitulatif</h3>
        <div className="space-y-1 text-sm">
          <p className="text-white">{offer.icon} {offer.name}</p>
          <p className="text-gray-400">{offer.tagline}</p>
          <p className="text-2xl font-bold text-[#E3B23C] mt-3">{formatFCFA(offer.price)}</p>
          <p className="text-xs text-gray-400">{offer.period}</p>
        </div>
      </div>

      {/* ─── Erreur ─── */}
      {error && (
        <div className="bg-red-500/10 border-2 border-red-500 rounded-lg p-4 text-red-500">
          ⚠️ {error}
        </div>
      )}

      {/* ─── Submit ─── */}
      <button
        type="submit"
        disabled={submitting}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          submitting
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-[#E3B23C] text-black hover:bg-yellow-500 hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            Traitement…
          </span>
        ) : (
          `✅ Commander — ${formatFCFA(offer.price)}`
        )}
      </button>
    </form>
  );
}
