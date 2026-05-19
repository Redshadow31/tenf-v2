import { MUI } from "@/components/admin/moderation/moderation-ui";
import { formatModeratorDisplayName } from "@/lib/moderation/hubWelcome";
import type { ModerationView } from "@/lib/moderation/moderationTree";

type Props = {
  view: ModerationView;
  username: string;
  charterSigned: boolean;
};

const bodyStyle = { fontSize: "clamp(0.84rem,0.94vw,0.98rem)" } as const;

export default function ModerationHubWelcome({ view, username, charterSigned }: Props) {
  const name = formatModeratorDisplayName(username);

  if (view === "staff") {
    return (
      <div className="space-y-2.5">
        <p className={`text-pretty leading-snug ${MUI.text}`} style={bodyStyle}>
          <span className="font-semibold">Bonjour {name},</span>
        </p>
        <p className={`max-w-[52ch] text-pretty leading-relaxed ${MUI.textSecondary}`} style={bodyStyle}>
          Tu es sur ton espace <strong className="font-medium text-[var(--color-text)]">modérateur TENF</strong>
          . Ce hub rassemble tout ce dont tu as besoin au quotidien : charte, exercices, annonces staff,
          comptes-rendus et suivi de tes actions. C&apos;est ici que tu prépares et sécurises ta modération
          sur le serveur — les priorités du moment sont à droite, puis listées plus bas sur la page.
        </p>
        {!charterSigned ? (
          <p className={`max-w-[52ch] text-pretty leading-relaxed ${MUI.textSecondary}`} style={bodyStyle}>
            <span className="font-medium text-rose-200/95 dark:text-rose-100/90">
              Pense à signer la charte
            </span>{" "}
            si ce n&apos;est pas encore fait : le panneau « Ton espace staff » te l&apos;indique.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <p className={`text-pretty leading-snug ${MUI.text}`} style={bodyStyle}>
        <span className="font-semibold">Bonjour {name},</span>
      </p>
      <p className={`max-w-[52ch] text-pretty leading-relaxed ${MUI.textSecondary}`} style={bodyStyle}>
        Depuis cette vue <strong className="font-medium text-[var(--color-text)]">admin</strong>, tu pilotes
        la modération TENF : ressources staff, questionnaires, annonces et suivi des actions. Bascule vers la
        vue modérateur pour retrouver l&apos;expérience terrain, comme celle de ton équipe.
      </p>
    </div>
  );
}
