'use client';

import React, { useState, useEffect } from 'react';
import { Users, Calendar, MessageSquare, User, Mail, Download, Plus, Edit2, Copy, Trash2, LogOut, Save, X } from 'lucide-react';
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

type Tab = 'termine' | 'anmeldungen' | 'laufer' | 'nachrichten';

type EventRow = {
  id: string;
  event_date: string;
  start_time: string | null;
  location: string;
  notes: string | null;
  title: string;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<Tab>('termine');
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      
      if (!uid) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data: runner } = await supabase
        .from('runners')
        .select('is_admin')
        .eq('auth_user', uid)
        .maybeSingle();

      setIsAdmin(!!runner?.is_admin);
      setLoading(false);
    };

    checkAdmin();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.lightGray }}>
        <Header onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 rounded-full mx-auto mb-4" style={{ backgroundColor: colors.accent }}></div>
            <p className="text-gray-600">Lade...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.lightGray }}>
        <Header onLogout={handleLogout} />
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
              <User className="w-10 h-10" style={{ color: colors.primary }} />
            </div>
            <h1 className="text-3xl font-bold mb-3" style={{ color: colors.primary }}>
              Kein Zugriff
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              Du benötigst Admin-Rechte, um diesen Bereich zu sehen.
            </p>
            <a href="/" className="inline-block px-6 py-3 text-white rounded-lg font-medium transition-all hover:shadow-lg" style={{ backgroundColor: colors.primary }}>
              Zur Startseite
            </a>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'termine' as Tab, label: 'Termine', icon: Calendar },
    { id: 'anmeldungen' as Tab, label: 'Anmeldungen', icon: Users },
    { id: 'laufer' as Tab, label: 'Läufer', icon: User },
    { id: 'nachrichten' as Tab, label: 'Nachrichten', icon: MessageSquare }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.lightGray }}>
      <Header onLogout={handleLogout} />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-3xl font-bold mb-2" style={{ color: colors.primary }}>
              Adminbereich
            </h2>
            <p className="text-gray-600">
              Verwalte Termine, Anmeldungen, Läufer und Nachrichten.
            </p>
          </div>

          <div className="border-b border-gray-200">
            <div className="flex px-8 gap-2 overflow-x-auto">
              {tabs.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-all relative whitespace-nowrap ${
                      tab === t.id ? 'text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={{
                      backgroundColor: tab === t.id ? colors.success : 'transparent',
                      borderRadius: tab === t.id ? '8px 8px 0 0' : '0'
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-8">
            {tab === 'termine' && <TermineTab />}
            {tab === 'anmeldungen' && <AnmeldungenTab />}
            {tab === 'laufer' && <LauferTab />}
            {tab === 'nachrichten' && <NachrichtenTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

const Header = ({ onLogout }: { onLogout: () => void }) => (
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
        <a href="/" className="px-5 py-2 text-sm font-medium rounded-lg transition-colors border-2" style={{ borderColor: colors.primary, color: colors.primary }}>
          Zur Startseite
        </a>
        <button onClick={onLogout} className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-all hover:shadow-lg flex items-center gap-2" style={{ backgroundColor: colors.error }}>
          <LogOut className="w-4 h-4" />
          Abmelden
        </button>
      </div>
    </div>
  </header>
);

const TermineTab = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('16:15');
  const [location, setLocation] = useState('Haupteingang Mehrzweckgebäude, FH Kiel');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Partial<EventRow>>({});
  const supabase = createClientComponentClient();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('id, event_date, start_time, location, notes, title')
      .order('event_date', { ascending: true });
    
    if (error) console.error(error);
    setEvents((data as EventRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate) return;

    const { error } = await supabase.from('events').insert({
      event_date: eventDate,
      start_time: startTime || null,
      location,
      notes: notes || null,
      title: 'Lauftreff'
    });

    if (error) {
      alert(error.message);
      return;
    }

    setEventDate('');
    setNotes('');
    await load();
  };

  const saveEdit = async (id: string) => {
    const payload = {
      event_date: edit.event_date,
      start_time: edit.start_time || null,
      location: edit.location,
      notes: (edit.notes ?? '').trim() || null,
    };

    const { error } = await supabase.from('events').update(payload).eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }

    setEditingId(null);
    await load();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Termin wirklich löschen?')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }
    await load();
  };

  const duplicateEvent = async (ev: EventRow) => {
    const newDate = prompt('Neues Datum für Duplikat (YYYY-MM-DD)', ev.event_date);
    if (!newDate) return;

    const { error } = await supabase.from('events').insert({
      event_date: newDate,
      start_time: ev.start_time,
      location: ev.location,
      notes: ev.notes,
      title: ev.title
    });

    if (error) {
      alert(error.message);
      return;
    }
    await load();
  };

  return (
    <div className="space-y-8">
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-bold mb-4" style={{ color: colors.primary }}>
          Neuen Termin anlegen
        </h3>
        <form onSubmit={createEvent} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300"
            />
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300"
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ort"
              className="px-4 py-2 rounded-lg border border-gray-300"
            />
          </div>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notiz (optional)"
            className="w-full px-4 py-2 rounded-lg border border-gray-300"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-lg text-white font-medium flex items-center gap-2 hover:shadow-lg transition-all"
            style={{ backgroundColor: colors.success }}
          >
            <Plus className="w-5 h-5" />
            Speichern
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4" style={{ color: colors.primary }}>Alle Termine</h3>
        {loading ? (
          <p className="text-gray-600">Lade...</p>
        ) : events.length === 0 ? (
          <p className="text-gray-600">Noch keine Termine vorhanden.</p>
        ) : (
          <div className="space-y-4">
            {events.map(ev => {
              const isEditing = editingId === ev.id;
              return (
                <div key={ev.id} className="p-6 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {!isEditing ? (
                        <>
                          <h4 className="font-bold text-lg mb-2">
                            {new Date(ev.event_date).toLocaleDateString('de-DE', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </h4>
                          <p className="text-gray-600">
                            {ev.start_time?.slice(0, 5)} Uhr · {ev.location}
                          </p>
                          {ev.notes && (
                            <p className="text-sm italic mt-2 text-gray-500">ℹ️ {ev.notes}</p>
                          )}
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <input
                              type="date"
                              value={edit.event_date ?? ''}
                              onChange={(e) => setEdit(v => ({ ...v, event_date: e.target.value }))}
                              className="px-4 py-2 rounded-lg border border-gray-300"
                            />
                            <input
                              type="time"
                              value={edit.start_time ?? ''}
                              onChange={(e) => setEdit(v => ({ ...v, start_time: e.target.value }))}
                              className="px-4 py-2 rounded-lg border border-gray-300"
                            />
                            <input
                              type="text"
                              value={edit.location ?? ''}
                              onChange={(e) => setEdit(v => ({ ...v, location: e.target.value }))}
                              className="px-4 py-2 rounded-lg border border-gray-300"
                            />
                          </div>
                          <input
                            type="text"
                            value={edit.notes ?? ''}
                            onChange={(e) => setEdit(v => ({ ...v, notes: e.target.value }))}
                            placeholder="Notiz (optional)"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!isEditing ? (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(ev.id);
                              setEdit({
                                event_date: ev.event_date,
                                start_time: ev.start_time ?? '',
                                location: ev.location,
                                notes: ev.notes ?? ''
                              });
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{ color: colors.primary }}
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => duplicateEvent(ev)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{ color: colors.primary }}
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteEvent(ev.id)}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                            style={{ color: colors.error }}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => saveEdit(ev.id)}
                            className="p-2 rounded-lg hover:bg-green-50 transition-colors"
                            style={{ color: colors.success }}
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEdit({});
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{ color: colors.gray }}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const AnmeldungenTab = () => {
  const [topEvents, setTopEvents] = useState<EventRow[]>([]);
  const [attendeesByEvent, setAttendeesByEvent] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const iso = today.toISOString().slice(0, 10);

      const { data: evs } = await supabase
        .from('events')
        .select('id, event_date, start_time, location, notes, title')
        .gte('event_date', iso)
        .order('event_date', { ascending: true })
        .limit(10);

      const all = (evs as EventRow[]) ?? [];
      setTopEvents(all);

      const ids = all.map(e => e.id);
      if (ids.length === 0) {
        setAttendeesByEvent({});
        setLoading(false);
        return;
      }

      const { data: rows } = await supabase
        .from('attendance')
        .select('event_id, status, runners(display_name, email)')
        .in('event_id', ids)
        .eq('status', 'yes');

      const grouped: Record<string, any[]> = {};
      (rows ?? []).forEach((r: any) => {
        const eid = String(r.event_id);
        const attendee = {
          display_name: r.runners?.display_name ?? null,
          email: r.runners?.email ?? null
        };
        if (!grouped[eid]) grouped[eid] = [];
        grouped[eid].push(attendee);
      });

      setAttendeesByEvent(grouped);
      setLoading(false);
    };

    load();
  }, []);

  const exportCsv = (eventId: string) => {
    const list = attendeesByEvent[eventId] ?? [];
    const header = 'Name;Email\n';
    const body = list
      .map(r => `${(r.display_name ?? '').replace(/;/g, ',')};${(r.email ?? '').replace(/;/g, ',')}`)
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teilnehmer_${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-2" style={{ color: colors.primary }}>
          Anmeldungen – kommende Termine
        </h3>
        <p className="text-gray-600 mb-6">Direkte Übersicht inkl. Export pro Termin.</p>

        {loading ? (
          <p className="text-gray-600">Lade...</p>
        ) : topEvents.length === 0 ? (
          <p className="text-gray-600">Keine anstehenden Termine.</p>
        ) : (
          <div className="space-y-4">
            {topEvents.map(ev => {
              const list = attendeesByEvent[ev.id] ?? [];
              return (
                <div key={ev.id} className="p-6 rounded-xl border border-gray-200 bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">
                        {new Date(ev.event_date).toLocaleDateString('de-DE', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h4>
                      <p className="text-gray-600">
                        {ev.start_time?.slice(0, 5)} Uhr · {ev.location}
                      </p>
                      {ev.notes && (
                        <p className="text-sm italic mt-2 text-gray-500">ℹ️ {ev.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold mb-1" style={{ color: colors.primary }}>
                        {list.length}
                      </div>
                      <div className="text-sm text-gray-600 mb-3">Angemeldet</div>
                      <button
                        onClick={() => exportCsv(ev.id)}
                        disabled={list.length === 0}
                        className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: list.length > 0 ? colors.success : colors.gray,
                          color: 'white'
                        }}
                      >
                        <Download className="w-4 h-4" />
                        CSV exportieren
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap pt-4 border-t border-gray-200">
                    {list.length === 0 ? (
                      <span className="text-gray-500">Noch keine Zusagen.</span>
                    ) : (
                      list.map((p, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{ backgroundColor: colors.accent, color: colors.primary }}
                        >
                          {p.display_name ?? '—'}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const LauferTab = () => {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const query = supabase
        .from('runners')
        .select('id, display_name, email, is_admin, ical_token')
        .order('display_name', { ascending: true });

      const { data } = q
        ? await query.ilike('display_name', `%${q}%`)
        : await query;

      setRows(data ?? []);
      setLoading(false);
    };

    load();
  }, [q]);

  const exportCsv = () => {
    const header = 'Name;Email;Admin\n';
    const body = rows
      .map((r: any) =>
        `${(r.display_name ?? '').replace(/;/g, ',')};${(r.email ?? '').replace(/;/g, ',')};${r.is_admin ? 'ja' : 'nein'}`
      )
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'laeufer_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyIcs = async (r: any) => {
    if (!r?.ical_token) {
      alert('Kein iCal-Token vorhanden.');
      return;
    }
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${base}/api/ical/${r.ical_token}`;
    try {
      await navigator.clipboard.writeText(url);
      alert(`ICS-Link kopiert:\n${url}`);
    } catch {
      alert('Konnte nicht in Zwischenablage kopieren.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center flex-wrap">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suche nach Name"
          className="flex-1 min-w-[300px] px-4 py-2 rounded-lg border border-gray-300"
        />
        <button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-all disabled:opacity-50"
          style={{ backgroundColor: colors.success, color: 'white' }}
        >
          <Download className="w-4 h-4" />
          CSV exportieren
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
        {loading ? (
          <div className="p-6 text-center text-gray-600">Lade...</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-gray-600">Keine Treffer.</div>
        ) : (
          rows.map(r => (
            <div key={r.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-lg">{r.display_name}</span>
                    {r.is_admin && (
                      <span
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: colors.primary }}
                      >
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{r.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  {r.ical_token ? (
                    <button
                      onClick={() => copyIcs(r)}
                      className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
                      style={{ backgroundColor: colors.primary, color: 'white' }}
                    >
                      <Calendar className="w-4 h-4" />
                      ICS-Link
                    </button>
                  ) : (
                    <span className="text-sm text-gray-400">kein ICS-Token</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const NachrichtenTab = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [sel, setSel] = useState<string>('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('events')
        .select('id, event_date, start_time, location, title')
        .order('event_date', { ascending: true });
      setEvents((data as EventRow[]) ?? []);
    };
    load();
  }, []);

  const send = async () => {
    if (!body.trim()) return;
    setSending(true);

    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: sel ? sel : null,
        body
      })
    });

    setSending(false);

    if (!res.ok) {
      const t = await res.text();
      alert('Senden fehlgeschlagen: ' + t);
      return;
    }

    setBody('');
    alert('Nachricht versendet.');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4">
        <h3 className="text-xl font-bold" style={{ color: colors.primary }}>
          Nachrichten
        </h3>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Empfänger
          </label>
          <select
            value={sel}
            onChange={(e) => setSel(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300"
          >
            <option value="">Alle registrierten Läufer/innen</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                Nur Angemeldete für: {new Date(ev.event_date).toLocaleDateString('de-DE')} · {ev.start_time?.slice(0, 5)} · {ev.location}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Text
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 rounded-lg border border-gray-300"
            placeholder="Schreibe deine Nachricht..."
          />
        </div>

        <button
          onClick={send}
          disabled={sending || !body.trim()}
          className="px-6 py-3 rounded-lg text-white font-medium flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: colors.success }}
        >
          <Mail className="w-5 h-5" />
          {sending ? 'Senden...' : 'Senden'}
        </button>

        <p className="text-sm text-gray-600">
          Hinweis: „Empfänger = leer" → E-Mail an alle registrierten Runner (globaler Verteiler).
        </p>
      </div>
    </div>
  );
};