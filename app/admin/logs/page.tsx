"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentAdmin } from "@/lib/admin";

interface LogEntry {
  adminId: string;
  adminUsername: string;
  action: string;
  target: string;
  details: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
}


export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const response = await fetch("/api/admin/logs?limit=100");
        
        if (!response.ok) {
          if (response.status === 403) {
            setError("Accès refusé. Cette page est réservée aux fondateurs.");
          } else {
            setError("Erreur lors du chargement des logs");
          }
          return;
        }

        const data = await response.json();
        setLogs(data.logs || []);
      } catch (err) {
        console.error("Error fetching logs:", err);
        setError("Erreur lors du chargement des logs");
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white text-xl">Chargement des logs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-400 text-xl">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <h1 className="text-4xl font-bold text-white mb-8">Logs Administratifs</h1>

        {/* Tableau des logs */}
        <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Historique des actions administratives ({logs.length} entrées)
          </h2>
          
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Aucun log disponible</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a2d]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Admin
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Action
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Cible
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Détails
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr
                      key={index}
                      className="border-b border-[#2a2a2d] hover:bg-[#0e0e10] transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-300 text-sm">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">{log.adminUsername}</span>
                          <span className="text-gray-500 text-xs">{log.adminId}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white font-medium">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {log.target}
                      </td>
                      <td className="py-3 px-4">
                        <pre className="text-xs text-gray-400 bg-[#0e0e10] p-2 rounded overflow-x-auto max-w-md">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

