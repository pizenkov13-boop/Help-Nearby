"use client";

import { useState } from "react";
import { Building2, CheckCircle2, Loader2 } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/categories";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<Category, string> = {
  food: "Food",
  shelter: "Shelter",
  medical: "Medical",
  clothing: "Clothing",
  volunteer: "Volunteer",
};

const inputClass =
  "w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2.5 text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-300";

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
      setError("Please fill in name, country, city, and address.");
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
        setError(data.error ?? "Submission failed. Please try again.");
        return;
      }

      setSubmitted(true);
      setForm(initialForm);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dark">
      <SiteLayout>
        <PageHero
          title="Submit an Organization"
          subtitle="Add a local assistance organization to Help Nearby. Submissions are reviewed before appearing as verified."
        />

        <section className="bg-gray-950 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-xl sm:p-8">
              <div className="mb-6 flex items-center gap-2 text-emerald-400">
                <Building2 className="h-5 w-5" />
                <span className="font-medium text-white">Organization details</span>
              </div>

              {submitted ? (
                <div
                  className="flex flex-col items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-8 text-center"
                  role="status"
                >
                  <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                  <p className="text-lg font-semibold text-emerald-300">
                    Thank you! Your organization has been submitted.
                  </p>
                  <p className="max-w-md text-sm text-gray-400">
                    Our team will review it shortly. Once approved, it will appear on the map
                    with a verified badge.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 border-gray-600 bg-transparent text-gray-200 hover:bg-gray-800"
                    onClick={() => setSubmitted(false)}
                  >
                    Submit another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
                      {error}
                    </p>
                  )}

                  <div>
                    <label htmlFor="org-name" className={labelClass}>
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="org-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      className={inputClass}
                      placeholder="Midtown Community Kitchen"
                    />
                  </div>

                  <div>
                    <label htmlFor="org-category" className={labelClass}>
                      Category <span className="text-red-400">*</span>
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
                          {CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="org-country" className={labelClass}>
                        Country <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="org-country"
                        type="text"
                        required
                        value={form.country}
                        onChange={(e) => update("country", e.target.value)}
                        className={inputClass}
                        placeholder="United States"
                      />
                    </div>
                    <div>
                      <label htmlFor="org-city" className={labelClass}>
                        City <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="org-city"
                        type="text"
                        required
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                        className={inputClass}
                        placeholder="New York"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="org-address" className={labelClass}>
                      Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="org-address"
                      type="text"
                      required
                      value={form.address}
                      onChange={(e) => update("address", e.target.value)}
                      className={inputClass}
                      placeholder="450 W 42nd St, New York, NY 10036"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="org-phone" className={labelClass}>
                        Phone
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
                        Email
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
                      Website
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
                      Hours
                    </label>
                    <textarea
                      id="org-hours"
                      rows={3}
                      value={form.hours}
                      onChange={(e) => update("hours", e.target.value)}
                      className={inputClass}
                      placeholder='MonвЂ“Fri 9:00вЂ“17:00, or JSON: {"monday":{"open":"09:00","close":"17:00"}}'
                    />
                  </div>

                  <div>
                    <label htmlFor="org-description" className={labelClass}>
                      Description
                    </label>
                    <textarea
                      id="org-description"
                      rows={4}
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                      className={inputClass}
                      placeholder="What services does this organization provide?"
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
                        SubmittingвЂ¦
                      </>
                    ) : (
                      "Submit Organization"
                    )}
                  </Button>

                  <p className="text-center text-xs text-gray-500">
                    Submissions are saved as unverified and reviewed by our team.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </SiteLayout>
    </div>
  );
}

