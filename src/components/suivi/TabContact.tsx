'use client';

import { useState } from 'react';
import {
  Phone,
  MessageCircle,
  User,
  Mail,
  HelpCircle,
  Shield,
} from 'lucide-react';
import type { BaggageInfo } from './types';

const INK = '#1a1a1a';

export function TabContact({
  reference,
  baggage,
  lastFinder,
  hasFinderPhone,
  isDeclaredLost,
  lang,
  t,
}: {
  reference: string;
  baggage: BaggageInfo;
  lastFinder: { name: string | null; phone: string | null } | null;
  hasFinderPhone: boolean;
  isDeclaredLost: boolean;
  lang: string;
  t: (key: string, params?: Record<string, string>) => string;
}) {
  if (!lastFinder || (!lastFinder.name && !lastFinder.phone)) {
    return (
      <div className="space-y-3">
        <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-6 text-center">
          <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600">Aucun trouveur n&apos;a encore signalé ce bagage</p>
          <p className="text-xs text-slate-400 mt-1">
            Quand quelqu&apos;un trouvera votre bagage et laissera ses coordonnées, elles apparaîtront ici.
          </p>
        </div>

        <a href="/assistance" className="block bg-white border-2 border-[#111111] text-[#111111] text-center py-3 px-4 rounded-xl font-bold text-sm">
          <HelpCircle className="w-4 h-4 inline mr-2" />Besoin d&apos;aide ?
        </a>
        <a href="mailto:contact@qrtags.com" className="block bg-white border-2 border-slate-300 text-slate-600 text-center py-3 px-4 rounded-xl font-bold text-sm">
          <Mail className="w-4 h-4 inline mr-2" />Contacter le support QRTags
        </a>
      </div>
    );
  }

  const finderPhone = lastFinder.phone || '';
  const waPhone = finderPhone.replace(/\D/g, '');
  const waMessage = encodeURIComponent(`Bonjour ${lastFinder.name || ''}, j'ai bien reçu votre message concernant mon bagage ${reference}. Merci de m'avoir contacté(e) !`);

  return (
    <div className="space-y-3">
      {/* Finder info */}
      <div className="bg-green-600 border-2 border-green-700 rounded-2xl p-4">
        <h2 className="text-xs uppercase tracking-widest font-bold mb-3 text-white flex items-center gap-2">
          <User className="w-4 h-4" /> Trouveur
        </h2>
        <div className="space-y-2 text-sm">
          {lastFinder.name && (
            <div className="flex items-center justify-between">
              <span className="text-green-200">Nom</span>
              <span className="font-bold text-white">{lastFinder.name}</span>
            </div>
          )}
          {lastFinder.phone && (
            <div className="flex items-center justify-between">
              <span className="text-green-200">Téléphone</span>
              <span className="font-bold text-white" dir="ltr">{lastFinder.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`https://wa.me/${waPhone}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 bg-[#25D366] hover:bg-[#1ebe5d] text-white py-4 rounded-xl font-bold transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-sm">WhatsApp</span>
        </a>
        <a
          href={`tel:${finderPhone}`}
          className="flex flex-col items-center justify-center gap-1 bg-[#1a1a1a] hover:bg-black text-white py-4 rounded-xl font-bold transition-colors"
        >
          <Phone className="w-6 h-6" />
          <span className="text-sm">Appeler</span>
        </a>
      </div>

      {/* Tips */}
      <div className="bg-[#111111]/40 border border-white/20 rounded-xl p-3 text-xs text-white">
        <p className="font-bold mb-1">💡 Conseils :</p>
        <p>• Contactez le trouveur rapidement pour organiser la récupération</p>
        <p>• Demandez-lui un rendez-vous dans un lieu public</p>
        <p>• Vérifiez bien qu&apos;il s&apos;agit de votre bagage</p>
      </div>

      {/* Support */}
      <a href="mailto:contact@qrtags.com" className="block bg-white border-2 border-slate-300 text-slate-600 text-center py-3 px-4 rounded-xl font-bold text-sm">
        <Mail className="w-4 h-4 inline mr-2" />Contacter le support QRTags
      </a>

      <div className="text-center text-xs text-white/60 flex items-center justify-center gap-1.5 pt-2">
        <Shield className="w-3 h-3" />
        <span>QRTags — Contact sécurisé</span>
      </div>
    </div>
  );
}
