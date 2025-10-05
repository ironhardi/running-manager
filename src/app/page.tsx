'use client';

import React, { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle, XCircle, Mail, LogOut } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

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
  const [motivationQuote, setMotivationQuote] = useState({ quote: '', author: '' });
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const loadQuote = async () => {
      try {
        const response = await fetch('/lauf_motivation.csv');
        const text = await response.text();
        const lines = text.split('\n').slice(1);
        const quotes = lines
          .filter(line => line.trim())
          .map(line => {
            const firstComma = line.indexOf(',');
            if (firstComma === -1) return null;
            
            const author = line.substring(0, firstComma).trim();
            const quote = line.substring(firstComma + 1).trim();
            const cleanQuote = quote.replace(/^["']|["']$/g, '').trim();
            
            return { author, quote: cleanQuote };
          })
          .filter((q): q is { author: string; quote: string } => q !== null && !!q.quote && !!q.author);
        
        if (quotes.length > 0) {
          const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
          setMotivationQuote(randomQuote);
        }
      } catch (error) {
        console.error('Error loading quote:', error);
        setMotivationQuote({ 
          quote: 'Schnür die Schuhe und sei dabei – melde dich jetzt für die nächsten Termine an.', 
          author: '' 
        });
      }
    };

    loadQuote();
  }, []);

  const ensureRunner = async (session: any) => {
    if (!session) return null;

    try {
      const response = await fetch('/api/ensure-runner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Ensure runner error:', error);
        return null;
      }

      const data = await response.json();
      
      if (data.success && data.runner) {
        if (data.created) {
          router.push('/profil');
          return null;
        }
        
        if (!data.runner.display_name || data.runner.display_name === session.user.email?.split('@')[0]) {
          router.push('/profil');
          return null;
        }
        
        return data.runner.id;
      }

      return null;
    } catch (error) {
      console.error('Error ensuring runner:', error);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const id = await ensureRunner(session);
        setRunnerId(id);
      }
    };
    
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const id = await ensureRunner(session);
        setRunnerId(id);
      } else {
        setRunnerId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  useEffect(() => {
    const loadRuns = async () => {
      try {
        const response = await fetch('/api/runs');
        const data = await response.json();
        setRuns(data.runs || []);
      } catch (error) {
        console.error('Error fetching runs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRuns();
  }, []);

  useEffect(() => {
    const loadAttendances = async () => {
      if (!runnerId) return;

      const { data: attendances } = await supabase
        .from('attendance')
        .select('event_id, status')
        .eq('runner_id', runnerId);

      const attendanceMap: Record<string, string> = {};
      (attendances || []).forEach((a: any) => {
        attendanceMap[a.event_id] = a.status;
      });
      setUserAttendance(attendanceMap);

      const response = await fetch('/api/runs');
      const data = await response.json();
      setRuns(data.runs || []);
    };

    loadAttendances();
  }, [runnerId, supabase]);

  const handleAttendance = async (eventId: string, newStatus: 'yes' | 'no') => {
    if (!runnerId) {
      alert('Fehler: Kein Runner-Account gefunden. Bitte melde dich neu an.');
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

      setUserAttendance(prev => ({
        ...prev,
        [eventId]: newStatus
      }));

      const response = await fetch('/api/runs');
      const data = await response.json();
      setRuns(data.runs || []);

    } catch (error) {
      console.error('Error:', error);
      alert('Ein Fehler ist aufgetreten.');
    }
  };

  const Header = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingAdmin, setCheckingAdmin] = useState(true);

    useEffect(() => {
      const checkAdmin = async () => {
        if (!user) {
          setIsAdmin(false);
          setCheckingAdmin(false);
          return;
        }

        const { data: runner } = await supabase
          .from('runners')
          .select('is_admin')
          .eq('auth_user', user.id)
          .maybeSingle();

        setIsAdmin(!!runner?.is_admin);
        setCheckingAdmin(false);
      };

      checkAdmin();
    }, [user?.id]);

    const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/anmelden');
    };

    return (
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.primary }}>
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: colors.primary }}>Lauf Manager</h1>
                <p className="text-xs sm:text-sm text-gray-600">Laufgruppe HAW Kiel</p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3">
              {user ? (
                <>
                  {isAdmin && !checkingAdmin && (
                    <a 
                      href="/admin" 
                      className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white rounded-lg transition-all hover:shadow-lg" 
                      style={{ backgroundColor: colors.primary }}
                    >
                      Admin
                    </a>
                  )}
                  <button 
                    onClick={handleLogout} 
                    className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white rounded-lg transition-all hover:shadow-lg flex items-center gap-1 sm:gap-2" 
                    style={{ backgroundColor: colors.error }}
                  >
                    <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Abmelden</span>
                  </button>
                </>
              ) : (
                <a 
                  href="/anmelden" 
                  className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white rounded-lg transition-all hover:shadow-lg" 
                  style={{ backgroundColor: colors.primary }}
                >
                  Anmelden
                </a>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  };

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
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-8 border-b border-gray-100">
            <div className="flex gap-4 items-start">
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 48 48" 
                fill="none" 
                className="flex-shrink-0 mt-1 hidden sm:block"
                style={{ opacity: 0.15 }}
              >
                <path 
                  d="M14 18C14 12 10 8 4 8V12C6 12 8 13 8 16V18H14ZM14 18V28H4V18H14Z" 
                  fill={colors.primary}
                />
                <path 
                  d="M34 18C34 12 30 8 24 8V12C26 12 28 13 28 16V18H34ZM34 18V28H24V18H34Z" 
                  fill={colors.primary}
                />
              </svg>
              <div className="flex-1">
                <p className="text-lg sm:text-xl text-gray-700 leading-relaxed mb-2 sm:mb-3 italic">
                  {motivationQuote.quote}
                </p>
                {motivationQuote.author && (
                  <p className="text-xs sm:text-sm text-gray-500">
                    — {motivationQuote.author}
                  </p>
                )}
              </div>
            </div>
            {!user && (
              <a href="/anmelden" className="mt-6 px-6 py-3 text-white rounded-lg font-medium transition-all hover:shadow-lg inline-flex items-center gap-2" style={{ backgroundColor: colors.success }}>
                <Mail className="w-5 h-5" />
                Jetzt anmelden
              </a>
            )}
          </div>

          <div className="p-4 sm:p-8 space-y-4 sm:space-y-8">
            {runs.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: colors.gray, opacity: 0.3 }} />
                <p className="text-gray-500 text-lg">Keine kommenden Läufe geplant</p>
              </div>
            ) : (
              runs.map((run, index) => {
                const userStatus = userAttendance[run.id];
                const isNextRun = index === 0;
                
                return (
                  <div 
                    key={run.id} 
                    className={`
                      rounded-2xl border transition-all duration-200 relative
                      ${isNextRun 
                        ? 'border-gray-200 bg-blue-50/10' 
                        : 'border-gray-200 bg-white hover:shadow-md hover:border-gray-300'
                      }
                    `}
                    style={isNextRun ? { borderColor: colors.primary } : {}}
                  >
                    <div className="p-4 sm:p-6 pb-3 sm:pb-4">
                      {isNextRun && (
                        <span 
                          className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold text-white mb-2 sm:mb-3"
                          style={{ backgroundColor: colors.primary }}
                        >
                          Nächster Termin
                        </span>
                      )}
                      
                      <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3" style={{ color: colors.primary }}>
                        {new Date(run.start_at).toLocaleDateString('de-DE', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                      
                      <div className="flex flex-wrap gap-2 sm:gap-4 text-sm sm:text-base text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">
                            {new Date(run.start_at).toLocaleTimeString('de-DE', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })} Uhr
                          </span>
                        </div>
                        
                        {run.location && (
                          <>
                            <span>·</span>
                            <span>{run.location}</span>
                          </>
                        )}
                      </div>
                      
                      {run.note && (
                        <div className="mt-3 p-2 sm:p-3 rounded-lg bg-amber-50 border border-amber-200">
                          <p className="text-xs sm:text-sm text-amber-900">
                            <span className="font-semibold">ℹ️ Hinweis:</span> {run.note}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div 
                            className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                            style={{ backgroundColor: colors.accent }}
                          >
                            <Users className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.primary }} />
                          </div>
                          <div>
                            <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.primary }}>
                              {run.attendees || 0}
                            </div>
                            <div className="text-xs text-gray-600">Teilnehmer</div>
                          </div>
                        </div>
                        
                        {run.attendeeNames && run.attendeeNames.length > 0 && (
                          <div className="text-right text-xs sm:text-sm text-gray-600 max-w-[50%] sm:max-w-md truncate">
                            {run.attendeeNames.slice(0, 3).join(', ')}
                            {run.attendeeNames.length > 3 && ` +${run.attendeeNames.length - 3}`}
                          </div>
                        )}
                      </div>
                    </div>

                    {user && runnerId && (
                      <div className="p-4 sm:p-6 pt-4 sm:pt-5 bg-white rounded-b-2xl border-t border-gray-100">
                        <div className="flex gap-2 sm:gap-3">
                          <button
                            onClick={() => handleAttendance(run.id, 'yes')}
                            className={`
                              flex-1 py-2.5 sm:py-3.5 px-4 sm:px-5 rounded-xl font-semibold text-sm sm:text-base
                              transition-all duration-200
                              flex items-center justify-center gap-2
                              ${userStatus === 'yes' 
                                ? 'text-white shadow-md' 
                                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50'
                              }
                            `}
                            style={userStatus === 'yes' ? { backgroundColor: colors.success } : {}}
                          >
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>{userStatus === 'yes' ? 'Zugesagt' : 'Zusagen'}</span>
                          </button>
                          
                          <button
                            onClick={() => handleAttendance(run.id, 'no')}
                            className={`
                              flex-1 py-2.5 sm:py-3.5 px-4 sm:px-5 rounded-xl font-semibold text-sm sm:text-base
                              transition-all duration-200
                              flex items-center justify-center gap-2
                              ${userStatus === 'no' 
                                ? 'text-white shadow-md' 
                                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-red-500 hover:bg-red-50'
                              }
                            `}
                            style={userStatus === 'no' ? { backgroundColor: colors.error } : {}}
                          >
                            <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>{userStatus === 'no' ? 'Abgesagt' : 'Absagen'}</span>
                          </button>
                        </div>
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