// Dashboard: guard the page, greet the member, run the founder checklist.
(function () {
  const STEPS = [
    ["joined", "Join E-Cell", "Done when you created your account."],
    ["thesis", "Write your one-line idea", "Who has the problem, and why now?"],
    ["users", "Talk to five potential users", "Ask about their problem, not your solution."],
    ["build", "Join a hackathon team", "Ship a prototype someone can click."],
    ["pitch", "Pitch at an E-Cell event", "Three minutes, one ask."],
  ];

  const $ = (id) => document.getElementById(id);
  // Arriving from the confirmation email: Supabase puts type=signup in the URL hash.
  const fromConfirmLink = /type=signup/.test(location.hash);

  async function init() {
    let res;
    try {
      res = await Auth.me();
    } catch (err) {
      $("loading").textContent = `${err.message} Refresh the page to try again.`;
      return;
    }
    if (!res) {
      location.replace("login.html");
      return;
    }
    const user = res.user;
    const first = user.name.split(" ")[0];

    $("hello").textContent = `Welcome, ${first}.`;
    $("hello-sub").textContent = `You're signed in as ${user.email}. This is your E-Cell home base.`;
    $("pass-name").textContent = user.name;
    $("pass-id").textContent = user.memberId;
    $("pass-usn").textContent = user.usn || "Not added";
    $("pass-since").textContent = new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    // Pass role display: Tech · Executive etc.
    const formattedRole = window.Roles
      ? window.Roles.formatPassRole(user.domain, user.designation)
      : (user.designation || "Member");

    const passRole = $("pass-role");
    if (passRole) {
      passRole.textContent = formattedRole;
    }

    const isMember = !user.designation || (window.Roles && window.Roles.normalizeRole(user.designation) === "member");
    const founderPanel = $("founder-panel");
    const teamNote = $("team-note");

    if (isMember) {
      if (founderPanel) founderPanel.hidden = false;
      if (teamNote) {
        teamNote.textContent = "General Member: Complete the founder checklist above to build your startup foundation. Domain appointments and team tasks will appear once assigned by a domain head.";
      }
      renderChecklist(user);
    } else {
      // Only unassigned members render founder checklist; do not clutter role views unnecessarily.
      if (founderPanel) founderPanel.hidden = true;
    }

    // Mount and render role dashboard
    const roleDashboardEl = $("role-dashboard");
    if (roleDashboardEl && window.RoleDashboard && typeof window.RoleDashboard.render === "function") {
      window.RoleDashboard.render(roleDashboardEl, user);
    }

    $("loading").hidden = true;
    $("dash").hidden = false;

    const flash = Auth.takeFlash() || (fromConfirmLink ? `Email confirmed. Welcome to E-Cell, ${first}!` : null);
    if (flash) showToast(flash);
  }

  // Ticks are saved to the member's profile, so they follow them across devices.
  function renderChecklist(user) {
    const done = Object.assign({}, user.checklist, { joined: true });

    const list = $("checklist");
    list.replaceChildren();
    STEPS.forEach(([id, title, hint]) => {
      const li = document.createElement("li");
      const label = document.createElement("label");
      label.htmlFor = `step-${id}`;

      const box = document.createElement("input");
      box.type = "checkbox";
      box.id = `step-${id}`;
      box.checked = !!done[id];
      box.disabled = id === "joined";

      const strong = document.createElement("strong");
      strong.textContent = title;

      const small = document.createElement("small");
      small.textContent = hint;

      label.appendChild(box);
      label.appendChild(strong);
      label.appendChild(small);
      li.appendChild(label);
      box.addEventListener("change", async () => {
        done[id] = box.checked;
        update();
        try {
          await Auth.saveChecklist(user.id, done);
        } catch (err) {
          done[id] = !box.checked;
          box.checked = done[id];
          update();
          showToast(`Couldn't save that tick. ${err.message}`);
        }
      });
      list.appendChild(li);
    });

    function update() {
      const n = STEPS.filter(([id]) => done[id]).length;
      $("check-count").textContent = `${n} / ${STEPS.length}`;
      $("check-bar").style.width = `${(n / STEPS.length) * 100}%`;
    }
    update();
  }

  async function logout() {
    try { await Auth.logout(); } catch (_) { /* session may already be gone */ }
    location.href = "index.html";
  }
  $("logout").addEventListener("click", logout);
  $("logout-top").addEventListener("click", logout);

  init();
})();
