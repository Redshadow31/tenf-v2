"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ImagePlus, Loader2, Megaphone, Send, Trash2 } from "lucide-react";
import AnnouncementMarkdown from "@/components/ui/AnnouncementMarkdown";

type AnnouncementAudience = "staff" | "community";

type AnnouncementItem = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  imageUrl: string | null;
  audience: AnnouncementAudience;
  authorDisplayName: string | null;
  createdAt: string;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f1a]";

export default function StaffAnnouncementsAdminPage() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManageAnnouncements, setCanManageAnnouncements] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [audience, setAudience] = useState<AnnouncementAudience>("staff");
  const [sendDm, setSendDm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/staff-announcements", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Chargement impossible");
      }
      setItems(Array.isArray(data?.items) ? data.items : []);
      setCanManageAnnouncements(Boolean(data?.canManageAnnouncements));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canManageAnnouncements) return;
    setUploadBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/admin/staff-announcements/upload-image", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Upload refusé");
      }
      if (typeof data?.imageUrl === "string") setImageUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploadBusy(false);
    }
  }

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/staff-announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          link: link.trim() || null,
          imageUrl,
          audience,
          sendDiscordDm: sendDm,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Publication refusée");
      }
      const dm = data?.announcement?.discordDm as { attempted?: number; failed?: number } | undefined;
      const scopeLabel = audience === "staff" ? "staff dashboard" : "toute la communauté (site + Discord si DM)";
      setSuccess(
        dm && dm.attempted != null
          ? `Annonce publiée (${scopeLabel}) — DM Discord : ${dm.attempted - (dm.failed ?? 0)} OK, ${dm.failed ?? 0} échec(s).`
          : `Annonce publiée (${scopeLabel}).`,
      );
      setTitle("");
      setMessage("");
      setLink("");
      setImageUrl(null);
      setAudience("staff");
      setSendDm(false);
      await load();
      window.dispatchEvent(new CustomEvent("member-notifications-refresh"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  async function deactivate(id: string) {
    if (!confirm("Retirer cette annonce du fil actif (notification désactivée) ?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/staff-announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Action refusée");
      }
      await load();
      window.dispatchEvent(new CustomEvent("member-notifications-refresh"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  function formatWhen(iso: string): string {
    try {
      return new Date(iso).toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className="min-h-screen space-y-6 bg-[#0b0f1a] p-6 text-white md:p-8">
      <section className="rounded-2xl border border-[#353a50] bg-[#101523]/85 p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Admin / Modération staff / Info</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Megaphone className="h-8 w-8 text-amber-300/90" aria-hidden />
          <h1 className="text-2xl font-semibold">Annonces serveur</h1>
        </div>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">
          Réservé à la publication aux{" "}
          <strong className="font-semibold text-white">admins avancés</strong> (accès blob + fondateurs). Texte au
          format proche Discord (<strong>**gras**</strong>, listes, liens). Bannière recommandée au ratio{" "}
          <strong className="text-white">16:9</strong>. Audience :{" "}
          <span className="text-indigo-200">staff dashboard</span> (Mon compte admin + notifs staff) ou{" "}
          <span className="text-emerald-200">tous les membres</span> connectés sur le site + DM Discord optionnel à
          tout le serveur (long si beaucoup de membres).
        </p>
      </section>

      {canManageAnnouncements ? (
        <form
          onSubmit={(e) => void publish(e)}
          className="space-y-4 rounded-2xl border border-[#353a50] bg-[#101523]/85 p-5"
        >
          <h2 className="text-lg font-semibold text-white">Nouvelle annonce</h2>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-slate-400">Audience</legend>
            <div className="flex flex-wrap gap-4 text-sm text-slate-200">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="audience"
                  checked={audience === "staff"}
                  onChange={() => setAudience("staff")}
                  className="border-white/20 bg-black/40 text-indigo-500"
                />
                Staff uniquement (dashboard admin)
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="audience"
                  checked={audience === "community"}
                  onChange={() => setAudience("community")}
                  className="border-white/20 bg-black/40 text-emerald-500"
                />
                Tous les membres (site + option Discord serveur)
              </label>
            </div>
          </fieldset>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Titre</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              className={`w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600 ${focusRing}`}
              placeholder="Ex. Changement d’horaire réunion staff"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Message (Markdown)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={8}
              maxLength={12000}
              className={`font-mono w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600 ${focusRing}`}
              placeholder={`Utilise **gras**, *italique*, listes, [lien](https://…)`}
            />
            <p className="text-[11px] text-slate-500">
              Rendu identique sur Mon compte, notifications membre et DM Discord (format texte).
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Bannière 16:9 (optionnel)</label>
            <div className="flex flex-wrap items-center gap-3">
              <label
                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-slate-200 hover:bg-black/45 ${uploadBusy ? "pointer-events-none opacity-50" : ""}`}
              >
                <ImagePlus className="h-4 w-4" aria-hidden />
                {uploadBusy ? "Envoi…" : "Choisir une image"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => void onPickImage(e)} />
              </label>
              {imageUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-500/40 px-2 py-1 text-xs text-red-200 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Retirer l’image
                  </button>
                  <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Lien (optionnel)</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              maxLength={500}
              className={`w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600 ${focusRing}`}
              placeholder="https://… ou /member/…"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={sendDm}
              onChange={(e) => setSendDm(e.target.checked)}
              className="mt-1 rounded border-white/20 bg-black/40 text-indigo-500"
            />
            <span>
              Envoyer aussi un DM Discord via le bot (
              {audience === "staff"
                ? "comptes avec accès dashboard + admin avancé"
                : "tous les membres humains du serveur TENF — peut prendre plusieurs minutes"}
              ).
            </span>
          </label>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
          <button
            type="submit"
            disabled={submitting || uploadBusy}
            className={`inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 ${focusRing}`}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publier
          </button>
        </form>
      ) : (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          Tu peux consulter les annonces. Pour publier ou désactiver, il faut un{" "}
          <strong className="text-white">accès admin avancé</strong> (configuré par les fondateurs).
        </div>
      )}

      <section className="rounded-2xl border border-[#353a50] bg-[#101523]/85 p-5">
        <h2 className="text-lg font-semibold text-white">Annonces actives</h2>
        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement…
          </div>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Aucune annonce publiée pour le moment.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {items.map((a) => (
              <li key={a.id} className="rounded-xl border border-white/10 bg-black/25 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        a.audience === "community"
                          ? "bg-emerald-500/20 text-emerald-200"
                          : "bg-indigo-500/20 text-indigo-200"
                      }`}
                    >
                      {a.audience === "community" ? "Tous membres" : "Staff"}
                    </span>
                    <p className="font-semibold text-white">{a.title}</p>
                    {a.imageUrl ? (
                      <div className="relative aspect-video max-w-lg overflow-hidden rounded-lg border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.imageUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : null}
                    <AnnouncementMarkdown content={a.body} className="text-slate-300" />
                    {a.link ? (
                      <a
                        href={a.link}
                        className="inline-block text-xs text-indigo-300 underline-offset-2 hover:underline"
                      >
                        {a.link}
                      </a>
                    ) : null}
                    <p className="text-[11px] text-slate-500">
                      {a.authorDisplayName || "Auteur inconnu"} · {formatWhen(a.createdAt)}
                    </p>
                  </div>
                  {canManageAnnouncements ? (
                    <button
                      type="button"
                      onClick={() => void deactivate(a.id)}
                      className={`shrink-0 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/20 ${focusRing}`}
                    >
                      Désactiver
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href="/admin/moderation/staff/info"
        className="inline-flex rounded-lg border border-[#3c425d] bg-[#0f1422] px-3 py-2 text-sm text-slate-200 transition hover:border-indigo-300/45 hover:bg-[#161d31]"
      >
        ← Retour au groupe Info
      </Link>
    </div>
  );
}
