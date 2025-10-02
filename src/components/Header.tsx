"use client";

import Image from "next/image";
import Link from "next/link";              // <- FEHLTE
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Header() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data: s } = await supabase.auth.getSession();
      const session = s.session;
      if (!mounted) return;
      setEmail(session?.user?.email ?? null);

      if (session?.user?.id) {
        const { data: r } = await supabase
          .from("runners")
          .select("is_admin")
          .eq("auth_user", session.user.id)
          .maybeSingle();
        if (!mounted) return;
        setIsAdmin(!!r?.is_admin);
      } else {
        setIsAdmin(false);
      }
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setEmail(session?.user?.email ?? null);
      if (session?.user?.id) {
        supabase
          .from("runners")
          .select("is_admin")
          .eq("auth_user", session.user.id)
          .maybeSingle()
          .then(({ data }) => setIsAdmin(!!data?.is_admin));
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    try {
      setBusy(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout-Fehler:", error);
        alert("Abmelden nicht möglich. Bitte erneut versuchen.");
        setBusy(false);
        return;
      }
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="header">
      <div className="header-left">
        <Image
          src="/logo-hawkiel.svg"
          alt="HAW Kiel Laufgruppe"
          width={40}
          height={40}
          className="header-logo"
          priority
        />
        <div>
          <div className="header-title">Lauf Manager</div>
          <div className="header-subtitle">
            Laufgruppe HAW Kiel{email ? ` · ${email}` : ""}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {isAdmin && (
          <Link href="/admin" className="admin-button">
            Adminbereich
          </Link>
        )}
        {email ? (
          <button
            className="btn-logout"
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? "Abmelden…" : "Abmelden"}
          </button>
        ) : (
          <button
            className="btn-logout"
            type="button"
            onClick={() => router.push("/login")}
          >
            Anmelden
          </button>
        )}
      </div>
    </header>
  );
}