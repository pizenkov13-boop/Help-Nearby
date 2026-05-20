import { Suspense } from "react";
import { HomePage } from "@/components/HomePage";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-400">
          Loading…
        </div>
      }
    >
      <HomePage />
    </Suspense>
  );
}
