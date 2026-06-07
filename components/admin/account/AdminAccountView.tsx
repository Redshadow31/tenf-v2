"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Globe2,
  History,
  KeyRound,
  Mail,
  Megaphone,
  RefreshCw,
  Shield,
  Siren,
  Sparkles,
  User,
  UserPlus,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AnnouncementMarkdown from "@/components/ui/AnnouncementMarkdown";
import AdminAccountHero from "@/components/admin/account/bento/AdminAccountHero";
import AdminDashboardLoadingScreen from "@/components/admin/dashboard/AdminDashboardLoadingScreen";
import CockpitMiniCard from "@/components/admin/account/ui/CockpitMiniCard";
import TechnicalCopyField from "@/components/admin/account/ui/TechnicalCopyField";
import MemberBentoShell, { MemberBentoCell, MemberBentoRow } from "@/components/member/layout/MemberBentoShell";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";
import {
  DashboardInnerCard,
  DashboardInteractiveLink,
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_FOOTER_DIVIDER,
  MEMBER_SCROLL_MT,
  MemberAlert,
  MemberHeroStat,
  MemberProgressBar,
  MemberSecondaryLink,
} from "@/components/member/dashboard/dashboardUi";
import { useAdminAccountData } from "@/hooks/useAdminAccountData";
import { buildAdminAccountModel } from "@/lib/admin/account/adminAccountModel";
import {
  charterTimelinePercent,
  FOCUS_RING_CLASS,
  formatDateFr,
} from "@/lib/admin/account/adminAccountUtils";

const EXPERIENCE_ICONS: Record<string, LucideIcon> = {
  "/member/dashboard": Eye,
  "/rejoindre/guide-public/presentation-rapide": Globe2,
  "/member/evenements": CalendarDays,
  "/lives": Video,
};

function experienceIcon(href: string): LucideIcon {
  return EXPERIENCE_ICONS[href] ?? ExternalLink;
}

function quickLinkIcon(title: string): LucideIcon {
  if (title.includes("Charte")) return BookOpen;
  if (title.includes("Modération") || title.includes("questionnaire")) return Shield;
  if (title.includes("Organigramme")) return Sparkles;
  if (title.includes("Membres") || title.includes("Validations")) return User;
  if (title.includes("Tableau")) return Sparkles;
  if (title.includes("Comptes")) return KeyRound;
  return ArrowUpRight;
}

export default function AdminAccountView() {
  const { data, staffFeed, staffAnnouncements, loading, error, reload } = useAdminAccountData();

  const [emailInput, setEmailInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [showSensitiveIds, setShowSensitiveIds] = useState(false);
  const [testEmailBusy, setTestEmailBusy] = useState(false);
  const [testEmailMessage, setTestEmailMessage] = useState<string | null>(null);
  const [expandedAnnIds, setExpandedAnnIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (data) setEmailInput(data.staffNotificationEmail || "");
  }, [data?.staffNotificationEmail, data]);

  const charterUrgent = useMemo(() => {
    if (!data) return false;
    const { charter } = data;
    return !charter.accepted && (charter.graceElapsed || (charter.daysRemainingApprox ?? 99) <= 5);
  }, [data]);

  const emailConfigured = Boolean(data?.staffNotificationEmail?.trim());

  const model = useMemo(() => {
    if (!data) return null;
    return buildAdminAccountModel(data, { charterUrgent, emailConfigured });
  }, [data, charterUrgent, emailConfigured]);

  const charterPercent = useMemo(
    () => (data ? charterTimelinePercent(data.charter) : 0),
    [data],
  );

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  async function saveEmail() {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/admin/me/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffNotificationEmail: emailInput }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.error || "Enregistrement refusé.");
      }
      setSaveMessage("E-mail enregistré.");
      await reload();
    } catch (e) {
      setSaveMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function sendTestStaffEmail() {
    setTestEmailBusy(true);
    setTestEmailMessage(null);
    try {
      const res = await fetch("/api/admin/me/account/test-email", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof j?.error === "string" ? j.error : "Impossible d'envoyer le test.");
      }
      setTestEmailMessage("E-mail de test envoyé. Vérifie ta boîte (et les spams).");
    } catch (e) {
      setTestEmailMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setTestEmailBusy(false);
    }
  }

  if (loading) {
    return (
      <AdminDashboardLoadingScreen
        title="On prépare ton espace…"
        subtitle="Ta fiche, ta charte et ce qui compte pour ton rôle — deux secondes."
      />
    );
  }

  if (error || !data || !model) {
    return (
      <div className="-mx-4 md:-mx-6">
        <MemberBentoShell>
          <section
            className="rounded-2xl border border-red-500/35 bg-red-950/30 p-6 text-center text-sm text-red-100"
            role="alert"
          >
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-300" aria-hidden />
            <p className="font-semibold">{model?.errorTitle ?? "Impossible de charger ton espace"}</p>
            <p className="mt-2 opacity-90">{error || "Données indisponibles."}</p>
            <button
              type="button"
              className={`mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/35 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/20 ${FOCUS_RING_CLASS}`}
              onClick={() => void reload()}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              {model?.errorRetry ?? "Réessayer"}
            </button>
          </section>
        </MemberBentoShell>
      </div>
    );
  }

  const { charter } = data;
  const snap = data.staffSnapshot;
  const alertsDanger = charterUrgent;
  const alertsAttention = !charter.accepted || !emailConfigured;
  const alertsTone: "ok" | "warn" | "danger" = alertsDanger ? "danger" : alertsAttention ? "warn" : "ok";
  const alertsValue = alertsDanger ? model.cockpitAlertsDanger : alertsAttention ? model.cockpitAlertsWarn : model.cockpitAlertsOk;
  const charterCockpitValue = charter.accepted
    ? model.charterCockpitAccepted
    : charter.graceElapsed
      ? model.charterCockpitOverdue
      : model.charterCockpitPending;
  const charterCockpitTone: "ok" | "warn" | "danger" = charter.accepted ? "ok" : charterUrgent ? "danger" : "warn";
  const charteVersionBadge =
    !charter.accepted
      ? "À signer"
      : charter.validatedVersion && charter.validatedVersion !== charter.currentVersion
        ? "Mise à jour"
        : "À jour";

  return (
    <div className="-mx-4 md:-mx-6">
      <MemberBentoShell accentHex={model.accent}>
        {/* Row 1 — Hero + Cockpit */}
        <MemberBentoRow>
          <MemberBentoCell span={8}>
            <AdminAccountHero model={model} data={data} onRefresh={() => void reload()} />
          </MemberBentoCell>
          <MemberBentoCell span={4}>
            <DashboardPanel
              id="mc-cockpit"
              tone="accent"
              accentHex={model.accent}
              intensity="medium"
              className={MEMBER_SCROLL_MT}
              ariaLabelledBy="admin-account-cockpit-title"
            >
              <DashboardPanelHeader
                kicker={model.cockpitKicker}
                title={model.cockpitTitle}
                icon={Shield}
                tone="accent"
                accentHex={model.accent}
                titleId="admin-account-cockpit-title"
              />
              <p className="mb-3 text-sm leading-relaxed text-white/60">{model.cockpitIntro}</p>

              {model.showEmergencyMode ? (
                <button
                  type="button"
                  onClick={() => setEmergencyOpen((v) => !v)}
                  className={`mb-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-500/20 ${FOCUS_RING_CLASS}`}
                >
                  <Siren className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {emergencyOpen ? model.emergencyCloseLabel : model.emergencyOpenLabel}
                </button>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <CockpitMiniCard
                  icon={Shield}
                  label="Rôle"
                  value={data.adminRoleLabel}
                  tone="neutral"
                  action={{ kind: "link", href: "/admin/gestion-acces/organigramme-staff" }}
                />
                <CockpitMiniCard
                  icon={BookOpen}
                  label="Charte"
                  value={charterCockpitValue}
                  tone={charterCockpitTone}
                  action={{ kind: "link", href: "/admin/moderation/staff/info/charte" }}
                />
                <CockpitMiniCard
                  icon={KeyRound}
                  label="Accès"
                  value={data.hasAdvancedAdminView ? model.cockpitAccessAdvanced : model.cockpitAccessStandard}
                  tone={data.hasAdvancedAdminView ? "ok" : "neutral"}
                  action={
                    data.hasAdvancedAdminView
                      ? data.sensitive
                        ? { kind: "scroll", targetId: "mc-tech" }
                        : { kind: "scroll", targetId: "mc-identite" }
                      : { kind: "link", href: "/admin/gestion-acces/admin-avance" }
                  }
                />
                <CockpitMiniCard
                  icon={AlertTriangle}
                  label="Alertes"
                  value={alertsValue}
                  tone={alertsTone}
                  action={
                    alertsDanger || alertsAttention
                      ? { kind: "scroll", targetId: "mc-alertes" }
                      : { kind: "scroll", targetId: "mc-charte" }
                  }
                />
              </div>

              {emergencyOpen ? (
                <div className="mt-3 rounded-xl border border-red-500/35 bg-red-950/25 p-3 text-sm text-red-50/95">
                  <p className="font-semibold text-red-100">{model.emergencyTitle}</p>
                  <p className="mt-1 text-xs text-red-100/80">{model.emergencyIntro}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href="/admin/moderation/staff"
                      className={`inline-flex items-center gap-1.5 rounded-lg border border-red-400/40 bg-red-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-white ${FOCUS_RING_CLASS}`}
                    >
                      Modération staff
                      <ArrowUpRight className="h-3 w-3 opacity-90" />
                    </Link>
                    <Link
                      href="/admin/membres/gestion"
                      className={`inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-[11px] font-semibold text-red-50 ${FOCUS_RING_CLASS}`}
                    >
                      Liste membres
                    </Link>
                    <Link
                      href="/admin/gestion-acces/comptes"
                      className={`inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-[11px] font-semibold text-red-50 ${FOCUS_RING_CLASS}`}
                    >
                      Comptes admin
                    </Link>
                    <Link
                      href="/admin/moderation/staff/info/charte"
                      className={`inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-[11px] font-semibold text-red-50 ${FOCUS_RING_CLASS}`}
                    >
                      Charte
                    </Link>
                  </div>
                </div>
              ) : null}
            </DashboardPanel>
          </MemberBentoCell>
        </MemberBentoRow>

        {/* Guidance — par où commencer */}
        {model.guidanceSteps.length > 0 ? (
          <MemberBentoRow>
            <MemberBentoCell span={12}>
              <DashboardPanel tone="emerald" accentHex={model.accent} intensity="soft" className={MEMBER_SCROLL_MT}>
                <DashboardPanelHeader
                  kicker={model.guidanceKicker}
                  title={model.guidanceTitle}
                  icon={Sparkles}
                  tone="emerald"
                  accentHex={model.accent}
                />
                <ul className="space-y-3">
                  {model.guidanceSteps.map((step) => (
                    <li key={step.slice(0, 48)} className="flex gap-3 text-sm leading-relaxed text-white/75">
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: model.accent }}
                        aria-hidden
                      />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </DashboardPanel>
            </MemberBentoCell>
          </MemberBentoRow>
        ) : null}

        {/* Row 2 — Experience links */}
        <MemberBentoRow>
          <MemberBentoCell span={12}>
            <DashboardPanel tone="violet" accentHex={model.accent} id="mc-experience" className={MEMBER_SCROLL_MT}>
              <DashboardPanelHeader
                kicker={model.experienceKicker}
                title={model.experienceTitle}
                icon={Globe2}
                tone="violet"
                accentHex={model.accent}
              />
              <p className="mb-4 text-sm leading-relaxed text-white/60">{model.experienceIntro}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {model.experienceLinks.map((item) => {
                  const Icon = experienceIcon(item.href);
                  return (
                    <DashboardInteractiveLink key={item.href} accentHex={item.tone} featured>
                      <Link
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex h-full flex-col p-4 ${FOCUS_RING_CLASS}`}
                      >
                        <span
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: hexToRgba(item.tone, 0.2),
                            color: hexToRgba(item.tone, 0.95),
                          }}
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <p className="mt-3 text-sm font-bold text-white">{item.title}</p>
                        <p className="mt-1 flex-1 text-xs leading-relaxed text-white/55">{item.description}</p>
                        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-white/75">
                          {model.experienceOpenLabel}
                          <ExternalLink className="h-3 w-3 opacity-80" />
                        </span>
                      </Link>
                    </DashboardInteractiveLink>
                  );
                })}
              </div>
            </DashboardPanel>
          </MemberBentoCell>
        </MemberBentoRow>

        {/* Row 3 — Alerts (charter / email) + restricted profile */}
        {!data.hasAdvancedAdminView ? (
          <MemberBentoRow>
            <MemberBentoCell span={12}>
              <DashboardPanel tone="amber" intensity="soft">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                    <Shield className="h-5 w-5 text-amber-300" aria-hidden />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-100">{model.restrictedAccessTitle}</p>
                    <p className="mt-1 text-sm leading-relaxed text-amber-100/80">
                      {model.restrictedAccessMessage}{" "}
                      <Link
                        href="/admin/gestion-acces/admin-avance"
                        className="font-medium text-amber-200 underline-offset-2 hover:underline"
                      >
                        Accès admin avancé
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </DashboardPanel>
            </MemberBentoCell>
          </MemberBentoRow>
        ) : null}

        {(charterUrgent || !emailConfigured) && (
          <MemberBentoRow>
            <MemberBentoCell span={12}>
              <div id="mc-alertes" className={`space-y-3 ${MEMBER_SCROLL_MT}`}>
                {charterUrgent ? (
                  <DashboardPanel tone="rose" intensity="medium">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/20">
                        <AlertTriangle className="h-5 w-5 text-red-300" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-red-100">{model.charterAlertTitle}</p>
                        <p className="mt-1 text-sm text-red-100/85">{model.charterAlertMessage}</p>
                        <div className="mt-3">
                          <MemberProgressBar
                            percent={charterPercent}
                            accentHex="#f87171"
                            label={model.charterProgressLabel}
                          />
                        </div>
                        <Link
                          href="/admin/moderation/staff/info/charte"
                          className={`mt-4 inline-flex items-center gap-2 rounded-xl bg-red-500/90 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-red-500 ${FOCUS_RING_CLASS}`}
                        >
                          {model.charterAlertCta}
                          <ExternalLink className="h-4 w-4 opacity-90" />
                        </Link>
                      </div>
                    </div>
                  </DashboardPanel>
                ) : null}
                {!emailConfigured ? (
                  <DashboardPanel tone="amber" intensity="soft">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                        <Mail className="h-5 w-5 text-amber-200" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-amber-100">{model.emailAlertTitle}</p>
                        <p className="mt-1 text-sm text-amber-100/85">{model.emailAlertMessage}</p>
                        <button
                          type="button"
                          onClick={() => scrollToSection("mc-notifications")}
                          className={`mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-50 transition hover:bg-amber-500/25 ${FOCUS_RING_CLASS}`}
                        >
                          {model.emailAlertCta}
                          <ChevronDown className="h-3.5 w-3.5 -rotate-90" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </DashboardPanel>
                ) : null}
              </div>
            </MemberBentoCell>
          </MemberBentoRow>
        )}

        {/* Row 4 — Staff announcements */}
        {staffAnnouncements.length > 0 ? (
          <MemberBentoRow>
            <MemberBentoCell span={12}>
              <DashboardPanel tone="amber" accentHex={model.accent} intensity="medium">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <DashboardPanelHeader
                    kicker={model.announcementsKicker}
                    title={model.announcementsTitle}
                    icon={Megaphone}
                    tone="amber"
                    accentHex={model.accent}
                  />
                  <Link
                    href="/admin/moderation/staff/info/annonces-staff"
                    className={`text-xs font-semibold text-amber-200/90 underline-offset-2 hover:underline ${FOCUS_RING_CLASS}`}
                  >
                    Gérer les annonces
                  </Link>
                </div>
                <p className="mb-4 text-xs text-white/45">{model.announcementsIntro}</p>
                <ul className="space-y-2">
                  {staffAnnouncements.map((a) => {
                    const open = Boolean(expandedAnnIds[a.id]);
                    return (
                      <li key={a.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                        <button
                          type="button"
                          onClick={() => setExpandedAnnIds((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
                          className={`flex w-full items-start justify-between gap-3 p-4 text-left transition hover:bg-white/[0.04] ${FOCUS_RING_CLASS}`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-50">{a.title}</p>
                            <p className="mt-1 text-[11px] text-zinc-500">{formatDateFr(a.createdAt)}</p>
                            <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-amber-200/80">
                              {open ? "Masquer le détail" : "Lire l'annonce"}
                            </p>
                          </div>
                          <ChevronDown
                            className={`mt-1 h-5 w-5 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
                            aria-hidden
                          />
                        </button>
                        {open ? (
                          <div className="border-t border-white/5 px-4 pb-4 pt-2">
                            {a.imageUrl ? (
                              <div className="relative mt-2 aspect-video max-w-xl overflow-hidden rounded-xl border border-white/10">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={a.imageUrl} alt="" className="h-full w-full object-cover" />
                              </div>
                            ) : null}
                            <div className="mt-3 max-h-[min(60vh,420px)] overflow-y-auto text-sm leading-relaxed text-zinc-400">
                              <AnnouncementMarkdown content={a.body} />
                            </div>
                            {a.link ? (
                              <a
                                href={a.link}
                                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-300 underline-offset-2 hover:underline"
                              >
                                Lien associé <ArrowUpRight className="h-3 w-3 opacity-80" aria-hidden />
                              </a>
                            ) : null}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </DashboardPanel>
            </MemberBentoCell>
          </MemberBentoRow>
        ) : null}

        {/* Row 5 — Advanced admin pilotage */}
        {data.hasAdvancedAdminView ? (
          <MemberBentoRow>
            <MemberBentoCell span={12}>
              <DashboardPanel tone="violet" intensity="medium">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
                      <ClipboardList className="h-5 w-5 text-indigo-200" aria-hidden />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-indigo-100">{model.pilotageTitle}</p>
                      <p className="mt-1 max-w-xl text-xs leading-relaxed text-indigo-100/75">{model.pilotageIntro}</p>
                    </div>
                  </div>
                  <Link
                    href="/admin/mon-compte/pilotage-staff"
                    className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-400/40 bg-indigo-500/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500/30 ${FOCUS_RING_CLASS}`}
                  >
                    {model.pilotageCta}
                    <ChevronRight className="h-4 w-4 opacity-90" />
                  </Link>
                </div>
              </DashboardPanel>
            </MemberBentoCell>
          </MemberBentoRow>
        ) : null}

        {/* Row 6 — Identity + Missions */}
        <MemberBentoRow>
          <MemberBentoCell span={6}>
            <DashboardPanel
              id="mc-identite"
              tone="accent"
              accentHex={model.accent}
              className={MEMBER_SCROLL_MT}
              ariaLabelledBy="admin-account-identity-title"
            >
              <DashboardPanelHeader
                kicker={model.identityKicker}
                title={model.identityTitle}
                icon={User}
                tone="accent"
                accentHex={model.accent}
                titleId="admin-account-identity-title"
              />
              <p className="mb-4 text-xs text-white/50">{model.identityIntro}</p>
              <dl className="space-y-4">
                {[
                  ["Nom affiché", data.displayName || "—"],
                  ["Pseudo site", data.siteUsername || "—"],
                  ["Rôle membre (site)", data.siteRole || "—"],
                  ["Rôle administration", data.adminRoleLabel],
                  ["Pseudo Discord (fiche)", data.discordUsername || "—"],
                ].map(([k, v]) => (
                  <div key={String(k)} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{k}</dt>
                    <dd className="mt-1 text-sm font-medium text-white/90">{v}</dd>
                  </div>
                ))}
                <div className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Chaîne Twitch</dt>
                  <dd className="mt-1">
                    {data.twitchUrl ? (
                      <a
                        href={data.twitchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex items-center gap-2 text-sm font-medium text-sky-300 transition hover:text-sky-200"
                      >
                        <Video className="h-4 w-4 shrink-0 opacity-80" />
                        <span className="underline-offset-2 group-hover:underline">
                          {data.twitchDisplayNameLinked || data.twitchLogin || data.twitchUrl.replace(/^https?:\/\//, "")}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                      </a>
                    ) : (
                      <span className="text-sm text-white/45">Aucune URL — complète ta fiche membre si besoin.</span>
                    )}
                  </dd>
                  {data.hasLinkedTwitchAccount ? (
                    <p className="mt-2 text-xs text-emerald-400/90">Compte Twitch relié (OAuth) détecté.</p>
                  ) : null}
                </div>
              </dl>
            </DashboardPanel>
          </MemberBentoCell>
          <MemberBentoCell span={6}>
            <DashboardPanel tone="gold" accentHex={model.accent} ariaLabelledBy="admin-account-missions-title">
              <DashboardPanelHeader
                kicker={model.missionsKicker}
                title={model.missionsTitle}
                icon={Sparkles}
                tone="gold"
                accentHex={model.accent}
                titleId="admin-account-missions-title"
              />
              <p className="mb-4 text-xs text-white/50">{model.missionsIntro}</p>

              {data.staffMissions.length > 0 ? (
                <ul className="space-y-3 text-sm text-zinc-200">
                  {data.staffMissions.map((m) => (
                    <li key={m.id} className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
                      <p className="font-semibold text-white/90">{m.title}</p>
                      {m.description ? (
                        <p className="mt-1.5 text-xs leading-relaxed text-white/55">{m.description}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <ul className="space-y-3 text-sm text-white/75">
                    {model.defaultMissionLines.map((line) => (
                      <li key={line} className="flex gap-2 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" aria-hidden />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs italic text-white/40">{model.missionsFallbackNote}</p>
                </>
              )}

              <div className={`${MEMBER_FOOTER_DIVIDER} mt-4`}>
                <MemberSecondaryLink href="/admin/gestion-acces/organigramme-staff">
                  {model.organigrammeCta}
                  <ChevronRight className="h-3.5 w-3.5 opacity-80" />
                </MemberSecondaryLink>
                {data.adminRole === "FONDATEUR" || data.adminRole === "ADMIN_COORDINATEUR" ? (
                  <MemberSecondaryLink href="/admin/gestion-acces/missions-staff">
                    {model.missionsManageCta}
                    <ChevronRight className="h-3.5 w-3.5 opacity-80" />
                  </MemberSecondaryLink>
                ) : null}
              </div>
            </DashboardPanel>
          </MemberBentoCell>
        </MemberBentoRow>

        {/* Row 7 — Charter + Email */}
        <MemberBentoRow>
          <MemberBentoCell span={7}>
            <DashboardPanel
              id="mc-charte"
              tone="emerald"
              accentHex={model.accent}
              className={MEMBER_SCROLL_MT}
              ariaLabelledBy="admin-account-charter-title"
            >
              <DashboardPanelHeader
                kicker={model.charterKicker}
                title={model.charterTitle}
                icon={BookOpen}
                tone="emerald"
                accentHex={model.accent}
                titleId="admin-account-charter-title"
              />
              <p className="mb-4 text-xs text-white/50">
                {model.charterIntro} · Version actuelle :{" "}
                <span className="text-white/75">{charter.currentVersion}</span>
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    charter.accepted
                      ? "border border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
                      : "border border-amber-500/35 bg-amber-500/10 text-amber-100"
                  }`}
                >
                  {charter.accepted ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Charte acceptée
                    </>
                  ) : (
                    <>
                      <Clock className="h-3.5 w-3.5" />
                      Non validée
                    </>
                  )}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    charteVersionBadge === "À jour"
                      ? "border border-sky-500/35 bg-sky-500/10 text-sky-100"
                      : charteVersionBadge === "Mise à jour"
                        ? "border border-orange-500/40 bg-orange-500/10 text-orange-100"
                        : "border border-amber-500/35 bg-amber-500/10 text-amber-100"
                  }`}
                >
                  {charteVersionBadge === "À jour"
                    ? "Version : à jour"
                    : charteVersionBadge === "Mise à jour"
                      ? "Version : à mettre à jour"
                      : "Signature requise"}
                </span>
                {!charter.accepted ? (
                  <span className="text-xs text-white/45">
                    Échéance indicative : {new Date(charter.deadlineIso).toLocaleString("fr-FR")}
                  </span>
                ) : null}
              </div>

              {charter.accepted ? (
                <p className="mt-3 text-xs leading-relaxed text-white/45">
                  Prochaine revalidation : lorsqu'une <span className="text-white/70">nouvelle version</span> de la
                  charte est publiée, une nouvelle lecture / signature pourra être demandée depuis la page charte.
                </p>
              ) : null}

              {!charter.accepted ? (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-[10px] font-medium uppercase tracking-wider text-white/45">
                    <span>Délai 15 jours</span>
                    <span>{charter.graceElapsed ? "Dépassé" : `${charter.daysRemainingApprox ?? "—"} j. restants`}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        charter.graceElapsed
                          ? "bg-gradient-to-r from-red-500 to-amber-500"
                          : "bg-gradient-to-r from-amber-400 to-amber-300"
                      }`}
                      style={{ width: `${charterPercent}%` }}
                    />
                  </div>
                </div>
              ) : null}

              {charter.accepted && charter.validatedAt ? (
                <p className="mt-4 text-sm text-white/55">
                  Validée le{" "}
                  <span className="font-medium text-white/85">
                    {new Date(charter.validatedAt).toLocaleString("fr-FR")}
                  </span>
                  {charter.validatedVersion ? (
                    <>
                      {" "}
                      · <span className="text-white/75">{charter.validatedVersion}</span>
                    </>
                  ) : null}
                </p>
              ) : null}

              <div className={`${MEMBER_FOOTER_DIVIDER} mt-4`}>
                <MemberSecondaryLink href="/admin/moderation/staff/info/charte">
                  {model.charterAlertCta}
                  <ChevronRight className="h-4 w-4 opacity-80" />
                </MemberSecondaryLink>
                <MemberSecondaryLink href="/admin/moderation/staff/info/charte">
                  <BookOpen className="h-4 w-4 opacity-90" aria-hidden />
                  {model.charterRelireCta}
                </MemberSecondaryLink>
                <MemberSecondaryLink href="/admin/moderation/staff/info/validation-charte">
                  {model.charterValidatePageCta}
                </MemberSecondaryLink>
              </div>
            </DashboardPanel>
          </MemberBentoCell>
          <MemberBentoCell span={5}>
            <DashboardPanel
              id="mc-notifications"
              tone="amber"
              accentHex={model.accent}
              className={MEMBER_SCROLL_MT}
              ariaLabelledBy="admin-account-email-title"
            >
              <DashboardPanelHeader
                kicker={model.emailKicker}
                title={model.emailTitle}
                icon={Mail}
                tone="amber"
                accentHex={model.accent}
                titleId="admin-account-email-title"
              />
              <p className="mb-4 text-sm text-white/65">{model.emailIntro}</p>

              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="staff-email" className="mb-2 block text-xs font-medium text-amber-200/80">
                    {model.emailFieldLabel}
                  </label>
                  <input
                    id="staff-email"
                    type="email"
                    autoComplete="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full rounded-xl border border-amber-500/25 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-400/55 focus:shadow-[0_0_0_3px_rgba(251,191,36,0.12)]"
                    placeholder={model.emailFieldPlaceholder}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void saveEmail()}
                    className={`rounded-xl px-5 py-2.5 text-sm font-bold text-[#1a1408] shadow-md transition enabled:hover:brightness-105 disabled:opacity-50 ${FOCUS_RING_CLASS}`}
                    style={{ background: `linear-gradient(180deg, ${hexToRgba(model.accent, 0.95)}, ${hexToRgba(model.accent, 0.75)})` }}
                  >
                    {saving ? "Enregistrement…" : model.emailSaveLabel}
                  </button>
                  <button
                    type="button"
                    disabled={testEmailBusy || saving}
                    onClick={() => void sendTestStaffEmail()}
                    className={`rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 text-sm font-semibold text-amber-50 transition enabled:hover:bg-amber-500/25 disabled:opacity-45 ${FOCUS_RING_CLASS}`}
                  >
                    {testEmailBusy ? "Envoi…" : model.emailTestLabel}
                  </button>
                </div>
              </div>

              {saveMessage ? (
                <MemberAlert
                  variant={
                    saveMessage.includes("refus") || saveMessage.includes("Erreur") ? "error" : "success"
                  }
                >
                  {saveMessage}
                </MemberAlert>
              ) : null}
              {testEmailMessage ? (
                <MemberAlert
                  variant={
                    testEmailMessage.includes("Erreur") ||
                    testEmailMessage.includes("Impossible") ||
                    testEmailMessage.includes("non configuré")
                      ? "error"
                      : "success"
                  }
                >
                  {testEmailMessage}
                </MemberAlert>
              ) : null}
            </DashboardPanel>
          </MemberBentoCell>
        </MemberBentoRow>

        {/* Row 8 — Activity + Stats */}
        <MemberBentoRow>
          <MemberBentoCell span={6}>
            <DashboardPanel tone="neutral" ariaLabelledBy="admin-account-activity-title">
              <DashboardPanelHeader
                kicker={model.activityKicker}
                title={model.activityTitle}
                icon={History}
                tone="neutral"
                accentHex={model.accent}
                titleId="admin-account-activity-title"
              />
              <p className="mb-4 text-xs text-white/45">{model.activityIntro}</p>
              <ul className="space-y-3">
                {staffFeed.length === 0 ? (
                  <li className="text-sm text-white/45">{model.activityEmpty}</li>
                ) : (
                  staffFeed.slice(0, 5).map((a) => (
                    <li key={a.id} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <p className="text-sm font-medium text-white/90">{a.headline}</p>
                      <p className="mt-0.5 text-xs text-white/45">
                        {a.subline} · <span className="text-white/55">{a.timestamp}</span>
                      </p>
                    </li>
                  ))
                )}
              </ul>
              <div className={`${MEMBER_FOOTER_DIVIDER} mt-4`}>
                <Link
                  href="/admin/membres/gestion"
                  className={`inline-flex items-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20 ${FOCUS_RING_CLASS}`}
                >
                  <UserPlus className="h-3.5 w-3.5" aria-hidden />
                  Ajouter / gérer un membre
                </Link>
                <Link
                  href="/admin/gestion-acces/comptes"
                  className={`inline-flex items-center gap-2 rounded-xl border border-indigo-500/35 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-500/20 ${FOCUS_RING_CLASS}`}
                >
                  <Shield className="h-3.5 w-3.5" aria-hidden />
                  Comptes & rôles
                </Link>
                <Link
                  href="/admin/moderation/staff/info/annonces-staff"
                  className={`inline-flex items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/20 ${FOCUS_RING_CLASS}`}
                >
                  <Megaphone className="h-3.5 w-3.5" aria-hidden />
                  Annonce staff
                </Link>
              </div>
            </DashboardPanel>
          </MemberBentoCell>
          <MemberBentoCell span={6}>
            <DashboardPanel tone="cyan" accentHex={model.accent} ariaLabelledBy="admin-account-stats-title">
              <DashboardPanelHeader
                kicker={model.statsKicker}
                title={model.statsTitle}
                icon={Sparkles}
                tone="cyan"
                accentHex={model.accent}
                titleId="admin-account-stats-title"
              />
              <p className="mb-4 text-xs text-white/45">{model.statsIntro}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/admin/membres"
                  title="Ouvrir l'annuaire membres"
                  className={`block transition hover:opacity-95 ${FOCUS_RING_CLASS}`}
                >
                  <MemberHeroStat
                    icon={User}
                    label="Membres actifs (clic)"
                    value={snap?.activeCommunityMembers != null ? String(snap.activeCommunityMembers) : "—"}
                    accent={model.accent}
                  />
                </Link>
                <MemberHeroStat
                  icon={Shield}
                  label="Modos actifs / en pause"
                  value={snap ? `${snap.moderatorsActive} / ${snap.moderatorsPaused}` : "—"}
                  accent={model.accent}
                />
                <MemberHeroStat
                  icon={KeyRound}
                  label="Comptes avec accès admin"
                  value={snap?.staffWithDashboardAccess != null ? String(snap.staffWithDashboardAccess) : "—"}
                  accent={model.accent}
                />
                <MemberHeroStat
                  icon={Mail}
                  label="Ton e-mail alertes"
                  value={emailConfigured ? model.statsEmailOk : model.statsEmailMissing}
                  accent={emailConfigured ? "#22c55e" : "#f59e0b"}
                />
              </div>
            </DashboardPanel>
          </MemberBentoCell>
        </MemberBentoRow>

        {/* Row 9 — Quick links + About */}
        <MemberBentoRow>
          <MemberBentoCell span={8}>
            <DashboardPanel tone="accent" accentHex={model.accent} ariaLabelledBy="admin-account-quicklinks-title">
              <DashboardPanelHeader
                kicker={model.quickLinksKicker}
                title={model.quickLinksTitle}
                icon={ArrowUpRight}
                tone="accent"
                accentHex={model.accent}
                titleId="admin-account-quicklinks-title"
              />
              <p className="mb-4 text-xs text-white/45">{model.quickLinksIntro}</p>
              <ul className="space-y-2">
                {model.quickLinks.map((item) => {
                  const Icon = quickLinkIcon(item.title);
                  return (
                    <li key={item.href}>
                      <DashboardInteractiveLink accentHex={item.tone}>
                        <Link
                          href={item.href}
                          title={`${item.title} — ${item.desc}`}
                          className={`flex items-center gap-3 px-3 py-3 ${FOCUS_RING_CLASS}`}
                        >
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                            style={{
                              backgroundColor: hexToRgba(item.tone, 0.15),
                              color: hexToRgba(item.tone, 0.95),
                            }}
                          >
                            <Icon className="h-5 w-5" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-white/90">{item.title}</span>
                            <span className="block text-xs text-white/45">{item.desc}</span>
                          </span>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-white/35 transition group-hover/link:text-white/70" />
                        </Link>
                      </DashboardInteractiveLink>
                    </li>
                  );
                })}
              </ul>
            </DashboardPanel>
          </MemberBentoCell>
          <MemberBentoCell span={4}>
            <DashboardPanel tone="neutral" ariaLabelledBy="admin-account-about-title">
              <h2 id="admin-account-about-title" className="text-lg font-bold text-white">
                {model.aboutTitle}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-white/55">
                {model.aboutParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </DashboardPanel>
          </MemberBentoCell>
        </MemberBentoRow>

        {/* Row 10 — Technical IDs */}
        {data.sensitive ? (
          <MemberBentoRow>
            <MemberBentoCell span={12}>
              <DashboardPanel
                id="mc-tech"
                tone="violet"
                intensity="bold"
                className={MEMBER_SCROLL_MT}
                ariaLabelledBy="admin-account-tech-title"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <DashboardPanelHeader
                    kicker="Confidentiel"
                    title={model.technicalTitle}
                    icon={KeyRound}
                    tone="violet"
                    titleId="admin-account-tech-title"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSensitiveIds((v) => !v)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-white/25 hover:text-white ${FOCUS_RING_CLASS}`}
                    >
                      {showSensitiveIds ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {showSensitiveIds ? "Masquer" : "Afficher"}
                    </button>
                    <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-200">
                      Confidentiel
                    </span>
                  </div>
                </div>
                <p className="mb-4 text-xs text-white/45">{model.technicalIntro}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TechnicalCopyField
                    title="ID Discord"
                    subtitle="Identifiant unique utilisateur Discord (snowflake), stable dans le temps."
                    value={data.sensitive.discordId}
                    masked={!showSensitiveIds}
                  />
                  <DashboardInnerCard className="sm:col-span-2">
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
                      Affichage Discord
                    </span>
                    <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <span className="text-xs text-white/45">Rename (global_name)</span>
                        <p className="font-medium text-white/90">
                          {!showSensitiveIds ? "••••••" : data.sensitive.discordRename || "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-white/45">Handle</span>
                        <p className="font-medium text-white/90">
                          {!showSensitiveIds
                            ? "••••••"
                            : data.sensitive.discordHandle
                              ? `@${data.sensitive.discordHandle}`
                              : "—"}
                        </p>
                      </div>
                    </div>
                  </DashboardInnerCard>
                  <div className="sm:col-span-2">
                    {data.sensitive.twitchId ? (
                      <TechnicalCopyField
                        title="ID Twitch"
                        subtitle="Identifiant compte Twitch pour les intégrations API / webhooks."
                        value={data.sensitive.twitchId}
                        masked={!showSensitiveIds}
                      />
                    ) : (
                      <p className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-4 text-center text-sm text-white/45">
                        Aucun ID Twitch en base pour l'instant (lie ton compte ou complète la fiche membre).
                      </p>
                    )}
                  </div>
                </div>
              </DashboardPanel>
            </MemberBentoCell>
          </MemberBentoRow>
        ) : null}

        {/* Footer */}
        <footer className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 py-5 text-center text-xs leading-relaxed text-white/40">
          {model.footerNote}
        </footer>
      </MemberBentoShell>
    </div>
  );
}
