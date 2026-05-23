"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_LOCATION } from "@/lib/constants";
import { filterOrganizations } from "@/lib/filterOrganizations";
import {
  watchUserLocation,
  type TrackedUserLocation,
} from "@/lib/geolocation";
import { reverseGeocodeCountry } from "@/lib/geocode";
import { resolveOrganizationCoordinates } from "@/lib/resolveOrganizationCoordinates";
import {
  detectSlowConnectionFromNetwork,
  getStoredViewMode,
  isSlowInternetCountry,
  setStoredViewMode,
  shouldUseLiteMode,
  subscribeToNetworkChanges,
  type ViewModePreference,
} from "@/lib/liteMode";
import {
  fetchRoute,
  type RouteData,
} from "@/lib/routing";
import { searchNearbyWithSmartRadius } from "@/lib/nearbySearch";
import {
  getTierIndex,
  metersToDisplayKm,
  type SearchRadiusMode,
} from "@/lib/smartRadius";
import type { FilterState, Organization, UserLocation } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  formatSearchNearestOrgs,
  formatSearchRadiusWithin,
} from "@/lib/i18n/translations";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { cn } from "@/lib/utils";
import { Filters } from "./Filters";
import { Hero } from "./Hero";
import { OrganizationList } from "./OrganizationList";
import { SearchBar } from "./SearchBar";
import { HowItWorks } from "./HowItWorks";
import { CitiesSection } from "./home/CitiesSection";
import { MapView } from "@/components/map/MapViewDynamic";

const ACCORDION_DURATION_MS = 500;

const defaultFilters: FilterState = {
  category: "all",
  openNow: false,
  searchQuery: "",
};

export function HomePage() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selected, setSelected] = useState<Organization | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState<TrackedUserLocation | null>(
    null,
  );
  const [usingDefaultLocation, setUsingDefaultLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [overpassLoading, setOverpassLoading] = useState(false);
  const [routeDestination, setRouteDestination] = useState<Organization | null>(
    null,
  );
  const [route, setRoute] = useState<RouteData | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [detectedSlowCountry, setDetectedSlowCountry] =
    useState<boolean>(false);
  const [viewPreference, setViewPreference] = useState<ViewModePreference | null>(
    null,
  );
  const [liteDetectionDone, setLiteDetectionDone] = useState(false);
  const [impactCount, setImpactCount] = useState<number | null>(null);
  const [searchRadiusMeters, setSearchRadiusMeters] = useState<number | null>(
    null,
  );
  const [searchMode, setSearchMode] = useState<SearchRadiusMode>("within");
  const [canExpandSearch, setCanExpandSearch] = useState(false);
  const [nearestFallbackKm, setNearestFallbackKm] = useState<number | null>(
    null,
  );
  const shouldScrollRef = useRef(false);
  const findTriggeredRef = useRef(false);
  const liteAutoOpenedRef = useRef(false);

  const liteModeActive = shouldUseLiteMode(detectedSlowCountry, viewPreference);
  useEffect(() => {
    setViewPreference(getStoredViewMode());
  }, []);

  const refreshImpactCount = useCallback(async () => {
    try {
      const res = await fetch("/api/impact");
      if (!res.ok) return;
      const data = (await res.json()) as { count?: number };
      setImpactCount(data.count ?? 0);
    } catch (error) {
      console.error("[HomePage] impact count failed:", error);
    }
  }, []);

  useEffect(() => {
    void refreshImpactCount();
  }, [refreshImpactCount]);

  const handleImpactRecorded = useCallback(() => {
    setImpactCount((prev) => (prev ?? 0) + 1);
    void refreshImpactCount();
  }, [refreshImpactCount]);

  useEffect(() => {
    const networkSlow = detectSlowConnectionFromNetwork();

    if (networkSlow !== null) {
      setDetectedSlowCountry(networkSlow);
      setLiteDetectionDone(true);

      return subscribeToNetworkChanges((slow) => {
        setDetectedSlowCountry(slow);
      });
    }

    if (!navigator.geolocation) {
      setLiteDetectionDone(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const geo = await reverseGeocodeCountry(
          position.coords.latitude,
          position.coords.longitude,
        );
        if (
          geo &&
          isSlowInternetCountry(geo.country, geo.countryCode)
        ) {
          setDetectedSlowCountry(true);
        }
        setLiteDetectionDone(true);
      },
      () => setLiteDetectionDone(true),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 86400000 },
    );
  }, []);

  const runNearbySearch = useCallback(
    async (options?: { startTierIndex?: number; autoExpand?: boolean }) => {
      const location = userLocation;
      if (!location) return;

      setOrgsLoading(true);
      setOverpassLoading(true);

      try {
        const geo = await reverseGeocodeCountry(location.lat, location.lng);
        const result = await searchNearbyWithSmartRadius(location, {
          liteMode: liteModeActive,
          country: geo?.country ?? undefined,
          startTierIndex: options?.startTierIndex,
          autoExpand: options?.autoExpand,
        });

        setAllOrganizations(result.organizations);
        setSearchRadiusMeters(result.activeRadiusMeters);
        setSearchMode(result.mode);
        setCanExpandSearch(result.canExpand);
        setNearestFallbackKm(result.farthestKm);
      } catch (error) {
        console.error("[HomePage] Smart radius search failed:", error);
        setAllOrganizations([]);
        setCanExpandSearch(false);
      } finally {
        setOrgsLoading(false);
        setOverpassLoading(false);
      }
    },
    [userLocation, liteModeActive],
  );

  useEffect(() => {
    if (liteModeActive && !userLocation) return;
    if (!liteModeActive && !userLocation) return;

    void runNearbySearch({ autoExpand: true });
  }, [userLocation, liteModeActive, runNearbySearch]);

  const handleExpandSearch = useCallback(() => {
    if (!userLocation || searchRadiusMeters == null) return;
    const nextIndex =
      getTierIndex(searchRadiusMeters, liteModeActive) + 1;
    void runNearbySearch({ startTierIndex: nextIndex, autoExpand: false });
  }, [userLocation, searchRadiusMeters, liteModeActive, runNearbySearch]);

  const filtered = useMemo(
    () => filterOrganizations(allOrganizations, filters),
    [allOrganizations, filters],
  );

  useEffect(() => {
    if (selected && !filtered.some((org) => org.id === selected.id)) {
      setSelected(null);
    }
  }, [filtered, selected]);

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
    async (org: Organization) => {
      const resolved = await resolveOrganizationCoordinates(org);

      if (liteModeActive) {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${resolved.lat},${resolved.lng}`,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }

      setSelected(resolved);
      setRouteDestination(resolved);
      setRoute(null);
      setRouteError(null);
      shouldScrollRef.current = true;
      if (!mapExpanded) {
        setMapExpanded(true);
      } else {
        scrollToMapTop();
      }
    },
    [liteModeActive, mapExpanded, scrollToMapTop],
  );

  const handleSwitchToFullVersion = useCallback(() => {
    setStoredViewMode("full");
    setViewPreference("full");

    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setUsingDefaultLocation(false);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, []);

  const userLocationRef = useRef(userLocation);
  userLocationRef.current = userLocation;

  useEffect(() => {
    if (!mapExpanded || liteModeActive || usingDefaultLocation) return;

    return watchUserLocation((location) => {
      setUserLocation(location);
      setUsingDefaultLocation(false);
    });
  }, [mapExpanded, liteModeActive, usingDefaultLocation]);

  useEffect(() => {
    if (liteModeActive || !routeDestination) {
      setRoute(null);
      return;
    }

    const originRef = userLocationRef.current;
    if (!originRef || !routeDestination) {
      setRoute(null);
      setRouteError(t("locationError"));
      return;
    }

    const origin: UserLocation = {
      lat: originRef.lat,
      lng: originRef.lng,
    };
    const destination = routeDestination;
    let cancelled = false;

    async function loadRoute() {
      setRouteLoading(true);
      setRouteError(null);

      try {
        const data = await fetchRoute(origin, destination, "walking");
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

    void loadRoute();

    return () => {
      cancelled = true;
    };
  }, [routeDestination, userLocation, liteModeActive, t]);

  useEffect(() => {
    if (!mapExpanded || !shouldScrollRef.current) return;

    const timer = window.setTimeout(() => {
      scrollToMapTop();
      shouldScrollRef.current = false;
    }, ACCORDION_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [mapExpanded, scrollToMapTop]);

  const openMapAccordion = useCallback(
    (location: TrackedUserLocation, isDefault: boolean) => {
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

    if (liteModeActive) {
      openMapAccordion(DEFAULT_LOCATION, true);
      return;
    }

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
            accuracy: position.coords.accuracy,
          },
          false,
        );
      },
      () => {
        openMapAccordion(DEFAULT_LOCATION, true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [mapExpanded, userLocation, openMapAccordion, scrollToMapTop, liteModeActive]);

  useEffect(() => {
    if (
      !liteModeActive ||
      !liteDetectionDone ||
      mapExpanded ||
      liteAutoOpenedRef.current
    ) {
      return;
    }
    liteAutoOpenedRef.current = true;
    setUserLocation(DEFAULT_LOCATION);
    setUsingDefaultLocation(true);
    setMapExpanded(true);
  }, [liteModeActive, liteDetectionDone, mapExpanded]);

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

  const updateSearchQuery = useCallback((searchQuery: string) => {
    setFilters((prev) => ({ ...prev, searchQuery }));
  }, []);

  return (
    <SiteLayout>
      <Hero
        onFindHelp={handleFindHelp}
        isLocating={isLocating}
        impactCount={impactCount}
      />

      <div
        id="map-section"
        ref={mapSectionRef}
        className={cn(
          "overflow-hidden transition-[max-height] ease-in-out",
          mapExpanded ? "max-h-[2400px]" : "max-h-0",
        )}
        style={{ transitionDuration: `${ACCORDION_DURATION_MS}ms` }}
        aria-hidden={!mapExpanded}
      >
        {(userLocation || liteModeActive) && (
          <section className="map-panel">
            <div className="container">
              <div className="mb-6 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2>
                    {t("mapTitle")}
                    {liteModeActive && (
                      <span className="map-badge emerald">
                        {t("liteModeNotice")}
                      </span>
                    )}
                    {usingDefaultLocation && !liteModeActive && (
                      <span className="map-badge amber">
                        {t("defaultLocationNotice")}
                      </span>
                    )}
                    {overpassLoading && (
                      <span className="map-badge blue">
                        {t("loadingNearby")}
                      </span>
                    )}
                  </h2>
                </div>

                {!orgsLoading && searchRadiusMeters != null && (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm text-slate-400">
                      {searchMode === "nearest" && nearestFallbackKm != null
                        ? formatSearchNearestOrgs(
                            language,
                            nearestFallbackKm,
                          )
                        : formatSearchRadiusWithin(
                            language,
                            metersToDisplayKm(searchRadiusMeters),
                          )}
                    </p>
                    {canExpandSearch && (
                      <button
                        type="button"
                        onClick={handleExpandSearch}
                        disabled={overpassLoading}
                        className="rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
                      >
                        {t("searchExpand")}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div
                className={cn(
                  "grid gap-6",
                  liteModeActive
                    ? "lg:grid-cols-[280px_1fr]"
                    : "lg:grid-cols-[260px_1fr_340px]",
                )}
              >
                <div>
                  <SearchBar
                    value={filters.searchQuery}
                    onChange={updateSearchQuery}
                  />
                  <Filters filters={filters} onChange={setFilters} />
                  {liteModeActive && (
                    <button
                      type="button"
                      onClick={handleSwitchToFullVersion}
                      className="mt-4 w-full rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/20"
                    >
                      {t("switchToFullVersion")}
                    </button>
                  )}
                </div>

                {!liteModeActive && userLocation && (
                  <div className="h-[400px] overflow-hidden rounded-brand border border-white/10 shadow-lg lg:h-[520px]">
                    <MapView
                      organizations={filtered}
                      selected={selected}
                      userLocation={userLocation}
                      yourLocationLabel={t("yourLocation")}
                      route={route}
                      routeDestination={routeDestination}
                      routeLoading={routeLoading}
                      routeError={routeError}
                      onClearRoute={handleClearRoute}
                    />
                  </div>
                )}

                <div
                  className={cn(
                    "flex flex-col overflow-hidden rounded-brand border border-white/10 bg-surface/80",
                    liteModeActive ? "min-h-[320px]" : "max-h-[520px] lg:max-h-[520px]",
                  )}
                >
                  <div className="flex-1 overflow-y-auto p-4">
                    {orgsLoading && allOrganizations.length === 0 ? (
                      <p className="text-center text-sm text-gray-500">
                        Loading organizations…
                      </p>
                    ) : (
                      <OrganizationList
                        organizations={filtered}
                        searchQuery={filters.searchQuery}
                        selectedId={selected?.id}
                        onSelect={setSelected}
                        onGetDirections={handleGetDirections}
                        onImpactRecorded={handleImpactRecorded}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <HowItWorks />
      <CitiesSection />
    </SiteLayout>
  );
}
