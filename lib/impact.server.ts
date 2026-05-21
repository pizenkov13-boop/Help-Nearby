import "server-only";

import { getSupabase, isSupabaseFetchError } from "@/lib/supabase";
import type { ImpactAction } from "@/lib/impact.client";

export type { ImpactAction };

function startOfTodayUtc(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function trackImpactClick(
  orgId: string,
  action: ImpactAction,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { error } = await supabase.from("impact_clicks").insert({
      org_id: orgId,
      action,
    });

    if (error) {
      console.error("[trackImpactClick]", error.message);
    }
  } catch (error) {
    if (isSupabaseFetchError(error)) {
      console.warn("[trackImpactClick] Supabase unreachable — click not stored");
    } else {
      console.error("[trackImpactClick]", error);
    }
  }
}

export async function getTodayImpactCount(): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;

  try {
    const { count, error } = await supabase
      .from("impact_clicks")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfTodayUtc());

    if (error) {
      console.error("[getTodayImpactCount]", error.message);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    if (isSupabaseFetchError(error)) {
      console.warn("[getTodayImpactCount] Supabase unreachable — count is 0");
    } else {
      console.error("[getTodayImpactCount]", error);
    }
    return 0;
  }
}
