"use client";

import { useEffect, useState } from "react";

const MOBILE_PUBLIC_MQ = "(max-width: 1279px)";
const MOBILE_ADMIN_MQ = "(max-width: 1023px)";

function subscribeMediaQuery(query: string, onChange: (matches: boolean) => void) {
  const mediaQuery = window.matchMedia(query);
  const handleChange = (event: MediaQueryListEvent) => onChange(event.matches);
  onChange(mediaQuery.matches);
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }
  mediaQuery.addListener(handleChange);
  return () => mediaQuery.removeListener(handleChange);
}

/** Viewport mobile public (breakpoint xl, aligné sur le header). */
export function useMobilePublicViewport() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(MOBILE_PUBLIC_MQ).matches;
  });

  useEffect(() => subscribeMediaQuery(MOBILE_PUBLIC_MQ, setIsMobile), []);

  return isMobile;
}

/** Viewport mobile admin (breakpoint lg, aligné sur la sidebar admin). */
export function useMobileAdminViewport() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(MOBILE_ADMIN_MQ).matches;
  });

  useEffect(() => subscribeMediaQuery(MOBILE_ADMIN_MQ, setIsMobile), []);

  return isMobile;
}
