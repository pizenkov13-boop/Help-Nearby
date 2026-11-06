"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Whether this visitor may use the organization and review forms. The server decides it from the request
 * (FORMS_DISABLED_COUNTRIES, see lib/featureFlags.server.ts) and passes the answer down, so links to the
 * forms are absent from the very first HTML instead of disappearing after a request.
 */
const FormsAvailabilityContext = createContext(true);

export function FormsAvailabilityProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <FormsAvailabilityContext.Provider value={enabled}>{children}</FormsAvailabilityContext.Provider>;
}

export function useFormsEnabled(): boolean {
  return useContext(FormsAvailabilityContext);
}
