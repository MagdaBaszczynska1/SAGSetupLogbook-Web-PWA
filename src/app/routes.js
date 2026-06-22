export const ROUTES = Object.freeze([
  {
    id: "measurement",
    hash: "#/measurement",
    title: "Rower i zawieszenie",
    tabLabel: "Pomiar",
    icon: "ƒ(x)"
  },
  {
    id: "history",
    hash: "#/history",
    title: "Historia",
    tabLabel: "Historia",
    icon: "◷"
  },
  {
    id: "journal",
    hash: "#/journal",
    title: "Dziennik",
    tabLabel: "Dziennik",
    icon: "▤"
  },
  {
    id: "more",
    hash: "#/more",
    title: "Więcej",
    tabLabel: "Więcej",
    icon: "•••"
  }
]);

export const DEFAULT_ROUTE_ID = "measurement";

export function getRouteById(routeId) {
  return ROUTES.find(route => route.id === routeId) ?? null;
}

export function getRouteFromHash(hash) {
  return ROUTES.find(route => route.hash === hash) ?? getRouteById(DEFAULT_ROUTE_ID);
}
