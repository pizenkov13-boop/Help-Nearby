interface PageHeroProps {
  title: string;
  subtitle?: string;
}

export function PageHero({ title, subtitle }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gray-900 px-4 py-14 sm:px-6 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero" />
      <div className="pointer-events-none absolute -left-32 top-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          <span className="text-gradient-hero">{title}</span>
        </h1>
        {subtitle && (
          <p className="mt-4 text-lg text-gray-400 sm:text-xl">{subtitle}</p>
        )}
      </div>
    </section>
  );
}