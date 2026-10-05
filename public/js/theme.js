// Theme controller: light / dark mode toggle with localStorage persistence and OS preference sync.
(function () {
  const STORAGE_KEY = "ecell-theme";

  function getSystemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function getResolvedTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : getSystemTheme();
  }

  function updateButtons(theme) {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const label = `Switch to ${nextTheme} theme`;
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
      btn.setAttribute("data-current-theme", theme);
    });
  }

  function applyTheme(theme, save = true) {
    if (theme === "dark" || theme === "light") {
      document.documentElement.setAttribute("data-theme", theme);
      if (save) {
        try {
          localStorage.setItem(STORAGE_KEY, theme);
        } catch (_) {}
      }
    } else {
      document.documentElement.removeAttribute("data-theme");
      if (save) {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (_) {}
      }
    }
    updateButtons(theme || getSystemTheme());
  }

  function toggle() {
    const current = getResolvedTheme();
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next, true);
  }

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const resolved = saved || getSystemTheme();
    if (saved) {
      document.documentElement.setAttribute("data-theme", saved);
    }
    updateButtons(resolved);

    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        toggle();
      });
    });

    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (!localStorage.getItem(STORAGE_KEY)) {
          const sys = e.matches ? "dark" : "light";
          updateButtons(sys);
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.Theme = { toggle, applyTheme, getResolvedTheme };
})();
