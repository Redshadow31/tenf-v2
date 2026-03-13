interface Props {
  totalVisits: number;
  totalClicks: number;
  totalEvents: number;
  topPage: string | null;
}

export default function PageActivityStatsCards(props: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
        <p className="text-sm text-gray-400">Total visites</p>
        <p className="mt-1 text-3xl font-bold text-indigo-300">{props.totalVisits}</p>
      </div>
      <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
        <p className="text-sm text-gray-400">Total clics</p>
        <p className="mt-1 text-3xl font-bold text-emerald-300">{props.totalClicks}</p>
      </div>
      <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
        <p className="text-sm text-gray-400">Total événements</p>
        <p className="mt-1 text-3xl font-bold text-cyan-300">{props.totalEvents}</p>
      </div>
      <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
        <p className="text-sm text-gray-400">Page la plus consultée</p>
        <p className="mt-1 truncate text-base font-semibold">{props.topPage || "N/A"}</p>
      </div>
    </div>
  );
}
