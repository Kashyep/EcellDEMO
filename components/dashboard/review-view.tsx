"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Roles } from "@/lib/roles";
import { Num } from "@/components/num";
import {
  isSafeHttps,
  formatDate,
  formatPriorityLabel,
} from "@/components/dashboard/task-detail-panel";
import { fireConfetti } from "@/components/dashboard/celebrate";
import { BorderBeam } from "@/components/ui/border-beam";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { ReviewListSkeleton } from "@/components/dashboard/stat-skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import type { Task } from "@/lib/types";
import { DashboardPageHeader } from "@/components/dashboard/page-header";

export function ReviewView() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const reducedMotion = useReducedMotionSafe();
  const {
    domainTasks,
    directoryMap,
    loadingDomainTasks,
    domainTasksError,
    refreshAll,
    refreshDomainTasks,
  } = useDashboard();

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);

  const callerRank = user ? Roles.roleRank(user.designation) : 0;

  // Submitted subordinate tasks in user's domain, excluding self
  const submittedTasks = useMemo(() => {
    if (!user) return [];
    return domainTasks.filter((t) => {
      if (String(t.status || "").toLowerCase() !== "submitted") return false;
      const assigneeId = t.assigned_to;
      if (assigneeId === user.id) return false; // Strictly exclude self-review

      const assignee = directoryMap.get(assigneeId);
      if (!assignee) return false;
      if (assignee.domain && assignee.domain !== user.domain) return false;

      const assigneeRank = Roles.roleRank(assignee.designation);
      return callerRank > assigneeRank && assigneeRank > 0;
    });
  }, [domainTasks, directoryMap, user, callerRank]);

  const handleReview = async (task: Task, decision: "approved" | "changes_requested") => {
    const note = (notes[task.id] || "").trim();
    setSubmittingTaskId(task.id);
    try {
      await Roles.reviewTask(task.id, decision, note || null);
      if (decision === "approved") {
        fireConfetti();
      }
      showToast(decision === "approved" ? "Task approved!" : "Changes requested.");
      setNotes((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
      // Immediately refresh common task/stats/nav state
      await refreshAll();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setSubmittingTaskId(null);
    }
  };

  return (
    <div className="dash-review-view">
      <DashboardPageHeader
        title="Review Queue"
        aside={
          <span className="dash-badge dash-badge--accent" style={{ fontSize: "0.82rem" }}>
            <Num value={submittedTasks.length} animate="slide" />
            <span style={{ fontFamily: "inherit", marginLeft: "4px" }}>Tasks Needing Review</span>
          </span>
        }
        subtitle="Review submissions from domain team members, provide feedback, and approve or request changes."
      />

      {loadingDomainTasks && <ReviewListSkeleton count={2} />}

      {domainTasksError && (
        <div className="dash-state" style={{ borderColor: "var(--dash-err)" }}>
          <p className="dash-state__title" style={{ color: "var(--dash-err)" }}>
            Failed to load review queue
          </p>
          <p className="dash-state__desc">{domainTasksError}</p>
          <button type="button" className="dash-btn dash-btn--secondary" onClick={refreshDomainTasks}>
            Retry
          </button>
        </div>
      )}

      {!loadingDomainTasks && !domainTasksError && submittedTasks.length === 0 && (
        <Empty className="dash-card border-dashed">
          <EmptyHeader>
            <EmptyTitle>No submissions waiting</EmptyTitle>
            <EmptyDescription>
              All submitted subordinate tasks have been reviewed. Good work!
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {!loadingDomainTasks && !domainTasksError && submittedTasks.length > 0 && (
        <div
          className="relative rounded-xl overflow-hidden p-1"
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {!reducedMotion && submittedTasks.length > 0 && (
            <BorderBeam
              colorFrom="hsl(var(--accent-hsl))"
              colorTo="hsl(var(--accent-hsl))"
            />
          )}
          {submittedTasks.map((task) => {
            const assignee = directoryMap.get(task.assigned_to);
            const assigneeName = assignee ? assignee.full_name : "Team Member";
            const isSubmitting = submittingTaskId === task.id;

            return (
              <div key={task.id} className="dash-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Top Info */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <h2 className="dash-section-title" style={{ fontSize: "1.25rem", margin: "0 0 4px 0" }}>
                      {task.title}
                    </h2>
                    <div style={{ fontSize: "0.82rem", color: "var(--dash-ink-muted)", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <span>
                        <strong>Assignee: </strong>
                        {assigneeName}
                      </span>
                      <span>
                        <strong>Due: </strong>
                        {formatDate(task.due_date)}
                      </span>
                      <span>
                        <strong>Priority: </strong>
                        {formatPriorityLabel(task.priority)}
                      </span>
                    </div>
                  </div>

                  <span className="dash-badge dash-badge--warn">Needs Review</span>
                </div>

                {/* Description */}
                {task.description && (
                  <div style={{ fontSize: "0.88rem", lineHeight: 1.5, color: "var(--dash-ink)", whiteSpace: "pre-wrap" }}>
                    <div className="dash-stat-card__label" style={{ marginBottom: "4px" }}>
                      Task Description
                    </div>
                    {task.description}
                  </div>
                )}

                {/* Submission Details */}
                <div
                  style={{
                    background: "var(--dash-surface-subtle)",
                    border: "1px solid var(--dash-border)",
                    borderRadius: "var(--dash-radius)",
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div className="dash-stat-card__label">Submission Deliverables</div>
                  {task.submission_note ? (
                    <div style={{ fontSize: "0.88rem", color: "var(--dash-ink)", whiteSpace: "pre-wrap" }}>
                      <strong>Note: </strong>
                      {task.submission_note}
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.82rem", color: "var(--dash-ink-muted)" }}>
                      No submission note provided.
                    </div>
                  )}

                  {task.submission_link && isSafeHttps(task.submission_link) && (
                    <div style={{ fontSize: "0.88rem" }}>
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

                {/* Reviewer Actions */}
                <div style={{ borderTop: "1px solid var(--dash-border)", paddingTop: "14px" }}>
                  <div className="dash-form-group" style={{ marginBottom: "12px" }}>
                    <label htmlFor={`review-note-${task.id}`} className="dash-label">
                      Reviewer Feedback Note (optional, max 2000 chars)
                    </label>
                    <textarea
                      id={`review-note-${task.id}`}
                      className="dash-textarea"
                      rows={2}
                      maxLength={2000}
                      placeholder="Add feedback or required revisions…"
                      value={notes[task.id] || ""}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [task.id]: e.target.value }))
                      }
                      disabled={isSubmitting}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      className="dash-btn dash-btn--primary"
                      disabled={isSubmitting}
                      onClick={() => handleReview(task, "approved")}
                    >
                      {isSubmitting ? "Approving…" : "Approve"}
                    </button>

                    <button
                      type="button"
                      className="dash-btn dash-btn--danger"
                      disabled={isSubmitting}
                      onClick={() => handleReview(task, "changes_requested")}
                    >
                      {isSubmitting ? "Sending…" : "Request Changes"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
