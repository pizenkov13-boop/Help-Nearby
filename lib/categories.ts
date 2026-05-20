import type { Category } from "./types";

export const CATEGORY_CONFIG: Record<
  Category,
  { icon: string; color: string; bg: string; ring: string }
> = {
  food: {
    icon: "🍽️",
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    ring: "ring-amber-500/40",
  },
  shelter: {
    icon: "🏠",
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    ring: "ring-blue-500/40",
  },
  medical: {
    icon: "🏥",
    color: "text-red-400",
    bg: "bg-red-500/20",
    ring: "ring-red-500/40",
  },
  clothing: {
    icon: "👕",
    color: "text-purple-400",
    bg: "bg-purple-500/20",
    ring: "ring-purple-500/40",
  },
  volunteer: {
    icon: "🤝",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    ring: "ring-emerald-500/40",
  },
};

export const CATEGORIES: Category[] = [
  "food",
  "shelter",
  "medical",
  "clothing",
  "volunteer",
];
