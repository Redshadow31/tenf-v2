import Link from "next/link";
import { notFound } from "next/navigation";

const groups = {
  info: {
    label: "Info",
    pages: [
      { slug: "annonces-staff", label: "Annonces staff" },
      { slug: "charte", label: "Charte" },
      { slug: "validation-charte", label: "Validation charte" },
      { slug: "comptes-rendus-reunions", label: "Comptes rendus de réunion" },
    ],
  },
  "petits-travaux": {
    label: "Petits travaux",
    pages: [
      { slug: "exercices-mensuels", label: "Exercices mensuels" },
      { slug: "mes-soumissions", label: "Mes soumissions" },
      { slug: "mes-validations", label: "Mes validations" },
    ],
  },
  discord: {
    label: "Discord",
    pages: [
      { slug: "tickets", label: "Tickets" },
      { slug: "incidents-streamers", label: "Incidents streamers" },
      { slug: "cas-sensibles", label: "Cas sensibles" },
    ],
  },
} as const;

type AdminModerationStaffGroupPageProps = {
  params: {
    group: string;
  };
};

export default function AdminModerationStaffGroupPage({ params }: AdminModerationStaffGroupPageProps) {
  const group = groups[params.group as keyof typeof groups];
  if (!group) notFound();

  return (
    <div className="min-h-screen space-y-5 bg-[#0b0f1a] p-6 text-white md:p-8">
      <section className="rounded-2xl border border-[#353a50] bg-[#101523]/85 p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Admin / Modération staff / {group.label}</p>
        <h1 className="mt-2 text-2xl font-semibold">{group.label}</h1>
      </section>
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {group.pages.map((page) => (
          <Link
            key={page.slug}
            href={`/admin/moderation/staff/${params.group}/${page.slug}`}
            className="rounded-xl border border-[#3c425d] bg-[#0f1422] px-4 py-3 text-sm text-slate-200 transition hover:border-indigo-300/45 hover:bg-[#161d31]"
          >
            {page.label}
          </Link>
        ))}
      </section>
    </div>
  );
}
