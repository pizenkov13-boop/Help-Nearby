"use client";

import {
  useEffect,
  useState,
  type ComponentProps,
  type ComponentType,
} from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type MapViewComponent from "@/components/MapView";

type MapViewProps = ComponentProps<typeof MapViewComponent>;

function MapViewLoading() {
  const { t } = useLanguage();
  return (
    <div className="flex h-[400px] min-h-[400px] items-center justify-center text-slate-400 lg:h-[520px]">
      {t("mapLoading")}
    </div>
  );
}

let mapViewPromise: Promise<{ default: ComponentType<MapViewProps> }> | null =
  null;

function loadMapView() {
  if (!mapViewPromise) {
    mapViewPromise = import("@/components/MapView");
  }
  return mapViewPromise;
}

/** Loads Leaflet map code only when the map mounts — avoids unused CSS preload on first paint. */
export function MapView(props: MapViewProps) {
  const [Component, setComponent] =
    useState<ComponentType<MapViewProps> | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadMapView().then((mod) => {
      if (!cancelled) setComponent(() => mod.default);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!Component) return <MapViewLoading />;
  return <Component {...props} />;
}
