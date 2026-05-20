"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_LOCATION, NEARBY_RADIUS_METERS } from "@/lib/constants";
import { fetchOrganizations, fetchCountries } from "@/lib/data";
import { reverseGeocodeCountry } from "@/lib/geocode";
import { mergeOrganizations } from "@/lib/mergeOrganizations";
import { isOrganizationOpen } from "@/lib/org";
import {
  fetchRoute,
  type RouteData,
  type RoutingMode,
} from "@/lib/routing";
import type { FilterState, Organization, UserLocation } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { cn } from "@/lib/utils";
import { Filters } from "./Filters";
import { Hero } from "./Hero";
import { OrganizationList } from "./OrganizationList";
import { AboutSection } from "./home/AboutSection";
import { CitiesSection } from "./home/CitiesSection";
import { HowItWorksSection } from "./home/HowItWorksSection";
import { StatsBar } from "./home/StatsBar";

const ACCORDION_DURATION_MS = 500;

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] min-h-[400px] items-center justify-center text-gray-500 lg:h-[520px]">
      Loading map…
    </div>
  ),
});

const defaultFilters: FilterState = {
  country: "all",
  category: "all",
  openNow: false,
};

function filterOrganizations(
  orgs: Organization[],
  filters: FilterState,
): Organization[] {
  return orgs.filter((org) => {
    if (filters.country !== "all" && org.country !== filters.country) {
      return false;
    }
    if (
      filters.category !== "all" &&
      !org.categories.includes(filters.category)
    ) {
      return false;
    }
    if (filters.openNow && !isOrganizationOpen(org)) {
      return false;
    }
    return true;
  });
}

export function HomePage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selected, setSelected] = useState<Organization | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [usingDefaultLocation, setUsingDefaultLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [overpassLoading, setOverpassLoading] = useState(false);
  const [routeDestination, setRouteDestination] = useState<Organization | null>(
    null,
  );
  const [route, setRoute] = useState<RouteData | null>(null);
  const [routeMode, setRouteMode] = useState<RoutingMode>("walking");
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const shouldScrollRef = useRef(false);
  const findTriggeredRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setOrgsLoading(true);
      try {
        const [orgs, countries] = await Promise.all([
          fetchOrganizations(),
          fetchCountries(),
        ]);
        if (cancelled) return;
        setCountryOptions(countries);
        setAllOrganizations(orgs.map((org) => ({ ...org, verified: true })));
      } catch (error) {
        console.error("[HomePage] Supabase catalog load failed:", error);
      } finally {
        if (!cancelled) setOrgsLoading(false);
      }
    }

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!userLocation) return;

    let cancelled = false;

    async function loadNearby() {
      const location = userLocation;
      if (!location) return;

      setOrgsLoading(true);
      setOverpassLoading(true);

      const country = await reverseGeocodeCountry(location.lat, location.lng);

      const verified = (
        await fetchOrganizations(location, {
          country: country ?? undefined,
          radiusMeters: NEARBY_RADIUS_METERS,
        })
      ).map((org) => ({ ...org, verified: true }));

      if (cancelled) return;

      setAllOrganizations(verified);
      setOrgsLoading(false);

      try {
        const params = new URLSearchParams({
          lat: String(location.lat),
          lng: String(location.lng),
          radius: String(NEARBY_RADIUS_METERS),
        });
        const res = await fetch(`/api/nearby?${params}`);
        if (!res.ok) throw new Error("Overpass fetch failed");
        const nearby = (await res.json()) as Organization[];
        if (cancelled) return;

        setAllOrganizations(mergeOrganizations(verified, nearby));
      } catch (error) {
        console.error("[HomePage] Overpass load failed:", error);
      } finally {
        if (!cancelled) setOverpassLoading(false);
      }
    }

    loadNearby();

    return () => {
      cancelled = true;
    };
  }, [userLocation]);

  const filtered = useMemo(
    () => filterOrganizations(allOrganizations, filters),
    [allOrganizations, filters],
  );

  const scrollToMapTop = useCallback(() => {
    const el = mapSectionRef.current;
    if (!el) return;

    const headerOffset = 72;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, []);

  const handleClearRoute = useCallback(() => {
    setRouteDestination(null);
    setRoute(null);
    setRouteError(null);
  }, []);

  const handleGetDirections = useCallback(
    (org: Organization) => {
      setSelected(org);
      setRouteDestination(org);
      setRouteError(null);
      shouldScrollRef.current = true;
      if (!mapExpanded) {
        setMapExpanded(true);
      } else {
        scrollToMapTop();
      }
    },
    [mapExpanded, scrollToMapTop],
  );

  useEffect(() => {
    if (!routeDestination || !userLocation) {
      setRoute(null);
      return;
    }

    let cancelled = false;

    async function loadRoute() {
      setRouteLoading(true);
      setRouteError(null);

      try {
        const data = await fetchRoute(userLocation!, routeDestination!, routeMode);
        if (cancelled) return;
        setRoute(data);
      } catch (error) {
        if (cancelled) return;
        setRoute(null);
        setRouteError(
          error instanceof Error ? error.message : "Failed to load route",
        );
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    }

    loadRoute();

    return () => {
      cancelled = true;
    };
  }, [routeDestination, userLocation, routeMode]);

  useEffect(() => {
    if (!mapExpanded || !shouldScrollRef.current) return;

    const timer = window.setTimeout(() => {
      scrollToMapTop();
      shouldScrollRef.current = false;
    }, ACCORDION_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [mapExpanded, scrollToMapTop]);

  const openMapAccordion = useCallback(
    (location: UserLocation, isDefault: boolean) => {
      setUserLocation(location);
      setUsingDefaultLocation(isDefault);
      setMapExpanded(true);
      setIsLocating(false);
      shouldScrollRef.current = true;
    },
    [],
  );

  const handleFindHelp = useCallback(() => {
    if (mapExpanded && userLocation) {
      scrollToMapTop();
      return;
    }

    setIsLocating(true);

    if (!navigator.geolocation) {
      openMapAccordion(DEFAULT_LOCATION, true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        openMapAccordion(
          {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          false,
        );
      },
      () => {
        openMapAccordion(DEFAULT_LOCATION, true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [mapExpanded, userLocation, openMapAccordion, scrollToMapTop]);

  useEffect(() => {
    if (
      searchParams.get("find") !== "1" ||
      findTriggeredRef.current ||
      mapExpanded
    ) {
      return;
    }
    findTriggeredRef.current = true;
    handleFindHelp();
  }, [searchParams, mapExpanded, handleFindHelp]);

  return (
    <SiteLayout>
      <Hero onFindHelp={handleFindHelp} isLocating={isLocating} />

      <div
        id="map-section"
        ref={mapSectionRef}
        className={cn(
          "overflow-hidden transition-[max-height] ease-in-out",
          mapExpanded && userLocation ? "max-h-[1400px]" : "max-h-0",
        )}
        style={{ transitionDuration: `${ACCORDION_DURATION_MS}ms` }}
        aria-hidden={!mapExpanded}
      >
        {userLocation && (
          <section className="border-t border-gray-200 bg-gray-50 px-4 py-10 transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t("mapTitle")}
                </h2>
                {usingDefaultLocation && (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-400">
                    {t("defaultLocationNotice")}
                  </span>
                )}
                {overpassLoading && (
                  <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
                    {t("loadingNearby")}
                  </span>
                )}
              </div>

              <div className="grid gap-6 lg:grid-cols-[260px_1fr_340px]">
                <Filters
                  filters={filters}
                  onChange={setFilters}
                  countryOptions={countryOptions}
                />

                <div className="h-[400px] overflow-hidden rounded-xl border border-gray-200 shadow-lg dark:border-gray-800 lg:h-[520px]">
                  <MapView
                    organizations={filtered}
                    selected={selected}
                    userLocation={userLocation}
                    yourLocationLabel={t("yourLocation")}
                    route={route}
                    routeDestination={routeDestination}
                    routeMode={routeMode}
                    routeLoading={routeLoading}
                    routeError={routeError}
                    onRouteModeChange={setRouteMode}
                    onClearRoute={handleClearRoute}
                  />
                </div>

                <div className="flex max-h-[520px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white/80 dark:border-gray-800 dark:bg-gray-800/30 lg:max-h-[520px]">
                  <div className="flex-1 overflow-y-auto p-4">
                    {orgsLoading && allOrganizations.length === 0 ? (
                      <p className="text-center text-sm text-gray-500">
                        Loading organizations…
                      </p>
                    ) : (
                      <OrganizationList
                        organizations={filtered}
                        selectedId={selected?.id}
                        onSelect={setSelected}
                        onGetDirections={handleGetDirections}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <AboutSection />
      <CitiesSection />
      <StatsBar />
      <HowItWorksSection />
    </SiteLayout>
  );
}