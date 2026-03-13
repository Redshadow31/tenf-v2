import { createHash } from "crypto";
import { NextRequest } from "next/server";

function firstValue(value: string | null): string | null {
  if (!value) return null;
  return value.split(",")[0]?.trim() || null;
}

export function getClientIp(request: NextRequest): string | null {
  return (
    firstValue(request.headers.get("x-forwarded-for")) ||
    firstValue(request.headers.get("x-real-ip")) ||
    firstValue(request.headers.get("cf-connecting-ip")) ||
    null
  );
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
