"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Search, UserPlus, UserX, X, Users, Sparkles, Check } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Roles } from "@/lib/roles";
import { Num } from "@/components/num";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { TableSkeleton } from "@/components/dashboard/stat-skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import type { TeamStat, DirectoryMember, FoundMember } from "@/lib/types";
import { DashboardPageHeader } from "@/components/dashboard/page-header";

const teamChartConfig: ChartConfig = {
  rate: {
    label: "Completion %",
    color: "hsl(var(--chart-1))",
  },
};

export function TeamView() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    teamStats,
    directory,
    loadingTeamStats,
    loadingDirectory,
    teamStatsError,
    directoryError,
    refreshAll,
    refreshTeamStats,
    refreshDirectory,
  } = useDashboard();

  const role = user ? Roles.normalizeRole(user.designation) : "co_head";
  const isHead = role === "head";

  // Manage Team states (Head-only)
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FoundMember[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [candidateRoles, setCandidateRoles] = useState<Record<string, "executive" | "co_head">>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [mutatingMemberId, setMutatingMemberId] = useState<string | null>(null);
  const [recentUnassigned, setRecentUnassigned] = useState<FoundMember[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [showRecent, setShowRecent] = useState(false);

  // Subordinates roster in domain (Co-Heads and Executives)
  const roster = useMemo(() => {
    return directory.filter((m) => {
      const d = Roles.normalizeRole(m.designation);
      return (d === "co_head" || d === "executive") && m.id !== user?.id;
    });
  }, [directory, user?.id]);

  const coheadStats = useMemo(() => {
    return teamStats.filter((m) => Roles.normalizeRole(m.designation) === "co_head");
  }, [teamStats]);

  const executiveStats = useMemo(() => {
    return teamStats.filter((m) => Roles.normalizeRole(m.designation) === "executive");
  }, [teamStats]);

  const reducedMotion = useReducedMotionSafe();

  const teamCompletionData = useMemo(() => {
    return teamStats.map((m) => ({
      name: m.full_name,
      rate: Math.round(Number(m.completion_rate) || 0),
    }));
  }, [teamStats]);

  // Search unassigned members by name, email, or member_id
  const executeSearch = useCallback(async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setHasSearched(true);
    try {
      const results = await Roles.searchUnassignedMembers(q);
      setSearchResults(results);
    } catch (err: unknown) {
      setSearchResults([]);
      showToast(err instanceof Error ? err.message : "Failed to search members.");
    } finally {
      setSearching(false);
    }
  }, [showToast]);

  // Debounced live search as user types
  useEffect(() => {
    if (!isHead) return;
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      executeSearch(trimmed);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isHead, executeSearch]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  // Assign candidate to domain
  const handleAssignCandidate = async (candidate: FoundMember) => {
    if (!user?.domain) return;
    const targetRole = candidateRoles[candidate.id] || "executive";
    setAssigningId(candidate.id);
    try {
      await Roles.assignMember(candidate.id, user.domain, targetRole);
      showToast(`Added ${candidate.full_name} to ${Roles.formatDomain(user.domain)} as ${Roles.formatDesignation(targetRole)}!`);
      // Remove candidate from search and recent results
      setSearchResults((prev) => prev.filter((m) => m.id !== candidate.id));
      setRecentUnassigned((prev) => prev.filter((m) => m.id !== candidate.id));
      await refreshAll();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to assign member.");
    } finally {
      setAssigningId(null);
    }
  };

  // Toggle recent unassigned members list
  const handleToggleRecent = async () => {
    if (showRecent) {
      setShowRecent(false);
      return;
    }
    if (recentUnassigned.length > 0) {
      setShowRecent(true);
      return;
    }
    setLoadingRecent(true);
    try {
      const list = await Roles.getUnassignedMembers(10);
      setRecentUnassigned(list);
      setShowRecent(true);
      if (list.length === 0) {
        showToast("No unassigned members currently registered.");
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to load unassigned members.");
    } finally {
      setLoadingRecent(false);
    }
  };

  // Update member role
  const handleUpdateRole = async (memberId: string, memberName: string, newRole: string) => {
    if (!user?.domain) return;
    setMutatingMemberId(memberId);
    try {
      await Roles.assignMember(memberId, user.domain, newRole);
      showToast(`Updated role for ${memberName} to ${Roles.formatDesignation(newRole)}.`);
      await refreshAll();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update member role.");
    } finally {
      setMutatingMemberId(null);
    }
  };

  // Remove member from domain
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the domain team?`)) {
      return;
    }
    setMutatingMemberId(memberId);
    try {
      await Roles.removeMember(memberId);
      showToast(`Removed ${memberName} from domain.`);
      await refreshAll();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to remove member.");
    } finally {
      setMutatingMemberId(null);
    }
  };

  const renderStatsTable = (statsList: TeamStat[], title: string) => {
    return (
      <div className="dash-card" style={{ marginBottom: "24px" }}>
        <h3 className="dash-section-title" style={{ fontSize: "1.25rem", marginBottom: "14px" }}>
          {title} ({statsList.length})
        </h3>

        {statsList.length === 0 ? (
          <Empty className="dash-card border-dashed">
            <EmptyHeader>
              <EmptyTitle>No team members yet</EmptyTitle>
              <EmptyDescription>
                No members currently in this category.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {/* Desktop Table (>= 640px) */}
            <div className="dash-table-wrap dash-team-table-desktop hidden sm:block" role="region" tabIndex={0} aria-label={`${title} statistics table`}>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th scope="col">Member</th>
                    <th scope="col">Role</th>
                    <th scope="col">Todo</th>
                    <th scope="col">In Prog</th>
                    <th scope="col">Submitted</th>
                    <th scope="col">Approved</th>
                    <th scope="col">Overdue</th>
                    <th scope="col">Total</th>
                    <th scope="col">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {statsList.map((m) => {
                    const hasOverdue = Number(m.overdue) > 0;
                    const rateVal = Math.round(Number(m.completion_rate) || 0);

                    return (
                      <tr key={m.member_id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{m.full_name}</div>
                          {/* Member ID in regular font, NOT pixel */}
                          <div style={{ fontSize: "0.75rem", color: "var(--dash-ink-muted)", fontFamily: "inherit" }}>
                            {m.member_id || "—"}
                          </div>
                        </td>
                        <td>{Roles.formatDesignation(m.designation)}</td>
                        <td>
                          <Num value={m.todo || 0} animate="slide" />
                        </td>
                        <td>
                          <Num value={m.in_progress || 0} animate="slide" />
                        </td>
                        <td>
                          <Num value={m.submitted || 0} animate="slide" />
                        </td>
                        <td style={{ color: "var(--dash-ok)", fontWeight: 600 }}>
                          <Num value={m.approved || 0} animate="slide" />
                        </td>
                        <td style={{ color: hasOverdue ? "var(--dash-err)" : "inherit", fontWeight: hasOverdue ? 700 : 400 }}>
                          <Num value={m.overdue || 0} animate="slide" />
                        </td>
                        <td>
                          <Num value={m.total || 0} animate="slide" />
                        </td>
                        <td style={{ minWidth: "140px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Progress
                              value={rateVal}
                              aria-label={`${m.full_name} completion`}
                              style={{ flex: 1, minWidth: "50px" }}
                            />
                            <span style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
                              <Num value={rateVal} animate="slide" />
                              <span style={{ fontSize: "0.8rem", fontFamily: "inherit" }}>%</span>
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards (< 640px) */}
            <div className="dash-team-cards-mobile block sm:hidden" role="region" aria-label={`${title} statistics cards`}>
              {statsList.map((m) => {
                const hasOverdue = Number(m.overdue) > 0;
                const rateVal = Math.round(Number(m.completion_rate) || 0);
                const completedVal = (m.completed ?? m.approved) || 0;

                return (
                  <div key={m.member_id} className="dash-team-card">
                    {/* Member Name, ID (regular font), Role */}
                    <div className="dash-team-card__header">
                      <div className="dash-team-card__identity">
                        <div className="dash-team-card__name">{m.full_name}</div>
                        {/* Member ID in regular font, NOT pixel */}
                        <div className="dash-team-card__id">{m.member_id || "—"}</div>
                      </div>
                      <span className="dash-badge dash-badge--neutral">
                        {Roles.formatDesignation(m.designation)}
                      </span>
                    </div>

                    {/* Six Stats: Assigned, In Progress, Submitted, Completed, Overdue, Completion% */}
                    <div className="dash-team-card__stats">
                      <div className="dash-team-card__stat">
                        <span className="dash-team-card__stat-label">Assigned</span>
                        <span className="dash-team-card__stat-num">
                          <Num value={m.todo || 0} animate="slide" />
                        </span>
                      </div>
                      <div className="dash-team-card__stat">
                        <span className="dash-team-card__stat-label">In Progress</span>
                        <span className="dash-team-card__stat-num">
                          <Num value={m.in_progress || 0} animate="slide" />
                        </span>
                      </div>
                      <div className="dash-team-card__stat">
                        <span className="dash-team-card__stat-label">Submitted</span>
                        <span className="dash-team-card__stat-num">
                          <Num value={m.submitted || 0} animate="slide" />
                        </span>
                      </div>
                      <div className="dash-team-card__stat">
                        <span className="dash-team-card__stat-label">Completed</span>
                        <span className="dash-team-card__stat-num" style={{ color: "var(--dash-ok)", fontWeight: 600 }}>
                          <Num value={completedVal} animate="slide" />
                        </span>
                      </div>
                      <div className="dash-team-card__stat">
                        <span className="dash-team-card__stat-label">Overdue</span>
                        <span
                          className="dash-team-card__stat-num"
                          style={{
                            color: hasOverdue ? "var(--dash-err)" : "inherit",
                            fontWeight: hasOverdue ? 700 : 400,
                          }}
                        >
                          <Num value={m.overdue || 0} animate="slide" />
                        </span>
                      </div>
                      <div className="dash-team-card__stat">
                        <span className="dash-team-card__stat-label">Completion%</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                          <Progress
                            value={rateVal}
                            aria-label={`${m.full_name} completion`}
                            style={{ width: "50px" }}
                          />
                          <span className="dash-team-card__stat-num" style={{ display: "inline-flex", alignItems: "center" }}>
                            <Num value={rateVal} animate="slide" />
                            <span style={{ fontSize: "0.8rem", fontFamily: "inherit" }}>%</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="dash-team-view">
      <DashboardPageHeader
        title="Domain Team"
        subtitle={isHead
            ? "Team analytics, performance breakdown, and member management."
            : "Team task metrics and executive performance overview."}
      />

      {/* Loading States */}
      {loadingTeamStats && <TableSkeleton rows={4} />}

      {teamStatsError && (
        <div className="dash-state" style={{ borderColor: "var(--dash-err)", marginBottom: "20px" }}>
          <p className="dash-state__title" style={{ color: "var(--dash-err)" }}>
            Failed to load team stats
          </p>
          <p className="dash-state__desc">{teamStatsError}</p>
          <button type="button" className="dash-btn dash-btn--secondary" onClick={refreshTeamStats}>
            Retry
          </button>
        </div>
      )}

      {/* Horizontal Bar Chart: Completion % per Member */}
      {!loadingTeamStats && !teamStatsError && teamCompletionData.length > 0 && (
        <div className="dash-card" style={{ marginBottom: "24px" }}>
          <figure aria-label="Team completion overview chart">
            <figcaption className="sr-only">
              Team completion overview: {teamCompletionData.map((d) => `${d.name}: ${d.rate}%`).join(", ")}.
            </figcaption>
            <h2 className="dash-section-title" style={{ fontSize: "1.15rem", marginBottom: "14px" }}>
              Team Completion Breakdown
            </h2>
            <ChartContainer
              config={teamChartConfig}
              className="w-full"
              style={{ minHeight: `${Math.max(140, teamCompletionData.length * 36)}px`, maxHeight: "320px" }}
            >
              <BarChart
                accessibilityLayer
                data={teamCompletionData}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 16, bottom: 8 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.25} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  unit="%"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={110}
                />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar
                  dataKey="rate"
                  fill="var(--chart-color-rate, hsl(var(--chart-1)))"
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={!reducedMotion}
                />
              </BarChart>
            </ChartContainer>
          </figure>
        </div>
      )}

      {/* Co-Head View: Read-Only Table for Executives */}
      {!isHead && !loadingTeamStats && !teamStatsError && (
        <div>{renderStatsTable(executiveStats, "Team Members (Executives)")}</div>
      )}

      {/* Head View: Grouped Statistics */}
      {isHead && !loadingTeamStats && !teamStatsError && (
        <div>
          {renderStatsTable(coheadStats, "Co-Heads")}
          {renderStatsTable(executiveStats, "Executives")}
        </div>
      )}

      {/* Head View: Team Management Controls */}
      {isHead && (
        <div style={{ marginTop: "32px" }}>
          <h2 className="dash-section-title">Manage Team</h2>

          {/* Member Search & Add Section */}
          <div className="dash-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
              <div>
                <h3 className="dash-section-title" style={{ fontSize: "1.15rem", margin: "0 0 4px 0" }}>
                  Add Member to Team
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--dash-ink-muted)" }}>
                  Search for any unassigned member by name to add them to your domain team:
                </p>
              </div>
              <button
                type="button"
                className="dash-btn dash-btn--secondary"
                style={{ fontSize: "0.8rem", padding: "6px 12px", minHeight: "32px" }}
                onClick={handleToggleRecent}
                disabled={loadingRecent}
              >
                {loadingRecent ? (
                  <>
                    <span className="dash-spinner" style={{ width: "12px", height: "12px", marginRight: "6px", borderWidth: "2px" }} />
                    Loading…
                  </>
                ) : showRecent ? (
                  "Hide unassigned list"
                ) : (
                  <>
                    <Users style={{ width: "13px", height: "13px", marginRight: "6px" }} />
                    Browse unassigned members
                  </>
                )}
              </button>
            </div>

            {/* Search Input Bar */}
            <form onSubmit={handleLookup} style={{ display: "flex", gap: "8px", flexWrap: "wrap", maxWidth: "600px", marginTop: "14px" }}>
              <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
                <Search
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "16px",
                    height: "16px",
                    color: "var(--dash-ink-muted)",
                    pointerEvents: "none",
                  }}
                  aria-hidden="true"
                />
                <input
                  type="text"
                  className="dash-input"
                  style={{
                    paddingLeft: "36px",
                    paddingRight: searchQuery ? "34px" : "12px",
                    height: "38px",
                  }}
                  placeholder="Type member's name (e.g. Aditya, Kashyap)…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search unassigned member by name"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setHasSearched(false);
                    }}
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--dash-ink-muted)",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                    }}
                    aria-label="Clear search"
                  >
                    <X style={{ width: "14px", height: "14px" }} />
                  </button>
                )}
              </div>
              <button type="submit" className="dash-btn dash-btn--primary" disabled={searching} style={{ minHeight: "38px" }}>
                {searching ? (
                  <>
                    <span className="dash-spinner" style={{ width: "12px", height: "12px", marginRight: "6px", borderWidth: "2px" }} />
                    Searching…
                  </>
                ) : (
                  "Find Member"
                )}
              </button>
            </form>

            {/* Search Results List */}
            {hasSearched && searchResults.length > 0 && (
              <div style={{ marginTop: "18px" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--dash-ink-muted)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "10px" }}>
                  Matching Unassigned Members ({searchResults.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {searchResults.map((candidate) => {
                    const isAssigningThis = assigningId === candidate.id;
                    const selectedRole = candidateRoles[candidate.id] || "executive";

                    return (
                      <div
                        key={candidate.id}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "var(--dash-radius)",
                          border: "1px solid var(--dash-border)",
                          background: "var(--dash-surface-subtle)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              background: "var(--dash-surface)",
                              border: "1px solid var(--dash-border)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.9rem",
                              color: "var(--dash-accent)",
                              flexShrink: 0,
                            }}
                          >
                            {candidate.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                              {candidate.full_name}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "var(--dash-ink-muted)", marginTop: "2px" }}>
                              ID: {candidate.member_id || candidate.id}
                              <span className="dash-badge dash-badge--neutral" style={{ marginLeft: "8px", fontSize: "0.68rem", padding: "1px 6px" }}>
                                Unassigned
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <select
                            className="dash-select"
                            style={{ width: "125px", fontSize: "0.84rem", padding: "5px 8px" }}
                            value={selectedRole}
                            onChange={(e) =>
                              setCandidateRoles((prev) => ({
                                ...prev,
                                [candidate.id]: e.target.value as "executive" | "co_head",
                              }))
                            }
                            aria-label={`Select designation for ${candidate.full_name}`}
                            disabled={isAssigningThis}
                          >
                            <option value="executive">Executive</option>
                            <option value="co_head">Co-Head</option>
                          </select>

                          <button
                            type="button"
                            className="dash-btn dash-btn--primary"
                            style={{ padding: "6px 14px", fontSize: "0.84rem", minHeight: "34px" }}
                            disabled={isAssigningThis}
                            onClick={() => handleAssignCandidate(candidate)}
                          >
                            {isAssigningThis ? (
                              <>
                                <span className="dash-spinner" style={{ width: "12px", height: "12px", marginRight: "6px", borderWidth: "2px" }} />
                                Adding…
                              </>
                            ) : (
                              <>
                                <UserPlus style={{ width: "14px", height: "14px", marginRight: "6px" }} />
                                Add to Team
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State when searched and none found */}
            {hasSearched && !searching && searchResults.length === 0 && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  borderRadius: "var(--dash-radius)",
                  border: "1px dashed var(--dash-border)",
                  background: "var(--dash-surface-subtle)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <UserX style={{ width: "24px", height: "24px", color: "var(--dash-ink-muted)", flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    No unassigned members found matching &ldquo;{searchQuery}&rdquo;
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--dash-ink-muted)", marginTop: "2px" }}>
                    Make sure the member has created an account and has not already been assigned to a domain.
                  </div>
                </div>
              </div>
            )}

            {/* Optional Browse Recent Unassigned Panel */}
            {showRecent && (
              <div style={{ marginTop: "20px", borderTop: "1px solid var(--dash-border)", paddingTop: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--dash-ink)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Sparkles style={{ width: "14px", height: "14px", color: "var(--dash-accent)" }} />
                    Available Unassigned Members ({recentUnassigned.length})
                  </div>
                </div>

                {recentUnassigned.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--dash-ink-muted)" }}>
                    No unassigned members currently registered. New signups will appear here.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {recentUnassigned.map((candidate) => {
                      const isAssigningThis = assigningId === candidate.id;
                      const selectedRole = candidateRoles[candidate.id] || "executive";

                      return (
                        <div
                          key={`recent-${candidate.id}`}
                          style={{
                            padding: "12px 14px",
                            borderRadius: "var(--dash-radius)",
                            border: "1px solid var(--dash-border)",
                            background: "var(--dash-surface)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "12px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: "var(--dash-surface-subtle)",
                                border: "1px solid var(--dash-border)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                color: "var(--dash-accent)",
                                flexShrink: 0,
                              }}
                            >
                              {candidate.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>
                                {candidate.full_name}
                              </div>
                              <div style={{ fontSize: "0.78rem", color: "var(--dash-ink-muted)", marginTop: "2px" }}>
                                ID: {candidate.member_id || candidate.id}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <select
                              className="dash-select"
                              style={{ width: "120px", fontSize: "0.82rem", padding: "4px 8px" }}
                              value={selectedRole}
                              onChange={(e) =>
                                setCandidateRoles((prev) => ({
                                  ...prev,
                                  [candidate.id]: e.target.value as "executive" | "co_head",
                                }))
                              }
                              aria-label={`Select designation for ${candidate.full_name}`}
                              disabled={isAssigningThis}
                            >
                              <option value="executive">Executive</option>
                              <option value="co_head">Co-Head</option>
                            </select>

                            <button
                              type="button"
                              className="dash-btn dash-btn--primary"
                              style={{ padding: "5px 12px", fontSize: "0.82rem", minHeight: "32px" }}
                              disabled={isAssigningThis}
                              onClick={() => handleAssignCandidate(candidate)}
                            >
                              {isAssigningThis ? (
                                <>
                                  <span className="dash-spinner" style={{ width: "12px", height: "12px", marginRight: "6px", borderWidth: "2px" }} />
                                  Adding…
                                </>
                              ) : (
                                <>
                                  <UserPlus style={{ width: "13px", height: "13px", marginRight: "6px" }} />
                                  Add
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Domain Roster */}
          <div className="dash-card">
            <h3 className="dash-section-title" style={{ fontSize: "1.15rem", marginBottom: "8px" }}>
              Active Domain Roster ({roster.length})
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: "var(--dash-ink-muted)" }}>
              Change subordinate roles or remove members from your domain:
            </p>

            {loadingDirectory && (
              <div className="dash-state">
                <div className="dash-spinner" />
                <p className="dash-state__title">Loading roster…</p>
              </div>
            )}

            {directoryError && (
              <div className="dash-state" style={{ borderColor: "var(--dash-err)" }}>
                <p className="dash-state__title" style={{ color: "var(--dash-err)" }}>
                  Failed to load roster
                </p>
                <p className="dash-state__desc">{directoryError}</p>
                <button type="button" className="dash-btn dash-btn--secondary" onClick={refreshDirectory}>
                  Retry
                </button>
              </div>
            )}

            {!loadingDirectory && !directoryError && roster.length === 0 && (
              <Empty className="dash-card border-dashed">
                <EmptyHeader>
                  <EmptyTitle>No team members yet</EmptyTitle>
                  <EmptyDescription>
                    No subordinates currently in your domain roster. Use the search above to add executives or co-heads.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

            {!loadingDirectory && !directoryError && roster.length > 0 && (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                {roster.map((mem) => {
                  const currentRole = Roles.normalizeRole(mem.designation);
                  const isMutating = mutatingMemberId === mem.id;

                  return (
                    <li
                      key={mem.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 14px",
                        border: "1px solid var(--dash-border)",
                        borderRadius: "var(--dash-radius)",
                        background: "var(--dash-surface)",
                        flexWrap: "wrap",
                        gap: "10px",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>
                          {mem.full_name}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--dash-ink-muted)", marginTop: "2px" }}>
                          <span className="dash-badge dash-badge--neutral" style={{ marginRight: "6px" }}>
                            {Roles.formatDesignation(mem.designation)}
                          </span>
                          ID: {mem.member_id || mem.id}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <select
                          className="dash-select"
                          style={{ width: "120px", fontSize: "0.82rem", padding: "4px 8px" }}
                          defaultValue={currentRole}
                          id={`role-select-${mem.id}`}
                          aria-label={`Role for ${mem.full_name}`}
                          disabled={isMutating}
                        >
                          <option value="executive">Executive</option>
                          <option value="co_head">Co-Head</option>
                        </select>

                        <button
                          type="button"
                          className="dash-btn dash-btn--secondary"
                          style={{ padding: "4px 10px", fontSize: "0.8rem", minHeight: "32px" }}
                          disabled={isMutating}
                          onClick={() => {
                            const selectEl = document.getElementById(
                              `role-select-${mem.id}`
                            ) as HTMLSelectElement | null;
                            if (selectEl) {
                              handleUpdateRole(mem.id, mem.full_name, selectEl.value);
                            }
                          }}
                        >
                          Change
                        </button>

                        <button
                          type="button"
                          className="dash-btn dash-btn--danger"
                          style={{ padding: "4px 10px", fontSize: "0.8rem", minHeight: "32px" }}
                          disabled={isMutating}
                          onClick={() => handleRemoveMember(mem.id, mem.full_name)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
