import { HeartHandshake, MessageCircle, Radio, Users } from "lucide-react";
import theme from "@/components/lives/lives-theme.module.css";

export default function LivesPhilosophyBanner() {
  const pillars = [
    { icon: Radio, label: "Regarder", caption: "Même 5 min, ça compte", tone: theme.glassCardRed },
    { icon: MessageCircle, label: "Discuter", caption: "Un mot suffit à réchauffer un live", tone: theme.glassCardViolet },
    { icon: HeartHandshake, label: "Soutenir", caption: "Follow, partage, raid", tone: theme.glassCardAmber },
    { icon: Users, label: "Construire", caption: "Ensemble, au quotidien", tone: theme.glassCardEmerald },
  ];

  return (
    <section
      className={`${theme.panel} ${theme.panelPadding}`}
      aria-labelledby="philosophy-title"
    >
      <div className={theme.panelOrbViolet} aria-hidden />
      <div className={`${theme.panelInner} space-y-4`}>
        <h2
          id="philosophy-title"
          className="flex items-center gap-2 text-[clamp(1.05rem,0.95rem+0.4vw,1.35rem)] font-bold tracking-tight"
          style={{ color: "var(--color-text)" }}
        >
          <HeartHandshake className={`h-5 w-5 ${theme.iconViolet}`} aria-hidden />
          Sur TENF, chaque live compte
        </h2>
        <p
          className="max-w-4xl leading-relaxed"
          style={{ color: "var(--color-text-secondary)", fontSize: "clamp(0.9rem, 0.85rem + 0.15vw, 1rem)" }}
        >
          Peu importe le nombre de viewers ou le jeu streamé : ici, chaque créatrice et chaque créateur mérite d'être
          découvert·e. On ne court pas après les chiffres — on s'invite mutuellement à passer un bon moment.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ icon: Icon, label, caption, tone }) => (
            <div
              key={label}
              className={`${theme.glassCard} ${tone} flex items-start gap-3 p-3`}
            >
              <span
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${theme.glassInset} ${theme.glassInsetViolet}`}
              >
                <Icon className={`h-4 w-4 ${theme.iconViolet}`} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{label}</p>
                <p className="text-xs text-zinc-400">{caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
