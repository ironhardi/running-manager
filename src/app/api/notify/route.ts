import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ version: "v3-fixed" });
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json() as { eventId?: string | null; body?: string; text?: string };

    // Body/Text holen
    const messageBody = (json?.text ?? json?.body ?? "").toString().trim();
    if (!messageBody) {
      return new NextResponse("Bad Request: missing text/body", { status: 400 });
    }

    // Scope ermitteln: wenn eventId gesetzt → attendees, sonst all
    const scope: "all" | "attendees" = json.eventId ? "attendees" : "all";

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const from = process.env.NOTIFY_FROM_EMAIL!;
    const resendKey = process.env.RESEND_API_KEY;

    if (!url || !key) {
      return new NextResponse("Missing Supabase config", { status: 500 });
    }

    // 1) Nachricht in DB speichern
    const ins = await fetch(`${url}/rest/v1/messages`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ 
        scope, 
        body: messageBody,
        event_id: json.eventId || null 
      }),
    });

    if (!ins.ok) {
      const t = await ins.text();
      console.error("DB error:", t);
      return new NextResponse("DB error: " + t, { status: 500 });
    }

    // 2) Empfänger ermitteln
    const recipients = await getRecipients(url, key, scope, json.eventId);
    console.log(`Found ${recipients.length} recipients for scope=${scope}`);

    // 3) Via Resend versenden
    let mailed = 0;
    if (resendKey && from && recipients.length > 0) {
      mailed = await sendViaResend(resendKey, from, recipients, messageBody);
      console.log(`Mailed ${mailed} of ${recipients.length} emails`);
    } else {
      console.warn("Resend not configured or no recipients");
    }

    return NextResponse.json({
      ok: true,
      scope,
      eventId: json.eventId,
      recipients: recipients.length,
      mailed,
    });
  } catch (e: any) {
    console.error("Server error:", e);
    return new NextResponse("Server error: " + String(e?.message ?? e), { status: 500 });
  }
}

/* ---------- Helpers ---------- */

async function getRecipients(
  url: string, 
  key: string, 
  scope: "all" | "attendees",
  eventId?: string | null
): Promise<string[]> {
  
  if (scope === "all") {
    // Alle Läufer
    const r = await fetch(`${url}/rest/v1/runners?select=email`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const data = await r.json();
    return (data ?? []).map((x: any) => x.email).filter(Boolean);
  }

  // Attendees: für spezifisches Event oder nächstes Event
  let targetEventId = eventId;

  if (!targetEventId) {
    // Nächstes Event finden
    const today = new Date().toISOString().slice(0, 10);
    const evRes = await fetch(
      `${url}/rest/v1/events?select=id,event_date&event_date=gte.${today}&order=event_date.asc&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    const evs = await evRes.json();
    targetEventId = evs?.[0]?.id;
  }

  if (!targetEventId) {
    console.warn("No event found for attendees");
    return [];
  }

  // Teilnehmer dieses Events holen
  const join = await fetch(
    `${url}/rest/v1/attendance?select=runners(email)&event_id=eq.${targetEventId}&status=eq.yes`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  const data = await join.json();
  const emails = (data ?? []).map((x: any) => x.runners?.email).filter(Boolean);
  
  console.log(`Found ${emails.length} attendees for event ${targetEventId}`);
  return emails;
}

async function sendViaResend(
  apiKey: string, 
  from: string, 
  recipients: string[], 
  body: string
): Promise<number> {
  const replyTo = process.env.NOTIFY_REPLY_TO;
  let sent = 0;

  const results = await Promise.allSettled(
    recipients.map(async (email) => {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: email,
          subject: "Laufgruppe – Info",
          text: body,
          ...(replyTo ? { reply_to: replyTo } : {}),
        }),
      });
      
      if (!res.ok) {
        const error = await res.text();
        console.error(`Failed to send to ${email}:`, error);
        throw new Error(error);
      }
      
      return res.json();
    })
  );

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      sent++;
      console.log(`Sent to ${recipients[i]}`);
    } else {
      console.error(`Failed to send to ${recipients[i]}:`, result.reason);
    }
  });

  return sent;
}