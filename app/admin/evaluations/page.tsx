"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EvaluationsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers le mois en cours
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    router.replace(`/admin/evaluations/${year}-${month}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400">Redirection...</p>
      </div>
    </div>
  );
}

