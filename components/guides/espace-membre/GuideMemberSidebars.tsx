"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, LayoutDashboard, ListChecks, LogIn } from "lucide-react";
import {
  GUIDE_MEMBER_BASE,
  getMemberChapterBySlug,
  getMemberChapterNavIndex,
  guideMemberChapters,
  guideMemberParcoursSteps,
  relatedMemberGuides,
} from "@/lib/guides/espace-membre/guideMemberSiteData";
import { GuideGlassButton, guideGlassClass, guideGlassSurface } from "@/components/guides/partie-publique/guidePublicUi";

function Panel({
  title,
  children,
  accent,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  accent?: string;
  className?: string;
}) {
  const a = accent ?? "#818cf8";
  return (
    <section className={`rounded-2xl border p-4 ${guideGlassClass} ${className}`} style={guideGlassSurface(a, "soft")}>
      <h2
        className="text-[10px] font-bold uppercase tracking-[0.16em]"
        style={{ color: `color-mix(in srgb, ${a} 75%, var(--color-text-muted))` }}
      >
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function GuideMemberNavAside({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Sommaire du guide membre" className="space-y-1.5">
      <Link
        href={GUIDE_MEMBER_BASE}
        className={`mb-2 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition duration-300 ${guideGlassClass}`}
        style={{
          ...(pathname === GUIDE_MEMBER_BASE ? guideGlassSurface("#818cf8", "soft") : { borderColor: "transparent", backgroundColor: "transparent" }),
          color: pathname === GUIDE_MEMBER_BASE ? "var(--color-text)" : "var(--color-text-secondary)",
        }}
        aria-current={pathname === GUIDE_MEMBER_BASE ? "page" : undefined}
      >
        Accueil du guide
      </Link>
      {guideMemberChapters.map((chapter) => {
        const href = `${GUIDE_MEMBER_BASE}/${chapter.slug}`;
        const active = pathname === href;
        const Icon = chapter.icon;
        return (
          <Link
            key={chapter.slug}
            href={href}
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition duration-300 ${active ? guideGlassClass : ""}`}
            style={{
              ...(active ? guideGlassSurface(chapter.accent, "soft") : { borderColor: "transparent", backgroundColor: "transparent" }),
              color: active ? "var(--color-text)" : "var(--color-text-secondary)",
            }}
            aria-current={active ? "page" : undefined}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, ${chapter.accent} 90%, white), color-mix(in srgb, ${chapter.accent} 40%, #0f172a))`,
                boxShadow: `0 4px 12px -4px color-mix(in srgb, ${chapter.accent} 50%, transparent)`,
              }}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 leading-snug">
              <span className="block text-[10px] font-bold uppercase tracking-wide opacity-70" style={{ color: chapter.accent }}>
                {chapter.menuLabel}
              </span>
              <span className="block truncate">{chapter.title}</span>
            </span>
          </Link>
        );
      })}
      <Link
        href={`${GUIDE_MEMBER_BASE}/parcours`}
        className={`mt-1 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition duration-300 ${pathname === `${GUIDE_MEMBER_BASE}/parcours` ? guideGlassClass : ""}`}
        style={{
          ...(pathname === `${GUIDE_MEMBER_BASE}/parcours` ? guideGlassSurface("#818cf8", "soft") : { borderColor: "transparent" }),
          color: pathname === `${GUIDE_MEMBER_BASE}/parcours` ? "var(--color-text)" : "var(--color-text-secondary)",
        }}
        aria-current={pathname === `${GUIDE_MEMBER_BASE}/parcours` ? "page" : undefined}
      >
        <ListChecks className="h-4 w-4 shrink-0" style={{ color: "#818cf8" }} aria-hidden />
        Parcours première connexion
      </Link>
    </nav>
  );
}

export function GuideMemberRightAside({ pathname }: { pathname: string }) {
  const parcoursHref = `${GUIDE_MEMBER_BASE}/parcours`;
  const slugMatch = pathname.match(/^\/guides\/espace-membre\/([^/]+)$/);
  const slug = slugMatch?.[1];
  const chapter = slug ? getMemberChapterBySlug(slug) : undefined;
  const chapterIdx = slug ? getMemberChapterNavIndex(slug) : -1;
  const prev = chapterIdx > 0 ? guideMemberChapters[chapterIdx - 1] : null;
  const next = chapterIdx >= 0 && chapterIdx < guideMemberChapters.length - 1 ? guideMemberChapters[chapterIdx + 1] : null;
  const accent = chapter?.accent ?? "#818cf8";

  return (
    <aside className="space-y-3" aria-label="Raccourcis du guide membre">
      <Panel title="Prochaine étape" accent={accent}>
        <GuideGlassButton href="/member/dashboard" variant="primary" accent={accent} className="w-full !py-3">
          Tableau de bord
          <ArrowRight className="h-4 w-4" aria-hidden />
        </GuideGlassButton>
        <GuideGlassButton href="/auth/login" variant="glass" accent={accent} className="mt-2 w-full !py-2 text-xs">
          <LogIn className="h-3.5 w-3.5" aria-hidden />
          Connexion Discord
        </GuideGlassButton>
      </Panel>

      {pathname !== parcoursHref ? (
        <Panel title="Parcours express" accent="#818cf8">
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {guideMemberParcoursSteps.length} étapes guidées (~20 min).
          </p>
          <Link href={parcoursHref} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold transition hover:gap-1.5" style={{ color: "#818cf8" }}>
            Voir le parcours
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Panel>
      ) : null}

      {chapter ? (
        <Panel title={`Pages — ${chapter.menuLabel}`} accent={chapter.accent}>
          <ul className="space-y-0.5 text-xs">
            {chapter.pages.map((p) => (
              <li key={p.href + p.label}>
                {p.disabled ? (
                  <span className="flex items-start gap-1.5 rounded-lg px-2 py-1.5 opacity-50" style={{ color: "var(--color-text-muted)" }}>
                    <span className="leading-snug">{p.label}</span>
                    <span className="shrink-0 text-[10px] font-bold uppercase">Bientôt</span>
                  </span>
                ) : (
                  <Link
                    href={p.href}
                    target={p.external ? "_blank" : undefined}
                    rel={p.external ? "noopener noreferrer" : undefined}
                    className="group flex items-start gap-1.5 rounded-lg px-2 py-1.5 transition duration-200 hover:bg-white/[0.04]"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 opacity-40 transition group-hover:opacity-100" style={{ color: chapter.accent }} aria-hidden />
                    <span className="leading-snug group-hover:text-[var(--color-text)]">{p.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {(prev || next) && chapter ? (
        <Panel title="Navigation" accent={chapter.accent}>
          <div className="space-y-2">
            {prev ? (
              <Link
                href={`${GUIDE_MEMBER_BASE}/${prev.slug}`}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${guideGlassClass}`}
                style={guideGlassSurface(prev.accent, "soft")}
              >
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {prev.menuLabel}
              </Link>
            ) : null}
            {next ? (
              <Link
                href={`${GUIDE_MEMBER_BASE}/${next.slug}`}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${guideGlassClass}`}
                style={guideGlassSurface(next.accent, "soft")}
              >
                {next.menuLabel}
                <ArrowRight className="h-3.5 w-3.5 shrink-0 ml-auto" aria-hidden />
              </Link>
            ) : null}
          </div>
        </Panel>
      ) : null}

      <Panel title="Autres guides">
        <ul className="space-y-1.5">
          {relatedMemberGuides.map((g) => (
            <li key={g.href}>
              <Link
                href={g.href}
                className={`block rounded-xl border px-2.5 py-2 transition duration-300 ${guideGlassClass}`}
                style={guideGlassSurface(g.color, "soft")}
              >
                <span className="text-xs font-semibold" style={{ color: g.color }}>
                  {g.label}
                </span>
                <span className="mt-0.5 block text-[10px] leading-snug opacity-80" style={{ color: "var(--color-text-secondary)" }}>
                  {g.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Menu membre" accent="#94a3b8">
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          Accueil · Moi · Communauté · Activité · Parcours TENF · Aide
        </p>
        <Link href="/member/dashboard" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold transition hover:opacity-80" style={{ color: "#818cf8" }}>
          <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
          Ouvrir /member →
        </Link>
      </Panel>
    </aside>
  );
}
