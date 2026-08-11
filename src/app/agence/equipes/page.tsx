'use client';

import { useState, useEffect } from 'react';
import { Loader2, Mail, Save, Send, CheckCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  category: string;
  email: string;
  label: string | null;
}

interface ApiResponse {
  success: boolean;
  agencyEmail: string;
  agencyName: string;
  agencyType: string;
  teams: Team[];
  expectedCategories: string[];
}

const CATEGORY_META: Record<string, { label: string; emoji: string; desc: string }> = {
  reception:    { label: 'Réception',       emoji: '🛎️', desc: 'Demandes générales, check-in/out, infos' },
  kitchen:      { label: 'Cuisine',         emoji: '👨‍🍳', desc: 'Room service, mini-bar, petit-déjeuner' },
  housekeeping: { label: 'Gouvernantes',    emoji: '🧹', desc: 'Ménage, serviettes, blanchisserie' },
  maintenance:  { label: 'Maintenance',     emoji: '🔧', desc: 'Pannes, clim, plomberie, électricité' },
  spa:          { label: 'Spa',             emoji: '💆', desc: 'Soins, massages, réservations' },
  bar:          { label: 'Bar',             emoji: '🍸', desc: 'Bar, lounge, piscine' },
  management:   { label: 'Direction',       emoji: '👔', desc: 'Escalade (absence de prise en charge)' },
  concierge:    { label: 'Concierge / Co-hôte', emoji: '🤝', desc: 'Demandes générales, extras, transferts' },
};

export default function EquipesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agencyEmail, setAgencyEmail] = useState('');
  const [agencyType, setAgencyType] = useState('generic');
  const [expectedCategories, setExpectedCategories] = useState<string[]>([]);
  const [teams, setTeams] = useState<Record<string, { email: string; label: string }>>({});
  const [testingCategory, setTestingCategory] = useState<string | null>(null);
  const [testedCategory, setTestedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/teams')
      .then((r) => r.json())
      .then((data: ApiResponse) => {
        if (data.success) {
          setAgencyEmail(data.agencyEmail);
          setAgencyType(data.agencyType);
          setExpectedCategories(data.expectedCategories);
          // Initialise teams from DB, defaulting email to agencyEmail (pre-fill)
          const initial: Record<string, { email: string; label: string }> = {};
          for (const cat of data.expectedCategories) {
            const existing = data.teams.find((t) => t.category === cat);
            initial[cat] = {
              email: existing?.email || data.agencyEmail, // PRÉ-REMPLI avec l'email principal
              label: existing?.label || CATEGORY_META[cat]?.label || cat,
            };
          }
          setTeams(initial);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = Object.entries(teams).map(([category, t]) => ({
        category, email: t.email, label: t.label,
      }));
      const res = await fetch('/api/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teams: payload }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Équipes enregistrées', description: 'Les notifications email sont actives.' });
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

  const handleTestEmail = async (category: string) => {
    setTestingCategory(category);
    setTestedCategory(null);
    try {
      const res = await fetch('/api/teams/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      const data = await res.json();
      if (data.success) {
        setTestedCategory(category);
        toast({ title: 'Email envoyé', description: `Vérifiez la boîte de ${teams[category]?.email}` });
      } else {
        toast({ title: 'Échec', description: data.error, variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur réseau', variant: 'destructive' });
    } finally {
      setTestingCategory(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#134288]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[#134288]/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-[#134288]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Équipes & Emails</h1>
          <p className="text-sm text-slate-500">
            {agencyType === 'airbnb' ? 'Notifications Airbnb / Conciergerie' : 'Notifications Hôtel'}
            {' · '}
            1 email par catégorie — pré-rempli avec {agencyEmail || 'l\'email du compte'}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-900">
        💡 <strong>Comment ça marche :</strong> Quand un client envoie une demande (ex : « serviettes supplémentaires »), le système route automatiquement vers l'équipe correspondante (ex : <em>gouvernantes</em>) et envoie un email à l'adresse configurée ici. Modifiez l'email si vous avez une adresse spécifique par équipe.
      </div>

      {/* LISTE ÉQUIPES */}
      <div className="space-y-3 mb-6">
        {expectedCategories.map((cat) => {
          const meta = CATEGORY_META[cat] || { label: cat, emoji: '📋', desc: '' };
          const isPreFilled = teams[cat]?.email === agencyEmail;
          return (
            <div key={cat} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">
                  {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{meta.label}</h3>
                    {isPreFilled && (
                      <span className="text-[10px] uppercase tracking-wide text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                        Pré-rempli
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{meta.desc}</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={teams[cat]?.email || ''}
                      onChange={(e) => setTeams({ ...teams, [cat]: { ...teams[cat], email: e.target.value } })}
                      placeholder="email@equipe.com"
                      className="flex-1 px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-[#134288]"
                    />
                    <button
                      onClick={() => handleTestEmail(cat)}
                      disabled={testingCategory === cat || !teams[cat]?.email}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-50"
                      title="Envoyer un email de test"
                    >
                      {testingCategory === cat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Test
                    </button>
                  </div>
                  {testedCategory === cat && (
                    <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Email de test envoyé
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SAVE BUTTON */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-[#32ba5d] hover:bg-[#2ba14f] text-black font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        Enregistrer les équipes
      </button>

      <p className="text-xs text-slate-400 mt-3 text-center">
        <Mail className="w-3 h-3 inline mr-1" />
        Les emails sont utilisés pour les notifications de nouvelles demandes. Le bouton « Test » envoie un email vérifiant que SMTP fonctionne.
      </p>
    </div>
  );
}
