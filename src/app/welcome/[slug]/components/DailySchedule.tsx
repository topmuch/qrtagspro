'use client';

import { useState, useEffect } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DailyScheduleProps {
  lang: string;
}

interface ScheduleEvent {
  time: string; // "HH:MM"
  title: string;
  titleEn: string;
  location: string;
  locationEn: string;
  icon: string;
}

// ─── Programme du jour (MVP — données statiques) ────────────────────────────
// À terme, ce programme sera géré par l'hôtel via son dashboard (CRUD events,
// récurrence hebdomadaire, exceptions, etc.). Pour le MVP on garde un
// programme type qui ne varie pas selon le jour de la semaine.
const SCHEDULE_DATA: ScheduleEvent[] = [
  { time: '09:00', title: 'Aquagym', titleEn: 'Aquagym', location: 'Piscine Principale', locationEn: 'Main Pool', icon: '🤸' },
  { time: '11:00', title: 'Cours de Danse', titleEn: 'Dance Class', location: 'Salle de Bal', locationEn: 'Ballroom', icon: '💃' },
  { time: '14:00', title: 'Tournoi de Pétanque', titleEn: 'Pétanque Tournament', location: 'Jardin', locationEn: 'Garden', icon: '🎯' },
  { time: '16:00', title: 'Initiation au Wolof', titleEn: 'Wolof Lesson', location: 'Lobby Bar', locationEn: 'Lobby Bar', icon: '🗣️' },
  { time: '18:30', title: 'Spectacle de Magie', titleEn: 'Magic Show', location: 'Amphithéâtre', locationEn: 'Amphitheater', icon: '🎩' },
  { time: '21:00', title: 'Soirée Karaoké', titleEn: 'Karaoke Night', location: 'Discothèque', locationEn: 'Nightclub', icon: '🎤' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// ─── Composant ──────────────────────────────────────────────────────────────

export default function DailySchedule({ lang }: DailyScheduleProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const isEn = lang === 'en';

  // Initialisation côté client (évite l'hydration mismatch)
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Avant hydratation : on affiche le programme sans état "passé/à venir"
  const timeInMinutes = currentTime
    ? currentTime.getHours() * 60 + currentTime.getMinutes()
    : null;

  // Trouve le prochain événement (strictement après l'heure actuelle)
  const nextEvent =
    timeInMinutes !== null
      ? SCHEDULE_DATA.find(
          (e) => parseTimeToMinutes(e.time) > timeInMinutes
        ) ?? null
      : null;

  const noMoreEvents = timeInMinutes !== null && !nextEvent;

  return (
    <div className="space-y-3">
      {/* ─── Événement à venir (highlight) ─── */}
      {nextEvent && (
        <div className="bg-[#E3B23C]/10 border border-[#E3B23C] rounded-xl p-4 mb-2">
          <p className="text-[#E3B23C] text-xs font-bold uppercase tracking-wide mb-1">
            {isEn ? 'Coming up next' : 'Prochainement'}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{nextEvent.icon}</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white">
                {isEn ? nextEvent.titleEn : nextEvent.title}
              </h4>
              <p className="text-xs text-gray-400">
                {nextEvent.time} • {isEn ? nextEvent.locationEn : nextEvent.location}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Plus d'animations aujourd'hui ─── */}
      {noMoreEvents && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-2 text-center">
          <p className="text-gray-400 text-sm">
            {isEn
              ? '🎤 No more activities today. See you tomorrow!'
              : '🎤 Plus d\'animations aujourd\'hui. À demain !'}
          </p>
        </div>
      )}

      {/* ─── Timeline complète ─── */}
      <div className="space-y-2">
        {SCHEDULE_DATA.map((event, index) => {
          const eventTime = parseTimeToMinutes(event.time);
          const isPast = timeInMinutes !== null && eventTime < timeInMinutes;
          const isNext = nextEvent?.time === event.time;

          return (
            <div
              key={index}
              className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                isPast
                  ? 'opacity-40 grayscale'
                  : isNext
                    ? 'bg-[#E3B23C]/5 border border-[#E3B23C]/30'
                    : 'bg-black/50'
              }`}
            >
              <div className="flex flex-col items-center min-w-[50px]">
                <span className="text-[#E3B23C] font-bold text-sm">{event.time}</span>
              </div>
              <div className="h-10 w-[2px] bg-gray-700" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white text-sm">
                  {isEn ? event.titleEn : event.title}
                </h4>
                <p className="text-xs text-gray-400 truncate">
                  {isEn ? event.locationEn : event.location}
                </p>
              </div>
              <span className="text-2xl shrink-0">{event.icon}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
