'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Phone, MapPin, Send, Shield, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface PersonData {
  found: boolean;
  returned?: boolean;
  person?: {
    id: string;
    personName: string;
    personType: string; // child | senior | medical | other
    birthDate: string | null;
    language: string;
    description: string | null;
    photoUrl: string | null;
    medicalInfo: string | null;
    allergies: string | null;
    bloodType: string | null;
    emergencyContacts: string | null; // JSON
  };
}

const T = {
  fr: {
    title: 'Personne retrouvée',
    subtitle: 'Merci de rester avec cette personne',
    callContacts: 'Contacts d\'urgence',
    call: 'Appeler',
    sharePosition: 'Envoyer ma position',
    positionSent: 'Position envoyée !',
    positionSentDesc: 'Les contacts ont été prévenus avec votre position.',
    shareMessage: 'Message (optionnel)',
    yourName: 'Votre nom (optionnel)',
    yourPhone: 'Votre téléphone (optionnel)',
    medicalInfo: 'Informations médicales',
    allergies: 'Allergies',
    bloodType: 'Groupe sanguin',
    description: 'Description',
    alreadyReturned: 'Cette personne a déjà été retrouvée. Merci !',
    notLinked: 'Ce bracelet n\'est pas encore activé.',
    loading: 'Chargement...',
    error: 'Erreur de chargement',
    child: 'Enfant',
    senior: 'Senior',
    medical: 'Personne médicale',
    other: 'Personne',
    years: 'ans',
    stayCalm: 'Restez calme, restez avec elle',
    emergencyCall: 'Appeler les urgences',
  },
  en: {
    title: 'Person found',
    subtitle: 'Please stay with this person',
    callContacts: 'Emergency contacts',
    call: 'Call',
    sharePosition: 'Send my location',
    positionSent: 'Location sent!',
    positionSentDesc: 'Contacts have been notified with your location.',
    shareMessage: 'Message (optional)',
    yourName: 'Your name (optional)',
    yourPhone: 'Your phone (optional)',
    medicalInfo: 'Medical information',
    allergies: 'Allergies',
    bloodType: 'Blood type',
    description: 'Description',
    alreadyReturned: 'This person has already been found. Thank you!',
    notLinked: 'This bracelet is not yet activated.',
    loading: 'Loading...',
    error: 'Loading error',
    child: 'Child',
    senior: 'Senior',
    medical: 'Medical person',
    other: 'Person',
    years: 'years old',
    stayCalm: 'Stay calm, stay with them',
    emergencyCall: 'Call emergency',
  },
  es: {
    title: 'Persona encontrada',
    subtitle: 'Por favor quédese con esta persona',
    callContacts: 'Contactos de emergencia',
    call: 'Llamar',
    sharePosition: 'Enviar mi ubicación',
    positionSent: '¡Ubicación enviada!',
    positionSentDesc: 'Los contactos han sido notificados con su ubicación.',
    shareMessage: 'Mensaje (opcional)',
    yourName: 'Su nombre (opcional)',
    yourPhone: 'Su teléfono (opcional)',
    medicalInfo: 'Información médica',
    allergies: 'Alergias',
    bloodType: 'Grupo sanguíneo',
    description: 'Descripción',
    alreadyReturned: 'Esta persona ya ha sido encontrada. ¡Gracias!',
    notLinked: 'Este brazalete aún no está activado.',
    loading: 'Cargando...',
    error: 'Error de carga',
    child: 'Niño',
    senior: 'Senior',
    medical: 'Persona médica',
    other: 'Persona',
    years: 'años',
    stayCalm: 'Mantenga la calma, quédese con ella',
    emergencyCall: 'Llamar emergencias',
  },
};

export default function PersonFoundPage() {
  const params = useParams<{ reference: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = params.reference;
  const lang = (searchParams.get('lang') || 'fr') as 'fr' | 'en' | 'es';

  const [data, setData] = useState<PersonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [finderName, setFinderName] = useState('');
  const [finderPhone, setFinderPhone] = useState('');
  const [finderMessage, setFinderMessage] = useState('');

  useEffect(() => {
    if (!reference) return;
    fetch(`/api/person-bracelet?reference=${reference}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ found: false }))
      .finally(() => setLoading(false));
  }, [reference]);

  const t = T[lang] || T.fr;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="ml-3 text-amber-700">{t.loading}</p>
      </div>
    );
  }

  if (!data?.found || !data.person) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white p-6">
        <div className="max-w-md text-center bg-white rounded-2xl shadow-lg p-8">
          <Shield className="w-16 h-16 mx-auto text-amber-500 mb-4" />
          <p className="text-lg text-gray-700">{t.notLinked}</p>
        </div>
      </div>
    );
  }

  if (data.returned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-6">
        <div className="max-w-md text-center bg-white rounded-2xl shadow-lg p-8">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <p className="text-lg text-gray-700">{t.alreadyReturned}</p>
        </div>
      </div>
    );
  }

  const person = data.person;
  const contacts = person.emergencyContacts ? (() => {
    try { return JSON.parse(person.emergencyContacts) as Array<{ name: string; phone: string; relation?: string; email?: string }>; }
    catch { return []; }
  })() : [];

  const age = person.birthDate ? Math.floor((Date.now() - new Date(person.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;

  const handleSharePosition = () => {
    setSending(true);
    if (!navigator.geolocation) {
      alert('Geolocation not available');
      setSending(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch('/api/person-bracelet/alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              personBraceletId: person.id,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              finderName, finderPhone, finderMessage,
            }),
          });
          if (res.ok) setSent(true);
        } catch (e) { console.error(e); }
        finally { setSending(false); }
      },
      (err) => {
        alert(lang === 'en' ? 'Location permission denied' : lang === 'es' ? 'Permiso de ubicación denegado' : 'Géolocalisation refusée');
        setSending(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const typeLabels: Record<string, { fr: string; en: string; es: string; emoji: string; color: string }> = {
    child: { fr: 'Enfant', en: 'Child', es: 'Niño', emoji: '👶', color: 'bg-pink-100 text-pink-700' },
    senior: { fr: 'Senior', en: 'Senior', es: 'Senior', emoji: '👴', color: 'bg-blue-100 text-blue-700' },
    medical: { fr: 'Médical', en: 'Medical', es: 'Médico', emoji: '⚕️', color: 'bg-red-100 text-red-700' },
    other: { fr: 'Personne', en: 'Person', es: 'Persona', emoji: '🧑', color: 'bg-gray-100 text-gray-700' },
  };
  const typeLabel = typeLabels[person.personType] || typeLabels.other;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white pb-12">
      {/* ─── HEADER ─── */}
      <header className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 pt-10 pb-8 text-center">
        <div className="text-5xl mb-3">{typeLabel.emoji}</div>
        <h1 className="text-3xl font-bold mb-1">{t.title}</h1>
        <p className="text-amber-50 text-base">{t.subtitle}</p>
      </header>

      <main className="max-w-xl mx-auto px-4 -mt-6 space-y-5">
        {/* ─── CARTE PERSONNE ─── */}
        <div className="bg-white rounded-3xl shadow-xl border border-amber-100 p-6">
          <div className="flex items-center gap-4 mb-4">
            {person.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={person.photoUrl} alt={person.personName} className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center text-4xl">{typeLabel.emoji}</div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{person.personName}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeLabel.color}`}>
                  {lang === 'fr' ? typeLabel.fr : lang === 'es' ? typeLabel.es : typeLabel.en}
                </span>
                {age !== null && <span className="text-sm text-gray-600">{age} {t.years}</span>}
              </div>
            </div>
          </div>

          {person.description && (
            <div className="bg-gray-50 rounded-xl p-3 mb-3">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{t.description}</p>
              <p className="text-sm text-gray-800">{person.description}</p>
            </div>
          )}

          {/* Infos médicales (important pour les secours) */}
          {(person.medicalInfo || person.allergies || person.bloodType) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-sm font-bold text-red-700">{t.medicalInfo}</p>
              </div>
              {person.medicalInfo && <p className="text-sm text-red-800 mb-1">📋 {person.medicalInfo}</p>}
              {person.allergies && <p className="text-sm text-red-800 mb-1">⚠️ {t.allergies}: {person.allergies}</p>}
              {person.bloodType && <p className="text-sm text-red-800">🩸 {t.bloodType}: {person.bloodType}</p>}
            </div>
          )}

          <div className="bg-amber-50 rounded-xl p-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">{t.stayCalm}</p>
          </div>
        </div>

        {/* ─── CONTACTS URGENCE ─── */}
        {contacts.length > 0 && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-amber-600" />
              {t.callContacts}
            </h3>
            <div className="space-y-3">
              {contacts.map((c, i) => (
                <a
                  key={i}
                  href={`tel:${c.phone.replace(/[\s\-().]/g, '')}`}
                  className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-100 hover:border-amber-300 hover:bg-amber-50 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    {c.relation && <p className="text-xs text-gray-500">{c.relation}</p>}
                    <p className="text-sm text-gray-700">{c.phone}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ─── PARTAGE POSITION ─── */}
        {!sent ? (
          <div className="bg-white rounded-3xl shadow-lg border border-amber-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-600" />
              {t.sharePosition}
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder={t.yourName}
                value={finderName}
                onChange={(e) => setFinderName(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:border-amber-400"
              />
              <input
                type="tel"
                placeholder={t.yourPhone}
                value={finderPhone}
                onChange={(e) => setFinderPhone(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:border-amber-400"
              />
              <textarea
                placeholder={t.shareMessage}
                value={finderMessage}
                onChange={(e) => setFinderMessage(e.target.value)}
                rows={2}
                className="w-full p-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:border-amber-400 resize-none"
              />
              <button
                onClick={handleSharePosition}
                disabled={sending}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 hover:shadow-lg transition-all"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {t.sharePosition}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg border border-green-100 p-8 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <p className="text-xl font-bold text-gray-900 mb-2">{t.positionSent}</p>
            <p className="text-sm text-gray-600">{t.positionSentDesc}</p>
          </div>
        )}
      </main>
    </div>
  );
}
