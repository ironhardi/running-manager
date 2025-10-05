'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const ALLOWED_DOMAINS = [
  '@fh-kiel.de',
  '@student.fh-kiel.de',
  '@haw-kiel.de',
  '@student.haw-kiel.de',
  '@hardiman.de'
];

function AnmeldenForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const error = searchParams.get('error');

  const isValidEmail = (email: string): boolean => {
    const trimmedEmail = email.trim().toLowerCase();
    return ALLOWED_DOMAINS.some(domain => trimmedEmail.endsWith(domain));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const trimmedEmail = email.trim();

    // E-Mail-Validierung
    if (!isValidEmail(trimmedEmail)) {
      setMessage('Bitte nutze deine HAW Kiel E-Mail-Adresse (@fh-kiel.de, @student.fh-kiel.de, @haw-kiel.de oder @student.haw-kiel.de)');
      setLoading(false);
      return;
    }

    const origin = window.location.origin;
    
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: { emailRedirectTo: `${origin}/auth/callback` }
    });
    
    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Magic-Link gesendet! Prüfe dein Postfach (Absender: "Supabase Auth").');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#00305D' }}>Anmelden</h2>
          <p className="text-gray-600">Wir senden dir einen Magic-Link per E-Mail.</p>
          <p className="text-sm text-gray-500 mt-2">Nur mit HAW Kiel E-Mail-Adresse</p>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>}
        {message && <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('gesendet') ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">E-Mail-Adresse</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="vorname.nachname@haw-kiel.de" 
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none" 
              style={{ borderColor: email ? '#00305D' : '#E5E7EB' }} 
            />
            <p className="text-xs text-gray-500 mt-1">
              Nutze deine HAW-Adresse (@fh-kiel.de, @student.fh-kiel.de, @haw-kiel.de, @student.haw-kiel.de)
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 py-3 px-6 rounded-lg text-white font-medium transition-all hover:shadow-lg disabled:opacity-50" 
              style={{ backgroundColor: '#10B981' }}
            >
              {loading ? 'Sende...' : 'Magic-Link senden'}
            </button>
            <a 
              href="/" 
              className="px-6 py-3 rounded-lg font-medium transition-colors" 
              style={{ border: '2px solid #E5E7EB', color: '#6B7280' }}
            >
              Zurück
            </a>
          </div>
        </form>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Hinweis:</strong> Der Magic-Link wird von "Supabase Auth" verschickt. Prüfe auch deinen Spam-Ordner.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AnmeldenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}><div className="text-gray-600">Lädt...</div></div>}>
      <AnmeldenForm />
    </Suspense>
  );
}