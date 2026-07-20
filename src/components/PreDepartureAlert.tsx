'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Plane,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Luggage,
  FileText,
  Shield,
} from 'lucide-react';

// ─── Types ───
interface PreDepartureAlertProps {
  reference: string;
  departureDate: string | null;
  departureTime?: string | null;
  hasScans: boolean;
  lang: string;
}

type AlertPhase = 'no_date' | 'far' | 'soon' | 'urgent' | 'departed_no_scan' | 'departed_scanned' | 'past';

interface ChecklistItem {
  text: string;
  done: boolean;
}

// ─── Checklists par phase ───
const CHECKLISTS: Record<string, { title: string; items: string[] }> = {
  far: {
    title: 'Préparation du voyage',
    items: [
      'Vérifier la validité du passeport (6 mois minimum)',
      'Imprimer ou télécharger le billet d\'avion',
      'Confirmer la réservation de l\'hébergement',
      'Préparer les médicaments et ordonnances',
      'Faire une photo de votre bagage (pre-contrôle QRTags)',
      'Activer votre QR code QRTags',
    ],
  },
  soon: {
    title: 'Rappels avant l\'aéroport',
    items: [
      '✅ Passeport / Carte d\'identité',
      '✅ Billet d\'avion (papier ou mobile)',
      '✅ QR code QRTags activé sur votre bagage',
      '✅ Liquides < 100ml en sachet transparent',
      '✅ Chargeur et batterie externe',
      '✅ Masque et lingettes désinfectantes',
      '✅ Numéro d\'urgence de votre agence',
    ],
  },
  urgent: {
    title: 'Urgent — À l\'aéroport',
    items: [
      '🚨 Êtes-vous arrivé(e) à l\'aéroport ?',
      '🚨 Enregistrez vos bagages au comptoir',
      '🚨 Activez le mode "En transit" sur QRTags',
      '🚨 Vérifiez votre QR code est bien collé',
      '🚨 Passez le contrôle de sécurité',
      '🚨 Direction la porte d\'embarquement',
    ],
  },
  departed_no_scan: {
    title: 'Que faire si votre bagage n\'a pas été scanné ?',
    items: [
      '1. Restez calme — les bagages arrivent parfois par lots',
      '2. Vérifiez les autres tapis bagages',
      '3. Allez au comptoir "Bagages" de votre compagnie',
      '4. Déclarez votre bagage manquant (demandez un numéro PIR)',
      '5. Déclarez votre bagage perdu sur QRTags',
      '6. Activez les alertes WhatsApp pour être notifié',
    ],
  },
};

export function PreDepartureAlert({ reference, departureDate, departureTime, hasScans, lang }: PreDepartureAlertProps) {
  const [now, setNow] = useState(new Date());
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistOverrides, setChecklistOverrides] = useState<Record<number, boolean>>({});

  // Update 'now' every minute for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // ─── Compute departure datetime (date + time combined) ───
  const getDepartureDateTime = useCallback((): Date | null => {
    if (!departureDate) return null;
    const depDate = new Date(departureDate);
    if (departureTime) {
      const [hours, minutes] = departureTime.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        depDate.setHours(hours, minutes, 0, 0);
      }
    }
    return depDate;
  }, [departureDate, departureTime]);

  // ─── Determine alert phase ───
  const getPhase = useCallback((): AlertPhase => {
    const depDate = getDepartureDateTime();
    if (!depDate) return 'no_date';

    const diffMs = depDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours > 4) return 'far';           // > 4h avant
    if (diffHours > 2) return 'soon';          // 2-4h avant
    if (diffHours > 0) return 'urgent';        // < 2h avant
    // Vol parti
    if (hasScans) return 'departed_scanned';   // Scanné → OK
    const hoursSinceDeparture = -diffHours;
    if (hoursSinceDeparture < 48) return 'departed_no_scan'; // 0-48h après, pas de scan
    return 'past';                              // > 48h après
  }, [getDepartureDateTime, now, hasScans]);

  const phase = getPhase();
  const depDate = getDepartureDateTime();
  const diffHours = depDate ? (depDate.getTime() - now.getTime()) / (1000 * 60 * 60) : 0;
  const hoursSinceDeparture = depDate ? (now.getTime() - depDate.getTime()) / (1000 * 60 * 60) : 0;

  // ─── Compute checklist items from phase (derived, not in effect) ───
  const currentChecklistKey = phase === 'departed_no_scan' ? 'departed_no_scan'
    : phase === 'urgent' ? 'urgent'
    : phase === 'soon' ? 'soon'
    : phase === 'far' ? 'far'
    : null;
  const currentChecklist = currentChecklistKey ? CHECKLISTS[currentChecklistKey] : null;

  // ─── Toggle checklist item ───
  const toggleItem = (idx: number) => {
    setChecklistOverrides(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // ─── Build checklist items from current checklist + overrides ───
  const checklistItems: ChecklistItem[] = currentChecklist
    ? currentChecklist.items.map((text, idx) => ({ text, done: !!checklistOverrides[idx] }))
    : [];

  // ─── No date set ───
  if (phase === 'no_date') {
    return (
      <div className="bg-slate-100 border-2 border-slate-300 rounded-2xl p-4 flex items-start gap-3">
        <Calendar className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-700 mb-0.5">
            {lang === 'fr' ? 'Date de départ non définie' : 'Departure date not set'}
          </p>
          <p className="text-sm text-slate-600">
            {lang === 'fr'
              ? 'Définissez votre date et heure de départ via "Modifier mon profil" pour activer les rappels intelligents.'
              : 'Set your departure date via "Edit profile" to enable smart reminders.'}
          </p>
        </div>
      </div>
    );
  }

  // ─── Past (> 48h after departure) — no alert ───
  if (phase === 'past' || phase === 'departed_scanned') {
    return null;
  }

  // ─── Format countdown ───
  const formatCountdown = (): string => {
    if (diffHours > 0) {
      const h = Math.floor(diffHours);
      const m = Math.floor((diffHours - h) * 60);
      if (h > 0) return `${h}h${m > 0 ? ` ${m}min` : ''}`;
      return `${m} min`;
    }
    return `${Math.round(hoursSinceDeparture)}h`;
  };

  // ─── Phase config ───
  const phaseConfig: Record<string, {
    bg: string;
    border: string;
    text: string;
    title: string;
    message: string;
    icon: typeof Clock;
    buttonText: string;
    buttonBg: string;
    buttonHover: string;
  }> = {
    far: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      text: 'text-green-700',
      title: lang === 'fr' ? 'Préparation du voyage' : 'Trip preparation',
      message: lang === 'fr'
        ? `✈️ Votre vol part dans ${formatCountdown()}. Pensez à préparer votre bagage et à activer votre QR code QRTags.`
        : `✈️ Your flight departs in ${formatCountdown()}. Prepare your luggage and activate your QR code.`,
      icon: Plane,
      buttonText: lang === 'fr' ? '📋 Voir la checklist de préparation' : '📋 View preparation checklist',
      buttonBg: 'bg-green-600',
      buttonHover: 'hover:bg-green-700',
    },
    soon: {
      bg: 'bg-amber-50',
      border: 'border-amber-400',
      text: 'text-amber-700',
      title: lang === 'fr' ? 'Rappels avant l\'aéroport' : 'Pre-airport reminders',
      message: lang === 'fr'
        ? `⏰ Votre vol part dans ${formatCountdown()}. N'oubliez pas : passeport, billet, QR code activé.`
        : `⏰ Your flight departs in ${formatCountdown()}. Don't forget: passport, ticket, QR code activated.`,
      icon: Clock,
      buttonText: lang === 'fr' ? '✅ Vérifier mes affaires' : '✅ Check my items',
      buttonBg: 'bg-amber-600',
      buttonHover: 'hover:bg-amber-700',
    },
    urgent: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      text: 'text-red-700',
      title: lang === 'fr' ? '🚨 URGENT — Vol imminent' : '🚨 URGENT — Flight soon',
      message: lang === 'fr'
        ? `🚨 Votre vol part dans ${formatCountdown()} ! Êtes-vous à l'aéroport ? Activez le mode "En transit" sur QRTags.`
        : `🚨 Your flight departs in ${formatCountdown()}! Are you at the airport? Activate "In transit" mode.`,
      icon: AlertTriangle,
      buttonText: lang === 'fr' ? '🚨 Checklist urgence aéroport' : '🚨 Airport emergency checklist',
      buttonBg: 'bg-red-600',
      buttonHover: 'hover:bg-red-700',
    },
    departed_no_scan: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      text: 'text-red-700',
      title: lang === 'fr' ? 'Aucune activité détectée' : 'No activity detected',
      message: lang === 'fr'
        ? `⚠️ Votre vol est parti il y a ${Math.round(hoursSinceDeparture)}h. Aucun scan de votre bagage détecté. Vérifiez au comptoir bagages.`
        : `⚠️ Your flight departed ${Math.round(hoursSinceDeparture)}h ago. No bag scan detected. Check at the baggage counter.`,
      icon: AlertCircle,
      buttonText: lang === 'fr' ? '📋 Que faire ? (checklist)' : '📋 What to do? (checklist)',
      buttonBg: 'bg-red-600',
      buttonHover: 'hover:bg-red-700',
    },
  };

  const config = phaseConfig[phase];
  if (!config) return null;

  const Icon = config.icon;
  const checklist = currentChecklist;

  return (
    <div className={`rounded-2xl border-2 ${config.border} overflow-hidden`}>
      {/* ─── Alert Banner ─── */}
      <div className={`${config.bg} p-4 flex items-start gap-3`}>
        <Icon className={`w-5 h-5 ${config.text} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${config.text} mb-0.5`}>{config.title}</p>
          <p className="text-sm text-slate-700">{config.message}</p>
        </div>
        {/* Countdown badge */}
        {diffHours > 0 && (
          <div className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold ${config.buttonBg} text-white`}>
            -{formatCountdown()}
          </div>
        )}
      </div>

      {/* ─── Checklist Button ─── */}
      {checklist && (
        <div className="border-t border-slate-200">
          <button
            onClick={() => setShowChecklist(!showChecklist)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-white ${config.buttonBg} ${config.buttonHover} transition-colors`}
          >
            <span>{config.buttonText}</span>
            {showChecklist ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* ─── Checklist Content ─── */}
          {showChecklist && (
            <div className="bg-white p-4 space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {checklist.title}
              </p>
              {checklistItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleItem(idx)}
                  className="w-full flex items-start gap-2 text-left p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${
                    item.done
                      ? 'bg-green-500 border-green-500'
                      : 'border-slate-300'
                  }`}>
                    {item.done && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {item.text}
                  </span>
                </button>
              ))}

              {/* Progress bar */}
              {checklistItems.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Progression</span>
                    <span>{checklistItems.filter(i => i.done).length}/{checklistItems.length}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`${config.buttonBg} h-2 rounded-full transition-all`}
                      style={{ width: `${(checklistItems.filter(i => i.done).length / checklistItems.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
