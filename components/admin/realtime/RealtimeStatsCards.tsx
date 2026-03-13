"use client";

export default function RealtimeStatsCards({
  totalActiveConnections,
  activeMembers,
  activeGuests,
  countriesRepresented,
  latestHeartbeatAt,
}: {
  totalActiveConnections: number;
  activeMembers: number;
  activeGuests: number;
  countriesRepresented: number;
  latestHeartbeatAt: string | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
      <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
        <p className="text-sm text-gray-400">Connexions actives</p>
        <p className="mt-1 text-3xl font-bold">{totalActiveConnections}</p>
      </div>
      <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
        <p className="text-sm text-gray-400">Membres actifs</p>
        <p className="mt-1 text-3xl font-bold text-indigo-300">{activeMembers}</p>
      </div>
      <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
        <p className="text-sm text-gray-400">Visiteurs actifs</p>
        <p className="mt-1 text-3xl font-bold text-emerald-300">{activeGuests}</p>
      </div>
      <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
        <p className="text-sm text-gray-400">Pays représentés</p>
        <p className="mt-1 text-3xl font-bold text-cyan-300">{countriesRepresented}</p>
      </div>
      <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
        <p className="text-sm text-gray-400">Dernier heartbeat</p>
        <p className="mt-2 text-sm font-semibold text-gray-200">
          {latestHeartbeatAt ? new Date(latestHeartbeatAt).toLocaleTimeString("fr-FR") : "N/A"}
        </p>
      </div>
    </div>
  );
}
