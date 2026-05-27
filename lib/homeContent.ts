export type CityUrgency = "CRISIS" | "HIGH NEED" | "VULNERABLE";

export interface CityInNeed {
  city: string;
  country: string;
  urgency: CityUrgency;
  issue: string;
  problem: string;
  source: string;
}

export const CITIES_IN_NEED: CityInNeed[] = [
  {
    city: "Sudan",
    country: "🇸🇩",
    urgency: "CRISIS",
    issue: "Armed conflict since 2023, mass displacement",
    problem:
      "33.7 million people need humanitarian aid — the highest number in the world; 21 million need medical help",
    source: "UN OCHA, Sudan Humanitarian Needs & Response Plan 2026",
  },
  {
    city: "Gaza, Palestine",
    country: "🇵🇸",
    urgency: "CRISIS",
    issue: "Armed conflict, restrictions on humanitarian aid",
    problem:
      "Severe shortages of food and medicine; about half of essential medicines are out of stock",
    source: "UN OCHA / UNRWA Situation Reports, 2026",
  },
  {
    city: "Yemen",
    country: "🇾🇪",
    urgency: "CRISIS",
    issue: "Prolonged conflict and economic collapse",
    problem:
      "22 million people need humanitarian aid; 18.3 million face acute hunger",
    source: "UN OCHA, Yemen Humanitarian Needs & Response Plan 2026",
  },
  {
    city: "Armenia",
    country: "🇦🇲",
    urgency: "HIGH NEED",
    issue: "Displacement from Nagorno-Karabakh",
    problem:
      "Over 115,000 refugees arrived in 2023 — one in every 30 people in Armenia; 196,000 people in need of aid",
    source: "UNHCR Armenia, 2026",
  },
  {
    city: "Kyrgyzstan",
    country: "🇰🇬",
    urgency: "VULNERABLE",
    issue: "Poverty and food insecurity",
    problem:
      "Over 41% of people cannot afford an adequate diet; in the Batken region poverty exceeds 40%",
    source: "WFP Kyrgyz Republic Country Brief, 2026",
  },
  {
    city: "Tajikistan",
    country: "🇹🇯",
    urgency: "VULNERABLE",
    issue: "Poverty and food insecurity",
    problem:
      "In rural areas about two-thirds of people live in poverty; malnutrition is widespread",
    source: "WFP Tajikistan, 2026",
  },
];
