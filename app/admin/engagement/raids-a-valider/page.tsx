"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";

type RaidDeclaration = {
  id: string;
  member_discord_id: string;
  member_twitch_login: string;
  member_display_name: string;
  target_twitch_login: string;
  raid_at: string;
  is_approximate: boolean;
  note: string;
  status: "processing" | "to_study" | "validated" | "rejected";
  staff_comment?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  created_at: string;
};

type MemberLite = {
  twitchLogin: string;
  displayName: string;
  role?: string | null;
  isActive?: boolean;
};

/** Compteurs sur le même périmètre que la liste (recherche + mois API), hors filtre d’onglet statut. */
type RaidDeclarationStatusCounts = {
  total: number;
  processing: number;
  to_study: number;
  validated: number;
  rejected: number;
};

type CreateMemberDraft = {
  twitchLogin: string;
  displayName: string;
  twitchUrl: string;
};

const validateModalBackdropClass =
  "fixed inset-0 z-[100] flex animate-fadeIn items-center justify-center bg-black/70 p-4 backdrop-blur-md";
const validateModalShellClass =
  "relative w-full max-w-md animate-fadeIn overflow-hidden rounded-3xl border border-emerald-400/30 bg-[linear-gradient(165deg,rgba(16,185,129,0.12),rgba(14,15,23,0.96)_40%)] shadow-[0_28px_80px_rgba(2,6,23,0.75)]";

export default function AdminEngagementRaidsAValiderPage() {
  const pathname = usePathname() || "";
  const isCommunity = pathname.startsWith("/admin/communaute");
  const validateTitleId = useId();
  const backHref = isCommunity ? "/admin/communaute/engagement" : "/admin/raids";
  const raidsSubHref = isCommunity ? "/admin/communaute/engagement/raids-eventsub" : "/admin/engagement/raids-sub";
  const historiqueHref = isCommunity ? "/admin/communaute/engagement/historique-raids" : "/admin/engagement/historique-raids";
  const pointsDiscordHref = isCommunity ? "/admin/communaute/engagement/points-discord" : "/admin/engagement/points-discord";
  const followHref = isCommunity ? "/admin/communaute/engagement/follow" : "/admin/engagement/follow";
  const searchFieldDescId = useId();
  const [statusFilter, setStatusFilter] = useState<"all" | "processing" | "to_study" | "validated" | "rejected">("processing");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingId, setSavingId] = useState("");
  const [rows, setRows] = useState<RaidDeclaration[]>([]);
  const [statusCounts, setStatusCounts] = useState<RaidDeclarationStatusCounts | null>(null);
  const [commentById, setCommentById] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [targetDraftById, setTargetDraftById] = useState<Record<string, string>>({});
  const [showCreateMemberModal, setShowCreateMemberModal] = useState(false);
  const [creatingMember, setCreatingMember] = useState(false);
  const [createForDeclarationId, setCreateForDeclarationId] = useState<string | null>(null);
  const [newMemberDraft, setNewMemberDraft] = useState<CreateMemberDraft>({
    twitchLogin: "",
    displayName: "",
    twitchUrl: "",
  });
  const [pendingValidateId, setPendingValidateId] = useState<string | null>(null);

  const tabIdAll = useId();
  const tabIdProcessing = useId();
  const tabIdToStudy = useId();
  const tabIdValidated = useId();
  const tabIdRejected = useId();
  const signalementsPanelId = useId();
  const signalementsTabpanelLabelledby =
    statusFilter === "all"
      ? tabIdAll
      : statusFilter === "processing"
        ? tabIdProcessing
        : statusFilter === "to_study"
          ? tabIdToStudy
          : statusFilter === "validated"
            ? tabIdValidated
            : tabIdRejected;

  async function loadData(options?: { silent?: boolean }) {
    const silent = Boolean(options?.silent);
    try {
      if (!silent) {
        setLoading(true);
      }
      setError("");
      const params = new URLSearchParams({
        status: statusFilter,
        search: search.trim(),
      });
      const response = await fetch(`/api/admin/engagement/raids-declarations?${params.toString()}`, {
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Impossible de charger les declarations.");
        return;
      }
      setRows((body.declarations || []) as RaidDeclaration[]);
      setBackendReady(body.backendReady !== false);
      const c = body.counts as RaidDeclarationStatusCounts | undefined;
      if (
        c &&
        typeof c.total === "number" &&
        typeof c.processing === "number" &&
        typeof c.to_study === "number" &&
        typeof c.validated === "number" &&
        typeof c.rejected === "number"
      ) {
        setStatusCounts(c);
      } else {
        setStatusCounts(null);
      }
    } catch {
      setError("Erreur reseau pendant le chargement.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/admin/members", { cache: "no-store" });
        const body = await response.json();
        if (!response.ok) return;
        setMembers((body.members || []) as MemberLite[]);
      } catch {
        // Ne bloque pas la page si la liste membres echoue.
      }
    })();
  }, []);

  const stats = useMemo(() => {
    if (statusCounts) {
      return {
        total: statusCounts.total,
        processing: statusCounts.processing,
        toStudy: statusCounts.to_study,
        validated: statusCounts.validated,
        rejected: statusCounts.rejected,
      };
    }
    return {
      total: rows.length,
      processing: rows.filter((item) => item.status === "processing").length,
      toStudy: rows.filter((item) => item.status === "to_study").length,
      validated: rows.filter((item) => item.status === "validated").length,
      rejected: rows.filter((item) => item.status === "rejected").length,
    };
  }, [statusCounts, rows]);

  async function applyStatus(id: string, status: "processing" | "to_study" | "validated" | "rejected") {
    setSavingId(id);
    try {
      const response = await fetch(`/api/admin/engagement/raids-declarations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          staffComment: commentById[id] || "",
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Mise a jour impossible.");
        return;
      }
      if (body.autoRejectedAlreadyCounted) {
        setNotice(body.message || "Raid refuse: deja comptabilise automatiquement via EventSub.");
      } else {
        setNotice("Mise a jour enregistree.");
      }
      await loadData({ silent: true });
    } catch {
      setError("Erreur reseau pendant la mise a jour.");
    } finally {
      setSavingId("");
    }
  }

  function updateStatus(id: string, status: "processing" | "to_study" | "validated" | "rejected") {
    if (status === "validated") {
      setPendingValidateId(id);
      return;
    }
    void applyStatus(id, status);
  }

  async function confirmValidateDeclaration() {
    if (!pendingValidateId) return;
    const id = pendingValidateId;
    setPendingValidateId(null);
    await applyStatus(id, "validated");
  }

  useEffect(() => {
    if (!pendingValidateId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPendingValidateId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingValidateId]);

  function normalizeLogin(value: string): string {
    return value.trim().toLowerCase();
  }

  function isKnownTarget(login: string): boolean {
    const normalized = normalizeLogin(login);
    return members.some((member) => normalizeLogin(member.twitchLogin || "") === normalized);
  }

  async function updateTarget(id: string, targetTwitchLogin: string) {
    const normalized = normalizeLogin(targetTwitchLogin);
    if (!normalized) return;
    setSavingId(id);
    try {
      const response = await fetch(`/api/admin/engagement/raids-declarations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetTwitchLogin: normalized,
          staffComment: commentById[id] || "",
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Mise a jour de la cible impossible.");
        return;
      }
      setTargetDraftById((prev) => ({ ...prev, [id]: normalized }));
      await loadData({ silent: true });
    } catch {
      setError("Erreur reseau pendant la mise a jour de la cible.");
    } finally {
      setSavingId("");
    }
  }

  function openCreateMemberModalFromDeclaration(item: RaidDeclaration) {
    const defaultLogin = normalizeLogin(targetDraftById[item.id] ?? item.target_twitch_login ?? "");
    setCreateForDeclarationId(item.id);
    setNewMemberDraft({
      twitchLogin: defaultLogin,
      displayName: defaultLogin || "Nouveau membre",
      twitchUrl: defaultLogin ? `https://www.twitch.tv/${defaultLogin}` : "",
    });
    setShowCreateMemberModal(true);
  }

  async function createMemberFromModal() {
    if (creatingMember) return;
    const twitchLogin = normalizeLogin(newMemberDraft.twitchLogin);
    const displayName = newMemberDraft.displayName.trim() || twitchLogin;
    const twitchUrl = (newMemberDraft.twitchUrl.trim() || `https://www.twitch.tv/${twitchLogin}`).toLowerCase();
    if (!twitchLogin || !displayName || !twitchUrl) {
      setError("Creation membre impossible: champs obligatoires manquants.");
      return;
    }

    setCreatingMember(true);
    try {
      const response = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twitchLogin,
          displayName,
          twitchUrl,
          role: "Nouveau",
          isActive: false,
          badges: [],
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Creation membre impossible.");
        return;
      }

      setMembers((prev) => {
        const exists = prev.some((member) => normalizeLogin(member.twitchLogin || "") === twitchLogin);
        if (exists) return prev;
        return [
          ...prev,
          {
            twitchLogin,
            displayName,
            role: "Nouveau",
            isActive: false,
          },
        ];
      });

      if (createForDeclarationId) {
        await updateTarget(createForDeclarationId, twitchLogin);
      }
      setShowCreateMemberModal(false);
      setCreateForDeclarationId(null);
    } catch {
      setError("Erreur reseau pendant la creation du membre.");
    } finally {
      setCreatingMember(false);
    }
  }

  function badgeStyle(status: RaidDeclaration["status"]): { borderColor: string; color: string; backgroundColor: string; label: string } {
    if (status === "to_study") {
      return {
        borderColor: "rgba(96,165,250,0.45)",
        color: "#93c5fd",
        backgroundColor: "rgba(96,165,250,0.12)",
        label: "À vérifier avant décision",
      };
    }
    if (status === "validated") {
      return {
        borderColor: "rgba(52,211,153,0.45)",
        color: "#34d399",
        backgroundColor: "rgba(52,211,153,0.12)",
        label: "Validé",
      };
    }
    if (status === "rejected") {
      return {
        borderColor: "rgba(248,113,113,0.45)",
        color: "#f87171",
        backgroundColor: "rgba(248,113,113,0.12)",
        label: "Refusé",
      };
    }
    return {
      borderColor: "rgba(250,204,21,0.45)",
      color: "#facc15",
      backgroundColor: "rgba(250,204,21,0.12)",
      label: "En cours",
    };
  }

  const surface = "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20";

  return (
    <div className={`text-white ${isCommunity ? "pb-2" : "min-h-screen bg-[#07080f] py-6 md:py-8"}`}>
      <div className="mx-auto w-full max-w-[1480px] px-3 md:px-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start xl:gap-8">
          <div className="min-w-0 space-y-6">
            <header className={`${surface} p-4 sm:p-5`}>
              <Link
                href={backHref}
                className="inline-flex text-xs font-medium text-zinc-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                {isCommunity ? "← Hub engagement" : "← Retour à Engagement"}
              </Link>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={raidsSubHref}
                  className="inline-flex rounded-lg border border-sky-500/25 bg-sky-950/25 px-2.5 py-1.5 text-xs font-medium text-sky-100 transition hover:border-sky-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/45"
                >
                  Raids EventSub
                </Link>
                <Link
                  href={historiqueHref}
                  className="inline-flex rounded-lg border border-violet-500/25 bg-violet-950/25 px-2.5 py-1.5 text-xs font-medium text-violet-100 transition hover:border-violet-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45"
                >
                  Historique
                </Link>
                <Link
                  href={pointsDiscordHref}
                  className="inline-flex rounded-lg border border-emerald-500/25 bg-emerald-950/25 px-2.5 py-1.5 text-xs font-medium text-emerald-100 transition hover:border-emerald-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/45"
                >
                  Points Discord
                </Link>
                {isCommunity ? (
                  <Link
                    href={followHref}
                    className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45"
                  >
                    Follow
                  </Link>
                ) : null}
              </div>
              <h1 className="mt-4 text-[clamp(1.35rem,1.1rem+0.9vw,1.85rem)] font-semibold tracking-tight text-white">
                Signalements raids
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
                Examiner les déclarations et corriger les écarts remontés par les membres. Compare toujours avec l’auto EventSub
                avant de valider.
              </p>
            </header>

            <div className={`${surface} flex flex-wrap items-start gap-3 border-amber-500/20 bg-amber-950/15 p-3 sm:p-4`}>
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
              <p className="min-w-0 text-sm leading-relaxed text-amber-100/95">
                <span className="font-semibold text-amber-50">Important :</span> vérifie qu’un raid automatique EventSub n’est pas
                déjà compté avant de valider une déclaration manuelle.
              </p>
            </div>

      {!backendReady ? (
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/20 p-4">
          <p className="font-semibold text-yellow-300">Module non actif</p>
          <p className="text-sm text-yellow-200">La migration `0034_raid_declarations.sql` doit etre appliquee.</p>
        </div>
      ) : null}

      <div className={`${surface} p-4`}>
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filtrer les signalements par statut">
          <button
            type="button"
            role="tab"
            id={tabIdAll}
            aria-selected={statusFilter === "all"}
            aria-controls={signalementsPanelId}
            tabIndex={statusFilter === "all" ? 0 : -1}
            aria-label={`Tous les statuts, ${stats.total} signalements`}
            onClick={() => setStatusFilter("all")}
            className="rounded-md border px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1d]"
            style={{
              borderColor: statusFilter === "all" ? "rgba(139,92,246,0.55)" : "rgba(255,255,255,0.18)",
              color: statusFilter === "all" ? "#c4b5fd" : "#cbd5e1",
            }}
          >
            Tous ({stats.total})
          </button>
          <button
            type="button"
            role="tab"
            id={tabIdProcessing}
            aria-selected={statusFilter === "processing"}
            aria-controls={signalementsPanelId}
            tabIndex={statusFilter === "processing" ? 0 : -1}
            aria-label={`En cours de traitement, ${stats.processing} signalements`}
            onClick={() => setStatusFilter("processing")}
            className="rounded-md border px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1d]"
            style={{
              borderColor: statusFilter === "processing" ? "rgba(250,204,21,0.55)" : "rgba(255,255,255,0.18)",
              color: statusFilter === "processing" ? "#facc15" : "#cbd5e1",
            }}
          >
            En cours ({stats.processing})
          </button>
          <button
            type="button"
            role="tab"
            id={tabIdToStudy}
            aria-selected={statusFilter === "to_study"}
            aria-controls={signalementsPanelId}
            tabIndex={statusFilter === "to_study" ? 0 : -1}
            aria-label={`À vérifier avant décision, ${stats.toStudy} signalements`}
            onClick={() => setStatusFilter("to_study")}
            className="rounded-md border px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1d]"
            style={{
              borderColor: statusFilter === "to_study" ? "rgba(96,165,250,0.55)" : "rgba(255,255,255,0.18)",
              color: statusFilter === "to_study" ? "#93c5fd" : "#cbd5e1",
            }}
          >
            À vérifier ({stats.toStudy})
          </button>
          <button
            type="button"
            role="tab"
            id={tabIdValidated}
            aria-selected={statusFilter === "validated"}
            aria-controls={signalementsPanelId}
            tabIndex={statusFilter === "validated" ? 0 : -1}
            aria-label={`Valides, ${stats.validated} signalements`}
            onClick={() => setStatusFilter("validated")}
            className="rounded-md border px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1d]"
            style={{
              borderColor: statusFilter === "validated" ? "rgba(52,211,153,0.55)" : "rgba(255,255,255,0.18)",
              color: statusFilter === "validated" ? "#34d399" : "#cbd5e1",
            }}
          >
            Valides ({stats.validated})
          </button>
          <button
            type="button"
            role="tab"
            id={tabIdRejected}
            aria-selected={statusFilter === "rejected"}
            aria-controls={signalementsPanelId}
            tabIndex={statusFilter === "rejected" ? 0 : -1}
            aria-label={`Refusés, ${stats.rejected} signalements`}
            onClick={() => setStatusFilter("rejected")}
            className="rounded-md border px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1d]"
            style={{
              borderColor: statusFilter === "rejected" ? "rgba(248,113,113,0.55)" : "rgba(255,255,255,0.18)",
              color: statusFilter === "rejected" ? "#f87171" : "#cbd5e1",
            }}
          >
            Refusés ({stats.rejected})
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher membre, cible ou note..."
            className="w-full max-w-[460px] rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "rgba(255,255,255,0.15)", backgroundColor: "#0e0e10", color: "#fff" }}
            aria-label="Recherche membre, cible ou note"
            aria-describedby={searchFieldDescId}
          />
          <button
            type="button"
            onClick={() => void loadData()}
            aria-label="Lancer la recherche avec les filtres saisis"
            className="rounded-lg bg-[#9146ff] px-3 py-2 text-sm font-semibold text-white hover:bg-[#7c3aed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1d]"
          >
            Rechercher
          </button>
        </div>
        <p id={searchFieldDescId} className="mt-2 max-w-3xl text-[11px] leading-relaxed text-zinc-500">
          Les compteurs suivent la recherche active et le lot de signalements renvoyé par le serveur ; ils ne sont pas limités à
          l’onglet sélectionné.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200" role="alert">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div
          className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-200"
          role="status"
          aria-live="polite"
        >
          {notice}
        </div>
      ) : null}

      <div
        id={signalementsPanelId}
        role="tabpanel"
        aria-labelledby={signalementsTabpanelLabelledby}
        className={`${surface} p-4 sm:p-5`}
      >
        {loading ? (
          isCommunity ? (
            <div className="space-y-3" role="status" aria-live="polite" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-[#353a50] bg-[#121623]/60 p-4">
                  <div className="h-4 w-1/2 rounded bg-slate-700/40" />
                  <div className="mt-3 h-3 w-full rounded bg-slate-800/40" />
                  <div className="mt-2 h-8 w-full rounded bg-slate-800/30" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-300" role="status" aria-live="polite">
              Chargement des déclarations...
            </p>
          )
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-300">Aucune declaration a afficher.</p>
        ) : (
          <>
            <p className="sr-only" role="status" aria-live="polite">
              {rows.length} déclaration(s) affichée(s).
            </p>
            <div className="space-y-3">
            {rows.map((item) => {
              const badge = badgeStyle(item.status);
              const isSaving = savingId === item.id;
              const targetDraft = targetDraftById[item.id] ?? item.target_twitch_login ?? "";
              const normalizedDraft = normalizeLogin(targetDraft);
              const isTargetKnownNow = normalizedDraft.length > 0 && isKnownTarget(normalizedDraft);
              const memberSuggestions = members
                .filter((member) => {
                  const login = normalizeLogin(member.twitchLogin || "");
                  const label = String(member.displayName || "").toLowerCase();
                  if (!normalizedDraft) return true;
                  return login.includes(normalizedDraft) || label.includes(normalizedDraft);
                })
                .slice(0, 8);
              return (
                <article
                  key={item.id}
                  className={`rounded-xl border border-[#353a50] bg-[#121623]/85 p-4 transition hover:border-indigo-400/25 ${
                    isCommunity ? "border-l-4 border-l-amber-500/45 pl-3" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-semibold text-white">
                      {item.member_display_name} ({item.member_twitch_login}) → {item.target_twitch_login}
                    </p>
                    <span
                      className="inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold"
                      style={{ borderColor: badge.borderColor, color: badge.color, backgroundColor: badge.backgroundColor }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-gray-400">
                    {new Date(item.raid_at).toLocaleString("fr-FR")} {item.is_approximate ? "- heure approximative" : ""}
                  </p>
                  {item.note ? <p className="mt-1 text-sm text-gray-300">Note: {item.note}</p> : null}

                  {!isKnownTarget(item.target_twitch_login) ? (
                    <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                      <p className="mb-2 text-xs font-semibold text-amber-200">
                        Cible non reconnue dans membres/gestion. Associe un membre existant ou cree un nouveau membre (Nouveau + Inactif).
                      </p>
                      <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
                        <div>
                          <input
                            value={targetDraft}
                            onChange={(event) =>
                              setTargetDraftById((prev) => ({ ...prev, [item.id]: event.target.value }))
                            }
                            list={`target-suggestions-${item.id}`}
                            placeholder="Rechercher un membre cible..."
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            style={{ borderColor: "rgba(251,191,36,0.35)", backgroundColor: "#0e0e10", color: "#fff" }}
                          />
                          <datalist id={`target-suggestions-${item.id}`}>
                            {memberSuggestions.map((member) => (
                              <option key={`${item.id}-${member.twitchLogin}`} value={normalizeLogin(member.twitchLogin || "")}>
                                {member.displayName}
                              </option>
                            ))}
                          </datalist>
                        </div>
                        <button
                          type="button"
                          onClick={() => void updateTarget(item.id, targetDraft)}
                          disabled={isSaving || !isTargetKnownNow}
                          className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                          style={{ borderColor: "rgba(96,165,250,0.55)", color: "#93c5fd" }}
                        >
                          Associer
                        </button>
                        <button
                          type="button"
                          onClick={() => openCreateMemberModalFromDeclaration(item)}
                          disabled={isSaving}
                          className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                          style={{ borderColor: "rgba(167,139,250,0.55)", color: "#c4b5fd" }}
                        >
                          Creer membre
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                    <input
                      value={commentById[item.id] ?? item.staff_comment ?? ""}
                      onChange={(event) => setCommentById((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      placeholder="Commentaire staff (optionnel)"
                      className="rounded-md border px-3 py-2 text-sm"
                      style={{ borderColor: "rgba(255,255,255,0.18)", backgroundColor: "#0e0e10", color: "#fff" }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md border border-indigo-300/30 bg-indigo-300/10 px-2 py-1 text-[11px] text-indigo-100">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verification EventSub auto activee
                      </span>
                      <button
                        type="button"
                        onClick={() => void updateStatus(item.id, "to_study")}
                        disabled={isSaving}
                        className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                        style={{ borderColor: "rgba(96,165,250,0.5)", color: "#93c5fd" }}
                      >
                        À étudier
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateStatus(item.id, "validated")}
                        disabled={isSaving}
                        className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                        style={{ borderColor: "rgba(52,211,153,0.5)", color: "#34d399" }}
                      >
                        Valider
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateStatus(item.id, "processing")}
                        disabled={isSaving}
                        className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                        style={{ borderColor: "rgba(250,204,21,0.5)", color: "#facc15" }}
                      >
                        Repasser en cours
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateStatus(item.id, "rejected")}
                        disabled={isSaving}
                        className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                        style={{ borderColor: "rgba(248,113,113,0.5)", color: "#f87171" }}
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          </>
        )}
      </div>

          </div>

          <aside className="min-w-0 space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className={`${surface} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Statuts visibles</p>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-zinc-400">
                <li>
                  <span className="font-medium text-amber-200/90">En cours</span> — la fiche vient d’arriver ou est en traitement.
                </li>
                <li>
                  <span className="font-medium text-sky-200/90">À vérifier</span> — besoin d’une décision après contrôle EventSub /
                  historique.
                </li>
                <li>
                  <span className="font-medium text-emerald-200/90">Validé</span> — aligné avec les règles staff.
                </li>
                <li>
                  <span className="font-medium text-rose-200/90">Refusé</span> — écart confirmé ou doublon avéré.
                </li>
              </ul>
            </div>
            <div className={`${surface} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Liens rapides</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href={historiqueHref} className="text-violet-200/90 underline-offset-2 hover:underline">
                    Historique consolidé
                  </Link>
                </li>
                <li>
                  <Link href={raidsSubHref} className="text-sky-200/90 underline-offset-2 hover:underline">
                    Raids EventSub
                  </Link>
                </li>
                <li>
                  <Link href={pointsDiscordHref} className="text-emerald-200/90 underline-offset-2 hover:underline">
                    Points Discord
                  </Link>
                </li>
                {isCommunity ? (
                  <li>
                    <Link href={followHref} className="text-zinc-300 underline-offset-2 hover:underline">
                      Follow communauté
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {pendingValidateId ? (
        <div
          className={validateModalBackdropClass}
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPendingValidateId(null);
          }}
        >
          <div
            className={validateModalShellClass}
            role="dialog"
            aria-modal="true"
            aria-labelledby={validateTitleId}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end border-b border-white/10 px-2 py-2">
              <button
                type="button"
                onClick={() => setPendingValidateId(null)}
                className="rounded-xl border border-white/10 bg-black/30 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="px-6 pb-4 pt-2">
              <h2 id={validateTitleId} className="text-lg font-semibold text-white">
                Valider cette déclaration ?
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Vérifie qu’aucun raid équivalent n’a déjà été <strong className="text-emerald-200">comptabilisé via EventSub</strong>
                . En cas de doute, ouvre l’historique ou la page EventSub depuis la barre du haut.
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={() => setPendingValidateId(null)}
                className="rounded-xl border border-slate-500/50 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void confirmValidateDeclaration()}
                disabled={Boolean(savingId)}
                className="rounded-xl border border-emerald-500/45 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {savingId ? "Envoi…" : "Confirmer la validation"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showCreateMemberModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowCreateMemberModal(false)}>
          <div
            className="w-full max-w-xl rounded-xl border border-gray-700 bg-[#1a1a1d] p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="mb-1 text-xl font-semibold text-white">Creer un membre cible</h3>
            <p className="mb-4 text-xs text-gray-400">Le membre sera cree en role Nouveau et statut Inactif.</p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Login Twitch</label>
                <input
                  value={newMemberDraft.twitchLogin}
                  onChange={(event) =>
                    setNewMemberDraft((prev) => ({
                      ...prev,
                      twitchLogin: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: "rgba(255,255,255,0.18)", backgroundColor: "#0e0e10", color: "#fff" }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Nom affichage</label>
                <input
                  value={newMemberDraft.displayName}
                  onChange={(event) => setNewMemberDraft((prev) => ({ ...prev, displayName: event.target.value }))}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: "rgba(255,255,255,0.18)", backgroundColor: "#0e0e10", color: "#fff" }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">URL Twitch</label>
                <input
                  value={newMemberDraft.twitchUrl}
                  onChange={(event) => setNewMemberDraft((prev) => ({ ...prev, twitchUrl: event.target.value }))}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: "rgba(255,255,255,0.18)", backgroundColor: "#0e0e10", color: "#fff" }}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateMemberModal(false)}
                className="rounded-md border px-3 py-2 text-xs font-semibold text-gray-300"
                style={{ borderColor: "rgba(255,255,255,0.2)" }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void createMemberFromModal()}
                disabled={creatingMember}
                className="rounded-md bg-[#9146ff] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {creatingMember ? "Creation..." : "Creer et associer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
