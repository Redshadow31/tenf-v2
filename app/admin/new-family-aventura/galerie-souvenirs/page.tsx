import { listAventuraSouvenirsGallery } from "@/lib/newFamilyAventuraStorage";

export const dynamic = "force-dynamic";

export default async function AdminAventuraSouvenirsGalleryPage() {
  const items = await listAventuraSouvenirsGallery();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
          Galerie souvenirs - New Family Aventura
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Structure prête pour les photos réelles du voyage (après l&apos;événement).
        </p>
      </div>

      <div
        className="rounded-xl border p-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          Ajouter un souvenir (placeholder)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} placeholder="Titre" />
          <input type="date" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} />
          <input className="rounded-lg border px-3 py-2 text-sm md:col-span-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} placeholder="URL image ou upload (placeholder)" />
          <textarea className="rounded-lg border px-3 py-2 text-sm md:col-span-2 min-h-[90px]" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} placeholder="Description" />
          <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <input type="checkbox" /> Visible publiquement
          </label>
        </div>
        <button className="mt-3 px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
          Enregistrer
        </button>
        {/* TODO: implémenter upload effectif + table souvenirs + archivage/suppression. */}
      </div>

      <div
        className="rounded-xl border p-4 text-sm"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-secondary)" }}
      >
        {items.length === 0
          ? "Aucun souvenir pour le moment (normal avant le voyage)."
          : `${items.length} souvenir(s) chargés.`}
      </div>
    </div>
  );
}

