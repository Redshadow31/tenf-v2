import { createHash } from "crypto";
import { NextRequest } from "next/server";

function valuesFromHeader(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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

function pickBestIp(candidates: string[]): string | null {
  const normalized = candidates.map(normalizeCandidate).filter((value): value is string => Boolean(value));
  const publicIp = normalized.find((ip) => isLikelyPublicIp(ip));
  return publicIp || normalized[0] || null;
}

export function getClientIp(request: NextRequest): string | null {
  const candidates = [
    ...valuesFromHeader(request.headers.get("x-nf-client-connection-ip")),
    ...valuesFromHeader(request.headers.get("cf-connecting-ip")),
    ...valuesFromHeader(request.headers.get("x-forwarded-for")),
    ...valuesFromHeader(request.headers.get("x-real-ip")),
    ...valuesFromHeader(request.headers.get("x-client-ip")),
    ...valuesFromHeader(request.headers.get("true-client-ip")),
    ...valuesFromHeader(request.headers.get("fastly-client-ip")),
  ];
  return pickBestIp(candidates);
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
