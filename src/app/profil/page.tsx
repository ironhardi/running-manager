'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

const colors = {
  primary: '#00305D',
  success: '#10B981',
  lightGray: '#F3F4F6'
};

export default function ProfilPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/anmelden');
        return;
      }

      setEmail(session.user.email || '');

      const { data: runner } = await supabase
        .from('runners')
        .select('display_name')
        .eq('auth_user', session.user.id)
        .single();

      setName(runner?.display_name || '');
      setLoading(false);
    };

    loadProfile();
  }, [supabase, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('runners')
      .update({ display_name: name })
      .eq('auth_user', session.user.id);

    setSaving(false);

    if (error) {
      setMessage('Fehler beim Speichern: ' + error.message);
    } else {
      setMessage('Gespeichert!');
      setTimeout(() => router.push('/'), 1500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.lightGray }}>
        <p className="text-gray-600">Lädt...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.lightGray }}>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6" style={{ color: colors.primary }}>Mein Profil</h2>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('Fehler') 
              ? 'bg-red-50 border border-red-200 text-red-800' 
              : 'bg-green-50 border border-green-200 text-green-800'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">E-Mail</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Vorname</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Vorname"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none"
              style={{ borderColor: name ? colors.primary : '#E5E7EB' }}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving || !name}
              className="flex-1 py-3 rounded-lg text-white font-medium transition-all hover:shadow-lg disabled:opacity-50"
              style={{ backgroundColor: colors.success }}
            >
              {saving ? 'Speichert...' : 'Speichern'}
            </button>
            
            <a
              href="/"
              className="px-6 py-3 rounded-lg font-medium transition-colors"
              style={{ border: '2px solid #E5E7EB', color: '#6B7280' }}
            >
              Abbrechen
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}