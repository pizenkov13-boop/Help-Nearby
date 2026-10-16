import {
  extractOsmOpeningHours,
  parseOsmOpeningHours,
  type OpenStatus,
} from "@/lib/openingHours";
import { getOrganizationCoordinates } from "@/lib/organizationCoordinates";
import type { DaySchedule, Organization, Weekday, WeeklyHours } from "@/lib/types";

const WEEKDAYS: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getWeekday(date: Date): Weekday {
  return WEEKDAYS[date.getDay()];
}

function hasStructuredHours(org: Organization): boolean {
  return Object.values(org.hours).some((schedule) => schedule !== undefined);
}

function isOpenForSchedule(schedule: DaySchedule, date: Date): boolean {
  const nowMinutes = date.getHours() * 60 + date.getMinutes();
  const openMinutes = parseTimeToMinutes(schedule.open);
  const closeMinutes = parseTimeToMinutes(schedule.close);

  if (closeMinutes > openMinutes) {
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  }

  return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
}

function evaluateStructuredHours(
  org: Organization,
  date: Date,
): OpenStatus {
  const weekday = getWeekday(date);

  if (weekday in org.hours && org.hours[weekday] === null) {
    return "closed";
  }

  const schedule = org.hours[weekday];
  // Today is simply not in the data (not explicitly null): unknown, never "closed".
  if (!schedule) return "unknown";

  return isOpenForSchedule(schedule, date) ? "open" : "closed";
}

/** Whether opening hours are known well enough to show open/closed status. */
export function hasKnownOpenStatus(org: Organization): boolean {
  return getOrganizationOpenStatus(org) !== "unknown";
}

/**
 * Returns open/closed/unknown for an organization.
 * Unknown = no hours data (OSM orgs without opening_hours tag).
 */
export function getOrganizationOpenStatus(
  org: Organization,
  date: Date = new Date(),
): OpenStatus {
  if (hasStructuredHours(org)) {
    return evaluateStructuredHours(org, date);
  }

  const osmHours = extractOsmOpeningHours(org.hoursRaw);
  if (!osmHours) return "unknown";

  return parseOsmOpeningHours(osmHours, date);
}

/**
 * Open Now filter: unknown hours stay visible; only definitively closed orgs are hidden.
 */
export function isOrganizationOpen(
  org: Organization,
  date: Date = new Date(),
): boolean {
  const status = getOrganizationOpenStatus(org, date);
  return status !== "closed";
}

export function formatTime12h(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  let hour = Number(hourStr);
  const minutes = minuteStr ?? "00";
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minutes} ${period}`;
}

export function formatDaySchedule(schedule: DaySchedule | null | undefined): string {
  if (!schedule) {
    return "Closed";
  }
  return `${formatTime12h(schedule.open)} – ${formatTime12h(schedule.close)}`;
}

/**
 * One line per day that is present in the data. A day that is simply absent is not listed
 * (it is unknown, not closed); "Closed" appears only when the day is explicitly null.
 */
export function formatWeeklyHours(hours: WeeklyHours): string[] {
  return (Object.keys(WEEKDAY_LABELS) as Weekday[])
    .filter((day) => hours[day] !== undefined)
    .map((day) => `${WEEKDAY_LABELS[day]}: ${formatDaySchedule(hours[day] ?? null)}`);
}

export type HoursDisplay =
  | { kind: "listed"; lines: string[] }
  | { kind: "unknown" };

/**
 * What the organization page may show for opening hours:
 * structured per-day hours, or the raw text when it can be parsed; otherwise "unknown".
 */
export function getHoursDisplay(org: Organization): HoursDisplay {
  if (hasStructuredHours(org)) {
    const lines = formatWeeklyHours(org.hours);
    if (lines.length > 0) return { kind: "listed", lines };
  }
  const raw = org.hoursRaw?.trim();
  if (raw && getOrganizationOpenStatus(org) !== "unknown") {
    return { kind: "listed", lines: [raw] };
  }
  return { kind: "unknown" };
}

export function getDirectionsUrl(org: Organization): string {
  const { lat, lng } = getOrganizationCoordinates(org);
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function getPhoneTelUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
