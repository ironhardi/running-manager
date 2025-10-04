// src/app/runs/[id]/page.tsx
type AnyRun = { id?: string | number; title?: string; note?: string; place?: string; start_at?: string; date?: string; time?: string; [k: string]: any };

function fmt(d?: string) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleString("de-DE", { weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

async function getRuns(): Promise<AnyRun[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/runs`, { cache: "no-store" });
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.runs)) return data.runs;
    return [];
  } catch {
    return [];
  }
}

export default async function RunDetail({ params }: { params: { id: string } }) {
  const runs = await getRuns();
  const run = runs.find(r => String(r.id ?? "") === params.id) ?? runs[0];

  if (!run) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold text-slate-900">Termin nicht gefunden</h1>
        <p className="mt-2 text-sm text-slate-600">Bitte zur Startseite zurückkehren.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-slate-900">Termin-Details</h1>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm ring-1 ring-black/[0.02]">
        <div className="text-[15px] font-medium text-slate-900">{run.title ?? "Lauf"}</div>
        <div className="mt-1 text-sm text-slate-700">
          {fmt(run.start_at ?? run.date)} {run.time ? `· ${run.time}` : ""} {run.place ? `· ${run.place}` : ""}
        </div>
        {run.note && (
          <p className="mt-3 text-sm text-slate-700">{run.note}</p>
        )}
      </div>
    </main>
  );
}