"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarClock, CheckCircle2, Clock3, Info, Search, Twitch, UserCircle, XCircle } from "lucide-react";
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

function getNowAsLocalInput(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function formatStatus(status: DeclaredRaid["status"]): { label: string; border: string; color: string; bg: string; icon: typeof CheckCircle2 } {
  if (status === "to_study") {
    return {
      label: "A etudier",
      border: "rgba(96,165,250,0.45)",
      color: "#93c5fd",
      bg: "rgba(96,165,250,0.12)",
      icon: Info,
    };
  }
  if (status === "validated") {
    return {
      label: "Valide",
      border: "rgba(52,211,153,0.45)",
      color: "#34d399",
      bg: "rgba(52,211,153,0.12)",
      icon: CheckCircle2,
    };
  }
  if (status === "rejected") {
    return {
      label: "Refuse",
      border: "rgba(248,113,113,0.45)",
      color: "#f87171",
      bg: "rgba(248,113,113,0.12)",
      icon: XCircle,
    };
  }
  return {
    label: "En cours de traitement",
    border: "rgba(250,204,21,0.45)",
    color: "#facc15",
    bg: "rgba(250,204,21,0.12)",
    icon: Clock3,
  };
}

export default function MemberDeclareRaidPage() {
  const [form, setForm] = useState({ target: "", date: getNowAsLocalInput(), note: "" });
  const [isApproximateTime, setIsApproximateTime] = useState(true);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loadingDeclarations, setLoadingDeclarations] = useState(true);
  const [backendSubmissionEnabled, setBackendSubmissionEnabled] = useState(true);
  const [declaredRaids, setDeclaredRaids] = useState<DeclaredRaid[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [lowRaidedSuggestions, setLowRaidedSuggestions] = useState<LowRaidedSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const quickNotes = ["Raid apres live Fortnite", "Soutien membre nouveau", "Fin de stream communautaire"];

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
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
        const mapped = body.declarations.map((row: any) => ({
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
      target: form.target.trim() || "Non renseigne",
      date: safeDate ? safeDate.toLocaleDateString("fr-FR") : "Non renseignee",
      time: safeDate ? safeDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "--:--",
      note: form.note.trim() || "Aucune note",
    };
  }, [form]);

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
      setError("Merci d'indiquer un streamer cible.");
      setToast({ type: "error", message: "Validation impossible: streamer cible manquant." });
      return;
    }
    if (!form.date.trim()) {
      setError("Merci d'indiquer une date et une heure.");
      setToast({ type: "error", message: "Validation impossible: date et heure manquantes." });
      return;
    }

    if (!backendSubmissionEnabled) {
      setError("Le module declarations raids n est pas encore actif.");
      return;
    }

    (async () => {
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
            setError("Le module declarations raids n est pas encore actif.");
            return;
          }
          setError(body.error || "Impossible de declarer ce raid.");
          setToast({ type: "error", message: body.error || "Erreur declaration raid." });
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
        setToast({ type: "success", message: "Raid enregistre et envoye a la moderation." });
        setForm((prev) => ({ ...prev, target: "", note: "" }));
        setShowAutocomplete(false);
        await loadMyDeclarations();
      } catch {
        setError("Erreur reseau pendant la declaration.");
        setToast({ type: "error", message: "Erreur reseau pendant la declaration." });
      }
    })();
  }

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Declarer un raid"
        description="Declaration connectee au suivi staff avec autocompletion membre et statuts en temps reel."
        badge="En ligne"
      />

      <section
        className="rounded-2xl border p-5 md:p-6 space-y-5"
        style={{
          borderColor: "rgba(139,92,246,0.32)",
          background: "radial-gradient(circle at 10% 8%, rgba(139,92,246,0.16), rgba(14,14,18,0.95) 38%)",
          boxShadow: "0 18px 34px rgba(0,0,0,0.24)",
        }}
      >
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-2">
            <label className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
              Pseudo Twitch cible
            </label>
            <div className="relative">
              <Twitch size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#c4b5fd" }} />
              <input
                value={form.target}
                onChange={(e) => setForm((prev) => ({ ...prev, target: e.target.value }))}
                onFocus={() => setShowAutocomplete(true)}
                className="w-full rounded-lg border py-2 pl-9 pr-10"
                style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(10,10,14,0.62)", color: "var(--color-text)" }}
                placeholder="Pseudo Twitch cible"
              />
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-secondary)" }} />
            </div>
            {showAutocomplete ? (
              <div className="mt-2 rounded-lg border p-2" style={{ borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(8,8,12,0.82)" }}>
                {loadingSuggestions ? (
                  <p className="px-2 py-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    Recherche en cours...
                  </p>
                ) : suggestions.length === 0 ? (
                  <p className="px-2 py-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    Aucun membre trouve. Tu peux saisir un pseudo libre.
                  </p>
                ) : (
                  <div className="max-h-[220px] space-y-2 overflow-y-auto">
                    {groupedSuggestions.map(([groupName, items]) => (
                      <div key={groupName}>
                        <p className="px-2 text-[11px] uppercase tracking-[0.12em]" style={{ color: "#c4b5fd" }}>
                          {groupName}
                        </p>
                        <div className="mt-1 space-y-1">
                          {items.map((item) => (
                            <button
                              key={`${groupName}-${item.login}`}
                              type="button"
                              onClick={() => applySuggestion(item.login)}
                              className="flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left text-sm"
                              style={{ borderColor: "rgba(255,255,255,0.12)", color: "var(--color-text)" }}
                            >
                              <span className="inline-flex items-center gap-2">
                                <UserCircle size={13} style={{ color: "#a78bfa" }} />
                                {item.label}
                                <span style={{ color: "var(--color-text-secondary)" }}>({item.login})</span>
                              </span>
                              <span className="text-xs" style={{ color: item.role === "Moderateur" ? "#f0c96b" : "var(--color-text-secondary)" }}>
                                {item.role || "Membre"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              Le pseudo saisi est accepte meme si le streamer n'est pas membre TENF. Un raid vers quelqu'un qui ne fait pas partie de la communaute TENF sera refuse.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
              Date du raid
            </label>
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2"
                style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(10,10,14,0.62)", color: "var(--color-text)" }}
              />
              <button
                type="button"
                onClick={applyNow}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold"
                style={{ borderColor: "rgba(240,201,107,0.45)", color: "#f0c96b" }}
                title="Remplir automatiquement avec maintenant"
              >
                <CalendarClock size={14} />
                Maintenant
              </button>
            </div>
            <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              <input type="checkbox" checked={isApproximateTime} onChange={(e) => setIsApproximateTime(e.target.checked)} />
              Heure approximative
            </label>
          </div>
        </div>

        <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: "rgba(52,211,153,0.3)", backgroundColor: "rgba(52,211,153,0.08)" }}>
          <p className="text-sm font-semibold" style={{ color: "#6ee7b7" }}>
            Suggestions TENF - Membres peu raides ce mois-ci
          </p>
          <div className="flex flex-wrap gap-2">
            {lowRaidedSuggestions.length === 0 ? (
              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Aucune suggestion disponible pour le moment.
              </span>
            ) : (
              lowRaidedSuggestions.map((item) => (
              <button
                key={item.login}
                type="button"
                onClick={() => applySuggestion(item.login)}
                className="rounded-full border px-3 py-1 text-xs font-semibold"
                style={{ borderColor: "rgba(52,211,153,0.45)", color: "#a7f3d0" }}
              >
                {item.label} ({item.receivedCount})
              </button>
              ))
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
            Note (optionnel)
          </label>
          <div className="mb-2 mt-1 flex flex-wrap gap-2">
            {quickNotes.map((note) => (
              <button
                key={note}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, note }))}
                className="rounded-full border px-2 py-1 text-xs"
                style={{ borderColor: "rgba(139,92,246,0.45)", color: "#c4b5fd" }}
              >
                {note}
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={form.note}
            onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(10,10,14,0.62)", color: "var(--color-text)" }}
            placeholder="Ex: Raid apres live Fortnite"
          />
        </div>

        <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(8,8,12,0.52)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            Resume du raid
          </p>
          <div className="mt-2 space-y-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <p>
              Streamer cible : <span style={{ color: "var(--color-text)" }}>{formPreview.target}</span>
            </p>
            <p>
              Date : <span style={{ color: "var(--color-text)" }}>{formPreview.date}</span>
            </p>
            <p>
              Heure : <span style={{ color: "var(--color-text)" }}>{formPreview.time}</span> {isApproximateTime ? "(approximative)" : ""}
            </p>
            <p>
              Note : <span style={{ color: "var(--color-text)" }}>{formPreview.note}</span>
            </p>
          </div>
        </div>

        {error ? (
          <div className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(248,113,113,0.45)", color: "#fda4af" }}>
            <AlertCircle size={15} />
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Declarer le raid
          </button>
          {!backendSubmissionEnabled ? (
            <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "rgba(250,204,21,0.4)", color: "#facc15" }}>
              <Info size={13} />
              Bientot disponible (module DB non actif)
            </span>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border p-5 space-y-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
          Mes raids declares
        </h3>
        {loadingDeclarations ? (
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Chargement des declarations...
          </p>
        ) : declaredRaids.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Aucun raid declare pour le moment.
          </p>
        ) : (
          <div className="space-y-2">
            {declaredRaids
              .slice()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((raid) => {
              const status = formatStatus(raid.status);
              const StatusIcon = status.icon;
              return (
                <div
                  key={raid.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <div>
                    <p style={{ color: "var(--color-text)" }}>{raid.target}</p>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {new Date(raid.date).toLocaleString("fr-FR")} {raid.approximate ? "- heure approximative" : ""}
                    </p>
                    {raid.note ? (
                      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        Note: {raid.note}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold"
                    style={{ borderColor: status.border, color: status.color, backgroundColor: status.bg }}
                  >
                    <StatusIcon size={13} />
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showConfirmation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowConfirmation(false)}>
          <div
            className="w-full max-w-md rounded-xl border p-5"
            style={{ borderColor: "rgba(52,211,153,0.4)", backgroundColor: "var(--color-card)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-lg font-semibold" style={{ color: "#6ee7b7" }}>
              Raid enregistre !
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              La moderation va traiter ton raid.
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Merci pour ton soutien a la communaute TENF ❤
            </p>
            <button
              type="button"
              onClick={() => setShowConfirmation(false)}
              className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className="rounded-lg border px-4 py-3 text-sm shadow-xl"
            style={{
              borderColor: toast.type === "success" ? "rgba(52,211,153,0.45)" : "rgba(248,113,113,0.45)",
              color: toast.type === "success" ? "#a7f3d0" : "#fecaca",
              backgroundColor: "rgba(10,10,14,0.94)",
            }}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </MemberSurface>
  );
}
