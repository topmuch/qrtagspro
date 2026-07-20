'use client';

/**
 * QRTags — Composant logo réutilisable
 *
 * Affiche le logo QRTags (/public/logo.png) avec gestion automatique de la couleur
 * selon le fond (clair ou sombre). Le logo source est un JPEG/PNG avec fond blanc,
 * donc pour les fonds sombres on applique un filtre CSS `brightness-0 invert()`
 * pour le rendre blanc.
 *
 * Usage :
 *   <QRTagsLogo />                            // défaut : h-16, héritage du fond
 *   <QRTagsLogo size="sm" />                  // h-10
 *   <QRTagsLogo size="lg" />                  // h-20
 *   <QRTagsLogo variant="dark" />             // force rendu "blanc sur fond sombre"
 *   <QRTagsLogo variant="light" />            // force rendu "couleurs d'origine sur fond clair"
 *   <QRTagsLogo variant="auto" />             // détecte via prefers-color-scheme
 *   <QRTagsLogo className="custom-classes" /> // surcharge
 *   <QRTagsLogo href="/" />                   // wrap dans un <Link>
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';

export type QRTagsLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type QRTagsLogoVariant = 'auto' | 'light' | 'dark';

const SIZE_CLASSES: Record<QRTagsLogoSize, string> = {
  xs: 'h-6',
  sm: 'h-10',
  md: 'h-16',
  lg: 'h-20',
  xl: 'h-28',
};

interface QRTagsLogoProps {
  size?: QRTagsLogoSize;
  variant?: QRTagsLogoVariant;
  className?: string;
  href?: string;
  alt?: string;
  /** Effet hover (scale 1.05) — utile sur la landing */
  withHover?: boolean;
}

export default function QRTagsLogo({
  size = 'md',
  variant = 'auto',
  className = '',
  href,
  alt = 'QRTags',
  withHover = false,
}: QRTagsLogoProps) {
  const [isDark, setIsDark] = useState(false);

  // Détection auto du thème (light/dark) via matchMedia
  useEffect(() => {
    if (variant !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setIsDark(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [variant]);

  // Détermine si on doit inverser les couleurs (logo blanc)
  const shouldInvert =
    variant === 'dark' || (variant === 'auto' && isDark);

  const sizeClass = SIZE_CLASSES[size];
  const invertClass = shouldInvert ? 'brightness-0 invert' : '';
  const hoverClass = withHover
    ? 'transition-transform duration-300 group-hover:scale-105'
    : '';
  const classes = `${sizeClass} w-auto object-contain ${invertClass} ${hoverClass} ${className}`.trim();

  const img = (
    <img
      src="/logo.png"
      alt={alt}
      className={classes}
      // Évite le layout shift
      width={276}
      height={100}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-block group">
        {img}
      </Link>
    );
  }
  return img;
}
