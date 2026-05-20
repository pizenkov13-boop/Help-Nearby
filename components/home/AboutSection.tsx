export function AboutSection() {
  return (
    <section
      id="about-help-nearby"
      className="border-t border-gray-200 bg-gray-50 px-4 py-16 transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          About Help Nearby
        </h2>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          A community-driven platform connecting people with local assistance
          organizations worldwide.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-3xl">
        <h3 className="text-gradient-hero mb-4 text-center text-xl font-semibold">
          Our Mission
        </h3>
        <div className="space-y-4 text-center leading-relaxed text-gray-600 dark:text-gray-400">
          <p>
            Help Nearby exists to make essential services visible and reachable
            for anyone facing hardship. We map food banks, shelters, medical
            clinics, clothing donations, and volunteer networks so that help is
            never more than a few clicks away — free of charge and open to all.
          </p>
          <p>
            By partnering with local organizations and volunteers, we build a
            living directory of free services updated for real community needs.
            Whether you are seeking support for yourself or helping someone you
            care about, our goal is simple: connect people to the help they
            need, quickly, safely, and with dignity.
          </p>
        </div>
      </div>
    </section>
  );
}
