"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlanificationRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/admin/events/planification");
  }, [router]);
  
  return (
    <div className="text-white flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
        <p className="text-gray-400">Redirection...</p>
      </div>
    </div>
  );
}
