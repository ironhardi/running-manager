"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfileSetup({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const [email, setEmail] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const e = data.user?.email ?? "";
      setEmail(e);
      // kleiner Komfort: Namen aus der Mail ableiten (vor dem @)
      if (e && !displayName) {
        const nick = e.split("@")[0].replace(/[._-]/g, " ");
        setDisplayName(nick.charAt(0).toUpperCase() + nick.slice(1));
      }
    });
  }, []);

  async function createProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) {
      setError("Nicht eingeloggt.");
      setSaving(false);
      return;
    }

    // prüfen, ob es doch schon ein Profil gibt
    const { data: existing } = await supabase
      .from("runners")
      .select("id")
      .eq("auth_user", uid)
      .maybeSingle();

    if (existing?.id) {
      onCreated?.();
      setSaving(false);
      return;
    }

    const { error: insErr } = await supabase.from("runners").insert({
      display_name: displayName.trim(),
      email,
      auth_user: uid,
    });

    if (insErr) {
      // bei Unique-Verletzung (race) direkt weiter
      if (insErr.code === "23505") {
        onCreated?.();
      } else {
        setError(insErr.message);
      }
      setSaving(false);
      return;
    }

    setSaving(false);
    onCreated?.();
  }

  return (
    <section className="hero" style={{ maxWidth: 520 }}>
      <h1>Profil anlegen</h1>
      <p className="hero-sub">
        Bitte gib deinen Namen an – so sehen dich die anderen Teilnehmenden.
      </p>

      <form onSubmit={createProfile} style={{ marginTop: 12 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
          Dein Name
        </label>
        <input
          type="text"
          required
          placeholder="z. B. Marco"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            marginBottom: 10,
          }}
        />

        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
          E-Mail
        </label>
        <input
          type="email"
          value={email}
          disabled
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
            color: "#6b7280",
            marginBottom: 12,
          }}
        />

        <button className="btn btn-join" type="submit" disabled={saving}>
          {saving ? "Speichern…" : "Profil speichern"}
        </button>
        {error && <p style={{ color: "#b91c1c", marginTop: 10 }}>{error}</p>}
      </form>
    </section>
  );
}