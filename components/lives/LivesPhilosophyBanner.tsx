import { HeartHandshake, MessageCircle, Radio, Users } from "lucide-react";

export default function LivesPhilosophyBanner() {
  const pillars = [
    { icon: Radio, label: "Regarder", caption: "Même 5 min, ça compte" },
    { icon: MessageCircle, label: "Discuter", caption: "Un mot suffit à réchauffer un live" },
    { icon: HeartHandshake, label: "Soutenir", caption: "Follow, partage, raid" },
    { icon: Users, label: "Construire", caption: "Ensemble, au quotidien" },
  ];
  return (
    <section
      className="rounded-2xl border"
      style={{
        padding: "clamp(1rem, 2vw, 1.75rem)",
        borderColor: "rgba(145, 70, 255, 0.35)",
        background: "linear-gradient(90deg, rgba(145,70,255,0.16), rgba(145,70,255,0.05))",
      }}
      aria-labelledby="philosophy-title"
    >
      <h2
        id="philosophy-title"
        className="flex items-center gap-2 font-bold tracking-tight"
        style={{ color: "var(--color-text)", fontSize: "clamp(1.05rem, 0.95rem + 0.4vw, 1.35rem)" }}
      >
        <HeartHandshake className="h-5 w-5 text-fuchsia-300" aria-hidden />
        Sur TENF, chaque live compte
      </h2>
      <p
        className="mt-3 max-w-4xl leading-relaxed"
        style={{ color: "var(--color-text-secondary)", fontSize: "clamp(0.9rem, 0.85rem + 0.15vw, 1rem)" }}
      >
        Peu importe le nombre de viewers ou le jeu streamé : ici, chaque créatrice et chaque créateur mérite d'être
        découvert·e. On ne court pas après les chiffres — on s'invite mutuellement à passer un bon moment.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map(({ icon: Icon, label, caption }) => (
          <div
            key={label}
            className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 transition hover:border-violet-400/35"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-200">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">{label}</p>
              <p className="text-xs text-zinc-400">{caption}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
