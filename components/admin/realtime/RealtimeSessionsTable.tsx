"use client";

interface RealtimeSession {
  username: string | null;
  userId: string | null;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  lastSeenAt: string;
  connectionType: "discord" | "guest";
  path: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  status: "active_recent";
}

export default function RealtimeSessionsTable({
  sessions,
  loading,
}: {
  sessions: RealtimeSession[];
  loading: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#2a2a2d] bg-[#1a1a1d]">
      <div className="border-b border-[#2a2a2d] px-4 py-3">
        <h3 className="text-lg font-semibold text-white">Sessions actives (tri: activité récente)</h3>
      </div>
      <div className="max-h-[460px] overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-[#121216] text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3">Pseudo</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Pays</th>
              <th className="px-4 py-3">Région / ville</th>
              <th className="px-4 py-3">Path</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Navigateur</th>
              <th className="px-4 py-3">OS</th>
              <th className="px-4 py-3">Dernière activité</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-400" colSpan={10}>
                  Chargement...
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-400" colSpan={10}>
                  Aucune session active.
                </td>
              </tr>
            ) : (
              sessions.map((session, index) => (
                <tr key={`${session.userId || "guest"}-${session.lastSeenAt}-${index}`} className="border-t border-[#26262c] text-gray-200">
                  <td className="px-4 py-3">{session.username || session.userId || "Visiteur anonyme"}</td>
                  <td className="px-4 py-3">
                    {session.connectionType === "discord" ? "Membre Discord" : "Visiteur général"}
                  </td>
                  <td className="px-4 py-3">{session.country || session.countryCode || "Inconnu"}</td>
                  <td className="px-4 py-3">
                    {[session.region, session.city].filter(Boolean).join(" / ") || "N/A"}
                  </td>
                  <td className="px-4 py-3 max-w-[180px] truncate">{session.path || "/"}</td>
                  <td className="px-4 py-3">{session.deviceType || "N/A"}</td>
                  <td className="px-4 py-3">{session.browser || "N/A"}</td>
                  <td className="px-4 py-3">{session.os || "N/A"}</td>
                  <td className="px-4 py-3">{new Date(session.lastSeenAt).toLocaleTimeString("fr-FR")}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">
                      Actif récent
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
