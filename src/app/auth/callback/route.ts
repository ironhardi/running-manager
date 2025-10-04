import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  // Wenn kein Code vorhanden ist, einfach zur Startseite
  if (!code) {
    return NextResponse.redirect(new URL("/", url.origin));
  }

  const supabase = createSupabaseServer();

  // Code gegen Session tauschen
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // Zurück zur Anmeldung mit Fehlermeldung
    const target = new URL("/anmelden", url.origin);
    target.searchParams.set("error", error.message);
    return NextResponse.redirect(target);
  }

  // Erfolg → auf die gewünschte Seite (oder /)
  return NextResponse.redirect(new URL(next, url.origin));
}