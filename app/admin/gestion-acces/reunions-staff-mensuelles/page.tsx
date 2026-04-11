"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarPlus,
  Check,
  Copy,
  Eye,
  FileText,
  Loader2,
  Maximize2,
  Music,
  Pencil,
  Plus,
  Save,
  Scan,
  ScrollText,
  Trash2,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AdminHeader from "@/components/admin/AdminHeader";
import type {
  StaffMeetingDiscoursItem,
  StaffMeetingDiscoursSection,
  StaffMonthlyMeeting,
} from "@/lib/staff/monthlyMeetingTypes";
import { generateMeetingCrMarkdown } from "@/lib/staff/generateMeetingCrMarkdown";
import { extractMeetingPlainTextForExternal } from "@/lib/staff/extractMeetingPlainText";

const navLinks = [
  { href: "/admin/gestion-acces/accueil", label: "Dashboard administration" },
  { href: "/admin/gestion-acces", label: "Comptes administrateurs" },
  { href: "/admin/gestion-acces/dashboard", label: "Paramètres dashboard" },
  { href: "/admin/gestion-acces/permissions", label: "Permissions par section" },
  { href: "/admin/gestion-acces/reunions-staff-mensuelles", label: "Réunions mensuelles staff", active: true },
  { href: "/admin/gestion-acces/admin-avance", label: "Admin avancé (fondateurs)" },
];

function emptySection(): StaffMeetingDiscoursSection {
  return { id: `section-${crypto.randomUUID()}`, tabTitle: "", corps: "", conseil: "" };
}

function emptyDiscours(): StaffMeetingDiscoursItem {
  return {
    id: `discours-${crypto.randomUUID()}`,
    intervenant: "",
    titre: "",
    musiqueUrl: "",
    sections: [emptySection()],
  };
}

function audioUrlLooksPlayable(url: string): boolean {
  const t = (url || "").trim();
  if (!t) return false;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function formatFrDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map((n) => Number.parseInt(n, 10));
  if (!y || !m || !d) return isoDate;
  try {
    return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

function MeetingMdPreview({
  markdown,
  label,
  size = "sm",
}: {
  markdown: string;
  label?: string;
  size?: "sm" | "lg";
}) {
  const v = (markdown || "").trim();
  if (!v) {
    return <p className="text-xs text-gray-500">Rien à prévisualiser.</p>;
  }
  const proseClass =
    size === "lg"
      ? "prose prose-invert prose-lg max-w-none prose-p:leading-relaxed prose-headings:text-[#f0e6d2] prose-strong:text-white prose-blockquote:border-l-[#d4af37]/55 prose-blockquote:text-gray-200 prose-blockquote:italic prose-hr:border-white/20 prose-li:marker:text-[#d4af37]"
      : "prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-headings:text-[#f0e6d2] prose-strong:text-white prose-blockquote:border-l-[#d4af37]/55 prose-blockquote:text-gray-200 prose-blockquote:italic prose-hr:border-white/20 prose-li:marker:text-[#d4af37]";
  return (
    <div
      className={proseClass}
      style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
    >
      {label ? (
        <p className="!mb-2 !mt-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c9a962]">{label}</p>
      ) : null}
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{v}</ReactMarkdown>
    </div>
  );
}

export default function ReunionsStaffMensuellesPage() {
  const [meetings, setMeetings] = useState<StaffMonthlyMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [meetingDate, setMeetingDate] = useState("");
  const [title, setTitle] = useState("");
  const [discours, setDiscours] = useState<StaffMeetingDiscoursItem[]>([emptyDiscours()]);
  /** Index d’onglet actif par id de discours */
  const [sectionTabByDiscoursId, setSectionTabByDiscoursId] = useState<Record<string, number>>({});
  /** Index du discours affiché en modale plein écran (aperçu agrandi) */
  const [modalDiscoursIndex, setModalDiscoursIndex] = useState<number | null>(null);
  /** Markdown du compte-rendu auto ; ouverture modale si non null */
  const [crMarkdown, setCrMarkdown] = useState<string | null>(null);
  const [crCopied, setCrCopied] = useState(false);
  /** Texte brut concaténé (ChatGPT, etc.) */
  const [extractModalText, setExtractModalText] = useState<string | null>(null);
  const [extractCopied, setExtractCopied] = useState(false);
  /** Aperçu du CR déjà enregistré (lecture seule) */
  const [storedCrPreviewMarkdown, setStoredCrPreviewMarkdown] = useState<string | null>(null);
  const [compteRendu, setCompteRendu] = useState("");

  const isEditing = editingId !== null;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/staff/monthly-meetings", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur chargement");
      setMeetings(Array.isArray(data.meetings) ? data.meetings : []);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Erreur chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setMeetingDate("");
    setTitle("");
    setDiscours([emptyDiscours()]);
    setSectionTabByDiscoursId({});
    setFeedback("");
    setCrMarkdown(null);
    setCrCopied(false);
    setExtractModalText(null);
    setExtractCopied(false);
    setStoredCrPreviewMarkdown(null);
    setCompteRendu("");
  }

  function startNew() {
    resetForm();
    setDiscours([emptyDiscours()]);
  }

  function startEdit(m: StaffMonthlyMeeting) {
    setEditingId(m.id);
    setMeetingDate(m.meetingDate);
    setTitle(m.title);
    setDiscours(
      m.discours.length > 0
        ? m.discours.map((d) => ({
            ...d,
            musiqueUrl: d.musiqueUrl ?? "",
            sections: d.sections.map((s) => ({ ...s })),
          }))
        : [emptyDiscours()]
    );
    setSectionTabByDiscoursId({});
    setFeedback("");
    setCompteRendu(m.compteRendu ?? "");
  }

  function updateDiscoursRow(index: number, patch: Partial<StaffMeetingDiscoursItem>) {
    setDiscours((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function updateSection(discoursIndex: number, sectionIndex: number, patch: Partial<StaffMeetingDiscoursSection>) {
    setDiscours((prev) =>
      prev.map((row, i) => {
        if (i !== discoursIndex) return row;
        const sections = row.sections.map((s, j) => (j === sectionIndex ? { ...s, ...patch } : s));
        return { ...row, sections };
      })
    );
  }

  function addDiscoursRow() {
    const next = emptyDiscours();
    setDiscours((prev) => [...prev, next]);
    setSectionTabByDiscoursId((prev) => ({ ...prev, [next.id]: 0 }));
  }

  function removeDiscoursRow(index: number) {
    if (discours.length <= 1) return;
    const removedId = discours[index].id;
    setDiscours((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    setSectionTabByDiscoursId((tabs) => {
      const { [removedId]: _, ...rest } = tabs;
      return rest;
    });
  }

  function addSection(discoursIndex: number) {
    const row = discours[discoursIndex];
    if (!row) return;
    const discoursId = row.id;
    const newTabIdx = row.sections.length;
    const sec = emptySection();
    setDiscours((prev) =>
      prev.map((r, i) => (i === discoursIndex ? { ...r, sections: [...r.sections, sec] } : r))
    );
    setSectionTabByDiscoursId((prev) => ({ ...prev, [discoursId]: newTabIdx }));
  }

  function removeSection(discoursIndex: number, sectionIndex: number) {
    const row = discours[discoursIndex];
    if (!row || row.sections.length <= 1) return;
    const newSections = row.sections.filter((_, i) => i !== sectionIndex);
    const discoursId = row.id;
    setDiscours((prev) =>
      prev.map((r, i) => (i === discoursIndex ? { ...r, sections: newSections } : r))
    );
    setSectionTabByDiscoursId((p) => {
      const cur = p[discoursId] ?? 0;
      let n = cur;
      if (sectionIndex < cur) n = cur - 1;
      else if (sectionIndex === cur) n = Math.min(cur, newSections.length - 1);
      n = Math.max(0, Math.min(n, newSections.length - 1));
      return { ...p, [discoursId]: n };
    });
  }

  const payloadDiscours = useMemo(
    () =>
      discours.filter((d) => {
        if (d.intervenant.trim() || d.titre.trim()) return true;
        if ((d.musiqueUrl || "").trim()) return true;
        return d.sections.some((s) => s.tabTitle.trim() || s.corps.trim() || s.conseil.trim());
      }),
    [discours]
  );

  useEffect(() => {
    const locked =
      modalDiscoursIndex !== null ||
      crMarkdown !== null ||
      extractModalText !== null ||
      storedCrPreviewMarkdown !== null;
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (storedCrPreviewMarkdown !== null) {
        setStoredCrPreviewMarkdown(null);
        return;
      }
      if (extractModalText !== null) {
        setExtractModalText(null);
        setExtractCopied(false);
        return;
      }
      if (crMarkdown !== null) {
        setCrMarkdown(null);
        return;
      }
      setModalDiscoursIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [modalDiscoursIndex, crMarkdown, extractModalText, storedCrPreviewMarkdown]);

  function openCrFromForm() {
    setCrCopied(false);
    const md = generateMeetingCrMarkdown({
      meetingDate: meetingDate || "",
      title,
      discours,
    });
    if (!md.trim()) {
      setFeedback("Erreur : ajoute une date de réunion ou du contenu dans les discours pour générer un CR.");
      return;
    }
    setCrMarkdown(md);
  }

  function openCrFromMeeting(m: StaffMonthlyMeeting) {
    setCrCopied(false);
    const md = generateMeetingCrMarkdown({
      meetingDate: m.meetingDate,
      title: m.title,
      discours: m.discours,
    });
    if (!md.trim()) {
      setFeedback("Erreur : impossible de générer un CR (réunion vide).");
      return;
    }
    setCrMarkdown(md);
  }

  async function copyCrToClipboard() {
    if (!crMarkdown) return;
    try {
      await navigator.clipboard.writeText(crMarkdown);
      setCrCopied(true);
      window.setTimeout(() => setCrCopied(false), 2200);
    } catch {
      setFeedback("Erreur : impossible de copier (permission navigateur ou contexte non sécurisé).");
    }
  }

  function openExtractFromForm() {
    setExtractCopied(false);
    const text = extractMeetingPlainTextForExternal({
      meetingDate: meetingDate || "",
      title,
      discours,
    });
    if (!text.trim()) {
      setFeedback("Erreur : rien à extraire (ajoute du contenu dans les discours).");
      return;
    }
    setExtractModalText(text);
  }

  function openExtractFromMeeting(m: StaffMonthlyMeeting) {
    setExtractCopied(false);
    const text = extractMeetingPlainTextForExternal({
      meetingDate: m.meetingDate,
      title: m.title,
      discours: m.discours,
    });
    if (!text.trim()) {
      setFeedback("Erreur : aucun texte à extraire pour cette réunion.");
      return;
    }
    setExtractModalText(text);
  }

  async function copyExtractToClipboard() {
    if (!extractModalText) return;
    try {
      await navigator.clipboard.writeText(extractModalText);
      setExtractCopied(true);
      window.setTimeout(() => setExtractCopied(false), 2200);
    } catch {
      setFeedback("Erreur : impossible de copier le texte extrait.");
    }
  }

  async function handleSubmit() {
    if (!meetingDate) {
      setFeedback("Choisis une date de réunion.");
      return;
    }
    try {
      setSaving(true);
      setFeedback("");
      const url = isEditing
        ? `/api/admin/staff/monthly-meetings/${encodeURIComponent(editingId!)}`
        : "/api/admin/staff/monthly-meetings";
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingDate,
          title,
          discours: payloadDiscours,
          compteRendu,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur enregistrement");
      await load();
      resetForm();
      setFeedback(isEditing ? "Réunion mise à jour." : "Réunion créée.");
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Erreur enregistrement");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer cette réunion et tous ses discours ?")) return;
    try {
      setSaving(true);
      setFeedback("");
      const res = await fetch(`/api/admin/staff/monthly-meetings/${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur suppression");
      if (editingId === id) resetForm();
      await load();
      setFeedback("Réunion supprimée.");
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Erreur suppression");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <AdminHeader title="Réunions mensuelles staff" navLinks={navLinks} />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8">
        {feedback ? (
          <p
            className={`rounded-xl border px-4 py-3 text-sm ${
              feedback.includes("Erreur")
                ? "border-red-500/40 bg-red-500/10 text-red-100"
                : "border-emerald-500/35 bg-emerald-500/10 text-emerald-100"
            }`}
          >
            {feedback}
          </p>
        ) : null}

        <section
          className="rounded-2xl border p-5 md:p-6"
          style={{ borderColor: "rgba(212,175,55,0.28)", background: "rgba(20,22,32,0.92)" }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <CalendarPlus className="h-5 w-5 text-[#d4af37]" />
                {isEditing ? "Modifier la réunion" : "Nouvelle réunion"}
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Chaque discours peut être découpé en <strong className="text-gray-300">plusieurs onglets</strong> : titre
                d’onglet, <strong className="text-gray-300">corps en Markdown</strong> (titres <code className="text-[#d4af37]">#</code>,{" "}
                <code className="text-[#d4af37]">&gt;</code> citations, <code className="text-[#d4af37]">---</code> séparateurs, listes{" "}
                <code className="text-[#d4af37]">*</code>, <code className="text-[#d4af37]">**gras**</code>, emojis…), puis un bloc{" "}
                <strong className="text-gray-300">Conseil</strong> (ton, jeu, posture) aussi en Markdown. Tu peux ajouter une{" "}
                <strong className="text-gray-300">URL audio</strong> et ouvrir le discours en{" "}
                <strong className="text-gray-300">grande modale</strong> pour la lecture.{" "}
                <strong className="text-gray-300">Extraire tout le texte</strong> concatène date, titres et Markdown des
                discours pour le coller dans un outil externe ; tu peux ensuite coller le CR généré dans le champ{" "}
                <strong className="text-gray-300">Compte-rendu</strong> et enregistrer. Le bouton{" "}
                <strong className="text-gray-300">Générer le CR</strong> produit un autre Markdown (extraits structurés,
                sans IA) — utile pour les présents et les absents.
              </p>
            </div>
            {isEditing ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-gray-200 hover:bg-white/5"
              >
                <X className="h-4 w-4" />
                Annuler l’édition
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-sm text-gray-300">
              <span className="mb-1 block font-medium text-white">Date de la réunion</span>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm text-gray-300">
              <span className="mb-1 block font-medium text-white">Titre (optionnel)</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Réunion de mars — points RH"
                className="mt-1 w-full rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2 text-white placeholder:text-gray-600"
              />
            </label>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#e6c980]">Discours</h3>
              <button
                type="button"
                onClick={addDiscoursRow}
                className="inline-flex items-center gap-1 rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1.5 text-xs font-semibold text-[#f4db97] hover:bg-[#d4af37]/20"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter un discours
              </button>
            </div>

            {discours.map((row, dIndex) => {
              const rawTab = sectionTabByDiscoursId[row.id] ?? 0;
              const sIdx = Math.max(0, Math.min(rawTab, row.sections.length - 1));
              const sec = row.sections[sIdx];

              return (
                <div key={row.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Discours {dIndex + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setModalDiscoursIndex(dIndex)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#d4af37]/35 bg-[#d4af37]/10 px-2.5 py-1 text-xs font-medium text-[#f4db97] hover:bg-[#d4af37]/20"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                        Agrandir le discours
                      </button>
                      <button
                        type="button"
                        onClick={() => removeDiscoursRow(dIndex)}
                        disabled={discours.length <= 1}
                        className="rounded p-1 text-gray-500 hover:bg-red-500/15 hover:text-red-300 disabled:opacity-30"
                        aria-label="Retirer ce discours"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      type="text"
                      value={row.intervenant}
                      onChange={(e) => updateDiscoursRow(dIndex, { intervenant: e.target.value })}
                      placeholder="Intervenant"
                      className="rounded-lg border border-white/12 bg-[#0f1118] px-3 py-2 text-sm text-white placeholder:text-gray-600"
                    />
                    <input
                      type="text"
                      value={row.titre}
                      onChange={(e) => updateDiscoursRow(dIndex, { titre: e.target.value })}
                      placeholder="Titre global du discours (optionnel)"
                      className="rounded-lg border border-white/12 bg-[#0f1118] px-3 py-2 text-sm text-white placeholder:text-gray-600"
                    />
                  </div>

                  <div className="mt-4 rounded-xl border border-white/10 bg-[#0a0c12] p-4">
                    <label className="block text-xs text-gray-400">
                      <span className="mb-1 flex items-center gap-1.5 font-medium text-gray-300">
                        <Music className="h-3.5 w-3.5 text-[#d4af37]" />
                        Musique / ambiance (URL directe vers un fichier audio)
                      </span>
                      <input
                        type="url"
                        value={row.musiqueUrl ?? ""}
                        onChange={(e) => updateDiscoursRow(dIndex, { musiqueUrl: e.target.value })}
                        placeholder="https://exemple.com/fichier.mp3"
                        className="mt-1 w-full rounded-lg border border-white/12 bg-[#0f1118] px-3 py-2 text-sm text-white placeholder:text-gray-600"
                      />
                    </label>
                    {audioUrlLooksPlayable(row.musiqueUrl || "") ? (
                      <audio
                        key={row.musiqueUrl}
                        controls
                        preload="metadata"
                        src={(row.musiqueUrl || "").trim()}
                        className="mt-3 w-full max-w-xl rounded-lg border border-white/10 bg-black/40"
                      >
                        Lecture audio non supportée par le navigateur.
                      </audio>
                    ) : (row.musiqueUrl || "").trim() ? (
                      <p className="mt-2 text-xs text-amber-200/90">
                        URL non reconnue (http/https attendu). Corrige l’adresse pour afficher le lecteur.
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-gray-600">
                        Colle une URL vers un fichier audio hébergé (mp3, etc.). Le navigateur doit pouvoir y accéder
                        (CORS / HTTPS selon l’hébergeur).
                      </p>
                    )}
                  </div>

                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400">Parties (onglets)</span>
                      <div className="flex flex-wrap gap-1">
                        {row.sections.map((s, si) => {
                          const label = s.tabTitle.trim() || `Partie ${si + 1}`;
                          const active = si === sIdx;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              role="tab"
                              aria-selected={active}
                              onClick={() => setSectionTabByDiscoursId((p) => ({ ...p, [row.id]: si }))}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                                active
                                  ? "border-[#d4af37]/50 bg-[#d4af37]/15 text-[#f4db97]"
                                  : "border-white/10 bg-[#0f1118] text-gray-400 hover:border-white/20"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => addSection(dIndex)}
                          className="inline-flex items-center gap-0.5 rounded-lg border border-dashed border-white/20 px-2 py-1 text-xs text-gray-400 hover:border-[#d4af37]/40 hover:text-[#d4af37]"
                        >
                          <Plus className="h-3 w-3" /> Onglet
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <label className="block flex-1 text-xs text-gray-400">
                            <span className="mb-1 block font-medium text-gray-300">Titre de l’onglet</span>
                            <input
                              type="text"
                              value={sec.tabTitle}
                              onChange={(e) => updateSection(dIndex, sIdx, { tabTitle: e.target.value })}
                              placeholder="ex. 1. Introduction – discours détaillé"
                              className="mt-1 w-full rounded-lg border border-white/12 bg-[#0f1118] px-3 py-2 text-sm text-white placeholder:text-gray-600"
                            />
                          </label>
                          {row.sections.length > 1 ? (
                            <button
                              type="button"
                              title="Supprimer cet onglet"
                              onClick={() => removeSection(dIndex, sIdx)}
                              className="mt-6 shrink-0 rounded p-2 text-gray-500 hover:bg-red-500/15 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                        <label className="block text-xs text-gray-400">
                          <span className="mb-1 flex items-center gap-1 font-medium text-gray-300">
                            <Eye className="h-3.5 w-3.5" /> Corps (Markdown)
                          </span>
                          <textarea
                            value={sec.corps}
                            onChange={(e) => updateSection(dIndex, sIdx, { corps: e.target.value })}
                            placeholder={`# Titre\n\n> citation\n\n---\n\n* puce`}
                            rows={12}
                            spellCheck={false}
                            className="mt-1 w-full rounded-lg border border-white/12 bg-[#0f1118] px-3 py-2 font-mono text-sm text-gray-100 placeholder:text-gray-600"
                          />
                        </label>
                        <label className="block text-xs text-gray-400">
                          <span className="mb-1 flex items-center gap-1 font-medium text-[#c9a962]">
                            <BookOpen className="h-3.5 w-3.5" /> Conseil (Markdown, optionnel)
                          </span>
                          <textarea
                            value={sec.conseil}
                            onChange={(e) => updateSection(dIndex, sIdx, { conseil: e.target.value })}
                            placeholder="Ton, posture, petit conseil pour l’intervenant…"
                            rows={5}
                            spellCheck={false}
                            className="mt-1 w-full rounded-lg border border-[#d4af37]/20 bg-[#0f1118] px-3 py-2 font-mono text-sm text-gray-100 placeholder:text-gray-600"
                          />
                        </label>
                      </div>

                      <div className="space-y-4 rounded-xl border border-white/10 bg-[#0a0c12] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">Aperçu</p>
                        <div>
                          <MeetingMdPreview markdown={sec.corps} label="Corps" />
                        </div>
                        {sec.conseil.trim() ? (
                          <div className="rounded-lg border border-[#d4af37]/25 bg-[#d4af37]/5 p-3">
                            <MeetingMdPreview markdown={sec.conseil} label="Conseil" />
                          </div>
                        ) : (
                          <p className="text-xs text-gray-600">Aucun conseil sur cet onglet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-xl border border-white/10 bg-[#0a0c12] p-4 md:p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#e6c980]">
              Compte-rendu (Markdown, optionnel)
            </h3>
            <p className="mt-2 text-xs text-gray-500">
              Après extraction, colle ici le compte-rendu produit ailleurs (IA, document, etc.), puis enregistre la
              réunion.
            </p>
            <textarea
              value={compteRendu}
              onChange={(e) => setCompteRendu(e.target.value)}
              rows={10}
              spellCheck={false}
              placeholder={"# Compte-rendu de la réunion\n\n…"}
              className="mt-3 w-full rounded-lg border border-white/12 bg-[#0f1118] px-3 py-2 font-mono text-sm text-gray-100 placeholder:text-gray-600"
            />
            {compteRendu.trim() ? (
              <div className="mt-4 rounded-lg border border-white/10 bg-black/25 p-3">
                <MeetingMdPreview markdown={compteRendu} label="Aperçu" />
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#201b12] disabled:opacity-60"
              style={{ backgroundColor: "rgba(212,175,55,0.95)" }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEditing ? "Enregistrer les modifications" : "Créer la réunion"}
            </button>
            <button
              type="button"
              onClick={openCrFromForm}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/45 bg-[#d4af37]/10 px-4 py-2.5 text-sm font-medium text-[#f4db97] hover:bg-[#d4af37]/18"
            >
              <FileText className="h-4 w-4" />
              Générer le CR
            </button>
            <button
              type="button"
              onClick={openExtractFromForm}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-100 hover:bg-white/10"
            >
              <Scan className="h-4 w-4" />
              Extraire tout le texte
            </button>
            <button
              type="button"
              onClick={startNew}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5"
            >
              <Plus className="h-4 w-4" />
              Nouvelle réunion (formulaire vierge)
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#141824] p-5 md:px-6">
          <h2 className="text-lg font-semibold text-white">Réunions enregistrées</h2>
          <p className="mt-1 text-sm text-gray-400">{meetings.length} réunion(s)</p>

          {meetings.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">Aucune réunion pour le moment.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {meetings.map((m) => {
                const parts = m.discours.reduce((n, d) => n + d.sections.length, 0);
                return (
                  <li
                    key={m.id}
                    className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0f1118] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">{formatFrDate(m.meetingDate)}</p>
                      {m.title ? <p className="text-sm text-[#d4af37]">{m.title}</p> : null}
                      <p className="mt-1 text-xs text-gray-500">
                        {m.discours.length} discours · {parts} partie(s) / onglets
                        {(m.compteRendu ?? "").trim() ? (
                          <span className="text-emerald-400/90"> · CR enregistré</span>
                        ) : null}
                        {" · modifié le "}
                        {new Date(m.updatedAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openCrFromMeeting(m)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1.5 text-sm font-medium text-[#f4db97] hover:bg-[#d4af37]/20"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        CR
                      </button>
                      <button
                        type="button"
                        onClick={() => openExtractFromMeeting(m)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/18 bg-white/5 px-3 py-1.5 text-sm font-medium text-gray-100 hover:bg-white/10"
                      >
                        <Scan className="h-3.5 w-3.5" />
                        Extraire
                      </button>
                      {(m.compteRendu ?? "").trim() ? (
                        <button
                          type="button"
                          onClick={() => setStoredCrPreviewMarkdown(m.compteRendu ?? "")}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-100 hover:bg-emerald-500/15"
                        >
                          <ScrollText className="h-3.5 w-3.5" />
                          Lire le CR
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => startEdit(m)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-gray-200 hover:bg-white/5"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(m.id)}
                        disabled={saving}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {modalDiscoursIndex !== null && discours[modalDiscoursIndex] ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="discours-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setModalDiscoursIndex(null)}
            aria-label="Fermer la fenêtre"
          />
          <div
            className="relative z-[81] flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
            style={{ borderColor: "rgba(212,175,55,0.45)", background: "rgba(14,16,24,0.98)" }}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div className="min-w-0 pr-2">
                <h2 id="discours-modal-title" className="truncate text-xl font-semibold text-white sm:text-2xl">
                  {discours[modalDiscoursIndex].titre.trim() || `Discours ${modalDiscoursIndex + 1}`}
                </h2>
                {discours[modalDiscoursIndex].intervenant.trim() ? (
                  <p className="mt-1 text-sm text-[#d4af37]">{discours[modalDiscoursIndex].intervenant}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setModalDiscoursIndex(null)}
                className="shrink-0 rounded-lg border border-white/15 p-2 text-gray-300 hover:bg-white/10"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {audioUrlLooksPlayable(discours[modalDiscoursIndex].musiqueUrl || "") ? (
                <div className="mb-8 rounded-xl border border-[#d4af37]/25 bg-black/35 p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c9a962]">Lecteur audio</p>
                  <audio
                    controls
                    preload="metadata"
                    src={(discours[modalDiscoursIndex].musiqueUrl || "").trim()}
                    className="w-full"
                  >
                    Lecture audio non supportée.
                  </audio>
                </div>
              ) : null}
              {discours[modalDiscoursIndex].sections.map((sec, si) => (
                <article key={sec.id} className={si > 0 ? "mt-10 border-t border-white/10 pt-10" : ""}>
                  <h3 className="text-lg font-semibold text-[#f0e6d2] sm:text-xl">
                    {sec.tabTitle.trim() || `Partie ${si + 1}`}
                  </h3>
                  <div className="mt-4">
                    <MeetingMdPreview markdown={sec.corps} label="Corps" size="lg" />
                  </div>
                  {sec.conseil.trim() ? (
                    <div className="mt-8 rounded-xl border border-[#d4af37]/25 bg-[#d4af37]/5 p-4 sm:p-5">
                      <MeetingMdPreview markdown={sec.conseil} label="Conseil" size="lg" />
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {crMarkdown ? (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cr-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => {
              setCrMarkdown(null);
              setCrCopied(false);
            }}
            aria-label="Fermer le compte-rendu"
          />
          <div
            className="relative z-[86] flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
            style={{ borderColor: "rgba(212,175,55,0.45)", background: "rgba(14,16,24,0.98)" }}
          >
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <h2 id="cr-modal-title" className="text-lg font-semibold text-white sm:text-xl">
                  Compte-rendu généré
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  Extraction structurée des textes (titres, listes, extraits) — utile pour les présents comme pour les
                  absents. Ce n’est pas une analyse par intelligence artificielle.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void copyCrToClipboard()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4af37]/45 bg-[#d4af37]/12 px-3 py-2 text-sm font-medium text-[#f4db97] hover:bg-[#d4af37]/22"
                >
                  {crCopied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                  {crCopied ? "Copié" : "Copier le Markdown"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCrMarkdown(null);
                    setCrCopied(false);
                  }}
                  className="rounded-lg border border-white/15 p-2 text-gray-300 hover:bg-white/10"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div className="rounded-xl border border-white/10 bg-[#0a0c12] p-4 sm:p-5">
                <MeetingMdPreview markdown={crMarkdown} size="lg" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {extractModalText ? (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="extract-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => {
              setExtractModalText(null);
              setExtractCopied(false);
            }}
            aria-label="Fermer l’extraction"
          />
          <div
            className="relative z-[86] flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
            style={{ borderColor: "rgba(212,175,55,0.45)", background: "rgba(14,16,24,0.98)" }}
          >
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <h2 id="extract-modal-title" className="text-lg font-semibold text-white sm:text-xl">
                  Texte extrait (copier ailleurs)
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  Bloc unique : date, titre, puis chaque discours (Markdown conservé). Colle-le dans ton outil pour
                  générer un CR, puis reviens coller le résultat dans le champ Compte-rendu.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void copyExtractToClipboard()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4af37]/45 bg-[#d4af37]/12 px-3 py-2 text-sm font-medium text-[#f4db97] hover:bg-[#d4af37]/22"
                >
                  {extractCopied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                  {extractCopied ? "Copié" : "Copier tout"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExtractModalText(null);
                    setExtractCopied(false);
                  }}
                  className="rounded-lg border border-white/15 p-2 text-gray-300 hover:bg-white/10"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <textarea
                readOnly
                value={extractModalText}
                rows={22}
                spellCheck={false}
                className="h-[min(60vh,520px)] w-full resize-y rounded-xl border border-white/12 bg-[#0a0c12] px-3 py-3 font-mono text-xs leading-relaxed text-gray-100 sm:text-sm"
              />
            </div>
          </div>
        </div>
      ) : null}

      {storedCrPreviewMarkdown ? (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stored-cr-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => setStoredCrPreviewMarkdown(null)}
            aria-label="Fermer le compte-rendu enregistré"
          />
          <div
            className="relative z-[86] flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
            style={{ borderColor: "rgba(16,185,129,0.35)", background: "rgba(14,16,24,0.98)" }}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <h2 id="stored-cr-modal-title" className="text-lg font-semibold text-white sm:text-xl">
                  Compte-rendu enregistré
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  Contenu sauvegardé avec la réunion. Pour le modifier, ouvre <strong className="text-gray-300">Modifier</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStoredCrPreviewMarkdown(null)}
                className="rounded-lg border border-white/15 p-2 text-gray-300 hover:bg-white/10"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div className="rounded-xl border border-white/10 bg-[#0a0c12] p-4 sm:p-5">
                <MeetingMdPreview markdown={storedCrPreviewMarkdown} size="lg" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
