import { supabase } from "@/lib/supabase";

export type ImpactAction = "call" | "directions";

function startOfTodayUtc(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function trackImpactClick(
  orgId: string,
  action: ImpactAction,
): Promise<void> {
  const { error } = await supabase.from("impact_clicks").insert({
    org_id: orgId,
    action,
  });

  if (error) {
    console.error("[trackImpactClick]", error.message);
    throw new Error(error.message);
  }
}

export async function getTodayImpactCount(): Promise<number> {
  const { count, error } = await supabase
    .from("impact_clicks")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfTodayUtc());

  if (error) {
    console.error("[getTodayImpactCount]", error.message);
    return 0;
  }

  return count ?? 0;
}

/** Fire-and-forget client-side impact tracking. */
export function recordImpactClick(
  orgId: string,
  action: ImpactAction,
): void {
  void fetch("/api/impact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orgId, action }),
  }).catch((err) => console.error("[recordImpactClick]", err));
}
