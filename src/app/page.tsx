'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  QrCode,
  Smartphone,
  MapPin,
  MessageCircle,
  Menu,
  X,
  Shield,
  Building2,
  GraduationCap,
  Car,
  Luggage,
  Stethoscope,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Package,
  Bell,
  Globe,
  Zap,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';
import TrackingWidget from '@/components/home/TrackingWidget';

const LandingChatbotWidget = dynamic(
  () => import('@/components/finder/LandingChatbotWidget'),
  { ssr: false, loading: () => null },
);

// ════════════════════════════════════════════════════════════════════
// QRTags — Version CLAIRE
// Logo en couleurs d'origine (variant="light") sur fond blanc/crème
// Accents : Jaune doré #FDB900 (logo) + Noir #0d0d0f (texte)
// ════════════════════════════════════════════════════════════════════
const COLORS = {
  bg: '#ffffff',           // Fond blanc
  bgAlt: '#fafafa',        // Fond légèrement gris (alternance sections)
  bgCream: '#fffdf5',      // Crème très subtil (warm tint)
  text: '#0d0d0f',         // Noir (logo) pour le texte
  textMuted: '#525252',    // Gris foncé
  accent: '#FDB900',       // Jaune doré (logo)
  accentAlt: '#E3B23C',    // Jaune moutarde
  accentDark: '#c89a00',   // Jaune doré foncé (hover)
  card: '#ffffff',         // Cards blanches
  cardAlt: '#fffdf5',      // Cards crème
  border: '#e5e5e5',       // Bordures gris clair
  borderAccent: 'rgba(253, 185, 0, 0.3)', // Bordure jaune translucide
};

// ════════════════════════════════════════════════════════════════════
// DONNÉES MÉTIER QRTags — Multi-métiers
// ════════════════════════════════════════════════════════════════════
const AGENCY_TYPES = [
  { icon: Building2, name: 'Hôtels', desc: 'Effets personnels clients (valises, électronique).', color: COLORS.accent, slug: 'hotels', image: '/images/metiers/hotels.png', imageMobile: '/images/metiers/mobile/hotels.png' },
  { icon: GraduationCap, name: 'Écoles', desc: 'Cartables, uniformes, instruments de musique.', color: COLORS.accentAlt, slug: 'ecoles', image: '/images/metiers/ecoles.png', imageMobile: '/images/metiers/mobile/ecoles.png' },
  { icon: Luggage, name: 'Consignes', desc: 'Bagages en gare, aéroport, gare routière.', color: COLORS.accent, slug: 'consignes', image: '/images/metiers/consignes.png', imageMobile: '/images/metiers/mobile/consignes.png' },
  { icon: Car, name: 'Loueurs auto', desc: 'Clés, documents, sièges enfant, GPS.', color: COLORS.accentAlt, slug: 'loueurs', image: '/images/metiers/loueurs.png', imageMobile: '/images/metiers/mobile/loueurs.png' },
  { icon: Stethoscope, name: 'Cliniques', desc: 'Effets personnels patients, dossiers, prothèses.', color: COLORS.accent, slug: 'cliniques', image: '/images/metiers/cliniques.png', imageMobile: '/images/metiers/mobile/cliniques.png' },
  { icon: Package, name: 'Autres', desc: 'Bibliothèques, événementiel, logistique.', color: COLORS.accentAlt, slug: 'autres', image: '/images/metiers/autres.png', imageMobile: '/images/metiers/mobile/autres.png' },
];

const WORKFLOW_STEPS = [
  { num: '01', icon: QrCode, title: 'Génération QR', desc: 'Le Superadmin génère des lots de QR codes uniques et les assigne aux entreprises partenaires.', slug: '1-generation', image: '/images/workflow/1-generation.png', imageMobile: '/images/workflow/mobile/1-generation.png' },
  { num: '02', icon: Package, title: 'Vente au client', desc: 'L\'entreprise vend les tags QRTags à ses clients finaux et trace chaque vente dans son dashboard.', slug: '2-vente', image: '/images/workflow/2-vente.png', imageMobile: '/images/workflow/mobile/2-vente.png' },
  { num: '03', icon: Smartphone, title: 'Activation', desc: 'Le client scanne son QR code, remplit ses infos et l\'associe à son objet. Le tag est désormais protégé.', slug: '3-activation', image: '/images/workflow/3-activation.png', imageMobile: '/images/workflow/mobile/3-activation.png' },
  { num: '04', icon: MessageCircle, title: 'Perte & trouvaille', desc: 'Un trouveur scanne le QR → la page WAME s\'ouvre avec sa géoloc → le propriétaire est contacté instantanément.', slug: '4-perte-trouvaille', image: '/images/workflow/4-perte-trouvaille.png', imageMobile: '/images/workflow/mobile/4-perte-trouvaille.png' },
];

const FEATURES = [
  { icon: Zap, title: 'Contact instantané', desc: 'WhatsApp WAME (click-to-chat) pré-rempli avec la géolocalisation du trouveur. Aucune app à installer.', slug: 'contact' },
  { icon: MapPin, title: 'Géolocalisation GPS', desc: 'Position précise du trouveur envoyée automatiquement au propriétaire via Google Maps.', slug: 'geoloc' },
  { icon: Shield, title: 'Aucune donnée sensible', desc: 'Le trouveur ne voit que le prénom du propriétaire et la référence. Le numéro WhatsApp n\'est révélé qu\'au clic.', slug: 'rgpd' },
  { icon: Globe, title: 'Multilingue', desc: 'La page trouveur s\'adapte automatiquement en FR / EN / AR selon la langue du navigateur.', slug: 'multilingue' },
  { icon: Bell, title: 'Traçabilité complète', desc: 'Chaque scan est journalisé (position, heure, contexte). L\'entreprise voit tout depuis son dashboard.', slug: 'tracabilite' },
  { icon: Building2, title: 'Multi-métiers', desc: 'Hôtels, écoles, consignes, loueurs, cliniques — champs dynamiques selon votre activité.', slug: 'multi-metiers' },
];

const STATS = [
  { value: '10 000+', label: 'Objets protégés' },
  { value: '< 2h', label: 'Délai moyen de récupération' },
  { value: '98%', label: 'Objets retrouvés' },
  { value: '24/7', label: 'Disponible sans app' },
];

const TESTIMONIALS = [
  { name: 'Sophie Martin', role: 'Directrice, Hôtel Le Royal', text: 'QRTags a transformé notre gestion des objets perdus. Les clients récupèrent leurs affaires en moins de 2h. Le ROI est immédiat.', avatar: 'SM' },
  { name: 'Karim Benali', role: 'Responsable consigne, Gare de Lyon', text: 'Plus aucun bagage égaré depuis qu\'on a étiqueté tous nos casiers. Le système WAME est bluffant de simplicité.', avatar: 'KB' },
  { name: 'Dr. Élise Fournier', role: 'Clinique Saint-Antoine', text: 'Adieu lunettes et prothèses perdues. Les patients sont rassurés et notre réception est désengorgée.', avatar: 'EF' },
];

// ════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <main style={{ background: COLORS.bg, color: COLORS.text, minHeight: '100vh' }}>
      {/* ═══ NAVBAR ═══ */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
          backdropFilter: scrolled ? 'blur(12px)' : 'blur(6px)',
          borderBottom: scrolled ? `1px solid ${COLORS.border}` : '1px solid transparent',
          transition: 'all 0.3s',
        }}
      >
        <div className="max-w-screen-2xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2 group">
              <QRTagsLogo size="md" variant="light" withHover />
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <a href="#metiers" className="px-4 py-2 text-sm font-medium hover:text-[#c89a00] transition-colors">Métiers</a>
              <a href="#workflow" className="px-4 py-2 text-sm font-medium hover:text-[#c89a00] transition-colors">Comment ça marche</a>
              <a href="#features" className="px-4 py-2 text-sm font-medium hover:text-[#c89a00] transition-colors">Fonctionnalités</a>
              <a href="#temoignages" className="px-4 py-2 text-sm font-medium hover:text-[#c89a00] transition-colors">Témoignages</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/agence/connexion" className="px-4 py-2 text-sm font-medium hover:text-[#c89a00] transition-colors">
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105"
                style={{ background: COLORS.accent, color: COLORS.text }}
              >
                S'inscrire
              </Link>
            </div>

            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {menuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <a href="#metiers" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm">Métiers</a>
              <a href="#workflow" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm">Comment ça marche</a>
              <a href="#features" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm">Fonctionnalités</a>
              <a href="#temoignages" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm">Témoignages</a>
              <Link href="/agence/connexion" className="block px-4 py-2 text-sm text-[#c89a00]">Connexion →</Link>
              <Link href="/inscription" className="block px-4 py-3 text-sm font-bold text-center rounded-lg" style={{ background: COLORS.accent, color: COLORS.text }}>
                S'inscrire
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 px-5 relative overflow-hidden">
        {/* Décor jaune subtil en background */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, ${COLORS.accent}22 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, ${COLORS.accentAlt}11 0%, transparent 50%)`,
          }}
        />
        <div className="max-w-screen-2xl mx-auto relative grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.borderAccent}` }}
            >
              <Sparkles className="w-4 h-4" style={{ color: COLORS.accentDark }} />
              <span className="text-sm font-medium" style={{ color: COLORS.accentDark }}>
                SaaS multi-métiers pour entreprises
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6" style={{ color: COLORS.text }}>
              Retrouvez vos{' '}
              <span style={{ color: COLORS.accentDark }}>objets perdus</span>{' '}
              en un scan
            </h1>

            <p className="text-lg md:text-xl mb-8 max-w-xl" style={{ color: COLORS.textMuted }}>
              QRTags — étiquettes QR pour hôtels, écoles, consignes, loueurs et cliniques.
              Quand un objet est perdu, le trouveur vous contacte instantanément via WhatsApp
              avec sa géolocalisation. Sans app, sans batterie, sans GPS intégré.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                href="/inscription"
                className="px-6 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all hover:scale-105"
                style={{ background: COLORS.accent, color: COLORS.text }}
              >
                S'inscrire — Hôtel, Loueur, École...
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/devenir-partenaire"
                className="px-6 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 border-2 transition-all hover:bg-[#fffdf5]"
                style={{ borderColor: COLORS.border, color: COLORS.text }}
              >
                En savoir plus
              </Link>
            </div>
            <p className="text-sm mb-8" style={{ color: COLORS.textMuted }}>
              💡 Inscription en 3 étapes — compte créé immédiatement. Déjà un compte ?{' '}
              <Link href="/agence/connexion" className="font-bold" style={{ color: COLORS.accentDark }}>
                Connectez-vous
              </Link>
            </p>

            {/* Stats inline */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {STATS.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <div className="text-2xl md:text-3xl font-black" style={{ color: COLORS.accentDark }}>
                    {s.value}
                  </div>
                  <div className="text-xs md:text-sm" style={{ color: COLORS.textMuted }}>
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Hero : Image + Tracking widget en dessous */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative space-y-6"
          >
            {/* Image hero générée */}
            <div
              className="rounded-3xl overflow-hidden shadow-2xl"
              style={{ border: `1px solid ${COLORS.border}` }}
            >
              <Image
                src="/hero-illustration.png"
                alt="QRTags — un smartphone scanne un QR code sur une valise, une notification WhatsApp avec localisation apparaît"
                width={1344}
                height={768}
                className="w-full h-auto"
                priority
              />
            </div>

            {/* Tracking widget */}
            <div
              className="rounded-2xl p-6 shadow-lg"
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="w-5 h-5" style={{ color: COLORS.accentDark }} />
                <span className="text-sm font-bold" style={{ color: COLORS.text }}>
                  Suivre un objet
                </span>
              </div>
              <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
                Entrez votre référence QRTags (ex: QRT26-XXXXXX)
              </p>
              <TrackingWidget />

              {/* Mini "objet trouvé" preview */}
              <div className="mt-5 pt-5 border-t" style={{ borderColor: COLORS.border }}>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: COLORS.accent, color: COLORS.text }}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: COLORS.text }}>
                      Objet retrouvé
                    </div>
                    <div className="text-xs" style={{ color: COLORS.textMuted }}>
                      Il y a 2h · Hôtel Le Royal
                    </div>
                  </div>
                </div>
                <p className="text-xs italic" style={{ color: COLORS.textMuted }}>
                  « Bonjour Marie, j'ai trouvé votre objet (réf. QRT26-MLQGY7). Je suis à la réception. — Sophie »
                </p>
              </div>
            </div>

            {/* Floating WhatsApp badge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -bottom-4 -right-4 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2"
              style={{ background: '#25D366', color: 'white' }}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-bold">Contact WhatsApp</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ MÉTIERS ═══ */}
      <section id="metiers" className="py-20 lg:py-28 px-5" style={{ background: COLORS.bgAlt }}>
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: COLORS.cardAlt, color: COLORS.accentDark, border: `1px solid ${COLORS.borderAccent}` }}
            >
              MULTI-MÉTIERS
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4" style={{ color: COLORS.text }}>
              Un tag QR pour <span style={{ color: COLORS.accentDark }}>chaque métier</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textMuted }}>
              Chaque type d'entreprise a ses propres champs dynamiques.
              QRTags s'adapte automatiquement à votre activité.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {AGENCY_TYPES.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/metiers/${t.slug}`}
                  className="group block rounded-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-xl h-full"
                  style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
                >
                  {/* Image 9:16 sur mobile (portrait téléphone), 4:3 sur desktop */}
                  <div className="relative aspect-[9/16] md:aspect-[4/3] overflow-hidden">
                    {/* Image mobile (9:16 portrait) */}
                    <Image
                      src={t.imageMobile}
                      alt={t.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110 md:hidden"
                      sizes="(max-width: 768px) 100vw"
                    />
                    {/* Image desktop (4:3 paysage) */}
                    <Image
                      src={t.image}
                      alt={t.name}
                      fill
                      className="hidden md:block object-cover transition-transform duration-300 group-hover:scale-110"
                      sizes="(min-width: 768px) 33vw"
                    />
                    <div
                      className="absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg z-10"
                      style={{ background: t.color, color: COLORS.text }}
                    >
                      <t.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>{t.name}</h3>
                    <p className="text-sm mb-3" style={{ color: COLORS.textMuted }}>{t.desc}</p>
                    <span className="text-xs font-bold inline-flex items-center gap-1" style={{ color: COLORS.accentDark }}>
                      En savoir plus →
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WORKFLOW ═══ */}
      <section id="workflow" className="py-20 lg:py-28 px-5" style={{ background: COLORS.bg }}>
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: COLORS.cardAlt, color: COLORS.accentDark, border: `1px solid ${COLORS.borderAccent}` }}
            >
              WORKFLOW QRTAGS
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4" style={{ color: COLORS.text }}>
              4 étapes vers la <span style={{ color: COLORS.accentDark }}>retrouvaille</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textMuted }}>
              Du génération du QR code jusqu'au contact WhatsApp du trouveur
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKFLOW_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={`/workflow/${step.slug}`}
                  className="group block relative rounded-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-xl h-full"
                  style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
                >
                  {/* Image 9:16 sur mobile (portrait), 4:3 sur desktop */}
                  <div className="relative aspect-[9/16] md:aspect-[4/3] overflow-hidden">
                    {/* Image mobile (9:16 portrait) */}
                    <Image
                      src={step.imageMobile}
                      alt={step.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110 md:hidden"
                      sizes="(max-width: 768px) 100vw"
                    />
                    {/* Image desktop (4:3 paysage) */}
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="hidden md:block object-cover transition-transform duration-300 group-hover:scale-110"
                      sizes="(min-width: 768px) 25vw"
                    />
                    <div
                      className="absolute w-12 h-12 rounded-full flex items-center justify-center text-sm font-black shadow-lg z-10"
                      style={{ background: COLORS.accent, color: COLORS.text, top: '12px', right: '12px' }}
                    >
                      {step.num}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.text }}>{step.title}</h3>
                    <p className="text-sm mb-3" style={{ color: COLORS.textMuted }}>{step.desc}</p>
                    <span className="text-xs font-bold" style={{ color: COLORS.accentDark }}>
                      Voir le détail →
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/devenir-partenaire"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition-all hover:scale-105"
              style={{ background: COLORS.accent, color: COLORS.text }}
            >
              Démarrer avec QRTags
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-20 lg:py-28 px-5" style={{ background: COLORS.bgAlt }}>
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: COLORS.cardAlt, color: COLORS.accentDark, border: `1px solid ${COLORS.borderAccent}` }}
            >
              FONCTIONNALITÉS
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4" style={{ color: COLORS.text }}>
              Pensé pour la <span style={{ color: COLORS.accentDark }}>retrouvaille</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textMuted }}>
              Tout ce qu'il faut pour que vos objets reviennent à leur propriétaire
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/features/${f.slug}`}
                  className="block rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-xl h-full"
                  style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
                >
                  <f.icon className="w-7 h-7 mb-3" style={{ color: COLORS.accentDark }} />
                  <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.text }}>{f.title}</h3>
                  <p className="text-sm mb-3" style={{ color: COLORS.textMuted }}>{f.desc}</p>
                  <span className="text-xs font-bold" style={{ color: COLORS.accentDark }}>
                    En savoir plus →
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TÉMOIGNAGES ═══ */}
      <section id="temoignages" className="py-20 lg:py-28 px-5" style={{ background: COLORS.bg }}>
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: COLORS.cardAlt, color: COLORS.accentDark, border: `1px solid ${COLORS.borderAccent}` }}
            >
              TÉMOIGNAGES
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4" style={{ color: COLORS.text }}>
              Ils ont <span style={{ color: COLORS.accentDark }}>récupéré</span> leurs objets
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-6"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
              >
                <div className="text-4xl mb-4" style={{ color: COLORS.accent }}>"</div>
                <p className="text-sm mb-6" style={{ color: COLORS.text }}>{t.text}</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: COLORS.accent, color: COLORS.text }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: COLORS.text }}>{t.name}</div>
                    <div className="text-xs" style={{ color: COLORS.textMuted }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="py-20 lg:py-28 px-5" style={{ background: COLORS.bgAlt }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl p-12 shadow-2xl"
            style={{ background: `linear-gradient(145deg, ${COLORS.accent}, ${COLORS.accentAlt})`, color: COLORS.text }}
          >
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Prêt à ne plus jamais rien perdre ?
            </h2>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              Rejoignez les entreprises qui ont déjà protégé plus de 10 000 objets avec QRTags.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/devenir-partenaire"
                className="px-8 py-4 rounded-xl font-black text-base inline-flex items-center justify-center gap-2 transition-all hover:scale-105"
                style={{ background: COLORS.text, color: COLORS.accent }}
              >
                Devenir partenaire
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/agence/connexion"
                className="px-8 py-4 rounded-xl font-bold text-base inline-flex items-center justify-center gap-2 border-2 transition-all hover:bg-black/5"
                style={{ borderColor: COLORS.text, color: COLORS.text }}
              >
                J'ai déjà un compte
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-12 px-5 border-t" style={{ borderColor: COLORS.border, background: COLORS.bg }}>
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <QRTagsLogo size="md" variant="light" />
              <p className="text-sm mt-4 max-w-md" style={{ color: COLORS.textMuted }}>
                QRTags — SaaS de gestion d'objets perdus pour entreprises.
                Hôtels, écoles, consignes, loueurs, cliniques. Multi-métiers.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-sm" style={{ color: COLORS.accentDark }}>Produit</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#metiers" style={{ color: COLORS.textMuted }}>Métiers</a></li>
                <li><a href="#workflow" style={{ color: COLORS.textMuted }}>Workflow</a></li>
                <li><a href="#features" style={{ color: COLORS.textMuted }}>Fonctionnalités</a></li>
                <li><Link href="/devenir-partenaire" style={{ color: COLORS.textMuted }}>Devenir partenaire</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-sm" style={{ color: COLORS.accentDark }}>Compte</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/agence/connexion" style={{ color: COLORS.textMuted }}>Espace agence</Link></li>
                <li><Link href="/admin/connexion" style={{ color: COLORS.textMuted }}>Espace admin</Link></li>
                <li><Link href="/inscrire" style={{ color: COLORS.textMuted }}>Activer un tag</Link></li>
                <li><Link href="/contact" style={{ color: COLORS.textMuted }}>Contact</Link></li>
              </ul>
            </div>
          </div>
          <div
            className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4"
            style={{ borderColor: COLORS.border }}
          >
            <p className="text-xs" style={{ color: COLORS.textMuted }}>
              © {new Date().getFullYear()} QRTags. Tous droits réservés.
            </p>
            <div className="flex gap-4 text-xs">
              <Link href="/cgu" style={{ color: COLORS.textMuted }}>CGU</Link>
              <Link href="/confidentialite" style={{ color: COLORS.textMuted }}>Confidentialité</Link>
              <Link href="/mentions-legales" style={{ color: COLORS.textMuted }}>Mentions légales</Link>
            </div>
          </div>
        </div>
      </footer>

      <LandingChatbotWidget />
    </main>
  );
}
