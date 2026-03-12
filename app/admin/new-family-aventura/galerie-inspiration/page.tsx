import { listAventuraInspirationGallery } from "@/lib/newFamilyAventuraStorage";

export const dynamic = "force-dynamic";

export default async function AdminAventuraInspirationGalleryPage() {
  const items = await listAventuraInspirationGallery();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
          Galerie inspiration - New Family Aventura
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Préparation des visuels avant voyage (lieux, hébergements, parc, ambiance).
        </p>
      </div>

      <div
        className="rounded-xl border p-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          Ajouter une image inspiration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} placeholder="Titre" />
          <input className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} placeholder="Catégorie (lieu, parc, hébergement...)" />
          <input className="rounded-lg border px-3 py-2 text-sm md:col-span-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} placeholder="URL image ou upload (placeholder)" />
          <textarea className="rounded-lg border px-3 py-2 text-sm md:col-span-2 min-h-[90px]" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} placeholder="Description courte" />
          <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <input type="checkbox" /> Publiée sur la page publique
          </label>
        </div>
        <button className="mt-3 px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
          Enregistrer
        </button>
        {/* TODO: connecter ce formulaire à Supabase Storage + table galerie inspiration (CRUD complet). */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.length === 0 ? (
          <div
            className="rounded-xl border p-4 text-sm"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-secondary)" }}
          >
            Aucune image enregistrée pour le moment.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${item.image_url})` }} />
              <div className="p-3">
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{item.category}</p>
                <h3 className="font-semibold" style={{ color: "var(--color-text)" }}>{item.title}</h3>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

