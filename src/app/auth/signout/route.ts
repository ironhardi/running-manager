import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = createRouteHandlerClient({ cookies });

  try {
    await supabase.auth.signOut();
    
    // Nach erfolgreichem Logout zur Anmeldeseite
    return NextResponse.redirect(new URL('/anmelden', requestUrl.origin));
    
  } catch (error) {
    console.error('Logout error:', error);
    
    // Auch bei Fehler zur Anmeldeseite (sicherer)
    return NextResponse.redirect(new URL('/anmelden', requestUrl.origin));
  }
}

// Optional: GET-Handler für direkten Link-Zugriff
export async function GET(request: Request) {
  return POST(request);
}