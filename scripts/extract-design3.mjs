import fs from "fs";

const html = fs.readFileSync("Help Nearby _standalone_ (2).html", "utf8");
const m = html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);
const t = JSON.parse(m[1]);

const styles = [...t.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((x) => x[1]);
console.log("style blocks", styles.length, styles.map((s) => s.length));

const main = styles.find((s) => s.includes(".header")) || styles[styles.length - 1];
fs.writeFileSync("_extracted_main.css", main);
console.log("main css len", main.length);

// print :root and first 200 lines of component css
const lines = main.split("\n");
const rootStart = lines.findIndex((l) => l.includes(":root"));
console.log("from :root", lines.slice(rootStart, rootStart + 120).join("\n"));
