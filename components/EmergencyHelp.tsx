"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, LifeBuoy, MapPin, Navigation, Phone, X } from "lucide-react";
import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { formatDistance, useDistanceUnit } from "@/lib/distanceUnits";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getPhoneTelUrl } from "@/lib/orgUtils";
import { openRoute } from "@/lib/orgActions";
import { hasValidMapCoordinates } from "@/lib/mapCoordinates";
import { rememberPosition } from "@/lib/userPosition";
import { requestPosition } from "@/lib/locationRequest";
import { postJson } from "@/lib/postJson";
import type { Organization, UserLocation } from "@/lib/types";
import { EMERGENCY_OPEN_EVENT } from "@/lib/emergencyEvents";

type EmergencyState = "idle" | "locating" | "loading" | "ready" | "error";

export function EmergencyHelp() {
  const { t, language } = useLanguage();
  const unit = useDistanceUnit();
  const [open, setOpen] = useState(false);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1"].includes(window.location.hostname) ||
        new URLSearchParams(window.location.search).get("emergencyDemo") !== "1") return;
    const makeExample = (id: string, name: string, address: string, distance: string): Organization => ({
      id, slug: id, name, category: "medical", categories: ["medical"], country: "", city: "",
      lat: 0, lng: 0, distance, rating: 0, address, phone: "+7 (000) 555-01-01", email: "", website: "",
      description: "", hours: {}, hoursRaw: "24/7", openNow: true, verified: false,
    });
    setDemo(true);
    setOrganizations([
      makeExample("demo-1", "Городская больница № 1", "ул. Центральная, 12", "0.8 mi"),
      makeExample("demo-2", "Пункт экстренной помощи", "ул. Ленина, 25", "1.5 mi"),
      makeExample("demo-3", "Круглосуточная аптека", "ул. Мира, 7", "2.1 mi"),
    ]);
    setState("ready");
    setOpen(true);
  }, []);
  const [state, setState] = useState<EmergencyState>("idle");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestId = useRef(0);

  const loadEmergencyList = useCallback(async (location: UserLocation, id: number) => {
    setState("loading");
    setErrorMessage(null);

    try {
      const res = await postJson("/api/emergency", {
        lat: location.lat,
        lng: location.lng,
        radius: NEARBY_RADIUS_METERS,
      });
      if (!res.ok) throw new Error("Emergency fetch failed");
      const emergency = (await res.json()) as Organization[];
      if (id !== requestId.current) return;
      setOrganizations(emergency);
      setState("ready");
    } catch (err) {
      if (id !== requestId.current) return;
      console.error("[EmergencyHelp]", err);
      setOrganizations([]);
      setState("error");
      setErrorMessage(t("emergencyLoadError"));
    }
  }, [t]);

  const requestLocationAndLoad = useCallback(() => {
    const id = ++requestId.current;
    setState("locating");
    setErrorMessage(null);
    setOrganizations([]);

    // Same rules as the main search: only on a tap, and never an endless "locating..." (a prompt nobody
    // answers ends in the error text after 12 s, and a late "allow" still loads the list).
    requestPosition({
      onPosition: (location) => {
        if (id !== requestId.current) return;
        rememberPosition({ lat: location.lat, lng: location.lng });
        void loadEmergencyList({ lat: location.lat, lng: location.lng }, id);
      },
      onIssue: () => {
        if (id !== requestId.current) return;
        setState("error");
        setErrorMessage(t("emergencyLocationDenied"));
      },
    });
  }, [loadEmergencyList, t]);

  const triggerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleOpen = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    if (active && active !== document.body) triggerRef.current = active;
    setDemo(false);
    setOpen(true);
    requestLocationAndLoad();
  }, [requestLocationAndLoad]);

  useEffect(() => {
    const onExternalOpen = () => handleOpen();
    window.addEventListener(EMERGENCY_OPEN_EVENT, onExternalOpen);
    return () =>
      window.removeEventListener(EMERGENCY_OPEN_EVENT, onExternalOpen);
  }, [handleOpen]);

  const handleClose = useCallback(() => {
    requestId.current++;
    setOpen(false);
    setState("idle");
    setOrganizations([]);
    setErrorMessage(null);
    const trigger = triggerRef.current;
    triggerRef.current = null;
    if (trigger && document.contains(trigger)) trigger.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // An organization sheet or the route screen on top handles Esc first.
      if (e.key === "Escape" && !document.querySelector(".os-layer, .rt-screen")) handleClose();
    };

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, handleClose]);

  const isBusy = state === "locating" || state === "loading";

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 p-4 pt-20 sm:items-center sm:pt-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="emergency-dialog-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label={t("emergencyClose")}
            onClick={handleClose}
          />

          <div className="urgent-panel relative z-10 flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border-2 border-red-500/60 bg-white shadow-2xl shadow-red-900/20 dark:bg-gray-900 dark:shadow-red-900/30">
            <div className="flex items-center justify-between gap-3 border-b border-red-500/30 bg-red-50 px-4 py-4 dark:bg-red-600/20 sm:px-5">
              <div>
                <h2
                  id="emergency-dialog-title"
                  className="flex items-center gap-2 text-lg font-bold text-red-900 dark:text-white sm:text-xl"
                >
                  <LifeBuoy className="h-5 w-5 shrink-0 text-red-600 dark:text-red-300" aria-hidden />
                  {t("emergencyTitle")}
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={handleClose}
                className="shrink-0 rounded-lg p-2 text-red-700 transition-colors hover:bg-red-100 hover:text-red-900 dark:text-red-100 dark:hover:bg-red-500/30 dark:hover:text-white"
                aria-label={t("emergencyClose")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              {isBusy && (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-600 dark:text-gray-300">
                  <Loader2 className="emergency-loader h-8 w-8 animate-spin text-red-400" aria-hidden="true" />
                  <p className="text-sm">
                    {state === "locating"
                      ? t("emergencyLocating")
                      : t("emergencyLoading")}
                  </p>
                </div>
              )}

              {!isBusy && errorMessage && (
                <div className="space-y-4 py-6 text-center">
                  <p className="text-sm text-red-700 dark:text-red-300" role="alert">
                    {errorMessage}
                  </p>
                  <button
                    type="button"
                    onClick={requestLocationAndLoad}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                  >
                    {t("emergencyRetry")}
                  </button>
                </div>
              )}

              {!isBusy && !errorMessage && state === "ready" && (
                <>
                  {organizations.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-500 dark:text-gray-400">
                      {t("emergencyNoResults")}
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {organizations.map((org) => (
                        <li
                          key={org.id}
                          className="urgent-item rounded-xl border border-red-500/25 bg-red-50/80 p-4 dark:bg-gray-800/80"
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {org.name}
                            </h3>
                            {org.distance && (
                              <span className="urgent-dist shrink-0 text-xs font-medium text-red-300">
                                {formatDistance(org.distance, unit, language)}
                              </span>
                            )}
                          </div>

                          {org.phone?.trim() ? (
                            <a
                              href={demo ? undefined : getPhoneTelUrl(org.phone)}
                              onClick={demo ? (event) => event.preventDefault() : undefined}
                              className="mb-2 inline-flex items-center gap-2 text-base font-bold text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
                            >
                              <Phone className="h-4 w-4 shrink-0" />
                              <span className="tel">{org.phone}</span>
                            </a>
                          ) : (
                            <p className="mb-2 urgent-nophone text-sm text-amber-400/90">
                              {t("emergencyNoPhone")}
                            </p>
                          )}

                          {org.address && (
                            <p className="flex items-start gap-2 text-sm text-slate-600 dark:text-gray-400">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                              <span>
                                {[org.address, org.city, org.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            {org.phone?.trim() && (
                              <a
                                href={demo ? undefined : getPhoneTelUrl(org.phone)}
                                onClick={demo ? (event) => event.preventDefault() : undefined}
                                className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg urgent-call bg-emerald-600 px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-500"
                              >
                                <Phone className="h-4 w-4 shrink-0" />
                                {t("emergencyCall")}
                              </a>
                            )}
                            {(demo || hasValidMapCoordinates(org)) && (
                              <button
                                type="button"
                                onClick={() => { if (!demo) openRoute(org); }}
                                className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-blue-500 bg-blue-700 px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-600"
                              >
                                <Navigation className="h-4 w-4 shrink-0" />
                                {t("getDirections")}
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
