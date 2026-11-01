"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, LocateFixed, RotateCw } from "lucide-react";
import { formatKm, useDistanceUnit } from "@/lib/distanceUnits";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { requestPosition } from "@/lib/locationRequest";
import { ROUTE_OPEN_EVENT, SHEET_CLOSE_EVENT, openOrganizationSheet } from "@/lib/orgActions";
import {
  getOrganizationCoordinates,
  organizationHasTrustedCoordinates,
} from "@/lib/organizationCoordinates";
import { resolveOrganizationCoordinates } from "@/lib/resolveOrganizationCoordinates";
import { fetchRoute, type RouteData } from "@/lib/routing";
import type { Organization, UserLocation } from "@/lib/types";
import { getLastPosition, isLocationGranted, rememberPosition } from "@/lib/userPosition";

const RouteMap = dynamic(() => import("@/components/route/RouteMap"), { ssr: false });

type Phase = "starting" | "need-location" | "locating" | "ready";

/**
 * The one route screen for the whole site (list, sheet and Urgent all open it): a map with the
 * walking route from where the person is to the organization, with distance and time.
 * It never leaves the site.
 */
export function RouteScreen() {
  const { t, language } = useLanguage();
  const unit = useDistanceUnit();
  const [org, setOrg] = useState<Organization | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [origin, setOrigin] = useState<UserLocation | null>(null);
  const [phase, setPhase] = useState<Phase>("starting");
  const [denied, setDenied] = useState(false);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const backRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(
    (reopenSheet: boolean) => {
      const current = org;
      setOrg(null);
      setRoute(null);
      setOrigin(null);
      setDestination(null);
      setDenied(false);
      setFailed(false);
      if (reopenSheet && current) openOrganizationSheet(current);
    },
    [org],
  );

  function askForLocation() {
    setPhase("locating");
    setDenied(false);
    requestPosition({
      onPosition: (position) => {
        rememberPosition({ lat: position.lat, lng: position.lng });
        setOrigin({ lat: position.lat, lng: position.lng });
        setPhase("ready");
      },
      onIssue: () => {
        setDenied(true);
        setPhase("need-location");
      },
    });
  }

  // Open from anywhere.
  useEffect(() => {
    const onOpen = (event: Event) => {
      const next = (event as CustomEvent<Organization>).detail;
      if (!next) return;
      window.dispatchEvent(new CustomEvent(SHEET_CLOSE_EVENT));
      setRoute(null);
      setFailed(false);
      setDenied(false);
      setPhase("starting");
      setOrigin(null);
      setDestination(null);
      setOrg(next);
    };
    window.addEventListener(ROUTE_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(ROUTE_OPEN_EVENT, onOpen);
  }, []);

  // Resolve the destination, then find the starting point.
  useEffect(() => {
    if (!org) return;
    let cancelled = false;
    void (async () => {
      const target = organizationHasTrustedCoordinates(org)
        ? org
        : await resolveOrganizationCoordinates(org).catch(() => org);
      if (cancelled) return;
      setDestination(getOrganizationCoordinates(target));

      const known = getLastPosition();
      if (known) {
        setOrigin(known);
        setPhase("ready");
        return;
      }
      if (await isLocationGranted()) {
        if (!cancelled) askForLocation();
      } else if (!cancelled) {
        setPhase("need-location");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [org]);

  // Load the route from the person's position to the organization.
  useEffect(() => {
    if (!origin || !destination || phase !== "ready") return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setRoute(null);
    fetchRoute(origin, destination, "walking")
      .then((data) => {
        if (cancelled) return;
        if (data.coordinates.length < 2) throw new Error("empty route");
        setRoute(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [origin, destination, phase, attempt]);

  // Esc goes back; page scroll is locked while the screen is open.
  useEffect(() => {
    if (!org) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    backRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [org, close]);

  if (!org) return null;

  const duration = route
    ? route.durationMinutes >= 60
      ? `${Math.floor(route.durationMinutes / 60)} ${t("routeHr")} ${route.durationMinutes % 60} ${t("routeMin")}`
      : `${route.durationMinutes} ${t("routeMin")}`
    : null;

  const needLocation = phase === "need-location" || phase === "locating";

  return (
    <div className="rt-screen" role="dialog" aria-modal="true" aria-label={org.name} data-testid="route-screen">
      <header className="rt-head">
        <button ref={backRef} type="button" className="rt-back" onClick={() => close(true)}>
          <ArrowLeft aria-hidden className="rtl:rotate-180" />
          {t("routeBack")}
        </button>
        <h2 className="rt-title">{org.name}</h2>
      </header>

      <div className="rt-mapwrap">
        {destination && (
          <RouteMap
            origin={phase === "ready" ? origin : null}
            destination={destination}
            line={route?.coordinates ?? null}
          />
        )}
        {(phase === "starting" || phase === "locating" || loading) && (
          <div className="rt-busy" role="status">
            <Loader2 aria-hidden className="animate-spin" />
            {t("routeLoading")}
          </div>
        )}
      </div>

      <div className="rt-panel">
        {needLocation ? (
          <div className="rt-need" data-testid="route-need-location">
            <h3>{t("routeNeedTitle")}</h3>
            <p>{denied ? t("routeDeniedHelp") : t("routeNeedText")}</p>
            <button type="button" className="rt-primary" onClick={askForLocation} disabled={phase === "locating"}>
              <LocateFixed aria-hidden />
              {t("routeAllowLocation")}
            </button>
          </div>
        ) : failed ? (
          <div className="rt-need" data-testid="route-failed">
            <h3>{t("routeFailed")}</h3>
            <button type="button" className="rt-primary" onClick={() => setAttempt((n) => n + 1)}>
              <RotateCw aria-hidden />
              {t("routeRetry")}
            </button>
          </div>
        ) : route ? (
          <div className="rt-summary" data-testid="route-summary">
            <span className="rt-dist">{formatKm(route.distanceKm, unit, language)}</span>
            <span className="rt-sep" aria-hidden>
              ·
            </span>
            <span className="rt-time">{duration}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
