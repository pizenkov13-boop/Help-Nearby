"use client";

import { useState } from "react";
import { Building2, CheckCircle2, Loader2 } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { FormsGate } from "@/components/FormsGate";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL_KEYS = {
  food: "categoryFood",
  shelter: "categoryShelter",
  medical: "categoryMedical",
  clothing: "categoryClothing",
  volunteer: "categoryVolunteer",
} as const satisfies Record<Category, TranslationKey>;

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-600 dark:text-gray-300";

interface FormState {
  name: string;
  category: Category;
  country: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  hours: string;
  description: string;
}

const initialForm: FormState = {
  name: "",
  category: "food",
  country: "",
  city: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  hours: "",
  description: "",
};

export function SubmitPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.country.trim() || !form.city.trim() || !form.address.trim()) {
      setError(t("submitErrorRequired"));
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(t("submitErrorFailed"));
        return;
      }

      setSubmitted(true);
      setForm(initialForm);
    } catch {
      setError(t("submitErrorNetwork"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
        <PageHero
          title={t("submitPageTitle")}
          subtitle={t("submitPageSubtitle")}
        />

        <section className="bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900/80 sm:p-8">
              <div className="mb-6 flex items-center gap-2 text-teal-600 dark:text-emerald-400">
                <Building2 className="h-5 w-5" />
                <span className="font-medium text-slate-900 dark:text-white">{t("submitDetailsHeading")}</span>
              </div>

              {submitted ? (
                <div
                  className="flex flex-col items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-8 text-center"
                  role="status"
                >
                  <CheckCircle2 className="h-12 w-12 text-teal-600 dark:text-emerald-400" />
                  <p className="text-lg font-semibold text-teal-800 dark:text-emerald-300">
                    {t("submitThanks")}
                  </p>
                  <p className="max-w-md text-sm text-slate-600 dark:text-gray-400">
                    {t("submitThanksText")}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                    onClick={() => setSubmitted(false)}
                  >
                    {t("submitAnother")}
                  </Button>
                </div>
              ) : (
                <FormsGate>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
                      {error}
                    </p>
                  )}

                  <div>
                    <label htmlFor="org-name" className={labelClass}>
                      {t("submitLabelName")} <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="org-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      className={inputClass}
                      placeholder={t("submitPhName")}
                    />
                  </div>

                  <div>
                    <label htmlFor="org-category" className={labelClass}>
                      {t("submitLabelCategory")} <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="org-category"
                      required
                      value={form.category}
                      onChange={(e) => update("category", e.target.value)}
                      className={cn(inputClass, "cursor-pointer")}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {t(CATEGORY_LABEL_KEYS[cat])}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="org-country" className={labelClass}>
                        {t("submitLabelCountry")} <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="org-country"
                        type="text"
                        required
                        value={form.country}
                        onChange={(e) => update("country", e.target.value)}
                        className={inputClass}
                        placeholder={t("submitPhCountry")}
                      />
                    </div>
                    <div>
                      <label htmlFor="org-city" className={labelClass}>
                        {t("submitLabelCity")} <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="org-city"
                        type="text"
                        required
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                        className={inputClass}
                        placeholder={t("submitPhCity")}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="org-address" className={labelClass}>
                      {t("submitLabelAddress")} <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="org-address"
                      type="text"
                      required
                      value={form.address}
                      onChange={(e) => update("address", e.target.value)}
                      className={inputClass}
                      placeholder={t("submitPhAddress")}
                    />
                  </div>

                  <p className="text-xs leading-snug text-slate-600 dark:text-gray-400" data-testid="work-contacts-hint">
                    {t("submitWorkContactsHint")}
                  </p>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="org-phone" className={labelClass}>
                        {t("submitLabelPhone")}
                      </label>
                      <input
                        id="org-phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        className={inputClass}
                        placeholder="+1 (212) 555-0142"
                      />
                    </div>
                    <div>
                      <label htmlFor="org-email" className={labelClass}>
                        {t("submitLabelEmail")}
                      </label>
                      <input
                        id="org-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        className={inputClass}
                        placeholder="help@example.org"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="org-website" className={labelClass}>
                      {t("submitLabelWebsite")}
                    </label>
                    <input
                      id="org-website"
                      type="url"
                      value={form.website}
                      onChange={(e) => update("website", e.target.value)}
                      className={inputClass}
                      placeholder="https://example.org"
                    />
                  </div>

                  <div>
                    <label htmlFor="org-hours" className={labelClass}>
                      {t("submitLabelHours")}
                    </label>
                    <textarea
                      id="org-hours"
                      rows={3}
                      value={form.hours}
                      onChange={(e) => update("hours", e.target.value)}
                      className={inputClass}
                      placeholder={t("submitPhHours")}
                    />
                  </div>

                  <div>
                    <label htmlFor="org-description" className={labelClass}>
                      {t("submitLabelDescription")}
                    </label>
                    <p
                      className="mb-1 text-xs leading-snug text-slate-600 dark:text-gray-400"
                      data-testid="personal-data-warning"
                    >
                      {t("formNoPersonalData")}
                    </p>
                    <textarea
                      id="org-description"
                      rows={4}
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                      className={inputClass}
                      placeholder={t("submitPhDescription")}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 py-6 text-base font-semibold text-white hover:from-blue-500 hover:to-emerald-500"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("submitSubmitting")}
                      </>
                    ) : (
                      t("submitButton")
                    )}
                  </Button>

                  <p className="text-center text-sm text-gray-500">
                    {t("submitNote")}
                  </p>
                </form>
                </FormsGate>
              )}
            </div>
          </div>
        </section>
      </SiteLayout>
  );
}

