import { CITIES_IN_NEED, type CityUrgency } from "@/lib/homeContent";
import { cn } from "@/lib/utils";

function badgeClass(urgency: CityUrgency) {
  if (urgency === "CRISIS") return "badge badge-crisis";
  if (urgency === "HIGH NEED") return "badge badge-high";
  return "badge badge-vulnerable";
}

function badgeLabel(urgency: CityUrgency) {
  if (urgency === "CRISIS") return "Crisis";
  if (urgency === "HIGH NEED") return "High Need";
  return "Vulnerable";
}

export function CitiesSection() {
  return (
    <section className="cities page-section scroll-anchor" id="cities-in-need">
      <div className="container">
        <div className="hiw-head">
          <h2 className="section-title">Cities in Need</h2>
          <span className="underline" />
        </div>
        <p className="section-sub">
          Communities facing urgent humanitarian crises need help the most.
        </p>

        <div className="cities-grid">
          {CITIES_IN_NEED.map((city) => (
            <article key={city.city} className="city-card">
              <div className="city-head">
                <div>
                  <h3>
                    {city.city}
                    {city.country ? ` ${city.country}` : ""}
                  </h3>
                </div>
                <span className={cn(badgeClass(city.urgency))}>
                  {badgeLabel(city.urgency)}
                </span>
              </div>
              <div className="city-body">
                <p>
                  <strong>Issue:</strong> {city.issue}
                </p>
                <p>
                  <strong>Problem:</strong> {city.problem}
                </p>
                <p className="city-source">
                  <strong>Source:</strong> {city.source}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
