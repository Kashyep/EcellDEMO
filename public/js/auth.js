/*
 * Auth client shared by every page, backed by Supabase Auth.
 *
 * - Accounts, password hashing, sessions and rate limits are handled by Supabase.
 * - Each signup gets a row in public.profiles (created by a database trigger),
 *   protected by row-level security so members can only read and update their own.
 * - js/config.js is generated at build time from SUPABASE_URL and SUPABASE_ANON_KEY.
 */
(function () {
  const FLASH_KEY = "ecell.flash";

  // ---------- validation (same rules as the profiles table) ----------
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const USN_RE = /^[1-4][A-Z]{2}\d{2}[A-Z]{2,3}\d{3}$/;

  function validateSignup({ name, email, usn, password }) {
    const errors = {};
    if (!name || name.trim().length < 2) errors.name = "Enter your full name.";
    else if (name.trim().length > 80) errors.name = "Keep your name under 80 characters.";
    if (!EMAIL_RE.test(email || "")) errors.email = "Enter a valid email address, like you@example.com.";
    if (usn && !USN_RE.test(usn)) errors.usn = "USN looks like 1MV22CS001. Leave it blank if you don't have one.";
    if (!password || password.length < 8) errors.password = "Use at least 8 characters.";
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = "Mix letters and at least one number.";
    return errors;
  }

  function passwordScore(pw) {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
    return Math.max(1, Math.min(4, s));
  }

  // ---------- Supabase client ----------
  let client = null;
  function sb() {
    if (client) return client;
    const cfg = window.ECELL_CONFIG || {};
    if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseKey) {
      throw new Error("Sign-in isn't set up on this copy of the site yet. Run the build with SUPABASE_URL and SUPABASE_ANON_KEY.");
    }
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    return client;
  }

  // Turn Supabase errors into messages a member can act on.
  function friendly(error) {
    const code = error && (error.code || "");
    const status = error && error.status;
    if (code === "invalid_credentials") return new Error("Email or password is incorrect.");
    if (code === "email_not_confirmed") return new Error("Confirm your email first. Open the link we sent to your inbox, then log in.");
    if (code === "user_already_exists" || code === "email_exists") {
      const e = new Error("An account with this email already exists. Log in instead.");
      e.fields = { email: "Already registered." };
      return e;
    }
    if (code === "weak_password") return Object.assign(new Error("Choose a stronger password."), { fields: { password: error.message } });
    if (status === 429 || code === "over_request_rate_limit" || code === "over_email_send_rate_limit") {
      return new Error("Too many attempts right now. Wait a minute and try again.");
    }
    if (error && error.name === "AuthRetryableFetchError") return new Error("We couldn't reach the sign-in service. Check your connection and try again.");
    return new Error((error && error.message) || "Something went wrong. Try again.");
  }

  function toUser(authUser, profile) {
    const meta = authUser.user_metadata || {};
    return {
      id: authUser.id,
      name: (profile && profile.full_name) || meta.full_name || authUser.email.split("@")[0],
      email: authUser.email,
      usn: (profile && profile.usn) || "",
      memberId: (profile && profile.member_id) || "Pending",
      createdAt: (profile && profile.created_at) || authUser.created_at,
      checklist: (profile && profile.checklist) || {},
      domain: (profile && profile.domain) || null,
      designation: (profile && profile.designation) || null,
    };
  }

  async function signup({ name, email, usn, password }) {
    const { data, error } = await sb().auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: name.trim(), usn: (usn || "").trim().toUpperCase() },
        emailRedirectTo: new URL("dashboard.html", location.href).href,
      },
    });
    if (error) throw friendly(error);
    // With email confirmation on, Supabase hides existing accounts by returning a user with no identities.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw friendly({ code: "user_already_exists" });
    }
    return { user: toUser(data.user, null), needsConfirmation: !data.session };
  }

  async function login({ email, password }) {
    const { data, error } = await sb().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) throw friendly(error);
    return { user: toUser(data.user, null) };
  }

  async function me() {
    const { data, error } = await sb().auth.getSession();
    if (error) throw friendly(error);
    if (!data.session) return null;
    const authUser = data.session.user;
    const { data: profile, error: pErr } = await sb()
      .from("profiles")
      .select("full_name, usn, member_id, checklist, created_at, domain, designation")
      .eq("id", authUser.id)
      .maybeSingle();
    if (pErr) throw friendly(pErr);
    return { user: toUser(authUser, profile) };
  }

  async function saveChecklist(userId, checklist) {
    const { error } = await sb().from("profiles").update({ checklist }).eq("id", userId);
    if (error) throw friendly(error);
  }

  async function logout() {
    const { error } = await sb().auth.signOut();
    if (error) throw friendly(error);
  }

  window.Auth = {
    validateSignup,
    passwordScore,
    signup,
    login,
    me,
    logout,
    saveChecklist,
    client: sb,
    sb,
    friendly,
    flash(msg) { try { sessionStorage.setItem(FLASH_KEY, msg); } catch (_) { /* toast is optional */ } },
    takeFlash() {
      try { const m = sessionStorage.getItem(FLASH_KEY); sessionStorage.removeItem(FLASH_KEY); return m; } catch (_) { return null; }
    },
  };

  // Small shared UI helper: a toast that removes itself.
  window.showToast = function (text) {
    const t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.innerHTML = '<span class="toast__dot" aria-hidden="true"></span><span></span>';
    t.lastChild.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4200);
  };
})();
