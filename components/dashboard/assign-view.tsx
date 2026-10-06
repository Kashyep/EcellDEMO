"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Roles } from "@/lib/roles";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardPageHeader } from "@/components/dashboard/page-header";

export function AssignView() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    directory,
    loadingDirectory,
    directoryError,
    refreshAll,
    refreshDirectory,
  } = useDashboard();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const selectedDate = useMemo(() => {
    if (!dueDate) return undefined;
    const parts = dueDate.split("-").map(Number);
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return undefined;
  }, [dueDate]);

  const role = user ? Roles.normalizeRole(user.designation) : "co_head";
  const callerRank = user ? Roles.roleRank(user.designation) : 0;

  // Filter eligible subordinates in the same domain
  const eligibleSubordinates = useMemo(() => {
    return directory.filter((m) => {
      if (m.id === user?.id) return false;
      if (m.domain && user?.domain && m.domain.toLowerCase() !== user.domain.toLowerCase()) return false;
      const rank = Roles.roleRank(m.designation);
      if (callerRank <= rank || rank <= 0) return false;

      const norm = Roles.normalizeRole(m.designation);
      if (role === "co_head") {
        return norm === "executive";
      }
      return norm === "executive" || norm === "co_head";
    });
  }, [directory, user, callerRank, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      showToast("Task title is required.");
      return;
    }
    if (cleanTitle.length > 120) {
      showToast("Task title cannot exceed 120 characters.");
      return;
    }
    if (!assignedTo) {
      showToast("Please choose an assignee.");
      return;
    }
    const cleanDesc = description.trim();
    if (cleanDesc.length > 2000) {
      showToast("Task description cannot exceed 2000 characters.");
      return;
    }

    if (!user?.domain) {
      showToast("You must belong to a domain to assign tasks.");
      return;
    }

    setSubmitting(true);
    try {
      await Roles.createTask({
        title: cleanTitle,
        description: cleanDesc || null,
        assigned_to: assignedTo,
        assigned_by: user.id,
        domain: user.domain,
        priority,
        due_date: dueDate || null,
      });

      showToast("Task assigned successfully!");
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setPriority("medium");
      setDueDate("");
      await refreshAll();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to assign task.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dash-assign-view">
      <DashboardPageHeader
        title="Assign New Task"
        subtitle="Create and assign tasks to domain team members with deadlines and priorities."
      />

      {loadingDirectory && (
        <div className="dash-state">
          <div className="dash-spinner" />
          <p className="dash-state__title">Loading assignable members…</p>
        </div>
      )}

      {directoryError && (
        <div className="dash-state" style={{ borderColor: "var(--dash-err)" }}>
          <p className="dash-state__title" style={{ color: "var(--dash-err)" }}>
            Failed to load members
          </p>
          <p className="dash-state__desc">{directoryError}</p>
          <button type="button" className="dash-btn dash-btn--secondary" onClick={refreshDirectory}>
            Retry
          </button>
        </div>
      )}

      {!loadingDirectory && !directoryError && eligibleSubordinates.length === 0 && (
        <Empty className="dash-card border-dashed">
          <EmptyHeader>
            <EmptyTitle>No eligible subordinates found</EmptyTitle>
            <EmptyDescription>
              You must have subordinates in your domain before you can assign tasks.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {!loadingDirectory && !directoryError && eligibleSubordinates.length > 0 && (
        <div className="dash-card" style={{ maxWidth: "680px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Title (maxlength 120) */}
            <div className="dash-form-group" style={{ margin: 0 }}>
              <label htmlFor="task-title" className="dash-label">
                Task Title * <span style={{ color: "var(--dash-ink-muted)", fontSize: "0.78rem" }}>(max 120 chars)</span>
              </label>
              <input
                type="text"
                id="task-title"
                className="dash-input"
                required
                maxLength={120}
                placeholder="e.g. Build hackathon registration API"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description (maxlength 2000) */}
            <div className="dash-form-group" style={{ margin: 0 }}>
              <label htmlFor="task-desc" className="dash-label">
                Description <span style={{ color: "var(--dash-ink-muted)", fontSize: "0.78rem" }}>(optional, max 2000 chars)</span>
              </label>
              <textarea
                id="task-desc"
                className="dash-textarea"
                rows={4}
                maxLength={2000}
                placeholder="Provide task acceptance criteria, constraints, or links…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Assignee */}
            <div className="dash-form-group" style={{ margin: 0 }}>
              <label htmlFor="task-assignee" className="dash-label">
                Assignee *
              </label>
              <select
                id="task-assignee"
                className="dash-select"
                required
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">Select subordinate member…</option>
                {eligibleSubordinates.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.full_name} ({Roles.formatDesignation(sub.designation)})
                  </option>
                ))}
              </select>
            </div>

            {/* Priority & Due Date Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              <div className="dash-form-group" style={{ margin: 0 }}>
                <label htmlFor="task-priority" className="dash-label">
                  Priority
                </label>
                <select
                  id="task-priority"
                  className="dash-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="dash-form-group" style={{ margin: 0 }}>
                <label id="task-due-label" htmlFor="task-due-trigger" className="dash-label">
                  Due Date <span style={{ color: "var(--dash-ink-muted)", fontSize: "0.78rem" }}>(optional)</span>
                </label>
                <input
                  type="hidden"
                  id="task-due"
                  name="due_date"
                  value={dueDate}
                />
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger
                    id="task-due-trigger"
                    aria-labelledby="task-due-label"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full justify-start text-left font-normal h-[38px] px-3",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {selectedDate ? (
                      selectedDate.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    ) : (
                      <span>Pick a due date</span>
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          const y = date.getFullYear();
                          const m = String(date.getMonth() + 1).padStart(2, "0");
                          const d = String(date.getDate()).padStart(2, "0");
                          setDueDate(`${y}-${m}-${d}`);
                        } else {
                          setDueDate("");
                        }
                        setPopoverOpen(false);
                      }}
                      disabled={{ before: today }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Submit button */}
            <div style={{ marginTop: "8px" }}>
              <button
                type="submit"
                className="dash-btn dash-btn--primary"
                disabled={submitting}
              >
                {submitting ? "Assigning…" : "Assign Task"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
