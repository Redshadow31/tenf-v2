import { getVipHistoryByMonth } from "@/lib/vipHistory";
import { getCurrentMonthKey, readVipMonthLogins } from "@/lib/vipMonthStore";
import { vipRepository } from "@/lib/repositories";

/**
 * Résout la liste des logins VIP du mois (ordre de priorité aligné avec l’admin).
 * 1. Blob / fichier vip-month (après « Enregistrer VIP du mois »)
 * 2. Fichier data/vip-history.json
 * 3. Table Supabase vip_history
 */
export async function resolveMonthVipLogins(month?: string): Promise<string[]> {
  const monthKey = month && month.match(/^\d{4}-\d{2}$/) ? month : getCurrentMonthKey();

  const fromBlob = await readVipMonthLogins(monthKey);
  if (fromBlob.length > 0) {
    return fromBlob;
  }

  const byMonth = getVipHistoryByMonth();
  const fromFile = byMonth[monthKey] || [];
  if (fromFile.length > 0) {
    return fromFile.map((l) => l.toLowerCase());
  }

  const fromDb = await vipRepository.findByMonth(monthKey);
  return fromDb.map((e) => e.twitchLogin.toLowerCase()).filter(Boolean);
}
