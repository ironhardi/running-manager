"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setOk(null);
    setErr(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });

    if (error) {
      setErr(error.message);
      setSending(false);
      return;
    }
    setOk("Magic-Link gesendet. Prüfe dein Postfach und klicke auf den Link.");
    setSending(false);
  }

  return (
    <section className="hero" style={{ maxWidth: 520 }}>
      <h1>Anmelden</h1>
      <p className="hero-sub">Wir senden dir einen Magic-Link per E-Mail.</p>
      <form onSubmit={sendMagicLink} style={{ marginTop: 12 }}>
        <input
          type="email"
          required
          placeholder="dein.name@beispiel.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            marginBottom: 10,
          }}
        />
        <button className="btn btn-join" type="submit" disabled={sending}>
          {sending ? "Senden…" : "Magic-Link senden"}
        </button>

        {ok && <p style={{ color: "#065f46", marginTop: 10 }}>{ok}</p>}
        {err && <p style={{ color: "#b91c1c", marginTop: 10 }}>{err}</p>}

        <button
          type="button"
          className="btn-logout"
          style={{ marginLeft: 8 }}
          onClick={() => { router.push("/"); }}
        >
          Zurück
        </button>
      </form>
    </section>
  );
}