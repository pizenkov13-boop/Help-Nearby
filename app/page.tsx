import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { HomePage } from "@/components/HomePage";

export default function Home() {
  return (
    <Suspense
      fallback={
        <PageLoading className="flex min-h-screen items-center justify-center bg-surface text-slate-400" />
      }
    >
      <HomePage />
    </Suspense>
  );
}
