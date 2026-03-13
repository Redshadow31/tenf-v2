"use client";

interface RealtimeCountry {
  country: string;
  countryCode: string;
  active: number;
  members: number;
  guests: number;
}

export default function RealtimeCountryDistribution({
  countries,
  total,
}: {
  countries: RealtimeCountry[];
  total: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#2a2a2d] bg-[#1a1a1d]">
      <div className="border-b border-[#2a2a2d] px-4 py-3">
        <h3 className="text-lg font-semibold text-white">Répartition active par pays</h3>
      </div>
      <div className="max-h-[320px] overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-[#121216] text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3">Pays</th>
              <th className="px-4 py-3 text-right">Actifs</th>
              <th className="px-4 py-3 text-right">Membres</th>
              <th className="px-4 py-3 text-right">Visiteurs</th>
              <th className="px-4 py-3 text-right">% total</th>
            </tr>
          </thead>
          <tbody>
            {countries.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-center text-gray-400" colSpan={5}>
                  Aucun pays actif.
                </td>
              </tr>
            ) : (
              countries.map((country) => {
                const percentage = total > 0 ? (country.active / total) * 100 : 0;
                return (
                  <tr key={country.countryCode} className="border-t border-[#26262c] text-gray-200">
                    <td className="px-4 py-3">
                      {country.country} <span className="text-xs text-gray-500">({country.countryCode})</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{country.active}</td>
                    <td className="px-4 py-3 text-right text-indigo-300">{country.members}</td>
                    <td className="px-4 py-3 text-right text-emerald-300">{country.guests}</td>
                    <td className="px-4 py-3 text-right">{percentage.toFixed(1)}%</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
