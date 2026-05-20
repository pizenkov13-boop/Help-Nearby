export type Category =
  | "food"
  | "shelter"
  | "medical"
  | "clothing"
  | "volunteer";

export type LanguageCode = "en" | "ru" | "es" | "fr" | "de" | "zh" | "ar";

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface DaySchedule {
  open: string;
  close: string;
}

export type WeeklyHours = Partial<Record<Weekday, DaySchedule | null>>;

export interface Organization {
  id: string;
  slug: string;
  name: string;
  category: Category;
  categories: Category[];
  country: string;
  lat: number;
  lng: number;
  distance: string;
  rating: number;
  address: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  hours: WeeklyHours;
  openNow: boolean;
  verified: boolean;
}

export interface FilterState {
  country: string;
  category: Category | "all";
  openNow: boolean;
}

export interface UserLocation {
  lat: number;
  lng: number;
}
