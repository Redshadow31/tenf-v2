"use client";

import { useState } from "react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";

export default function MemberDeclareRaidPage() {
  const [form, setForm] = useState({ target: "", date: "", note: "" });

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Declarer un raid"
        description="Prepare ta declaration de raid. La soumission membre sera branchee des que le flux est disponible."
        badge="A venir"
      />
      <section className="rounded-xl border p-5 space-y-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <div>
          <label className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Cible du raid
          </label>
          <input
            value={form.target}
            onChange={(e) => setForm((prev) => ({ ...prev, target: e.target.value }))}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            placeholder="Pseudo Twitch cible"
          />
        </div>
        <div>
          <label className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Date du raid
          </label>
          <input
            type="datetime-local"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
          />
        </div>
        <div>
          <label className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Note (optionnel)
          </label>
          <textarea
            rows={3}
            value={form.note}
            onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
          />
        </div>
        <button
          type="button"
          disabled
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white opacity-70"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Soumission bientot disponible
        </button>
      </section>
    </MemberSurface>
  );
}
