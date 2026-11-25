import { test, expect } from "@playwright/test";
import { getOrganizationSource } from "@/lib/organizationSource";

const base = { id: "123", slug: "", website: "", description: "", country: "Russia", verified: true };

test("Nochlezhka catalog records link to the source guide even when another organization operates the location", () => {
  const source = getOrganizationSource({ ...base, slug: "marshrut-nadezhdy-bus-spb" });
  expect(source?.url).toBe("https://homeless.ru/for-homeless/");
});

test("French Red Cross imports use the documented official branch page", () => {
  const source = getOrganizationSource({ ...base, slug: "crf-ul-de-bar-sur-seine", country: "France", description: "Donnees : Croix-Rouge francaise (croix-rouge.fr/annuaire)", website: "https://www.croix-rouge.fr/unite-locale-de-bar-sur-seine" });
  expect(source?.url).toBe("https://www.croix-rouge.fr/unite-locale-de-bar-sur-seine");
});

test("an unrelated Russian organization does not get an invented source", () => {
  expect(getOrganizationSource({ ...base, slug: "unrelated-place" })).toBeNull();
});


test("known source batches point to the official directories even when the description has a generic domain", () => {
  const cases = [
    ["srcs-central-darfur-sudan", "https://www.srcs.sd/en/our-branches"],
    ["rck-uralsk-kazakhstan", "https://redcrescent.kz/ru/"],
    ["erc-dubai-uae", "https://www.emiratesrc.ae/en/about/contact"],
    ["rcb-gomel-belarus", "https://redcross-gomel.by/"],
    ["rcb-vitebsk-belarus", "https://redcross.by"],
    ["gdho-example", "https://humanitarianoutcomes.org/projects/gdho"],
  ];
  for (const [slug, expected] of cases) {
    expect(getOrganizationSource({ ...base, slug, description: "Source: example.com" })?.url).toBe(expected);
  }
});
