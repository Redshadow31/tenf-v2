import Link from "next/link";
import { notFound } from "next/navigation";

const groups = {
  config: {
    label: "Configuration",
    pages: [
      { slug: "navigation-labels", label: "Navigation labels" },
      { slug: "roles-permissions", label: "Rôles & permissions" },
      { slug: "parametres", label: "Paramètres" },
    ],
  },
  logs: {
    label: "Logs",
    pages: [
      { slug: "actions", label: "Actions" },
      { slug: "status-history", label: "Historique des statuts" },
      { slug: "exports", label: "Exports" },
    ],
  },
  info: {
    label: "Info",
    pages: [
      { slug: "annonces", label: "Annonces" },
      { slug: "charte-versions", label: "Charte versions" },
      { slug: "charte-validations", label: "Charte validations" },
    ],
  },
  "petits-travaux": {
    label: "Petits travaux",
    pages: [
      { slug: "catalogue-exercices", label: "Catalogue exercices" },
      { slug: "campagnes-mensuelles", label: "Campagnes mensuelles" },
      { slug: "assignations", label: "Assignations" },
      { slug: "soumissions", label: "Soumissions" },
      { slug: "validations", label: "Validations" },
    ],
  },
  discord: {
    label: "Discord",
    pages: [
      { slug: "tickets", label: "Tickets" },
      { slug: "incidents", label: "Incidents" },
      { slug: "cas-sensibles", label: "Cas sensibles" },
      { slug: "transferts-admin", label: "Transferts admin" },
    ],
  },
} as const;

type AdminModerationGroupPageProps = {
  params: {
    group: string;
  };
};

export default function AdminModerationGroupPage({ params }: AdminModerationGroupPageProps) {
  const group = groups[params.group as keyof typeof groups];
  if (!group) notFound();

  return (
    <div className="min-h-screen space-y-5 bg-[#0b0f1a] p-6 text-white md:p-8">
      <section className="rounded-2xl border border-[#353a50] bg-[#101523]/85 p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Admin / Modération / {group.label}</p>
        <h1 className="mt-2 text-2xl font-semibold">{group.label}</h1>
      </section>
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {group.pages.map((page) => (
          <Link
            key={page.slug}
            href={`/admin/moderation/${params.group}/${page.slug}`}
            className="rounded-xl border border-[#3c425d] bg-[#0f1422] px-4 py-3 text-sm text-slate-200 transition hover:border-indigo-300/45 hover:bg-[#161d31]"
          >
            {page.label}
          </Link>
        ))}
      </section>
    </div>
  );
}
