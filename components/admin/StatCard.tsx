import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export default function StatCard({ title, children, className = "" }: StatCardProps) {
  return (
    <div className={`bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 shadow-lg ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}


