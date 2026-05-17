"use client";

import AdminConfirmModal from "@/components/admin/AdminConfirmModal";

export type PointsDiscordAwardTarget = {
  source: "raid" | "event";
  /** Pseudo Twitch ou nom affiché : tout ce qui identifie clairement le membre. */
  displayLabel: string;
  /** Pseudo Discord (sans @). Optionnel : affiché en complément si présent. */
  discordUsername?: string | null;
  /** Texte court qui décrit le raid ou l'évènement. */
  contextLabel?: string;
};

export type PointsDiscordAwardConfirmModalProps = {
  open: boolean;
  target: PointsDiscordAwardTarget | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const RAID_POINTS = 500;
const EVENT_POINTS = 300;

/**
 * Confirmation d'attribution unitaire de points Discord (raid ou évènement).
 *
 * Réutilise `AdminConfirmModal` (ton warning, ARIA, Escape, focus).
 * - Raid  : +500
 * - Event : +300
 *
 * Le composant ne contient AUCUNE logique métier : il reste un simple
 * wrapper visuel autour de `AdminConfirmModal`. La règle métier (500 / 300)
 * est forcée serveur dans les routes API correspondantes.
 */
export default function PointsDiscordAwardConfirmModal({
  open,
  target,
  loading,
  onCancel,
  onConfirm,
}: PointsDiscordAwardConfirmModalProps) {
  const isRaid = target?.source === "raid";
  const points = isRaid ? RAID_POINTS : EVENT_POINTS;
  const title = isRaid
    ? "Attribuer les points Discord ?"
    : "Attribuer les points de présence ?";
  const confirmLabel = isRaid ? `Attribuer ${RAID_POINTS} points` : `Attribuer ${EVENT_POINTS} points`;

  const baseDescription = isRaid
    ? "Cette action attribuera 500 points Discord à ce membre pour le raid sélectionné. Vérifie que le raid correspond bien aux règles TENF."
    : "Cette action attribuera 300 points Discord pour la présence validée à cet évènement.";

  return (
    <AdminConfirmModal
      open={open}
      tone="warning"
      title={title}
      description={
        target ? (
          <div className="space-y-2">
            <p>{baseDescription}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
              <dt className="font-semibold uppercase tracking-wide text-zinc-500">Source</dt>
              <dd className="text-zinc-200">{isRaid ? "Raid EventSub" : "Présence évènement"}</dd>
              <dt className="font-semibold uppercase tracking-wide text-zinc-500">Membre</dt>
              <dd className="text-zinc-100">{target.displayLabel}</dd>
              {target.contextLabel ? (
                <>
                  <dt className="font-semibold uppercase tracking-wide text-zinc-500">
                    {isRaid ? "Raid" : "Évènement"}
                  </dt>
                  <dd className="text-zinc-200">{target.contextLabel}</dd>
                </>
              ) : null}
              {target.discordUsername ? (
                <>
                  <dt className="font-semibold uppercase tracking-wide text-zinc-500">Discord</dt>
                  <dd className="font-mono text-zinc-200">
                    @{target.discordUsername.replace(/^@/, "")}
                  </dd>
                </>
              ) : null}
              <dt className="font-semibold uppercase tracking-wide text-zinc-500">Points</dt>
              <dd className="font-semibold text-amber-200">+{points}</dd>
            </dl>
          </div>
        ) : null
      }
      confirmLabel={confirmLabel}
      loading={loading}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
