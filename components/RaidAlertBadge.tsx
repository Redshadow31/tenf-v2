"use client";

import { RaidAlert } from "@/lib/computeRaidStats";

interface RaidAlertBadgeProps {
  alerts: RaidAlert[];
  getMemberDisplayName: (twitchLogin: string) => string;
}

export default function RaidAlertBadge({
  alerts,
  getMemberDisplayName,
}: RaidAlertBadgeProps) {
  if (alerts.length === 0) {
    return null;
  }

  // Grouper les alertes par raider
  const alertsByRaider: Record<string, RaidAlert[]> = {};
  for (const alert of alerts) {
    if (!alertsByRaider[alert.raider]) {
      alertsByRaider[alert.raider] = [];
    }
    alertsByRaider[alert.raider].push(alert);
  }

  // Créer le texte du tooltip
  const tooltipText = Object.entries(alertsByRaider)
    .map(([raider, raiderAlerts]) => {
      const alertsList = raiderAlerts
        .map(
          (a) =>
            `${getMemberDisplayName(a.target)} (${a.count}x)`
        )
        .join(", ");
      return `${getMemberDisplayName(raider)} → ${alertsList}`;
    })
    .join("\n");

  return (
    <div className="relative group">
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-red-900/30 text-red-300 border border-red-700">
        ⚠️ {alerts.length} raid{alerts.length > 1 ? "s" : ""} répété{alerts.length > 1 ? "s" : ""}
      </span>
      {/* Tooltip au survol */}
      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 bg-[#1a1a1d] border border-gray-700 rounded-lg p-3 shadow-lg text-xs text-white">
        <div className="font-semibold mb-2 text-red-300">Alertes de raids répétés (3+):</div>
        <div className="space-y-1 whitespace-pre-line text-gray-300">
          {Object.entries(alertsByRaider).map(([raider, raiderAlerts]) => (
            <div key={raider} className="mb-2">
              <div className="font-semibold text-white">
                {getMemberDisplayName(raider)}:
              </div>
              <div className="ml-2">
                {raiderAlerts.map((alert) => (
                  <div key={alert.target} className="text-gray-400">
                    → {getMemberDisplayName(alert.target)} ({alert.count}x)
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

