import type { ReactNode } from "react";

interface TableCardProps {
  title: string;
  headers: string[];
  children: ReactNode;
  className?: string;
}

export default function TableCard({
  title,
  headers,
  children,
  className = "",
}: TableCardProps) {
  return (
    <div className={`bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 shadow-lg ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className={`text-left py-3 px-4 text-sm font-semibold text-gray-300 ${
                    index === 0 ? "w-1/3" : ""
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}


