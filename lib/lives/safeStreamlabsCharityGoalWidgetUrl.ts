/** URL widget objectif Streamlabs Charity (https + hôte streamlabs + chemin /widgets/). */
export function safeStreamlabsCharityGoalWidgetUrl(raw: string | undefined): string {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return "";
    const host = parsed.hostname.toLowerCase();
    if (host !== "streamlabs.com" && !host.endsWith(".streamlabs.com")) return "";
    if (!parsed.pathname.toLowerCase().includes("/widgets/")) return "";
    // Ne pas utiliser parsed.toString() : la reserialisation peut alterer le token (ex. +, %).
    return trimmed;
  } catch {
    return "";
  }
}
