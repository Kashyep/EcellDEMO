"use client";

import React, { useState, useMemo } from "react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Num } from "@/components/num";
import {
  TaskDetailPanel,
  isOverdue,
  formatDate,
  formatStatusLabel,
} from "@/components/dashboard/task-detail-panel";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "in_progress", label: "In Progress" },
  { id: "changes_requested", label: "Changes Requested" },
  { id: "todo", label: "Todo" },
  { id: "submitted", label: "Submitted" },
  { id: "approved", label: "Approved" },
] as const;

export function ExecutiveView() {
  const {
    tasks,
    directoryMap,
    loadingTasks,
    tasksError,
    refreshAll,
    refreshTasks,
  } = useDashboard();

  const [filter, setFilter] = useState<string>("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Compute stats
  const stats = useMemo(() => {
    const total = tasks.length;
    let inProgress = 0;
    let submitted = 0;
    let approved = 0;
    let overdue = 0;

    tasks.forEach((t) => {
      const s = String(t.status || "").toLowerCase();
      if (s === "in_progress") inProgress++;
      else if (s === "submitted") submitted++;
      else if (s === "approved") approved++;

      if (isOverdue(t.due_date, t.status)) overdue++;
    });

    const completionRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return { total, inProgress, submitted, approved, overdue, completionRate };
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter(
      (t) => String(t.status || "").toLowerCase() === filter.toLowerCase()
    );
  }, [tasks, filter]);

  // Active selected task
  const activeTask = useMemo(() => {
    if (selectedTaskId) {
      const found = tasks.find((t) => t.id === selectedTaskId);
      if (found) return found;
    }
    return tasks.length > 0 ? tasks[0] : null;
  }, [tasks, selectedTaskId]);

  return (
    <div className="dash-exec-view">
      <header style={{ marginBottom: "24px" }}>
        <h1 className="dash-title">Personal Dashboard</h1>
        <p className="dash-subtitle">
          Track and manage your domain tasks, progress, and submissions.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="dash-stats-grid" role="region" aria-label="Task statistics">
        <div className="dash-stat-card">
          <span className="dash-stat-card__val">
            <Num value={stats.total} />
          </span>
          <span className="dash-stat-card__label">Total Assigned</span>
        </div>

        <div className="dash-stat-card">
          <span className="dash-stat-card__val dash-stat-card__val--accent">
            <Num value={stats.inProgress} />
          </span>
          <span className="dash-stat-card__label">In Progress</span>
        </div>

        <div className="dash-stat-card">
          <span className="dash-stat-card__val">
            <Num value={stats.submitted} />
          </span>
          <span className="dash-stat-card__label">Submitted</span>
        </div>

        <div className="dash-stat-card">
          <span className="dash-stat-card__val dash-stat-card__val--ok">
            <Num value={stats.approved} />
          </span>
          <span className="dash-stat-card__label">Approved</span>
        </div>

        <div className="dash-stat-card">
          <span
            className={`dash-stat-card__val ${
              stats.overdue > 0 ? "dash-stat-card__val--err" : ""
            }`}
          >
            <Num value={stats.overdue} />
          </span>
          <span className="dash-stat-card__label">Overdue</span>
        </div>

        <div className="dash-stat-card">
          <span className="dash-stat-card__val">
            <Num value={stats.completionRate} />
            <span style={{ fontSize: "1.1rem", fontFamily: "inherit" }}>%</span>
          </span>
          <span className="dash-stat-card__label">Completion</span>
        </div>
      </div>

      {/* Main 2-column layout: Task List + Detail Panel */}
      <div className="dash-two-col">
        {/* Left Column: Tasks List */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h2 className="dash-section-title" style={{ margin: 0 }}>
              My Tasks
            </h2>
            <span
              style={{
                fontSize: "0.82rem",
                color: "var(--dash-ink-muted)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Num value={filteredTasks.length} />
              <span>tasks</span>
            </span>
          </div>

          {/* Accessible Filter Tabs */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
            role="group"
            aria-label="Filter tasks by status"
          >
            {STATUS_FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`dash-btn ${
                    active ? "dash-btn--primary" : "dash-btn--secondary"
                  }`}
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.8rem",
                    minHeight: "30px",
                  }}
                  aria-pressed={active}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {loadingTasks && (
            <div className="dash-state">
              <div className="dash-spinner" />
              <p className="dash-state__title">Loading your tasks…</p>
            </div>
          )}

          {tasksError && (
            <div className="dash-state" style={{ borderColor: "var(--dash-err)" }}>
              <p className="dash-state__title" style={{ color: "var(--dash-err)" }}>
                Failed to load tasks
              </p>
              <p className="dash-state__desc">{tasksError}</p>
              <button
                type="button"
                className="dash-btn dash-btn--secondary"
                onClick={refreshTasks}
              >
                Retry
              </button>
            </div>
          )}

          {!loadingTasks && !tasksError && filteredTasks.length === 0 && (
            <div className="dash-card dash-state">
              <p className="dash-state__title">No tasks found</p>
              <p className="dash-state__desc">
                {filter === "all"
                  ? "When a domain lead assigns a task to you, it will appear here."
                  : "No tasks match the selected status filter."}
              </p>
            </div>
          )}

          {!loadingTasks && !tasksError && filteredTasks.length > 0 && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              role="list"
              aria-label="Assigned tasks list"
            >
              {filteredTasks.map((task) => {
                const isSelected = activeTask?.id === task.id;
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
                    onClick={() => setSelectedTaskId(task.id)}
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
          )}
        </div>

        {/* Right Column: Task Detail Panel */}
        <div>
          <TaskDetailPanel
            task={activeTask}
            directoryMap={directoryMap}
            onMutation={refreshAll}
          />
        </div>
      </div>
    </div>
  );
}
