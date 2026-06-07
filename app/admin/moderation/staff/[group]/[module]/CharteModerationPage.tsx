"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, ArrowRight, BookOpen, Search, Shield } from "lucide-react";
import { CharteArticleCard } from "@/components/admin/moderation/charte/CharteArticleCard";
import { CharteLeftRail, CharteRightRail } from "@/components/admin/moderation/charte/CharteModerationRails";
import { CharteViewerProfileBanner } from "@/components/admin/moderation/charte/CharteViewerProfileBanner";
import {
  isSectionRelevantForViewer,
  resolveCharteViewerProfile,
  type CharteViewerProfile,
} from "@/lib/admin/moderation/charte/charteViewerRole";
import {
  CHARTE_SECTIONS,
  CHARTE_TABS,
  CHARTE_VERSION,
  findTabIndexForSection,
  getCharteSectionAnchor,
  MIN_SECONDS_BETWEEN_BLOCK_VALIDATIONS,
  sectionMatchesSearch,
} from "@/components/admin/moderation/charte/charteModerationContent";
import { Q_LAYOUT, QUI } from "@/components/admin/moderation/questionnaire/questionnaire-ui";

const MIN_MS_BETWEEN_BLOCK_VALIDATIONS = MIN_SECONDS_BETWEEN_BLOCK_VALIDATIONS * 1000;

export default function CharteModerationPage() {
  const { data: session, update: updateSession } = useSession();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [validated, setValidated] = useState<Record<number, boolean>>({});
  const [globalEngagement, setGlobalEngagement] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [referenceMode, setReferenceMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitInfo, setSubmitInfo] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [lastValidatedAtMs, setLastValidatedAtMs] = useState<number | null>(null);
  const [tickMs, setTickMs] = useState(() => Date.now());
  const [validationGateInfo, setValidationGateInfo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [needsV3Upgrade, setNeedsV3Upgrade] = useState(false);
  const [previousSignedVersion, setPreviousSignedVersion] = useState<string | null>(null);
  const [viewerProfile, setViewerProfile] = useState<CharteViewerProfile | null>(null);
  const [profileFilter, setProfileFilter] = useState(false);

  const completedCount = useMemo(
    () => CHARTE_SECTIONS.filter((section) => validated[section.id]).length,
    [validated],
  );
  const allBlocksValidated = completedCount === CHARTE_SECTIONS.length;
  const canSubmit = allBlocksValidated && globalEngagement && !alreadySigned;
  const progress = Math.round((completedCount / CHARTE_SECTIONS.length) * 100);
  const remainingCooldownMs = lastValidatedAtMs
    ? Math.max(0, MIN_MS_BETWEEN_BLOCK_VALIDATIONS - (tickMs - lastValidatedAtMs))
    : 0;
  const remainingCooldownSeconds = Math.ceil(remainingCooldownMs / 1000);
  const isValidationCooldownActive = !referenceMode && remainingCooldownMs > 0;

  const activeTab = CHARTE_TABS[activeTabIndex] ?? CHARTE_TABS[0];

  const activeSections = useMemo(() => {
    const ids = activeTab?.sectionIds ?? [];
    return CHARTE_SECTIONS.filter((section) => ids.includes(section.id));
  }, [activeTab]);

  const searchTrimmed = searchQuery.trim();
  const isSearchActive = searchTrimmed.length > 0;

  const baseDisplaySections = useMemo(() => {
    if (!isSearchActive) return activeSections;
    return CHARTE_SECTIONS.filter((section) => sectionMatchesSearch(section, searchTrimmed));
  }, [activeSections, isSearchActive, searchTrimmed]);

  const relevantSectionCount = useMemo(
    () =>
      CHARTE_SECTIONS.filter((section) =>
        isSectionRelevantForViewer(section, viewerProfile?.charteAudience ?? null),
      ).length,
    [viewerProfile?.charteAudience],
  );

  const displaySections = useMemo(() => {
    if (!profileFilter || !viewerProfile?.charteAudience) return baseDisplaySections;
    return baseDisplaySections.filter((section) =>
      isSectionRelevantForViewer(section, viewerProfile.charteAudience),
    );
  }, [baseDisplaySections, profileFilter, viewerProfile?.charteAudience]);

  const scrollToArticle = useCallback(
    (sectionId: number) => {
      setSearchQuery("");
      const tabIndex = findTabIndexForSection(sectionId);
      const go = () => {
        document.getElementById(getCharteSectionAnchor(sectionId))?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      };
      if (tabIndex >= 0 && tabIndex !== activeTabIndex) {
        setActiveTabIndex(tabIndex);
        window.setTimeout(go, 80);
      } else {
        go();
      }
    },
    [activeTabIndex],
  );

  const toggleSection = useCallback(
    (id: number) => {
      if (referenceMode || alreadySigned) return;

      const currentlyValidated = Boolean(validated[id]);
      if (!currentlyValidated && isValidationCooldownActive) {
        setValidationGateInfo(
          `Attends ${remainingCooldownSeconds}s avant de valider un autre article — prends le temps de lire.`,
        );
        return;
      }

      setValidated((prev) => ({ ...prev, [id]: !prev[id] }));
      if (!currentlyValidated) {
        setLastValidatedAtMs(Date.now());
        setValidationGateInfo(null);
      }
      setSubmitted(false);
      setSubmitError(null);
    },
    [validated, isValidationCooldownActive, remainingCooldownSeconds, referenceMode, alreadySigned],
  );

  useEffect(() => {
    if (!isValidationCooldownActive) {
      setValidationGateInfo(null);
      return;
    }
    const timer = window.setInterval(() => setTickMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [isValidationCooldownActive]);

  useEffect(() => {
    let cancelled = false;
    const loadViewerValidation = async () => {
      try {
        const response = await fetch("/api/admin/moderation/staff/charte-validations", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const body = await response.json();
        if (body?.viewerProfile && !cancelled) {
          setViewerProfile(body.viewerProfile as CharteViewerProfile);
        }
        const viewerValidation = body?.viewerValidation;
        if (!viewerValidation || cancelled) return;

        const signedVersion = String(viewerValidation.charterVersion || "").trim();
        const isV3 = signedVersion === CHARTE_VERSION;

        if (isV3) {
          setAlreadySigned(true);
          setSubmitted(true);
          setReferenceMode(true);
          const allRead = Object.fromEntries(CHARTE_SECTIONS.map((s) => [s.id, true])) as Record<
            number,
            boolean
          >;
          setValidated(allRead);
          setSubmitInfo(
            `Tu as déjà validé ${CHARTE_VERSION} le ${new Date(viewerValidation.validatedAt).toLocaleString("fr-FR")}. Mode référence activé.`,
          );
          return;
        }

        setPreviousSignedVersion(signedVersion || "version antérieure");
        setNeedsV3Upgrade(true);
        setSubmitInfo(null);
      } catch {
        /* page utilisable sans statut */
      }
    };
    void loadViewerValidation();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (session?.user?.role) {
      setViewerProfile((prev) =>
        prev?.reducedActivityActive
          ? prev
          : resolveCharteViewerProfile({ adminRole: session.user.role }),
      );
    }
  }, [session?.user?.role]);

  const submitValidation = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitInfo(null);
    try {
      const response = await fetch("/api/admin/moderation/staff/charte-validations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          charterVersion: CHARTE_VERSION,
          feedback,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.success) {
        throw new Error(body?.error || "Impossible d'enregistrer ta validation.");
      }
      try {
        await updateSession?.();
      } catch {
        /* JWT rafraîchi au prochain tour */
      }
      setSubmitted(true);
      setAlreadySigned(true);
      setNeedsV3Upgrade(false);
      setReferenceMode(true);
      const entry = body.entry;
      setSubmitInfo(
        `${CHARTE_VERSION} enregistrée le ${new Date(entry.validatedAt).toLocaleString("fr-FR")}. Merci pour ton engagement — mode référence disponible.`,
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={Q_LAYOUT.page}>
      <div className={Q_LAYOUT.blurBg} aria-hidden>
        <div className={Q_LAYOUT.blurGradient} />
      </div>

      <div className={Q_LAYOUT.container}>
        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)_minmax(0,17.5rem)] xl:items-start xl:gap-8 2xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)_minmax(0,19rem)]">
          <div className="hidden xl:block">
            <CharteLeftRail
              tabs={CHARTE_TABS}
              activeTabIndex={activeTabIndex}
              onSelectTab={setActiveTabIndex}
              validated={validated}
              onScrollToArticle={scrollToArticle}
            />
          </div>

          <main className="min-w-0 space-y-5">
            <header className={`${Q_LAYOUT.heroVisual} p-5 sm:p-6`}>
              <div
                className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl"
                aria-hidden
              />
              <div className="relative">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 max-w-2xl">
                    <span className={Q_LAYOUT.badgeViolet}>Modération staff · Info</span>
                    <h1 className={`mt-3 ${QUI.heading} text-2xl sm:text-3xl`}>Charte de modération TENF</h1>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-300 sm:text-base">
                      Cadre commun pour modérateur·rices, personnes en formation, soutiens et admins. Lis les{" "}
                      {CHARTE_SECTIONS.length} articles, valide-les, puis signe en bas.
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">{CHARTE_VERSION} · mise à jour mai 2026</p>
                    <label className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-900/60 px-3 py-2">
                      <Search className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher : MP, mineur, conflit, pause…"
                        className={`min-w-0 flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none ${Q_LAYOUT.focusRing}`}
                        aria-label="Rechercher dans la charte"
                      />
                    </label>
                    <Link
                      href="/admin/moderation/staff/info"
                      className={`mt-4 inline-flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-violet-200 ${Q_LAYOUT.focusRing} rounded-lg`}
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden />
                      Retour au groupe info
                    </Link>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-200/90">À retenir</p>
                      <p className="mt-1 font-semibold text-amber-50">Pas sûr(e) ? Tu n&apos;agis pas seul(e).</p>
                    </div>
                    {alreadySigned ? (
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-950/40 px-3 py-2 text-xs text-cyan-100">
                        <input
                          type="checkbox"
                          checked={referenceMode}
                          onChange={(e) => setReferenceMode(e.target.checked)}
                          className="h-3.5 w-3.5 rounded accent-cyan-400"
                        />
                        Mode référence (lecture libre)
                      </label>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 xl:hidden">
                  <div className={QUI.progressTrack}>
                    <div className={QUI.progressFill} style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-zinc-400">
                    {completedCount}/{CHARTE_SECTIONS.length} articles ({progress}%)
                    {referenceMode ? " · mode référence" : ""}
                  </p>
                </div>
              </div>
            </header>

            {needsV3Upgrade ? (
              <div
                className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-50 ring-1 ring-inset ring-amber-400/15"
                role="status"
              >
                <p className="font-semibold">Mise à jour {CHARTE_VERSION}</p>
                <p className="mt-1 leading-relaxed text-amber-100/95">
                  Tu as déjà signé {previousSignedVersion ?? "une version antérieure"}. Merci de relire les{" "}
                  {CHARTE_SECTIONS.length} articles ci-dessous puis de valider {CHARTE_VERSION} en bas de page.{" "}
                  <strong className="font-medium text-amber-50">Ton accès admin reste actif</strong> pendant cette
                  relecture.
                </p>
              </div>
            ) : null}

            {viewerProfile ? (
              <CharteViewerProfileBanner
                roleLabel={viewerProfile.roleLabel}
                charteAudience={viewerProfile.charteAudience}
                roleBrief={viewerProfile.roleBrief}
                reducedActivityActive={viewerProfile.reducedActivityActive}
                profileFilter={profileFilter}
                onProfileFilterChange={setProfileFilter}
                relevantCount={relevantSectionCount}
                totalCount={CHARTE_SECTIONS.length}
                onNavigateToArticle={scrollToArticle}
              />
            ) : null}

            <nav className={`${Q_LAYOUT.panel} p-2 xl:hidden`} aria-label="Sommaire mobile">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {CHARTE_TABS.map((tab, index) => {
                  const done = tab.sectionIds.every((id) => validated[id]);
                  const isActive = index === activeTabIndex;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTabIndex(index)}
                      className={`shrink-0 rounded-xl border px-3 py-2 text-left text-xs transition ${Q_LAYOUT.focusRing} ${
                        isActive
                          ? "border-violet-400/40 bg-violet-500/15 text-violet-50"
                          : "border-white/10 bg-zinc-900/60 text-zinc-300"
                      }`}
                    >
                      <span className="block font-semibold">{tab.shortLabel}</span>
                      <span className="text-[10px] text-zinc-500">{done ? "Lu" : "À lire"}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {isSearchActive ? (
              <p className="text-sm text-zinc-400">
                {displaySections.length} article{displaySections.length > 1 ? "s" : ""} trouvé
                {displaySections.length > 1 ? "s" : ""} pour « {searchTrimmed} »
              </p>
            ) : activeTab.description ? (
              <p className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-2.5 text-sm text-zinc-400 xl:px-0 xl:border-0 xl:bg-transparent">
                <BookOpen className="mr-1.5 inline h-4 w-4 text-violet-400" aria-hidden />
                {activeTab.description}
              </p>
            ) : null}

            <section className="space-y-4" aria-live="polite">
              {displaySections.length === 0 && isSearchActive ? (
                <p className={`${Q_LAYOUT.panel} p-4 text-sm text-zinc-400`}>
                  Aucun article ne correspond à ta recherche. Essaie : MP, mineur, conflit, soutien, absence.
                </p>
              ) : null}
              {displaySections.length === 0 && profileFilter && !isSearchActive ? (
                <p className={`${Q_LAYOUT.panel} p-4 text-sm text-zinc-400`}>
                  Aucun article de cet onglet ne correspond à ton profil. Désactive le filtre « Voir surtout ce qui me
                  concerne » pour afficher toute la charte.
                </p>
              ) : null}
              {displaySections.map((section) => (
                <CharteArticleCard
                  key={section.id}
                  section={section}
                  checked={Boolean(validated[section.id])}
                  referenceMode={referenceMode || alreadySigned}
                  isValidationCooldownActive={isValidationCooldownActive}
                  remainingCooldownSeconds={remainingCooldownSeconds}
                  onToggle={toggleSection}
                  onNavigateToArticle={scrollToArticle}
                  profileRelevant={
                    viewerProfile?.charteAudience
                      ? isSectionRelevantForViewer(section, viewerProfile.charteAudience)
                      : false
                  }
                />
              ))}
            </section>

            {!isSearchActive ? (
            <section
              className={`${Q_LAYOUT.panel} flex flex-wrap items-center justify-between gap-3 p-4`}
              aria-label="Navigation entre onglets"
            >
              <button
                type="button"
                onClick={() => setActiveTabIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeTabIndex === 0}
                className={`inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-200 transition hover:border-violet-400/30 disabled:opacity-40 ${Q_LAYOUT.focusRing}`}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Précédent
              </button>
              <p className="text-sm text-zinc-400">
                {activeTab.label} · {activeTabIndex + 1}/{CHARTE_TABS.length}
              </p>
              <button
                type="button"
                onClick={() => setActiveTabIndex((prev) => Math.min(CHARTE_TABS.length - 1, prev + 1))}
                disabled={activeTabIndex === CHARTE_TABS.length - 1}
                className={`inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-200 transition hover:border-violet-400/30 disabled:opacity-40 ${Q_LAYOUT.focusRing}`}
              >
                Suivant
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </section>
            ) : null}

            {!referenceMode ? (
              <section
                className="rounded-2xl border border-emerald-400/25 bg-[linear-gradient(155deg,rgba(16,185,129,0.12),rgba(9,9,11,0.92))] p-5 ring-1 ring-inset ring-emerald-400/10"
                aria-labelledby="charte-final-validation"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15 text-emerald-200">
                    <Shield className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 id="charte-final-validation" className="text-lg font-semibold text-emerald-50">
                      Ta signature
                    </h3>
                    <p className="mt-1 text-sm text-emerald-100/90">
                      Active quand les {CHARTE_SECTIONS.length} articles sont validés. Délai de{" "}
                      {MIN_SECONDS_BETWEEN_BLOCK_VALIDATIONS}s entre chaque validation pour une lecture attentive.
                    </p>
                  </div>
                </div>

                <label className="mt-5 flex items-start gap-3 text-sm text-zinc-100">
                  <input
                    type="checkbox"
                    checked={globalEngagement}
                    onChange={(event) => {
                      setGlobalEngagement(event.target.checked);
                      setSubmitted(false);
                    }}
                    disabled={!allBlocksValidated || alreadySigned}
                    className="mt-1 h-4 w-4 rounded border-zinc-500 bg-zinc-900 text-emerald-400 focus:ring-emerald-300/40 disabled:opacity-40"
                  />
                  <span>
                    Je confirme appliquer cette charte avec neutralité, méthode et responsabilité — quel que soit mon
                    statut staff (fondateur, admin coordinateur, modération, soutien TENF, découverte, accompagnement,
                    pause ou activité réduite).
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => void submitValidation()}
                  disabled={!canSubmit || submitting || alreadySigned}
                  className={`mt-4 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40 ${Q_LAYOUT.focusRing}`}
                >
                  {submitting ? "Enregistrement…" : "Valider ma charte"}
                </button>

                <label className="mt-4 block text-sm text-emerald-100/90">
                  Retour optionnel pour l&apos;équipe
                  <textarea
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    maxLength={1200}
                    className={`mt-2 min-h-[92px] w-full rounded-xl border border-emerald-400/20 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400/45 ${Q_LAYOUT.focusRing}`}
                    placeholder="Ex. : sections claires / précision souhaitée sur les MP…"
                  />
                </label>

                {submitted && canSubmit ? (
                  <p className="mt-3 rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100">
                    Charte validée. Merci pour ton engagement auprès de la communauté TENF.
                  </p>
                ) : null}
                {submitInfo && !needsV3Upgrade ? (
                  <p className="mt-3 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
                    {submitInfo}
                  </p>
                ) : null}
                {submitError ? (
                  <p className="mt-3 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                    {submitError}
                  </p>
                ) : null}
                {validationGateInfo ? (
                  <p className="mt-3 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                    {validationGateInfo}
                  </p>
                ) : null}
              </section>
            ) : alreadySigned && referenceMode && submitInfo ? (
              <p className="rounded-xl border border-cyan-400/25 bg-cyan-950/40 px-4 py-3 text-sm text-cyan-100">
                {submitInfo}
              </p>
            ) : null}
          </main>

          <div className="hidden xl:block">
            <CharteRightRail
              completedCount={completedCount}
              totalSections={CHARTE_SECTIONS.length}
              progress={progress}
              activeTab={activeTab}
              activeTabIndex={activeTabIndex}
              tabCount={CHARTE_TABS.length}
              allBlocksValidated={allBlocksValidated}
              submitted={submitted}
              submitInfo={submitInfo}
              referenceMode={referenceMode}
              charterVersion={CHARTE_VERSION}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
