// src/app/runs/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";

type Run = {
  id?: string | number;
  title: string;
  day: string;
  date: string;
  time: string;
  location: string;
  note?: string;
  type?: string;
};

function normalizeItem(x: any): Run {
  return {
    id: x?.id ?? x?.slug ?? x?._id ?? undefined,
    title: x?.title ?? [x?.day, x?.time, x?.location].filter(Boolean).join(", "),
    day: x?.day ?? "",
    date: x?.date ?? x?.when ?? "",
    time: x?.time ?? x?.hour ?? "",
    location: x?.location ?? x?.place ?? "",
    note: x?.note ?? x?.description ?? "",
    type: x?.type ?? x?.category ?? "",
  };
}

async function getRun(id: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/runs`, { cache: "no-store" });
  if (!res.ok) return null;

  const data = await res.json();
  const arr = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.runs)
    ? (data as any).runs
    : [];

  const normalized = arr.map(normalizeItem);
  return normalized.find((r) => String(r.id ?? "") === id) ?? null;
}

export default async function RunDetail({
  params,
}: {
  params: { id: string };
}) {
  const run = await getRun(params.id);
  if (!run) notFound();

  const card =
    "rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5";

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-[#00305D]">
          Termin – Details
        </h1>
        <p className="text-sm text-slate-600">Anmeldung folgt im nächsten Schritt.</p>
      </section>

      <section className={card}>
        <div className="space-y-1">
          <div className="text-lg font-semibold text-slate-900">{run.title}</div>
          <div className="text-sm text-slate-600">
            {[run.day, run.date, run.time].filter(Boolean).join(" • ")}
          </div>
          <div className="text-sm text-slate-600">{run.location}</div>
          {run.note && (
            <div className="text-sm text-slate-500">
              Hinweis: <span className="font-medium">{run.note}</span>
            </div>
          )}
          {run.type && (
            <div className="text-sm text-amber-700">
              Kategorie: <span className="font-medium">{run.type}</span>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className="rounded-md bg-[#00305D] px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-[#00294D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00305D]/40"
            // TODO: Hier später tatsächliche Anmeldung (Form/Action) einbauen.
          >
            Verbindlich anmelden
          </button>
          <Link
            href="/"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Zurück
          </Link>
        </div>
      </section>
    </div>
  );
}