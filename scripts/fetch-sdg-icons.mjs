import fs from "node:fs";
import path from "node:path";

const goals = [1, 2, 3, 10];
const base = "https://sdgs.un.org/sites/default/files/goals/";
const outDir = path.join(process.cwd(), "public", "images", "sdg");

fs.mkdirSync(outDir, { recursive: true });

for (const n of goals) {
  const url = `${base}goal-${n}.png`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Failed ${url}: ${res.status}`);
    process.exitCode = 1;
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const file = path.join(outDir, `sdg-${n}.png`);
  fs.writeFileSync(file, buf);
  console.log(`Saved ${file} (${buf.length} bytes)`);
}

console.log("Done.");
