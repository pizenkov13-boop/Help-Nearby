"use client";

import type { ReactNode } from "react";
import { useFormsEnabled } from "@/components/providers/FormsAvailability";

/** Shows its form only to visitors who may submit; for the others it renders nothing (no message). */
export function FormsGate({ children }: { children: ReactNode }) {
  return useFormsEnabled() ? <>{children}</> : null;
}
