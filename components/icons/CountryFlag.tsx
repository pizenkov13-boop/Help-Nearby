import { Globe } from "lucide-react";
import { resolveCountryCode } from "@/lib/countryFlags";
import { cn } from "@/lib/utils";

interface CountryFlagProps {
  country: string;
  className?: string;
}

export function CountryFlag({ country, className }: CountryFlagProps) {
  const code = resolveCountryCode(country);

  if (!code) {
    return (
      <Globe
        className={cn("h-4 w-4 shrink-0 text-slate-400", className)}
        strokeWidth={2}
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
      width={20}
      height={15}
      alt=""
      className={cn(
        "h-4 w-5 shrink-0 rounded-sm object-cover ring-1 ring-white/10",
        className,
      )}
      loading="lazy"
    />
  );
}
