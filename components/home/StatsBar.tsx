import { HOME_STATS } from "@/lib/homeContent";

export function StatsBar() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-emerald-600 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
        {HOME_STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-4xl font-extrabold text-white sm:text-5xl">
              {stat.value}
            </p>
            <p className="mt-2 text-sm font-medium text-blue-100 sm:text-base">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
