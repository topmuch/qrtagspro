'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Phone, AlertTriangle, Shield, X, Loader2 } from 'lucide-react';

interface PersonBracelet {
  id: string;
  personName: string;
  personType: string;
  birthDate: string | null;
  language: string;
  description: string | null;
  photoUrl: string | null;
  medicalInfo: string | null;
  allergies: string | null;
  bloodType: string | null;
  emergencyContacts: string | null;
  status: string;
  lastSeenAt: string | null;
  lastSeenLocation: string | null;
  baggage?: { reference: string } | null;
}

const TYPE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  child: { label: 'Enfant', emoji: '👶', color: 'bg-pink-100 text-pink-700' },
  senior: { label: 'Senior', emoji: '👴', color: 'bg-blue-100 text-blue-700' },
  medical: { label: 'Médical', emoji: '⚕️', color: 'bg-red-100 text-red-700' },
  other: { label: 'Personne', emoji: '🧑', color: 'bg-gray-100 text-gray-700' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Actif', color: 'bg-green-100 text-green-700' },
  lost: { label: 'Perdu', color: 'bg-red-100 text-red-700' },
  found: { label: 'Retrouvé', color: 'bg-amber-100 text-amber-700' },
  returned: { label: 'Restitué', color: 'bg-gray-100 text-gray-700' },
};

export default function PersonnesPage() {
  const [personnes, setPersonnes] = useState<PersonBracelet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [baggageRef, setBaggageRef] = useState('');
  const [personName, setPersonName] = useState('');
  const [personType, setPersonType] = useState('child');
  const [birthDate, setBirthDate] = useState('');
  const [language, setLanguage] = useState('fr');
  const [description, setDescription] = useState('');
  const [medicalInfo, setMedicalInfo] = useState('');
  const [allergies, setAllergies] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [contacts, setContacts] = useState([{ name: '', phone: '', relation: '', email: '' }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPersonnes();
  }, []);

  const loadPersonnes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/person-bracelet?agencyView=1');
      const data = await res.json();
      if (data.success) setPersonnes(data.personnes);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setBaggageRef(''); setPersonName(''); setPersonType('child');
    setBirthDate(''); setLanguage('fr'); setDescription('');
    setMedicalInfo(''); setAllergies(''); setBloodType('');
    setContacts([{ name: '', phone: '', relation: '', email: '' }]);
    setEditingId(null);
  };

  const handleEdit = (p: PersonBracelet) => {
    setEditingId(p.id);
    setBaggageRef(p.baggage?.reference || '');
    setPersonName(p.personName);
    setPersonType(p.personType);
    setBirthDate(p.birthDate ? new Date(p.birthDate).toISOString().split('T')[0] : '');
    setLanguage(p.language);
    setDescription(p.description || '');
    setMedicalInfo(p.medicalInfo || '');
    setAllergies(p.allergies || '');
    setBloodType(p.bloodType || '');
    try {
      const parsed = p.emergencyContacts ? JSON.parse(p.emergencyContacts) : [];
      setContacts(parsed.length > 0 ? parsed : [{ name: '', phone: '', relation: '', email: '' }]);
    } catch { setContacts([{ name: '', phone: '', relation: '', email: '' }]); }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!personName) { alert('Nom requis'); return; }
    setSaving(true);
    try {
      // Si on a editingId, on PATCH. Sinon POST.
      const method = editingId ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = {
        baggageId: editingId ? undefined : (baggageRef || undefined), // pour POST
        id: editingId || undefined,
        personName, personType, birthDate, language, description,
        medicalInfo, allergies, bloodType,
        emergencyContacts: contacts.filter((c) => c.name || c.phone),
      };
      const res = await fetch('/api/person-bracelet', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        resetForm();
        loadPersonnes();
      } else {
        alert(data.error || 'Erreur');
      }
    } catch (e) { console.error(e); alert('Erreur réseau'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch('/api/person-bracelet', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    loadPersonnes();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bracelets Personnes</h1>
          <p className="text-sm text-gray-500">Sécurité enfant / senior / médical — alerte position par email</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau bracelet
        </button>
      </div>

      {/* LISTE */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
        </div>
      ) : personnes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Shield className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600">Aucun bracelet personne configuré.</p>
          <p className="text-sm text-gray-400 mt-1">Créez-en un pour lier un QR à un profil (enfant, senior, personne médicale).</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {personnes.map((p) => {
            const typeMeta = TYPE_LABELS[p.personType] || TYPE_LABELS.other;
            const statusMeta = STATUS_LABELS[p.status] || STATUS_LABELS.active;
            const contactsList = p.emergencyContacts ? (() => { try { return JSON.parse(p.emergencyContacts); } catch { return []; } })() : [];
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl shrink-0">
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrl} alt={p.personName} className="w-12 h-12 rounded-xl object-cover" />
                    ) : typeMeta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{p.personName}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeMeta.color}`}>{typeMeta.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusMeta.color}`}>{statusMeta.label}</span>
                    </div>
                  </div>
                </div>

                {p.baggage?.reference && (
                  <p className="text-xs text-gray-500 mb-2">QR: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{p.baggage.reference}</code></p>
                )}

                {p.medicalInfo && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
                    <p className="text-xs text-red-700">📋 {p.medicalInfo}</p>
                  </div>
                )}

                {contactsList.length > 0 && (
                  <div className="text-xs text-gray-600 mb-3">
                    <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {contactsList[0].name} — {contactsList[0].phone}</p>
                    {contactsList.length > 1 && <p className="text-gray-400">+{contactsList.length - 1} autre(s)</p>}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(p)}
                    className="flex-1 py-2 px-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 font-medium"
                  >
                    Modifier
                  </button>
                  {p.status === 'found' && (
                    <button
                      onClick={() => handleStatusChange(p.id, 'active')}
                      className="flex-1 py-2 px-3 text-sm bg-green-50 hover:bg-green-100 rounded-lg text-green-700 font-medium"
                    >
                      Réinitialiser
                    </button>
                  )}
                  {p.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(p.id, 'lost')}
                      className="flex-1 py-2 px-3 text-sm bg-red-50 hover:bg-red-100 rounded-lg text-red-700 font-medium"
                    >
                      Signaler perdu
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL FORM */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Modifier le bracelet' : 'Nouveau bracelet personne'}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Référence QR (bracelet)</label>
                  <input
                    type="text"
                    placeholder="QRT26-XXXX"
                    value={baggageRef}
                    onChange={(e) => setBaggageRef(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">Code imprimé sur le bracelet QR</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                  <input
                    type="text"
                    placeholder="Lucas Dupont"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={personType}
                    onChange={(e) => setPersonType(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400"
                  >
                    <option value="child">Enfant</option>
                    <option value="senior">Senior</option>
                    <option value="medical">Personne médicale</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Langue préférée</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description physique</label>
                <textarea
                  placeholder="Garçon, 6 ans, cheveux bruns, lunettes, t-shirt rouge..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* INFOS MÉDICALES */}
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <p className="text-sm font-semibold text-red-700">Informations médicales (optionnel)</p>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Asthmatique — ventoline dans sac"
                    value={medicalInfo}
                    onChange={(e) => setMedicalInfo(e.target.value)}
                    className="w-full p-2.5 border border-red-200 rounded-lg text-sm focus:outline-none focus:border-red-400"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Allergies: arachide, pénicilline"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      className="p-2.5 border border-red-200 rounded-lg text-sm focus:outline-none focus:border-red-400"
                    />
                    <input
                      type="text"
                      placeholder="Groupe sanguin: A+"
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      className="p-2.5 border border-red-200 rounded-lg text-sm focus:outline-none focus:border-red-400"
                    />
                  </div>
                </div>
              </div>

              {/* CONTACTS URGENCE */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Contacts d'urgence</label>
                  <button
                    onClick={() => setContacts([...contacts, { name: '', phone: '', relation: '', email: '' }])}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    + Ajouter
                  </button>
                </div>
                <div className="space-y-2">
                  {contacts.map((c, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input
                        type="text"
                        placeholder="Nom"
                        value={c.name}
                        onChange={(e) => {
                          const next = [...contacts];
                          next[i].name = e.target.value;
                          setContacts(next);
                        }}
                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                      />
                      <input
                        type="tel"
                        placeholder="Téléphone"
                        value={c.phone}
                        onChange={(e) => {
                          const next = [...contacts];
                          next[i].phone = e.target.value;
                          setContacts(next);
                        }}
                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                      />
                      <input
                        type="email"
                        placeholder="Email (pour alerte)"
                        value={c.email}
                        onChange={(e) => {
                          const next = [...contacts];
                          next[i].email = e.target.value;
                          setContacts(next);
                        }}
                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                      />
                      {contacts.length > 1 && (
                        <button
                          onClick={() => setContacts(contacts.filter((_, idx) => idx !== i))}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Un email sera envoyé à ces contacts quand le bracelet sera scanné avec partage de position.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3 rounded-b-3xl">
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !personName}
                className="px-6 py-2 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 disabled:opacity-60 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'Mettre à jour' : 'Créer le bracelet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
