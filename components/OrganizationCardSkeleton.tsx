export function OrganizationCardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-xl border border-white/10 bg-gray-800/50 p-4"
      aria-hidden
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="h-5 w-2/3 rounded bg-gray-700" />
        <div className="h-6 w-16 rounded-full bg-gray-700" />
      </div>
      <div className="mb-2 h-3 w-full rounded bg-gray-700/80" />
      <div className="mb-4 h-3 w-4/5 rounded bg-gray-700/60" />
      <div className="flex gap-2">
        <div className="h-9 flex-1 rounded-lg bg-gray-700" />
        <div className="h-9 flex-1 rounded-lg bg-gray-700/80" />
      </div>
    </div>
  );
}

export function OrganizationListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-1">
      {Array.from({ length: count }, (_, i) => (
        <OrganizationCardSkeleton key={i} />
      ))}
    </div>
  );
}
