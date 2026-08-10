'use client';

import { useState } from 'react';
import { Loader2, X, Send } from 'lucide-react';

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  type: string;
  isFree: boolean;
  price: number;
}

interface Props {
  service: ServiceItem;
  agencyId: string;
  reference?: string | null;
  roomNumber?: string | null;
  guestName?: string | null;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function ServiceRequestModal({ service, agencyId, reference, roomNumber, guestName, onClose }: Props) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/service-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          agencyId,
          baggageId: null,
          roomNumber,
          guestName,
          notes: notes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => { onClose(); }, 2000);
      } else {
        setError('Erreur lors de l\'envoi');
      }
    } catch {
      setError('Erreur réseau');
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center max-w-sm">
          <div className="text-6xl mb-3">✅</div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Demande envoyée !</h3>
          <p className="text-sm text-slate-500 mt-1">L'équipe a été notifiée.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{service.icon}</span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{service.name}</h2>
              {!service.isFree && <p className="text-sm text-amber-600 font-bold">{service.price} FCFA</p>}
            </div>
          </div>
          <button onClick={onClose} disabled={submitting} className="text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        {service.description && <p className="text-sm text-slate-500 mb-4">{service.description}</p>}

        {guestName && roomNumber && (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 mb-4">
            <p className="text-xs text-slate-500">Demande depuis</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{guestName} · Ch. {roomNumber}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ex: 2 serviettes supplémentaires svp"
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:border-[#134288] text-sm resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#32ba5d] text-black font-bold rounded-xl hover:bg-[#2ba14f] transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {submitting ? 'Envoi...' : 'Envoyer la demande'}
          </button>
        </form>
      </div>
    </div>
  );
}
