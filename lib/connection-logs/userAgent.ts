export interface ParsedUserAgent {
  deviceType: "desktop" | "mobile" | "tablet" | "bot" | "unknown";
  browser: string | null;
  os: string | null;
}

export function parseUserAgent(userAgent: string | null): ParsedUserAgent {
  const ua = (userAgent || "").toLowerCase();
  if (!ua) {
    return { deviceType: "unknown", browser: null, os: null };
  }

  const isBot = /bot|crawl|spider|slurp|headless/.test(ua);
  const isTablet = /tablet|ipad/.test(ua);
  const isMobile = !isTablet && /mobile|iphone|android/.test(ua);

  const deviceType: ParsedUserAgent["deviceType"] = isBot
    ? "bot"
    : isTablet
    ? "tablet"
    : isMobile
    ? "mobile"
    : "desktop";

  let browser: string | null = null;
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("opr/") || ua.includes("opera")) browser = "Opera";
  else if (ua.includes("chrome/")) browser = "Chrome";
  else if (ua.includes("firefox/")) browser = "Firefox";
  else if (ua.includes("safari/")) browser = "Safari";

  let os: string | null = null;
  if (ua.includes("windows nt")) os = "Windows";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) os = "iOS";
  else if (ua.includes("mac os x")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";

  return { deviceType, browser, os };
}
