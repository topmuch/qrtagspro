'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Globe,
  AlertCircle,
  Camera,
  Gift,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';
import { OBJECT_CATEGORIES, getObjectCategory } from '@/lib/agency-types';
import { useTranslation } from '@/hooks/useTranslation';
import { Language, LANGUAGE_NAMES } from '@/lib/i18n';

// ─── Design tokens QRTags ────────────────────────────────────────────
const QRTAGS_BG       = '#E3B23C';   // fond de page jaune moutarde
const QRTAGS_CARD     = '#FFFFFF';   // cartes blanches
const QRTAGS_INK      = '#111111';   // texte noir
const QRTAGS_INPUT_BG = '#F9FAFB';   // gris très clair pour inputs
const QRTAGS_PLACE    = '#9CA3AF';   // placeholder gris moyen
const QRTAGS_RED      = '#DC2626';   // messages d'alerte

// Classes Tailwind réutilisables (style "cartes blanches sur jaune")
const INPUT_CLASS =
  'w-full px-4 py-3 border-2 border-black rounded-lg bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:border-[#E3B23C] focus:ring-2 focus:ring-[#E3B23C]';
const CARD_CLASS =
  'bg-white rounded-xl p-6 shadow-xl border-2 border-black';

function LanguageSelector({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-black rounded-full text-sm font-bold text-black hover:bg-gray-50 transition"
      >
        <Globe className="w-4 h-4" />
        <span>{LANGUAGE_NAMES[lang]}</span>
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white border-2 border-black rounded-xl overflow-hidden z-50 min-w-[140px] shadow-xl">
          {(['fr', 'en', 'ar'] as Language[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => { setLang(l); setIsOpen(false); }}
              className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-gray-100"
              style={{ color: lang === l ? '#E3B23C' : '#111111', background: lang === l ? '#111111' : 'transparent' }}
            >
              {LANGUAGE_NAMES[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InscrireContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrFromUrl = searchParams.get('qr') || '';
  const { lang, setLang } = useTranslation();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    reference: qrFromUrl.toUpperCase(),
    firstName: '',
    lastName: '',
    whatsapp: '',
    email: '',
    objectName: '',
    objectDescription: '',
    city: '',
    country: '',
    reward: '',
    messageToFinder: '',
  });

  const [categoryData, setCategoryData] = useState<Record<string, string>>({});

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Restauration brouillon (localStorage)
  useEffect(() => {
    const draft = localStorage.getItem('qrtags_draft');
    if (draft) {
      try {
        const saved = JSON.parse(draft);
        if (saved.formData?.reference === formData.reference) {
          setFormData(saved.formData);
          setSelectedCategory(saved.selectedCategory || null);
          setCategoryData(saved.categoryData || {});
        }
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sauvegarde auto (localStorage)
  useEffect(() => {
    if (formData.reference) {
      localStorage.setItem('qrtags_draft', JSON.stringify({ formData, selectedCategory, categoryData }));
    }
  }, [formData, selectedCategory, categoryData]);

  const missingReference = !formData.reference;
  const selectedCat = selectedCategory ? getObjectCategory(selectedCategory) : null;

  // ─── Validations ─────────────────────────────────────────────────
  const canSubmitStep1 = !!selectedCategory;
  const canSubmitStep2 = Boolean(
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.whatsapp.trim() &&
    formData.objectName.trim() &&
    formData.objectDescription.trim() &&
    acceptTerms &&
    acceptPrivacy
  );

  const doSubmit = async () => {
    if (!canSubmitStep2) return;
    setLoading(true);
    try {
      // Construire customData avec tous les champs du formulaire (sera affiché
      // sur la page trouveur et la page de suivi propriétaire)
      const customData = {
        ...categoryData,
        category: selectedCategory,
        category_label: selectedCat?.label,
        object_name: formData.objectName,
        object_description: formData.objectDescription,
        city: formData.city,
        country: formData.country,
        reward: formData.reward,
        message_to_finder: formData.messageToFinder,
        email: formData.email,
        photo: photoPreview || undefined,
      };

      const response = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: formData.reference,
          travelerFirstName: formData.firstName,
          travelerLastName: formData.lastName,
          whatsappOwner: formData.whatsapp,
          customData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem('activationData', JSON.stringify({
          reference: formData.reference,
          firstName: formData.firstName,
          lastName: formData.lastName,
          whatsapp: formData.whatsapp,
          objectName: formData.objectName,
          category: selectedCat?.label,
          type: 'voyageur',
          expiresAt: data.baggage?.expiresAt,
          trackingToken: data.baggage?.trackingToken,
        }));

        // ─── Stocker la référence dans localStorage pour /mes-bagages ───
        // Permet à l'utilisateur de retrouver ses objets activés sans compte.
        if (typeof window !== 'undefined') {
          try {
            const KEY = 'qrbag_my_references';
            const refs: string[] = JSON.parse(localStorage.getItem(KEY) || '[]');
            if (!refs.includes(formData.reference)) {
              refs.push(formData.reference);
              localStorage.setItem(KEY, JSON.stringify(refs));
            }
          } catch {
            // Silent fail — pas bloquant
          }
        }

        localStorage.removeItem('qrtags_draft');
        router.push('/success?type=voyageur');
      } else {
        const err = await response.json();
        alert(err.error || 'Erreur lors de l\'activation');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  // ─── UI ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen py-8 px-4" style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_INK }}>
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector lang={lang} setLang={setLang} />
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white inline-block px-6 py-3 rounded-lg mb-4 shadow-lg border-2 border-black">
            <QRTagsLogo size="md" variant="light" />
          </div>
          <h1 className="text-3xl font-black text-black mb-2">🎯 Activez votre QR code</h1>
          <p className="text-black/80">Protégez vos objets en 2 minutes</p>

          {/* Barre de progression */}
          <div className="mt-4 flex gap-2 justify-center">
            <div
              className="h-2 w-20 rounded-full transition-all"
              style={{ backgroundColor: step >= 1 ? '#111' : 'rgba(17,17,17,0.2)' }}
            />
            <div
              className="h-2 w-20 rounded-full transition-all"
              style={{ backgroundColor: step >= 2 ? '#111' : 'rgba(17,17,17,0.2)' }}
            />
          </div>
          <p className="text-sm text-black/70 mt-2">
            ÉTAPE {step} SUR 2 — {step === 1 ? 'QUEL OBJET ?' : 'VOS INFORMATIONS'}
          </p>
        </div>

        {missingReference && (
          <div
            className="mb-6 p-3 rounded-xl text-sm flex items-center gap-2"
            style={{ backgroundColor: '#FEE2E2', color: QRTAGS_RED, border: `2px solid ${QRTAGS_RED}` }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Référence QR manquante. Scannez votre QR code.</span>
          </div>
        )}

        {/* ─── ÉTAPE 1 : Catégorie d'objet ─────────────────────────── */}
        {step === 1 && (
          <div className={CARD_CLASS}>
            <h2 className="text-lg font-bold text-black mb-4">Quel type d'objet voulez-vous protéger ?</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {OBJECT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSelectedCategory(cat.value)}
                    className="p-4 rounded-xl text-center transition-all hover:scale-105"
                    style={{
                      backgroundColor: isSelected ? '#111' : '#F9FAFB',
                      color: isSelected ? '#E3B23C' : '#111',
                      border: `2px solid ${isSelected ? '#111' : '#111'}`,
                    }}
                  >
                    <div className="text-3xl mb-2">{cat.icon}</div>
                    <div className="font-bold text-sm">{cat.label}</div>
                  </button>
                );
              })}
            </div>

            {selectedCat && (
              <div className="mb-6 p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                <p className="text-xs text-black/70">
                  <strong>{selectedCat.icon} {selectedCat.label} :</strong> {selectedCat.examples}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => canSubmitStep1 && setStep(2)}
              disabled={!canSubmitStep1}
              className="w-full py-4 px-6 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-all min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
              style={{
                backgroundColor: '#111',
                color: '#E3B23C',
                border: '2px solid #111',
              }}
            >
              Suivant <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ─── ÉTAPE 2 : Formulaire détaillé ───────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Référence du tag */}
            <div className={CARD_CLASS}>
              <label className="block text-sm font-bold text-black mb-1">Référence du tag</label>
              <input
                type="text"
                value={formData.reference}
                readOnly={!!qrFromUrl}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value.toUpperCase() })}
                className={INPUT_CLASS}
              />
            </div>

            {/* Section 1 : VOS INFORMATIONS DE CONTACT */}
            <div className={CARD_CLASS}>
              <h3 className="text-lg font-bold text-black mb-4">👤 VOS INFORMATIONS DE CONTACT</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    placeholder="Marie"
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Nom *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    placeholder="Dupont"
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-bold text-black mb-1">Numéro WhatsApp *</label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  placeholder="+33 6 12 34 56 78"
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className={INPUT_CLASS}
                />
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: QRTAGS_RED }}>
                  <AlertCircle className="w-3 h-3" />
                  Le numéro WhatsApp est essentiel pour être contacté en cas de perte.
                </p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-bold text-black mb-1">Email (optionnel)</label>
                <input
                  type="email"
                  value={formData.email}
                  placeholder="marie@email.com"
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {/* Section 2 : DÉCRIRE VOTRE OBJET */}
            <div className={CARD_CLASS}>
              <h3 className="text-lg font-bold text-black mb-4">
                🏷️ DÉCRIRE VOTRE OBJET — {selectedCat?.icon} {selectedCat?.label}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Nom de l'objet *</label>
                  <input
                    type="text"
                    value={formData.objectName}
                    placeholder="Ex: Mon iPhone 14"
                    onChange={(e) => setFormData({ ...formData, objectName: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>

                {/* Champs dynamiques selon la catégorie */}
                {selectedCat?.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-bold text-black mb-1">{field.label}</label>
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={categoryData[field.key] || ''}
                      placeholder={field.placeholder}
                      onChange={(e) => setCategoryData({ ...categoryData, [field.key]: e.target.value })}
                      className={INPUT_CLASS}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-bold text-black mb-1">Description *</label>
                  <textarea
                    value={formData.objectDescription}
                    placeholder="Caractéristiques distinctives, autocollants, rayures, contenu..."
                    rows={4}
                    onChange={(e) => setFormData({ ...formData, objectDescription: e.target.value })}
                    className={`${INPUT_CLASS} resize-none`}
                  />
                </div>

                {/* Upload photo */}
                <div>
                  <label className="block text-sm font-bold text-black mb-1">
                    📸 Photo de l'objet (optionnel)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Aperçu"
                        className="w-full h-32 object-cover rounded-lg border-2 border-black"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-black rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
                    >
                      <Camera className="w-6 h-6 mx-auto mb-2 text-black" />
                      <p className="text-black font-semibold">Ajouter une photo</p>
                      <p className="text-xs text-gray-600 mt-1">JPG, PNG (max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3 : VOTRE LOCALISATION */}
            <div className={CARD_CLASS}>
              <h3 className="text-lg font-bold text-black mb-4">📍 VOTRE LOCALISATION</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Ville</label>
                  <input
                    type="text"
                    value={formData.city}
                    placeholder="Dakar"
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Pays</label>
                  <input
                    type="text"
                    value={formData.country}
                    placeholder="Sénégal"
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-black mb-1">
                  <Gift className="w-3 h-3 inline mr-1" />
                  Récompense proposée (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.reward}
                  placeholder="Ex: 5000 FCFA"
                  onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1">
                  <MessageCircle className="w-3 h-3 inline mr-1" />
                  Message au trouveur (optionnel)
                </label>
                <textarea
                  value={formData.messageToFinder}
                  placeholder="Merci de me contacter, je récompenserai généreusement !"
                  rows={3}
                  onChange={(e) => setFormData({ ...formData, messageToFinder: e.target.value })}
                  className={`${INPUT_CLASS} resize-none`}
                />
              </div>
            </div>

            {/* Section 4 : CONFIRMATION */}
            <div className={CARD_CLASS}>
              <h3 className="text-lg font-bold text-black mb-4">✅ CONFIRMATION</h3>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-black border-2 border-black rounded"
                  />
                  <span className="text-black text-sm">J'accepte les conditions d'utilisation</span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-black border-2 border-black rounded"
                  />
                  <span className="text-black text-sm">
                    Je comprends que mes informations seront visibles uniquement par la personne qui trouve mon objet
                  </span>
                </label>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-4 border-2 border-black rounded-lg bg-white text-black font-bold text-base hover:bg-gray-100 transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Précédent
              </button>

              <button
                type="button"
                onClick={doSubmit}
                disabled={loading || !canSubmitStep2}
                className="flex-[2] px-8 py-4 rounded-lg bg-black text-[#E3B23C] font-bold text-base hover:bg-gray-900 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Activation...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" /> Activer mon QR code
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-black/70 text-sm">
            Propulsé par <span className="font-bold">QRTags</span>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function InscrirePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: '#E3B23C' }} />}>
      <InscrireContent />
    </Suspense>
  );
}
