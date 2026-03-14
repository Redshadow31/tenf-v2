type JoinTENFSectionProps = {
  href: string;
};

export default function JoinTENFSection({ href }: JoinTENFSectionProps) {
  const points = [
    "Entraide entre createurs",
    "Raids et soutien mutuel",
    "Evenements communautaires",
    "Formations streaming",
  ];

  return (
    <section
      className="rounded-2xl border p-6 md:p-8"
      style={{
        borderColor: "rgba(145, 70, 255, 0.3)",
        background:
          "linear-gradient(120deg, rgba(145,70,255,0.11) 0%, rgba(20,20,28,0.94) 65%, rgba(239,68,68,0.06) 100%)",
        boxShadow: "0 16px 36px rgba(0,0,0,0.2)",
      }}
    >
      <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
        Envie de rejoindre la communaute ?
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed md:text-base" style={{ color: "var(--color-text-secondary)" }}>
        TENF est une communaute d entraide entre streamers ou la decouverte et le soutien mutuel sont au coeur du projet.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {points.map((point) => (
          <div key={point} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            • {point}
          </div>
        ))}
      </div>
      <a
        href={href}
        className="mt-5 inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        💜 Rejoindre TENF
      </a>
    </section>
  );
}
