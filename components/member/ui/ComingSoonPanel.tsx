type ComingSoonPanelProps = {
  items: string[];
  title?: string;
};

export default function ComingSoonPanel({ items, title = "Fonctionnalités à venir" }: ComingSoonPanelProps) {
  return (
    <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
      <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
        {title}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border px-3 py-1 text-xs font-semibold"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
