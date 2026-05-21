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
    city: "Khartoum",
    country: "Sudan 🇸🇩",
    urgency: "CRISIS",
    issue: "Armed conflict, displacement",
    problem: "Millions without food and medical access",
  },
  {
    city: "Sanaa",
    country: "Yemen 🇾🇪",
    urgency: "CRISIS",
    issue: "Civil war, famine",
    problem: "Worst humanitarian crisis in the world",
  },
  {
    city: "Kabul",
    country: "Afghanistan 🇦🇫",
    urgency: "CRISIS",
    issue: "Extreme poverty",
    problem: "28 million people need aid",
  },
  {
    city: "Gaza",
    country: "Palestine 🇵🇸",
    urgency: "CRISIS",
    issue: "Armed conflict",
    problem: "Severe shortage of food, water, medical care",
  },
  {
    city: "Kinshasa",
    country: "DRC 🇨🇩",
    urgency: "HIGH NEED",
    issue: "Conflict, extreme poverty",
    problem: "Millions displaced",
  },
  {
    city: "Port-au-Prince",
    country: "Haiti 🇭🇹",
    urgency: "CRISIS",
    issue: "Gang violence",
    problem: "Food insecurity affects millions",
  },
];
