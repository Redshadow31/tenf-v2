"use client";

import { useState, useEffect, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { Search, Filter, Download, ChevronRight, X, Copy, RotateCcw } from "lucide-react";

interface AuditLog {
  id: string;
  actorDiscordId: string;
  actorUsername?: string;
  role: string;
  timestamp: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  previousValue?: any;
  newValue?: any;
  reverted: boolean;
  revertedBy?: string;
  revertedAt?: string;
  revertLogId?: string;
  metadata?: Record<string, any>;
}

interface LegacyLog {
  adminId: string;
  adminUsername: string;
  action: string;
  target: string;
  details: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
}

type LogTab = "audit" | "legacy";

export default function LogCenterPage() {
  const [activeTab, setActiveTab] = useState<LogTab>("audit");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [legacyLogs, setLegacyLogs] = useState<LegacyLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | LegacyLog | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  
  // Filtres Audit
  const [auditFilters, setAuditFilters] = useState({
    search: "",
    actorDiscordId: "",
    action: "",
    resourceType: "",
    reverted: "all", // "all" | "true" | "false"
    month: "", // YYYY-MM
  });
  
  // Filtres Legacy
  const [legacyFilters, setLegacyFilters] = useState({
    search: "",
    adminId: "",
    adminUsername: "",
    action: "",
    target: "",
  });
  
  const [auditPage, setAuditPage] = useState(0);
  const [legacyPage, setLegacyPage] = useState(0);
  const [hasMoreAudit, setHasMoreAudit] = useState(true);
  const [hasMoreLegacy, setHasMoreLegacy] = useState(true);
  const LOGS_PER_PAGE = 50;

  const loadAuditLogs = useCallback(async (reset: boolean = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 0 : auditPage;
      
      const params = new URLSearchParams();
      if (auditFilters.actorDiscordId) params.set("actorDiscordId", auditFilters.actorDiscordId);
      if (auditFilters.action) params.set("action", auditFilters.action);
      if (auditFilters.resourceType) params.set("resourceType", auditFilters.resourceType);
      if (auditFilters.reverted !== "all") params.set("reverted", auditFilters.reverted);
      if (auditFilters.month) params.set("month", auditFilters.month);
      params.set("limit", String(LOGS_PER_PAGE));
      params.set("offset", String(currentPage * LOGS_PER_PAGE));

      const response = await fetch(`/api/admin/audit?${params.toString()}`);
      if (!response.ok) throw new Error("Erreur lors du chargement");
      
      const data = await response.json();
      const newLogs = data.logs || [];
      
      if (reset) {
        setAuditLogs(newLogs);
      } else {
        setAuditLogs(prev => [...prev, ...newLogs]);
      }
      
      setHasMoreAudit(data.hasMore === true);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [auditPage, auditFilters]);

  const loadLegacyLogs = useCallback(async (reset: boolean = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 0 : legacyPage;
      
      const params = new URLSearchParams();
      params.set("limit", String(LOGS_PER_PAGE + (currentPage * LOGS_PER_PAGE)));
      
      const response = await fetch(`/api/admin/logs?${params.toString()}`);
      if (!response.ok) throw new Error("Erreur lors du chargement");
      
      const data = await response.json();
      let allLogs = data.logs || [];
      
      // Appliquer les filtres côté client (car l'API ne les supporte pas encore)
      if (legacyFilters.adminId) {
        allLogs = allLogs.filter((log: LegacyLog) => 
          log.adminId.toLowerCase().includes(legacyFilters.adminId.toLowerCase())
        );
      }
      if (legacyFilters.adminUsername) {
        allLogs = allLogs.filter((log: LegacyLog) => 
          log.adminUsername.toLowerCase().includes(legacyFilters.adminUsername.toLowerCase())
        );
      }
      if (legacyFilters.action) {
        allLogs = allLogs.filter((log: LegacyLog) => 
          log.action.toLowerCase().includes(legacyFilters.action.toLowerCase())
        );
      }
      if (legacyFilters.target) {
        allLogs = allLogs.filter((log: LegacyLog) => 
          log.target.toLowerCase().includes(legacyFilters.target.toLowerCase())
        );
      }
      if (legacyFilters.search) {
        const searchLower = legacyFilters.search.toLowerCase();
        allLogs = allLogs.filter((log: LegacyLog) => 
          log.adminUsername.toLowerCase().includes(searchLower) ||
          log.action.toLowerCase().includes(searchLower) ||
          log.target.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.details).toLowerCase().includes(searchLower)
        );
      }
      
      if (reset) {
        setLegacyLogs(allLogs.slice(0, LOGS_PER_PAGE));
      } else {
        const startIndex = (currentPage + 1) * LOGS_PER_PAGE;
        const newLogs = allLogs.slice(startIndex, startIndex + LOGS_PER_PAGE);
        setLegacyLogs(prev => [...prev, ...newLogs]);
      }
      
      setHasMoreLegacy(allLogs.length > (reset ? LOGS_PER_PAGE : (currentPage + 2) * LOGS_PER_PAGE));
    } catch (error) {
      console.error("Error loading legacy logs:", error);
    } finally {
      setLoading(false);
    }
  }, [legacyPage, legacyFilters]);

  function handleLoadMore() {
    if (activeTab === "audit") {
      setAuditPage(p => p + 1);
    } else {
      setLegacyPage(p => p + 1);
    }
  }

  function handleLogClick(log: AuditLog | LegacyLog) {
    setSelectedLog(log);
    setShowDetailDrawer(true);
  }

  function exportLogs(format: "json" | "csv") {
    if (format === "json") {
      const logs = activeTab === "audit" ? auditLogs : legacyLogs;
      const dataStr = JSON.stringify(logs, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `logs-${activeTab}-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
    } else {
      // CSV export
      let csv = "";
      if (activeTab === "audit") {
        csv = "ID,Date,Acteur,Action,Resource Type,Resource ID,Reverted\n";
        auditLogs.forEach((log) => {
          csv += `"${log.id}","${log.timestamp}","${log.actorUsername || log.actorDiscordId}","${log.action}","${log.resourceType}","${log.resourceId || ""}","${log.reverted}"\n`;
        });
      } else {
        csv = "Date,Admin,Action,Target,Details\n";
        legacyLogs.forEach((log) => {
          csv += `"${log.timestamp}","${log.adminUsername}","${log.action}","${log.target}","${JSON.stringify(log.details).replace(/"/g, '""')}"\n`;
        });
      }
      const dataBlob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `logs-${activeTab}-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    // TODO: Afficher un toast de confirmation
  }

  // Filtrer les logs avec la recherche
  const filteredAuditLogs = auditFilters.search
    ? auditLogs.filter(log => {
        const search = auditFilters.search.toLowerCase();
        return (
          log.actorUsername?.toLowerCase().includes(search) ||
          log.actorDiscordId.toLowerCase().includes(search) ||
          log.action.toLowerCase().includes(search) ||
          log.resourceType.toLowerCase().includes(search) ||
          log.resourceId?.toLowerCase().includes(search) ||
          JSON.stringify(log.metadata || {}).toLowerCase().includes(search)
        );
      })
    : auditLogs;

  const filteredLegacyLogs = legacyFilters.search
    ? legacyLogs.filter(log => {
        const search = legacyFilters.search.toLowerCase();
        return (
          log.adminUsername.toLowerCase().includes(search) ||
          log.adminId.toLowerCase().includes(search) ||
          log.action.toLowerCase().includes(search) ||
          log.target.toLowerCase().includes(search) ||
          JSON.stringify(log.details).toLowerCase().includes(search)
        );
      })
    : legacyLogs;

  // Générer la liste des mois disponibles (12 derniers mois)
  const getMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      months.push({ value: monthKey, label: monthLabel });
    }
    return months;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <AdminHeader
        title="📜 Logs & audit"
        navLinks={[
          { href: "/admin/log-center", label: "Log Center", active: true },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Onglets */}
        <div className="mb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === "audit"
                  ? "border-[#9146ff] text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Audit (Founders)
            </button>
            <button
              onClick={() => setActiveTab("legacy")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === "legacy"
                  ? "border-[#9146ff] text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Journal (Legacy)
            </button>
          </div>
        </div>

        {/* Barre d'actions (recherche + filtres + export) */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={activeTab === "audit" ? auditFilters.search : legacyFilters.search}
              onChange={(e) => {
                if (activeTab === "audit") {
                  setAuditFilters({ ...auditFilters, search: e.target.value });
                } else {
                  setLegacyFilters({ ...legacyFilters, search: e.target.value });
                }
              }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          {/* Bouton Export */}
          <div className="flex gap-2">
            <button
              onClick={() => exportLogs("json")}
              className="px-4 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-card-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-card)';
              }}
            >
              <Download className="w-4 h-4 inline mr-2" />
              JSON
            </button>
            <button
              onClick={() => exportLogs("csv")}
              className="px-4 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-card-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-card)';
              }}
            >
              <Download className="w-4 h-4 inline mr-2" />
              CSV
            </button>
          </div>
        </div>

        {/* Filtres selon l'onglet actif */}
        {activeTab === "audit" ? (
          <AuditFilters
            filters={auditFilters}
            onChange={setAuditFilters}
            monthOptions={getMonthOptions()}
          />
        ) : (
          <LegacyFilters
            filters={legacyFilters}
            onChange={setLegacyFilters}
          />
        )}

        {/* Tableau des logs */}
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          {activeTab === "audit" ? (
            <AuditLogTable
              logs={filteredAuditLogs}
              loading={loading}
              onLogClick={handleLogClick}
            />
          ) : (
            <LegacyLogTable
              logs={filteredLegacyLogs}
              loading={loading}
              onLogClick={handleLogClick}
            />
          )}

          {/* Pagination "Charger plus" */}
          {(hasMoreAudit || hasMoreLegacy) && !loading && (
            <div className="p-4 text-center border-t" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={handleLoadMore}
                className="px-6 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Charger plus
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Drawer détail */}
      {showDetailDrawer && selectedLog && (
        <LogDetailDrawer
          log={selectedLog}
          logType={activeTab}
          onClose={() => {
            setShowDetailDrawer(false);
            setSelectedLog(null);
          }}
          onRevert={activeTab === "audit" ? async (logId: string) => {
            try {
              const response = await fetch("/api/admin/audit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ logId }),
              });
              if (response.ok) {
                loadAuditLogs(true);
                setShowDetailDrawer(false);
                alert("Action annulée avec succès");
              }
            } catch (error) {
              alert("Erreur lors de l'annulation");
            }
          } : undefined}
        />
      )}
    </div>
  );
}

// Composant Filtres Audit
function AuditFilters({
  filters,
  onChange,
  monthOptions,
}: {
  filters: {
    search: string;
    actorDiscordId: string;
    action: string;
    resourceType: string;
    reverted: string;
    month: string;
  };
  onChange: (f: {
    search: string;
    actorDiscordId: string;
    action: string;
    resourceType: string;
    reverted: string;
    month: string;
  }) => void;
  monthOptions: Array<{ value: string; label: string }>;
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="mb-6">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
        style={{
          backgroundColor: showFilters ? 'var(--color-primary)' : 'var(--color-card)',
          borderColor: 'var(--color-border)',
          color: showFilters ? 'white' : 'var(--color-text)',
        }}
      >
        <Filter className="w-4 h-4" />
        Filtres
        {showFilters && <ChevronRight className="w-4 h-4 rotate-90" />}
      </button>

      {showFilters && (
        <div
          className="mt-4 p-4 rounded-lg border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Acteur (Discord ID)
            </label>
            <input
              type="text"
              value={filters.actorDiscordId}
              onChange={(e) => onChange({ ...filters, actorDiscordId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Action
            </label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => onChange({ ...filters, action: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Resource Type
            </label>
            <input
              type="text"
              value={filters.resourceType}
              onChange={(e) => onChange({ ...filters, resourceType: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Statut Revert
            </label>
            <select
              value={filters.reverted}
              onChange={(e) => onChange({ ...filters, reverted: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <option value="all">Tous</option>
              <option value="false">Non annulé</option>
              <option value="true">Annulé</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Mois
            </label>
            <select
              value={filters.month}
              onChange={(e) => onChange({ ...filters, month: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <option value="">Tous les mois</option>
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant Filtres Legacy
function LegacyFilters({
  filters,
  onChange,
}: {
  filters: {
    search: string;
    adminId: string;
    adminUsername: string;
    action: string;
    target: string;
  };
  onChange: (f: {
    search: string;
    adminId: string;
    adminUsername: string;
    action: string;
    target: string;
  }) => void;
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="mb-6">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
        style={{
          backgroundColor: showFilters ? 'var(--color-primary)' : 'var(--color-card)',
          borderColor: 'var(--color-border)',
          color: showFilters ? 'white' : 'var(--color-text)',
        }}
      >
        <Filter className="w-4 h-4" />
        Filtres
        {showFilters && <ChevronRight className="w-4 h-4 rotate-90" />}
      </button>

      {showFilters && (
        <div
          className="mt-4 p-4 rounded-lg border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Admin ID
            </label>
            <input
              type="text"
              value={filters.adminId}
              onChange={(e) => onChange({ ...filters, adminId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Admin Username
            </label>
            <input
              type="text"
              value={filters.adminUsername}
              onChange={(e) => onChange({ ...filters, adminUsername: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Action
            </label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => onChange({ ...filters, action: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Target
            </label>
            <input
              type="text"
              value={filters.target}
              onChange={(e) => onChange({ ...filters, target: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Composant Tableau Audit
function AuditLogTable({
  logs,
  loading,
  onLogClick,
}: {
  logs: AuditLog[];
  loading: boolean;
  onLogClick: (log: AuditLog) => void;
}) {
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading && logs.length === 0) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
        Chargement...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
        Aucun log trouvé
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
            <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Date
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Acteur
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Action
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Resource
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Statut
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              className="border-b cursor-pointer transition-colors"
              style={{ borderColor: 'var(--color-border)' }}
              onClick={() => onLogClick(log)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-surface)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <td className="py-3 px-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {formatDate(log.timestamp)}
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {log.actorUsername || "Inconnu"}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {log.role}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 text-sm" style={{ color: 'var(--color-text)' }}>
                {log.action}
              </td>
              <td className="py-3 px-4 text-sm" style={{ color: 'var(--color-text)' }}>
                {log.resourceType}
                {log.resourceId && (
                  <span className="text-xs ml-2" style={{ color: 'var(--color-text-secondary)' }}>
                    ({log.resourceId})
                  </span>
                )}
              </td>
              <td className="py-3 px-4">
                {log.reverted ? (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-900 text-amber-200">
                    Annulé
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-200">
                    Actif
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Composant Tableau Legacy
function LegacyLogTable({
  logs,
  loading,
  onLogClick,
}: {
  logs: LegacyLog[];
  loading: boolean;
  onLogClick: (log: LegacyLog) => void;
}) {
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading && logs.length === 0) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
        Chargement...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
        Aucun log trouvé
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
            <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Date
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Admin
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Action
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Target
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr
              key={index}
              className="border-b cursor-pointer transition-colors"
              style={{ borderColor: 'var(--color-border)' }}
              onClick={() => onLogClick(log)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-surface)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <td className="py-3 px-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {formatDate(log.timestamp)}
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {log.adminUsername}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {log.adminId}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 text-sm" style={{ color: 'var(--color-text)' }}>
                {log.action}
              </td>
              <td className="py-3 px-4 text-sm" style={{ color: 'var(--color-text)' }}>
                {log.target}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Composant Drawer détail
function LogDetailDrawer({
  log,
  logType,
  onClose,
  onRevert,
}: {
  log: AuditLog | LegacyLog;
  logType: LogTab;
  onClose: () => void;
  onRevert?: (logId: string) => Promise<void>;
}) {
  const isAudit = logType === "audit";
  const auditLog = isAudit ? (log as AuditLog) : null;
  const legacyLog = !isAudit ? (log as LegacyLog) : null;

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function formatValue(value: any): string {
    if (value === null || value === undefined) return "null";
    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  async function handleRevert() {
    if (!auditLog || !onRevert) return;
    if (!confirm("Êtes-vous sûr de vouloir annuler cette action ?\n\nCela créera un nouveau log d'audit et restaurera la valeur précédente.")) {
      return;
    }
    await onRevert(auditLog.id);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-t-lg sm:rounded-lg border"
        style={{
          backgroundColor: 'var(--color-card)',
          borderColor: 'var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 p-6 border-b flex items-center justify-between"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Détails du log
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Résumé */}
          <section>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Résumé
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isAudit ? (
                <>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Date:</span>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>{formatDate(auditLog!.timestamp)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Acteur:</span>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>
                      {auditLog!.actorUsername || auditLog!.actorDiscordId}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Rôle:</span>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>{auditLog!.role}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Action:</span>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>{auditLog!.action}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Resource Type:</span>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>{auditLog!.resourceType}</p>
                  </div>
                  {auditLog!.resourceId && (
                    <div>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Resource ID:</span>
                      <p className="mt-1" style={{ color: 'var(--color-text)' }}>{auditLog!.resourceId}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Statut:</span>
                    <p className="mt-1">
                      {auditLog!.reverted ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-900 text-amber-200">
                          Annulé
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-200">
                          Actif
                        </span>
                      )}
                    </p>
                  </div>
                  {auditLog!.reverted && auditLog!.revertedAt && (
                    <div>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Annulé le:</span>
                      <p className="mt-1" style={{ color: 'var(--color-text)' }}>{formatDate(auditLog!.revertedAt)}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Date:</span>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>{formatDate(legacyLog!.timestamp)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Admin:</span>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>{legacyLog!.adminUsername}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{legacyLog!.adminId}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Action:</span>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>{legacyLog!.action}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Target:</span>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>{legacyLog!.target}</p>
                  </div>
                  {legacyLog!.ipAddress && (
                    <div>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>IP Address:</span>
                      <p className="mt-1" style={{ color: 'var(--color-text)' }}>{legacyLog!.ipAddress}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Avant/Après (Audit uniquement) */}
          {isAudit && auditLog && (
            <section>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                Avant / Après
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: '#dc2626',
                  }}
                >
                  <h4 className="text-sm font-semibold mb-2 text-red-400">Avant</h4>
                  <pre className="text-xs overflow-x-auto" style={{ color: 'var(--color-text)' }}>
                    {formatValue(auditLog.previousValue)}
                  </pre>
                </div>
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: '#10b981',
                  }}
                >
                  <h4 className="text-sm font-semibold mb-2 text-green-400">Après</h4>
                  <pre className="text-xs overflow-x-auto" style={{ color: 'var(--color-text)' }}>
                    {formatValue(auditLog.newValue)}
                  </pre>
                </div>
              </div>
            </section>
          )}

          {/* Metadata / Details */}
          <section>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              {isAudit ? "Metadata" : "Details"}
            </h3>
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <pre className="text-xs overflow-x-auto" style={{ color: 'var(--color-text)' }}>
                {JSON.stringify(isAudit ? auditLog!.metadata : legacyLog!.details, null, 2)}
              </pre>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(log, null, 2));
                alert("JSON copié dans le presse-papier");
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-card-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-card)';
              }}
            >
              <Copy className="w-4 h-4" />
              Copier JSON
            </button>

            {isAudit && auditLog && !auditLog.reverted && onRevert && (
              <button
                onClick={handleRevert}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <RotateCcw className="w-4 h-4" />
                Annuler cette action
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
