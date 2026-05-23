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
import { RouteControls } from "@/components/RouteControls";
import type { RouteData, RoutingMode } from "@/lib/routing";
import { hasValidMapCoordinates } from "@/lib/mapCoordinates";
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
  weight: 5,
  opacity: 0.92,
  lineCap: "round" as const,
  lineJoin: "round" as const,
};

function MapViewport({
  organizations,
  userLocation,
  route,
  destination,
}: {
  organizations: Organization[];
  userLocation: UserLocation;
  route: RouteData | null;
  destination: Organization | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (route?.coordinates.length) {
      const bounds = L.latLngBounds(route.coordinates);
      bounds.extend([userLocation.lat, userLocation.lng]);
      if (destination) {
        bounds.extend([destination.lat, destination.lng]);
      }
      map.fitBounds(bounds, { padding: [72, 72], maxZoom: 16 });
      return;
    }

    const points: [number, number][] = [
      [userLocation.lat, userLocation.lng],
      ...organizations.map((o) => [o.lat, o.lng] as [number, number]),
    ];

    if (points.length === 1) {
      map.setView([userLocation.lat, userLocation.lng], 15);
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [organizations, userLocation, map, route, destination]);

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
      map.flyTo([selected.lat, selected.lng], 15, { duration: 0.8 });
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
      {organizations.map((org) => (
        <Marker
          key={`${markerGeneration}-${org.id}`}
          position={[org.lat, org.lng]}
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
      ))}
    </>
  );
}

interface MapViewProps {
  organizations: Organization[];
  selected?: Organization | null;
  userLocation: TrackedUserLocation;
  yourLocationLabel: string;
  route: RouteData | null;
  routeDestination: Organization | null;
  routeMode: RoutingMode;
  routeLoading: boolean;
  routeError: string | null;
  onRouteModeChange: (mode: RoutingMode) => void;
  onClearRoute: () => void;
}

export default function MapView({
  organizations,
  selected,
  userLocation,
  yourLocationLabel,
  route,
  routeDestination,
  routeMode,
  routeLoading,
  routeError,
  onRouteModeChange,
  onClearRoute,
}: MapViewProps) {
  const [mapOrganizations, setMapOrganizations] = useState<Organization[]>([]);
  const [markerGeneration, setMarkerGeneration] = useState(0);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    const withCoords = organizations.filter(hasValidMapCoordinates);
    const missingCoords = organizations.filter(
      (org) => !hasValidMapCoordinates(org),
    );

    console.log("[MapView] organizations prop:", {
      total: organizations.length,
      withValidCoords: withCoords.length,
      needsGeocode: missingCoords.length,
    });

    setMapOrganizations(withCoords);
    setMarkerGeneration((g) => g + 1);

    if (missingCoords.length === 0) {
      setGeocoding(false);
      return;
    }

    let cancelled = false;
    setGeocoding(true);

    void (async () => {
      try {
        const geocoded = await resolveOrganizationsForMap(missingCoords, 15);
        if (cancelled) return;

        const newlyPlaced = geocoded.filter(hasValidMapCoordinates);
        console.log(
          "[MapView] geocoded markers added:",
          newlyPlaced.length,
        );

        setMapOrganizations((prev) => {
          const byId = new Map(prev.map((o) => [o.id, o]));
          for (const org of newlyPlaced) {
            byId.set(org.id, org);
          }
          return Array.from(byId.values());
        });
        setMarkerGeneration((g) => g + 1);
      } catch (error) {
        console.error("[MapView] background geocode failed:", error);
      } finally {
        if (!cancelled) setGeocoding(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organizations]);

  const destinationOnMap = useMemo(() => {
    if (!routeDestination) return null;
    return (
      mapOrganizations.find((o) => o.id === routeDestination.id) ??
      routeDestination
    );
  }, [mapOrganizations, routeDestination]);

  const center = useMemo<[number, number]>(
    () => [userLocation.lat, userLocation.lng],
    [userLocation.lat, userLocation.lng],
  );

  const mapKey = `map-${markerGeneration}-${mapOrganizations.length}`;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        key={mapKey}
        center={center}
        zoom={14}
        scrollWheelZoom
        className="z-0 h-full w-full rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapViewport
          organizations={mapOrganizations}
          userLocation={userLocation}
          route={route}
          destination={destinationOnMap}
        />
        <FlyToSelected
          selected={selected}
          hasRoute={Boolean(route?.coordinates.length)}
        />

        {route && route.coordinates.length > 0 && (
          <Polyline positions={route.coordinates} pathOptions={ROUTE_STYLE} />
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

      {route && !routeLoading && !routeError && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[1000] flex justify-center px-3">
          <div className="rounded-xl border border-blue-500/40 bg-gray-900/95 px-4 py-2.5 text-center shadow-lg backdrop-blur-sm">
            <p className="text-sm font-bold text-blue-400">
              {route.distanceKm} km · {route.durationMinutes} min
            </p>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">
              {routeMode === "walking" ? "Walking" : "Driving"} · OSRM
            </p>
          </div>
        </div>
      )}

      {routeDestination && (
        <RouteControls
          destination={routeDestination}
          route={route}
          routeMode={routeMode}
          loading={routeLoading}
          error={routeError}
          onModeChange={onRouteModeChange}
          onClear={onClearRoute}
        />
      )}
    </div>
  );
}
