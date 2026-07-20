'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Save,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Plane,
  Train,
  Ship,
  Bus,
  Camera,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import CountryRegionSelect from '@/components/inscrire/CountryRegionSelect';
import PhoneInput from '@/components/ui/PhoneInput';
import type { TransportMode } from '@/lib/transport';

// ─── Brand constants (QRTags palette) ───
const BRAND = '#111111';
const ACCENT = '#E3B23C';
const INK = '#1a1a1a';

interface BaggageData {
  reference: string;
  travelerFirstName: string | null;
  travelerLastName: string | null;
  whatsappOwner: string | null;
  airlineName: string | null;
  flightNumber: string | null;
  trainCompany: string | null;
  trainNumber: string | null;
  shipName: string | null;
  shipCabin: string | null;
  busCompany: string | null;
  busLineNumber: string | null;
  destination: string | null;
  departureDate: Date | null;
  departureTime: string | null;
  transportMode: string;
  hasPin: boolean;
}

export default function EditBaggagePage() {
  const params = useParams();
  const router = useRouter();
  const reference = params.reference as string;
  const { t, lang, dir, countryCode } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [baggage, setBaggage] = useState<BaggageData | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // PIN auth state
  const [pinAuthed, setPinAuthed] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    travelerFirstName: '',
    travelerLastName: '',
    whatsappOwner: '',
    airlineName: '',
    flightNumber: '',
    trainCompany: '',
    trainNumber: '',
    shipName: '',
    shipCabin: '',
    busCompany: '',
    busLineNumber: '',
    destination: '',
    departureDate: '',
    departureTime: '',
    transportMode: 'flight' as TransportMode,
  });
  const [phoneCountry, setPhoneCountry] = useState(countryCode);

  // Change PIN state
  const [showChangePin, setShowChangePin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');

  // ─── LABS — Feature D: Signalement de dommage state ───
  const [damageReports, setDamageReports] = useState<{
    hasBefore: boolean;
    hasAfter: boolean;
    reports: Array<{
      id: string;
      type: string;
      photos: string[];
      description: string | null;
      createdAt: string;
    }>;
  }>({ hasBefore: false, hasAfter: false, reports: [] });
  const [damagePhotos, setDamagePhotos] = useState<string[]>([]); // base64 preview
  const [damageType, setDamageType] = useState<'before' | 'after'>('before');
  const [damageDescription, setDamageDescription] = useState('');
  const [damageLoading, setDamageLoading] = useState(false);
  const [damageError, setDamageError] = useState('');
  const [damageSuccess, setDamageSuccess] = useState('');

  // Fetch existing damage reports
  useEffect(() => {
    if (!reference) return;
    fetch(`/api/baggage/${reference}/damage`)
      .then((r) => r.json())
      .then((d) => {
        if (d.reports) setDamageReports(d);
      })
      .catch(() => {});
  }, [reference]);

  // Handle photo file selection → convert to base64
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos: string[] = [];
    const maxPhotos = 3;

    Array.from(files).slice(0, maxPhotos - damagePhotos.length).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        newPhotos.push(reader.result as string);
        if (newPhotos.length === Math.min(files.length, maxPhotos - damagePhotos.length)) {
          setDamagePhotos([...damagePhotos, ...newPhotos]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove a photo from the preview
  const handleRemovePhoto = (idx: number) => {
    setDamagePhotos(damagePhotos.filter((_, i) => i !== idx));
  };

  // Save damage report
  const handleSaveDamage = async () => {
    if (!pinInput || pinInput.length < 4) {
      setDamageError('Veuillez saisir votre PIN dans le champ "Confirmer avec votre PIN" ci-dessus.');
      return;
    }
    if (damagePhotos.length === 0) {
      setDamageError('Veuillez ajouter au moins une photo.');
      return;
    }
    setDamageLoading(true);
    setDamageError('');
    setDamageSuccess('');
    try {
      const res = await fetch(`/api/baggage/${reference}/damage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pinInput,
          type: damageType,
          description: damageDescription,
          photos: damagePhotos,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDamageSuccess(data.message || 'Rapport enregistré.');
        setDamagePhotos([]);
        setDamageDescription('');
        // Refresh reports
        const refreshRes = await fetch(`/api/baggage/${reference}/damage`);
        const refreshData = await refreshRes.json();
        if (refreshData.reports) setDamageReports(refreshData);
      } else {
        setDamageError(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch {
      setDamageError('Erreur réseau');
    } finally {
      setDamageLoading(false);
    }
  };

  // Fetch baggage data
  useEffect(() => {
    fetch(`/api/baggage/${reference}/update`)
      .then(r => r.json())
      .then(data => {
        if (data.baggage) {
          setBaggage(data.baggage);
          setFormData({
            travelerFirstName: data.baggage.travelerFirstName || '',
            travelerLastName: data.baggage.travelerLastName || '',
            whatsappOwner: data.baggage.whatsappOwner || '',
            airlineName: data.baggage.airlineName || '',
            flightNumber: data.baggage.flightNumber || '',
            trainCompany: data.baggage.trainCompany || '',
            trainNumber: data.baggage.trainNumber || '',
            shipName: data.baggage.shipName || '',
            shipCabin: data.baggage.shipCabin || '',
            busCompany: data.baggage.busCompany || '',
            busLineNumber: data.baggage.busLineNumber || '',
            destination: data.baggage.destination || '',
            departureDate: data.baggage.departureDate
              ? new Date(data.baggage.departureDate).toISOString().split('T')[0]
              : '',
            departureTime: data.baggage.departureTime || '',
            transportMode: (data.baggage.transportMode || 'flight') as TransportMode,
          });
        } else {
          setError(data.error || 'Bagage introuvable');
        }
      })
      .catch(() => setError('Erreur réseau'))
      .finally(() => setLoading(false));
  }, [reference]);

  // PIN auth handler
  const handlePinAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput || pinInput.length < 4) {
      setPinError('Veuillez saisir votre PIN (4 chiffres).');
      return;
    }
    setPinLoading(true);
    setPinError('');
    try {
      // Test PIN via a no-op update (juste pin, rien d'autre)
      const res = await fetch(`/api/baggage/${reference}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setPinAuthed(true);
        setPinInput('');
      } else if (res.status === 400 && data.error?.includes('Aucun champ')) {
        // Le PIN est valide mais rien à updater → auth OK
        setPinAuthed(true);
        setPinInput('');
      } else {
        setPinError(data.error || 'PIN incorrect');
      }
    } catch {
      setPinError('Erreur réseau');
    } finally {
      setPinLoading(false);
    }
  };

  // Save profile
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!pinAuthed) {
      setError('Veuillez saisir votre PIN d\'abord.');
      return;
    }

    // Refetch PIN input pour re-valider
    if (!pinInput) {
      // Pour la sauvegarde, on demande le PIN à nouveau si pas saisi
      setError('Veuillez saisir votre PIN pour confirmer les modifications.');
      return;
    }

    setPinLoading(true);
    try {
      const payload: Record<string, unknown> = {
        pin: pinInput,
        travelerFirstName: formData.travelerFirstName,
        travelerLastName: formData.travelerLastName,
        whatsappOwner: formData.whatsappOwner,
        destination: formData.destination,
        departureDate: formData.departureDate || undefined,
        departureTime: formData.departureTime || undefined,
        transportMode: formData.transportMode,
        // Champs conditionnels selon transportMode
        airlineName: formData.transportMode === 'flight' ? formData.airlineName : undefined,
        flightNumber: formData.transportMode === 'flight' ? formData.flightNumber : undefined,
        trainCompany: formData.transportMode === 'train' ? formData.trainCompany : undefined,
        trainNumber: formData.transportMode === 'train' ? formData.trainNumber : undefined,
        shipName: formData.transportMode === 'boat' ? formData.shipName : undefined,
        shipCabin: formData.transportMode === 'boat' ? formData.shipCabin : undefined,
        busCompany: formData.transportMode === 'bus' ? formData.busCompany : undefined,
        busLineNumber: formData.transportMode === 'bus' ? formData.busLineNumber : undefined,
      };

      // Si l'utilisateur veut changer le PIN
      if (showChangePin && newPin && newPin === newPinConfirm) {
        payload.newPin = newPin;
      }

      const res = await fetch(`/api/baggage/${reference}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Profil mis à jour avec succès.');
        setNewPin('');
        setNewPinConfirm('');
        setShowChangePin(false);
        // Si nouveau PIN défini, on doit re-saisir le nouveau pour les prochaines modifs
        if (payload.newPin) {
          setPinInput(payload.newPin as string);
        }
      } else {
        setError(data.error || 'Erreur lors de la mise à jour');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setPinLoading(false);
    }
  };

  // ─── Loading state ───
  if (loading) {
    return (
      <main className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white/20 border-t-[#E3B23C] rounded-full mx-auto mb-4" />
          <p className="text-lg text-white">Chargement...</p>
        </div>
      </main>
    );
  }

  // ─── Error state ───
  if (error && !baggage) {
    return (
      <main className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2" style={{ color: INK }}>Erreur</h1>
          <p className="mb-6" style={{ color: INK, opacity: 0.7 }}>{error}</p>
          <Link
            href={`/suivi/${reference}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white"
            style={{ backgroundColor: BRAND }}
          >
            ← Retour au suivi
          </Link>
        </div>
      </main>
    );
  }

  // ─── PIN auth gate ───
  if (!pinAuthed) {
    return (
      <main className="min-h-screen bg-[#111111] flex items-center justify-center p-4" dir={dir}>
        <div className="max-w-md w-full">
          <div className="bg-[#E3B23C] border-2 border-dashed border-[#1a1a1a] rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#1a1a1a]">
                <KeyRound className="w-8 h-8" style={{ color: INK }} />
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: INK }}>
                🔐 Authentification PIN
              </h1>
              <p className="text-sm" style={{ color: INK, opacity: 0.7 }}>
                Pour modifier votre profil de voyage, saisissez votre code PIN propriétaire.
              </p>
            </div>

            <form onSubmit={handlePinAuth} className="space-y-4">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-3xl tracking-[0.5em] bg-white border-2 border-[#1a1a1a] rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#111111]"
                style={{ color: INK }}
                autoFocus
              />
              {pinError && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{pinError}</p>
              )}
              <button
                type="submit"
                disabled={pinLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-white disabled:opacity-50 transition-colors"
                style={{ backgroundColor: BRAND }}
              >
                {pinLoading ? 'Vérification...' : 'Déverrouiller l\'édition'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t-2 border-dashed border-[#1a1a1a]/30 text-center">
              <p className="text-xs" style={{ color: INK, opacity: 0.6 }}>
                PIN oublié ? Contactez le support QRTags.
              </p>
              <Link
                href={`/suivi/${reference}`}
                className="inline-flex items-center gap-1 mt-3 text-sm font-medium"
                style={{ color: BRAND }}
              >
                <ArrowLeft className="w-4 h-4" />
                Retour au suivi
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ─── Main edit form ───
  const transportOptions = [
    { value: 'flight', label: 'Avion', icon: Plane },
    { value: 'train', label: 'Train', icon: Train },
    { value: 'boat', label: 'Bateau', icon: Ship },
    { value: 'bus', label: 'Bus', icon: Bus },
  ] as const;

  return (
    <main className="min-h-screen bg-[#111111] flex flex-col px-4 sm:px-5 md:px-8 pb-8" dir={dir}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#111111] border-b border-[#E3B23C]/30 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link
            href={`/suivi/${reference}`}
            className="flex items-center gap-1 text-white hover:text-[#E3B23C] transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au suivi
          </Link>
          <h1 className="text-sm font-bold text-white">Modifier mon profil</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-md mx-auto w-full py-6 space-y-4">
        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Reference (read-only) */}
          <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
            <p className="text-xs text-[#1a1a1a]/60 font-medium mb-1">Référence QR</p>
            <p className="text-lg font-mono font-bold" style={{ color: INK }}>{reference}</p>
          </div>

          {/* Transport mode selector */}
          <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
            <p className="text-sm font-medium mb-3" style={{ color: INK }}>Mode de transport</p>
            <div className="grid grid-cols-4 gap-2">
              {transportOptions.map(opt => {
                const Icon = opt.icon;
                const selected = formData.transportMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, transportMode: opt.value })}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${
                      selected
                        ? 'border-[#1a1a1a] bg-[#E3B23C]'
                        : 'border-[#1a1a1a]/30 bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" style={{ color: INK }} />
                    <span className="text-xs font-bold" style={{ color: INK }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name fields */}
          <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
            <p className="text-sm font-medium mb-3" style={{ color: INK }}>Identité du voyageur</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Prénom"
                value={formData.travelerFirstName}
                onChange={(e) => setFormData({ ...formData, travelerFirstName: e.target.value })}
                className="bg-slate-50 border-2 border-[#1a1a1a] rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#111111]"
                style={{ color: INK }}
              />
              <input
                type="text"
                placeholder="Nom"
                value={formData.travelerLastName}
                onChange={(e) => setFormData({ ...formData, travelerLastName: e.target.value })}
                className="bg-slate-50 border-2 border-[#1a1a1a] rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#111111]"
                style={{ color: INK }}
              />
            </div>
          </div>

          {/* Transport-specific fields */}
          <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
            <p className="text-sm font-medium mb-3" style={{ color: INK }}>
              Informations {formData.transportMode === 'flight' ? 'vol' : formData.transportMode === 'train' ? 'train' : formData.transportMode === 'boat' ? 'navire' : 'bus'}
            </p>
            <div className="space-y-3">
              {formData.transportMode === 'flight' && (
                <>
                  <input
                    type="text"
                    placeholder="Compagnie aérienne (ex: Air France)"
                    value={formData.airlineName}
                    onChange={(e) => setFormData({ ...formData, airlineName: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-[#1a1a1a] rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#111111]"
                    style={{ color: INK }}
                  />
                  <input
                    type="text"
                    placeholder="Numéro de vol (ex: AF1234)"
                    value={formData.flightNumber}
                    onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-[#1a1a1a] rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#111111]"
                    style={{ color: INK }}
                  />
                </>
              )}
              {formData.transportMode === 'train' && (
                <>
                  <input
                    type="text"
                    placeholder="Compagnie (ex: SNCF)"
                    value={formData.trainCompany}
                    onChange={(e) => setFormData({ ...formData, trainCompany: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-[#1a1a1a] rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#111111]"
                    style={{ color: INK }}
                  />
                  <input
                    type="text"
                    placeholder="Numéro de train (ex: TGV 6123)"
                    value={formData.trainNumber}
                    onChange={(e) => setFormData({ ...formData, trainNumber: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-[#1a1a1a] rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#111111]"
                    style={{ color: INK }}
                  />
                </>
              )}
              {formData.transportMode === 'boat' && (
                <>
                  <input
                    type="text"
                    placeholder="Nom du navire (ex: MSC Fantasia)"
                    value={formData.shipName}
                    onChange={(e) => setFormData({ ...formData, shipName: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-[#1a1a1a] rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#111111]"
                    style={{ color: INK }}
                  />
                  <input
                    type="text"
                    placeholder="Cabine (ex: Pont 4, Cabine 312)"
                    value={formData.shipCabin}
                    onChange={(e) => setFormData({ ...formData, shipCabin: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-[#1a1a1a] rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#111111]"
                    style={{ color: INK }}
                  />
                </>
              )}
              {formData.transportMode === 'bus' && (
                <>
                  <input
                    type="text"
                    placeholder="Compagnie (ex: CTM)"
                    value={formData.busCompany}
                    onChange={(e) => setFormData({ ...formData, busCompany: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-[#1a1a1a] rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#111111]"
                    style={{ color: INK }}
                  />
                  <input
                    type="text"
                    placeholder="Ligne (ex: Casablanca → Marrakech)"
                    value={formData.busLineNumber}
                    onChange={(e) => setFormData({ ...formData, busLineNumber: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-[#1a1a1a] rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#111111]"
                    style={{ color: INK }}
                  />
                </>
              )}
            </div>
          </div>

          {/* Destination */}
          <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
            <p className="text-sm font-medium mb-3" style={{ color: INK }}>Destination</p>
            <CountryRegionSelect
              value={formData.destination}
              onChange={(v) => setFormData({ ...formData, destination: v })}
              placeholder="Sélectionnez votre destination"
            />
          </div>

          {/* Departure date/time */}
          <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
            <p className="text-sm font-medium mb-3" style={{ color: INK }}>Date et heure de départ</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={formData.departureDate}
                onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                className="bg-slate-50 border-2 border-[#1a1a1a] rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#111111]"
                style={{ color: INK }}
              />
              <input
                type="time"
                value={formData.departureTime}
                onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                className="bg-slate-50 border-2 border-[#1a1a1a] rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#111111]"
                style={{ color: INK }}
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
            <p className="text-sm font-medium mb-3" style={{ color: INK }}>Numéro WhatsApp</p>
            <PhoneInput
              countryCode={phoneCountry}
              onCountryChange={setPhoneCountry}
              value={formData.whatsappOwner}
              onChange={(v) => setFormData({ ...formData, whatsappOwner: v })}
              placeholder="6 12 34 56 78"
            />
          </div>

          {/* PIN confirmation to save */}
          <div className="bg-[#E3B23C] border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
            <p className="text-sm font-bold mb-2" style={{ color: INK }}>
              🔐 Confirmer avec votre PIN
            </p>
            <p className="text-xs mb-3" style={{ color: INK, opacity: 0.7 }}>
              Saisissez votre PIN pour valider les modifications.
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-2xl tracking-[0.5em] bg-white border-2 border-[#1a1a1a] rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#111111]"
              style={{ color: INK }}
            />
          </div>

          {/* Change PIN section (optional) */}
          <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
            <button
              type="button"
              onClick={() => setShowChangePin(!showChangePin)}
              className="w-full flex items-center justify-between text-sm font-medium"
              style={{ color: INK }}
            >
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Changer mon PIN {showChangePin ? '▲' : '▼'}
              </span>
            </button>
            {showChangePin && (
              <div className="mt-3 space-y-2">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Nouveau PIN (4 chiffres)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border-2 border-[#1a1a1a] rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#111111]"
                  style={{ color: INK }}
                />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Confirmer nouveau PIN"
                  value={newPinConfirm}
                  onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border-2 border-[#1a1a1a] rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#111111]"
                  style={{ color: INK }}
                />
                {newPin && newPinConfirm && newPin !== newPinConfirm && (
                  <p className="text-xs text-red-600">Les PIN ne correspondent pas.</p>
                )}
              </div>
            )}
          </div>

          {/* Save button */}
          <button
            type="submit"
            disabled={pinLoading || !pinInput}
            className="w-full flex items-center justify-center gap-2 bg-[#111111] hover:bg-[#0033a8] text-white py-4 px-4 rounded-xl font-bold transition-colors text-base min-h-[56px] disabled:opacity-50"
          >
            {pinLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Enregistrer les modifications
              </>
            )}
          </button>
        </form>

        {/* ═══ LABS — Feature D: Documentation de l'état du bagage ═══ */}
        <div className="bg-[#E3B23C] border-2 border-dashed border-[#1a1a1a] rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-1" style={{ color: INK }}>
            📸 Protégez votre bagage en cas de casse
          </h2>
          <p className="text-sm mb-4" style={{ color: INK, opacity: 0.7 }}>
            Photos horodatées = preuve irréfutable pour votre assurance et la compagnie aérienne.
          </p>

          {/* ─── Explication visuelle "Pourquoi ?" ─── */}
          <div className="bg-white/80 border border-[#1a1a1a]/20 rounded-xl p-4 mb-4">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: INK }}>
              💡 Pourquoi c&apos;est important ?
            </p>
            <div className="space-y-3 text-sm" style={{ color: INK }}>
              {/* Scénario 1 : sans photos */}
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">❌</span>
                <div>
                  <p className="font-bold">Sans photos : vous ne pouvez rien prouver</p>
                  <p className="opacity-70 text-xs mt-0.5">
                    Compagnie : &quot;Votre valise était peut-être déjà abîmée&quot; → 0€ de dédommagement
                  </p>
                </div>
              </div>
              {/* Scénario 2 : avec photos */}
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">✅</span>
                <div>
                  <p className="font-bold">Avec photos : preuve horodatée impossible à contester</p>
                  <p className="opacity-70 text-xs mt-0.5">
                    Photo AVANT (valise neuve) + Photo APRÈS (valise cassée) = dédommagement garanti
                  </p>
                </div>
              </div>
            </div>

            {/* Mini timeline visuelle */}
            <div className="mt-4 flex items-center gap-2 text-xs">
              <div className="flex-1 bg-green-100 border border-green-300 rounded-lg p-2 text-center">
                <p className="font-bold text-green-700">📷 AVANT</p>
                <p className="text-green-600 text-[10px]">Photo de la valise en bon état</p>
              </div>
              <Plane className="w-4 h-4 flex-shrink-0" style={{ color: INK }} />
              <div className="flex-1 bg-red-100 border border-red-300 rounded-lg p-2 text-center">
                <p className="font-bold text-red-700">📷 APRÈS</p>
                <p className="text-red-600 text-[10px]">Photo des dégâts éventuels</p>
              </div>
              <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: INK }} />
              <div className="flex-1 bg-blue-100 border border-blue-300 rounded-lg p-2 text-center">
                <p className="font-bold text-blue-700">💰</p>
                <p className="text-blue-600 text-[10px]">Dédommagement</p>
              </div>
            </div>
          </div>

          {/* Existing reports summary */}
          <div className="flex gap-2 mb-4">
            <div className={`flex-1 rounded-xl p-2 text-center text-xs font-bold ${damageReports.hasBefore ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-white/50 text-[#1a1a1a]/50'}`}>
              {damageReports.hasBefore ? '✅' : '⬜'} Avant voyage
            </div>
            <div className={`flex-1 rounded-xl p-2 text-center text-xs font-bold ${damageReports.hasAfter ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-white/50 text-[#1a1a1a]/50'}`}>
              {damageReports.hasAfter ? '✅' : '⬜'} Après voyage
            </div>
          </div>

          {/* Show existing reports */}
          {damageReports.reports.map((r) => (
            <div key={r.id} className="bg-white/70 border border-[#1a1a1a]/20 rounded-xl p-3 mb-3">
              <p className="text-xs font-bold mb-2" style={{ color: INK }}>
                {r.type === 'before' ? '📦 Avant voyage' : '📦 Après voyage'} — {new Date(r.createdAt).toLocaleDateString('fr-FR')}
              </p>
              <div className="flex gap-2 overflow-x-auto">
                {r.photos.map((p, i) => (
                  <img key={i} src={p} alt={`Photo ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-[#1a1a1a]/20" />
                ))}
              </div>
              {r.description && (
                <p className="text-xs mt-2" style={{ color: INK, opacity: 0.7 }}>{r.description}</p>
              )}
            </div>
          ))}

          {/* Type selector */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => { setDamageType('before'); setDamagePhotos([]); setDamageError(''); setDamageSuccess(''); }}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold border-2 transition-colors ${
                damageType === 'before' ? 'bg-[#1a1a1a] text-[#E3B23C] border-[#1a1a1a]' : 'bg-white/50 text-[#1a1a1a] border-[#1a1a1a]/30'
              }`}
            >
              📦 Avant voyage
            </button>
            <button
              type="button"
              onClick={() => { setDamageType('after'); setDamagePhotos([]); setDamageError(''); setDamageSuccess(''); }}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold border-2 transition-colors ${
                damageType === 'after' ? 'bg-[#1a1a1a] text-[#E3B23C] border-[#1a1a1a]' : 'bg-white/50 text-[#1a1a1a] border-[#1a1a1a]/30'
              }`}
            >
              📦 Après voyage
            </button>
          </div>

          {/* Photo upload */}
          <div className="mb-3">
            <label className="block text-xs font-bold mb-2" style={{ color: INK }}>
              Photos (1-3, max 10 MB chacune)
            </label>
            <div className="flex gap-2 flex-wrap">
              {damagePhotos.map((photo, idx) => (
                <div key={idx} className="relative w-24 h-24">
                  <img src={photo} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover rounded-lg border-2 border-[#1a1a1a]" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {damagePhotos.length < 3 && (
                <label className="w-24 h-24 border-2 border-dashed border-[#1a1a1a]/40 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#1a1a1a]/5">
                  <Camera className="w-6 h-6 text-[#1a1a1a]/50" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="block text-xs font-bold mb-1" style={{ color: INK }}>
              Description (optionnel)
            </label>
            <textarea
              placeholder={damageType === 'before' ? 'ex: Bagage en bon état, pas de rayures...' : 'ex: Poignée cassée, rayure sur le côté gauche...'}
              value={damageDescription}
              onChange={(e) => setDamageDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              className="w-full bg-white border-2 border-[#1a1a1a] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#111111]"
              style={{ color: INK }}
            />
          </div>

          {damageError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 mb-3">{damageError}</p>
          )}
          {damageSuccess && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2 mb-3">{damageSuccess}</p>
          )}

          <button
            type="button"
            onClick={handleSaveDamage}
            disabled={damageLoading || damagePhotos.length === 0 || !pinInput}
            className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-black text-[#E3B23C] py-2.5 px-4 rounded-xl font-bold transition-colors text-sm min-h-[44px] disabled:opacity-50"
          >
            {damageLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                Enregistrer {damageType === 'before' ? 'le pre-contrôle' : 'le post-contrôle'}
              </>
            )}
          </button>
          {!pinInput && (
            <p className="text-xs text-amber-700 mt-2 text-center">
              ⚠️ Saisissez votre PIN dans le champ ci-dessus pour activer l&apos;enregistrement.
            </p>
          )}
        </div>

        {/* Back to tracking */}
        <Link
          href={`/suivi/${reference}`}
          className="block w-full text-center py-3 px-4 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors"
        >
          ← Retour au suivi
        </Link>
      </div>
    </main>
  );
}
