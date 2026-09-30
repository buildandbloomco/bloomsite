"use client";

import { useState } from "react";
import type { Settings } from "@/lib/types";

export default function SettingsEditor({ initial, status }: { initial: Settings; status: { stripe: boolean; webhook: boolean; db: boolean } }) {
  const [s, setS] = useState<Settings>(initial);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Settings>(k: K, v: Settings[K]) {
    setS((p) => ({ ...p, [k]: v }));
    setDirty(true);
    setMsg("");
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setMsg(data.error || "Could not save.");
    setS(data);
    setDirty(false);
    setMsg("Saved");
  }

  const text = (k: keyof Settings, label: string, hint?: string, type = "text") => (
    <label>
      {label} {hint && <span className="hint">{hint}</span>}
      <input type={type} value={String(s[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} />
    </label>
  );

  return (
    <div className="stack" style={{ gap: 20, maxWidth: 820 }}>
      <section className="panel">
        <h3>Setup check</h3>
        <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
          <li>{status.db ? "✓ Database connected" : "• Using local test storage (connect Upstash Redis on Vercel)"}</li>
          <li>{status.stripe ? "✓ Stripe connected: clients can pay online" : "• Stripe not connected yet: add STRIPE_SECRET_KEY"}</li>
          <li>{status.webhook ? "✓ Stripe webhook set" : "• Optional: add STRIPE_WEBHOOK_SECRET so payments always record, even if a client closes the tab"}</li>
        </ul>
      </section>

      <section className="panel">
        <h3>Brand & contact</h3>
        <div className="grid-2" style={{ gap: 14 }}>
          {text("brandName", "Business name")}
          {text("location", "Location")}
          {text("email", "Email", undefined, "email")}
          {text("phone", "Phone", "optional")}
          {text("website", "Website", undefined, "url")}
          {text("instagram", "Instagram link", undefined, "url")}
        </div>
        {text("tagline", "Tagline")}
      </section>

      <section className="panel">
        <h3>Booking</h3>
        {text("bookingUrl", "Free consult booking link", "Wix booking page, Calendly, Acuity...", "url")}
        <div className="checks">
          <label>
            <input type="checkbox" checked={s.bookingEmbed} onChange={() => set("bookingEmbed", !s.bookingEmbed)} />
            Show the calendar inside the portal <span className="hint">Works with Calendly. Many sites (including Wix) block this, so leave off unless you tested it.</span>
          </label>
        </div>
      </section>

      <section className="panel">
        <h3>Defaults</h3>
        <label>
          “Before you book” notes <span className="hint">Shown next to the payment summary. One per line.</span>
          <textarea value={s.beforeYouBook.join("\n")} onChange={(e) => set("beforeYouBook", e.target.value.split("\n"))} />
        </label>
        <label>
          Default next steps for new clients <span className="hint">One per line</span>
          <textarea style={{ minHeight: 140 }} value={s.defaultNextSteps.join("\n")} onChange={(e) => set("defaultNextSteps", e.target.value.split("\n"))} />
        </label>
      </section>

      {(dirty || msg) && (
        <div className="savebar" role="status">
          <span className="small">{saving ? "Saving..." : msg || "Unsaved changes"}</span>
          {dirty && <button type="button" className="btn btn-sm btn-primary" onClick={save} disabled={saving}>Save changes</button>}
        </div>
      )}
    </div>
  );
}
