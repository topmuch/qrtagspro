'use client';

/**
 * QRTagsPro V1 — Page Check-in (stub)
 *
 * V1: page simple — saisie manuelle de la référence QR + des infos client.
 * Le vrai flux (scan QR + autocomplete) sera livré dans une itération suivante.
 *
 * FR only — black (#111111) + mustard yellow (#E3B23C) design tokens.
 */

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LogIn, Loader2, QrCode, Info } from 'lucide-react';
import { useAgency } from '../layout';
import { useToast } from '@/hooks/use-toast';

const INPUT =
  'w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-black text-black ' +
  'placeholder-gray-400 focus:outline-none focus:border-[#E3B23C] ' +
  'focus:ring-2 focus:ring-[#E3B23C] transition';

export default function CheckInPage() {
  const { agencyId, agencyName } = useAgency();
  const { toast } = useToast();

  const [form, setForm] = useState({
    reference: '',
    client_name: '',
    room_number: '',
    arrival_date: '',
    departure_date: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.reference.trim()) {
      toast({ title: 'Référence requise', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const customData = {
        client_name: form.client_name,
        room_number: form.room_number,
        arrival_date: form.arrival_date,
        departure_date: form.departure_date,
        phone: form.phone,
      };

      // V1 stub: PATCH /api/baggage/[reference] with status + customData
      const res = await fetch(`/api/baggage/${encodeURIComponent(form.reference.trim())}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'activated',
          travelerFirstName: form.client_name.split(' ')[0] || '',
          travelerLastName: form.client_name.split(' ').slice(1).join(' ') || '',
          whatsappOwner: form.phone || null,
          agencyId,
          customData: JSON.stringify(customData),
          departureDate: form.departure_date ? new Date(form.departure_date).toISOString() : null,
          expiresAt: form.departure_date ? new Date(form.departure_date).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Échec du check-in');
      }

      toast({
        title: 'Check-in réussi',
        description: `${form.reference} activé pour ${form.client_name || 'client'}.`,
      });
      setForm({
        reference: '',
        client_name: '',
        room_number: '',
        arrival_date: '',
        departure_date: '',
        phone: '',
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur inconnue';
      toast({
        title: 'Erreur de check-in',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <Link
          href="/agence/tableau-de-bord"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-black mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-black">Check-in client</h1>
        <p className="text-sm text-slate-500">
          {agencyName} — Saisissez les infos client et activez le QR code.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#E3B23C]/15 border-2 border-[#E3B23C]/40 text-sm text-black">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#111111]" />
        <p>
          V1 : saisissez manuellement la référence QR du stock. Le flux de scan
          automatique sera livré dans une itération suivante.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-6 border-2 border-black shadow-xl space-y-4"
      >
        <div>
          <label htmlFor="reference" className="block text-sm font-semibold text-black mb-1.5">
            Référence QR <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="reference"
              type="text"
              required
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="HOTEL-ABCD12"
              className={INPUT + ' pl-10'}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Référence imprimée sur le sticker QR (format : XXXXX-XXXXXX).
          </p>
        </div>

        <div>
          <label htmlFor="client_name" className="block text-sm font-semibold text-black mb-1.5">
            Nom du client <span className="text-red-600">*</span>
          </label>
          <input
            id="client_name"
            type="text"
            required
            value={form.client_name}
            onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            placeholder="Marie Dupont"
            className={INPUT}
          />
        </div>

        <div>
          <label htmlFor="room_number" className="block text-sm font-semibold text-black mb-1.5">
            N° chambre <span className="text-red-600">*</span>
          </label>
          <input
            id="room_number"
            type="text"
            required
            value={form.room_number}
            onChange={(e) => setForm({ ...form, room_number: e.target.value })}
            placeholder="204"
            className={INPUT}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="arrival_date" className="block text-sm font-semibold text-black mb-1.5">
              Date d&apos;arrivée <span className="text-red-600">*</span>
            </label>
            <input
              id="arrival_date"
              type="date"
              required
              value={form.arrival_date}
              onChange={(e) => setForm({ ...form, arrival_date: e.target.value })}
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="departure_date" className="block text-sm font-semibold text-black mb-1.5">
              Date de départ <span className="text-red-600">*</span>
            </label>
            <input
              id="departure_date"
              type="date"
              required
              value={form.departure_date}
              onChange={(e) => setForm({ ...form, departure_date: e.target.value })}
              className={INPUT}
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-black mb-1.5">
            Téléphone client
          </label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+33 6 12 34 56 78"
            className={INPUT}
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <Link
            href="/agence/tableau-de-bord"
            className="inline-flex items-center px-5 py-3 rounded-xl bg-white border-2 border-black text-sm font-semibold text-black hover:-translate-y-0.5 transition-transform"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-black text-[#E3B23C] text-sm font-semibold border-2 border-black hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Check-in…
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Valider le check-in
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
