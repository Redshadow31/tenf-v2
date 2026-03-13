import { createHash } from "crypto";
import { NextRequest } from "next/server";

function valuesFromHeader(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export type ClientIpGeoReason =
  | "missing_ip"
  | "private_ip"
  | "proxy_ip_only"
  | "provider_no_result"
  | "geolocation_failed"
  | "old_log_without_enrichment";

interface CandidateIp {
  ip: string;
  source: string;
}

function normalizeCandidate(value: string): string | null {
  const cleaned = value.trim().replace(/^\[|\]$/g, "");
  if (!cleaned || cleaned.toLowerCase() === "unknown") return null;
  if (cleaned.includes(":") && cleaned.includes(".")) {
    const maybeV4 = cleaned.split(":").pop() || "";
    return maybeV4 || null;
  }
  return cleaned;
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part) || part < 0 || part > 255)) return true;
  if (parts[0] === 10) return true;
  if (parts[0] === 127) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function isLikelyPublicIp(ip: string): boolean {
  if (ip.includes(".")) return !isPrivateIpv4(ip);
  if (ip.includes(":")) return !isPrivateIpv6(ip);
  return false;
}

function collectCandidates(request: NextRequest): CandidateIp[] {
  const sources: Array<{ header: string; value: string | null }> = [
    { header: "x-nf-client-connection-ip", value: request.headers.get("x-nf-client-connection-ip") },
    { header: "cf-connecting-ip", value: request.headers.get("cf-connecting-ip") },
    { header: "x-forwarded-for", value: request.headers.get("x-forwarded-for") },
    { header: "x-real-ip", value: request.headers.get("x-real-ip") },
    { header: "x-client-ip", value: request.headers.get("x-client-ip") },
    { header: "true-client-ip", value: request.headers.get("true-client-ip") },
    { header: "fastly-client-ip", value: request.headers.get("fastly-client-ip") },
  ];

  const candidates: CandidateIp[] = [];
  for (const source of sources) {
    for (const value of valuesFromHeader(source.value)) {
      const normalized = normalizeCandidate(value);
      if (!normalized) continue;
      candidates.push({ ip: normalized, source: source.header });
    }
  }
  return candidates;
}

export function getClientIpDiagnostics(request: NextRequest): {
  ipAddress: string | null;
  source: string | null;
  reason: ClientIpGeoReason | null;
} {
  const candidates = collectCandidates(request);
  if (candidates.length === 0) {
    return { ipAddress: null, source: null, reason: "missing_ip" };
  }

  const publicCandidate = candidates.find((candidate) => isLikelyPublicIp(candidate.ip));
  if (publicCandidate) {
    return { ipAddress: publicCandidate.ip, source: publicCandidate.source, reason: null };
  }

  const hasProxyChain =
    valuesFromHeader(request.headers.get("x-forwarded-for")).length > 1 ||
    Boolean(request.headers.get("x-forwarded-for")) ||
    Boolean(request.headers.get("x-real-ip"));
  const best = candidates[0];
  return {
    ipAddress: best?.ip || null,
    source: best?.source || null,
    reason: hasProxyChain ? "proxy_ip_only" : "private_ip",
  };
}

export function getClientIp(request: NextRequest): string | null {
  const diagnostics = getClientIpDiagnostics(request);
  return diagnostics.ipAddress;
}

export function getReferer(request: NextRequest): string | null {
  return request.headers.get("referer") || null;
}

export function maskIpAddress(ipAddress: string | null): string | null {
  if (!ipAddress) return null;
  if (ipAddress.includes(":")) {
    const parts = ipAddress.split(":").filter(Boolean);
    if (parts.length <= 2) return "xxxx:xxxx:xxxx:xxxx";
    return `${parts.slice(0, 2).join(":")}:xxxx:xxxx:xxxx`;
  }

  const parts = ipAddress.split(".");
  if (parts.length !== 4) return null;
  return `${parts[0]}.${parts[1]}.xxx.xxx`;
}

export function hashIpAddress(ipAddress: string | null): string | null {
  if (!ipAddress) return null;
  return createHash("sha256").update(ipAddress).digest("hex").slice(0, 24);
}
