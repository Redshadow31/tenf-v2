"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCopy,
  Clock,
  ExternalLink,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  Shield,
  Sparkles,
  User,
  Video,
} from "lucide-react";

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

function CopyChip({ label, value }: { label: string; value: string }) {
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
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</span>
      <div className="flex items-center justify-between gap-2">
        <code className="break-all text-xs text-zinc-200">{value}</code>
        <button
          type="button"
          onClick={() => void copy()}
          className={`shrink-0 rounded-lg border border-white/15 bg-white/5 p-2 text-zinc-300 transition hover:border-[#c9a227]/50 hover:text-[#f0e6c8] ${focusRingClass}`}
          title="Copier"
        >
          {done ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <ClipboardCopy className="h-4 w-4" />}
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

const QUICK_LINKS = [
  {
    href: "/admin/moderation/staff",
    title: "Modération staff",
    desc: "Hub outils modération",
    icon: Shield,
  },
  {
    href: "/admin/moderation/staff/info/charte",
    title: "Charte & validation",
    desc: "Lire et signer la charte",
    icon: BookOpen,
  },
  {
    href: "/admin/gestion-acces/organigramme-staff",
    title: "Organigramme",
    desc: "Vue des rôles staff",
    icon: Sparkles,
  },
  {
    href: "/admin/membres",
    title: "Membres",
    desc: "Gestion communauté",
    icon: User,
  },
] as const;

export default function AdminMonComptePage() {
  const [data, setData] = useState<AccountPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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
      setData(json);
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

  const charterPercent = useMemo(() => (data ? charterTimelinePercent(data.charter) : 0), [data]);

  if (loading) {
    return (
      <div className="relative min-h-[70vh] overflow-hidden rounded-3xl border border-white/10 bg-[#06080f]">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(ellipse 120% 80% at 10% -20%, rgba(201,162,39,0.18), transparent 55%), radial-gradient(ellipse 80% 60% at 100% 0%, rgba(99,102,241,0.12), transparent 50%)",
          }}
        />
        <div className="relative flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-20">
          <div className="relative">
            <div className="h-16 w-16 animate-pulse rounded-full border-2 border-[#c9a227]/30 bg-white/5" />
            <Loader2 className="absolute inset-0 m-auto h-7 w-7 animate-spin text-[#c9a227]" aria-hidden />
          </div>
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

  return (
    <div className="space-y-8 pb-12">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-3xl border text-white shadow-2xl"
        style={{
          borderColor: "rgba(212, 175, 55, 0.22)",
          background:
            "linear-gradient(145deg, rgba(18,16,28,0.98) 0%, rgba(8,10,18,0.99) 45%, rgba(12,14,24,1) 100%), radial-gradient(ellipse 100% 80% at 0% 0%, rgba(201,162,39,0.14), transparent 55%), radial-gradient(ellipse 70% 50% at 100% 20%, rgba(99,102,241,0.1), transparent 50%)",
        }}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#c9a227]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-8 p-6 md:flex-row md:items-end md:justify-between md:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 text-2xl font-bold tracking-tight shadow-inner"
              style={{
                borderColor: "rgba(201,162,39,0.45)",
                background: "linear-gradient(160deg, rgba(201,162,39,0.2), rgba(20,22,32,0.9))",
                color: "#f5edd8",
                boxShadow: "0 0 40px rgba(201,162,39,0.08)",
              }}
              aria-hidden
            >
              {initials}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]/85">
                Espace personnel · Staff TENF
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Mon compte
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
                Centralise ta fiche staff : identité, chaîne Twitch, contact pour les alertes importantes, statut de la
                charte de modération et identifiants techniques (si accès avancé).
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
                  <Clock className="h-3.5 w-3.5 text-zinc-500" />
                  Fiche membre depuis {formatDateFr(data.memberCreatedAtIso)}
                </span>
                {data.integrationDateIso && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-emerald-200/90">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Intégration : {formatDateFr(data.integrationDateIso)}
                  </span>
                )}
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

        {/* Stats strip */}
        <div className="relative grid gap-3 border-t border-white/10 bg-black/20 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
          <StatTile
            icon={Shield}
            label="Rôle administration"
            value={data.adminRoleLabel}
            tone="neutral"
          />
          <StatTile
            icon={BookOpen}
            label="Charte modération"
            value={charter.accepted ? "Validée" : charter.graceElapsed ? "Action requise" : "À compléter"}
            tone={charter.accepted ? "ok" : charterUrgent ? "danger" : "warn"}
          />
          <StatTile
            icon={Mail}
            label="E-mail alertes"
            value={emailConfigured ? "Renseigné" : "Non renseigné"}
            tone={emailConfigured ? "ok" : "warn"}
          />
          <StatTile
            icon={KeyRound}
            label="Accès avancé"
            value={data.hasAdvancedAdminView ? "Actif (IDs visibles)" : "Standard"}
            tone={data.hasAdvancedAdminView ? "ok" : "neutral"}
          />
        </div>
      </section>

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

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Colonne gauche : identité + raccourcis */}
        <div className="space-y-8 lg:col-span-5">
          <section
            className="rounded-2xl border p-6 shadow-lg"
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
                    className={`group flex items-center gap-3 rounded-xl border border-white/5 bg-black/15 px-3 py-3 transition hover:border-[#c9a227]/30 hover:bg-[#c9a227]/10 ${focusRingClass}`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c9a227]/10 text-[#c9a227]">
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
              Chaque administrateur dispose de sa propre fiche : les informations affichées concernent uniquement ton
              compte connecté. Les identifiants bruts (IDs Discord et Twitch) sont réservés aux profils avec accès
              administrateur avancé, pour limiter la diffusion de données sensibles.
            </p>
            <p className="mt-3">
              L’e-mail renseigné sert aux <strong className="text-zinc-300">notifications importantes</strong>{" "}
              (alertes staff, messages critiques). Tu peux le laisser vide si tu préfères être contacté uniquement sur
              Discord.
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
                <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-200">
                  Confidentiel
                </span>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <CopyChip label="ID Discord" value={data.sensitive.discordId} />
                <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 sm:col-span-2">
                  <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                    Affichage Discord
                  </span>
                  <div className="mt-1 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-xs text-zinc-500">Rename (global_name)</span>
                      <p className="font-medium text-zinc-100">{data.sensitive.discordRename || "—"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500">Handle</span>
                      <p className="font-medium text-zinc-100">
                        {data.sensitive.discordHandle ? `@${data.sensitive.discordHandle}` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  {data.sensitive.twitchId ? (
                    <CopyChip label="ID Twitch" value={data.sensitive.twitchId} />
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
            className="rounded-2xl border p-6 shadow-lg"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(14,16,24,0.92)" }}
          >
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#c9a227]" aria-hidden />
              <h2 className="text-lg font-semibold text-white">Notifications importantes</h2>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              Adresse utilisée pour les alertes staff hors Discord (urgences, comptes rendus critiques).
            </p>
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label htmlFor="staff-email" className="mb-2 block text-xs font-medium text-zinc-400">
                  Adresse e-mail
                </label>
                <input
                  id="staff-email"
                  type="email"
                  autoComplete="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0a0c12] px-4 py-3 text-sm text-white outline-none ring-0 transition placeholder:text-zinc-600 focus:border-[#c9a227]/50 focus:shadow-[0_0_0_3px_rgba(201,162,39,0.12)]"
                  placeholder="exemple@domaine.com"
                />
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveEmail()}
                className={`shrink-0 rounded-xl bg-gradient-to-b from-[#e4c96a] to-[#c9a227] px-6 py-3 text-sm font-bold text-[#1a1408] shadow-md transition enabled:hover:brightness-105 disabled:opacity-50 ${focusRingClass}`}
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
            {saveMessage && (
              <p
                className={`mt-3 text-sm ${saveMessage.includes("refus") || saveMessage.includes("Erreur") ? "text-red-300" : "text-emerald-400/95"}`}
              >
                {saveMessage}
              </p>
            )}
          </section>

          <section
            className="overflow-hidden rounded-2xl border shadow-lg"
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
                {!charter.accepted && (
                  <span className="text-xs text-zinc-500">
                    Échéance indicative : {new Date(charter.deadlineIso).toLocaleString("fr-FR")}
                  </span>
                )}
              </div>

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
                  href="/admin/moderation/staff/info/validation-charte"
                  className={`inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white ${focusRingClass}`}
                >
                  Page « validation charte »
                </Link>
              </div>
            </div>
          </section>

          <footer className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 py-5 text-center text-xs leading-relaxed text-zinc-600">
            TENF New Family · Espace staff sécurisé. En cas de problème de fiche (Discord / Twitch), contacte un
            fondateur ou un admin coordinateur.
          </footer>
        </div>
      </div>
    </div>
  );
}
