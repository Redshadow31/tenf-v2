import Link from "next/link";
import { notFound } from "next/navigation";
import CharteModerationPage from "./CharteModerationPage";
import StaffMonthlyExercisesPage from "./StaffMonthlyExercisesPage";

const moduleLabels: Record<string, Record<string, string>> = {
  info: {
    "annonces-staff": "Annonces staff",
    charte: "Charte de la modération",
    "validation-charte": "Validation de la charte",
  },
  "petits-travaux": {
    "exercices-mensuels": "Exercices mensuels",
    "exercices-mensuel": "Exercices mensuels",
    "mes-soumissions": "Mes soumissions",
    "mes-validations": "Mes validations",
  },
  discord: {
    tickets: "Forum tickets",
    "incidents-streamers": "Incidents entre streamers",
    "cas-sensibles": "Comportements / cas sensibles",
  },
};

type AdminModerationStaffModulePageProps = {
  params: {
    group: string;
    module: string;
  };
};

export default function AdminModerationStaffModulePage({ params }: AdminModerationStaffModulePageProps) {
  const title = moduleLabels[params.group]?.[params.module];
  if (!title) notFound();

  if (params.group === "info" && params.module === "charte") {
    return <CharteModerationPage />;
  }
  if (
    params.group === "petits-travaux" &&
    (params.module === "exercices-mensuels" || params.module === "exercices-mensuel")
  ) {
    return <StaffMonthlyExercisesPage />;
  }

  return (
    <div className="min-h-screen space-y-5 bg-[#0b0f1a] p-6 text-white md:p-8">
      <section className="rounded-2xl border border-[#353a50] bg-[#101523]/85 p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
          Admin / Modération staff / {params.group}
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-slate-300">
          Module staff en zone admin protégée, prêt pour l’intégration workflow/validations/logs.
        </p>
      </section>
      <Link
        href={`/admin/moderation/staff/${params.group}`}
        className="inline-flex rounded-lg border border-[#3c425d] bg-[#0f1422] px-3 py-2 text-sm text-slate-200 transition hover:border-indigo-300/45 hover:bg-[#161d31]"
      >
        ← Retour au groupe
      </Link>
    </div>
  );
}
