import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

// jsdom does not implement matchMedia; some libs need it
if (typeof window !== "undefined" && !window.matchMedia) {
  // @ts-expect-error - shim
  window.matchMedia = () => ({
    matches: false, addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  });
}

// Stub localStorage in jsdom (already exists, but reset between tests)
beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});
