"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, HelpCircle, LayoutDashboard, Settings, Sparkles } from "lucide-react";
import { getGuideMemberStepIndex, guideMemberSteps } from "./guideMeta";

const tabs = guideMemberSteps.map((step) => ({ label: step.title, href: step.href }));

const iconByHref: Record<string, typeof BookOpen> = {
  "/rejoindre/guide-espace-membre/premiere-connexion": Sparkles,
  "/rejoindre/guide-espace-membre/tableau-de-bord": LayoutDashboard,
  "/rejoindre/guide-espace-membre/fonctionnalites-principales": BookOpen,
  "/rejoindre/guide-espace-membre/parametres-securite": Settings,
  "/rejoindre/guide-espace-membre/faq-membre": HelpCircle,
};

export default function GuideEspaceMembreLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentStep = getGuideMemberStepIndex(pathname);
  const isGuideHome = pathname === "/rejoindre/guide-espace-membre";
  const lastUpdated = "17 mars 2026";

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:pt-8">
        <section
          className="rounded-2xl border p-4 sm:p-5"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
            boxShadow: "0 10px 20px rgba(0,0,0,0.16)",
          }}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                Guide espace membre TENF
              </p>
              <p className="text-xs sm:text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Navigation rapide entre les pages d'aide dediees aux membres connectes.
              </p>
            </div>
            <Link href="/rejoindre" className="text-xs underline sm:text-sm" style={{ color: "var(--color-primary)" }}>
              Retour a Rejoindre TENF
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <span>Derniere mise a jour: {lastUpdated}</span>
            <span aria-hidden>•</span>
            <span>Version: Guide Espace Membre v1</span>
            <span aria-hidden>•</span>
            <Link href="/rejoindre/faq" className="underline" style={{ color: "var(--color-primary)" }}>
              Besoin d'aide ?
            </Link>
          </div>
          {!isGuideHome && currentStep >= 0 ? (
            <div className="mt-3 rounded-lg border px-3 py-2 text-xs sm:text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
              Progression du guide:{" "}
              <span style={{ color: "var(--color-text)" }}>
                {currentStep + 1} / {guideMemberSteps.length}
              </span>{" "}
              - {guideMemberSteps[currentStep].title}
            </div>
          ) : null}
        </section>
      </div>
      <div className="sticky top-16 z-40 mx-auto mt-4 w-full max-w-6xl px-4">
        <section className="overflow-x-auto rounded-2xl border px-3 py-2 backdrop-blur" style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-card) 88%, transparent)" }}>
          <div className="flex min-w-max gap-2">
            <Link href="/rejoindre/guide-espace-membre" className="rounded-full border px-3 py-1.5 text-xs sm:text-sm" style={{ borderColor: pathname === "/rejoindre/guide-espace-membre" ? "rgba(145,70,255,0.45)" : "var(--color-border)", color: pathname === "/rejoindre/guide-espace-membre" ? "var(--color-primary)" : "var(--color-text)", backgroundColor: pathname === "/rejoindre/guide-espace-membre" ? "color-mix(in srgb, var(--color-primary) 12%, transparent)" : "transparent" }}>
              Accueil du guide
            </Link>
            {tabs.map((tab) => {
              const Icon = iconByHref[tab.href];
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs sm:text-sm"
                  style={{
                    borderColor: pathname === tab.href ? "rgba(145,70,255,0.45)" : "var(--color-border)",
                    color: pathname === tab.href ? "var(--color-primary)" : "var(--color-text)",
                    backgroundColor: pathname === tab.href ? "color-mix(in srgb, var(--color-primary) 12%, transparent)" : "transparent",
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </section>
      </div>
      <div className="pb-10 pt-2">{children}</div>
    </>
  );
}
