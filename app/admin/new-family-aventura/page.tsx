import Link from "next/link";
import { getAventuraSummary } from "@/lib/newFamilyAventuraStorage";

export const dynamic = "force-dynamic";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
    >
      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
        {value}
      </p>
    </div>
  );
}

export default async function AdminNewFamilyAventuraOverviewPage() {
  const summary = await getAventuraSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
          New Family Aventura - Vue d&apos;ensemble
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Suivi global de l&apos;intérêt communautaire et des signaux principaux du projet.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <StatCard label="Total réponses" value={summary.total} />
        <StatCard label="Intéressés" value={summary.interested} />
        <StatCard label="Veulent plus d'infos" value={summary.moreInfo} />
        <StatCard label="Hésitants" value={summary.maybe} />
        <StatCard label="Pas intéressés" value={summary.notForMe} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Créateurs" value={summary.byProfile.createur} />
        <StatCard label="Membres" value={summary.byProfile.membre} />
        <StatCard label="Autres" value={summary.byProfile.autre} />
      </div>

      <div
        className="rounded-xl border p-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          Dernières réponses reçues
        </h2>
        {summary.latest.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Aucune réponse pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {summary.latest.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
              >
                <span style={{ color: "var(--color-text)" }}>{item.pseudo}</span>
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {" "}
                  - {item.quick_response} - {new Date(item.created_at).toLocaleString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/new-family-aventura/reponses-interet" className="px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
          Ouvrir Réponses & intérêt
        </Link>
        <Link href="/admin/new-family-aventura/questions-preferences" className="px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
          Ouvrir Questions / préférences
        </Link>
      </div>
    </div>
  );
}

