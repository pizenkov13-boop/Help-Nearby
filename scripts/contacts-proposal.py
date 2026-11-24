#!/usr/bin/env python3
"""
Stage 1 (read-only): propose missing phone / opening hours for catalog records from the
organizations' OWN official pages. Nothing is written to the database.

Rules: robots.txt respected, <= 1 request/second per domain, 10 s timeout, official pages only.
A site that times out / answers 403 is reported as "unavailable from this network", never as "no data".
Hours are proposed in the app's storage format: a JSON WeeklyHours string, only days that are stated
(an absent day is "unknown", never "Closed"). Anything ambiguous or not representable is UNCLEAR.

Output (scripts/out/): contacts-proposal.csv, contacts-unchecked.csv, contacts-summary.json
"""
import csv
import gzip
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zlib
from collections import Counter, defaultdict
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "scripts" / "out"
OUT.mkdir(parents=True, exist_ok=True)
UA = "Mozilla/5.0 (compatible; HelpNearbyContactsBot/1.0)"
CRF_HOTLINES = {"0144431300"}  # national Croix-Rouge number shown on every page ("Contactez-nous ... Hotline")

# ------------------------------------------------------------------ network (polite)
_last = {}
_robots = {}


def _wait(host):
    gap = time.time() - _last.get(host, 0)
    if gap < 1.05:
        time.sleep(1.05 - gap)
    _last[host] = time.time()


def _raw_get(url):
    host = urllib.parse.urlparse(url).netloc
    _wait(host)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*", "Accept-Encoding": "gzip, deflate"})
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            raw = res.read()
            enc = (res.headers.get("Content-Encoding") or "").lower()
            if enc == "gzip":
                raw = gzip.decompress(raw)
            elif enc == "deflate":
                raw = zlib.decompress(raw)
            return {"status": res.status, "text": raw.decode("utf-8", "replace"), "final": res.geturl(), "err": None}
    except urllib.error.HTTPError as e:
        kind = "unavailable" if e.code in (403, 429) else "http"
        return {"status": e.code, "text": "", "final": url, "err": kind}
    except Exception as e:  # noqa: BLE001  (timeout, DNS, TLS, reset)
        return {"status": None, "text": "", "final": url, "err": "unavailable", "detail": type(e).__name__}


def _parse_robots(text):
    """Rules of the `User-agent: *` group (our UA has no group of its own). Wildcards and $ supported."""
    rules, in_group, seen_rule = [], False, False
    for line in text.splitlines():
        line = line.split("#")[0].strip()
        if ":" not in line:
            continue
        key, val = (x.strip() for x in line.split(":", 1))
        key = key.lower()
        if key == "user-agent":
            if seen_rule:
                in_group, seen_rule = False, False
            in_group = in_group or val == "*"
        elif key in ("allow", "disallow"):
            seen_rule = True
            if in_group and val:
                rules.append((key == "allow", val))
    return rules


def _rule_regex(path):
    return re.compile("^" + re.escape(path).replace(r"\*", ".*").replace(r"\$", "$"))


def _allowed(rules, path_q):
    best_len, allowed = -1, True
    for allow, pat in rules:
        if _rule_regex(pat).match(path_q) and len(pat) > best_len - (0 if allow else 0):
            if len(pat) > best_len or (len(pat) == best_len and allow):
                best_len, allowed = len(pat), allow
    return allowed


def robots_ok(url):
    p = urllib.parse.urlparse(url)
    base = f"{p.scheme}://{p.netloc}"
    if base not in _robots:
        r = _raw_get(base + "/robots.txt")
        if r["err"] == "unavailable":
            _robots[base] = "unavailable"
        elif r["status"] == 200:
            _robots[base] = _parse_robots(r["text"])
        else:
            _robots[base] = []  # no robots.txt: everything allowed
    v = _robots[base]
    if v == "unavailable":
        return None
    path_q = (p.path or "/") + (("?" + p.query) if p.query else "")
    return _allowed(v, path_q)


def fetch(url):
    ok = robots_ok(url)
    if ok is None:
        return {"status": None, "text": "", "final": url, "err": "unavailable", "detail": "robots.txt unreachable/403"}
    if not ok:
        return {"status": None, "text": "", "final": url, "err": "robots", "detail": "disallowed by robots.txt"}
    return _raw_get(url)


# ------------------------------------------------------------------ helpers
def plain(body):
    t = re.sub(r"<script.*?</script>|<style.*?</style>", " ", body, flags=re.S)
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", t))).strip()


def snippet(text, needle, before=35, after=60):
    i = text.find(needle)
    if i < 0:
        return needle[:120]
    return text[max(0, i - before): i + len(needle) + after][:120]


def blank(v):
    return v is None or not str(v).strip()


def fr_phone(raw):
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("33"):
        return "+" + digits
    if digits.startswith("0") and len(digits) == 10:
        return "+33" + digits[1:]
    return None


FR_DAYS = {"lundi": "monday", "mardi": "tuesday", "mercredi": "wednesday", "jeudi": "thursday",
           "vendredi": "friday", "samedi": "saturday", "dimanche": "sunday"}
HOURS_WORDS = re.compile(r"(?i)working hours|opening hours|office hours|business hours|horaires|"
                         r"график работы|режим работы|часы работы|время работы|ساعات العمل|أوقات الدوام")


def source_of(r):
    s = (r["slug"] or "").lower()
    w = (r["website"] or "").lower()
    for p, label in [("crf-", "Croix-Rouge française"), ("srcs-", "Sudanese Red Crescent"),
                     ("rck-", "Red Crescent of Kazakhstan"), ("erc-", "Emirates Red Crescent"), ("rcb-", "Belarus Red Cross")]:
        if s.startswith(p):
            return label
    if "gomel" in w:
        return "Belarus Red Cross"
    if r["country"] == "Russia" or "nochlezhka" in s or "homeless.ru" in w:
        return "Nochlezhka"
    return "other"


# ------------------------------------------------------------------ main collection
proposals, unchecked = [], []


def propose(r, field, current, proposed, url, quote, conf):
    proposals.append([r["id"], r["slug"], r["name"], field, current or "", proposed, url, quote[:120], conf])


def skip(r, missing, status, reason):
    unchecked.append([r["id"], r["slug"], r["name"], source_of(r), "+".join(missing), status, reason])


def handle_crf(r, missing):
    page = fetch(r["website"])
    if page["err"]:
        return skip(r, missing, "unavailable" if page["err"] == "unavailable" else page["err"],
                    f"{page['err']}: {page.get('detail') or page['status']}")
    body, text, url = page["text"], plain(page["text"]), page["final"]
    got_any = False

    tel = re.search(r'"telephone":"([^"]+)"', body)
    local = fr_phone(tel.group(1)) if tel else None
    hotline_hit = re.search(r"0\s?1\s?44\s?43\s?13\s?00", text) or re.search(r"01 44 43 13 00", body)
    if "phone" in missing:
        if local and re.sub(r"\D", "", local[3:]).lstrip("0") != "144431300":
            propose(r, "phone", r["phone"], local, url, snippet(text, tel.group(1), 25, 20), "high")
            got_any = True
        elif hotline_hit:
            propose(r, "national_hotline", "", "+33144431300", url,
                    "Contactez-nous / Hotline 01 44 43 13 00 (national, not this branch)", "high")
            got_any = True

    hours_before = len(proposals)
    if "hours" in missing:
        i = body.find('"openingHoursSpecification":')
        spec = None
        if i >= 0:
            try:
                spec, _ = json.JSONDecoder().raw_decode(body[i + len('"openingHoursSpecification":'):])
            except ValueError:
                spec = None
        if i >= 0:
            if spec:
                per_day = defaultdict(list)
                for s in spec:
                    days = s.get("dayOfWeek") or []
                    days = days if isinstance(days, list) else [days]
                    for d in days:
                        key = FR_DAYS.get(str(d).strip().lower())
                        if key and s.get("opens") and s.get("closes"):
                            per_day[key].append((s["opens"][:5], s["closes"][:5]))
                original = "; ".join(f"{d} {o}-{c}" for s in spec for d in (s.get("dayOfWeek") or []) for o, c in [(s.get("opens", "")[:5], s.get("closes", "")[:5])])
                if per_day and all(len(v) == 1 for v in per_day.values()):
                    week = {d: {"open": v[0][0], "close": v[0][1]} for d, v in per_day.items()}
                    propose(r, "hours", r["hours"], json.dumps(week, ensure_ascii=False), url,
                            "openingHoursSpecification: " + original, "high")
                    got_any = True
                elif per_day:
                    propose(r, "hours", r["hours"], "UNCLEAR", url, "split shifts: " + original, "unclear")
                    got_any = True
    if "hours" in missing and len(proposals) == hours_before:
        skip(r, ["hours"], "checked: no data on page", "official page has no opening hours (no openingHoursSpecification)")
    if "phone" in missing and not any(p[0] == r["id"] and p[3] in ("phone", "national_hotline") for p in proposals):
        skip(r, ["phone"], "checked: no data on page", "official page has no local phone" + (" (only national hotline)" if hotline_hit else ""))


SRCS_CACHE, RCK_CACHE = {}, {}


def handle_hours_scan(r, missing, urls, label):
    """Official pages scanned for any opening-hours statement; if present it is reported as UNCLEAR with the text."""
    hit_pages = 0
    for u in urls:
        page = fetch(u)
        if page["err"]:
            return skip(r, missing, "unavailable" if page["err"] == "unavailable" else page["err"],
                        f"{u}: {page['err']} {page.get('detail') or page['status']}")
        hit_pages += 1
        text = plain(page["text"])
        m = HOURS_WORDS.search(text)
        if m and "hours" in missing:
            propose(r, "hours", r["hours"], "UNCLEAR", page["final"], snippet(text, m.group(0), 20, 90), "unclear")
            return
    skip(r, missing, "checked: no data on page", f"{label}: {hit_pages} official page(s) read, no opening hours stated")


def handle_gomel(r, missing):
    page = fetch(r["website"])
    if page["err"]:
        return skip(r, missing, "unavailable" if page["err"] == "unavailable" else page["err"], f"{page['err']} {page.get('detail') or page['status']}")
    text = plain(page["text"])
    m = re.search(r"Пн-Чт:\s*([\d.:]+)\s*-\s*([\d.:]+)\s*\|\s*Пт:\s*([\d.:]+)\s*-\s*([\d.:]+)(?:\s*Обед:\s*([\d.:]+)\s*-\s*([\d.:]+))?", text)
    norm = lambda t: (lambda h, mi: f"{int(h):02d}:{mi}")(*t.replace(".", ":").split(":"))
    if m and "hours" in missing:
        week = {d: {"open": norm(m.group(1)), "close": norm(m.group(2))} for d in ("monday", "tuesday", "wednesday", "thursday")}
        week["friday"] = {"open": norm(m.group(3)), "close": norm(m.group(4))}
        lunch = m.group(5)
        quote = m.group(0)
        # The app stores one interval per day, so a lunch break would be shown as open all day -> medium, not high.
        propose(r, "hours", r["hours"], json.dumps(week, ensure_ascii=False), page["final"], quote, "medium" if lunch else "high")
    else:
        skip(r, missing, "checked: no data on page", "no opening hours found on the official site")


def main():
    snap = json.loads((OUT / "orgs-snapshot.json").read_text(encoding="utf-8"))
    targets = [r for r in snap if blank(r["phone"]) or blank(r["hours"])]
    print(f"{len(snap)} records, {len(targets)} need phone and/or hours")

    # RCK: read every branch page once, then match each record to a page by its phone digits.
    rck_pages = {}
    if any(source_of(r) == "Red Crescent of Kazakhstan" for r in targets):
        idx = fetch("https://redcrescent.kz/ru/kontakty/golovnoj-filial")
        if not idx["err"]:
            links = {urllib.parse.urljoin(idx["final"], h) for h in re.findall(r'href="([^"#]*kontakty/[^"#]+)"', idx["text"])}
            for u in sorted(links):
                p = fetch(u)
                if not p["err"]:
                    rck_pages[u] = p
    for i, r in enumerate(targets, 1):
        missing = [f for f, v in (("phone", r["phone"]), ("hours", r["hours"])) if blank(v)]
        src = source_of(r)
        try:
            if src == "Croix-Rouge française":
                handle_crf(r, missing)
            elif src == "Sudanese Red Crescent":
                handle_hours_scan(r, missing, ["https://www.srcs.sd/en/contact", "https://www.srcs.sd/en/our-branches"], "srcs.sd")
            elif src == "Red Crescent of Kazakhstan":
                digits = re.sub(r"\D", "", r["phone"] or "")[-10:]
                page = next((p for p in rck_pages.values() if digits and digits in re.sub(r"\D", "", plain(p["text"]))), None)
                if not rck_pages:
                    skip(r, missing, "unavailable", "redcrescent.kz branch pages not reachable")
                elif not page:
                    skip(r, missing, "not matched", "no branch page contains this record's phone")
                else:
                    text = plain(page["text"])
                    m = HOURS_WORDS.search(text)
                    if m:
                        propose(r, "hours", r["hours"], "UNCLEAR", page["final"], snippet(text, m.group(0), 20, 90), "unclear")
                    else:
                        skip(r, missing, "checked: no data on page", f"{page['final']}: branch page lists address/phone/email, no opening hours")
            elif src == "Emirates Red Crescent":
                skip(r, missing, "not checked: JS-only site", "emiratesrc.ae is a JavaScript app; the served HTML has no contact data and a browser render was empty")
            elif src == "Belarus Red Cross":
                if "gomel" in (r["website"] or "").lower():
                    handle_gomel(r, missing)
                else:
                    page = fetch(r["website"])
                    skip(r, missing, "unavailable" if page["err"] == "unavailable" else (page["err"] or "checked"),
                         f"redcross.by: {page.get('detail') or page['status']}")
            elif src == "Nochlezhka":
                site = (r["website"] or "").strip()
                if site:
                    page = fetch(site)
                    if page["err"]:
                        skip(r, missing, "unavailable" if page["err"] == "unavailable" else page["err"],
                             f"{urllib.parse.urlparse(site).netloc}: {page.get('detail') or page['status']}")
                    else:
                        skip(r, missing, "reachable but not parsed", f"{site}: reachable, no per-point parser written")
                else:
                    skip(r, missing, "no official page", "no per-point website in the record; organization site homeless.ru is not reachable from this network")
        except Exception as e:  # noqa: BLE001
            skip(r, missing, "error", f"{type(e).__name__}: {e}")
        if i % 20 == 0:
            print(f"  ...{i}/{len(targets)}")

    with open(OUT / "contacts-proposal.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["id", "slug", "name", "field", "current", "proposed", "source_url", "quote", "confidence"])
        w.writerows(proposals)
    with open(OUT / "contacts-unchecked.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["id", "slug", "name", "source", "missing", "status", "reason"])
        w.writerows(unchecked)

    # summary per source
    by = defaultdict(lambda: Counter())
    by_src = {r["id"]: source_of(r) for r in snap}
    for p in proposals:
        by[by_src[int(p[0])]][f"{p[3]}:{p[8]}"] += 1
    for u in unchecked:
        by[u[3]][f"status:{u[5]}"] += 1
    for r in targets:
        by[source_of(r)]["targets"] += 1
    summary = {s: dict(c) for s, c in by.items()}
    (OUT / "contacts-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
