import { CITIES_IN_NEED, type CityUrgency } from "@/lib/homeContent";
import { cn } from "@/lib/utils";

function badgeClass(urgency: CityUrgency) {
  if (urgency === "CRISIS") return "badge badge-crisis";
  if (urgency === "HIGH NEED") return "badge badge-high";
  return "badge badge-high";
}

function badgeLabel(urgency: CityUrgency) {
  if (urgency === "CRISIS") return "Crisis";
  if (urgency === "HIGH NEED") return "High Need";
  return urgency;
}

export function CitiesSection() {
  return (
    <section className="cities" id="cities-in-need">
      <div className="container">
        <h2 className="section-title">Cities in Greatest Need</h2>
        <p className="section-sub">
          Communities facing urgent humanitarian crises need help the most.
        </p>

        <div className="cities-grid">
          {CITIES_IN_NEED.map((city) => (
            <article key={city.city} className="city-card">
              <div className="city-head">
                <div>
                  <h3>{city.city}</h3>
                  <div className="country">{city.country}</div>
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
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
