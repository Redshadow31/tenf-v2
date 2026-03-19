import Link from "next/link";

const adminModerationTree = [
  {
    group: "config",
    label: "Configuration",
    pages: [
      { slug: "navigation-labels", label: "Navigation labels" },
      { slug: "roles-permissions", label: "Rôles & permissions" },
      { slug: "parametres", label: "Paramètres" },
    ],
  },
  {
    group: "logs",
    label: "Logs",
    pages: [
      { slug: "actions", label: "Actions" },
      { slug: "status-history", label: "Historique des statuts" },
      { slug: "exports", label: "Exports" },
    ],
  },
  {
    group: "info",
    label: "Info",
    pages: [
      { slug: "annonces", label: "Annonces" },
      { slug: "charte-versions", label: "Charte versions" },
      { slug: "charte-validations", label: "Charte validations" },
    ],
  },
  {
    group: "petits-travaux",
    label: "Petits travaux",
    pages: [
      { slug: "catalogue-exercices", label: "Catalogue exercices" },
      { slug: "campagnes-mensuelles", label: "Campagnes mensuelles" },
      { slug: "assignations", label: "Assignations" },
      { slug: "soumissions", label: "Soumissions" },
      { slug: "validations", label: "Validations" },
    ],
  },
  {
    group: "discord",
    label: "Discord",
    pages: [
      { slug: "tickets", label: "Tickets" },
      { slug: "incidents", label: "Incidents" },
      { slug: "cas-sensibles", label: "Cas sensibles" },
      { slug: "transferts-admin", label: "Transferts admin" },
    ],
  },
];

export default function AdminModerationDashboardPage() {
  return (
    <div className="min-h-screen space-y-6 bg-[#0b0f1a] p-6 text-white md:p-8">
      <section className="rounded-2xl border border-[#353a50] bg-[linear-gradient(145deg,rgba(67,56,202,0.16),rgba(12,15,24,0.94)_48%,rgba(14,165,233,0.10))] p-6">
        <p className="text-xs uppercase tracking-[0.12em] text-indigo-200">Administration du site</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Modération</h1>
        <p className="mt-2 text-sm text-slate-300">
          Centre de pilotage admin pour configuration, validations, supervision et logs de la modération.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminModerationTree.map((group) => (
          <article key={group.group} className="rounded-xl border border-[#2f3448] bg-[#101523]/80 p-4">
            <h2 className="text-base font-semibold text-slate-100">{group.label}</h2>
            <div className="mt-3 space-y-2">
              {group.pages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/admin/moderation/${group.group}/${page.slug}`}
                  className="block rounded-lg border border-[#3c425d] bg-[#0f1422] px-3 py-2 text-sm text-slate-200 transition hover:border-indigo-300/45 hover:bg-[#161d31]"
                >
                  {page.label}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
