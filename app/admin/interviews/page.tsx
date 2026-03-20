"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Plus, RefreshCw, ShieldCheck, Sparkles, X } from "lucide-react";

type InterviewGroupType = "staff" | "member";
type ListGroupFilter = "all" | InterviewGroupType;
type ListStatusFilter = "all" | "published" | "draft";
type InterviewModalMode = "create" | "edit";
type InterviewModalTab = "infos" | "staff" | "publication" | "preview";

type InterviewItem = {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  groupType: InterviewGroupType;
  memberTwitchLogin: string;
  memberDisplayName: string;
  memberRole?: string;
  isPublished: boolean;
  publishedAt?: string;
  sortOrder: number;
  featured: boolean;
  thumbnailOverride?: string;
  interviewDate?: string;
  durationText?: string;
  updatedAt: string;
};

type SearchMemberItem = {
  displayName: string;
  twitchLogin: string;
  role?: string;
  isActive?: boolean;
};

type FormState = {
  id?: string;
  title: string;
  youtubeUrl: string;
  groupType: InterviewGroupType;
  memberTwitchLogin: string;
  memberDisplayName: string;
  memberRole?: string;
  isPublished: boolean;
  sortOrder: number;
  featured: boolean;
  thumbnailOverride: string;
  interviewDate: string;
  durationText: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  youtubeUrl: "",
  groupType: "member",
  memberTwitchLogin: "",
  memberDisplayName: "",
  memberRole: "",
  isPublished: false,
  sortOrder: 100,
  featured: false,
  thumbnailOverride: "",
  interviewDate: "",
  durationText: "",
};

function toForm(item: InterviewItem): FormState {
  return {
    id: item.id,
    title: item.title,
    youtubeUrl: item.youtubeUrl,
    groupType: item.groupType,
    memberTwitchLogin: item.memberTwitchLogin,
    memberDisplayName: item.memberDisplayName,
    memberRole: item.memberRole || "",
    isPublished: item.isPublished,
    sortOrder: item.sortOrder,
    featured: item.featured,
    thumbnailOverride: item.thumbnailOverride || "",
    interviewDate: item.interviewDate || "",
    durationText: item.durationText || "",
  };
}

function groupLabel(groupType: InterviewGroupType): string {
  return groupType === "staff" ? "Presentation staff" : "Interview membre";
}

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";
const inputClass =
  "w-full rounded-xl border border-[#353a50] bg-[#0f1424] px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-300/45";

export default function AdminInterviewsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<SearchMemberItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<InterviewModalMode>("create");
  const [modalTab, setModalTab] = useState<InterviewModalTab>("infos");

  const [listQuery, setListQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<ListGroupFilter>("all");
  const [statusFilter, setStatusFilter] = useState<ListStatusFilter>("all");

  async function loadInterviews() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/interviews", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de charger les interviews.");
      }
      setInterviews(Array.isArray(payload?.interviews) ? payload.interviews : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInterviews();
  }, []);

  useEffect(() => {
    const query = memberQuery.trim();
    if (query.length < 2) {
      setMemberResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/members/search?q=${encodeURIComponent(query)}&includeInactive=true`,
          { cache: "no-store" }
        );
        const payload = await response.json();
        if (!response.ok) return;
        setMemberResults(Array.isArray(payload?.members) ? payload.members : []);
      } catch {
        setMemberResults([]);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [memberQuery]);

  const filteredInterviews = useMemo(() => {
    const normalized = listQuery.trim().toLowerCase();
    return interviews.filter((item) => {
      if (groupFilter !== "all" && item.groupType !== groupFilter) return false;
      if (statusFilter === "published" && !item.isPublished) return false;
      if (statusFilter === "draft" && item.isPublished) return false;
      if (!normalized) return true;
      const haystack =
        `${item.title} ${item.memberDisplayName} ${item.memberTwitchLogin} ${item.memberRole || ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [groupFilter, interviews, listQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = interviews.length;
    const published = interviews.filter((item) => item.isPublished).length;
    const staff = interviews.filter((item) => item.groupType === "staff").length;
    const members = interviews.filter((item) => item.groupType === "member").length;
    return { total, published, draft: total - published, staff, members };
  }, [interviews]);

  const staffInterviews = useMemo(
    () => filteredInterviews.filter((item) => item.groupType === "staff"),
    [filteredInterviews]
  );
  const memberInterviews = useMemo(
    () => filteredInterviews.filter((item) => item.groupType === "member"),
    [filteredInterviews]
  );

  function resetForm() {
    setForm(EMPTY_FORM);
    setMemberQuery("");
    setMemberResults([]);
  }

  function openCreateModal(groupType: InterviewGroupType = "member") {
    setModalMode("create");
    resetForm();
    setForm((prev) => ({ ...prev, groupType }));
    setModalTab("infos");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
  }

  function startEdit(item: InterviewItem) {
    setModalMode("edit");
    setForm(toForm(item));
    setMemberQuery(item.memberDisplayName);
    setMemberResults([]);
    setModalTab("infos");
    setModalOpen(true);
  }

  function selectMember(member: SearchMemberItem) {
    setForm((prev) => ({
      ...prev,
      memberTwitchLogin: member.twitchLogin.toLowerCase(),
      memberDisplayName: member.displayName,
      memberRole: member.role || "",
    }));
    setMemberQuery(member.displayName);
    setMemberResults([]);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const method = form.id ? "PUT" : "POST";
      const response = await fetch("/api/admin/interviews", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Erreur de sauvegarde.");
      }

      await loadInterviews();
      resetForm();
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  async function removeInterview(id: string) {
    if (!window.confirm("Supprimer cette interview ?")) return;
    setError(null);
    try {
      const response = await fetch(`/api/admin/interviews?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Suppression impossible.");
      }
      await loadInterviews();
      if (form.id === id) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau.");
    }
  }

  async function togglePublish(item: InterviewItem) {
    setError(null);
    try {
      const response = await fetch("/api/admin/interviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isPublished: !item.isPublished }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Mise à jour impossible.");
      }
      await loadInterviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau.");
    }
  }

  return (
    <div className="space-y-6 text-white">
      <section className={`${glassCardClass} p-5 md:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Admin interviews</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Pilotage des interviews TENF
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Cette page centralise la gestion éditoriale des interviews YouTube: attribution de l’interviewé, publication,
              tri et mise en avant. L’ajout se fait maintenant via un modal multi-onglets.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => openCreateModal("member")} className={subtleButtonClass}>
              <Plus className="h-4 w-4" />
              Ajouter interview membre
            </button>
            <button type="button" onClick={() => openCreateModal("staff")} className={subtleButtonClass}>
              <Plus className="h-4 w-4" />
              Ajouter presentation staff
            </button>
            <button type="button" onClick={() => void loadInterviews()} className={subtleButtonClass}>
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
            <Link href="/interviews?tab=staff-presentation" className={subtleButtonClass}>
              Voir présentation staff (public)
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className={`${sectionCardClass} p-4`}>
        <h2 className="text-base font-semibold text-slate-100">Explication de la page</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
          <p className="rounded-lg border border-indigo-300/30 bg-indigo-300/10 px-3 py-2 text-indigo-100">
            1. Ajouter les interviews via le modal pour structurer les données et éviter les oublis.
          </p>
          <p className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-cyan-100">
            2. Utiliser l’onglet “Présentation du staff” pour standardiser le format des contenus staff.
          </p>
          <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-amber-100">
            3. Valider publication + mise en avant seulement après vérification du rendu final.
          </p>
        </div>
        <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-xs text-emerald-100">
          <ShieldCheck className="h-3.5 w-3.5" />
          Règle éditoriale: chaque interview staff doit indiquer un angle clair et une durée annoncée.
        </p>
      </section>

      {error ? <section className="rounded-2xl border border-rose-400/35 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</section> : null}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total interviews" value={stats.total} />
        <StatCard label="Publiées" value={stats.published} />
        <StatCard label="Brouillons" value={stats.draft} />
        <StatCard label="Interviews staff" value={stats.staff} />
        <StatCard label="Interviews membres" value={stats.members} />
      </section>

      <section className={`${sectionCardClass} p-5`}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-lg font-semibold text-slate-100">Gestion des contenus video</h2>
          <input value={listQuery} onChange={(event) => setListQuery(event.target.value)} placeholder="Filtrer titre / membre..." className={`${inputClass} w-56`} />
          <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value as ListGroupFilter)} className={`${inputClass} w-40`}>
            <option value="all">Tous groupes</option>
            <option value="staff">Staff</option>
            <option value="member">Membres</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ListStatusFilter)} className={`${inputClass} w-40`}>
            <option value="all">Tous statuts</option>
            <option value="published">Publiées</option>
            <option value="draft">Brouillons</option>
          </select>
        </div>
        <p className="mb-3 text-xs text-slate-400">
          {filteredInterviews.length} résultat{filteredInterviews.length > 1 ? "s" : ""}
        </p>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-[#353a50] bg-[#121623]/70 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-100">Element 1 - Presentations staff</p>
              <span className="rounded-full border border-blue-300/35 bg-blue-300/10 px-2 py-0.5 text-xs text-blue-100">
                {staffInterviews.length}
              </span>
            </div>
            <InterviewList loading={loading} items={staffInterviews} onEdit={startEdit} onDelete={removeInterview} onTogglePublish={togglePublish} />
          </div>
          <div className="rounded-xl border border-[#353a50] bg-[#121623]/70 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-100">Element 2 - Interviews membres</p>
              <span className="rounded-full border border-emerald-300/35 bg-emerald-300/10 px-2 py-0.5 text-xs text-emerald-100">
                {memberInterviews.length}
              </span>
            </div>
            <InterviewList loading={loading} items={memberInterviews} onEdit={startEdit} onDelete={removeInterview} onTogglePublish={togglePublish} />
          </div>
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <form onSubmit={submitForm} className="w-full max-w-4xl rounded-2xl border border-indigo-300/25 bg-[#0f1527] shadow-[0_25px_70px_rgba(2,6,23,0.7)]">
            <div className="flex items-start justify-between gap-3 border-b border-[#2f3244] px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-indigo-200/80">Interviews TENF</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-100">
                  {modalMode === "create"
                    ? form.groupType === "staff"
                      ? "Ajouter une presentation du staff"
                      : "Ajouter une interview membre"
                    : "Modifier le contenu"}
                </h3>
              </div>
              <button type="button" onClick={closeModal} disabled={saving} className="rounded-lg border border-slate-600/60 bg-slate-800/70 p-2 text-slate-200 transition hover:bg-slate-700 disabled:opacity-60">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-[#2f3244] px-5 py-3">
              <div className="inline-flex rounded-xl border border-indigo-300/20 bg-[#11192d] p-1">
                {[
                  { id: "infos", label: "Informations" },
                  { id: "staff", label: "Présentation du staff" },
                  { id: "publication", label: "Publication" },
                  { id: "preview", label: "Aperçu" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setModalTab(tab.id as InterviewModalTab)}
                    className={`rounded-lg px-3 py-1.5 text-sm transition ${
                      modalTab === tab.id ? "bg-indigo-500/30 text-indigo-100" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 px-5 py-4">
              {modalTab === "infos" ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormLabel label="Titre">
                    <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className={inputClass} required />
                  </FormLabel>
                  <FormLabel label="Lien YouTube">
                    <input value={form.youtubeUrl} onChange={(event) => setForm((prev) => ({ ...prev, youtubeUrl: event.target.value }))} placeholder="https://www.youtube.com/watch?v=..." className={inputClass} required />
                  </FormLabel>
                  <div>
                    <span className="mb-1 block text-sm text-slate-300">Type de contenu</span>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, groupType: "staff" }))}
                        className={`rounded-xl border px-3 py-2 text-sm transition ${
                          form.groupType === "staff"
                            ? "border-blue-300/50 bg-blue-300/15 text-blue-100"
                            : "border-[#353a50] bg-[#121623]/80 text-slate-300 hover:border-blue-300/35"
                        }`}
                      >
                        Presentation du staff
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, groupType: "member" }))}
                        className={`rounded-xl border px-3 py-2 text-sm transition ${
                          form.groupType === "member"
                            ? "border-emerald-300/50 bg-emerald-300/15 text-emerald-100"
                            : "border-[#353a50] bg-[#121623]/80 text-slate-300 hover:border-emerald-300/35"
                        }`}
                      >
                        Interview membre
                      </button>
                    </div>
                  </div>
                  <FormLabel label="Ordre d'affichage">
                    <input
                      type="number"
                      min={0}
                      value={form.sortOrder}
                      onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: Number.parseInt(event.target.value || "0", 10) }))}
                      className={inputClass}
                    />
                  </FormLabel>
                  <div className="md:col-span-2">
                    <FormLabel label="Recherche membre/interviewé">
                      <input value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} placeholder="Tape un pseudo (min. 2 caractères)" className={inputClass} required={!form.memberTwitchLogin} />
                    </FormLabel>
                    {memberResults.length > 0 ? (
                      <div className="mt-2 max-h-44 overflow-auto rounded-xl border border-[#353a50] bg-[#10172a]/70">
                        {memberResults.map((member) => (
                          <button
                            type="button"
                            key={`${member.twitchLogin}-${member.displayName}`}
                            onClick={() => selectMember(member)}
                            className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5"
                          >
                            {member.displayName} (@{member.twitchLogin})
                            {member.role ? ` · ${member.role}` : ""}
                            {member.isActive === false ? " · Inactif" : ""}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <FormLabel label="Interviewé sélectionné">
                    <input value={form.memberDisplayName ? `${form.memberDisplayName} (@${form.memberTwitchLogin})` : ""} className={inputClass} readOnly required />
                  </FormLabel>
                  <FormLabel label="Thumbnail custom (optionnel)">
                    <input value={form.thumbnailOverride} onChange={(event) => setForm((prev) => ({ ...prev, thumbnailOverride: event.target.value }))} placeholder="https://..." className={inputClass} />
                  </FormLabel>
                </div>
              ) : null}

              {modalTab === "staff" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-indigo-300/30 bg-indigo-300/10 p-3 text-sm text-indigo-100">
                    <p className="inline-flex items-center gap-2 font-medium">
                      <BookOpen className="h-4 w-4" />
                      Onglet présentation du staff
                    </p>
                    <p className="mt-1 text-xs text-indigo-100/90">
                      Utilise cet onglet pour cadrer les interviews staff: contexte, mise en avant et informations de présentation.
                    </p>
                  </div>
                  {form.groupType !== "staff" ? (
                    <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
                      Cette interview est en groupe “Membre”. Pour une présentation staff, passe le groupe sur “Staff”.
                    </div>
                  ) : null}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormLabel label="Date interview (optionnel)">
                      <input value={form.interviewDate} onChange={(event) => setForm((prev) => ({ ...prev, interviewDate: event.target.value }))} placeholder="Mars 2026" className={inputClass} />
                    </FormLabel>
                    <FormLabel label="Durée (optionnel)">
                      <input value={form.durationText} onChange={(event) => setForm((prev) => ({ ...prev, durationText: event.target.value }))} placeholder="18 min" className={inputClass} />
                    </FormLabel>
                  </div>
                  <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-3 text-xs text-cyan-100">
                    Recommandation: pour les interviews staff, garder un format clair (vision, rôle, contribution, perspective) et une durée annoncée.
                  </div>
                </div>
              ) : null}

              {modalTab === "publication" ? (
                <div className="space-y-4">
                  <label className="inline-flex items-center gap-2 rounded-xl border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-sm text-slate-200">
                    <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm((prev) => ({ ...prev, isPublished: event.target.checked }))} className="h-4 w-4 rounded border-slate-500 bg-slate-900" />
                    Publiée
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-xl border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-sm text-slate-200">
                    <input type="checkbox" checked={form.featured} onChange={(event) => setForm((prev) => ({ ...prev, featured: event.target.checked }))} className="h-4 w-4 rounded border-slate-500 bg-slate-900" />
                    Mise en avant
                  </label>
                  <div className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-3 text-xs text-emerald-100">
                    Conseil: publier d’abord en brouillon interne, vérifier l’aperçu puis activer la publication.
                  </div>
                </div>
              ) : null}

              {modalTab === "preview" ? (
                <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-100">{form.title || "Titre interview"}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${form.groupType === "staff" ? "border-blue-300/35 bg-blue-300/10 text-blue-100" : "border-emerald-300/35 bg-emerald-300/10 text-emerald-100"}`}>
                      {groupLabel(form.groupType)}
                    </span>
                    {form.featured ? <span className="rounded-full border border-fuchsia-300/35 bg-fuchsia-300/10 px-2 py-0.5 text-xs text-fuchsia-100">Mise en avant</span> : null}
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${form.isPublished ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100" : "border-amber-300/35 bg-amber-300/10 text-amber-100"}`}>
                      {form.isPublished ? "Publiée" : "Brouillon"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
                    {form.memberDisplayName ? `${form.memberDisplayName} (@${form.memberTwitchLogin})` : "Aucun interviewé sélectionné"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Ordre: {form.sortOrder} · Date: {form.interviewDate || "non définie"} · Durée: {form.durationText || "non définie"}</p>
                  <div className="mt-3">
                    <a href={form.youtubeUrl || "#"} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-indigo-300/30 bg-indigo-300/10 px-2.5 py-1.5 text-xs text-indigo-100">
                      Ouvrir vidéo
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2f3244] px-5 py-4">
              <p className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Sparkles className="h-3.5 w-3.5" />
                Ajout/édition via modal multi-onglets inspiré de la planification events.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={closeModal} disabled={saving} className="rounded-xl border border-slate-600/70 bg-slate-800/70 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-700 disabled:opacity-60">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="rounded-xl border border-emerald-300/40 bg-emerald-300/15 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? "Sauvegarde..." : modalMode === "create" ? "Ajouter" : "Mettre à jour"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className={`${sectionCardClass} p-4`}>
      <p className="text-xs uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-100">{value}</p>
    </article>
  );
}

function FormLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function InterviewList({
  loading,
  items,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  loading: boolean;
  items: InterviewItem[];
  onEdit: (item: InterviewItem) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (item: InterviewItem) => void;
}) {
  if (loading) {
    return <p className="text-slate-400">Chargement...</p>;
  }

  if (items.length === 0) {
    return <p className="text-slate-400">Aucune interview pour ces filtres.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <article key={item.id} className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold text-slate-100">{item.title}</p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.groupType === "staff" ? "bg-blue-500/20 text-blue-100" : "bg-emerald-500/20 text-emerald-100"}`}>
                  {groupLabel(item.groupType)}
                </span>
                {item.featured ? (
                  <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[11px] font-semibold text-fuchsia-100">
                    Mise en avant
                  </span>
                ) : null}
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.isPublished ? "bg-emerald-500/20 text-emerald-100" : "bg-amber-500/20 text-amber-100"}`}>
                  {item.isPublished ? "Publiée" : "Brouillon"}
                </span>
              </div>

              <p className="text-xs text-slate-400">
                {item.memberDisplayName} (@{item.memberTwitchLogin})
                {item.memberRole ? ` · ${item.memberRole}` : ""} · ordre {item.sortOrder}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                MAJ {new Date(item.updatedAt).toLocaleString("fr-FR")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={item.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-indigo-300/35 bg-indigo-300/10 px-2 py-1 text-xs text-indigo-100"
              >
                YouTube
              </a>
              <button
                type="button"
                onClick={() => onTogglePublish(item)}
                className="rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100"
              >
                {item.isPublished ? "Dépublier" : "Publier"}
              </button>
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="rounded-lg border border-slate-500/60 bg-slate-700/30 px-2 py-1 text-xs text-slate-100"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="rounded-lg border border-rose-500/45 bg-rose-500/10 px-2 py-1 text-xs text-rose-200"
              >
                Supprimer
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
