"use client";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [stage, setStage] = useState<"login"|"register"|"ready">("login");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const ensureRunner = async () => {
      const { data: runner } = await supabase
        .from("runners").select("id").eq("auth_user", session.user.id).maybeSingle();
      if (!runner) setStage("register"); else setStage("ready");
    };
    ensureRunner();
  }, [session]);

  if (!session) {
    return (
      <div className="card">
        <h2>Login</h2>
        <p className="muted">Magic-Link per E-Mail.</p>
        <div className="row">
          <input placeholder="E-Mail" value={email} onChange={e=>setEmail(e.target.value)} />
          <button onClick={async ()=>{
            if (!email) return;
            await supabase.auth.signInWithOtp({
              email,
              options: { emailRedirectTo: window.location.origin }
            });
            alert("Magic-Link gesendet. Bitte E-Mail prüfen.");
          }}>Link schicken</button>
        </div>
      </div>
    );
  }

  if (stage === "register") {
    return (
      <div className="card">
        <h2>Registrierung</h2>
        <div className="row">
          <input placeholder="Anzeigename (z. B. Vorname)"
                 value={displayName} onChange={e=>setDisplayName(e.target.value)} />
          <button onClick={async ()=>{
            if (!displayName) return;
            const { error } = await supabase.from("runners").insert({
              auth_user: session.user.id,
              display_name: displayName,
              email: session.user.email
            });
            if (error) { alert(error.message); return; }
            setStage("ready");
          }}>Profil anlegen</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
