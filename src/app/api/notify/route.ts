import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/notify
 * Erwartet JSON:
 *   {
 *     scope: "all" | "attendees" | "" (optional; "" => "all"),
 *     text?: string,     // vom Admin-Formular
 *     body?: string      // ältere Clients
 *   }
 */
export async function POST(req: NextRequest) {
  try {
    // Payload robust parsen
    const payload: any = await req.json().catch(() => ({}));

    // text ODER body akzeptieren
    const textRaw = (payload?.text ?? payload?.body ?? "").toString();
    const text = textRaw.trim();

    // Scope tolerant behandeln ("" oder undefined => "all")
    const scopeRaw = (payload?.scope ?? "").toString().toLowerCase().trim();
    const scope: "all" | "attendees" =
      scopeRaw === "attendees" || scopeRaw === "teilnehmer"
        ? "attendees"
        : "all";

    if (!text) {
      return new NextResponse("Bad Request: missing text", { status: 400 });
    }

    // ENV lesen
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const from = process.env.NOTIFY_FROM_EMAIL;
    const resendKey = process.env.RESEND_API_KEY;

    if (!url || !key) {
      return new NextResponse(
        "Server config error: SUPABASE URL/KEY missing",
        { status: 500 }
      );
    }

    // 1) Nachricht speichern
    const ins = await fetch(`${url}/rest/v1/messages`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ scope, body: text }),
    });

    if (!ins.ok) {
      const t = await ins.text();
      return new NextResponse("DB error: " + t, { status: 500 });
    }

    // 2) Empfänger ermitteln
    const recipients = await getRecipients(url, key, scope);

    // 3) Optional E-Mail via Resend
    let mailed = 0;
    if (resendKey && from && recipients.length > 0) {
      mailed = await sendViaResend(resendKey, from, recipients, text);
    }

    return NextResponse.json({
      ok: true,
      scope,
      saved: true,
      recipients: recipients.length,
      mailed,
    });
  } catch (e: any) {
    return new NextResponse(
      "Server error: " + String(e?.message ?? e),
      { status: 500 }
    );
  }
}

/* ---------- Helpers ---------- */

async function getRecipients(
  url: string,
  key: string,
  scope: "all" | "attendees"
): Promise<string[]> {
  if (scope === "all") {
    const r = await fetch(`${url}/rest/v1/runners?select=email`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const data = await r.json();
    return (data ?? []).map((x: any) => x.email).filter(Boolean);
  }

  // attendees = Zusagen für den nächsten Termin
  const today = new Date().toISOString().slice(0, 10);
  const evRes = await fetch(
    `${url}/rest/v1/events?select=id,event_date&event_date=gte.${today}&order=event_date.asc&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  const evs = await evRes.json();
  const ev = evs?.[0];
  if (!ev?.id) return [];

  const join = await fetch(
    `${url}/rest/v1/attendance?select=runners(email)&event_id=eq.${ev.id}&status=eq.yes`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  const data = await join.json();
  return (data ?? []).map((x: any) => x.runners?.email).filter(Boolean);
}

async function sendViaResend(
  apiKey: string,
  from: string,
  recipients: string[],
  text: string
): Promise<number> {
  const replyTo = process.env.NOTIFY_REPLY_TO; // optional
  let sent = 0;

  await Promise.all(
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
          text,
          ...(replyTo ? { reply_to: replyTo } : {}),
        }),
      });
      if (res.ok) sent++;
    })
  );

  return sent;
}