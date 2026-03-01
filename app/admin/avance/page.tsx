"use client";

import { useEffect } from "react";

const ADMIN_MODE_COOKIE = "admin_mode";
const COOKIE_MAX_AGE_DAYS = 7;

export default function AdminAvanceRedirectPage() {
  useEffect(() => {
    async function handleRedirect() {
      try {
        const res = await fetch("/api/admin/advanced-access?check=1", { cache: "no-store" });
        if (!res.ok) {
          window.location.href = "/admin/dashboard";
          return;
        }
        const data = await res.json();
        if (!data.canAccessAdvanced) {
          window.location.href = "/admin/dashboard";
          return;
        }
        const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
        document.cookie = `${ADMIN_MODE_COOKIE}=advanced; path=/; max-age=${maxAge}; SameSite=Lax`;
        window.location.href = "/admin/dashboard";
      } catch (e) {
        console.error("[Admin Avance] Erreur:", e);
        window.location.href = "/admin/dashboard";
      }
    }
    handleRedirect();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2" style={{ borderColor: "var(--color-primary)" }} />
        <p style={{ color: "var(--color-text-secondary)" }}>Activation de l'admin avancé...</p>
      </div>
    </div>
  );
}
