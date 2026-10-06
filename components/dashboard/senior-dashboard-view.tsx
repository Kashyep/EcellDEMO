"use client";

import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { StatGridSkeleton } from "@/components/dashboard/stat-skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

const statusChartConfig: ChartConfig = {
  count: {
    label: "Tasks",
    color: "hsl(var(--chart-1))",
  },
};

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

  const reducedMotion = useReducedMotionSafe();

  const statusChartData = useMemo(() => [
    { status: "Todo", count: domainMetrics.todo },
    { status: "In Prog", count: domainMetrics.inProgress },
    { status: "Review", count: domainMetrics.submitted },
    { status: "Changes", count: domainMetrics.changesRequested },
    { status: "Approved", count: domainMetrics.approved },
  ], [domainMetrics]);

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
              <Num value={domainMetrics.completionRate} animate="slide" />
              <span style={{ fontFamily: "inherit", marginLeft: "2px" }}>% Overall Completion</span>
            </span>
          </div>
        </div>

        {loadingDomainTasks && <StatGridSkeleton count={7} />}

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
          <>
            <div className="dash-stats-grid" style={{ marginBottom: 0 }}>
              <div className="dash-stat-card">
                <span className="dash-stat-card__val">
                  <Num value={domainMetrics.total} animate="slide" />
                </span>
                <span className="dash-stat-card__label">Total Tasks</span>
              </div>

              <div className="dash-stat-card">
                <span className="dash-stat-card__val dash-stat-card__val--ok">
                  <Num value={domainMetrics.approved} animate="slide" />
                </span>
                <span className="dash-stat-card__label">Approved</span>
              </div>

              <div className="dash-stat-card">
                <span className="dash-stat-card__val dash-stat-card__val--accent">
                  <Num value={domainMetrics.inProgress} animate="slide" />
                </span>
                <span className="dash-stat-card__label">In Progress</span>
              </div>

              <div className="dash-stat-card">
                <span className="dash-stat-card__val">
                  <Num value={domainMetrics.submitted} animate="slide" />
                </span>
                <span className="dash-stat-card__label">In Review</span>
              </div>

              <div className="dash-stat-card">
                <span className="dash-stat-card__val">
                  <Num value={domainMetrics.changesRequested} animate="slide" />
                </span>
                <span className="dash-stat-card__label">Changes Req.</span>
              </div>

              <div className="dash-stat-card">
                <span className="dash-stat-card__val">
                  <Num value={domainMetrics.todo} animate="slide" />
                </span>
                <span className="dash-stat-card__label">Todo</span>
              </div>

              <div className="dash-stat-card">
                <span
                  className={`dash-stat-card__val ${
                    domainMetrics.overdue > 0 ? "dash-stat-card__val--err" : ""
                  }`}
                >
                  <Num value={domainMetrics.overdue} animate="slide" />
                </span>
                <span className="dash-stat-card__label">Overdue</span>
              </div>
            </div>

            {/* Accessible Tasks by status BarChart */}
            <figure
              style={{
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid var(--dash-border)",
              }}
              aria-label="Tasks by status chart"
            >
              <figcaption className="sr-only">
                Tasks by status: {domainMetrics.todo} todo, {domainMetrics.inProgress} in progress, {domainMetrics.submitted} in review, {domainMetrics.changesRequested} changes requested, and {domainMetrics.approved} approved.
              </figcaption>
              <div
                style={{
                  marginBottom: "8px",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: "var(--dash-ink)",
                }}
              >
                Tasks by status
              </div>
              <ChartContainer config={statusChartConfig} className="min-h-[160px] w-full max-h-[200px]">
                <BarChart
                  accessibilityLayer
                  data={statusChartData}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.25} />
                  <XAxis
                    dataKey="status"
                    tickLine={false}
                    tickMargin={8}
                    axisLine={false}
                    fontSize={11}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Bar
                    dataKey="count"
                    fill="var(--chart-color-count, hsl(var(--chart-1)))"
                    radius={4}
                    isAnimationActive={!reducedMotion}
                  />
                </BarChart>
              </ChartContainer>
            </figure>
          </>
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
          <Empty className="dash-card border-dashed">
            <EmptyHeader>
              <EmptyTitle>No personal tasks assigned</EmptyTitle>
              <EmptyDescription>
                You do not have any tasks directly assigned to you at this time.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
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
