// src/lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  throw new Error('Supabase-Umgebungsvariablen fehlen.');
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});