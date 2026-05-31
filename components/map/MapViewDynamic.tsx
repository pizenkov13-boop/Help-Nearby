"use client";

import dynamic from "next/dynamic";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

function MapViewLoading() {
  const { t } = useLanguage();
  return (
    <div className="flex h-[400px] min-h-[400px] items-center justify-center text-slate-400 lg:h-[520px]">
      {t("mapLoading")}
    </div>
  );
}

export const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <MapViewLoading />,
});
