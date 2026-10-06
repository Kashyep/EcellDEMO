import { sb, friendly } from "./auth";
import {
  DirectoryMember,
  FoundMember,
  Role,
  Task,
  TaskEvent,
  TaskPriority,
  TeamStat,
} from "./types";

export const ROLES = {
  MEMBER: "member" as Role,
  EXECUTIVE: "executive" as Role,
  CO_HEAD: "co_head" as Role,
  HEAD: "head" as Role,
} as const;

export function normalizeRole(designation?: string | null): Role {
  if (!designation) return ROLES.MEMBER;
  const clean = String(designation).toLowerCase().trim().replace(/[-\s]+/g, "_");
  if (clean === "head") return ROLES.HEAD;
  if (clean === "co_head" || clean === "cohead") return ROLES.CO_HEAD;
  if (clean === "executive" || clean === "exec") return ROLES.EXECUTIVE;
  return ROLES.MEMBER;
}

export function roleRank(roleOrDesignation?: string | null): number {
  const role = normalizeRole(roleOrDesignation);
  switch (role) {
    case ROLES.HEAD:
      return 3;
    case ROLES.CO_HEAD:
      return 2;
    case ROLES.EXECUTIVE:
      return 1;
    default:
      return 0;
  }
}

export function isSeniorOf(roleA?: string | null, roleB?: string | null): boolean {
  return roleRank(roleA) > roleRank(roleB);
}

export function formatDesignation(designation?: string | null): string {
  const role = normalizeRole(designation);
  switch (role) {
    case ROLES.HEAD:
      return "Head";
    case ROLES.CO_HEAD:
      return "Co-Head";
    case ROLES.EXECUTIVE:
      return "Executive";
    default:
      return "Member";
  }
}

export function formatDomain(domain?: string | null): string {
  if (!domain) return "";
  const trimmed = String(domain).trim();
  if (!trimmed) return "";
  return trimmed
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function formatPassRole(domain?: string | null, designation?: string | null): string {
  const role = normalizeRole(designation);
  if (role === ROLES.MEMBER) {
    return "Member";
  }
  const dom = formatDomain(domain);
  const des = formatDesignation(designation);
  return dom ? `${dom} · ${des}` : des;
}

// ---------- Tasks & Events ----------

export interface FetchTasksParams {
  assignedTo?: string;
  domain?: string;
}

export async function fetchTasks({ assignedTo, domain }: FetchTasksParams = {}): Promise<Task[]> {
  const client = sb();
  let query = client
    .from("tasks")
    .select("id, domain, title, description, assigned_to, assigned_by, priority, status, due_date, submission_note, submission_link, review_note, created_at");

  if (assignedTo) {
    query = query.eq("assigned_to", assignedTo);
  }
  if (domain) {
    query = query.eq("domain", domain.toLowerCase());
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw friendly(error);
  return (data as Task[]) || [];
}

export async function fetchTaskEvents(taskId: string): Promise<TaskEvent[]> {
  if (!taskId) return [];
  const client = sb();
  const { data, error } = await client
    .from("task_events")
    .select("task_id, actor_id, action, note, created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) throw friendly(error);
  return (data as TaskEvent[]) || [];
}

export interface CreateTaskPayload {
  title: string;
  description?: string | null;
  assigned_to: string;
  assigned_by: string;
  domain?: string | null;
  priority?: TaskPriority;
  due_date?: string | null;
}

export async function createTask({
  title,
  description,
  assigned_to,
  assigned_by,
  domain,
  priority = "medium",
  due_date,
}: CreateTaskPayload): Promise<Task> {
  if (!title || !title.trim()) {
    throw new Error("Task title is required.");
  }
  const cleanTitle = title.trim();
  if (cleanTitle.length > 120) {
    throw new Error("Task title cannot exceed 120 characters.");
  }
  if (!assigned_to) {
    throw new Error("Assignee is required.");
  }
  const cleanDesc = description ? description.trim() : null;
  if (cleanDesc && cleanDesc.length > 2000) {
    throw new Error("Task description cannot exceed 2000 characters.");
  }

  const payload = {
    title: cleanTitle,
    description: cleanDesc,
    assigned_to,
    assigned_by,
    domain: domain ? domain.toLowerCase() : null,
    priority: priority || "medium",
    due_date: due_date || null,
  };

  const client = sb();
  const { data, error } = await client.from("tasks").insert(payload).select();
  if (error) throw friendly(error);
  return ((data && data[0]) || data) as Task;
}

export async function startTask(taskId: string): Promise<any> {
  if (!taskId) throw new Error("Task ID is required.");
  const client = sb();
  const { data, error } = await client.rpc("start_task", { task_id: taskId });
  if (error) throw friendly(error);
  return data;
}

export async function submitTask(taskId: string, note?: string | null, link?: string | null): Promise<any> {
  if (!taskId) throw new Error("Task ID is required.");
  const cleanNote = note ? String(note).trim() : null;
  if (cleanNote && cleanNote.length > 2000) {
    throw new Error("Submission note cannot exceed 2000 characters.");
  }
  const cleanLink = link ? String(link).trim() : null;

  if (cleanLink && !/^https:\/\//i.test(cleanLink)) {
    throw new Error("Submission link must start with https://");
  }

  const client = sb();
  const { data, error } = await client.rpc("submit_task", {
    task_id: taskId,
    note: cleanNote,
    link: cleanLink,
  });
  if (error) throw friendly(error);
  return data;
}

export async function reviewTask(taskId: string, decision: "approved" | "changes_requested", note?: string | null): Promise<any> {
  if (!taskId) throw new Error("Task ID is required.");
  if (decision !== "approved" && decision !== "changes_requested") {
    throw new Error("Review decision must be 'approved' or 'changes_requested'.");
  }
  const cleanNote = note ? String(note).trim() : null;
  if (cleanNote && cleanNote.length > 2000) {
    throw new Error("Review note cannot exceed 2000 characters.");
  }

  const client = sb();
  const { data, error } = await client.rpc("review_task", {
    task_id: taskId,
    decision,
    note: cleanNote,
  });
  if (error) throw friendly(error);
  return data;
}

// ---------- Team Management & Directory ----------

export async function getTeamDirectory(): Promise<DirectoryMember[]> {
  const client = sb();
  const { data, error } = await client.rpc("team_directory");
  if (error) throw friendly(error);
  return (data as DirectoryMember[]) || [];
}

export async function getTeamStats(): Promise<TeamStat[]> {
  const client = sb();
  const { data, error } = await client.rpc("team_stats");
  if (error) throw friendly(error);
  return (data as TeamStat[]) || [];
}

export async function searchUnassignedMembers(query: string): Promise<FoundMember[]> {
  if (!query || !query.trim()) {
    throw new Error("Enter a member name, email, or Member ID.");
  }
  const client = sb();
  const { data, error } = await client.rpc("find_member", { identifier: query.trim() });
  if (error) throw friendly(error);
  return (data as FoundMember[]) || [];
}

export async function getUnassignedMembers(limitCount: number = 15): Promise<FoundMember[]> {
  const client = sb();
  const { data, error } = await client.rpc("get_unassigned_members", { limit_count: limitCount });
  if (error) throw friendly(error);
  return (data as FoundMember[]) || [];
}

export async function findMember(identifier: string): Promise<FoundMember | null> {
  const results = await searchUnassignedMembers(identifier);
  return results[0] || null;
}

export async function assignMember(member: string, domain: string, designation: string): Promise<any> {
  if (!member) throw new Error("Member is required.");
  if (!domain) throw new Error("Domain is required.");
  if (!designation) throw new Error("Designation is required.");

  const client = sb();
  const { data, error } = await client.rpc("assign_member", {
    member,
    domain: String(domain).toLowerCase().trim(),
    designation: normalizeRole(designation),
  });
  if (error) throw friendly(error);
  return data;
}

export async function removeMember(member: string): Promise<any> {
  if (!member) throw new Error("Member is required.");
  const client = sb();
  const { data, error } = await client.rpc("remove_member", { member });
  if (error) throw friendly(error);
  return data;
}

export const Roles = {
  ROLES,
  normalizeRole,
  roleRank,
  isSeniorOf,
  formatDesignation,
  formatDomain,
  formatPassRole,
  fetchTasks,
  fetchTaskEvents,
  createTask,
  startTask,
  submitTask,
  reviewTask,
  getTeamDirectory,
  getTeamStats,
  findMember,
  searchUnassignedMembers,
  getUnassignedMembers,
  assignMember,
  removeMember,
};

export default Roles;
