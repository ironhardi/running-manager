"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type EventRow = {
  id: string | number;
  event_date: string;          // date
  start_time: string | null;   // time
  location: string | null;
  notes: string | null;
  title?: string | null;
};

export default function EventList() {
  const [runnerId, setRunnerId] = useState<string | number | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [namesByEvent, setNamesByEvent] = useState<Record<string, string[]>>({});
  const [myStatus, setMyStatus] = useState<Record<string, "yes" | "no" | undefined>>({});
  const [loading, setLoading] = useState(true);

  const k = (id: string | number) => String(id);

  // ---- Loader helpers -------------------------------------------------------
  async function loadRunnerId() {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id ?? null;
    if (!uid) { setRunnerId(null); return; }
    const { data: r } = await supabase.from("runners").select("id").eq("auth_user", uid).maybeSingle();
    setRunnerId(r?.id ?? null);
  }

  async function loadEvents(): Promise<EventRow[]> {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("events")
      .select("id,event_date,start_time,location,notes,title")
      .gte("event_date", today)
      .order("event_date", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async function loadCounts(ids: string[]) {
    const map: Record<string, number> = {};
    const { data, error } = await supabase
      .from("v_attendee_counts")
      .select("event_id,cnt")
      .in("event_id", ids);
    if (!error && data) {
      data.forEach((row: any) => (map[k(row.event_id)] = Number(row.cnt)));
      return map;
    }
    const { data: raw } = await supabase
      .from("attendance")
      .select("event_id,status")
      .in("event_id", ids)
      .eq("status", "yes");
    (raw ?? []).forEach((r: any) => { const key = k(r.event_id); map[key] = (map[key] ?? 0) + 1; });
    return map;
  }

  async function loadNames(ids: string[]) {
    const { data } = await supabase
      .from("v_attendees")
      .select("event_id,display_name")
      .in("event_id", ids);
    const map: Record<string, string[]> = {};
    (data ?? []).forEach((row: any) => {
      const key = k(row.event_id);
      if (!map[key]) map[key] = [];
      map[key].push(row.display_name);
    });
    return map;
  }

  async function loadMyStatus(ids: string[]) {
    if (!runnerId) return {};
    const { data } = await supabase
      .from("attendance")
      .select("event_id,status")
      .eq("runner_id", runnerId)
      .in("event_id", ids);
    const map: Record<string, "yes" | "no"> = {};
    (data ?? []).forEach((a: any) => (map[k(a.event_id)] = a.status));
    return map;
  }

  async function refreshOne(evId: string | number) {
    const key = k(evId);
    const [c, n, s] = await Promise.all([
      loadCounts([key]),
      loadNames([key]),
      loadMyStatus([key]),
    ]);
    setCounts((p) => ({ ...p, [key]: c[key] ?? 0 }));
    setNamesByEvent((p) => ({ ...p, [key]: n[key] ?? [] }));
    setMyStatus((p) => ({ ...p, [key]: s[key] }));
  }

  // ---- initial load ---------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadRunnerId();
        const evs = await loadEvents();
        setEvents(evs);
        const ids = evs.map((e) => k(e.id));
        const [cMap, nMap, sMap] = await Promise.all([
          loadCounts(ids),
          loadNames(ids),
          loadMyStatus(ids),
        ]);
        setCounts(cMap);
        setNamesByEvent(nMap);
        setMyStatus(sMap);
      } catch (e) {
        console.error("Fehler beim Initial-Laden:", e);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runnerId]);

  // ---- safe toggle (update bevorzugt, insert fallback) ----------------------
  async function toggle(evId: string | number, newStatus: "yes" | "no") {
    if (!runnerId) { alert("Bitte zuerst ein Profil anlegen / einloggen."); return; }

    const key = k(evId);

    // Existiert der Datensatz schon?
    const { data: existing, error: exErr } = await supabase
      .from("attendance")
      .select("runner_id,event_id,status")
      .eq("runner_id", runnerId)
      .eq("event_id", evId)
      .maybeSingle();

    if (exErr) {
      console.error("Fehler beim Prüfen des Datensatzes:", exErr);
      alert("Konnte Teilnahme nicht prüfen. Bitte später erneut versuchen.");
      return;
    }

    // 1) UPDATE (wenn vorhanden)
    if (existing) {
      const { error: updErr } = await supabase
        .from("attendance")
        .update({ status: newStatus })
        .eq("runner_id", runnerId)
        .eq("event_id", evId);

      if (updErr) {
        console.error("Update fehlgeschlagen:", updErr);
        alert("Abmelden/Anmelden nicht erlaubt (RLS/Policy?).");
        return;
      }
    } else {
      // 2) INSERT (wenn noch keiner existiert)
      const { error: insErr } = await supabase
        .from("attendance")
        .insert({ runner_id: runnerId, event_id: evId, status: newStatus });

      if (insErr) {
        console.error("Insert fehlgeschlagen:", insErr);
        alert("Anmelden nicht möglich (RLS/Policy?).");
        return;
      }
    }

    // UI (optimistisch) und danach echte Zahlen/Namen frisch laden
    setMyStatus((p) => ({ ...p, [key]: newStatus }));
    await refreshOne(evId);
  }

  // ---- render ---------------------------------------------------------------
  if (loading) return <div className="event-list"><p>Lade…</p></div>;
  if (!events.length) return <div className="event-list"><p>Keine kommenden Läufe.</p></div>;

  const [next, ...rest] = events;

  return (
    <div className="event-list">
      <EventCard
        ev={next}
        count={counts[k(next.id)] ?? 0}
        names={namesByEvent[k(next.id)] ?? []}
        joined={myStatus[k(next.id)] === "yes"}
        onJoin={() => toggle(next.id, "yes")}
        onLeave={() => toggle(next.id, "no")}
      />
      {rest.map((ev) => (
        <EventCard
          key={k(ev.id)}
          ev={ev}
          count={counts[k(ev.id)] ?? 0}
          names={namesByEvent[k(ev.id)] ?? []}
          joined={myStatus[k(ev.id)] === "yes"}
          onJoin={() => toggle(ev.id, "yes")}
          onLeave={() => toggle(ev.id, "no")}
        />
      ))}
    </div>
  );
}

function EventCard({
  ev, count, names, joined, onJoin, onLeave,
}: {
  ev: EventRow;
  count: number;
  names: string[];
  joined?: boolean;
  onJoin: () => void;
  onLeave: () => void;
}) {
  const date = new Date(ev.event_date).toLocaleDateString("de-DE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const time = ev.start_time ? ev.start_time.slice(0, 5) : "";
  const preview = names.slice(0, 4);
  const more = Math.max(0, names.length - preview.length);

  return (
    <div className="event-card">
      <div className="event-left">
        <div className="event-title">{date}</div>
        {(time || ev.location) && (
          <div className="event-sub">
            {time ? `${time} Uhr` : ""}{time && ev.location ? " · " : ""}{ev.location ?? ""}
          </div>
        )}
        {ev.notes && <div className="note-badge">ℹ︎ {ev.notes}</div>}
      </div>

      <div className="count-wrap">
        <div className="count-row">
          <div className="count-label">👥 Angemeldet</div>
          <div className="count">{count}</div>
        </div>

        {preview.length > 0 && (
          <div className="names">
            {preview.join(", ")}{more ? ` … (+${more})` : ""}
          </div>
        )}

        {joined ? (
          <button className="btn btn-leave" onClick={onLeave}>✖ Abmelden</button>
        ) : (
          <button className="btn btn-join" onClick={onJoin}>✓ Anmelden</button>
        )}
      </div>
    </div>
  );
}