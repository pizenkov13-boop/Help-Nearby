/** OSM weekday index: 0 = Sunday (matches Date.getDay()). */
const OSM_DAY_ORDER = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

type OsmDay = (typeof OSM_DAY_ORDER)[number];

const OSM_DAY_INDEX: Record<OsmDay, number> = {
  Su: 0,
  Mo: 1,
  Tu: 2,
  We: 3,
  Th: 4,
  Fr: 5,
  Sa: 6,
};

export type OpenStatus = "open" | "closed" | "unknown";

interface TimeInterval {
  open: number;
  close: number;
}

interface ParsedRule {
  days: number[];
  intervals: TimeInterval[];
  isOff: boolean;
}

function cleanOsmString(raw: string): string {
  return raw
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+(emergency|amenity):[^\s;]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTimeToMinutes(time: string): number | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})(?:\+(\d+))?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function parseInterval(token: string): TimeInterval | null {
  const match = token.trim().match(/^(\d{1,2}:\d{2}(?:\+\d+)?)-(\d{1,2}:\d{2}(?:\+\d+)?)$/);
  if (!match) return null;
  const open = parseTimeToMinutes(match[1]!);
  const close = parseTimeToMinutes(match[2]!);
  if (open == null || close == null) return null;
  return { open, close };
}

function expandDayToken(token: string): number[] {
  if (token.includes("-")) {
    const [start, end] = token.split("-") as [OsmDay, OsmDay];
    const startIdx = OSM_DAY_INDEX[start];
    const endIdx = OSM_DAY_INDEX[end];
    if (startIdx == null || endIdx == null) return [];

    const days: number[] = [];
    if (startIdx <= endIdx) {
      for (let i = startIdx; i <= endIdx; i++) days.push(i);
    } else {
      for (let i = startIdx; i < 7; i++) days.push(i);
      for (let i = 0; i <= endIdx; i++) days.push(i);
    }
    return days;
  }

  const idx = OSM_DAY_INDEX[token as OsmDay];
  return idx == null ? [] : [idx];
}

function expandDaySpec(spec: string): number[] {
  const days = new Set<number>();
  for (const token of spec.split(",")) {
    for (const day of expandDayToken(token.trim())) {
      days.add(day);
    }
  }
  return [...days];
}

function parseRule(rule: string): ParsedRule | null {
  const trimmed = rule.trim();
  if (!trimmed) return null;

  const dayMatch = trimmed.match(
    /^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su)|,(?:Mo|Tu|We|Th|Fr|Sa|Su))*))\s+(.+)$/i,
  );

  let days: number[] = [];
  let remainder = trimmed;

  if (dayMatch) {
    days = expandDaySpec(dayMatch[1]!);
    remainder = dayMatch[2]!.trim();
  }

  if (/^(off|closed)$/i.test(remainder)) {
    if (days.length === 0) return null;
    return { days, intervals: [], isOff: true };
  }

  const intervals: TimeInterval[] = [];
  for (const token of remainder.split(",")) {
    const interval = parseInterval(token);
    if (interval) intervals.push(interval);
  }

  if (intervals.length === 0) return null;
  if (days.length === 0) {
    days = [0, 1, 2, 3, 4, 5, 6];
  }

  return { days, intervals, isOff: false };
}

function isTimeInInterval(nowMinutes: number, interval: TimeInterval): boolean {
  const { open, close } = interval;
  if (close > open) {
    return nowMinutes >= open && nowMinutes < close;
  }
  if (close < open) {
    return nowMinutes >= open || nowMinutes < close;
  }
  return false;
}

/** Parse OSM `opening_hours` tag value against a local date/time. */
export function parseOsmOpeningHours(
  raw: string,
  date: Date = new Date(),
): OpenStatus {
  const cleaned = cleanOsmString(raw);
  if (!cleaned) return "unknown";

  if (/24\s*\/\s*7/i.test(cleaned)) return "open";
  if (/^closed$/i.test(cleaned)) return "closed";

  const rulesText = cleaned.split(";").map((part) => part.trim()).filter(Boolean);
  if (rulesText.length === 0) return "unknown";

  const rules: ParsedRule[] = [];
  for (const text of rulesText) {
    const parsed = parseRule(text);
    if (parsed) rules.push(parsed);
  }
  if (rules.length === 0) return "unknown";

  const today = date.getDay();
  const nowMinutes = date.getHours() * 60 + date.getMinutes();

  let hasRuleForToday = false;
  let openNow = false;

  for (const rule of rules) {
    if (!rule.days.includes(today)) continue;
    hasRuleForToday = true;

    if (rule.isOff) {
      continue;
    }

    for (const interval of rule.intervals) {
      if (isTimeInInterval(nowMinutes, interval)) {
        openNow = true;
      }
    }
  }

  if (openNow) return "open";
  if (hasRuleForToday) return "closed";
  return "closed";
}

export function extractOsmOpeningHours(hoursRaw: string): string | null {
  const cleaned = cleanOsmString(hoursRaw);
  return cleaned || null;
}

// ---------------------------------------------------------------------------
// Russian weekday schedules of catalog entries, e.g. "Пн–Пт 19:00–19:30; Вс 9:30–11:00".
// Only strings that are entirely "days + time range" segments are understood. Anything else
// (extra words, a single time, no days, seasons, several services) returns null and stays raw text.
// ---------------------------------------------------------------------------

export interface RussianScheduleRule {
  /** Date.getDay() numbers: 0 = Sunday. */
  days: number[];
  /** Minutes from midnight; close <= open means the window crosses midnight. */
  open: number;
  close: number;
}

const RU_DAY_NUMBER: Record<string, number> = { пн: 1, вт: 2, ср: 3, чт: 4, пт: 5, сб: 6, вс: 0 };
/** Monday-first, so "Сб–Пн" walks Sat, Sun, Mon. */
const RU_WEEK = [1, 2, 3, 4, 5, 6, 0];
const RU_DAY = "(?:пн|вт|ср|чт|пт|сб|вс)";
const RU_DASH = "[-–—]";
const RU_DAYS = `(?:ежедневно|${RU_DAY}${RU_DASH}${RU_DAY}|${RU_DAY}(?:\\s*,\\s*${RU_DAY})*)`;
const RU_SEGMENT = new RegExp(
  `^(${RU_DAYS})\\s+(\\d{1,2}):(\\d{2})\\s*${RU_DASH}\\s*(\\d{1,2}):(\\d{2})$`,
  "i",
);

function expandRussianDays(spec: string): number[] | null {
  const s = spec.toLowerCase();
  if (s === "ежедневно") return [...RU_WEEK];

  const range = s.match(new RegExp(`^(${RU_DAY})${RU_DASH}(${RU_DAY})$`));
  if (range) {
    const from = RU_WEEK.indexOf(RU_DAY_NUMBER[range[1]!]!);
    const to = RU_WEEK.indexOf(RU_DAY_NUMBER[range[2]!]!);
    const days: number[] = [];
    for (let i = from; ; i = (i + 1) % 7) {
      days.push(RU_WEEK[i]!);
      if (i === to) break;
    }
    return days;
  }

  const days = s.split(/\s*,\s*/).map((d) => RU_DAY_NUMBER[d]);
  return days.every((d) => d !== undefined) ? (days as number[]) : null;
}

function validMinutes(hours: string, minutes: string): number | null {
  const h = Number(hours);
  const m = Number(minutes);
  return h <= 23 && m <= 59 ? h * 60 + m : null;
}

/** Fully understood schedule, or null when any part of the text is not "days + time range". */
export function parseRussianSchedule(text: string | null | undefined): RussianScheduleRule[] | null {
  const raw = text?.trim();
  if (!raw) return null;

  const rules: RussianScheduleRule[] = [];
  for (const part of raw.split(";")) {
    const match = part.trim().match(RU_SEGMENT);
    if (!match) return null;
    const days = expandRussianDays(match[1]!);
    const open = validMinutes(match[2]!, match[3]!);
    const close = validMinutes(match[4]!, match[5]!);
    if (!days || open === null || close === null || open === close) return null;
    rules.push({ days, open, close });
  }
  return rules.length > 0 ? rules : null;
}

/**
 * "open" inside a listed window (a window that crosses midnight also covers the morning after),
 * otherwise "unknown": a catalog schedule is a statement of when help is given, never proof that
 * the place is closed, so this never returns "closed".
 */
export function evaluateRussianSchedule(
  rules: RussianScheduleRule[],
  date: Date = new Date(),
): OpenStatus {
  const day = date.getDay();
  const previousDay = (day + 6) % 7;
  const minutes = date.getHours() * 60 + date.getMinutes();

  const open = rules.some((rule) =>
    rule.close > rule.open
      ? rule.days.includes(day) && minutes >= rule.open && minutes < rule.close
      : (rule.days.includes(day) && minutes >= rule.open) ||
        (rule.days.includes(previousDay) && minutes < rule.close),
  );
  return open ? "open" : "unknown";
}
