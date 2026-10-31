import { devices } from "@playwright/test";
import { test } from "./fixtures";
import { registerGeolocationScenarios } from "./geolocation-scenarios";

// Android Chrome on a Pixel (chromium project). The iPhone / WebKit run is mobile-geolocation.webkit.spec.ts.
const { defaultBrowserType: _browserType, ...pixel } = devices["Pixel 7"];
test.use(pixel);

registerGeolocationScenarios("pixel-chromium");
