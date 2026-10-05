"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Auth } from "@/lib/auth";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = "Enter your email.";
    if (!password) errors.password = "Enter your password.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const { user: loggedInUser } = await Auth.login({
        email: email.trim(),
        password,
      });
      const first = loggedInUser.name.split(" ")[0];
      Auth.flash(`Logged in. Good to see you, ${first}!`);
      router.push("/dashboard");
    } catch (err: any) {
      setSubmitting(false);
      setGeneralError(err?.message || "Invalid email or password.");
      setPassword("");
      if (err?.fields) {
        setFieldErrors(err.fields);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--ink)]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 sm:px-8 py-3">
          <Link href="/" className="inline-flex items-center gap-2 font-display font-extrabold text-base sm:text-lg tracking-tight">
            <img
              src="/img/logo-black.svg"
              alt="E-Cell SMVIT"
              className="h-7 w-auto dark:hidden"
            />
            <img
              src="/img/logo-white.png"
              alt="E-Cell SMVIT"
              className="h-7 w-auto hidden dark:block"
            />
            <span>E-CELL SMVIT</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] px-3.5 py-1.5 text-sm font-semibold text-[var(--accent-ink)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--ink)]"
            >
              Join E-Cell
            </Link>
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border-[1.5px] border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-[var(--ink)] hover:shadow-[2px_2px_0_var(--ink)]"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2">
        {/* Left Side Panel */}
        <aside className="order-2 md:order-1 flex flex-col justify-between gap-8 bg-[var(--panel)] p-8 sm:p-12 lg:p-16 text-[var(--panel-fg)] bg-[linear-gradient(rgba(238,240,245,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(238,240,245,0.06)_1px,transparent_1px)] bg-[size:32px_32px]">
          <div className="flex items-center gap-2">
            <Link href="/" className="inline-flex items-center gap-2 font-display font-extrabold text-lg text-[var(--panel-fg)]">
              <img src="/img/logo-white.png" alt="" className="h-7 w-auto" />
              <span>E-CELL SMVIT</span>
            </Link>
          </div>
          <div className="grid gap-3 max-w-md">
            <span className="font-mono text-xs uppercase tracking-widest opacity-60">Members</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight">Welcome back, builder.</h2>
            <ol className="mt-4 grid gap-2.5 text-sm sm:text-base opacity-85">
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-semibold text-[var(--mark)]">01</span>
                <span>Open your member pass</span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-semibold text-[var(--mark)]">02</span>
                <span>Pick up your founder checklist</span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-semibold text-[var(--mark)]">03</span>
                <span>Head to the next ideathon</span>
              </li>
            </ol>
          </div>
          <div className="text-xs font-mono opacity-50">SMVIT Entrepreneurship Cell</div>
        </aside>

        {/* Right Form Card */}
        <div className="order-1 md:order-2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
          <div className="w-full max-w-[420px] grid gap-6">
            <div className="flex items-center gap-2 md:hidden">
              <img src="/img/logo-black.svg" alt="" className="h-6 w-auto dark:hidden" />
              <img src="/img/logo-white.png" alt="" className="h-6 w-auto hidden dark:block" />
              <span className="font-display font-extrabold text-base">E-CELL SMVIT</span>
            </div>

            <div className="grid gap-1.5">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">Log in</span>
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight">Log in</h1>
              <p className="text-sm text-[var(--muted)]">Use the email you signed up with.</p>
            </div>

            {generalError && (
              <div
                className="rounded-[var(--radius)] border border-[var(--err)] bg-[color-mix(in_srgb,var(--err)_8%,transparent)] p-3 text-sm text-[var(--err)]"
                role="alert"
              >
                {generalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
              <div className="grid gap-1.5">
                <label htmlFor="email" className="text-sm font-semibold flex justify-between">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: "" }));
                    }
                  }}
                  autoComplete="email"
                  inputMode="email"
                  required
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  className={`w-full rounded-[var(--radius)] border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                    fieldErrors.email ? "border-[var(--err)]" : "border-[var(--line)] hover:border-[var(--muted)]"
                  }`}
                />
                {fieldErrors.email && (
                  <span id="email-error" className="text-xs text-[var(--err)]">
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="password" className="text-sm font-semibold flex justify-between">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: "" }));
                      }
                    }}
                    autoComplete="current-password"
                    required
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                    className={`w-full rounded-[var(--radius)] border bg-[var(--surface)] pl-3 pr-14 py-2 text-sm text-[var(--ink)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                      fieldErrors.password ? "border-[var(--err)]" : "border-[var(--line)] hover:border-[var(--muted)]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)] px-2 py-1"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {fieldErrors.password && (
                  <span id="password-error" className="text-xs text-[var(--err)]">
                    {fieldErrors.password}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--ink)] disabled:opacity-60 disabled:cursor-wait disabled:transform-none disabled:shadow-none"
              >
                {submitting ? "Logging in…" : "Log in"}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="text-sm text-[var(--muted)]">
              New here?{" "}
              <Link href="/signup" className="font-semibold text-[var(--accent)] hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
