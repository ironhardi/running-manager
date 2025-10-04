// src/app/api/runs/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type Run = {
  id: string | number;
  date: string;        // ISO (YYYY-MM-DD)
  start_time?: string; // z.B. "18:00"
  title?: string;      // z.B. "Sportplatz"
  note?: string;       // kurzer Text
  pace?: string;       // z.B. "5–7 km locker"
};

export async function GET() {
  // TODO: passe Spaltennamen an deine Tabelle an!
  const { data, error } = await supabaseAdmin
    .from('runs')
    .select('id, date, start_time, title, note, pace')
    .order('date', { ascending: true })
    .limit(20);

  if (error) {
    return NextResponse.json({ runs: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ runs: data as Run[] });
}