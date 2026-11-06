/**
 * Webpack loader (see next.config.mjs): removes Leaflet's default attribution prefix (the link to
 * the library's site and the inline SVG flag) from the bundled library code, so the shipped
 * JavaScript contains neither. Only those two strings are replaced; the copyright and license
 * notice at the top of the file and everything else in the library stay as they are.
 * The map shows only the tile attribution ("© OpenStreetMap contributors").
 *
 * It fails the build when a pattern is missing, so a Leaflet upgrade cannot silently bring the
 * default prefix back.
 */
const FLAG = /var (\w+) = '<svg[^\n]*leaflet-attribution-flag[^\n]*';/;
const PREFIX = /prefix: '<a href="https:\/\/leafletjs\.com"[^\n]*Leaflet<\/a>'/;

module.exports = function leafletPrefixLoader(source) {
  if (!FLAG.test(source) || !PREFIX.test(source)) {
    throw new Error(
      "leaflet-prefix-loader: the default attribution prefix was not found in this Leaflet build; update scripts/leaflet-prefix-loader.cjs",
    );
  }
  return source.replace(FLAG, "var $1 = '';").replace(PREFIX, "prefix: false");
};
