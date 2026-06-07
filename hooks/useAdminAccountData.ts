"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AdminAccountPayload,
  StaffAnnouncementBrief,
  StaffFeedItem,
} from "@/lib/admin/account/adminAccountTypes";

export function useAdminAccountData() {
  const [data, setData] = useState<AdminAccountPayload | null>(null);
  const [staffFeed, setStaffFeed] = useState<StaffFeedItem[]>([]);
  const [staffAnnouncements, setStaffAnnouncements] = useState<StaffAnnouncementBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/me/account", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/auth/login";
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Impossible de charger la fiche.");
      }
      const json = (await res.json()) as AdminAccountPayload;
      setData({
        ...json,
        staffSnapshot: json.staffSnapshot ?? null,
        staffMissions: Array.isArray(json.staffMissions) ? json.staffMissions : [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/me/staff-activity", { cache: "no-store" });
        if (!r.ok || cancelled) return;
        const j = (await r.json()) as { items?: StaffFeedItem[] };
        if (!cancelled) setStaffFeed(Array.isArray(j.items) ? j.items : []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/staff-announcements?audience=staff", { cache: "no-store" });
        if (!r.ok || cancelled) return;
        const j = (await r.json()) as { items?: StaffAnnouncementBrief[] };
        const raw = Array.isArray(j.items) ? j.items : [];
        if (!cancelled) setStaffAnnouncements(raw.slice(0, 6));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    data,
    staffFeed,
    staffAnnouncements,
    loading,
    error,
    reload: load,
  };
}
