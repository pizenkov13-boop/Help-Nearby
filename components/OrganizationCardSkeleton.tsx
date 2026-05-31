export function OrganizationCardSkeleton() {
  return (
    <div
      className="w-full max-w-full min-w-0 animate-pulse rounded-xl border border-white/10 bg-gray-800/50 p-3 md:p-4"
      aria-hidden
    >
      <div className="mb-3 flex min-w-0 flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="h-5 w-full max-w-[85%] rounded bg-gray-700 md:w-2/3" />
        <div className="h-6 w-16 shrink-0 rounded-full bg-gray-700 md:ml-auto" />
      </div>
      <div className="mb-2 h-3 w-full rounded bg-gray-700/80" />
      <div className="mb-4 h-3 w-4/5 max-w-full rounded bg-gray-700/60" />
      <div className="flex flex-col gap-2 md:flex-row">
        <div className="h-9 min-w-0 flex-1 rounded-lg bg-gray-700" />
        <div className="h-9 min-w-0 flex-1 rounded-lg bg-gray-700/80" />
      </div>
    </div>
  );
}

export function OrganizationListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid w-full min-w-0 max-w-full gap-3 md:gap-4">
      {Array.from({ length: count }, (_, i) => (
        <OrganizationCardSkeleton key={i} />
      ))}
    </div>
  );
}
