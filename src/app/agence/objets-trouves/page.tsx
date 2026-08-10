'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Plus, Trash2, Package } from 'lucide-react';

interface LostItem {
  id: string; name: string; category: string; description: string | null;
  photoUrl: string | null; foundLocation: string | null; foundDate: string;
  foundBy: string | null; status: string; claimedBy: string | null;
}

const CATS = [
  { v: 'electronics', l: 'Électronique', i: '📱' },
  { v: 'clothing', l: 'Vêtements', i: '👕' },
  { v: 'documents', l: 'Documents', i: '📄' },
  { v: 'jewelry', l: 'Bijoux', i: '💍' },
  { v: 'other', l: 'Autre', i: '📦' },
];

const STATUS = {
  found: { l: 'Trouvé', c: 'bg-blue-100 text-blue-700' },
  claimed: { l: 'Réclamé', c: 'bg-amber-100 text-amber-700' },
  returned: { l: 'Restitué', c: 'bg-green-100 text-green-700' },
  shipped: { l: 'Expédié', c: 'bg-purple-100 text-purple-700' },
  donated: { l: 'Donné', c: 'bg-gray-100 text-gray-700' },
};

export default function LostItemsPage() {
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'other', description: '', foundLocation: '', foundBy: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lost-items?agencyId=auto');
      const data = await res.json();
      setItems(data.items || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await fetch('/api/lost-items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      setForm({ name: '', category: 'other', description: '', foundLocation: '', foundBy: '' });
      setShowForm(false); loadData();
    } catch {}
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/lost-items?id=${id}&status=${status}`, { method: 'PATCH' });
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet objet ?')) return;
    await fetch(`/api/lost-items?id=${id}`, { method: 'DELETE' });
    loadData();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#134288]" /><span className="ml-3 text-slate-600">Chargement…</span></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">📦 Objets Trouvés</h1>
          <p className="text-slate-500 text-sm mt-1">Inventaire des objets trouvés dans l'hôtel</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#32ba5d] text-black font-bold rounded-xl text-sm">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nom de l'objet *" className="px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white outline-none focus:border-[#134288]" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white outline-none">
              {CATS.map(c => <option key={c.v} value={c.v}>{c.i} {c.l}</option>)}
            </select>
          </div>
          <input type="text" value={form.foundLocation} onChange={(e) => setForm({ ...form, foundLocation: e.target.value })} placeholder="Lieu (ex: Ch. 204, Lobby)" className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white outline-none" />
          <input type="text" value={form.foundBy} onChange={(e) => setForm({ ...form, foundBy: e.target.value })} placeholder="Trouvé par (staff)" className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white outline-none" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Description" className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white outline-none resize-none" />
          <button type="submit" disabled={submitting} className="w-full py-2.5 bg-[#32ba5d] text-black font-bold rounded-lg text-sm">{submitting ? 'Enregistrement…' : 'Enregistrer'}</button>
        </form>
      )}

      {items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Aucun objet trouvé pour le moment</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const cat = CATS.find(c => c.v === item.category) || CATS[4];
            const st = STATUS[item.status as keyof typeof STATUS] || STATUS.found;
            return (
              <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">{cat.i}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{item.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                    {item.foundLocation && <span>📍 {item.foundLocation}</span>}
                    <span>🕒 {new Date(item.foundDate).toLocaleDateString('fr-FR')}</span>
                    {item.foundBy && <span>👤 {item.foundBy}</span>}
                    {item.claimedBy && <span>✋ {item.claimedBy}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select value={item.status} onChange={(e) => updateStatus(item.id, e.target.value)} className={`text-[10px] font-bold px-2 py-1 rounded-full border-0 ${st.c}`}>
                    <option value="found">Trouvé</option>
                    <option value="claimed">Réclamé</option>
                    <option value="returned">Restitué</option>
                    <option value="shipped">Expédié</option>
                    <option value="donated">Donné</option>
                  </select>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
