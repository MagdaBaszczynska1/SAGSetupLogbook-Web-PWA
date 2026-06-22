import { createElement, replaceChildren } from "../../utils/dom.js";
import { createBottomNavigation } from "../navigation/bottom-navigation.js";

export function createAppShell({ routes, onNavigate }) {
  const title = createElement("h1", {
    className: "app-header__title",
    text: "SAG Setup Logbook"
  });

  const header = createElement("header", {
    className: "app-header",
    children: [
      createElement("div", { className: "app-header__spacer", attributes: { "aria-hidden": "true" } }),
      title,
      createElement("div", { className: "app-header__spacer", attributes: { "aria-hidden": "true" } })
    ]
  });

  const content = createElement("main", {
    className: "app-content",
    attributes: { id: "main-content", tabindex: "-1" }
  });

  const navigation = createBottomNavigation(routes, onNavigate);

  const element = createElement("div", {
    className: "app-shell",
    children: [header, content, navigation.element]
  });

  function renderRoute(route, view) {
    title.textContent = route.title;
    document.title = `${route.tabLabel} — SAG Setup Logbook`;
    navigation.setActive(route.id);
    replaceChildren(content, [view]);
    view.dispatchEvent(new CustomEvent("app:route-active", { detail: { routeId: route.id } }));
    content.focus({ preventScroll: true });
  }

  return Object.freeze({ element, renderRoute });
}
