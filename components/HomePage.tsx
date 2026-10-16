"use client";

import { MapPin } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_LOCATION } from "@/lib/constants";
import {
  cacheDetectedCountry,
  readCachedDetectedCountry,
} from "@/lib/detectedCountry";
import { setChatContext } from "@/lib/chatClientContext";
import { filterOrganizations } from "@/lib/filterOrganizations";
import { limitOsmOrganizations } from "@/lib/osmRelevance";
import { fetchPlaces, type PlaceResult } from "@/lib/placeSearch";
import { getOrganizationSource } from "@/lib/organizationSource";
import {
  watchUserLocation,
  type TrackedUserLocation,
} from "@/lib/geolocation";
import { reverseGeocodeCountry } from "@/lib/geocode";
import {
  getOrganizationCoordinates,
  isApproximateLocation,
  organizationHasTrustedCoordinates,
  validateOrganizationForDisplay,
  validateOrganizationForNearby,
} from "@/lib/organizationCoordinates";
import { resolveOrganizationCoordinates } from "@/lib/resolveOrganizationCoordinates";
import {
  detectSlowConnectionFromNetwork,
  getStoredViewMode,
  isSlowMeasuredFetch,
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
import { readNearbyCache, writeNearbyCache } from "@/lib/nearbyCache";
import {
  searchNearbyWithSmartRadius,
  type NearbySourceStates,
} from "@/lib/nearbySearch";
import {
  getMaxRadiusMeters,
  getRadiusTiers,
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
import {
  formatSearchLocation,
  trackFindHelpClicked,
  trackGeolocationDenied,
  trackGeolocationGranted,
  trackOrganizationsLoaded,
  trackSearchPerformed,
} from "@/lib/analytics.client";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { cn } from "@/lib/utils";
import { Filters } from "./Filters";
import { Hero } from "./Hero";
import { OrganizationList } from "./OrganizationList";
import { SearchBar } from "./SearchBar";
import { HowItWorks } from "./HowItWorks";
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
  // overflow:hidden is only needed while the accordion animates; afterwards it would stop
  // the sticky search bar from sticking to the viewport.
  const [accordionSettled, setAccordionSettled] = useState(false);
  useEffect(() => {
    if (!mapExpanded) {
      setAccordionSettled(false);
      return;
    }
    const timer = window.setTimeout(() => setAccordionSettled(true), ACCORDION_DURATION_MS + 60);
    return () => window.clearTimeout(timer);
  }, [mapExpanded]);
  const [userLocation, setUserLocation] = useState<TrackedUserLocation | null>(
    null,
  );
  const [usingDefaultLocation, setUsingDefaultLocation] = useState(false);
  // Place search: when set, this place (not browser geolocation) is the active search location.
  const [searchPlace, setSearchPlace] = useState<PlaceResult | null>(null);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [placeSearching, setPlaceSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; key: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourceStates, setSourceStates] = useState<NearbySourceStates | null>(null);
  const [routeDestination, setRouteDestination] = useState<Organization | null>(
    null,
  );
  const [route, setRoute] = useState<RouteData | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [slowByNetworkInfo, setSlowByNetworkInfo] = useState(false);
  const [slowByCountryFallback, setSlowByCountryFallback] = useState(false);
  const [slowByMeasuredSpeed, setSlowByMeasuredSpeed] = useState(false);
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
  const [liteMapVisible, setLiteMapVisible] = useState(false);
  const [verifiedOnlyNotice, setVerifiedOnlyNotice] = useState(false);
  const shouldScrollRef = useRef(false);
  const findTriggeredRef = useRef(false);
  const liteAutoOpenedRef = useRef(false);
  const searchRunIdRef = useRef(0);
  const searchAbortRef = useRef<AbortController | null>(null);
  const lastSearchAreaRef = useRef<string | null>(null);
  const lastOrganizationsLoadedRef = useRef<string | null>(null);

  const searchAreaKey = useCallback(
    (location: UserLocation, lite: boolean) =>
      `${location.lat.toFixed(2)},${location.lng.toFixed(2)},${lite}`,
    [],
  );

  const detectedSlowConnection =
    slowByNetworkInfo || slowByCountryFallback || slowByMeasuredSpeed;
  const liteModeActive = shouldUseLiteMode(
    detectedSlowConnection,
    viewPreference,
  );
  useEffect(() => {
    setViewPreference(getStoredViewMode());
  }, []);

  const refreshImpactCount = useCallback(async () => {
    try {
      const startedAt = performance.now();
      const res = await fetch("/api/impact");
      const durationMs = performance.now() - startedAt;
      if (isSlowMeasuredFetch(durationMs)) {
        setSlowByMeasuredSpeed(true);
      }
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
      setSlowByNetworkInfo(networkSlow);
      setLiteDetectionDone(true);

      return subscribeToNetworkChanges((slow) => {
        setSlowByNetworkInfo(slow);
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
        if (geo) {
          cacheDetectedCountry(geo.country, geo.countryCode);
          if (isSlowInternetCountry(geo.country, geo.countryCode)) {
            setSlowByCountryFallback(true);
          }
        }
        setLiteDetectionDone(true);
      },
      () => setLiteDetectionDone(true),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 86400000 },
    );
  }, []);

  const applySearchResult = useCallback(
    (
      organizations: Organization[],
      meta: {
        activeRadiusMeters: number;
        mode: SearchRadiusMode;
        canExpand: boolean;
        farthestKm: number | null;
      },
    ) => {
      setAllOrganizations(organizations);
      setSearchRadiusMeters(meta.activeRadiusMeters);
      setSearchMode(meta.mode);
      setCanExpandSearch(meta.canExpand);
      setNearestFallbackKm(meta.farthestKm);
    },
    [],
  );

  const runNearbySearch = useCallback(
    async (options?: { startTierIndex?: number; autoExpand?: boolean }) => {
      const location = userLocation;
      if (!location) return;

      const runId = ++searchRunIdRef.current;
      searchAbortRef.current?.abort();
      const abortController = new AbortController();
      searchAbortRef.current = abortController;

      const cached = readNearbyCache(
        location.lat,
        location.lng,
        liteModeActive,
      );
      const hadCachedResults = Boolean(cached);
      if (cached) {
        applySearchResult(cached.organizations, {
          activeRadiusMeters: cached.searchRadiusMeters ?? 0,
          mode: cached.searchMode,
          canExpand: cached.canExpand,
          farthestKm: cached.nearestFallbackKm,
        });
      }

      setOrgsLoading(!hadCachedResults);
      setSourcesLoading(true);
      setSourceStates({ supabase: "pending", osm: "pending", ocha: "pending" });
      setVerifiedOnlyNotice(false);

      try {
        const geo = await reverseGeocodeCountry(location.lat, location.lng);
        if (geo) {
          cacheDetectedCountry(geo.country, geo.countryCode);
        }
        const result = await searchNearbyWithSmartRadius(
          location,
          {
            liteMode: liteModeActive,
            country: geo?.country ?? undefined,
            countryCode: geo?.countryCode ?? null,
            startTierIndex: options?.startTierIndex,
            autoExpand: options?.autoExpand,
            signal: abortController.signal,
          },
          {
            onOrganizationsUpdate: (organizations) => {
              if (runId !== searchRunIdRef.current) return;
              // Progressive merge: later sources add to the list without resetting it.
              setAllOrganizations(organizations);
              if (organizations.length > 0) {
                setOrgsLoading(false);
              }
            },
            onOrganizationsPatch: (patched) => {
              if (runId !== searchRunIdRef.current) return;
              const byId = new Map(patched.map((org) => [org.id, org]));
              setAllOrganizations((prev) =>
                prev.map((org) => byId.get(org.id) ?? org),
              );
            },
            onSourceStatus: (states) => {
              if (runId !== searchRunIdRef.current) return;
              setSourceStates(states);
              if (!Object.values(states).includes("pending")) {
                setOrgsLoading(false);
              }
            },
            onExternalTimeout: () => {
              if (runId !== searchRunIdRef.current) return;
              setVerifiedOnlyNotice(true);
            },
          },
        );

        if (runId !== searchRunIdRef.current) return;

        applySearchResult(result.organizations, {
          activeRadiusMeters: result.activeRadiusMeters,
          mode: result.mode,
          canExpand: result.canExpand,
          farthestKm: result.farthestKm,
        });
        setVerifiedOnlyNotice(result.externalTimedOut);

        writeNearbyCache({
          timestamp: Date.now(),
          lat: location.lat,
          lng: location.lng,
          liteMode: liteModeActive,
          organizations: result.organizations,
          searchRadiusMeters: result.activeRadiusMeters,
          searchMode: result.mode,
          canExpand: result.canExpand,
          nearestFallbackKm: result.farthestKm,
        });
      } catch (error) {
        if (runId !== searchRunIdRef.current) return;
        console.error("[HomePage] Smart radius search failed:", error);
        if (!hadCachedResults) {
          setAllOrganizations([]);
        }
        setCanExpandSearch(false);
        setSourceStates((prev) =>
          prev
            ? {
                supabase: prev.supabase === "pending" ? "failed" : prev.supabase,
                osm: prev.osm === "pending" ? "failed" : prev.osm,
                ocha: prev.ocha === "pending" ? "failed" : prev.ocha,
              }
            : prev,
        );
      } finally {
        if (runId !== searchRunIdRef.current) return;
        setOrgsLoading(false);
        setSourcesLoading(false);
      }
    },
    [userLocation, liteModeActive, applySearchResult],
  );

  useEffect(() => {
    if (!userLocation || !mapExpanded) return;

    const areaKey = searchAreaKey(userLocation, liteModeActive);
    if (lastSearchAreaRef.current === areaKey) return;
    lastSearchAreaRef.current = areaKey;

    void runNearbySearch({ autoExpand: true });
  }, [userLocation, mapExpanded, liteModeActive, runNearbySearch, searchAreaKey]);

  const handleExpandSearch = useCallback(() => {
    if (!userLocation || searchRadiusMeters == null) return;
    const nextIndex =
      getTierIndex(searchRadiusMeters, liteModeActive) + 1;
    void runNearbySearch({ startTierIndex: nextIndex, autoExpand: false });
  }, [userLocation, searchRadiusMeters, liteModeActive, runNearbySearch]);

  const anySourcePending =
    sourceStates !== null && Object.values(sourceStates).includes("pending");

  const handleTryLargerRadius = useCallback(() => {
    if (!userLocation) return;
    const nextIndex =
      searchRadiusMeters == null
        ? 0
        : getTierIndex(searchRadiusMeters, liteModeActive) + 1;
    const maxIndex = getRadiusTiers(liteModeActive).length - 1;
    // At the widest tier nothing larger exists: retry it (sources may just have failed).
    void runNearbySearch({
      startTierIndex: Math.min(nextIndex, maxIndex),
      autoExpand: false,
    });
  }, [userLocation, searchRadiusMeters, liteModeActive, runNearbySearch]);

  const maxSearchRadiusMeters = getMaxRadiusMeters(liteModeActive);

  const coordinateValidated = useMemo(() => {
    if (!userLocation) return allOrganizations;
    return allOrganizations
      .map((org) =>
        validateOrganizationForDisplay(org, userLocation, maxSearchRadiusMeters),
      )
      .filter((org): org is Organization => org !== null);
  }, [allOrganizations, userLocation, maxSearchRadiusMeters]);

  const filtered = useMemo(
    () => limitOsmOrganizations(filterOrganizations(coordinateValidated, filters)),
    [coordinateValidated, filters],
  );

  // Loaded organizations matching the search text (shown first in the suggestions).
  const localMatches = useMemo(() => {
    const query = filters.searchQuery.trim().toLowerCase();
    if (!query) return [];
    return coordinateValidated.filter((org) =>
      [org.name, org.country, org.city, org.address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [coordinateValidated, filters.searchQuery]);

  // Approximate (country-level OCHA) entries are list-only: no marker, no influence on map bounds.
  const mapOrganizations = useMemo(
    () => filtered.filter((org) => !isApproximateLocation(org)),
    [filtered],
  );

  // Share the current results with the chat assistant (nearest 10, truncated server-side too).
  useEffect(() => {
    setChatContext({
      country: readCachedDetectedCountry()?.country ?? "",
      location: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null,
      organizations: filtered.slice(0, 10).map((org) => ({
        name: org.name,
        category: org.category,
        city: org.city,
        phone: org.phone,
        source_url: getOrganizationSource(org)?.url ?? org.website,
        verified: org.verified,
      })),
    });
  }, [filtered, userLocation]);

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
      const location = userLocation;
      if (!location) {
        setRouteError(t("locationError"));
        return;
      }

      const maxRadius =
        searchRadiusMeters ?? getMaxRadiusMeters(liteModeActive);
      const validated = validateOrganizationForNearby(org, location, maxRadius);
      if (!validated) {
        setRouteError(t("locationError"));
        return;
      }

      let destination = organizationHasTrustedCoordinates(validated)
        ? validated
        : await resolveOrganizationCoordinates(validated);

      destination =
        validateOrganizationForNearby(destination, location, maxRadius) ??
        validated;

      const coords = getOrganizationCoordinates(destination);

      if (liteModeActive) {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }

      setSelected(destination);
      setRouteDestination(destination);
      setRoute(null);
      setRouteError(null);
      shouldScrollRef.current = true;
      if (!mapExpanded) {
        setMapExpanded(true);
      } else {
        scrollToMapTop();
      }
    },
    [
      userLocation,
      searchRadiusMeters,
      liteModeActive,
      mapExpanded,
      scrollToMapTop,
      t,
    ],
  );

  const handleSwitchToFullVersion = useCallback(() => {
    setStoredViewMode("full");
    setViewPreference("full");

    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const geo = await reverseGeocodeCountry(lat, lng);
        if (geo) {
          cacheDetectedCountry(geo.country, geo.countryCode);
        }
        trackGeolocationGranted({
          country: geo?.country ?? "",
          lat,
          lng,
        });
        setUserLocation({
          lat,
          lng,
          accuracy: position.coords.accuracy,
        });
        setUsingDefaultLocation(false);
        setIsLocating(false);
      },
      (error: GeolocationPositionError) => {
        if (error.code === error.PERMISSION_DENIED) {
          trackGeolocationDenied(language);
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [language]);

  const handleSwitchToLiteVersion = useCallback(() => {
    setStoredViewMode("lite");
    setViewPreference("lite");
    setLiteMapVisible(false);
    setRouteDestination(null);
    setRoute(null);
    setRouteError(null);
  }, []);

  const userLocationRef = useRef(userLocation);
  userLocationRef.current = userLocation;

  useEffect(() => {
    if (!mapExpanded || liteModeActive || usingDefaultLocation || searchPlace) return;

    return watchUserLocation((location) => {
      setUserLocation(location);
      setUsingDefaultLocation(false);
    });
  }, [mapExpanded, liteModeActive, usingDefaultLocation, searchPlace]);

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
    const destination = getOrganizationCoordinates(routeDestination);
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
    trackFindHelpClicked(language);

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
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const geo = await reverseGeocodeCountry(lat, lng);
        if (geo) {
          cacheDetectedCountry(geo.country, geo.countryCode);
        }
        trackGeolocationGranted({
          country: geo?.country ?? "",
          lat,
          lng,
        });
        openMapAccordion(
          {
            lat,
            lng,
            accuracy: position.coords.accuracy,
          },
          false,
        );
      },
      (error: GeolocationPositionError) => {
        if (error.code === error.PERMISSION_DENIED) {
          trackGeolocationDenied(language);
        }
        openMapAccordion(DEFAULT_LOCATION, true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [
    mapExpanded,
    userLocation,
    openMapAccordion,
    scrollToMapTop,
    liteModeActive,
    language,
  ]);

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

  const activatePlace = useCallback(
    (place: PlaceResult) => {
      setPlaceError(null);
      setSearchPlace(place);
      setFilters((prev) => ({ ...prev, searchQuery: "" }));
      setSelected(null);
      setRouteDestination(null);
      // Force the area-change effect to search even if this area was searched before.
      lastSearchAreaRef.current = null;
      setFlyTarget({ lat: place.lat, lng: place.lng, key: Date.now() });

      if (mapExpanded) {
        setUserLocation({ lat: place.lat, lng: place.lng });
        setUsingDefaultLocation(true);
      } else {
        openMapAccordion({ lat: place.lat, lng: place.lng }, true);
      }
    },
    [mapExpanded, openMapAccordion],
  );

  const handleSearchPlace = useCallback(
    async (text: string) => {
      const query = text.trim();
      if (!query) return;
      setPlaceSearching(true);
      setPlaceError(null);
      try {
        const outcome = await fetchPlaces(query, 1, language);
        const place = outcome.status === "ok" ? outcome.places[0] : undefined;
        if (!place) {
          setPlaceError(t("placeNotFound"));
          return;
        }
        activatePlace(place);
      } finally {
        setPlaceSearching(false);
      }
    },
    [language, t, activatePlace],
  );

  const handleUseMyLocation = useCallback(() => {
    setSearchPlace(null);
    setPlaceError(null);
    lastSearchAreaRef.current = null;

    const useDefault = () => {
      setUserLocation(DEFAULT_LOCATION);
      setUsingDefaultLocation(true);
      setFlyTarget({ lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng, key: Date.now() });
    };

    if (!navigator.geolocation) {
      useDefault();
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation({ lat, lng, accuracy: position.coords.accuracy });
        setUsingDefaultLocation(false);
        setFlyTarget({ lat, lng, key: Date.now() });
        setIsLocating(false);
      },
      () => {
        useDefault();
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, []);

  const handleSearchSubmit = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      trackSearchPerformed({
        query: trimmed,
        location: formatSearchLocation(userLocation),
        results_count: filtered.length,
      });
    },
    [userLocation, filtered],
  );

  useEffect(() => {
    if (!mapExpanded || orgsLoading || !userLocation) return;

    const cachedCountry = readCachedDetectedCountry()?.country ?? "";
    const radius = metersToDisplayKm(searchRadiusMeters ?? 0);
    const signature = `${filtered.length}|${cachedCountry}|${radius}`;
    if (lastOrganizationsLoadedRef.current === signature) return;
    lastOrganizationsLoadedRef.current = signature;

    trackOrganizationsLoaded({
      count: filtered.length,
      country: cachedCountry,
      radius,
    });
  }, [mapExpanded, orgsLoading, userLocation, filtered.length, searchRadiusMeters]);

  return (
    <SiteLayout>
      <Hero
        onFindHelp={handleFindHelp}
        isLocating={isLocating}
        liteModeActive={liteModeActive}
      />

      <div
        id="map-section"
        ref={mapSectionRef}
        className={cn(
          "transition-[max-height] ease-in-out",
          mapExpanded && accordionSettled
            ? "max-h-none overflow-visible"
            : mapExpanded
              ? "max-h-[2400px] overflow-hidden"
              : "max-h-0 overflow-hidden",
        )}
        style={{ transitionDuration: `${ACCORDION_DURATION_MS}ms` }}
        aria-hidden={!mapExpanded}
      >
        {(userLocation || liteModeActive) && (
          <section className="map-panel">
            <div className="container">
              <div className="mb-3 flex flex-col gap-3 md:mb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <h2>
                    {t("mapTitle")}
                    {liteModeActive && (
                      <span className="map-badge emerald">
                        {t("liteModeNotice")}
                      </span>
                    )}
                    {usingDefaultLocation && !liteModeActive && !searchPlace && (
                      <span className="map-badge amber">
                        {t("defaultLocationNotice")}
                      </span>
                    )}
                    {anySourcePending && (
                      <span className="map-badge blue" data-testid="loading-nearby">
                        {t("loadingNearby")}
                      </span>
                    )}
                    {anySourcePending && sourceStates?.supabase === "pending" && (
                      <span className="map-badge blue" data-testid="source-supabase">
                        {t("sourceCatalogPending")}
                      </span>
                    )}
                    {anySourcePending && sourceStates?.osm === "pending" && (
                      <span className="map-badge blue" data-testid="source-osm">
                        {t("sourceOsmPending")}
                      </span>
                    )}
                    {anySourcePending && sourceStates?.ocha === "pending" && (
                      <span className="map-badge blue" data-testid="source-ocha">
                        {t("sourceOchaPending")}
                      </span>
                    )}
                    {verifiedOnlyNotice && (
                      <span className="map-badge amber">
                        {t("verifiedOnlyNotice")}
                      </span>
                    )}
                  </h2>
                </div>

                {!orgsLoading && searchRadiusMeters != null && (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
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
                        disabled={sourcesLoading}
                        className="min-h-11 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-1 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-500/20 disabled:opacity-50 md:min-h-0 md:px-3 md:text-xs dark:text-blue-300"
                      >
                        {t("searchExpand")}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div
                className={cn(
                  "grid min-w-0 gap-4 md:gap-6",
                  liteModeActive
                    ? "lg:grid-cols-[280px_1fr]"
                    : "lg:grid-cols-[260px_1fr_340px]",
                )}
              >
                <div className="min-w-0 max-lg:contents">
                  <div className="sticky top-[calc(72px+env(safe-area-inset-top,0px))] z-30 bg-[var(--surface-card)] pb-1 pt-2 max-md:-mx-4 max-md:px-4 md:max-lg:-mx-7 md:max-lg:px-7 max-lg:order-1 lg:static lg:bg-transparent lg:p-0">
                  <SearchBar
                    value={filters.searchQuery}
                    onChange={updateSearchQuery}
                    onSubmit={handleSearchSubmit}
                    localMatches={localMatches}
                    onSelectOrganization={setSelected}
                    onSearchPlace={(text) => void handleSearchPlace(text)}
                    onSelectPlace={activatePlace}
                    placeSearching={placeSearching}
                    placeError={placeError}
                  />
                  </div>
                  <div className="min-w-0 max-lg:order-2">
                    <Filters filters={filters} onChange={setFilters} />
                  </div>
                  <button
                    type="button"
                    onClick={
                      liteModeActive
                        ? handleSwitchToFullVersion
                        : handleSwitchToLiteVersion
                    }
                    className="mt-4 min-h-11 w-full rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-500/20 max-lg:order-5 max-lg:mt-0 dark:text-blue-300"
                  >
                    {liteModeActive
                      ? t("switchToFullVersion")
                      : t("switchToLiteVersion")}
                  </button>
                </div>

                {!liteModeActive && userLocation && mapExpanded && (
                  <div className="isolate h-[45dvh] max-h-[420px] min-h-[260px] overflow-hidden rounded-brand border border-slate-200 shadow-lg dark:border-white/10 max-lg:order-3 lg:h-[520px] lg:max-h-none">
                    <MapView
                      key="full-map"
                      mapVisible={mapExpanded}
                      organizations={mapOrganizations}
                      selected={selected}
                      userLocation={userLocation}
                      yourLocationLabel={searchPlace?.name ?? t("yourLocation")}
                      flyTarget={flyTarget}
                      route={route}
                      routeDestination={routeDestination}
                      routeLoading={routeLoading}
                      onClearRoute={handleClearRoute}
                    />
                  </div>
                )}
                {liteModeActive && userLocation && liteMapVisible && mapExpanded && (
                  <div className="isolate h-[280px] overflow-hidden rounded-brand border border-slate-200 shadow-lg dark:border-white/10 max-lg:order-3 lg:h-[320px]">
                    <MapView
                      key="lite-map"
                      mapVisible={mapExpanded}
                      organizations={mapOrganizations}
                      selected={selected}
                      userLocation={userLocation}
                      yourLocationLabel={searchPlace?.name ?? t("yourLocation")}
                      flyTarget={flyTarget}
                      liteMode
                      route={route}
                      routeDestination={routeDestination}
                      routeLoading={routeLoading}
                      onClearRoute={handleClearRoute}
                    />
                  </div>
                )}

                <div
                  className={cn(
                    "flex w-full min-w-0 max-w-full flex-col overflow-hidden rounded-brand border border-slate-200 bg-white/80 dark:border-white/10 dark:bg-surface-card",
                    "max-lg:order-4",
                    liteModeActive ? "min-h-[320px]" : "lg:max-h-[520px]",
                  )}
                >
                  <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 md:p-4">
                    {searchPlace && (
                      <div
                        className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-800 md:text-xs dark:text-blue-200"
                        data-testid="place-chip"
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="min-w-0 break-words font-medium">
                          {t("placeSearchingNear").replace("{place}", searchPlace.name)}
                        </span>
                        <span aria-hidden>·</span>
                        <button
                          type="button"
                          onClick={handleUseMyLocation}
                          className="font-semibold underline underline-offset-2 hover:no-underline"
                        >
                          {t("placeUseMyLocation")}
                        </button>
                      </div>
                    )}
                    <OrganizationList
                      organizations={filtered}
                      isLoading={orgsLoading && filtered.length === 0}
                      searchQuery={filters.searchQuery}
                      emptyMessage={
                        !orgsLoading &&
                        allOrganizations.length === 0 &&
                        !filters.searchQuery.trim() &&
                        filters.category === "all" &&
                        !filters.openNow
                          ? t("noVerifiedNearby")
                          : undefined
                      }
                      emptyAction={
                        !orgsLoading &&
                        !anySourcePending &&
                        allOrganizations.length === 0 &&
                        !filters.searchQuery.trim() &&
                        filters.category === "all" &&
                        !filters.openNow ? (
                          <button
                            type="button"
                            onClick={handleTryLargerRadius}
                            className="mt-4 min-h-11 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-500/20 dark:text-blue-300"
                          >
                            {t("searchLargerRadius")}
                          </button>
                        ) : undefined
                      }
                      selectedId={selected?.id}
                      onSelect={setSelected}
                      onGetDirections={handleGetDirections}
                      onImpactRecorded={handleImpactRecorded}
                    />
                  </div>
                  {liteModeActive && userLocation && !liteMapVisible && (
                    <div className="border-t border-slate-200 p-3 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setLiteMapVisible(true)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/20 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
                      >
                        {t("showLiteMap")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <HowItWorks />
    </SiteLayout>
  );
}
