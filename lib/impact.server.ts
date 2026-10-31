import "server-only";

import { classifyDbFailure, getSupabase, isSupabaseFetchError, type DbFailureReason } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { diagnoseDbFailure, type DbDiagnosis } from "@/lib/dbDiagnostics.server";
import type { ImpactAction } from "@/lib/impact.client";

export type { ImpactAction };

export type ImpactCountResult =
  | { ok: true; count: number }
  | { ok: false; reason: DbFailureReason; detail?: DbDiagnosis & { ms: number } };

/** The "helped today" number changes slowly: one database count per minute per server instance. */
const COUNT_CACHE_MS = 60_000;
let cachedCount: { count: number; at: number } | null = null;

function startOfTodayUtc(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/** True when the click was stored. A failure is reported, never swallowed. */
export async function trackImpactClick(
  orgId: string,
  action: ImpactAction,
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("impact_clicks").insert({
      org_id: orgId,
      action,
    });

    if (error) {
      console.error("[trackImpactClick]", error.code ?? "", error.message);
      return false;
    }
    cachedCount = null;
    return true;
  } catch (error) {
    if (isSupabaseFetchError(error)) {
      console.warn("[trackImpactClick] Supabase unreachable — click not stored");
    } else {
      console.error("[trackImpactClick]", error);
    }
    return false;
  }
}

export async function getTodayImpactCount(): Promise<ImpactCountResult> {
  if (cachedCount && Date.now() - cachedCount.at < COUNT_CACHE_MS) {
    return { ok: true, count: cachedCount.count };
  }

  // impact_clicks is insert-only for the anon key (RLS); the aggregate count is read server-side only.
  const supabase = getSupabaseAdmin() ?? getSupabase();
  if (!supabase) return { ok: false, reason: "not_configured" };

  const startedAt = Date.now();
  try {
    const { count, error } = await supabase
      .from("impact_clicks")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfTodayUtc());

    if (error) {
      console.error("[getTodayImpactCount]", error.code ?? "", error.message);
      return {
        ok: false,
        reason: classifyDbFailure(error),
        detail: { ...(await diagnoseDbFailure(error)), ms: Date.now() - startedAt },
      };
    }

    cachedCount = { count: count ?? 0, at: Date.now() };
    return { ok: true, count: cachedCount.count };
  } catch (error) {
    console.error("[getTodayImpactCount]", classifyDbFailure(error), error instanceof Error ? error.message : "");
    return {
      ok: false,
      reason: classifyDbFailure(error),
      detail: { ...(await diagnoseDbFailure(error)), ms: Date.now() - startedAt },
    };
  }
}
