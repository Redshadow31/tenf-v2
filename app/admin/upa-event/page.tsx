"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type {
  UpaEventContent,
  UpaEventEditorialSection,
  UpaEventFaqItem,
  UpaEventOfficialLink,
  UpaEventPartnerCommunity,
  UpaEventStaffMember,
  UpaEventStreamerMember,
  UpaEventTimelineItem,
  UpaTimelineStatus,
} from "@/lib/upaEvent/types";

type TabKey =
  | "settings"
  | "proof"
  | "streamers"
  | "timeline"
  | "sections"
  | "staff"
  | "faq"
  | "links"
  | "partners"
  | "cta"
  | "display";

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function TextField({ label, value, onChange, placeholder }: FieldProps) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
          color: "var(--color-text)",
        }}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: FieldProps & { rows?: number }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
          color: "var(--color-text)",
        }}
      />
    </label>
  );
}

type TenfMemberSearchHit = {
  discordId?: string;
  twitchLogin?: string;
  displayName?: string;
  avatar?: string;
  discordUsername?: string;
  role?: string;
};

function isPlaceholderTwitchLogin(login: string | undefined): boolean {
  const v = String(login || "").trim().toLowerCase();
  return !v || v.startsWith("nouveau_");
}

function UpaStreamerTenfLinker({
  linkedMemberDiscordId,
  onAttach,
}: {
  linkedMemberDiscordId?: string;
  onAttach: (patch: Partial<UpaEventStreamerMember>) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<TenfMemberSearchHit[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const res = await fetch(
            `/api/admin/search/members?q=${encodeURIComponent(term)}&limit=14`,
            { cache: "no-store" }
          );
          const data = (await res.json().catch(() => ({}))) as { members?: TenfMemberSearchHit[] };
          setResults(res.ok && Array.isArray(data.members) ? data.members : []);
        } catch {
          setResults([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 320);
    return () => window.clearTimeout(handle);
  }, [q]);

  return (
    <div
      className="rounded-lg border p-3 space-y-2"
      style={{ borderColor: "rgba(212,175,55,0.22)", backgroundColor: "rgba(212,175,55,0.05)" }}
    >
      <p className="text-xs font-semibold" style={{ color: "#e8d69a" }}>
        Membre TENF (fiche gestion centralisée)
      </p>
      <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        Recherche parmi les membres enregistrés : la sélection remplit le Twitch et enregistre le lien Discord vers la
        fiche membre.
      </p>
      {linkedMemberDiscordId ? (
        <div className="flex flex-wrap items-center gap-2 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
          <span>
            Rattaché — Discord{" "}
            <code className="text-[10px] px-1 rounded" style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
              {linkedMemberDiscordId}
            </code>
          </span>
          <button
            type="button"
            onClick={() => onAttach({ linkedMemberDiscordId: undefined })}
            className="rounded border px-2 py-0.5 text-[11px]"
            style={{ borderColor: "rgba(255,255,255,0.2)", color: "#fca5a5" }}
          >
            Détacher la fiche
          </button>
        </div>
      ) : null}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Pseudo Twitch, Discord ou prénom (min. 2 car.)"
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
          color: "var(--color-text)",
        }}
      />
      {searching ? (
        <p className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
          Recherche…
        </p>
      ) : null}
      {results.length > 0 ? (
        <ul className="max-h-44 overflow-y-auto space-y-1 pr-1">
          {results.map((m, i) => {
            const key = `${m.discordId || ""}-${m.twitchLogin || ""}-${i}`;
            const label = [m.displayName, m.twitchLogin && `@${m.twitchLogin}`, m.discordUsername]
              .filter(Boolean)
              .join(" · ");
            const badTwitch = isPlaceholderTwitchLogin(m.twitchLogin);
            return (
              <li key={key}>
                <button
                  type="button"
                  disabled={badTwitch}
                  onClick={() => {
                    if (badTwitch) return;
                    const login = String(m.twitchLogin || "")
                      .trim()
                      .replace(/^@/, "")
                      .toLowerCase();
                    const discord = String(m.discordId || "").trim();
                    onAttach({
                      ...(discord ? { linkedMemberDiscordId: discord } : {}),
                      twitchLogin: login,
                      displayName: (m.displayName || m.twitchLogin || "").trim() || login,
                      avatarUrl: m.avatar || "",
                    });
                    setQ("");
                    setResults([]);
                  }}
                  className="w-full text-left rounded-md border px-2 py-2 text-xs disabled:opacity-45"
                  style={{
                    borderColor: "rgba(255,255,255,0.12)",
                    color: "var(--color-text)",
                    backgroundColor: "rgba(0,0,0,0.25)",
                  }}
                >
                  {m.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatar} alt="" className="inline-block h-7 w-7 rounded-full mr-2 align-middle" />
                  ) : null}
                  <span className="align-middle">{label || "Sans nom"}</span>
                  {m.role ? (
                    <span className="block text-[10px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                      {m.role}
                      {badTwitch ? " — pas de Twitch valide sur la fiche" : ""}
                    </span>
                  ) : badTwitch ? (
                    <span className="block text-[10px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                      Pas de Twitch valide sur la fiche
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : q.trim().length >= 2 && !searching ? (
        <p className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
          Aucun résultat.
        </p>
      ) : null}
    </div>
  );
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createDefaultContent(): UpaEventContent {
  return {
    slug: "upa-event",
    general: {
      title: "UPA EVENT - Unis pour l'Avenir",
      subtitle: "Partenariat TENF x UPA",
      slogan: "Un evenement caritatif communautaire",
      startDate: "2026-04-18",
      endDate: "2026-04-26",
      causeSupported: "Lutte contre le cancer",
      partnershipBadge: "Partenariat TENF x UPA",
      heroText: "",
      registrationStatus: "open",
      moodMessage: "",
      charityCampaignUrl: "",
    },
    socialProof: {
      totalRegistered: 23,
      streamersRegistered: 0,
      moderatorsRegistered: 0,
      socialProofMessage: "Deja plus de 23 participants inscrits",
      isVisible: true,
    },
    timeline: [],
    editorialSections: [],
    staff: [],
    streamers: [],
    faq: [],
    officialLinks: [],
    partnerCommunities: [],
    cta: {
      streamerButtonText: "Participer comme streamer",
      moderatorButtonText: "Devenir moderateur volontaire",
      finalCtaTitle: "Rejoignez l'evenement",
      finalCtaText: "",
      finalEmotionText: "",
      secondaryText: "",
    },
    displaySettings: {
      showSocialProof: true,
      showTimeline: true,
      showStaff: true,
      showFaq: true,
      showPartnerCommunities: true,
      showTenfPartnershipBlock: true,
      showFinalCta: true,
    },
    statusMessages: {
      statusLabel: "",
      statusMessage: "",
      highlightMessage: "",
    },
    updatedAt: new Date(0).toISOString(),
    updatedBy: "",
  };
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "settings", label: "Periode UPA" },
  { key: "proof", label: "Participants" },
  { key: "streamers", label: "Lives caritatifs UPA" },
  { key: "staff", label: "Staff UPA" },
];

const premiumPanelStyle = {
  borderColor: "rgba(212,175,55,0.28)",
  background:
    "radial-gradient(circle at 12% 18%, rgba(212,175,55,0.16), rgba(212,175,55,0) 42%), linear-gradient(155deg, rgba(27,27,35,0.98), rgba(14,14,20,0.98))",
  boxShadow: "0 18px 40px rgba(0,0,0,0.32)",
} as const;

export default function AdminUpaEventPage() {
  const [content, setContent] = useState<UpaEventContent>(createDefaultContent());
  const [activeTab, setActiveTab] = useState<TabKey>("settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/upa-event", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Erreur chargement");
        setContent(data.content as UpaEventContent);
      } catch (error) {
        console.error("[admin/upa-event] load error:", error);
        setFeedback("Impossible de charger la configuration UPA Event.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const lastUpdateLabel = useMemo(() => {
    if (!content.updatedAt) return "Jamais";
    const date = new Date(content.updatedAt);
    if (Number.isNaN(date.getTime())) return "Inconnue";
    return date.toLocaleString("fr-FR");
  }, [content.updatedAt]);

  function setGeneralField<K extends keyof UpaEventContent["general"]>(
    key: K,
    value: UpaEventContent["general"][K]
  ) {
    setContent((prev) => ({ ...prev, general: { ...prev.general, [key]: value } }));
  }

  function setSocialField<K extends keyof UpaEventContent["socialProof"]>(
    key: K,
    value: UpaEventContent["socialProof"][K]
  ) {
    setContent((prev) => ({ ...prev, socialProof: { ...prev.socialProof, [key]: value } }));
  }

  function setCtaField<K extends keyof UpaEventContent["cta"]>(
    key: K,
    value: UpaEventContent["cta"][K]
  ) {
    setContent((prev) => ({ ...prev, cta: { ...prev.cta, [key]: value } }));
  }

  function setStatusMessageField<K extends keyof UpaEventContent["statusMessages"]>(
    key: K,
    value: UpaEventContent["statusMessages"][K]
  ) {
    setContent((prev) => ({ ...prev, statusMessages: { ...prev.statusMessages, [key]: value } }));
  }

  function setDisplayField<K extends keyof UpaEventContent["displaySettings"]>(
    key: K,
    value: UpaEventContent["displaySettings"][K]
  ) {
    setContent((prev) => ({ ...prev, displaySettings: { ...prev.displaySettings, [key]: value } }));
  }

  function updateTimeline(index: number, patch: Partial<UpaEventTimelineItem>) {
    setContent((prev) => {
      const next = [...prev.timeline];
      next[index] = { ...next[index], ...patch };
      return { ...prev, timeline: next };
    });
  }

  function updateEditorial(index: number, patch: Partial<UpaEventEditorialSection>) {
    setContent((prev) => {
      const next = [...prev.editorialSections];
      next[index] = { ...next[index], ...patch };
      return { ...prev, editorialSections: next };
    });
  }

  function updateStaff(index: number, patch: Partial<UpaEventStaffMember>) {
    setContent((prev) => {
      const next = [...prev.staff];
      next[index] = { ...next[index], ...patch };
      return { ...prev, staff: next };
    });
  }

  function updateStreamer(index: number, patch: Partial<UpaEventStreamerMember>) {
    setContent((prev) => {
      const next = [...prev.streamers];
      next[index] = { ...next[index], ...patch };
      return { ...prev, streamers: next };
    });
  }

  function updateFaq(index: number, patch: Partial<UpaEventFaqItem>) {
    setContent((prev) => {
      const next = [...prev.faq];
      next[index] = { ...next[index], ...patch };
      return { ...prev, faq: next };
    });
  }

  function updateOfficialLink(index: number, patch: Partial<UpaEventOfficialLink>) {
    setContent((prev) => {
      const next = [...prev.officialLinks];
      next[index] = { ...next[index], ...patch };
      return { ...prev, officialLinks: next };
    });
  }

  function updatePartner(index: number, patch: Partial<UpaEventPartnerCommunity>) {
    setContent((prev) => {
      const next = [...prev.partnerCommunities];
      next[index] = { ...next[index], ...patch };
      return { ...prev, partnerCommunities: next };
    });
  }

  async function saveContent() {
    try {
      setSaving(true);
      setFeedback("");
      const response = await fetch("/api/admin/upa-event", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: content.general.startDate,
          endDate: content.general.endDate,
          charityCampaignUrl: content.general.charityCampaignUrl,
          totalRegistered: content.socialProof.totalRegistered,
          streamers: content.streamers,
          staff: content.staff,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Erreur sauvegarde");
      setContent(data.content as UpaEventContent);
      setFeedback("Periode, streamers et staff UPA enregistres avec succes.");
    } catch (error) {
      console.error("[admin/upa-event] save error:", error);
      setFeedback(error instanceof Error ? error.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ color: "var(--color-text)" }}>Chargement de la configuration UPA Event...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border p-5 md:p-6" style={premiumPanelStyle}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-wide"
              style={{
                borderColor: "rgba(212,175,55,0.45)",
                color: "#f6e0a5",
                backgroundColor: "rgba(212,175,55,0.14)",
              }}
            >
              PARTENARIAT TENF x UPA
            </p>
            <Link href="/admin/events" className="text-sm mt-3 mb-2 inline-block" style={{ color: "rgba(255,255,255,0.7)" }}>
            ← Retour au hub événements
            </Link>
            <h1 className="text-3xl font-bold" style={{ color: "#f8ecd0" }}>
              Gestion UPA Event
            </h1>
            <p style={{ color: "rgba(255,255,255,0.76)" }}>
              Pilote la periode active, les streamers caritatifs et l'equipe UPA depuis une seule interface.
            </p>
            <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>
              Derniere mise a jour: {lastUpdateLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveContent}
              disabled={saving}
              className="rounded-xl px-4 py-2 font-semibold disabled:opacity-60"
              style={{
                border: "1px solid rgba(212,175,55,0.45)",
                background: "linear-gradient(160deg, #eac56a, #d4af37)",
                color: "#1a1407",
                boxShadow: "0 8px 20px rgba(212,175,55,0.28)",
              }}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{
            borderColor: feedback.toLowerCase().includes("erreur") ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.35)",
            color: "var(--color-text)",
            backgroundColor: feedback.toLowerCase().includes("erreur") ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
          }}
        >
          {feedback}
        </div>
      )}

      <div className="flex flex-wrap gap-2 rounded-xl border p-2" style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="rounded-lg border px-3 py-2 text-sm font-medium transition-transform hover:-translate-y-[1px]"
            style={{
              borderColor: activeTab === tab.key ? "rgba(212,175,55,0.6)" : "var(--color-border)",
              background:
                activeTab === tab.key
                  ? "linear-gradient(145deg, rgba(212,175,55,0.22), rgba(212,175,55,0.12))"
                  : "var(--color-card)",
              color: activeTab === tab.key ? "#f2d891" : "var(--color-text)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        className="rounded-2xl border p-4 md:p-6 space-y-4"
        style={{
          borderColor: "rgba(212,175,55,0.2)",
          background:
            "radial-gradient(circle at 90% 5%, rgba(212,175,55,0.08), rgba(212,175,55,0) 35%), linear-gradient(180deg, rgba(26,26,34,0.96), rgba(19,19,25,0.97))",
          boxShadow: "0 16px 34px rgba(0,0,0,0.22)",
        }}
      >
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="Date debut (YYYY-MM-DD)" value={content.general.startDate} onChange={(v) => setGeneralField("startDate", v)} />
            <TextField label="Date fin (YYYY-MM-DD)" value={content.general.endDate} onChange={(v) => setGeneralField("endDate", v)} />
            <div className="md:col-span-2">
              <TextField
                label="Lien cagnotte caritative (Streamlabs Charity, etc.)"
                value={content.general.charityCampaignUrl}
                onChange={(v) => setGeneralField("charityCampaignUrl", v)}
                placeholder="https://streamlabscharity.com/..."
              />
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                URL publique de la campagne (sans jeton). Ne pas y coller le lien widget Streamlabs (
                <code className="text-[11px]">streamlabs.com/widgets/...token=</code>
                ) : il serait visible via l&apos;API publique UPA. Pour le widget objectif sur /lives, configure{" "}
                <code className="text-[11px]">STREAMLABS_CHARITY_GOAL_WIDGET_URL</code> (Netlify / env) : charge via{" "}
                <code className="text-[11px]">/api/lives/streamlabs-charity-widget</code> au runtime.
              </p>
            </div>
            <div
              className="md:col-span-2 rounded-lg border px-4 py-3 text-sm"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              En dehors de cette periode, le bloc "Lives caritatifs UPA" ne sera pas affiche sur la page /lives.
            </div>
          </div>
        )}

        {activeTab === "proof" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Nombre total d'inscrits / participants"
              value={String(content.socialProof.totalRegistered)}
              onChange={(v) => setSocialField("totalRegistered", Number.parseInt(v || "0", 10) || 0)}
            />
            <div
              className="rounded-lg border px-4 py-3 text-sm"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Le message de preuve sociale est genere automatiquement a partir de cette valeur.
            </div>
          </div>
        )}

        {activeTab === "streamers" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "rgba(212,175,55,0.25)", backgroundColor: "rgba(212,175,55,0.06)" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#f2d891" }}>
                  Streamers mis en avant sur /lives
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Ajoute les logins Twitch ou rattache une fiche membre TENF (recherche ci-dessous dans chaque ligne).
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setContent((prev) => ({
                    ...prev,
                    streamers: [
                      ...prev.streamers,
                      {
                        id: makeId("streamer"),
                        twitchLogin: "",
                        displayName: "",
                        avatarUrl: "",
                        description: "",
                        order: prev.streamers.length + 1,
                        isActive: true,
                      },
                    ],
                  }))
                }
                className="rounded-lg border px-3 py-2 text-sm font-medium"
                style={{
                  borderColor: "rgba(212,175,55,0.45)",
                  color: "#f2d891",
                  backgroundColor: "rgba(212,175,55,0.14)",
                }}
              >
                + Ajouter un streamer
              </button>
            </div>

            {content.streamers.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Aucun streamer configure pour le moment.
              </p>
            ) : (
              content.streamers
                .map((item, index) => ({ item, index }))
                .sort((a, b) => a.item.order - b.item.order)
                .map(({ item, index }) => (
                  <div
                    key={item.id}
                    className="rounded-xl border p-4 space-y-3"
                    style={{
                      borderColor: "rgba(255,255,255,0.14)",
                      background: "linear-gradient(160deg, rgba(25,25,33,0.9), rgba(18,18,24,0.95))",
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <strong style={{ color: "var(--color-text)" }}>{item.twitchLogin || "Nouveau streamer"}</strong>
                      <button
                        type="button"
                        onClick={() =>
                          setContent((prev) => ({
                            ...prev,
                            streamers: prev.streamers.filter((x) => x.id !== item.id),
                          }))
                        }
                        className="text-sm rounded-md border px-2 py-1"
                        style={{ color: "#fca5a5", borderColor: "rgba(239,68,68,0.35)", backgroundColor: "rgba(239,68,68,0.12)" }}
                      >
                        Supprimer
                      </button>
                    </div>

                    <UpaStreamerTenfLinker
                      linkedMemberDiscordId={item.linkedMemberDiscordId}
                      onAttach={(patch) => updateStreamer(index, patch)}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <TextField
                        label="Login Twitch"
                        value={item.twitchLogin}
                        onChange={(v) =>
                          updateStreamer(index, {
                            twitchLogin: v.trim().replace(/^@/, "").toLowerCase(),
                            displayName: item.displayName || v.trim().replace(/^@/, ""),
                          })
                        }
                        placeholder="ex: symaog"
                      />
                      <TextField
                        label="Nom affiche"
                        value={item.displayName}
                        onChange={(v) => updateStreamer(index, { displayName: v })}
                        placeholder="Nom public"
                      />
                      <TextField
                        label="Ordre"
                        value={String(item.order)}
                        onChange={(v) => updateStreamer(index, { order: Number.parseInt(v || "0", 10) || 0 })}
                      />
                      <label className="flex items-center gap-2 mt-7">
                        <input
                          type="checkbox"
                          checked={item.isActive}
                          onChange={(e) => updateStreamer(index, { isActive: e.target.checked })}
                        />
                        <span style={{ color: "var(--color-text)" }}>Actif</span>
                      </label>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() =>
                setContent((prev) => ({
                  ...prev,
                  timeline: [
                    ...prev.timeline,
                    {
                      id: makeId("timeline"),
                      title: "",
                      description: "",
                      dateLabel: "",
                      order: prev.timeline.length + 1,
                      status: "upcoming",
                      isActive: true,
                    },
                  ],
                }))
              }
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              + Ajouter une etape
            </button>
            {content.timeline.map((item, index) => (
              <div key={item.id} className="rounded-lg border p-3 space-y-3" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex justify-between items-center">
                  <strong style={{ color: "var(--color-text)" }}>Etape #{index + 1}</strong>
                  <button
                    type="button"
                    onClick={() => setContent((prev) => ({ ...prev, timeline: prev.timeline.filter((x) => x.id !== item.id) }))}
                    className="text-sm"
                    style={{ color: "#ef4444" }}
                  >
                    Supprimer
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextField label="Titre" value={item.title} onChange={(v) => updateTimeline(index, { title: v })} />
                  <TextField label="Date / label" value={item.dateLabel} onChange={(v) => updateTimeline(index, { dateLabel: v })} />
                  <TextField
                    label="Ordre"
                    value={String(item.order)}
                    onChange={(v) => updateTimeline(index, { order: Number.parseInt(v || "0", 10) || 0 })}
                  />
                  <label className="block">
                    <span className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                      Etat
                    </span>
                    <select
                      value={item.status}
                      onChange={(e) => updateTimeline(index, { status: e.target.value as UpaTimelineStatus })}
                      className="w-full rounded-lg border px-3 py-2"
                      style={{
                        borderColor: "var(--color-border)",
                        backgroundColor: "var(--color-card)",
                        color: "var(--color-text)",
                      }}
                    >
                      <option value="past">Passe</option>
                      <option value="current">Actuel</option>
                      <option value="upcoming">A venir</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 mt-7">
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      onChange={(e) => updateTimeline(index, { isActive: e.target.checked })}
                    />
                    <span style={{ color: "var(--color-text)" }}>Actif</span>
                  </label>
                </div>
                <TextAreaField
                  label="Description"
                  value={item.description}
                  onChange={(v) => updateTimeline(index, { description: v })}
                  rows={3}
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === "sections" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() =>
                setContent((prev) => ({
                  ...prev,
                  editorialSections: [
                    ...prev.editorialSections,
                    {
                      id: makeId("section"),
                      key: `section-${prev.editorialSections.length + 1}`,
                      title: "",
                      subtitle: "",
                      content: "",
                      order: prev.editorialSections.length + 1,
                      variant: "default",
                      isActive: true,
                    },
                  ],
                }))
              }
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              + Ajouter un bloc editorial
            </button>
            {content.editorialSections.map((item, index) => (
              <div key={item.id} className="rounded-lg border p-3 space-y-3" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex justify-between items-center">
                  <strong style={{ color: "var(--color-text)" }}>Bloc #{index + 1}</strong>
                  <button
                    type="button"
                    onClick={() =>
                      setContent((prev) => ({
                        ...prev,
                        editorialSections: prev.editorialSections.filter((x) => x.id !== item.id),
                      }))
                    }
                    className="text-sm"
                    style={{ color: "#ef4444" }}
                  >
                    Supprimer
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextField label="Cle technique" value={item.key} onChange={(v) => updateEditorial(index, { key: v })} />
                  <TextField label="Titre" value={item.title} onChange={(v) => updateEditorial(index, { title: v })} />
                  <TextField label="Sous-titre" value={item.subtitle || ""} onChange={(v) => updateEditorial(index, { subtitle: v })} />
                  <TextField
                    label="Ordre"
                    value={String(item.order)}
                    onChange={(v) => updateEditorial(index, { order: Number.parseInt(v || "0", 10) || 0 })}
                  />
                  <label className="block">
                    <span className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                      Variante
                    </span>
                    <select
                      value={item.variant}
                      onChange={(e) => updateEditorial(index, { variant: e.target.value as UpaEventEditorialSection["variant"] })}
                      className="w-full rounded-lg border px-3 py-2"
                      style={{
                        borderColor: "var(--color-border)",
                        backgroundColor: "var(--color-card)",
                        color: "var(--color-text)",
                      }}
                    >
                      <option value="default">Default</option>
                      <option value="highlight">Highlight</option>
                      <option value="soft">Soft</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 mt-7">
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      onChange={(e) => updateEditorial(index, { isActive: e.target.checked })}
                    />
                    <span style={{ color: "var(--color-text)" }}>Actif</span>
                  </label>
                </div>
                <TextAreaField label="Contenu" value={item.content} onChange={(v) => updateEditorial(index, { content: v })} rows={5} />
              </div>
            ))}
          </div>
        )}

        {activeTab === "staff" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setContent((prev) => ({
                    ...prev,
                    staff: [
                      ...prev.staff,
                      {
                        id: makeId("staff"),
                        twitchLogin: "",
                        name: "",
                        role: "Haut staff UPA",
                        description: "",
                        staffType: "high_staff",
                        avatarUrl: "",
                        order: prev.staff.filter((x) => x.staffType === "high_staff").length + 1,
                        isActive: true,
                      },
                    ],
                  }))
                }
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                + Ajouter haut staff
              </button>
              <button
                type="button"
                onClick={() =>
                  setContent((prev) => ({
                    ...prev,
                    staff: [
                      ...prev.staff,
                      {
                        id: makeId("staff"),
                        twitchLogin: "",
                        name: "",
                        role: "Moderateur UPA",
                        description: "",
                        staffType: "moderator",
                        avatarUrl: "",
                        order: prev.staff.filter((x) => x.staffType !== "high_staff").length + 1,
                        isActive: true,
                      },
                    ],
                  }))
                }
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                + Ajouter moderateur
              </button>
            </div>

            {(["high_staff", "moderator"] as const).map((group) => {
              const label = group === "high_staff" ? "Haut staff UPA" : "Moderateurs UPA";
              const list = content.staff
                .map((member, index) => ({ member, index }))
                .filter(({ member }) => (member.staffType || "moderator") === group);

              return (
                <div key={group} className="space-y-3">
                  <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    {label}
                  </h3>
                  {list.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      Aucun profil dans cette section.
                    </p>
                  ) : (
                    list.map(({ member: item, index }) => (
                      <div
                        key={item.id}
                        className="rounded-lg border p-3 space-y-3"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        <div className="flex justify-between items-center">
                          <strong style={{ color: "var(--color-text)" }}>{item.twitchLogin || "Nouveau profil"}</strong>
                          <button
                            type="button"
                            onClick={() => setContent((prev) => ({ ...prev, staff: prev.staff.filter((x) => x.id !== item.id) }))}
                            className="text-sm"
                            style={{ color: "#ef4444" }}
                          >
                            Supprimer
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <TextField
                            label="Nom Twitch"
                            value={item.twitchLogin || ""}
                            onChange={(v) =>
                              updateStaff(index, {
                                twitchLogin: v.trim().replace(/^@/, "").toLowerCase(),
                                name: v.trim().replace(/^@/, ""),
                              })
                            }
                            placeholder="ex: symaog"
                          />
                          <TextField label="Role" value={item.role} onChange={(v) => updateStaff(index, { role: v })} />
                          <TextField
                            label="Ordre"
                            value={String(item.order)}
                            onChange={(v) => updateStaff(index, { order: Number.parseInt(v || "0", 10) || 0 })}
                          />
                          <label className="flex items-center gap-2 mt-7">
                            <input
                              type="checkbox"
                              checked={item.isActive}
                              onChange={(e) => updateStaff(index, { isActive: e.target.checked })}
                            />
                            <span style={{ color: "var(--color-text)" }}>Actif</span>
                          </label>
                        </div>

                        <TextAreaField
                          label="Description courte"
                          value={item.description}
                          onChange={(v) => updateStaff(index, { description: v })}
                          rows={3}
                        />
                        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                          Avatar et nom affichable recuperes automatiquement depuis Twitch lors de l'enregistrement.
                        </p>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "faq" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() =>
                setContent((prev) => ({
                  ...prev,
                  faq: [
                    ...prev.faq,
                    {
                      id: makeId("faq"),
                      question: "",
                      answer: "",
                      order: prev.faq.length + 1,
                      isActive: true,
                    },
                  ],
                }))
              }
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              + Ajouter une question FAQ
            </button>
            {content.faq.map((item, index) => (
              <div key={item.id} className="rounded-lg border p-3 space-y-3" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex justify-between items-center">
                  <strong style={{ color: "var(--color-text)" }}>FAQ #{index + 1}</strong>
                  <button
                    type="button"
                    onClick={() => setContent((prev) => ({ ...prev, faq: prev.faq.filter((x) => x.id !== item.id) }))}
                    className="text-sm"
                    style={{ color: "#ef4444" }}
                  >
                    Supprimer
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextField
                    label="Ordre"
                    value={String(item.order)}
                    onChange={(v) => updateFaq(index, { order: Number.parseInt(v || "0", 10) || 0 })}
                  />
                  <label className="flex items-center gap-2 mt-7">
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      onChange={(e) => updateFaq(index, { isActive: e.target.checked })}
                    />
                    <span style={{ color: "var(--color-text)" }}>Actif</span>
                  </label>
                </div>
                <TextAreaField label="Question" value={item.question} onChange={(v) => updateFaq(index, { question: v })} rows={2} />
                <TextAreaField label="Reponse" value={item.answer} onChange={(v) => updateFaq(index, { answer: v })} rows={4} />
              </div>
            ))}
          </div>
        )}

        {activeTab === "links" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() =>
                setContent((prev) => ({
                  ...prev,
                  officialLinks: [
                    ...prev.officialLinks,
                    {
                      id: makeId("link"),
                      label: "",
                      url: "",
                      description: "",
                      order: prev.officialLinks.length + 1,
                      isActive: true,
                    },
                  ],
                }))
              }
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              + Ajouter un lien officiel
            </button>
            {content.officialLinks.map((item, index) => (
              <div key={item.id} className="rounded-lg border p-3 space-y-3" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex justify-between items-center">
                  <strong style={{ color: "var(--color-text)" }}>Lien #{index + 1}</strong>
                  <button
                    type="button"
                    onClick={() =>
                      setContent((prev) => ({
                        ...prev,
                        officialLinks: prev.officialLinks.filter((x) => x.id !== item.id),
                      }))
                    }
                    className="text-sm"
                    style={{ color: "#ef4444" }}
                  >
                    Supprimer
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextField label="Label" value={item.label} onChange={(v) => updateOfficialLink(index, { label: v })} />
                  <TextField label="URL" value={item.url} onChange={(v) => updateOfficialLink(index, { url: v })} />
                  <TextField
                    label="Description"
                    value={item.description || ""}
                    onChange={(v) => updateOfficialLink(index, { description: v })}
                  />
                  <TextField
                    label="Ordre"
                    value={String(item.order)}
                    onChange={(v) => updateOfficialLink(index, { order: Number.parseInt(v || "0", 10) || 0 })}
                  />
                  <label className="flex items-center gap-2 mt-7">
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      onChange={(e) => updateOfficialLink(index, { isActive: e.target.checked })}
                    />
                    <span style={{ color: "var(--color-text)" }}>Actif</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "partners" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() =>
                setContent((prev) => ({
                  ...prev,
                  partnerCommunities: [
                    ...prev.partnerCommunities,
                    {
                      id: makeId("partner"),
                      name: "",
                      description: "",
                      logoUrl: "",
                      url: "",
                      order: prev.partnerCommunities.length + 1,
                      isActive: true,
                    },
                  ],
                }))
              }
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              + Ajouter une communaute partenaire
            </button>
            {content.partnerCommunities.map((item, index) => (
              <div key={item.id} className="rounded-lg border p-3 space-y-3" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex justify-between items-center">
                  <strong style={{ color: "var(--color-text)" }}>Partenaire #{index + 1}</strong>
                  <button
                    type="button"
                    onClick={() =>
                      setContent((prev) => ({
                        ...prev,
                        partnerCommunities: prev.partnerCommunities.filter((x) => x.id !== item.id),
                      }))
                    }
                    className="text-sm"
                    style={{ color: "#ef4444" }}
                  >
                    Supprimer
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextField label="Nom" value={item.name} onChange={(v) => updatePartner(index, { name: v })} />
                  <TextField label="URL (optionnel)" value={item.url || ""} onChange={(v) => updatePartner(index, { url: v })} />
                  <TextField
                    label="Logo URL (optionnel)"
                    value={item.logoUrl || ""}
                    onChange={(v) => updatePartner(index, { logoUrl: v })}
                  />
                  <TextField
                    label="Ordre"
                    value={String(item.order)}
                    onChange={(v) => updatePartner(index, { order: Number.parseInt(v || "0", 10) || 0 })}
                  />
                  <label className="flex items-center gap-2 mt-7">
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      onChange={(e) => updatePartner(index, { isActive: e.target.checked })}
                    />
                    <span style={{ color: "var(--color-text)" }}>Actif</span>
                  </label>
                </div>
                <TextAreaField
                  label="Description courte"
                  value={item.description}
                  onChange={(v) => updatePartner(index, { description: v })}
                  rows={3}
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === "cta" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Texte bouton streamer"
              value={content.cta.streamerButtonText}
              onChange={(v) => setCtaField("streamerButtonText", v)}
            />
            <TextField
              label="Texte bouton moderateur"
              value={content.cta.moderatorButtonText}
              onChange={(v) => setCtaField("moderatorButtonText", v)}
            />
            <TextField label="Titre CTA final" value={content.cta.finalCtaTitle} onChange={(v) => setCtaField("finalCtaTitle", v)} />
            <TextField
              label="Texte secondaire CTA"
              value={content.cta.secondaryText || ""}
              onChange={(v) => setCtaField("secondaryText", v)}
            />
            <div className="md:col-span-2">
              <TextAreaField label="Texte CTA final" value={content.cta.finalCtaText} onChange={(v) => setCtaField("finalCtaText", v)} />
            </div>
            <div className="md:col-span-2">
              <TextAreaField
                label="Phrase emotionnelle finale"
                value={content.cta.finalEmotionText}
                onChange={(v) => setCtaField("finalEmotionText", v)}
                rows={3}
              />
            </div>
            <TextField
              label="Label statut (ambiance)"
              value={content.statusMessages.statusLabel}
              onChange={(v) => setStatusMessageField("statusLabel", v)}
            />
            <TextField
              label="Message statut"
              value={content.statusMessages.statusMessage}
              onChange={(v) => setStatusMessageField("statusMessage", v)}
            />
            <div className="md:col-span-2">
              <TextAreaField
                label="Message highlight"
                value={content.statusMessages.highlightMessage}
                onChange={(v) => setStatusMessageField("highlightMessage", v)}
                rows={2}
              />
            </div>
          </div>
        )}

        {activeTab === "display" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(
              [
                ["showSocialProof", "Afficher la preuve sociale"],
                ["showTimeline", "Afficher la timeline"],
                ["showStaff", "Afficher le staff"],
                ["showFaq", "Afficher la FAQ"],
                ["showPartnerCommunities", "Afficher les communautes partenaires"],
                ["showTenfPartnershipBlock", "Afficher le bloc partenariat TENF"],
                ["showFinalCta", "Afficher le CTA final"],
              ] as [keyof UpaEventContent["displaySettings"], string][]
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                <input
                  type="checkbox"
                  checked={content.displaySettings[key]}
                  onChange={(e) => setDisplayField(key, e.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
        Donnees publiques exploitables ensuite via <code>/api/upa-event/content</code>.
      </div>
    </div>
  );
}
