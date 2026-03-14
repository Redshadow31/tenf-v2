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
  UpaEventTimelineItem,
  UpaRegistrationStatus,
  UpaTimelineStatus,
} from "@/lib/upaEvent/types";

type TabKey =
  | "general"
  | "proof"
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
  { key: "proof", label: "Participants" },
  { key: "staff", label: "Staff UPA" },
];

export default function AdminUpaEventPage() {
  const [content, setContent] = useState<UpaEventContent>(createDefaultContent());
  const [activeTab, setActiveTab] = useState<TabKey>("proof");
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
          totalRegistered: content.socialProof.totalRegistered,
          staff: content.staff,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Erreur sauvegarde");
      setContent(data.content as UpaEventContent);
      setFeedback("Participants et staff UPA enregistres avec succes.");
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/events" className="text-sm mb-2 inline-block" style={{ color: "var(--color-text-secondary)" }}>
            ← Retour au hub événements
          </Link>
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
            Gestion UPA Event
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Edition ciblee: compteur participants et equipe staff (haut staff + moderateurs).
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--color-text-secondary)" }}>
            Derniere mise a jour: {lastUpdateLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveContent}
            disabled={saving}
            className="rounded-lg px-4 py-2 font-semibold disabled:opacity-60"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
            }}
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
          {feedback}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="rounded-lg border px-3 py-2 text-sm font-medium"
            style={{
              borderColor: activeTab === tab.key ? "var(--color-primary)" : "var(--color-border)",
              backgroundColor: activeTab === tab.key ? "var(--color-primary)" : "var(--color-card)",
              color: activeTab === tab.key ? "var(--color-primary-foreground)" : "var(--color-text)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border p-4 md:p-6 space-y-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        {activeTab === "general" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="Titre principal" value={content.general.title} onChange={(v) => setGeneralField("title", v)} />
            <TextField label="Sous-titre" value={content.general.subtitle} onChange={(v) => setGeneralField("subtitle", v)} />
            <TextField label="Slogan" value={content.general.slogan} onChange={(v) => setGeneralField("slogan", v)} />
            <TextField
              label="Badge partenariat"
              value={content.general.partnershipBadge}
              onChange={(v) => setGeneralField("partnershipBadge", v)}
            />
            <TextField label="Date debut (YYYY-MM-DD)" value={content.general.startDate} onChange={(v) => setGeneralField("startDate", v)} />
            <TextField label="Date fin (YYYY-MM-DD)" value={content.general.endDate} onChange={(v) => setGeneralField("endDate", v)} />
            <TextField label="Cause soutenue" value={content.general.causeSupported} onChange={(v) => setGeneralField("causeSupported", v)} />
            <label className="block">
              <span className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                Statut des inscriptions
              </span>
              <select
                value={content.general.registrationStatus}
                onChange={(e) => setGeneralField("registrationStatus", e.target.value as UpaRegistrationStatus)}
                className="w-full rounded-lg border px-3 py-2"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-card)",
                  color: "var(--color-text)",
                }}
              >
                <option value="open">Ouvert</option>
                <option value="soon">Bientot</option>
                <option value="closed">Ferme</option>
                <option value="ended">Termine</option>
              </select>
            </label>
            <div className="md:col-span-2">
              <TextAreaField label="Texte hero" value={content.general.heroText} onChange={(v) => setGeneralField("heroText", v)} />
            </div>
            <div className="md:col-span-2">
              <TextAreaField
                label="Message d'ambiance"
                value={content.general.moodMessage}
                onChange={(v) => setGeneralField("moodMessage", v)}
                rows={3}
              />
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
