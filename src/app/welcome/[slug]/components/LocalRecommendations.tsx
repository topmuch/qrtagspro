'use client';

// ─── Types ──────────────────────────────────────────────────────────────────

interface LocalRecommendationsProps {
  agencyName: string;
  lang: string;
}

interface Recommendation {
  id: string;
  category: string;
  categoryEn: string;
  icon: string;
  title: string;
  description: string;
  descriptionEn: string;
  distance?: string;
}

interface Artisan {
  id: string;
  icon: string;
  name: string;
  craft: string;
  craftEn: string;
  note: string;
}

// ─── Recommandations de l'hôte (MVP — seront configurables par l'hôtel) ─────
const HOST_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec1',
    category: 'Restaurant authentique',
    categoryEn: 'Authentic restaurant',
    icon: '🍜',
    title: 'Chez Adja',
    description: "Cuisine sénégalaise maison, thiéboudienne exceptionnelle. Tenu par la même famille depuis 1985.",
    descriptionEn: 'Homemade Senegalese cuisine, exceptional thieboudienne. Family-run since 1985.',
    distance: '3 min à pied',
  },
  {
    id: 'rec2',
    category: 'Spot caché',
    categoryEn: 'Hidden spot',
    icon: '🌅',
    title: 'Le Rocher aux Almadies',
    description: 'Point de vue secret pour le coucher de soleil. Demandez à Adama, il vous indiquera le chemin.',
    descriptionEn: 'Secret sunset viewpoint. Ask Adama at reception for directions.',
    distance: '8 min à pied',
  },
  {
    id: 'rec3',
    category: 'Culture',
    categoryEn: 'Culture',
    icon: '🎭',
    title: 'Atelier de danse sabar',
    description: 'Cours privé avec Fatou, danseuse reconnue. Initiation au sabar traditionnel wolof.',
    descriptionEn: 'Private class with Fatou, renowned dancer. Traditional Wolof sabar initiation.',
    distance: 'Sur réservation',
  },
  {
    id: 'rec4',
    category: 'Bon plan hôte',
    categoryEn: 'Host tip',
    icon: '🥖',
    title: 'Boulangerie de Mamadou',
    description: 'Le meilleur pain au levain de Dakar. Il garde une tresse pour nos clients — mentionnez Maison Almadies.',
    descriptionEn: 'Best sourdough bread in Dakar. He keeps a tresse for our guests — mention Maison Almadies.',
    distance: '5 min à pied',
  },
];

// ─── Artisans locaux partenaires ────────────────────────────────────────────
const ARTISANS: Artisan[] = [
  { id: 'a1', icon: '🧵', name: 'Awa Diop', craft: 'Couture traditionnelle', craftEn: 'Traditional tailoring', note: 'Boubous sur mesure' },
  { id: 'a2', icon: '🪘', name: 'Moussa Sow', craft: 'Djembé & percussions', craftEn: 'Djembe & percussion', note: 'Fabrique artisanale' },
  { id: 'a3', icon: '🧺', name: 'Fatima Ndiaye', craft: 'Vannerie', craftEn: 'Basketry', note: 'Paniers tressés mains' },
  { id: 'a4', icon: '🎨', name: 'Omar Fall', craft: 'Peinture sous verre', craftEn: 'Glass painting', note: 'Art traditionnel wolof' },
];

// ─── Histoire locale ────────────────────────────────────────────────────────
const LOCAL_STORY = {
  title: 'Les Almadies',
  titleEn: 'The Almadies',
  icon: '📖',
  content: "Ce quartier tient son nom des almamy, chefs religieux qui y méditaient face à l'océan. Aujourd'hui, c'est le point le plus occidental d'Afrique — un lieu où la modernité côtoie la spiritualité.",
  contentEn: "This neighborhood takes its name from the almamy, religious leaders who meditated here facing the ocean. Today it's the westernmost point of Africa — where modernity meets spirituality.",
};

// ─── Composant ──────────────────────────────────────────────────────────────

export default function LocalRecommendations({ agencyName, lang }: LocalRecommendationsProps) {
  const isEn = lang === 'en';

  return (
    <div className="space-y-6">
      {/* ─── Mot de l'hôte ─── */}
      <section className="bg-gradient-to-br from-[#B45309]/20 to-[#1a1a1a] border border-[#B45309]/30 rounded-2xl p-5">
        <h2 className="text-xl font-bold text-[#E3B23C] mb-3 flex items-center gap-2">
          🏡 {isEn ? 'Your Host Recommends' : 'Votre Hôte Recommande'}
        </h2>
        <p className="text-sm text-gray-300 italic mb-4 leading-relaxed">
          {isEn
            ? `"Welcome to ${agencyName}. Here are my personal picks — places I love and people I trust. Don't hesitate to ask me for more tips at reception!"`
            : `"Bienvenue à ${agencyName}. Voici mes coups de cœur personnels — des lieux que j'aime et des gens en qui j'ai confiance. N'hésitez pas à me demander d'autres conseils à la réception !"`}
        </p>

        <div className="space-y-3">
          {HOST_RECOMMENDATIONS.map((rec) => (
            <div
              key={rec.id}
              className="bg-black/50 rounded-xl p-4 border border-gray-800 hover:border-[#E3B23C]/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl shrink-0">{rec.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold text-white text-sm">{rec.title}</h3>
                    {rec.distance && (
                      <span className="text-[10px] text-[#E3B23C] font-mono shrink-0">
                        {rec.distance}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] uppercase tracking-wide text-[#B45309] font-semibold mb-1">
                    {isEn ? rec.categoryEn : rec.category}
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {isEn ? rec.descriptionEn : rec.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Artisans partenaires ─── */}
      <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
        <h2 className="text-xl font-bold text-[#E3B23C] mb-4 flex items-center gap-2">
          🤝 {isEn ? 'Local Artisans' : 'Artisans Partenaires'}
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          {isEn
            ? 'Local craftspeople we partner with. Quality guaranteed, fair prices.'
            : 'Artisans locaux avec qui nous travaillons. Qualité garantie, prix justes.'}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {ARTISANS.map((artisan) => (
            <div
              key={artisan.id}
              className="p-3 bg-black rounded-xl border border-gray-800 hover:border-[#B45309]/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{artisan.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm truncate">{artisan.name}</h4>
                  <p className="text-[10px] text-gray-400">
                    {isEn ? artisan.craftEn : artisan.craft}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-[#E3B23C]">{artisan.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Histoire & culture ─── */}
      <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
        <h2 className="text-xl font-bold text-[#E3B23C] mb-3 flex items-center gap-2">
          {LOCAL_STORY.icon} {isEn ? 'Local Story' : 'Histoire Locale'}
        </h2>
        <h3 className="font-bold text-white mb-2 text-lg">
          {isEn ? LOCAL_STORY.titleEn : LOCAL_STORY.title}
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          {isEn ? LOCAL_STORY.contentEn : LOCAL_STORY.content}
        </p>
      </section>
    </div>
  );
}
