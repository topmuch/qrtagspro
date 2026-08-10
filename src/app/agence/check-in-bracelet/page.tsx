'use client';

import { useState } from 'react';
import { Loader2, Search, User, DoorOpen, Calendar, CheckCircle2, X } from 'lucide-react';

interface StayResult {
  found: boolean;
  baggageStatus?: string;
  baggageContext?: string;
  stay?: {
    id: string;
    roomNumber: string | null;
    guestName: string | null;
    guestEmail: string | null;
    guestPhone: string | null;
    language: string;
    checkInDate: string;
    checkOutDate: string;
    nbPersons: number;
    status: string;
  } | null;
}

export default function CheckInBraceletPage() {
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [stayData, setStayData] = useState<StayResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Formulaire de check-in
  const [form, setForm] = useState({
    guestName: '',
    roomNumber: '',
    guestEmail: '',
    guestPhone: '',
    language: 'fr',
    checkInDate: new Date().toISOString().slice(0, 10),
    checkOutDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    nbPersons: '1',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const searchBracelet = async () => {
    if (!reference.trim()) return;
    setLoading(true);
    setError(null);
    setStayData(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/stay?reference=${reference.trim()}`);
      const data: StayResult = await res.json();
      setStayData(data);
      if (data.stay) {
        setForm({
          guestName: data.stay.guestName || '',
          roomNumber: data.stay.roomNumber || '',
          guestEmail: data.stay.guestEmail || '',
          guestPhone: data.stay.guestPhone || '',
          language: data.stay.language || 'fr',
          checkInDate: new Date(data.stay.checkInDate).toISOString().slice(0, 10),
          checkOutDate: new Date(data.stay.checkOutDate).toISOString().slice(0, 10),
          nbPersons: String(data.stay.nbPersons || 1),
        });
      }
    } catch {
      setError('Erreur réseau');
    }
    setLoading(false);
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/stay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, ...form, checkInDate: form.checkInDate, checkOutDate: form.checkOutDate }),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur');
      }
    } catch {
      setError('Erreur réseau');
    }
    setSubmitting(false);
  };

  const handleCheckOut = async () => {
    if (!stayData?.stay?.id) return;
    if (!confirm('Check-out ? Le bracelet sera désactivé.')) return;
    setSubmitting(true);
    try {
      await fetch(`/api/stay?id=${stayData.stay.id}`, { method: 'DELETE' });
      setSuccess(true);
      setStayData(null);
      setReference('');
    } catch { setError('Erreur'); }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">🏨 Check-in Bracelet</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Liez un bracelet à un client (nom, chambre, dates)</p>
      </div>

      {/* Recherche bracelet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Référence du bracelet *</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchBracelet()}
            placeholder="Ex: QRT26-CRA97G"
            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:border-[#134288] font-mono text-sm"
          />
          <button onClick={searchBracelet} disabled={loading || !reference.trim()}
            className="px-4 py-2.5 bg-[#134288] text-white font-bold rounded-lg hover:bg-[#0f3670] disabled:opacity-50 flex items-center gap-2 text-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Chercher
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-600 rounded-lg p-3 text-sm">{error}</div>}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 text-green-600 rounded-lg p-4 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> Check-in réussi ! Le bracelet est maintenant actif et lié au client.
        </div>
      )}

      {/* Bracelet trouvé */}
      {stayData?.found && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Bracelet trouvé : {reference}</h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stayData.baggageStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {stayData.baggageStatus === 'active' ? 'ACTIF' : stayData.baggageStatus}
            </span>
          </div>

          {stayData.stay && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">⚠️ Un séjour actif existe déjà :</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{stayData.stay.guestName} · Ch. {stayData.stay.roomNumber}</p>
              <button onClick={handleCheckOut} disabled={submitting}
                className="mt-2 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600">
                Faire le check-out (désactiver)
              </button>
            </div>
          )}

          {/* Formulaire check-in */}
          <form onSubmit={handleCheckIn} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1"><User className="w-3 h-3" /> Nom client *</label>
                <input type="text" value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm outline-none focus:border-[#134288]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1"><DoorOpen className="w-3 h-3" /> Chambre</label>
                <input type="text" value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm outline-none focus:border-[#134288]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Email</label>
                <input type="email" value={form.guestEmail} onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm outline-none focus:border-[#134288]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Téléphone</label>
                <input type="tel" value={form.guestPhone} onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm outline-none focus:border-[#134288]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Arrivée</label>
                <input type="date" value={form.checkInDate} onChange={(e) => setForm({ ...form, checkInDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm outline-none focus:border-[#134288]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Départ</label>
                <input type="date" value={form.checkOutDate} onChange={(e) => setForm({ ...form, checkOutDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm outline-none focus:border-[#134288]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Langue</label>
                <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm outline-none">
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Nb personnes</label>
                <input type="number" min="1" max="10" value={form.nbPersons} onChange={(e) => setForm({ ...form, nbPersons: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm outline-none focus:border-[#134288]" />
              </div>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full py-3 bg-[#32ba5d] text-black font-bold rounded-xl hover:bg-[#2ba14f] disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {stayData.stay ? 'Mettre à jour le séjour' : 'Valider le check-in'}
            </button>
          </form>
        </div>
      )}

      {stayData && !stayData.found && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-600 rounded-lg p-4 text-sm">Bracelet introuvable.</div>
      )}
    </div>
  );
}
