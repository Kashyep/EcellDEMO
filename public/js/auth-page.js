// Login and signup forms: inline validation, submit, redirect to the dashboard.
(function () {
  const signupForm = document.getElementById("signup-form");
  const loginForm = document.getElementById("login-form");
  const form = signupForm || loginForm;
  if (!form) return;

  const alertBox = document.getElementById("form-alert");
  const submit = document.getElementById("submit");
  const submitLabel = submit.innerHTML;

  // Already signed in? Skip straight to the dashboard.
  Auth.me().then((res) => { if (res) location.replace("dashboard.html"); }).catch((err) => {
    alertBox.textContent = err.message;
    alertBox.hidden = false;
  });

  // Show / hide password
  document.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.toggle);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "Hide" : "Show";
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });

  function setError(field, msg) {
    const input = document.getElementById(field);
    const out = document.getElementById(field + "-error");
    if (!input || !out) return;
    out.textContent = msg || "";
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  }
  function clearErrors() {
    form.querySelectorAll("input").forEach((i) => setError(i.id, ""));
    alertBox.hidden = true;
  }
  function showErrors(errors) {
    Object.entries(errors).forEach(([k, v]) => setError(k, v));
    const first = Object.keys(errors)[0];
    if (first) document.getElementById(first).focus();
  }
  function busy(on, text) {
    submit.disabled = on;
    submit.innerHTML = on ? text : submitLabel;
  }

  // Clear a field's error as soon as the user edits it.
  form.addEventListener("input", (e) => { if (e.target.id) setError(e.target.id, ""); });

  if (signupForm) {
    const pw = document.getElementById("password");
    const meter = document.getElementById("meter");
    const usn = document.getElementById("usn");
    pw.addEventListener("input", () => { meter.dataset.score = String(Auth.passwordScore(pw.value)); });
    usn.addEventListener("input", () => { usn.value = usn.value.toUpperCase().replace(/\s/g, ""); });

    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors();
      const data = {
        name: signupForm.name.value.trim(),
        email: signupForm.email.value.trim(),
        usn: signupForm.usn.value.trim().toUpperCase(),
        password: signupForm.password.value,
      };
      const errors = Auth.validateSignup(data);
      if (!signupForm.confirm.value) errors.confirm = "Re-enter your password.";
      else if (signupForm.confirm.value !== data.password) errors.confirm = "Passwords don't match.";
      if (Object.keys(errors).length) return showErrors(errors);

      busy(true, "Creating your account…");
      try {
        const { user, needsConfirmation } = await Auth.signup(data);
        if (needsConfirmation) {
          // Email confirmation is on: the account exists but has no session until the link is opened.
          document.getElementById("confirm-email").textContent = user.email;
          signupForm.hidden = true;
          document.getElementById("check-inbox").hidden = false;
          document.getElementById("check-inbox").focus();
          return;
        }
        Auth.flash(`Account created. Welcome to E-Cell, ${user.name.split(" ")[0]}!`);
        location.href = "dashboard.html";
      } catch (err) {
        busy(false);
        alertBox.textContent = err.message;
        alertBox.hidden = false;
        if (err.fields) showErrors(err.fields);
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors();
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value;
      const errors = {};
      if (!email) errors.email = "Enter your email.";
      if (!password) errors.password = "Enter your password.";
      if (Object.keys(errors).length) return showErrors(errors);

      busy(true, "Logging in…");
      try {
        const { user } = await Auth.login({ email, password });
        Auth.flash(`Logged in. Good to see you, ${user.name.split(" ")[0]}!`);
        location.href = "dashboard.html";
      } catch (err) {
        busy(false);
        alertBox.textContent = err.message;
        alertBox.hidden = false;
        loginForm.password.value = "";
        loginForm.password.focus();
      }
    });
  }
})();
