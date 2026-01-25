"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Info, Users, ClipboardList, Star, Calendar, ShoppingCart, FileText, ArrowRight, Clock, Database, Settings, TestTube } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";

interface AlertCard {
  id: string;
  title: string;
  description: string;
  count: number;
  href: string;
  type: "warning" | "info";
}

interface QuickLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface ActivityItem {
  id: string;
  type: "member" | "spotlight" | "event" | "evaluation";
  action: string;
  target: string;
  timestamp: string;
}

// Configuration des alertes (structure, les compteurs seront remplis dynamiquement)
const alertsConfig: Omit<AlertCard, 'count'>[] = [
  {
    id: "incomplete-accounts",
    title: "Comptes incomplets",
    description: "Membres avec des informations manquantes",
    href: "/admin/membres/incomplets",
    type: "warning",
  },
  {
    id: "errors",
    title: "Erreurs & incohérences",
    description: "Données incohérentes à vérifier",
    href: "/admin/membres/erreurs",
    type: "warning",
  },
  {
    id: "pending-integrations",
    title: "Intégrations en attente",
    description: "Nouveaux membres à intégrer",
    href: "/admin/evaluations",
    type: "info",
  },
  {
    id: "spotlight-pending",
    title: "Spotlights à valider",
    description: "Spotlights nécessitant une action",
    href: "/admin/spotlight/gestion",
    type: "info",
  },
];

const quickLinks: QuickLink[] = [
  {
    href: "/admin/membres",
    label: "Membres",
    icon: <Users className="w-6 h-6" />,
    description: "Gestion des membres",
  },
  {
    href: "/admin/evaluations",
    label: "Intégration",
    icon: <ClipboardList className="w-6 h-6" />,
    description: "Intégration des nouveaux membres",
  },
  {
    href: "/admin/evaluation",
    label: "Évaluation mensuelle",
    icon: <FileText className="w-6 h-6" />,
    description: "Suivi des évaluations",
  },
  {
    href: "/admin/spotlight",
    label: "Spotlight",
    icon: <Star className="w-6 h-6" />,
    description: "Gestion des spotlights",
  },
  {
    href: "/admin/events",
    label: "Événements",
    icon: <Calendar className="w-6 h-6" />,
    description: "Événements communautaires",
  },
  {
    href: "/admin/boutique",
    label: "Boutique",
    icon: <ShoppingCart className="w-6 h-6" />,
    description: "Boutique des points",
  },
  {
    href: "/admin/logs",
    label: "Logs",
    icon: <FileText className="w-6 h-6" />,
    description: "Historique des actions",
  },
];

// Pages utilitaires (migration, tests, etc.)
const utilityPages: QuickLink[] = [
  {
    href: "/admin/migration/events",
    label: "Migration Événements",
    icon: <Database className="w-6 h-6" />,
    description: "Migrer les événements depuis Blobs vers Supabase",
  },
  {
    href: "/admin/migration/evaluations",
    label: "Migration Évaluations",
    icon: <Database className="w-6 h-6" />,
    description: "Migrer les évaluations depuis Blobs vers Supabase",
  },
  {
    href: "/admin/system-test",
    label: "Tests Système",
    icon: <TestTube className="w-6 h-6" />,
    description: "Tests de connexion et vérification système",
  },
  {
    href: "/admin/log-center",
    label: "Centre de Logs",
    icon: <FileText className="w-6 h-6" />,
    description: "Logs structurés et détaillés",
  },
  {
    href: "/admin/logs-structured",
    label: "Logs Structurés",
    icon: <FileText className="w-6 h-6" />,
    description: "Visualisation des logs structurés",
  },
  {
    href: "/admin/migration/follows",
    label: "Migration Follows",
    icon: <Database className="w-6 h-6" />,
    description: "Migrer les validations de follow depuis Blobs vers Supabase",
  },
];


function AlertCard({ alert }: { alert: AlertCard }) {
  const isWarning = alert.type === "warning";
  
  return (
    <div
      className="control-center-alert-card rounded-lg border p-6 transition-all duration-200 hover:shadow-lg"
      style={{
        backgroundColor: 'var(--color-card)',
        borderColor: isWarning ? '#f59e0b' : '#6366f1',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = isWarning 
          ? '0 10px 25px rgba(245, 158, 11, 0.2)' 
          : '0 10px 25px rgba(99, 102, 241, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {isWarning ? (
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          ) : (
            <Info className="w-6 h-6 text-indigo-500" />
          )}
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              {alert.title}
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {alert.description}
            </p>
          </div>
        </div>
              <div
                className="px-3 py-1 rounded-full text-sm font-bold"
                style={{
                  backgroundColor: isWarning ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  color: isWarning ? '#f59e0b' : '#6366f1',
                }}
              >
                {alert.count}
              </div>
      </div>
      <Link
        href={alert.href}
        className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
        style={{ color: 'var(--color-primary)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        Voir <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function QuickLinkCard({ link }: { link: QuickLink }) {
  return (
    <Link
      href={link.href}
      className="control-center-quick-link rounded-lg border p-6 transition-all duration-200 group"
      style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary)';
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(145, 70, 255, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="p-3 rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-primary)',
          }}
        >
          {link.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1 transition-colors" style={{ color: 'var(--color-text)' }}>
            {link.label}
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {link.description}
          </p>
        </div>
          <ArrowRight 
            className="w-5 h-5 control-center-arrow transition-transform" 
            style={{ 
              color: 'var(--color-text-secondary)',
            }}
          />
      </div>
    </Link>
  );
}

function ActivityItem({ activity }: { activity: ActivityItem }) {
  const getActivityIcon = () => {
    switch (activity.type) {
      case "member":
        return <Users className="w-4 h-4" />;
      case "spotlight":
        return <Star className="w-4 h-4" />;
      case "event":
        return <Calendar className="w-4 h-4" />;
      case "evaluation":
        return <FileText className="w-4 h-4" />;
    }
  };

  const getActivityColor = () => {
    switch (activity.type) {
      case "member":
        return '#3b82f6';
      case "spotlight":
        return '#f59e0b';
      case "event":
        return '#10b981';
      case "evaluation":
        return '#8b5cf6';
    }
  };

  return (
    <div
      className="flex items-center gap-4 py-3 border-b transition-colors last:border-b-0"
      style={{
        borderColor: 'var(--color-border)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-surface)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div
        className="p-2 rounded-lg"
        style={{
          backgroundColor: `${getActivityColor()}20`,
          color: getActivityColor(),
        }}
      >
        {getActivityIcon()}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            {activity.action}
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
            {activity.target}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Clock className="w-3 h-3" style={{ color: 'var(--color-text-secondary)' }} />
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {activity.timestamp}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ControlCenterPage() {
  const [alerts, setAlerts] = useState<AlertCard[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Charger les alertes
        const alertsResponse = await fetch("/api/admin/control-center/alerts", {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          
          // Construire les alertes avec les compteurs réels
          const alertsWithCounts: AlertCard[] = alertsConfig.map(config => {
            let count: number = 0;
            
            switch (config.id) {
              case "incomplete-accounts":
                count = typeof alertsData.incompleteAccounts === 'number' ? alertsData.incompleteAccounts : 0;
                break;
              case "errors":
                count = typeof alertsData.errors === 'number' ? alertsData.errors : 0;
                break;
              case "spotlight-pending":
                count = typeof alertsData.spotlightsPending === 'number' ? alertsData.spotlightsPending : 0;
                break;
              case "pending-integrations":
                // Pour l'instant, on ne peut pas compter les intégrations en attente facilement
                // On affiche 0 si non disponible
                count = 0; // TODO: Implémenter si possible
                break;
              default:
                count = 0;
            }

            return {
              ...config,
              count,
            };
          });

          setAlerts(alertsWithCounts);
        }

        // Charger les activités
        const activitiesResponse = await fetch("/api/admin/control-center/activities", {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          setActivities(activitiesData.activities || []);
        }
      } catch (error) {
        console.error("Error loading control center data:", error);
        // En cas d'erreur, utiliser des valeurs par défaut
        setAlerts(alertsConfig.map(config => ({ ...config, count: 0 })));
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <AdminHeader
        title="📌 Centre de contrôle"
        navLinks={[
          { href: "/admin/dashboard", label: "Tableau de bord" },
          { href: "/admin/control-center", label: "Centre de contrôle", active: true },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Section Alertes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
            Alertes à traiter
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {alertsConfig.map((config) => (
                <div
                  key={config.id}
                  className="rounded-lg border p-6 animate-pulse"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    height: '150px',
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </section>

        {/* Section Raccourcis */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
            Raccourcis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {quickLinks.map((link) => (
              <QuickLinkCard key={link.href} link={link} />
            ))}
          </div>
        </section>

        {/* Section Pages Utilitaires */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
            Pages Utilitaires
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Pages de migration, tests et outils techniques
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {utilityPages.map((link) => (
              <QuickLinkCard key={link.href} link={link} />
            ))}
          </div>
        </section>

        {/* Section Dernières activités */}
        <section>
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
            Dernières activités
          </h2>
          <div
            className="rounded-lg border overflow-hidden"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)',
            }}
          >
            {loading ? (
              <div className="p-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 py-3 border-b last:border-b-0 animate-pulse"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-700" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded w-48 mb-2" />
                      <div className="h-3 bg-gray-700 rounded w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length > 0 ? (
              <div className="p-6">
                {activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                <p className="text-sm">Aucune activité récente</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
