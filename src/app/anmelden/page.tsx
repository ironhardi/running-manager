"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AnmeldenPage() {
  const router = useRouter();
  const params = useSearchParams();
  const err = params.get("error");

  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const base =
        process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // WICHTIG: richtiger Pfad für App Router
          emailRedirectTo: `${base}/auth/callback`,
        },
      });
      if (error) throw error;
      setSent(true);
      setMsg("E-Mail gesendet. Bitte Posteingang prüfen.");
    } catch (e: any) {
      setMsg(e.message ?? "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-2">Anmelden</h1>
      <p className="text-sm text-neutral-600 mb-6">
        Bitte E-Mail eingeben. Du bekommst einen Magic-Link.
      </p>

      {err && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {msg && (
        <div className="mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {msg}
        </div>
      )}

      {!sent ? (
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@beispiel.de"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-[#00305D]"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-[#00305D] px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Sende..." : "Magic-Link senden"}
          </button>
        </form>
      ) : (
        <button
          className="mt-2 text-sm underline"
          onClick={() => router.refresh()}
        >
          Erneut versuchen
        </button>
      )}
    </div>
  );
}