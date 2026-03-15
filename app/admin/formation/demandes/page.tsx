"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";

type FormationSession = {
  eventId: string;
  title: string;
  date: string;
  participants: number;
};

type FormationRequester = {
  id: string;
  memberDiscordId: string;
  memberDisplayName: string;
  memberTwitchLogin: string;
  requestedAt: string;
  status: string;
};

type FormationDemandRow = {
  formationTitle: string;
  lastSession: FormationSession | null;
  demandCount: number;
  sessions: FormationSession[];
  requests: FormationRequester[];
};

export default function AdminFormationDemandesPage() {
  const [rows, setRows] = useState<FormationDemandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<FormationDemandRow | null>(null);
  const [activeTab, setActiveTab] = useState<"sessions" | "requests">("sessions");
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/formation/requests", { cache: "no-store" });
        const body = await response.json();
        if (!response.ok) {
          setError(body.error || "Impossible de charger les demandes.");
          setRows([]);
          return;
        }
        setRows(body.formations || []);
      } catch {
        setError("Erreur reseau lors du chargement des demandes.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalPending = useMemo(() => rows.reduce((sum, row) => sum + row.demandCount, 0), [rows]);

  const selectedSession = selected?.sessions?.[selectedSessionIndex] || null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <AdminHeader
        title="📚 Formation TENF - Demandes de formation"
        navLinks={[
          { href: "/admin/dashboard", label: "Tableau de bord" },
          { href: "/admin/formation", label: "Formation TENF" },
          { href: "/admin/formation/demandes", label: "Demandes de formation", active: true },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
              Demandes de formation
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Priorise les formations a relancer selon les demandes membres.
            </p>
          </div>
          <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text)" }}>
            Demandes en attente: <span className="font-semibold">{totalPending}</span>
          </div>
        </div>

        <section className="rounded-xl border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          {loading ? (
            <div className="p-5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Chargement des demandes...
            </div>
          ) : error ? (
            <div className="p-5 text-sm" style={{ color: "#f87171" }}>
              {error}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Aucune donnee disponible pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                      Formation
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                      Participants derniere session
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                      Date derniere session
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                      Demandes de relance
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.formationTitle} className="border-b last:border-b-0" style={{ borderColor: "var(--color-border)" }}>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        {row.formationTitle}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--color-text)" }}>
                        {row.lastSession?.participants ?? 0}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {row.lastSession ? new Date(row.lastSession.date).toLocaleString("fr-FR") : "Aucune session"}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: row.demandCount > 0 ? "#f0c96b" : "var(--color-text-secondary)" }}>
                        {row.demandCount}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(row);
                            setActiveTab("sessions");
                            setSelectedSessionIndex(0);
                          }}
                          className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                          style={{ borderColor: "rgba(145,70,255,0.45)", color: "#c4b5fd" }}
                        >
                          Voir details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-4">
          <Link href="/admin/formation" className="text-sm underline" style={{ color: "var(--color-text-secondary)" }}>
            Retour au hub Formation
          </Link>
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-4xl rounded-xl border shadow-xl"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--color-border)" }}>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
                  {selected.formationTitle}
                </h2>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Sessions et demandes de relance
                </p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-md p-1" style={{ color: "var(--color-text-secondary)" }}>
                <X size={18} />
              </button>
            </div>

            <div className="px-5 pt-4">
              <div className="inline-flex rounded-lg border p-1" style={{ borderColor: "rgba(255,255,255,0.14)" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("sessions")}
                  className="rounded-md px-3 py-1.5 text-sm font-semibold"
                  style={{
                    backgroundColor: activeTab === "sessions" ? "rgba(139,92,246,0.28)" : "transparent",
                    color: activeTab === "sessions" ? "var(--color-text)" : "var(--color-text-secondary)",
                  }}
                >
                  Sessions
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("requests")}
                  className="rounded-md px-3 py-1.5 text-sm font-semibold"
                  style={{
                    backgroundColor: activeTab === "requests" ? "rgba(240,201,107,0.22)" : "transparent",
                    color: activeTab === "requests" ? "#f0c96b" : "var(--color-text-secondary)",
                  }}
                >
                  Demandes ({selected.requests.length})
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              {activeTab === "sessions" ? (
                <div className="space-y-4">
                  {selected.sessions.length > 1 ? (
                    <div className="flex flex-wrap gap-2">
                      {selected.sessions.map((session, index) => (
                        <button
                          key={`${session.eventId}-${index}`}
                          type="button"
                          onClick={() => setSelectedSessionIndex(index)}
                          className="rounded-full border px-3 py-1.5 text-xs"
                          style={{
                            borderColor: selectedSessionIndex === index ? "rgba(145,70,255,0.45)" : "rgba(255,255,255,0.2)",
                            color: selectedSessionIndex === index ? "#c4b5fd" : "var(--color-text-secondary)",
                          }}
                        >
                          Session {index + 1}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {selectedSession ? (
                    <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)" }}>
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        Nom
                      </p>
                      <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                        {selectedSession.title}
                      </p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            Date session
                          </p>
                          <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                            {new Date(selectedSession.date).toLocaleString("fr-FR")}
                          </p>
                        </div>
                        <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            Participants
                          </p>
                          <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                            {selectedSession.participants}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      Aucune session enregistree pour cette formation.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  {selected.requests.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      Aucune demande en attente.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selected.requests.map((request) => (
                        <div key={request.id} className="rounded-lg border px-3 py-3" style={{ borderColor: "var(--color-border)" }}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                              {request.memberDisplayName}
                            </p>
                            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                              {new Date(request.requestedAt).toLocaleString("fr-FR")}
                            </p>
                          </div>
                          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            Twitch: {request.memberTwitchLogin || "n/a"} | Discord ID: {request.memberDiscordId || "n/a"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

