import { registerGeolocationScenarios } from "./geolocation-scenarios";

// Runs on the WebKit iPhone 14 project (see playwright.config.ts): the iOS Safari engine.
registerGeolocationScenarios("iphone-webkit");
