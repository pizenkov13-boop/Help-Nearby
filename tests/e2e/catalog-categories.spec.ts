import { test, expect } from "@playwright/test";
import { catalogCategories } from "@/lib/catalogCategories";

test("regional aid offices are not presented as medical treatment locations without specific evidence", () => {
  for (const slug of ["srcs-central-darfur-sudan", "rck-aktobe-kazakhstan", "erc-dubai-uae", "rcb-gomel-belarus"]) {
    expect(catalogCategories(slug, ["volunteer", "medical"])).toEqual(["volunteer"]);
  }
  expect(catalogCategories("charity-hospital-spb", ["medical"])).toEqual(["medical"]);
});

test("catalog services known to offer food and clothing are included in both categories", () => {
  for (const slug of ["marshrut-nadezhdy-bus-spb", "diakonia-bus-spb"]) {
    expect(catalogCategories(slug, ["food"])).toEqual(["food", "clothing"]);
  }
});
