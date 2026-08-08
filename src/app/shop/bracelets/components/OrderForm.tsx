'use client';

import { useState } from 'react';
import LogoUpload from './LogoUpload';
import { createBraceletOrder } from '../actions';
import {
  BRACELET_PACKS,
  PAYMENT_METHODS,
  computeTotalPrice,
  formatFCFA,
  type BraceletQuantity,
  type BraceletType,
  type PaymentMethod,
} from '@/lib/bracelets';

interface OrderFormData {
  quantity: BraceletQuantity;
  isBranded: boolean;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  hotelName: string;
  deliveryCity: string;
  deliveryQuartier: string;
  paymentMethod: PaymentMethod;
}

const INITIAL_FORM: OrderFormData = {
  quantity: 50,
  isBranded: false,
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  hotelName: '',
  deliveryCity: 'Dakar',
  deliveryQuartier: '',
  paymentMethod: 'cash_on_delivery',
};

/**
 * Formulaire de commande express — permet à un client (hôtel ou walk-in)
 * de commander un pack de bracelets de séjour universel.
 *
 * Flux :
 *   1. Sélection quantité (50/100/500) + type (Standard/Brandé)
 *   2. Upload logo (si Brandé)
 *   3. Infos client (nom, téléphone, email optionnel, nom hôtel)
 *   4. Infos livraison (ville, quartier)
 *   5. Choix paiement (Wave / Orange Money / Cash à la livraison)
 *   6. Récapitulatif prix calculé côté client (recalculé côté serveur pour sécurité)
 *   7. Submit → server action createBraceletOrder
 */
export default function OrderForm() {
  const [formData, setFormData] = useState<OrderFormData>(INITIAL_FORM);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orderId: string; total: number } | null>(null);

  const handleLogoSelect = (file: File | null) => {
    setLogoFile(file);
  };

  const update = <K extends keyof OrderFormData>(key: K, value: OrderFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Prix total calculé côté client (pour affichage uniquement — le serveur recalcule)
  const totalClientSide = computeTotalPrice(formData.quantity, formData.isBranded);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // ─── Validation côté client (la server action re-valide) ───
      if (!formData.customerName.trim()) {
        throw new Error('Veuillez saisir votre nom complet.');
      }
      if (!formData.customerPhone.trim()) {
        throw new Error('Veuillez saisir votre numéro de téléphone.');
      }
      if (!formData.deliveryCity.trim()) {
        throw new Error('Veuillez saisir votre ville de livraison.');
      }
      if (formData.isBranded && !logoFile) {
        throw new Error('Le logo est obligatoire pour les bracelets brandés.');
      }

      // ─── Sérialisation du logo pour la server action ───
      // Les server actions ne peuvent pas recevoir de File directement ; on
      // sérialise en tableau de bytes (number[]) + métadonnées.
      let logoPayload: { data: number[]; name: string; type: string } | null = null;
      if (logoFile) {
        const arrayBuffer = await logoFile.arrayBuffer();
        logoPayload = {
          data: Array.from(new Uint8Array(arrayBuffer)),
          name: logoFile.name,
          type: logoFile.type,
        };
      }

      // ─── Appel server action ───
      const result = await createBraceletOrder({
        quantity: formData.quantity,
        isBranded: formData.isBranded,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim() || undefined,
        hotelName: formData.hotelName.trim() || undefined,
        deliveryCity: formData.deliveryCity.trim(),
        deliveryQuartier: formData.deliveryQuartier.trim() || undefined,
        paymentMethod: formData.paymentMethod,
        logo: logoPayload,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création de la commande.');
      }

      // ─── Succès ───
      // À ce stade result.success === true, donc orderId et totalPrice sont définis.
      if (!result.orderId || result.totalPrice === undefined) {
        throw new Error('Réponse invalide du serveur.');
      }
      setSuccess({ orderId: result.orderId, total: result.totalPrice });
      setFormData(INITIAL_FORM);
      setLogoFile(null);
      // Scroll vers le message de succès
      document.getElementById('order-success')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Écran de succès (remplace le formulaire après commande) ───
  if (success) {
    return (
      <div
        id="order-success"
        className="bg-black/50 border-2 border-green-500 rounded-xl p-8 text-center space-y-4"
      >
        <div className="text-6xl">✅</div>
        <h3 className="text-2xl font-bold text-green-500">Commande créée avec succès !</h3>
        <p className="text-white">
          Merci pour votre commande. Notre équipe vous contactera dans les plus brefs délais
          au numéro fourni pour finaliser le paiement et la livraison.
        </p>
        <div className="bg-black/50 rounded-lg p-4 inline-block">
          <p className="text-sm text-gray-400">Numéro de suivi</p>
          <p className="text-xl font-mono font-bold text-[#E3B23C]">{success.orderId}</p>
          <p className="text-sm text-gray-400 mt-2">Montant</p>
          <p className="text-lg font-bold text-white">{formatFCFA(success.total)}</p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="mt-4 px-6 py-3 bg-[#E3B23C] text-black font-bold rounded-lg hover:bg-yellow-500 transition"
          >
            Passer une nouvelle commande
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      id="order-form"
      onSubmit={handleSubmit}
      className="bg-black/50 border-2 border-[#E3B23C] rounded-xl p-6 md:p-8 space-y-6"
    >
      {/* ─── Sélection Pack ─── */}
      <div>
        <label className="block text-sm font-bold text-white mb-3">
          Quantité de bracelets <span className="text-[#E3B23C]">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {BRACELET_PACKS.map((pack) => (
            <button
              key={pack.quantity}
              type="button"
              onClick={() => update('quantity', pack.quantity)}
              aria-pressed={formData.quantity === pack.quantity}
              className={`py-3 rounded-lg font-bold transition-all ${
                formData.quantity === pack.quantity
                  ? 'bg-[#E3B23C] text-black'
                  : 'bg-black text-[#E3B23C] border-2 border-[#E3B23C] hover:bg-[#E3B23C]/10'
              }`}
            >
              {pack.quantity} pièces
            </button>
          ))}
        </div>
      </div>

      {/* ─── Type ─── */}
      <div>
        <label className="block text-sm font-bold text-white mb-3">
          Type de bracelet <span className="text-[#E3B23C]">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => update('isBranded', false)}
            aria-pressed={!formData.isBranded}
            className={`py-3 rounded-lg font-bold transition-all ${
              !formData.isBranded
                ? 'bg-[#E3B23C] text-black'
                : 'bg-black text-[#E3B23C] border-2 border-[#E3B23C] hover:bg-[#E3B23C]/10'
            }`}
          >
            Standard
            <span className="block text-xs font-normal mt-1">Design QRTags</span>
          </button>
          <button
            type="button"
            onClick={() => update('isBranded', true)}
            aria-pressed={formData.isBranded}
            className={`py-3 rounded-lg font-bold transition-all ${
              formData.isBranded
                ? 'bg-[#E3B23C] text-black'
                : 'bg-black text-[#E3B23C] border-2 border-[#E3B23C] hover:bg-[#E3B23C]/10'
            }`}
          >
            Brandé
            <span className="block text-xs font-normal mt-1">+ Votre logo</span>
          </button>
        </div>
      </div>

      {/* ─── Logo Upload (si brandé) ─── */}
      {formData.isBranded && (
        <div className="bg-black/30 p-4 rounded-lg border border-[#E3B23C]/20">
          <LogoUpload onLogoSelect={handleLogoSelect} />
        </div>
      )}

      {/* ─── Infos Client ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            Nom complet <span className="text-[#E3B23C]">*</span>
          </label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => update('customerName', e.target.value)}
            className="w-full px-4 py-3 bg-black border-2 border-gray-700 rounded-lg text-white focus:border-[#E3B23C] outline-none transition-colors"
            placeholder="Ex: Moussa Diop"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            Téléphone <span className="text-[#E3B23C]">*</span>
          </label>
          <input
            type="tel"
            value={formData.customerPhone}
            onChange={(e) => update('customerPhone', e.target.value)}
            className="w-full px-4 py-3 bg-black border-2 border-gray-700 rounded-lg text-white focus:border-[#E3B23C] outline-none transition-colors"
            placeholder="+221 77 123 45 67"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            Email <span className="text-gray-500 text-xs">(optionnel)</span>
          </label>
          <input
            type="email"
            value={formData.customerEmail}
            onChange={(e) => update('customerEmail', e.target.value)}
            className="w-full px-4 py-3 bg-black border-2 border-gray-700 rounded-lg text-white focus:border-[#E3B23C] outline-none transition-colors"
            placeholder="contact@votre-hotel.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Pour recevoir le lien d&apos;activation et le suivi de commande
          </p>
        </div>
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            Nom de l&apos;hôtel <span className="text-gray-500 text-xs">(optionnel)</span>
          </label>
          <input
            type="text"
            value={formData.hotelName}
            onChange={(e) => update('hotelName', e.target.value)}
            className="w-full px-4 py-3 bg-black border-2 border-gray-700 rounded-lg text-white focus:border-[#E3B23C] outline-none transition-colors"
            placeholder="Ex: Hôtel Terrou-Bi"
          />
        </div>
      </div>

      {/* ─── Livraison ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            Ville <span className="text-[#E3B23C]">*</span>
          </label>
          <input
            type="text"
            value={formData.deliveryCity}
            onChange={(e) => update('deliveryCity', e.target.value)}
            className="w-full px-4 py-3 bg-black border-2 border-gray-700 rounded-lg text-white focus:border-[#E3B23C] outline-none transition-colors"
            placeholder="Dakar"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            Quartier <span className="text-gray-500 text-xs">(optionnel)</span>
          </label>
          <input
            type="text"
            value={formData.deliveryQuartier}
            onChange={(e) => update('deliveryQuartier', e.target.value)}
            className="w-full px-4 py-3 bg-black border-2 border-gray-700 rounded-lg text-white focus:border-[#E3B23C] outline-none transition-colors"
            placeholder="Ex: Almadies"
          />
        </div>
      </div>

      {/* ─── Paiement ─── */}
      <div>
        <label className="block text-sm font-bold text-white mb-3">
          Mode de paiement <span className="text-[#E3B23C]">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.value}
              type="button"
              onClick={() => update('paymentMethod', method.value)}
              aria-pressed={formData.paymentMethod === method.value}
              className={`py-3 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                formData.paymentMethod === method.value
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

      {/* ─── Récapitulatif Prix ─── */}
      <div className="bg-[#E3B23C]/10 border-2 border-[#E3B23C] rounded-lg p-4">
        <h3 className="font-bold text-[#E3B23C] mb-2">Récapitulatif</h3>
        <div className="space-y-1 text-sm">
          <p className="text-white">
            {formData.quantity} bracelets {formData.isBranded ? 'brandés' : 'standard'}
          </p>
          <p className="text-white">
            Livraison : {formData.deliveryCity}
            {formData.deliveryQuartier && `, ${formData.deliveryQuartier}`}
          </p>
          <p className="text-white">
            Paiement : {PAYMENT_METHODS.find((m) => m.value === formData.paymentMethod)?.label}
          </p>
          <p className="text-2xl font-bold text-[#E3B23C] mt-3">
            Total : {formatFCFA(totalClientSide)}
          </p>
          <p className="text-xs text-gray-400">
            {formData.paymentMethod === 'cash_on_delivery'
              ? 'Paiement à la livraison'
              : 'Vous recevrez une demande de paiement par ' + formData.paymentMethod}
          </p>
        </div>
      </div>

      {/* ─── Messages d'erreur ─── */}
      {error && (
        <div
          role="alert"
          className="bg-red-500/10 border-2 border-red-500 rounded-lg p-4 text-red-500"
        >
          ⚠️ {error}
        </div>
      )}

      {/* ─── Submit Button ─── */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          isSubmitting
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-[#E3B23C] text-black hover:bg-yellow-500 hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            Traitement en cours...
          </span>
        ) : (
          '✅ COMMANDER MAINTENANT'
        )}
      </button>
    </form>
  );
}
