"use client";

import dynamic from "next/dynamic";

export const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] min-h-[400px] items-center justify-center text-slate-400 lg:h-[520px]">
      Loading map…
    </div>
  ),
});
