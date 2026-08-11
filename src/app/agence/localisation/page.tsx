'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, MapPin, Phone, Navigation, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Numéros d'urgence par pays (code pays ISO 2)
const EMERGENCY_NUMBERS: Record<string, { police: string; ambulance: string; fire: string; general: string }> = {
  SN: { police: '17', ambulance: 'SAMU 1515', fire: '18', general: '116 116' },
  FR: { police: '17', ambulance: '15', fire: '18', general: '112' },
  CI: { police: '170', ambulance: '180', fire: '180', general: '112' },
  ML: { police: '17', ambulance: '15', fire: '18', general: '112' },
  US: { police: '911', ambulance: '911', fire: '911', general: '911' },
  ES: { police: '091', ambulance: '061', fire: '080', general: '112' },
  MA: { police: '19', ambulance: '150', fire: '15', general: '112' },
  TN: { police: '197', ambulance: '190', fire: '198', general: '112' },
  BE: { police: '101', ambulance: '112', fire: '100', general: '112' },
  CH: { police: '117', ambulance: '144', fire: '118', general: '112' },
};

export default function LocalisationPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoResult, setGeoResult] = useState<{ displayName: string; country: string; countryCode: string } | null>(null);

  const [form, setForm] = useState({
    name: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    phone: '',
    contactPhone: '',
  });

  useEffect(() => {
    fetch('/api/agency/localisation')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.agency) {
          setForm({
            name: data.agency.name || '',
            address: data.agency.address || '',
            latitude: data.agency.latitude,
            longitude: data.agency.longitude,
            phone: data.agency.phone || '',
            contactPhone: data.agency.contactPhone || '',
          });
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleGeocode = async () => {
    if (!form.address.trim()) return;
    setGeocoding(true);
    setGeoResult(null);
    try {
      const res = await fetch('/api/agency/localisation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: form.address }),
      });
      const data = await res.json();
      if (data.success) {
        setForm((prev) => ({ ...prev, latitude: data.latitude, longitude: data.longitude }));
        setGeoResult({ displayName: data.displayName, country: data.country, countryCode: data.countryCode });
        toast({ title: 'Adresse géocodée', description: `${data.country} — lat ${data.latitude.toFixed(4)}, lng ${data.longitude.toFixed(4)}` });
      } else {
        toast({ title: 'Adresse introuvable', description: data.error, variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur réseau', variant: 'destructive' });
    } finally {
      setGeocoding(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/agency/localisation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Enregistré', description: 'Localisation et contacts mis à jour.' });
      } else {
        toast({ title: 'Erreur', description: data.error, variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur réseau', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#134288]" />
      </div>
    );
  }

  // Détection du pays pour numéros d'urgence
  const countryCode = geoResult?.countryCode;
  const emergency = countryCode ? EMERGENCY_NUMBERS[countryCode] : null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#134288]/10 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-[#134288]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contact & Localisation</h1>
          <p className="text-sm text-slate-500">Adresse, GPS, téléphones — utilisés sur le portail client</p>
        </div>
      </div>

      {/* ADRESSE + GÉOCODAGE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-[#134288]" /> Adresse du logement
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Ex: Route des Almadies, Dakar, Sénégal"
            className="flex-1 px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-900 outline-none focus:border-[#134288] text-sm"
          />
          <button
            onClick={handleGeocode}
            disabled={geocoding || !form.address}
            className="px-4 py-2 bg-[#134288] text-white rounded-lg text-sm font-medium hover:bg-[#0f3a6e] flex items-center gap-1.5 disabled:opacity-50"
          >
            {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Géocoder
          </button>
        </div>

        {/* Résultat géocodage */}
        {geoResult && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
            <p className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">{geoResult.country}</span> ({geoResult.countryCode})
            </p>
            <p className="text-xs text-green-700 mt-1">{geoResult.displayName}</p>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <div className="bg-white rounded px-2 py-1">
                <span className="text-slate-500">Latitude:</span> <span className="font-mono font-bold">{form.latitude?.toFixed(5)}</span>
              </div>
              <div className="bg-white rounded px-2 py-1">
                <span className="text-slate-500">Longitude:</span> <span className="font-mono font-bold">{form.longitude?.toFixed(5)}</span>
              </div>
            </div>
          </div>
        )}

        {!form.latitude && !form.longitude && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-3 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Aucune coordonnée GPS. Sans GPS, le geofencing automatique et l'onglet « Autour de moi » ne fonctionnent pas.
          </p>
        )}
      </div>

      {/* TÉLÉPHONES */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Phone className="w-4 h-4 text-[#134288]" /> Téléphones
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Téléphone principal (réception / hôte)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+221 77 123 45 67"
              className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-900 outline-none focus:border-[#134288] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Téléphone astreinte (urgence / 24/7)</label>
            <input
              type="tel"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              placeholder="+221 77 999 99 99"
              className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-900 outline-none focus:border-[#134288] text-sm"
            />
            <p className="text-[10px] text-slate-400 mt-1">Affiché dans l'onglet « Aide » du portail client + bouton WhatsApp</p>
          </div>
        </div>
      </div>

      {/* NUMÉROS URGENCE PAR PAYS */}
      {emergency && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4">
          <h2 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Numéros d'urgence locaux — {geoResult?.country}
          </h2>
          <div className="grid grid-cols-4 gap-2 text-center">
            <a href={`tel:${emergency.police}`} className="bg-white rounded-lg p-3 hover:shadow-md transition border border-red-100">
              <p className="text-2xl">👮</p>
              <p className="text-[10px] uppercase text-slate-500 mt-1">Police</p>
              <p className="text-lg font-bold text-red-700">{emergency.police}</p>
            </a>
            <a href={`tel:${emergency.ambulance}`} className="bg-white rounded-lg p-3 hover:shadow-md transition border border-red-100">
              <p className="text-2xl">🚑</p>
              <p className="text-[10px] uppercase text-slate-500 mt-1">SAMU</p>
              <p className="text-lg font-bold text-red-700">{emergency.ambulance}</p>
            </a>
            <a href={`tel:${emergency.fire}`} className="bg-white rounded-lg p-3 hover:shadow-md transition border border-red-100">
              <p className="text-2xl">🚒</p>
              <p className="text-[10px] uppercase text-slate-500 mt-1">Pompiers</p>
              <p className="text-lg font-bold text-red-700">{emergency.fire}</p>
            </a>
            <a href={`tel:${emergency.general}`} className="bg-white rounded-lg p-3 hover:shadow-md transition border border-red-100">
              <p className="text-2xl">📞</p>
              <p className="text-[10px] uppercase text-slate-500 mt-1">Général</p>
              <p className="text-lg font-bold text-red-700">{emergency.general}</p>
            </a>
          </div>
          <p className="text-[10px] text-red-600 mt-2">Ces numéros sont automatiquement affichés dans l'onglet « Aide » du portail client quand le client scanne un bracelet.</p>
        </div>
      )}

      {/* SAVE */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-[#32ba5d] hover:bg-[#2ba14f] text-black font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        Enregistrer
      </button>
    </div>
  );
}
