import { getAventuraPreferencesBreakdown, listAventuraQuestions } from "@/lib/newFamilyAventuraStorage";

export const dynamic = "force-dynamic";

export default async function AdminAventuraPreferencesPage() {
  const data = await getAventuraPreferencesBreakdown();
  const questions = await listAventuraQuestions();
  const totalQuestions = questions.length;
  const pendingQuestions = questions.filter((item) => !item.is_answered).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
          Questions / préférences - New Family Aventura
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Analyse des conditions de participation et synthèse des retours libres.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
            Questions admins recues
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            {totalQuestions}
          </p>
        </div>
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
            Questions en attente de reponse
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            {pendingQuestions}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {Object.entries(data.counts).map(([label, count]) => (
          <div
            key={label}
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <p className="text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
              {label}
            </p>
            <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
              {count}
            </p>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl border p-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          Commentaires libres
        </h2>
        {data.comments.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Aucun commentaire pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {data.comments.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border p-3"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
              >
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-text)" }}>
                  {item.pseudo}
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {item.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="rounded-xl border p-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          Dernieres questions aux admins
        </h2>
        {questions.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Aucune question envoyee pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {questions.slice(0, 20).map((item) => (
              <div
                key={item.id}
                className="rounded-lg border p-3"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {item.pseudo} - {item.category}
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {item.question}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Statut: {item.is_answered ? "Repondu" : "En attente"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TODO: visualisation graphique dédiée (bar chart / tendances mensuelles) */}
    </div>
  );
}

