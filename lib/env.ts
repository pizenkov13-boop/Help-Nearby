/** Client-safe env accessors (NEXT_PUBLIC_* are inlined at build time). */

export function getSupabasePublicEnv(): {
  url: string;
  key: string;
} {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "",
  };
}
