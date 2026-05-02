"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  ExternalLink,
  Heart,
  History,
  Info,
  Loader2,
  Search,
  Shield,
  Sparkles,
  Twitch,
  UserCircle,
  X,
  XCircle,
} from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";

type Suggestion = {
  login: string;
  label: string;
  segment: "Actif" | "Nouveau membre" | "Inactif" | "Historique raids" | "Communaute";
  role?: "Moderateur" | "Staff" | "Membre";
};

type DeclaredRaid = {
  id: string;
  target: string;
  date: string;
  note: string;
  status: "validated" | "processing" | "to_study" | "rejected";
  approximate: boolean;
};

type LowRaidedSuggestion = {
  login: string;
  label: string;
  receivedCount: number;
};

type DeclarationFilter = "all" | DeclaredRaid["status"];

const FIELD_CLASS =
  "w-full rounded-xl border border-white/12 bg-[#0a0c12]/90 px-3.5 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-violet-500/45 focus:outline-none focus:ring-2 focus:ring-violet-500/15 disabled:opacity-60";
const FIELD_LABEL = "mb-1.5 block text-sm font-medium text-zinc-200";

function getNowAsLocalInput(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function formatStatus(status: DeclaredRaid["status"]): { label: string; border: string; color: string; bg: string; icon: typeof CheckCircle2 } {
  if (status === "to_study") {
    return {
      label: "À étudier",
      border: "rgba(96,165,250,0.45)",
      color: "#93c5fd",
      bg: "rgba(96,165,250,0.12)",
      icon: Info,
    };
  }
  if (status === "validated") {
    return {
      label: "Validé",
      border: "rgba(52,211,153,0.45)",
      color: "#34d399",
      bg: "rgba(52,211,153,0.12)",
      icon: CheckCircle2,
    };
  }
  if (status === "rejected") {
    return {
      label: "Refusé",
      border: "rgba(248,113,113,0.45)",
      color: "#f87171",
      bg: "rgba(248,113,113,0.12)",
      icon: XCircle,
    };
  }
  return {
    label: "En traitement",
    border: "rgba(250,204,21,0.45)",
    color: "#facc15",
    bg: "rgba(250,204,21,0.12)",
    icon: Clock3,
  };
}

function segmentStyle(segment: string): string {
  switch (segment) {
    case "Actif":
      return "text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
    case "Nouveau membre":
      return "text-sky-300 border-sky-500/30 bg-sky-500/10";
    case "Inactif":
      return "text-zinc-400 border-white/10 bg-white/5";
    case "Historique raids":
      return "text-amber-300 border-amber-500/30 bg-amber-500/10";
    default:
      return "text-violet-300 border-violet-500/30 bg-violet-500/10";
  }
}

function twitchUrl(login: string): string {
  return `https://www.twitch.tv/${login.trim().toLowerCase()}`;
}

export default function MemberDeclareRaidPage() {
  const searchParams = useSearchParams();
  const cibleFromUrl = searchParams?.get("cible")?.trim() ?? "";

  const [form, setForm] = useState({ target: "", date: getNowAsLocalInput(), note: "" });
  const [isApproximateTime, setIsApproximateTime] = useState(true);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loadingDeclarations, setLoadingDeclarations] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [backendSubmissionEnabled, setBackendSubmissionEnabled] = useState(true);
  const [declaredRaids, setDeclaredRaids] = useState<DeclaredRaid[]>([]);
  const [declarationFilter, setDeclarationFilter] = useState<DeclarationFilter>("all");
  const [expandedDeclarationId, setExpandedDeclarationId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [lowRaidedSuggestions, setLowRaidedSuggestions] = useState<LowRaidedSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const quickNotes = ["Raid après live Fortnite", "Soutien membre nouveau", "Fin de stream communautaire"];

  useEffect(() => {
    if (!cibleFromUrl) return;
    setForm((prev) => (prev.target === cibleFromUrl ? prev : { ...prev, target: cibleFromUrl }));
    setShowAutocomplete(false);
    setError("");
  }, [cibleFromUrl]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function loadMyDeclarations() {
    try {
      setLoadingDeclarations(true);
      const response = await fetch("/api/members/me/raid-declarations", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) {
        setBackendSubmissionEnabled(false);
        return;
      }
      setBackendSubmissionEnabled(body.backendReady !== false);
      if (Array.isArray(body.declarations)) {
        const mapped = body.declarations.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          target: String(row.target_twitch_login || ""),
          date: String(row.raid_at || new Date().toISOString()),
          note: String(row.note || ""),
          status: String(row.status || "processing") as DeclaredRaid["status"],
          approximate: Boolean(row.is_approximate),
        })) as DeclaredRaid[];
        setDeclaredRaids(mapped);
      }
    } catch {
      setBackendSubmissionEnabled(false);
    } finally {
      setLoadingDeclarations(false);
    }
  }

  useEffect(() => {
    (async () => {
      await loadMyDeclarations();
      try {
        const response = await fetch("/api/members/me/raid-suggestions/low-raided", { cache: "no-store" });
        const body = await response.json();
        if (response.ok && Array.isArray(body.suggestions)) {
          setLowRaidedSuggestions(body.suggestions as LowRaidedSuggestion[]);
        }
      } catch {
        setLowRaidedSuggestions([]);
      }
    })();
  }, []);

  useEffect(() => {
    const query = form.target.trim();
    if (!showAutocomplete) return;
    const timeout = window.setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const response = await fetch(`/api/members/me/raid-suggestions?query=${encodeURIComponent(query)}`, { cache: "no-store" });
        const body = await response.json();
        if (response.ok && Array.isArray(body.suggestions)) {
          setSuggestions(body.suggestions as Suggestion[]);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [form.target, showAutocomplete]);

  const groupedSuggestions = useMemo(() => {
    const groups = new Map<string, Suggestion[]>();
    for (const item of suggestions) {
      const key = item.segment || "Communaute";
      const current = groups.get(key) || [];
      current.push(item);
      groups.set(key, current);
    }
    return Array.from(groups.entries());
  }, [suggestions]);

  const formPreview = useMemo(() => {
    const date = form.date ? new Date(form.date) : null;
    const safeDate = date && !Number.isNaN(date.getTime()) ? date : null;
    return {
      target: form.target.trim() || "Non renseigné",
      date: safeDate ? safeDate.toLocaleDateString("fr-FR") : "Non renseignée",
      time: safeDate ? safeDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "--:--",
      note: form.note.trim() || "Aucune note",
      loginClean: form.target.trim().toLowerCase(),
    };
  }, [form]);

  const filteredDeclarations = useMemo(() => {
    const sorted = [...declaredRaids].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (declarationFilter === "all") return sorted;
    return sorted.filter((r) => r.status === declarationFilter);
  }, [declaredRaids, declarationFilter]);

  const declarationCounts = useMemo(() => {
    const base = { all: declaredRaids.length, validated: 0, processing: 0, to_study: 0, rejected: 0 };
    for (const r of declaredRaids) {
      if (r.status === "validated") base.validated += 1;
      else if (r.status === "processing") base.processing += 1;
      else if (r.status === "to_study") base.to_study += 1;
      else if (r.status === "rejected") base.rejected += 1;
    }
    return base;
  }, [declaredRaids]);

  function applySuggestion(login: string) {
    setForm((prev) => ({ ...prev, target: login }));
    setShowAutocomplete(false);
    setError("");
  }

  function applyNow() {
    setForm((prev) => ({ ...prev, date: getNowAsLocalInput() }));
  }

  function handleSubmit() {
    setError("");
    if (!form.target.trim()) {
      setError("Merci d’indiquer un pseudo Twitch cible.");
      setToast({ type: "error", message: "Streamer cible manquant." });
      return;
    }
    if (!form.date.trim()) {
      setError("Merci d’indiquer une date et une heure.");
      setToast({ type: "error", message: "Date et heure manquantes." });
      return;
    }

    if (!backendSubmissionEnabled) {
      setError("Le module déclarations raids n’est pas encore actif.");
      return;
    }

    (async () => {
      setSubmitting(true);
      try {
        const response = await fetch("/api/members/me/raid-declarations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetTwitchLogin: form.target.trim(),
            raidAt: form.date,
            isApproximate: isApproximateTime,
            note: form.note.trim(),
          }),
        });
        const body = await response.json();
        if (!response.ok) {
          if (response.status === 503) {
            setBackendSubmissionEnabled(false);
            setError("Le module déclarations raids n’est pas encore actif.");
            return;
          }
          setError(body.error || "Impossible de déclarer ce raid.");
          setToast({ type: "error", message: body.error || "Erreur lors de la déclaration." });
          return;
        }
        const row = body.declaration;
        const created: DeclaredRaid = {
          id: String(row.id),
          target: String(row.target_twitch_login || form.target.trim()),
          date: String(row.raid_at || form.date),
          note: String(row.note || form.note.trim()),
          status: String(row.status || "processing") as DeclaredRaid["status"],
          approximate: Boolean(row.is_approximate),
        };
        setDeclaredRaids((prev) => [created, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setShowConfirmation(true);
        setToast({ type: "success", message: "Raid enregistré — envoyé à la modération." });
        setForm((prev) => ({ ...prev, target: "", note: "" }));
        setShowAutocomplete(false);
        await loadMyDeclarations();
      } catch {
        setError("Erreur réseau pendant la déclaration.");
        setToast({ type: "error", message: "Erreur réseau pendant la déclaration." });
      } finally {
        setSubmitting(false);
      }
    })();
  }

  const filterTabs: { id: DeclarationFilter; label: string }[] = [
    { id: "all", label: `Tous (${declarationCounts.all})` },
    { id: "processing", label: `Traitement (${declarationCounts.processing})` },
    { id: "to_study", label: `À étudier (${declarationCounts.to_study})` },
    { id: "validated", label: `Validés (${declarationCounts.validated})` },
    { id: "rejected", label: `Refusés (${declarationCounts.rejected})` },
  ];

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Déclarer un raid"
        description="Signale un raid manuellement lorsqu’il n’apparaît pas encore dans ton historique (sync automatique ou délai staff). L’équipe vérifie la cohérence avec les outils TENF — sois précis·e sur la date et la cible pour accélérer le traitement."
        badge="Déclaration"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/member/raids/historique"
          className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:border-violet-400/45 hover:bg-violet-500/15"
        >
          <History className="h-4 w-4 shrink-0" aria-hidden />
          Historique & statuts
        </Link>
        <Link
          href="/member/raids/statistiques"
          className="inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:border-amber-400/40 hover:bg-amber-500/15"
        >
          <BarChart3 className="h-4 w-4 shrink-0" aria-hidden />
          Statistiques
          <ArrowRight className="h-4 w-4 opacity-70" aria-hidden />
        </Link>
      </div>

      <section
        className="relative mb-8 overflow-hidden rounded-3xl border p-5 shadow-2xl sm:p-8"
        style={{
          borderColor: "rgba(139, 92, 246, 0.38)",
          background:
            "radial-gradient(ellipse 75% 55% at 0% -20%, rgba(139,92,246,0.22), transparent 48%), radial-gradient(ellipse 50% 45% at 100% 10%, rgba(212,175,55,0.12), transparent 42%), linear-gradient(165deg, rgba(17,19,28,0.96), rgba(8,10,14,0.99))",
        }}
      >
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-300/90">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Bienveillance & transparence
            </p>
            <h2 className="mt-2 text-balance text-2xl font-black text-white sm:text-3xl">Un raid = un pont entre communautés</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Décris ce qui s’est passé sur ton live : la modération croise avec les données raids TENF. Les suggestions ci-dessous t’aident à
              soutenir des membres moins exposés aux raids ce mois-ci.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:flex-col lg:items-stretch">
            <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Étape rapide</p>
              <p className="mt-1 text-sm font-bold text-white">1. Cible · 2. Moment · 3. Envoi</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/25 px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
                <Shield className="h-4 w-4 shrink-0" aria-hidden />
                Données traitées par le staff avec bienveillance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-6 flex gap-3 rounded-2xl border border-amber-500/25 bg-amber-950/20 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />
        <div className="text-sm text-zinc-300">
          <p className="font-bold text-amber-100">Avant de déclarer</p>
          <p className="mt-1 leading-relaxed">
            Vérifie d’abord dans{" "}
            <Link href="/member/raids/historique" className="font-semibold text-violet-300 underline-offset-2 hover:underline">
              Mes raids
            </Link>{" "}
            : si l’événement y figure déjà, une nouvelle déclaration peut créer un doublon et ralentir la modération.
          </p>
        </div>
      </div>

      <section
        className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-b from-[#141822]/95 to-black/50 p-5 shadow-xl sm:p-8"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}
      >
        <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
          <Twitch className="h-5 w-5 text-violet-400" aria-hidden />
          Formulaire de déclaration
        </h3>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div>
              <label htmlFor="raid-target" className={FIELD_LABEL}>
                Pseudo Twitch de la cible *
              </label>
              <div className="relative">
                <Twitch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" aria-hidden />
                <input
                  id="raid-target"
                  value={form.target}
                  onChange={(e) => setForm((prev) => ({ ...prev, target: e.target.value }))}
                  onFocus={() => setShowAutocomplete(true)}
                  className={`${FIELD_CLASS} pl-10 pr-10`}
                  placeholder="ex. pseudo_twitch"
                  autoComplete="off"
                />
                <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" aria-hidden />
              </div>

              {showAutocomplete ? (
                <div className="mt-2 overflow-hidden rounded-2xl border border-white/12 bg-[#080a10]/98 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Membres TENF</span>
                    <button
                      type="button"
                      onClick={() => setShowAutocomplete(false)}
                      className="rounded-lg p-1 text-zinc-500 hover:bg-white/10 hover:text-white"
                      aria-label="Fermer les suggestions"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="max-h-[260px] overflow-y-auto p-2">
                    {loadingSuggestions ? (
                      <div className="flex items-center gap-2 px-2 py-4 text-sm text-zinc-500">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Recherche…
                      </div>
                    ) : suggestions.length === 0 ? (
                      <p className="px-2 py-3 text-sm text-zinc-500">
                        Aucun membre trouvé pour cette saisie — tu peux quand même entrer un pseudo libre (hors TENF = refus probable).
                      </p>
                    ) : (
                      groupedSuggestions.map(([groupName, items]) => (
                        <div key={groupName} className="mb-3 last:mb-0">
                          <p className="sticky top-0 z-[1] bg-[#080a10]/95 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-400">
                            {groupName}
                          </p>
                          <div className="mt-1 space-y-1">
                            {items.map((item) => (
                              <button
                                key={`${groupName}-${item.login}`}
                                type="button"
                                onClick={() => applySuggestion(item.login)}
                                className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-left text-sm transition hover:border-violet-500/35 hover:bg-violet-500/10"
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <UserCircle className="h-4 w-4 shrink-0 text-violet-400" aria-hidden />
                                  <span className="truncate font-medium text-zinc-100">{item.label}</span>
                                  <span className="truncate text-xs text-zinc-500">@{item.login}</span>
                                </span>
                                <span
                                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${segmentStyle(groupName)}`}
                                >
                                  {item.role || "Membre"}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                Un raid vers quelqu’un qui n’est pas membre TENF sera en général refusé — privilégie la solidarité au sein de la New Family.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <label htmlFor="raid-datetime" className={FIELD_LABEL}>
                  Date et heure du raid *
                </label>
                <input
                  id="raid-datetime"
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  className={FIELD_CLASS}
                />
              </div>
              <button
                type="button"
                onClick={applyNow}
                className="inline-flex h-[46px] shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 text-sm font-bold text-amber-100 transition hover:bg-amber-500/25"
                title="Remplir avec la date et l’heure actuelles"
              >
                <CalendarClock className="h-4 w-4" aria-hidden />
                Maintenant
              </button>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3 transition hover:border-white/15">
              <input
                type="checkbox"
                checked={isApproximateTime}
                onChange={(e) => setIsApproximateTime(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-black/50 text-violet-600 focus:ring-violet-500/30"
              />
              <span>
                <span className="font-semibold text-zinc-200">Heure approximative</span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  Coche si tu n’as pas l’heure exacte — la modération en tiendra compte.
                </span>
              </span>
            </label>

            <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/40 to-black/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Heart className="h-4 w-4 text-emerald-400" aria-hidden />
                <p className="text-sm font-bold text-emerald-100">Membres peu raidés ce mois-ci</p>
              </div>
              <p className="mb-2 text-xs text-emerald-200/70">Un clic injecte le pseudo dans le champ cible.</p>
              <p className="mb-3 text-xs text-zinc-500">
                Pour des idées de <strong className="text-zinc-300">raids retour</strong> (personnes qui t’ont soutenu·e et pour qui aucun retour
                n’apparaît encore dans nos données), ouvre{" "}
                <Link href="/member/raids/historique" className="font-semibold text-cyan-400/95 underline-offset-2 hover:underline">
                  Mes raids — qui rendre la pareille ?
                </Link>
                .
              </p>
              <div className="flex flex-wrap gap-2">
                {lowRaidedSuggestions.length === 0 ? (
                  <span className="text-sm text-zinc-500">Aucune suggestion pour le moment — reviens plus tard.</span>
                ) : (
                  lowRaidedSuggestions.map((item) => (
                    <button
                      key={item.login}
                      type="button"
                      onClick={() => applySuggestion(item.login)}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:border-emerald-400/50 hover:bg-emerald-500/20"
                    >
                      {item.label}
                      <span className="rounded-md bg-black/40 px-1.5 py-0.5 tabular-nums text-[10px] text-emerald-300/90">
                        {item.receivedCount} raids reçus
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div>
              <label htmlFor="raid-note" className={FIELD_LABEL}>
                Contexte (optionnel)
              </label>
              <p className="mb-2 text-xs text-zinc-500">Aide le staff : jeu, contexte du live, lien avec la cible…</p>
              <div className="mb-2 flex flex-wrap gap-2">
                {quickNotes.map((note) => {
                  const active = form.note === note;
                  return (
                    <button
                      key={note}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, note }))}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-violet-400/50 bg-violet-500/25 text-violet-50"
                          : "border-white/12 bg-black/30 text-zinc-400 hover:border-violet-500/30 hover:text-zinc-200"
                      }`}
                    >
                      {note}
                    </button>
                  );
                })}
              </div>
              <textarea
                id="raid-note"
                rows={3}
                value={form.note}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                className={FIELD_CLASS}
                placeholder="Ex. : Raid de fin de soirée, ambiance chill…"
              />
            </div>

            {error ? (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/35 bg-red-950/25 px-4 py-3 text-sm text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !backendSubmissionEnabled}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-violet-900/25 transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-45"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Envoi…
                  </>
                ) : (
                  <>
                    Envoyer la déclaration
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>
              {!backendSubmissionEnabled ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-950/30 px-4 py-2 text-xs font-semibold text-amber-200">
                  <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Module non actif (configuration serveur)
                </span>
              ) : null}
            </div>
          </div>

          <aside className="lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/35 to-black/50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300/90">Aperçu</p>
              <p className="mt-2 text-sm text-zinc-400">Vérifie avant envoi — ce récap correspond au ticket staff.</p>
              <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
                <div>
                  <p className="text-[10px] font-semibold uppercase text-zinc-500">Cible</p>
                  <p className="mt-0.5 font-semibold text-white">{formPreview.target}</p>
                  {formPreview.loginClean ? (
                    <a
                      href={twitchUrl(formPreview.loginClean)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet-300 hover:text-violet-200"
                    >
                      Ouvrir Twitch <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-zinc-500">Date</p>
                    <p className="font-medium text-zinc-200">{formPreview.date}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-zinc-500">Heure</p>
                    <p className="font-medium text-zinc-200">
                      {formPreview.time}
                      {isApproximateTime ? <span className="ml-1 text-xs text-amber-400/90">~</span> : null}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-zinc-500">Note</p>
                  <p className="text-zinc-300">{formPreview.note}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/25 p-5 sm:p-7">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Mes déclarations</h3>
            <p className="mt-1 text-sm text-zinc-500">Suivi des dossiers que tu as soumis (statuts mis à jour par la modération).</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setDeclarationFilter(tab.id);
                  setExpandedDeclarationId(null);
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  declarationFilter === tab.id
                    ? "border-violet-400/45 bg-violet-500/20 text-violet-100"
                    : "border-white/10 bg-black/30 text-zinc-500 hover:border-white/18 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loadingDeclarations ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <div className="h-4 w-1/3 rounded-lg bg-white/10" />
                <div className="mt-3 h-3 w-1/2 rounded bg-white/5" />
              </div>
            ))}
          </div>
        ) : filteredDeclarations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/12 px-6 py-14 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-zinc-600" aria-hidden />
            <p className="mt-4 font-semibold text-white">
              {declaredRaids.length === 0 ? "Tu n’as pas encore déclaré de raid" : "Aucune déclaration pour ce filtre"}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              {declaredRaids.length === 0
                ? "Remplis le formulaire ci-dessus pour créer ton premier ticket."
                : "Change de filtre ou consulte « Tous »."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredDeclarations.map((raid) => {
              const status = formatStatus(raid.status);
              const StatusIcon = status.icon;
              const expanded = expandedDeclarationId === raid.id;
              return (
                <li key={raid.id}>
                  <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-violet-500/25">
                    <button
                      type="button"
                      onClick={() => setExpandedDeclarationId((id) => (id === raid.id ? null : raid.id))}
                      className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-white">{raid.target}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {new Date(raid.date).toLocaleString("fr-FR")}
                          {raid.approximate ? " · heure approximative" : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                          style={{ borderColor: status.border, color: status.color, backgroundColor: status.bg }}
                        >
                          <StatusIcon className="h-3.5 w-3.5" aria-hidden />
                          {status.label}
                        </span>
                        <ChevronDown className={`h-5 w-5 text-zinc-500 transition ${expanded ? "rotate-180" : ""}`} aria-hidden />
                      </div>
                    </button>
                    {expanded ? (
                      <div className="border-t border-white/8 px-4 py-4">
                        {raid.note ? (
                          <p className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-300">
                            <span className="font-semibold text-zinc-500">Note : </span>
                            {raid.note}
                          </p>
                        ) : (
                          <p className="text-sm text-zinc-500">Aucune note sur ce dossier.</p>
                        )}
                        <a
                          href={twitchUrl(raid.target)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-violet-500/35 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-500/20"
                        >
                          Chaîne Twitch <ExternalLink className="h-4 w-4" aria-hidden />
                        </a>
                      </div>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {showConfirmation ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="raid-success-title"
          onClick={() => setShowConfirmation(false)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#0f1a16] to-[#080c10] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowConfirmation(false)}
              className="absolute right-4 top-4 rounded-xl border border-white/10 p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-4 inline-flex rounded-2xl border border-emerald-500/25 bg-emerald-500/15 p-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" aria-hidden />
            </div>
            <h2 id="raid-success-title" className="text-xl font-black text-white">
              Déclaration enregistrée
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              La modération va traiter ton dossier. Tu peux suivre l’avancement dans la liste ci-dessous ou dans ton historique raids une fois
              synchronisé.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/member/raids/historique"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-emerald-950 transition hover:bg-zinc-100 sm:flex-none"
              >
                Voir l’historique <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/5"
              >
                Continuer ici
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-5 right-5 z-[60] max-w-sm transition-opacity duration-300">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-md ${
              toast.type === "success"
                ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-100"
                : "border-red-500/40 bg-red-950/90 text-red-100"
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </MemberSurface>
  );
}
