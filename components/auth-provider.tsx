"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Auth, sb } from "@/lib/auth";
import { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const res = await Auth.me();
      setUser(res ? res.user : null);
    } catch (err: any) {
      setError(err?.message || "Failed to load session");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    let subscription: { unsubscribe: () => void } | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    try {
      const client = sb();
      const { data } = client.auth.onAuthStateChange((event, _session) => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }

        if (event === "SIGNED_OUT") {
          setUser(null);
          setLoading(false);
          setError(null);
        } else if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED"
        ) {
          // Synchronous callback: schedule refresh after callback returns
          timer = setTimeout(() => {
            refresh();
          }, 0);
        }
      });
      subscription = data.subscription;
    } catch (err: any) {
      setError(err?.message || "Failed to initialize auth client");
      setLoading(false);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [refresh]);

  if (!loading && error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)] text-[var(--ink)]">
        <div className="max-w-md w-full p-6 rounded-lg border border-[var(--line,#d3d8e3)] bg-[var(--surface,#f9fafc)] text-center space-y-4 shadow-sm">
          <div style={{ fontSize: "2rem" }}>⚠️</div>
          <h2 className="text-lg font-semibold text-[var(--ink)]">Authentication Error</h2>
          <p className="text-sm text-[var(--err,#c2362b)]">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              refresh();
            }}
            className="px-4 py-2 rounded bg-[var(--accent,#2b4cff)] text-[var(--accent-ink,#ffffff)] hover:opacity-90 font-medium transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
