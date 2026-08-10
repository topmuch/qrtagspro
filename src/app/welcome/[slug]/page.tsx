import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import WristbandView from './components/WristbandView';

// Force dynamic rendering (la page interroge la DB, ne peut pas être statique)
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ context?: string; lang?: string }>;
}

/**
 * Page d'accueil client — /welcome/[slug]
 *
 * Accessible quand un client scanne son bracelet QR (ou suit un lien direct).
 * Le paramètre `context` détermine l'expérience affichée :
 *   - WRISTBAND → WristbandView (compagnon de séjour universel, s'adapte au braceletProfile)
 *   - tout autre valeur → vue standard (à venir : guide touristique)
 *
 * La langue est détectée via `?lang=` (FR par défaut). En production, on
 * pourra aussi détecter la langue du navigateur (Accept-Language header).
 */
export default async function WelcomePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { context = 'STANDARD', lang = 'fr', ref = '' } = await searchParams;

  // ─── Récupère l'agence (hôtel) par son slug ───
  const agency = await db.agency.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      phone: true,
      contactPhone: true,
      address: true,
      logoUrl: true,
      agencyType: true,
      braceletProfile: true,
      latitude: true,
      longitude: true,
      houseGuide: {
        select: {
          id: true, wifiNetwork: true, wifiPassword: true,
          checkInInstructions: true, checkOutInstructions: true,
          checkInTime: true, checkOutTime: true,
          houseRules: true, homeTutorials: true, hostRecommendations: true,
          hostName: true, hostPhone: true, hostWelcomeMessage: true, photos: true,
        },
      },
    },
  });

  if (!agency) {
    notFound();
  }

  // ─── Sécurité : cette page n'est pertinente que pour les hôtels ───
  // Si l'agence n'est pas un hôtel, on logue un avertissement (mais on affiche
  // quand même la vue wristband si explicitement demandée).
  if (agency.agencyType !== 'hotel' && agency.agencyType !== 'airbnb') {
    console.warn(
      `[welcome] Agence ${agency.slug} (type=${agency.agencyType}) a accédé à la vue wristband.`
    );
  }

  // ─── Contexte WRISTBAND → vue compagnon de séjour (s'adapte au braceletProfile) ───
  if (context === 'WRISTBAND') {
    // Sérialise l'agence en objet plain pour le client component
    const agencyData = {
      id: agency.id,
      name: agency.name,
      slug: agency.slug,
      phone: agency.phone,
      contactPhone: agency.contactPhone,
      logoUrl: agency.logoUrl,
      address: agency.address,
      braceletProfile: agency.braceletProfile,
      latitude: agency.latitude,
      longitude: agency.longitude,
      houseGuide: agency.houseGuide,
      reference: ref || null,
    };
    return <WristbandView agency={agencyData} lang={lang} />;
  }

  // ─── Contexte standard → vue guide touristique (à venir) ───
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          Bienvenue chez {agency.name}
        </h1>
        <p className="text-slate-600">
          Le guide touristique interactif arrive bientôt. Pour accéder à votre
          compagnon de séjour, veuillez scanner votre bracelet.
        </p>
      </div>
    </div>
  );
}

// Pas de generateStaticParams — la page est dynamique (force-dynamic)
// évite les erreurs de DB pendant le build Docker
export const dynamicParams = true;
