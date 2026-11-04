import { test, expect } from "./fixtures";
import { reliefWebSkipCountries, skipsReliefWeb } from "../../lib/sourceRules";

/** The skip list comes only from RELIEFWEB_SKIP_COUNTRIES (empty by default); ZZ is a fictitious code. */
test.describe("ReliefWeb skip list", () => {
  const saved = process.env.RELIEFWEB_SKIP_COUNTRIES;

  test.afterEach(() => {
    if (saved === undefined) delete process.env.RELIEFWEB_SKIP_COUNTRIES;
    else process.env.RELIEFWEB_SKIP_COUNTRIES = saved;
  });

  test("empty by default: nothing is skipped", () => {
    delete process.env.RELIEFWEB_SKIP_COUNTRIES;
    expect(reliefWebSkipCountries().size).toBe(0);
    expect(skipsReliefWeb("Anywhere", "ZZ")).toBe(false);
  });

  test("codes are read at call time, trimmed, upper-cased and validated", () => {
    process.env.RELIEFWEB_SKIP_COUNTRIES = " zz, yy ,TOOLONG,,1";
    expect([...reliefWebSkipCountries()].sort()).toEqual(["YY", "ZZ"]);
    expect(skipsReliefWeb("Anywhere", "zz")).toBe(true);
    expect(skipsReliefWeb("Anywhere", "YY")).toBe(true);
    expect(skipsReliefWeb("Anywhere", "XX")).toBe(false);
    expect(skipsReliefWeb("Anywhere")).toBe(false);

    process.env.RELIEFWEB_SKIP_COUNTRIES = "";
    expect(skipsReliefWeb("Anywhere", "ZZ")).toBe(false);
  });
});
