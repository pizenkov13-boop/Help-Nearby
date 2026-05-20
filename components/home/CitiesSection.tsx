import { CITIES_IN_NEED, type CityUrgency } from "@/lib/homeContent";
import { cn } from "@/lib/utils";

const urgencyStyles: Record<
  CityUrgency,
  { badge: string; border: string }
> = {
  CRISIS: {
    badge: "bg-red-500/20 text-red-400 border-red-500/40",
    border: "hover:border-red-500/30",
  },
  "HIGH NEED": {
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    border: "hover:border-orange-500/30",
  },
  "MEDIUM NEED": {
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    border: "hover:border-amber-500/30",
  },
};

export function CitiesSection() {
  return (
    <section className="border-t border-gray-200 bg-gray-100/50 px-4 py-16 transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900/50 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Cities in Greatest Need
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CITIES_IN_NEED.map((city) => {
            const styles = urgencyStyles[city.urgency];
            return (
              <article
                key={city.city}
                className={cn(
                  "rounded-xl border border-gray-200 bg-white p-5 transition-colors dark:border-gray-800 dark:bg-gray-800/50",
                  styles.border,
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {city.city}
                    </h3>
                    <p className="text-sm text-gray-500">{city.country}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
                      styles.badge,
                    )}
                  >
                    {city.urgency}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">
                    <span className="font-medium text-gray-200">Issue: </span>
                    {city.issue}
                  </p>
                  <p className="text-gray-400">
                    <span className="font-medium text-gray-300">Problem: </span>
                    {city.problem}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
