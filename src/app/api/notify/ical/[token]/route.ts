import { NextResponse } from "next/server";

// Wir verwenden hier bewusst den Service-Role Key, weil der Request
// anonym ist (Kalender-Subscriber). Zugriff wird über das geheime Token begrenzt.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type Row = {
  id: string | number;
  event_date: string;          // YYYY-MM-DD
  start_time: string | null;   // HH:MM:SS (oder null = ganztägig)
  location: string | null;
  notes: string | null;
  title?: string | null;
};

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const token = params.token?.trim();
  if (!token) return new NextResponse("Missing token", { status: 400 });

  // 1) Runner zu Token auflösen
  const rRes = await fetch(`${SUPABASE_URL}/rest/v1/runners?select=id,display_name&ical_token=eq.${encodeURIComponent(token)}`, {
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` },
    cache: "no-store",
  });
  if (!rRes.ok) return new NextResponse("Token lookup failed", { status: 500 });
  const runners = await rRes.json();
  const runner = runners?.[0];
  if (!runner?.id) return new NextResponse("Not found", { status: 404 });

  // 2) Zuge­sagte Termine (attendance.status = 'yes')
  //    Optional: Nur zukünftige (>= heute)
  const today = new Date().toISOString().slice(0, 10);
  const aRes = await fetch(
    `${SUPABASE_URL}/rest/v1/attendance?select=event_id&runner_id=eq.${runner.id}&status=eq.yes`,
    { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` }, cache: "no-store" }
  );
  if (!aRes.ok) return new NextResponse("Attendance query failed", { status: 500 });
  const aRows: { event_id: number | string }[] = await aRes.json();
  const ids = [...new Set(aRows.map(a => a.event_id))];
  if (ids.length === 0) return icsResponse(emptyCalendar(runner.display_name ?? "Runner"));

  // Events holen (nur kommende)
  const inFilter = ids.map(id => `id.in.(${id})`).length ? `id=in.(${ids.join(",")})` : "";
  const eRes = await fetch(
    `${SUPABASE_URL}/rest/v1/events?select=id,event_date,start_time,location,notes,title&${inFilter}&event_date=gte.${today}`,
    { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` }, cache: "no-store" }
  );
  if (!eRes.ok) return new NextResponse("Events query failed", { status: 500 });
  const events: Row[] = await eRes.json();

  const ical = buildCalendar({
    prodId: "-//Lauf Manager HAW Kiel//DE",
    calName: `Lauf Manager – Zusagen (${runner.display_name ?? "Runner"})`,
    tzid: "Europe/Berlin",
    baseUrl: SUPABASE_URL,
    runnerId: runner.id,
    events,
  });

  return icsResponse(ical);
}

/* ---------------- ICS-Helfer ---------------- */

function icsResponse(body: string) {
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="laufmanager.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

function emptyCalendar(name: string) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lauf Manager HAW Kiel//DE",
    `X-WR-CALNAME:Lauf Manager – Zusagen (${escapeText(name)})`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "END:VCALENDAR",
    ""
  ].join("\r\n");
}

function buildCalendar(opts: {
  prodId: string;
  calName: string;
  tzid: string;
  baseUrl: string;
  runnerId: string | number;
  events: Row[];
}) {
  const now = formatICSDate(new Date()); // UTC-Zeitstempel für DTSTAMP
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${opts.prodId}`,
    `X-WR-CALNAME:${escapeText(opts.calName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    // Minimales TZ-Handling: viele Clients interpretieren lokale Zeiten korrekt;
    // für exakte Regeln könnte man ein VTIMEZONE einfügen. Für MVP reicht es so.
  ];

  for (const ev of opts.events) {
    // UID stabilisieren: pro Runner + Event
    const uid = `runner-${opts.runnerId}-event-${ev.id}@laufmanager`;
    // DTSTART/DTEND
    let dtStart = "";
    let dtEnd = "";
    if (ev.start_time) {
      // Uhrzeit bekannt → Termin von start_time bis +1h
      const start = localDateTime(ev.event_date, ev.start_time);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // +1h
      dtStart = `DTSTART:${formatICSDateLocal(start)}`;
      dtEnd = `DTEND:${formatICSDateLocal(end)}`;
    } else {
      // Ganztägig
      const d = ev.event_date.replaceAll("-", "");
      dtStart = `DTSTART;VALUE=DATE:${d}`;
      // Ganztägige End-Dates sind exklusiv → +1 Tag
      const end = addDaysISO(ev.event_date, 1).replaceAll("-", "");
      dtEnd = `DTEND;VALUE=DATE:${end}`;
    }

    const summary = ev.title?.trim()
      ? ev.title
      : `Lauf – ${formatHuman(ev.event_date)}${ev.start_time ? `, ${ev.start_time.slice(0,5)} Uhr` : ""}`;
    const location = ev.location ?? "";
    const description = ev.notes ?? "";

    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeText(uid)}`,
      `DTSTAMP:${now}`,
      dtStart,
      dtEnd,
      `SUMMARY:${escapeText(summary)}`,
      location ? `LOCATION:${escapeText(location)}` : undefined,
      description ? `DESCRIPTION:${escapeText(description)}` : undefined,
      "END:VEVENT"
    ).filter(Boolean as any);
  }

  lines.push("END:VCALENDAR", "");
  return lines.join("\r\n");
}

/* ---------- kleine Format-Helfer ---------- */

function escapeText(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
function pad2(n: number) { return n.toString().padStart(2, "0"); }

function formatICSDate(d: Date) {
  // UTC Zulu
  return (
    d.getUTCFullYear().toString() +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate()) + "T" +
    pad2(d.getUTCHours()) +
    pad2(d.getUTCMinutes()) +
    pad2(d.getUTCSeconds()) + "Z"
  );
}
function formatICSDateLocal(d: Date) {
  // lokale „floating time“ ohne Z; viele Clients interpretieren das als lokale Zeitzone
  return (
    d.getFullYear().toString() +
    pad2(d.getMonth() + 1) +
    pad2(d.getDate()) + "T" +
    pad2(d.getHours()) +
    pad2(d.getMinutes()) +
    pad2(d.getSeconds())
  );
}
function localDateTime(isoDate: string, time: string) {
  // isoDate = YYYY-MM-DD, time = HH:MM[:SS]
  const [y, m, d] = isoDate.split("-").map(Number);
  const [hh, mm, ss] = time.split(":").map(Number);
  return new Date(y, (m - 1), d, hh, mm || 0, ss || 0);
}
function addDaysISO(isoDate: string, days: number) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, (m - 1), d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${pad2(dt.getMonth()+1)}-${pad2(dt.getDate())}`;
}
function formatHuman(isoDate: string) {
  try {
    return new Date(isoDate).toLocaleDateString("de-DE", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });
  } catch { return isoDate; }
}