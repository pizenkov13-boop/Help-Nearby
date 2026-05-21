import fs from "fs";

let main = fs.readFileSync("_extracted_main.css", "utf8").trim();
main = main.replace(
  /background-image:\s*url\("[^"]+"\)/,
  'background-image: url("/images/hero.jpg")',
);
const leaflet = fs.readFileSync("app/globals.css", "utf8");
const leafletBlock = leaflet.includes("/* Leaflet")
  ? leaflet.slice(leaflet.indexOf("/* Leaflet"))
  : "";

const mapPanel = `
/* Map accordion panel */
.map-panel {
  background: var(--surface-card);
  border-top: 1px solid var(--border-softer);
  padding: 40px 28px;
}
.map-panel .container { max-width: var(--max); margin: 0 auto; }
.map-panel h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 1.5rem;
}
.map-panel .map-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid var(--border-soft);
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}
.map-panel .map-badge.emerald {
  color: #6ee7b7;
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.1);
}
.map-panel .map-badge.amber {
  color: #fcd34d;
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.1);
}
.map-panel .map-badge.blue {
  color: #93c5fd;
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(59, 130, 246, 0.1);
}

/* Inner pages */
.hero.page-hero { min-height: 52vh; }
.hero.page-hero .hero-inner { padding: 120px 28px 100px; }
.hero.page-hero h1 {
  font-size: clamp(36px, 5vw, 56px);
  line-height: 1.05;
}
.page-section {
  padding: 96px 28px;
  background: var(--surface);
}
.page-section.alt {
  background: var(--surface-card);
  border-top: 1px solid var(--border-softer);
}
.page-section .container { max-width: var(--max); margin: 0 auto; }
.page-section .prose-center {
  max-width: 42rem;
  margin: 0 auto;
  text-align: center;
  color: var(--text-dim);
  font-size: 1.125rem;
  line-height: 1.65;
}
.page-card-grid {
  display: grid;
  gap: 1.5rem;
}
.page-card-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
.page-card-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
@media (max-width: 820px) {
  .page-card-grid.cols-2,
  .page-card-grid.cols-3 { grid-template-columns: 1fr; }
}
.page-card {
  background: var(--surface-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  padding: 1.5rem;
}
.page-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #fff;
}
.page-card p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-dim);
  line-height: 1.55;
}
.reviews-form-card {
  background: var(--surface-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 2rem;
}
.reviews-form-card label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
}
.reviews-form-card input,
.reviews-form-card textarea {
  width: 100%;
  border-radius: var(--radius);
  border: 1px solid var(--border-soft);
  background: var(--surface);
  color: var(--text);
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
}
.reviews-form-card input:focus,
.reviews-form-card textarea:focus {
  outline: none;
  border-color: var(--brand-blue);
  box-shadow: 0 0 0 1px var(--brand-blue);
}
`;

const fontPatch = `
  :root {
    --font-serif: var(--font-newsreader), "Newsreader", Georgia, serif;
  }
`;

const out = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
${main.replace(/^/gm, "  ")}
${fontPatch}
}

@layer components {
${mapPanel}
}

${leafletBlock}
`;

fs.writeFileSync("app/globals.css", out);
console.log("globals.css written", out.length);
