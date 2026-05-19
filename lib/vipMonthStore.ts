import fs from "fs";
import path from "path";

export interface VipMonthData {
  month: string;
  vipLogins: string[];
  savedAt: string;
  savedBy?: string;
}

const STORE_NAME = "tenf-vip-month";

function isNetlify(): boolean {
  return !!process.env.NETLIFY || !!process.env.NETLIFY_DEV;
}

async function getVipMonthStore() {
  try {
    if (isNetlify()) {
      const { getStore } = await import("@netlify/blobs");
      return getStore(STORE_NAME);
    }
  } catch {
    /* local fallback */
  }
  return null;
}

/** Mois courant au format YYYY-MM (fuseau serveur). */
export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Lit les logins VIP enregistrés pour un mois (blob Netlify ou fichier local).
 * Source de vérité après « Enregistrer VIP du mois » côté admin.
 */
export async function readVipMonthLogins(month: string): Promise<string[]> {
  if (!month.match(/^\d{4}-\d{2}$/)) return [];

  try {
    const store = await getVipMonthStore();
    let vipMonthData: VipMonthData | null = null;

    if (store) {
      const data = await store.get(`${month}.json`, { type: "json" }).catch(() => null);
      vipMonthData = data as VipMonthData | null;
    } else {
      const filePath = path.join(process.cwd(), "data", "vip-month", `${month}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        vipMonthData = JSON.parse(content) as VipMonthData;
      }
    }

    if (!vipMonthData?.vipLogins?.length) return [];
    return vipMonthData.vipLogins.map((login) => login.toLowerCase().trim()).filter(Boolean);
  } catch (error) {
    console.error(`[vipMonthStore] readVipMonthLogins(${month}):`, error);
    return [];
  }
}

export async function writeVipMonthData(data: VipMonthData): Promise<void> {
  const store = await getVipMonthStore();
  const payload = {
    ...data,
    vipLogins: data.vipLogins.map((login) => login.toLowerCase().trim()).filter(Boolean),
  };

  if (store) {
    await store.set(`${data.month}.json`, JSON.stringify(payload, null, 2));
    return;
  }

  const dataDir = path.join(process.cwd(), "data", "vip-month");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(path.join(dataDir, `${data.month}.json`), JSON.stringify(payload, null, 2), "utf-8");
}
