interface WaveDividerProps {
  /** Tailwind text-* class for fill color of the wave (matches next section bg) */
  className?: string;
}

export function WaveDivider({ className = "text-surface" }: WaveDividerProps) {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 leading-[0]">
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className={`h-14 w-full sm:h-20 ${className}`}
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0,64L48,69.3C96,75,192,85,288,90.7C384,96,480,96,576,90.7C672,85,768,75,864,69.3C960,64,1056,64,1152,69.3C1248,75,1344,85,1392,90.7L1440,96L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
        />
      </svg>
    </div>
  );
}
