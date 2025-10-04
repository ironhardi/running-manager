// src/app/page.tsx
import { Suspense } from 'react';

type Run = {
  id: string | number;
  date: string;
  start_time?: string;
  title?: string;
  note?: string;
  pace?: string;
};

async function fetchRuns(): Promise<Run[]> {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/runs`, { cache: 'no-store' });

  if (!res.ok) return [];
  const json = await res.json();
  return json.runs ?? [];
}

function fmtDate(d: string) {
  try {
    return new Intl.DateTimeFormat('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    }).format(new Date(d));
  } catch {
    return d;
  }
}

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export default async function HomePage() {
  const runs = await fetchRuns();

  // „Nächster Termin“ = erstes Datum in der Zukunft, sonst erstes
  const now = new Date();
  const upcoming =
    runs.find((r) => new Date(r.date) >= new Date(now.toDateString())) ??
    runs[0];
  const others = runs.filter((r) => r !== upcoming);

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Kopfzeile klein & ruhig */}
      <div className="flex items-center gap-3">
        <img
          src="/brand/haw-logo-small.png"
          alt="HAW Kiel"
          className="h-8 w-auto"
        />
        <span className="text-sm text-slate-500">Laufgruppe</span>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-haw-blue">
          Laufgruppe – Termine & Anmeldung
        </h1>
        <p className="text-sm text-slate-500">
          Willkommen! Diese Startseite folgt dem CD der HAW Kiel:
          viel Weißraum, klare Linien, FH-Blau <code>#00305D</code>.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6">
        {/* Nächster Termin */}
        <Card>
          <div className="p-4">
            <div className="text-xs font-medium text-slate-500 mb-2">
              Nächster Termin
            </div>
            {upcoming ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {upcoming.start_time ? `${upcoming.start_time}, ` : ''}
                    {upcoming.title ?? '–'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {fmtDate(upcoming.date)}
                    {upcoming.pace ? ` · ${upcoming.pace}` : ''}
                  </div>
                  {upcoming.note && (
                    <div className="mt-1 text-xs text-slate-500">
                      {upcoming.note}
                    </div>
                  )}
                </div>
                <button
                  className="inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm
                             border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                >
                  Details
                </button>
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                Noch kein Termin geplant.
              </div>
            )}
          </div>
        </Card>

        {/* Weitere Termine */}
        {others.length > 0 && (
          <Card>
            <div className="p-4">
              <div className="text-xs font-medium text-slate-500 mb-3">
                Weitere Termine
              </div>
              <ul className="divide-y divide-slate-100">
                {others.map((r) => (
                  <li key={r.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {r.start_time ? `${r.start_time}, ` : ''}
                        {r.title ?? '–'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {fmtDate(r.date)}
                        {r.pace ? ` · ${r.pace}` : ''}
                      </div>
                    </div>
                    <button
                      className="inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm
                                 border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                    >
                      Details
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        )}
      </section>

      <footer className="pt-8 border-t text-xs text-slate-400">
        © {new Date().getFullYear()} HAW Kiel – Laufgruppe
      </footer>

      {/* Ladefallback falls nötig für spätere Suspense-Stellen */}
      <Suspense fallback={null} />
    </main>
  );
}