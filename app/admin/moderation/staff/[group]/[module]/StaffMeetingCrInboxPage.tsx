"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Mail, ScrollText, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { StaffMeetingCrInboxRow } from "@/lib/repositories";

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

function CrPreview({ markdown }: { markdown: string }) {
  const v = (markdown || "").trim();
  if (!v) return <p className="text-xs text-slate-500">Contenu vide.</p>;
  return (
    <div
      className="prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-headings:text-indigo-100 prose-strong:text-white prose-blockquote:border-l-indigo-400/55 prose-li:marker:text-indigo-300"
      style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{v}</ReactMarkdown>
    </div>
  );
}

export default function StaffMeetingCrInboxPage() {
  const [items, setItems] = useState<StaffMeetingCrInboxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/staff/meeting-cr-inbox", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur chargement");
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Erreur chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function openDetail(item: StaffMeetingCrInboxRow) {
    setOpenId(item.id);
    if (item.readAt) return;
    try {
      await fetch(`/api/admin/staff/meeting-cr-inbox/${encodeURIComponent(item.id)}/read`, {
        method: "PATCH",
      });
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, readAt: new Date().toISOString() } : row)),
      );
    } catch {
      /* lecture locale suffit */
    }
  }

  const openItem = openId ? items.find((i) => i.id === openId) : null;

  useEffect(() => {
    if (!openId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [openId]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-[#0b0f1a] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-[#0b0f1a] p-6 text-white md:p-8">
      <section className="rounded-2xl border border-[#353a50] bg-[#101523]/85 p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.12em] text-indigo-200">Admin / Modération staff / Info</p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold md:text-3xl">
          <Mail className="h-7 w-7 text-indigo-300" />
          Comptes rendus de réunion
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Ici tu retrouves les comptes rendus qui t’ont été envoyés depuis la page{" "}
          <Link
            href="/admin/gestion-acces/reunions-staff-mensuelles"
            className="text-indigo-300 underline decoration-indigo-500/40 underline-offset-2 hover:text-indigo-200"
          >
            Réunions mensuelles staff
          </Link>
          . Chaque envoi est une copie figée au moment de l’envoi.
        </p>
      </section>

      {feedback ? (
        <p className="rounded-xl border border-red-500/35 bg-red-950/30 px-4 py-3 text-sm text-red-100">{feedback}</p>
      ) : null}

      <section className="rounded-2xl border border-[#2f3448] bg-[#101523]/80 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-100">Boîte de réception</h2>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-[#3c425d] bg-[#0f1422] px-3 py-1.5 text-sm text-slate-200 transition hover:border-indigo-300/45 hover:bg-[#161d31]"
          >
            Actualiser
          </button>
        </div>

        {items.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">Aucun compte rendu reçu pour le moment.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => void openDetail(item)}
                  className="flex w-full flex-col gap-1 rounded-xl border border-[#3c425d] bg-[#0f1422] px-4 py-3 text-left text-sm transition hover:border-indigo-300/45 hover:bg-[#161d31] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-2">
                    <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-100">
                        {item.meetingTitle ? item.meetingTitle : "Réunion staff"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.meetingDate ? formatFrDate(item.meetingDate) : "Date inconnue"}
                        {" · reçu le "}
                        {new Date(item.sentAt).toLocaleString("fr-FR")}
                        {item.readAt ? (
                          <span className="text-slate-500"> · lu</span>
                        ) : (
                          <span className="text-amber-200/90"> · nouveau</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-indigo-300">Ouvrir</span>
                </button>
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

      {openItem ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cr-inbox-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => setOpenId(null)}
            aria-label="Fermer"
          />
          <div className="relative z-[91] flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-indigo-400/35 bg-[#0e1220] shadow-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div className="min-w-0">
                <h2 id="cr-inbox-modal-title" className="text-lg font-semibold text-white sm:text-xl">
                  {openItem.meetingTitle ? openItem.meetingTitle : "Compte rendu"}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {openItem.meetingDate ? formatFrDate(openItem.meetingDate) : null}
                  {openItem.meetingDate ? " · " : null}
                  Envoyé le {new Date(openItem.sentAt).toLocaleString("fr-FR")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="shrink-0 rounded-lg border border-white/15 p-2 text-gray-300 hover:bg-white/10"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div className="rounded-xl border border-white/10 bg-[#0a0c12] p-4 sm:p-5">
                <CrPreview markdown={openItem.bodyMarkdown} />
              </div>
              <p className="mt-4 flex items-center gap-1 text-xs text-emerald-200/90">
                <Check className="h-3.5 w-3.5" /> Marqué comme lu à l’ouverture.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
