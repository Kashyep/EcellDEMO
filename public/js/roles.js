/*
 * Roles, permissions, hierarchy, and Supabase RPC data layer for E-Cell role dashboards.
 * Exposes window.Roles with role utilities and data access methods.
 */
(function () {
  "use strict";

  const ROLES = {
    MEMBER: "member",
    EXECUTIVE: "executive",
    CO_HEAD: "co_head",
    HEAD: "head",
  };

  function normalizeRole(designation) {
    if (!designation) return ROLES.MEMBER;
    const clean = String(designation).toLowerCase().trim().replace(/[-\s]+/g, "_");
    if (clean === "head") return ROLES.HEAD;
    if (clean === "co_head" || clean === "cohead") return ROLES.CO_HEAD;
    if (clean === "executive" || clean === "exec") return ROLES.EXECUTIVE;
    return ROLES.MEMBER;
  }

  function roleRank(roleOrDesignation) {
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

  function isSeniorOf(roleA, roleB) {
    return roleRank(roleA) > roleRank(roleB);
  }

  function formatDesignation(designation) {
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

  function formatDomain(domain) {
    if (!domain) return "";
    const trimmed = String(domain).trim();
    if (!trimmed) return "";
    return trimmed
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  function formatPassRole(domain, designation) {
    const role = normalizeRole(designation);
    if (role === ROLES.MEMBER) {
      return "Member";
    }
    const dom = formatDomain(domain);
    const des = formatDesignation(designation);
    return dom ? `${dom} · ${des}` : des;
  }

  function getClient() {
    if (window.Auth && typeof window.Auth.client === "function") {
      return window.Auth.client();
    }
    if (window.Auth && typeof window.Auth.sb === "function") {
      return window.Auth.sb();
    }
    throw new Error("Supabase client is not initialized.");
  }

  function friendlyError(err) {
    if (!err) return new Error("An unexpected error occurred.");
    if (window.Auth && typeof window.Auth.friendly === "function") {
      return window.Auth.friendly(err);
    }
    return new Error(err.message || String(err));
  }

  // ---------- Tasks & Events ----------

  async function fetchTasks({ assignedTo, domain } = {}) {
    const sb = getClient();
    let query = sb
      .from("tasks")
      .select("id, title, description, assigned_to, assigned_by, domain, priority, due_date, status, submission_note, submission_link, review_note, created_at");

    if (assignedTo) {
      query = query.eq("assigned_to", assignedTo);
    }
    if (domain) {
      query = query.eq("domain", domain.toLowerCase());
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw friendlyError(error);
    return data || [];
  }

  async function fetchTaskEvents(taskId) {
    if (!taskId) return [];
    const sb = getClient();
    const { data, error } = await sb
      .from("task_events")
      .select("task_id, actor_id, action, note, created_at")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) throw friendlyError(error);
    return data || [];
  }

  async function createTask({ title, description, assigned_to, assigned_by, domain, priority, due_date }) {
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

    const sb = getClient();
    const { data, error } = await sb.from("tasks").insert(payload).select();
    if (error) throw friendlyError(error);
    return (data && data[0]) || data;
  }

  async function startTask(taskId) {
    if (!taskId) throw new Error("Task ID is required.");
    const sb = getClient();
    const { data, error } = await sb.rpc("start_task", { task_id: taskId });
    if (error) throw friendlyError(error);
    return data;
  }

  async function submitTask(taskId, note, link) {
    if (!taskId) throw new Error("Task ID is required.");
    const cleanNote = note ? String(note).trim() : null;
    if (cleanNote && cleanNote.length > 2000) {
      throw new Error("Submission note cannot exceed 2000 characters.");
    }
    const cleanLink = link ? String(link).trim() : null;

    if (cleanLink && !/^https:\/\//i.test(cleanLink)) {
      throw new Error("Submission link must start with https://");
    }

    const sb = getClient();
    const { data, error } = await sb.rpc("submit_task", {
      task_id: taskId,
      note: cleanNote,
      link: cleanLink,
    });
    if (error) throw friendlyError(error);
    return data;
  }

  async function reviewTask(taskId, decision, note) {
    if (!taskId) throw new Error("Task ID is required.");
    if (decision !== "approved" && decision !== "changes_requested") {
      throw new Error("Review decision must be 'approved' or 'changes_requested'.");
    }
    const cleanNote = note ? String(note).trim() : null;
    if (cleanNote && cleanNote.length > 2000) {
      throw new Error("Review note cannot exceed 2000 characters.");
    }

    const sb = getClient();
    const { data, error } = await sb.rpc("review_task", {
      task_id: taskId,
      decision,
      note: cleanNote,
    });
    if (error) throw friendlyError(error);
    return data;
  }

  // ---------- Team Management & Directory ----------

  async function getTeamDirectory() {
    const sb = getClient();
    const { data, error } = await sb.rpc("team_directory");
    if (error) throw friendlyError(error);
    return data || [];
  }

  async function getTeamStats() {
    const sb = getClient();
    const { data, error } = await sb.rpc("team_stats");
    if (error) throw friendlyError(error);
    return data || [];
  }

  async function findMember(identifier) {
    if (!identifier || !identifier.trim()) {
      throw new Error("Enter an email or Member ID.");
    }
    const sb = getClient();
    const { data, error } = await sb.rpc("find_member", { identifier: identifier.trim() });
    if (error) throw friendlyError(error);
    if (Array.isArray(data)) return data[0] || null;
    return data || null;
  }

  async function assignMember(member, domain, designation) {
    if (!member) throw new Error("Member is required.");
    if (!domain) throw new Error("Domain is required.");
    if (!designation) throw new Error("Designation is required.");

    const sb = getClient();
    const { data, error } = await sb.rpc("assign_member", {
      member,
      domain: String(domain).toLowerCase().trim(),
      designation: normalizeRole(designation),
    });
    if (error) throw friendlyError(error);
    return data;
  }

  async function removeMember(member) {
    if (!member) throw new Error("Member is required.");
    const sb = getClient();
    const { data, error } = await sb.rpc("remove_member", { member });
    if (error) throw friendlyError(error);
    return data;
  }

  // Expose API
  window.Roles = {
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
    assignMember,
    removeMember,
  };
})();
