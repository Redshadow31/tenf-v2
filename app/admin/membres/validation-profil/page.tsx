"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, FileText, Loader2 } from "lucide-react";

interface PendingItem {
  id: string;
  twitch_login: string;
  discord_id: string | null;
  description: string | null;
  instagram: string | null;
  tiktok: string | null;
  twitter: string | null;
  status: string;
  submitted_at: string;
}

export default function ValidationProfilPage() {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    loadPending();
  }, []);

  async function loadPending() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/members/profile-validation", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setPending(data.pending || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "approve" | "reject") {
    setActioning(id);
    try {
      const res = await fetch("/api/admin/members/profile-validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setPending((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(data.error || "Erreur");
      }
    } catch (e) {
      alert("Erreur de connexion");
    } finally {
      setActioning(null);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
      <div className="max-w-4xl mx-auto px-8 py-8">
        <Link href="/admin/membres/gestion" className="inline-block text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
          ← Retour à la gestion des membres
        </Link>

        <h1 className="text-3xl font-bold mb-2">Validation des profils</h1>
        <p className="text-sm mb-8" style={{ color: "var(--color-text-secondary)" }}>
          Les membres proposent des modifications (descriptif, réseaux). Valide ou rejette les demandes.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: "var(--color-primary)" }} />
          </div>
        ) : pending.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--color-text-secondary)" }} />
            <p style={{ color: "var(--color-text-secondary)" }}>Aucune demande en attente</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pending.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border p-6"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      <Link
                        href={`/admin/membres/gestion?search=${encodeURIComponent(item.twitch_login)}`}
                        className="hover:underline"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {item.twitch_login}
                      </Link>
                    </h3>
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      Soumis le {new Date(item.submitted_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(item.id, "approve")}
                      disabled={actioning === item.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {actioning === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Valider
                    </button>
                    <button
                      onClick={() => handleAction(item.id, "reject")}
                      disabled={actioning === item.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeter
                    </button>
                  </div>
                </div>

                {item.description && (
                  <div className="mb-4">
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>Descriptif</p>
                    <p className="text-sm whitespace-pre-wrap rounded-lg p-3" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
                      {item.description}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  {item.instagram && (
                    <div>
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Instagram:</span>
                      <span className="ml-2 text-sm">{item.instagram}</span>
                    </div>
                  )}
                  {item.tiktok && (
                    <div>
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>TikTok:</span>
                      <span className="ml-2 text-sm">{item.tiktok}</span>
                    </div>
                  )}
                  {item.twitter && (
                    <div>
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Twitter:</span>
                      <span className="ml-2 text-sm">{item.twitter}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
