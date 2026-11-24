#!/usr/bin/env python3
"""
Read-only data quality report for the HelpNearby catalog (Supabase `organizations`).

Only SELECTs through the public REST API with the anon key from .env.local (never printed),
plus plain GET requests to organization websites. Nothing is written anywhere.

Run:  python scripts/data-audit.py [--sample 30] [--seed 1] [--suspicious 20]
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
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_env():
    env = {}
    for line in (ROOT / ".env.local").read_text(encoding="utf-8").splitlines():
        m = re.match(r"\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$", line)
        if m:
            env[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    return env


def fetch_all(url, key):
    rows, start, page = [], 0, 1000
    while True:
        req = urllib.request.Request(
            f"{url}/rest/v1/organizations?select=*&order=id.asc",
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Range-Unit": "items",
                "Range": f"{start}-{start + page - 1}",
            },
        )
        with urllib.request.urlopen(req, timeout=30) as res:
            chunk = json.loads(res.read().decode("utf-8"))
        rows += chunk
        if len(chunk) < page:
            return rows
        start += page


# ---------------------------------------------------------------- classification
def source_of(row):
    """Catalog ids are numeric, so the source comes from the slug prefix / known seed names."""
    slug = (row.get("slug") or "").lower()
    website = (row.get("website") or "").lower()
    country = row.get("country") or ""
    for prefix, label in [
        ("rw-", "ReliefWeb (rw-)"),
        ("hdx-", "HDX (hdx-)"),
        ("gdho-", "GDHO (gdho-)"),
        ("osm-", "OSM (osm-)"),
        ("overpass-", "OSM (overpass-)"),
        ("crf-", "Croix-Rouge française (crf-)"),
        ("srcs-", "Sudanese Red Crescent (srcs-)"),
        ("rck-", "Kazakhstan Red Crescent (rck-)"),
        ("erc-", "Emirates Red Crescent (erc-)"),
        ("rcb-", "Belarus Red Cross (rcb-)"),
    ]:
        if slug.startswith(prefix):
            return label
    if "nochlezhka" in slug or "homeless.ru" in website or "nochelezhka" in website or country == "Russia":
        return "Nochlezhka / Russia"
    if "gomel" in website:
        return "Belarus Red Cross (Gomel)"
    return "manual / other"


def blank(value):
    return value is None or (isinstance(value, str) and not value.strip())


def exact_enough(lat, lng):
    """False for missing / zero coordinates and for coordinates rounded to <= 2 decimals."""
    try:
        lat, lng = float(lat), float(lng)
    except (TypeError, ValueError):
        return False
    if abs(lat) < 0.001 or abs(lng) < 0.001 or abs(lat) > 90 or abs(lng) > 180:
        return False

    def decimals(v):
        s = f"{v:.8f}".rstrip("0")
        return len(s.split(".")[1]) if "." in s else 0

    return decimals(lat) > 2 or decimals(lng) > 2


# ---------------------------------------------------------------- website checks
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def base_domain(host):
    host = (host or "").lower().split(":")[0]
    if host.startswith("www."):
        host = host[4:]
    parts = host.split(".")
    # good enough for this report (.co.uk-style suffixes are not special-cased)
    return ".".join(parts[-2:]) if len(parts) >= 2 else host


def check_site(url):
    """GET with a 10 s timeout, following up to 6 redirects. Returns (category, detail)."""
    target = url if re.match(r"^https?://", url, re.I) else "http://" + url
    origin = base_domain(urllib.parse.urlparse(target).netloc)
    opener = urllib.request.build_opener(NoRedirect)
    headers = {"User-Agent": "Mozilla/5.0 (compatible; HelpNearbyDataAudit/1.0)", "Accept": "text/html,*/*"}
    current = target
    for _ in range(7):
        try:
            res = opener.open(urllib.request.Request(current, headers=headers), timeout=10)
            code = res.status
            res.close()
        except urllib.error.HTTPError as e:
            code = e.code
            if code in (301, 302, 303, 307, 308):
                nxt = urllib.parse.urljoin(current, e.headers.get("Location", ""))
                if not nxt:
                    return "error", f"redirect without Location ({code})"
                current = nxt
                continue
            if code == 404 or code == 410:
                return "404", f"HTTP {code}"
            return "other-http", f"HTTP {code}"
        except (urllib.error.URLError, socket.timeout, TimeoutError, ConnectionError, OSError) as e:
            reason = getattr(e, "reason", e)
            return "error", f"{type(reason).__name__}: {str(reason)[:60]}"
        final = base_domain(urllib.parse.urlparse(current).netloc)
        if final != origin:
            return "redirect-foreign", f"{origin} -> {final}"
        return ("200" if code == 200 else "other-http"), f"HTTP {code}"
    return "error", "too many redirects"


# ---------------------------------------------------------------- report
def table(headers, rows):
    widths = [max(len(str(x)) for x in col) for col in zip(headers, *rows)]
    line = lambda r: " | ".join(str(c).ljust(w) for c, w in zip(r, widths))
    out = [line(headers), "-+-".join("-" * w for w in widths)]
    out += [line(r) for r in rows]
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sample", type=int, default=30)
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--suspicious", type=int, default=20)
    args = ap.parse_args()

    env = load_env()
    rows = fetch_all(env["NEXT_PUBLIC_SUPABASE_URL"], env["NEXT_PUBLIC_SUPABASE_ANON_KEY"])
    print(f"Fetched {len(rows)} rows from organizations (read-only).\n")

    # shared coordinates (several records on exactly the same point = city/country centroid)
    coord_groups = defaultdict(list)
    for r in rows:
        if r.get("lat") is not None and r.get("lng") is not None:
            coord_groups[(round(float(r["lat"]), 5), round(float(r["lng"]), 5))].append(r["id"])
    shared = {k for k, ids in coord_groups.items() if len(ids) >= 3}

    def approx(r):
        if not exact_enough(r.get("lat"), r.get("lng")):
            return True
        return (round(float(r["lat"]), 5), round(float(r["lng"]), 5)) in shared

    # 1. counts by source and status
    by_source = defaultdict(list)
    for r in rows:
        by_source[source_of(r)].append(r)

    print("1. Organizations by source and status")
    print(table(
        ["source", "total", "verified", "unverified"],
        [[s, len(rs), sum(1 for r in rs if r.get("verified")), sum(1 for r in rs if not r.get("verified"))]
         for s, rs in sorted(by_source.items(), key=lambda kv: -len(kv[1]))]
        + [["ALL", len(rows), sum(1 for r in rows if r.get("verified")), sum(1 for r in rows if not r.get("verified"))]],
    ))

    # 2. completeness
    print("\n2. Missing data per source (count of records)")
    comp = []
    for s, rs in sorted(by_source.items(), key=lambda kv: -len(kv[1])):
        comp.append([
            s, len(rs),
            sum(blank(r.get("phone")) for r in rs),
            sum(blank(r.get("website")) for r in rs),
            sum(blank(r.get("address")) for r in rs),
            sum(blank(r.get("hours")) for r in rs),
            sum(approx(r) for r in rs),
        ])
    totals = ["ALL"] + [sum(c[i] for c in comp) for i in range(1, 7)]
    print(table(["source", "total", "no phone", "no website", "no address", "no hours", "approx coords"], comp + [totals]))
    print("(approx coords = missing/zero, rounded to <=2 decimals, or one point shared by 3+ records)")

    # 3. website sample
    with_site = [r for r in rows if not blank(r.get("website"))]
    rng = random.Random(args.seed)
    sample = rng.sample(with_site, min(args.sample, len(with_site)))
    print(f"\n3. Website check: {len(sample)} random records of {len(with_site)} with a website (GET, 10 s timeout)")
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(lambda r: check_site(r["website"].strip()), sample))
    tally = Counter(cat for cat, _ in results)
    print(table(["result", "count"], [[k, tally.get(k, 0)] for k in ["200", "404", "redirect-foreign", "other-http", "error"]]))
    for r, (cat, detail) in zip(sample, results):
        if cat != "200":
            print(f"   - [{cat}] {r['slug']} | {r['website'].strip()[:60]} | {detail}")

    # 4. suspicious records
    dead = {r["id"]: (cat, detail) for r, (cat, detail) in zip(sample, results) if cat != "200"}
    scored = []
    for r in rows:
        reasons, score = [], 0
        if r["id"] in dead:
            cat, detail = dead[r["id"]]
            reasons.append(f"website {cat} ({detail})")
            score += 5
        no_phone, no_site, no_addr = blank(r.get("phone")), blank(r.get("website")), blank(r.get("address"))
        if no_phone and no_site:
            reasons.append("no phone and no website")
            score += 4
        if no_phone and no_site and no_addr and blank(r.get("email")):
            reasons.append("no contacts or address at all")
            score += 3
        if not r.get("verified"):
            reasons.append("unverified")
            score += 1
        if not exact_enough(r.get("lat"), r.get("lng")):
            reasons.append("no usable coordinates")
            score += 2
        if score >= 4:
            scored.append((score, r, reasons))
    scored.sort(key=lambda t: (-t[0], t[1]["id"]))
    print(f"\n4. Suspicious records ({min(args.suspicious, len(scored))} of {len(scored)} flagged; dead-site check covers only the sample)")
    print(table(
        ["id", "slug", "name", "why"],
        [[r["id"], r["slug"][:34], (r["name"] or "")[:44], "; ".join(reasons)[:90]]
         for _, r, reasons in scored[: args.suspicious]],
    ))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
