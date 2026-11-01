"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cacheDetectedCountry,
  readCachedDetectedCountry,
} from "@/lib/detectedCountry";
import { setChatContext } from "@/lib/chatClientContext";
import { filterOrganizations } from "@/lib/filterOrganizations";
import { limitOsmOrganizations } from "@/lib/osmRelevance";
import { fetchPlaces, type PlaceResult } from "@/lib/placeSearch";
import { requestPosition, type LocationIssue } from "@/lib/locationRequest";
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
  setStoredViewMode,
  shouldUseLiteMode,
  subscribeToNetworkChanges,
  type ViewModePreference,
} from "@/lib/liteMode";
import {
  fetchRoute,
  type RouteData,
} from "@/lib/routing";
import {
  purgeExpiredNearbyCache,
  readNearbyCache,
  writeNearbyCache,
} from "@/lib/nearbyCache";
import { purgeExpiredOverpassClientCache } from "@/lib/overpassClientCache";
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
import type { Category, FilterState, Organization, UserLocation } from "@/lib/types";
import { FIND_HELP_EVENT } from "@/lib/uiEvents";
import { radiusInUnit, unitLabel, useDistanceUnit } from "@/lib/distanceUnits";
import { List, Map as MapIcon } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  formatSearchNearestOrgs,
  formatSearchRadiusWithin,
} from "@/lib/i18n/translations";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { cn } from "@/lib/utils";
import { Filters } from "./Filters";
import { Hero } from "./Hero";
import { PlaceBar } from "./PlaceBar";
import { OrganizationList } from "./OrganizationList";
import { SearchBar } from "./SearchBar";
import { HowItWorks } from "./HowItWorks";
import { MapView } from "@/components/map/MapViewDynamic";

const ACCORDION_DURATION_MS = 500;
/** How long a search waits for the reverse geocode (country, place name) before it starts without it. */
const REVERSE_GEOCODE_WAIT_MS = 2_500;

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
  const distanceUnit = useDistanceUnit();
  // Phones show the list first; the map is one tap away (it replaces the list, it is not stacked above it).
  const [phoneView, setPhoneView] = useState<"list" | "map">("list");
  const [isPhone, setIsPhone] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsPhone(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
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
  // Place search: when set, this place (not browser geolocation) is the active search location.
  const [searchPlace, setSearchPlace] = useState<PlaceResult | null>(null);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [placeSearching, setPlaceSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; key: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  // Why the last location request did not give a position (shown with the city field).
  const [locationIssue, setLocationIssue] = useState<LocationIssue | null>(null);
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
  const [viewPreference, setViewPreference] = useState<ViewModePreference | null>(
    null,
  );
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
  // Label of the place the device position points to (set by reverse geocoding the search position).
  const [geoLabel, setGeoLabel] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const shouldScrollRef = useRef(false);
  const findTriggeredRef = useRef(false);
  const searchRunIdRef = useRef(0);
  const searchPlaceRef = useRef<PlaceResult | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const lastSearchAreaRef = useRef<string | null>(null);

  const searchAreaKey = useCallback(
    (location: UserLocation, lite: boolean) =>
      `${location.lat.toFixed(2)},${location.lng.toFixed(2)},${lite}`,
    [],
  );

  // Automatic Lite mode: only the browser's own Data Saver / 2G signal (see lib/liteMode.ts).
  const liteModeActive = shouldUseLiteMode(slowByNetworkInfo, viewPreference);
  useEffect(() => {
    setViewPreference(getStoredViewMode());
    // Remembered results live 30 minutes; delete older ones as soon as the page opens.
    purgeExpiredNearbyCache();
    purgeExpiredOverpassClientCache();
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

  // The count is cached for a minute on the server and the CDN: count the click here instead of re-reading it.
  const handleImpactRecorded = useCallback(() => {
    setImpactCount((prev) => (prev ?? 0) + 1);
  }, []);

  useEffect(() => {
    setSlowByNetworkInfo(detectSlowConnectionFromNetwork());
    return subscribeToNetworkChanges(setSlowByNetworkInfo);
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
      if (!cached) {
        // Never keep showing the previous place's organizations while the new search loads.
        setAllOrganizations([]);
      }
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
        // The country (for the directory sources) and the place label come from Nominatim, which can be
        // slow: wait for it briefly, search without it if needed, and still show the label when it arrives.
        const geoRequest = reverseGeocodeCountry(location.lat, location.lng, language);
        void geoRequest.then((found) => {
          if (!found) return;
          cacheDetectedCountry(found.country, found.countryCode);
          if (found.place && runId === searchRunIdRef.current) {
            setGeoLabel({ lat: location.lat, lng: location.lng, label: found.place });
          }
        });
        const geo = await Promise.race([
          geoRequest,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), REVERSE_GEOCODE_WAIT_MS)),
        ]);
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
    [userLocation, liteModeActive, applySearchResult, language],
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

  const handleRetry = useCallback(() => {
    void runNearbySearch({ autoExpand: true });
  }, [runNearbySearch]);

  // The place the results are around: a typed place, else the reverse-geocoded device position.
  const geoLabelMatches =
    geoLabel !== null &&
    userLocation !== null &&
    Math.abs(geoLabel.lat - userLocation.lat) < 0.05 &&
    Math.abs(geoLabel.lng - userLocation.lng) < 0.05;
  const placeLabel =
    searchPlace?.name ?? (geoLabelMatches ? geoLabel!.label : t("currentLocationLabel"));
  // A coarse fix (Wi-Fi / IP based) can be hundreds of km off; say so.
  const approximateKm =
    !searchPlace && userLocation?.accuracy != null && userLocation.accuracy > 20_000
      ? Math.round(userLocation.accuracy / 1000)
      : null;

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
      setPhoneView("map");
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

  /**
   * The one place that asks the browser for the position (only ever called from a tap). It never
   * leaves the page waiting: errors, a missing API and a prompt nobody answers all end in a message.
   */
  const askForLocation = useCallback((options?: { fly?: boolean; clearOnIssue?: boolean }) => {
    setLocationIssue(null);
    setIsLocating(true);
    requestPosition({
      onPosition: (location) => {
        setIsLocating(false);
        // A late answer must not replace a city the person typed in the meantime.
        if (searchPlaceRef.current) return;
        setLocationIssue(null);
        setUserLocation(location);
        if (options?.fly) setFlyTarget({ lat: location.lat, lng: location.lng, key: Date.now() });
      },
      onIssue: (issue) => {
        setIsLocating(false);
        setLocationIssue(issue);
        // Never keep another place's results on screen, and never substitute a different city.
        if (options?.clearOnIssue) {
          setUserLocation(null);
          setAllOrganizations([]);
          setSearchRadiusMeters(null);
        }
      },
    });
  }, []);

  const handleSwitchToFullVersion = useCallback(() => {
    setStoredViewMode("full");
    setViewPreference("full");

    askForLocation();
  }, [askForLocation]);

  const handleSwitchToLiteVersion = useCallback(() => {
    setStoredViewMode("lite");
    setViewPreference("lite");
    setLiteMapVisible(false);
    setRouteDestination(null);
    setRoute(null);
    setRouteError(null);
  }, []);

  const hasUserLocation = userLocation !== null;
  searchPlaceRef.current = searchPlace;
  const userLocationRef = useRef(userLocation);
  userLocationRef.current = userLocation;

  useEffect(() => {
    // Only follow the device position once the user has shared it and no typed place is active.
    if (!mapExpanded || liteModeActive || !hasUserLocation || searchPlace) return;

    return watchUserLocation((location) => {
      setUserLocation(location);
    });
  }, [mapExpanded, liteModeActive, hasUserLocation, searchPlace]);

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
    (location: TrackedUserLocation | null) => {
      setUserLocation(location);
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

    // Open the panel with the city field at once. The answer to the location prompt can be slow,
    // never come (embedded browsers) or be "no"; none of that may leave the person with nothing to do.
    openMapAccordion(null);
    askForLocation();
  }, [mapExpanded, userLocation, openMapAccordion, scrollToMapTop, askForLocation]);

  const handleSelectCategory = useCallback(
    (category: Category) => {
      setFilters((prev) => ({ ...prev, category }));
      handleFindHelp();
    },
    [handleFindHelp],
  );

  // "Find Help Near Me" and the phone bottom bar's Find search every category.
  const handleFindAll = useCallback(() => {
    setFilters((prev) => (prev.category === "all" ? prev : { ...prev, category: "all" }));
    handleFindHelp();
  }, [handleFindHelp]);
  useEffect(() => {
    window.addEventListener(FIND_HELP_EVENT, handleFindAll);
    return () => window.removeEventListener(FIND_HELP_EVENT, handleFindAll);
  }, [handleFindAll]);

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
      } else {
        openMapAccordion({ lat: place.lat, lng: place.lng });
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
    searchPlaceRef.current = null;
    setSearchPlace(null);
    setPlaceError(null);
    lastSearchAreaRef.current = null;
    askForLocation({ fly: true, clearOnIssue: true });
  }, [askForLocation]);

  const locationMessage = isLocating
    ? t("locationWaiting")
    : locationIssue === "denied"
      ? t("locationDeniedNotice")
      : locationIssue === "unavailable"
        ? t("locationUnavailableNotice")
        : locationIssue === "timeout"
          ? t("locationTimeoutNotice")
          : locationIssue === "in-app"
            ? t("locationInAppNotice")
            : t("locationNeededNotice");

  const sourceSettled = sourceStates !== null && !anySourcePending;
  const sourceDown = (status: string | undefined) => status === "failed" || status === "timeout";
  // OSM did not answer in time: the list is the verified catalog only, and the page says so.
  const osmUnavailable = sourceSettled && sourceDown(sourceStates?.osm);
  // The verified catalog (database) did not answer: what is listed comes from OpenStreetMap only.
  const catalogUnavailable =
    sourceSettled && sourceDown(sourceStates?.supabase) && allOrganizations.length > 0;
  // Nothing to show and a source failed: that is an error, not an empty area.
  const loadFailed =
    sourceSettled &&
    allOrganizations.length === 0 &&
    (sourceDown(sourceStates?.supabase) || sourceDown(sourceStates?.osm));
  const nothingHere =
    !orgsLoading &&
    !anySourcePending &&
    !loadFailed &&
    !filters.searchQuery.trim() &&
    sourceStates !== null;

  return (
    <SiteLayout>
      <Hero
        onFindHelp={handleFindAll}
        onSelectCategory={handleSelectCategory}
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
        {mapExpanded && (
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
                    {catalogUnavailable && (
                      <span className="map-badge amber" data-testid="catalog-unavailable">
                        {t("catalogUnavailableNotice")}
                      </span>
                    )}
                    {(verifiedOnlyNotice || osmUnavailable) && (
                      <span className="map-badge amber" data-testid="osm-unavailable">
                        {t("osmUnavailableNotice")}
                      </span>
                    )}
                  </h2>
                </div>

                {!userLocation && (
                  <p
                    className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-900 dark:text-amber-200"
                    role="status"
                    data-testid="location-needed"
                  >
                    {locationMessage}{" "}
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      disabled={isLocating}
                      className="font-semibold underline underline-offset-2 hover:no-underline disabled:opacity-50"
                    >
                      {t("placeUseMyLocation")}
                    </button>
                  </p>
                )}

                {userLocation && !orgsLoading && searchRadiusMeters != null && (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-base text-slate-700 dark:text-slate-300">
                      {searchMode === "nearest" && nearestFallbackKm != null
                        ? formatSearchNearestOrgs(language, nearestFallbackKm, {
                            value: radiusInUnit(nearestFallbackKm, distanceUnit),
                            label: unitLabel(distanceUnit, language),
                          })
                        : formatSearchRadiusWithin(
                            language,
                            metersToDisplayKm(searchRadiusMeters),
                            {
                              value: radiusInUnit(
                                metersToDisplayKm(searchRadiusMeters),
                                distanceUnit,
                              ),
                              label: unitLabel(distanceUnit, language),
                            },
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
                  <div className="results-sticky sticky top-[calc(72px+env(safe-area-inset-top,0px))] z-30 bg-[var(--surface-card)] pb-1 pt-2 max-md:-mx-4 max-md:px-4 md:max-lg:-mx-7 md:max-lg:px-7 max-lg:order-1 lg:static lg:bg-transparent lg:p-0">
                  <SearchBar
                    value={filters.searchQuery}
                    onChange={updateSearchQuery}
                    localMatches={localMatches}
                    onSelectOrganization={setSelected}
                    onSearchPlace={(text) => void handleSearchPlace(text)}
                    onSelectPlace={activatePlace}
                    placeSearching={placeSearching}
                    placeError={placeError}
                  />
                  {!liteModeActive && userLocation && (
                    <div
                      className="view-seg lg:hidden"
                      role="group"
                      aria-label={t("viewList") + " / " + t("viewMap")}
                    >
                      {(["list", "map"] as const).map((view) => (
                        <button
                          key={view}
                          type="button"
                          aria-pressed={phoneView === view}
                          onClick={() => setPhoneView(view)}
                          className="view-seg-btn"
                        >
                          {view === "list" ? (
                            <List className="h-5 w-5" aria-hidden />
                          ) : (
                            <MapIcon className="h-5 w-5" aria-hidden />
                          )}
                          {view === "list" ? t("viewList") : t("viewMap")}
                        </button>
                      ))}
                    </div>
                  )}
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

                {!liteModeActive && userLocation && mapExpanded && (!isPhone || phoneView === "map") && (
                  <div className="isolate h-[45dvh] max-h-[420px] min-h-[260px] max-lg:h-[calc(100dvh-400px)] max-lg:max-h-none max-lg:min-h-[320px] overflow-hidden rounded-brand border border-slate-200 shadow-lg dark:border-white/10 max-lg:order-3 lg:h-[520px] lg:max-h-none">
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
                    "results-pane flex w-full min-w-0 max-w-full flex-col overflow-hidden rounded-brand border border-slate-200 bg-white/80 dark:border-white/10 dark:bg-surface-card",
                    "max-lg:order-4",
                    !liteModeActive && phoneView === "map" && "max-lg:hidden",
                    liteModeActive ? "min-h-[320px]" : "lg:max-h-[520px]",
                  )}
                >
                  <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 md:p-4">
                    {userLocation && (
                      <PlaceBar
                        label={placeLabel}
                        approximateKm={approximateKm}
                        onSearchPlace={(text) => void handleSearchPlace(text)}
                        onUseMyLocation={handleUseMyLocation}
                        placeSearching={placeSearching}
                        placeError={placeError}
                        isLocating={isLocating}
                      />
                    )}
                    {/* Without a place there is nothing to list (and nothing to load): no skeleton cards. */}
                    {userLocation && (
                      <OrganizationList
                        organizations={filtered}
                        isLoading={orgsLoading && filtered.length === 0}
                        searchQuery={filters.searchQuery}
                        emptyMessage={
                          loadFailed
                            ? t("loadFailed")
                            : nothingHere
                              ? t("noOrgsHereExpand")
                              : undefined
                        }
                        emptyAction={
                          loadFailed ? (
                            <button
                              type="button"
                              onClick={handleRetry}
                              data-testid="load-retry"
                              className="mt-4 min-h-11 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-500/20 dark:text-blue-300"
                            >
                              {t("loadRetry")}
                            </button>
                          ) : nothingHere ? (
                            <button
                              type="button"
                              onClick={handleTryLargerRadius}
                              data-testid="empty-expand"
                              className="mt-4 min-h-11 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-500/20 dark:text-blue-300"
                            >
                              {t("searchExpand")}
                            </button>
                          ) : undefined
                        }
                        selectedId={selected?.id}
                        onSelect={(org) => {
                          setSelected(org);
                          if (!org.verified) setPhoneView("map");
                        }}
                        onGetDirections={handleGetDirections}
                        onImpactRecorded={handleImpactRecorded}
                      />
                    )}
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
