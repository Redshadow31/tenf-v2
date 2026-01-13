"use client";

import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  children: ReactNode;
  loading?: boolean;
}

export default function ChartCard({
  title,
  children,
  loading = false,
}: ChartCardProps) {
  return (
    <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6 flex flex-col min-h-0">
      <h3 className="text-lg font-semibold text-white mb-4 flex-shrink-0">
        {title}
      </h3>
      <div className="flex-1 min-h-0 flex items-center justify-center">
        {loading ? (
          <div className="flex items-center justify-center w-full h-full min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

