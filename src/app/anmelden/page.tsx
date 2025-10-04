// src/app/anmelden/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SignupPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const run = sp.get('run') ?? '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const disabled = useMemo(() => !name || !email || busy, [name, email, busy]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ run_id: run, name, email }),
    });

    const json = await res.json();
    setBusy(false);

    if (!res.ok) {
      setMsg(json?.error ?? 'Fehler bei der Anmeldung.');
      return;
    }
    setMsg('Danke! Deine Anmeldung wurde eingetragen.');
    setTimeout(() => router.push('/'), 1200);
  }

  useEffect(() => {
    if (!run) setMsg('Kein Termin angegeben.');
  }, [run]);

  return (
    <main className="container-fh py-8">
      <h1 className="h1 mb-6">Anmeldung</h1>

      <form onSubmit={submit} className="max-w-md space-y-4 rounded-[var(--radius-card)] border border-slate-200/70 bg-white p-5 shadow-[var(--shadow-soft)]">
        <div>
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--fh-blue)]"
            value={name} onChange={(e)=>setName(e.target.value)} required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">E-Mail (Hochschule)</label>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--fh-blue)]"
            type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required
            placeholder="vorname.nachname@student.haw-kiel.de"
          />
        </div>

        <div className="flex gap-2">
          <button
            disabled={disabled}
            className="rounded-lg bg-[var(--fh-blue)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? 'Sende…' : 'Anmelden'}
          </button>
          <a href="/" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 hover:bg-slate-50">
            Abbrechen
          </a>
        </div>

        {msg && (
          <p className="text-sm text-slate-700">{msg}</p>
        )}
      </form>
    </main>
  );
}