"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import EventList from "@/components/EventList";
import ProfileSetup from "@/components/ProfileSetup";

export default function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [needsProfile, setNeedsProfile] = useState<boolean>(false);
  const [checkingProfile, setCheckingProfile] = useState<boolean>(true);

  // Login-Status beobachten
  useEffect(() => {
    let mounted = true;

    async function detect() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const loggedIn = !!data.session;
      setAuthed(loggedIn);

      if (!loggedIn) {
        setNeedsProfile(false);
        setCheckingProfile(false);
        return;
      }

      // Profil prüfen
      const uid = data.session?.user?.id;
      const { data: r, error } = await supabase
        .from("runners")
        .select("id")
        .eq("auth_user", uid!)
        .maybeSingle();

      if (!mounted) return;
      setNeedsProfile(!r?.id);
      setCheckingProfile(false);

      if (error) console.error("Profil-Check Fehler:", error);
    }

    detect();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setAuthed(!!session);
      if (!session) {
        setNeedsProfile(false);
        setCheckingProfile(false);
      } else {
        // bei neuem Login erneut prüfen
        setCheckingProfile(true);
        supabase
          .from("runners")
          .select("id")
          .eq("auth_user", session.user.id)
          .maybeSingle()
          .then(({ data: r }) => {
            setNeedsProfile(!r?.id);
            setCheckingProfile(false);
          });
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (authed === null || checkingProfile) return null; // kurze Ladephase

  // Nicht eingeloggt → Teaser + Login
  if (!authed) {
    return (
      <section className="hero">
        <h1>Kommende Läufe</h1>
        <p className="hero-sub">
          Schnür die Schuhe und sei dabei – melde dich an, um deine Teilnahme zu verwalten.
        </p>
        <Link href="/login" className="btn btn-join" style={{ display: "inline-block", marginTop: 12 }}>
          Anmelden
        </Link>
      </section>
    );
  }

  // Eingeloggt, aber noch kein Profil → Profil-Setup
  if (needsProfile) {
    return (
      <ProfileSetup
        onCreated={() => {
          // Nach erfolgreicher Profilerstellung: Seite neu laden/refresh,
          // dann wird automatisch die EventList angezeigt.
          window.location.reload();
        }}
      />
    );
  }

  // Eingeloggt + Profil vorhanden → normale Ansicht
  return (
    <>
      <section className="hero">
        <h1>Kommende Läufe</h1>
        <p className="hero-sub">
          Schnür die Schuhe und sei dabei – melde dich jetzt für die nächsten Termine an.
        </p>
      </section>
      <EventList />
    </>
  );
}