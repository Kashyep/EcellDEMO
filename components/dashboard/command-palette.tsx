"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
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
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
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
import { cn } from "@/lib/utils";

interface PaletteState {
  open: boolean;
  setOpen: (open: boolean) => void;
  query: string;
  setQuery: (query: string) => void;
}

const PaletteContext = createContext<PaletteState | null>(null);

function usePalette(): PaletteState {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error("usePalette must be used inside <CommandPaletteProvider>");
  return ctx;
}

/** Owns the palette's open state and query, plus the global Ctrl/⌘+K shortcut. */
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(() => ({ open, setOpen, query, setQuery }), [open, query]);
  return <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>;
}

const STATUS_LABEL: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  submitted: "Submitted",
  approved: "Approved",
  changes_requested: "Changes Requested",
};

const STATUS_TONE: Record<string, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  submitted: "bg-[hsl(var(--chart-2)/0.18)] text-foreground",
  approved: "bg-[hsl(var(--chart-3)/0.15)] text-[hsl(var(--chart-3))]",
  changes_requested: "bg-destructive/10 text-destructive",
};

/**
 * Wide search field for the page-title row. Clicking it, or typing into it, opens the
 * command palette with the typed text already in the palette's input.
 */
export function DashboardSearch({ className }: { className?: string }) {
  const { open, setOpen, query, setQuery } = usePalette();

  return (
    <InputGroup className={cn("h-10 w-full rounded-full bg-card shadow-sm sm:w-[360px] lg:w-[440px]", className)}>
      <InputGroupAddon>
        <Search className="size-4 text-muted-foreground" aria-hidden="true" />
      </InputGroupAddon>
      <input
        type="search"
        data-slot="input-group-control"
        aria-label="Search tasks, people and pages"
        aria-keyshortcuts="Control+K Meta+K"
        placeholder="Search tasks, people, pages…"
        value={open ? "" : query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="flex-1 min-w-0 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      <InputGroupAddon align="inline-end" className="hidden sm:flex">
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </InputGroupAddon>
    </InputGroup>
  );
}

function formatDue(due: string | null): string | null {
  if (!due) return null;
  const d = new Date(`${due}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  return `Due ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
}

/** The palette dialog. Searches only data the dashboard has already loaded. */
export function CommandPalette() {
  const { open, setOpen, query, setQuery } = usePalette();
  const router = useRouter();
  const { user } = useAuth();
  const { tasks, domainTasks, directory, directoryMap } = useDashboard();

  const role = user ? Roles.normalizeRole(user.designation) : "member";
  const isSenior = role === "co_head" || role === "head";

  const navSections = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ...(isSenior
      ? [
          { title: "Team", url: "/dashboard/team", icon: Users },
          { title: "Review queue", url: "/dashboard/review", icon: ClipboardCheck },
          { title: "Assign task", url: "/dashboard/assign", icon: UserPlus },
        ]
      : []),
  ];

  const visibleTasks = useMemo(() => {
    const byId = new Map<string, Task>();
    for (const t of tasks ?? []) byId.set(t.id, t);
    for (const t of domainTasks ?? []) byId.set(t.id, t);
    return Array.from(byId.values());
  }, [tasks, domainTasks]);

  const canReviewTask = (task: Task) => {
    if (!isSenior || task.status !== "submitted" || task.assigned_to === user?.id) return false;
    const assignee = directoryMap?.get(task.assigned_to);
    if (!assignee) return true;
    const assigneeRank = Roles.roleRank(assignee.designation);
    return Roles.roleRank(user?.designation) > assigneeRank && assigneeRank > 0;
  };

  const go = (url: string) => {
    setOpen(false);
    setQuery("");
    router.push(url);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
      title="Search the dashboard"
      description="Jump to a page, task or person"
      className="sm:max-w-xl"
    >
      <Command>
        <CommandInput
          placeholder="Search tasks, people, pages…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[min(60vh,420px)] motion-reduce:transition-none">
          <CommandEmpty>
            <p className="text-sm text-foreground">
              No results for &ldquo;{query}&rdquo;
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a task title, a person&apos;s name, or a page like &ldquo;Team&rdquo;.
            </p>
          </CommandEmpty>

          <CommandGroup heading="Go to">
            {navSections.map((sec) => (
              <CommandItem key={sec.url} value={`goto ${sec.title}`} onSelect={() => go(sec.url)}>
                <sec.icon className="size-4 shrink-0" />
                <span>{sec.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          {visibleTasks.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Tasks">
                {visibleTasks.map((t) => {
                  const due = formatDue(t.due_date);
                  return (
                    <CommandItem
                      key={t.id}
                      value={`task ${t.title} ${STATUS_LABEL[t.status] ?? t.status} ${t.id}`}
                      onSelect={() => go(canReviewTask(t) ? "/dashboard/review" : "/dashboard")}
                    >
                      <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{t.title}</span>
                      {due && (
                        <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{due}</span>
                      )}
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                          STATUS_TONE[t.status] ?? "bg-muted text-muted-foreground"
                        )}
                      >
                        {STATUS_LABEL[t.status] ?? t.status}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}

          {isSenior && directory && directory.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="People">
                {directory.map((m) => {
                  const designation = Roles.formatDesignation(m.designation);
                  return (
                    <CommandItem
                      key={m.id}
                      value={`person ${m.full_name} ${designation} ${m.member_id || ""}`}
                      onSelect={() => go("/dashboard/team")}
                    >
                      <User className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate font-medium">{m.full_name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{designation}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

export default CommandPalette;
