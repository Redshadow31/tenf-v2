import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { getBlobStore } from "@/lib/memberData";

const ACCESS_STORE = "tenf-admin-access";
const ACCESS_KEY = "admin-access-list";

function sanitizeAdminAlias(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return null;
  return normalized.slice(0, 40);
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const store = getBlobStore(ACCESS_STORE);
    const raw = await store.get(ACCESS_KEY);
    if (!raw) {
      return NextResponse.json({ adminAlias: null });
    }

    const parsed = JSON.parse(raw) as Array<{ discordId?: string; adminAlias?: string }>;
    const current = parsed.find((entry) => String(entry?.discordId || "") === admin.discordId);
    return NextResponse.json({ adminAlias: sanitizeAdminAlias(current?.adminAlias) });
  } catch (error) {
    console.error("[Admin Access Self] Impossible de charger le pseudo admin:", error);
    return NextResponse.json({ adminAlias: null });
  }
}
