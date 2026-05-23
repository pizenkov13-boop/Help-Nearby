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
  city: string;
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
  /** Original hours field from database (for 24/7 text detection). */
  hoursRaw: string;
  openNow: boolean;
  verified: boolean;
}

export interface FilterState {
  category: Category | "all";
  openNow: boolean;
  searchQuery: string;
}

export interface Review {
  id: number;
  name: string;
  country: string;
  message: string;
  rating: number;
  approved: boolean;
  created_at: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
}
