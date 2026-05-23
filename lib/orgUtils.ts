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

function hasAnyHoursData(org: Organization): boolean {
  if (org.hoursRaw?.trim()) return true;
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

/**
 * Open Now filter: unknown/missing hours count as open.
 * Only exclude orgs explicitly closed today or outside today's hours.
 */
export function isOrganizationOpen(
  org: Organization,
  date: Date = new Date(),
): boolean {
  if (!hasAnyHoursData(org)) {
    return true;
  }

  const weekday = getWeekday(date);

  if (weekday in org.hours && org.hours[weekday] === null) {
    return false;
  }

  const schedule = org.hours[weekday];
  if (!schedule) {
    return true;
  }

  return isOpenForSchedule(schedule, date);
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

export function formatWeeklyHours(hours: WeeklyHours): string[] {
  return (Object.keys(WEEKDAY_LABELS) as Weekday[]).map((day) => {
    const schedule = hours[day];
    return `${WEEKDAY_LABELS[day]}: ${formatDaySchedule(schedule ?? null)}`;
  });
}

export function getDirectionsUrl(org: Organization): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${org.lat},${org.lng}`;
}

export function getPhoneTelUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
