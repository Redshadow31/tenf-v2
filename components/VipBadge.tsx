"use client";

import { useState, useEffect } from "react";

interface VipBadgeProps {
  twitchLogin: string;
  className?: string;
}

export default function VipBadge({ twitchLogin, className = "" }: VipBadgeProps) {
  const [badge, setBadge] = useState<string>("VIP");

  useEffect(() => {
    if (!twitchLogin) return;

    async function fetchBadge() {
      try {
        const response = await fetch(`/api/vip-history?action=badge&login=${encodeURIComponent(twitchLogin)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.badge) {
            setBadge(data.badge);
          }
        }
      } catch (error) {
        console.error("Error fetching VIP badge:", error);
      }
    }

    fetchBadge();
  }, [twitchLogin]);

  return (
    <div className={`absolute -bottom-1 -right-1 rounded-full bg-[#9146ff] px-2 py-0.5 text-xs font-bold text-white ${className}`}>
      {badge}
    </div>
  );
}

