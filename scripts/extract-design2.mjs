import fs from "fs";

const html = fs.readFileSync("Help Nearby _standalone_ (2).html", "utf8");
const m = html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);
const t = JSON.parse(m[1]);

// strip base64 blobs for readability
const clean = t.replace(/blob:[^\s"']+/g, "BLOB").replace(/[A-Za-z0-9+/]{500,}/g, "BASE64");

// extract body inner structure (first 15000 chars after <body)
const bodyIdx = clean.indexOf("<body");
const body = clean.slice(bodyIdx, bodyIdx + 25000);
fs.writeFileSync("_extracted_body.html", body);

// all class names
const classes = new Set();
for (const match of clean.matchAll(/class(?:Name)?="([^"]+)"/g)) {
  match[1].split(/\s+/).forEach((c) => classes.add(c));
}
fs.writeFileSync("_extracted_classes.txt", [...classes].sort().join("\n"));
console.log("classes", classes.size);
