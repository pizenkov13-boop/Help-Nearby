"use client";

import { useEffect, useState } from "react";

export interface Features {
  chat: boolean;
  forms: boolean;
}

let pending: Promise<Features> | null = null;

/** One request per page load. If it fails, everything stays on: the API routes enforce the limits themselves. */
function loadFeatures(): Promise<Features> {
  pending ??= fetch("/api/features", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error("status"))))
    .then((data: Partial<Features>) => ({ chat: data.chat !== false, forms: data.forms !== false }))
    .catch(() => ({ chat: true, forms: true }));
  return pending;
}

/** null while the answer is not known yet. */
export function useFeatures(): { chat: boolean | null; forms: boolean | null } {
  const [features, setFeatures] = useState<Features | null>(null);

  useEffect(() => {
    let active = true;
    void loadFeatures().then((value) => {
      if (active) setFeatures(value);
    });
    return () => {
      active = false;
    };
  }, []);

  return { chat: features?.chat ?? null, forms: features?.forms ?? null };
}
