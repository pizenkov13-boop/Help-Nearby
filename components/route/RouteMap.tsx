"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { getMapTileConfig } from "@/lib/mapTiles";

interface RouteMapProps {
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number };
  /** The walking route as [lat, lng] pairs. */
  line: [number, number][] | null;
}

const destinationIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

const originIcon = L.divIcon({
  className: "user-location-marker",
  html: '<div class="user-marker-inner"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

/** One small Leaflet map for the route screen: tiles, two markers and the route line. */
export default function RouteMap({ origin, destination, line }: RouteMapProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || mapRef.current) return;
    const tiles = getMapTileConfig();
    const map = L.map(host, { zoomControl: true, attributionControl: true }).setView(
      [destination.lat, destination.lng],
      15,
    );
    map.attributionControl.setPrefix(false);
    L.tileLayer(tiles.url, { attribution: tiles.attribution, maxZoom: tiles.maxZoom }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [destination.lat, destination.lng]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    L.marker([destination.lat, destination.lng], { icon: destinationIcon }).addTo(layer);
    const points: [number, number][] = [[destination.lat, destination.lng]];
    if (origin) {
      L.marker([origin.lat, origin.lng], { icon: originIcon }).addTo(layer);
      points.push([origin.lat, origin.lng]);
    }
    if (line && line.length > 1) {
      L.polyline(line, {
        color: "#135e96",
        weight: 5,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layer);
      points.push(...line);
    }
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 17 });
    } else {
      map.setView([destination.lat, destination.lng], 15);
    }
  }, [origin, destination.lat, destination.lng, line]);

  return <div ref={hostRef} className="rt-map" data-testid="route-map" />;
}
