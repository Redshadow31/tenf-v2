export type EventLocationLink = {
  id: string;
  name: string;
  url: string;
  isActive?: boolean;
};

export type EventLocationDisplay = {
  url: string;
  label: string;
  source: "discord_link" | "twitch_channel" | "external_link";
};

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeLocationUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    const protocol = parsed.protocol.toLowerCase();
    const host = parsed.host.toLowerCase();
    const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${protocol}//${host}${pathname}`;
  } catch {
    return null;
  }
}

export function getTwitchChannelFromUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    if (host !== "www.twitch.tv" && host !== "twitch.tv") {
      return null;
    }

    const [firstSegment] = parsed.pathname.split("/").filter(Boolean);
    if (!firstSegment) return null;

    if (["directory", "downloads", "settings", "search", "jobs"].includes(firstSegment.toLowerCase())) {
      return null;
    }

    return firstSegment;
  } catch {
    return null;
  }
}

export function buildEventLocationDisplay(
  locationUrl?: string,
  knownLinks: EventLocationLink[] = []
): EventLocationDisplay | null {
  if (!locationUrl) return null;
  const trimmed = locationUrl.trim();
  if (!trimmed) return null;
  if (!isValidHttpUrl(trimmed)) return null;

  const normalized = normalizeLocationUrl(trimmed);

  if (normalized) {
    const matched = knownLinks.find((item) => {
      const itemNormalized = normalizeLocationUrl(item.url);
      return itemNormalized && itemNormalized === normalized && item.isActive !== false;
    });

    if (matched) {
      return {
        url: trimmed,
        label: matched.name,
        source: "discord_link",
      };
    }
  }

  const twitchChannel = getTwitchChannelFromUrl(trimmed);
  if (twitchChannel) {
    return {
      url: trimmed,
      label: `Chaine de ${twitchChannel}`,
      source: "twitch_channel",
    };
  }

  return {
    url: trimmed,
    label: "Lien externe",
    source: "external_link",
  };
}
