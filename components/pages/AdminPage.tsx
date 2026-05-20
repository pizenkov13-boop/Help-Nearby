"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  Loader2,
  LogOut,
  MapPin,
  Shield,
} from "lucide-react";
import type { DbOrganization } from "@/lib/data";
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/categories";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [canVerify, setCanVerify] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [organizations, setOrganizations] = useState<DbOrganization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const checkSession = useCallback(async () => {
    setCheckingSession(true);
    try {
      const res = await fetch("/api/admin/session");
      const data = (await res.json()) as {
        authenticated?: boolean;
        configured?: boolean;
        canVerify?: boolean;
      };
      setAuthenticated(Boolean(data.authenticated));
      setConfigured(data.configured !== false);
      setCanVerify(Boolean(data.canVerify));
    } catch {
      setAuthenticated(false);
    } finally {
      setCheckingSession(false);
    }
  }, []);

  const loadOrganizations = useCallback(async () => {
    setLoadingOrgs(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/organizations");
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as DbOrganization[];
      setOrganizations(data);
    } catch {
      setLoadError("Could not load pending organizations.");
    } finally {
      setLoadingOrgs(false);
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (authenticated) {
      void loadOrganizations();
    }
  }, [authenticated, loadOrganizations]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setLoginError(data.error ?? "Invalid password.");
        return;
      }

      setPassword("");
      setAuthenticated(true);
      await checkSession();
      await loadOrganizations();
    } catch {
      setLoginError("Login failed. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setOrganizations([]);
  };

  const handleVerify = async (id: number) => {
    if (!canVerify) {
      setLoadError(
        "Add SUPABASE_SERVICE_ROLE_KEY to .env.local to enable verification.",
      );
      return;
    }

    setVerifyingId(id);
    setLoadError(null);

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setLoadError(data.error ?? "Verification failed.");
        return;
      }

      setOrganizations((prev) => prev.filter((org) => org.id !== id));
    } catch {
      setLoadError("Verification failed.");
    } finally {
      setVerifyingId(null);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-800/50 p-8 shadow-xl">
          <div className="mb-6 flex items-center gap-3 text-blue-400">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold text-white">Admin</h1>
              <p className="text-sm text-gray-400">Help Nearby verification</p>
            </div>
          </div>

          {!configured && (
            <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
              Set ADMIN_PASSWORD in .env.local to enable admin access.
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <p className="text-sm text-red-400" role="alert">
                {loginError}
              </p>
            )}
            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-sm font-medium text-gray-300"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn || !configured}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {loggingIn ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/90 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-blue-400" />
            <div>
              <h1 className="text-lg font-bold text-white">
                Pending verifications
              </h1>
              <p className="text-sm text-gray-400">
                {organizations.length} organization
                {organizations.length === 1 ? "" : "s"} awaiting review
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {!canVerify && (
          <p className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            Add SUPABASE_SERVICE_ROLE_KEY to .env.local to verify organizations.
            You can still review submissions below.
          </p>
        )}

        {loadError && (
          <p className="mb-6 text-sm text-red-400" role="alert">
            {loadError}
          </p>
        )}

        {loadingOrgs ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : organizations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-700 px-6 py-16 text-center text-gray-400">
            No unverified organizations. New submissions from the form will
            appear here.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {organizations.map((org) => {
              const category = (org.category?.[0] ?? "food") as Category;
              const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.food;

              return (
                <li
                  key={org.id}
                  className="rounded-xl border border-gray-800 bg-gray-800/50 p-5"
                >
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {org.name}
                      </h2>
                      <p className="mt-1 text-sm text-gray-400">
                        {[org.city, org.country].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        cfg.bg,
                        cfg.color,
                      )}
                    >
                      {cfg.icon}{" "}
                      {CATEGORIES.includes(category) ? category : "food"}
                    </span>
                  </div>

                  {org.address && (
                    <p className="mb-2 flex items-start gap-2 text-sm text-gray-400">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      {org.address}
                    </p>
                  )}

                  {org.phone && (
                    <p className="mb-2 text-sm text-gray-400">{org.phone}</p>
                  )}

                  {org.description && (
                    <p className="mb-4 text-sm leading-relaxed text-gray-500">
                      {org.description}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => handleVerify(org.id)}
                    disabled={verifyingId === org.id || !canVerify}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {verifyingId === org.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <BadgeCheck className="h-4 w-4" />
                    )}
                    Verify
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
