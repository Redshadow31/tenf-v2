"use client";

import { User, Wand2 } from "lucide-react";
import { useState } from "react";
import type { SlPiece, SpotlightTabPanel } from "./spotlightGuidePanels";

const TWITCH_PURPLE = "#9146FF";

function PieceBlock({ piece }: { piece: SlPiece }) {
  switch (piece.t) {
    case "intro":
      return (
        <div className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
          {piece.title ? (
            <h3 className="text-base font-bold sm:text-lg" style={{ color: "var(--color-text)" }}>
              {piece.title}
            </h3>
          ) : null}
          <p className={`text-sm leading-relaxed sm:text-base ${piece.title ? "mt-2" : ""}`} style={{ color: "var(--color-text-secondary)" }}>
            {piece.p}
          </p>
          {piece.list?.length ? (
            <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--color-text)" }}>
              {piece.list.map((li) => (
                <li key={li} className="flex gap-2">
                  <span className="text-violet-400" aria-hidden>
                    •
                  </span>
                  {li}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    case "h2":
      return (
        <h3 className="flex items-center gap-2 text-lg font-bold sm:text-xl" style={{ color: TWITCH_PURPLE }}>
          <span aria-hidden>{piece.emoji}</span>
          {piece.title}
        </h3>
      );
    case "grid":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {piece.cells.map((cell) => (
            <div
              key={cell.title}
              className="rounded-2xl border p-4 sm:p-5"
              style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-card) 92%, transparent)" }}
            >
              <p className="text-sm font-bold sm:text-base" style={{ color: TWITCH_PURPLE }}>
                {cell.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {cell.body}
              </p>
            </div>
          ))}
        </div>
      );
    case "callout": {
      const border =
        piece.mode === "purple"
          ? "rgba(139, 92, 246, 0.55)"
          : piece.mode === "amber"
            ? "rgba(251, 191, 36, 0.45)"
            : piece.mode === "red"
              ? "rgba(185, 28, 28, 0.5)"
              : "rgba(139, 92, 246, 0.45)";
      const bg =
        piece.mode === "purple"
          ? "rgba(139, 92, 246, 0.08)"
          : piece.mode === "amber"
            ? "rgba(251, 191, 36, 0.06)"
            : piece.mode === "red"
              ? "rgba(127, 29, 29, 0.12)"
              : "rgba(139, 92, 246, 0.1)";
      return (
        <div className="rounded-2xl border-2 p-5 sm:p-6" style={{ borderColor: border, backgroundColor: bg }}>
          <h3 className="flex flex-wrap items-center gap-2 text-base font-bold sm:text-lg" style={{ color: "var(--color-text)" }}>
            {piece.emoji ? <span aria-hidden>{piece.emoji}</span> : null}
            {piece.title}
          </h3>
          <ul className="mt-3 list-none space-y-2.5 text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            {piece.lines.map((line) => (
              <li key={line}>
                {line}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case "lurker":
      return (
        <div className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
          <h3 className="flex items-center gap-2 text-base font-bold sm:text-lg" style={{ color: "var(--color-text)" }}>
            <span aria-hidden>{piece.emoji}</span>
            {piece.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            {piece.p}
          </p>
          <ul className="mt-4 space-y-3">
            {piece.perks.map((x) => (
              <li key={x.k} className="rounded-xl border px-3 py-2.5 text-sm" style={{ borderColor: "var(--color-border)" }}>
                <span className="font-semibold" style={{ color: TWITCH_PURPLE }}>
                  {x.k}
                </span>
                <span style={{ color: "var(--color-text-secondary)" }}> — {x.d}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "micro":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {piece.items.map((it) => (
            <div
              key={it.title}
              className="rounded-2xl border p-4 text-center sm:text-left"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <p className="text-2xl" aria-hidden>
                {it.emoji}
              </p>
              <p className="mt-1 text-sm font-bold" style={{ color: "var(--color-text)" }}>
                {it.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed sm:text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {it.hint}
              </p>
            </div>
          ))}
        </div>
      );
    case "anti":
      return (
        <div className="rounded-2xl border-2 border-red-900/45 bg-red-950/10 p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-bold sm:text-lg" style={{ color: "rgb(252, 165, 165)" }}>
            <span aria-hidden>{piece.emoji}</span>
            {piece.title}
          </h3>
          <ul className="mt-4 space-y-3">
            {piece.rows.map((row) => (
              <li key={row.title}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {row.title}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {row.desc}
                </p>
              </li>
            ))}
          </ul>
        </div>
      );
    case "timeline":
      return (
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold sm:text-xl" style={{ color: TWITCH_PURPLE }}>
            <span aria-hidden>{piece.emoji}</span>
            {piece.title}
          </h3>
          <ol className="mt-4 space-y-2">
            {piece.steps.map((s) => (
              <li
                key={s.range}
                className="flex items-center gap-3 rounded-xl border px-3 py-3 sm:px-4"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
              >
                <span className="w-20 shrink-0 text-xs font-bold tabular-nums text-violet-300 sm:text-sm">{s.range}</span>
                <span className="text-lg" aria-hidden>
                  {s.emoji}
                </span>
                <span className="text-sm font-medium sm:text-base" style={{ color: "var(--color-text)" }}>
                  {s.title}
                </span>
              </li>
            ))}
          </ol>
        </div>
      );
    case "rules":
      return (
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold sm:text-xl" style={{ color: TWITCH_PURPLE }}>
            <span aria-hidden>{piece.emoji}</span>
            {piece.title}
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {piece.items.map((it) => (
              <div
                key={it.title}
                className="rounded-2xl border p-4 sm:p-5"
                style={{
                  borderColor: it.highlight ? "rgba(139, 92, 246, 0.75)" : "var(--color-border)",
                  borderWidth: it.highlight ? 2 : 1,
                  backgroundColor: it.highlight ? "rgba(139, 92, 246, 0.07)" : "color-mix(in srgb, var(--color-card) 94%, transparent)",
                  boxShadow: it.highlight ? "0 0 0 1px rgba(139, 92, 246, 0.25)" : undefined,
                }}
              >
                <p className="text-sm font-bold sm:text-base" style={{ color: it.highlight ? TWITCH_PURPLE : "var(--color-text)" }}>
                  {it.title}
                </p>
                {it.desc ? (
                  <p className="mt-2 text-xs leading-relaxed sm:text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {it.desc}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}

export function SpotlightChapterTabs({ panels }: { panels: SpotlightTabPanel[] }) {
  const [tab, setTab] = useState<"viewer" | "streamer">("viewer");
  const active = panels.find((p) => p.id === tab) ?? panels[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4" role="tablist" aria-label="Perspective Spotlight">
        {panels.map((p) => {
          const selected = tab === p.id;
          const Icon = p.tabIcon === "wand" ? Wand2 : User;
          return (
            <button
              key={p.id}
              id={`spotlight-tab-${p.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(p.id)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3.5 text-sm font-semibold transition sm:py-4 sm:text-base"
              style={{
                borderColor: selected ? TWITCH_PURPLE : "var(--color-border)",
                backgroundColor: selected ? TWITCH_PURPLE : "var(--color-surface)",
                color: selected ? "#fff" : "var(--color-text-secondary)",
                boxShadow: selected ? "0 8px 28px rgba(145, 70, 255, 0.35)" : undefined,
              }}
            >
              <Icon className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
              {p.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`spotlight-panel-${tab}`} aria-labelledby={`spotlight-tab-${tab}`} className="space-y-8">
        {active.pieces.map((piece, idx) => (
          <PieceBlock key={`${tab}-${idx}`} piece={piece} />
        ))}
      </div>
    </div>
  );
}
