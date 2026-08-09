'use client';

import { useState } from 'react';

export interface HouseGuideData {
  id: string;
  wifiNetwork: string | null;
  wifiPassword: string | null;
  checkInInstructions: string | null;
  checkOutInstructions: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  houseRules: string | null;
  homeTutorials: string | null;
  hostRecommendations: string | null;
  hostName: string | null;
  hostPhone: string | null;
  hostWelcomeMessage: string | null;
  photos: string | null;
}

interface HostViewProps {
  guide: HouseGuideData;
  agencyName: string;
  agencyAddress: string | null;
  lang: string;
}

interface Tutorial { title: string; description: string; photoUrl?: string; }

function cleanPhoneForWhatsApp(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/[\s\-().+]/g, '').replace(/^00/, '');
}

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h4 class="font-bold text-white text-sm mt-3 mb-1.5">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-bold text-[#E3B23C] text-base mt-4 mb-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="text-sm text-gray-300 ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '<div class="h-3"></div>')
    .replace(/\n/g, '<br/>');
}

export default function HostView({ guide, agencyName, lang }: HostViewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('checkin');
  const isEn = lang === 'en';

  const whatsappNumber = cleanPhoneForWhatsApp(guide.hostPhone);
  const tutorials: Tutorial[] = guide.homeTutorials ? JSON.parse(guide.homeTutorials) : [];

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const contactHost = (message?: string) => {
    if (!whatsappNumber) return;
    const defaultMsg = isEn
      ? `Hello ${guide.hostName || ''}, I have a question about the apartment.`
      : `Bonjour ${guide.hostName || ''}, j'ai une question concernant l'appartement.`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message || defaultMsg)}`, '_blank', 'noopener,noreferrer');
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-6">
      {guide.hostWelcomeMessage && (
        <section className="bg-gradient-to-br from-[#B45309]/20 to-[#1a1a1a] border border-[#B45309]/30 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-[#B45309]/30 flex items-center justify-center text-2xl shrink-0">👋</div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{isEn ? 'Your host' : 'Votre hôte'}</p>
              <p className="font-bold text-white">{guide.hostName || agencyName}</p>
            </div>
          </div>
          <p className="text-sm text-gray-300 italic leading-relaxed">&ldquo;{guide.hostWelcomeMessage}&rdquo;</p>
        </section>
      )}

      {guide.wifiNetwork && (
        <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
          <h2 className="text-xl font-bold text-[#E3B23C] mb-4 flex items-center gap-2">📶 WiFi</h2>
          <div className="space-y-3">
            <div className="bg-black rounded-xl p-3 border border-gray-700">
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">{isEn ? 'Network' : 'Réseau'}</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-white font-mono font-bold text-sm truncate">{guide.wifiNetwork}</p>
                <button onClick={() => copyToClipboard(guide.wifiNetwork!, 'network')} className="shrink-0 px-2.5 py-1 bg-gray-800 text-[#E3B23C] text-[10px] font-bold rounded-lg hover:bg-[#E3B23C] hover:text-black transition">
                  {copiedField === 'network' ? '✓' : 'Copier'}
                </button>
              </div>
            </div>
            {guide.wifiPassword && (
              <div className="bg-black rounded-xl p-3 border border-gray-700">
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">{isEn ? 'Password' : 'Mot de passe'}</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white font-mono font-bold text-sm truncate">{guide.wifiPassword}</p>
                  <button onClick={() => copyToClipboard(guide.wifiPassword!, 'password')} className="shrink-0 px-2.5 py-1 bg-[#E3B23C] text-black text-[10px] font-bold rounded-lg hover:bg-yellow-500 transition">
                    {copiedField === 'password' ? '✓ Copié !' : '📋 Copier'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden">
        <button onClick={() => toggleSection('checkin')} className="w-full p-5 flex items-center justify-between hover:bg-gray-800/50 transition">
          <h2 className="text-xl font-bold text-[#E3B23C] flex items-center gap-2">🔑 Check-in / Check-out</h2>
          <span className="text-gray-400 text-sm">{guide.checkInTime && guide.checkOutTime ? `${guide.checkInTime} → ${guide.checkOutTime}` : expandedSection === 'checkin' ? '▲' : '▼'}</span>
        </button>
        {expandedSection === 'checkin' && (
          <div className="px-5 pb-5 space-y-4">
            {guide.checkInInstructions && (
              <div>
                <h3 className="font-bold text-[#E3B23C] text-sm mb-2">📍 {isEn ? 'Check-in' : 'Arrivée'}{guide.checkInTime && <span className="text-xs text-gray-400 font-normal ml-1">({guide.checkInTime})</span>}</h3>
                <div className="text-sm text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(guide.checkInInstructions) }} />
              </div>
            )}
            {guide.checkOutInstructions && (
              <div>
                <h3 className="font-bold text-[#E3B23C] text-sm mb-2">🧳 {isEn ? 'Check-out' : 'Départ'}{guide.checkOutTime && <span className="text-xs text-gray-400 font-normal ml-1">({guide.checkOutTime})</span>}</h3>
                <div className="text-sm text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(guide.checkOutInstructions) }} />
              </div>
            )}
          </div>
        )}
      </section>

      {guide.houseRules && (
        <section className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden">
          <button onClick={() => toggleSection('rules')} className="w-full p-5 flex items-center justify-between hover:bg-gray-800/50 transition">
            <h2 className="text-xl font-bold text-[#E3B23C] flex items-center gap-2">🏠 {isEn ? 'House Rules' : 'Règles de la maison'}</h2>
            <span className="text-gray-400 text-sm">{expandedSection === 'rules' ? '▲' : '▼'}</span>
          </button>
          {expandedSection === 'rules' && (
            <div className="px-5 pb-5"><div className="text-sm text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(guide.houseRules) }} /></div>
          )}
        </section>
      )}

      {tutorials.length > 0 && (
        <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
          <h2 className="text-xl font-bold text-[#E3B23C] mb-4 flex items-center gap-2">📖 {isEn ? 'Home Tutorials' : 'Tutoriels maison'}</h2>
          <div className="space-y-3">
            {tutorials.map((t, idx) => (
              <div key={idx} className="bg-black/50 rounded-xl p-4 border border-gray-800">
                <h3 className="font-bold text-white text-sm mb-1.5">{t.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{t.description}</p>
                {t.photoUrl && <img src={t.photoUrl} alt={t.title} className="mt-2 rounded-lg w-full max-h-40 object-cover" />}
              </div>
            ))}
          </div>
        </section>
      )}

      {guide.hostRecommendations && (
        <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
          <h2 className="text-xl font-bold text-[#E3B23C] mb-4 flex items-center gap-2">📍 {isEn ? "Host's Tips" : 'Les adresses de l\'hôte'}</h2>
          <div className="text-sm text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(guide.hostRecommendations) }} />
        </section>
      )}

      {whatsappNumber && (
        <section className="bg-gradient-to-r from-[#25D366]/20 to-transparent border border-[#25D366]/30 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-3">💬 {isEn ? 'Contact your host' : 'Contactez votre hôte'}</h2>
          <p className="text-sm text-gray-300 mb-4">{guide.hostName ? `${guide.hostName} ${isEn ? 'is available on WhatsApp' : 'est disponible sur WhatsApp'}` : (isEn ? 'Available on WhatsApp' : 'Disponible sur WhatsApp')}</p>
          <button onClick={() => contactHost()} className="w-full py-3 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#1ebe5d] transition flex items-center justify-center gap-2">
            <span className="text-xl">💬</span>{isEn ? 'Message on WhatsApp' : 'Message sur WhatsApp'}
          </button>
        </section>
      )}
    </div>
  );
}
