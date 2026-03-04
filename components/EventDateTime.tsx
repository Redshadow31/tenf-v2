"use client";

import { useMemo } from "react";
import {
  PARIS_TIMEZONE,
  formatEventDateTimeInTimezone,
  formatParisHour,
  getBrowserTimezone,
} from "@/lib/timezone";

type EventDateTimeProps = {
  startUtc: string;
  endUtc?: string;
  className?: string;
  showTimezoneLabel?: boolean;
};

export default function EventDateTime({
  startUtc,
  className = "",
  showTimezoneLabel = true,
}: EventDateTimeProps) {
  const timezone = useMemo(() => getBrowserTimezone(), []);
  const local = useMemo(
    () => formatEventDateTimeInTimezone(startUtc, timezone, "fr-FR"),
    [startUtc, timezone]
  );
  const parisHour = useMemo(() => formatParisHour(startUtc), [startUtc]);
  const isParisViewer = timezone === PARIS_TIMEZONE;

  return (
    <div className={className}>
      <p>{local.fullLabel}</p>
      {showTimezoneLabel && (
        <p className="text-xs text-gray-400 mt-1">
          {isParisViewer ? "Heure de Paris" : `Heure affichée: ${timezone}`}
        </p>
      )}
      {!isParisViewer && (
        <p className="text-xs text-gray-500">Heure de Paris : {parisHour}</p>
      )}
    </div>
  );
}

