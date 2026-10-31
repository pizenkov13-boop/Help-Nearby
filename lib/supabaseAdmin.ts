import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/env";
import { createDbClient } from "@/lib/supabase";
import { ensureEnvLoaded } from "@/lib/env.server";

export function getSupabaseAdmin(): SupabaseClient | null {
  ensureEnvLoaded();

  const { url } = getSupabasePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    return null;
  }

  return createDbClient(url, serviceKey);
}
