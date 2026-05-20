export type CityUrgency = "CRISIS" | "HIGH NEED" | "MEDIUM NEED";

export interface CityInNeed {
  city: string;
  country: string;
  urgency: CityUrgency;
  issue: string;
  problem: string;
}

export const CITIES_IN_NEED: CityInNeed[] = [
  {
    city: "Detroit",
    country: "USA",
    urgency: "CRISIS",
    issue: "Food insecurity & housing instability",
    problem:
      "Thousands lack access to daily meals and emergency shelter, with long waitlists at food banks and warming centers.",
  },
  {
    city: "Vancouver",
    country: "Canada",
    urgency: "HIGH NEED",
    issue: "Homelessness & opioid crisis",
    problem:
      "Rising street homelessness and limited harm-reduction services leave many without shelter or medical support.",
  },
  {
    city: "Marseille",
    country: "France",
    urgency: "MEDIUM NEED",
    issue: "Youth unemployment & migrant support",
    problem:
      "Young adults and newly arrived families struggle to find food aid, language services, and job training programs.",
  },
  {
    city: "Glasgow",
    country: "UK",
    urgency: "HIGH NEED",
    issue: "Fuel poverty & food banks under strain",
    problem:
      "Winter energy costs push families to choose between heating and eating, overwhelming local charity networks.",
  },
  {
    city: "Los Angeles",
    country: "USA",
    urgency: "CRISIS",
    issue: "Unhoused population & mental health gaps",
    problem:
      "One of the largest unhoused populations in the U.S. with critical shortages of beds, clinics, and outreach teams.",
  },
  {
    city: "Toronto",
    country: "Canada",
    urgency: "HIGH NEED",
    issue: "Affordable housing & newcomer services",
    problem:
      "Record rent prices and refugee arrivals strain shelters, settlement agencies, and community food programs.",
  },
];

export const HOME_STATS = [
  { value: "260", label: "Cities Covered" },
  { value: "50", label: "Countries" },
  { value: "304", label: "Organizations" },
] as const;

export const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: "Find Your Location",
    description:
      "Allow location access or browse by city to see assistance available near you on an interactive map.",
  },
  {
    step: 2,
    title: "Browse Organizations",
    description:
      "Filter by category — food, shelter, medical, clothing, and volunteer — to find services that match your needs.",
  },
  {
    step: 3,
    title: "Get Help",
    description:
      "View contact details, hours, and directions. Reach out directly or get guided support through our AI assistant.",
  },
] as const;
