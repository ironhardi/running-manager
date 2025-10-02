"use client";
import { useState } from "react";

export default function MessageComposer() {
  const [scope, setScope] = useState<"all"|"attendees">("all");
  const [body, setBody] = useState("");
  const [info, setInfo] = useState<string|null>(null);
  const [sending, setSending] = useState(false);

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    setInfo(null);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, body })
      });
      if (!res.ok) {
        setInfo("Fehler: " + (await res.text()));
        return;
      }
      const j = await res.json();
      setInfo(`OK – an ${j.recipients} Empfänger gesendet/gespeichert.`);
      setBody("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card">
      <h2>Nachricht senden</h2>
      <label>Zielgruppe</label>
      <select
        value={scope}
        onChange={e => setScope(e.target.value as "all"|"attendees")}
      >
        <option value="all">Alle Registrierten</option>
        <option value="attendees">Nur Teilnehmende (nächstes Event)</option>
      </select>

      <textarea
        rows={6}
        placeholder="Deine Nachricht"
        value={body}
        onChange={e => setBody(e.target.value)}
        style={{ width: "100%", marginTop: 8 }}
      />

      <div className="row">
        <button onClick={send} disabled={!body.trim() || sending}>
          {sending ? "Sende…" : "Senden"}
        </button>
        {info && <span className="muted">{info}</span>}
      </div>
    </div>
  );
}
