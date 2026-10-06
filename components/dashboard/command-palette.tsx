"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  UserPlus,
  Search,
  User,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Roles } from "@/lib/roles";
import type { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

export interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

function formatTaskStatus(status?: string | null): string {
  if (!status) return "";
  const s = status.toLowerCase();
  switch (s) {
    case "todo":
      return "To Do";
    case "in_progress":
      return "In Progress";
    case "submitted":
      return "Submitted";
    case "approved":
      return "Approved";
    case "changes_requested":
      return "Changes Requested";
    default:
      return status;
  }
}

export function CommandPalette({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTrigger = true,
}: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { tasks, domainTasks, directory, directoryMap } = useDashboard();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (nextOpen: boolean | ((prev: boolean) => boolean)) => {
      const value = typeof nextOpen === "function" ? nextOpen(open) : nextOpen;
      if (controlledOnOpenChange) {
        controlledOnOpenChange(value);
      }
      if (!isControlled) {
        setInternalOpen(value);
      }
    },
    [controlledOnOpenChange, isControlled, open]
  );

  const role = useMemo(() => {
    return user ? Roles.normalizeRole(user.designation) : "member";
  }, [user]);

  const isSenior = role === "co_head" || role === "head";

  // Keyboard shortcut: Ctrl+K / ⌘+K to toggle palette
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  // "Go to" navigation sections based on role permissions
  const navSections = useMemo(() => {
    const sections = [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ];

    if (isSenior) {
      sections.push(
        {
          title: "Team",
          url: "/dashboard/team",
          icon: Users,
        },
        {
          title: "Review queue",
          url: "/dashboard/review",
          icon: ClipboardCheck,
        },
        {
          title: "Assign task",
          url: "/dashboard/assign",
          icon: UserPlus,
        }
      );
    }

    return sections;
  }, [isSenior]);

  // Tasks: deduplicate from tasks and domainTasks by id
  const deduplicatedTasks = useMemo(() => {
    const taskMap = new Map<string, Task>();
    if (Array.isArray(tasks)) {
      tasks.forEach((t) => {
        if (t && t.id) taskMap.set(t.id, t);
      });
    }
    if (Array.isArray(domainTasks)) {
      domainTasks.forEach((t) => {
        if (t && t.id) taskMap.set(t.id, t);
      });
    }
    return Array.from(taskMap.values());
  }, [tasks, domainTasks]);

  // Check if a submitted task can be reviewed by the user
  const canReviewTask = useCallback(
    (task: Task) => {
      if (!isSenior || String(task.status || "").toLowerCase() !== "submitted") {
        return false;
      }
      if (task.assigned_to === user?.id) {
        return false;
      }
      const callerRank = Roles.roleRank(user?.designation);
      const assignee = directoryMap?.get(task.assigned_to);
      if (assignee) {
        const assigneeRank = Roles.roleRank(assignee.designation);
        return callerRank > assigneeRank && assigneeRank > 0;
      }
      return true;
    },
    [isSenior, user, directoryMap]
  );

  const handleSelectSection = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  const handleSelectMember = () => {
    setOpen(false);
    router.push("/dashboard/team");
  };

  const handleSelectTask = (task: Task) => {
    setOpen(false);
    if (canReviewTask(task)) {
      router.push("/dashboard/review");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <>
      {showTrigger && (
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => setOpen(true)}
          className="h-8 gap-2 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          aria-label="Search dashboard (Ctrl+K or ⌘+K)"
        >
          <Search className="size-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="pointer-events-none hidden h-4 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList className="motion-reduce:transition-none">
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Go to">
            {navSections.map((sec) => (
              <CommandItem
                key={sec.url}
                value={`goto ${sec.title}`}
                onSelect={() => handleSelectSection(sec.url)}
              >
                <sec.icon className="size-4 shrink-0" />
                <span>{sec.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          {isSenior && directory && directory.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Members">
                {directory.map((m) => {
                  const designationLabel = Roles.formatDesignation(m.designation);
                  return (
                    <CommandItem
                      key={m.id}
                      value={`member ${m.full_name} ${designationLabel} ${m.member_id || ""}`}
                      onSelect={handleSelectMember}
                    >
                      <User className="size-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium">{m.full_name}</span>
                      <span className="ml-auto text-xs text-muted-foreground font-sans">
                        {designationLabel}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}

          {deduplicatedTasks.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Tasks">
                {deduplicatedTasks.map((t) => {
                  const statusLabel = formatTaskStatus(t.status);
                  return (
                    <CommandItem
                      key={t.id}
                      value={`task ${t.title} ${statusLabel}`}
                      onSelect={() => handleSelectTask(t)}
                    >
                      <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{t.title}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground font-sans">
                        {statusLabel}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

export default CommandPalette;
