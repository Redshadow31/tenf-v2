import { formatModeratorDisplayName } from "@/lib/moderation/hubWelcome";

type Props = {
  username: string;
  hasPriorityActions: boolean;
};

const bodyStyle = { fontSize: "clamp(0.8125rem,0.75rem+0.32vw,0.9625rem)" } as const;

export default function OnboardingHubWelcome({ username, hasPriorityActions }: Props) {
  const name = formatModeratorDisplayName(username);

  return (
    <div className="space-y-2.5">
      <p className="text-pretty leading-snug text-white" style={bodyStyle}>
        <span className="text-[clamp(1.15rem,0.95rem+0.55vw,1.65rem)] font-semibold tracking-tight">
          Bonjour {name},
        </span>
      </p>
      <p className="max-w-3xl text-pretty leading-[1.65] text-zinc-400" style={bodyStyle}>
        Tu es sur le hub <strong className="font-medium text-zinc-200">Accueil &amp; intégration TENF</strong>
        . C&apos;est ton cockpit staff pour préparer les sessions d&apos;accueil, suivre les inscriptions et les
        présences, puis accompagner les nouveaux jusqu&apos;au statut membre actif.
      </p>
      <p className="max-w-3xl text-pretty leading-[1.65] text-zinc-400" style={bodyStyle}>
        La <strong className="font-medium text-zinc-300">synthèse</strong> à droite et les sections ci-dessous
        s&apos;appuient sur le calendrier d&apos;intégration et les données réelles — pas sur les événements
        communautaires.
      </p>
      {hasPriorityActions ? (
        <p className="max-w-3xl text-pretty leading-[1.65] text-zinc-400" style={bodyStyle}>
          <span className="font-medium text-amber-200/95">Des actions prioritaires sont détectées</span> — commence
          par «&nbsp;À faire maintenant&nbsp;» ou la prochaine session.
        </p>
      ) : null}
    </div>
  );
}
