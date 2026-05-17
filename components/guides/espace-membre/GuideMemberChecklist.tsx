"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { memberChecklist } from "@/lib/guides/espace-membre/guideMemberSiteData";
import { GuideSectionHeading, guideGlassClass, guideGlassSurface } from "@/components/guides/partie-publique/guidePublicUi";

const STORAGE_CHECKLIST = "tenf:guide-espace-membre:checklist:v2";

export default function GuideMemberChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CHECKLIST);
      if (raw) setChecked(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHECKLIST, JSON.stringify(checked));
    } catch {
      /* ignore */
    }
  }, [checked]);

  const progress = useMemo(() => {
    const total = memberChecklist.length;
    const done = memberChecklist.filter((i) => checked[i.id]).length;
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [checked]);

  function toggleCheck(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <section>
      <GuideSectionHeading
        title="Checklist — première semaine"
        subtitle="Coches sauvegardées localement dans ton navigateur : idéal pour ne rien oublier après ton arrivée."
      />
      <div
        className={`mt-6 overflow-hidden rounded-3xl border sm:flex ${guideGlassClass}`}
        style={guideGlassSurface("#818cf8", "base")}
      >
        <div
          className="border-b p-6 sm:w-72 sm:border-b-0 sm:border-r"
          style={{ borderColor: "color-mix(in srgb, white 8%, var(--color-border))" }}
        >
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#818cf8" }}>
            Progression
          </p>
          <p className="mt-4 text-3xl font-black tabular-nums" style={{ color: "var(--color-text)" }}>
            {progress.pct}%
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress.pct}%`, background: "linear-gradient(90deg, #818cf8, #34d399)" }}
            />
          </div>
          <p className="mt-2 text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
            {progress.done}/{progress.total} actions
          </p>
        </div>
        <ul className="flex-1 divide-y" style={{ borderColor: "color-mix(in srgb, white 8%, var(--color-border))" }}>
          {memberChecklist.map((item) => {
            const isOn = !!checked[item.id];
            return (
              <li key={item.id} className="flex items-start gap-3 p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => toggleCheck(item.id)}
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition"
                  style={{
                    borderColor: isOn ? "transparent" : "var(--color-border)",
                    backgroundColor: isOn ? "#818cf8" : "transparent",
                    color: isOn ? "#fff" : "var(--color-text-secondary)",
                  }}
                  aria-pressed={isOn}
                  aria-label={isOn ? `Décocher ${item.label}` : `Cocher ${item.label}`}
                >
                  {isOn ? <Check className="h-4 w-4" aria-hidden /> : null}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${isOn ? "line-through opacity-60" : ""}`} style={{ color: "var(--color-text)" }}>
                    {item.label}
                  </p>
                  <Link href={item.href} className="mt-1 inline-flex items-center gap-1 text-xs font-medium transition hover:gap-1.5" style={{ color: "#818cf8" }}>
                    Ouvrir
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
