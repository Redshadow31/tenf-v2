"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { ChapterBlock, GuideTenfChapter } from "@/lib/guides/tenf/guideTenfSiteData";
import {
  GuideCallout,
  GuideRichText,
  guideGlassClass,
  guideGlassSurface,
} from "@/components/guides/partie-publique/guidePublicUi";
import { SpotlightChapterTabs } from "./SpotlightChapterTabs";

function isExternal(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

function FlowDiagram({ title, steps, accent }: { title?: string; steps: { label: string; hint?: string }[]; accent: string }) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-6 ${guideGlassClass}`} style={guideGlassSurface(accent, "soft")}>
      {title ? (
        <p className="text-sm font-bold sm:text-base" style={{ color: "var(--color-text)" }}>
          {title}
        </p>
      ) : null}
      <ol className={`mt-4 flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-2 ${title ? "" : "mt-0"}`}>
        {steps.map((step, i) => (
          <li key={step.label} className="relative flex min-w-0 flex-1 flex-col">
            <div className="flex flex-1 flex-col rounded-xl border p-3 sm:p-4" style={{ borderColor: `color-mix(in srgb, ${accent} 30%, var(--color-border))`, backgroundColor: "color-mix(in srgb, var(--color-card) 80%, transparent)" }}>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${accent}, #0f172a)` }}
                aria-hidden
              >
                {i + 1}
              </span>
              <p className="mt-2 text-sm font-semibold leading-snug" style={{ color: "var(--color-text)" }}>
                {step.label}
              </p>
              {step.hint ? (
                <p className="mt-1 flex-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {step.hint}
                </p>
              ) : null}
            </div>
            {i < steps.length - 1 ? (
              <span
                className="pointer-events-none absolute -bottom-4 left-1/2 hidden h-4 w-px -translate-x-1/2 lg:bottom-auto lg:left-auto lg:right-0 lg:top-1/2 lg:flex lg:h-px lg:w-4 lg:translate-x-full lg:-translate-y-1/2 lg:items-center lg:justify-center"
                style={{ color: accent }}
                aria-hidden
              >
                <ArrowRight className="hidden h-4 w-4 lg:block" style={{ color: accent }} />
                <span className="block text-lg leading-none lg:hidden">↓</span>
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function CompareDiagram({
  title,
  left,
  right,
  accent,
}: {
  title?: string;
  left: { title: string; items: string[] };
  right: { title: string; items: string[] };
  accent: string;
}) {
  return (
    <div>
      {title ? (
        <p className="mb-3 text-sm font-bold sm:text-base" style={{ color: "var(--color-text)" }}>
          {title}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {[left, right].map((col, idx) => (
          <div
            key={col.title}
            className={`rounded-2xl border p-4 sm:p-5 ${guideGlassClass}`}
            style={guideGlassSurface(idx === 0 ? accent : "#fb7185", "soft")}
          >
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: idx === 0 ? accent : "#fb7185" }}>
              {col.title}
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              {col.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden>{idx === 0 ? "✓" : "✗"}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataTable({
  title,
  caption,
  columns,
  rows,
  accent,
}: {
  title?: string;
  caption?: string;
  columns: string[];
  rows: string[][];
  accent: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border ${guideGlassClass}`} style={guideGlassSurface(accent, "soft")}>
      {title ? (
        <p className="border-b px-4 py-3 text-sm font-bold sm:px-5 sm:text-base" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
          {title}
        </p>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead>
            <tr style={{ backgroundColor: "color-mix(in srgb, var(--color-card) 60%, transparent)" }}>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide sm:px-5"
                  style={{ color: `color-mix(in srgb, ${accent} 80%, var(--color-text-muted))` }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {rows.map((row) => (
              <tr key={row.join("|")}>
                {row.map((cell, ci) => (
                  <td
                    key={`${ci}-${cell}`}
                    className="px-4 py-3 align-top sm:px-5"
                    style={{ color: ci === 0 ? "var(--color-text)" : "var(--color-text-secondary)" }}
                  >
                    {ci === 0 ? (
                      <span className="font-medium">
                        <GuideRichText text={cell} />
                      </span>
                    ) : (
                      <GuideRichText text={cell} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption ? (
        <p className="border-t px-4 py-2 text-xs leading-relaxed sm:px-5" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
          {caption}
        </p>
      ) : null}
    </div>
  );
}

function GuidedSteps({ title, steps, accent }: { title?: string; steps: { title: string; body: string }[]; accent: string }) {
  return (
    <div>
      {title ? (
        <p className="mb-4 text-sm font-bold sm:text-base" style={{ color: "var(--color-text)" }}>
          {title}
        </p>
      ) : null}
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={step.title} className={`flex gap-3 rounded-2xl border p-4 sm:p-5 ${guideGlassClass}`} style={guideGlassSurface(accent, "soft")}>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${accent}, #6366f1)` }}
              aria-hidden
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {step.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                <GuideRichText text={step.body} />
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function BlockItem({ block, accent }: { block: ChapterBlock; accent: string }) {
  if (block.kind === "lead") {
    return (
      <p className="max-w-[min(70ch,100%)] text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
        <GuideRichText text={block.text} />
      </p>
    );
  }
  if (block.kind === "bullets") {
    return (
      <div className="max-w-[min(68ch,100%)]">
        {block.title ? (
          <p className="text-sm font-semibold sm:text-base" style={{ color: "var(--color-text)" }}>
            {block.title}
          </p>
        ) : null}
        <ul className="mt-3 space-y-3 text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
          {block.items.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
              <span>
                <GuideRichText text={item} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (block.kind === "callout") {
    return (
      <GuideCallout
        variant={block.variant === "important" ? "info" : "tip"}
        title={block.variant === "important" ? "À retenir" : "Conseil pratique"}
        accent={block.variant === "important" ? "#fb7185" : accent}
        className="max-w-[min(72ch,100%)]"
      >
        <GuideRichText text={block.text} />
      </GuideCallout>
    );
  }
  if (block.kind === "table") {
    return <DataTable title={block.title} caption={block.caption} columns={block.columns} rows={block.rows} accent={accent} />;
  }
  if (block.kind === "diagram" && block.variant === "flow") {
    return <FlowDiagram title={block.title} steps={block.steps} accent={accent} />;
  }
  if (block.kind === "diagram" && block.variant === "compare") {
    return <CompareDiagram title={block.title} left={block.left} right={block.right} accent={accent} />;
  }
  if (block.kind === "steps") {
    return <GuidedSteps title={block.title} steps={block.steps} accent={accent} />;
  }
  return null;
}

export default function GuideTenfBlockContent({ chapter }: { chapter: GuideTenfChapter }) {
  const { accent, blocks, spotlightTabs } = chapter;

  if (spotlightTabs?.length) {
    const lead = blocks.find((b) => b.kind === "lead");
    const afterTabs = blocks.filter((b) => b !== lead);
    return (
      <div className="space-y-8">
        {lead ? <BlockItem block={lead} accent={accent} /> : null}
        <SpotlightChapterTabs panels={spotlightTabs} />
        {afterTabs.map((b, i) => (
          <BlockItem key={`${b.kind}-${i}`} block={b} accent={accent} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {blocks.map((b, i) => (
        <BlockItem key={`${b.kind}-${i}`} block={b} accent={accent} />
      ))}
    </div>
  );
}

export function GuideTenfChapterLinks({ chapter }: { chapter: GuideTenfChapter }) {
  if (!chapter.links?.length) return null;
  return (
    <div className={`mt-10 flex flex-wrap gap-2 border-t pt-6 ${guideGlassClass}`} style={{ borderColor: "color-mix(in srgb, white 8%, var(--color-border))" }}>
      <p className="mb-2 w-full text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
        Aller plus loin
      </p>
      {chapter.links.map((l) =>
        isExternal(l.href) ? (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:bg-white/5 sm:text-sm"
            style={guideGlassSurface(chapter.accent, "soft")}
          >
            {l.label}
            <ExternalLink className="h-3.5 w-3.5 shrink-0" style={{ color: chapter.accent }} aria-hidden />
          </a>
        ) : (
          <Link
            key={l.href}
            href={l.href}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:bg-white/5 sm:text-sm"
            style={{ ...guideGlassSurface(chapter.accent, "soft"), color: chapter.accent }}
          >
            {l.label}
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </Link>
        ),
      )}
    </div>
  );
}
