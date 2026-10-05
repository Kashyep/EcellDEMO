export interface User {
  id: string;
  name: string;
  email: string;
  usn: string;
  memberId: string;
  createdAt: string;
  checklist: Record<string, boolean>;
  domain: string | null;
  designation: string | null;
}

export type Role = "member" | "executive" | "co_head" | "head";

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "submitted" | "approved" | "changes_requested";

export interface Task {
  id: string;
  domain: string;
  title: string;
  description: string | null;
  assigned_to: string;
  assigned_by: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  submission_note: string | null;
  submission_link: string | null;
  review_note: string | null;
  created_at: string;
}

export interface TaskEvent {
  task_id: string;
  actor_id: string;
  action: string;
  note: string | null;
  created_at: string;
}

export interface TeamStat {
  member_id: string;
  full_name: string;
  designation: string;
  todo: number;
  in_progress: number;
  submitted: number;
  approved: number;
  changes_requested: number;
  completed: number;
  overdue: number;
  total: number;
  completion_rate: number;
}

export interface DirectoryMember {
  id: string;
  full_name: string;
  domain: string | null;
  designation: string | null;
  member_id?: string | null;
}

export interface FoundMember {
  id: string;
  full_name: string;
  member_id: string;
  email?: string | null;
}

export interface SignupData {
  name: string;
  email: string;
  usn?: string;
  password: string;
}

export interface SignupErrors {
  name?: string;
  email?: string;
  usn?: string;
  password?: string;
  confirm?: string;
  [key: string]: string | undefined;
}

export interface LoginData {
  email: string;
  password: string;
}
