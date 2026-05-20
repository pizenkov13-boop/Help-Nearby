"use client";

import { useEffect, useMemo } from "react";
import {
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
import type { Organization, UserLocation } from "@/lib/types";
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
    '<div class="user-marker-pulse"></div><div class="user-marker-inner"></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function createCategoryIcon(color: string, verified = false) {
  const verifiedRing = verified
    ? "box-shadow:0 0 0 3px #007bff, 0 2px 8px rgba(0,0,0,0.4);"
    : "box-shadow:0 2px 8px rgba(0,0,0,0.4);";
  const badge = verified
    ? `<span style="position:absolute;top:-4px;right:-4px;background:#007bff;color:white;font-size:10px;width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid white;">✓</span>`
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
  opacity: 0.9,
  lineCap: "round" as const,
  lineJoin: "round" as const,
};

function MapViewport({
  organizations,
  userLocation,
  route,
}: {
  organizations: Organization[];
  userLocation: UserLocation;
  route: RouteData | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (route?.coordinates.length) {
      const bounds = L.latLngBounds(route.coordinates);
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
      return;
    }

    const points: [number, number][] = [
      [userLocation.lat, userLocation.lng],
      ...organizations.map((o) => [o.lat, o.lng] as [number, number]),
    ];

    if (points.length === 1) {
      map.setView([userLocation.lat, userLocation.lng], 13);
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [organizations, userLocation, map, route]);

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
      map.flyTo([selected.lat, selected.lng], 14, { duration: 0.8 });
    }
  }, [selected, map, hasRoute]);

  return null;
}

interface MapViewProps {
  organizations: Organization[];
  selected?: Organization | null;
  userLocation: UserLocation;
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
  const center = useMemo<[number, number]>(
    () => [userLocation.lat, userLocation.lng],
    [userLocation],
  );

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        className="z-0 h-full w-full rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapViewport
          organizations={organizations}
          userLocation={userLocation}
          route={route}
        />
        <FlyToSelected
          selected={selected}
          hasRoute={Boolean(route?.coordinates.length)}
        />

        {route && route.coordinates.length > 0 && (
          <Polyline positions={route.coordinates} pathOptions={ROUTE_STYLE} />
        )}

        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={userLocationIcon}
          zIndexOffset={1000}
        >
          <Popup>
            <div className="text-sm font-medium">{yourLocationLabel}</div>
          </Popup>
        </Marker>

        {organizations.map((org) => (
          <Marker
            key={org.id}
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
                  <span className="ml-1 text-blue-400">✓</span>
                )}
                <br />
                <span>
                  {CATEGORY_CONFIG[org.category].icon} {org.category}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

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
