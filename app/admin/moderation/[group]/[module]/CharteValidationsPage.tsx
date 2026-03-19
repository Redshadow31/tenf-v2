const validations = [
  {
    id: "val-1",
    pseudo: "MiloTENF",
    validatedAt: "Aujourd'hui, 09:12",
    version: "Charte v2",
    feedback:
      "La séparation faits / ressenti est claire et aide à prendre du recul avant d'intervenir.",
  },
  {
    id: "val-2",
    pseudo: "NexaMod",
    validatedAt: "Aujourd'hui, 11:47",
    version: "Charte v2",
    feedback:
      "Le rappel 'Pas sûr = je n'agis pas seul' facilite les décisions dans les cas ambigus.",
  },
  {
    id: "val-3",
    pseudo: "ArianeStaff",
    validatedAt: "Hier, 18:05",
    version: "Charte v2",
    feedback:
      "Le ton neutre et factuel est mieux compris quand les exemples sont concrets.",
  },
  {
    id: "val-4",
    pseudo: "Kryptik",
    validatedAt: "Hier, 14:22",
    version: "Charte v2",
    feedback: "",
  },
];

export default function CharteValidationsPage() {
  return (
    <div className="min-h-screen space-y-5 bg-[#0b0f1a] p-6 text-white md:p-8">
      <section className="rounded-2xl border border-[#353a50] bg-[linear-gradient(145deg,rgba(16,185,129,0.16),rgba(12,15,24,0.94)_48%,rgba(59,130,246,0.10))] p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-emerald-200">
          Admin / Modération / Info
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Charte validations</h1>
        <p className="mt-2 text-sm text-slate-200">
          Suivi des validations de charte en respectant la confidentialité des modérateurs.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-slate-700 bg-[#101523]/85 p-4">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Taux de validation</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-200">100%</p>
        </article>
        <article className="rounded-xl border border-slate-700 bg-[#101523]/85 p-4">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Validations totales</p>
          <p className="mt-2 text-3xl font-semibold text-sky-200">{validations.length}</p>
        </article>
        <article className="rounded-xl border border-slate-700 bg-[#101523]/85 p-4">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Retours laissés</p>
          <p className="mt-2 text-3xl font-semibold text-indigo-200">
            {validations.filter((item) => item.feedback.trim().length > 0).length}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-[#101523]/85 p-5">
        <h2 className="text-lg font-semibold text-white">Modérateurs ayant validé la charte</h2>
        <div className="mt-4 space-y-3">
          {validations.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-700 bg-[#0f1422] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-emerald-100">{item.pseudo}</p>
                  <p className="text-xs text-slate-400">{item.version}</p>
                </div>
                <p className="text-xs text-slate-400">{item.validatedAt}</p>
              </div>
              {item.feedback.trim() ? (
                <p className="mt-2 text-sm text-slate-200">{item.feedback}</p>
              ) : (
                <p className="mt-2 text-sm text-slate-400">Aucun retour écrit.</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
