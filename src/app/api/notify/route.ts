import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { scope, body } = await req.json() as { scope: "all"|"attendees", body: string };
    if (!body || !scope) return new NextResponse("Bad Request", { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const from = process.env.NOTIFY_FROM_EMAIL!;
    const resendKey = process.env.RESEND_API_KEY;

    // 1) Nachricht speichern
    const ins = await fetch(`${url}/rest/v1/messages`, {
      method: "POST",
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ scope, body })
    });
    if (!ins.ok) return new NextResponse("DB error: " + (await ins.text()), { status: 500 });

    // 2) Empfänger
    const recipients = await getRecipients(url, key, scope);

    // 3) Optional E-Mail via Resend
    if (resendKey && from && recipients.length > 0) {
      await sendViaResend(resendKey, from, recipients, body);
    }

    return NextResponse.json({ ok: true, recipients: recipients.length });
  } catch (e:any) {
    return new NextResponse("Server error: " + String(e?.message ?? e), { status: 500 });
  }
}

async function getRecipients(url: string, key: string, scope: "all"|"attendees"): Promise<string[]> {
  if (scope === "all") {
    const r = await fetch(`${url}/rest/v1/runners?select=email`, {
      headers: { "apikey": key, "Authorization": `Bearer ${key}` }
    });
    const data = await r.json();
    return (data ?? []).map((x:any) => x.email).filter(Boolean);
  }
  const today = new Date().toISOString().slice(0,10);
  const evRes = await fetch(`${url}/rest/v1/events?select=id,event_date&event_date=gte.${today}&order=event_date.asc&limit=1`, {
    headers: { "apikey": key, "Authorization": `Bearer ${key}` }
  });
  const evs = await evRes.json();
  const ev = evs?.[0];
  if (!ev?.id) return [];
  const join = await fetch(`${url}/rest/v1/attendance?select=runners(email)&event_id=eq.${ev.id}&status=eq.yes`, {
    headers: { "apikey": key, "Authorization": `Bearer ${key}` }
  });
  const data = await join.json();
  return (data ?? []).map((x:any) => x.runners?.email).filter(Boolean);
}

async function sendViaResend(apiKey: string, from: string, recipients: string[], body: string) {
  const replyTo = process.env.NOTIFY_REPLY_TO; // optional
  await Promise.all(
    recipients.map(email =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from,
          to: email,
          subject: "Laufgruppe – Info",
          text: body,
          ...(replyTo ? { reply_to: replyTo } : {})
        })
      })
    )
  );
}
