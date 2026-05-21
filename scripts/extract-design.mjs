import fs from "fs";

const html = fs.readFileSync("Help Nearby _standalone_ (2).html", "utf8");
const m = html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);
if (!m) {
  console.error("no template");
  process.exit(1);
}

const t = JSON.parse(m[1]);
const styleMatch = t.match(/<style>([\s\S]*?)<\/style>/);
if (styleMatch) {
  fs.writeFileSync("_extracted_design.css", styleMatch[1]);
  console.log("CSS bytes:", styleMatch[1].length);
}

const rootVars = [...styleMatch[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(
  (x) => `${x[1]}: ${x[2].trim()}`,
);
console.log("ROOT VARS:\n", rootVars.slice(0, 40).join("\n"));

const keyframes = [...styleMatch[1].matchAll(/@keyframes\s+([\w-]+)/g)].map(
  (x) => x[1],
);
console.log("KEYFRAMES:", keyframes.join(", "));

// Extract relevant CSS rules by selector keywords
const rules = styleMatch[1].split(/\n(?=[.#\[@a-z])/);
const keywords = [
  "header",
  "nav",
  "hero",
  "how",
  "cities",
  "footer",
  "lang",
  "btn",
  "card",
  "badge",
  "wave",
  "glass",
  "dropdown",
];
const picked = rules.filter((r) =>
  keywords.some((k) => r.toLowerCase().includes(k)),
);
fs.writeFileSync("_extracted_rules.css", picked.join("\n"));
console.log("Picked rules:", picked.length);

// HTML structure snippets
for (const id of ["header", "hero", "how", "cities", "footer"]) {
  const re = new RegExp(`<[^>]+(?:id|class)=\"[^\"]*${id}[^\"]*\"[^>]*>`, "i");
  const hit = t.match(re);
  if (hit) console.log(id.toUpperCase(), hit[0].slice(0, 120));
}
