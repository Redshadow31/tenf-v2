import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const PARIS_TIMEZONE = "Europe/Paris";

export function getBrowserTimezone(): string {
  try {
    if (typeof Intl === "undefined" || !Intl.DateTimeFormat) return PARIS_TIMEZONE;
    return Intl.DateTimeFormat().resolvedOptions().timeZone || PARIS_TIMEZONE;
  } catch {
    return PARIS_TIMEZONE;
  }
}

export function parisLocalDateTimeToUtcIso(parisLocalDateTime: string): string {
  // Input attendu: yyyy-MM-dd'T'HH:mm (depuis <input type="datetime-local">)
  const utcDate = fromZonedTime(parisLocalDateTime, PARIS_TIMEZONE);
  return utcDate.toISOString();
}

export function utcIsoToParisDateTimeLocalInput(utc: string | Date): string {
  const date = typeof utc === "string" ? new Date(utc) : utc;
  return formatInTimeZone(date, PARIS_TIMEZONE, "yyyy-MM-dd'T'HH:mm");
}

export function formatEventDateTimeInTimezone(
  utc: string | Date,
  timezone: string,
  locale: string = "fr-FR"
): { dateLabel: string; timeLabel: string; fullLabel: string } {
  const date = typeof utc === "string" ? new Date(utc) : utc;
  const dateLabel = date.toLocaleDateString(locale, {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeLabel = date.toLocaleTimeString(locale, {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    dateLabel: dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1),
    timeLabel,
    fullLabel: `${dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)} • ${timeLabel}`,
  };
}

export function formatParisHour(utc: string | Date): string {
  const date = typeof utc === "string" ? new Date(utc) : utc;
  return formatInTimeZone(date, PARIS_TIMEZONE, "HH:mm");
}

