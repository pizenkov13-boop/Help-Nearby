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
