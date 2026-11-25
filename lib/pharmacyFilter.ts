import type { Organization } from "@/lib/types";

/** Pharmacies are retail places and do not belong in the assistance directory. */
export function isPharmacyOrganization(org: Organization): boolean {
  if (org.osmKind === "pharmacy") return true;
  if (/аптек|\bpharmacy\b|\bpharmacie\b|\bfarmacia\b|\bapotheke\b|药房|صيدلية/iu.test(org.name)) return true;
  return org.id.startsWith("overpass-") && /\bpharmacy\b/i.test(org.description ?? "");
}
