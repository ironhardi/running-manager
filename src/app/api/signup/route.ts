// src/app/api/signup/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const { run_id, name, email } = await req.json();

    if (!run_id || !name || !email) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Optional: Hochschul-Domain prüfen
    const allowed = ['fh-kiel.de', 'student.fh-kiel.de', 'haw-kiel.de', 'student.haw-kiel.de'];
    const domain = String(email).split('@')[1] ?? '';
    if (!allowed.includes(domain)) {
      return NextResponse.json({ error: 'Bitte Hochschuladresse verwenden.' }, { status: 422 });
    }

    const { error } = await supabaseAdmin
      .from('signups')
      .insert({ run_id, name, email });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Optional: interne Benachrichtigung (falls gewünscht)
    // await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notify2`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ scope: 'all', body: `Neue Anmeldung: ${name} (${email})` }),
    // });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}