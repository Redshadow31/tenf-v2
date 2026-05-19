import { formatModeratorDisplayName } from "@/lib/moderation/hubWelcome";

type Props = {
  username: string;
  hasOpsSignals: boolean;
};

const bodyStyle = { fontSize: "clamp(0.8125rem,0.75rem+0.32vw,0.9625rem)" } as const;

export default function CommunauteHubWelcome({ username, hasOpsSignals }: Props) {
  const name = formatModeratorDisplayName(username);

  return (
    <div className="space-y-2.5">
      <p className="text-pretty leading-snug text-white" style={bodyStyle}>
        <span className="text-[clamp(1.15rem,0.95rem+0.55vw,1.65rem)] font-semibold tracking-tight">
          Bonjour {name},
        </span>
      </p>
      <p className="max-w-3xl text-pretty leading-[1.65] text-zinc-400" style={bodyStyle}>
        Tu es sur le hub <strong className="font-medium text-zinc-200">Animation &amp; engagement TENF</strong>
        . C&apos;est ton point d&apos;entrée staff pour piloter l&apos;animation du serveur : événements,
        reconnaissance, entraide et anniversaires — sans perdre le fil opérationnel.
      </p>
      <p className="max-w-3xl text-pretty leading-[1.65] text-zinc-400" style={bodyStyle}>
        La <strong className="font-medium text-zinc-300">synthèse</strong> à droite et les boutons ci-dessous
        t&apos;orientent vers les priorités du moment. Les chiffres proviennent du tableau de bord ops ou
        désignent des raccourcis : on n&apos;affiche jamais de pourcentages fictifs.
      </p>
      {hasOpsSignals ? (
        <p className="max-w-3xl text-pretty leading-[1.65] text-zinc-400" style={bodyStyle}>
          <span className="font-medium text-amber-200/95">Des signaux ops sont actifs</span> — commence par
          «&nbsp;À vérifier&nbsp;» ou consulte la synthèse pour voir ce qui attend une action.
        </p>
      ) : null}
    </div>
  );
}
