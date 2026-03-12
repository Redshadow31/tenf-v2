import { loadAventuraSettings } from "@/lib/newFamilyAventuraStorage";

export const dynamic = "force-dynamic";

export default async function AdminAventuraSettingsPage() {
  const settings = await loadAventuraSettings();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
          Paramètres page - New Family Aventura
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Préparer la gestion du contenu de la landing sans modification de code.
        </p>
      </div>

      <div
        className="rounded-xl border p-4 space-y-3"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>
            Texte hero
          </p>
          <p style={{ color: "var(--color-text)" }}>{settings.hero_title}</p>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>
            Sous-titre hero
          </p>
          <p style={{ color: "var(--color-text)" }}>{settings.hero_subtitle}</p>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>
            Texte CTA final
          </p>
          <p style={{ color: "var(--color-text)" }}>{settings.final_cta_text}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)" }}>
            Formulaire intérêt: {settings.interest_form_enabled ? "Actif" : "Inactif"}
          </div>
          <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)" }}>
            Compteur intérêt: {settings.interest_counter_enabled ? "Actif" : "Inactif"}
          </div>
          <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)" }}>
            Galerie inspiration: {settings.inspiration_gallery_enabled ? "Active" : "Inactive"}
          </div>
        </div>

        {/* TODO: connecter cette page à un formulaire d'édition + persistance Supabase (table settings). */}
      </div>
    </div>
  );
}

