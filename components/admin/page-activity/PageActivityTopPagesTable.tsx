interface TopPageRow {
  path: string;
  zone: "public" | "admin";
  visits: number;
  clicks: number;
  lastVisitedAt: string;
}

interface Props {
  title: string;
  rows: TopPageRow[];
}

export default function PageActivityTopPagesTable({ title, rows }: Props) {
  return (
    <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-2 py-2">Path</th>
              <th className="px-2 py-2">Visites</th>
              <th className="px-2 py-2">Clics</th>
              <th className="px-2 py-2">Dernière visite</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-2 py-3 text-gray-500" colSpan={4}>
                  Aucune donnée.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.zone}-${row.path}`} className="border-t border-[#26262c] text-gray-200">
                  <td className="truncate px-2 py-2">{row.path}</td>
                  <td className="px-2 py-2">{row.visits}</td>
                  <td className="px-2 py-2">{row.clicks}</td>
                  <td className="px-2 py-2">{new Date(row.lastVisitedAt).toLocaleString("fr-FR")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
