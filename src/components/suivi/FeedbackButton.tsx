'use client';

import { useState } from 'react';
import { MessageSquare, X, Send, CheckCircle } from 'lucide-react';

export function FeedbackButton({ reference }: { reference: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'bug' | 'suggestion' | 'question'>('bug');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (message.length < 5) return;
    setLoading(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, type, message }),
      });
      setSuccess(true);
      setTimeout(() => { setIsOpen(false); setSuccess(false); setMessage(''); }, 2000);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-12 h-12 bg-[#111111] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#0033a8] transition-colors"
        aria-label="Signaler un problème"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">💬 Votre avis</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            {success ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm font-bold text-green-700">Merci ! Votre message a été envoyé.</p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-3">
                  {([['bug', '🐛 Bug'], ['suggestion', '💡 Suggestion'], ['question', '❓ Question']] as const).map(([t, label]) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold ${type === t ? 'bg-[#111111] text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre problème ou suggestion..."
                  rows={4}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#111111] mb-3"
                />
                <button
                  onClick={handleSubmit}
                  disabled={loading || message.length < 5}
                  className="w-full py-3 bg-[#111111] text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Envoi...' : 'Envoyer'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
