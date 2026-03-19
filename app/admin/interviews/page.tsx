"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type InterviewGroupType = "staff" | "member";
type ListGroupFilter = "all" | InterviewGroupType;
type ListStatusFilter = "all" | "published" | "draft";

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
  return groupType === "staff" ? "Staff" : "Membre";
}

export default function AdminInterviewsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<SearchMemberItem[]>([]);

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

  function resetForm() {
    setForm(EMPTY_FORM);
    setMemberQuery("");
    setMemberResults([]);
  }

  function startEdit(item: InterviewItem) {
    setForm(toForm(item));
    setMemberQuery(item.memberDisplayName);
    setMemberResults([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="space-y-6">
      <section
        className="rounded-2xl border p-5 sm:p-6"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-text)" }}>
              Interviews TENF
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Back-office de gestion des interviews YouTube: attribution, publication, tri et mise en avant.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadInterviews()}
            className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/5"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            Rafraîchir les données
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Publiées" value={stats.published} />
          <StatCard label="Brouillons" value={stats.draft} />
          <StatCard label="Staff" value={stats.staff} />
          <StatCard label="Membres" value={stats.members} />
        </div>
      </section>

      {error ? (
        <section
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: "rgba(248,113,113,0.35)",
            backgroundColor: "rgba(127,29,29,0.2)",
            color: "#fecaca",
          }}
        >
          {error}
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-12">
        <section
          className="rounded-2xl border p-5 xl:col-span-5 xl:sticky xl:top-24 h-fit"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              {form.id ? "Modifier l'interview" : "Nouvelle interview"}
            </h2>
            {form.id ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border px-2.5 py-1 text-xs font-semibold"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
              >
                Réinitialiser
              </button>
            ) : null}
          </div>

          <form className="grid gap-3 md:grid-cols-2" onSubmit={submitForm}>
            <FormLabel label="Titre">
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
                required
              />
            </FormLabel>

            <FormLabel label="Lien YouTube">
              <input
                value={form.youtubeUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, youtubeUrl: event.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
                required
              />
            </FormLabel>

            <FormLabel label="Groupe">
              <select
                value={form.groupType}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, groupType: event.target.value as InterviewGroupType }))
                }
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
              >
                <option value="staff">Staff</option>
                <option value="member">Membre</option>
              </select>
            </FormLabel>

            <FormLabel label="Ordre d'affichage">
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    sortOrder: Number.parseInt(event.target.value || "0", 10),
                  }))
                }
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
              />
            </FormLabel>

            <div className="md:col-span-2">
              <FormLabel label="Recherche membre/interviewé">
                <input
                  value={memberQuery}
                  onChange={(event) => setMemberQuery(event.target.value)}
                  placeholder="Tape un pseudo (min. 2 caractères)"
                  className="w-full rounded-xl border px-3 py-2 outline-none"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text)",
                  }}
                  required={!form.memberTwitchLogin}
                />
              </FormLabel>
              {memberResults.length > 0 ? (
                <div
                  className="mt-2 max-h-44 overflow-auto rounded-xl border"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                >
                  {memberResults.map((member) => (
                    <button
                      type="button"
                      key={`${member.twitchLogin}-${member.displayName}`}
                      onClick={() => selectMember(member)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-white/5"
                      style={{ color: "var(--color-text)" }}
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
              <input
                value={
                  form.memberDisplayName ? `${form.memberDisplayName} (@${form.memberTwitchLogin})` : ""
                }
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
                readOnly
                required
              />
            </FormLabel>

            <FormLabel label="Thumbnail custom (optionnel)">
              <input
                value={form.thumbnailOverride}
                onChange={(event) => setForm((prev) => ({ ...prev, thumbnailOverride: event.target.value }))}
                placeholder="https://..."
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
              />
            </FormLabel>

            <FormLabel label="Date interview (optionnel)">
              <input
                value={form.interviewDate}
                onChange={(event) => setForm((prev) => ({ ...prev, interviewDate: event.target.value }))}
                placeholder="Mars 2026"
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
              />
            </FormLabel>

            <FormLabel label="Durée (optionnel)">
              <input
                value={form.durationText}
                onChange={(event) => setForm((prev) => ({ ...prev, durationText: event.target.value }))}
                placeholder="18 min"
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
              />
            </FormLabel>

            <div className="md:col-span-2 flex flex-wrap items-center gap-4 pt-2">
              <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-text)" }}>
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(event) => setForm((prev) => ({ ...prev, isPublished: event.target.checked }))}
                />
                Publiée
              </label>
              <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-text)" }}>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) => setForm((prev) => ({ ...prev, featured: event.target.checked }))}
                />
                Mise en avant
              </label>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 pt-1">
              {form.id ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border px-4 py-2 text-sm font-semibold"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  Annuler
                </button>
              ) : null}
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {saving ? "Sauvegarde..." : form.id ? "Mettre à jour" : "Ajouter"}
              </button>
            </div>
          </form>
        </section>

        <section
          className="rounded-2xl border p-5 xl:col-span-7"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold mr-auto" style={{ color: "var(--color-text)" }}>
              Liste des interviews
            </h2>
            <input
              value={listQuery}
              onChange={(event) => setListQuery(event.target.value)}
              placeholder="Filtrer titre / membre..."
              className="rounded-lg border px-3 py-1.5 text-sm outline-none"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
              }}
            />
            <select
              value={groupFilter}
              onChange={(event) => setGroupFilter(event.target.value as ListGroupFilter)}
              className="rounded-lg border px-3 py-1.5 text-sm outline-none"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
              }}
            >
              <option value="all">Tous groupes</option>
              <option value="staff">Staff</option>
              <option value="member">Membres</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ListStatusFilter)}
              className="rounded-lg border px-3 py-1.5 text-sm outline-none"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
              }}
            >
              <option value="all">Tous statuts</option>
              <option value="published">Publiées</option>
              <option value="draft">Brouillons</option>
            </select>
          </div>

          <p className="mb-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {filteredInterviews.length} résultat{filteredInterviews.length > 1 ? "s" : ""}
          </p>

          <InterviewList
            loading={loading}
            items={filteredInterviews}
            onEdit={startEdit}
            onDelete={removeInterview}
            onTogglePublish={togglePublish}
          />
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article
      className="rounded-xl border px-3 py-2"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
    >
      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </p>
      <p className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
        {value}
      </p>
    </article>
  );
}

function FormLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </span>
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
    return <p style={{ color: "var(--color-text-secondary)" }}>Chargement...</p>;
  }

  if (items.length === 0) {
    return <p style={{ color: "var(--color-text-secondary)" }}>Aucune interview pour ces filtres.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-xl border p-3"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold" style={{ color: "var(--color-text)" }}>
                  {item.title}
                </p>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor:
                      item.groupType === "staff" ? "rgba(59,130,246,0.2)" : "rgba(16,185,129,0.2)",
                    color: item.groupType === "staff" ? "#bfdbfe" : "#a7f3d0",
                  }}
                >
                  {groupLabel(item.groupType)}
                </span>
                {item.featured ? (
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: "rgba(145,70,255,0.2)", color: "#d8b4fe" }}
                  >
                    Mise en avant
                  </span>
                ) : null}
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: item.isPublished ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)",
                    color: item.isPublished ? "#86efac" : "#fcd34d",
                  }}
                >
                  {item.isPublished ? "Publiée" : "Brouillon"}
                </span>
              </div>

              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {item.memberDisplayName} (@{item.memberTwitchLogin})
                {item.memberRole ? ` · ${item.memberRole}` : ""} · ordre {item.sortOrder}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                MAJ {new Date(item.updatedAt).toLocaleString("fr-FR")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={item.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border px-2 py-1 text-xs"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                YouTube
              </a>
              <button
                type="button"
                onClick={() => onTogglePublish(item)}
                className="rounded-lg border px-2 py-1 text-xs"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                {item.isPublished ? "Dépublier" : "Publier"}
              </button>
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="rounded-lg border px-2 py-1 text-xs"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="rounded-lg border px-2 py-1 text-xs"
                style={{ borderColor: "rgba(248,113,113,0.45)", color: "#fecaca" }}
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
