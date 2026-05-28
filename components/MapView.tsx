"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
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

function MapViewport({
  organizations,
  userLocation,
  route,
  destinationCoords,
}: {
  organizations: Organization[];
  userLocation: UserLocation;
  route: RouteData | null;
  destinationCoords: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
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
      ...organizations.map((o) => {
        const { lat, lng } = getOrganizationCoordinates(o);
        return [lat, lng] as [number, number];
      }),
    ];

    if (points.length === 1) {
      map.setView([userLocation.lat, userLocation.lng], 15);
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [organizations, userLocation, map, route, destinationCoords]);

  return null;
}

function FlyToSelected({
  selected,
  hasRoute,
}: {
  selected: Organization | null | undefined;
  hasRoute: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (selected && !hasRoute) {
      const { lat, lng } = getOrganizationCoordinates(selected);
      map.flyTo([lat, lng], 15, { duration: 0.8 });
    }
  }, [selected, map, hasRoute]);

  return null;
}

function UserLocationLayer({
  userLocation,
  yourLocationLabel,
}: {
  userLocation: TrackedUserLocation;
  yourLocationLabel: string;
}) {
  const position: [number, number] = [userLocation.lat, userLocation.lng];
  const accuracy = userLocation.accuracy;

  return (
    <>
      {accuracy != null && accuracy > 0 && accuracy < 500 && (
        <Circle
          center={position}
          radius={accuracy}
          pathOptions={{
            color: "#007bff",
            fillColor: "#007bff",
            fillOpacity: 0.12,
            weight: 1,
            opacity: 0.35,
          }}
        />
      )}
      <Marker position={position} icon={userLocationIcon} zIndexOffset={1000}>
        <Popup>
          <div className="text-sm font-medium">{yourLocationLabel}</div>
        </Popup>
      </Marker>
    </>
  );
}

function OrganizationMarkers({
  organizations,
  markerGeneration,
}: {
  organizations: Organization[];
  markerGeneration: number;
}) {
  useEffect(() => {
    console.log(
      "[MapView] markers layer:",
      organizations.length,
      "generation:",
      markerGeneration,
      organizations.slice(0, 3).map((o) => ({
        id: o.id,
        lat: o.lat,
        lng: o.lng,
      })),
    );
  }, [organizations, markerGeneration]);

  return (
    <>
      {organizations.map((org) => {
        const { lat, lng } = getOrganizationCoordinates(org);
        return (
        <Marker
          key={`${markerGeneration}-${org.id}`}
          position={[lat, lng]}
          icon={createCategoryIcon(
            categoryColors[org.category] ?? "#3b82f6",
            org.verified,
          )}
        >
          <Popup>
            <div className="text-sm">
              <strong>{org.name}</strong>
              {org.verified && (
                <span className="ml-1 text-emerald-400">✓</span>
              )}
              <br />
              <span>
                {CATEGORY_CONFIG[org.category].icon} {org.category}
              </span>
              {org.address && (
                <>
                  <br />
                  <span className="text-xs text-gray-400">{org.address}</span>
                </>
              )}
            </div>
          </Popup>
        </Marker>
        );
      })}
    </>
  );
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
}: MapViewProps) {
  const { t } = useLanguage();
  const [mapOrganizations, setMapOrganizations] = useState<Organization[]>([]);
  const [markerGeneration, setMarkerGeneration] = useState(0);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    const withStoredCoords = organizations.filter(hasValidMapCoordinates);
    const needsNominatim = organizations.filter(organizationNeedsGeocoding);

    console.log("[MapView] organizations prop:", {
      total: organizations.length,
      storedCoords: withStoredCoords.length,
      nominatimRefine: needsNominatim.length,
    });

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
        console.log("[MapView] Nominatim markers placed:", placed.length);

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

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom
        className="z-0 h-full w-full rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={
            liteMode
              ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          }
        />
        <MapViewport
          organizations={mapOrganizations}
          userLocation={userLocation}
          route={route}
          destinationCoords={routeDestinationCoords}
        />
        <FlyToSelected
          selected={selected}
          hasRoute={Boolean(route?.coordinates.length)}
        />

        {route && route.coordinates.length > 1 && (
          <Polyline
            key={`route-${route.coordinates.length}`}
            positions={route.coordinates}
            pathOptions={ROUTE_STYLE}
          />
        )}

        <UserLocationLayer
          userLocation={userLocation}
          yourLocationLabel={yourLocationLabel}
        />

        <OrganizationMarkers
          organizations={mapOrganizations}
          markerGeneration={markerGeneration}
        />
      </MapContainer>

      {geocoding && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg bg-gray-900/90 px-3 py-1.5 text-xs text-gray-300">
          Refining marker locations…
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
