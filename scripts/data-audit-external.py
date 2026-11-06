#!/usr/bin/env python3
"""
Read-only audit of the external sources behind HelpNearby search (not Supabase):
OSM/Overpass (/api/nearby) and ReliefWeb / HDX / GDHO (/api/verified-nearby, stage=directory).

Needs the app running (npm run dev) at --base. Only GET/POST-for-reading requests are made:
the app's own read endpoints, one raw Overpass query per city (for OSM tags) and plain GETs
to organization websites. Nothing is written anywhere and no secrets are used.

Run:  python scripts/data-audit-external.py [--base http://localhost:3000] [--seed 1]
"""
import argparse
import json
import random
import re
import socket
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor

CITIES = [
    ("Nice, France", 43.7102, 7.2620, "France", "FR"),
    ("Paris", 48.8566, 2.3522, "France", "FR"),
    ("Nairobi", -1.2921, 36.8219, "Kenya", "KE"),
    ("Warsaw", 52.2297, 21.0122, "Poland", "PL"),
]
TIERS = [5_000, 15_000, 40_000]  # same progressive radii as the home page (standard mode)
MIN_RESULTS = 3
OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
UA = "Mozilla/5.0 (compatible; HelpNearbyDataAudit/1.0)"
SOURCES = {"overpass-": "OSM", "rw-": "ReliefWeb", "hdx-": "HDX", "gdho-": "GDHO"}


def source_of(org):
    for prefix, label in SOURCES.items():
        if str(org.get("id", "")).startswith(prefix):
            return label
    return "other"


def get_json(url, timeout=40):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return json.loads(res.read().decode("utf-8"))


def blank(v):
    return v is None or (isinstance(v, str) and not v.strip())


def has_hours(org):
    return not blank(org.get("hoursRaw")) or bool(org.get("hours"))


def norm_name(name):
    return re.sub(r"[^a-z0-9Ѐ-ӿ]+", " ", (name or "").lower()).strip()


# ------------------------------------------------------------------ collection
def collect(base, city):
    label, lat, lng, country, code = city
    result = {"OSM": [], "ReliefWeb": [], "HDX": [], "GDHO": []}
    radius_used = TIERS[0]
    for radius in TIERS:
        radius_used = radius
        try:
            orgs = get_json(f"{base}/api/nearby?lat={lat}&lng={lng}&radius={radius}", 45)
        except Exception as e:  # noqa: BLE001
            print(f"   ! OSM {label} r={radius}: {type(e).__name__}")
            orgs = []
        result["OSM"] = orgs if isinstance(orgs, list) else []
        if len(result["OSM"]) >= MIN_RESULTS:
            break
    try:
        q = urllib.parse.urlencode({"country": country, "countryCode": code, "stage": "directory"})
        ocha = get_json(f"{base}/api/verified-nearby?{q}", 40)
        for org in ocha if isinstance(ocha, list) else []:
            s = source_of(org)
            if s in result:
                result[s].append(org)
    except Exception as e:  # noqa: BLE001
        print(f"   ! OCHA {label}: {type(e).__name__}")
    return radius_used, result


def raw_overpass_tags(lat, lng, radius):
    """Same selectors as lib/overpass.server.ts (buildOverpassQuery); returns {(type,id): tags}."""
    around = f"(around:{radius},{lat},{lng})"
    sel = ['"amenity"="food_bank"', '"amenity"="shelter"', '"amenity"="clinic"', '"amenity"="hospital"',
           '"amenity"="pharmacy"', '"social_facility"="food_bank"', '"social_facility"="shelter"', '"charity"="yes"']
    query = "[out:json][timeout:25];(" + "".join(f"nwr[{s}]{around};" for s in sel) + ");out center tags;"
    body = ("data=" + urllib.parse.quote(query)).encode()
    for url in OVERPASS_MIRRORS:
        try:
            req = urllib.request.Request(url, data=body, headers={
                "User-Agent": "HelpNearby/1.0 (data audit)", "Content-Type": "application/x-www-form-urlencoded"})
            with urllib.request.urlopen(req, timeout=40) as res:
                data = json.loads(res.read().decode("utf-8"))
            return {(e["type"], e["id"]): e.get("tags", {}) for e in data.get("elements", [])}
        except Exception:  # noqa: BLE001
            continue
    return {}


CLOSED_KEY = re.compile(r"^(disused|abandoned|was|removed|demolished|razed|former|not|closed|lifecycle)[:_]", re.I)
CLOSED_NOTE = re.compile(r"closed|permanently|disused|abandoned|no longer|ferm[ée]|закрыт", re.I)


def closed_signals(tags, name=""):
    found = []
    for k, v in tags.items():
        if CLOSED_KEY.match(k):
            found.append(f"{k}={v}")
        elif k in ("disused", "abandoned", "closed") and v.lower() not in ("no", ""):
            found.append(f"{k}={v}")
        elif k == "opening_hours" and v.strip().lower() in ("off", "closed"):
            found.append("opening_hours=off")
        elif k == "end_date":
            found.append(f"end_date={v}")
        elif k in ("note", "fixme", "description", "check_date:opening_hours") and CLOSED_NOTE.search(v):
            found.append(f"{k}~'{v[:40]}'")
    if CLOSED_NOTE.search(name or ""):
        found.append(f"name~'{name[:40]}'")
    return found


def osm_key(org):
    m = re.match(r"overpass-(node|way|relation)-(\d+)$", org.get("id", ""))
    return (m.group(1), int(m.group(2))) if m else None


# ------------------------------------------------------------------ website checks
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


def check_site(url):
    """GET (10 s). Returns (verdict, detail); verdict in 200 | dead | unknown | other."""
    target = url if re.match(r"^https?://", url, re.I) else "http://" + url
    opener = urllib.request.build_opener(NoRedirect)
    cur = target
    for _ in range(7):
        try:
            res = opener.open(urllib.request.Request(cur, headers={"User-Agent": UA, "Accept": "text/html,*/*"}), timeout=10)
            code = res.status
            res.close()
            return ("200", f"HTTP {code}") if code == 200 else ("other", f"HTTP {code}")
        except urllib.error.HTTPError as e:
            if e.code in (301, 302, 303, 307, 308):
                nxt = urllib.parse.urljoin(cur, e.headers.get("Location", ""))
                if not nxt:
                    return "unknown", "redirect without Location"
                cur = nxt
                continue
            if e.code in (404, 410):
                return "dead", f"HTTP {e.code}"
            if e.code == 403:
                return "unknown", "HTTP 403 (may be blocking this network/bot)"
            return "other", f"HTTP {e.code}"
        except urllib.error.URLError as e:
            reason = e.reason
            if isinstance(reason, socket.gaierror):
                return "dead", "DNS does not resolve"
            if isinstance(reason, (socket.timeout, TimeoutError)) or "timed out" in str(reason):
                return "unknown", "timeout"
            return "unknown", f"network error: {type(reason).__name__}"
        except (socket.timeout, TimeoutError):
            return "unknown", "timeout"
        except Exception as e:  # noqa: BLE001
            return "unknown", f"error: {type(e).__name__}"
    return "unknown", "too many redirects"


def table(headers, rows):
    widths = [max(len(str(x)) for x in col) for col in zip(headers, *rows)]
    line = lambda r: " | ".join(str(c).ljust(w) for c, w in zip(r, widths))
    return "\n".join([line(headers), "-+-".join("-" * w for w in widths)] + [line(r) for r in rows])


# ------------------------------------------------------------------ main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3000")
    ap.add_argument("--seed", type=int, default=None)
    args = ap.parse_args()
    rng = random.Random(args.seed)

    per_source = defaultdict(list)  # source -> [(city, org)]
    raw_tags = {}
    print("1. Queries (like the home page: OSM by progressive radius, OCHA directory by country)")
    for city in CITIES:
        radius, result = collect(args.base.rstrip("/"), city)
        print(f"   {city[0]:<14} OSM r={radius // 1000} km: {len(result['OSM'])} | "
              f"ReliefWeb {len(result['ReliefWeb'])} | HDX {len(result['HDX'])} | GDHO {len(result['GDHO'])}")
        for s, orgs in result.items():
            for org in orgs:
                per_source[s].append((city[0], org))
        if result["OSM"]:
            raw_tags.update(raw_overpass_tags(city[1], city[2], radius))

    # 2. completeness / approximate / duplicates
    print("\n2. Quality per source (pooled over the 4 queries)")
    rows, dups_detail = [], {}
    for s in ["OSM", "ReliefWeb", "HDX", "GDHO"]:
        items = per_source.get(s, [])
        by_city_names = defaultdict(Counter)
        for city, org in items:
            by_city_names[city][norm_name(org.get("name"))] += 1
        dup_records = sum(c - 1 for names in by_city_names.values() for c in names.values() if c > 1)
        dups_detail[s] = {(city, n) for city, names in by_city_names.items() for n, c in names.items() if c > 1}
        approx = sum(1 for _, o in items if s != "OSM")  # OCHA = country-level by design (isApproximateLocation)
        rows.append([s, len(items), sum(blank(o.get("phone")) for _, o in items),
                     sum(blank(o.get("website")) for _, o in items), sum(blank(o.get("address")) for _, o in items),
                     sum(not has_hours(o) for _, o in items), approx, dup_records])
    print(table(["source", "records", "no phone", "no website", "no address", "no hours", "approx coords", "duplicates"], rows))
    print("(approx coords: every ReliefWeb/HDX/GDHO entry is country-level by design in this app; OSM points are exact."
          " duplicates = extra records sharing a normalized name within one city query)")

    # 3. website sample
    print("\n3. Website GET check, up to 15 random records per source (10 s timeout)")
    checked = {}  # (source, id) -> (verdict, detail)
    sum_rows = []
    for s in ["OSM", "ReliefWeb", "HDX", "GDHO"]:
        with_site = [(c, o) for c, o in per_source.get(s, []) if not blank(o.get("website"))]
        sample = rng.sample(with_site, min(15, len(with_site)))
        with ThreadPoolExecutor(max_workers=8) as pool:
            res = list(pool.map(lambda co: check_site(co[1]["website"].strip()), sample))
        for (c, o), r in zip(sample, res):
            checked[(s, o["id"])] = r
        tally = Counter()
        for v, d in res:
            tally["403" if "403" in d else v] += 1
        n = len(sample) or 1
        pct = lambda k: f"{tally.get(k, 0)} ({round(100 * tally.get(k, 0) / n)}%)"
        sum_rows.append([s, f"{len(sample)}/{len(with_site)}", pct("200"), pct("dead"), pct("403"), pct("unknown"), pct("other")])
    print(table(["source", "checked/with site", "200", "DEAD (404/410/DNS)", "403 (unknown)", "unknown (timeout/net)", "other HTTP"], sum_rows))
    print("DEAD = 404/410 or DNS does not resolve. 403/timeout/network error are NOT dead: may be this network.")
    for (s, oid), (v, d) in checked.items():
        if v == "dead":
            site = next(o for _, o in per_source[s] if o["id"] == oid)
            print(f"   dead: [{s}] {site['name'][:40]} | {site['website'][:60]} | {d}")

    # 4. OSM sample with closure signals
    print("\n4. 10 random OSM points: name | category | address | closed-signals")
    osm = per_source.get("OSM", [])
    for city, o in rng.sample(osm, min(10, len(osm))):
        tags = raw_tags.get(osm_key(o), None)
        sig = "tags unavailable (Overpass raw query failed)" if tags is None else (", ".join(closed_signals(tags, o["name"])) or "no signs")
        print(f"   [{city}] {o['name'][:40]} | {o['category']} ({o.get('osmKind', '')}) | {o.get('address') or '—'} | {sig}")
    flagged = [(c, o) for c, o in osm if osm_key(o) in raw_tags and closed_signals(raw_tags[osm_key(o)], o["name"])]
    print(f"   all OSM results with closure signals: {len(flagged)} of {len(osm)}")

    # 5. suspicious
    scored = []
    for s in ["OSM", "ReliefWeb", "HDX", "GDHO"]:
        for city, o in per_source.get(s, []):
            reasons, score = [], 0
            verdict = checked.get((s, o["id"]))
            if verdict and verdict[0] == "dead":
                reasons.append(f"website dead ({verdict[1]})"); score += 6
            if s == "OSM" and osm_key(o) in raw_tags:
                sig = closed_signals(raw_tags[osm_key(o)], o["name"])
                if sig:
                    reasons.append("closed signs: " + ", ".join(sig[:2])); score += 6
            if (city, norm_name(o.get("name"))) in dups_detail[s]:
                reasons.append("duplicate name"); score += 2
            if blank(o.get("phone")) and blank(o.get("website")) and blank(o.get("email")):
                reasons.append("no phone/website/email"); score += 3
            if blank(o.get("address")):
                reasons.append("no address"); score += 1
            if s != "OSM":
                reasons.append("country-level location only"); score += 1
            if len((o.get("name") or "").strip()) < 4:
                reasons.append("very short name"); score += 2
            if verdict and verdict[0] in ("unknown", "other"):
                reasons.append(f"site unverified ({verdict[1]})"); score += 1
            if score >= 5:
                scored.append((score, s, city, o, reasons))
    scored.sort(key=lambda t: (-t[0], t[1], t[3]["name"]))
    print(f"\n5. Most suspicious records (top 15 of {len(scored)} flagged)")
    print(table(["score", "source", "city", "name", "why"],
                [[sc, s, c, (o["name"] or "")[:36], "; ".join(r)[:100]] for sc, s, c, o, r in scored[:15]]))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
