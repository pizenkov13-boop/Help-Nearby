import tzLookup from "@photostructure/tz-lookup";
import { getOrganizationOpenStatus, hasRoundTheClockHours } from "@/lib/orgUtils";
import { parseRussianSchedule } from "@/lib/openingHours";
import { hasValidMapCoordinates } from "@/lib/mapCoordinates";
import type { Organization } from "@/lib/types";

/** Only evaluate schedules fully covered by our parser; leave complex rules unknown. */
function isSimpleOsmSchedule(raw: string): boolean {
  const day = "(?:Mo|Tu|We|Th|Fr|Sa|Su)";
  const daySpec = `${day}(?:-${day})?(?:,${day}(?:-${day})?)*`;
  const rule = new RegExp(`^(?:${daySpec}\\s+)?(\\d{1,2}:\\d{2}-\\d{1,2}:\\d{2}(?:,\\s*\\d{1,2}:\\d{2}-\\d{1,2}:\\d{2})*)$`);
  return raw.split(";").every((part) => {
    const match = part.trim().match(rule);
    if (!match) return false;
    return match[1].split(",").every((interval) => {
      const [start, end] = interval.trim().split("-");
      const parse = (value: string) => {
        const [h, m] = value.split(":").map(Number);
        return h <= 24 && m < 60 && (h !== 24 || m === 0) ? h * 60 + m : NaN;
      };
      return parse(start) < parse(end);
    });
  });
}

/** Evaluate the instant in the location's time zone, not in the visitor's time zone. */
export function isConfidentlyOpen(org: Organization, now = new Date()): boolean {
  if (hasRoundTheClockHours(org)) return true;
  if (!hasValidMapCoordinates(org)) return false;
  const raw = org.hoursRaw?.trim() ?? "";
  const structured = Object.values(org.hours);
  if (structured.length > 0) {
    const safeTime = /^([01]?\\d|2[0-3]):[0-5]\\d$/;
    if (!structured.every((entry) => entry === null || (entry && safeTime.test(entry.open) && safeTime.test(entry.close) && entry.open < entry.close))) return false;
  } else if (!parseRussianSchedule(raw) && !isSimpleOsmSchedule(raw)) {
    return false;
  }
  try {
    const zone = tzLookup(org.lat, org.lng);
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
    const get = (key: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === key)?.value;
    const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday") ?? "");
    const hour = Number(get("hour"));
    const minute = Number(get("minute"));
    if (weekday < 0 || !Number.isFinite(hour) || !Number.isFinite(minute)) return false;
    const localWallTime = new Date(2023, 0, 1 + weekday, hour, minute);
    return getOrganizationOpenStatus(org, localWallTime) === "open";
  } catch {
    return false;
  }
}
