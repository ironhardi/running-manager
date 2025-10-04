import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!url || !serviceRole) {
    return NextResponse.json(
      { error: "Supabase URL oder SERVICE_ROLE Key fehlt" },
      { status: 500 }
    );
  }

  const admin = createClient(url, serviceRole, { auth: { persistSession: false } });

  // Hole nur zukünftige Läufe
  const now = new Date().toISOString();
  
  const { data, error } = await admin
    .from("events")
    .select(`
      id,
      title,
      event_date,
      location,
      start_time,
      notes,
      created_at
    `)
    .gte("event_date", now.split('T')[0])
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(20);

  if (error) {
    console.error("Supabase Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Für jeden Lauf die Teilnehmer laden
  const runsWithAttendees = await Promise.all(
    (data ?? []).map(async (run) => {
      const startDateTime = `${run.event_date}T${run.start_time || '00:00:00'}`;
      
      // Hole alle Teilnehmer mit Status "yes"
      const { data: attendances } = await admin
        .from("attendance")
        .select(`
          status,
          runners (
            display_name,
            email
          )
        `)
        .eq("event_id", run.id)
        .eq("status", "yes");

      const attendeeNames = (attendances || [])
        .map((a: any) => a.runners?.display_name || "Unbekannt")
        .filter(Boolean);

      return {
        id: run.id,
        title: run.title,
        start_at: startDateTime,
        location: run.location,
        note: run.notes,
        attendees: attendeeNames.length,
        attendeeNames: attendeeNames
      };
    })
  );

  return NextResponse.json({ runs: runsWithAttendees }, { status: 200 });
}