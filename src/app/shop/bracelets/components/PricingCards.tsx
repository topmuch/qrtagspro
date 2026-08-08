'use client';

import { useState } from 'react';
import {
  BRACELET_PACKS,
  formatFCFA,
  computeUnitPrice,
  type BraceletPack,
  type BraceletType,
  type BraceletQuantity,
} from '@/lib/bracelets';

interface PricingCardsProps {
  /**
   * Optionnel : callback appelé quand l'utilisateur sélectionne un pack.
   * Permet au parent (OrderForm) de recevoir le choix et de scroller vers le formulaire.
   * Si non fourni, PricingCards gère son propre état et scroll vers #order-form.
   */
  onSelect?: (quantity: BraceletQuantity, type: BraceletType) => void;
}

/**
 * Cartes de pricing — affiche les 3 packs (50/100/500) avec les 2 types
 * (Standard/Brandé) pour chacun. Met en avant le pack "popular".
 *
 * Au clic sur un bouton Standard/Brandé, notifie le parent (si onSelect fourni)
 * et scroll vers le formulaire de commande (#order-form).
 */
export default function PricingCards({ onSelect }: PricingCardsProps) {
  const [selectedPack, setSelectedPack] = useState<BraceletPack | null>(null);
  const [selectedType, setSelectedType] = useState<BraceletType>('standard');

  const handleSelect = (pack: BraceletPack, type: BraceletType) => {
    setSelectedPack(pack);
    setSelectedType(type);
    onSelect?.(pack.quantity, type);
    // Scroll vers le formulaire
    document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {BRACELET_PACKS.map((pack) => {
        const isSelected = selectedPack?.quantity === pack.quantity;
        return (
          <div
            key={pack.quantity}
            className={`relative p-6 rounded-xl border-2 transition-all ${
              pack.popular
                ? 'border-[#E3B23C] bg-[#E3B23C]/5 shadow-lg shadow-[#E3B23C]/10'
                : 'border-gray-700 bg-black/50'
            }`}
          >
            {pack.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E3B23C] text-black text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                ⭐ LE PLUS VENDU
              </span>
            )}

            <h3 className="text-lg font-bold text-center mb-4 text-white">
              {pack.label}
            </h3>
            <p className="text-4xl font-black text-center text-[#E3B23C] mb-2">
              {pack.quantity}
            </p>
            <p className="text-center text-gray-400 mb-6">bracelets</p>

            <div className="space-y-3">
              {/* Bouton Standard */}
              <button
                type="button"
                onClick={() => handleSelect(pack, 'standard')}
                aria-pressed={isSelected && selectedType === 'standard'}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  isSelected && selectedType === 'standard'
                    ? 'bg-[#E3B23C] text-black'
                    : 'bg-black text-[#E3B23C] border-2 border-[#E3B23C] hover:bg-[#E3B23C]/10'
                }`}
              >
                Standard
                <span className="block text-sm font-normal mt-1">
                  {formatFCFA(pack.standardPrice)}
                </span>
                <span className="block text-xs opacity-70">
                  {formatFCFA(computeUnitPrice(pack.quantity, false))}/unité
                </span>
              </button>

              {/* Bouton Brandé */}
              <button
                type="button"
                onClick={() => handleSelect(pack, 'branded')}
                aria-pressed={isSelected && selectedType === 'branded'}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  isSelected && selectedType === 'branded'
                    ? 'bg-[#E3B23C] text-black'
                    : 'bg-black text-[#E3B23C] border-2 border-[#E3B23C] hover:bg-[#E3B23C]/10'
                }`}
              >
                Brandé
                <span className="block text-sm font-normal mt-1">
                  {formatFCFA(pack.brandedPrice)}
                </span>
                <span className="block text-xs opacity-70">
                  {formatFCFA(computeUnitPrice(pack.quantity, true))}/unité
                </span>
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-400 space-y-1">
              <p>✅ Imperméable Tyvek</p>
              <p>✅ QR code dynamique</p>
              <p>✅ Livraison {pack.deliveryDays}</p>
              {pack.quantity >= 100 && <p>✅ Support prioritaire</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
