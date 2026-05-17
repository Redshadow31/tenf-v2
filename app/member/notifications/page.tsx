"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import NotificationsHeader from "@/components/member/notifications/NotificationsHeader";
import NotificationsTabs, { type AudienceTabKey } from "@/components/member/notifications/NotificationsTabs";
import NotificationsAside from "@/components/member/notifications/NotificationsAside";
import NotificationsFilters, {
  type CategoryFilter,
  type ReadStateFilter,
} from "@/components/member/notifications/NotificationsFilters";
import NotificationActionPanel from "@/components/member/notifications/NotificationActionPanel";
import NotificationsBucketGroup from "@/components/member/notifications/NotificationsBucketGroup";
import NotificationsEmptyState from "@/components/member/notifications/NotificationsEmptyState";
import NotificationsErrorState from "@/components/member/notifications/NotificationsErrorState";
import NotificationsLoadingSkeleton from "@/components/member/notifications/NotificationsLoadingSkeleton";
import NotificationsLightbox from "@/components/member/notifications/NotificationsLightbox";
import type { NotificationItem } from "@/components/member/notifications/types";
import { classifyNotification, type NotificationCategoryUI } from "@/lib/notifications/classification";
import { getTimeBucket, TIME_BUCKET_LABELS, TIME_BUCKET_ORDER, type TimeBucketKey } from "@/lib/notifications/grouping";

type LightboxState = { src: string; title: string } | null;

type DecoratedItem = NotificationItem & {
  _audienceUI: "personal" | "community" | "staff";
  _category: NotificationCategoryUI;
  _actionable: boolean;
};

function decorate(items: NotificationItem[]): DecoratedItem[] {
  return items.map((n) => {
    const desc = classifyNotification(n);
    return { ...n, _audienceUI: desc.audience, _category: desc.category, _actionable: desc.actionable };
  });
}

export default function MemberNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [markAllPending, setMarkAllPending] = useState(false);

  const [audienceTab, setAudienceTab] = useState<AudienceTabKey>("all");
  const [readState, setReadState] = useState<ReadStateFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");

  const [lightbox, setLightbox] = useState<LightboxState>(null);

  const notifySidebarRefresh = useCallback(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("member-notifications-refresh"));
  }, []);

  const broadcastUnreadCount = useCallback((count: number) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("member-notifications-count", { detail: { count } }));
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/members/me/notifications", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setHasAdminAccess(Boolean(data?.hasAdminAccess));
      const list: NotificationItem[] = Array.isArray(data?.notifications) ? data.notifications : [];
      setNotifications(list);
      broadcastUnreadCount(list.filter((n) => !n.isRead).length);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error("[member/notifications] load error:", err);
      setError(detail);
      setNotifications([]);
      setHasAdminAccess(false);
    } finally {
      setLoading(false);
    }
  }, [broadcastUnreadCount]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const target = notifications.find((n) => n.id === notificationId);
      if (!target || target.isRead) return;

      setPendingId(notificationId);
      const next = notifications.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n));
      setNotifications(next);
      broadcastUnreadCount(next.filter((n) => !n.isRead).length);

      try {
        const response = await fetch("/api/members/me/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data?.notifications)) {
          setNotifications(data.notifications);
          broadcastUnreadCount(data.notifications.filter((n: NotificationItem) => !n.isRead).length);
        }
        notifySidebarRefresh();
      } catch (err) {
        console.error("[member/notifications] mark read error:", err);
        setNotifications(notifications);
        broadcastUnreadCount(notifications.filter((n) => !n.isRead).length);
      } finally {
        setPendingId(null);
      }
    },
    [notifications, broadcastUnreadCount, notifySidebarRefresh],
  );

  const markAllAsRead = useCallback(async () => {
    if (markAllPending) return;
    setMarkAllPending(true);
    const previous = notifications;
    const optimistic = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(optimistic);
    broadcastUnreadCount(0);
    try {
      const response = await fetch("/api/members/me/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data?.notifications)) {
        setNotifications(data.notifications);
        broadcastUnreadCount(data.notifications.filter((n: NotificationItem) => !n.isRead).length);
      }
      notifySidebarRefresh();
    } catch (err) {
      console.error("[member/notifications] mark all read error:", err);
      setNotifications(previous);
      broadcastUnreadCount(previous.filter((n) => !n.isRead).length);
    } finally {
      setMarkAllPending(false);
    }
  }, [notifications, broadcastUnreadCount, notifySidebarRefresh, markAllPending]);

  const decorated = useMemo(() => decorate(notifications), [notifications]);

  const counts = useMemo(() => {
    let total = 0;
    let unread = 0;
    let personalCount = 0;
    let personalUnread = 0;
    let communityCount = 0;
    let communityUnread = 0;
    let staffCount = 0;
    let staffUnread = 0;
    const availableCategories = new Set<NotificationCategoryUI>();

    for (const n of decorated) {
      total += 1;
      if (!n.isRead) unread += 1;
      availableCategories.add(n._category);
      if (n._audienceUI === "personal") {
        personalCount += 1;
        if (!n.isRead) personalUnread += 1;
      } else if (n._audienceUI === "community") {
        communityCount += 1;
        if (!n.isRead) communityUnread += 1;
      } else if (n._audienceUI === "staff") {
        staffCount += 1;
        if (!n.isRead) staffUnread += 1;
      }
    }

    return {
      total,
      unread,
      personalCount,
      personalUnread,
      communityCount,
      communityUnread,
      staffCount,
      staffUnread,
      availableCategories: Array.from(availableCategories),
    };
  }, [decorated]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return decorated.filter((n) => {
      if (audienceTab === "personal" && n._audienceUI !== "personal") return false;
      if (audienceTab === "community" && n._audienceUI !== "community") return false;
      if (audienceTab === "staff" && n._audienceUI !== "staff") return false;
      if (readState === "unread" && n.isRead) return false;
      if (readState === "read" && !n.isRead) return false;
      if (category !== "all" && n._category !== category) return false;
      if (q && !n.title.toLowerCase().includes(q) && !n.message.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [decorated, audienceTab, readState, category, query]);

  const actionItems = useMemo(
    () => filtered.filter((n) => n._actionable && !n.isRead).slice(0, 6),
    [filtered],
  );

  const grouped = useMemo(() => {
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    const actionIds = new Set(actionItems.map((n) => n.id));
    const remaining = sorted.filter((n) => !actionIds.has(n.id));
    const buckets: Record<TimeBucketKey, NotificationItem[]> = { today: [], week: [], older: [] };
    for (const n of remaining) buckets[getTimeBucket(n.updatedAt)].push(n);
    return buckets;
  }, [filtered, actionItems]);

  const handleResetFilters = useCallback(() => {
    setAudienceTab("all");
    setReadState("all");
    setCategory("all");
    setQuery("");
  }, []);

  const filtersActive = audienceTab !== "all" || readState !== "all" || category !== "all" || query.trim().length > 0;

  const renderListContent = () => {
    if (filtered.length === 0) {
      if (audienceTab === "staff" && counts.staffCount === 0) {
        return <NotificationsEmptyState variant="no-staff" />;
      }
      if (filtersActive) {
        return <NotificationsEmptyState variant="filter-empty" onResetFilters={handleResetFilters} />;
      }
      if (counts.total > 0 && counts.unread === 0) {
        return <NotificationsEmptyState variant="all-read" />;
      }
      return <NotificationsEmptyState variant="no-notifications" />;
    }

    return (
      <>
        <NotificationActionPanel
          items={actionItems}
          pendingId={pendingId}
          onMarkRead={markAsRead}
          onOpenImage={(src, title) => setLightbox({ src, title })}
        />
        <div className="space-y-5">
          {TIME_BUCKET_ORDER.map((bucket) => (
            <NotificationsBucketGroup
              key={bucket}
              title={TIME_BUCKET_LABELS[bucket]}
              items={grouped[bucket]}
              pendingId={pendingId}
              onMarkRead={markAsRead}
              onOpenImage={(src, title) => setLightbox({ src, title })}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <MemberSurface layout="fluid" wide>
      <NotificationsHeader
        total={counts.total}
        unread={counts.unread}
        onMarkAll={() => void markAllAsRead()}
        markAllPending={markAllPending}
      />

      {error ? (
        <NotificationsErrorState onRetry={() => void loadNotifications()} detail={error} />
      ) : null}

      {loading ? (
        <NotificationsLoadingSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-[clamp(0.65rem,1.25vw,2rem)] lg:grid-cols-[minmax(0,1fr)_clamp(15rem,min(28vw,28rem))] lg:items-start xl:gap-[clamp(0.85rem,1.5vw,2.25rem)]">
          <main id="notifications-list" role="tabpanel" aria-label="Notifications affichées" className="min-w-0 space-y-[clamp(0.75rem,1.1vw,1.15rem)]">
            <div
              className="sticky top-2 z-10 rounded-2xl border p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-md sm:top-3"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "color-mix(in srgb, var(--color-card) 82%, transparent)",
              }}
            >
              <NotificationsTabs
                current={audienceTab}
                onChange={setAudienceTab}
                total={counts.total}
                totalUnread={counts.unread}
                personalCount={counts.personalCount}
                personalUnread={counts.personalUnread}
                communityCount={counts.communityCount}
                communityUnread={counts.communityUnread}
                staffCount={counts.staffCount}
                staffUnread={counts.staffUnread}
                showStaff={hasAdminAccess}
              />
            </div>

            <NotificationsFilters
              query={query}
              onQueryChange={setQuery}
              readState={readState}
              onReadStateChange={setReadState}
              category={category}
              onCategoryChange={setCategory}
              availableCategories={counts.availableCategories}
              showReset={filtersActive}
              onReset={handleResetFilters}
            />

            <div className="space-y-[clamp(0.75rem,1.1vw,1.15rem)]">{renderListContent()}</div>
          </main>

          <NotificationsAside
            total={counts.total}
            unread={counts.unread}
            personalCount={counts.personalCount}
            personalUnread={counts.personalUnread}
            communityCount={counts.communityCount}
            communityUnread={counts.communityUnread}
            staffCount={counts.staffCount}
            staffUnread={counts.staffUnread}
            showStaff={hasAdminAccess}
            audienceTab={audienceTab}
            onSelectAudience={setAudienceTab}
          />
        </div>
      )}

      <NotificationsLightbox
        open={Boolean(lightbox)}
        src={lightbox?.src ?? null}
        title={lightbox?.title ?? ""}
        onClose={() => setLightbox(null)}
      />
    </MemberSurface>
  );
}
