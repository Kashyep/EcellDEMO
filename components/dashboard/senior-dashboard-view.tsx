"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Roles } from "@/lib/roles";
import { Num } from "@/components/num";
import {
  TaskDetailPanel,
  isOverdue,
  formatDate,
  formatStatusLabel,
} from "@/components/dashboard/task-detail-panel";

export function SeniorDashboardView() {
  const { user } = useAuth();
  const {
    tasks,
    domainTasks,
    directoryMap,
    loadingDomainTasks,
    domainTasksError,
    refreshAll,
    refreshDomainTasks,
  } = useDashboard();

  const [selectedPersonalTaskId, setSelectedPersonalTaskId] = useState<string | null>(null);

  const role = user ? Roles.normalizeRole(user.designation) : "co_head";
  const isHead = role === "head";

  // Domain task metrics across all 5 statuses
  const domainMetrics = useMemo(() => {
    const total = domainTasks.length;
    let approved = 0;
    let inProgress = 0;
    let changesRequested = 0;
    let todo = 0;
    let submitted = 0;
    let overdue = 0;

    domainTasks.forEach((t) => {
      const s = String(t.status || "").toLowerCase();
      if (s === "approved") approved++;
      else if (s === "in_progress") inProgress++;
      else if (s === "changes_requested") changesRequested++;
      else if (s === "todo") todo++;
      else if (s === "submitted") submitted++;

      if (isOverdue(t.due_date, t.status)) overdue++;
    });

    const completionRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return {
      total,
      approved,
      inProgress,
      changesRequested,
      todo,
      submitted,
      overdue,
      completionRate,
    };
  }, [domainTasks]);

  // Overdue tasks list in domain
  const overdueTasks = useMemo(() => {
    return domainTasks.filter((t) => isOverdue(t.due_date, t.status));
  }, [domainTasks]);

  // Active personal task for senior
  const activePersonalTask = useMemo(() => {
    if (selectedPersonalTaskId) {
      const found = tasks.find((t) => t.id === selectedPersonalTaskId);
      if (found) return found;
    }
    return tasks.length > 0 ? tasks[0] : null;
  }, [tasks, selectedPersonalTaskId]);

  const domainName = user?.domain ? Roles.formatDomain(user.domain) : "Domain";

  return (
    <div className="dash-senior-view">
      <header style={{ marginBottom: "24px" }}>
        <h1 className="dash-title">{domainName} Overview</h1>
        <p className="dash-subtitle">
          Domain-level status, metrics, and personal assigned tasks.
        </p>
      </header>

      {/* Domain Scope Totals Across All 5 Statuses */}
      <div className="dash-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <h2 className="dash-section-title" style={{ margin: 0 }}>
            Domain Task Metrics
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="dash-badge dash-badge--accent">
              <Num value={domainMetrics.completionRate} />
              <span style={{ fontFamily: "inherit", marginLeft: "2px" }}>% Overall Completion</span>
            </span>
          </div>
        </div>

        {loadingDomainTasks && (
          <div className="dash-state">
            <div className="dash-spinner" />
            <p className="dash-state__title">Loading domain metrics…</p>
          </div>
        )}

        {domainTasksError && (
          <div className="dash-state" style={{ borderColor: "var(--dash-err)" }}>
            <p className="dash-state__title" style={{ color: "var(--dash-err)" }}>
              Failed to load domain metrics
            </p>
            <p className="dash-state__desc">{domainTasksError}</p>
            <button
              type="button"
              className="dash-btn dash-btn--secondary"
              onClick={refreshDomainTasks}
            >
              Retry
            </button>
          </div>
        )}

        {!loadingDomainTasks && !domainTasksError && (
          <div className="dash-stats-grid" style={{ marginBottom: 0 }}>
            <div className="dash-stat-card">
              <span className="dash-stat-card__val">
                <Num value={domainMetrics.total} />
              </span>
              <span className="dash-stat-card__label">Total Tasks</span>
            </div>

            <div className="dash-stat-card">
              <span className="dash-stat-card__val dash-stat-card__val--ok">
                <Num value={domainMetrics.approved} />
              </span>
              <span className="dash-stat-card__label">Approved</span>
            </div>

            <div className="dash-stat-card">
              <span className="dash-stat-card__val dash-stat-card__val--accent">
                <Num value={domainMetrics.inProgress} />
              </span>
              <span className="dash-stat-card__label">In Progress</span>
            </div>

            <div className="dash-stat-card">
              <span className="dash-stat-card__val">
                <Num value={domainMetrics.submitted} />
              </span>
              <span className="dash-stat-card__label">In Review</span>
            </div>

            <div className="dash-stat-card">
              <span className="dash-stat-card__val">
                <Num value={domainMetrics.changesRequested} />
              </span>
              <span className="dash-stat-card__label">Changes Req.</span>
            </div>

            <div className="dash-stat-card">
              <span className="dash-stat-card__val">
                <Num value={domainMetrics.todo} />
              </span>
              <span className="dash-stat-card__label">Todo</span>
            </div>

            <div className="dash-stat-card">
              <span
                className={`dash-stat-card__val ${
                  domainMetrics.overdue > 0 ? "dash-stat-card__val--err" : ""
                }`}
              >
                <Num value={domainMetrics.overdue} />
              </span>
              <span className="dash-stat-card__label">Overdue</span>
            </div>
          </div>
        )}
      </div>

      {/* Head-Only: Overdue Tasks List */}
      {isHead && (
        <div className="dash-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 className="dash-section-title" style={{ margin: 0, color: overdueTasks.length > 0 ? "var(--dash-err)" : "inherit" }}>
              Overdue Tasks ({overdueTasks.length})
            </h2>
          </div>

          {overdueTasks.length === 0 ? (
            <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--dash-ink-muted)" }}>
              All domain tasks are currently on schedule.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {overdueTasks.map((t) => {
                const assignee = directoryMap.get(t.assigned_to);
                const assigneeName = assignee ? assignee.full_name : "Team Member";

                return (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      borderRadius: "var(--dash-radius)",
                      border: "1px solid rgba(185, 37, 24, 0.2)",
                      background: "rgba(185, 37, 24, 0.04)",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--dash-ink)" }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--dash-ink-muted)", marginTop: "2px" }}>
                        Assigned to: {assigneeName} · Status: {formatStatusLabel(t.status)}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="dash-badge dash-badge--err">
                        Due: {formatDate(t.due_date)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Personal Subordinate Senior-Assigned Tasks Section */}
      <div style={{ marginTop: "32px" }}>
        <h2 className="dash-section-title">My Assigned Tasks</h2>

        {tasks.length === 0 ? (
          <div className="dash-card dash-state">
            <p className="dash-state__title">No personal tasks assigned</p>
            <p className="dash-state__desc">
              You do not have any tasks directly assigned to you at this time.
            </p>
          </div>
        ) : (
          <div className="dash-two-col">
            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {tasks.map((task) => {
                const isSelected = activePersonalTask?.id === task.id;
                const overdue = isOverdue(task.due_date, task.status);
                const assigner = directoryMap.get(task.assigned_by);
                const assignerName = assigner ? assigner.full_name : "Domain Lead";

                return (
                  <button
                    key={task.id}
                    type="button"
                    className={`dash-task-card ${
                      isSelected ? "dash-task-card--selected" : ""
                    }`}
                    onClick={() => setSelectedPersonalTaskId(task.id)}
                    aria-pressed={isSelected}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      <span className="dash-task-card__title">{task.title}</span>
                      <span
                        className={`dash-badge ${
                          overdue
                            ? "dash-badge--err"
                            : task.status === "approved"
                            ? "dash-badge--ok"
                            : "dash-badge--accent"
                        }`}
                      >
                        {formatStatusLabel(task.status)}
                      </span>
                    </div>

                    <div className="dash-task-card__meta">
                      <span>
                        <strong>Due: </strong>
                        <span style={{ color: overdue ? "var(--dash-err)" : "inherit" }}>
                          {formatDate(task.due_date)}
                          {overdue && " (Overdue)"}
                        </span>
                      </span>
                      <span>
                        <strong>Assigner: </strong>
                        {assignerName}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail Panel */}
            <div>
              <TaskDetailPanel
                task={activePersonalTask}
                directoryMap={directoryMap}
                onMutation={refreshAll}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
