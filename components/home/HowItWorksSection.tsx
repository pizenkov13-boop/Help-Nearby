import { HOW_IT_WORKS_STEPS } from "@/lib/homeContent";

export function HowItWorksSection() {
  return (
    <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          How It Works
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
          {HOW_IT_WORKS_STEPS.map((item) => (
            <div key={item.step} className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-xl font-bold text-white shadow-lg shadow-blue-500/25">
                {item.step}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
