"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPin, Phone, X } from "lucide-react";
import { DEFAULT_LOCATION, NEARBY_RADIUS_METERS } from "@/lib/constants";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getPhoneTelUrl } from "@/lib/org";
import type { Organization, UserLocation } from "@/lib/types";
import { cn } from "@/lib/utils";

type EmergencyState = "idle" | "locating" | "loading" | "ready" | "error";

export function EmergencyHelp() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<EmergencyState>("idle");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadEmergencyList = useCallback(async (location: UserLocation) => {
    setState("loading");
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        lat: String(location.lat),
        lng: String(location.lng),
        radius: String(NEARBY_RADIUS_METERS),
      });
      const res = await fetch(`/api/emergency?${params}`);
      if (!res.ok) throw new Error("Emergency fetch failed");
      const emergency = (await res.json()) as Organization[];
      setOrganizations(emergency);
      setState("ready");
    } catch (err) {
      console.error("[EmergencyHelp]", err);
      setOrganizations([]);
      setState("error");
      setErrorMessage(t("emergencyLoadError"));
    }
  }, [t]);

  const requestLocationAndLoad = useCallback(() => {
    setState("locating");
    setErrorMessage(null);
    setOrganizations([]);

    if (!navigator.geolocation) {
      void loadEmergencyList(DEFAULT_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void loadEmergencyList({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setState("error");
        setErrorMessage(t("emergencyLocationDenied"));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }, [loadEmergencyList, t]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    requestLocationAndLoad();
  }, [requestLocationAndLoad]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setState("idle");
    setOrganizations([]);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, handleClose]);

  const isBusy = state === "locating" || state === "loading";

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "fixed left-1/2 z-[60] -translate-x-1/2",
          "top-[3.75rem] sm:top-[4rem]",
          "flex items-center gap-2 rounded-full px-4 py-2.5 sm:px-5 sm:py-3",
          "bg-red-600 text-sm font-bold text-white shadow-lg shadow-red-600/40",
          "ring-2 ring-red-400/50 transition-all hover:bg-red-500 hover:shadow-red-500/50",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300",
          open && "pointer-events-none opacity-0",
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span aria-hidden>🆘</span>
        <span>{t("emergencyHelp")}</span>
      </button>

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

          <div className="relative z-10 flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border-2 border-red-500/60 bg-gray-900 shadow-2xl shadow-red-900/30">
            <div className="flex items-start justify-between gap-3 border-b border-red-500/30 bg-red-600/20 px-4 py-4 sm:px-5">
              <div>
                <h2
                  id="emergency-dialog-title"
                  className="flex items-center gap-2 text-lg font-bold text-white sm:text-xl"
                >
                  <span aria-hidden>🆘</span>
                  {t("emergencyTitle")}
                </h2>
                <p className="mt-1 text-sm text-red-100/90">
                  {t("emergencySubtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="shrink-0 rounded-lg p-2 text-red-100 transition-colors hover:bg-red-500/30 hover:text-white"
                aria-label={t("emergencyClose")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              {isBusy && (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-300">
                  <Loader2 className="h-8 w-8 animate-spin text-red-400" />
                  <p className="text-sm">
                    {state === "locating"
                      ? t("emergencyLocating")
                      : t("emergencyLoading")}
                  </p>
                </div>
              )}

              {!isBusy && errorMessage && (
                <div className="space-y-4 py-6 text-center">
                  <p className="text-sm text-red-300" role="alert">
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
                    <p className="py-10 text-center text-sm text-gray-400">
                      {t("emergencyNoResults")}
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {organizations.map((org) => (
                        <li
                          key={org.id}
                          className="rounded-xl border border-red-500/25 bg-gray-800/80 p-4"
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-white">
                              {org.name}
                            </h3>
                            {org.distance && (
                              <span className="shrink-0 text-xs font-medium text-red-300">
                                {org.distance}
                              </span>
                            )}
                          </div>

                          {org.phone?.trim() ? (
                            <a
                              href={getPhoneTelUrl(org.phone)}
                              className="mb-2 inline-flex items-center gap-2 text-base font-bold text-emerald-400 hover:text-emerald-300"
                            >
                              <Phone className="h-4 w-4 shrink-0" />
                              {org.phone}
                            </a>
                          ) : (
                            <p className="mb-2 text-sm text-amber-400/90">
                              {t("emergencyNoPhone")}
                            </p>
                          )}

                          {org.address && (
                            <p className="flex items-start gap-2 text-sm text-gray-400">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                              <span>
                                {[org.address, org.city, org.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            </p>
                          )}

                          {org.phone?.trim() && (
                            <a
                              href={getPhoneTelUrl(org.phone)}
                              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                            >
                              <Phone className="h-4 w-4" />
                              {t("emergencyCall")}
                            </a>
                          )}
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
