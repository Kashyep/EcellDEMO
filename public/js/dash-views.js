/*
 * View renderer for role dashboards: Member, Executive, Co-Head, and Head views.
 * Exposes window.RoleDashboard.
 * Strictly adheres to DOM creation via textContent and replaceChildren (no inline user HTML).
 */
(function () {
  "use strict";

  // ---------- DOM Helper (pure textContent creation, no innerHTML) ----------
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v === null || v === undefined) continue;
        if (k === "className") {
          node.className = v;
        } else if (k === "htmlFor") {
          node.htmlFor = v;
        } else if (k.startsWith("on") && typeof v === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (k === "disabled" || k === "checked" || k === "hidden" || k === "selected" || k === "readOnly") {
          node[k] = !!v;
        } else {
          node.setAttribute(k, v);
        }
      }
    }
    for (const child of children.flat(Infinity)) {
      if (child === null || child === undefined || child === false) continue;
      if (typeof child === "string" || typeof child === "number") {
        node.appendChild(document.createTextNode(String(child)));
      } else if (child instanceof Node) {
        node.appendChild(child);
      }
    }
    return node;
  }

  // ---------- Date & Link Utilities ----------

  /**
   * Evaluates whether a task is overdue.
   * Supabase DB defaults to the UTC timezone and SQL `current_date` evaluates UTC calendar dates.
   * A task is overdue only if its calendar due date strictly precedes the current calendar date in UTC (due_date < current_date).
   * Tasks due on today's calendar date are NOT overdue.
   * 'approved' is the sole terminal done status; approved tasks are never overdue.
   */
  function isOverdue(dueDate, status) {
    if (!dueDate) return false;
    const s = String(status || "").toLowerCase();
    if (s === "approved") return false;
    try {
      const due = new Date(dueDate);
      if (isNaN(due.getTime())) return false;
      const dueUtc = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());

      const now = new Date();
      const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

      // Strictly before current calendar date in UTC (today is not overdue)
      return dueUtc < todayUtc;
    } catch (_) {
      return false;
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "No deadline";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (_) {
      return String(dateStr);
    }
  }

  function formatDateTime(dateStr) {
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
    } catch (_) {
      return String(dateStr);
    }
  }

  function isSafeHttps(link) {
    if (!link || typeof link !== "string") return false;
    const trimmed = link.trim();
    if (!/^https:\/\//i.test(trimmed)) return false;
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === "https:";
    } catch (_) {
      return false;
    }
  }

  function renderSafeLink(link, label) {
    if (!link || !isSafeHttps(link)) return null;
    return el(
      "a",
      {
        href: link.trim(),
        target: "_blank",
        rel: "noopener noreferrer",
        className: "role-link",
      },
      label || link.trim()
    );
  }

  /**
   * Formats completion rates returned as SQL numeric percentages in the range 0..100.
   * Does NOT use <=1 fraction heuristics so that 1% remains 1% instead of 100%.
   */
  function formatRate(rate) {
    if (rate === null || rate === undefined || rate === "") return "0%";
    const num = Number(rate);
    if (isNaN(num)) return String(rate);
    return Math.round(num) + "%";
  }

  // ---------- State UI Renderers ----------

  function renderLoading(text = "Loading data…") {
    return el(
      "div",
      { className: "role-state role-state--loading", role: "status", "aria-live": "polite" },
      el("div", { className: "role-spinner", "aria-hidden": "true" }),
      el("span", { className: "role-state__text" }, text)
    );
  }

  function renderEmpty(title, hint) {
    return el(
      "div",
      { className: "role-state role-state--empty" },
      el("p", { className: "role-state__title" }, title),
      hint ? el("p", { className: "role-state__hint" }, hint) : null
    );
  }

  function renderError(message, retryFn) {
    return el(
      "div",
      { className: "role-state role-state--error", role: "alert" },
      el("p", { className: "role-state__msg" }, message || "Something went wrong."),
      retryFn
        ? el(
            "button",
            {
              type: "button",
              className: "btn btn--small role-btn",
              onClick: retryFn,
            },
            "Retry"
          )
        : null
    );
  }

  function renderBadge(text, type = "default", isOverdueFlag = false) {
    const classes = ["role-badge", `role-badge--${type}`];
    if (isOverdueFlag) classes.push("role-badge--overdue");
    return el("span", { className: classes.join(" ") }, text);
  }

  /**
   * Sole 5 statuses in the user contract: todo, in_progress, submitted, approved, changes_requested.
   * No fake aliases (assigned, completed).
   */
  function formatStatusLabel(status) {
    switch (String(status).toLowerCase()) {
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

  function formatPriorityLabel(priority) {
    if (!priority) return "Medium";
    return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
  }

  // Helper for async button state (toast error notification, no console.error on expected RPC validation failures)
  async function withPending(btn, busyText, actionFn, successMsg, onComplete) {
    if (!btn || btn.disabled) return;
    const origText = btn.textContent;
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    btn.textContent = busyText || "Saving…";

    try {
      await actionFn();
      if (window.showToast && successMsg) {
        window.showToast(successMsg);
      }
      if (onComplete) await onComplete();
    } catch (err) {
      const friendlyMsg = (err && err.message) || "Action failed. Please try again.";
      if (window.showToast) {
        window.showToast(friendlyMsg);
      } else {
        alert(friendlyMsg);
      }
    } finally {
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
      btn.textContent = origText;
    }
  }

  // =========================================================================
  // VIEW: Member (General Member / No Designation)
  // =========================================================================

  function renderMemberView(container, { user }) {
    container.replaceChildren();

    const wrap = el(
      "div",
      { className: "role-view role-view--member", role: "region", "aria-label": "Member Overview" },
      el(
        "div",
        { className: "role-header" },
        el("div", { className: "role-badge role-badge--neutral" }, "General Member"),
        el("h2", { className: "role-header__title" }, "Founder Journey"),
        el(
          "p",
          { className: "role-header__desc" },
          "Welcome to E-Cell SMVIT! As a general member, your journey starts with the Founder Checklist above. Validate your ideas, attend workshops, and connect with fellow founders."
        )
      ),
      el(
        "div",
        { className: "role-card role-card--info" },
        el("h3", { className: "role-card__title" }, "Domain Team Appointments"),
        el(
          "p",
          { className: "role-card__text" },
          "Looking to join an active domain (Tech, Events, Design, Corporate Relations)? Domain Heads appoint team executives and co-heads during recruitment cycles and project cohorts. Once assigned, your domain tasks, review queue, and team analytics will appear directly in this dashboard."
        )
      )
    );

    container.appendChild(wrap);
  }

  // =========================================================================
  // VIEW: Executive View
  // =========================================================================

  function renderExecutiveStats(tasks) {
    const total = tasks.length;
    let inProgress = 0;
    let submitted = 0;
    let approved = 0;
    let overdue = 0;

    tasks.forEach((t) => {
      const s = String(t.status || "").toLowerCase();
      // In-progress stats count strictly in_progress, NOT changes_requested
      if (s === "in_progress") inProgress++;
      else if (s === "submitted") submitted++;
      else if (s === "approved") approved++;

      if (isOverdue(t.due_date, t.status)) overdue++;
    });

    const completionRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    const stats = [
      { label: "Total Assigned", val: total, badge: "neutral" },
      { label: "In Progress", val: inProgress, badge: "accent" },
      { label: "Submitted", val: submitted, badge: "mark" },
      { label: "Approved", val: approved, badge: "ok" },
      { label: "Overdue", val: overdue, badge: overdue > 0 ? "err" : "neutral" },
      { label: "Completion %", val: `${completionRate}%`, badge: "display" },
    ];

    return el(
      "div",
      { className: "role-stats-grid", role: "region", "aria-label": "Task Statistics" },
      stats.map((st) =>
        el(
          "div",
          { className: `role-stat-card role-stat-card--${st.badge}` },
          el("span", { className: "role-stat-card__val" }, st.val),
          el("span", { className: "role-stat-card__label" }, st.label)
        )
      )
    );
  }

  // The 5 canonical statuses for grouping
  const STATUS_GROUPS = [
    { id: "in_progress", label: "In Progress" },
    { id: "changes_requested", label: "Changes Requested" },
    { id: "todo", label: "Todo" },
    { id: "submitted", label: "Submitted" },
    { id: "approved", label: "Approved" },
  ];

  function renderTasksSection(state, onTaskSelect, selectedTaskId) {
    const { tasks, directoryMap, loadingTasks, tasksError, refreshTasks } = state;

    const section = el("div", { className: "role-tasks-section", role: "region", "aria-label": "My Tasks" });
    const header = el(
      "div",
      { className: "role-section-head" },
      el("h3", { className: "role-section-head__title" }, "My Tasks"),
      el("span", { className: "role-count-tag" }, `${tasks.length} total`)
    );
    section.appendChild(header);

    if (loadingTasks) {
      section.appendChild(renderLoading("Loading your tasks…"));
      return section;
    }
    if (tasksError) {
      section.appendChild(renderError(tasksError, refreshTasks));
      return section;
    }
    if (tasks.length === 0) {
      section.appendChild(
        renderEmpty("No tasks assigned yet", "When your domain head assigns a task, it will appear here.")
      );
      return section;
    }

    // Accessible filter buttons (button semantics with aria-pressed, no fake tablist without keyboard navigation)
    const filterContainer = el("div", { className: "role-filter-bar", role: "group", "aria-label": "Filter tasks by status" });
    let currentFilter = "all";
    const filterButtons = [];

    const listContainer = el("div", { className: "role-tasks-list" });

    function updateFilteredList() {
      listContainer.replaceChildren();

      const groupsToRender = currentFilter === "all"
        ? STATUS_GROUPS
        : STATUS_GROUPS.filter((g) => g.id === currentFilter);

      let renderedAny = false;

      groupsToRender.forEach((group) => {
        const groupTasks = tasks.filter((t) => String(t.status || "").toLowerCase() === group.id);

        // When viewing all, skip groups with 0 tasks; when filtering by a specific status, show group or empty
        if (currentFilter === "all" && groupTasks.length === 0) {
          return;
        }

        renderedAny = true;
        const groupEl = el("div", { className: "role-task-group" });
        const groupHead = el(
          "div",
          { className: "role-task-group__head" },
          el("h4", { className: "role-task-group__title" }, group.label),
          el("span", { className: "role-task-group__count" }, `${groupTasks.length}`)
        );
        groupEl.appendChild(groupHead);

        if (groupTasks.length === 0) {
          groupEl.appendChild(renderEmpty(`No tasks in '${group.label}'`, "Select another filter to view your tasks."));
        } else {
          const cardList = el("div", { className: "role-task-group__list" });
          groupTasks.forEach((task) => {
            const isSelected = selectedTaskId === task.id;
            const overdueFlag = isOverdue(task.due_date, task.status);
            const assigner = directoryMap.get(task.assigned_by);
            const assignerName = assigner ? assigner.full_name : "Domain Lead";

            const card = el(
              "button",
              {
                type: "button",
                className: `role-task-card ${isSelected ? "role-task-card--selected" : ""}`,
                "aria-pressed": isSelected ? "true" : "false",
                onClick: () => onTaskSelect(task.id),
              },
              el(
                "div",
                { className: "role-task-card__top" },
                el("span", { className: "role-task-card__title" }, task.title),
                el(
                  "div",
                  { className: "role-task-card__badges" },
                  renderBadge(formatPriorityLabel(task.priority), task.priority === "high" ? "mark" : "neutral"),
                  renderBadge(formatStatusLabel(task.status), overdueFlag ? "err" : "accent", overdueFlag)
                )
              ),
              el(
                "div",
                { className: "role-task-card__meta" },
                el("span", { className: `role-meta-item ${overdueFlag ? "role-meta-item--overdue" : ""}` },
                  el("strong", {}, "Due: "),
                  formatDate(task.due_date),
                  overdueFlag ? " (Overdue)" : ""
                ),
                el("span", { className: "role-meta-item" },
                  el("strong", {}, "Assigner: "),
                  assignerName
                )
              )
            );

            cardList.appendChild(card);
          });
          groupEl.appendChild(cardList);
        }

        listContainer.appendChild(groupEl);
      });

      if (!renderedAny) {
        listContainer.appendChild(renderEmpty("No tasks match filter", "Select another filter to view your tasks."));
      }
    }

    const filterOptions = [
      { id: "all", label: "All" },
      { id: "in_progress", label: "In Progress" },
      { id: "changes_requested", label: "Changes Requested" },
      { id: "todo", label: "Todo" },
      { id: "submitted", label: "Submitted" },
      { id: "approved", label: "Approved" },
    ];

    filterOptions.forEach((f) => {
      const btn = el(
        "button",
        {
          type: "button",
          className: `role-filter-tab ${currentFilter === f.id ? "role-filter-tab--active" : ""}`,
          "aria-pressed": currentFilter === f.id ? "true" : "false",
          onClick: () => {
            currentFilter = f.id;
            filterButtons.forEach((b) => {
              const active = b.dataset.filter === f.id;
              b.className = `role-filter-tab ${active ? "role-filter-tab--active" : ""}`;
              b.setAttribute("aria-pressed", active ? "true" : "false");
            });
            updateFilteredList();
          },
        },
        f.label
      );
      btn.dataset.filter = f.id;
      filterButtons.push(btn);
      filterContainer.appendChild(btn);
    });

    section.appendChild(filterContainer);
    section.appendChild(listContainer);
    updateFilteredList();

    return section;
  }

  function renderTaskDetailPanel(state, selectedTaskId, onMutation) {
    const { tasks, directoryMap } = state;
    const task = tasks.find((t) => t.id === selectedTaskId);

    const panel = el("div", {
      className: "role-detail-panel",
      role: "region",
      "aria-label": "Task Detail Panel",
    });

    if (!task) {
      panel.appendChild(renderEmpty("No task selected", "Click any task card on the left to view details, timeline, and actions."));
      return panel;
    }

    const overdueFlag = isOverdue(task.due_date, task.status);
    const assigner = directoryMap.get(task.assigned_by);
    const assignerName = assigner ? assigner.full_name : "Domain Lead";

    // Panel Header
    const head = el(
      "div",
      { className: "role-detail-panel__head" },
      el("div", { className: "role-detail-panel__tags" },
        renderBadge(formatStatusLabel(task.status), overdueFlag ? "err" : "accent", overdueFlag),
        renderBadge(formatPriorityLabel(task.priority), task.priority === "high" ? "mark" : "neutral"),
        task.domain ? renderBadge(window.Roles.formatDomain(task.domain), "neutral") : null
      ),
      el("h3", { className: "role-detail-panel__title" }, task.title)
    );
    panel.appendChild(head);

    // Description
    const descSection = el(
      "div",
      { className: "role-detail-panel__desc" },
      el("h4", { className: "role-meta-label" }, "Description"),
      el("p", { className: "role-desc-text" }, task.description || "No description provided.")
    );
    panel.appendChild(descSection);

    // Meta details
    const metaGrid = el(
      "div",
      { className: "role-detail-meta-grid" },
      el("div", {},
        el("span", { className: "role-meta-label" }, "Assigned By"),
        el("span", { className: "role-meta-val" }, assignerName)
      ),
      el("div", {},
        el("span", { className: "role-meta-label" }, "Due Date"),
        el("span", { className: `role-meta-val ${overdueFlag ? "role-meta-val--overdue" : ""}` },
          formatDate(task.due_date),
          overdueFlag ? " (Overdue)" : ""
        )
      ),
      el("div", {},
        el("span", { className: "role-meta-label" }, "Created"),
        el("span", { className: "role-meta-val" }, formatDate(task.created_at))
      )
    );
    panel.appendChild(metaGrid);

    // Reviewer Feedback Section & Events Timeline
    const feedbackBox = el("div", { className: "role-detail-feedback" });
    const timelineBox = el("div", { className: "role-detail-timeline" });
    panel.appendChild(feedbackBox);
    panel.appendChild(timelineBox);

    // Real fetch and retry implementation for Task Events
    function loadHistory() {
      timelineBox.replaceChildren(renderLoading("Loading task history…"));
      feedbackBox.replaceChildren();

      window.Roles.fetchTaskEvents(task.id)
        .then((events) => {
          timelineBox.replaceChildren();
          feedbackBox.replaceChildren();

          // Check for latest review feedback
          const reviewEvents = events.filter((e) => e.action === "approved" || e.action === "changes_requested");
          if (reviewEvents.length > 0) {
            const lastReview = reviewEvents[reviewEvents.length - 1];
            const reviewer = directoryMap.get(lastReview.actor_id);
            const reviewerName = reviewer ? reviewer.full_name : "Reviewer";
            const isApproval = lastReview.action === "approved";

            const fbCard = el(
              "div",
              { className: `role-feedback-card role-feedback-card--${isApproval ? "ok" : "err"}` },
              el("h4", { className: "role-feedback-card__title" },
                isApproval ? "Task Approved" : "Changes Requested"
              ),
              el("p", { className: "role-feedback-card__meta" },
                `Reviewed by ${reviewerName} on ${formatDateTime(lastReview.created_at)}`
              ),
              lastReview.note ? el("p", { className: "role-feedback-card__note" }, lastReview.note) : null
            );
            feedbackBox.appendChild(fbCard);
          }

          // Render Event History Timeline
          timelineBox.appendChild(el("h4", { className: "role-meta-label" }, "Event History"));
          if (events.length === 0) {
            timelineBox.appendChild(el("p", { className: "role-meta-hint" }, "No event history recorded yet."));
          } else {
            const timelineList = el("ul", { className: "role-timeline-list" });
            events.forEach((ev) => {
              const actor = directoryMap.get(ev.actor_id);
              const actorName = actor ? actor.full_name : (ev.actor_id === state.user.id ? "You" : "Team Member");
              const li = el(
                "li",
                { className: "role-timeline-item" },
                el("div", { className: "role-timeline-dot" }),
                el("div", { className: "role-timeline-content" },
                  el("div", { className: "role-timeline-head" },
                    el("strong", {}, `${actorName} · ${(ev.action || "").replace(/_/g, " ")}`),
                    el("time", {}, formatDateTime(ev.created_at))
                  ),
                  ev.note ? el("p", { className: "role-timeline-note" }, ev.note) : null
                )
              );
              timelineList.appendChild(li);
            });
            timelineBox.appendChild(timelineList);
          }
        })
        .catch((err) => {
          timelineBox.replaceChildren(
            renderError((err && err.message) || "Could not load event history.", () => loadHistory())
          );
        });
    }

    loadHistory();

    // Task Actions
    const actionsBox = el("div", { className: "role-detail-actions" });
    const s = String(task.status || "").toLowerCase();

    if (s === "todo") {
      const startBtn = el(
        "button",
        {
          type: "button",
          className: "btn btn--primary role-btn",
          onClick: () => {
            withPending(
              startBtn,
              "Starting…",
              () => window.Roles.startTask(task.id),
              "Task started! You can now submit your work.",
              onMutation
            );
          },
        },
        "Start Task"
      );
      actionsBox.appendChild(startBtn);
    } else if (s === "changes_requested") {
      // Must call start_task before submitting changes, transitioning back to in_progress
      const restartBtn = el(
        "button",
        {
          type: "button",
          className: "btn btn--primary role-btn",
          onClick: () => {
            withPending(
              restartBtn,
              "Starting…",
              () => window.Roles.startTask(task.id),
              "Task restarted! You can now resume your work and submit.",
              onMutation
            );
          },
        },
        "Restart Task"
      );
      actionsBox.appendChild(restartBtn);
    } else if (s === "in_progress") {
      const form = el("form", {
        className: "role-submit-form",
        onSubmit: (e) => {
          e.preventDefault();
          const noteInput = form.querySelector("#submit-note");
          const linkInput = form.querySelector("#submit-link");
          const note = noteInput ? noteInput.value : "";
          const link = linkInput ? linkInput.value.trim() : "";

          if (link && !isSafeHttps(link)) {
            if (window.showToast) window.showToast("Link must be a valid https:// address.");
            return;
          }

          const submitBtn = form.querySelector('button[type="submit"]');
          withPending(
            submitBtn,
            "Submitting…",
            () => window.Roles.submitTask(task.id, note, link),
            "Task submitted for review!",
            onMutation
          );
        },
      });

      const noteGroup = el(
        "div",
        { className: "role-form-group" },
        el("label", { htmlFor: "submit-note", className: "role-label" }, "Submission Note"),
        el("textarea", {
          id: "submit-note",
          className: "role-textarea",
          rows: "3",
          maxlength: "2000",
          placeholder: "Describe the work completed or share summary notes…",
        })
      );

      const linkGroup = el(
        "div",
        { className: "role-form-group" },
        el("label", { htmlFor: "submit-link", className: "role-label" },
          "Optional Submission Link ",
          el("span", { className: "role-label-opt" }, "(https:// only)")
        ),
        el("input", {
          type: "url",
          id: "submit-link",
          className: "role-input",
          placeholder: "https://github.com/… or https://drive.google.com/…",
        })
      );

      const submitBtn = el(
        "button",
        { type: "submit", className: "btn btn--primary role-btn" },
        "Submit Task"
      );

      form.appendChild(noteGroup);
      form.appendChild(linkGroup);
      form.appendChild(submitBtn);
      actionsBox.appendChild(form);
    } else if (s === "submitted") {
      const notice = el("div", { className: "role-status-notice role-status-notice--pending" },
        el("strong", {}, "Awaiting Review"),
        el("p", {}, "Your task has been submitted and is in the review queue. Domain leads will review your work soon.")
      );
      if (task.submission_note) {
        notice.appendChild(el("p", { className: "role-meta-hint" }, el("strong", {}, "Submitted Note: "), task.submission_note));
      }
      if (task.submission_link) {
        const linkEl = renderSafeLink(task.submission_link);
        if (linkEl) {
          notice.appendChild(el("p", { className: "role-meta-hint" }, el("strong", {}, "Submitted Link: "), linkEl));
        }
      }
      actionsBox.appendChild(notice);
    } else if (s === "approved") {
      actionsBox.appendChild(
        el("div", { className: "role-status-notice role-status-notice--completed" },
          el("strong", {}, "Task Complete"),
          el("p", {}, "Great work! This task has been reviewed and approved.")
        )
      );
    }

    panel.appendChild(actionsBox);
    return panel;
  }

  // =========================================================================
  // VIEW: Co-Head Additions (My team stats, Assign form, Review queue)
  // =========================================================================

  function renderTeamStatsTable(state, title, filterFn) {
    const { teamStats, loadingTeamStats, teamStatsError, refreshTeamStats } = state;

    const section = el("div", { className: "role-team-stats-section", role: "region", "aria-label": title });
    section.appendChild(el("h3", { className: "role-section-head__title" }, title));

    if (loadingTeamStats) {
      section.appendChild(renderLoading("Loading team stats…"));
      return section;
    }
    if (teamStatsError) {
      section.appendChild(renderError(teamStatsError, refreshTeamStats));
      return section;
    }

    const members = filterFn ? teamStats.filter(filterFn) : teamStats;

    if (members.length === 0) {
      section.appendChild(renderEmpty("No members found", "No team members match this category yet."));
      return section;
    }

    const tableWrap = el("div", {
      className: "role-table-wrap",
      role: "region",
      tabindex: "0",
      "aria-label": `${title} table`,
    });
    const table = el("table", { className: "role-table", "aria-label": `${title} stats` });

    // Table Header (Approved is sole done status)
    const thead = el(
      "thead",
      {},
      el(
        "tr",
        {},
        el("th", { scope: "col" }, "Member"),
        el("th", { scope: "col" }, "Designation"),
        el("th", { scope: "col" }, "Todo"),
        el("th", { scope: "col" }, "In Prog"),
        el("th", { scope: "col" }, "Submitted"),
        el("th", { scope: "col" }, "Approved"),
        el("th", { scope: "col" }, "Overdue"),
        el("th", { scope: "col" }, "Total"),
        el("th", { scope: "col" }, "Rate")
      )
    );

    const tbody = el("tbody", {});
    members.forEach((m) => {
      const isOverdueMember = Number(m.overdue) > 0;
      const tr = el(
        "tr",
        {},
        el("td", { className: "role-table__name" },
          el("strong", {}, m.full_name || "—"),
          el("small", { className: "role-table__id" }, m.member_id || "")
        ),
        el("td", {}, window.Roles.formatDesignation(m.designation)),
        el("td", {}, m.todo || 0),
        el("td", {}, m.in_progress || 0),
        el("td", {}, m.submitted || 0),
        el("td", { className: "role-table__completed" }, m.approved || 0),
        el("td", { className: isOverdueMember ? "role-table__overdue" : "" }, m.overdue || 0),
        el("td", {}, m.total || 0),
        el("td", { className: "role-table__rate" }, formatRate(m.completion_rate))
      );
      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    section.appendChild(tableWrap);

    return section;
  }

  function renderAssignTaskForm(state, onMutation, allowedDesignations = ["executive"]) {
    const { user, directory, loadingDirectory, directoryError, refreshDirectory } = state;

    const section = el("div", { className: "role-card role-assign-section", role: "region", "aria-label": "Assign Task" });
    section.appendChild(el("h3", { className: "role-card__title" }, "Assign New Task"));

    if (loadingDirectory) {
      section.appendChild(renderLoading("Loading assignable members…"));
      return section;
    }
    if (directoryError) {
      section.appendChild(renderError(directoryError, refreshDirectory));
      return section;
    }

    // Filter subordinates: same domain AND designation in allowedDesignations
    const subordinates = directory.filter((m) => {
      const d = window.Roles.normalizeRole(m.designation);
      return allowedDesignations.includes(d);
    });

    const form = el("form", {
      className: "role-form",
      onSubmit: (e) => {
        e.preventDefault();
        const titleEl = form.querySelector("#task-title");
        const descEl = form.querySelector("#task-desc");
        const memberEl = form.querySelector("#task-member");
        const priorityEl = form.querySelector("#task-priority");
        const dueEl = form.querySelector("#task-due");

        const title = titleEl ? titleEl.value.trim() : "";
        const description = descEl ? descEl.value.trim() : "";
        const assigned_to = memberEl ? memberEl.value : "";
        const priority = priorityEl ? priorityEl.value : "medium";
        const due_date = dueEl && dueEl.value ? dueEl.value : null;

        if (!title) {
          if (window.showToast) window.showToast("Task title is required.");
          return;
        }
        if (!assigned_to) {
          if (window.showToast) window.showToast("Please choose an assignee.");
          return;
        }

        const btn = form.querySelector('button[type="submit"]');
        withPending(
          btn,
          "Assigning…",
          () =>
            window.Roles.createTask({
              title,
              description,
              assigned_to,
              assigned_by: user.id,
              domain: user.domain,
              priority,
              due_date,
            }),
          "Task assigned successfully!",
          () => {
            form.reset();
            onMutation();
          }
        );
      },
    });

    // Title (maxlength 120 matching SQL)
    const titleGroup = el(
      "div",
      { className: "role-form-group" },
      el("label", { htmlFor: "task-title", className: "role-label" }, "Task Title *"),
      el("input", {
        type: "text",
        id: "task-title",
        className: "role-input",
        required: true,
        maxlength: "120",
        placeholder: "e.g., Build hackathon registration API",
      })
    );

    // Description (maxlength 2000 matching SQL)
    const descGroup = el(
      "div",
      { className: "role-form-group" },
      el("label", { htmlFor: "task-desc", className: "role-label" }, "Description"),
      el("textarea", {
        id: "task-desc",
        className: "role-textarea",
        rows: "2",
        maxlength: "2000",
        placeholder: "Acceptance criteria, constraints, or links…",
      })
    );

    // Assignee Picker
    const memberSelect = el(
      "select",
      { id: "task-member", className: "role-select", required: true },
      el("option", { value: "" }, "Select a subordinate…"),
      subordinates.map((sub) =>
        el(
          "option",
          { value: sub.id },
          `${sub.full_name} (${window.Roles.formatDesignation(sub.designation)})`
        )
      )
    );

    const memberGroup = el(
      "div",
      { className: "role-form-group" },
      el("label", { htmlFor: "task-member", className: "role-label" }, "Assignee *"),
      memberSelect
    );

    // Priority (Low, Medium, High - no urgent) & Due Date Row
    const row = el(
      "div",
      { className: "role-form-row" },
      el(
        "div",
        { className: "role-form-group" },
        el("label", { htmlFor: "task-priority", className: "role-label" }, "Priority"),
        el(
          "select",
          { id: "task-priority", className: "role-select" },
          el("option", { value: "low" }, "Low"),
          el("option", { value: "medium", selected: true }, "Medium"),
          el("option", { value: "high" }, "High")
        )
      ),
      el(
        "div",
        { className: "role-form-group" },
        el("label", { htmlFor: "task-due", className: "role-label" }, "Due Date"),
        el("input", { type: "date", id: "task-due", className: "role-input" })
      )
    );

    const submitBtn = el(
      "button",
      { type: "submit", className: "btn btn--primary role-btn" },
      "Assign Task"
    );

    form.appendChild(titleGroup);
    form.appendChild(descGroup);
    form.appendChild(memberGroup);
    form.appendChild(row);
    form.appendChild(submitBtn);

    section.appendChild(form);
    return section;
  }

  function renderReviewQueue(state, onMutation) {
    const { domainTasks, directoryMap, loadingDomainTasks, domainTasksError, refreshDomainTasks, user } = state;

    const section = el("div", { className: "role-review-queue", role: "region", "aria-label": "Review Queue" });
    const head = el(
      "div",
      { className: "role-section-head" },
      el("h3", { className: "role-section-head__title" }, "Review Queue"),
      el("span", { className: "role-count-tag" }, "Submitted tasks")
    );
    section.appendChild(head);

    if (loadingDomainTasks) {
      section.appendChild(renderLoading("Loading review queue…"));
      return section;
    }
    if (domainTasksError) {
      section.appendChild(renderError(domainTasksError, refreshDomainTasks));
      return section;
    }

    const callerRank = window.Roles.roleRank(user.designation);

    // Exclude tasks assigned to the caller and only show lower role targets in the same domain
    const submitted = domainTasks.filter((t) => {
      if (String(t.status || "").toLowerCase() !== "submitted") return false;
      const assigneeId = t.assigned_to || t.assignee_id;
      if (assigneeId === user.id) return false; // Strictly exclude caller to avoid illegal self-review

      const assignee = directoryMap.get(assigneeId);
      if (!assignee) return false;
      if (assignee.domain && assignee.domain !== user.domain) return false;
      const assigneeRank = window.Roles.roleRank(assignee.designation);
      return callerRank > assigneeRank && assigneeRank > 0;
    });

    if (submitted.length === 0) {
      section.appendChild(
        renderEmpty("Review queue is clear!", "All submitted tasks have been reviewed. Good work!")
      );
      return section;
    }

    const list = el("div", { className: "role-review-list" });

    submitted.forEach((task) => {
      const assigneeId = task.assigned_to || task.assignee_id;
      const assignee = directoryMap.get(assigneeId);
      const assigneeName = assignee ? assignee.full_name : "Team Member";

      const card = el("div", { className: "role-review-card" });
      const top = el(
        "div",
        { className: "role-review-card__top" },
        el("h4", { className: "role-review-card__title" }, task.title),
        el("span", { className: "role-badge role-badge--mark" }, "Needs Review")
      );
      card.appendChild(top);

      const meta = el(
        "div",
        { className: "role-review-card__meta" },
        el("span", {}, el("strong", {}, "Assignee: "), assigneeName),
        el("span", {}, el("strong", {}, "Due: "), formatDate(task.due_date)),
        el("span", {}, el("strong", {}, "Priority: "), formatPriorityLabel(task.priority))
      );
      card.appendChild(meta);

      if (task.description) {
        card.appendChild(
          el("p", { className: "role-review-card__desc" }, el("strong", {}, "Task: "), task.description)
        );
      }

      if (task.submission_note) {
        card.appendChild(
          el("p", { className: "role-review-card__note" }, el("strong", {}, "Submission Note: "), task.submission_note)
        );
      }

      if (task.submission_link) {
        const linkEl = renderSafeLink(task.submission_link);
        if (linkEl) {
          card.appendChild(
            el("p", { className: "role-review-card__link" }, el("strong", {}, "Submission Link: "), linkEl)
          );
        }
      }

      // Review actions container (maxlength 2000 for reviewer feedback)
      const reviewBox = el("div", { className: "role-review-action-box" });
      const noteInput = el("textarea", {
        className: "role-textarea",
        rows: "2",
        maxlength: "2000",
        placeholder: "Reviewer feedback or required changes…",
        "aria-label": `Feedback note for ${task.title}`,
      });

      const btnRow = el("div", { className: "role-review-btn-row" });

      const approveBtn = el(
        "button",
        {
          type: "button",
          className: "btn btn--small btn--primary role-btn",
          "aria-label": `Approve ${task.title}`,
          onClick: () => {
            const note = noteInput.value.trim();
            withPending(
              approveBtn,
              "Approving…",
              () => window.Roles.reviewTask(task.id, "approved", note),
              "Task approved!",
              onMutation
            );
          },
        },
        "Approve"
      );

      const requestChangesBtn = el(
        "button",
        {
          type: "button",
          className: "btn btn--small role-btn role-btn--warn",
          "aria-label": `Request changes for ${task.title}`,
          onClick: () => {
            const note = noteInput.value.trim();
            withPending(
              requestChangesBtn,
              "Sending…",
              () => window.Roles.reviewTask(task.id, "changes_requested", note),
              "Changes requested.",
              onMutation
            );
          },
        },
        "Request Changes"
      );

      btnRow.appendChild(approveBtn);
      btnRow.appendChild(requestChangesBtn);

      reviewBox.appendChild(noteInput);
      reviewBox.appendChild(btnRow);
      card.appendChild(reviewBox);

      list.appendChild(card);
    });

    section.appendChild(list);
    return section;
  }

  // =========================================================================
  // VIEW: Head Additions (Domain totals, Overdue list, Manage Team)
  // =========================================================================

  function renderDomainTotals(state) {
    const { domainTasks, loadingDomainTasks, domainTasksError, refreshDomainTasks } = state;

    const section = el("div", { className: "role-card role-domain-totals", role: "region", "aria-label": "Domain Overview Totals" });
    section.appendChild(
      el("div", { className: "role-domain-totals__head" },
        el("h3", { className: "role-card__title" }, "Domain Task Totals")
      )
    );

    if (loadingDomainTasks) {
      section.appendChild(renderLoading("Loading domain overview…"));
      return section;
    }
    if (domainTasksError) {
      section.appendChild(renderError(domainTasksError, refreshDomainTasks));
      return section;
    }

    const total = domainTasks.length;
    let approved = 0;
    let inProgress = 0;
    let submitted = 0;
    let overdue = 0;

    domainTasks.forEach((t) => {
      const s = String(t.status || "").toLowerCase();
      if (s === "approved") approved++;
      else if (s === "in_progress") inProgress++;
      else if (s === "submitted") submitted++;

      if (isOverdue(t.due_date, t.status)) overdue++;
    });

    const completionRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    section.replaceChildren(
      el("div", { className: "role-domain-totals__head" },
        el("h3", { className: "role-card__title" }, "Domain Task Totals"),
        el("span", { className: "role-badge role-badge--accent" }, `${completionRate}% Overall Completion`)
      ),
      el(
        "div",
        { className: "role-totals-grid" },
        el("div", { className: "role-total-metric" },
          el("span", { className: "role-total-metric__num" }, total),
          el("span", { className: "role-total-metric__lbl" }, "Total Tasks")
        ),
        el("div", { className: "role-total-metric" },
          el("span", { className: "role-total-metric__num" }, approved),
          el("span", { className: "role-total-metric__lbl" }, "Approved")
        ),
        el("div", { className: "role-total-metric" },
          el("span", { className: "role-total-metric__num" }, inProgress),
          el("span", { className: "role-total-metric__lbl" }, "In Progress")
        ),
        el("div", { className: "role-total-metric" },
          el("span", { className: "role-total-metric__num" }, submitted),
          el("span", { className: "role-total-metric__lbl" }, "In Review")
        ),
        el("div", { className: "role-total-metric" },
          el("span", { className: `role-total-metric__num ${overdue > 0 ? "role-total-metric__num--err" : ""}` }, overdue),
          el("span", { className: "role-total-metric__lbl" }, "Overdue")
        )
      )
    );

    return section;
  }

  function renderOverdueList(state) {
    const { domainTasks, directoryMap, loadingDomainTasks, domainTasksError, refreshDomainTasks } = state;

    const section = el("div", { className: "role-card role-overdue-section", role: "region", "aria-label": "Overdue Tasks" });
    section.appendChild(el("h3", { className: "role-card__title role-card__title--err" }, "Overdue Tasks"));

    if (loadingDomainTasks) {
      section.appendChild(renderLoading("Loading overdue tasks…"));
      return section;
    }
    if (domainTasksError) {
      section.appendChild(renderError(domainTasksError, refreshDomainTasks));
      return section;
    }

    const overdueTasks = domainTasks.filter((t) => isOverdue(t.due_date, t.status));
    section.replaceChildren(
      el("h3", { className: "role-card__title role-card__title--err" }, `Overdue Tasks (${overdueTasks.length})`)
    );

    if (overdueTasks.length === 0) {
      section.appendChild(renderEmpty("No overdue tasks", "All tasks in this domain are on track!"));
      return section;
    }

    const list = el("ul", { className: "role-overdue-list" });
    overdueTasks.forEach((t) => {
      const assigneeId = t.assigned_to || t.assignee_id;
      const assignee = directoryMap.get(assigneeId);
      const assigneeName = assignee ? assignee.full_name : "Team Member";

      const li = el(
        "li",
        { className: "role-overdue-item" },
        el("div", { className: "role-overdue-item__main" },
          el("strong", { className: "role-overdue-item__title" }, t.title),
          el("span", { className: "role-overdue-item__sub" }, `Assigned to: ${assigneeName}`)
        ),
        el("div", { className: "role-overdue-item__right" },
          renderBadge(formatPriorityLabel(t.priority), t.priority === "high" ? "mark" : "neutral"),
          el("span", { className: "role-badge role-badge--err" }, `Due: ${formatDate(t.due_date)}`)
        )
      );
      list.appendChild(li);
    });

    section.appendChild(list);
    return section;
  }

  function renderManageTeam(state, onMutation) {
    const { user, directory, loadingDirectory, directoryError, refreshDirectory } = state;

    const section = el("div", { className: "role-card role-manage-team", role: "region", "aria-label": "Manage Team" });
    section.appendChild(el("h3", { className: "role-card__title" }, "Manage Team"));

    // 1. Lookup Box (Head-only exact lookup minimal eligible profile)
    const lookupBox = el("div", { className: "role-lookup-box" });
    lookupBox.appendChild(
      el("p", { className: "role-meta-hint" }, "Lookup an unassigned member by exact email or Member ID (e.g. user@smvit.edu or ECS-2026-XXXXXX):")
    );

    const lookupForm = el("form", {
      className: "role-lookup-form",
      "aria-label": "Member lookup",
      onSubmit: (e) => {
        e.preventDefault();
        const input = lookupForm.querySelector("#member-lookup");
        const query = input ? input.value.trim() : "";
        if (!query) return;

        const findBtn = lookupForm.querySelector('button[type="submit"]');
        resultBox.replaceChildren(renderLoading("Looking up member…"));

        withPending(
          findBtn,
          "Searching…",
          async () => {
            const member = await window.Roles.findMember(query);
            resultBox.replaceChildren();
            if (!member) {
              resultBox.appendChild(renderEmpty("No member found", "Ensure the email or member ID is exact and member is unassigned."));
              return;
            }

            // Candidate Result Card
            const card = el("div", { className: "role-candidate-card" });
            card.appendChild(
              el("div", { className: "role-candidate-card__info" },
                el("strong", {}, member.full_name || "Unknown Name"),
                el("span", {}, ` · ${member.email || "No email"}`),
                el("small", { className: "role-candidate-card__id" }, ` [${member.member_id || member.id}]`)
              )
            );

            // Assignment form
            const candidateName = member.full_name || "member";
            const assignForm = el("div", { className: "role-candidate-action-row" });
            const desSelect = el(
              "select",
              {
                className: "role-select role-select--small",
                "aria-label": `Designation for ${candidateName}`,
              },
              el("option", { value: "executive" }, "Executive"),
              el("option", { value: "co_head" }, "Co-Head")
            );

            const assignBtn = el(
              "button",
              {
                type: "button",
                className: "btn btn--small btn--primary role-btn",
                "aria-label": `Assign ${candidateName} to domain`,
                onClick: () => {
                  withPending(
                    assignBtn,
                    "Assigning…",
                    () => window.Roles.assignMember(member.id, user.domain, desSelect.value),
                    `Assigned ${member.full_name} as ${window.Roles.formatDesignation(desSelect.value)}!`,
                    () => {
                      resultBox.replaceChildren();
                      onMutation();
                    }
                  );
                },
              },
              "Assign to Domain"
            );

            assignForm.appendChild(desSelect);
            assignForm.appendChild(assignBtn);
            card.appendChild(assignForm);
            resultBox.appendChild(card);
          },
          null,
          null
        );
      },
    });

    const searchGroup = el(
      "div",
      { className: "role-form-group" },
      el("label", { htmlFor: "member-lookup", className: "role-label" }, "Member Lookup (Email or Member ID)"),
      el(
        "div",
        { className: "role-search-row" },
        el("input", {
          type: "text",
          id: "member-lookup",
          className: "role-input",
          placeholder: "Enter exact email or Member ID…",
          "aria-label": "Member email or Member ID",
          required: true,
        }),
        el("button", { type: "submit", className: "btn btn--primary role-btn" }, "Find Member")
      )
    );

    lookupForm.appendChild(searchGroup);
    lookupBox.appendChild(lookupForm);

    const resultBox = el("div", { className: "role-lookup-result" });
    lookupBox.appendChild(resultBox);
    section.appendChild(lookupBox);

    // 2. Active Domain Roster
    const rosterSection = el("div", { className: "role-roster-section" });
    rosterSection.appendChild(el("h4", { className: "role-section-head__title" }, "Active Domain Roster"));

    if (loadingDirectory) {
      rosterSection.appendChild(renderLoading("Loading team roster…"));
    } else if (directoryError) {
      rosterSection.appendChild(renderError(directoryError, refreshDirectory));
    } else {
      // Subordinates in domain (Co-Heads and Executives)
      const roster = directory.filter((m) => {
        const d = window.Roles.normalizeRole(m.designation);
        return (d === "co_head" || d === "executive") && m.id !== user.id;
      });

      if (roster.length === 0) {
        rosterSection.appendChild(renderEmpty("No subordinates in roster", "Use the search above to add executives or co-heads to your domain."));
      } else {
        const rosterList = el("ul", { className: "role-roster-list" });
        roster.forEach((mem) => {
          const currentRole = window.Roles.normalizeRole(mem.designation);
          const memberName = mem.full_name || "member";
          const li = el("li", { className: "role-roster-item" });

          const info = el(
            "div",
            { className: "role-roster-item__info" },
            el("strong", {}, mem.full_name),
            el("span", { className: "role-badge role-badge--neutral" }, window.Roles.formatDesignation(mem.designation)),
            el("small", { className: "role-roster-item__id" }, mem.member_id || "")
          );
          li.appendChild(info);

          const actions = el("div", { className: "role-roster-item__actions" });

          // Change lower role
          const roleSelect = el(
            "select",
            {
              className: "role-select role-select--small",
              "aria-label": `Designation for ${memberName}`,
            },
            el("option", { value: "executive", selected: currentRole === "executive" }, "Executive"),
            el("option", { value: "co_head", selected: currentRole === "co_head" }, "Co-Head")
          );

          const updateBtn = el(
            "button",
            {
              type: "button",
              className: "btn btn--small role-btn",
              "aria-label": `Change designation for ${memberName}`,
              onClick: () => {
                withPending(
                  updateBtn,
                  "Updating…",
                  () => window.Roles.assignMember(mem.id, user.domain, roleSelect.value),
                  `Role updated for ${mem.full_name}`,
                  onMutation
                );
              },
            },
            "Change"
          );

          const removeBtn = el(
            "button",
            {
              type: "button",
              className: "btn btn--small role-btn role-btn--danger",
              "aria-label": `Remove ${memberName}`,
              onClick: () => {
                if (confirm(`Are you sure you want to remove ${mem.full_name} from the domain team?`)) {
                  withPending(
                    removeBtn,
                    "Removing…",
                    () => window.Roles.removeMember(mem.id),
                    `Removed ${mem.full_name} from domain.`,
                    onMutation
                  );
                }
              },
            },
            "Remove"
          );

          actions.appendChild(roleSelect);
          actions.appendChild(updateBtn);
          actions.appendChild(removeBtn);
          li.appendChild(actions);

          rosterList.appendChild(li);
        });
        rosterSection.appendChild(rosterList);
      }
    }

    section.appendChild(rosterSection);
    return section;
  }

  // =========================================================================
  // VIEW RENDERER DISPATCHER
  // =========================================================================

  async function render(container, user) {
    if (!container) return;

    const role = window.Roles ? window.Roles.normalizeRole(user.designation) : "member";

    // For General Member: no complex data calls, render immediately
    if (role === "member") {
      renderMemberView(container, { user });
      return;
    }

    // State management for Executive, Co-Head, and Head
    const state = {
      user,
      role,
      tasks: [],
      domainTasks: [],
      directory: [],
      directoryMap: new Map(),
      teamStats: [],
      selectedTaskId: null,
      loadingTasks: true,
      tasksError: null,
      loadingDomainTasks: false,
      domainTasksError: null,
      loadingTeamStats: false,
      teamStatsError: null,
      loadingDirectory: true,
      directoryError: null,
      refreshTasks: null,
      refreshDomainTasks: null,
      refreshTeamStats: null,
      refreshDirectory: null,
    };

    container.replaceChildren(renderLoading("Loading domain dashboard…"));

    async function loadData() {
      state.loadingTasks = true;
      state.loadingDirectory = true;
      state.tasksError = null;
      state.directoryError = null;

      const isSenior = (role === "co_head" || role === "head");
      if (isSenior) {
        state.loadingDomainTasks = true;
        state.loadingTeamStats = true;
        state.domainTasksError = null;
        state.teamStatsError = null;
      }

      const [userTasksRes, dirRes, statsRes, domTasksRes] = await Promise.allSettled([
        window.Roles.fetchTasks({ assignedTo: user.id }),
        window.Roles.getTeamDirectory(),
        isSenior ? window.Roles.getTeamStats() : Promise.resolve([]),
        isSenior ? window.Roles.fetchTasks({ domain: user.domain }) : Promise.resolve([]),
      ]);

      if (userTasksRes.status === "fulfilled") {
        state.tasks = userTasksRes.value || [];
      } else {
        state.tasksError = (userTasksRes.reason && userTasksRes.reason.message) || "Failed to load tasks.";
      }
      state.loadingTasks = false;

      if (dirRes.status === "fulfilled") {
        state.directory = dirRes.value || [];
        state.directoryMap = new Map((dirRes.value || []).map((m) => [m.id, m]));
      } else {
        state.directoryError = (dirRes.reason && dirRes.reason.message) || "Failed to load team directory.";
      }
      state.loadingDirectory = false;

      if (isSenior) {
        if (statsRes.status === "fulfilled") {
          state.teamStats = statsRes.value || [];
        } else {
          state.teamStatsError = (statsRes.reason && statsRes.reason.message) || "Failed to load team stats.";
        }
        state.loadingTeamStats = false;

        if (domTasksRes.status === "fulfilled") {
          state.domainTasks = domTasksRes.value || [];
        } else {
          state.domainTasksError = (domTasksRes.reason && domTasksRes.reason.message) || "Failed to load domain tasks.";
        }
        state.loadingDomainTasks = false;
      }

      // Auto-select first task if not already selected
      if (!state.selectedTaskId && state.tasks.length > 0) {
        state.selectedTaskId = state.tasks[0].id;
      } else if (state.selectedTaskId && !state.tasks.some((t) => t.id === state.selectedTaskId)) {
        state.selectedTaskId = state.tasks.length > 0 ? state.tasks[0].id : null;
      }

      renderView();
    }

    state.refreshTasks = loadData;
    state.refreshDomainTasks = loadData;
    state.refreshTeamStats = loadData;
    state.refreshDirectory = loadData;

    function renderView() {
      container.replaceChildren();

      const viewWrap = el("div", {
        className: `role-view role-view--${role}`,
        role: "region",
        "aria-label": `${window.Roles.formatPassRole(user.domain, user.designation)} Dashboard`,
      });

      // 1. Executive Section (common to Executive, Co-Head, and Head)
      const execSection = el("section", { className: "role-composite-section", "aria-label": "Personal Tasks & Stats" });
      execSection.appendChild(renderExecutiveStats(state.tasks));

      const tasksAndDetailGrid = el("div", { className: "role-tasks-grid" });

      const tasksListSection = renderTasksSection(state, (taskId) => {
        state.selectedTaskId = taskId;
        renderView();
      }, state.selectedTaskId);

      const detailPanel = renderTaskDetailPanel(state, state.selectedTaskId, loadData);

      tasksAndDetailGrid.appendChild(tasksListSection);
      tasksAndDetailGrid.appendChild(detailPanel);
      execSection.appendChild(tasksAndDetailGrid);
      viewWrap.appendChild(execSection);

      // 2. Co-Head Section
      if (role === "co_head") {
        const coheadSection = el("section", { className: "role-composite-section", "aria-label": "Co-Head Controls" });
        coheadSection.appendChild(el("hr", { className: "role-divider" }));

        // Team stats for Executives only
        coheadSection.appendChild(
          renderTeamStatsTable(
            state,
            "My Team Stats (Executives)",
            (m) => window.Roles.normalizeRole(m.designation) === "executive"
          )
        );

        // Assign Form (subordinates only -> Executives)
        coheadSection.appendChild(renderAssignTaskForm(state, loadData, ["executive"]));

        // Review Queue
        coheadSection.appendChild(renderReviewQueue(state, loadData));

        viewWrap.appendChild(coheadSection);
      }

      // 3. Head Section
      if (role === "head") {
        const headSection = el("section", { className: "role-composite-section", "aria-label": "Domain Head Controls" });
        headSection.appendChild(el("hr", { className: "role-divider" }));

        // Domain Totals & Overdue List
        headSection.appendChild(renderDomainTotals(state));
        headSection.appendChild(renderOverdueList(state));

        // Team Grouped: Co-Heads first, then Executives
        const teamStatsBox = el("div", { className: "role-card role-grouped-team-stats" });
        teamStatsBox.appendChild(el("h3", { className: "role-card__title" }, "Domain Team Statistics"));
        teamStatsBox.appendChild(
          renderTeamStatsTable(
            state,
            "Co-Heads",
            (m) => window.Roles.normalizeRole(m.designation) === "co_head"
          )
        );
        teamStatsBox.appendChild(
          renderTeamStatsTable(
            state,
            "Executives",
            (m) => window.Roles.normalizeRole(m.designation) === "executive"
          )
        );
        headSection.appendChild(teamStatsBox);

        // Assign Form (can assign to any subordinate -> co_head or executive)
        headSection.appendChild(renderAssignTaskForm(state, loadData, ["co_head", "executive"]));

        // Review Queue (whole domain)
        headSection.appendChild(renderReviewQueue(state, loadData));

        // Manage Team (lookup, add, change lower roles, remove)
        headSection.appendChild(renderManageTeam(state, loadData));

        viewWrap.appendChild(headSection);
      }

      container.appendChild(viewWrap);
    }

    await loadData();
  }

  window.RoleDashboard = {
    render,
  };
})();
