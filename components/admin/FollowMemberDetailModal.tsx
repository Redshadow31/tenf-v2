"use client";

type DetailChannel = {
  twitchLogin: string;
  twitchId: string | null;
  displayName: string;
  isOwnChannel: boolean;
};

type DetailPayload = {
  snapshotId: string;
  generatedAt: string;
  sourceDataRetrievedAt: string;
  state: "ok" | "not_linked" | "calculation_impossible";
  reason: string | null;
  member: {
    discordId: string | null;
    displayName: string;
    memberTwitchLogin: string;
    linkedTwitchLogin: string | null;
    linkedTwitchDisplayName: string | null;
  };
  totals: {
    followedCount: number | null;
    totalActiveTenfChannels: number;
    followRate: number | null;
  };
  followedChannels: DetailChannel[];
  notFollowedChannels: DetailChannel[];
  lastCalculatedAt: string | null;
};

type Props = {
  open: boolean;
  loading: boolean;
  detail: DetailPayload | null;
  onClose: () => void;
};

function formatDate(value: string | null): string {
  if (!value) return "Indisponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Indisponible";
  return date.toLocaleString("fr-FR");
}

export default function FollowMemberDetailModal({
  open,
  loading,
  detail,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className="w-full max-w-5xl rounded-xl border p-5 max-h-[88vh] overflow-y-auto"
        style={{
          backgroundColor: "var(--color-card)",
          borderColor: "var(--color-border)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
              Detail Follow
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Progression de suivi des chaines Twitch TENF pour le membre selectionne.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            Fermer
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Chargement du detail...
          </div>
        ) : !detail ? (
          <div className="py-10 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Aucun detail disponible.
          </div>
        ) : (
          <div className="space-y-4">
            <section
              className="rounded-lg border p-4"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                    Membre
                  </p>
                  <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                    {detail.member.displayName}
                  </p>
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    @{detail.member.memberTwitchLogin}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                    Compte Twitch lie
                  </p>
                  {detail.member.linkedTwitchLogin ? (
                    <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                      {detail.member.linkedTwitchDisplayName || detail.member.linkedTwitchLogin}
                      {" "}(@{detail.member.linkedTwitchLogin})
                    </p>
                  ) : (
                    <p style={{ color: "var(--color-text-secondary)" }}>Aucun compte lie</p>
                  )}
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Suivies</p>
                  <p className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
                    {detail.totals.followedCount ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Total chaines TENF</p>
                  <p className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
                    {detail.totals.totalActiveTenfChannels}
                  </p>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Progression</p>
                  <p className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
                    {detail.totals.followRate !== null ? `${detail.totals.followRate}%` : "—"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Dernier check: {formatDate(detail.lastCalculatedAt)}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Donnees source recuperees: {formatDate(detail.sourceDataRetrievedAt)}
              </p>
            </section>

            {detail.state !== "ok" ? (
              <section
                className="rounded-lg border p-4 text-sm"
                style={{ borderColor: "rgba(234, 179, 8, 0.5)", backgroundColor: "rgba(234, 179, 8, 0.08)" }}
              >
                <span style={{ color: "var(--color-text)" }}>
                  Calcul indisponible ({detail.reason || "raison inconnue"}).
                </span>
              </section>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <section
                  className="rounded-lg border p-4"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                >
                  <h3 className="mb-2 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    Chaines suivies ({detail.followedChannels.length})
                  </h3>
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {detail.followedChannels.map((channel) => (
                      <div
                        key={`followed-${channel.twitchLogin}`}
                        className="rounded-lg border px-3 py-2 text-sm"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        <span style={{ color: "var(--color-text)" }}>
                          {channel.displayName} (@{channel.twitchLogin})
                        </span>
                        {channel.isOwnChannel ? (
                          <span
                            className="ml-2 rounded-full px-2 py-0.5 text-[11px]"
                            style={{ backgroundColor: "rgba(145, 70, 255, 0.15)", color: "#d7beff" }}
                          >
                            Chaine personnelle
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>

                <section
                  className="rounded-lg border p-4"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                >
                  <h3 className="mb-2 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    Chaines non suivies ({detail.notFollowedChannels.length})
                  </h3>
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {detail.notFollowedChannels.map((channel) => (
                      <div
                        key={`not-followed-${channel.twitchLogin}`}
                        className="rounded-lg border px-3 py-2 text-sm"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        <span style={{ color: "var(--color-text)" }}>
                          {channel.displayName} (@{channel.twitchLogin})
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
