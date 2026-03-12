import Link from "next/link";
import { staffPlaceholderData } from "@/lib/staff/staffPlaceholderData";

const roleOrder = [
  "FONDATEUR",
  "ADMIN_COORDINATEUR",
  "MODERATEUR",
  "MODERATEUR_EN_FORMATION",
  "SOUTIEN_TENF",
  "AUTRE",
] as const;

export default function OrganisationStaffPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--color-text)" }}>
          Organisation du staff TENF
        </h1>
        <p className="mb-8" style={{ color: "var(--color-text-secondary)" }}>
          Structure publiee en mode placeholder. Le contenu sera alimente depuis l'administration staff.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roleOrder.map((role) => {
            const members = staffPlaceholderData
              .filter((member) => member.role === role && member.isVisiblePublic && !member.isArchived)
              .sort((a, b) => a.order - b.order);

            return (
              <section
                key={role}
                className="rounded-xl border p-5"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
              >
                <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--color-text)" }}>
                  {role}
                </h2>
                {members.length === 0 ? (
                  <p style={{ color: "var(--color-text-secondary)" }}>Aucun membre affiche pour le moment.</p>
                ) : (
                  <ul className="space-y-2">
                    {members.map((member) => (
                      <li key={member.id} style={{ color: "var(--color-text-secondary)" }}>
                        {member.displayName}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>

        <div className="mt-8">
          <Link href="/organisation-staff/organigramme" className="underline" style={{ color: "var(--color-primary)" }}>
            Voir l'organigramme interactif (placeholder)
          </Link>
        </div>
      </div>
    </main>
  );
}

