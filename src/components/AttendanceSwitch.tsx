"use client";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";

type Attendee = { display_name: string; email: string };
type EventRow = {
  id: string;
  event_date: string;
  start_time?: string;
  location?: string;
  notes?: string | null;
  title?: string | null;
};

export default function AttendanceSwitch() {
  const [runnerId, setRunnerId] = useState<string | null>(null);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [status, setStatus] = useState<"yes" | "no" | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [upcoming, setUpcoming] = useState<EventRow[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const session = (await supabase.auth.getSession()).data.session;

      // Runner-ID
      if (session) {
        const { data: runner } = await supabase
          .from("runners")
          .select("id")
          .eq("auth_user", session.user.id)
          .maybeSingle();
        setRunnerId(runner?.id ?? null);
      }

      // Kommende Events
      const today = new Date().toISOString().slice(0, 10);
      const { data: list } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(12);
      const next = (list ?? [])[0] ?? null;
      setEvent(next);
      setUpcoming(list ?? []);

      // Status + Teilnehmer für nächstes Event
      if (next?.id && runnerId) {
        const { data: att } = await supabase
          .from("attendance")
          .select("status")
          .eq("runner_id", runnerId)
          .eq("event_id", next.id)
          .maybeSingle();
        setStatus(att?.status ?? null);
      }
      if (next?.id) {
        const { data: listAtt } = await supabase
          .from("v_attendees")
          .select("display_name,email")
          .eq("event_id", next.id);
        setAttendees(listAtt ?? []);
      }

      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async (newStatus: "yes" | "no", evId?: string) => {
    if (!runnerId || !(evId || event?.id)) return;
    const targetId = evId ?? event!.id;

    await supabase.from("attendance").upsert({
      runner_id: runnerId,
      event_id: targetId,
      status: newStatus,
    });

    if (!evId) setStatus(newStatus); // nur beim nächsten Lauf

    // Teilnehmerliste für nächstes Event aktualisieren
    if (!evId && event) {
      const { data: listAtt } = await supabase
        .from("v_attendees")
        .select("display_name,email")
        .eq("event_id", event.id);
      setAttendees(listAtt ?? []);
    }
  };

  if (loading) return <div className="card">Lade…</div>;
  if (!event) return <div className="card">Kein kommender Lauf angelegt.</div>;

  const dateLabel = new Date(event.event_date).toLocaleDateString();
  const timeLabel = event.start_time ? String(event.start_time).slice(0, 5) : null;

  return (
    <div className="card" aria-live="polite">
      <h2 style={{ marginBottom: 6 }}>
        Nächster Lauf: {dateLabel}
        {timeLabel ? ` – ${timeLabel} Uhr` : ""}
      </h2>
      {event.location && (
        <p className="smallmuted" style={{ margin: 0 }}>
          📍 {event.location}
        </p>
      )}
      {event.notes && (
        <p style={{ margin: "8px 0 0" }}>
          <span className="badge-note">ℹ︎ {event.notes}</span>
        </p>
      )}

      <div className="row" style={{ marginTop: 12 }}>
        <button
          className="btn btn-yes"
          onClick={() => toggle("yes")}
          disabled={status === "yes"}
          aria-pressed={status === "yes"}
        >
          ✔︎ Ich komme
        </button>
        <button
          className="btn btn-no"
          onClick={() => toggle("no")}
          disabled={status === "no"}
          aria-pressed={status === "no"}
        >
          ✖︎ Ich komme nicht
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        <strong>Teilnehmer bisher:</strong>
        {attendees.length === 0 ? (
          <p className="smallmuted" style={{ marginTop: 6 }}>
            Noch keine Zusagen.
          </p>
        ) : (
          <ul style={{ margin: "6px 0 0 18px" }}>
            {attendees.slice(0, 6).map((a) => (
              <li key={a.email}>{a.display_name}</li>
            ))}
            {attendees.length > 6 && (
              <li className="smallmuted">
                + {attendees.length - 6} weitere…
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Weitere Termine */}
      {upcoming.length > 1 && (
        <div className="upcoming">
          <h3 style={{ marginTop: 20 }}>Weitere Termine</h3>

          {/* die nächsten 3 */}
          {upcoming.slice(1, 4).map((ev) => {
            const d = new Date(ev.event_date).toLocaleDateString();
            const t = ev.start_time ? String(ev.start_time).slice(0, 5) : "";
            return (
              <div className="upcoming-card" key={ev.id}>
                <div>
                  <strong>
                    {d}
                    {t ? ` – ${t} Uhr` : ""}
                  </strong>
                  {ev.location && (
                    <div className="smallmuted">📍 {ev.location}</div>
                  )}
                  {ev.notes && (
                    <div style={{ marginTop: 4 }}>
                      <span className="badge-note">ℹ︎ {ev.notes}</span>
                    </div>
                  )}
                </div>
                <div className="row" style={{ marginTop: 6 }}>
                  <button
                    className="btn btn-yes"
                    onClick={() => toggle("yes", ev.id)}
                  >
                    ✔︎ Ich komme
                  </button>
                  <button
                    className="btn btn-no"
                    onClick={() => toggle("no", ev.id)}
                  >
                    ✖︎ Ich komme nicht
                  </button>
                </div>
              </div>
            );
          })}

          {/* restliche Termine */}
          {upcoming.length > 4 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="link"
              style={{ marginTop: 10 }}
            >
              ➕ Alle anzeigen
            </button>
          )}

          {showAll &&
            upcoming.slice(4).map((ev) => {
              const d = new Date(ev.event_date).toLocaleDateString();
              const t = ev.start_time ? String(ev.start_time).slice(0, 5) : "";
              return (
                <div className="upcoming-card" key={ev.id}>
                  <div>
                    <strong>
                      {d}
                      {t ? ` – ${t} Uhr` : ""}
                    </strong>
                    {ev.location && (
                      <div className="smallmuted">📍 {ev.location}</div>
                    )}
                    {ev.notes && (
                      <div style={{ marginTop: 4 }}>
                        <span className="badge-note">ℹ︎ {ev.notes}</span>
                      </div>
                    )}
                  </div>
                  <div className="row" style={{ marginTop: 6 }}>
                    <button
                      className="btn btn-yes"
                      onClick={() => toggle("yes", ev.id)}
                    >
                      ✔︎ Ich komme
                    </button>
                    <button
                      className="btn btn-no"
                      onClick={() => toggle("no", ev.id)}
                    >
                      ✖︎ Ich komme nicht
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}