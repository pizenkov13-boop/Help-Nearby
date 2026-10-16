"use client";

import { Clock, Globe, Mail, MapPin, Phone } from "lucide-react";
import { trackPhoneClicked, trackWebsiteClicked } from "@/lib/analytics.client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getHoursDisplay, getPhoneTelUrl } from "@/lib/orgUtils";
import { getOrganizationSource } from "@/lib/organizationSource";
import type { Organization } from "@/lib/types";

function displayHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}

/** "Contact & hours": only rows that have a value; never invents opening hours. */
export function OrganizationContactSection({ org }: { org: Organization }) {
  const { t } = useLanguage();
  const hours = getHoursDisplay(org);
  const phone = org.phone?.trim();
  const email = org.email?.trim();
  const address = org.address?.trim();
  const website = org.website?.trim();

  // When hours are unknown, point to where they can be checked: the organization's site or the data source.
  const sourceUrl = website || getOrganizationSource(org)?.url;

  return (
    <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800/40">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        {t("contactDetails")}
      </h2>
      <ul className="space-y-4 text-sm">
        {address && (
          <li className="flex gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" aria-hidden />
            <span className="text-gray-600 dark:text-gray-300">{address}</span>
          </li>
        )}
        {phone && (
          <li className="flex gap-3">
            <Phone className="h-5 w-5 shrink-0 text-gray-500" aria-hidden />
            <a
              href={getPhoneTelUrl(phone)}
              onClick={() => trackPhoneClicked(org)}
              className="text-gray-600 hover:text-emerald-400 dark:text-gray-300"
            >
              {phone}
            </a>
          </li>
        )}
        {email && (
          <li className="flex gap-3">
            <Mail className="h-5 w-5 shrink-0 text-gray-500" aria-hidden />
            <a
              href={`mailto:${email}`}
              className="break-all text-gray-600 hover:text-blue-400 dark:text-gray-300"
            >
              {email}
            </a>
          </li>
        )}
        {website && (
          <li className="flex gap-3">
            <Globe className="h-5 w-5 shrink-0 text-gray-500" aria-hidden />
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWebsiteClicked(org)}
              className="inline-flex min-h-11 items-center break-all text-blue-500 hover:text-blue-400 dark:text-blue-400"
            >
              {website.replace(/^https?:\/\//, "")}
            </a>
          </li>
        )}
        <li className="flex gap-3" data-testid="org-hours">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" aria-hidden />
          {hours.kind === "listed" ? (
            <ul className="space-y-1 text-gray-600 dark:text-gray-300">
              {hours.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">
              {t("hoursNotListed")}
              {sourceUrl && !website && (
                <>
                  {" "}
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center break-all text-blue-500 hover:text-blue-400 dark:text-blue-400"
                  >
                    {displayHost(sourceUrl)}
                  </a>
                </>
              )}
            </p>
          )}
        </li>
      </ul>
    </section>
  );
}
