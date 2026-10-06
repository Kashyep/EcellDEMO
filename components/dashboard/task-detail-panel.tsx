"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { Roles } from "@/lib/roles";
import type { Task, DirectoryMember } from "@/lib/types";

interface TaskEventItem {
  task_id: string;
  actor_id: string;
  action: string;
  note?: string | null;
  created_at: string;
}

interface TaskDetailPanelProps {
  task: Task | null;
  directoryMap: Map<string, DirectoryMember>;
  onMutation: () => Promise<void> | void;
}

export function isOverdue(dueDate: string | null | undefined, status: string | undefined): boolean {
  if (!dueDate) return false;
  const s = String(status || "").toLowerCase();
  if (s === "approved") return false;
  try {
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return false;
    const dueUtc = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());

    const now = new Date();
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    return dueUtc < todayUtc;
  } catch {
    return false;
  }
}

export function isSafeHttps(link: string | null | undefined): boolean {
  if (!link || typeof link !== "string") return false;
  const trimmed = link.trim();
  if (!/^https:\/\//i.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "No deadline";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateStr);
  }
}

export function formatStatusLabel(status: string | undefined): string {
  switch (String(status || "").toLowerCase()) {
    case "todo":
      return "Todo";
    case "in_progress":
      return "In Progress";
    case "submitted":
      return "Submitted";
    case "approved":
      return "Approved";
    case "changes_requested":
      return "Changes Requested";
    default:
      return status ? String(status).replace(/_/g, " ") : "Pending";
  }
}

export function formatPriorityLabel(priority: string | undefined): string {
  if (!priority) return "Medium";
  return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
}

export function TaskDetailPanel({ task, directoryMap, onMutation }: TaskDetailPanelProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [events, setEvents] = useState<TaskEventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitNote, setSubmitNote] = useState("");
  const [submitLink, setSubmitLink] = useState("");

  const loadHistory = useCallback(async (taskId: string) => {
    setLoadingEvents(true);
    setEventsError(null);
    try {
      const data = await Roles.fetchTaskEvents(taskId);
      setEvents(data || []);
    } catch (err: unknown) {
      setEventsError(err instanceof Error ? err.message : "Failed to load task events");
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    if (task?.id) {
      loadHistory(task.id);
      setSubmitNote("");
      setSubmitLink("");
    } else {
      setEvents([]);
    }
  }, [task?.id, loadHistory]);

  if (!task) {
    return (
      <div className="dash-card dash-state">
        <p className="dash-state__title">No task selected</p>
        <p className="dash-state__desc">
          Click any task card to view details, timeline, and actions.
        </p>
      </div>
    );
  }

  const overdue = isOverdue(task.due_date, task.status);
  const assigner = directoryMap.get(task.assigned_by);
  const assignerName = assigner ? assigner.full_name : "Domain Lead";
  const s = String(task.status || "").toLowerCase();
  const isAssignee = user && user.id === task.assigned_to;

  const handleStart = async () => {
    setSubmitting(true);
    try {
      await Roles.startTask(task.id);
      showToast(
        s === "changes_requested"
          ? "Task restarted! You can now resume your work."
          : "Task started! You can now work on your submission."
      );
      await onMutation();
      await loadHistory(task.id);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to start task.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLink = submitLink.trim();
    if (cleanLink && !isSafeHttps(cleanLink)) {
      showToast("Link must be a valid secure address starting with https://");
      return;
    }

    setSubmitting(true);
    try {
      await Roles.submitTask(task.id, submitNote, cleanLink || null);
      showToast("Task submitted for review!");
      setSubmitNote("");
      setSubmitLink("");
      await onMutation();
      await loadHistory(task.id);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to submit task.");
    } finally {
      setSubmitting(false);
    }
  };

  // Review events (approved or changes_requested)
  const reviewEvents = events.filter(
    (e) => e.action === "approved" || e.action === "changes_requested"
  );
  const lastReview = reviewEvents.length > 0 ? reviewEvents[reviewEvents.length - 1] : null;

  return (
    <div className="dash-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
          <span
            className={`dash-badge ${
              overdue
                ? "dash-badge--err"
                : s === "approved"
                ? "dash-badge--ok"
                : "dash-badge--accent"
            }`}
          >
            {formatStatusLabel(task.status)}
            {overdue && " (Overdue)"}
          </span>

          <span
            className={`dash-badge ${
              task.priority === "high" ? "dash-badge--warn" : "dash-badge--neutral"
            }`}
          >
            {formatPriorityLabel(task.priority)}
          </span>

          {task.domain && (
            <span className="dash-badge dash-badge--neutral">
              {Roles.formatDomain(task.domain)}
            </span>
          )}
        </div>

        <h3 className="dash-section-title" style={{ fontSize: "1.35rem", margin: 0 }}>
          {task.title}
        </h3>
      </div>

      {/* Description */}
      <div>
        <div className="dash-stat-card__label" style={{ marginBottom: "6px" }}>
          Description
        </div>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--dash-ink)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
          {task.description || "No description provided."}
        </p>
      </div>

      {/* Meta Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "12px",
          padding: "12px",
          background: "var(--dash-surface-subtle)",
          borderRadius: "var(--dash-radius)",
        }}
      >
        <div>
          <div className="dash-stat-card__label">Assigned By</div>
          <div style={{ fontSize: "0.88rem", fontWeight: 600, marginTop: "2px" }}>
            {assignerName}
          </div>
        </div>

        <div>
          <div className="dash-stat-card__label">Due Date</div>
          <div
            style={{
              fontSize: "0.88rem",
              fontWeight: 600,
              marginTop: "2px",
              color: overdue ? "var(--dash-err)" : "inherit",
            }}
          >
            {formatDate(task.due_date)}
            {overdue && " !"}
          </div>
        </div>

        <div>
          <div className="dash-stat-card__label">Created</div>
          <div style={{ fontSize: "0.88rem", fontWeight: 500, marginTop: "2px" }}>
            {formatDate(task.created_at)}
          </div>
        </div>
      </div>

      {/* Latest Review Feedback if present */}
      {lastReview && (
        <div
          style={{
            padding: "14px",
            borderRadius: "var(--dash-radius)",
            background:
              lastReview.action === "approved"
                ? "rgba(21, 115, 66, 0.08)"
                : "rgba(185, 37, 24, 0.08)",
            border: `1px solid ${
              lastReview.action === "approved"
                ? "rgba(21, 115, 66, 0.2)"
                : "rgba(185, 37, 24, 0.2)"
            }`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong
              style={{
                fontSize: "0.9rem",
                color:
                  lastReview.action === "approved"
                    ? "var(--dash-ok)"
                    : "var(--dash-err)",
              }}
            >
              {lastReview.action === "approved" ? "Task Approved" : "Changes Requested"}
            </strong>
            <span style={{ fontSize: "0.75rem", color: "var(--dash-ink-muted)" }}>
              {formatDateTime(lastReview.created_at)}
            </span>
          </div>
          {lastReview.note && (
            <p style={{ margin: "8px 0 0 0", fontSize: "0.85rem", color: "var(--dash-ink)" }}>
              {lastReview.note}
            </p>
          )}
        </div>
      )}

      {/* Task Actions (Only for assignee) */}
      {isAssignee && (
        <div style={{ borderTop: "1px solid var(--dash-border)", paddingTop: "16px" }}>
          {s === "todo" && (
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              disabled={submitting}
              onClick={handleStart}
            >
              {submitting ? "Starting…" : "Start Task"}
            </button>
          )}

          {s === "changes_requested" && (
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              disabled={submitting}
              onClick={handleStart}
            >
              {submitting ? "Restarting…" : "Restart Task"}
            </button>
          )}

          {s === "in_progress" && (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="dash-form-group" style={{ margin: 0 }}>
                <label htmlFor="submit-note" className="dash-label">
                  Submission Note
                </label>
                <textarea
                  id="submit-note"
                  className="dash-textarea"
                  rows={3}
                  maxLength={2000}
                  placeholder="Describe your progress, summary, or deliverables…"
                  value={submitNote}
                  onChange={(e) => setSubmitNote(e.target.value)}
                />
              </div>

              <div className="dash-form-group" style={{ margin: 0 }}>
                <label htmlFor="submit-link" className="dash-label">
                  Optional Submission Link <span style={{ color: "var(--dash-ink-muted)", fontSize: "0.78rem" }}>(https:// only)</span>
                </label>
                <input
                  type="url"
                  id="submit-link"
                  className="dash-input"
                  placeholder="https://github.com/… or https://drive.google.com/…"
                  value={submitLink}
                  onChange={(e) => setSubmitLink(e.target.value)}
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="dash-btn dash-btn--primary"
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "Submit Task"}
                </button>
              </div>
            </form>
          )}

          {s === "submitted" && (
            <div style={{ background: "var(--dash-surface-subtle)", padding: "12px", borderRadius: "var(--dash-radius)" }}>
              <strong style={{ fontSize: "0.9rem", color: "var(--dash-accent)" }}>
                Awaiting Review
              </strong>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--dash-ink-muted)" }}>
                Your submission is currently in the review queue.
              </p>
              {task.submission_note && (
                <div style={{ marginTop: "8px", fontSize: "0.85rem" }}>
                  <strong>Note: </strong>
                  <span>{task.submission_note}</span>
                </div>
              )}
              {task.submission_link && isSafeHttps(task.submission_link) && (
                <div style={{ marginTop: "6px", fontSize: "0.85rem" }}>
                  <strong>Link: </strong>
                  <a
                    href={task.submission_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--dash-accent)", textDecoration: "underline" }}
                  >
                    {task.submission_link}
                  </a>
                </div>
              )}
            </div>
          )}

          {s === "approved" && (
            <div style={{ background: "rgba(21, 115, 66, 0.08)", padding: "12px", borderRadius: "var(--dash-radius)" }}>
              <strong style={{ fontSize: "0.9rem", color: "var(--dash-ok)" }}>
                Task Complete
              </strong>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--dash-ink-muted)" }}>
                Great work! This task has been reviewed and approved.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Event History Timeline */}
      <div style={{ borderTop: "1px solid var(--dash-border)", paddingTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div className="dash-stat-card__label">Event History</div>
          <button
            type="button"
            className="dash-sidebar__btn"
            style={{ padding: "2px 8px", fontSize: "0.75rem" }}
            onClick={() => loadHistory(task.id)}
            disabled={loadingEvents}
          >
            {loadingEvents ? "Loading…" : "Refresh"}
          </button>
        </div>

        {loadingEvents && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--dash-ink-muted)" }}>
            <div className="dash-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} />
            <span>Loading events…</span>
          </div>
        )}

        {eventsError && (
          <div style={{ fontSize: "0.82rem", color: "var(--dash-err)" }}>
            {eventsError}
          </div>
        )}

        {!loadingEvents && !eventsError && events.length === 0 && (
          <p style={{ fontSize: "0.82rem", color: "var(--dash-ink-muted)", margin: 0 }}>
            No event history recorded yet.
          </p>
        )}

        {!loadingEvents && !eventsError && events.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
            {events.map((ev, idx) => {
              const actor = directoryMap.get(ev.actor_id);
              const actorName = actor
                ? actor.full_name
                : user && ev.actor_id === user.id
                ? "You"
                : "Team Member";

              return (
                <li
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    paddingLeft: "10px",
                    borderLeft: "2px solid var(--dash-border)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "0.82rem", color: "var(--dash-ink)" }}>
                      {actorName} · {(ev.action || "").replace(/_/g, " ")}
                    </strong>
                    <time style={{ fontSize: "0.72rem", color: "var(--dash-ink-muted)" }}>
                      {formatDateTime(ev.created_at)}
                    </time>
                  </div>
                  {ev.note && (
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "var(--dash-ink-muted)" }}>
                      {ev.note}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
