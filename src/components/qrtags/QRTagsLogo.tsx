'use client';

/**
 * QRTagsPro — Composant logo réutilisable
 *
 * Affiche le logo QRTagsPro (/public/logo-qrtagspro.png — 275x75, RGBA).
 *
 * Le logo source a un fond transparent, donc:
 *   - variant="light" → rendu tel quel (idéal sur fond clair)
 *   - variant="dark" → rendu tel quel (le logo a déjà des couleurs qui
 *     s'affichent bien sur fond sombre grâce à sa transparence)
 *   - variant="auto" → détecte via prefers-color-scheme
 *
 * Usage :
 *   <QRTagsLogo />                            // défaut : h-12
 *   <QRTagsLogo size="sm" />                  // h-8
 *   <QRTagsLogo size="lg" />                  // h-16
 *   <QRTagsLogo variant="dark" />             // sur fond sombre
 *   <QRTagsLogo href="/" />                   // wrap dans un <Link>
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';

export type QRTagsLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type QRTagsLogoVariant = 'auto' | 'light' | 'dark';

const SIZE_CLASSES: Record<QRTagsLogoSize, string> = {
  xs: 'h-5',
  sm: 'h-8',
  md: 'h-12',
  lg: 'h-16',
  xl: 'h-24',
};

interface QRTagsLogoProps {
  size?: QRTagsLogoSize;
  variant?: QRTagsLogoVariant;
  className?: string;
  href?: string;
  alt?: string;
  withHover?: boolean;
}

export default function QRTagsLogo({
  size = 'md',
  variant = 'auto',
  className = '',
  href,
  alt = 'QRTagsPro',
  withHover = false,
}: QRTagsLogoProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (variant !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setIsDark(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [variant]);

  const sizeClass = SIZE_CLASSES[size];
  const hoverClass = withHover
    ? 'transition-transform duration-300 group-hover:scale-105'
    : '';
  const classes = `${sizeClass} w-auto object-contain ${hoverClass} ${className}`.trim();

  const img = (
    <img
      src="/logo-qrtagspro.png"
      alt={alt}
      className={classes}
      width={275}
      height={75}
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

