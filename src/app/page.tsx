'use client';

import React, { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle, XCircle, Mail } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const colors = {
  primary: '#00305D',
  primaryLight: '#0A4A8A',
  accent: '#D4E6F1',
  success: '#10B981',
  error: '#EF4444',
  gray: '#6B7280',
  lightGray: '#F3F4F6'
};

export default function Home() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [runnerId, setRunnerId] = useState<string | null>(null);
  const [userAttendance, setUserAttendance] = useState<Record<string, string>>({});
  const supabase = createClientComponentClient();

  // User Session laden
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Runner ID laden
        const { data: runner } = await supabase
          .from('runners')
          .select('id')
          .eq('auth_user', session.user.id)
          .single();
        
        if (runner) {
          setRunnerId(runner.id);
        }
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Läufe und eigene Anmeldungen laden
  const fetchData = async () => {
    try {
      // Läufe laden
      const response = await fetch('/api/runs');
      const data = await response.json();
      setRuns(data.runs || []);

      // Wenn eingeloggt: eigene Anmeldungen laden
      if (runnerId) {
        const { data: attendances } = await supabase
          .from('attendance')
          .select('event_id, status')
          .eq('runner_id', runnerId);

        const attendanceMap: Record<string, string> = {};
        (attendances || []).forEach((a: any) => {
          attendanceMap[a.event_id] = a.status;
        });
        setUserAttendance(attendanceMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [runnerId]);

  // An-/Abmeldung
  const handleAttendance = async (eventId: string, newStatus: 'yes' | 'no') => {
    if (!runnerId) {
      console.error('No runner ID');
      return;
    }

    try {
      const { error } = await supabase
        .from('attendance')
        .upsert({
          runner_id: runnerId,
          event_id: eventId,
          status: newStatus,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating attendance:', error);
        alert('Fehler beim Speichern: ' + error.message);
        return;
      }

      // Lokalen State sofort aktualisieren
      setUserAttendance(prev => ({
        ...prev,
        [eventId]: newStatus
      }));

      // Läufe neu laden für aktualisierte Teilnehmerzahlen
      await fetchData();

    } catch (error) {
      console.error('Error:', error);
      alert('Ein Fehler ist aufgetreten.');
    }
  };

  const Header = () => (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>Lauf Manager</h1>
            <p className="text-sm text-gray-600">Laufgruppe HAW Kiel · marco.hardiman@fh-kiel.de</p>
          </div>
        </div>
        <div className="flex gap-3">
          {user ? (
            <a href="/admin" className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-all hover:shadow-lg" style={{ backgroundColor: colors.primary }}>
              Adminbereich
            </a>
          ) : (
            <a href="/anmelden" className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-all hover:shadow-lg" style={{ backgroundColor: colors.primary }}>
              Anmelden
            </a>
          )}
        </div>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.lightGray }}>
        <Header />
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 rounded-full mx-auto mb-4" style={{ backgroundColor: colors.accent }}></div>
            <p className="text-gray-600">Lädt Termine...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.lightGray }}>
      <Header />
      
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100">
            <h2 className="text-3xl font-bold mb-3" style={{ color: colors.primary }}>
              Kommende Läufe
            </h2>
            <p className="text-gray-600 text-lg">
              Schnür die Schuhe und sei dabei – melde dich jetzt für die nächsten Termine an.
            </p>
            {!user && (
              <a href="/anmelden" className="mt-6 px-6 py-3 text-white rounded-lg font-medium transition-all hover:shadow-lg inline-flex items-center gap-2" style={{ backgroundColor: colors.success }}>
                <Mail className="w-5 h-5" />
                Jetzt anmelden
              </a>
            )}
          </div>

          <div className="p-8 space-y-6">
            {runs.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: colors.gray, opacity: 0.3 }} />
                <p className="text-gray-500 text-lg">Keine kommenden Läufe geplant</p>
              </div>
            ) : (
              runs.map((run, index) => {
                const userStatus = userAttendance[run.id];
                return (
                  <div key={run.id} className="p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow" style={{ backgroundColor: index === 0 ? colors.accent : 'white' }}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2" style={{ color: colors.primary }}>
                          {new Date(run.start_at).toLocaleDateString('de-DE', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h3>
                        <div className="space-y-1 text-gray-700">
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(run.start_at).toLocaleTimeString('de-DE', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })} Uhr
                            {run.location && ` · ${run.location}`}
                          </p>
                          {run.note && (
                            <p className="text-sm italic pl-6" style={{ color: colors.primaryLight }}>
                              ℹ️ {run.note}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-3">
                          <Users className="w-5 h-5" style={{ color: colors.primary }} />
                          <span className="text-2xl font-bold" style={{ color: colors.primary }}>
                            {run.attendees || 0}
                          </span>
                        </div>
                        {run.attendeeNames && run.attendeeNames.length > 0 ? (
                          <p className="text-sm text-gray-600">
                            {run.attendeeNames.join(', ')}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600">Angemeldet</p>
                        )}
                      </div>
                    </div>
                    
                    {user && (
                      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleAttendance(run.id, 'yes')}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                            userStatus === 'yes' 
                              ? 'text-white shadow-md' 
                              : 'bg-white border-2 hover:bg-gray-50'
                          }`}
                          style={{
                            backgroundColor: userStatus === 'yes' ? colors.success : 'white',
                            borderColor: colors.success,
                            color: userStatus === 'yes' ? 'white' : colors.success
                          }}
                        >
                          <CheckCircle className="w-5 h-5 inline mr-2" />
                          Anmelden
                        </button>
                        <button
                          onClick={() => handleAttendance(run.id, 'no')}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                            userStatus === 'no' 
                              ? 'text-white shadow-md' 
                              : 'bg-white border-2 hover:bg-gray-50'
                          }`}
                          style={{
                            backgroundColor: userStatus === 'no' ? colors.error : 'white',
                            borderColor: colors.error,
                            color: userStatus === 'no' ? 'white' : colors.error
                          }}
                        >
                          <XCircle className="w-5 h-5 inline mr-2" />
                          Abmelden
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}