interface HistoryRow {
  zone: "public" | "admin";
  path: string;
  title: string | null;
  userId: string | null;
  username: string | null;
  authState: "authenticated" | "guest";
  visits: number;
  clicks: number;
  lastVisitedAt: string;
}

interface Props {
  loading: boolean;
  rows: HistoryRow[];
}

export default function PageActivityHistoryTable({ loading, rows }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#2a2a2d] bg-[#1a1a1d]">
      <div className="border-b border-[#2a2a2d] px-4 py-3">
        <h3 className="text-lg font-semibold">Historique agrégé des pages</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-[#121216] text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Path</th>
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Visites</th>
              <th className="px-4 py-3">Clics</th>
              <th className="px-4 py-3">Dernière visite</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-400" colSpan={7}>
                  Chargement...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-400" colSpan={7}>
                  Aucune activité sur cette période.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`${row.zone}-${row.path}-${row.userId || "guest"}-${index}`} className="border-t border-[#26262c] text-gray-200">
                  <td className="px-4 py-3">{row.zone === "admin" ? "Admin" : "Public"}</td>
                  <td className="max-w-[340px] truncate px-4 py-3" title={row.path}>
                    {row.path}
                  </td>
                  <td className="px-4 py-3">{row.username || row.userId || "Visiteur anonyme"}</td>
                  <td className="px-4 py-3">{row.authState === "authenticated" ? "Connecté" : "Invité"}</td>
                  <td className="px-4 py-3">{row.visits}</td>
                  <td className="px-4 py-3">{row.clicks}</td>
                  <td className="px-4 py-3">{new Date(row.lastVisitedAt).toLocaleString("fr-FR")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
