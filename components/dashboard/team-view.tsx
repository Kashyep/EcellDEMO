"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Roles } from "@/lib/roles";
import { Num } from "@/components/num";
import type { TeamStat, DirectoryMember, FoundMember } from "@/lib/types";

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
  const [lookupQuery, setLookupQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<FoundMember | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedNewRole, setSelectedNewRole] = useState<"executive" | "co_head">("executive");
  const [assigning, setAssigning] = useState(false);
  const [mutatingMemberId, setMutatingMemberId] = useState<string | null>(null);

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

  // Lookup handler
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = lookupQuery.trim();
    if (!query) return;

    setSearching(true);
    setSearchResult(null);
    setHasSearched(true);
    try {
      const result = await Roles.findMember(query);
      setSearchResult(result);
      if (!result) {
        showToast("No unassigned member found matching that identifier.");
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to find member.");
    } finally {
      setSearching(false);
    }
  };

  // Assign candidate to domain
  const handleAssignCandidate = async () => {
    if (!searchResult || !user?.domain) return;
    setAssigning(true);
    try {
      await Roles.assignMember(searchResult.id, user.domain, selectedNewRole);
      showToast(`Assigned ${searchResult.full_name} as ${Roles.formatDesignation(selectedNewRole)}!`);
      setSearchResult(null);
      setLookupQuery("");
      setHasSearched(false);
      await refreshAll();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to assign member.");
    } finally {
      setAssigning(false);
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
          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--dash-ink-muted)" }}>
            No members in this category.
          </p>
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
                          <Num value={m.todo || 0} />
                        </td>
                        <td>
                          <Num value={m.in_progress || 0} />
                        </td>
                        <td>
                          <Num value={m.submitted || 0} />
                        </td>
                        <td style={{ color: "var(--dash-ok)", fontWeight: 600 }}>
                          <Num value={m.approved || 0} />
                        </td>
                        <td style={{ color: hasOverdue ? "var(--dash-err)" : "inherit", fontWeight: hasOverdue ? 700 : 400 }}>
                          <Num value={m.overdue || 0} />
                        </td>
                        <td>
                          <Num value={m.total || 0} />
                        </td>
                        <td>
                          <Num value={rateVal} />
                          <span style={{ fontSize: "0.8rem", fontFamily: "inherit" }}>%</span>
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
                          <Num value={m.todo || 0} />
                        </span>
                      </div>
                      <div className="dash-team-card__stat">
                        <span className="dash-team-card__stat-label">In Progress</span>
                        <span className="dash-team-card__stat-num">
                          <Num value={m.in_progress || 0} />
                        </span>
                      </div>
                      <div className="dash-team-card__stat">
                        <span className="dash-team-card__stat-label">Submitted</span>
                        <span className="dash-team-card__stat-num">
                          <Num value={m.submitted || 0} />
                        </span>
                      </div>
                      <div className="dash-team-card__stat">
                        <span className="dash-team-card__stat-label">Completed</span>
                        <span className="dash-team-card__stat-num" style={{ color: "var(--dash-ok)", fontWeight: 600 }}>
                          <Num value={completedVal} />
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
                          <Num value={m.overdue || 0} />
                        </span>
                      </div>
                      <div className="dash-team-card__stat">
                        <span className="dash-team-card__stat-label">Completion%</span>
                        <span className="dash-team-card__stat-num">
                          <Num value={rateVal} />
                          <span style={{ fontSize: "0.8rem", fontFamily: "inherit" }}>%</span>
                        </span>
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
      <header style={{ marginBottom: "24px" }}>
        <h1 className="dash-title">Domain Team</h1>
        <p className="dash-subtitle">
          {isHead
            ? "Team analytics, performance breakdown, and member management."
            : "Team task metrics and executive performance overview."}
        </p>
      </header>

      {/* Loading States */}
      {loadingTeamStats && (
        <div className="dash-state" style={{ marginBottom: "20px" }}>
          <div className="dash-spinner" />
          <p className="dash-state__title">Loading team stats…</p>
        </div>
      )}

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

          {/* Member Exact Lookup */}
          <div className="dash-card">
            <h3 className="dash-section-title" style={{ fontSize: "1.15rem", marginBottom: "8px" }}>
              Lookup & Add Member
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: "var(--dash-ink-muted)" }}>
              Find an unassigned general member by exact email address or Member ID:
            </p>

            <form onSubmit={handleLookup} style={{ display: "flex", gap: "8px", flexWrap: "wrap", maxWidth: "540px" }}>
              <input
                type="text"
                className="dash-input"
                style={{ flex: 1, minWidth: "220px" }}
                placeholder="user@example.com or ECS-2026-XXXXXX"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                required
              />
              <button type="submit" className="dash-btn dash-btn--primary" disabled={searching}>
                {searching ? "Searching…" : "Find Member"}
              </button>
            </form>

            {/* Candidate Result Card */}
            {hasSearched && searchResult && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
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
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                    {searchResult.full_name}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--dash-ink-muted)", marginTop: "2px" }}>
                    {searchResult.email ? `${searchResult.email} · ` : ""}ID: {searchResult.member_id || searchResult.id}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <select
                    className="dash-select"
                    style={{ width: "130px" }}
                    value={selectedNewRole}
                    onChange={(e) => setSelectedNewRole(e.target.value as "executive" | "co_head")}
                    aria-label="Select designation"
                  >
                    <option value="executive">Executive</option>
                    <option value="co_head">Co-Head</option>
                  </select>

                  <button
                    type="button"
                    className="dash-btn dash-btn--primary"
                    disabled={assigning}
                    onClick={handleAssignCandidate}
                  >
                    {assigning ? "Assigning…" : "Assign to Domain"}
                  </button>
                </div>
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
              <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--dash-ink-muted)" }}>
                No subordinates currently in your domain roster. Use the search above to add executives or co-heads.
              </p>
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
