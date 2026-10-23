import { nominatimSearch } from "@/lib/nominatim.server";
import { slugify } from "@/lib/orgUtils";
import { getSupabase, isSupabaseFetchError } from "@/lib/supabase";
import type { Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";

export interface SubmitOrganizationInput {
  name: string;
  category: Category;
  country: string;
  city: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  hours?: string;
  description?: string;
}

function normalizeHours(hours?: string): string | null {
  const trimmed = hours?.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{")) {
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

async function uniqueSlug(base: string): Promise<string> {
  const slug = slugify(base) || "organization";
  const supabase = getSupabase();
  if (!supabase) return `${slug}-${Date.now()}`;

  try {
    const { data } = await supabase
      .from("organizations")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) return slug;
  } catch (error) {
    if (!isSupabaseFetchError(error)) {
      console.error("[uniqueSlug]", error);
    }
  }

  return `${slug}-${Date.now()}`;
}

export async function submitOrganization(
  input: SubmitOrganizationInput,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const name = input.name.trim();
  const country = input.country.trim();
  const city = input.city.trim();
  const address = input.address.trim();

  if (!name || !country || !city || !address) {
    return { ok: false, error: "Name, country, city, and address are required." };
  }

  if (!CATEGORIES.includes(input.category)) {
    return { ok: false, error: "Invalid category." };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      error:
        "Organization submissions are temporarily unavailable. Please try again later.",
    };
  }

  const query = [address, city, country].filter(Boolean).join(", ");
  const coords = query ? await nominatimSearch(query) : null;
  const baseSlug = await uniqueSlug(`${name}-${city}`);

  try {
    const row = {
      name,
      category: [input.category],
      country,
      city,
      address,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      website: input.website?.trim() || null,
      hours: normalizeHours(input.hours),
      description: input.description?.trim() || null,
      rating: null,
      verified: false,
    };

    let slug = baseSlug;
    let { error } = await supabase.from("organizations").insert({ ...row, slug });
    if (error?.code === "23505") {
      // Unverified rows are invisible to the anon key, so the slug check cannot see them: retry once with a suffix.
      slug = `${baseSlug}-${Date.now()}`;
      ({ error } = await supabase.from("organizations").insert({ ...row, slug }));
    }

    if (error) {
      console.error("[submitOrganization]", error.message);
      return {
        ok: false,
        error:
          error.code === "42501"
            ? "Submissions are not enabled yet. Run the latest Supabase migration."
            : error.message,
      };
    }

    return { ok: true, slug };
  } catch (error) {
    if (isSupabaseFetchError(error)) {
      return {
        ok: false,
        error:
          "Organization submissions are temporarily unavailable. Please try again later.",
      };
    }
    console.error("[submitOrganization]", error);
    return { ok: false, error: "Could not submit organization. Please try again." };
  }
}
