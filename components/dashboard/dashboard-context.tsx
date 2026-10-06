"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { Roles } from "@/lib/roles";
import type { Task, TeamStat, DirectoryMember } from "@/lib/types";

export interface DashboardContextValue {
  tasks: Task[];
  domainTasks: Task[];
  teamStats: TeamStat[];
  directory: DirectoryMember[];
  directoryMap: Map<string, DirectoryMember>;
  loadingTasks: boolean;
  loadingDomainTasks: boolean;
  loadingTeamStats: boolean;
  loadingDirectory: boolean;
  tasksError: string | null;
  domainTasksError: string | null;
  teamStatsError: string | null;
  directoryError: string | null;
  reviewCount: number;
  refreshAll: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  refreshDomainTasks: () => Promise<void>;
  refreshTeamStats: () => Promise<void>;
  refreshDirectory: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [domainTasks, setDomainTasks] = useState<Task[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStat[]>([]);
  const [directory, setDirectory] = useState<DirectoryMember[]>([]);

  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingDomainTasks, setLoadingDomainTasks] = useState(false);
  const [loadingTeamStats, setLoadingTeamStats] = useState(false);
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  const [tasksError, setTasksError] = useState<string | null>(null);
  const [domainTasksError, setDomainTasksError] = useState<string | null>(null);
  const [teamStatsError, setTeamStatsError] = useState<string | null>(null);
  const [directoryError, setDirectoryError] = useState<string | null>(null);

  const role = useMemo(() => {
    return user ? Roles.normalizeRole(user.designation) : "member";
  }, [user]);

  const isSenior = role === "co_head" || role === "head";

  const directoryMap = useMemo(() => {
    const map = new Map<string, DirectoryMember>();
    directory.forEach((m) => {
      map.set(m.id, m);
    });
    return map;
  }, [directory]);

  const refreshTasks = useCallback(async () => {
    if (!user || role === "member") {
      setTasks([]);
      return;
    }
    setLoadingTasks(true);
    setTasksError(null);
    try {
      const data = await Roles.fetchTasks({ assignedTo: user.id });
      setTasks(data || []);
    } catch (err: unknown) {
      setTasksError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  }, [user, role]);

  const refreshDirectory = useCallback(async () => {
    if (!user || role === "member") {
      setDirectory([]);
      return;
    }
    setLoadingDirectory(true);
    setDirectoryError(null);
    try {
      const data = await Roles.getTeamDirectory();
      setDirectory(data || []);
    } catch (err: unknown) {
      setDirectoryError(err instanceof Error ? err.message : "Failed to load directory");
    } finally {
      setLoadingDirectory(false);
    }
  }, [user, role]);

  const refreshDomainTasks = useCallback(async () => {
    if (!user || !isSenior || !user.domain) {
      setDomainTasks([]);
      return;
    }
    setLoadingDomainTasks(true);
    setDomainTasksError(null);
    try {
      const data = await Roles.fetchTasks({ domain: user.domain });
      setDomainTasks(data || []);
    } catch (err: unknown) {
      setDomainTasksError(err instanceof Error ? err.message : "Failed to load domain tasks");
    } finally {
      setLoadingDomainTasks(false);
    }
  }, [user, isSenior]);

  const refreshTeamStats = useCallback(async () => {
    if (!user || !isSenior) {
      setTeamStats([]);
      return;
    }
    setLoadingTeamStats(true);
    setTeamStatsError(null);
    try {
      const data = await Roles.getTeamStats();
      setTeamStats(data || []);
    } catch (err: unknown) {
      setTeamStatsError(err instanceof Error ? err.message : "Failed to load team stats");
    } finally {
      setLoadingTeamStats(false);
    }
  }, [user, isSenior]);

  const refreshAll = useCallback(async () => {
    if (!user || role === "member") return;
    const promises: Promise<unknown>[] = [refreshTasks(), refreshDirectory()];
    if (isSenior) {
      promises.push(refreshDomainTasks());
      promises.push(refreshTeamStats());
    }
    await Promise.allSettled(promises);
  }, [user, role, isSenior, refreshTasks, refreshDirectory, refreshDomainTasks, refreshTeamStats]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Review queue count: tasks in domain with status === 'submitted', assigned_to !== user.id
  // and assigned to a subordinate (rank < caller rank)
  const reviewCount = useMemo(() => {
    if (!user || !isSenior) return 0;
    const callerRank = Roles.roleRank(user.designation);
    return domainTasks.filter((t) => {
      if (String(t.status || "").toLowerCase() !== "submitted") return false;
      const assigneeId = t.assigned_to;
      if (assigneeId === user.id) return false;
      const assignee = directoryMap.get(assigneeId);
      if (!assignee) return false;
      const assigneeRank = Roles.roleRank(assignee.designation);
      return callerRank > assigneeRank && assigneeRank > 0;
    }).length;
  }, [user, isSenior, domainTasks, directoryMap]);

  const value = useMemo(
    () => ({
      tasks,
      domainTasks,
      teamStats,
      directory,
      directoryMap,
      loadingTasks,
      loadingDomainTasks,
      loadingTeamStats,
      loadingDirectory,
      tasksError,
      domainTasksError,
      teamStatsError,
      directoryError,
      reviewCount,
      refreshAll,
      refreshTasks,
      refreshDomainTasks,
      refreshTeamStats,
      refreshDirectory,
    }),
    [
      tasks,
      domainTasks,
      teamStats,
      directory,
      directoryMap,
      loadingTasks,
      loadingDomainTasks,
      loadingTeamStats,
      loadingDirectory,
      tasksError,
      domainTasksError,
      teamStatsError,
      directoryError,
      reviewCount,
      refreshAll,
      refreshTasks,
      refreshDomainTasks,
      refreshTeamStats,
      refreshDirectory,
    ]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return ctx;
}
