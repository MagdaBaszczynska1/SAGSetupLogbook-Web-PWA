import { DEFAULT_ROUTE_ID, getRouteById, getRouteFromHash } from "./routes.js";

export function createRouter({ onRouteChange }) {
  if (typeof onRouteChange !== "function") {
    throw new TypeError("Router wymaga funkcji onRouteChange.");
  }

  function notify() {
    const route = getRouteFromHash(window.location.hash);
    onRouteChange(route);
  }

  function navigate(routeId) {
    const route = getRouteById(routeId) ?? getRouteById(DEFAULT_ROUTE_ID);
    if (window.location.hash === route.hash) {
      notify();
      return;
    }
    window.location.hash = route.hash;
  }

  function start() {
    window.addEventListener("hashchange", notify);
    if (!getRouteFromHash(window.location.hash) || !window.location.hash) {
      navigate(DEFAULT_ROUTE_ID);
      return;
    }
    notify();
  }

  function stop() {
    window.removeEventListener("hashchange", notify);
  }

  return Object.freeze({ navigate, start, stop });
}
