import { NextResponse } from "next/server";

export async function GET() {
  const hasResend = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith("re_"));
  const hasFrom = Boolean(process.env.NOTIFY_FROM_EMAIL);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Test: wie viele Empfänger würden wir für "all" sehen?
  let recipients = -1;
  if (url && key) {
    try {
      const r = await fetch(`${url}/rest/v1/runners?select=email`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }
      });
      const data = await r.json();
      recipients = (data ?? []).map((x: any) => x.email).filter(Boolean).length;
    } catch {
      // ignorieren
    }
  }

  return NextResponse.json({
    env: {
      RESEND_API_KEY: hasResend ? "present" : "missing",
      NOTIFY_FROM_EMAIL: hasFrom ? "present" : "missing",
      NEXT_PUBLIC_SUPABASE_URL: Boolean(url),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(key),
    },
    recipients
  });
}