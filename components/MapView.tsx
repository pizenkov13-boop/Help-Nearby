"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { Loader2, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { organizationNeedsGeocoding } from "@/lib/nominatimGeocode";
import type { RouteData } from "@/lib/routing";
import { hasValidMapCoordinates } from "@/lib/mapCoordinates";
import { getOrganizationCoordinates } from "@/lib/organizationCoordinates";
import { resolveOrganizationsForMap } from "@/lib/resolveOrganizationCoordinates";
import type { Organization, UserLocation } from "@/lib/types";
import type { TrackedUserLocation } from "@/lib/geolocation";
import { CATEGORY_CONFIG } from "@/lib/categories";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const userLocationIcon = L.divIcon({
  className: "user-location-marker",
  html:
    '<div class="user-marker-pulse"></div><div class="user-marker-pulse user-marker-pulse-delay"></div><div class="user-marker-inner"></div>',
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

function createCategoryIcon(color: string, verified = false) {
  const verifiedRing = verified
    ? "box-shadow:0 0 0 3px #10b981, 0 2px 8px rgba(0,0,0,0.4);"
    : "box-shadow:0 2px 8px rgba(0,0,0,0.4);";
  const badge = verified
    ? `<span style="position:absolute;top:-4px;right:-4px;background:#10b981;color:white;font-size:10px;width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid white;">✓</span>`
    : "";
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="position:relative;background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;${verifiedRing}">${badge}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const categoryColors: Record<string, string> = {
  food: "#f59e0b",
  shelter: "#3b82f6",
  medical: "#ef4444",
  clothing: "#a855f7",
  volunteer: "#10b981",
};

const ROUTE_STYLE = {
  color: "#007bff",
  weight: 4,
  opacity: 0.95,
  lineCap: "round" as const,
  lineJoin: "round" as const,
};

function clearLeafletContainer(container: HTMLElement | null) {
  if (!container) return;

  container.querySelectorAll<HTMLElement>("[class*='leaflet']").forEach((el) => {
    delete (el as HTMLElement & { _leaflet_id?: number })._leaflet_id;
  });
  delete (container as HTMLElement & { _leaflet_id?: number })._leaflet_id;
  container.replaceChildren();
}

function buildOrganizationPopup(org: Organization) {
  const category = CATEGORY_CONFIG[org.category];
  const verified = org.verified
    ? '<span style="margin-left:4px;color:#34d399;">✓</span>'
    : "";
  const address = org.address
    ? `<br /><span style="font-size:12px;color:#9ca3af;">${org.address}</span>`
    : "";

  return `<div style="font-size:14px;">
    <strong>${org.name}</strong>${verified}<br />
    <span>${category.icon} ${org.category}</span>${address}
  </div>`;
}

function fitMapToContent(
  map: L.Map,
  organizations: Organization[],
  userLocation: UserLocation,
  route: RouteData | null,
  destinationCoords: { lat: number; lng: number } | null,
) {
  if (route?.coordinates.length) {
    const bounds = L.latLngBounds(route.coordinates);
    bounds.extend([userLocation.lat, userLocation.lng]);
    if (destinationCoords) {
      bounds.extend([destinationCoords.lat, destinationCoords.lng]);
    }
    map.fitBounds(bounds, { padding: [72, 72], maxZoom: 16 });
    return;
  }

  const points: [number, number][] = [
    [userLocation.lat, userLocation.lng],
    ...organizations.map((org) => {
      const { lat, lng } = getOrganizationCoordinates(org);
      return [lat, lng] as [number, number];
    }),
  ];

  if (points.length === 1) {
    map.setView([userLocation.lat, userLocation.lng], 15);
    return;
  }

  map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 14 });
}

interface MapViewProps {
  organizations: Organization[];
  selected?: Organization | null;
  userLocation: TrackedUserLocation;
  yourLocationLabel: string;
  liteMode?: boolean;
  route: RouteData | null;
  routeDestination: Organization | null;
  routeLoading: boolean;
  onClearRoute: () => void;
  mapVisible?: boolean;
}

export default function MapView({
  organizations,
  selected,
  userLocation,
  yourLocationLabel,
  liteMode = false,
  route,
  routeDestination,
  routeLoading,
  onClearRoute,
  mapVisible = true,
}: MapViewProps) {
  const { t } = useLanguage();
  const mapHostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const selectedRef = useRef<Organization | null | undefined>(selected);
  const [mapOrganizations, setMapOrganizations] = useState<Organization[]>([]);
  const [markerGeneration, setMarkerGeneration] = useState(0);
  const [geocoding, setGeocoding] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  selectedRef.current = selected;

  useEffect(() => {
    const withStoredCoords = organizations.filter(hasValidMapCoordinates);
    const needsNominatim = organizations.filter(organizationNeedsGeocoding);

    setMapOrganizations(
      withStoredCoords.length > 0 ? withStoredCoords : organizations,
    );
    setMarkerGeneration((g) => g + 1);

    if (liteMode || needsNominatim.length === 0) {
      setGeocoding(false);
      return;
    }

    let cancelled = false;
    setGeocoding(true);

    void (async () => {
      try {
        const refined = await resolveOrganizationsForMap(
          needsNominatim,
          Math.min(needsNominatim.length, 40),
        );
        if (cancelled) return;

        const placed = refined.filter(hasValidMapCoordinates);

        setMapOrganizations((prev) => {
          const byId = new Map(prev.map((o) => [o.id, o]));
          for (const org of placed) {
            byId.set(org.id, org);
          }
          for (const org of organizations) {
            if (hasValidMapCoordinates(org)) {
              byId.set(org.id, org);
            }
          }
          return Array.from(byId.values());
        });
        setMarkerGeneration((g) => g + 1);
      } catch (error) {
        console.error("[MapView] Nominatim geocode failed:", error);
      } finally {
        if (!cancelled) setGeocoding(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organizations, liteMode]);

  const routeDestinationCoords = useMemo(() => {
    if (!routeDestination) return null;
    const onMap = mapOrganizations.find((o) => o.id === routeDestination.id);
    return getOrganizationCoordinates(onMap ?? routeDestination);
  }, [mapOrganizations, routeDestination]);

  const center = useMemo<[number, number]>(
    () => [userLocation.lat, userLocation.lng],
    [userLocation.lat, userLocation.lng],
  );

  const tileUrl = liteMode
    ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  useEffect(() => {
    const container = mapHostRef.current;
    if (!container) return;

    clearLeafletContainer(container);

    const map = L.map(container, {
      center,
      zoom: 14,
      scrollWheelZoom: true,
    });

    L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setMapReady(true);

    return () => {
      setMapReady(false);
      routeLayerRef.current = null;
      markersLayerRef.current = null;
      map.remove();
      mapRef.current = null;
      clearLeafletContainer(container);
    };
  }, [tileUrl]);

  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const position: [number, number] = [userLocation.lat, userLocation.lng];
    const accuracy = userLocation.accuracy;

    if (accuracy != null && accuracy > 0 && accuracy < 500) {
      L.circle(position, {
        radius: accuracy,
        color: "#007bff",
        fillColor: "#007bff",
        fillOpacity: 0.12,
        weight: 1,
        opacity: 0.35,
      }).addTo(markersLayer);
    }

    L.marker(position, { icon: userLocationIcon, zIndexOffset: 1000 })
      .bindPopup(`<div style="font-size:14px;font-weight:500;">${yourLocationLabel}</div>`)
      .addTo(markersLayer);

    for (const org of mapOrganizations) {
      const { lat, lng } = getOrganizationCoordinates(org);
      L.marker([lat, lng], {
        icon: createCategoryIcon(
          categoryColors[org.category] ?? "#3b82f6",
          org.verified,
        ),
      })
        .bindPopup(buildOrganizationPopup(org))
        .addTo(markersLayer);
    }

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (route && route.coordinates.length > 1) {
      routeLayerRef.current = L.polyline(route.coordinates, ROUTE_STYLE).addTo(map);
    }

    fitMapToContent(
      map,
      mapOrganizations,
      userLocation,
      route,
      routeDestinationCoords,
    );
  }, [
    mapOrganizations,
    markerGeneration,
    userLocation,
    yourLocationLabel,
    route,
    routeDestinationCoords,
    mapReady,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    const selectedOrg = selectedRef.current;
    if (!map || !selectedOrg || route?.coordinates.length) return;

    const { lat, lng } = getOrganizationCoordinates(selectedOrg);
    map.flyTo([lat, lng], 15, { duration: 0.8 });
  }, [selected, route, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapVisible) return;

    const timer = window.setTimeout(() => {
      map.invalidateSize();
      fitMapToContent(
        map,
        mapOrganizations,
        userLocation,
        route,
        routeDestinationCoords,
      );
    }, 350);

    return () => window.clearTimeout(timer);
  }, [
    mapVisible,
    mapOrganizations,
    userLocation,
    route,
    routeDestinationCoords,
    mapReady,
  ]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapHostRef}
        className="absolute inset-0 z-0 h-full w-full rounded-xl"
      />

      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-surface-card text-sm text-slate-400">
          {t("mapLoading")}
        </div>
      )}

      {geocoding && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg bg-gray-900/90 px-3 py-1.5 text-xs text-gray-300">
          {t("mapRefiningLocations")}
        </div>
      )}

      {route && route.coordinates.length > 1 && (
        <button
          type="button"
          onClick={onClearRoute}
          disabled={routeLoading}
          className="absolute right-3 top-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-full border border-gray-600/80 bg-gray-900/95 text-gray-200 shadow-lg backdrop-blur-sm transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-60"
          aria-label={t("routeClear")}
        >
          {routeLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          ) : (
            <X className="h-5 w-5" />
          )}
        </button>
      )}
    </div>
  );
}
