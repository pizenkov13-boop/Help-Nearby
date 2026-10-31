import { test, expect } from "./fixtures";
import { nearbyAreaKey, readNearbyCache, writeNearbyCache } from "@/lib/nearbyCache";
import { readOverpassClientCache, writeOverpassClientCache } from "@/lib/overpassClientCache";
import { MOCK_NEARBY_ORGS } from "./helpers";

const KEY = "help-nearby-orgs-cache";

class MemoryStorage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

const g = globalThis as unknown as { window?: unknown; localStorage?: unknown };
let storage: MemoryStorage;
let savedWindow: unknown;
let savedStorage: unknown;

test.beforeEach(() => {
  savedWindow = g.window;
  savedStorage = g.localStorage;
  storage = new MemoryStorage();
  g.window = {};
  g.localStorage = storage;
});

test.afterEach(() => {
  g.window = savedWindow;
  g.localStorage = savedStorage;
});

const payload = (lat: number, lng: number) => ({
  timestamp: Date.now(),
  lat,
  lng,
  liteMode: false,
  organizations: MOCK_NEARBY_ORGS.slice(0, 1),
  searchRadiusMeters: 5000,
  searchMode: "within" as const,
  canExpand: true,
  nearestFallbackKm: null,
});

test.describe("Nearby cache keeps an area, not the position", () => {
  test("the stored entry has a rounded area key and no exact coordinates", () => {
    writeNearbyCache(payload(40.712812, -74.006013));

    const raw = storage.getItem(KEY)!;
    const stored = JSON.parse(raw) as Record<string, unknown>;
    expect(stored).not.toHaveProperty("lat");
    expect(stored).not.toHaveProperty("lng");
    expect(raw).not.toContain("40.7128");
    expect(raw).not.toContain("74.0060");
    expect(stored.area).toBe(nearbyAreaKey(40.712812, -74.006013, false));
    expect(stored.area).toMatch(/^40\.7\d:-74\.0\d:full$/);
  });

  test("a position in the same area hits the cache, another area and the other mode miss it", () => {
    writeNearbyCache(payload(40.712812, -74.006013));

    expect(readNearbyCache(40.7131, -74.0049, false)).not.toBeNull(); // a few hundred metres away
    expect(readNearbyCache(40.9, -74.006, false)).toBeNull(); // ~20 km away
    expect(readNearbyCache(40.712812, -74.006013, true)).toBeNull(); // lite mode is a different entry
  });

  test("an expired entry is deleted, not just ignored", () => {
    writeNearbyCache({ ...payload(40.7128, -74.006), timestamp: Date.now() - 61 * 60 * 1000 });
    expect(storage.getItem(KEY)).not.toBeNull();

    expect(readNearbyCache(40.7128, -74.006, false)).toBeNull();
    expect(storage.getItem(KEY)).toBeNull();
  });

  test("an old entry that holds exact coordinates is deleted on the next read", () => {
    storage.setItem(
      KEY,
      JSON.stringify({ timestamp: Date.now(), lat: 40.712812, lng: -74.006013, liteMode: false, organizations: [] }),
    );

    expect(readNearbyCache(40.7128, -74.006, false)).toBeNull();
    expect(storage.getItem(KEY)).toBeNull();
  });

  test("expired Overpass entries (their keys hold a rounded area) are purged on the next write", () => {
    const stale = "help-nearby-overpass:overpass:1.000:2.000:5km";
    storage.setItem(stale, JSON.stringify({ timestamp: Date.now() - 2 * 60 * 60 * 1000, organizations: [] }));

    writeOverpassClientCache(40.7128, -74.006, 5000, MOCK_NEARBY_ORGS.slice(0, 1));

    expect(storage.getItem(stale)).toBeNull();
    expect(readOverpassClientCache(40.7128, -74.006, 5000)).not.toBeNull();
  });
});
