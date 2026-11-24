#!/usr/bin/env python3
"""
Stage 2: apply APPROVED contact proposals (CRF phones + CRF high-confidence hours) in ONE statement.
PostgREST has no multi-row UPDATE with different values, so this sends a single upsert
(INSERT ... ON CONFLICT (id) DO UPDATE) with the full current rows -> one atomic transaction.
Only `phone` and `hours` differ from the current row. Service key comes from .env.local and is never printed.
"""
import csv
import hashlib
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "scripts" / "out"

env = {}
for line in (ROOT / ".env.local").read_text(encoding="utf-8").splitlines():
    m = re.match(r"\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$", line)
    if m:
        env[m.group(1)] = m.group(2).strip().strip('"').strip("'")
BASE = env["NEXT_PUBLIC_SUPABASE_URL"] + "/rest/v1/organizations"
ANON, SVC = env["NEXT_PUBLIC_SUPABASE_ANON_KEY"], env["SUPABASE_SERVICE_ROLE_KEY"]


def select_all():
    rows, start = [], 0
    while True:
        req = urllib.request.Request(BASE + "?select=*&order=id.asc", headers={
            "apikey": ANON, "Authorization": f"Bearer {ANON}", "Range-Unit": "items", "Range": f"{start}-{start + 999}"})
        chunk = json.loads(urllib.request.urlopen(req, timeout=30).read())
        rows += chunk
        if len(chunk) < 1000:
            return rows
        start += 1000


def digest(rows):
    return hashlib.sha256(json.dumps(sorted(rows, key=lambda r: r["id"]), sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]


blank = lambda v: v is None or not str(v).strip()

# approved: phone (high) and hours (high) of Croix-Rouge française only
proposals = list(csv.DictReader(open(OUT / "contacts-proposal.csv", encoding="utf-8-sig")))
phones = {int(p["id"]): p["proposed"] for p in proposals if p["field"] == "phone" and p["confidence"] == "high" and p["slug"].startswith("crf-")}
hours = {int(p["id"]): p["proposed"] for p in proposals if p["field"] == "hours" and p["confidence"] == "high" and p["slug"].startswith("crf-")}
for v in hours.values():
    assert isinstance(json.loads(v), dict) and v.lstrip().startswith("{")
ids = sorted(set(phones) | set(hours))
print(f"approved: {len(phones)} phones, {len(hours)} hours, {len(ids)} records")

before = select_all()
by_id = {r["id"]: r for r in before}
assert all(i in by_id for i in ids), "unknown id in proposals"
for i in phones:
    assert blank(by_id[i]["phone"]), f"phone of {i} is no longer empty - aborting"
for i in hours:
    assert blank(by_id[i]["hours"]), f"hours of {i} is no longer empty - aborting"

# rollback first
rollback = [{"id": i, "old_phone": by_id[i]["phone"], "old_hours": by_id[i]["hours"],
             "set_phone": phones.get(i), "set_hours": hours.get(i)} for i in ids]
(OUT / "contacts-rollback.json").write_text(json.dumps(rollback, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"rollback saved: scripts/out/contacts-rollback.json ({len(rollback)} records)")

payload = []
for i in ids:
    row = dict(by_id[i])
    if i in phones:
        row["phone"] = phones[i]
    if i in hours:
        row["hours"] = hours[i]
    payload.append(row)

others_before = [r for r in before if r["id"] not in ids]
req = urllib.request.Request(
    BASE + "?on_conflict=id", method="POST", data=json.dumps(payload).encode(),
    headers={"apikey": SVC, "Authorization": f"Bearer {SVC}", "Content-Type": "application/json",
             "Prefer": "resolution=merge-duplicates,return=minimal"})
try:
    urllib.request.urlopen(req, timeout=60).read()
except urllib.error.HTTPError as e:
    print("WRITE FAILED (nothing applied, single statement):", e.code, e.read().decode()[:300])
    sys.exit(1)

after = select_all()
a_by = {r["id"]: r for r in after}
others_after = [r for r in after if r["id"] not in ids]
print(f"rows before/after: {len(before)}/{len(after)}")
print("untouched records identical (all columns):", digest(others_before) == digest(others_after), digest(others_before))
bad = []
for i in ids:
    old, new = by_id[i], a_by[i]
    changed = {k for k in old if old[k] != new.get(k)}
    expect = ({"phone"} if i in phones else set()) | ({"hours"} if i in hours else set())
    if changed != expect:
        bad.append((i, sorted(changed)))
print("target records changed ONLY in expected fields:", not bad, bad[:3])
print("phones set:", sum(1 for i in phones if a_by[i]["phone"] == phones[i]), "/", len(phones),
      "| hours set:", sum(1 for i in hours if a_by[i]["hours"] == hours[i]), "/", len(hours))
