import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(
          new URL(`/anmelden?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        );
      }

      // Erfolgreich eingeloggt - weiter zur Startseite oder next-Parameter
      return NextResponse.redirect(new URL(next, requestUrl.origin));
      
    } catch (err) {
      console.error('Unexpected error in auth callback:', err);
      return NextResponse.redirect(
        new URL('/anmelden?error=Ein unerwarteter Fehler ist aufgetreten', requestUrl.origin)
      );
    }
  }

  // Kein Code vorhanden - zurück zur Anmeldung
  return NextResponse.redirect(
    new URL('/anmelden?error=Kein Authentifizierungscode gefunden', requestUrl.origin)
  );
}