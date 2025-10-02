"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ---------- kleine Helfer ---------- */

type Tab = "events" | "attendees" | "runners" | "messages";
function cx(...xs: (string | false | undefined)[]) { return xs.filter(Boolean).join(" "); }
function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("de-DE", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });
  } catch { return d; }
}

/* ---------- Seite ---------- */

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<Tab>("events");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user?.id;
      if (!uid) { setIsAdmin(false); setLoading(false); return; }
      const { data: r } = await supabase.from("runners").select("is_admin").eq("auth_user", uid).maybeSingle();
      setIsAdmin(!!r?.is_admin);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="hero"><p>Lade…</p></div>;
  if (!isAdmin) return (
    <section className="hero">
      <h1>Kein Zugriff</h1>
      <p className="hero-sub">Du benötigst Admin-Rechte, um diesen Bereich zu sehen.</p>
    </section>
  );

  return (
    <>
      <section className="hero" style={{ marginBottom: 16 }}>
        <h1>Adminbereich</h1>
        <p className="hero-sub">Verwalte Termine, Teilnehmer, Läufer und Nachrichten.</p>
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className={cx("btn", tab==="events"?"btn-join":"btn-logout")} onClick={()=>setTab("events")}>Termine</button>
          <button className={cx("btn", tab==="attendees"?"btn-join":"btn-logout")} onClick={()=>setTab("attendees")}>Teilnehmer</button>
          <button className={cx("btn", tab==="runners"?"btn-join":"btn-logout")} onClick={()=>setTab("runners")}>Läufer</button>
          <button className={cx("btn", tab==="messages"?"btn-join":"btn-logout")} onClick={()=>setTab("messages")}>Nachrichten</button>
        </div>
      </section>

      {tab === "events" && <EventsAdmin />}
      {tab === "attendees" && <AttendeesAdmin />}
      {tab === "runners" && <RunnersAdmin />}
      {tab === "messages" && <MessagesAdmin />}
    </>
  );
}

/* =========================================================
   Termine – lesen / erstellen / bearbeiten / duplizieren / löschen
   ========================================================= */

type EventRow = {
  id: number | string;
  event_date: string;
  start_time: string | null;
  location: string;
  notes: string | null;
};

function EventsAdmin() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Formular für NEU
  const [event_date, setEventDate] = useState("");
  const [start_time, setStartTime] = useState("16:15");
  const [location, setLocation] = useState("Haupteingang Mehrzweckgebäude, FH Kiel");
  const [notes, setNotes] = useState("");

  // Edit-Zustand
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [edit, setEdit] = useState<Partial<EventRow>>({});

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("id,event_date,start_time,location,notes")
      .order("event_date", { ascending: true });
    if (error) console.error(error);
    setEvents((data as EventRow[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function createEv(e: React.FormEvent) {
    e.preventDefault();
    if (!event_date) return;
    const { error } = await supabase.from("events").insert({
      event_date,
      start_time: start_time || null,
      location,
      notes: notes || null,
    });
    if (error) { alert(error.message); return; }
    setEventDate(""); setNotes("");
    await load();
  }

  function startEdit(ev: EventRow) {
    setEditingId(ev.id);
    setEdit({
      event_date: ev.event_date,
      start_time: ev.start_time ?? "",
      location: ev.location,
      notes: ev.notes ?? "",
    });
  }
  function cancelEdit() { setEditingId(null); setEdit({}); }

  async function saveEdit(id: number | string) {
    const payload = {
      event_date: edit.event_date,
      start_time: edit.start_time || null,
      location: edit.location,
      notes: (edit.notes ?? "").trim() || null,
    };
    const { error } = await supabase.from("events").update(payload).eq("id", id);
    if (error) { alert(error.message); return; }
    setEditingId(null);
    await load();
  }

  async function dupEv(ev: EventRow) {
    const newDate = prompt("Neues Datum für Duplikat (YYYY-MM-DD)", ev.event_date);
    if (!newDate) return;
    const { error } = await supabase.from("events").insert({
      event_date: newDate,
      start_time: ev.start_time,
      location: ev.location,
      notes: ev.notes,
    });
    if (error) { alert(error.message); return; }
    await load();
  }

  async function delEv(id: number | string) {
    if (!confirm("Termin wirklich löschen?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    await load();
  }

  return (
    <div className="list-stack">
      {/* Neu anlegen */}
      <div className="hero" style={{ display: "grid", gap: 8 }}>
        <h2 style={{ margin: 0 }}>Neuen Termin anlegen</h2>
        <form
          onSubmit={createEv}
          style={{ display:"grid", gap:8, gridTemplateColumns:"160px 120px 1fr", alignItems:"center" }}
        >
          <input type="date" required value={event_date} onChange={(e)=>setEventDate(e.target.value)}
                 style={{ padding:"8px 10px", borderRadius:8, border:"1px solid #d1d5db" }}/>
          <input type="time" value={start_time} onChange={(e)=>setStartTime(e.target.value)}
                 style={{ padding:"8px 10px", borderRadius:8, border:"1px solid #d1d5db" }}/>
          <input type="text" value={location} onChange={(e)=>setLocation(e.target.value)}
                 placeholder="Ort" style={{ padding:"8px 10px", borderRadius:8, border:"1px solid #d1d5db" }}/>
          <input type="text" value={notes} onChange={(e)=>setNotes(e.target.value)}
                 placeholder="Notiz (optional)" style={{ gridColumn:"1 / -1", padding:"8px 10px", borderRadius:8, border:"1px solid #d1d5db" }}/>
          <button className="btn btn-join" type="submit" style={{ width:160 }}>Speichern</button>
        </form>
      </div>

      {/* Liste */}
      <div>
        <h2 style={{ margin:"8px 0" }}>Alle Termine</h2>
        {loading ? <p>Lade…</p> : events.length===0 ? <p>Noch keine Termine vorhanden.</p> : (
          <div className="list-stack">
            {events.map((ev) => {
              const isEditing = editingId === ev.id;
              return (
                <div key={ev.id} className="event-card" style={{ gridTemplateColumns: "1fr auto" }}>
                  <div className="event-left">
                    {!isEditing ? (
                      <>
                        <div className="event-title">{fmtDate(ev.event_date)}</div>
                        <div className="event-sub">{(ev.start_time ?? "").slice(0,5)} Uhr · {ev.location}</div>
                        {ev.notes && <div className="note-badge">ℹ︎ {ev.notes}</div>}
                      </>
                    ) : (
                      <div style={{ display:"grid", gap: 6, gridTemplateColumns: "160px 120px 1fr" }}>
                        <input type="date" required value={edit.event_date ?? ""} onChange={(e)=>setEdit(v=>({...v, event_date:e.target.value}))}
                               style={{ padding:"8px 10px", borderRadius:8, border:"1px solid #d1d5db" }}/>
                        <input type="time" value={edit.start_time ?? ""} onChange={(e)=>setEdit(v=>({...v, start_time:e.target.value}))}
                               style={{ padding:"8px 10px", borderRadius:8, border:"1px solid #d1d5db" }}/>
                        <input type="text" value={edit.location ?? ""} onChange={(e)=>setEdit(v=>({...v, location:e.target.value}))}
                               placeholder="Ort" style={{ padding:"8px 10px", borderRadius:8, border:"1px solid #d1d5db" }}/>
                        <input type="text" value={edit.notes ?? ""} onChange={(e)=>setEdit(v=>({...v, notes:e.target.value}))}
                               placeholder="Notiz (optional)" style={{ gridColumn:"1 / -1", padding:"8px 10px", borderRadius:8, border:"1px solid #d1d5db" }}/>
                      </div>
                    )}
                  </div>

                  <div className="count-wrap" style={{ gap: 8 }}>
                    {!isEditing ? (
                      <>
                        <button className="btn" onClick={()=>setEditingId(ev.id)}>Bearbeiten</button>
                        <button className="btn" onClick={()=>dupEv(ev)}>Duplizieren</button>
                        <button className="btn btn-leave" onClick={()=>delEv(ev.id)}>Löschen</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-join" onClick={()=>saveEdit(ev.id)}>Speichern</button>
                        <button className="btn btn-logout" onClick={cancelEdit}>Abbrechen</button>
                      </>
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
}

/* =========================================================
   Teilnehmer – nächste 3 als Kacheln + Dropdown für den Rest
   ========================================================= */

type Attendee = { display_name: string | null; email: string | null };
type AttendeeMap = Record<string, Attendee[]>;

function AttendeesAdmin() {
  const [topEvents, setTopEvents] = useState<EventRow[]>([]);
  const [otherEvents, setOtherEvents] = useState<EventRow[]>([]);
  const [attendeesByEvent, setAttendeesByEvent] = useState<AttendeeMap>({});
  const [loading, setLoading] = useState(true);
  const [selectedOther, setSelectedOther] = useState<string>("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const today = new Date(); today.setHours(0,0,0,0);
      const iso = today.toISOString().slice(0,10);

      const { data: evs } = await supabase
        .from("events")
        .select("id,event_date,start_time,location,notes")
        .gte("event_date", iso)
        .order("event_date", { ascending: true });

      const all = (evs as EventRow[]) ?? [];
      const top = all.slice(0, 3);
      const rest = all.slice(3);
      setTopEvents(top);
      setOtherEvents(rest);
      if (!rest.length) setSelectedOther("");

      const ids = all.map(e => e.id);
      if (ids.length === 0) { setAttendeesByEvent({}); setLoading(false); return; }

      const { data: rows, error } = await supabase
        .from("attendance")
        .select("event_id,status,runners(display_name,email)")
        .in("event_id", ids)
        .eq("status", "yes");

      if (error) console.error(error);

      const grouped: AttendeeMap = {};
      (rows ?? []).forEach((r: any) => {
        const eid = String(r.event_id);
        const a: Attendee = { display_name: r.runners?.display_name ?? null, email: r.runners?.email ?? null };
        if (!grouped[eid]) grouped[eid] = [];
        grouped[eid].push(a);
      });
      setAttendeesByEvent(grouped);
      setLoading(false);
    })();
  }, []);

  function exportCsv(eventId: number|string) {
    const list = attendeesByEvent[String(eventId)] ?? [];
    const header = "Name;Email\n";
    const body = list
      .map(r => `${(r.display_name ?? "").replace(/;/g,",")};${(r.email ?? "").replace(/;/g,",")}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `teilnehmer_${eventId}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="list-stack">
      <div className="hero" style={{ marginBottom: 8 }}>
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Teilnehmer – nächste 3 Termine</h2>
        <p className="hero-sub">Direkte Übersicht inkl. Export pro Termin.</p>
      </div>

      {loading ? (
        <p className="hero-sub">Lade…</p>
      ) : (!topEvents.length && !otherEvents.length) ? (
        <p className="hero-sub">Keine anstehenden Termine.</p>
      ) : (
        <>
          <div className="list-stack">
            {topEvents.map(ev => {
              const list = attendeesByEvent[String(ev.id)] ?? [];
              return (
                <div key={ev.id} className="event-card" style={{ gridTemplateColumns: "1fr auto" }}>
                  <div className="event-left">
                    <div className="event-title">{fmtDate(ev.event_date)}</div>
                    <div className="event-sub">{(ev.start_time ?? "").slice(0,5)} Uhr · {ev.location}</div>
                    {ev.notes && <div className="note-badge">ℹ︎ {ev.notes}</div>}
                    <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {list.length === 0 ? (
                        <span className="hero-sub">Noch keine Zusagen.</span>
                      ) : (
                        list.map((p, i) => (
                          <span key={i} style={{
                            background:"#eef2ff", border:"1px solid #c7d2fe",
                            color:"#1e3a8a", padding:"4px 8px", borderRadius: 999
                          }}>
                            {p.display_name ?? "—"}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="count-wrap" style={{ gap: 8, alignItems:"flex-start" }}>
                    <div className="count-label">Angemeldet</div>
                    <div className="count">{list.length}</div>
                    <button className="btn btn-join" onClick={()=>exportCsv(ev.id)} disabled={list.length===0}>
                      CSV exportieren
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {otherEvents.length > 0 && (
            <div className="hero" style={{ marginTop: 8, display:"grid", gap:8 }}>
              <h3 style={{ margin: 0 }}>Weitere Termine</h3>
              <select
                value={selectedOther}
                onChange={(e)=>setSelectedOther(e.target.value)}
                style={{ padding:"8px 10px", borderRadius:8, border:"1px solid #d1d5db", maxWidth:520 }}
              >
                <option value="">– Termin wählen –</option>
                {otherEvents.map(ev => (
                  <option key={ev.id} value={String(ev.id)}>
                    {fmtDate(ev.event_date)} · {(ev.start_time ?? "").slice(0,5)} · {ev.location}
                  </option>
                ))}
              </select>

              {selectedOther && (() => {
                const ev = otherEvents.find(e => String(e.id) === selectedOther)!;
                const list = attendeesByEvent[String(ev.id)] ?? [];
                return (
                  <div className="event-card" style={{ gridTemplateColumns:"1fr auto" }}>
                    <div className="event-left">
                      <div className="event-title">{fmtDate(ev.event_date)}</div>
                      <div className="event-sub">{(ev.start_time ?? "").slice(0,5)} Uhr · {ev.location}</div>
                      {ev.notes && <div className="note-badge">ℹ︎ {ev.notes}</div>}
                      <div style={{ marginTop: 10, display:"flex", gap:6, flexWrap:"wrap" }}>
                        {list.length === 0 ? (
                          <span className="hero-sub">Noch keine Zusagen.</span>
                        ) : (
                          list.map((p, i) => (
                            <span key={i} style={{
                              background:"#eef2ff", border:"1px solid #c7d2fe",
                              color:"#1e3a8a", padding:"4px 8px", borderRadius: 999
                            }}>
                              {p.display_name ?? "—"}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="count-wrap" style={{ gap:8, alignItems:"flex-start" }}>
                      <div className="count-label">Angemeldet</div>
                      <div className="count">{list.length}</div>
                      <button className="btn btn-join" onClick={()=>exportCsv(ev.id)} disabled={list.length===0}>
                        CSV exportieren
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* =========================================================
   Läufer – Liste & Suche + CSV-Export + ICS-Link-kopieren (mit Kalendersymbol)
   ========================================================= */

function RunnersAdmin() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ (async ()=>{
    setLoading(true);
    const query = supabase
      .from("runners")
      .select("id,display_name,email,is_admin,ical_token")   // <-- ical_token mitladen
      .order("display_name", { ascending: true });

    const { data } = q ? await query.ilike("display_name", `%${q}%`) : await query;
    setRows(data ?? []);
    setLoading(false);
  })(); }, [q]);

  function exportCsv() {
    const header = "Name;Email;Admin\n";
    const body = rows.map((r:any) =>
      `${(r.display_name ?? "").replace(/;/g,",")};${(r.email ?? "").replace(/;/g,",")};${r.is_admin ? "ja" : "nein"}`
    ).join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `laeufer_export.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  async function copyIcs(r:any) {
    if (!r?.ical_token) { alert("Kein iCal-Token vorhanden."); return; }
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${base}/api/ical/${r.ical_token}`;
    try {
      await navigator.clipboard.writeText(url);
      alert(`ICS-Link kopiert:\n${url}`);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = url; document.body.appendChild(el);
      el.select(); document.execCommand("copy"); document.body.removeChild(el);
      alert(`ICS-Link kopiert:\n${url}`);
    }
  }

  return (
    <div className="hero">
      <h2 style={{ marginTop: 0 }}>Läufer</h2>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        <input
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          placeholder="Suche nach Name"
          style={{ padding:"8px 10px", borderRadius:8, border:"1px solid #d1d5db", width:"100%", maxWidth:380 }}
        />
        <button className="btn btn-join" onClick={exportCsv} disabled={rows.length===0}>
          CSV exportieren
        </button>
      </div>

      <div style={{ marginTop:12 }}>
        {loading ? <p>Lade…</p> :
          rows.length===0 ? <p>Keine Treffer.</p> : (
            <ul style={{ paddingLeft: 18 }}>
              {rows.map(r => (
                <li key={r.id} style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  <span>
                    <strong>{r.display_name}</strong> <span style={{ color:"#6b7280" }}>({r.email})</span>
                    {r.is_admin && <span style={{ marginLeft:8, color:"#065f46" }}>• Admin</span>}
                  </span>

                  {/* ICS-Link kopieren mit Kalendersymbol */}
                  {r.ical_token ? (
                    <button className="icon-btn" onClick={()=>copyIcs(r)} title="ICS-Link kopieren">
                      {/* Kalender-Icon (inline SVG) */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                        <path d="M7 2a1 1 0 0 0-1 1v1H5a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-1V3a1 1 0 1 0-2 0v1H8V3a1 1 0 0 0-1-1ZM5 8h14v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8Zm3 3h3v3H8v-3Z"/>
                      </svg>
                      <span>ICS-Link</span>
                    </button>
                  ) : (
                    <span className="hero-sub" style={{ fontSize:12 }}>kein ICS-Token</span>
                  )}
                </li>
              ))}
            </ul>
          )
        }
      </div>
    </div>
  );
}

/* =========================================================
   Nachrichten – an alle Registrierten oder nur Angemeldete eines Termins
   (verwendet /api/notify)
   ========================================================= */

function MessagesAdmin() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [sel, setSel] = useState<number | string | "">("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(()=>{ (async ()=>{
    const { data } = await supabase
      .from("events")
      .select("id,event_date,start_time,location")
      .order("event_date", { ascending: true });
    setEvents((data as any[]) ?? []);
  })(); }, []);

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    const res = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ eventId: sel ? sel : null, body }),
    });
    setSending(false);
    if (!res.ok) { const t = await res.text(); alert("Senden fehlgeschlagen: " + t); return; }
    setBody(""); alert("Nachricht versendet.");
  }

  return (
    <div className="hero" style={{ display:"grid", gap:8 }}>
      <h2 style={{ marginTop: 0 }}>Nachrichten</h2>

      <label style={{ fontWeight:600 }}>Empfänger</label>
      <select value={sel as any} onChange={(e)=>setSel(e.target.value)}
              style={{ padding:"8px 10px", borderRadius:8, border:"1px solid #d1d5db", maxWidth:520 }}>
        <option value="">Alle registrierten Läufer/innen</option>
        {events.map(ev => (
          <option key={ev.id} value={ev.id}>
            Nur Angemeldete für: {fmtDate(ev.event_date)} · {(ev.start_time ?? "").slice(0,5)} · {ev.location}
          </option>
        ))}
      </select>

      <label style={{ fontWeight:600, marginTop:6 }}>Text</label>
      <textarea value={body} onChange={(e)=>setBody(e.target.value)}
                rows={6} style={{ padding:"10px 12px", borderRadius:8, border:"1px solid #d1d5db" }}/>
      <div>
        <button className="btn btn-join" onClick={send} disabled={sending || !body.trim()}>
          {sending ? "Senden…" : "Senden"}
        </button>
      </div>

      <p className="hero-sub" style={{ marginTop:4 }}>
        Hinweis: „Empfänger = leer“ → E-Mail an alle registrierten Runner (globaler Verteiler).
      </p>
    </div>
  );
}