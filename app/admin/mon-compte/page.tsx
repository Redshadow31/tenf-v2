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
  ClipboardCopy,
  ClipboardList,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Globe2,
  HeartHandshake,
  History,
  KeyRound,
  Loader2,
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
import AnnouncementMarkdown from "@/components/ui/AnnouncementMarkdown";

type CharterPayload = {
  currentVersion: string;
  accepted: boolean;
  validatedAt: string | null;
  validatedVersion: string | null;
  deadlineIso: string;
  daysRemainingApprox: number | null;
  graceElapsed: boolean;
};

type SensitivePayload = {
  discordId: string;
  discordRename: string | null;
  discordHandle: string | null;
  twitchId: string | null;
} | null;

type StaffSnapshotPayload = {
  activeCommunityMembers: number | null;
  moderatorsActive: number;
  moderatorsPaused: number;
  staffWithDashboardAccess: number;
} | null;

type StaffFeedItem = {
  id: string;
  headline: string;
  subline: string;
  timestamp: string;
  timestampIso: string;
};

type StaffMissionItem = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
};

type StaffAnnouncementBrief = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  imageUrl: string | null;
  createdAt: string;
};

type AccountPayload = {
  hasAdvancedAdminView: boolean;
  displayName: string | null;
  siteUsername: string | null;
  siteRole: string | null;
  adminRole: string;
  adminRoleLabel: string;
  discordUsername: string | null;
  twitchLogin: string | null;
  twitchDisplayNameLinked: string | null;
  hasLinkedTwitchAccount: boolean;
  twitchUrl: string | null;
  integrationDateIso: string | null;
  memberCreatedAtIso: string | null;
  charter: CharterPayload;
  staffNotificationEmail: string;
  staffSnapshot: StaffSnapshotPayload;
  staffMissions: StaffMissionItem[];
  sensitive: SensitivePayload;
};

const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-[#0a0c10]";

function initialsFromName(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  return name.trim().slice(0, 2).toUpperCase();
}

function formatDateFr(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function charterTimelinePercent(charter: CharterPayload): number {
  if (charter.accepted) return 100;
  const end = new Date(charter.deadlineIso).getTime();
  const start = end - FIFTEEN_DAYS_MS;
  const now = Date.now();
  const raw = ((now - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, raw));
}

function TechnicalCopyField({
  title,
  subtitle,
  value,
  masked,
}: {
  title: string;
  subtitle: string;
  value: string;
  masked: boolean;
}) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      // ignore
    }
  }
  const shown = masked ? "•".repeat(18) : value;
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <div>
        <span className="text-xs font-semibold text-zinc-200">{title}</span>
        <p className="text-[11px] leading-snug text-zinc-500">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <code className="break-all text-xs text-zinc-200">{shown}</code>
        <button
          type="button"
          onClick={() => void copy()}
          disabled={masked}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${
            masked
              ? "border-white/10 bg-white/5 text-zinc-500"
              : "border-[#c9a227]/40 bg-[#c9a227]/15 text-[#f5edd8] hover:bg-[#c9a227]/25"
          } ${focusRingClass}`}
        >
          {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
          {done ? "Copié" : "Copier"}
        </button>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone = "neutral" as "neutral" | "ok" | "warn" | "danger",
}: {
  icon: typeof User;
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warn" | "danger";
}) {
  const ring =
    tone === "ok"
      ? "border-emerald-500/25 bg-emerald-500/[0.07]"
      : tone === "warn"
        ? "border-amber-500/30 bg-amber-500/[0.08]"
        : tone === "danger"
          ? "border-red-500/35 bg-red-500/[0.08]"
          : "border-white/10 bg-white/[0.03]";
  return (
    <div className={`rounded-2xl border p-4 ${ring}`}>
      <div className="flex items-center gap-2 text-zinc-500">
        <Icon className="h-4 w-4 shrink-0 text-[#c9a227]/90" aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-snug text-zinc-100">{value}</p>
    </div>
  );
}

type CockpitMiniCardAction =
  | { kind: "none" }
  | { kind: "link"; href: string }
  | { kind: "scroll"; targetId: string };

function CockpitMiniCard({
  icon: Icon,
  label,
  value,
  tone,
  action = { kind: "none" },
}: {
  icon: typeof User;
  label: string;
  value: string;
  tone: "ok" | "warn" | "danger" | "neutral";
  action?: CockpitMiniCardAction;
}) {
  const bar =
    tone === "ok"
      ? "bg-emerald-500"
      : tone === "warn"
        ? "bg-amber-400"
        : tone === "danger"
          ? "bg-red-500"
          : "bg-zinc-500";
  const interactive =
    action.kind !== "none"
      ? "cursor-pointer transition hover:border-[#c9a227]/35 hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0c10]"
      : "";
  const shellClass = `relative flex min-h-[88px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/35 pl-3.5 pr-3 py-3 text-left shadow-inner ${interactive}`;

  const inner = (
    <>
      <span className={`absolute left-0 top-0 h-full w-1 ${bar}`} aria-hidden />
      <div className="flex items-center gap-2 pl-1">
        <Icon className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</span>
      </div>
      <p className="mt-2 flex-1 pl-1 text-sm font-semibold leading-snug text-zinc-50">{value}</p>
      {action.kind !== "none" ? (
        <span className="mt-1 pl-1 text-[10px] font-semibold uppercase tracking-wider text-[#c9a227]/80">
          {action.kind === "link" ? "Ouvrir →" : "Aller à la section →"}
        </span>
      ) : null}
    </>
  );

  if (action.kind === "link") {
    return (
      <Link href={action.href} className={`${shellClass} block`}>
        {inner}
      </Link>
    );
  }
  if (action.kind === "scroll") {
    return (
      <button
        type="button"
        className={shellClass}
        onClick={() =>
          document.getElementById(action.targetId)?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      >
        {inner}
      </button>
    );
  }
  return <div className={shellClass}>{inner}</div>;
}

function staffMissionLines(adminRole: string): string[] {
  const common = "Réagir aux alertes staff et garder la charte à jour.";
  switch (adminRole) {
    case "FONDATEUR":
      return [
        "Piloter la structure staff, arbitrer les cas sensibles et valider les accès critiques.",
        "Veiller à la cohérence des outils (modération, membres, accès).",
        common,
      ];
    case "ADMIN_COORDINATEUR":
      return [
        "Coordonner le quotidien staff : suivis, intégrations et montées en compétences.",
        "Relayer les consignes entre fondateurs et équipe terrain.",
        common,
      ];
    case "MODERATEUR":
    case "MODERATEUR_EN_FORMATION":
      return [
        "Appliquer les consignes de modération et remonter les incidents structurants.",
        "Accompagner les membres avec le ton TENF (bienveillance + fermeté).",
        common,
      ];
    case "MODERATEUR_EN_PAUSE":
      return [
        "Tu es en pause : pas d’action terrain sauf urgence explicitement demandée par la direction.",
        "Pense à te réactualiser sur la charte avant toute reprise.",
      ];
    case "SOUTIEN_TENF":
      return [
        "Soutenir les opérations (événements, logistique, contenus) selon les missions qui te sont confiées.",
        common,
      ];
    default:
      return [common];
  }
}

const QUICK_LINKS = [
  {
    href: "/admin/moderation/staff",
    title: "Modération staff",
    desc: "Hub outils modération, files et procédures opérationnelles.",
    icon: Shield,
    accent: "rose" as const,
  },
  {
    href: "/admin/moderation/staff/info/charte",
    title: "Charte & validation",
    desc: "Lire, comprendre et signer la charte de modération TENF.",
    icon: BookOpen,
    accent: "sky" as const,
  },
  {
    href: "/admin/gestion-acces/organigramme-staff",
    title: "Organigramme",
    desc: "Vue d’ensemble des rôles, binômes et référents.",
    icon: Sparkles,
    accent: "violet" as const,
  },
  {
    href: "/admin/membres",
    title: "Membres",
    desc: "Accès rapide à l’annuaire et aux fiches communauté.",
    icon: User,
    accent: "emerald" as const,
  },
] as const;

const quickAccentRing: Record<(typeof QUICK_LINKS)[number]["accent"], string> = {
  rose: "border-rose-500/35 bg-rose-500/[0.07] hover:border-rose-400/45",
  sky: "border-sky-500/35 bg-sky-500/[0.07] hover:border-sky-400/45",
  violet: "border-violet-500/35 bg-violet-500/[0.07] hover:border-violet-400/45",
  emerald: "border-emerald-500/35 bg-emerald-500/[0.07] hover:border-emerald-400/45",
};

const quickAccentIcon: Record<(typeof QUICK_LINKS)[number]["accent"], string> = {
  rose: "bg-rose-500/15 text-rose-200",
  sky: "bg-sky-500/15 text-sky-200",
  violet: "bg-violet-500/15 text-violet-200",
  emerald: "bg-emerald-500/15 text-emerald-200",
};

const EXPERIENCE_LINKS = [
  {
    href: "/member/dashboard",
    title: "Espace membre",
    description: "Tableau de bord créateur : le même parcours que les membres TENF (nouvel onglet).",
    icon: Eye,
    cardClass:
      "border-violet-500/35 bg-gradient-to-br from-violet-950/45 to-black/35 hover:border-violet-400/55 hover:shadow-lg hover:shadow-violet-950/20",
    iconClass: "bg-violet-500/20 text-violet-200",
  },
  {
    href: "/rejoindre/guide-public/presentation-rapide",
    title: "Parcours public",
    description: "Ce que voit un visiteur avant d’adhérer — pour aligner ton discours staff avec le site.",
    icon: Globe2,
    cardClass:
      "border-sky-500/35 bg-gradient-to-br from-sky-950/35 to-black/35 hover:border-sky-400/50 hover:shadow-lg hover:shadow-sky-950/15",
    iconClass: "bg-sky-500/18 text-sky-200",
  },
  {
    href: "/member/evenements",
    title: "Événements côté membre",
    description: "Inscriptions et rendez-vous tels qu’affichés dans l’espace connecté.",
    icon: CalendarDays,
    cardClass:
      "border-emerald-500/35 bg-gradient-to-br from-emerald-950/35 to-black/35 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-950/15",
    iconClass: "bg-emerald-500/18 text-emerald-200",
  },
] as const;

const MC_NAV_SECTIONS = [
  { id: "mc-hero", label: "Vue d’ensemble" },
  { id: "mc-cockpit", label: "Cockpit" },
  { id: "mc-actions", label: "Actions & stats" },
  { id: "mc-identite", label: "Identité" },
  { id: "mc-charte", label: "Charte" },
  { id: "mc-notifications", label: "E-mail staff" },
] as const;

export default function AdminMonComptePage() {
  const [data, setData] = useState<AccountPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [staffFeed, setStaffFeed] = useState<StaffFeedItem[]>([]);
  const [staffAnnouncements, setStaffAnnouncements] = useState<StaffAnnouncementBrief[]>([]);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [showSensitiveIds, setShowSensitiveIds] = useState(false);
  const [testEmailBusy, setTestEmailBusy] = useState(false);
  const [testEmailMessage, setTestEmailMessage] = useState<string | null>(null);
  const [expandedAnnIds, setExpandedAnnIds] = useState<Record<string, boolean>>({});

  const scrollToMc = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/me/account", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/auth/login";
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Impossible de charger la fiche.");
      }
      const json = (await res.json()) as AccountPayload;
      setData({
        ...json,
        staffSnapshot: json.staffSnapshot ?? null,
        staffMissions: Array.isArray(json.staffMissions) ? json.staffMissions : [],
      });
      setEmailInput(json.staffNotificationEmail || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/me/staff-activity", { cache: "no-store" });
        if (!r.ok || cancelled) return;
        const j = (await r.json()) as { items?: StaffFeedItem[] };
        if (!cancelled) setStaffFeed(Array.isArray(j.items) ? j.items : []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/staff-announcements?audience=staff", { cache: "no-store" });
        if (!r.ok || cancelled) return;
        const j = (await r.json()) as { items?: StaffAnnouncementBrief[] };
        const raw = Array.isArray(j.items) ? j.items : [];
        if (!cancelled) setStaffAnnouncements(raw.slice(0, 6));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
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
      await load();
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
        throw new Error(typeof j?.error === "string" ? j.error : "Impossible d’envoyer le test.");
      }
      setTestEmailMessage("E-mail de test envoyé. Vérifie ta boîte (et les spams).");
    } catch (e) {
      setTestEmailMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setTestEmailBusy(false);
    }
  }

  const charterPercent = useMemo(() => (data ? charterTimelinePercent(data.charter) : 0), [data]);

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="relative min-h-[22rem] overflow-hidden rounded-3xl border border-white/10 bg-[#06080f]">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(ellipse 120% 80% at 10% -20%, rgba(201,162,39,0.18), transparent 55%), radial-gradient(ellipse 80% 60% at 100% 0%, rgba(99,102,241,0.12), transparent 50%)",
            }}
          />
          <div className="relative flex flex-col gap-8 p-8 md:flex-row md:items-center">
            <div className="h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-white/10" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
              <div className="h-8 max-w-md animate-pulse rounded-lg bg-white/10" />
              <div className="h-16 max-w-xl animate-pulse rounded-lg bg-white/5" />
              <div className="flex flex-wrap gap-2">
                <div className="h-7 w-32 animate-pulse rounded-full bg-white/5" />
                <div className="h-7 w-40 animate-pulse rounded-full bg-white/5" />
              </div>
            </div>
          </div>
          <div className="grid gap-3 border-t border-white/5 p-6 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        </div>
        <div className="flex min-h-[120px] items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/30 py-8">
          <Loader2 className="h-6 w-6 shrink-0 animate-spin text-[#c9a227]" aria-hidden />
          <p className="text-sm font-medium text-zinc-400">Chargement de ton espace staff…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/50 to-[#0c0f16] p-8 text-center shadow-xl shadow-red-950/20">
        <AlertTriangle className="mx-auto h-10 w-10 text-red-400/90" aria-hidden />
        <p className="mt-4 text-base text-red-100/95">{error || "Données indisponibles."}</p>
        <button
          type="button"
          onClick={() => void load()}
          className={`mt-6 inline-flex items-center gap-2 rounded-xl border border-red-400/35 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/20 ${focusRingClass}`}
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </button>
      </div>
    );
  }

  const { charter } = data;
  const charterUrgent =
    !charter.accepted && (charter.graceElapsed || (charter.daysRemainingApprox ?? 99) <= 5);
  const emailConfigured = Boolean(data.staffNotificationEmail?.trim());
  const initials = initialsFromName(data.displayName);
  const snap = data.staffSnapshot;
  const alertsDanger = charterUrgent;
  const alertsAttention = !charter.accepted || !emailConfigured;
  const alertsTone: "ok" | "warn" | "danger" = alertsDanger ? "danger" : alertsAttention ? "warn" : "ok";
  const alertsValue = alertsDanger ? "Urgent" : alertsAttention ? "À vérifier" : "Tout est OK";
  const charterCockpitValue = charter.accepted ? "Validée" : charter.graceElapsed ? "Délai dépassé" : "À signer";
  const charterCockpitTone: "ok" | "warn" | "danger" = charter.accepted ? "ok" : charterUrgent ? "danger" : "warn";
  const charteVersionBadge =
    !charter.accepted ? "À signer" : charter.validatedVersion && charter.validatedVersion !== charter.currentVersion ? "Mise à jour" : "À jour";

  return (
    <div className="space-y-8 pb-12">
      {/* Hero : staff + ancrage visuel membres & public */}
      <section
        id="mc-hero"
        className="scroll-mt-24 relative overflow-hidden rounded-3xl border text-white shadow-2xl"
        style={{
          borderColor: "rgba(212, 175, 55, 0.22)",
          background:
            "linear-gradient(145deg, rgba(18,16,28,0.98) 0%, rgba(8,10,18,0.99) 45%, rgba(12,14,24,1) 100%), radial-gradient(ellipse 100% 80% at 0% 0%, rgba(201,162,39,0.16), transparent 55%), radial-gradient(ellipse 70% 50% at 100% 20%, rgba(99,102,241,0.14), transparent 50%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(16,185,129,0.08), transparent 45%)",
        }}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#c9a227]/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-indigo-500/12 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/5 blur-3xl" />

        <div className="relative flex flex-col gap-8 p-6 md:flex-row md:items-end md:justify-between md:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 text-2xl font-bold tracking-tight shadow-inner ring-1 ring-white/10 transition hover:ring-[#c9a227]/30"
              style={{
                borderColor: "rgba(201,162,39,0.45)",
                background: "linear-gradient(160deg, rgba(201,162,39,0.25), rgba(20,22,32,0.9))",
                color: "#f5edd8",
                boxShadow: "0 0 48px rgba(201,162,39,0.12)",
              }}
              aria-hidden
            >
              {initials}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]/90">
                Staff TENF · profil & impact communauté
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">Mon compte</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
                Tu es aussi <strong className="font-medium text-zinc-200">membre TENF</strong> : cette page relie ton
                rôle staff, ta <strong className="font-medium text-violet-200/95">fiche utilisateur</strong> et ce que
                voient le <strong className="font-medium text-sky-200/95">public</strong> sur le site. Utilise les
                cartes ci-dessous pour te recaler visuellement avant d’agir dans l’admin.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-2.5 py-1">
                  <Clock className="h-3.5 w-3.5 text-zinc-500" />
                  Fiche membre depuis {formatDateFr(data.memberCreatedAtIso)}
                </span>
                {data.integrationDateIso && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-emerald-200/90">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Intégration : {formatDateFr(data.integrationDateIso)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-violet-200/90">
                  <HeartHandshake className="h-3.5 w-3.5" />
                  Rôle staff : {data.adminRoleLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
            <button
              type="button"
              onClick={() => void load()}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-[#c9a227]/40 hover:bg-[#c9a227]/10 hover:text-white ${focusRingClass}`}
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
            <Link
              href="/admin/moderation/staff"
              className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[#c9a227]/35 bg-[#c9a227]/15 px-4 py-2.5 text-sm font-semibold text-[#f5edd8] transition hover:bg-[#c9a227]/25 ${focusRingClass}`}
            >
              Modération staff
              <ArrowUpRight className="h-4 w-4 opacity-80" />
            </Link>
          </div>
        </div>

        <div
          id="mc-experience"
          className="scroll-mt-24 relative border-t border-white/10 bg-gradient-to-b from-black/35 to-black/55 px-5 py-6 md:px-10 md:py-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300/90">
                Vues interactives · membres & public
              </p>
              <p className="mt-1 max-w-2xl text-sm text-zinc-400">
                Ouvre chaque carte dans un nouvel onglet pour comparer avec l’admin — idéal avant une réponse à un
                membre ou une annonce Discord.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {EXPERIENCE_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`group flex flex-col rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 ${item.cardClass} ${focusRingClass}`}
                >
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.iconClass} transition group-hover:scale-105`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="mt-3 text-sm font-bold text-white">{item.title}</p>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-zinc-400 group-hover:text-zinc-300">
                    {item.description}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#e8d89a]">
                    Ouvrir
                    <ExternalLink className="h-3 w-3 opacity-80" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <nav
        className="sticky top-2 z-10 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#0a0c12]/92 p-2 shadow-lg shadow-black/40 backdrop-blur-md"
        aria-label="Sections de la page Mon compte"
      >
        {MC_NAV_SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToMc(item.id)}
            className={`rounded-xl border border-transparent px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 transition hover:border-[#c9a227]/35 hover:bg-[#c9a227]/10 hover:text-white ${focusRingClass}`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Cockpit — statut staff en un coup d’œil */}
      <section
        id="mc-cockpit"
        className="scroll-mt-24 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c0f18] to-[#06080f] p-4 shadow-xl sm:p-5"
        aria-label="Résumé statut staff"
      >
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9a227]/85">Cockpit staff</p>
            <p className="mt-1 text-sm text-zinc-400">
              Synthèse opérationnelle : les cartes cliquables t’emmènent vers l’organigramme, la charte ou les alertes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEmergencyOpen((v) => !v)}
            className={`inline-flex items-center justify-center gap-2 self-start rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/20 ${focusRingClass}`}
          >
            <Siren className="h-4 w-4 shrink-0" aria-hidden />
            {emergencyOpen ? "Fermer l’urgence" : "Mode urgence staff"}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            value={data.hasAdvancedAdminView ? "Complet (IDs visibles)" : "Standard"}
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

        {emergencyOpen && (
          <div className="mt-4 rounded-2xl border border-red-500/35 bg-red-950/25 p-4 text-sm text-red-50/95">
            <p className="font-semibold text-red-100">Urgence — raccourcis</p>
            <p className="mt-1 text-xs text-red-100/80">
              Utilise ce bandeau en situation critique : accès directs, sans remplacer les procédures Discord / staff.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/admin/moderation/staff"
                className={`inline-flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/20 px-3 py-2 text-xs font-semibold text-white ${focusRingClass}`}
              >
                Modération staff
                <ArrowUpRight className="h-3.5 w-3.5 opacity-90" />
              </Link>
              <Link
                href="/admin/membres/gestion"
                className={`inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs font-semibold text-red-50 ${focusRingClass}`}
              >
                Liste membres
              </Link>
              <Link
                href="/admin/gestion-acces"
                className={`inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs font-semibold text-red-50 ${focusRingClass}`}
              >
                Comptes admin
              </Link>
              <Link
                href="/admin/moderation/staff/info/charte"
                className={`inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs font-semibold text-red-50 ${focusRingClass}`}
              >
                Charte
              </Link>
            </div>
          </div>
        )}
      </section>

      {data.hasAdvancedAdminView && (
        <div className="rounded-3xl border border-indigo-500/35 bg-gradient-to-br from-indigo-950/50 via-[#0a0c14] to-[#06080f] p-5 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
                <ClipboardList className="h-5 w-5 text-indigo-200" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-100">Pilotage staff (admin avancé)</p>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-indigo-100/75">
                  Affectations par événement, référents points Discord / raids / intégration / fiches membres, et planning
                  des réunions d’intégration et actions.
                </p>
              </div>
            </div>
            <Link
              href="/admin/mon-compte/pilotage-staff"
              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-400/40 bg-indigo-500/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500/30 ${focusRingClass}`}
            >
              Ouvrir le pilotage
              <ChevronRight className="h-4 w-4 opacity-90" />
            </Link>
          </div>
        </div>
      )}

      {/* Alerts */}
      {!data.hasAdvancedAdminView && (
        <div
          className="flex gap-4 rounded-2xl border p-5 shadow-lg"
          style={{ borderColor: "rgba(245, 158, 11, 0.28)", background: "rgba(120, 53, 15, 0.12)" }}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
            <Shield className="h-5 w-5 text-amber-300" aria-hidden />
          </div>
          <div>
            <p className="font-semibold text-amber-100">Profil technique restreint</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-100/80">
              Sans accès « admin avancé », les identifiants Discord / Twitch détaillés restent masqués. Les fondateurs
              peuvent accorder cet accès depuis{" "}
              <Link href="/admin/gestion-acces/admin-avance" className="font-medium text-amber-200 underline-offset-2 hover:underline">
                Accès admin avancé
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      {(charterUrgent || !emailConfigured) && (
        <div id="mc-alertes" className="scroll-mt-24 space-y-4">
          {charterUrgent && (
            <div className="flex gap-4 rounded-2xl border border-red-500/35 bg-gradient-to-r from-red-950/40 to-red-950/10 p-5 shadow-lg shadow-red-950/10">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-300" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-red-100">Charte de modération</p>
                <p className="mt-1 text-sm text-red-100/85">
                  {charter.graceElapsed
                    ? "Le délai de 15 jours est dépassé sans validation : l’accès au dashboard peut être limité. Valide la charte tout de suite."
                    : `Il te reste environ ${charter.daysRemainingApprox} jour(s) pour valider la charte (délai 15 jours depuis l’entrée dans l’équipe).`}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-red-950/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-400 to-amber-400 transition-all duration-500"
                    style={{ width: `${charterPercent}%` }}
                  />
                </div>
                <Link
                  href="/admin/moderation/staff/info/charte"
                  className={`mt-4 inline-flex items-center gap-2 rounded-xl bg-red-500/90 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-red-500 ${focusRingClass}`}
                >
                  Ouvrir la charte et valider
                  <ExternalLink className="h-4 w-4 opacity-90" />
                </Link>
              </div>
            </div>
          )}
          {!emailConfigured && (
            <div className="flex gap-4 rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-950/35 to-black/20 p-5 shadow-md">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                <Mail className="h-5 w-5 text-amber-200" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-amber-100">E-mail staff non renseigné</p>
                <p className="mt-1 text-sm text-amber-100/85">
                  Les alertes critiques hors Discord ne pourront pas te joindre. Renseigne-le dans la section dédiée
                  ci-dessous.
                </p>
                <button
                  type="button"
                  onClick={() => scrollToMc("mc-notifications")}
                  className={`mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-50 transition hover:bg-amber-500/25 ${focusRingClass}`}
                >
                  Aller à l’e-mail staff
                  <ChevronDown className="h-3.5 w-3.5 -rotate-90" aria-hidden />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {staffAnnouncements.length > 0 ? (
        <section className="space-y-4 rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-950/30 via-[#080a12]/95 to-[#080a12]/90 p-5 shadow-lg shadow-amber-950/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-amber-300" aria-hidden />
              <h2 className="text-lg font-semibold text-white">Annonces staff</h2>
            </div>
            <Link
              href="/admin/moderation/staff/info/annonces-staff"
              className={`text-xs font-semibold text-amber-200/90 underline-offset-2 hover:underline ${focusRingClass}`}
            >
              Gérer les annonces
            </Link>
          </div>
          <p className="text-xs text-zinc-500">
            Uniquement les annonces « staff dashboard » (Markdown, bannière 16:9). Clique sur une ligne pour développer
            — la cloche membre reprend les mêmes messages pour les comptes admin.
          </p>
          <ul className="space-y-3">
            {staffAnnouncements.map((a) => {
              const open = Boolean(expandedAnnIds[a.id]);
              return (
                <li key={a.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  <button
                    type="button"
                    onClick={() => setExpandedAnnIds((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
                    className={`flex w-full items-start justify-between gap-3 p-4 text-left transition hover:bg-white/[0.04] ${focusRingClass}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-50">{a.title}</p>
                      <p className="mt-1 text-[11px] text-zinc-500">{formatDateFr(a.createdAt)}</p>
                      <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-amber-200/80">
                        {open ? "Masquer le détail" : "Lire l’annonce"}
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
        </section>
      ) : null}

      {/* Pilotage — actions rapides + fil d’activité + chiffres */}
      <section
        id="mc-actions"
        className="scroll-mt-24 space-y-5 rounded-3xl border border-white/10 bg-[#080a12]/90 p-5 shadow-lg"
      >
        <div>
          <h2 className="text-lg font-semibold text-white">Actions rapides</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Raccourcis staff ; pense aux vues « membre & public » en haut de page avant une communication vers la
            communauté.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin/membres/gestion"
              className={`inline-flex items-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20 ${focusRingClass}`}
            >
              <UserPlus className="h-4 w-4" aria-hidden />
              Ajouter / gérer un membre
            </Link>
            <Link
              href="/admin/gestion-acces"
              className={`inline-flex items-center gap-2 rounded-xl border border-indigo-500/35 bg-indigo-500/10 px-4 py-2.5 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/20 ${focusRingClass}`}
            >
              <Shield className="h-4 w-4" aria-hidden />
              Comptes & rôles
            </Link>
            <Link
              href="/admin/moderation/staff/info/annonces-staff"
              className={`inline-flex items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20 ${focusRingClass}`}
            >
              <Megaphone className="h-4 w-4" aria-hidden />
              Annonce staff
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10 pt-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
              <div className="flex items-center gap-2 text-white">
                <History className="h-5 w-5 text-[#c9a227]" aria-hidden />
                <h3 className="text-sm font-semibold">Dernières actions staff</h3>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Fil basé sur l’audit TENF (membres, accès staff, événements, évaluations) — hors journal générique.
              </p>
              <ul className="mt-4 space-y-3">
                {staffFeed.length === 0 ? (
                  <li className="text-sm text-zinc-500">
                    Aucune action récente enregistrée dans l’audit, ou chargement indisponible.
                  </li>
                ) : (
                  staffFeed.slice(0, 5).map((a) => (
                    <li key={a.id} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <p className="text-sm font-medium text-zinc-100">{a.headline}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {a.subline} · <span className="text-zinc-400">{a.timestamp}</span>
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5 text-[#c9a227]" aria-hidden />
                <h3 className="text-sm font-semibold">Stats rapides</h3>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">Vue communauté & modération (agrégées côté serveur).</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/admin/membres"
                  title="Ouvrir l’annuaire membres"
                  className={`group block rounded-2xl ring-offset-[#080a12] transition hover:opacity-95 ${focusRingClass}`}
                >
                  <StatTile
                    icon={User}
                    label="Membres actifs (clic)"
                    value={snap?.activeCommunityMembers != null ? String(snap.activeCommunityMembers) : "—"}
                    tone="neutral"
                  />
                </Link>
                <StatTile
                  icon={Shield}
                  label="Modos actifs / en pause"
                  value={
                    snap
                      ? `${snap.moderatorsActive} / ${snap.moderatorsPaused}`
                      : "—"
                  }
                  tone="neutral"
                />
                <StatTile
                  icon={KeyRound}
                  label="Comptes avec accès admin"
                  value={snap?.staffWithDashboardAccess != null ? String(snap.staffWithDashboardAccess) : "—"}
                  tone="neutral"
                />
                <StatTile
                  icon={Mail}
                  label="Ton e-mail alertes"
                  value={emailConfigured ? "Configuré" : "Manquant"}
                  tone={emailConfigured ? "ok" : "warn"}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 border-t border-white/10 pt-8 lg:grid-cols-12">
        {/* Colonne gauche : identité + raccourcis */}
        <div className="space-y-8 lg:col-span-5">
          <section
            id="mc-identite"
            className="scroll-mt-24 rounded-2xl border p-6 shadow-lg"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(14,16,24,0.92)" }}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Identité & chaîne</h2>
              <User className="h-5 w-5 text-[#c9a227]/80" aria-hidden />
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Données liées à ta fiche membre TENF (synchronisées avec Discord / la base).
            </p>
            <dl className="mt-6 space-y-5">
              {[
                ["Nom affiché", data.displayName || "—"],
                ["Pseudo site", data.siteUsername || "—"],
                ["Rôle membre (site)", data.siteRole || "—"],
                ["Rôle administration", data.adminRoleLabel],
                ["Pseudo Discord (fiche)", data.discordUsername || "—"],
              ].map(([k, v]) => (
                <div key={String(k)} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{k}</dt>
                  <dd className="mt-1 text-sm font-medium text-zinc-100">{v}</dd>
                </div>
              ))}
              <div className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Chaîne Twitch</dt>
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
                    <span className="text-sm text-zinc-500">Aucune URL — complète ta fiche membre si besoin.</span>
                  )}
                </dd>
                {data.hasLinkedTwitchAccount && (
                  <p className="mt-2 text-xs text-emerald-400/90">Compte Twitch relié (OAuth) détecté.</p>
                )}
              </div>
            </dl>
          </section>

          <section
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-black/40 p-6 shadow-lg"
            aria-labelledby="staff-missions-heading"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="staff-missions-heading" className="text-lg font-semibold text-white">
                Responsabilités staff
              </h2>
              <Sparkles className="h-5 w-5 text-[#c9a227]/80" aria-hidden />
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Missions nominatives en base (OBS, budget, etc.) et rappel général par rôle. Binômes et pôles : organigramme.
            </p>

            {data.staffMissions.length > 0 ? (
              <ul className="mt-5 space-y-4 text-sm text-zinc-200">
                {data.staffMissions.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-xl border border-[#c9a227]/20 bg-black/25 px-4 py-3"
                  >
                    <p className="font-semibold text-[#f5edd8]">{m.title}</p>
                    {m.description ? (
                      <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{m.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <p className="mt-4 text-xs italic text-zinc-600">
                  Aucune mission nominative en base pour l’instant — rappel général selon ton rôle :
                </p>
                <ul className="mt-4 space-y-3 text-sm text-zinc-300">
                  {staffMissionLines(data.adminRole).map((line) => (
                    <li key={line} className="flex gap-2 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {data.staffMissions.length > 0 ? (
              <p className="mt-4 text-xs text-zinc-500">
                Référents, pôles et binômes : consulte aussi l’organigramme pour le contexte collectif.
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/admin/gestion-acces/organigramme-staff"
                className={`inline-flex items-center gap-2 text-xs font-semibold text-[#e8d89a] underline-offset-4 hover:underline ${focusRingClass}`}
              >
                Ouvrir l’organigramme staff
                <ChevronRight className="h-3.5 w-3.5 opacity-80" />
              </Link>
              {(data.adminRole === "FONDATEUR" || data.adminRole === "ADMIN_COORDINATEUR") && (
                <Link
                  href="/admin/gestion-acces/missions-staff"
                  className={`inline-flex items-center gap-2 text-xs font-semibold text-sky-300 underline-offset-4 hover:underline ${focusRingClass}`}
                >
                  Gérer les missions nominatives
                  <ChevronRight className="h-3.5 w-3.5 opacity-80" />
                </Link>
              )}
            </div>
          </section>

          <section
            className="rounded-2xl border p-6 shadow-lg"
            style={{ borderColor: "rgba(212,175,55,0.15)", background: "rgba(18,16,12,0.5)" }}
          >
            <h2 className="text-lg font-semibold text-[#f5edd8]">Raccourcis utiles</h2>
            <p className="mt-1 text-xs text-zinc-500">Accès rapide aux pages les plus utilisées par le staff.</p>
            <ul className="mt-5 space-y-2">
              {QUICK_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={`${item.title} — ${item.desc}`}
                    className={`group flex items-center gap-3 rounded-xl border px-3 py-3 transition ${quickAccentRing[item.accent]} ${focusRingClass}`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${quickAccentIcon[item.accent]}`}
                    >
                      <item.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-zinc-100 group-hover:text-white">
                        {item.title}
                      </span>
                      <span className="block text-xs text-zinc-500">{item.desc}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:text-[#c9a227]" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-white/8 bg-zinc-900/40 p-6 text-sm leading-relaxed text-zinc-400">
            <h3 className="text-sm font-semibold text-zinc-200">À propos de cette page</h3>
            <p className="mt-3">
              Les données affichées concernent uniquement ton compte connecté — à la fois comme{" "}
              <strong className="text-zinc-300">staff</strong> et comme <strong className="text-zinc-300">membre TENF</strong>.
              Les identifiants bruts (IDs Discord / Twitch) restent réservés aux profils avec accès administrateur avancé.
            </p>
            <p className="mt-3">
              L’e-mail renseigné sert aux <strong className="text-zinc-300">notifications importantes</strong> hors Discord.
              Les cartes du haut te permettent de revoir l’expérience <strong className="text-zinc-300">publique</strong> et{" "}
              <strong className="text-zinc-300">membre</strong> sans quitter l’admin.
            </p>
          </section>
        </div>

        {/* Colonne droite : technique, mail, charte */}
        <div className="space-y-8 lg:col-span-7">
          {data.sensitive && (
            <section
              className="rounded-2xl border p-6 shadow-xl"
              style={{
                borderColor: "rgba(99,102,241,0.25)",
                background: "linear-gradient(165deg, rgba(30,27,45,0.95), rgba(12,14,22,0.98))",
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Identifiants techniques</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Visibles avec accès admin avancé — à utiliser avec prudence (support outils, intégrations).
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSensitiveIds((v) => !v)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-[#c9a227]/40 hover:text-white ${focusRingClass}`}
                  >
                    {showSensitiveIds ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showSensitiveIds ? "Masquer" : "Afficher"}
                  </button>
                  <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-200">
                    Confidentiel
                  </span>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <TechnicalCopyField
                  title="ID Discord"
                  subtitle="Identifiant unique utilisateur Discord (snowflake), stable dans le temps."
                  value={data.sensitive.discordId}
                  masked={!showSensitiveIds}
                />
                <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 sm:col-span-2">
                  <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                    Affichage Discord
                  </span>
                  <div className="mt-1 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-xs text-zinc-500">Rename (global_name)</span>
                      <p className="font-medium text-zinc-100">
                        {!showSensitiveIds ? "••••••" : data.sensitive.discordRename || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500">Handle</span>
                      <p className="font-medium text-zinc-100">
                        {!showSensitiveIds ? "••••••" : data.sensitive.discordHandle ? `@${data.sensitive.discordHandle}` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  {data.sensitive.twitchId ? (
                    <TechnicalCopyField
                      title="ID Twitch"
                      subtitle="Identifiant compte Twitch pour les intégrations API / webhooks."
                      value={data.sensitive.twitchId}
                      masked={!showSensitiveIds}
                    />
                  ) : (
                    <p className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-4 text-center text-sm text-zinc-500">
                      Aucun ID Twitch en base pour l’instant (lie ton compte ou complète la fiche membre).
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          <section
            id="mc-notifications"
            className="scroll-mt-24 rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-950/35 via-[#0f121c] to-[#0a0c12] p-6 shadow-lg shadow-amber-950/10"
            aria-labelledby="staff-notif-email-heading"
          >
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-300" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Mail className="h-5 w-5 text-amber-200/90" aria-hidden />
                  <h2 id="staff-notif-email-heading" className="text-lg font-semibold text-amber-50">
                    Notifications importantes
                  </h2>
                </div>
                <p className="mt-2 text-sm text-amber-100/85">
                  Utilisé pour les <strong className="font-semibold text-amber-50">urgences critiques staff</strong>{" "}
                  lorsque Discord n’est pas suffisant (comptes rendus, alertes opérationnelles).
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label htmlFor="staff-email" className="mb-2 block text-xs font-medium text-amber-200/80">
                  Adresse e-mail staff
                </label>
                <input
                  id="staff-email"
                  type="email"
                  autoComplete="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full rounded-xl border border-amber-500/25 bg-[#0a0c12] px-4 py-3 text-sm text-white outline-none ring-0 transition placeholder:text-zinc-600 focus:border-amber-400/55 focus:shadow-[0_0_0_3px_rgba(251,191,36,0.12)]"
                  placeholder="exemple@domaine.com"
                />
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveEmail()}
                  className={`rounded-xl bg-gradient-to-b from-[#e4c96a] to-[#c9a227] px-5 py-3 text-sm font-bold text-[#1a1408] shadow-md transition enabled:hover:brightness-105 disabled:opacity-50 ${focusRingClass}`}
                >
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button
                  type="button"
                  disabled={testEmailBusy || saving}
                  onClick={() => void sendTestStaffEmail()}
                  className={`rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-3 text-sm font-semibold text-amber-50 transition enabled:hover:bg-amber-500/25 disabled:opacity-45 ${focusRingClass}`}
                >
                  {testEmailBusy ? "Envoi…" : "Tester l’e-mail"}
                </button>
              </div>
            </div>
            {saveMessage && (
              <p
                className={`mt-3 text-sm ${saveMessage.includes("refus") || saveMessage.includes("Erreur") ? "text-red-300" : "text-emerald-400/95"}`}
              >
                {saveMessage}
              </p>
            )}
            {testEmailMessage && (
              <p
                className={`mt-2 text-sm ${testEmailMessage.includes("Erreur") || testEmailMessage.includes("Impossible") || testEmailMessage.includes("non configuré") ? "text-red-300" : "text-emerald-300/95"}`}
              >
                {testEmailMessage}
              </p>
            )}
          </section>

          <section
            id="mc-charte"
            className="scroll-mt-24 overflow-hidden rounded-2xl border shadow-lg"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(14,16,24,0.92)" }}
          >
            <div className="border-b border-white/5 bg-gradient-to-r from-emerald-900/20 to-transparent px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Charte de modération</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Version actuelle côté TENF : <span className="text-zinc-300">{charter.currentVersion}</span>
              </p>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-3">
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
                  {charteVersionBadge === "À jour" ? "Version : à jour" : charteVersionBadge === "Mise à jour" ? "Version : à mettre à jour" : "Signature requise"}
                </span>
                {!charter.accepted && (
                  <span className="text-xs text-zinc-500">
                    Échéance indicative : {new Date(charter.deadlineIso).toLocaleString("fr-FR")}
                  </span>
                )}
              </div>

              {charter.accepted && (
                <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                  Prochaine revalidation : lorsqu’une <span className="text-zinc-300">nouvelle version</span> de la charte
                  est publiée, une nouvelle lecture / signature pourra être demandée depuis la page charte.
                </p>
              )}

              {!charter.accepted && (
                <div className="mt-5">
                  <div className="mb-1 flex justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    <span>Délai 15 jours</span>
                    <span>{charter.graceElapsed ? "Dépassé" : `${charter.daysRemainingApprox ?? "—"} j. restants`}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        charter.graceElapsed
                          ? "bg-gradient-to-r from-red-500 to-amber-500"
                          : "bg-gradient-to-r from-[#c9a227] to-amber-300"
                      }`}
                      style={{ width: `${charterPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {charter.accepted && charter.validatedAt && (
                <p className="mt-4 text-sm text-zinc-400">
                  Validée le{" "}
                  <span className="font-medium text-zinc-200">
                    {new Date(charter.validatedAt).toLocaleString("fr-FR")}
                  </span>
                  {charter.validatedVersion ? (
                    <>
                      {" "}
                      · <span className="text-zinc-300">{charter.validatedVersion}</span>
                    </>
                  ) : null}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/admin/moderation/staff/info/charte"
                  className={`inline-flex items-center gap-2 rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/10 px-4 py-2.5 text-sm font-semibold text-[#f5edd8] transition hover:bg-[#c9a227]/20 ${focusRingClass}`}
                >
                  Charte & validation
                  <ChevronRight className="h-4 w-4 opacity-80" />
                </Link>
                <Link
                  href="/admin/moderation/staff/info/charte"
                  className={`inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-white/25 hover:text-white ${focusRingClass}`}
                >
                  <BookOpen className="h-4 w-4 opacity-90" aria-hidden />
                  Relire la charte
                </Link>
                <Link
                  href="/admin/moderation/staff/info/validation-charte"
                  className={`inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white ${focusRingClass}`}
                >
                  Page « validation charte »
                </Link>
              </div>
            </div>
          </section>

          <footer className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 py-5 text-center text-xs leading-relaxed text-zinc-600">
            TENF New Family · Espace staff sécurisé. Rappelle-toi que les membres voient une interface différente : les
            cartes « membre & public » en haut de page t’aident à rester aligné. Pour un souci de fiche Discord / Twitch,
            contacte un fondateur ou un admin coordinateur.
          </footer>
        </div>
      </div>
    </div>
  );
}
