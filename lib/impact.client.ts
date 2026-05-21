export type ImpactAction = "call" | "directions";

/** Fire-and-forget client-side impact tracking (no Supabase in client bundle). */
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
