"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import Link from "next/link";
import { 
  User, ExternalLink, History, Users, Star, FileText, 
  ChevronDown, ChevronUp, Calendar, Award, MessageSquare,
  Eye, ArrowLeft
} from "lucide-react";
import { getRoleBadgeClasses } from "@/lib/roleColors";

interface Member360Data {
  member: any;
  logs?: any[];
  integrationData?: any;
  engagementData?: any;
  evaluationData?: any;
}

export default function Member360Page() {
  const params = useParams();
  const router = useRouter();
  const memberId = params?.id as string;
  
  const [data, setData] = useState<Member360Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["identity"]));
  const [loadingSections, setLoadingSections] = useState<Set<string>>(new Set());
  const [sectionData, setSectionData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (memberId) {
      loadMemberData();
    }
  }, [memberId]);

  // Lazy load section data when expanded
  useEffect(() => {
    expandedSections.forEach((sectionId) => {
      if (!sectionData[sectionId] && !loadingSections.has(sectionId) && data?.member) {
        loadSectionData(sectionId);
      }
    });
  }, [expandedSections, data?.member]);

  async function loadMemberData() {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/members/${encodeURIComponent(memberId)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Membre non trouvé");
        } else {
          setError("Erreur lors du chargement des données");
        }
        return;
      }

      const result = await response.json();
      setData({ member: result.member });
    } catch (err) {
      console.error("Error loading member:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }

  async function loadSectionData(sectionId: string) {
    if (!memberId) return;
    
    setLoadingSections(prev => new Set(prev).add(sectionId));
    
    try {
      const response = await fetch(`/api/admin/members/${encodeURIComponent(memberId)}/360?section=${sectionId}`);
      if (response.ok) {
        const result = await response.json();
        
        // Merge avec les données existantes
        setData(prev => ({
          ...prev,
          ...(result.logs && { logs: result.logs }),
          ...(result.integration && { integrationData: result.integration }),
          ...(result.engagement && { engagementData: result.engagement }),
          ...(result.evaluations && { evaluationData: result.evaluations }),
        }));
        
        setSectionData(prev => ({
          ...prev,
          [sectionId]: result[sectionId] || result,
        }));
      }
    } catch (err) {
      console.error(`Error loading section ${sectionId}:`, err);
    } finally {
      setLoadingSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(sectionId);
        return newSet;
      });
    }
  }

  function toggleSection(sectionId: string) {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        <AdminHeader title="Fiche Membre 360°" navLinks={[]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white text-xl">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error || !data?.member) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        <AdminHeader title="Fiche Membre 360°" navLinks={[]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-400 text-xl">{error || "Membre non trouvé"}</div>
        </div>
      </div>
    );
  }

  const member = data.member;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <AdminHeader
        title="Fiche Membre 360°"
        navLinks={[
          { href: "/admin/members/gestion", label: "Gestion" },
          { href: "/admin/search", label: "Recherche" },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Bouton retour */}
        <Link
          href="/admin/search"
          className="inline-flex items-center gap-2 mb-6 text-sm transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la recherche
        </Link>

        {/* Header membre */}
        <div
          className="rounded-lg border p-6 mb-6"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {member.discordId ? (
                <img
                  src={`https://cdn.discordapp.com/embed/avatars/${parseInt(member.discordId) % 5}.png`}
                  alt={member.displayName}
                  className="w-20 h-20 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    if ((e.target as HTMLImageElement).nextElementSibling) {
                      (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                    }
                  }}
                />
              ) : null}
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4] flex items-center justify-center text-white text-2xl font-semibold ${member.discordId ? 'hidden' : ''}`}>
                {(member.displayName || member.twitchLogin || '?')[0].toUpperCase()}
              </div>
            </div>

            {/* Infos principales */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {member.siteUsername || member.displayName}
                </h1>
                {member.isVip && (
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-[#9146ff] text-white">
                    VIP
                  </span>
                )}
                {member.role && (
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleBadgeClasses(member.role)}`}>
                    {member.role}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  member.isActive !== false
                    ? "bg-green-900/30 text-green-300"
                    : "bg-red-900/30 text-red-300"
                }`}>
                  {member.isActive !== false ? "Actif" : "Inactif"}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                {member.twitchLogin && (
                  <div className="flex items-center gap-2">
                    <span>Twitch:</span>
                    <a
                      href={member.twitchUrl || `https://www.twitch.tv/${member.twitchLogin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#9146ff] hover:underline"
                    >
                      {member.twitchLogin}
                    </a>
                  </div>
                )}
                {member.discordUsername && (
                  <div className="flex items-center gap-2">
                    <span>Discord:</span>
                    <span className="font-medium">{member.discordUsername}</span>
                    {member.discordId && (
                      <code className="text-xs bg-[#0e0e10] px-2 py-0.5 rounded">
                        {member.discordId}
                      </code>
                    )}
                  </div>
                )}
              </div>

              {member.description && (
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {member.description}
                </p>
              )}

              {/* Actions rapides */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Link
                  href={`/admin/membres/gestion?search=${encodeURIComponent(member.twitchLogin || member.displayName)}`}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
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
                  Modifier dans la gestion
                </Link>
                <Link
                  href={`/admin/membres/historique?search=${encodeURIComponent(member.twitchLogin || member.displayName)}`}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-card)';
                  }}
                >
                  Historique
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Sections en accordéon */}
        <div className="space-y-4">
          {/* A) Identité & rôles */}
          <MemberSectionCard
            id="identity"
            title="Identité & rôles"
            icon={<User className="w-5 h-5" />}
            isExpanded={expandedSections.has("identity")}
            onToggle={() => toggleSection("identity")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  Nom d'affichage
                </label>
                <p style={{ color: 'var(--color-text)' }}>{member.displayName}</p>
              </div>
              {member.siteUsername && (
                <div>
                  <label className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Pseudo site
                  </label>
                  <p style={{ color: 'var(--color-text)' }}>{member.siteUsername}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  Rôle
                </label>
                <p style={{ color: 'var(--color-text)' }}>{member.role || "Non défini"}</p>
              </div>
              {member.roleHistory && member.roleHistory.length > 0 && (
                <div>
                  <label className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Historique des rôles
                  </label>
                  <div className="space-y-1">
                    {member.roleHistory.slice(-5).reverse().map((history: any, idx: number) => (
                      <div key={idx} className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {history.fromRole} → {history.toRole}
                        {history.changedAt && (
                          <span className="ml-2 text-xs">
                            ({new Date(history.changedAt).toLocaleDateString("fr-FR")})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {member.createdAt && (
                <div>
                  <label className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Membre depuis
                  </label>
                  <p style={{ color: 'var(--color-text)' }}>
                    {new Date(member.createdAt).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
              {member.integrationDate && (
                <div>
                  <label className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Date d'intégration
                  </label>
                  <p style={{ color: 'var(--color-text)' }}>
                    {new Date(member.integrationDate).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
              {member.parrain && (
                <div>
                  <label className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Parrain
                  </label>
                  <p style={{ color: 'var(--color-text)' }}>{member.parrain}</p>
                </div>
              )}
            </div>
          </MemberSectionCard>

          {/* B) Historique (logs) */}
          <MemberSectionCard
            id="logs"
            title="Historique des actions"
            icon={<History className="w-5 h-5" />}
            isExpanded={expandedSections.has("logs")}
            onToggle={() => toggleSection("logs")}
            isLoading={loadingSections.has("logs")}
          >
            {loadingSections.has("logs") ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Chargement...</p>
              </div>
            ) : data.logs && data.logs.length > 0 ? (
              <div className="space-y-2">
                {data.logs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border text-sm"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                            {log.action}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded" style={{
                            backgroundColor: 'var(--color-card)',
                            color: 'var(--color-text-secondary)',
                          }}>
                            {log.resourceType}
                          </span>
                          {log.reverted && (
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-900/30 text-amber-300">
                              Annulé
                            </span>
                          )}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          Par {log.actorUsername || log.actorDiscordId} • {new Date(log.timestamp).toLocaleString("fr-FR")}
                        </div>
                      </div>
                      <Link
                        href={`/admin/log-center?search=${encodeURIComponent(log.id)}`}
                        className="text-xs px-2 py-1 rounded transition-colors"
                        style={{
                          backgroundColor: 'var(--color-card)',
                          color: 'var(--color-primary)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-card)';
                        }}
                      >
                        Détails
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>
                Aucun log d'action disponible pour ce membre
              </p>
            )}
          </MemberSectionCard>

          {/* C) Intégration */}
          <MemberSectionCard
            id="integration"
            title="Intégration"
            icon={<Users className="w-5 h-5" />}
            isExpanded={expandedSections.has("integration")}
            onToggle={() => toggleSection("integration")}
            isLoading={loadingSections.has("integration")}
          >
            {loadingSections.has("integration") ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Chargement...</p>
              </div>
            ) : data.integrationData && data.integrationData.length > 0 ? (
              <div className="space-y-4">
                {data.integrationData.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                          {item.integration.title}
                        </h4>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {new Date(item.integration.date).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      {item.registration.present !== undefined && (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.registration.present
                            ? "bg-green-900/30 text-green-300"
                            : "bg-red-900/30 text-red-300"
                        }`}>
                          {item.registration.present ? "Présent" : "Absent"}
                        </span>
                      )}
                    </div>
                    {item.registration.parrain && (
                      <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                        Parrain: {item.registration.parrain}
                      </p>
                    )}
                    {item.registration.notes && (
                      <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                        {item.registration.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>
                Aucune donnée d'intégration disponible
              </p>
            )}
          </MemberSectionCard>

          {/* D) Engagement */}
          <MemberSectionCard
            id="engagement"
            title="Engagement"
            icon={<MessageSquare className="w-5 h-5" />}
            isExpanded={expandedSections.has("engagement")}
            onToggle={() => toggleSection("engagement")}
            isLoading={loadingSections.has("engagement")}
          >
            {loadingSections.has("engagement") ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Chargement...</p>
              </div>
            ) : data.engagementData ? (
              <div className="space-y-6">
                {/* Follows */}
                {data.engagementData.follows && data.engagementData.follows.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                      Validations de follow ({data.engagementData.follows.length})
                    </h4>
                    <div className="space-y-2">
                      {data.engagementData.follows.slice(0, 10).map((follow: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border text-sm"
                          style={{
                            backgroundColor: 'var(--color-surface)',
                            borderColor: 'var(--color-border)',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span style={{ color: 'var(--color-text)' }}>
                              {follow.month} • {follow.staffName}
                            </span>
                            {follow.status && (
                              <div className="flex gap-2">
                                {follow.status.meSuit === true && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-green-900/30 text-green-300">
                                    Me suit
                                  </span>
                                )}
                                {follow.status.meSuit === false && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-red-900/30 text-red-300">
                                    Ne me suit pas
                                  </span>
                                )}
                                {follow.status.jeSuis && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-blue-900/30 text-blue-300">
                                    Je suis
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raids */}
                {data.engagementData.raids && (
                  <div>
                    <h4 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                      Raids
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-4 rounded-lg border" style={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                      }}>
                        <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                          {data.engagementData.raids.sent || 0}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          Raids envoyés (2 derniers mois)
                        </div>
                      </div>
                      <div className="p-4 rounded-lg border" style={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                      }}>
                        <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                          {data.engagementData.raids.received || 0}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          Raids reçus (2 derniers mois)
                        </div>
                      </div>
                    </div>
                    {data.engagementData.raids.details && data.engagementData.raids.details.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                          Détails du mois en cours:
                        </h5>
                        {data.engagementData.raids.details.slice(0, 10).map((raid: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2 rounded text-xs"
                            style={{
                              backgroundColor: 'var(--color-surface)',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            {raid.type === "sent" ? "→" : "←"} {raid.count || 1}x vers {raid.target || raid.raider} • {new Date(raid.date).toLocaleDateString("fr-FR")}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(!data.engagementData.follows || data.engagementData.follows.length === 0) &&
                 (!data.engagementData.raids || (data.engagementData.raids.sent === 0 && data.engagementData.raids.received === 0)) && (
                  <p className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>
                    Aucune donnée d'engagement disponible
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>
                Données d'engagement non disponibles actuellement
              </p>
            )}
          </MemberSectionCard>

          {/* E) Évaluations */}
          <MemberSectionCard
            id="evaluations"
            title="Évaluations mensuelles"
            icon={<Star className="w-5 h-5" />}
            isExpanded={expandedSections.has("evaluations")}
            onToggle={() => toggleSection("evaluations")}
            isLoading={loadingSections.has("evaluations")}
          >
            {loadingSections.has("evaluations") ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Chargement...</p>
              </div>
            ) : data.evaluationData && data.evaluationData.length > 0 ? (
              <div className="space-y-4">
                {data.evaluationData.map((evalItem: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                        {new Date(evalItem.month + '-01').toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                        })}
                      </h4>
                      <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                        {evalItem.score.total || 0} pts
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div className="text-center">
                        <div className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                          {evalItem.score.sectionA || 0}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          Section A
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                          {evalItem.score.sectionB || 0}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          Section B
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                          {evalItem.score.sectionC || 0}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          Section C
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                          {evalItem.score.sectionDBonuses || 0}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          Bonus D
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/admin/evaluation-mensuelle?month=${evalItem.month}`}
                      className="text-xs text-[#9146ff] hover:underline"
                    >
                      Voir les détails de l'évaluation →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>
                Aucune évaluation mensuelle disponible
              </p>
            )}
          </MemberSectionCard>

          {/* F) Notes staff */}
          <MemberSectionCard
            id="notes"
            title="Notes staff & informations"
            icon={<FileText className="w-5 h-5" />}
            isExpanded={expandedSections.has("notes")}
            onToggle={() => toggleSection("notes")}
          >
            {member.description || member.customBio ? (
              <div className="space-y-4">
                {member.description && (
                  <div>
                    <label className="text-sm font-semibold block mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Description
                    </label>
                    <p className="text-sm" style={{ color: 'var(--color-text)' }}>{member.description}</p>
                  </div>
                )}
                {member.customBio && (
                  <div>
                    <label className="text-sm font-semibold block mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Bio personnalisée
                    </label>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>{member.customBio}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>
                Aucune note ou information supplémentaire
              </p>
            )}
          </MemberSectionCard>
        </div>
      </div>
    </div>
  );
}

// Composant Section Card avec accordéon
function MemberSectionCard({
  id,
  title,
  icon,
  isExpanded,
  onToggle,
  isLoading,
  children,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  isLoading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left transition-colors"
        style={{
          color: 'var(--color-text)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-surface)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </button>
      
      {isExpanded && (
        <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          {children}
        </div>
      )}
    </div>
  );
}
