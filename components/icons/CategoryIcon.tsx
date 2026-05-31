import {
  HandHeart,
  HeartPulse,
  Home,
  Shirt,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  food: UtensilsCrossed,
  shelter: Home,
  medical: HeartPulse,
  clothing: Shirt,
  volunteer: HandHeart,
};

interface CategoryIconProps {
  category: Category;
  className?: string;
}

export function CategoryIcon({ category, className }: CategoryIconProps) {
  const Icon = CATEGORY_ICONS[category];
  return (
    <Icon
      className={cn("h-3.5 w-3.5 shrink-0", className)}
      strokeWidth={2}
      aria-hidden
    />
  );
}
