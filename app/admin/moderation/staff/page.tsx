import Link from "next/link";

const staffModerationTree = [
  {
    group: "info",
    label: "Info",
    pages: [
      { slug: "annonces-staff", label: "Annonces staff" },
      { slug: "charte", label: "Charte" },
      { slug: "validation-charte", label: "Validation charte" },
      { slug: "comptes-rendus-reunions", label: "Comptes rendus de réunion" },
    ],
  },
  {
    group: "petits-travaux",
    label: "Petits travaux",
    pages: [
      { slug: "exercices-mensuels", label: "Exercices mensuels" },
      { slug: "mes-soumissions", label: "Mes soumissions" },
      { slug: "mes-validations", label: "Mes validations" },
    ],
  },
  {
    group: "discord",
    label: "Discord",
    pages: [
      { slug: "tickets", label: "Tickets" },
      { slug: "incidents-streamers", label: "Incidents streamers" },
      { slug: "cas-sensibles", label: "Cas sensibles" },
    ],
  },
];

export default function AdminModerationStaffDashboardPage() {
  return (
    <div className="min-h-screen space-y-6 bg-[#0b0f1a] p-6 text-white md:p-8">
      <section className="rounded-2xl border border-[#353a50] bg-[linear-gradient(145deg,rgba(67,56,202,0.16),rgba(12,15,24,0.94)_48%,rgba(14,165,233,0.10))] p-6">
        <p className="text-xs uppercase tracking-[0.12em] text-indigo-200">Staff (zone admin protégée)</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Modération</h1>
        <p className="mt-2 text-sm text-slate-300">
          Hub opérationnel modérateurs depuis la zone admin: information, travaux mensuels et suivi Discord.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {staffModerationTree.map((group) => (
          <article key={group.group} className="rounded-xl border border-[#2f3448] bg-[#101523]/80 p-4">
            <h2 className="text-base font-semibold text-slate-100">{group.label}</h2>
            <div className="mt-3 space-y-2">
              {group.pages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/admin/moderation/staff/${group.group}/${page.slug}`}
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
